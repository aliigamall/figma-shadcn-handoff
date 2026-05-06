/**
 * Frame Scanner
 *
 * Recursively walks a Figma node tree, identifies Obra component instances,
 * and returns a structured component tree ready for JSX generation.
 */

import { lookupComponent } from "./component-map";
import { toCssVarName } from "./transform";

export interface ScannedProp {
  shadcnProp: string;
  value: string;
}

export interface Layout {
  direction: "horizontal" | "vertical" | "grid" | "none";
  /** Primary axis gap (flex) or column gap (grid) */
  gap: number;
  /** Row gap — only set for flex-wrap or grid layouts */
  rowGap: number;
  /** Number of columns — only set for grid layouts */
  columns: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  wrap: boolean;
}

export interface ScannedNode {
  id: string;
  figmaName: string;
  /** Figma layer name (e.g. "Decoration left"), distinct from component name */
  layerName: string;
  component: string;
  importPath: string;
  props: ScannedProp[];
  children: string | ScannedNode[];
  layout: Layout;
}

export interface Visual {
  bgColor: string | null;   // hex, e.g. "#f3e8ff"
  radius: number;           // cornerRadius in px
  shadow: boolean;          // has a visible drop shadow
  opacity: number;          // 0–1
  borderColor: string | null;
}

export interface ScannedFrame {
  isLayout: true;
  id: string;
  name: string;
  layout: Layout;
  visual: Visual;
  children: Array<ScannedTree>;
}

export interface ScannedText {
  isText: true;
  id: string;
  content: string;
  tag: "h1" | "h2" | "h3" | "p" | "span";
  bold: boolean;
  align: "left" | "center" | "right" | null;
  color: string | null;
  uppercase: boolean;
  /** Figma text style name converted to a CSS class, e.g. "heading-1" */
  styleName: string | null;
}

export interface ScannedImage {
  isImage: true;
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface ScannedIcon {
  isIcon: true;
  id: string;
  name: string;
  /** PascalCase Lucide icon name, e.g. "ArrowRight" */
  lucideName: string;
  width: number;
  height: number;
}

/** Plain inline text with no HTML wrapper — used inside mapped components alongside icons */
export interface ScannedInlineText {
  isInlineText: true;
  id: string;
  content: string;
}

export type ScannedTree = ScannedNode | ScannedFrame | ScannedText | ScannedImage | ScannedIcon | ScannedInlineText;

// ─── Visual helpers ───────────────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Resolve a color property on a node to either a Tailwind token name (e.g. "color-blue-950")
 * or a raw hex string (e.g. "#172554") as a fallback.
 * Returns null when no visible solid color is found.
 */
async function resolveColorToken(
  node: BaseNode,
  property: "fills" | "strokes"
): Promise<string | null> {
  const boundVars = (node as any).boundVariables as Record<string, any> | undefined;
  const bound = boundVars?.[property];
  if (bound) {
    const entry = Array.isArray(bound) ? bound[0] : bound;
    if (entry?.type === "VARIABLE_ALIAS") {
      const fetched = await figma.variables.getVariableByIdAsync(entry.id);
      if (fetched) {
        const col = await figma.variables.getVariableCollectionByIdAsync(fetched.variableCollectionId);
        if (col) {
          return toCssVarName(col.name, fetched.name).replace(/^--/, "");
        }
      }
    }
  }

  const paints = (node as any)[property] as readonly Paint[] | undefined;
  if (!Array.isArray(paints)) return null;
  const s = (paints as Paint[]).find(f => f.type === "SOLID" && f.visible !== false) as SolidPaint | undefined;
  return s ? rgbToHex(s.color.r, s.color.g, s.color.b) : null;
}

async function extractVisual(node: BaseNode & { effects?: readonly Effect[]; cornerRadius?: number | typeof figma.mixed; opacity?: number }): Promise<Visual> {
  return {
    bgColor:     await resolveColorToken(node, "fills"),
    radius:      typeof node.cornerRadius === "number" ? node.cornerRadius : 0,
    shadow:      (node.effects ?? []).some(e => e.type === "DROP_SHADOW" && e.visible !== false),
    opacity:     node.opacity ?? 1,
    borderColor: await resolveColorToken(node, "strokes"),
  };
}

const EMPTY_VISUAL: Visual = { bgColor: null, radius: 0, shadow: false, opacity: 1, borderColor: null };

/**
 * Convert a Figma layer name to a PascalCase Lucide icon name.
 * Handles patterns like "arrow-right", "Icon / chevron-right", "Arrow Right".
 */
function toLucideName(raw: string): string {
  const segment = raw.split("/").pop()?.trim() ?? raw;
  const cleaned = segment.replace(/^icons?[-_\s]*/i, "").trim() || "Icon";
  return cleaned
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join("");
}

/**
 * Returns true when the component/layer name looks like a Lucide icon.
 * Rejects PascalCase multi-word component names like "Basic Table Header".
 * Accepts: "arrow-right", "Icon / chevron-right", single-word lowercase names.
 */
function looksLikeIconName(name: string): boolean {
  // "Icon / something" — explicit Obra icon pattern
  if (name.includes("/")) return true;
  // Kebab-case or lowercase single-word (e.g. "arrow-right", "check")
  // Does NOT start with an uppercase letter that would indicate a component name
  return /^[a-z][a-z0-9\-_\s]*$/.test(name);
}

/** Extract layout info from any frame-like node */
function extractLayout(node: FrameNode | ComponentNode | InstanceNode): Layout {
  // Native CSS Grid (Figma 2024+)
  if (node.layoutMode === "GRID") {
    const g = node as FrameNode & GridLayoutMixin;
    return {
      direction:  "grid",
      gap:        g.gridColumnGap ?? 0,
      rowGap:     g.gridRowGap    ?? 0,
      columns:    g.gridColumnCount ?? 1,
      paddingTop:    node.paddingTop    ?? 0,
      paddingRight:  node.paddingRight  ?? 0,
      paddingBottom: node.paddingBottom ?? 0,
      paddingLeft:   node.paddingLeft   ?? 0,
      wrap: false,
    };
  }

  const isAuto = node.layoutMode !== "NONE";
  const isWrap = isAuto && node.layoutWrap === "WRAP";
  return {
    direction: node.layoutMode === "HORIZONTAL" ? "horizontal"
             : node.layoutMode === "VERTICAL"   ? "vertical"
             : "none",
    gap:           isAuto ? (node.itemSpacing ?? 0)                 : 0,
    rowGap:        isWrap ? (node.counterAxisSpacing ?? 0)          : 0,
    columns:       0,
    paddingTop:    isAuto ? (node.paddingTop    ?? 0)               : 0,
    paddingRight:  isAuto ? (node.paddingRight  ?? 0)               : 0,
    paddingBottom: isAuto ? (node.paddingBottom ?? 0)               : 0,
    paddingLeft:   isAuto ? (node.paddingLeft   ?? 0)               : 0,
    wrap:          isWrap,
  };
}

/** Map Figma component property values to scanned props */
function resolveProps(
  instance: InstanceNode,
  def: ReturnType<typeof lookupComponent>
): ScannedProp[] {
  if (!def || !def.props) return [];

  const result: ScannedProp[] = [];
  let rawProps: Record<string, ComponentProperty>;
  try { rawProps = instance.componentProperties ?? {}; } catch { return []; }

  for (const [obraKey, propDef] of Object.entries(def.props)) {
    // Find the matching Figma property (key includes a '#...' suffix)
    const figmaKey = Object.keys(rawProps).find(k => k.split("#")[0] === obraKey);
    if (!figmaKey) continue;

    const rawValue = String(rawProps[figmaKey].value);

    // Skip null-mapped values (means "don't emit this prop")
    if (propDef.values && propDef.values[rawValue] === null) continue;

    // When no values map is defined, preserve raw value as-is (text content props)
    const mappedValue = propDef.values
      ? (propDef.values[rawValue] ?? rawValue.toLowerCase())
      : rawValue;

    result.push({ shadcnProp: propDef.shadcnProp, value: mappedValue });
  }

  return result;
}

/** Resolve text children from component properties */
function resolveChildren(
  instance: InstanceNode,
  childrenKey: string | undefined
): string | null {
  if (!childrenKey) return null;
  let rawProps: Record<string, ComponentProperty>;
  try { rawProps = instance.componentProperties ?? {}; } catch { return null; }
  const figmaKey = Object.keys(rawProps).find(k => k.split("#")[0] === childrenKey);
  if (!figmaKey) return null;
  const val = rawProps[figmaKey].value;
  return typeof val === "string" ? val : null;
}


/** Depth-first search for the first TEXT layer whose trimmed text isn't already used */
function findFirstUnusedText(node: ChildrenMixin, used: Set<string>): string | null {
  for (const child of (node as SceneNode as ChildrenMixin).children) {
    if (child.type === "TEXT") {
      const text = (child as TextNode).characters.trim();
      if (text && !used.has(text)) return text;
    }
    if ("children" in child) {
      const found = findFirstUnusedText(child as unknown as ChildrenMixin, used);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Scan a node recursively.
 * Returns a ScannedNode if it's a mapped Obra component,
 * or a ScannedFrame if it's a layout container,
 * or null if the node should be skipped.
 */
export async function scanNode(node: SceneNode): Promise<ScannedTree | null> {
  if (!node.visible) return null;

  if (node.type === "INSTANCE") {
    let mainComp: ComponentNode | null = null;
    try {
      mainComp = await node.getMainComponentAsync();
    } catch {
      return scanFrameNode(node as unknown as FrameNode);
    }
    if (!mainComp) return scanFrameNode(node as unknown as FrameNode);

    const compName = mainComp.parent?.type === "COMPONENT_SET"
      ? mainComp.parent.name
      : mainComp.name;

    const def = lookupComponent(compName);

    if (def) {
      // Slots: multiple named TEXT properties each wrapped in a sub-component
      if (def.slots && def.slots.length > 0) {
        const EMPTY_LAYOUT: Layout = { direction: "none", gap: 0, rowGap: 0, columns: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, wrap: false };
        const usedTexts = new Set<string>();
        const slotChildren: ScannedNode[] = [];
        for (const slot of def.slots) {
          let text: string | null = slot.key ? resolveChildren(node, slot.key) : null;
          if (text) usedTexts.add(text);

          if (!text && slot.scanChildren) {
            text = findFirstUnusedText(node, usedTexts);
            if (text) usedTexts.add(text);
          }

          if (text) {
            slotChildren.push({
              id:         `${node.id}-slot-${slot.component}`,
              figmaName:  slot.component,
              layerName:  slot.component,
              component:  slot.component,
              importPath: slot.importPath,
              props:      [],
              children:   text,
              layout:     EMPTY_LAYOUT,
            });
          }
        }
        return {
          id:         node.id,
          figmaName:  compName,
          layerName:  node.name,
          component:  def.component,
          importPath: def.importPath,
          props:      resolveProps(node, def),
          children:   slotChildren,
          layout:     extractLayout(node as unknown as FrameNode),
        };
      }

      const textChildren = resolveChildren(node, def.children);

      if (textChildren !== null) {
        const iconNodes: ScannedTree[] = [];
        for (const child of node.children ?? []) {
          try {
            const s = await scanNode(child);
            if (s && "isIcon" in s) iconNodes.push(s);
          } catch { /* skip child that failed to scan */ }
        }
        const children: string | ScannedTree[] = iconNodes.length > 0
          ? [...iconNodes, { isInlineText: true, id: `${node.id}-text`, content: textChildren } as ScannedInlineText]
          : textChildren;
        return {
          id:         node.id,
          figmaName:  compName,
          layerName:  node.name,
          component:  def.component,
          importPath: def.importPath,
          props:      resolveProps(node, def),
          children,
          layout:     extractLayout(node as unknown as FrameNode),
        };
      }

      const childNodes = await scanChildren(node);
      return {
        id:         node.id,
        figmaName:  compName,
        component:  def.component,
        importPath: def.importPath,
        props:      resolveProps(node, def),
        children:   childNodes,
        layout:     extractLayout(node as unknown as FrameNode),
      };
    }

    // Unmapped instance that is small AND looks like an icon → treat as Lucide icon
    const isSmall = node.width <= 48 && node.height <= 48;
    if (isSmall && looksLikeIconName(compName)) {
      return {
        isIcon:     true,
        id:         node.id,
        name:       compName,
        lucideName: toLucideName(compName),
        width:      Math.round(node.width),
        height:     Math.round(node.height),
      };
    }

    return scanFrameNode(node as unknown as FrameNode);
  }

  if (node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT") {
    // Small component with icon-like name (e.g. "Icon / cloud-rain") → Lucide icon
    if (node.type === "COMPONENT") {
      const isSmall = node.width <= 48 && node.height <= 48;
      if (isSmall && looksLikeIconName(node.name)) {
        return {
          isIcon:     true,
          id:         node.id,
          name:       node.name,
          lucideName: toLucideName(node.name),
          width:      Math.round(node.width),
          height:     Math.round(node.height),
        };
      }
    }
    return scanFrameNode(node as FrameNode);
  }

  // Component set — treat as icon if small and name looks like one
  if (node.type === "COMPONENT_SET") {
    const isSmall = node.width <= 48 && node.height <= 48;
    if (isSmall && looksLikeIconName(node.name)) {
      return {
        isIcon:     true,
        id:         node.id,
        name:       node.name,
        lucideName: toLucideName(node.name),
        width:      Math.round(node.width),
        height:     Math.round(node.height),
      };
    }
    return null;
  }

  if (node.type === "TEXT") {
    const text = node as TextNode;
    const content = text.characters.trim();
    if (!content) return null;

    const fontSize   = typeof text.fontSize   === "number" ? text.fontSize   : 14;
    const fontWeight = typeof text.fontWeight  === "number" ? text.fontWeight  : 400;
    const bold = fontWeight >= 600;

    let tag: ScannedText["tag"] = "p";
    if (fontSize >= 28) tag = "h1";
    else if (fontSize >= 22) tag = "h2";
    else if (fontSize >= 20) tag = "h3";
    else if (bold) tag = "span";

    const align: ScannedText["align"] =
      text.textAlignHorizontal === "CENTER"    ? "center"
    : text.textAlignHorizontal === "RIGHT"     ? "right"
    : text.textAlignHorizontal === "JUSTIFIED" ? null
    : null;

    const uppercase = text.textCase === "UPPER";
    const color = await resolveColorToken(node, "fills").catch(() => null);

    let styleName: string | null = null;
    const textStyleId = text.textStyleId;
    if (textStyleId && typeof textStyleId === "string") {
      try {
        const style = await figma.getStyleByIdAsync(textStyleId);
        if (style) {
          styleName = style.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
        }
      } catch { /* library style not accessible */ }
    }

    return { isText: true, id: node.id, content, tag, bold, align, color, uppercase, styleName };
  }

  // Any shape with an image fill → img placeholder
  if ("fills" in node && Array.isArray(node.fills)) {
    const hasImage = (node.fills as Paint[]).some((f: Paint) => f.type === "IMAGE");
    if (hasImage) {
      return {
        isImage: true,
        id: node.id,
        name: node.name,
        width:  Math.round(node.width),
        height: Math.round(node.height),
      };
    }
  }

  // Rectangle / Ellipse with a solid fill or variable binding → emit as a styled div
  if (node.type === "RECTANGLE" || node.type === "ELLIPSE") {
    const visual = await extractVisual(node as RectangleNode);
    if (visual.bgColor || visual.borderColor) {
      const EMPTY_LAYOUT: Layout = { direction: "none", gap: 0, rowGap: 0, columns: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, wrap: false };
      return { isLayout: true, id: node.id, name: node.name, layout: EMPTY_LAYOUT, visual, children: [] };
    }
  }

  // LINE nodes are separators/dividers, not icons — skip them
  if (node.type === "LINE") return null;

  // Raw vector / shape nodes → Lucide icon by layer name (only if name looks like an icon)
  if (
    node.type === "VECTOR" ||
    node.type === "BOOLEAN_OPERATION" ||
    node.type === "STAR" ||
    node.type === "POLYGON"
  ) {
    if (!looksLikeIconName(node.name)) return null;
    return {
      isIcon:     true,
      id:         node.id,
      name:       node.name,
      lucideName: toLucideName(node.name),
      width:      Math.round(node.width),
      height:     Math.round(node.height),
    };
  }

  return null;
}

async function scanFrameNode(node: FrameNode | GroupNode | ComponentNode): Promise<ScannedFrame | null> {
  const children = await scanChildren(node);
  const isGroup = node.type === "GROUP";
  const layout: Layout = !isGroup
    ? extractLayout(node as FrameNode)
    : { direction: "none", gap: 0, rowGap: 0, columns: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, wrap: false };
  const visual: Visual = !isGroup ? await extractVisual(node) : EMPTY_VISUAL;

  // Keep childless frames only when they carry visible styling (color swatch, spacer, etc.)
  if (children.length === 0 && !visual.bgColor && !visual.borderColor) return null;

  return { isLayout: true, id: node.id, name: node.name, layout, visual, children };
}

async function scanChildren(node: ChildrenMixin): Promise<ScannedTree[]> {
  const results: ScannedTree[] = [];
  for (const child of node.children) {
    const scanned = await scanNode(child);
    if (scanned) results.push(scanned);
  }
  return results;
}

/** Scan a top-level frame and return the full tree */
export async function scanFrame(frame: FrameNode): Promise<ScannedFrame> {
  const children = await scanChildren(frame);
  return {
    isLayout: true,
    id:       frame.id,
    name:     frame.name,
    layout:   extractLayout(frame),
    visual:   await extractVisual(frame),
    children,
  };
}
