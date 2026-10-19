/**
 * Frontend runtime contract guards, validation runners, and inferred types.
 *
 * Provides client-side validation schemas matching backend contract specifications
 * and utility functions for consistent error extraction and type safety.
 */

import { z } from 'zod';

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationSuccess<T> {
  success: true;
  data: T;
  error: null;
  issues: null;
  fieldErrors: Record<string, string>;
}

export interface ValidationFailure {
  success: false;
  data: null;
  error: string;
  issues: ValidationIssue[];
  fieldErrors: Record<string, string>;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validates data against a Zod schema and generates formatted error messages and field mappings.
 */
export function validatePayload<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues: ValidationIssue[] = result.error.issues.map((iss) => ({
      field: iss.path.join('.'),
      message: iss.message,
    }));
    const fieldErrors: Record<string, string> = {};
    for (const issue of issues) {
      if (issue.field && !fieldErrors[issue.field]) {
        fieldErrors[issue.field] = issue.message;
      }
    }
    const summary = issues.map((i) => (i.field ? `${i.field}: ${i.message}` : i.message)).join('; ');
    return {
      success: false,
      data: null,
      error: `Validation failed: ${summary}`,
      issues,
      fieldErrors,
    };
  }

  return {
    success: true,
    data: result.data,
    error: null,
    issues: null,
    fieldErrors: {},
  };
}

/**
 * Trims strings and converts empty string or null/undefined literals into null.
 */
export function normalizeNullableString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      return null;
    }
    return trimmed;
  }
  return String(val).trim() || null;
}

/**
 * Normalizes loose boolean representations from HTML forms or query strings.
 */
export function normalizeBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'on' || s === 'yes';
  }
  if (typeof val === 'number') {
    return val === 1;
  }
  return false;
}

/**
 * Normalizes numeric input into an integer with a fallback default.
 */
export function normalizeInteger(val: unknown, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

export const optionalId = z.preprocess(
  (val) => normalizeNullableString(val),
  z.string().uuid('Invalid ID format').nullable().optional()
);

export const optionalEmail = z.preprocess(
  (val) => {
    const cleaned = normalizeNullableString(val);
    return cleaned ? cleaned.toLowerCase() : null;
  },
  z.string().email('A valid email is required').max(255, 'Email cannot exceed 255 characters').nullable().optional()
);

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
    .preprocess(normalizeBoolean, z.boolean())
    .optional()
    .default(false),
});

export type LoginPayload = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password cannot be empty')
    .max(255, 'Password cannot exceed 255 characters'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .max(255, 'Password cannot exceed 255 characters'),
});

export type ChangePasswordPayload = z.infer<typeof ChangePasswordSchema>;

export const ForgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255, 'Email cannot exceed 255 characters'),
});

export type ForgotPasswordPayload = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Reset token is required' })
    .min(1, 'Reset token is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .max(255, 'Password cannot exceed 255 characters'),
});

export type ResetPasswordPayload = z.infer<typeof ResetPasswordSchema>;

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
  status: z
    .preprocess((val) => {
      if (!val) return 'Active';
      const s = String(val).trim().toLowerCase();
      return s === 'inactive' ? 'Inactive' : 'Active';
    }, z.enum(['Active', 'Inactive']))
    .optional()
    .default('Active'),
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
  assigned_services: z.array(z.string().trim().max(100)).optional(),
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
    email: optionalEmail,
  })
  .refine((data) => data.id || data.memberId || data.member_id, {
    message: 'Member ID is required for update.',
  });

export type UpdateMemberPayload = z.infer<typeof UpdateMemberSchema>;

export const SyncMutationSchema = z.object({
  id: z.string({ required_error: 'Mutation id is required' }).min(1),
  endpoint: z.string({ required_error: 'Endpoint is required' }).max(255),
  method: z
    .preprocess((val) => (typeof val === 'string' ? val.toUpperCase() : val), z.enum(['POST', 'PUT', 'PATCH', 'DELETE']))
    .optional()
    .default('POST'),
  payload: z.record(z.unknown()).optional().default({}),
});

export type SyncMutationPayload = z.infer<typeof SyncMutationSchema>;

export const BatchSyncSchema = z.object({
  mutations: z
    .array(SyncMutationSchema, { required_error: 'Mutations array is required' })
    .max(200, 'Batch size cannot exceed 200 mutations per request'),
});

export type BatchSyncPayload = z.infer<typeof BatchSyncSchema>;

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
  participant_count: z.preprocess((v) => normalizeInteger(v, 0), z.number().int().nonnegative()).optional().default(0),
  participants: z.preprocess((v) => normalizeInteger(v, 0), z.number().int().nonnegative()).optional().default(0),
  location: z.string().trim().max(255).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
});

export const CreateReportSchema = BaseReportSchema.refine(
  (data) => (data.report_type || data.type) && (data.activity_date || data.date),
  { message: 'Report type and activity date are required.' }
);

export type CreateReportPayload = z.infer<typeof CreateReportSchema>;

export const UpdateReportSchema = BaseReportSchema.extend({
  id: z.string({ required_error: 'Report ID is required' }).min(1, 'Report ID cannot be empty'),
});

export type UpdateReportPayload = z.infer<typeof UpdateReportSchema>;
