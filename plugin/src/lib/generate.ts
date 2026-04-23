import type { ResolvedToken } from "./types";

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
