import { resolveValue } from "./lib/resolve";
import { toCssVarName, toCssValue } from "./lib/transform";
import { generateCss } from "./lib/generate";
import type { FigmaVariable, FigmaVariableCollection, ResolvedToken } from "./lib/types";
import { getTailwindClasses } from "./tailwind";

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

// ── Message handlers ───────────────────────────────────────────────────────

figma.ui.onmessage = async (msg: { type: string }) => {
  if (msg.type === "EXPORT_TOKENS") {
    try {
      const { collections, variables } = await collectVariables();
      const tokens = buildTokens(collections, variables);
      const css = generateCss(tokens);
      figma.ui.postMessage({ type: "TOKENS_CSS", css, count: tokens.length });
    } catch (err) {
      figma.ui.postMessage({ type: "ERROR", message: String(err) });
    }
  }

  if (msg.type === "GET_TAILWIND") {
    const node = figma.currentPage.selection[0];
    if (!node) {
      figma.ui.postMessage({ type: "TAILWIND_RESULT", classes: "", error: "Select a frame first" });
      return;
    }
    try {
      const { collections, variables } = await collectVariables();
      const classes = getTailwindClasses(node, variables, collections);
      figma.ui.postMessage({
        type: "TAILWIND_RESULT",
        classes,
        nodeName: node.name,
      });
    } catch (err) {
      figma.ui.postMessage({ type: "ERROR", message: String(err) });
    }
  }
};

// Notify UI when selection changes so Tailwind tab stays in sync
figma.on("selectionchange", () => {
  const node = figma.currentPage.selection[0];
  figma.ui.postMessage({
    type: "SELECTION_CHANGE",
    hasSelection: !!node,
    nodeName: node?.name ?? "",
  });
});
