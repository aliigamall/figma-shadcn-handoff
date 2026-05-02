import type { RgbaValue, FigmaVariableValue } from "./types";

/** Sanitize a segment so it contains only characters valid in a CSS custom property name */
function sanitizeSegment(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")   // spaces → hyphens
    .replace(/,/g, "-")      // commas → hyphens (European decimals like "0,5" → "0-5")
    .replace(/[()]/g, "")    // strip parentheses
    .replace(/[^a-z0-9\-_]/g, "-") // any remaining invalid chars → hyphens
    .replace(/-+/g, "-")     // collapse consecutive hyphens
    .replace(/^-|-$/g, "");  // trim leading/trailing hyphens
}

export function toCssVarName(collection: string, path: string): string {
  const col = collection.toLowerCase().trim();
  const parts = path.split("/").map(sanitizeSegment);

  if (col === "semantic colors") {
    const [group, ...rest] = parts;
    if (group === "general") return `--${rest.join("-")}`;
    const name = rest.join("-");
    const prefix = `${group}-`;
    const stripped = name === group ? "" : name.startsWith(prefix) ? name.slice(prefix.length) : name;
    if (!stripped) return `--${group}`;
    return `--${group}-${stripped}`;
  }

  if (col === "raw colors" || col === "brand colors") return `--color-${parts.join("-")}`;
  if (col === "border radii") return `--radius-${parts.join("-")}`;
  if (col === "spacing" || col.startsWith("spacing ")) return `--spacing-${parts.join("-")}`;
  if (col === "typography") return `--typography-${parts.join("-")}`;
  if (col === "shadows") return `--shadow-${parts.join("-")}`;

  const slug = sanitizeSegment(col);
  return `--${slug}-${parts.join("-")}`;
}

export function rgbaToHex(color: RgbaValue): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  return color.a < 1 ? `${hex}${toHex(color.a)}` : hex;
}

export function toCssValue(
  value: FigmaVariableValue,
  allCssVarNames: Map<string, string>
): string {
  if (typeof value === "object" && value !== null) {
    if ("type" in value && value.type === "VARIABLE_ALIAS") {
      const cssVar = allCssVarNames.get(value.id);
      return cssVar ? `var(${cssVar})` : "unset";
    }
    return rgbaToHex(value as RgbaValue);
  }
  if (typeof value === "number") return value === 0 ? "0" : `${value}px`;
  if (typeof value === "string") return value;
  return String(value);
}
