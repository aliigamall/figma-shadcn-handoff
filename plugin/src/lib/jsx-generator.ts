/**
 * JSX Generator
 *
 * Converts a ScannedTree (from frame-scanner) into:
 *  - A formatted JSX string
 *  - A deduplicated list of import statements
 */

import type { ScannedNode, ScannedFrame, ScannedText, ScannedImage, ScannedIcon, ScannedInlineText, ScannedTree } from "./frame-scanner";
import { layoutClasses, visualClasses, textVisualClasses, textDecorationClasses } from "./tailwind-layout";

// ─── Import tracking ──────────────────────────────────────────────────────────

type ImportMap = Map<string, Set<string>>;

function addImport(imports: ImportMap, path: string, name: string) {
  if (!imports.has(path)) imports.set(path, new Set());
  imports.get(path)!.add(name);
}

const PREAMBLE_KEY   = "__preamble__";
const INSTALL_KEY    = "__install__";
const CSS_KEY        = "__css__";
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

const TABLE_CELL_COMPONENTS     = new Set(["TableHead", "TableCell"]);
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

// ─── Data table renderer ─────────────────────────────────────────────────────

function renderDataTable(_node: ScannedFrame | ScannedNode, imports: ImportMap, _indent: number): string {
  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add table");
  addImport(imports, DIRECTIVE_KEY, '"use client"');
  addImport(imports, RAW_IMPORT_KEY, 'import * as React from "react"');
  addImport(imports, "@tanstack/react-table", "flexRender");
  addImport(imports, "@tanstack/react-table", "getCoreRowModel");
  addImport(imports, "@tanstack/react-table", "getFilteredRowModel");
  addImport(imports, "@tanstack/react-table", "getPaginationRowModel");
  addImport(imports, "@tanstack/react-table", "getSortedRowModel");
  addImport(imports, "@tanstack/react-table", "useReactTable");
  addImport(imports, "@tanstack/react-table", "type ColumnDef");
  addImport(imports, "@tanstack/react-table", "type ColumnFiltersState");
  addImport(imports, "@tanstack/react-table", "type SortingState");
  addImport(imports, "@tanstack/react-table", "type VisibilityState");
  addImport(imports, "lucide-react", "ArrowUpDown");
  addImport(imports, "lucide-react", "ChevronDown");
  addImport(imports, "lucide-react", "MoreHorizontal");
  addImport(imports, "@/components/ui/button", "Button");
  addImport(imports, "@/components/ui/checkbox", "Checkbox");
  addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenu");
  addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuCheckboxItem");
  addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuContent");
  addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuGroup");
  addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuItem");
  addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuLabel");
  addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuTrigger");
  addImport(imports, "@/components/ui/input", "Input");
  addImport(imports, "@/components/ui/table", "Table");
  addImport(imports, "@/components/ui/table", "TableBody");
  addImport(imports, "@/components/ui/table", "TableCell");
  addImport(imports, "@/components/ui/table", "TableHead");
  addImport(imports, "@/components/ui/table", "TableHeader");
  addImport(imports, "@/components/ui/table", "TableRow");

  const template = `// Sample payment data
const data: Payment[] = [
  { id: "m5gr84i9", amount: 316, status: "success",    email: "ken99@example.com" },
  { id: "3u1reuv4", amount: 242, status: "success",    email: "abe45@example.com" },
  { id: "derv1ws0", amount: 837, status: "processing", email: "monserrat44@example.com" },
  { id: "5kma53ae", amount: 874, status: "success",    email: "silas22@example.com" },
  { id: "bhqecj4p", amount: 721, status: "failed",     email: "carmella@example.com" },
  { id: "p9xk21hf", amount: 150, status: "pending",    email: "john.doe@example.com" },
  { id: "q8wm47js", amount: 499, status: "success",    email: "jane.smith@example.com" },
  { id: "r7vn63kt", amount: 299, status: "processing", email: "alex.johnson@example.com" },
  { id: "s6up89lu", amount: 125, status: "failed",     email: "sarah.williams@example.com" },
  { id: "t5to15mv", amount: 650, status: "pending",    email: "mike.brown@example.com" },
]

export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize \${
          status === "success"    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          : status === "processing" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
          : status === "failed"   ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
        }\`}>
          {status}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Email <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <div className="text-right">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
                Copy payment ID
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function DataTableDemo() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  })

  return (
    <div className="container mx-auto py-10">
      <div className="w-full">
        <div className="flex items-center gap-4 py-4">
          <Input
            placeholder="Filter emails..."
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("email")?.setFilterValue(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end gap-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}`;

  addImport(imports, PREAMBLE_KEY, template);
  return "";
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

/** Recursively find the first ScannedIcon and return its Lucide name */
function findIconChild(children: string | ScannedTree[]): string | null {
  if (typeof children === "string") return null;
  for (const c of children as ScannedTree[]) {
    if ("isIcon"   in c) return (c as ScannedIcon).lucideName;
    if ("isLayout" in c) { const r = findIconChild((c as ScannedFrame).children); if (r) return r; }
    if ("component" in c) { const r = findIconChild((c as ScannedNode).children as ScannedTree[]); if (r) return r; }
  }
  return null;
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

const FALLBACK_SERIES = ["desktop", "mobile"];

function extractSeries(legendLabels: string[], count: number) {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(legendLabels[i] ?? FALLBACK_SERIES[i] ?? `series${i + 1}`);
  }
  return result;
}

function renderBarChart(node: ScannedNode, imports: ImportMap, indent: number): string {
  const typeProp = node.props.find(p => p.shadcnProp === "type");
  const chartType = typeProp?.value ?? "default";

  // Extract legend labels from scanned children — filter out axis numbers
  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const allTexts = collectTexts(children);
  const legendLabels = allTexts.filter(t => !/^[\d.,]+%?$/.test(t.trim()));

  const seriesCount = (chartType === "multiple" || chartType === "stacked") ? 2 : 1;
  const series = extractSeries(legendLabels, seriesCount).map((label, i) => ({ label, key: toJsKey(label), idx: i }));

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

  // ── Interactive variant ────────────────────────────────────────────────────
  if (chartType === "interactive") {
    // Same as default but with a controlled activeChart state for toggling series
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");
    addImport(imports, CSS_KEY, CHART_CSS_VARS);
    addImport(imports, "recharts", "BarChart");
    addImport(imports, "recharts", "Bar");
    addImport(imports, "recharts", "CartesianGrid");
    addImport(imports, "recharts", "XAxis");
    addImport(imports, "@/components/ui/chart", "ChartContainer");
    addImport(imports, "@/components/ui/chart", "type ChartConfig");
    addImport(imports, "@/components/ui/chart", "ChartTooltip");
    addImport(imports, "@/components/ui/chart", "ChartTooltipContent");

    const iSeries = series.length >= 2 ? series.slice(0, 2) : [{ label: "desktop", key: "desktop", idx: 0 }, { label: "mobile", key: "mobile", idx: 1 }];
    const DATES = ["2024-04-01","2024-04-08","2024-04-15","2024-04-22","2024-04-29","2024-05-06","2024-05-13","2024-05-20","2024-05-27","2024-06-03","2024-06-10","2024-06-17","2024-06-24"];
    const VALS2 = [222,97,167,242,373,301,245,409,59,261,327,292,342];
    const VALS3 = [150,180,120,260,290,340,180,220,100,310,250,190,280];

    const iDataLines = DATES.map((d, i) => {
      const vals = iSeries.map((s, si) => `${s.key}: ${si === 0 ? VALS2[i] : VALS3[i]}`).join(", ");
      return `  { date: "${d}", ${vals} },`;
    });
    addImport(imports, PREAMBLE_KEY, `const chartData = [\n${iDataLines.join("\n")}\n]`);
    addImport(imports, PREAMBLE_KEY, `const chartConfig = {\n${iSeries.map((s, i) => `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`).join("\n")}\n} satisfies ChartConfig`);

    const keys = iSeries.map(s => `"${s.key}"`).join(" | ");
    addImport(imports, PREAMBLE_KEY, `const [activeChart, setActiveChart] = useState<${keys}>("${iSeries[0].key}")`);

    const p0 = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    return `${p0}<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">\n${p1}<BarChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>\n${p2}<CartesianGrid vertical={false} />\n${p2}<XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />\n${p2}<ChartTooltip content={<ChartTooltipContent className="w-[150px]" nameKey="views" labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />} />\n${p2}<Bar dataKey={activeChart} fill={\`var(--color-\${activeChart})\`} />\n${p1}</BarChart>\n${p0}</ChartContainer>`;
  }

  // Install command
  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");

  addImport(imports, CSS_KEY, CHART_CSS_VARS);

  // chartData and chartConfig go before the JSX
  addImport(imports, PREAMBLE_KEY, chartDataStr);
  addImport(imports, PREAMBLE_KEY, chartConfigStr);

  return `${p0}<ChartContainer config={chartConfig} className="min-h-[200px] w-full">\n${chartInner}\n${p0}</ChartContainer>`;
}

// ─── Area chart renderer ──────────────────────────────────────────────────────

const CHART_CSS_VARS = `:root {\n  --chart-1: oklch(0.646 0.222 41.116);\n  --chart-2: oklch(0.6 0.118 184.704);\n  --chart-3: oklch(0.398 0.07 227.392);\n  --chart-4: oklch(0.828 0.189 84.429);\n  --chart-5: oklch(0.769 0.188 70.08);\n}\n\n.dark {\n  --chart-1: oklch(0.488 0.243 264.376);\n  --chart-2: oklch(0.696 0.17 162.48);\n  --chart-3: oklch(0.769 0.188 70.08);\n  --chart-4: oklch(0.627 0.265 303.9);\n  --chart-5: oklch(0.645 0.246 16.439);\n}`;

function renderAreaChart(node: ScannedNode, imports: ImportMap, indent: number): string {
  const typeProp  = node.props.find(p => p.shadcnProp === "type");
  const chartType = typeProp?.value ?? "default";

  const children    = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const allTexts    = collectTexts(children);
  const legendLabels = allTexts.filter(t => !/^[\d.,]+%?$/.test(t.trim()));

  const seriesCount = chartType === "stacked" ? 2 : 1;

  const series = extractSeries(legendLabels, seriesCount).map((label, i) => ({ label, key: toJsKey(label), idx: i }));

  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");
  addImport(imports, CSS_KEY, CHART_CSS_VARS);

  // ── Interactive ────────────────────────────────────────────────────────────
  if (chartType === "interactive") {
    addImport(imports, "recharts", "AreaChart");
    addImport(imports, "recharts", "Area");
    addImport(imports, "recharts", "CartesianGrid");
    addImport(imports, "recharts", "XAxis");
    addImport(imports, "@/components/ui/chart", "ChartContainer");
    addImport(imports, "@/components/ui/chart", "type ChartConfig");
    addImport(imports, "@/components/ui/chart", "ChartTooltip");
    addImport(imports, "@/components/ui/chart", "ChartTooltipContent");

    const iSeries = series.length >= 2 ? series.slice(0, 2) : [{ label: "desktop", key: "desktop", idx: 0 }, { label: "mobile", key: "mobile", idx: 1 }];
    const DATES = ["2024-04-01","2024-04-08","2024-04-15","2024-04-22","2024-04-29","2024-05-06","2024-05-13","2024-05-20","2024-05-27","2024-06-03","2024-06-10","2024-06-17","2024-06-24"];
    const VALS_A = [222,97,167,242,373,301,245,409,59,261,327,292,342];
    const VALS_B = [150,180,120,260,290,340,180,220,100,310,250,190,280];

    const iDataLines = DATES.map((d, i) => {
      const vals = iSeries.map((s, si) => `${s.key}: ${si === 0 ? VALS_A[i] : VALS_B[i]}`).join(", ");
      return `  { date: "${d}", ${vals} },`;
    });
    addImport(imports, PREAMBLE_KEY, `const chartData = [\n${iDataLines.join("\n")}\n]`);
    addImport(imports, PREAMBLE_KEY, `const chartConfig = {\n${iSeries.map((s, i) => `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`).join("\n")}\n} satisfies ChartConfig`);

    const keys = iSeries.map(s => `"${s.key}"`).join(" | ");
    addImport(imports, PREAMBLE_KEY, `const [activeChart, setActiveChart] = useState<${keys}>("${iSeries[0].key}")`);

    const p0 = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const p3 = "  ".repeat(indent + 3);

    const gradientDefs = iSeries.map(s => {
      const cap = s.key.charAt(0).toUpperCase() + s.key.slice(1);
      return `${p3}<linearGradient id="fill${cap}" x1="0" y1="0" x2="0" y2="1">\n${p3}  <stop offset="5%" stopColor="var(--color-${s.key})" stopOpacity={0.8} />\n${p3}  <stop offset="95%" stopColor="var(--color-${s.key})" stopOpacity={0.1} />\n${p3}</linearGradient>`;
    }).join("\n");

    const areaElems = iSeries.map(s => {
      const cap = s.key.charAt(0).toUpperCase() + s.key.slice(1);
      return `${p3}<Area dataKey="${s.key}" type="natural" fill="url(#fill${cap})" fillOpacity={0.4} stroke="var(--color-${s.key})" />`;
    }).join("\n");

    return [
      `${p0}<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">`,
      `${p1}<AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>`,
      `${p2}<defs>`,
      gradientDefs,
      `${p2}</defs>`,
      `${p2}<CartesianGrid vertical={false} />`,
      `${p2}<XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />`,
      `${p2}<ChartTooltip content={<ChartTooltipContent className="w-[150px]" labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />} />`,
      areaElems,
      `${p1}</AreaChart>`,
      `${p0}</ChartContainer>`,
    ].join("\n");
  }

  // ── Standard variants (Default, Linear, Step, Stacked) ────────────────────
  const dataLines = CHART_MONTHS.map((m, mi) => {
    const vals = series.map(s => `${s.key}: ${CHART_VALUES[s.idx]?.[mi] ?? 100}`).join(", ");
    return `  { month: "${m}", ${vals} },`;
  });
  const chartDataStr = `const chartData = [\n${dataLines.join("\n")}\n]`;

  const configLines = series.map((s, i) =>
    `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`
  );
  const chartConfigStr = `const chartConfig = {\n${configLines.join("\n")}\n} satisfies ChartConfig`;

  addImport(imports, PREAMBLE_KEY, chartDataStr);
  addImport(imports, PREAMBLE_KEY, chartConfigStr);

  addImport(imports, "recharts", "AreaChart");
  addImport(imports, "recharts", "Area");
  addImport(imports, "recharts", "CartesianGrid");
  addImport(imports, "recharts", "XAxis");
  addImport(imports, "@/components/ui/chart", "ChartContainer");
  addImport(imports, "@/components/ui/chart", "type ChartConfig");
  addImport(imports, "@/components/ui/chart", "ChartTooltip");
  addImport(imports, "@/components/ui/chart", "ChartTooltipContent");

  const p0 = "  ".repeat(indent);
  const p1 = "  ".repeat(indent + 1);
  const p2 = "  ".repeat(indent + 2);

  const curveType = chartType === "linear" ? "linear" : chartType === "step" ? "step" : "natural";

  const gradientDefs = series.map(s => {
    const capKey = s.key.charAt(0).toUpperCase() + s.key.slice(1);
    return [
      `${p2}  <linearGradient id="fill${capKey}" x1="0" y1="0" x2="0" y2="1">`,
      `${p2}    <stop offset="5%" stopColor="var(--color-${s.key})" stopOpacity={0.8} />`,
      `${p2}    <stop offset="95%" stopColor="var(--color-${s.key})" stopOpacity={0.1} />`,
      `${p2}  </linearGradient>`,
    ].join("\n");
  }).join("\n");

  const areaElems = series.map(s => {
    const capKey = s.key.charAt(0).toUpperCase() + s.key.slice(1);
    const stackProp = chartType === "stacked" ? ` stackId="a"` : "";
    return `${p2}<Area type="${curveType}" dataKey="${s.key}" fill="url(#fill${capKey})" fillOpacity={0.4} stroke="var(--color-${s.key})"${stackProp} />`;
  }).join("\n");

  const chartInner = [
    `${p1}<AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>`,
    `${p2}<defs>`,
    gradientDefs,
    `${p2}</defs>`,
    `${p2}<CartesianGrid vertical={false} />`,
    `${p2}<XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />`,
    `${p2}<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />`,
    areaElems,
    `${p1}</AreaChart>`,
  ].join("\n");

  return `${p0}<ChartContainer config={chartConfig} className="min-h-[200px] w-full">\n${chartInner}\n${p0}</ChartContainer>`;
}

// ─── Line chart renderer ──────────────────────────────────────────────────────

function renderLineChart(node: ScannedNode, imports: ImportMap, indent: number): string {
  const typeProp  = node.props.find(p => p.shadcnProp === "type");
  const chartType = typeProp?.value ?? "default";

  const children     = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const allTexts     = collectTexts(children);
  const legendLabels = allTexts.filter(t => !/^[\d.,]+%?$/.test(t.trim()));

  const seriesCount = chartType === "stacked" ? 2 : 1;

  const series = extractSeries(legendLabels, seriesCount).map((label, i) => ({ label, key: toJsKey(label), idx: i }));

  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");
  addImport(imports, CSS_KEY, CHART_CSS_VARS);
  addImport(imports, "recharts", "LineChart");
  addImport(imports, "recharts", "Line");
  addImport(imports, "recharts", "CartesianGrid");
  addImport(imports, "recharts", "XAxis");
  addImport(imports, "@/components/ui/chart", "ChartContainer");
  addImport(imports, "@/components/ui/chart", "type ChartConfig");
  addImport(imports, "@/components/ui/chart", "ChartTooltip");
  addImport(imports, "@/components/ui/chart", "ChartTooltipContent");

  // ── Interactive ────────────────────────────────────────────────────────────
  if (chartType === "interactive") {
    const iSeries = series.length >= 2 ? series.slice(0, 2) : [{ label: "desktop", key: "desktop", idx: 0 }, { label: "mobile", key: "mobile", idx: 1 }];
    const DATES = ["2024-04-01","2024-04-08","2024-04-15","2024-04-22","2024-04-29","2024-05-06","2024-05-13","2024-05-20","2024-05-27","2024-06-03","2024-06-10","2024-06-17","2024-06-24"];
    const VALS_A = [222,97,167,242,373,301,245,409,59,261,327,292,342];
    const VALS_B = [150,180,120,260,290,340,180,220,100,310,250,190,280];

    const iDataLines = DATES.map((d, i) => {
      const vals = iSeries.map((s, si) => `${s.key}: ${si === 0 ? VALS_A[i] : VALS_B[i]}`).join(", ");
      return `  { date: "${d}", ${vals} },`;
    });
    addImport(imports, PREAMBLE_KEY, `const chartData = [\n${iDataLines.join("\n")}\n]`);
    addImport(imports, PREAMBLE_KEY, `const chartConfig = {\n${iSeries.map((s, i) => `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`).join("\n")}\n} satisfies ChartConfig`);

    const keys = iSeries.map(s => `"${s.key}"`).join(" | ");
    addImport(imports, PREAMBLE_KEY, `const [activeLine, setActiveLine] = useState<${keys}>("${iSeries[0].key}")`);

    const p0 = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);

    const lineElems = iSeries.map(s =>
      `${p2}<Line dataKey="${s.key}" type="natural" stroke="var(--color-${s.key})" strokeWidth={2} dot={false} strokeOpacity={activeLine === "${s.key}" ? 1 : 0.3} />`
    ).join("\n");

    return [
      `${p0}<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">`,
      `${p1}<LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>`,
      `${p2}<CartesianGrid vertical={false} />`,
      `${p2}<XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />`,
      `${p2}<ChartTooltip content={<ChartTooltipContent className="w-[150px]" labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />} />`,
      lineElems,
      `${p1}</LineChart>`,
      `${p0}</ChartContainer>`,
    ].join("\n");
  }

  // ── Standard variants (Default, Linear, Step, Stacked) ────────────────────
  const dataLines = CHART_MONTHS.map((m, mi) => {
    const vals = series.map(s => `${s.key}: ${CHART_VALUES[s.idx]?.[mi] ?? 100}`).join(", ");
    return `  { month: "${m}", ${vals} },`;
  });
  addImport(imports, PREAMBLE_KEY, `const chartData = [\n${dataLines.join("\n")}\n]`);
  addImport(imports, PREAMBLE_KEY, `const chartConfig = {\n${series.map((s, i) => `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`).join("\n")}\n} satisfies ChartConfig`);

  const p0 = "  ".repeat(indent);
  const p1 = "  ".repeat(indent + 1);
  const p2 = "  ".repeat(indent + 2);

  const curveType = chartType === "linear" ? "linear" : chartType === "step" ? "step" : "natural";

  const lineElems = series.map(s =>
    `${p2}<Line dataKey="${s.key}" type="${curveType}" stroke="var(--color-${s.key})" strokeWidth={2} dot={false} />`
  ).join("\n");

  return [
    `${p0}<ChartContainer config={chartConfig} className="min-h-[200px] w-full">`,
    `${p1}<LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>`,
    `${p2}<CartesianGrid vertical={false} />`,
    `${p2}<XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />`,
    `${p2}<ChartTooltip cursor={false} content={<ChartTooltipContent />} />`,
    lineElems,
    `${p1}</LineChart>`,
    `${p0}</ChartContainer>`,
  ].join("\n");
}

// ─── Date picker renderers ────────────────────────────────────────────────────

function renderDatePickerSingle(imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);

  addImport(imports, INSTALL_KEY,                 "pnpm dlx shadcn@latest add calendar popover");
  addImport(imports, DIRECTIVE_KEY,               '"use client"');
  addImport(imports, "react",                     "useState");
  addImport(imports, "date-fns",                  "format");
  addImport(imports, "@/components/ui/button",    "Button");
  addImport(imports, "@/components/ui/calendar",  "Calendar");
  addImport(imports, "@/components/ui/field",     "Field");
  addImport(imports, "@/components/ui/field",     "FieldLabel");
  addImport(imports, "@/components/ui/popover",   "Popover");
  addImport(imports, "@/components/ui/popover",   "PopoverContent");
  addImport(imports, "@/components/ui/popover",   "PopoverTrigger");

  addImport(imports, PREAMBLE_KEY, `const [date, setDate] = useState<Date>()`);

  return [
    `${pad}<Field className="mx-auto w-44">`,
    `${p1}<FieldLabel htmlFor="date-picker">Date</FieldLabel>`,
    `${p1}<Popover>`,
    `${p2}<PopoverTrigger asChild>`,
    `${p2}  <Button variant="outline" id="date-picker" className="justify-start font-normal">`,
    `${p2}    {date ? format(date, "PPP") : <span>Pick a date</span>}`,
    `${p2}  </Button>`,
    `${p2}</PopoverTrigger>`,
    `${p2}<PopoverContent className="w-auto p-0" align="start">`,
    `${p2}  <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={date} />`,
    `${p2}</PopoverContent>`,
    `${p1}</Popover>`,
    `${pad}</Field>`,
  ].join("\n");
}

function renderDatePickerRange(imports: ImportMap, indent: number, numberOfMonths = 2): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);

  addImport(imports, INSTALL_KEY,                 "pnpm dlx shadcn@latest add calendar popover");
  addImport(imports, DIRECTIVE_KEY,               '"use client"');
  addImport(imports, "react",                     "useState");
  addImport(imports, "date-fns",                  "addDays");
  addImport(imports, "date-fns",                  "format");
  addImport(imports, "lucide-react",              "CalendarIcon");
  addImport(imports, "react-day-picker",          "type DateRange");
  addImport(imports, "@/components/ui/button",    "Button");
  addImport(imports, "@/components/ui/calendar",  "Calendar");
  addImport(imports, "@/components/ui/field",     "Field");
  addImport(imports, "@/components/ui/field",     "FieldLabel");
  addImport(imports, "@/components/ui/popover",   "Popover");
  addImport(imports, "@/components/ui/popover",   "PopoverContent");
  addImport(imports, "@/components/ui/popover",   "PopoverTrigger");

  addImport(imports, PREAMBLE_KEY,
    `const [date, setDate] = useState<DateRange | undefined>({\n  from: new Date(new Date().getFullYear(), 0, 20),\n  to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),\n})`
  );

  return [
    `${pad}<Field className="mx-auto w-60">`,
    `${p1}<FieldLabel htmlFor="date-picker-range">Date Range</FieldLabel>`,
    `${p1}<Popover>`,
    `${p2}<PopoverTrigger asChild>`,
    `${p2}  <Button variant="outline" id="date-picker-range" className="justify-start px-2.5 font-normal">`,
    `${p2}    <CalendarIcon />`,
    `${p2}    {date?.from ? (`,
    `${p2}      date.to ? (`,
    `${p2}        <>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>`,
    `${p2}      ) : format(date.from, "LLL dd, y")`,
    `${p2}    ) : <span>Pick a date</span>}`,
    `${p2}  </Button>`,
    `${p2}</PopoverTrigger>`,
    `${p2}<PopoverContent className="w-auto p-0" align="start">`,
    `${p2}  <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={${numberOfMonths}} />`,
    `${p2}</PopoverContent>`,
    `${p1}</Popover>`,
    `${pad}</Field>`,
  ].join("\n");
}

function renderDatePicker(node: ScannedNode, imports: ImportMap, indent: number): string {
  const monthsProp = node.props.find(p => p.shadcnProp === "months");
  const months = parseInt(monthsProp?.value ?? "1", 10);
  return months >= 2
    ? renderDatePickerRange(imports, indent, months)
    : renderDatePickerSingle(imports, indent);
}

// ─── Input OTP renderer ──────────────────────────────────────────────────────

/** Render N OTP slot nodes as a complete <InputOTP> with one <InputOTPGroup> */
function renderInputOTPGroup(slots: ScannedNode[], imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);

  addImport(imports, INSTALL_KEY,                 "pnpm dlx shadcn@latest add input-otp");
  addImport(imports, DIRECTIVE_KEY,               '"use client"');
  addImport(imports, "@/components/ui/input-otp", "InputOTP");
  addImport(imports, "@/components/ui/input-otp", "InputOTPGroup");
  addImport(imports, "@/components/ui/input-otp", "InputOTPSlot");

  const count    = slots.length || 6;
  const slotLines = Array.from({ length: count }, (_, i) => `${p2}<InputOTPSlot index={${i}} />`).join("\n");

  return [
    `${pad}<InputOTP maxLength={${count}}>`,
    `${p1}<InputOTPGroup>`,
    slotLines,
    `${p1}</InputOTPGroup>`,
    `${pad}</InputOTP>`,
  ].join("\n");
}

function renderInputOTP(node: ScannedNode, imports: ImportMap, indent: number): string {
  // Single standalone slot — render as a full 6-slot OTP (no parent frame to count from)
  return renderInputOTPGroup([node], imports, indent);
}

// ─── Input renderer ──────────────────────────────────────────────────────────

/** Return the first text string found anywhere in a children tree */
function findFirstText(children: string | ScannedTree[]): string | null {
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

/** Find all __input_decoration__ ScannedNodes anywhere in the children tree */
function findDecorationNodes(children: string | ScannedTree[]): ScannedNode[] {
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

function renderInputAddon(dec: ScannedNode, imports: ImportMap, indent: number, align: string | null): string {
  addImport(imports, "@/components/ui/input-group", "InputGroupAddon");

  const pad       = "  ".repeat(indent);
  const p1        = "  ".repeat(indent + 1);
  const alignAttr = align ? ` align="${align}"` : "";
  const muted     = dec.props.find(p => p.shadcnProp === "type")?.value === "icon-muted";
  const iconCls   = `size-4${muted ? " text-muted-foreground" : ""}`;

  const iconName = findIconChild(dec.children as ScannedTree[]) ?? "Search";
  addImport(imports, "lucide-react", iconName);

  return [
    `${pad}<InputGroupAddon${alignAttr}>`,
    `${p1}<${iconName} className="${iconCls}" />`,
    `${pad}</InputGroupAddon>`,
  ].join("\n");
}

function renderInput(node: ScannedNode, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);

  const roundProp = node.props.find(p => p.shadcnProp === "roundness");
  const sizeProp  = node.props.find(p => p.shadcnProp === "size");
  const stateProp = node.props.find(p => p.shadcnProp === "state");

  const round    = roundProp?.value === "full";
  const sizeVal  = sizeProp?.value ?? "";
  const state    = stateProp?.value ?? "";   // "placeholder" | "value" | "disabled" | "error" | ""

  const sizeClassMap: Record<string, string> = { large: "h-12", small: "h-8", mini: "h-6 text-xs" };
  const errorClass = state === "error" ? "border-destructive" : "";
  const classes    = [sizeClassMap[sizeVal] ?? "", round ? "rounded-full" : "", errorClass].filter(Boolean).join(" ");
  const classAttr  = classes ? ` className="${classes}"` : "";
  const disAttr    = state === "disabled" ? " disabled" : "";

  // Extract text from the scanned children tree (Figma "Value" text property)
  const rawText = findFirstText(node.children as ScannedTree[]);

  // Build value/placeholder attribute based on state
  let valueAttr = "";
  if (state === "value" && rawText) {
    valueAttr = ` defaultValue="${rawText}"`;
  } else if (state === "placeholder" && rawText) {
    valueAttr = ` placeholder="${rawText}"`;
  } else if (state === "placeholder") {
    valueAttr = ` placeholder="Enter a value"`;
  }

  const decorations = findDecorationNodes(node.children as ScannedTree[]);

  if (decorations.length > 0) {
    addImport(imports, INSTALL_KEY,                   "pnpm dlx shadcn@latest add input input-group");
    addImport(imports, "@/components/ui/input-group",  "InputGroup");
    addImport(imports, "@/components/ui/input-group",  "InputGroupInput");

    const addonLines = decorations.map(dec => {
      const isRight = /right/i.test(dec.layerName);
      return renderInputAddon(dec, imports, indent + 1, isRight ? "inline-end" : null);
    });

    return [
      `${pad}<InputGroup>`,
      `${p1}<InputGroupInput${valueAttr}${classAttr}${disAttr} />`,
      ...addonLines,
      `${pad}</InputGroup>`,
    ].join("\n");
  }

  addImport(imports, INSTALL_KEY,             "pnpm dlx shadcn@latest add input");
  addImport(imports, "@/components/ui/input", "Input");
  return `${pad}<Input${valueAttr}${classAttr}${disAttr} />`;
}

function renderInputDecoration(node: ScannedNode, imports: ImportMap, indent: number): string {
  // Standalone decoration — render as a single addon (right side by default)
  return renderInputAddon(node, imports, indent, "inline-end");
}

function renderInputFile(node: ScannedNode, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);

  addImport(imports, INSTALL_KEY,             "pnpm dlx shadcn@latest add input field");
  addImport(imports, "@/components/ui/input", "Input");
  addImport(imports, "@/components/ui/field", "Field");
  addImport(imports, "@/components/ui/field", "FieldLabel");
  addImport(imports, "@/components/ui/field", "FieldDescription");

  const roundProp = node.props.find(p => p.shadcnProp === "roundness");
  const sizeProp  = node.props.find(p => p.shadcnProp === "size");
  const stateProp = node.props.find(p => p.shadcnProp === "state");

  const round   = roundProp?.value === "full";
  const sizeVal = sizeProp?.value ?? "";
  const isError = stateProp?.value === "error";

  const sizeClassMap: Record<string, string> = { large: "h-12", small: "h-8", mini: "h-6 text-xs" };
  const classes   = [sizeClassMap[sizeVal] ?? "", round ? "rounded-full" : "", isError ? "border-destructive" : ""].filter(Boolean).join(" ");
  const classAttr = classes ? ` className="${classes}"` : "";

  return [
    `${pad}<Field>`,
    `${p1}<FieldLabel htmlFor="file">Label</FieldLabel>`,
    `${p1}<Input id="file" type="file"${classAttr} />`,
    `${p1}<FieldDescription>Select a file to upload.</FieldDescription>`,
    `${pad}</Field>`,
  ].join("\n");
}

// ─── Field renderer ──────────────────────────────────────────────────────────

function renderField(node: ScannedNode, imports: ImportMap, indent: number, orientation: "vertical" | "horizontal"): string {
  const typeProp = node.props.find(p => p.shadcnProp === "type");
  const type     = typeProp?.value ?? "text";

  addImport(imports, INSTALL_KEY,            "pnpm dlx shadcn@latest add field");
  addImport(imports, "@/components/ui/field", "Field");
  addImport(imports, "@/components/ui/field", "FieldLabel");

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);

  const orientAttr = orientation === "horizontal" ? ` orientation="horizontal"` : "";
  const fieldId    = `field-${type}`;

  let inner = "";

  if (type === "text") {
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add input");
    addImport(imports, "@/components/ui/input", "Input");
    inner = [
      `${p1}<FieldLabel htmlFor="${fieldId}">Label</FieldLabel>`,
      `${p1}<Input id="${fieldId}" placeholder="Enter a value" />`,
    ].join("\n");
  } else if (type === "select") {
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add select");
    addImport(imports, "@/components/ui/select", "Select");
    addImport(imports, "@/components/ui/select", "SelectContent");
    addImport(imports, "@/components/ui/select", "SelectItem");
    addImport(imports, "@/components/ui/select", "SelectTrigger");
    addImport(imports, "@/components/ui/select", "SelectValue");
    inner = [
      `${p1}<FieldLabel htmlFor="${fieldId}">Label</FieldLabel>`,
      `${p1}<Select>`,
      `${p1}  <SelectTrigger id="${fieldId}"><SelectValue placeholder="Select an item" /></SelectTrigger>`,
      `${p1}  <SelectContent>`,
      `${p1}    <SelectItem value="option1">Option 1</SelectItem>`,
      `${p1}    <SelectItem value="option2">Option 2</SelectItem>`,
      `${p1}  </SelectContent>`,
      `${p1}</Select>`,
    ].join("\n");
  } else if (type === "textarea") {
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add textarea");
    addImport(imports, "@/components/ui/textarea", "Textarea");
    inner = [
      `${p1}<FieldLabel htmlFor="${fieldId}">Label</FieldLabel>`,
      `${p1}<Textarea id="${fieldId}" placeholder="Type your message here" />`,
    ].join("\n");
  } else if (type === "radio") {
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add radio-group");
    addImport(imports, "@/components/ui/radio-group", "RadioGroup");
    addImport(imports, "@/components/ui/radio-group", "RadioGroupItem");
    addImport(imports, "@/components/ui/label",       "Label");
    inner = [
      `${p1}<FieldLabel>Label</FieldLabel>`,
      `${p1}<RadioGroup defaultValue="option1">`,
      `${p1}  <div className="flex items-center gap-2"><RadioGroupItem id="r1" value="option1" /><Label htmlFor="r1">Option 1</Label></div>`,
      `${p1}  <div className="flex items-center gap-2"><RadioGroupItem id="r2" value="option2" /><Label htmlFor="r2">Option 2</Label></div>`,
      `${p1}</RadioGroup>`,
    ].join("\n");
  } else if (type === "checkbox") {
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add checkbox");
    addImport(imports, "@/components/ui/checkbox", "Checkbox");
    // Checkbox fields are always horizontal
    inner = [
      `${p1}<Checkbox id="${fieldId}" />`,
      `${p1}<FieldLabel htmlFor="${fieldId}">Label</FieldLabel>`,
    ].join("\n");
    const checkboxOrient = ` orientation="horizontal"`;
    return [`${pad}<Field${checkboxOrient}>`, inner, `${pad}</Field>`].join("\n");
  } else if (type === "slider") {
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add slider");
    addImport(imports, "@/components/ui/slider", "Slider");
    inner = [
      `${p1}<FieldLabel>Label</FieldLabel>`,
      `${p1}<Slider defaultValue={[50]} max={100} step={1} />`,
    ].join("\n");
  }

  return [`${pad}<Field${orientAttr}>`, inner, `${pad}</Field>`].join("\n");
}

// ─── Item renderer ───────────────────────────────────────────────────────────

/** Collect all text strings found anywhere in a children tree, in order */
function findAllTexts(children: string | ScannedTree[]): string[] {
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

function renderItem(node: ScannedNode, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);
  const p3  = "  ".repeat(indent + 3);

  addImport(imports, INSTALL_KEY,            "pnpm dlx shadcn@latest add item");
  addImport(imports, "@/components/ui/item", "Item");
  addImport(imports, "@/components/ui/item", "ItemContent");
  addImport(imports, "@/components/ui/item", "ItemTitle");

  const get = (prop: string) => node.props.find(p => p.shadcnProp === prop)?.value ?? null;

  const variant    = get("variant");
  const size       = get("size");
  const mediaType  = get("mediaType");
  const actionType = get("actionType");
  const titleText  = get("title")  || findAllTexts(node.children as ScannedTree[])[0] || "Title";
  const descText   = get("description") || findAllTexts(node.children as ScannedTree[])[1] || null;
  const labelText  = get("label");

  const variantAttr = variant ? ` variant="${variant}"` : "";
  const sizeAttr    = size    ? ` size="${size}"`       : "";

  const lines: string[] = [`${pad}<Item${variantAttr}${sizeAttr}>`];

  // ── ItemMedia ──────────────────────────────────────────────────────────────
  if (mediaType) {
    addImport(imports, "@/components/ui/item", "ItemMedia");

    if (mediaType === "icon" || mediaType === "iconBadge") {
      const iconName = findIconChild(node.children as ScannedTree[]) ?? "InboxIcon";
      addImport(imports, "lucide-react", iconName);
      const mvAttr = mediaType === "iconBadge" ? ` variant="iconBadge"` : ` variant="icon"`;
      lines.push(`${p1}<ItemMedia${mvAttr}>`, `${p2}<${iconName} />`, `${p1}</ItemMedia>`);

    } else if (mediaType === "avatar") {
      addImport(imports, "@/components/ui/avatar", "Avatar");
      addImport(imports, "@/components/ui/avatar", "AvatarImage");
      addImport(imports, "@/components/ui/avatar", "AvatarFallback");
      lines.push(
        `${p1}<ItemMedia>`,
        `${p2}<Avatar className="size-10">`,
        `${p3}<AvatarImage src="" alt="" />`,
        `${p3}<AvatarFallback>AB</AvatarFallback>`,
        `${p2}</Avatar>`,
        `${p1}</ItemMedia>`,
      );

    } else if (mediaType === "avatarStack") {
      addImport(imports, "@/components/ui/avatar", "Avatar");
      addImport(imports, "@/components/ui/avatar", "AvatarImage");
      addImport(imports, "@/components/ui/avatar", "AvatarFallback");
      lines.push(
        `${p1}<ItemMedia>`,
        `${p2}<div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">`,
        `${p3}<Avatar><AvatarImage src="" alt="" /><AvatarFallback>A</AvatarFallback></Avatar>`,
        `${p3}<Avatar><AvatarImage src="" alt="" /><AvatarFallback>B</AvatarFallback></Avatar>`,
        `${p2}</div>`,
        `${p1}</ItemMedia>`,
      );

    } else if (mediaType === "image") {
      lines.push(
        `${p1}<ItemMedia>`,
        `${p2}<img src="" alt="" className="size-10 rounded-sm object-cover" />`,
        `${p1}</ItemMedia>`,
      );
    }
  }

  // ── ItemContent ────────────────────────────────────────────────────────────
  lines.push(`${p1}<ItemContent>`);
  lines.push(`${p2}<ItemTitle>${titleText}</ItemTitle>`);
  if (descText) {
    addImport(imports, "@/components/ui/item", "ItemDescription");
    lines.push(`${p2}<ItemDescription>${descText}</ItemDescription>`);
  }
  lines.push(`${p1}</ItemContent>`);

  // ── ItemActions ────────────────────────────────────────────────────────────
  if (actionType) {
    addImport(imports, "@/components/ui/item", "ItemActions");

    if (actionType === "button") {
      addImport(imports, "@/components/ui/button", "Button");
      const btnText = findAllTexts(node.children as ScannedTree[]).find(t => t !== titleText && t !== descText) ?? "Action";
      lines.push(`${p1}<ItemActions>`, `${p2}<Button size="sm" variant="outline">${btnText}</Button>`, `${p1}</ItemActions>`);

    } else if (actionType === "iconButton") {
      const iconName = findIconChild(node.children as ScannedTree[]) ?? "Plus";
      addImport(imports, "@/components/ui/button", "Button");
      addImport(imports, "lucide-react", iconName);
      lines.push(`${p1}<ItemActions>`, `${p2}<Button size="icon-sm" variant="outline" className="rounded-full"><${iconName} /></Button>`, `${p1}</ItemActions>`);

    } else if (actionType === "label") {
      lines.push(`${p1}<ItemActions>`, `${p2}<span className="text-sm text-muted-foreground">${labelText ?? ""}</span>`, `${p1}</ItemActions>`);

    } else if (actionType === "icon") {
      const iconName = findIconChild(node.children as ScannedTree[]) ?? "ChevronRight";
      addImport(imports, "@/components/ui/button", "Button");
      addImport(imports, "lucide-react", iconName);
      lines.push(`${p1}<ItemActions>`, `${p2}<Button size="icon-sm" variant="ghost"><${iconName} /></Button>`, `${p1}</ItemActions>`);
    }
  }

  lines.push(`${pad}</Item>`);
  return lines.join("\n");
}

// ─── Empty renderer ──────────────────────────────────────────────────────────

function renderEmpty(node: ScannedNode, imports: ImportMap, indent: number): string {
  addImport(imports, INSTALL_KEY,              "pnpm dlx shadcn@latest add empty");
  addImport(imports, "lucide-react",           "Inbox");
  addImport(imports, "@/components/ui/button", "Button");
  addImport(imports, "@/components/ui/empty",  "Empty");
  addImport(imports, "@/components/ui/empty",  "EmptyContent");
  addImport(imports, "@/components/ui/empty",  "EmptyDescription");
  addImport(imports, "@/components/ui/empty",  "EmptyHeader");
  addImport(imports, "@/components/ui/empty",  "EmptyMedia");
  addImport(imports, "@/components/ui/empty",  "EmptyTitle");

  const variantProp = node.props.find(p => p.shadcnProp === "variant");
  const variant     = variantProp?.value ?? "default";

  // Extract title from scanned children text
  const children   = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const texts      = collectTexts(children);
  const title      = texts[0] ?? "No results";
  const desc       = texts[1] ?? "Try adjusting your search or filters.";

  const variantAttr = variant !== "default" ? ` variant="${variant}"` : "";

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);

  return [
    `${pad}<Empty${variantAttr}>`,
    `${p1}<EmptyHeader>`,
    `${p2}<EmptyMedia><Inbox /></EmptyMedia>`,
    `${p2}<EmptyTitle>${title}</EmptyTitle>`,
    `${p2}<EmptyDescription>${desc}</EmptyDescription>`,
    `${p1}</EmptyHeader>`,
    `${p1}<EmptyContent>`,
    `${p2}<Button>Take action</Button>`,
    `${p1}</EmptyContent>`,
    `${pad}</Empty>`,
  ].join("\n");
}

// ─── Navigation Menu renderer ────────────────────────────────────────────────

/**
 * Figma structure:
 *   Navigation Menu → contains Button instances (the trigger labels)
 *   .Navigation Menu Content → sibling component, contains Menu Item instances
 *
 * Each Button child → NavigationMenuItem with NavigationMenuTrigger.
 * Each Menu Item in content → li with NavigationMenuLink.
 */
function renderNavigationMenuContent(items: ScannedNode[], imports: ImportMap, indent: number): string {
  const p0 = "  ".repeat(indent);
  const p1 = "  ".repeat(indent + 1);
  const p2 = "  ".repeat(indent + 2);
  const p3 = "  ".repeat(indent + 3);
  const p4 = "  ".repeat(indent + 4);

  addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuContent");
  addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuLink");

  const lines: string[] = [
    `${p0}<NavigationMenuContent>`,
    `${p1}<ul className="grid gap-2 p-4 w-[400px]">`,
  ];

  items.forEach(item => {
    const texts     = findAllTexts(item.children as ScannedTree[]);
    const title     = texts[0] ?? "Item";
    const desc      = texts[1] ?? null;
    const isDestruct = item.props.find(p => p.shadcnProp === "type")?.value === "destructive";
    lines.push(
      `${p2}<li>`,
      `${p3}<NavigationMenuLink asChild>`,
      `${p4}<a href="#">`,
      `${p4}  <div className="flex flex-col gap-1 text-sm">`,
      `${p4}    <div className="font-medium leading-none${isDestruct ? " text-destructive" : ""}">${title}</div>`,
      ...(desc ? [`${p4}    <div className="line-clamp-2 text-muted-foreground">${desc}</div>`] : []),
      `${p4}  </div>`,
      `${p4}</a>`,
      `${p3}</NavigationMenuLink>`,
      `${p2}</li>`,
    );
  });

  lines.push(`${p1}</ul>`, `${p0}</NavigationMenuContent>`);
  return lines.join("\n");
}

function renderNavigationMenu(node: ScannedNode, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);
  const p3  = "  ".repeat(indent + 3);

  addImport(imports, INSTALL_KEY,                       "pnpm dlx shadcn@latest add navigation-menu");
  addImport(imports, DIRECTIVE_KEY,                     '"use client"');
  addImport(imports, "@/components/ui/navigation-menu", "NavigationMenu");
  addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuList");
  addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuItem");
  addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuLink");
  addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuTrigger");
  addImport(imports, "@/components/ui/navigation-menu", "navigationMenuTriggerStyle");

  const children = Array.isArray(node.children) ? (node.children as ScannedTree[]) : [];

  // Button children are the trigger items; extract their label text
  const buttonChildren = children.filter(
    c => "component" in c && (c as ScannedNode).component === "Button"
  ) as ScannedNode[];

  const triggerLabels = buttonChildren.length > 0
    ? buttonChildren.map(btn => (typeof btn.children === "string" ? btn.children : findFirstText(btn.children as ScannedTree[])) ?? "Menu")
    : findAllTexts(children).slice(0, 3);  // fallback: any text found

  const lines: string[] = [`${pad}<NavigationMenu>`, `${p1}<NavigationMenuList>`];

  if (triggerLabels.length === 0) {
    // No children detected — static placeholder
    lines.push(
      `${p2}<NavigationMenuItem>`,
      `${p3}<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>`,
      `${p3}  <a href="#">Home</a>`,
      `${p3}</NavigationMenuLink>`,
      `${p2}</NavigationMenuItem>`,
    );
  } else {
    triggerLabels.forEach(label => {
      lines.push(
        `${p2}<NavigationMenuItem>`,
        `${p3}<NavigationMenuTrigger>${label}</NavigationMenuTrigger>`,
        `${p3}<NavigationMenuContent>`,
        `${p3}  {/* Add your menu items here */}`,
        `${p3}</NavigationMenuContent>`,
        `${p2}</NavigationMenuItem>`,
      );
    });
  }

  lines.push(`${p1}</NavigationMenuList>`, `${pad}</NavigationMenu>`);
  return lines.join("\n");
}

// ─── Icon Button renderer ─────────────────────────────────────────────────────

function renderIconButton(node: ScannedNode, imports: ImportMap, indent: number): string {
  addImport(imports, INSTALL_KEY,              "pnpm dlx shadcn@latest add button");
  addImport(imports, "@/components/ui/button", "Button");

  const pad = "  ".repeat(indent);

  const variantProp  = node.props.find(p => p.shadcnProp === "variant");
  const sizeProp     = node.props.find(p => p.shadcnProp === "size");
  const roundProp    = node.props.find(p => p.shadcnProp === "roundness");
  const disabledProp = node.props.find(p => p.shadcnProp === "disabled");

  const variant  = variantProp?.value  ?? "default";
  const sizeVal  = sizeProp?.value     ?? "default";
  const round    = roundProp?.value    === "full";
  const disabled = disabledProp?.value === "true";

  const variantAttr  = variant !== "default" ? ` variant="${variant}"` : "";
  const disabledAttr = disabled ? " disabled" : "";

  const sizeClassMap: Record<string, string> = { large: "size-12", small: "size-8", mini: "size-6" };
  const sizeClass  = sizeClassMap[sizeVal] ?? "";
  const roundClass = round ? "rounded-full" : "";
  const classes    = [sizeClass, roundClass].filter(Boolean).join(" ");
  const classAttr  = classes ? ` className="${classes}"` : "";

  // Read the actual icon from scanned children; fall back to Plus
  const iconName = findIconChild(node.children as ScannedTree[]) ?? "Plus";
  addImport(imports, "lucide-react", iconName);

  return `${pad}<Button size="icon"${variantAttr}${classAttr}${disabledAttr}><${iconName} className="size-4" /></Button>`;
}

// ─── Hover Card renderer ──────────────────────────────────────────────────────

function renderHoverCard(node: ScannedNode, imports: ImportMap, indent: number): string {
  addImport(imports, INSTALL_KEY,                    "pnpm dlx shadcn@latest add hover-card avatar");
  addImport(imports, "@/components/ui/hover-card",   "HoverCard");
  addImport(imports, "@/components/ui/hover-card",   "HoverCardContent");
  addImport(imports, "@/components/ui/hover-card",   "HoverCardTrigger");
  addImport(imports, "@/components/ui/button",       "Button");
  addImport(imports, "@/components/ui/avatar",       "Avatar");
  addImport(imports, "@/components/ui/avatar",       "AvatarFallback");
  addImport(imports, "@/components/ui/avatar",       "AvatarImage");
  addImport(imports, "lucide-react",                 "CalendarDays");

  // Extract trigger label from children text (e.g. Link Button label)
  const children  = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const texts     = collectTexts(children);
  const trigger   = texts[0] ?? "@nextjs";

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);
  const p3  = "  ".repeat(indent + 3);
  const p4  = "  ".repeat(indent + 4);

  return [
    `${pad}<HoverCard>`,
    `${p1}<HoverCardTrigger asChild>`,
    `${p2}<Button variant="link">${trigger}</Button>`,
    `${p1}</HoverCardTrigger>`,
    `${p1}<HoverCardContent className="w-80">`,
    `${p2}<div className="flex justify-between space-x-4">`,
    `${p3}<Avatar>`,
    `${p4}<AvatarImage src="https://github.com/vercel.png" />`,
    `${p4}<AvatarFallback>VC</AvatarFallback>`,
    `${p3}</Avatar>`,
    `${p3}<div className="space-y-1">`,
    `${p4}<h4 className="text-sm font-semibold">${trigger}</h4>`,
    `${p4}<p className="text-sm">The React Framework – created and maintained by @vercel.</p>`,
    `${p4}<div className="flex items-center pt-2">`,
    `${p4}  <CalendarDays className="mr-2 h-4 w-4 opacity-70" />`,
    `${p4}  <span className="text-xs text-muted-foreground">Joined December 2021</span>`,
    `${p4}</div>`,
    `${p3}</div>`,
    `${p2}</div>`,
    `${p1}</HoverCardContent>`,
    `${pad}</HoverCard>`,
  ].join("\n");
}

// ─── Drawer renderer ─────────────────────────────────────────────────────────

function renderDrawer(_node: ScannedNode, imports: ImportMap, indent: number): string {
  addImport(imports, INSTALL_KEY,               "pnpm dlx shadcn@latest add drawer");
  addImport(imports, "@/components/ui/button",  "Button");
  addImport(imports, "@/components/ui/drawer",  "Drawer");
  addImport(imports, "@/components/ui/drawer",  "DrawerClose");
  addImport(imports, "@/components/ui/drawer",  "DrawerContent");
  addImport(imports, "@/components/ui/drawer",  "DrawerDescription");
  addImport(imports, "@/components/ui/drawer",  "DrawerFooter");
  addImport(imports, "@/components/ui/drawer",  "DrawerHeader");
  addImport(imports, "@/components/ui/drawer",  "DrawerTitle");
  addImport(imports, "@/components/ui/drawer",  "DrawerTrigger");

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);
  const p3  = "  ".repeat(indent + 3);

  addImport(imports, PREAMBLE_KEY,
    `const DRAWER_SIDES = ["top", "right", "bottom", "left"] as const`
  );

  return [
    `${pad}<div className="flex flex-wrap gap-2">`,
    `${p1}{DRAWER_SIDES.map((side) => (`,
    `${p2}<Drawer`,
    `${p2}  key={side}`,
    `${p2}  direction={side === "bottom" ? undefined : (side as "top" | "right" | "left")}`,
    `${p2}>`,
    `${p3}<DrawerTrigger asChild>`,
    `${p3}  <Button variant="outline" className="capitalize">{side}</Button>`,
    `${p3}</DrawerTrigger>`,
    `${p3}<DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">`,
    `${p3}  <DrawerHeader>`,
    `${p3}    <DrawerTitle>Move Goal</DrawerTitle>`,
    `${p3}    <DrawerDescription>Set your daily activity goal.</DrawerDescription>`,
    `${p3}  </DrawerHeader>`,
    `${p3}  <div className="no-scrollbar overflow-y-auto px-4">`,
    `${p3}    {Array.from({ length: 5 }).map((_, i) => (`,
    `${p3}      <p key={i} className="mb-4 leading-normal">`,
    `${p3}        Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    `${p3}      </p>`,
    `${p3}    ))}`,
    `${p3}  </div>`,
    `${p3}  <DrawerFooter>`,
    `${p3}    <Button>Submit</Button>`,
    `${p3}    <DrawerClose asChild>`,
    `${p3}      <Button variant="outline">Cancel</Button>`,
    `${p3}    </DrawerClose>`,
    `${p3}  </DrawerFooter>`,
    `${p3}</DrawerContent>`,
    `${p2}</Drawer>`,
    `${p1}  ))}`,
    `${pad}</div>`,
  ].join("\n");
}

// ─── Dialog renderers ────────────────────────────────────────────────────────

function dialogImports(imports: ImportMap) {
  addImport(imports, INSTALL_KEY,                  "pnpm dlx shadcn@latest add dialog");
  addImport(imports, "@/components/ui/button",     "Button");
  addImport(imports, "@/components/ui/dialog",     "Dialog");
  addImport(imports, "@/components/ui/dialog",     "DialogClose");
  addImport(imports, "@/components/ui/dialog",     "DialogContent");
  addImport(imports, "@/components/ui/dialog",     "DialogDescription");
  addImport(imports, "@/components/ui/dialog",     "DialogFooter");
  addImport(imports, "@/components/ui/dialog",     "DialogHeader");
  addImport(imports, "@/components/ui/dialog",     "DialogTitle");
  addImport(imports, "@/components/ui/dialog",     "DialogTrigger");
}

function renderDialog(_node: ScannedNode, imports: ImportMap, indent: number): string {
  dialogImports(imports);
  addImport(imports, "@/components/ui/field",  "Field");
  addImport(imports, "@/components/ui/field",  "FieldGroup");
  addImport(imports, "@/components/ui/input",  "Input");
  addImport(imports, "@/components/ui/label",  "Label");

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);
  const p3  = "  ".repeat(indent + 3);

  return [
    `${pad}<Dialog>`,
    `${p1}<form>`,
    `${p2}<DialogTrigger asChild>`,
    `${p3}<Button variant="outline">Open Dialog</Button>`,
    `${p2}</DialogTrigger>`,
    `${p2}<DialogContent className="sm:max-w-sm">`,
    `${p3}<DialogHeader>`,
    `${p3}  <DialogTitle>Edit profile</DialogTitle>`,
    `${p3}  <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>`,
    `${p3}</DialogHeader>`,
    `${p3}<FieldGroup>`,
    `${p3}  <Field>`,
    `${p3}    <Label htmlFor="name">Name</Label>`,
    `${p3}    <Input id="name" name="name" defaultValue="Pedro Duarte" />`,
    `${p3}  </Field>`,
    `${p3}  <Field>`,
    `${p3}    <Label htmlFor="username">Username</Label>`,
    `${p3}    <Input id="username" name="username" defaultValue="@peduarte" />`,
    `${p3}  </Field>`,
    `${p3}</FieldGroup>`,
    `${p3}<DialogFooter>`,
    `${p3}  <DialogClose asChild>`,
    `${p3}    <Button variant="outline">Cancel</Button>`,
    `${p3}  </DialogClose>`,
    `${p3}  <Button type="submit">Save changes</Button>`,
    `${p3}</DialogFooter>`,
    `${p2}</DialogContent>`,
    `${p1}</form>`,
    `${pad}</Dialog>`,
  ].join("\n");
}

function renderDialogHeader(node: ScannedNode, imports: ImportMap, indent: number): string {
  dialogImports(imports);
  const typeProp = node.props.find(p => p.shadcnProp === "type");
  const type     = typeProp?.value ?? "header";

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);

  if (type === "close-only" || type === "icon-close") {
    addImport(imports, "lucide-react", "X");
    return [
      `${pad}<DialogHeader>`,
      `${p1}<DialogTitle>Dialog Title</DialogTitle>`,
      `${p1}<DialogClose asChild>`,
      `${p1}  <Button variant="ghost" size="icon" className="absolute right-4 top-4"><X className="h-4 w-4" /></Button>`,
      `${p1}</DialogClose>`,
      `${pad}</DialogHeader>`,
    ].join("\n");
  }

  return [
    `${pad}<DialogHeader>`,
    `${p1}<DialogTitle>Dialog Title</DialogTitle>`,
    `${p1}<DialogDescription>Dialog description goes here.</DialogDescription>`,
    `${pad}</DialogHeader>`,
  ].join("\n");
}

function renderDialogFooter(node: ScannedNode, imports: ImportMap, indent: number): string {
  dialogImports(imports);
  const typeProp = node.props.find(p => p.shadcnProp === "type");
  const type     = typeProp?.value ?? "2-buttons-right";

  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);

  if (type === "1-full-width") {
    return [
      `${pad}<DialogFooter>`,
      `${p1}<Button type="submit" className="w-full">Save changes</Button>`,
      `${pad}</DialogFooter>`,
    ].join("\n");
  }

  if (type === "2-full-width") {
    return [
      `${pad}<DialogFooter className="flex-col gap-2 sm:flex-col">`,
      `${p1}<Button type="submit" className="w-full">Save changes</Button>`,
      `${p1}<DialogClose asChild>`,
      `${p1}  <Button variant="outline" className="w-full">Cancel</Button>`,
      `${p1}</DialogClose>`,
      `${pad}</DialogFooter>`,
    ].join("\n");
  }

  // default: 2-buttons-right
  return [
    `${pad}<DialogFooter>`,
    `${p1}<DialogClose asChild>`,
    `${p1}  <Button variant="outline">Cancel</Button>`,
    `${p1}</DialogClose>`,
    `${p1}<Button type="submit">Save changes</Button>`,
    `${pad}</DialogFooter>`,
  ].join("\n");
}

// ─── Command renderer ─────────────────────────────────────────────────────────

function renderCommand(_node: ScannedNode, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);
  const p3  = "  ".repeat(indent + 3);

  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add command");
  addImport(imports, "lucide-react",              "Calendar");
  addImport(imports, "lucide-react",              "Smile");
  addImport(imports, "lucide-react",              "Calculator");
  addImport(imports, "lucide-react",              "User");
  addImport(imports, "lucide-react",              "CreditCard");
  addImport(imports, "lucide-react",              "Settings");
  addImport(imports, "@/components/ui/command",   "Command");
  addImport(imports, "@/components/ui/command",   "CommandEmpty");
  addImport(imports, "@/components/ui/command",   "CommandGroup");
  addImport(imports, "@/components/ui/command",   "CommandInput");
  addImport(imports, "@/components/ui/command",   "CommandItem");
  addImport(imports, "@/components/ui/command",   "CommandList");
  addImport(imports, "@/components/ui/command",   "CommandSeparator");
  addImport(imports, "@/components/ui/command",   "CommandShortcut");

  return [
    `${pad}<Command className="max-w-sm rounded-lg border">`,
    `${p1}<CommandInput placeholder="Type a command or search..." />`,
    `${p1}<CommandList>`,
    `${p2}<CommandEmpty>No results found.</CommandEmpty>`,
    `${p2}<CommandGroup heading="Suggestions">`,
    `${p3}<CommandItem><Calendar /><span>Calendar</span></CommandItem>`,
    `${p3}<CommandItem><Smile /><span>Search Emoji</span></CommandItem>`,
    `${p3}<CommandItem disabled><Calculator /><span>Calculator</span></CommandItem>`,
    `${p2}</CommandGroup>`,
    `${p2}<CommandSeparator />`,
    `${p2}<CommandGroup heading="Settings">`,
    `${p3}<CommandItem><User /><span>Profile</span><CommandShortcut>⌘P</CommandShortcut></CommandItem>`,
    `${p3}<CommandItem><CreditCard /><span>Billing</span><CommandShortcut>⌘B</CommandShortcut></CommandItem>`,
    `${p3}<CommandItem><Settings /><span>Settings</span><CommandShortcut>⌘S</CommandShortcut></CommandItem>`,
    `${p2}</CommandGroup>`,
    `${p1}</CommandList>`,
    `${pad}</Command>`,
  ].join("\n");
}

// ─── Checkbox helpers ─────────────────────────────────────────────────────────

function renderCheckbox(node: ScannedNode, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const ip  = "  ".repeat(indent + 1);

  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add checkbox");
  addImport(imports, "@/components/ui/checkbox", "Checkbox");
  addImport(imports, "@/components/ui/field",    "Field");
  addImport(imports, "@/components/ui/field",    "FieldLabel");

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const label    = collectTexts(children)[0] ?? "Label";
  const id       = toJsKey(label) + "-checkbox";

  const disabled = node.props.find(p => p.shadcnProp === "disabled" && p.value === "true");
  const checked  = node.props.find(p => p.shadcnProp === "checked");
  const checkedAttr = checked?.value === "true"        ? " defaultChecked"
                    : checked?.value === "indeterminate" ? ` checked="indeterminate"`
                    : "";
  const disabledAttr = disabled ? " disabled" : "";

  return [
    `${pad}<Field orientation="horizontal">`,
    `${ip}<Checkbox id="${id}" name="${id}"${checkedAttr}${disabledAttr} />`,
    `${ip}<FieldLabel htmlFor="${id}">${label}</FieldLabel>`,
    `${pad}</Field>`,
  ].join("\n");
}

function renderCheckboxGroup(node: ScannedNode, imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);

  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add checkbox");
  addImport(imports, "@/components/ui/checkbox", "Checkbox");
  addImport(imports, "@/components/ui/field",    "Field");
  addImport(imports, "@/components/ui/field",    "FieldGroup");
  addImport(imports, "@/components/ui/field",    "FieldLabel");
  addImport(imports, "@/components/ui/field",    "FieldLegend");
  addImport(imports, "@/components/ui/field",    "FieldSet");

  // Collect child checkbox nodes (scanned as ScannedNode with component "Checkbox")
  const childCheckboxes = (Array.isArray(node.children) ? node.children as ScannedTree[] : [])
    .filter(c => "component" in c && (c as ScannedNode).component === "Checkbox") as ScannedNode[];

  const items = childCheckboxes.length > 0
    ? childCheckboxes
    : [null, null, null]; // placeholder rows if no children scanned

  const fieldItems = items.map((child, i) => {
    const childTexts = child
      ? collectTexts(Array.isArray(child.children) ? child.children as ScannedTree[] : [])
      : [];
    const label = childTexts[0] ?? `Option ${i + 1}`;
    const id    = toJsKey(label) + "-checkbox";
    const checked = child?.props.find(p => p.shadcnProp === "checked");
    const checkedAttr = checked?.value === "true" ? " defaultChecked" : "";
    return [
      `${p2}<Field orientation="horizontal">`,
      `${p2}  <Checkbox id="${id}" name="${id}"${checkedAttr} />`,
      `${p2}  <FieldLabel htmlFor="${id}" className="font-normal">${label}</FieldLabel>`,
      `${p2}</Field>`,
    ].join("\n");
  }).join("\n");

  return [
    `${pad}<FieldSet>`,
    `${p1}<FieldLegend variant="label">Group label</FieldLegend>`,
    `${p1}<FieldGroup className="gap-3">`,
    fieldItems,
    `${p1}</FieldGroup>`,
    `${pad}</FieldSet>`,
  ].join("\n");
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
    if (t.styleName) {
      addImport(imports, "@/components/ui/text", "Text");
      const decorCls = textDecorationClasses(t.align, t.color, t.uppercase);
      const variantAttr = ` variant="${t.styleName}"`;
      const clsAttr = decorCls ? ` className="${decorCls}"` : "";
      return `${pad}<Text${variantAttr}${clsAttr}>${t.content}</Text>`;
    }
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

    // CSS grid containing data table cells → emit full TanStack DataTable template
    if (isDataTableGrid(node)) {
      return renderDataTable(node as unknown as ScannedNode, imports, indent);
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

    // Frame of Input OTP slots → emit <InputOTP> with one group, slot count = child count
    const otpSlots = node.children.filter(
      c => "component" in c && (c as ScannedNode).component === "__input_otp__"
    ) as ScannedNode[];
    if (otpSlots.length > 0 && otpSlots.length === node.children.length) {
      return renderInputOTPGroup(otpSlots, imports, indent);
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

  // Chart components — generate full ChartContainer templates
  if (sn.component === "__chart_bar__")  return renderBarChart(sn, imports, indent);
  if (sn.component === "__chart_area__") return renderAreaChart(sn, imports, indent);
  if (sn.component === "__chart_line__") return renderLineChart(sn, imports, indent);

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

  // Data table — always emit full static template
  if (sn.component === "__data_table_header__" || sn.component === "__data_table_cell__") {
    return renderDataTable(sn, imports, indent);
  }

  // Date picker / calendar
  if (sn.component === "__date_picker__")   return renderDatePickerSingle(imports, indent);
  if (sn.component === "__calendar__")      return renderDatePicker(sn, imports, indent);

  // Input
  if (sn.component === "__input__")            return renderInput(sn, imports, indent);
  if (sn.component === "__input_decoration__") return renderInputDecoration(sn, imports, indent);
  if (sn.component === "__input_file__")       return renderInputFile(sn, imports, indent);
  if (sn.component === "__input_otp__")        return renderInputOTP(sn, imports, indent);

  // Field
  if (sn.component === "__field_vertical__")   return renderField(sn, imports, indent, "vertical");
  if (sn.component === "__field_horizontal__") return renderField(sn, imports, indent, "horizontal");

  // Item
  if (sn.component === "__item__")          return renderItem(sn, imports, indent);

  // Empty state
  if (sn.component === "__empty__")         return renderEmpty(sn, imports, indent);

  // Navigation Menu — sub-components are consumed by renderNavigationMenu, suppress generic render
  if (sn.component === "__navigation_menu__")         return renderNavigationMenu(sn, imports, indent);
  if (sn.component === "__navigation_menu_content__") {
    const pad = "  ".repeat(indent);
    const p1  = "  ".repeat(indent + 1);
    const p2  = "  ".repeat(indent + 2);
    const p3  = "  ".repeat(indent + 3);
    addImport(imports, INSTALL_KEY,                       "pnpm dlx shadcn@latest add navigation-menu");
    addImport(imports, DIRECTIVE_KEY,                     '"use client"');
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenu");
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuList");
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuItem");
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuTrigger");
    const items = (Array.isArray(sn.children) ? sn.children as ScannedTree[] : [])
      .filter(c => "component" in c && (c as ScannedNode).component === "__menu_item__") as ScannedNode[];
    const content = renderNavigationMenuContent(items, imports, indent + 3);
    return [
      `${pad}<NavigationMenu>`,
      `${p1}<NavigationMenuList>`,
      `${p2}<NavigationMenuItem>`,
      `${p3}<NavigationMenuTrigger>Menu</NavigationMenuTrigger>`,
      content,
      `${p2}</NavigationMenuItem>`,
      `${p1}</NavigationMenuList>`,
      `${pad}</NavigationMenu>`,
    ].join("\n");
  }
  if (sn.component === "__menu_item__") return "";

  // Loading Button → <Button variant="outline" disabled> with <Spinner>
  if (sn.component === "__loading_button__") {
    addImport(imports, INSTALL_KEY,               "pnpm dlx shadcn@latest add button spinner");
    addImport(imports, "@/components/ui/button",  "Button");
    addImport(imports, "@/components/ui/spinner", "Spinner");
    const size     = sn.props.find(p => p.shadcnProp === "size")?.value;
    const sizeAttr = size ? ` size="${size}"` : "";
    const label    = typeof sn.children === "string" ? sn.children : "Loading";
    return `${pad}<Button variant="outline"${sizeAttr} disabled>\n${pad}  <Spinner data-icon="inline-start" />\n${pad}  ${label}\n${pad}</Button>`;
  }

  // Link Button → <Button variant="link">
  if (sn.component === "LinkButton") {
    addImport(imports, INSTALL_KEY,              "pnpm dlx shadcn@latest add button");
    addImport(imports, "@/components/ui/button", "Button");
    const size    = sn.props.find(p => p.shadcnProp === "size")?.value;
    const sizeAttr = size ? ` size="${size}"` : "";
    const label   = typeof sn.children === "string" ? sn.children : "Link";
    return `${pad}<Button variant="link"${sizeAttr}>${label}</Button>`;
  }

  // Icon Button
  if (sn.component === "__icon_button__")   return renderIconButton(sn, imports, indent);

  // Hover Card
  if (sn.component === "__hover_card__")    return renderHoverCard(sn, imports, indent);

  // Drawer
  if (sn.component === "__drawer__")        return renderDrawer(sn, imports, indent);

  // Dialog
  if (sn.component === "__dialog__")        return renderDialog(sn, imports, indent);
  if (sn.component === "__dialog_header__") return renderDialogHeader(sn, imports, indent);
  if (sn.component === "__dialog_footer__") return renderDialogFooter(sn, imports, indent);

  // Command — fixed compound structure
  if (sn.component === "__command__") {
    return renderCommand(sn, imports, indent);
  }

  // Checkbox — needs Field + FieldLabel wrapper
  if (sn.component === "Checkbox") {
    return renderCheckbox(sn, imports, indent);
  }

  // Checkbox Group — needs FieldSet + FieldGroup structure
  if (sn.component === "__checkbox_group__") {
    return renderCheckboxGroup(sn, imports, indent);
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
