import { resolveValue } from "./lib/resolve";
import { toCssVarName, toCssValue } from "./lib/transform";
import { generateCss } from "./lib/generate";
import type { FigmaVariable, FigmaVariableCollection, ResolvedToken, ComponentMap } from "./lib/types";
import { getTailwindClasses } from "./tailwind";
import { generateJsx } from "./jsx";
import { scanFrame, scanNode } from "./lib/frame-scanner";
import { generateJSX } from "./lib/jsx-generator";
import { generateHTML } from "./lib/html-generator";
import { saveSnapshot, loadSnapshot, tokensToSnapshot, diffTokens, generatePatch } from "./lib/token-diff";
import { buildTheme } from "./lib/theme-builder";
import type { ThemeConfig } from "./lib/theme-builder";
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
  const options: Record<string, string[]> = {};
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
        if (opts.length > 0) options[key] = opts;
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
    ...(Object.keys(options).length > 0 && { options }),
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
      let htmlResult: string | null = null;
      let unmappedComponent = null;

      // Frame or group → scan full tree and generate both JSX and HTML
      if (node.type === "FRAME" || node.type === "GROUP") {
        const tree = await scanFrame(node as FrameNode);
        jsxResult = generateJSX(tree);
        htmlResult = generateHTML(tree);
      }
      // Single component instance → try new scanner first, fall back to old
      else if (node.type === "INSTANCE") {
        const scanned = await scanNode(node);
        if (scanned) {
          jsxResult = generateJSX(scanned);
          htmlResult = generateHTML(scanned);
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
        htmlResult,
        unmappedComponent,
      });
    } catch (err) {
      figma.ui.postMessage({ type: "ERROR", message: String(err) });
    }
  }

  if (msg.type === "GET_TEXT_COMPONENT") {
    try {
      const styles = await figma.getLocalTextStylesAsync();
      type StyleEntry = { variant: string; tag: string; classes: string };
      const entries: StyleEntry[] = [];

      const SIZE_MAP: Record<number, string> = {
        12: "text-xs", 14: "text-sm", 16: "text-base", 18: "text-lg",
        20: "text-xl", 24: "text-2xl", 30: "text-3xl", 36: "text-4xl",
        48: "text-5xl", 60: "text-6xl", 72: "text-7xl",
      };
      const WEIGHT_MAP: Record<number, string> = {
        100: "font-thin", 200: "font-extralight", 300: "font-light",
        400: "font-normal", 500: "font-medium", 600: "font-semibold",
        700: "font-bold", 800: "font-extrabold", 900: "font-black",
      };

      for (const style of styles) {
        const variant = style.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
        const cls: string[] = [];
        const fs = style.fontSize ?? 16;

        cls.push(SIZE_MAP[Math.round(fs)] ?? `text-[${Math.round(fs)}px]`);

        if (typeof style.fontWeight === "number") {
          const w = WEIGHT_MAP[style.fontWeight];
          if (w && w !== "font-normal") cls.push(w);
        }

        const lh = style.lineHeight as any;
        if (lh && lh.unit !== "AUTO") {
          const ratio = lh.unit === "PIXELS" ? lh.value / fs : lh.value / 100;
          const LEADING: [number, string][] = [
            [1.0, "leading-none"], [1.25, "leading-tight"], [1.375, "leading-snug"],
            [1.5, "leading-normal"], [1.625, "leading-relaxed"], [2.0, "leading-loose"],
          ];
          const match = LEADING.find(([v]) => Math.abs(ratio - v) < 0.05);
          cls.push(match ? match[1] : `leading-[${+(ratio.toFixed(3))}]`);
        }

        const ls = style.letterSpacing as any;
        if (ls && typeof ls.value === "number" && ls.value !== 0) {
          const em = ls.unit === "PIXELS" ? ls.value / fs : ls.value / 100;
          const TRACKING: [number, string][] = [
            [-0.05, "tracking-tighter"], [-0.025, "tracking-tight"],
            [0.025, "tracking-wide"], [0.05, "tracking-wider"], [0.1, "tracking-widest"],
          ];
          const match = TRACKING.find(([v]) => Math.abs(em - v) < 0.01);
          cls.push(match ? match[1] : `tracking-[${+(em.toFixed(4))}em]`);
        }

        // Semantic HTML tag
        const tag = variant.startsWith("heading-1") ? "h1"
                  : variant.startsWith("heading-2") ? "h2"
                  : variant.startsWith("heading-3") ? "h3"
                  : variant.startsWith("heading-4") ? "h4"
                  : variant.startsWith("caption")   ? "span"
                  : variant.includes("mono")        ? "code"
                  : "p";

        entries.push({ variant, tag, classes: cls.join(" ") });
      }

      const mode = (msg as any).mode as "jsx" | "css";
      let component: string;

      if (mode === "css") {
        // Generate text.css — one class per style with @apply
        component = entries.map(e =>
          `.${e.variant} {\n  @apply ${e.classes};\n}`
        ).join("\n\n");
      } else {
        // Generate Text.tsx React component
        const variantType = entries.map(e => `"${e.variant}"`).join(" | ");
        const variantMap  = entries.map(e => `  "${e.variant}": "${e.classes}",`).join("\n");
        const tagMap      = entries.map(e => `  "${e.variant}": "${e.tag}",`).join("\n");

        component = `import { cn } from "@/lib/utils";

type TextVariant = ${variantType};

const variantClasses: Record<TextVariant, string> = {
${variantMap}
};

const variantTag: Record<TextVariant, keyof React.JSX.IntrinsicElements> = {
${tagMap}
};

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant: TextVariant;
  as?: keyof React.JSX.IntrinsicElements;
  children?: React.ReactNode;
}

export function Text({ variant, as, className, children, ...props }: TextProps) {
  const Tag = (as ?? variantTag[variant]) as React.ElementType;
  return (
    <Tag className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </Tag>
  );
}`;
      }

      figma.ui.postMessage({ type: "TEXT_COMPONENT", component, count: entries.length });
    } catch (err) {
      figma.ui.postMessage({ type: "ERROR", message: String(err) });
    }
  }

  if (msg.type === "APPLY_THEME") {
    try {
      const config = (msg as any).config as ThemeConfig;
      const theme = buildTheme(config);

      // Find or create "brand colors" collection (matches Obra's collection name)
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const existingColl = collections.find(c => c.name === "brand colors");

      let coll: VariableCollection;
      if (existingColl) {
        coll = existingColl;
      } else {
        coll = figma.variables.createVariableCollection("brand colors");
        coll.renameMode(coll.modes[0].modeId, "light");
        coll.addMode("dark");
      }

      const lightModeId = coll.modes.find(m => m.name === "light")?.modeId ?? coll.modes[0].modeId;
      const darkModeId  = coll.modes.find(m => m.name === "dark")?.modeId  ?? coll.modes[1]?.modeId;

      function hslToRgba(hsl: string): RGBA {
        const parts = hsl.trim().split(/\s+/);
        const h = parseFloat(parts[0]) / 360;
        const s = parseFloat(parts[1]) / 100;
        const l = parseFloat(parts[2]) / 100;
        function hue2rgb(p: number, q: number, t: number): number {
          if (t < 0) t += 1; if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        }
        if (s === 0) return { r: l, g: l, b: l, a: 1 };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        return { r: hue2rgb(p, q, h + 1/3), g: hue2rgb(p, q, h), b: hue2rgb(p, q, h - 1/3), a: 1 };
      }

      // Upsert a color variable (find existing by name, create if missing)
      async function upsertColorVar(name: string, lightHsl: string, darkHsl: string) {
        const allVars = await figma.variables.getLocalVariablesAsync();
        let variable = allVars.find(v => v.name === name && v.variableCollectionId === coll.id);
        if (!variable) {
          variable = figma.variables.createVariable(name, coll, "COLOR");
        }
        variable.setValueForMode(lightModeId, hslToRgba(lightHsl));
        if (darkModeId) {
          variable.setValueForMode(darkModeId, hslToRgba(darkHsl));
        }
      }

      // Write brand-shades (accent color scale, same for light+dark — semantic layer handles mode switching)
      for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
        const hsl = theme.brandScale[step];
        await upsertColorVar(`brand-shades/${step}`, hsl, hsl);
      }

      // Write brand-neutrals (drives backgrounds, text, primary buttons)
      for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
        const hsl = theme.neutralScale[step];
        await upsertColorVar(`brand-neutrals/${step}`, hsl, hsl);
      }

      figma.ui.postMessage({ type: "THEME_APPLIED", success: true });
    } catch (err) {
      figma.ui.postMessage({ type: "THEME_APPLIED", success: false, error: String(err) });
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
