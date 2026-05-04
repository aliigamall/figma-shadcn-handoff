import type { ScannedNode, ScannedTree } from "../frame-scanner";
import {
  type ComponentGroup,
  type ImportMap,
  addImport,
  INSTALL_KEY,
  VARIANT_MAP,
  SIZE_MAP,
  findIconChild,
} from "../render-utils";

// ─── Icon Button renderer ─────────────────────────────────────────────────────

function renderIconButton(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

  const iconName = findIconChild(node.children as ScannedTree[]) ?? "Plus";
  addImport(imports, "lucide-react", iconName);

  return `${pad}<Button size="icon"${variantAttr}${classAttr}${disabledAttr}><${iconName} className="size-4" /></Button>`;
}

// ─── Loading Button renderer ──────────────────────────────────────────────────

function renderLoadingButton(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  addImport(imports, INSTALL_KEY,               "pnpm dlx shadcn@latest add button spinner");
  addImport(imports, "@/components/ui/button",  "Button");
  addImport(imports, "@/components/ui/spinner", "Spinner");

  const pad     = "  ".repeat(indent);
  const size     = node.props.find(p => p.shadcnProp === "size")?.value;
  const sizeAttr = size ? ` size="${size}"` : "";
  const label    = typeof node.children === "string" ? node.children : "Loading";
  return `${pad}<Button variant="outline"${sizeAttr} disabled>\n${pad}  <Spinner data-icon="inline-start" />\n${pad}  ${label}\n${pad}</Button>`;
}

// ─── Link Button renderer ─────────────────────────────────────────────────────

function renderLinkButton(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  addImport(imports, INSTALL_KEY,              "pnpm dlx shadcn@latest add button");
  addImport(imports, "@/components/ui/button", "Button");

  const pad      = "  ".repeat(indent);
  const size     = node.props.find(p => p.shadcnProp === "size")?.value;
  const sizeAttr = size ? ` size="${size}"` : "";
  const label    = typeof node.children === "string" ? node.children : "Link";
  return `${pad}<Button variant="link"${sizeAttr}>${label}</Button>`;
}

// ─── Group export ─────────────────────────────────────────────────────────────

export const group: ComponentGroup = {
  defs: {
    "Button": {
      component:  "Button",
      importPath: "@/components/ui/button",
      props: {
        "Variant": { shadcnProp: "variant", values: VARIANT_MAP },
        "Size":    { shadcnProp: "size",    values: SIZE_MAP },
      },
      children: "Label",
      ignore: ["State", "Roundness", "Show right icon", "Show left icon", "⮑ Right icon", "⮑ Left icon"],
    },

    "Button Group": {
      component:  "Button",
      importPath: "@/components/ui/button",
      props: {
        "Skin": { shadcnProp: "variant", values: { Outlined: "outline", Ghost: "ghost" } },
        "Size": { shadcnProp: "size",    values: SIZE_MAP },
      },
      children: "Label",
      ignore: ["State", "Position"],
    },

    "Button Group Icon Button": {
      component:  "Button",
      importPath: "@/components/ui/button",
      props: {
        "Skin": { shadcnProp: "variant", values: { Outlined: "outline", Ghost: "ghost" } },
        "Size": { shadcnProp: "size",    values: { Default: "icon", Small: "icon-sm", Large: "icon-lg" } },
      },
      ignore: ["State", "Position", "Icon"],
    },

    "Loading Button": {
      component:  "__loading_button__",
      importPath: "@/components/ui/button",
      props: {
        "Size": { shadcnProp: "size", values: { Default: null, Large: "lg", Small: "sm", Mini: "xs" } },
      },
      ignore: ["Roundness", "State"],
      children: "Label",
    },

    "Link Button": {
      component:  "LinkButton",
      importPath: "@/components/ui/button",
      props: {
        "Size": { shadcnProp: "size", values: { Default: null, Large: "lg", Small: "sm", Mini: "xs" } },
      },
      ignore: ["Roundness", "State"],
      children: "Label",
    },

    "Icon Button": {
      component:  "__icon_button__",
      importPath: "@/components/ui/button",
      props: {
        "Variant": {
          shadcnProp: "variant",
          values: { Primary: "default", Secondary: "secondary", Outline: "outline", Ghost: "ghost", Destructive: "destructive" },
        },
        "Size": {
          shadcnProp: "size",
          values: { Default: "default", Large: "large", Small: "small", Mini: "mini" },
        },
        "Roundness": {
          shadcnProp: "roundness",
          values: { Default: null, Round: "full" },
        },
      },
      ignore: ["State"],
    },
  },

  renderers: {
    "__icon_button__":    renderIconButton,
    "__loading_button__": renderLoadingButton,
    "LinkButton":         renderLinkButton,
  },
};
