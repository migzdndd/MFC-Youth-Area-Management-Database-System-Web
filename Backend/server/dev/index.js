/**
 * Developer Operations and System Telemetry Endpoint
 *
 * What it Does: Simple non IT Terms
 * Provides a dedicated control center and system telemetry monitor accessible exclusively
 * by designated system developers configured in Supabase.
 * It aggregates real-time database counts, server resource metrics, system health, and
 * administrative diagnostic utilities.
 */

import { requireAuthenticatedProfile, isSystemDeveloper } from '../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../_lib/http.js';

let devMetricsCache = null;
let devMetricsCacheExpiry = 0;

async function ensureDeveloperAccess(admin, user, profile) {
  const isDev = await isSystemDeveloper(admin, user, profile);
  if (!isDev) {
    const error = new Error('Unauthorized. Developer dashboard is restricted to designated system developers in Supabase.');
    error.statusCode = 403;
    error.code = 'DEVELOPER_ACCESS_REQUIRED';
    throw error;
  }
}

async function getDeveloperMetrics(req, res) {
  const { admin, user, profile } = await requireAuthenticatedProfile(req);
  await ensureDeveloperAccess(admin, user, profile);

  if (devMetricsCache && Date.now() < devMetricsCacheExpiry && req.query?.refresh !== 'true') {
    const memoryUsage = process.memoryUsage();
    return sendJson(res, 200, {
      ...devMetricsCache,
      timestamp: new Date().toISOString(),
      system: {
        ...devMetricsCache.system,
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
          rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
          heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
          externalMb: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
        },
      },
    });
  }

  // Measure true single-query connection latency
  const pingStart = Date.now();
  await admin.from('areas').select('id').limit(1);
  const dbLatencyMs = Date.now() - pingStart;

  // Run table counts and recent activity in parallel via Supabase admin
  const [
    membersRes,
    chaptersRes,
    areasRes,
    eventsRes,
    participantsRes,
    reportsRes,
    servicesRes,
    profilesRes,
    recentMembersRes,
    recentEventsRes,
    recentReportsRes,
  ] = await Promise.all([
    admin.from('members').select('*', { count: 'exact', head: true }),
    admin.from('chapters').select('*', { count: 'exact', head: true }),
    admin.from('areas').select('*', { count: 'exact', head: true }),
    admin.from('events').select('*', { count: 'exact', head: true }),
    admin.from('event_participants').select('*', { count: 'exact', head: true }),
    admin.from('activity_reports').select('*', { count: 'exact', head: true }),
    admin.from('services').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('members').select('id, first_name, middle_name, last_name, email, status, created_at, area_id').order('created_at', { ascending: false }).limit(6),
    admin.from('events').select('id, name, venue, fee, starts_at, created_at, created_by').order('created_at', { ascending: false }).limit(6),
    admin.from('activity_reports').select('id, report_type, audit_status, created_at, chapter_id').order('created_at', { ascending: false }).limit(6),
  ]);
  const memoryUsage = process.memoryUsage();

  const metrics = {
    ok: true,
    authorizedUser: user.email,
    timestamp: new Date().toISOString(),
    system: {
      status: 'operational',
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || 'production',
      dbLatencyMs,
      memory: {
        rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        externalMb: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
      },
    },
    counts: {
      members: membersRes.count ?? 0,
      chapters: chaptersRes.count ?? 0,
      areas: areasRes.count ?? 0,
      events: eventsRes.count ?? 0,
      participants: participantsRes.count ?? 0,
      reports: reportsRes.count ?? 0,
      services: servicesRes.count ?? 0,
      profiles: profilesRes.count ?? 0,
    },
    recentActivity: {
      members: recentMembersRes.data || [],
      events: recentEventsRes.data || [],
      reports: (recentReportsRes.data || []).map((r) => ({
        ...r,
        status: r.audit_status || 'Filed',
      })),
    },
  };

  devMetricsCache = metrics;
  devMetricsCacheExpiry = Date.now() + 20000;

  return sendJson(res, 200, metrics);
}

async function handleDeveloperAction(req, res) {
  const { admin, user, profile } = await requireAuthenticatedProfile(req);
  await ensureDeveloperAccess(admin, user, profile);

  const { action, table } = req.body || {};

  if (action === 'inspect_table') {
    const allowedTables = new Set([
      'members',
      'chapters',
      'areas',
      'events',
      'event_participants',
      'activity_reports',
      'services',
      'profiles',
    ]);

    if (!allowedTables.has(String(table))) {
      return sendJson(res, 400, { ok: false, error: 'Invalid or restricted database table name.' });
    }

    const { data, error } = await admin
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return sendJson(res, 200, { ok: true, table, rows: data || [] });
  }

  if (action === 'ping') {
    const start = Date.now();
    const { error } = await admin.from('areas').select('id').limit(1);
    const latency = Date.now() - start;
    if (error) throw error;
    return sendJson(res, 200, { ok: true, latencyMs: latency, timestamp: new Date().toISOString() });
  }

  return sendJson(res, 400, { ok: false, error: 'Unrecognized developer action.' });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await getDeveloperMetrics(req, res);
    if (req.method === 'POST') return await handleDeveloperAction(req, res);
    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    return apiError(res, error);
  }
}
