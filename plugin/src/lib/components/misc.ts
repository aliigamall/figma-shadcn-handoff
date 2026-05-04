import type { ScannedNode, ScannedTree } from "../frame-scanner";
import {
  type ComponentGroup,
  type ImportMap,
  SIZE_MAP,
} from "../render-utils";

// ─── Group export ─────────────────────────────────────────────────────────────
// No custom renderers needed for this group — all components render generically.

export const group: ComponentGroup = {
  defs: {
    "Tabs": {
      component:  "Tabs",
      importPath: "@/components/ui/tabs",
      ignore: ["Size", "Content", "Parts"],
    },

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

    "Progress": {
      component:  "Progress",
      importPath: "@/components/ui/progress",
      props: {
        "Progress": { shadcnProp: "value" },
      },
    },

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

    "Accordion Trigger": {
      component:  "AccordionTrigger",
      importPath: "@/components/ui/accordion",
      children:   "Accordion label",
      ignore:     ["State"],
    },

    "Accordion Content": {
      component:  "AccordionContent",
      importPath: "@/components/ui/accordion",
    },

    "Accordion Trigger (Bordered)": {
      component:  "AccordionTrigger",
      importPath: "@/components/ui/accordion",
      children:   "Accordion label",
      ignore:     ["State", "Position"],
    },

    "Accordion Content (Bordered)": {
      component:  "AccordionContent",
      importPath: "@/components/ui/accordion",
    },
  },

  renderers: {},
};

// Suppress unused import warning - SIZE_MAP is used in defs above
void (SIZE_MAP as unknown);
