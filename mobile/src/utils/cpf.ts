/**
 * CPF helpers — mod-11 validation and the standard punctuation mask.
 * The same algorithm runs on the backend (CpfValidatorService); we duplicate
 * it client-side so the form can give realtime feedback without a round trip.
 */

/** Removes any character that isn't 0–9. */
export function stripCpf(raw: string): string {
  return raw.replace(/\D+/g, '');
}

/**
 * Formats a partial input string into the canonical 000.000.000-00 mask.
 * Designed to be called on every keystroke; never throws.
 */
export function maskCpf(raw: string): string {
  const digits = stripCpf(raw).slice(0, 11);
  const len = digits.length;
  if (len <= 3) return digits;
  if (len <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (len <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** True when `raw` is a structurally valid CPF (mod-11, 11 digits, not all-same). */
export function isValidCpf(raw: string): boolean {
  const digits = stripCpf(raw);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  return (
    digits[9] === String(checkDigit(digits.slice(0, 9))) &&
    digits[10] === String(checkDigit(digits.slice(0, 10)))
  );
}

function checkDigit(prefix: string): number {
  const len = prefix.length;
  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += parseInt(prefix[i], 10) * (len + 1 - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}
