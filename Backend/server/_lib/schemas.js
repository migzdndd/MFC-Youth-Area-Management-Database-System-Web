/**
 * Runtime Contract Guards & Shared Request Validation Schemas
 *
 * What it Does: Simple non IT Terms
 * Acts as an inspection gate at the server border. Before processing any user request
 * (such as logging in, creating members, syncing offline data, or submitting reports),
 * this module verifies that the submitted data matches our strict security standards.
 * It rejects malformed, oversized, or missing inputs before database queries run.
 */

import { z } from 'zod';
import { sendJson } from './http.js';

/**
 * Validate a data payload against a Zod schema
 *
 * @param {z.ZodSchema} schema
 * @param {unknown} data
 * @returns {{ success: boolean, data: any, error: string | null, issues: Array<{ field: string, message: string }> | null }}
 */
export function validatePayload(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((iss) => ({
      field: iss.path.join('.'),
      message: iss.message
    }));
    const summary = issues.map((i) => (i.field ? `${i.field}: ${i.message}` : i.message)).join('; ');
    return {
      success: false,
      error: `Validation failed: ${summary}`,
      issues,
      data: null
    };
  }

  return {
    success: true,
    error: null,
    issues: null,
    data: result.data
  };
}

/**
 * Express/Vercel Request Body Validator Helper
 * Automatically sends 400 Bad Request with standardized error details if validation fails.
 *
 * @param {import('http').IncomingMessage & { body?: any }} req
 * @param {import('http').ServerResponse} res
 * @param {z.ZodSchema} schema
 * @returns {any | null} Returns parsed data if valid, null if validation failed (and HTTP 400 was sent)
 */
export function validateRequestBody(req, res, schema) {
  const validation = validatePayload(schema, req.body || {});
  if (!validation.success) {
    sendJson(res, 400, {
      ok: false,
      error: validation.error,
      issues: validation.issues
    });
    return null;
  }
  return validation.data;
}

// -----------------------------------------------------------------------------
// Common Reusable Field Preprocessors & Primitive Guards
// -----------------------------------------------------------------------------

/**
 * Optional UUID foreign key that handles empty string, "null", and "undefined" from HTML form inputs.
 */
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

/**
 * Optional email field for partial updates that cleanly handles empty strings.
 */
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

// -----------------------------------------------------------------------------
// Authentication Schemas
// -----------------------------------------------------------------------------

export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty')
    .max(255, 'Password cannot exceed 255 characters'),
  remember: z
    .preprocess((v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1' || v === 'on';
      return false;
    }, z.boolean())
    .optional()
    .default(false)
});

export const ChangePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password cannot be empty')
    .max(255, 'Password cannot exceed 255 characters'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .max(255, 'Password cannot exceed 255 characters')
});

export const ForgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255)
});

export const ResetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Reset token is required' })
    .min(1, 'Reset token is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .max(255)
});

// -----------------------------------------------------------------------------
// Member Management Schemas
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Offline Batch Sync Schemas
// -----------------------------------------------------------------------------

export const SyncMutationSchema = z.object({
  id: z.string({ required_error: 'Mutation id is required' }).min(1),
  endpoint: z.string({ required_error: 'Endpoint is required' }).max(255),
  method: z
    .preprocess((val) => (typeof val === 'string' ? val.toUpperCase() : val), z.enum(['POST', 'PUT', 'PATCH', 'DELETE']))
    .optional()
    .default('POST'),
  payload: z.record(z.unknown()).optional().default({})
});

export const BatchSyncSchema = z.object({
  mutations: z
    .array(SyncMutationSchema, { required_error: 'Mutations array is required' })
    .max(200, 'Batch size cannot exceed 200 mutations per request')
});

// -----------------------------------------------------------------------------
// Activity Reports Schemas
// -----------------------------------------------------------------------------

export const BaseReportSchema = z.object({
  title: z.string().trim().max(160).nullable().optional(),
  activity: z.string().trim().max(160).nullable().optional(),
  report_type: z.string().trim().max(100).optional(),
  type: z.string().trim().max(100).optional(),
  activity_date: z.string().optional(),
  date: z.string().optional(),
  chapter_id: optionalId,
  chapterId: optionalId,
  event_id: optionalId,
  eventId: optionalId,
  participant_count: z.preprocess((v) => (v === undefined || v === null || v === '' ? 0 : Number(v)), z.number().int().nonnegative()).optional().default(0),
  participants: z.preprocess((v) => (v === undefined || v === null || v === '' ? 0 : Number(v)), z.number().int().nonnegative()).optional().default(0),
  location: z.string().trim().max(255).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional()
});

export const CreateReportSchema = BaseReportSchema.refine(
  (data) => (data.report_type || data.type) && (data.activity_date || data.date),
  { message: 'Report type and activity date are required.' }
);

export const UpdateReportSchema = BaseReportSchema.extend({
  id: z.string({ required_error: 'Report ID is required' }).min(1, 'Report ID cannot be empty')
});
