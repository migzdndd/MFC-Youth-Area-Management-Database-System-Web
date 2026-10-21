import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePayload,
  normalizeNullableString,
  normalizeBoolean,
  normalizeInteger,
  optionalId,
  optionalEmail,
  LoginSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  CreateMemberSchema,
  UpdateMemberSchema,
  BatchSyncSchema,
  CreateReportSchema,
  UpdateReportSchema,
} from '../frontend-react/src/types/schemas.ts';
import {
  formatTelephoneNumber,
  isValidTelephoneNumber,
} from '../frontend-react/src/lib/utils.ts';

test('normalizeNullableString handles edge cases', () => {
  assert.equal(normalizeNullableString(null), null);
  assert.equal(normalizeNullableString(undefined), null);
  assert.equal(normalizeNullableString('   '), null);
  assert.equal(normalizeNullableString('null'), null);
  assert.equal(normalizeNullableString('undefined'), null);
  assert.equal(normalizeNullableString('  hello  '), 'hello');
});

test('normalizeBoolean normalizes boolean representations', () => {
  assert.equal(normalizeBoolean(true), true);
  assert.equal(normalizeBoolean(false), false);
  assert.equal(normalizeBoolean('true'), true);
  assert.equal(normalizeBoolean('TRUE'), true);
  assert.equal(normalizeBoolean('1'), true);
  assert.equal(normalizeBoolean('on'), true);
  assert.equal(normalizeBoolean('yes'), true);
  assert.equal(normalizeBoolean(1), true);
  assert.equal(normalizeBoolean('false'), false);
  assert.equal(normalizeBoolean('0'), false);
  assert.equal(normalizeBoolean(0), false);
  assert.equal(normalizeBoolean(null), false);
});

test('normalizeInteger converts numeric input and falls back safely', () => {
  assert.equal(normalizeInteger(42), 42);
  assert.equal(normalizeInteger('10'), 10);
  assert.equal(normalizeInteger(12.8), 12);
  assert.equal(normalizeInteger('', 5), 5);
  assert.equal(normalizeInteger(null, 5), 5);
  assert.equal(normalizeInteger('not-a-number', 0), 0);
});

test('optionalId accepts valid UUID and null values', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  assert.equal(optionalId.parse(validUuid), validUuid);
  assert.equal(optionalId.parse(''), null);
  assert.equal(optionalId.parse(null), null);
  assert.equal(optionalId.parse(undefined), null);
  assert.throws(() => optionalId.parse('invalid-id-string'));
});

test('optionalEmail normalizes email to lowercase and trims', () => {
  assert.equal(optionalEmail.parse('  User@Example.COM  '), 'user@example.com');
  assert.equal(optionalEmail.parse(''), null);
  assert.equal(optionalEmail.parse(null), null);
  assert.throws(() => optionalEmail.parse('invalid-email-address'));
});

test('LoginSchema validation with optional remember field', () => {
  const valid = LoginSchema.safeParse({
    email: 'test@example.com',
    password: 'securepassword123',
    remember: 'true',
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.remember, true);
    assert.equal(valid.data.email, 'test@example.com');
  }

  const defaultFalse = LoginSchema.safeParse({
    email: 'test@example.com',
    password: 'securepassword123',
  });
  assert.equal(defaultFalse.success, true);
  if (defaultFalse.success) {
    assert.equal(defaultFalse.data.remember, false);
  }

  const booleanTrue = LoginSchema.safeParse({
    email: 'test@example.com',
    password: 'securepassword123',
    remember: true,
  });
  assert.equal(booleanTrue.success, true);
  if (booleanTrue.success) {
    assert.equal(booleanTrue.data.remember, true);
  }

  const booleanFalse = LoginSchema.safeParse({
    email: 'test@example.com',
    password: 'securepassword123',
    remember: false,
  });
  assert.equal(booleanFalse.success, true);
  if (booleanFalse.success) {
    assert.equal(booleanFalse.data.remember, false);
  }

  const invalid = LoginSchema.safeParse({
    email: '',
    password: '',
  });
  assert.equal(invalid.success, false);
});

test('ChangePasswordSchema validation', () => {
  const valid = ChangePasswordSchema.safeParse({
    currentPassword: 'current-secret',
    newPassword: 'new-secret-password-8',
  });
  assert.equal(valid.success, true);

  const invalid = ChangePasswordSchema.safeParse({
    currentPassword: '',
    newPassword: 'short',
  });
  assert.equal(invalid.success, false);
});

test('ForgotPasswordSchema and ResetPasswordSchema', () => {
  const forgotValid = ForgotPasswordSchema.safeParse({ email: 'user@domain.com' });
  assert.equal(forgotValid.success, true);

  const resetValid = ResetPasswordSchema.safeParse({
    token: 'valid-reset-token',
    newPassword: 'newsecurepassword',
  });
  assert.equal(resetValid.success, true);

  const resetShortPassword = ResetPasswordSchema.safeParse({
    token: 'valid-reset-token',
    newPassword: 'short',
  });
  assert.equal(resetShortPassword.success, false);
});

test('CreateMemberSchema requires first and last name', () => {
  const valid = CreateMemberSchema.safeParse({
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'juan@example.com',
  });
  assert.equal(valid.success, true);

  const missingName = CreateMemberSchema.safeParse({
    email: 'missing@example.com',
  });
  assert.equal(missingName.success, false);
});

test('UpdateMemberSchema requires member id', () => {
  const valid = UpdateMemberSchema.safeParse({
    id: 'mem-123',
    firstName: 'Updated',
  });
  assert.equal(valid.success, true);

  const missingId = UpdateMemberSchema.safeParse({
    firstName: 'Updated',
  });
  assert.equal(missingId.success, false);
});

test('BatchSyncSchema caps mutation count', () => {
  const valid = BatchSyncSchema.safeParse({
    mutations: [
      { id: 'mut-1', endpoint: '/members', method: 'POST', payload: { name: 'Test' } },
    ],
  });
  assert.equal(valid.success, true);

  const invalid = BatchSyncSchema.safeParse({
    mutations: new Array(201).fill({ id: 'mut-x', endpoint: '/members' }),
  });
  assert.equal(invalid.success, false);
});

test('CreateReportSchema requires type and date', () => {
  const valid = CreateReportSchema.safeParse({
    report_type: 'Chapter Assembly',
    activity_date: '2026-10-19',
    participant_count: '25',
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.participant_count, 25);
  }

  const missingFields = CreateReportSchema.safeParse({
    title: 'Only Title',
  });
  assert.equal(missingFields.success, false);
});

test('UpdateReportSchema requires report id', () => {
  const valid = UpdateReportSchema.safeParse({
    id: 'rep-123',
    title: 'Updated title',
  });
  assert.equal(valid.success, true);

  const missingId = UpdateReportSchema.safeParse({
    title: 'Missing id',
  });
  assert.equal(missingId.success, false);
});

test('validatePayload helper returns structured errors and field maps', () => {
  const successRes = validatePayload(LoginSchema, {
    email: 'valid@example.com',
    password: 'password123',
  });
  assert.equal(successRes.success, true);
  assert.equal(successRes.error, null);

  const failureRes = validatePayload(LoginSchema, {
    email: 'not-an-email',
    password: '',
  });
  assert.equal(failureRes.success, false);
  assert.ok(failureRes.error?.includes('Validation failed'));
  assert.ok(failureRes.fieldErrors.email);
  assert.ok(failureRes.fieldErrors.password);
});

test('formatTelephoneNumber formats Philippine and international numbers correctly', () => {
  // Philippine mobile 09XX
  assert.equal(formatTelephoneNumber('09171234567'), '0917 123 4567');
  assert.equal(formatTelephoneNumber('0917123'), '0917 123');
  assert.equal(formatTelephoneNumber('0917'), '0917');

  // Input without leading 0 (auto-expand 9XX)
  assert.equal(formatTelephoneNumber('9171234567'), '0917 123 4567');

  // International Philippine +63 / 63
  assert.equal(formatTelephoneNumber('+639171234567'), '+63 917 123 4567');
  assert.equal(formatTelephoneNumber('639171234567'), '+63 917 123 4567');

  // Metro Manila landline 02
  assert.equal(formatTelephoneNumber('0281234567'), '(02) 8123 4567');

  // Strips non-digit garbage
  assert.equal(formatTelephoneNumber('0917-ABC-123-4567'), '0917 123 4567');
  assert.equal(formatTelephoneNumber(''), '');
  assert.equal(formatTelephoneNumber(null), '');
});

test('isValidTelephoneNumber validates complete telephone numbers', () => {
  // Valid formats
  assert.equal(isValidTelephoneNumber('0917 123 4567'), true);
  assert.equal(isValidTelephoneNumber('+63 917 123 4567'), true);
  assert.equal(isValidTelephoneNumber('(02) 8123 4567'), true);
  assert.equal(isValidTelephoneNumber(''), true); // optional
  assert.equal(isValidTelephoneNumber(null), true); // optional

  // Invalid formats (too short, truncated, incomplete)
  assert.equal(isValidTelephoneNumber('0917'), false);
  assert.equal(isValidTelephoneNumber('0917 123'), false);
  assert.equal(isValidTelephoneNumber('+63 917 12'), false);
  assert.equal(isValidTelephoneNumber('12345'), false);
});

