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

export interface ScannedNode {
  /** Figma node id */
  id: string;
  /** Obra component name (from mainComponent) */
  figmaName: string;
  /** shadcn/ui component name */
  component: string;
  /** Import path */
  importPath: string;
  /** Resolved shadcn/ui props */
  props: ScannedProp[];
  /** Text children content */
  children: string | ScannedNode[];
  /** Layout info */
  layout: {
    direction: "horizontal" | "vertical" | "none";
    gap: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    wrap: boolean;
  };
}

export interface ScannedFrame {
  /** Raw layout-only nodes (not mapped components) */
  isLayout: true;
  id: string;
  name: string;
  layout: ScannedNode["layout"];
  children: Array<ScannedNode | ScannedFrame>;
}

export type ScannedTree = ScannedNode | ScannedFrame;

/** Extract layout info from any frame-like node */
function extractLayout(node: FrameNode | ComponentNode | InstanceNode): ScannedNode["layout"] {
  const isAuto = node.layoutMode !== "NONE";
  return {
    direction: node.layoutMode === "HORIZONTAL" ? "horizontal"
             : node.layoutMode === "VERTICAL"   ? "vertical"
             : "none",
    gap:           isAuto ? (node.itemSpacing ?? 0)       : 0,
    paddingTop:    isAuto ? (node.paddingTop ?? 0)         : 0,
    paddingRight:  isAuto ? (node.paddingRight ?? 0)       : 0,
    paddingBottom: isAuto ? (node.paddingBottom ?? 0)      : 0,
    paddingLeft:   isAuto ? (node.paddingLeft ?? 0)        : 0,
    wrap:          isAuto ? (node.layoutWrap === "WRAP")   : false,
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

    return scanFrameNode(node as unknown as FrameNode);
  }

  if (node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT") {
    return scanFrameNode(node as FrameNode);
  }

  return null;
}

async function scanFrameNode(node: FrameNode | GroupNode | ComponentNode): Promise<ScannedFrame | null> {
  const children = await scanChildren(node);
  if (children.length === 0) return null;

  const layout = node.type !== "GROUP"
    ? extractLayout(node as FrameNode)
    : { direction: "none" as const, gap: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, wrap: false };

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
