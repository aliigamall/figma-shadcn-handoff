import type { ResolvedToken } from "./types";

/**
 * CSS variable prefixes that belong in @theme — they generate Tailwind utilities
 * (color scales, alpha palette, radius, typography, shadow, border-radii, chart scales).
 * Everything else is a semantic token and goes in :root (unlayered) so it wins the
 * cascade over the default values that shadcn/tailwind.css may define.
 */
const THEME_PREFIXES = [
  "--color-",
  "--alpha-",
  "--radius-",
  "--spacing-",
  "--typography-",
  "--shadow-",
  "--border-radii-",
  "--chart-colors-",
];

function isThemeVar(cssVar: string): boolean {
  return THEME_PREFIXES.some(p => cssVar.startsWith(p));
}

/** Returns true when a CSS value resolves to a color (not a length, number, or string). */
function isColorValue(value: string): boolean {
  if (value.startsWith("#")) return true;
  if (value.startsWith("var(--color-"))  return true;
  if (value.startsWith("var(--alpha-"))  return true;
  if (value.startsWith("var(--chart-"))  return true;
  if (/^(rgb|hsl|oklch|oklab|hwb|lch|lab|color-mix|color)\s*\(/i.test(value)) return true;
  return false;
}

const FILE_HEADER = `\
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));`;

const LAYER_BASE = `\
@layer base {
  * {
    border-color: var(--border);
    outline-color: color-mix(in srgb, var(--ring) 50%, transparent);
  }
  body {
    background-color: var(--background);
    color: var(--foreground);
  }
  html {
    font-family: var(--font-sans, sans-serif);
  }
}`;

export function generateCss(tokens: ResolvedToken[]): string {
  const themeTokens    = tokens.filter(t => isThemeVar(t.cssVar));
  const semanticTokens = tokens.filter(t => !isThemeVar(t.cssVar));
  const darkTokens     = tokens.filter(t => t.dark !== undefined);

  const parts: string[] = [FILE_HEADER];

  // Color scale + design tokens → @theme (creates Tailwind utility classes)
  if (themeTokens.length > 0) {
    const lines = themeTokens.map(t => `  ${t.cssVar}: ${t.light};`).join("\n");
    parts.push(`@theme {\n${lines}\n}`);
  }

  // Bridge semantic color tokens to Tailwind color utilities.
  // @theme inline makes Tailwind generate bg-primary, text-unofficial-primary-hover, etc.
  // Only tokens whose values resolve to colors get a --color-* alias.
  const inlineLines = semanticTokens
    .filter(t => isColorValue(t.light))
    .map(t => `  --color-${t.cssVar.slice(2)}: var(${t.cssVar});`);
  if (inlineLines.length > 0) {
    parts.push(`@theme inline {\n${inlineLines.join("\n")}\n}`);
  }

  // Semantic tokens → :root (unlayered — wins over @layer theme defaults from shadcn)
  if (semanticTokens.length > 0) {
    const lines = semanticTokens.map(t => `  ${t.cssVar}: ${t.light};`).join("\n");
    parts.push(`:root {\n${lines}\n}`);
  }

  // Dark mode overrides — already unlayered, no change needed
  if (darkTokens.length > 0) {
    const darkLines = darkTokens.map(t => `  ${t.cssVar}: ${t.dark};`).join("\n");
    parts.push(`[data-theme="dark"] {\n${darkLines}\n}`);
  }

  // Base layer — wires shadcn design tokens into element defaults
  parts.push(LAYER_BASE);

  return parts.join("\n\n");
}
