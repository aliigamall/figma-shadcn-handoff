import type { ScannedNode, ScannedTree } from "../frame-scanner";
import {
  type ComponentGroup,
  type ImportMap,
  addImport,
  INSTALL_KEY,
  DIRECTIVE_KEY,
  findFirstText,
  findDecorationNodes,
  findIconChild,
} from "../render-utils";

// ─── Input addon helper ───────────────────────────────────────────────────────

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

// ─── Input renderer ───────────────────────────────────────────────────────────

function renderInput(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);

  const roundProp = node.props.find(p => p.shadcnProp === "roundness");
  const sizeProp  = node.props.find(p => p.shadcnProp === "size");
  const stateProp = node.props.find(p => p.shadcnProp === "state");

  const round    = roundProp?.value === "full";
  const sizeVal  = sizeProp?.value ?? "";
  const state    = stateProp?.value ?? "";

  const sizeClassMap: Record<string, string> = { large: "h-12", small: "h-8", mini: "h-6 text-xs" };
  const errorClass = state === "error" ? "border-destructive" : "";
  const classes    = [sizeClassMap[sizeVal] ?? "", round ? "rounded-full" : "", errorClass].filter(Boolean).join(" ");
  const classAttr  = classes ? ` className="${classes}"` : "";
  const disAttr    = state === "disabled" ? " disabled" : "";

  const rawText = findFirstText(node.children as ScannedTree[]);

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

// ─── Input Decoration renderer ────────────────────────────────────────────────

function renderInputDecoration(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  return renderInputAddon(node, imports, indent, "inline-end");
}

// ─── Input File renderer ──────────────────────────────────────────────────────

function renderInputFile(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

// ─── Input OTP renderer ───────────────────────────────────────────────────────

function renderInputOTPGroup(slots: ScannedNode[], imports: ImportMap, indent: number): string {
  const pad = "  ".repeat(indent);
  const p1  = "  ".repeat(indent + 1);
  const p2  = "  ".repeat(indent + 2);

  addImport(imports, INSTALL_KEY,                 "pnpm dlx shadcn@latest add input-otp");
  addImport(imports, DIRECTIVE_KEY,               '"use client"');
  addImport(imports, "@/components/ui/input-otp", "InputOTP");
  addImport(imports, "@/components/ui/input-otp", "InputOTPGroup");
  addImport(imports, "@/components/ui/input-otp", "InputOTPSlot");

  const count     = slots.length || 6;
  const slotLines = Array.from({ length: count }, (_, i) => `${p2}<InputOTPSlot index={${i}} />`).join("\n");

  return [
    `${pad}<InputOTP maxLength={${count}}>`,
    `${p1}<InputOTPGroup>`,
    slotLines,
    `${p1}</InputOTPGroup>`,
    `${pad}</InputOTP>`,
  ].join("\n");
}

function renderInputOTP(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  return renderInputOTPGroup([node], imports, indent);
}

export { renderInputOTPGroup };

// ─── Group export ─────────────────────────────────────────────────────────────

export const group: ComponentGroup = {
  defs: {
    "Input": {
      component:  "__input__",
      importPath: "@/components/ui/input",
      props: {
        "Roundness": { shadcnProp: "roundness", values: { Default: null, Round: "full" } },
        "Size":      { shadcnProp: "size",      values: { Regular: null, Large: "large", Small: "small", Mini: "mini" } },
        "State":     { shadcnProp: "state",     values: { Empty: null, Placeholder: "placeholder", Value: "value", Focus: null, Error: "error", "Error Focus": "error", Disabled: "disabled" } },
      },
    },

    "Input File": {
      component:  "__input_file__",
      importPath: "@/components/ui/input",
      props: {
        "Roundness": { shadcnProp: "roundness", values: { Default: null, Round: "full" } },
        "Size":      { shadcnProp: "size",      values: { Default: null, Large: "large", Small: "small", Mini: "mini" } },
        "State":     { shadcnProp: "state",     values: { Focus: null, Error: "error", "Error Focus": "error" } },
        "File Chosen": { shadcnProp: "fileChosen", values: { True: "true", False: null } },
      },
    },

    ".Input Decoration": {
      component:  "__input_decoration__",
      importPath: "@/components/ui/input-group",
      props: {
        "Type": { shadcnProp: "type", values: { "Icon": "icon", "Icon muted": "icon-muted" } },
        "Size": { shadcnProp: "size", values: { Default: null, Large: "large" } },
      },
    },

    "Input OTP": {
      component:  "__input_otp__",
      importPath: "@/components/ui/input-otp",
      props: {
        "Position": { shadcnProp: "position", values: { Left: "left", Middle: "middle", Right: "right" } },
        "Size":     { shadcnProp: "size",     values: { Default: null, Large: "large", Small: "small", Mini: "mini" } },
        "State":    { shadcnProp: "state",    values: { Empty: null, Placeholder: null, Value: null, Focus: null, Error: "error", "Error Focus": "error", Disabled: "disabled" } },
      },
    },
  },

  renderers: {
    "__input__":            renderInput,
    "__input_decoration__": renderInputDecoration,
    "__input_file__":       renderInputFile,
    "__input_otp__":        renderInputOTP,
  },
};
