/**
 * Shared Tailwind layout class helpers.
 * Used by both jsx-generator and html-generator.
 */

import type { ScannedNode } from "./frame-scanner";

export function gapClass(gap: number): string {
  const map: Record<number, string> = {
    0: "", 2: "gap-0.5", 4: "gap-1", 6: "gap-1.5", 8: "gap-2",
    10: "gap-2.5", 12: "gap-3", 16: "gap-4", 20: "gap-5", 24: "gap-6",
    32: "gap-8", 40: "gap-10", 48: "gap-12", 64: "gap-16",
  };
  return map[gap] ?? `gap-[${gap}px]`;
}

export function paddingClass(prefix: string, value: number): string {
  const map: Record<number, string> = {
    2: "0.5", 4: "1", 6: "1.5", 8: "2", 10: "2.5", 12: "3",
    16: "4", 20: "5", 24: "6", 32: "8", 40: "10", 48: "12", 64: "16",
  };
  return map[value] ? `${prefix}-${map[value]}` : `${prefix}-[${value}px]`;
}

export function paddingClasses(layout: ScannedNode["layout"]): string {
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

export function layoutClasses(layout: ScannedNode["layout"]): string {
  if (layout.direction === "none") return "";
  const dir  = layout.direction === "horizontal" ? "flex-row" : "flex-col";
  const wrap = layout.wrap ? "flex-wrap" : "";
  const gap  = gapClass(layout.gap);
  const pad  = paddingClasses(layout);
  return ["flex", dir, wrap, gap, pad].filter(Boolean).join(" ");
}
