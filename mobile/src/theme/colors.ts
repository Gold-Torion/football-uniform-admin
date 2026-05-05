/**
 * Arena dos Mantos brand palette mirrored from tailwind.config.js. Source of
 * truth is the signed brand book Guide_de_cores_arena.docx. Use Tailwind
 * classes (`bg-arena-verde`, `text-arena-dourado`, etc.) inside JSX; this
 * file exists for the few APIs that take raw hex (StatusBar, splash, native
 * navigation theming).
 */
export const colors = {
  // ── Brand ────────────────────────────────────────────────────────────────
  arenaVerde: '#335336',
  arenaVerdeDark: '#243B26',
  arenaDourado: '#D4AF37',
  arenaDouradoClaro: '#E1C16E',
  arenaFundo: '#211B15',

  // ── Status / accents ─────────────────────────────────────────────────────
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',

  // ── Light surfaces ───────────────────────────────────────────────────────
  surface: '#FFFFFF',
  surfaceSubtle: '#F4EFE3',
  surfaceBorder: '#E5DCC4',

  // ── Ink (text on light bg) ───────────────────────────────────────────────
  ink1: '#1C1A14',
  ink2: '#5C5547',
  ink3: '#9C9486',
} as const;
