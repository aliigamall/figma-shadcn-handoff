import type { ScannedNode, ScannedTree } from "../frame-scanner";
import {
  type ComponentGroup,
  type ImportMap,
  addImport,
  INSTALL_KEY,
  DIRECTIVE_KEY,
  PREAMBLE_KEY,
  CSS_KEY,
  RAW_IMPORT_KEY,
  collectTexts,
  toJsKey,
  extractSeries,
  CHART_MONTHS,
  CHART_VALUES,
  CHART_CSS_VARS,
} from "../render-utils";

// ─── Data Table renderer ──────────────────────────────────────────────────────

function renderDataTable(
  _node: ScannedNode,
  imports: ImportMap,
  _indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

// ─── Bar Chart renderer ───────────────────────────────────────────────────────

function renderBarChart(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  const typeProp = node.props.find(p => p.shadcnProp === "type");
  const chartType = typeProp?.value ?? "default";

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const allTexts = collectTexts(children);
  const legendLabels = allTexts.filter(t => !/^[\d.,]+%?$/.test(t.trim()));

  const seriesCount = (chartType === "multiple" || chartType === "stacked") ? 2 : 1;
  const series = extractSeries(legendLabels, seriesCount).map((label, i) => ({ label, key: toJsKey(label), idx: i }));

  const dataLines = CHART_MONTHS.map((m, mi) => {
    const vals = series.map(s => `${s.key}: ${CHART_VALUES[s.idx]?.[mi] ?? 100}`).join(", ");
    return `  { month: "${m}", ${vals} },`;
  });
  const chartDataStr = `const chartData = [\n${dataLines.join("\n")}\n]`;

  const configLines = series.map((s, i) =>
    `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`
  );
  const chartConfigStr = `const chartConfig = {\n${configLines.join("\n")}\n} satisfies ChartConfig`;

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
      const isFirst = i === 0;
      const isLast  = i === series.length - 1;
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

  if (chartType === "interactive") {
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

    return `${p0}<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">\n${p1}<BarChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>\n${p2}<CartesianGrid vertical={false} />\n${p2}<XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />\n${p2}<ChartTooltip content={<ChartTooltipContent className="w-[150px]" nameKey="views" labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />} />\n${p2}<Bar dataKey={activeChart} fill={\`var(--color-\${activeChart})\`} />\n${p1}</BarChart>\n${p0}</ChartContainer>`;
  }

  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");
  addImport(imports, CSS_KEY, CHART_CSS_VARS);
  addImport(imports, PREAMBLE_KEY, chartDataStr);
  addImport(imports, PREAMBLE_KEY, chartConfigStr);

  return `${p0}<ChartContainer config={chartConfig} className="min-h-[200px] w-full">\n${chartInner}\n${p0}</ChartContainer>`;
}

// ─── Area Chart renderer ──────────────────────────────────────────────────────

function renderAreaChart(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  const typeProp  = node.props.find(p => p.shadcnProp === "type");
  const chartType = typeProp?.value ?? "default";

  const children     = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const allTexts     = collectTexts(children);
  const legendLabels = allTexts.filter(t => !/^[\d.,]+%?$/.test(t.trim()));

  const seriesCount = chartType === "stacked" ? 2 : 1;
  const series = extractSeries(legendLabels, seriesCount).map((label, i) => ({ label, key: toJsKey(label), idx: i }));

  addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");
  addImport(imports, CSS_KEY, CHART_CSS_VARS);

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

// ─── Line Chart renderer ──────────────────────────────────────────────────────

function renderLineChart(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

// ─── Group export ─────────────────────────────────────────────────────────────

export const group: ComponentGroup = {
  defs: {
    "Line chart": {
      component:  "__chart_line__",
      importPath: "@/components/ui/chart",
      props: {
        "Type": {
          shadcnProp: "type",
          values: {
            Default:     "default",
            Linear:      "linear",
            Step:        "step",
            Stacked:     "stacked",
            Interactive: "interactive",
          },
        },
      },
    },

    "Area chart": {
      component:  "__chart_area__",
      importPath: "@/components/ui/chart",
      props: {
        "Type": {
          shadcnProp: "type",
          values: {
            Default:     "default",
            Linear:      "linear",
            Step:        "step",
            Stacked:     "stacked",
            Interactive: "interactive",
          },
        },
      },
    },

    "Bar chart": {
      component:  "__chart_bar__",
      importPath: "@/components/ui/chart",
      props: {
        "Type": {
          shadcnProp: "type",
          values: {
            Default:     "default",
            Horizontal:  "horizontal",
            Multiple:    "multiple",
            Stacked:     "stacked",
            Interactive: "interactive",
          },
        },
      },
    },

    "Basic Table Header": {
      component:  "TableHead",
      importPath: "@/components/ui/table",
      ignore:     ["Cell Type", "State", "Alignment"],
    },

    "Basic Table Cell": {
      component:  "TableCell",
      importPath: "@/components/ui/table",
      ignore:     ["Parity", "State", "Alignment"],
    },

    "Table Header": {
      component:  "__data_table_header__",
      importPath: "@/components/ui/table",
      ignore:     ["Content", "Alignment", "State"],
    },

    "Table Cell": {
      component:  "__data_table_cell__",
      importPath: "@/components/ui/table",
      ignore:     ["Content", "Alignment", "State", "Parity"],
    },
  },

  renderers: {
    "__chart_bar__":         renderBarChart,
    "__chart_area__":        renderAreaChart,
    "__chart_line__":        renderLineChart,
    "__data_table_header__": renderDataTable,
    "__data_table_cell__":   renderDataTable,
  },
};
