import type { RgbaValue, FigmaVariableValue } from "./types";

export function toCssVarName(collection: string, path: string): string {
  const col = collection.toLowerCase().trim();
  const parts = path.split("/").map((p) => p.trim().toLowerCase().replace(/\s+/g, "-"));

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
  if (col === "spacing") return `--spacing-${parts.join("-")}`;
  if (col === "typography") return `--typography-${parts.join("-")}`;
  if (col === "shadows") return `--shadow-${parts.join("-")}`;

  const slug = col.replace(/\s+/g, "-");
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
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return String(value);
}
