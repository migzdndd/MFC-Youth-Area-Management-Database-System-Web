export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === null || num === undefined || isNaN(num)) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(dateString);
  }
}

/**
 * Formats telephone input in real time as the user keys in digits.
 * Handles:
 * - Philippine Mobile: 09XX XXX XXXX (11 digits) or +63 9XX XXX XXXX
 * - Philippine Landline: (02) 8XXX XXXX (Metro Manila) or (0XX) XXX XXXX (Provincial)
 * - Auto-prefixing when 9XX is keyed in directly
 * - Standard international formatted blocks
 */
export function formatTelephoneNumber(value: string | null | undefined): string {
  if (!value) return '';

  const raw = String(value);
  const hasPlus = raw.trim().startsWith('+');
  const digits = raw.replace(/\D/g, '');

  if (!digits) return hasPlus ? '+' : '';

  // Case 1: International format with + or starting with country code 63
  if (hasPlus || digits.startsWith('63')) {
    let sub = digits;
    if (sub.startsWith('63')) {
      sub = sub.slice(2);
    }
    const limited = sub.slice(0, 10);
    if (limited.length === 0) return '+63';
    if (limited.length <= 3) return `+63 ${limited}`;
    if (limited.length <= 6) return `+63 ${limited.slice(0, 3)} ${limited.slice(3)}`;
    return `+63 ${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 10)}`;
  }

  // Case 2: Standard Philippine mobile (09XX XXX XXXX - 11 digits)
  if (digits.startsWith('09')) {
    const limited = digits.slice(0, 11);
    if (limited.length <= 4) return limited;
    if (limited.length <= 7) return `${limited.slice(0, 4)} ${limited.slice(4)}`;
    return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7, 11)}`;
  }

  // Case 3: Direct 9XXXXXXXXX input without leading 0 (auto-expand to 09)
  if (digits.startsWith('9') && digits.length <= 10) {
    const prefixed = `0${digits}`;
    if (prefixed.length <= 4) return prefixed;
    if (prefixed.length <= 7) return `${prefixed.slice(0, 4)} ${prefixed.slice(4)}`;
    return `${prefixed.slice(0, 4)} ${prefixed.slice(4, 7)} ${prefixed.slice(7, 11)}`;
  }

  // Case 4: Metro Manila Landline (02 8XXX XXXX)
  if (digits.startsWith('02')) {
    const limited = digits.slice(0, 10);
    if (limited.length <= 2) return `(02)`;
    if (limited.length <= 6) return `(02) ${limited.slice(2)}`;
    return `(02) ${limited.slice(2, 6)} ${limited.slice(6, 10)}`;
  }

  // Case 5: Provincial Landline (0XX XXX XXXX)
  if (digits.startsWith('0') && digits.length >= 2 && digits[1] !== '9') {
    const limited = digits.slice(0, 10);
    if (limited.length <= 3) return `(${limited})`;
    if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)} ${limited.slice(6, 10)}`;
  }

  // Case 6: Generic telephone number (capped at 15 digits according to ITU-T E.164)
  const limited = digits.slice(0, 15);
  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`;
  if (limited.length <= 10) return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
  return `${limited.slice(0, 3)} ${limited.slice(3, 7)} ${limited.slice(7, 11)} ${limited.slice(11)}`;
}

/**
 * Validates if the phone number is in a complete, valid telephone format.
 */
export function isValidTelephoneNumber(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true; // Optional fields can be empty
  const digits = value.replace(/\D/g, '');

  if (digits.length < 7 || digits.length > 15) return false;

  // Philippine mobile starting with 09 must be exactly 11 digits
  if (digits.startsWith('09')) {
    return digits.length === 11;
  }

  // Philippine mobile with international code +63 9 must be 12 digits
  if (digits.startsWith('639')) {
    return digits.length === 12;
  }

  // Metro Manila landline with 02 area code must be 10 digits
  if (digits.startsWith('02')) {
    return digits.length === 10;
  }

  return true;
}

