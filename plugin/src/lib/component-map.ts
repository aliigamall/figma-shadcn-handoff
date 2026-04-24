/**
 * Maps Obra shadcn/ui Figma component names and variant values
 * to their shadcn/ui React component equivalents.
 *
 * Structure:
 *  - figmaName:      exact component set name in Obra
 *  - component:      shadcn/ui component name (JSX tag)
 *  - importPath:     import source
 *  - props:          maps Obra variant/boolean keys → shadcn prop names + value transforms
 *  - children:       which TEXT prop becomes the children content
 *  - ignore:         prop keys to skip entirely (State, decorators, etc.)
 */

export interface PropDef {
  /** shadcn/ui prop name (e.g. "variant", "size") */
  shadcnProp: string;
  /** Maps Obra variant option → shadcn prop value. If omitted, value passes through as-is (lowercased). */
  values?: Record<string, string | null>;
}

export interface ComponentDef {
  /** shadcn/ui JSX component name */
  component: string;
  /** Import path */
  importPath: string;
  /** Obra prop key (before '#') → prop definition */
  props?: Record<string, PropDef>;
  /** Obra TEXT prop key whose value becomes JSX children */
  children?: string;
  /** Obra prop keys to skip when generating JSX */
  ignore?: string[];
}

// Common value maps reused across components
const VARIANT_MAP: Record<string, string> = {
  Primary:     "default",
  Secondary:   "secondary",
  Outline:     "outline",
  Ghost:       "ghost",
  Destructive: "destructive",
};

const SIZE_MAP: Record<string, string> = {
  Default:      "default",
  Regular:      "default",
  Large:        "lg",
  Small:        "sm",
  Mini:         "xs",
  "Extra Large":"2xl",
};

const CHECKED_MAP: Record<string, string> = {
  True:          "true",
  False:         "false",
  Indeterminate: "indeterminate",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component map
// Key = Obra component set name (as it appears in Figma)
// ─────────────────────────────────────────────────────────────────────────────
export const COMPONENT_MAP: Record<string, ComponentDef> = {

  // ── Button ────────────────────────────────────────────────────────────────
  "Button": {
    component:  "Button",
    importPath: "@/components/ui/button",
    props: {
      "Variant": { shadcnProp: "variant", values: VARIANT_MAP },
      "Size":    { shadcnProp: "size",    values: SIZE_MAP },
    },
    ignore: ["State", "Roundness", "Show right icon", "Show left icon", "⮑ Right icon", "⮑ Left icon"],
  },

  // ── Icon Button ───────────────────────────────────────────────────────────
  "Icon Button": {
    component:  "Button",
    importPath: "@/components/ui/button",
    props: {
      "Variant": { shadcnProp: "variant", values: VARIANT_MAP },
      "Size":    { shadcnProp: "size",    values: SIZE_MAP },
    },
    ignore: ["State", "Roundness", "Icon"],
  },

  // ── Link Button ───────────────────────────────────────────────────────────
  "Link Button": {
    component:  "Button",
    importPath: "@/components/ui/button",
    props: {
      "Size": { shadcnProp: "size", values: SIZE_MAP },
    },
    children: "Label",
    ignore: ["State", "Roundness", "Show icon left", "Show icon right", "⮑ Icon left", "⮑ Icon right"],
  },

  // ── Loading Button ────────────────────────────────────────────────────────
  "Loading Button": {
    component:  "Button",
    importPath: "@/components/ui/button",
    props: {
      "Variant": { shadcnProp: "variant", values: VARIANT_MAP },
      "Size":    { shadcnProp: "size",    values: SIZE_MAP },
    },
    ignore: ["State", "Roundness"],
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  "Badge": {
    component:  "Badge",
    importPath: "@/components/ui/badge",
    props: {
      "Variant": { shadcnProp: "variant", values: VARIANT_MAP },
    },
    children: "Label",
    ignore: ["State", "Roundness", "Show left icon", "Show right icon", "⮑ Icon left", "⮑ Icon right"],
  },

  // ── Alert ─────────────────────────────────────────────────────────────────
  "Alert": {
    component:  "Alert",
    importPath: "@/components/ui/alert",
    props: {
      "Type": {
        shadcnProp: "variant",
        values: { Neutral: "default", Error: "destructive" },
      },
    },
    children: "Line 1",
    ignore: ["Show Line 2", "Show Icon", "Show Button", "Flip Icon", "⮑ Icon", "⮑  Line 2"],
  },

  // ── Alert Dialog ──────────────────────────────────────────────────────────
  "Alert Dialog": {
    component:  "AlertDialog",
    importPath: "@/components/ui/alert-dialog",
    ignore: ["Type"],
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  "Avatar": {
    component:  "Avatar",
    importPath: "@/components/ui/avatar",
    ignore: ["Picture", "Size", "Roundness Type"],
  },

  // ── Input ─────────────────────────────────────────────────────────────────
  "Input": {
    component:  "Input",
    importPath: "@/components/ui/input",
    props: {
      "State": {
        shadcnProp: "disabled",
        values: { Disabled: "true", Empty: null, Placeholder: null, Value: null, Focus: null, Error: null, "Error Focus": null },
      },
    },
    children: "Value",
    ignore: ["Size", "Roundness", "Show decoration left", "Show decoration right", "Show cursor", "Show prepend text", "Show append text"],
  },

  // ── Textarea ──────────────────────────────────────────────────────────────
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

  // ── Select ────────────────────────────────────────────────────────────────
  "Select & Combobox": {
    component:  "Select",
    importPath: "@/components/ui/select",
    ignore: ["Size", "State", "Lines", "Show Decoration", "Show Prepend"],
  },

  // ── Checkbox ──────────────────────────────────────────────────────────────
  "Checkbox": {
    component:  "Checkbox",
    importPath: "@/components/ui/checkbox",
    props: {
      "Checked?": { shadcnProp: "checked", values: CHECKED_MAP },
    },
    ignore: ["State"],
  },

  // ── Switch ────────────────────────────────────────────────────────────────
  "Switch": {
    component:  "Switch",
    importPath: "@/components/ui/switch",
    props: {
      "Checked?": { shadcnProp: "checked", values: { True: "true", False: "false" } },
    },
    ignore: ["State"],
  },

  // ── Radio ─────────────────────────────────────────────────────────────────
  "Radio": {
    component:  "RadioGroupItem",
    importPath: "@/components/ui/radio-group",
    props: {
      "Checked?": { shadcnProp: "checked", values: { True: "true", False: "false" } },
    },
    ignore: ["State"],
  },

  // ── Slider ────────────────────────────────────────────────────────────────
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

  // ── Progress ──────────────────────────────────────────────────────────────
  "Progress": {
    component:  "Progress",
    importPath: "@/components/ui/progress",
    props: {
      "Progress": { shadcnProp: "value" },
    },
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  "Tabs": {
    component:  "Tabs",
    importPath: "@/components/ui/tabs",
    ignore: ["Size", "Content", "Parts"],
  },

  // ── Tooltip ───────────────────────────────────────────────────────────────
  "Tooltip": {
    component:  "Tooltip",
    importPath: "@/components/ui/tooltip",
    props: {
      "Side": {
        shadcnProp: "side",
        values: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
      },
    },
    children: "Tooltip text",
  },

  // ── Separator ─────────────────────────────────────────────────────────────
  "Separator": {
    component:  "Separator",
    importPath: "@/components/ui/separator",
    props: {
      "Direction": {
        shadcnProp: "orientation",
        values: { Default: "horizontal", Vertical: "vertical" },
      },
    },
    ignore: ["Spacing"],
  },

  // ── Label ─────────────────────────────────────────────────────────────────
  "Label": {
    component:  "Label",
    importPath: "@/components/ui/label",
    ignore: ["Layout"],
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  "Skeleton": {
    component:  "Skeleton",
    importPath: "@/components/ui/skeleton",
  },

  // ── Spinner ───────────────────────────────────────────────────────────────
  "Spinner": {
    component:  "Loader2",
    importPath: "lucide-react",
    ignore: ["Type"],
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  "Card": {
    component:  "Card",
    importPath: "@/components/ui/card",
    ignore: ["Main Slot", "Header Slot", "Footer Slot", "Slot No."],
  },

  // ── Accordion ─────────────────────────────────────────────────────────────
  "Accordion Trigger": {
    component:  "Accordion",
    importPath: "@/components/ui/accordion",
    children: "Accordion label",
    ignore: ["State", "Show border", "Position"],
  },

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  "Breadcrumb": {
    component:  "Breadcrumb",
    importPath: "@/components/ui/breadcrumb",
    ignore: ["Items"],
  },

  // ── Pagination ────────────────────────────────────────────────────────────
  "Pagination": {
    component:  "Pagination",
    importPath: "@/components/ui/pagination",
    ignore: ["Type", "State"],
  },

  // ── Dialog ────────────────────────────────────────────────────────────────
  "Dialog": {
    component:  "Dialog",
    importPath: "@/components/ui/dialog",
    ignore: ["Type"],
  },

  // ── Toggle Button ─────────────────────────────────────────────────────────
  "Toggle Button": {
    component:  "Toggle",
    importPath: "@/components/ui/toggle",
    props: {
      "Skin": {
        shadcnProp: "variant",
        values: { Outlined: "outline", Ghost: "ghost" },
      },
      "Size": { shadcnProp: "size", values: SIZE_MAP },
      "Active?": {
        shadcnProp: "pressed",
        values: { Yes: "true", No: "false" },
      },
    },
    children: "Label",
    ignore: ["State", "Roundness", "Position", "Show left icon", "Show right icon", "⮑ Left icon", "⮑ Right icon"],
  },

  // ── Toggle Icon Button ────────────────────────────────────────────────────
  "Toggle Icon Button": {
    component:  "Toggle",
    importPath: "@/components/ui/toggle",
    props: {
      "Skin": {
        shadcnProp: "variant",
        values: { Outlined: "outline", Ghost: "ghost" },
      },
      "Size": { shadcnProp: "size", values: SIZE_MAP },
      "Active?": {
        shadcnProp: "pressed",
        values: { Yes: "true", No: "false" },
      },
    },
    ignore: ["State", "Roundness", "Position", "Icon"],
  },
};

/**
 * Look up an Obra Figma component name in the map.
 * Strips variant suffix (e.g. "Button / Primary" → "Button") before lookup.
 */
export function lookupComponent(figmaName: string): ComponentDef | null {
  // Try exact match first
  if (COMPONENT_MAP[figmaName]) return COMPONENT_MAP[figmaName];

  // Strip variant suffix (Obra component sets can appear as "Button / Primary, Size=Default")
  const base = figmaName.split(/[/,]/)[0].trim();
  return COMPONENT_MAP[base] ?? null;
}
