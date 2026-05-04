/**
 * JSX Generator
 *
 * Converts a ScannedTree (from frame-scanner) into:
 *  - A formatted JSX string
 *  - A deduplicated list of import statements
 *
 * Renderers for individual components live in components/*.ts
 * and are dispatched via RENDERER_MAP from component-registry.ts.
 */

import type { ScannedNode, ScannedFrame, ScannedText, ScannedImage, ScannedIcon, ScannedInlineText, ScannedTree } from "./frame-scanner";
import {
  type ImportMap,
  addImport,
  PREAMBLE_KEY,
  INSTALL_KEY,
  CSS_KEY,
  layoutClasses,
  visualClasses,
  textVisualClasses,
  renderProps,
  findFirstChartNode,
} from "./render-utils";
import { RENDERER_MAP } from "./component-registry";
import { renderInputOTPGroup } from "./components/inputs";

// ─── Import rendering ─────────────────────────────────────────────────────────

const DIRECTIVE_KEY  = "__directive__";
const RAW_IMPORT_KEY = "__raw_import__";

function renderImports(imports: ImportMap): string {
  const directives  = imports.get(DIRECTIVE_KEY)  ? Array.from(imports.get(DIRECTIVE_KEY)!).join("\n")  : "";
  const rawImports  = imports.get(RAW_IMPORT_KEY) ? Array.from(imports.get(RAW_IMPORT_KEY)!).join("\n") : "";
  const namedImports = Array.from(imports.entries())
    .filter(([path]) => !path.startsWith("__"))
    .map(([path, names]) => `import { ${Array.from(names).join(", ")} } from "${path}";`)
    .join("\n");
  return [directives, rawImports, namedImports].filter(Boolean).join("\n\n");
}

// ─── Table grid helpers ───────────────────────────────────────────────────────

const TABLE_CELL_COMPONENTS      = new Set(["TableHead", "TableCell"]);
const DATA_TABLE_CELL_COMPONENTS = new Set(["__data_table_header__", "__data_table_cell__"]);

function isTableCellNode(node: ScannedTree): boolean {
  return "component" in node && TABLE_CELL_COMPONENTS.has((node as ScannedNode).component);
}

function isDataTableCellNode(node: ScannedTree): boolean {
  return "component" in node && DATA_TABLE_CELL_COMPONENTS.has((node as ScannedNode).component);
}

function isDataTableGrid(node: ScannedFrame): boolean {
  return node.layout.direction === "grid" &&
    node.layout.columns > 0 &&
    node.children.some(isDataTableCellNode);
}

function isTableGrid(node: ScannedFrame): boolean {
  return node.layout.direction === "grid" &&
    node.layout.columns > 0 &&
    node.children.some(isTableCellNode);
}

function renderTableGrid(node: ScannedFrame, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const { columns } = node.layout;

  const rows: ScannedTree[][] = [];
  for (let i = 0; i < node.children.length; i += columns) {
    rows.push(node.children.slice(i, i + columns));
  }

  const isAllHeads = (row: ScannedTree[]) =>
    row.every(c => "component" in c && (c as ScannedNode).component === "TableHead");
  const headerRows: ScannedTree[][] = [];
  while (rows.length > 0 && isAllHeads(rows[0])) headerRows.push(rows.shift()!);

  addImport(imports, "@/components/ui/table", "Table");
  addImport(imports, "@/components/ui/table", "TableBody");
  addImport(imports, "@/components/ui/table", "TableRow");
  if (headerRows.length > 0) addImport(imports, "@/components/ui/table", "TableHeader");

  const renderRow = (row: ScannedTree[], ri: number) => {
    const rp = "  ".repeat(ri);
    const cells = row.map(c => renderNode(c, imports, ri + 1)).join("\n");
    return `${rp}<TableRow>\n${cells}\n${rp}</TableRow>`;
  };

  const parts: string[] = [];
  if (headerRows.length > 0) {
    const inner = headerRows.map(r => renderRow(r, indent + 2)).join("\n");
    parts.push(`${pad}  <TableHeader>\n${inner}\n${pad}  </TableHeader>`);
  }
  const bodyInner = rows.map(r => renderRow(r, indent + 2)).join("\n");
  parts.push(`${pad}  <TableBody>\n${bodyInner}\n${pad}  </TableBody>`);

  return `${pad}<Table>\n${parts.join("\n")}\n${pad}</Table>`;
}

// ─── Accordion helpers ────────────────────────────────────────────────────────

function isAccordionTrigger(node: ScannedTree): boolean {
  return "component" in node && (node as ScannedNode).component === "AccordionTrigger";
}

function isAccordionContent(node: ScannedTree): boolean {
  return "component" in node && (node as ScannedNode).component === "AccordionContent";
}

function isAccordionContainer(node: ScannedFrame): boolean {
  return node.layout.direction === "vertical" &&
    node.children.some(isAccordionTrigger);
}

function renderAccordion(node: ScannedFrame, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const ip  = "  ".repeat(indent + 1);

  addImport(imports, "@/components/ui/accordion", "Accordion");
  addImport(imports, "@/components/ui/accordion", "AccordionItem");

  const items: Array<{ trigger: ScannedTree; content: ScannedTree | null }> = [];
  const children = node.children;
  let i = 0;
  while (i < children.length) {
    if (isAccordionTrigger(children[i])) {
      const next = children[i + 1];
      const hasContent = next != null && isAccordionContent(next);
      items.push({ trigger: children[i], content: hasContent ? next : null });
      i += hasContent ? 2 : 1;
    } else {
      i++;
    }
  }

  const itemsJsx = items.map((item, idx) => {
    const triggerJsx = renderNode(item.trigger, imports, indent + 2);
    const contentJsx = item.content ? "\n" + renderNode(item.content, imports, indent + 2) : "";
    return `${ip}<AccordionItem value="item-${idx + 1}">\n${triggerJsx}${contentJsx}\n${ip}</AccordionItem>`;
  }).join("\n");

  return `${pad}<Accordion type="single" collapsible>\n${itemsJsx}\n${pad}</Accordion>`;
}

// ─── ButtonGroup helpers ──────────────────────────────────────────────────────

function isButtonGroupContainer(node: ScannedFrame): boolean {
  if (node.layout.direction !== "horizontal") return false;
  const mappedChildren = node.children.filter(c => "component" in c);
  return (
    mappedChildren.length >= 2 &&
    mappedChildren.every(c => (c as ScannedNode).component === "Button") &&
    node.children.every(c => "component" in c)
  );
}

function renderButtonGroup(node: ScannedFrame, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);

  addImport(imports, "@/components/ui/button-group", "ButtonGroup");

  const buttonsJsx = node.children
    .map(c => renderNode(c, imports, indent + 1))
    .filter(Boolean)
    .join("\n");

  return `${pad}<ButtonGroup>\n${buttonsJsx}\n${pad}</ButtonGroup>`;
}

// ─── Core renderNode ──────────────────────────────────────────────────────────

function renderNode(
  node: ScannedTree,
  imports: ImportMap,
  indent: number,
): string {
  const pad = "  ".repeat(indent);

  // Inline text
  if ("isInlineText" in node) {
    return `${pad}${(node as ScannedInlineText).content}`;
  }

  // Lucide icon
  if ("isIcon" in node) {
    const icon = node as ScannedIcon;
    addImport(imports, "lucide-react", icon.lucideName);
    return `${pad}<${icon.lucideName} size={${Math.max(icon.width, icon.height)}} className="shrink-0" />`;
  }

  // Text node
  if ("isText" in node) {
    const t = node as ScannedText;
    const visualCls = textVisualClasses(t.align, t.color, t.uppercase);
    const boldCls   = t.tag === "span" && t.bold ? "font-semibold" : "";
    const cls = [boldCls, visualCls].filter(Boolean).join(" ");
    return `${pad}<${t.tag}${cls ? ` className="${cls}"` : ""}>${t.content}</${t.tag}>`;
  }

  // Image placeholder
  if ("isImage" in node) {
    const img = node as ScannedImage;
    return `${pad}<img src="" alt="${img.name}" width={${img.width}} height={${img.height}} className="w-full object-cover" />`;
  }

  // Layout frame
  if ("isLayout" in node) {
    // Unwrap single-child frames that only contain an image
    if (node.children.length === 1 && "isImage" in node.children[0]) {
      return renderNode(node.children[0], imports, indent);
    }

    // CSS grid containing data table cells → emit full TanStack DataTable template
    if (isDataTableGrid(node)) {
      // Delegate to the data table renderer via RENDERER_MAP
      const renderer = RENDERER_MAP["__data_table_cell__"];
      if (renderer) return renderer(node as unknown as ScannedNode, imports, indent, renderNode);
      return "";
    }

    // CSS grid containing basic table cells → emit a proper <Table> structure
    if (isTableGrid(node)) {
      return renderTableGrid(node, imports, indent);
    }

    // Vertical stack of AccordionTrigger/Content → emit full <Accordion> structure
    if (isAccordionContainer(node)) {
      return renderAccordion(node, imports, indent);
    }

    // Horizontal frame of all Button nodes → emit <ButtonGroup>
    if (isButtonGroupContainer(node)) {
      return renderButtonGroup(node, imports, indent);
    }

    // Frame of Input OTP slots → emit <InputOTP>
    const otpSlots = node.children.filter(
      c => "component" in c && (c as ScannedNode).component === "__input_otp__"
    ) as ScannedNode[];
    if (otpSlots.length > 0 && otpSlots.length === node.children.length) {
      return renderInputOTPGroup(otpSlots, imports, indent);
    }

    // Frame wrapping a chart → render just the chart
    const chartDescendant = findFirstChartNode(node.children);
    if (chartDescendant) {
      return renderNode(chartDescendant, imports, indent);
    }

    const layoutCls = layoutClasses(node.layout);
    const visualCls = visualClasses(node.visual);
    const cls = [layoutCls, visualCls].filter(Boolean).join(" ");
    const clsAttr = cls ? ` className="${cls}"` : "";
    const childrenStr = node.children
      .map(c => renderNode(c, imports, indent + 1))
      .filter(Boolean)
      .join("\n");

    if (!childrenStr) return "";

    return `${pad}<div${clsAttr}>\n${childrenStr}\n${pad}</div>`;
  }

  // Mapped shadcn/ui component — dispatch to custom renderer or render generically
  const sn = node as ScannedNode;

  const customRenderer = RENDERER_MAP[sn.component];
  if (customRenderer) return customRenderer(sn, imports, indent, renderNode);

  // Generic component rendering
  const { component, importPath, props, children } = sn;
  addImport(imports, importPath, component);

  const propsStr = renderProps(props);
  const clsAttr  = "";

  if (typeof children === "string" && children) {
    return `${pad}<${component}${propsStr}${clsAttr}>${children}</${component}>`;
  }

  if (Array.isArray(children) && children.length > 0) {
    const childrenStr = children
      .map(c => renderNode(c, imports, indent + 1))
      .join("\n");
    return `${pad}<${component}${propsStr}${clsAttr}>\n${childrenStr}\n${pad}</${component}>`;
  }

  return `${pad}<${component}${propsStr}${clsAttr} />`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GeneratedJSX {
  install: string;
  imports: string;
  css: string;
  jsx: string;
  components: string[];
}

export function generateJSX(tree: ScannedTree): GeneratedJSX {
  const imports: ImportMap = new Map();
  const rawJsx = renderNode(tree, imports, 0);

  const preambleStr = imports.get(PREAMBLE_KEY)
    ? Array.from(imports.get(PREAMBLE_KEY)!).join("\n\n") : "";
  const install = imports.get(INSTALL_KEY)
    ? Array.from(imports.get(INSTALL_KEY)!).join("\n") : "";
  const css = imports.get(CSS_KEY)
    ? Array.from(imports.get(CSS_KEY)!).join("\n\n") : "";

  const jsx = [preambleStr, rawJsx].filter(Boolean).join("\n\n");

  const components = Array.from(new Set(
    Array.from(imports.entries())
      .filter(([p]) => !p.startsWith("__"))
      .flatMap(([, names]) => Array.from(names))
  ));

  return { install, imports: renderImports(imports), css, jsx, components };
}
