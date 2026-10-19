/**
 * Frontend Runtime Contract Guards & Inferred Types
 *
 * Provides client-side validation and static TypeScript types matching the backend schemas.
 */

import { z } from 'zod';

export const optionalId = z
  .preprocess((val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
        return null;
      }
      return trimmed;
    }
    return val;
  }, z.string().uuid('Invalid ID format').nullable().optional());

export const optionalEmail = z.preprocess(
  (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed || trimmed.toLowerCase() === 'null') return null;
      return trimmed.toLowerCase();
    }
    return val;
  },
  z.string().email('A valid email is required').max(255).nullable().optional()
);

export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty')
    .max(255),
  remember: z
    .preprocess((v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1' || v === 'on';
      return false;
    }, z.boolean())
    .optional()
    .default(false)
});

export type LoginPayload = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password cannot be empty')
    .max(255),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .max(255)
});

export type ChangePasswordPayload = z.infer<typeof ChangePasswordSchema>;

export const BaseMemberSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100).optional(),
  firstName: z.string().trim().min(1, 'First name is required').max(100).optional(),
  last_name: z.string().trim().min(1, 'Last name is required').max(100).optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100).optional(),
  middle_name: z.string().trim().max(100).nullable().optional(),
  middleName: z.string().trim().max(100).nullable().optional(),
  email: z.string().trim().toLowerCase().email('A valid email is required').max(255),
  contact_number: z.string().trim().max(50).nullable().optional(),
  contactNumber: z.string().trim().max(50).nullable().optional(),
  contact: z.string().trim().max(50).nullable().optional(),
  address: z.string().trim().max(1000).nullable().optional(),
  chapter_id: optionalId,
  chapterId: optionalId,
  status: z.preprocess((val) => {
    if (!val) return 'Active';
    const s = String(val).trim().toLowerCase();
    return s === 'inactive' ? 'Inactive' : 'Active';
  }, z.enum(['Active', 'Inactive'])).optional().default('Active'),
  access_level: z.string().trim().toLowerCase().optional().default('member'),
  accessLevel: z.string().trim().toLowerCase().optional().default('member'),
  role: z.string().trim().toLowerCase().optional(),
  academic_track: z.string().trim().max(100).nullable().optional(),
  academicTrack: z.string().trim().max(100).nullable().optional(),
  track: z.string().trim().max(100).nullable().optional(),
  grade_level: z.string().trim().max(50).nullable().optional(),
  gradeLevel: z.string().trim().max(50).nullable().optional(),
  school: z.string().trim().max(255).nullable().optional(),
  nickname: z.string().trim().max(100).nullable().optional(),
  gender: z.string().trim().max(20).nullable().optional(),
  birth_date: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  birthdate: z.string().nullable().optional(),
  first_attended_youth_camp: z.string().nullable().optional(),
  firstAttendedYouthCamp: z.string().nullable().optional(),
  guardian_name: z.string().trim().max(100).nullable().optional(),
  guardianName: z.string().trim().max(100).nullable().optional(),
  guardian_contact: z.string().trim().max(50).nullable().optional(),
  guardianContact: z.string().trim().max(50).nullable().optional(),
  service: z.string().trim().max(100).nullable().optional(),
  serviceName: z.string().trim().max(100).nullable().optional(),
  assigned_service: z.string().trim().max(100).nullable().optional(),
  assigned_services: z.array(z.string().trim().max(100)).optional()
});

export const CreateMemberSchema = BaseMemberSchema.refine(
  (data) => (data.first_name || data.firstName) && (data.last_name || data.lastName),
  { message: 'First name and last name are required.' }
);

export type CreateMemberPayload = z.infer<typeof CreateMemberSchema>;

export const UpdateMemberSchema = BaseMemberSchema.partial()
  .extend({
    id: z.string().trim().min(1, 'Member ID is required').optional(),
    memberId: z.string().trim().min(1, 'Member ID is required').optional(),
    member_id: z.string().trim().min(1, 'Member ID is required').optional(),
    email: optionalEmail
  })
  .refine((data) => data.id || data.memberId || data.member_id, {
    message: 'Member ID is required for update.'
  });

export type UpdateMemberPayload = z.infer<typeof UpdateMemberSchema>;
