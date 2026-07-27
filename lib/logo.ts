/**
 * Brand logo — single source of truth.
 *
 * The mark is a bold upward chevron rising from a baseline inside a rounded
 * square: a foundation you build up from, learning by rising through levels.
 * Used by the favicon (app/icon.svg), the nav, and the Open Graph preview.
 */

export interface LogoOptions {
  /** Background of the rounded square. Use "transparent" for the bare mark. */
  background?: string;
  /** Stroke/fill color of the mark. */
  foreground?: string;
  /** Border color of the square. Use "transparent" to hide it. */
  border?: string;
}

/** Returns the full square logo as an SVG string at a 96×96 viewBox. */
export function logoSquareSvg({
  background = "#0a0a0a",
  foreground = "#ededed",
  border = "rgba(255,255,255,0.14)",
}: LogoOptions = {}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" role="img" aria-label="The Unorthodox School">
  <rect x="3" y="3" width="90" height="90" rx="22" fill="${background}" stroke="${border}" stroke-width="2"/>
  <path d="M28 52 L48 30 L68 52" fill="none" stroke="${foreground}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M31 66 H65" fill="none" stroke="${foreground}" stroke-width="9" stroke-linecap="round"/>
</svg>`;
}

/** The default brand logo as a data URI (safe for <img> in any runtime). */
export const logoDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(
  logoSquareSvg(),
)}`;
