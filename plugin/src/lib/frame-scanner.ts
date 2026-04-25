/**
 * Frame Scanner
 *
 * Recursively walks a Figma node tree, identifies Obra component instances,
 * and returns a structured component tree ready for JSX generation.
 */

import { lookupComponent } from "./component-map";

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
  component: string;
  importPath: string;
  props: ScannedProp[];
  children: string | ScannedNode[];
  layout: Layout;
}

export interface ScannedFrame {
  isLayout: true;
  id: string;
  name: string;
  layout: Layout;
  children: Array<ScannedTree>;
}

export interface ScannedText {
  isText: true;
  id: string;
  content: string;
  tag: "h1" | "h2" | "h3" | "p" | "span";
  bold: boolean;
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

export type ScannedTree = ScannedNode | ScannedFrame | ScannedText | ScannedImage | ScannedIcon;

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
  const rawProps = instance.componentProperties ?? {};

  for (const [obraKey, propDef] of Object.entries(def.props)) {
    // Find the matching Figma property (key includes a '#...' suffix)
    const figmaKey = Object.keys(rawProps).find(k => k.split("#")[0] === obraKey);
    if (!figmaKey) continue;

    const rawValue = String(rawProps[figmaKey].value);

    // Skip null-mapped values (means "don't emit this prop")
    if (propDef.values && propDef.values[rawValue] === null) continue;

    const mappedValue = propDef.values
      ? (propDef.values[rawValue] ?? rawValue.toLowerCase())
      : rawValue.toLowerCase();

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
  const rawProps = instance.componentProperties ?? {};
  const figmaKey = Object.keys(rawProps).find(k => k.split("#")[0] === childrenKey);
  if (!figmaKey) return null;
  const val = rawProps[figmaKey].value;
  return typeof val === "string" ? val : null;
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
    const mainComp = await node.getMainComponentAsync();
    if (!mainComp) return scanFrameNode(node as unknown as FrameNode);

    const compName = mainComp.parent?.type === "COMPONENT_SET"
      ? mainComp.parent.name
      : mainComp.name;

    const def = lookupComponent(compName);

    if (def) {
      const textChildren = resolveChildren(node, def.children);
      const childNodes = textChildren === null
        ? await scanChildren(node)
        : [];

      return {
        id:         node.id,
        figmaName:  compName,
        component:  def.component,
        importPath: def.importPath,
        props:      resolveProps(node, def),
        children:   textChildren ?? childNodes,
        layout:     extractLayout(node as unknown as FrameNode),
      };
    }

    // Unmapped instance that is small → treat as a Lucide icon
    const isSmall = node.width <= 48 && node.height <= 48;
    if (isSmall) {
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
    return scanFrameNode(node as FrameNode);
  }

  if (node.type === "TEXT") {
    const text = node as TextNode;
    const content = text.characters.trim();
    if (!content) return null;

    const fontSize = typeof text.fontSize === "number" ? text.fontSize : 14;
    const fontWeight = typeof text.fontWeight === "number" ? text.fontWeight : 400;
    const bold = fontWeight >= 600;

    let tag: ScannedText["tag"] = "p";
    if (fontSize >= 28) tag = "h1";
    else if (fontSize >= 22) tag = "h2";
    else if (fontSize >= 20) tag = "h3";
    else if (bold) tag = "span";

    return { isText: true, id: node.id, content, tag, bold };
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

  // Raw vector / shape nodes → Lucide icon by layer name
  if (
    node.type === "VECTOR" ||
    node.type === "BOOLEAN_OPERATION" ||
    node.type === "STAR" ||
    node.type === "POLYGON" ||
    node.type === "LINE"
  ) {
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
  if (children.length === 0) return null;

  const layout: Layout = node.type !== "GROUP"
    ? extractLayout(node as FrameNode)
    : { direction: "none", gap: 0, rowGap: 0, columns: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, wrap: false };

  return {
    isLayout: true,
    id:       node.id,
    name:     node.name,
    layout,
    children,
  };
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
    children,
  };
}
