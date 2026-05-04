import type { ScannedNode, ScannedTree } from "../frame-scanner";
import {
  type ComponentGroup,
  type ImportMap,
  addImport,
  INSTALL_KEY,
  DIRECTIVE_KEY,
  PREAMBLE_KEY,
} from "../render-utils";

// ─── Date Picker renderers ────────────────────────────────────────────────────

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

function renderDatePicker(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  const monthsProp = node.props.find(p => p.shadcnProp === "months");
  const months = parseInt(monthsProp?.value ?? "1", 10);
  return months >= 2
    ? renderDatePickerRange(imports, indent, months)
    : renderDatePickerSingle(imports, indent);
}

function renderDatePickerSingleNode(
  _node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  return renderDatePickerSingle(imports, indent);
}

export { renderDatePickerSingle, renderDatePickerRange };

// ─── Group export ─────────────────────────────────────────────────────────────

export const group: ComponentGroup = {
  defs: {
    "Date Picker": {
      component:  "__date_picker__",
      importPath: "@/components/ui/date-picker",
      ignore:     ["State"],
    },

    "Calendar": {
      component:  "__calendar__",
      importPath: "@/components/ui/calendar",
      props: {
        "Months": {
          shadcnProp: "months",
          values: { "1 month": "1", "2 month": "2", "3 month": "3" },
        },
      },
    },
  },

  renderers: {
    "__date_picker__": renderDatePickerSingleNode,
    "__calendar__":    renderDatePicker,
  },
};
