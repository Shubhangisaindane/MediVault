const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

export function normalizePhone(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;

  const phone = value.trim();
  // Permit common readable phone formats, but reject letters and extensions.
  if (!/^[+()\-\s.\d]+$/.test(phone)) return null;

  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? phone : null;
}
