/**
 * Shared types, constants, and helper functions for JSX generation.
 * Used by component group files and jsx-generator.ts.
 */

import type { ScannedNode, ScannedFrame, ScannedText, ScannedImage, ScannedIcon, ScannedInlineText, ScannedTree } from "./frame-scanner";

// ─── Re-export visual helpers from tailwind-layout ───────────────────────────
export { layoutClasses, visualClasses, textVisualClasses } from "./tailwind-layout";

// ─── Import tracking ─────────────────────────────────────────────────────────

export type ImportMap = Map<string, Set<string>>;

export function addImport(imports: ImportMap, path: string, name: string): void {
  if (!imports.has(path)) imports.set(path, new Set());
  imports.get(path)!.add(name);
}

export const PREAMBLE_KEY   = "__preamble__";
export const INSTALL_KEY    = "__install__";
export const CSS_KEY        = "__css__";
export const DIRECTIVE_KEY  = "__directive__";
export const RAW_IMPORT_KEY = "__raw_import__";

// ─── Component definition types ──────────────────────────────────────────────

export interface PropDef {
  /** shadcn/ui prop name (e.g. "variant", "size") */
  shadcnProp: string;
  /** Maps Obra variant option → shadcn prop value. If omitted, value passes through as-is (lowercased). */
  values?: Record<string, string | null>;
}

export interface SlotDef {
  /** Obra TEXT property name (exact key before '#'). If omitted, falls back to scanChildren. */
  key?: string;
  /** shadcn sub-component JSX name */
  component: string;
  /** Import path for the sub-component */
  importPath: string;
  /** If the named key isn't found as a component property, scan the node's children tree for the next unused TEXT layer */
  scanChildren?: boolean;
}

export interface ComponentEntry {
  /** shadcn/ui JSX component name */
  component: string;
  /** Import path */
  importPath: string;
  /** Obra prop key (before '#') → prop definition */
  props?: Record<string, PropDef>;
  /** Obra TEXT prop key whose value becomes JSX children */
  children?: string;
  /** Named TEXT properties each wrapped in a specific sub-component */
  slots?: SlotDef[];
  /** Obra prop keys to skip when generating JSX */
  ignore?: string[];
}

// ─── RenderFn type ────────────────────────────────────────────────────────────

export type RenderFn = (
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
) => string;

// ─── ComponentGroup interface ─────────────────────────────────────────────────

export interface ComponentGroup {
  defs: Record<string, ComponentEntry>;
  renderers?: Record<string, RenderFn>;
}

// ─── Common value maps ────────────────────────────────────────────────────────

export const VARIANT_MAP: Record<string, string> = {
  Primary:     "default",
  Secondary:   "secondary",
  Outline:     "outline",
  Ghost:       "ghost",
  Destructive: "destructive",
};

export const SIZE_MAP: Record<string, string> = {
  Default:      "default",
  Regular:      "default",
  Large:        "lg",
  Small:        "sm",
  Mini:         "xs",
  "Extra Large":"2xl",
};

export const CHECKED_MAP: Record<string, string> = {
  True:          "true",
  False:         "false",
  Indeterminate: "indeterminate",
};

// ─── Tree traversal helpers ───────────────────────────────────────────────────

/** Recursively collect all ScannedText content strings from a tree */
export function collectTexts(nodes: ScannedTree[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if ("isText" in n) { out.push((n as ScannedText).content); continue; }
    if ("isLayout" in n) out.push(...collectTexts((n as ScannedFrame).children));
    if ("component" in n && Array.isArray((n as ScannedNode).children))
      out.push(...collectTexts((n as ScannedNode).children as ScannedTree[]));
  }
  return out;
}

/** Recursively collect Button ScannedNodes */
export function collectButtons(nodes: ScannedTree[]): ScannedNode[] {
  const out: ScannedNode[] = [];
  for (const n of nodes) {
    if ("component" in n) {
      const sn = n as ScannedNode;
      if (sn.component === "Button") { out.push(sn); continue; }
      if (Array.isArray(sn.children)) out.push(...collectButtons(sn.children as ScannedTree[]));
    }
    if ("isLayout" in n) out.push(...collectButtons((n as ScannedFrame).children));
  }
  return out;
}

/** Recursively find the first ScannedIcon and return its Lucide name */
export function findIconChild(children: string | ScannedTree[]): string | null {
  if (typeof children === "string") return null;
  for (const c of children as ScannedTree[]) {
    if ("isIcon"   in c) return (c as ScannedIcon).lucideName;
    if ("isLayout" in c) { const r = findIconChild((c as ScannedFrame).children); if (r) return r; }
    if ("component" in c) { const r = findIconChild((c as ScannedNode).children as ScannedTree[]); if (r) return r; }
  }
  return null;
}

/** Return the first text string found anywhere in a children tree */
export function findFirstText(children: string | ScannedTree[]): string | null {
  if (typeof children === "string") return children || null;
  for (const c of children as ScannedTree[]) {
    if ("isText" in c) return (c as ScannedText).content || null;
    if ("isInlineText" in c) return (c as ScannedInlineText).content || null;
    if ("isLayout" in c) {
      const found = findFirstText((c as ScannedFrame).children);
      if (found) return found;
    } else if ("component" in c) {
      const found = findFirstText((c as ScannedNode).children as ScannedTree[]);
      if (found) return found;
    }
  }
  return null;
}

/** Collect all text strings found anywhere in a children tree, in order */
export function findAllTexts(children: string | ScannedTree[]): string[] {
  if (typeof children === "string") return children ? [children] : [];
  const out: string[] = [];
  for (const c of children as ScannedTree[]) {
    if ("isText" in c)       { if ((c as ScannedText).content)       out.push((c as ScannedText).content); }
    else if ("isInlineText" in c) { if ((c as ScannedInlineText).content) out.push((c as ScannedInlineText).content); }
    else if ("isLayout" in c)     out.push(...findAllTexts((c as ScannedFrame).children));
    else if ("component" in c)    out.push(...findAllTexts((c as ScannedNode).children as ScannedTree[]));
  }
  return out;
}

/** Find all __input_decoration__ ScannedNodes anywhere in the children tree */
export function findDecorationNodes(children: string | ScannedTree[]): ScannedNode[] {
  if (typeof children === "string") return [];
  const result: ScannedNode[] = [];
  for (const c of children as ScannedTree[]) {
    if ("component" in c && (c as ScannedNode).component === "__input_decoration__") {
      result.push(c as ScannedNode);
    } else if ("isLayout" in c) {
      result.push(...findDecorationNodes((c as ScannedFrame).children));
    } else if ("component" in c) {
      result.push(...findDecorationNodes((c as ScannedNode).children as ScannedTree[]));
    }
  }
  return result;
}

/** Find first chart ScannedNode in a tree */
export function findFirstChartNode(nodes: ScannedTree[]): ScannedNode | null {
  const CHART_COMPONENT_PREFIX = "__chart_";
  for (const n of nodes) {
    if ("component" in n && (n as ScannedNode).component.startsWith(CHART_COMPONENT_PREFIX)) {
      return n as ScannedNode;
    }
    if ("isLayout" in n) {
      const found = findFirstChartNode((n as ScannedFrame).children);
      if (found) return found;
    }
  }
  return null;
}

// ─── Props rendering ──────────────────────────────────────────────────────────

export function renderProps(props: ScannedNode["props"]): string {
  if (props.length === 0) return "";
  return " " + props
    .map(({ shadcnProp, value }) => {
      if (value === "true")  return shadcnProp;
      if (value === "false") return ``;
      if (value === "default") return "";
      return `${shadcnProp}="${value}"`;
    })
    .filter(Boolean)
    .join(" ");
}

// ─── JS key helper ────────────────────────────────────────────────────────────

export function toJsKey(label: string): string {
  const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/, "");
  return key || "value";
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

export const CHART_MONTHS = ["January", "February", "March", "April", "May", "June"];
export const CHART_VALUES = [
  [186, 305, 237, 73, 209, 214],
  [80, 200, 120, 190, 130, 140],
];

export const FALLBACK_SERIES = ["desktop", "mobile"];

export function extractSeries(legendLabels: string[], count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(legendLabels[i] ?? FALLBACK_SERIES[i] ?? `series${i + 1}`);
  }
  return result;
}

export const CHART_CSS_VARS = `:root {\n  --chart-1: oklch(0.646 0.222 41.116);\n  --chart-2: oklch(0.6 0.118 184.704);\n  --chart-3: oklch(0.398 0.07 227.392);\n  --chart-4: oklch(0.828 0.189 84.429);\n  --chart-5: oklch(0.769 0.188 70.08);\n}\n\n.dark {\n  --chart-1: oklch(0.488 0.243 264.376);\n  --chart-2: oklch(0.696 0.17 162.48);\n  --chart-3: oklch(0.769 0.188 70.08);\n  --chart-4: oklch(0.627 0.265 303.9);\n  --chart-5: oklch(0.645 0.246 16.439);\n}`;
