// Post-processes JSX returned by the official Figma MCP's get_design_context.
// Replaces raw hex color values with semantic CSS variable Tailwind classes.
// See ADR-006 for the inspect_component fidelity decision.
//
// This module is used interactively — Claude calls get_design_context,
// then passes the returned JSX through this post-processor to substitute
// token classes wherever the token map has a match.

/** Map of hex value → CSS variable name, built from the exported globals.css */
export type TokenMap = Map<string, string>; // e.g. "#ffffff" → "--background"

/**
 * Loads a TokenMap by parsing a generated globals.css file.
 * Reads the @theme block and inverts it: value → cssVar.
 */
export function loadTokenMap(globalsCssContent: string): TokenMap {
  // TODO: implement
  // 1. Parse @theme { ... } block
  // 2. For each --var: value; line, add value → --var to the map
  throw new Error("loadTokenMap: not implemented");
}

/**
 * Scans a JSX string for raw hex color values (inline styles or arbitrary
 * Tailwind classes like bg-[#ffffff]) and replaces them with the nearest
 * semantic token class or CSS variable reference.
 *
 * Example:
 *   className="bg-[#ffffff]"  → className="bg-background"
 *   style={{ color: "#18181b" }} → style={{ color: "var(--foreground)" }}
 */
export function substituteTokens(jsx: string, tokenMap: TokenMap): string {
  // TODO: implement
  throw new Error("substituteTokens: not implemented");
}
