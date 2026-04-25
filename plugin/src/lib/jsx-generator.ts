/**
 * JSX Generator
 *
 * Converts a ScannedTree (from frame-scanner) into:
 *  - A formatted JSX string
 *  - A deduplicated list of import statements
 */

import type { ScannedNode, ScannedText, ScannedImage, ScannedIcon, ScannedTree } from "./frame-scanner";
import { layoutClasses } from "./tailwind-layout";

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

  // Icon / vector node
  if ("isIcon" in node) {
    const icon = node as ScannedIcon;
    return `${pad}<svg width={${icon.width}} height={${icon.height}} className="shrink-0" aria-hidden="true" />`;
  }

  // Text node
  if ("isText" in node) {
    const t = node as ScannedText;
    const cls = t.tag === "span" && t.bold ? ` className="font-semibold"` : "";
    return `${pad}<${t.tag}${cls}>${t.content}</${t.tag}>`;
  }

  // Image placeholder
  if ("isImage" in node) {
    const img = node as ScannedImage;
    return `${pad}<img src="" alt="${img.name}" width={${img.width}} height={${img.height}} className="w-full object-cover" />`;
  }

  // Layout frame — render as a div with Tailwind classes
  if ("isLayout" in node) {
    // Unwrap single-child frames that only contain an image — no div needed
    if (node.children.length === 1 && "isImage" in node.children[0]) {
      return renderNode(node.children[0], imports, indent);
    }

    const cls = layoutClasses(node.layout);
    const clsAttr = cls ? ` className="${cls}"` : "";
    const childrenStr = node.children
      .map(c => renderNode(c, imports, indent + 1))
      .filter(Boolean)
      .join("\n");

    if (!childrenStr) return "";

    return `${pad}<div${clsAttr}>\n${childrenStr}\n${pad}</div>`;
  }

  // Mapped shadcn/ui component — never apply internal Figma layout as className
  const { component, importPath, props, children } = node;
  addImport(imports, importPath, component);

  const propsStr = renderProps(props);
  const clsAttr = "";

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
