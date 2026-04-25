/**
 * HTML Generator
 *
 * Converts a ScannedTree into plain HTML with Tailwind CSS classes.
 * No imports, no JSX — works for any framework or vanilla HTML.
 *
 * For mapped shadcn/ui components, outputs their semantic HTML equivalent
 * with the right Tailwind classes baked in. Interactive components that
 * require JS get an <!-- interactive --> comment.
 */

import type { ScannedText, ScannedImage, ScannedIcon, ScannedTree, ScannedFrame, ScannedNode } from "./frame-scanner";
import { layoutClasses, visualClasses, textVisualClasses } from "./tailwind-layout";

// ─── shadcn/ui → HTML component definitions ───────────────────────────────────

interface HtmlDef {
  tag: string;
  getClasses: (props: Record<string, string>) => string;
  /** Self-closing (input, img, hr) */
  selfClosing?: boolean;
  /** Needs JavaScript to function */
  interactive?: boolean;
}

const BASE_BTN = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const HTML_MAP: Record<string, HtmlDef> = {
  Button: {
    tag: "button",
    getClasses: ({ variant = "default", size = "default" }) => {
      const v: Record<string, string> = {
        default:     "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:     "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost:       "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link:        "text-primary underline-offset-4 hover:underline",
      };
      const s: Record<string, string> = {
        default: "h-10 px-4 py-2",
        sm:      "h-9 rounded-md px-3",
        lg:      "h-11 rounded-md px-8",
        icon:    "h-10 w-10",
      };
      return `${BASE_BTN} ${v[variant] ?? v.default} ${s[size] ?? s.default}`;
    },
  },

  Badge: {
    tag: "span",
    getClasses: ({ variant = "default" }) => {
      const v: Record<string, string> = {
        default:     "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:     "text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
      };
      return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${v[variant] ?? v.default}`;
    },
  },

  Input: {
    tag: "input",
    selfClosing: true,
    getClasses: () => "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  },

  Textarea: {
    tag: "textarea",
    getClasses: () => "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  },

  Label: {
    tag: "label",
    getClasses: () => "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  },

  Separator: {
    tag: "div",
    getClasses: ({ orientation = "horizontal" }) =>
      orientation === "vertical"
        ? "shrink-0 bg-border w-[1px] h-full"
        : "shrink-0 bg-border h-[1px] w-full my-4",
  },

  Avatar: {
    tag: "span",
    getClasses: () => "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
  },

  Skeleton: {
    tag: "div",
    getClasses: () => "animate-pulse rounded-md bg-muted",
  },

  Card: {
    tag: "div",
    getClasses: () => "rounded-lg border bg-card text-card-foreground shadow-sm",
  },
  CardHeader: {
    tag: "div",
    getClasses: () => "flex flex-col space-y-1.5 p-6",
  },
  CardTitle: {
    tag: "h3",
    getClasses: () => "text-2xl font-semibold leading-none tracking-tight",
  },
  CardDescription: {
    tag: "p",
    getClasses: () => "text-sm text-muted-foreground",
  },
  CardContent: {
    tag: "div",
    getClasses: () => "p-6 pt-0",
  },
  CardFooter: {
    tag: "div",
    getClasses: () => "flex items-center p-6 pt-0",
  },

  Alert: {
    tag: "div",
    getClasses: ({ variant = "default" }) => {
      const base = "relative w-full rounded-lg border p-4";
      return variant === "destructive"
        ? `${base} border-destructive/50 text-destructive`
        : base;
    },
  },
  AlertTitle: {
    tag: "h5",
    getClasses: () => "mb-1 font-medium leading-none tracking-tight",
  },
  AlertDescription: {
    tag: "div",
    getClasses: () => "text-sm [&_p]:leading-relaxed",
  },

  Checkbox: {
    tag: "input",
    selfClosing: true,
    getClasses: () => "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  },

  Switch: {
    tag: "button",
    interactive: true,
    getClasses: () => "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
  },

  Select: {
    tag: "select",
    interactive: true,
    getClasses: () => "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  },

  Progress: {
    tag: "div",
    getClasses: () => "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
  },

  Tooltip: {
    tag: "div",
    interactive: true,
    getClasses: () => "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
  },

  Tabs: {
    tag: "div",
    interactive: true,
    getClasses: () => "w-full",
  },
  TabsList: {
    tag: "div",
    getClasses: () => "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
  },
  TabsTrigger: {
    tag: "button",
    getClasses: () => "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
  },
  TabsContent: {
    tag: "div",
    getClasses: () => "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  },

  Table: {
    tag: "table",
    getClasses: () => "w-full caption-bottom text-sm",
  },
  TableHeader: {
    tag: "thead",
    getClasses: () => "[&_tr]:border-b",
  },
  TableBody: {
    tag: "tbody",
    getClasses: () => "[&_tr:last-child]:border-0",
  },
  TableFooter: {
    tag: "tfoot",
    getClasses: () => "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
  },
  TableRow: {
    tag: "tr",
    getClasses: () => "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
  },
  TableHead: {
    tag: "th",
    getClasses: () => "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
  },
  TableCell: {
    tag: "td",
    getClasses: () => "p-4 align-middle [&:has([role=checkbox])]:pr-0",
  },

  // Interactive-only stubs
  Dialog: {
    tag: "dialog",
    interactive: true,
    getClasses: () => "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg rounded-lg",
  },
  Sheet: {
    tag: "div",
    interactive: true,
    getClasses: () => "fixed inset-y-0 right-0 z-50 h-full w-3/4 gap-4 bg-background p-6 shadow-lg sm:max-w-sm",
  },
  DropdownMenu: {
    tag: "div",
    interactive: true,
    getClasses: () => "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
  },
  NavigationMenu: {
    tag: "nav",
    interactive: true,
    getClasses: () => "relative z-10 flex max-w-max flex-1 items-center justify-center",
  },
};

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

function renderTableGrid(node: ScannedFrame, indent: number): string {
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

  const tableDef = HTML_MAP["Table"];
  const theadDef = HTML_MAP["TableHeader"];
  const tbodyDef = HTML_MAP["TableBody"];
  const trDef    = HTML_MAP["TableRow"];

  const renderRow = (row: ScannedTree[], ri: number) => {
    const rp = "  ".repeat(ri);
    const trCls = trDef.getClasses({});
    const cells = row.map(c => renderNode(c, ri + 1)).join("\n");
    return `${rp}<tr class="${trCls}">\n${cells}\n${rp}</tr>`;
  };

  const parts: string[] = [];
  if (headerRows.length > 0) {
    const inner = headerRows.map(r => renderRow(r, indent + 2)).join("\n");
    parts.push(`${pad}  <thead class="${theadDef.getClasses({})}">\n${inner}\n${pad}  </thead>`);
  }
  const bodyInner = rows.map(r => renderRow(r, indent + 2)).join("\n");
  parts.push(`${pad}  <tbody class="${tbodyDef.getClasses({})}">\n${bodyInner}\n${pad}  </tbody>`);

  return `${pad}<table class="${tableDef.getClasses({})}">\n${parts.join("\n")}\n${pad}</table>`;
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

function renderNode(node: ScannedTree, indent: number): string {
  const pad = "  ".repeat(indent);

  // Lucide icon — output the name as a comment; swap for your icon library of choice
  if ("isIcon" in node) {
    const icon = node as ScannedIcon;
    const size = Math.max(icon.width, icon.height);
    return `${pad}<!-- lucide: ${icon.lucideName} -->\n${pad}<span class="inline-flex shrink-0 w-[${size}px] h-[${size}px]" aria-hidden="true"></span>`;
  }

  // Text node
  if ("isText" in node) {
    const t = node as ScannedText;
    const visualCls = textVisualClasses(t.align, t.color, t.uppercase);
    const boldCls   = t.tag === "span" && t.bold ? "font-semibold" : "";
    const cls = [boldCls, visualCls].filter(Boolean).join(" ");
    return `${pad}<${t.tag}${cls ? ` class="${cls}"` : ""}>${t.content}</${t.tag}>`;
  }

  // Image
  if ("isImage" in node) {
    const img = node as ScannedImage;
    return `${pad}<img src="" alt="${img.name}" width="${img.width}" height="${img.height}" class="w-full object-cover" />`;
  }

  // Layout frame → div with Tailwind classes
  if ("isLayout" in node) {
    // Unwrap single-child image wrapper
    if (node.children.length === 1 && "isImage" in node.children[0]) {
      return renderNode(node.children[0], indent);
    }
    // CSS grid containing table cells → proper <table> structure
    if (isTableGrid(node)) {
      return renderTableGrid(node, indent);
    }
    const layoutCls = layoutClasses(node.layout);
    const visualCls = visualClasses(node.visual);
    const cls = [layoutCls, visualCls].filter(Boolean).join(" ");
    const clsAttr = cls ? ` class="${cls}"` : "";
    const childrenStr = node.children
      .map(c => renderNode(c, indent + 1))
      .filter(Boolean)
      .join("\n");
    if (!childrenStr) return "";
    return `${pad}<div${clsAttr}>\n${childrenStr}\n${pad}</div>`;
  }

  // Mapped shadcn/ui component
  const { component, props, children } = node;
  const def = HTML_MAP[component];

  // Props → plain map for getClasses
  const propsMap: Record<string, string> = {};
  for (const p of props) {
    if (p.value && p.value !== "false") propsMap[p.shadcnProp] = p.value;
  }

  if (!def) {
    // Unmapped — emit a div with a data attribute so engineers know what it is
    const childrenStr = Array.isArray(children) && children.length > 0
      ? "\n" + children.map(c => renderNode(c, indent + 1)).join("\n") + "\n" + pad
      : typeof children === "string" ? children : "";
    return `${pad}<div data-component="${component}">${childrenStr}</div>`;
  }

  const classes = def.getClasses(propsMap);
  const tag = def.tag;
  const interactiveSuffix = def.interactive ? ` <!-- interactive: add JS -->` : "";

  // Self-closing
  if (def.selfClosing) {
    const type = tag === "input" && component === "Checkbox" ? ` type="checkbox"` : "";
    return `${pad}<${tag}${type} class="${classes}" />${interactiveSuffix}`;
  }

  // Text children
  if (typeof children === "string" && children) {
    return `${pad}<${tag} class="${classes}">${children}</${tag}>${interactiveSuffix}`;
  }

  // Node children
  if (Array.isArray(children) && children.length > 0) {
    const childrenStr = children.map(c => renderNode(c, indent + 1)).join("\n");
    return `${pad}<${tag} class="${classes}">\n${childrenStr}\n${pad}</${tag}>${interactiveSuffix}`;
  }

  // Empty
  return `${pad}<${tag} class="${classes}"></${tag}>${interactiveSuffix}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateHTML(tree: ScannedTree): string {
  return renderNode(tree, 0);
}
