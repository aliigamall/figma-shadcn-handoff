/**
 * JSX Generator
 *
 * Converts a ScannedTree (from frame-scanner) into:
 *  - A formatted JSX string
 *  - A deduplicated list of import statements
 */

import type { ScannedNode, ScannedFrame, ScannedTree } from "./frame-scanner";

// ─── Tailwind layout helpers ──────────────────────────────────────────────────

function gapClass(gap: number): string {
  const map: Record<number, string> = {
    0: "", 2: "gap-0.5", 4: "gap-1", 6: "gap-1.5", 8: "gap-2",
    10: "gap-2.5", 12: "gap-3", 16: "gap-4", 20: "gap-5", 24: "gap-6",
    32: "gap-8", 40: "gap-10", 48: "gap-12", 64: "gap-16",
  };
  return map[gap] ?? `gap-[${gap}px]`;
}

function paddingClasses(layout: ScannedNode["layout"]): string {
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

function paddingClass(prefix: string, value: number): string {
  const map: Record<number, string> = {
    2: "0.5", 4: "1", 6: "1.5", 8: "2", 10: "2.5", 12: "3",
    16: "4", 20: "5", 24: "6", 32: "8", 40: "10", 48: "12", 64: "16",
  };
  return map[value] ? `${prefix}-${map[value]}` : `${prefix}-[${value}px]`;
}

function layoutClasses(layout: ScannedNode["layout"]): string {
  if (layout.direction === "none") return "";
  const dir   = layout.direction === "horizontal" ? "flex-row" : "flex-col";
  const wrap  = layout.wrap ? "flex-wrap" : "";
  const gap   = gapClass(layout.gap);
  const pad   = paddingClasses(layout);
  return ["flex", dir, wrap, gap, pad].filter(Boolean).join(" ");
}

// ─── Import tracking ──────────────────────────────────────────────────────────

type ImportMap = Map<string, Set<string>>;

function addImport(imports: ImportMap, path: string, name: string) {
  if (!imports.has(path)) imports.set(path, new Set());
  imports.get(path)!.add(name);
}

function renderImports(imports: ImportMap): string {
  return Array.from(imports.entries())
    .map(([path, names]) => `import { ${Array.from(names).join(", ")} } from "${path}";`)
    .join("\n");
}

// ─── JSX rendering ───────────────────────────────────────────────────────────

function renderProps(props: ScannedNode["props"]): string {
  if (props.length === 0) return "";
  return " " + props
    .map(({ shadcnProp, value }) => {
      // Boolean-like values
      if (value === "true")  return shadcnProp;
      if (value === "false") return ``;
      // Default variant — omit (it's the default)
      if (value === "default") return "";
      return `${shadcnProp}="${value}"`;
    })
    .filter(Boolean)
    .join(" ");
}

function renderNode(
  node: ScannedTree,
  imports: ImportMap,
  indent: number
): string {
  const pad = "  ".repeat(indent);

  // Layout frame — render as a div with Tailwind classes
  if ("isLayout" in node) {
    const cls = layoutClasses(node.layout);
    const clsAttr = cls ? ` className="${cls}"` : "";
    const childrenStr = node.children
      .map(c => renderNode(c, imports, indent + 1))
      .join("\n");

    if (!childrenStr) return "";

    return node.children.length === 0
      ? `${pad}<div${clsAttr} />`
      : `${pad}<div${clsAttr}>\n${childrenStr}\n${pad}</div>`;
  }

  // Mapped shadcn/ui component
  const { component, importPath, props, children } = node;
  addImport(imports, importPath, component);

  const propsStr = renderProps(props);
  const cls = layoutClasses(node.layout);
  const clsAttr = cls ? ` className="${cls}"` : "";

  // Text children
  if (typeof children === "string" && children) {
    return `${pad}<${component}${propsStr}${clsAttr}>${children}</${component}>`;
  }

  // Node children
  if (Array.isArray(children) && children.length > 0) {
    const childrenStr = children
      .map(c => renderNode(c, imports, indent + 1))
      .join("\n");
    return `${pad}<${component}${propsStr}${clsAttr}>\n${childrenStr}\n${pad}</${component}>`;
  }

  // Self-closing
  return `${pad}<${component}${propsStr}${clsAttr} />`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GeneratedJSX {
  imports: string;
  jsx: string;
  /** All unique shadcn/ui components found */
  components: string[];
}

export function generateJSX(tree: ScannedTree): GeneratedJSX {
  const imports: ImportMap = new Map();
  const jsx = renderNode(tree, imports, 0);
  const components = Array.from(
    new Set(Array.from(imports.values()).flatMap(s => Array.from(s)))
  );

  return {
    imports: renderImports(imports),
    jsx,
    components,
  };
}
