import type { ComponentMap } from "./lib/types";

export interface JsxResult {
  componentName: string;
  importLine: string;
  jsx: string;
}

/** Resolves the top-level component name from an instance node. */
async function resolveComponentName(node: InstanceNode): Promise<string> {
  const main = await node.getMainComponentAsync();
  const parent = main?.parent;
  if (parent?.type === "COMPONENT_SET") return parent.name;
  return main?.name ?? node.name;
}

/**
 * Generates JSX + import line for a selected component instance.
 * Returns null if the component isn't in the map.
 */
export async function generateJsx(
  node: InstanceNode,
  componentMap: ComponentMap
): Promise<JsxResult | null> {
  const componentName = await resolveComponentName(node);

  // Case-insensitive lookup
  const mapKey = Object.keys(componentMap).find(
    (k) => k.toLowerCase() === componentName.toLowerCase()
  );
  if (!mapKey) return null;

  const mapping = componentMap[mapKey];
  const props: string[] = [];

  // ── Variant / string props ────────────────────────────────────────────
  for (const [figmaProp, reactProp] of Object.entries(mapping.props ?? {})) {
    const cprop = findProp(node, figmaProp);
    if (!cprop || cprop.type === "BOOLEAN" || cprop.type === "INSTANCE_SWAP") continue;

    const value = String(cprop.value).toLowerCase().trim();
    const defaultVal = mapping.defaults?.[reactProp]?.toLowerCase();

    if (defaultVal && value === defaultVal) continue; // omit default values

    props.push(`${reactProp}="${value}"`);
  }

  // ── Boolean props (e.g. State=Disabled → disabled) ───────────────────
  for (const [figmaProp, valueMap] of Object.entries(mapping.booleans ?? {})) {
    const cprop = findProp(node, figmaProp);
    if (!cprop) continue;

    const figmaValue = String(cprop.value);
    const boolProp = valueMap[figmaValue];
    if (boolProp) props.push(boolProp);
  }

  // ── Children (TEXT property) ──────────────────────────────────────────
  let children: string | null = null;
  if (mapping.children) {
    const cprop = findProp(node, mapping.children);
    if (cprop?.type === "TEXT") children = String(cprop.value);
  }

  // ── Assemble JSX ─────────────────────────────────────────────────────
  const propsStr = props.length > 0 ? " " + props.join(" ") : "";
  const jsx = children !== null
    ? `<${mapKey}${propsStr}>\n  ${children}\n</${mapKey}>`
    : `<${mapKey}${propsStr} />`;

  const importLine = `import { ${mapKey} } from "${mapping.import}"`;

  return { componentName: mapKey, importLine, jsx };
}

/** Case-insensitive lookup for a component property by Figma prop name. */
function findProp(
  node: InstanceNode,
  figmaPropName: string
): ComponentProperty | undefined {
  const key = Object.keys(node.componentProperties).find(
    // Figma appends "#NNN" to prop keys in some cases — strip it for matching
    (k) => k.replace(/#\d+$/, "").toLowerCase() === figmaPropName.toLowerCase()
  );
  return key ? node.componentProperties[key] : undefined;
}
