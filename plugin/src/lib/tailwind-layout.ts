/**
 * Shared Tailwind layout class helpers.
 * Used by both jsx-generator and html-generator.
 */

import type { Layout } from "./frame-scanner";

// ─── Gap ──────────────────────────────────────────────────────────────────────

const GAP_MAP: Record<number, string> = {
  0: "", 2: "0.5", 4: "1", 6: "1.5", 8: "2", 10: "2.5", 12: "3",
  16: "4", 20: "5", 24: "6", 32: "8", 40: "10", 48: "12", 64: "16",
};

export function gapClass(gap: number):  string { return GAP_MAP[gap] ? `gap-${GAP_MAP[gap]}`   : gap ? `gap-[${gap}px]`   : ""; }
export function gapXClass(gap: number): string { return GAP_MAP[gap] ? `gap-x-${GAP_MAP[gap]}` : gap ? `gap-x-[${gap}px]` : ""; }
export function gapYClass(gap: number): string { return GAP_MAP[gap] ? `gap-y-${GAP_MAP[gap]}` : gap ? `gap-y-[${gap}px]` : ""; }

// ─── Padding ──────────────────────────────────────────────────────────────────

export function paddingClass(prefix: string, value: number): string {
  const map: Record<number, string> = {
    2: "0.5", 4: "1", 6: "1.5", 8: "2", 10: "2.5", 12: "3",
    16: "4", 20: "5", 24: "6", 32: "8", 40: "10", 48: "12", 64: "16",
  };
  return map[value] ? `${prefix}-${map[value]}` : `${prefix}-[${value}px]`;
}

export function paddingClasses(layout: Layout): string {
  const { paddingTop: t, paddingRight: r, paddingBottom: b, paddingLeft: l } = layout;
  if (t === 0 && r === 0 && b === 0 && l === 0) return "";
  if (t === b && l === r && t === l) return paddingClass("p", t);
  const parts: string[] = [];
  if (t === b && t > 0) parts.push(paddingClass("py", t));
  else { if (t > 0) parts.push(paddingClass("pt", t)); if (b > 0) parts.push(paddingClass("pb", b)); }
  if (l === r && l > 0) parts.push(paddingClass("px", l));
  else { if (l > 0) parts.push(paddingClass("pl", l)); if (r > 0) parts.push(paddingClass("pr", r)); }
  return parts.join(" ");
}

// ─── Grid columns ─────────────────────────────────────────────────────────────

function gridColsClass(cols: number): string {
  return cols >= 1 && cols <= 12
    ? `grid-cols-${cols}`
    : cols > 0 ? `grid-cols-[repeat(${cols},minmax(0,1fr))]` : "";
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export function layoutClasses(layout: Layout): string {
  const pad = paddingClasses(layout);

  // CSS Grid
  if (layout.direction === "grid") {
    const cols   = gridColsClass(layout.columns);
    const gapStr = layout.gap === layout.rowGap
      ? gapClass(layout.gap)
      : [gapXClass(layout.gap), gapYClass(layout.rowGap)].filter(Boolean).join(" ");
    return ["grid", cols, gapStr, pad].filter(Boolean).join(" ");
  }

  // Flex
  if (layout.direction === "none") return "";
  const dir  = layout.direction === "horizontal" ? "flex-row" : "flex-col";
  const wrap = layout.wrap ? "flex-wrap" : "";
  // Separate row/column gap when flex-wrap has a different row gap
  const gapStr = layout.wrap && layout.rowGap && layout.rowGap !== layout.gap
    ? [gapXClass(layout.gap), gapYClass(layout.rowGap)].filter(Boolean).join(" ")
    : gapClass(layout.gap);
  return ["flex", dir, wrap, gapStr, pad].filter(Boolean).join(" ");
}
