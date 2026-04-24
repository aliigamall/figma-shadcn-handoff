import { resolveValue } from "./lib/resolve";
import { toCssVarName, toCssValue } from "./lib/transform";
import { generateCss } from "./lib/generate";
import type { FigmaVariable, FigmaVariableCollection, ResolvedToken, ComponentMap } from "./lib/types";
import { getTailwindClasses } from "./tailwind";
import { generateJsx } from "./jsx";
import { scanFrame, scanNode } from "./lib/frame-scanner";
import { generateJSX } from "./lib/jsx-generator";
import { saveSnapshot, loadSnapshot, tokensToSnapshot, diffTokens, generatePatch } from "./lib/token-diff";
import componentMap from "../components.json";

figma.showUI(__html__, { width: 360, height: 500, title: "Figma Handoff" });

// ── Collect all local variables from the Figma plugin API ─────────────────

async function collectVariables(): Promise<{
  collections: Record<string, FigmaVariableCollection>;
  variables: Record<string, FigmaVariable>;
}> {
  const collections: Record<string, FigmaVariableCollection> = {};
  const variables: Record<string, FigmaVariable> = {};

  for (const v of await figma.variables.getLocalVariablesAsync()) {
    variables[v.id] = {
      id: v.id,
      name: v.name,
      resolvedType: v.resolvedType as FigmaVariable["resolvedType"],
      variableCollectionId: v.variableCollectionId,
      valuesByMode: v.valuesByMode as FigmaVariable["valuesByMode"],
    };

    if (!collections[v.variableCollectionId]) {
      const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
      if (col) {
        collections[col.id] = {
          id: col.id,
          name: col.name,
          modes: col.modes,
          defaultModeId: col.defaultModeId,
          variableIds: col.variableIds,
        };
      }
    }
  }

  return { collections, variables };
}

// ── Token pipeline (same logic as CLI) ────────────────────────────────────

function buildTokens(
  collections: Record<string, FigmaVariableCollection>,
  variables: Record<string, FigmaVariable>
): ResolvedToken[] {
  // Pre-build id → CSS var name map for alias resolution
  const cssVarNames = new Map<string, string>();
  for (const v of Object.values(variables)) {
    const col = collections[v.variableCollectionId];
    if (!col) continue;
    cssVarNames.set(v.id, toCssVarName(col.name, v.name));
  }

  const tokens: ResolvedToken[] = [];

  for (const col of Object.values(collections)) {
    // ADR-003: first mode = light, second mode = dark
    const [lightModeId, darkModeId] = col.modes.map((m) => m.modeId);

    for (const variableId of col.variableIds) {
      const variable = variables[variableId];
      if (!variable || variable.resolvedType === "BOOLEAN") continue;

      const cssVar = toCssVarName(col.name, variable.name);
      const rawLight = variable.valuesByMode[lightModeId];
      const rawDark = darkModeId ? variable.valuesByMode[darkModeId] : undefined;

      // ADR-004: one level of alias resolution
      const resolvedLight = resolveValue(rawLight, lightModeId, variables);
      const resolvedDark = rawDark ? resolveValue(rawDark, darkModeId, variables) : undefined;

      tokens.push({
        cssVar,
        light: toCssValue(resolvedLight, cssVarNames),
        dark: resolvedDark ? toCssValue(resolvedDark, cssVarNames) : undefined,
        collection: col.name,
      });
    }
  }

  return tokens;
}

// ── Dev tab: component info + draft JSON generator ────────────────────────

interface PropInfo {
  name: string;
  type: string;
  options: string[];       // VARIANT options
  currentValue: string | boolean;
}

interface ComponentInfo {
  componentName: string;
  figmaNodeName: string;
  properties: PropInfo[];
  draft: string;           // formatted JSON ready to paste
}

function buildDraftEntry(
  componentName: string,
  defs: Record<string, ComponentPropertyDefinition>
): Record<string, unknown> {
  const props: Record<string, string> = {};
  const defaults: Record<string, string> = {};
  const booleans: Record<string, Record<string, string>> = {};
  let children: string | undefined;

  for (const [rawKey, def] of Object.entries(defs)) {
    const key = rawKey.replace(/#[\d:]+$/, ""); // strip Figma's "#NNN" suffix

    if (def.type === "VARIANT") {
      const opts: string[] = (def as any).variantOptions ?? [];

      // "State" almost always maps to boolean props in React
      if (key.toLowerCase() === "state") {
        const stateMap: Record<string, string> = {};
        for (const opt of opts) {
          const lo = opt.toLowerCase();
          if (lo !== "default" && lo !== "normal" && lo !== "rest") {
            stateMap[opt] = lo; // "Disabled" → "disabled"
          }
        }
        if (Object.keys(stateMap).length > 0) booleans[key] = stateMap;
      } else {
        const propName = key.toLowerCase();
        props[key] = propName;
        // Use "Default" option (or first) as the default to omit
        const defaultOpt =
          opts.find((v) => v.toLowerCase() === "default") ?? opts[0];
        if (defaultOpt) defaults[propName] = defaultOpt.toLowerCase();
      }
    } else if (def.type === "TEXT" && !children) {
      children = key; // first TEXT property → children
    }
    // BOOLEAN / INSTANCE_SWAP: user decides; skip from auto-draft
  }

  return {
    import: `@/components/ui/${componentName.toLowerCase().replace(/\s+/g, "-")}`,
    ...(Object.keys(props).length > 0 && { props }),
    ...(Object.keys(defaults).length > 0 && { defaults }),
    ...(Object.keys(booleans).length > 0 && { booleans }),
    ...(children && { children }),
  };
}

function buildPropertyList(
  defs: Record<string, ComponentPropertyDefinition>,
  currentValues: Record<string, ComponentProperty>
): PropInfo[] {
  return Object.entries(defs).map(([rawKey, def]) => {
    const key = rawKey.replace(/#[\d:]+$/, "");
    const instanceKey = Object.keys(currentValues).find(
      (k) => k.replace(/#[\d:]+$/, "") === key
    );
    const current = instanceKey ? currentValues[instanceKey] : null;
    return {
      name: key,
      type: def.type,
      options: (def as any).variantOptions ?? [],
      currentValue: current ? (current.value as string | boolean) : "",
    };
  });
}

async function getComponentInfo(node: SceneNode): Promise<ComponentInfo | null> {
  let componentName: string;
  let defs: Record<string, ComponentPropertyDefinition>;
  let currentValues: Record<string, ComponentProperty> = {};

  if (node.type === "INSTANCE") {
    // Placed instance — has current values + all definitions via main component
    const main = await node.getMainComponentAsync();
    if (!main) return null;
    const parent = main.parent;
    const isSet = parent?.type === "COMPONENT_SET";
    componentName = isSet ? (parent as ComponentSetNode).name : main.name;
    const source = isSet ? (parent as ComponentSetNode) : main;
    defs = source.componentPropertyDefinitions ?? {};
    currentValues = node.componentProperties;

  } else if (node.type === "COMPONENT_SET") {
    // The top-level set that holds all variants
    componentName = node.name;
    defs = node.componentPropertyDefinitions ?? {};

  } else if (node.type === "COMPONENT") {
    // Single variant component — check if it belongs to a set
    const parent = node.parent;
    if (parent?.type === "COMPONENT_SET") {
      componentName = (parent as ComponentSetNode).name;
      defs = (parent as ComponentSetNode).componentPropertyDefinitions ?? {};
    } else {
      componentName = node.name;
      defs = node.componentPropertyDefinitions ?? {};
    }

  } else {
    return null;
  }

  const properties = buildPropertyList(defs, currentValues);
  const draftEntry = buildDraftEntry(componentName, defs);
  const draft = JSON.stringify({ [componentName]: draftEntry }, null, 2);

  return { componentName, figmaNodeName: node.name, properties, draft };
}

// ── Message handlers ───────────────────────────────────────────────────────

figma.ui.onmessage = async (msg: { type: string }) => {
  if (msg.type === "EXPORT_TOKENS") {
    try {
      const { collections, variables } = await collectVariables();
      const tokens = buildTokens(collections, variables);
      const css = generateCss(tokens);

      // Diff against last snapshot
      const previous = loadSnapshot();
      const current  = tokensToSnapshot(tokens);
      const diff     = diffTokens(previous, current);
      const patch    = generatePatch(diff);

      // Save new snapshot
      saveSnapshot(tokens);

      figma.ui.postMessage({
        type:  "TOKENS_CSS",
        css,
        count: tokens.length,
        diff,
        patch,
      });
    } catch (err) {
      figma.ui.postMessage({ type: "ERROR", message: String(err) });
    }
  }

  if (msg.type === "GET_TAILWIND") {
    const node = figma.currentPage.selection[0];
    if (!node) {
      figma.ui.postMessage({ type: "TAILWIND_RESULT", classes: "", error: "Select a node first" });
      return;
    }
    try {
      const { collections, variables } = await collectVariables();
      const classes = await getTailwindClasses(node, variables, collections);

      let jsxResult: { imports: string; jsx: string; components: string[] } | null = null;
      let unmappedComponent = null;

      // Frame or group → scan full tree and generate JSX
      if (node.type === "FRAME" || node.type === "GROUP") {
        const tree = await scanFrame(node as FrameNode);
        jsxResult = generateJSX(tree);
      }
      // Single component instance → try new scanner first, fall back to old
      else if (node.type === "INSTANCE") {
        const scanned = await scanNode(node);
        if (scanned) {
          jsxResult = generateJSX(scanned);
        } else {
          const legacyResult = await generateJsx(node, componentMap as ComponentMap);
          if (legacyResult) {
            jsxResult = {
              imports: legacyResult.importLine,
              jsx: legacyResult.jsx,
              components: [],
            };
          } else {
            const main = await node.getMainComponentAsync();
            unmappedComponent = main?.parent?.type === "COMPONENT_SET"
              ? main.parent.name
              : main?.name ?? node.name;
          }
        }
      }

      figma.ui.postMessage({
        type: "TAILWIND_RESULT",
        classes,
        nodeName: node.name,
        jsxResult,
        unmappedComponent,
      });
    } catch (err) {
      figma.ui.postMessage({ type: "ERROR", message: String(err) });
    }
  }
};

// Notify UI on selection change — also send component info for Dev tab
figma.on("selectionchange", async () => {
  const node = figma.currentPage.selection[0];

  let componentInfo: ComponentInfo | null = null;
  const devTypes = ["INSTANCE", "COMPONENT", "COMPONENT_SET"];
  if (node && devTypes.includes(node.type)) {
    componentInfo = await getComponentInfo(node).catch(() => null);
  }

  figma.ui.postMessage({
    type: "SELECTION_CHANGE",
    hasSelection: !!node,
    nodeName: node?.name ?? "",
    nodeType: node?.type ?? "",
    componentInfo,
  });
});
