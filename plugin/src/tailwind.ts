import type { FigmaVariable, FigmaVariableCollection } from "./lib/types";
import { toCssVarName } from "./lib/transform";

// Default Tailwind spacing scale: px value → scale token
const SPACING: Record<number, string> = {
  0: "0", 1: "px", 2: "0.5", 4: "1", 6: "1.5", 8: "2", 10: "2.5",
  12: "3", 14: "3.5", 16: "4", 20: "5", 24: "6", 28: "7", 32: "8",
  36: "9", 40: "10", 44: "11", 48: "12", 56: "14", 64: "16",
  80: "20", 96: "24", 112: "28", 128: "32", 160: "40", 192: "48",
};

// Tailwind border-radius scale: px value → suffix
const RADIUS: Record<number, string> = {
  0: "none", 2: "sm", 4: "", 6: "md", 8: "lg", 12: "xl", 16: "2xl", 24: "3xl", 9999: "full",
};

function spacingToken(val: number): string {
  const s = SPACING[Math.round(val)];
  return s !== undefined ? s : `[${Math.round(val)}px]`;
}

function radiusClass(val: number): string {
  const s = RADIUS[Math.round(val)];
  if (s === undefined) return `rounded-[${Math.round(val)}px]`;
  return s === "" ? "rounded" : `rounded-${s}`;
}

function resolveColorClass(
  node: SceneNode,
  property: "fills" | "strokes",
  prefix: "bg" | "text" | "border",
  variables: Record<string, FigmaVariable>,
  collections: Record<string, FigmaVariableCollection>
): string | null {
  // Prefer variable binding (exact token reference)
  const boundVars = (node as any).boundVariables as Record<string, any> | undefined;
  const bound = boundVars?.[property];
  if (bound) {
    const entry = Array.isArray(bound) ? bound[0] : bound;
    if (entry?.type === "VARIABLE_ALIAS") {
      const v = variables[entry.id];
      const col = v && collections[v.variableCollectionId];
      if (v && col) {
        const cssVar = toCssVarName(col.name, v.name);
        return `${prefix}-[var(${cssVar})]`;
      }
    }
  }

  // Fallback: first solid fill as arbitrary hex
  const paints = (node as any)[property] as Paint[] | undefined;
  if (Array.isArray(paints) && paints.length > 0) {
    const paint = paints[0];
    if (paint.type === "SOLID" && paint.visible !== false) {
      const { r, g, b } = (paint as SolidPaint).color;
      const h = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
      return `${prefix}-[#${h(r)}${h(g)}${h(b)}]`;
    }
  }

  return null;
}

export function getTailwindClasses(
  node: SceneNode,
  variables: Record<string, FigmaVariable>,
  collections: Record<string, FigmaVariableCollection>
): string {
  const cls: string[] = [];

  // ── Text node ────────────────────────────────────────────────────────────
  if (node.type === "TEXT") {
    const color = resolveColorClass(node, "fills", "text", variables, collections);
    if (color) cls.push(color);

    if (typeof node.fontSize === "number") {
      const SIZE: Record<number, string> = {
        12: "text-xs", 14: "text-sm", 16: "text-base", 18: "text-lg",
        20: "text-xl", 24: "text-2xl", 30: "text-3xl", 36: "text-4xl",
        48: "text-5xl", 60: "text-6xl", 72: "text-7xl",
      };
      cls.push(SIZE[Math.round(node.fontSize)] ?? `text-[${Math.round(node.fontSize)}px]`);
    }

    if (typeof node.fontWeight === "number") {
      const WEIGHT: Record<number, string> = {
        100: "font-thin", 200: "font-extralight", 300: "font-light",
        400: "font-normal", 500: "font-medium", 600: "font-semibold",
        700: "font-bold", 800: "font-extrabold", 900: "font-black",
      };
      const w = WEIGHT[node.fontWeight];
      if (w && w !== "font-normal") cls.push(w);
    }

    const ALIGN: Record<string, string> = {
      LEFT: "", CENTER: "text-center", RIGHT: "text-right", JUSTIFIED: "text-justify",
    };
    const align = ALIGN[node.textAlignHorizontal];
    if (align) cls.push(align);

    return cls.join(" ");
  }

  // ── Frame / component / instance / rectangle ─────────────────────────────
  const bg = resolveColorClass(node, "fills", "bg", variables, collections);
  if (bg) cls.push(bg);

  // Border
  const strokes = (node as any).strokes as Paint[] | undefined;
  if (Array.isArray(strokes) && strokes.length > 0) {
    cls.push("border");
    const borderColor = resolveColorClass(node, "strokes", "border", variables, collections);
    if (borderColor) cls.push(borderColor);
    const sw = (node as any).strokeWeight;
    if (typeof sw === "number" && sw !== 1) cls.push(`border-[${sw}px]`);
  }

  // Corner radius
  if ("cornerRadius" in node) {
    const radius = (node as any).cornerRadius as number | typeof figma.mixed;
    if (typeof radius === "number" && radius > 0) {
      const boundRadius = (node as any).boundVariables?.cornerRadius;
      if (boundRadius?.type === "VARIABLE_ALIAS") {
        const v = variables[boundRadius.id];
        const col = v && collections[v.variableCollectionId];
        if (v && col) {
          const cssVar = toCssVarName(col.name, v.name);
          cls.push(`rounded-[var(${cssVar})]`);
        }
      } else {
        cls.push(radiusClass(radius));
      }
    }
  }

  // Auto layout
  if ("layoutMode" in node) {
    const frame = node as FrameNode;

    if (frame.layoutMode !== "NONE") {
      cls.push("flex");
      if (frame.layoutMode === "VERTICAL") cls.push("flex-col");

      const JUSTIFY: Record<string, string> = {
        MIN: "", CENTER: "justify-center", MAX: "justify-end", SPACE_BETWEEN: "justify-between",
      };
      const justify = JUSTIFY[frame.primaryAxisAlignItems];
      if (justify) cls.push(justify);

      const ALIGN: Record<string, string> = {
        MIN: "", CENTER: "items-center", MAX: "items-end", BASELINE: "items-baseline",
      };
      const align = ALIGN[frame.counterAxisAlignItems];
      if (align) cls.push(align);

      if (frame.itemSpacing > 0) cls.push(`gap-${spacingToken(frame.itemSpacing)}`);

      // Padding — collapse to shorthand where possible
      const { paddingTop: pt, paddingRight: pr, paddingBottom: pb, paddingLeft: pl } = frame;
      if (pt === pb && pl === pr && pt === pl) {
        if (pt > 0) cls.push(`p-${spacingToken(pt)}`);
      } else {
        if (pt === pb && pt > 0) cls.push(`py-${spacingToken(pt)}`);
        else {
          if (pt > 0) cls.push(`pt-${spacingToken(pt)}`);
          if (pb > 0) cls.push(`pb-${spacingToken(pb)}`);
        }
        if (pl === pr && pl > 0) cls.push(`px-${spacingToken(pl)}`);
        else {
          if (pl > 0) cls.push(`pl-${spacingToken(pl)}`);
          if (pr > 0) cls.push(`pr-${spacingToken(pr)}`);
        }
      }
    }

    // Size
    if (frame.layoutSizingHorizontal === "FILL") cls.push("w-full");
    else if (frame.layoutSizingHorizontal === "HUG") cls.push("w-fit");
    else if (frame.layoutMode === "NONE" && frame.width > 0) cls.push(`w-[${Math.round(frame.width)}px]`);

    if (frame.layoutSizingVertical === "FILL") cls.push("h-full");
    else if (frame.layoutSizingVertical === "HUG") cls.push("h-fit");
    else if (frame.layoutMode === "NONE" && frame.height > 0) cls.push(`h-[${Math.round(frame.height)}px]`);
  }

  return cls.join(" ");
}
