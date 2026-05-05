/**
 * Phone helpers focused on the Brazilian default. The backend stores E.164
 * (`+5511999999999`) but the user types in the local format `(11) 99999-9999`.
 */

const BR_COUNTRY_CODE = '55';

/** Strip everything that isn't a digit. */
export function stripPhone(raw: string): string {
  return raw.replace(/\D+/g, '');
}

/**
 * Renders the Brazilian local format. Accepts any incremental input.
 * Examples:
 *   "11"          → "(11"
 *   "1199"        → "(11) 99"
 *   "11999998888" → "(11) 99999-8888"
 */
export function maskBrazilianPhone(raw: string): string {
  const d = stripPhone(raw).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Convert a Brazilian local-format string to E.164 using +55 as the default
 * country code. Returns null if the input is too short.
 */
export function toBrazilianE164(raw: string): string | null {
  const d = stripPhone(raw);
  if (d.length < 10 || d.length > 11) return null;
  return `+${BR_COUNTRY_CODE}${d}`;
}

/** Loose E.164 sanity check used before submitting to the backend. */
export function isValidE164(raw: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(raw);
}
