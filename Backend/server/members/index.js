/**
 * Community Member Roster Directory Management Endpoint
 *
 * What it Does: Simple non IT Terms
 * Manages the youth membership records in an Area, allowing leaders to register new members,
 * look up contact information, update statuses (Active, Inactive, Moved), and assign services.
 */

import {
  requireAuthenticatedProfile,
  isAreaAdminRole,
  isChapterServantRole,
  isDomainModeratorRole,
  isLeaderRole
} from '../_lib/access.js';
import {
  sendJson,
  methodNotAllowed,
  normalizeEmail,
  isValidEmail,
  apiError
} from '../_lib/http.js';
import {
  ensureRoleServiceAssignment,
  ensureStandardServices,
  normalizeServiceName,
  isLitService
} from '../_lib/service-catalog.js';
import { requireArea } from '../_lib/cloud-data.js';

const ACCESS_LEVELS = new Set([
  'national_coordinator',
  'couple_coordinator',
  'area_servant',
  'lit_servant',
  'campus_servant',
  'mfc_high_servant',
  'area_kids_servant',
  'chapter_servant',
  'member'
]);

function cleanText(value, max = 255) {
  return String(value || '').trim().slice(0, max);
}

async function loadAreaMember(admin, memberId, areaId) {
  if (!memberId || !areaId) return null;
  const { data, error } = await admin
    .from('members')
    .select('*')
    .eq('id', memberId)
    .eq('area_id', areaId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function validateChapter(admin, chapterId, areaId) {
  if (!chapterId) return null;
  const { data: chapter, error } = await admin
    .from('chapters')
    .select('id, area_id')
    .eq('id', chapterId)
    .maybeSingle();
  if (error) throw error;
  if (!chapter || String(chapter.area_id) !== String(areaId)) {
    const invalid = new Error('The selected chapter does not belong to your Area.');
    invalid.statusCode = 400;
    throw invalid;
  }
  return chapter;
}

async function listMembers(req, res) {
  const { admin, profile } = await requireAuthenticatedProfile(req);

  let query = admin
    .from('members')
    .select('id, area_id, chapter_id, first_name, middle_name, last_name, birth_date, contact_number, email, address, status, first_attended_youth_camp, access_level, academic_track, grade_level, school, avatar_url, created_at, updated_at')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  const areaId = requireArea(req, profile);
  const role = String(profile.role || '').trim().toLowerCase();

  if (isAreaAdminRole(role)) {
    query = query.eq('area_id', areaId);
  } else if (role === 'campus_servant') {
    query = query.eq('area_id', areaId).in('academic_track', ['College', 'Senior High School']);
  } else if (role === 'mfc_high_servant') {
    query = query.eq('area_id', areaId).eq('academic_track', 'High School');
  } else if (role === 'area_kids_servant') {
    query = query.eq('area_id', areaId).in('academic_track', ['Heartchamp', 'Heartchamps']);
  } else if (role === 'lit_servant') {
    const { data: litServices } = await admin
      .from('services')
      .select('id, name')
      .eq('area_id', areaId)
      .eq('is_active', true);

    const creativeServiceIds = (litServices || [])
      .filter((s) => isLitService(s.name))
      .map((s) => s.id);

    const litMemberIds = new Set();
    if (creativeServiceIds.length > 0) {
      const { data: memberServiceRows } = await admin
        .from('member_services')
        .select('member_id')
        .in('service_id', creativeServiceIds);
      for (const row of (memberServiceRows || [])) {
        if (row.member_id) litMemberIds.add(String(row.member_id));
      }
    }
    if (profile.member_id) {
      litMemberIds.add(String(profile.member_id));
    }

    if (litMemberIds.size > 0) {
      query = query.eq('area_id', areaId).in('id', Array.from(litMemberIds));
    } else {
      query = profile.member_id
        ? query.eq('id', profile.member_id)
        : query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  } else if (isChapterServantRole(role)) {
    query = profile.chapter_id
      ? query.eq('chapter_id', profile.chapter_id)
      : query.eq('id', profile.member_id || '00000000-0000-0000-0000-000000000000');
  } else {
    query = query.eq('id', profile.member_id || '00000000-0000-0000-0000-000000000000');
  }

  const { data, error } = await query;
  if (error) throw error;

  const memberIds = (data || []).map((m) => m.id);
  const memberServicesMap = new Map();
  if (memberIds.length > 0) {
    const { data: msRows } = await admin
      .from('member_services')
      .select('member_id, service_id')
      .in('member_id', memberIds);
    if (msRows && msRows.length > 0) {
      const serviceIds = [...new Set(msRows.map((r) => r.service_id))];
      const { data: sRows } = await admin
        .from('services')
        .select('id, name')
        .in('id', serviceIds);
      const serviceNameById = new Map((sRows || []).map((s) => [s.id, s.name]));
      for (const ms of msRows) {
        const name = serviceNameById.get(ms.service_id);
        if (name) {
          if (!memberServicesMap.has(ms.member_id)) {
            memberServicesMap.set(ms.member_id, []);
          }
          memberServicesMap.get(ms.member_id).push(name);
        }
      }
    }
  }

  const formatted = (data || []).map((m) => {
    const assigned = memberServicesMap.get(m.id) || [];
    return {
      ...m,
      contact: m.contact_number || null,
      service: assigned[0] || null,
      assigned_services: assigned
    };
  });

  return sendJson(res, 200, { ok: true, members: formatted, data: formatted });
}

async function createMember(req, res) {
  const { admin, profile, user } = await requireAuthenticatedProfile(req);
  if (!isLeaderRole(profile.role)) {
    return sendJson(res, 403, { ok: false, error: 'You do not have permission to add members.' });
  }

  const input = req.body || {};
  const firstName = cleanText(input.firstName ?? input.first_name, 100);
  const middleName = cleanText(input.middleName ?? input.middle_name, 100) || null;
  const lastName = cleanText(input.lastName ?? input.last_name, 100);
  const email = normalizeEmail(input.email);
  const contactNumber = cleanText(input.contactNumber ?? input.contact ?? input.contact_number, 50) || null;
  const address = cleanText(input.address, 1000) || null;
  const birthDate = input.birthDate ?? input.birth_date ?? input.birthdate ?? null;
  const firstAttendedYouthCamp = input.firstAttendedYouthCamp ?? input.first_attended_youth_camp ?? null;
  const status = String(input.status || 'Active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
  const academicTrack = cleanText(input.academicTrack ?? input.academic_track ?? input.track, 100) || null;
  const gradeLevel = cleanText(input.gradeLevel ?? input.grade_level, 50) || null;
  const school = cleanText(input.school, 255) || null;

  if (!firstName || !lastName) {
    return sendJson(res, 400, { ok: false, error: 'First name and last name are required.' });
  }
  if (!isValidEmail(email)) return sendJson(res, 400, { ok: false, error: 'A valid email is required.' });

  const requestedRole = String(input.accessLevel ?? input.access_level ?? input.role ?? 'member').trim().toLowerCase();
  let accessLevel = ACCESS_LEVELS.has(requestedRole) ? requestedRole : 'member';
  const areaId = requireArea(req, profile);
  let chapterId = input.chapterId ?? input.chapter_id ?? null;

  if (!isAreaAdminRole(profile.role)) {
    accessLevel = 'member';
    if (isChapterServantRole(profile.role)) {
      chapterId = profile.chapter_id;
    }
  }

  if (!areaId) {
    return sendJson(res, 409, { ok: false, error: 'Your account is not assigned to an Area.' });
  }
  if (isChapterServantRole(profile.role) && !chapterId) {
    return sendJson(res, 409, { ok: false, error: 'Your Chapter Servant account is not assigned to a chapter.' });
  }
  if (accessLevel === 'chapter_servant' && !chapterId) {
    return sendJson(res, 400, { ok: false, error: 'A Chapter Servant must be assigned to a chapter.' });
  }

  await validateChapter(admin, chapterId, areaId);

  const { data: existingMember, error: existingError } = await admin
    .from('members')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existingMember) {
    return sendJson(res, 409, { ok: false, error: 'A member with that email already exists.' });
  }

  const { data: createdMember, error: memberError } = await admin
    .from('members')
    .insert({
      area_id: areaId,
      chapter_id: chapterId,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      birth_date: birthDate,
      contact_number: contactNumber,
      email,
      address,
      status,
      first_attended_youth_camp: firstAttendedYouthCamp,
      access_level: accessLevel,
      academic_track: academicTrack,
      grade_level: gradeLevel,
      school,
      created_by: user.id
    })
    .select('*')
    .single();
  if (memberError) throw memberError;

  const requestedService = input.service ?? input.serviceName ?? input.assigned_service ?? (Array.isArray(input.assigned_services) ? input.assigned_services[0] : null);
  const normalizedService = requestedService ? normalizeServiceName(requestedService) : '';
  if (normalizedService) {
    const services = await ensureStandardServices(admin, areaId);
    const targetService = services.find(
      (s) => normalizeServiceName(s.name).toLowerCase() === normalizedService.toLowerCase()
    );
    if (targetService?.id) {
      await admin.from('member_services').insert({
        member_id: createdMember.id,
        service_id: targetService.id
      });
    }
  } else {
    await ensureRoleServiceAssignment(admin, {
      memberId: createdMember.id,
      areaId,
      role: accessLevel
    });
  }

  const { data: memberServiceRows } = await admin
    .from('member_services')
    .select('service_id')
    .eq('member_id', createdMember.id);
  let assignedServices = [];
  if (memberServiceRows && memberServiceRows.length > 0) {
    const sIds = memberServiceRows.map((r) => r.service_id);
    const { data: sRows } = await admin
      .from('services')
      .select('name')
      .in('id', sIds);
    assignedServices = (sRows || []).map((s) => s.name);
  }

  const memberResult = {
    ...createdMember,
    contact: createdMember.contact_number || null,
    service: assignedServices[0] || null,
    assigned_services: assignedServices
  };

  return sendJson(res, 201, { ok: true, member: memberResult, data: memberResult });
}

async function updateMember(req, res) {
  const { admin, profile } = await requireAuthenticatedProfile(req);
  const input = req.body || {};
  const memberId = input.id;
  if (!memberId) return sendJson(res, 400, { ok: false, error: 'Member ID is required.' });

  const isSelf = profile.member_id && String(profile.member_id) === String(memberId);
  if (!isLeaderRole(profile.role) && !isSelf) {
    return sendJson(res, 403, { ok: false, error: 'Only leadership accounts can edit member records.' });
  }

  const areaId = requireArea(req, profile);
  const existing = await loadAreaMember(admin, memberId, areaId);
  if (!existing) return sendJson(res, 404, { ok: false, error: 'Member not found in your Area.' });

  const role = String(profile.role || '').trim().toLowerCase();
  if (isChapterServantRole(role) && !isSelf) {
    if (String(existing.chapter_id || '') !== String(profile.chapter_id || '')) {
      return sendJson(res, 403, { ok: false, error: 'You can only edit members in your assigned chapter.' });
    }
  } else if (role === 'campus_servant' && !isSelf) {
    if (!['college', 'senior high school'].includes(String(existing.academic_track || '').trim().toLowerCase())) {
      return sendJson(res, 403, { ok: false, error: 'Campus Servants can only edit College and Senior High School members.' });
    }
  } else if (role === 'mfc_high_servant' && !isSelf) {
    if (String(existing.academic_track || '').trim().toLowerCase() !== 'high school') {
      return sendJson(res, 403, { ok: false, error: 'MFC High Servants can only edit High School members.' });
    }
  } else if (role === 'area_kids_servant' && !isSelf) {
    if (!['heartchamp', 'heartchamps'].includes(String(existing.academic_track || '').trim().toLowerCase())) {
      return sendJson(res, 403, { ok: false, error: 'Area Kids Servants can only edit Heartchamp members.' });
    }
  }

  const firstName = cleanText(input.firstName ?? input.first_name ?? existing.first_name, 100);
  const middleName = cleanText(input.middleName ?? input.middle_name ?? existing.middle_name, 100) || null;
  const lastName = cleanText(input.lastName ?? input.last_name ?? existing.last_name, 100);
  const email = normalizeEmail(input.email ?? existing.email);
  const contactNumber = cleanText(input.contactNumber ?? input.contact ?? input.contact_number ?? existing.contact_number, 50) || null;
  const address = cleanText(input.address ?? existing.address, 1000) || null;
  const birthDate = input.birthDate ?? input.birth_date ?? input.birthdate ?? existing.birth_date ?? null;
  const firstAttendedYouthCamp = input.firstAttendedYouthCamp ?? input.first_attended_youth_camp ?? existing.first_attended_youth_camp ?? null;
  const statusInput = input.status !== undefined
    ? (String(input.status).toLowerCase() === 'inactive' ? 'Inactive' : 'Active')
    : existing.status;
  const status = isLeaderRole(profile.role)
    ? statusInput
    : existing.status;
  const academicTrack = cleanText(input.academicTrack ?? input.academic_track ?? input.track ?? existing.academic_track, 100) || null;
  const gradeLevel = cleanText(input.gradeLevel ?? input.grade_level ?? existing.grade_level, 50) || null;
  const school = cleanText(input.school ?? existing.school, 255) || null;
  const avatarUrl = input.avatarUrl !== undefined
    ? input.avatarUrl
    : (input.avatar_url !== undefined ? input.avatar_url : (existing.avatar_url || null));
  const requestedRole = String(input.accessLevel ?? input.access_level ?? input.role ?? existing.access_level ?? 'member').trim().toLowerCase();
  const accessLevel = isAreaAdminRole(profile.role)
    ? (ACCESS_LEVELS.has(requestedRole) ? requestedRole : 'member')
    : existing.access_level;
  const rawChapterId = input.chapterId !== undefined ? input.chapterId : input.chapter_id;
  const chapterId = (isAreaAdminRole(profile.role) || isChapterServantRole(profile.role))
    ? (rawChapterId !== undefined ? (rawChapterId || null) : existing.chapter_id)
    : existing.chapter_id;

  if (!firstName || !lastName) {
    return sendJson(res, 400, { ok: false, error: 'First name and last name are required.' });
  }
  if (!isValidEmail(email)) {
    return sendJson(res, 400, { ok: false, error: 'A valid email is required.' });
  }
  if (accessLevel === 'chapter_servant' && !chapterId) {
    return sendJson(res, 400, { ok: false, error: 'A Chapter Servant must be assigned to a chapter.' });
  }

  const chapterChanged = chapterId !== existing.chapter_id;
  const emailChanged = email.toLowerCase() !== String(existing.email || '').toLowerCase();
  const roleChanged = accessLevel !== existing.access_level;
  const statusChanged = status !== existing.status;
  const nameChanged = firstName !== existing.first_name ||
    middleName !== existing.middle_name ||
    lastName !== existing.last_name;

  const preflightChecks = [];
  if (chapterChanged && chapterId) {
    preflightChecks.push(validateChapter(admin, chapterId, areaId));
  }
  if (emailChanged) {
    preflightChecks.push(
      admin
        .from('members')
        .select('id')
        .ilike('email', email)
        .neq('id', memberId)
        .maybeSingle()
        .then(({ data: duplicate, error: duplicateError }) => {
          if (duplicateError) throw duplicateError;
          if (duplicate) {
            const error = new Error('Another member already uses that email address.');
            error.statusCode = 409;
            throw error;
          }
        })
    );
  }
  if (preflightChecks.length > 0) {
    await Promise.all(preflightChecks);
  }

  const { data: updated, error: updateError } = await admin
    .from('members')
    .update({
      chapter_id: chapterId,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      birth_date: birthDate,
      contact_number: contactNumber,
      email,
      address,
      status,
      first_attended_youth_camp: firstAttendedYouthCamp,
      access_level: accessLevel,
      academic_track: academicTrack,
      grade_level: gradeLevel,
      school,
      avatar_url: avatarUrl
    })
    .eq('id', memberId)
    .eq('area_id', areaId)
    .select('*')
    .single();
  if (updateError) throw updateError;

  if (roleChanged || chapterChanged || statusChanged || nameChanged || emailChanged) {
    const { data: linkedProfile, error: linkedProfileError } = await admin
      .from('profiles')
      .select('id')
      .eq('member_id', memberId)
      .maybeSingle();
    if (linkedProfileError) throw linkedProfileError;

    if (linkedProfile?.id) {
      const syncTasks = [];

      if (roleChanged || chapterChanged || statusChanged) {
        syncTasks.push(
          admin
            .from('profiles')
            .update({
              role: accessLevel,
              chapter_id: chapterId,
              is_active: status !== 'Inactive'
            })
            .eq('id', linkedProfile.id)
            .then(({ error: profileUpdateError }) => {
              if (profileUpdateError) throw profileUpdateError;
            })
        );
      }

      if (nameChanged || emailChanged) {
        const authChanges = {
          user_metadata: {
            display_name: [firstName, middleName, lastName].filter(Boolean).join(' ')
          }
        };
        if (emailChanged) authChanges.email = email;

        syncTasks.push(
          admin.auth.admin.updateUserById(linkedProfile.id, authChanges).then(({ error: authUpdateError }) => {
            if (authUpdateError) throw authUpdateError;
          })
        );
      }

      if (syncTasks.length > 0) {
        await Promise.all(syncTasks);
      }
    }
  }

  const hasServiceInput = input.service !== undefined || input.serviceName !== undefined || input.assigned_services !== undefined || input.assigned_service !== undefined;
  if (hasServiceInput) {
    const rawService = input.service ?? input.serviceName ?? input.assigned_service ?? (Array.isArray(input.assigned_services) ? input.assigned_services[0] : null);
    const normalizedService = rawService ? normalizeServiceName(rawService) : '';

    await admin.from('member_services').delete().eq('member_id', memberId);

    if (normalizedService) {
      const services = await ensureStandardServices(admin, areaId);
      const targetService = services.find(
        (s) => normalizeServiceName(s.name).toLowerCase() === normalizedService.toLowerCase()
      );
      if (targetService?.id) {
        await admin.from('member_services').insert({
          member_id: memberId,
          service_id: targetService.id
        });
      }
    }
  } else if (roleChanged) {
    await ensureRoleServiceAssignment(admin, {
      memberId: updated.id,
      areaId,
      role: accessLevel
    });
  }

  const { data: memberServiceRows } = await admin
    .from('member_services')
    .select('service_id')
    .eq('member_id', updated.id);
  let assignedServices = [];
  if (memberServiceRows && memberServiceRows.length > 0) {
    const sIds = memberServiceRows.map((r) => r.service_id);
    const { data: sRows } = await admin
      .from('services')
      .select('name')
      .in('id', sIds);
    assignedServices = (sRows || []).map((s) => s.name);
  }

  const memberResult = {
    ...updated,
    contact: updated.contact_number || null,
    service: assignedServices[0] || null,
    assigned_services: assignedServices
  };

  return sendJson(res, 200, { ok: true, member: memberResult, data: memberResult });
}

async function deleteMember(req, res) {
  const { admin, profile } = await requireAuthenticatedProfile(req);
  if (!isAreaAdminRole(profile.role)) {
    return sendJson(res, 403, { ok: false, error: 'Only Area-level servant accounts can delete member records.' });
  }

  const memberId = req.query?.id || req.body?.id;
  if (!memberId) return sendJson(res, 400, { ok: false, error: 'Member ID is required.' });

  const areaId = requireArea(req, profile);
  const member = await loadAreaMember(admin, memberId, areaId);
  if (!member) return sendJson(res, 404, { ok: false, error: 'Member not found in your Area.' });

  if (String(profile.member_id || '') === String(memberId)) {
    return sendJson(res, 403, {
      ok: false,
      error: 'You cannot delete your own member record from the Members tab. Use Delete Account if you intend to permanently remove your account.'
    });
  }

  const { data: linkedProfile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('member_id', memberId)
    .maybeSingle();
  if (profileError) throw profileError;

  if (linkedProfile?.id && String(linkedProfile.id) === String(profile.id)) {
    return sendJson(res, 403, {
      ok: false,
      error: 'You cannot delete your own member record from the Members tab. Use Delete Account if you intend to permanently remove your account.'
    });
  }

  if (linkedProfile?.id) {
    return sendJson(res, 409, {
      ok: false,
      error: 'This Member is linked to a portal account. Delete the account explicitly before deleting the Member record.'
    });
  }

  const { error: memberDeleteError } = await admin
    .from('members')
    .delete()
    .eq('id', memberId)
    .eq('area_id', areaId);
  if (memberDeleteError) throw memberDeleteError;

  return sendJson(res, 200, {
    ok: true,
    deleted: true,
    deletedAuthUser: false,
    memberId
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await listMembers(req, res);
    if (req.method === 'POST') return await createMember(req, res);
    if (req.method === 'PATCH' || req.method === 'PUT') return await updateMember(req, res);
    if (req.method === 'DELETE') return await deleteMember(req, res);
    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (error) {
    return apiError(res, error);
  }
}
