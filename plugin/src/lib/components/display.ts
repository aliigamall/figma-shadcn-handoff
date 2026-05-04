import type { ScannedNode, ScannedFrame, ScannedTree } from "../frame-scanner";
import {
  type ComponentGroup,
  type ImportMap,
  addImport,
  INSTALL_KEY,
  collectTexts,
  findAllTexts,
  findIconChild,
  renderProps,
  VARIANT_MAP,
} from "../render-utils";

// ─── Card renderer ────────────────────────────────────────────────────────────

function renderCardHeader(slotChildren: ScannedTree[] | undefined, imports: ImportMap, indent: number, renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string): string {
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

  const nonText = slotChildren.filter(c => !("isText" in c));
  nonText.forEach(c => {
    const s = renderChild(c, imports, indent + 1);
    if (s) lines.push(s);
  });

  if (!lines.length) return "";
  return `${p1}<CardHeader>\n${lines.join("\n")}\n${p1}</CardHeader>`;
}

function renderCardContent(slotChildren: ScannedTree[] | undefined, imports: ImportMap, indent: number, renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string): string {
  if (!slotChildren?.length) return "";
  const p1 = "  ".repeat(indent);
  addImport(imports, "@/components/ui/card", "CardContent");
  const inner = slotChildren.map(c => renderChild(c, imports, indent + 1)).filter(Boolean).join("\n");
  return inner ? `${p1}<CardContent>\n${inner}\n${p1}</CardContent>` : "";
}

function renderCardFooter(slotChildren: ScannedTree[] | undefined, imports: ImportMap, indent: number, renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string): string {
  if (!slotChildren?.length) return "";
  const p1 = "  ".repeat(indent);
  addImport(imports, "@/components/ui/card", "CardFooter");
  const inner = slotChildren.map(c => renderChild(c, imports, indent + 1)).filter(Boolean).join("\n");
  return inner ? `${p1}<CardFooter>\n${inner}\n${p1}</CardFooter>` : "";
}

function renderCard(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
  const p0 = "  ".repeat(indent);
  addImport(imports, "@/components/ui/card", "Card");

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const layoutChildren = children.filter(c => "isLayout" in c) as ScannedFrame[];

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
    const s = renderCardContent(slotContents[0], imports, indent + 1, renderChild);
    if (s) sections.push(s);
  } else if (slotContents.length === 2) {
    const h = renderCardHeader(slotContents[0], imports, indent + 1, renderChild);
    const c = renderCardContent(slotContents[1], imports, indent + 1, renderChild);
    if (h) sections.push(h);
    if (c) sections.push(c);
  } else if (slotContents.length >= 3) {
    const h = renderCardHeader(slotContents[0], imports, indent + 1, renderChild);
    if (h) sections.push(h);
    for (let i = 1; i < slotContents.length - 1; i++) {
      const c = renderCardContent(slotContents[i], imports, indent + 1, renderChild);
      if (c) sections.push(c);
    }
    const f = renderCardFooter(slotContents[slotContents.length - 1], imports, indent + 1, renderChild);
    if (f) sections.push(f);
  }

  const propsStr = renderProps(node.props);
  return `${p0}<Card${propsStr}>\n${sections.join("\n")}\n${p0}</Card>`;
}

// ─── Item renderer ────────────────────────────────────────────────────────────

function renderItem(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

  lines.push(`${p1}<ItemContent>`);
  lines.push(`${p2}<ItemTitle>${titleText}</ItemTitle>`);
  if (descText) {
    addImport(imports, "@/components/ui/item", "ItemDescription");
    lines.push(`${p2}<ItemDescription>${descText}</ItemDescription>`);
  }
  lines.push(`${p1}</ItemContent>`);

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

// ─── Avatar renderer ──────────────────────────────────────────────────────────

function renderAvatar(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

// ─── Empty renderer ───────────────────────────────────────────────────────────

function renderEmpty(
  node: ScannedNode,
  imports: ImportMap,
  indent: number,
  _renderChild: (tree: ScannedTree, imports: ImportMap, indent: number) => string,
): string {
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

  const children = Array.isArray(node.children) ? node.children as ScannedTree[] : [];
  const texts    = collectTexts(children);
  const title    = texts[0] ?? "No results";
  const desc     = texts[1] ?? "Try adjusting your search or filters.";

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

// ─── Group export ─────────────────────────────────────────────────────────────

export const group: ComponentGroup = {
  defs: {
    "Badge": {
      component:  "Badge",
      importPath: "@/components/ui/badge",
      props: {
        "Variant": { shadcnProp: "variant", values: VARIANT_MAP },
      },
      children: "Label",
      ignore: ["State", "Roundness", "Show left icon", "Show right icon", "⮑ Icon left", "⮑ Icon right"],
    },

    "Alert": {
      component:  "Alert",
      importPath: "@/components/ui/alert",
      props: {
        "Type": {
          shadcnProp: "variant",
          values: { Neutral: "default", Error: "destructive" },
        },
      },
      slots: [
        { key: "Line 1",   component: "AlertTitle",       importPath: "@/components/ui/alert" },
        { key: "↳ Line 2", component: "AlertDescription", importPath: "@/components/ui/alert", scanChildren: true },
      ],
      ignore: ["Show Line 2", "Show Icon", "Show Button", "Flip Icon", "⮑ Icon", "⮑  Line 2"],
    },

    "Avatar": {
      component:  "Avatar",
      importPath: "@/components/ui/avatar",
      ignore: ["Picture", "Size", "Roundness Type"],
    },

    "Avatar Stack": {
      component:  "AvatarGroup",
      importPath: "@/components/ui/avatar",
      ignore: ["Size", "Type"],
    },

    "Card": {
      component:  "Card",
      importPath: "@/components/ui/card",
      ignore: ["Main Slot", "Header Slot", "Footer Slot", "Slot No.", "State"],
    },

    "Item": {
      component:  "__item__",
      importPath: "@/components/ui/item",
      props: {
        "Variant": { shadcnProp: "variant", values: { Default: null, Outline: "outline", Muted: "muted" } },
        "Size":    { shadcnProp: "size",    values: { Default: null, Small: "sm", Mini: "xs" } },
        "ItemMedia: icon":        { shadcnProp: "mediaType", values: { True: "icon",        False: null } },
        "ItemMedia: iconBadge":   { shadcnProp: "mediaType", values: { True: "iconBadge",   False: null } },
        "ItemMedia: avatar":      { shadcnProp: "mediaType", values: { True: "avatar",      False: null } },
        "ItemMedia: avatarStack": { shadcnProp: "mediaType", values: { True: "avatarStack", False: null } },
        "ItemMedia: image":       { shadcnProp: "mediaType", values: { True: "image",       False: null } },
        "ItemAction: icon":       { shadcnProp: "actionType", values: { True: "icon",       False: null } },
        "ItemAction: button":     { shadcnProp: "actionType", values: { True: "button",     False: null } },
        "ItemAction: iconButton": { shadcnProp: "actionType", values: { True: "iconButton", False: null } },
        "ItemAction: label":      { shadcnProp: "actionType", values: { True: "label",      False: null } },
        "Title":       { shadcnProp: "title" },
        "Description": { shadcnProp: "description" },
        "Label":       { shadcnProp: "label" },
      },
      ignore: ["asChild", "State"],
    },

    "Empty": {
      component:  "__empty__",
      importPath: "@/components/ui/empty",
      props: {
        "Variant": {
          shadcnProp: "variant",
          values: {
            Default:          "default",
            Outline:          "outline",
            Background:       "background",
            "Outline dashed": "outline-dashed",
          },
        },
      },
      children: "⮑ title",
    },

    "Skeleton": {
      component:  "Skeleton",
      importPath: "@/components/ui/skeleton",
    },

    "Spinner": {
      component:  "Loader2",
      importPath: "lucide-react",
      ignore: ["Type"],
    },
  },

  renderers: {
    "Card":     renderCard,
    "__item__": renderItem,
    "Avatar":   renderAvatar,
    "__empty__": renderEmpty,
  },
};
