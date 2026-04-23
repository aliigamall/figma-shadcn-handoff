// Generates the globals.css file content from resolved tokens.
// Output format: Tailwind v4 @theme block + [data-theme="dark"] override block.
// See ADR-003 for dark mode shape, ADR-005 for output path.

import type { ResolvedToken } from "./types.js";

export const OUTPUT_PATH = "./globals.css"; // ADR-005: fixed for now

/**
 * Builds the CSS file string from a flat list of resolved tokens.
 *
 * Output shape:
 *
 *   @theme {
 *     --background: #ffffff;
 *     --primary: #18181b;
 *     ...
 *   }
 *
 *   [data-theme="dark"] {
 *     --background: #09090b;
 *     --primary: #fafafa;
 *     ...
 *   }
 */
export function generateCss(tokens: ResolvedToken[]): string {
  const themeLines = tokens.map((t) => `  ${t.cssVar}: ${t.light};`).join("\n");
  const darkTokens = tokens.filter((t) => t.dark !== undefined);

  let css = `@theme {\n${themeLines}\n}`;

  if (darkTokens.length > 0) {
    const darkLines = darkTokens.map((t) => `  ${t.cssVar}: ${t.dark};`).join("\n");
    css += `\n\n[data-theme="dark"] {\n${darkLines}\n}`;
  }

  return css;
}
