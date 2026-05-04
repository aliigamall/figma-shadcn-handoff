import type { ScannedNode, ScannedTree } from "../frame-scanner";
import {
  type ComponentGroup,
  type ImportMap,
  addImport,
  INSTALL_KEY,
  DIRECTIVE_KEY,
  findAllTexts,
  findFirstText,
} from "../render-utils";

// ─── Navigation Menu helpers ──────────────────────────────────────────────────

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
    const texts      = findAllTexts(item.children as ScannedTree[]);
    const title      = texts[0] ?? "Item";
    const desc       = texts[1] ?? null;
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

function renderNavigationMenu(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

  const buttonChildren = children.filter(
    c => "component" in c && (c as ScannedNode).component === "Button"
  ) as ScannedNode[];

  const triggerLabels = buttonChildren.length > 0
    ? buttonChildren.map(btn => (typeof btn.children === "string" ? btn.children : findFirstText(btn.children as ScannedTree[])) ?? "Menu")
    : findAllTexts(children).slice(0, 3);

  const lines: string[] = [`${pad}<NavigationMenu>`, `${p1}<NavigationMenuList>`];

  if (triggerLabels.length === 0) {
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

function renderNavigationMenuContentNode(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

  const items = (Array.isArray(node.children) ? node.children as ScannedTree[] : [])
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

// ─── Breadcrumb renderer ──────────────────────────────────────────────────────

function renderBreadcrumb(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  const p0 = "  ".repeat(indent);
  const p1 = "  ".repeat(indent + 1);
  const p2 = "  ".repeat(indent + 2);
  const p3 = "  ".repeat(indent + 3);

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];

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

    return renderChild(c, imports, indent + 2);
  }).filter(Boolean).join("\n");

  return `${p0}<Breadcrumb>\n${p1}<BreadcrumbList>\n${listInner}\n${p1}</BreadcrumbList>\n${p0}</Breadcrumb>`;
}

// ─── Group export ─────────────────────────────────────────────────────────────

export const group: ComponentGroup = {
  defs: {
    "Navigation Menu": {
      component:  "__navigation_menu__",
      importPath: "@/components/ui/navigation-menu",
      props: {},
      ignore: ["State"],
    },

    ".Navigation Menu Content": {
      component:  "__navigation_menu_content__",
      importPath: "@/components/ui/navigation-menu",
      props: {},
    },

    "Menu Item": {
      component:  "__menu_item__",
      importPath: "@/components/ui/navigation-menu",
      props: {
        "Size": { shadcnProp: "size", values: { Regular: null, Large: "lg" } },
        "Type": { shadcnProp: "type", values: { Default: null, Destructive: "destructive" } },
      },
      ignore: ["State"],
    },

    "Breadcrumb": {
      component:  "Breadcrumb",
      importPath: "@/components/ui/breadcrumb",
      ignore: ["Items"],
    },

    ".Breadcrumb item": {
      component:  "BreadcrumbItem",
      importPath: "@/components/ui/breadcrumb",
      children:   "⮑ Label",
      ignore:     ["Content", "State"],
    },

    ".Breadcrumb separator": {
      component:  "BreadcrumbSeparator",
      importPath: "@/components/ui/breadcrumb",
      ignore:     ["Content"],
    },

    "Pagination": {
      component:  "Pagination",
      importPath: "@/components/ui/pagination",
      ignore: ["Type", "State"],
    },
  },

  renderers: {
    "__navigation_menu__":         renderNavigationMenu,
    "__navigation_menu_content__": renderNavigationMenuContentNode,
    "__menu_item__": (
      _node: ScannedNode,
      _imports: ImportMap,
      _indent: number,
      _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
    ) => "",
    "Breadcrumb": renderBreadcrumb,
  },
};
