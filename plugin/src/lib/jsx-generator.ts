/**
 * JSX Generator
 *
 * Converts a ScannedTree (from frame-scanner) into:
 *  - A formatted JSX string
 *  - A deduplicated list of import statements
 */

import type { ScannedNode, ScannedFrame, ScannedText, ScannedImage, ScannedIcon, ScannedInlineText, ScannedTree } from "./frame-scanner";
import { layoutClasses, visualClasses, textVisualClasses } from "./tailwind-layout";

// ─── Import tracking ──────────────────────────────────────────────────────────

type ImportMap = Map<string, Set<string>>;

function addImport(imports: ImportMap, path: string, name: string) {
  if (!imports.has(path)) imports.set(path, new Set());
  imports.get(path)!.add(name);
}

const PREAMBLE_KEY = "__preamble__";
const INSTALL_KEY  = "__install__";
const CSS_KEY      = "__css__";

function renderImports(imports: ImportMap): string {
  return Array.from(imports.entries())
    .filter(([path]) => !path.startsWith("__"))
    .map(([path, names]) => `import { ${Array.from(names).join(", ")} } from "${path}";`)
    .join("\n");
}

// ─── Table grid helpers ───────────────────────────────────────────────────────

const TABLE_CELL_COMPONENTS = new Set(["TableHead", "TableCell"]);

function isTableCellNode(node: ScannedTree): boolean {
  return "component" in node && TABLE_CELL_COMPONENTS.has((node as ScannedNode).component);
}

function isTableGrid(node: ScannedFrame): boolean {
  return node.layout.direction === "grid" &&
    node.layout.columns > 0 &&
    node.children.some(isTableCellNode);
}

function renderTableGrid(node: ScannedFrame, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const { columns } = node.layout;

  // Chunk flat children into rows
  const rows: ScannedTree[][] = [];
  for (let i = 0; i < node.children.length; i += columns) {
    rows.push(node.children.slice(i, i + columns));
  }

  // Leading rows where every cell is a TableHead → <TableHeader>
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

  // Group children: each AccordionTrigger + optional following AccordionContent = one item
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

// ─── AlertDialog helpers ──────────────────────────────────────────────────────

/** Recursively collect all ScannedText nodes from a tree */
function collectTexts(nodes: ScannedTree[]): string[] {
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
function collectButtons(nodes: ScannedTree[]): ScannedNode[] {
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

function renderAlertDialog(node: ScannedNode, imports: ImportMap, indent: number): string {
  const p0 = "  ".repeat(indent);
  const p1 = "  ".repeat(indent + 1);
  const p2 = "  ".repeat(indent + 2);
  const p3 = "  ".repeat(indent + 3);
  const p4 = "  ".repeat(indent + 4);

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const texts   = collectTexts(children);
  const buttons = collectButtons(children);

  const title       = texts[0]  ?? "Are you absolutely sure?";
  const description = texts[1]  ?? "This action cannot be undone.";

  // Heuristic: the destructive/primary button is the action; the ghost/outline is cancel
  const isCancel = (b: ScannedNode) =>
    b.props.some(p => p.shadcnProp === "variant" && ["outline", "ghost", "secondary"].includes(p.value));
  const cancelBtn = buttons.find(isCancel) ?? buttons[1];
  const actionBtn = buttons.find(b => b !== cancelBtn) ?? buttons[0];
  const cancelLabel = typeof cancelBtn?.children === "string" ? cancelBtn.children : "Cancel";
  const actionLabel = typeof actionBtn?.children === "string" ? actionBtn.children : "Continue";

  const cancelVariant = cancelBtn?.props.find(p => p.shadcnProp === "variant")?.value;
  const actionVariant = actionBtn?.props.find(p => p.shadcnProp === "variant")?.value;

  const cancelProps = cancelVariant && cancelVariant !== "default" ? ` variant="${cancelVariant}"` : "";
  const actionProps = actionVariant && actionVariant !== "default" ? ` variant="${actionVariant}"` : "";

  const propsStr = renderProps(node.props);

  ["AlertDialog","AlertDialogTrigger","AlertDialogContent",
   "AlertDialogHeader","AlertDialogTitle","AlertDialogDescription",
   "AlertDialogFooter","AlertDialogCancel","AlertDialogAction"]
    .forEach(n => addImport(imports, "@/components/ui/alert-dialog", n));
  addImport(imports, "@/components/ui/button", "Button");

  return [
    `${p0}<AlertDialog${propsStr}>`,
    `${p1}<AlertDialogTrigger asChild>`,
    `${p2}<Button variant="outline">Open</Button>`,
    `${p1}</AlertDialogTrigger>`,
    `${p1}<AlertDialogContent>`,
    `${p2}<AlertDialogHeader>`,
    `${p3}<AlertDialogTitle>${title}</AlertDialogTitle>`,
    `${p3}<AlertDialogDescription>${description}</AlertDialogDescription>`,
    `${p2}</AlertDialogHeader>`,
    `${p2}<AlertDialogFooter>`,
    `${p3}<AlertDialogCancel${cancelProps}>${cancelLabel}</AlertDialogCancel>`,
    `${p3}<AlertDialogAction${actionProps}>${actionLabel}</AlertDialogAction>`,
    `${p2}</AlertDialogFooter>`,
    `${p1}</AlertDialogContent>`,
    `${p0}</AlertDialog>`,
  ].join("\n");
}

// ─── Breadcrumb helpers ───────────────────────────────────────────────────────

function renderBreadcrumb(node: ScannedNode, imports: ImportMap, indent: number): string {
  const p0 = "  ".repeat(indent);
  const p1 = "  ".repeat(indent + 1);
  const p2 = "  ".repeat(indent + 2);
  const p3 = "  ".repeat(indent + 3);

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];

  // Identify positions of BreadcrumbItem nodes so we can mark the last one
  const itemIndices = children
    .map((c, i) => ("component" in c && (c as ScannedNode).component === "BreadcrumbItem" ? i : -1))
    .filter(i => i >= 0);
  const lastItemIdx = itemIndices[itemIndices.length - 1] ?? -1;

  ["Breadcrumb","BreadcrumbList","BreadcrumbItem","BreadcrumbLink","BreadcrumbSeparator","BreadcrumbPage"]
    .forEach(n => addImport(imports, "@/components/ui/breadcrumb", n));

  const listInner = children.map((c, idx) => {
    if (!("component" in c)) return "";
    const sn = c as ScannedNode;

    if (sn.component === "BreadcrumbSeparator") {
      return `${p2}<BreadcrumbSeparator />`;
    }

    if (sn.component === "BreadcrumbItem") {
      const label = typeof sn.children === "string" ? sn.children : "Link";
      if (idx === lastItemIdx) {
        return `${p2}<BreadcrumbItem>\n${p3}<BreadcrumbPage>${label}</BreadcrumbPage>\n${p2}</BreadcrumbItem>`;
      }
      return `${p2}<BreadcrumbItem>\n${p3}<BreadcrumbLink href="/">${label}</BreadcrumbLink>\n${p2}</BreadcrumbItem>`;
    }

    return renderNode(c, imports, indent + 2);
  }).filter(Boolean).join("\n");

  return `${p0}<Breadcrumb>\n${p1}<BreadcrumbList>\n${listInner}\n${p1}</BreadcrumbList>\n${p0}</Breadcrumb>`;
}

// ─── Card helpers ─────────────────────────────────────────────────────────────

function renderCardHeader(slotChildren: ScannedTree[] | undefined, imports: ImportMap, indent: number): string {
  if (!slotChildren?.length) return "";
  const p1 = "  ".repeat(indent);
  const p2 = "  ".repeat(indent + 1);

  addImport(imports, "@/components/ui/card", "CardHeader");
  addImport(imports, "@/components/ui/card", "CardTitle");
  addImport(imports, "@/components/ui/card", "CardDescription");

  const texts = collectTexts(slotChildren);
  const lines: string[] = [];
  if (texts[0]) lines.push(`${p2}<CardTitle>${texts[0]}</CardTitle>`);
  if (texts[1]) lines.push(`${p2}<CardDescription>${texts[1]}</CardDescription>`);

  // Non-text children rendered after title/description
  const nonText = slotChildren.filter(c => !("isText" in c));
  nonText.forEach(c => {
    const s = renderNode(c, imports, indent + 1);
    if (s) lines.push(s);
  });

  if (!lines.length) return "";
  return `${p1}<CardHeader>\n${lines.join("\n")}\n${p1}</CardHeader>`;
}

function renderCardContent(slotChildren: ScannedTree[] | undefined, imports: ImportMap, indent: number): string {
  if (!slotChildren?.length) return "";
  const p1 = "  ".repeat(indent);
  addImport(imports, "@/components/ui/card", "CardContent");
  const inner = slotChildren.map(c => renderNode(c, imports, indent + 1)).filter(Boolean).join("\n");
  return inner ? `${p1}<CardContent>\n${inner}\n${p1}</CardContent>` : "";
}

function renderCardFooter(slotChildren: ScannedTree[] | undefined, imports: ImportMap, indent: number): string {
  if (!slotChildren?.length) return "";
  const p1 = "  ".repeat(indent);
  addImport(imports, "@/components/ui/card", "CardFooter");
  const inner = slotChildren.map(c => renderNode(c, imports, indent + 1)).filter(Boolean).join("\n");
  return inner ? `${p1}<CardFooter>\n${inner}\n${p1}</CardFooter>` : "";
}

function renderCard(node: ScannedNode, imports: ImportMap, indent: number): string {
  const p0 = "  ".repeat(indent);
  addImport(imports, "@/components/ui/card", "Card");

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const layoutChildren = children.filter(c => "isLayout" in c) as ScannedFrame[];

  // Resolve slot frames:
  // - Placed instance: direct children ARE the .Slot frames → [Slot1, Slot2, Slot3]
  // - Component page: single wrapper frame whose children are .Slot frames → [Wrapper([Slot1,Slot2,Slot3])]
  let slotFrames: ScannedFrame[];
  if (
    layoutChildren.length === 1 &&
    layoutChildren[0].children.length > 0 &&
    layoutChildren[0].children.every(c => "isLayout" in c)
  ) {
    slotFrames = layoutChildren[0].children as ScannedFrame[];
  } else {
    slotFrames = layoutChildren;
  }

  const slotContents = slotFrames.map(f => f.children ?? []);
  const sections: string[] = [];

  if (slotContents.length === 1) {
    const s = renderCardContent(slotContents[0], imports, indent + 1);
    if (s) sections.push(s);
  } else if (slotContents.length === 2) {
    const h = renderCardHeader(slotContents[0], imports, indent + 1);
    const c = renderCardContent(slotContents[1], imports, indent + 1);
    if (h) sections.push(h);
    if (c) sections.push(c);
  } else if (slotContents.length >= 3) {
    const h = renderCardHeader(slotContents[0], imports, indent + 1);
    if (h) sections.push(h);
    for (let i = 1; i < slotContents.length - 1; i++) {
      const c = renderCardContent(slotContents[i], imports, indent + 1);
      if (c) sections.push(c);
    }
    const f = renderCardFooter(slotContents[slotContents.length - 1], imports, indent + 1);
    if (f) sections.push(f);
  }

  const propsStr = renderProps(node.props);
  return `${p0}<Card${propsStr}>\n${sections.join("\n")}\n${p0}</Card>`;
}

// ─── Chart detection helpers ─────────────────────────────────────────────────

const CHART_COMPONENT_PREFIX = "__chart_";

function findFirstChartNode(nodes: ScannedTree[]): ScannedNode | null {
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

// ─── Bar Chart helpers ────────────────────────────────────────────────────────

const CHART_MONTHS = ["January", "February", "March", "April", "May", "June"];
const CHART_VALUES = [
  [186, 305, 237, 73, 209, 214],
  [80, 200, 120, 190, 130, 140],
];

function toJsKey(label: string): string {
  const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/, "");
  return key || "value";
}

function renderBarChart(node: ScannedNode, imports: ImportMap, indent: number): string {
  const typeProp = node.props.find(p => p.shadcnProp === "type");
  const chartType = typeProp?.value ?? "default";

  // Extract legend labels from scanned children — filter out axis numbers
  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const allTexts = collectTexts(children);
  const legendLabels = allTexts.filter(t => !/^[\d.,]+%?$/.test(t.trim()));

  const isMulti = chartType === "multiple" || chartType === "stacked";
  const rawLabels = legendLabels.length > 0
    ? legendLabels.slice(0, isMulti ? 2 : 1)
    : isMulti ? ["desktop", "mobile"] : ["desktop"];

  const series = rawLabels.map((label, i) => ({ label, key: toJsKey(label), idx: i }));

  // chartData
  const dataLines = CHART_MONTHS.map((m, mi) => {
    const vals = series.map(s => `${s.key}: ${CHART_VALUES[s.idx]?.[mi] ?? 100}`).join(", ");
    return `  { month: "${m}", ${vals} },`;
  });
  const chartDataStr = `const chartData = [\n${dataLines.join("\n")}\n]`;

  // chartConfig
  const configLines = series.map((s, i) =>
    `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`
  );
  const chartConfigStr = `const chartConfig = {\n${configLines.join("\n")}\n} satisfies ChartConfig`;

  // Recharts imports
  addImport(imports, "recharts", "BarChart");
  addImport(imports, "recharts", "Bar");
  addImport(imports, "recharts", "CartesianGrid");
  addImport(imports, "@/components/ui/chart", "ChartContainer");
  addImport(imports, "@/components/ui/chart", "type ChartConfig");
  addImport(imports, "@/components/ui/chart", "ChartTooltip");
  addImport(imports, "@/components/ui/chart", "ChartTooltipContent");

  const p0 = "  ".repeat(indent);
  const p1 = "  ".repeat(indent + 1);
  const p2 = "  ".repeat(indent + 2);

  const barElems = series.map((s, i) => {
    if (chartType === "stacked") {
      const isFirst = i === 0;                  // first in JSX = bottom of stack
      const isLast  = i === series.length - 1; // last in JSX = top of stack
      const radius  = isLast  ? `{[4, 4, 0, 0]}`
                    : isFirst ? `{[0, 0, 4, 4]}`
                    : `{0}`;
      return `${p2}<Bar dataKey="${s.key}" fill="var(--color-${s.key})" radius=${radius} stackId="a" />`;
    }
    return `${p2}<Bar dataKey="${s.key}" fill="var(--color-${s.key})" radius={4} />`;
  }).join("\n");

  let chartInner: string;
  if (chartType === "horizontal") {
    addImport(imports, "recharts", "XAxis");
    addImport(imports, "recharts", "YAxis");
    chartInner = [
      `${p1}<BarChart accessibilityLayer data={chartData} layout="vertical">`,
      `${p2}<CartesianGrid horizontal={false} />`,
      `${p2}<XAxis type="number" hide />`,
      `${p2}<YAxis dataKey="month" type="category" tickLine={false} axisLine={false} />`,
      `${p2}<ChartTooltip content={<ChartTooltipContent />} />`,
      barElems,
      `${p1}</BarChart>`,
    ].join("\n");
  } else {
    addImport(imports, "recharts", "XAxis");
    chartInner = [
      `${p1}<BarChart accessibilityLayer data={chartData}>`,
      `${p2}<CartesianGrid vertical={false} />`,
      `${p2}<XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />`,
      `${p2}<ChartTooltip content={<ChartTooltipContent />} />`,
      barElems,
      `${p1}</BarChart>`,
    ].join("\n");
  }

  // Install command
  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");

  // CSS variables for globals.css
  const cssVars = `:root {\n  --chart-1: oklch(0.646 0.222 41.116);\n  --chart-2: oklch(0.6 0.118 184.704);\n  --chart-3: oklch(0.398 0.07 227.392);\n  --chart-4: oklch(0.828 0.189 84.429);\n  --chart-5: oklch(0.769 0.188 70.08);\n}\n\n.dark {\n  --chart-1: oklch(0.488 0.243 264.376);\n  --chart-2: oklch(0.696 0.17 162.48);\n  --chart-3: oklch(0.769 0.188 70.08);\n  --chart-4: oklch(0.627 0.265 303.9);\n  --chart-5: oklch(0.645 0.246 16.439);\n}`;
  addImport(imports, CSS_KEY, cssVars);

  // chartData and chartConfig go before the JSX
  addImport(imports, PREAMBLE_KEY, chartDataStr);
  addImport(imports, PREAMBLE_KEY, chartConfigStr);

  return `${p0}<ChartContainer config={chartConfig} className="min-h-[200px] w-full">\n${chartInner}\n${p0}</ChartContainer>`;
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

// ─── Avatar helpers ───────────────────────────────────────────────────────────

function renderAvatar(node: ScannedNode, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const ip  = "  ".repeat(indent + 1);

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const texts    = collectTexts(children);
  const fallback = texts[0] ?? "??";

  addImport(imports, "@/components/ui/avatar", "Avatar");
  addImport(imports, "@/components/ui/avatar", "AvatarImage");
  addImport(imports, "@/components/ui/avatar", "AvatarFallback");

  return `${pad}<Avatar>\n${ip}<AvatarImage src="" alt="" />\n${ip}<AvatarFallback>${fallback}</AvatarFallback>\n${pad}</Avatar>`;
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

  // Inline text — no HTML tag, used inside mapped components alongside icons
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

  // Layout frame — render as a div with Tailwind classes
  if ("isLayout" in node) {
    // Unwrap single-child frames that only contain an image — no div needed
    if (node.children.length === 1 && "isImage" in node.children[0]) {
      return renderNode(node.children[0], imports, indent);
    }

    // CSS grid containing table cells → emit a proper <Table> structure
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

    // Frame wrapping a chart (axis labels, legend, gridlines) → render just the chart
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

  // Mapped shadcn/ui component — never apply internal Figma layout as className
  const sn = node as ScannedNode;

  // Bar chart — generates a full ChartContainer template
  if (sn.component === "__chart_bar__") {
    return renderBarChart(sn, imports, indent);
  }

  // Card — needs CardHeader/CardContent/CardFooter wrapper
  if (sn.component === "Card") {
    return renderCard(sn, imports, indent);
  }

  // Breadcrumb — needs BreadcrumbList wrapper + Link/Page distinction
  if (sn.component === "Breadcrumb") {
    return renderBreadcrumb(sn, imports, indent);
  }

  // AlertDialog — compound structure that needs full nesting
  if (sn.component === "AlertDialog") {
    return renderAlertDialog(sn, imports, indent);
  }

  // Avatar — always needs AvatarImage + AvatarFallback children
  if (sn.component === "Avatar") {
    return renderAvatar(sn, imports, indent);
  }

  const { component, importPath, props, children } = node;
  addImport(imports, importPath, component);

  const propsStr = renderProps(props);
  const clsAttr  = "";

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
