import type { ScannedNode, ScannedTree } from "../frame-scanner";
import {
  type ComponentGroup,
  type ImportMap,
  addImport,
  INSTALL_KEY,
  collectTexts,
  toJsKey,
  CHECKED_MAP,
} from "../render-utils";

// ─── Checkbox renderer ────────────────────────────────────────────────────────

function renderCheckbox(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

function renderCheckboxGroup(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

  const childCheckboxes = (Array.isArray(node.children) ? node.children as ScannedTree[] : [])
    .filter(c => "component" in c && (c as ScannedNode).component === "Checkbox") as ScannedNode[];

  const items: (ScannedNode | null)[] = childCheckboxes.length > 0
    ? childCheckboxes
    : [null, null, null];

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

// ─── Field renderer ───────────────────────────────────────────────────────────

function renderField(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  orientation: "vertical" | "horizontal",
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

function renderFieldVertical(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  return renderField(node, imports, indent, "vertical", renderChild);
}

function renderFieldHorizontal(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  return renderField(node, imports, indent, "horizontal", renderChild);
}

// ─── Group export ─────────────────────────────────────────────────────────────

export const group: ComponentGroup = {
  defs: {
    "Checkbox": {
      component:  "Checkbox",
      importPath: "@/components/ui/checkbox",
      props: {
        "Checked?": { shadcnProp: "checked", values: CHECKED_MAP },
        "State": {
          shadcnProp: "disabled",
          values: { Disabled: "true", Focus: null, Error: null, "Error Focus": null },
        },
      },
    },

    "Checkbox Group": {
      component:  "__checkbox_group__",
      importPath: "@/components/ui/checkbox",
      props: {
        "Layout": {
          shadcnProp: "layout",
          values: { Inline: "inline", Stacked: "stacked" },
        },
      },
      ignore: ["Checked?"],
    },

    "Rich Checkbox Group": {
      component:  "RichCheckboxGroup",
      importPath: "@/components/ui/rich-checkbox-group",
      props: {
        "Checked":  { shadcnProp: "checked",  values: { True: "true", False: null } },
        "Flipped":  { shadcnProp: "flipped",  values: { True: "true", False: null } },
      },
      children: "Line 1",
    },

    "Switch": {
      component:  "Switch",
      importPath: "@/components/ui/switch",
      props: {
        "Checked?": { shadcnProp: "checked", values: { True: "true", False: "false" } },
      },
      ignore: ["State"],
    },

    "Radio": {
      component:  "RadioGroupItem",
      importPath: "@/components/ui/radio-group",
      props: {
        "Checked?": { shadcnProp: "checked", values: { True: "true", False: "false" } },
      },
      ignore: ["State"],
    },

    "Slider Horizontal": {
      component:  "Slider",
      importPath: "@/components/ui/slider",
      ignore: ["Type"],
    },

    "Slider Vertical": {
      component:  "Slider",
      importPath: "@/components/ui/slider",
      props: {
        "Type": { shadcnProp: "orientation", values: { Default: "vertical", "Range narrow": "vertical", "Range wide": "vertical" } },
      },
    },

    "Textarea": {
      component:  "Textarea",
      importPath: "@/components/ui/textarea",
      props: {
        "State": {
          shadcnProp: "disabled",
          values: { Disabled: "true", Empty: null, Placeholder: null, Value: null, Focus: null, Error: null, "Error Focus": null },
        },
      },
      ignore: ["Show resizable", "Roundness"],
    },

    "Select & Combobox": {
      component:  "Select",
      importPath: "@/components/ui/select",
      ignore: ["Size", "State", "Lines", "Show Decoration", "Show Prepend"],
    },

    "Label": {
      component:  "Label",
      importPath: "@/components/ui/label",
      ignore: ["Layout"],
    },

    "Vertical Field": {
      component:  "__field_vertical__",
      importPath: "@/components/ui/field",
      props: {
        "Type": {
          shadcnProp: "type",
          values: {
            Select:       "select",
            "Text Value": "text",
            Radio:        "radio",
            Textarea:     "textarea",
            Checkbox:     "checkbox",
            Slider:       "slider",
          },
        },
      },
    },

    "Horizontal Field": {
      component:  "__field_horizontal__",
      importPath: "@/components/ui/field",
      props: {
        "Type": {
          shadcnProp: "type",
          values: {
            Select:       "select",
            "Text Value": "text",
            Radio:        "radio",
            Textarea:     "textarea",
            Checkbox:     "checkbox",
            Slider:       "slider",
          },
        },
      },
    },
  },

  renderers: {
    "Checkbox":           renderCheckbox,
    "__checkbox_group__": renderCheckboxGroup,
    "__field_vertical__":   renderFieldVertical,
    "__field_horizontal__": renderFieldHorizontal,
  },
};
