// Maps Figma variable paths + collection names → CSS custom property names.
// See ADR-002 for the full naming rules.

import type { RgbaValue, FigmaVariableValue } from "./types.js";

/**
 * Derives the CSS variable name from a Figma variable path and its collection.
 *
 * Examples (ADR-002):
 *   collection="semantic colors", path="general/background"  → "--background"
 *   collection="semantic colors", path="general/primary"     → "--primary"
 *   collection="semantic colors", path="card/card"           → "--card"
 *   collection="semantic colors", path="card/card foreground"→ "--card-foreground"
 *   collection="raw colors",      path="red/500"             → "--color-red-500"
 *   collection="border radii",    path="md"                  → "--radius-md"
 *   collection="spacing",         path="4"                   → "--spacing-4"
 *   collection="typography",      path="body/size"           → "--typography-body-size"
 *   collection="shadows",         path="md"                  → "--shadow-md"
 */
export function toCssVarName(collection: string, path: string): string {
  const col = collection.toLowerCase().trim();
  // Normalize each path segment: lowercase, spaces → hyphens
  const parts = path.split("/").map((p) => p.trim().toLowerCase().replace(/\s+/g, "-"));

  if (col === "semantic colors") {
    const [group, ...rest] = parts;
    // "general" group: drop group prefix entirely (ADR-002)
    if (group === "general") return `--${rest.join("-")}`;
    // Other groups: --{group}-{name}, strip redundant group prefix from name.
    // Figma path "card/card foreground" splits as ["card", "card-foreground"] after normalize.
    // "card-foreground" starts with "card-" → strip → "foreground" → --card-foreground
    // "card" equals group → strip → "" → --card
    const name = rest.join("-");
    const prefix = `${group}-`;
    const stripped = name === group ? "" : name.startsWith(prefix) ? name.slice(prefix.length) : name;
    if (!stripped) return `--${group}`;
    return `--${group}-${stripped}`;
  }

  if (col === "raw colors" || col === "brand colors") return `--color-${parts.join("-")}`;
  if (col === "border radii") return `--radius-${parts.join("-")}`;
  if (col === "spacing") return `--spacing-${parts.join("-")}`;
  if (col === "typography") return `--typography-${parts.join("-")}`;
  if (col === "shadows") return `--shadow-${parts.join("-")}`;

  // Fallback: --{collection-slug}-{path}
  const slug = col.replace(/\s+/g, "-");
  return `--${slug}-${parts.join("-")}`;
}

/**
 * Converts a Figma RGBA color value (0–1 channels) to a CSS hex string.
 * Alpha < 1 produces 8-digit hex.
 */
export function rgbaToHex(color: RgbaValue): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  return color.a < 1 ? `${hex}${toHex(color.a)}` : hex;
}

/**
 * Converts a resolved FigmaVariableValue to its CSS string representation.
 * - RgbaValue → hex
 * - number → px string (for spacing/radii) or raw number string
 * - VARIABLE_ALIAS (post-resolution) → var(--{cssVarName})
 * - string → as-is
 */
export function toCssValue(
  value: FigmaVariableValue,
  allCssVarNames: Map<string, string> // variableId → cssVarName
): string {
  if (typeof value === "object" && value !== null) {
    if ("type" in value && value.type === "VARIABLE_ALIAS") {
      // After one-level resolve this should be rare, but handle gracefully
      const cssVar = allCssVarNames.get(value.id);
      return cssVar ? `var(${cssVar})` : "unset";
    }
    // Must be RgbaValue
    return rgbaToHex(value as RgbaValue);
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return String(value);
}
