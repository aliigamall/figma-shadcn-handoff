"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/lib/resolve.ts
  function resolveValue(value, modeId, allVariables) {
    var _a;
    if (typeof value !== "object" || value === null || !("type" in value) || value.type !== "VARIABLE_ALIAS") {
      return value;
    }
    const target = allVariables[value.id];
    if (!target)
      return value;
    return (_a = target.valuesByMode[modeId]) != null ? _a : value;
  }
  var init_resolve = __esm({
    "src/lib/resolve.ts"() {
      "use strict";
    }
  });

  // src/lib/transform.ts
  function sanitizeSegment(s) {
    return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/,/g, "-").replace(/[()]/g, "").replace(/[^a-z0-9\-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }
  function toCssVarName(collection, path) {
    const col = collection.toLowerCase().trim();
    const parts = path.split("/").map(sanitizeSegment);
    if (col === "semantic colors") {
      const [group, ...rest] = parts;
      if (group === "general")
        return `--${rest.join("-")}`;
      const name = rest.join("-");
      const prefix = `${group}-`;
      const stripped = name === group ? "" : name.startsWith(prefix) ? name.slice(prefix.length) : name;
      if (!stripped)
        return `--${group}`;
      return `--${group}-${stripped}`;
    }
    if (col === "raw colors" || col === "brand colors")
      return `--color-${parts.join("-")}`;
    if (col === "border radii")
      return `--radius-${parts.join("-")}`;
    if (col === "spacing" || col.startsWith("spacing "))
      return `--spacing-${parts.join("-")}`;
    if (col === "typography")
      return `--typography-${parts.join("-")}`;
    if (col === "shadows")
      return `--shadow-${parts.join("-")}`;
    const slug = sanitizeSegment(col);
    return `--${slug}-${parts.join("-")}`;
  }
  function rgbaToHex(color) {
    const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
    const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    return color.a < 1 ? `${hex}${toHex(color.a)}` : hex;
  }
  function toCssValue(value, allCssVarNames) {
    if (typeof value === "object" && value !== null) {
      if ("type" in value && value.type === "VARIABLE_ALIAS") {
        const cssVar = allCssVarNames.get(value.id);
        return cssVar ? `var(${cssVar})` : "unset";
      }
      return rgbaToHex(value);
    }
    if (typeof value === "number")
      return value === 0 ? "0" : `${value}px`;
    if (typeof value === "string")
      return value;
    return String(value);
  }
  var init_transform = __esm({
    "src/lib/transform.ts"() {
      "use strict";
    }
  });

  // src/lib/generate.ts
  function isThemeVar(cssVar) {
    return THEME_PREFIXES.some((p) => cssVar.startsWith(p));
  }
  function isColorValue(value) {
    if (value.startsWith("#"))
      return true;
    if (value.startsWith("var(--color-"))
      return true;
    if (value.startsWith("var(--alpha-"))
      return true;
    if (value.startsWith("var(--chart-"))
      return true;
    if (/^(rgb|hsl|oklch|oklab|hwb|lch|lab|color-mix|color)\s*\(/i.test(value))
      return true;
    return false;
  }
  function generateCss(tokens) {
    const themeTokens = tokens.filter((t) => isThemeVar(t.cssVar));
    const semanticTokens = tokens.filter((t) => !isThemeVar(t.cssVar));
    const darkTokens = tokens.filter((t) => t.dark !== void 0);
    const parts = [FILE_HEADER];
    if (themeTokens.length > 0) {
      const lines = themeTokens.map((t) => `  ${t.cssVar}: ${t.light};`).join("\n");
      parts.push(`@theme {
${lines}
}`);
    }
    const inlineLines = semanticTokens.filter((t) => isColorValue(t.light)).map((t) => `  --color-${t.cssVar.slice(2)}: var(${t.cssVar});`);
    if (inlineLines.length > 0) {
      parts.push(`@theme inline {
${inlineLines.join("\n")}
}`);
    }
    if (semanticTokens.length > 0) {
      const lines = semanticTokens.map((t) => `  ${t.cssVar}: ${t.light};`).join("\n");
      parts.push(`:root {
${lines}
}`);
    }
    if (darkTokens.length > 0) {
      const darkLines = darkTokens.map((t) => `  ${t.cssVar}: ${t.dark};`).join("\n");
      parts.push(`[data-theme="dark"] {
${darkLines}
}`);
    }
    parts.push(LAYER_BASE);
    return parts.join("\n\n");
  }
  var THEME_PREFIXES, FILE_HEADER, LAYER_BASE;
  var init_generate = __esm({
    "src/lib/generate.ts"() {
      "use strict";
      THEME_PREFIXES = [
        "--color-",
        "--alpha-",
        "--radius-",
        "--spacing-",
        "--typography-",
        "--shadow-",
        "--border-radii-",
        "--chart-colors-"
      ];
      FILE_HEADER = `@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));`;
      LAYER_BASE = `@layer base {
  * {
    border-color: var(--border);
    outline-color: color-mix(in srgb, var(--ring) 50%, transparent);
  }
  body {
    background-color: var(--background);
    color: var(--foreground);
  }
  html {
    font-family: var(--font-sans, sans-serif);
  }
}`;
    }
  });

  // src/tailwind.ts
  function spacingToken(val) {
    const s = SPACING[Math.round(val)];
    return s !== void 0 ? s : `[${Math.round(val)}px]`;
  }
  function radiusClass(val) {
    const s = RADIUS[Math.round(val)];
    if (s === void 0)
      return `rounded-[${Math.round(val)}px]`;
    return s === "" ? "rounded" : `rounded-${s}`;
  }
  function resolveColorClass(node, property, prefix, variables, collections) {
    return __async(this, null, function* () {
      const boundVars = node.boundVariables;
      const bound = boundVars == null ? void 0 : boundVars[property];
      if (bound) {
        const entry = Array.isArray(bound) ? bound[0] : bound;
        if ((entry == null ? void 0 : entry.type) === "VARIABLE_ALIAS") {
          let v = variables[entry.id];
          let col = v ? collections[v.variableCollectionId] : void 0;
          if (!v) {
            const fetched = yield figma.variables.getVariableByIdAsync(entry.id);
            if (fetched) {
              v = {
                id: fetched.id,
                name: fetched.name,
                resolvedType: fetched.resolvedType,
                variableCollectionId: fetched.variableCollectionId,
                valuesByMode: fetched.valuesByMode
              };
              const fetchedCol = yield figma.variables.getVariableCollectionByIdAsync(fetched.variableCollectionId);
              if (fetchedCol) {
                col = {
                  id: fetchedCol.id,
                  name: fetchedCol.name,
                  modes: fetchedCol.modes,
                  defaultModeId: fetchedCol.defaultModeId,
                  variableIds: fetchedCol.variableIds
                };
              }
            }
          }
          if (v && col) {
            const cssVar = toCssVarName(col.name, v.name);
            const tokenName = cssVar.replace(/^--/, "");
            return `${prefix}-${tokenName}`;
          }
        }
      }
      const paints = node[property];
      if (Array.isArray(paints) && paints.length > 0) {
        const paint = paints[0];
        if (paint.type === "SOLID" && paint.visible !== false) {
          const { r, g, b } = paint.color;
          const h = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
          return `${prefix}-[#${h(r)}${h(g)}${h(b)}]`;
        }
      }
      return null;
    });
  }
  function shadowFromBlur(blur) {
    if (blur <= 2)
      return "shadow-sm";
    if (blur <= 6)
      return "shadow";
    if (blur <= 12)
      return "shadow-md";
    if (blur <= 20)
      return "shadow-lg";
    if (blur <= 32)
      return "shadow-xl";
    return "shadow-2xl";
  }
  function getTailwindClasses(node, variables, collections) {
    return __async(this, null, function* () {
      var _a, _b;
      const cls = [];
      if (node.type === "TEXT") {
        const color = yield resolveColorClass(node, "fills", "text", variables, collections);
        if (color)
          cls.push(color);
        const textStyleId = node.textStyleId;
        if (textStyleId && typeof textStyleId === "string") {
          const style = yield figma.getStyleByIdAsync(textStyleId);
          if (style) {
            const styleClass = style.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
            cls.push(`font-style-${styleClass}`);
          }
        }
        const fontSize = typeof node.fontSize === "number" ? node.fontSize : 14;
        const SIZE = {
          12: "text-xs",
          14: "text-sm",
          16: "text-base",
          18: "text-lg",
          20: "text-xl",
          24: "text-2xl",
          30: "text-3xl",
          36: "text-4xl",
          48: "text-5xl",
          60: "text-6xl",
          72: "text-7xl"
        };
        cls.push((_a = SIZE[Math.round(fontSize)]) != null ? _a : `text-[${Math.round(fontSize)}px]`);
        if (typeof node.fontWeight === "number") {
          const WEIGHT = {
            100: "font-thin",
            200: "font-extralight",
            300: "font-light",
            400: "font-normal",
            500: "font-medium",
            600: "font-semibold",
            700: "font-bold",
            800: "font-extrabold",
            900: "font-black"
          };
          const w = WEIGHT[node.fontWeight];
          if (w && w !== "font-normal")
            cls.push(w);
        }
        const lineHeight = node.lineHeight;
        if (lineHeight && typeof lineHeight === "object" && "unit" in lineHeight) {
          let ratio = null;
          if (lineHeight.unit === "PIXELS" && typeof lineHeight.value === "number") {
            ratio = lineHeight.value / fontSize;
          } else if (lineHeight.unit === "PERCENT" && typeof lineHeight.value === "number") {
            ratio = lineHeight.value / 100;
          }
          if (ratio !== null) {
            const LEADING = [
              [1, "leading-none"],
              [1.25, "leading-tight"],
              [1.375, "leading-snug"],
              [1.5, "leading-normal"],
              [1.625, "leading-relaxed"],
              [2, "leading-loose"]
            ];
            const match = LEADING.find(([v]) => Math.abs(ratio - v) < 0.05);
            cls.push(match ? match[1] : `leading-[${+ratio.toFixed(3)}]`);
          }
        }
        const letterSpacing = node.letterSpacing;
        if (letterSpacing && typeof letterSpacing === "object" && "unit" in letterSpacing && typeof letterSpacing.value === "number" && letterSpacing.value !== 0) {
          let em;
          if (letterSpacing.unit === "PIXELS") {
            em = letterSpacing.value / fontSize;
          } else {
            em = letterSpacing.value / 100;
          }
          const TRACKING = [
            [-0.05, "tracking-tighter"],
            [-0.025, "tracking-tight"],
            [0.025, "tracking-wide"],
            [0.05, "tracking-wider"],
            [0.1, "tracking-widest"]
          ];
          const match = TRACKING.find(([v]) => Math.abs(em - v) < 0.01);
          cls.push(match ? match[1] : `tracking-[${+em.toFixed(4)}em]`);
        }
        const ALIGN = {
          LEFT: "",
          CENTER: "text-center",
          RIGHT: "text-right",
          JUSTIFIED: "text-justify"
        };
        const align = ALIGN[node.textAlignHorizontal];
        if (align)
          cls.push(align);
        return cls.join(" ");
      }
      const bg = yield resolveColorClass(node, "fills", "bg", variables, collections);
      if (bg)
        cls.push(bg);
      const strokes = node.strokes;
      if (Array.isArray(strokes) && strokes.length > 0) {
        cls.push("border");
        const borderColor = yield resolveColorClass(node, "strokes", "border", variables, collections);
        if (borderColor)
          cls.push(borderColor);
        const sw = node.strokeWeight;
        if (typeof sw === "number" && sw !== 1)
          cls.push(`border-[${sw}px]`);
      }
      if ("cornerRadius" in node) {
        const radius = node.cornerRadius;
        if (typeof radius === "number" && radius > 0) {
          const boundRadius = (_b = node.boundVariables) == null ? void 0 : _b.cornerRadius;
          if ((boundRadius == null ? void 0 : boundRadius.type) === "VARIABLE_ALIAS") {
            const v = variables[boundRadius.id];
            const col = v && collections[v.variableCollectionId];
            if (v && col) {
              const varName = v.name.split("/").pop().toLowerCase().trim();
              cls.push(varName === "radius" ? "rounded" : varName);
            }
          } else {
            cls.push(radiusClass(radius));
          }
        }
      }
      if ("effects" in node) {
        const effects = node.effects;
        const dropShadows = effects.filter(
          (e) => e.type === "DROP_SHADOW" && e.visible !== false
        );
        const innerShadows = effects.filter(
          (e) => e.type === "INNER_SHADOW" && e.visible !== false
        );
        if (innerShadows.length > 0) {
          cls.push("shadow-inner");
        } else if (dropShadows.length > 0) {
          const effectStyleId = node.effectStyleId;
          if (effectStyleId) {
            const style = yield figma.getStyleByIdAsync(effectStyleId);
            if (style) {
              const name = style.name.split("/").pop().toLowerCase().trim().replace(/\s+/g, "-");
              cls.push(name === "drop-shadow" || name === "default" ? "shadow" : `shadow-${name}`);
            } else {
              cls.push(shadowFromBlur(dropShadows[0].radius));
            }
          } else {
            cls.push(shadowFromBlur(dropShadows[0].radius));
          }
        }
      }
      if ("layoutMode" in node) {
        const frame = node;
        if (frame.layoutMode !== "NONE") {
          cls.push("flex");
          if (frame.layoutMode === "VERTICAL")
            cls.push("flex-col");
          const JUSTIFY = {
            MIN: "",
            CENTER: "justify-center",
            MAX: "justify-end",
            SPACE_BETWEEN: "justify-between"
          };
          const justify = JUSTIFY[frame.primaryAxisAlignItems];
          if (justify)
            cls.push(justify);
          const ALIGN = {
            MIN: "",
            CENTER: "items-center",
            MAX: "items-end",
            BASELINE: "items-baseline"
          };
          const align = ALIGN[frame.counterAxisAlignItems];
          if (align)
            cls.push(align);
          if (frame.itemSpacing > 0)
            cls.push(`gap-${spacingToken(frame.itemSpacing)}`);
          const { paddingTop: pt, paddingRight: pr, paddingBottom: pb, paddingLeft: pl } = frame;
          if (pt === pb && pl === pr && pt === pl) {
            if (pt > 0)
              cls.push(`p-${spacingToken(pt)}`);
          } else {
            if (pt === pb && pt > 0)
              cls.push(`py-${spacingToken(pt)}`);
            else {
              if (pt > 0)
                cls.push(`pt-${spacingToken(pt)}`);
              if (pb > 0)
                cls.push(`pb-${spacingToken(pb)}`);
            }
            if (pl === pr && pl > 0)
              cls.push(`px-${spacingToken(pl)}`);
            else {
              if (pl > 0)
                cls.push(`pl-${spacingToken(pl)}`);
              if (pr > 0)
                cls.push(`pr-${spacingToken(pr)}`);
            }
          }
        }
        if (frame.layoutSizingHorizontal === "FILL")
          cls.push("w-full");
        else if (frame.layoutSizingHorizontal === "HUG")
          cls.push("w-fit");
        else if (frame.layoutMode === "NONE" && frame.width > 0)
          cls.push(`w-[${Math.round(frame.width)}px]`);
        if (frame.layoutSizingVertical === "FILL")
          cls.push("h-full");
        else if (frame.layoutSizingVertical === "HUG")
          cls.push("h-fit");
        else if (frame.layoutMode === "NONE" && frame.height > 0)
          cls.push(`h-[${Math.round(frame.height)}px]`);
      }
      return cls.join(" ");
    });
  }
  var SPACING, RADIUS;
  var init_tailwind = __esm({
    "src/tailwind.ts"() {
      "use strict";
      init_transform();
      SPACING = {
        0: "0",
        1: "px",
        2: "0.5",
        4: "1",
        6: "1.5",
        8: "2",
        10: "2.5",
        12: "3",
        14: "3.5",
        16: "4",
        20: "5",
        24: "6",
        28: "7",
        32: "8",
        36: "9",
        40: "10",
        44: "11",
        48: "12",
        56: "14",
        64: "16",
        80: "20",
        96: "24",
        112: "28",
        128: "32",
        160: "40",
        192: "48"
      };
      RADIUS = {
        0: "none",
        2: "sm",
        4: "",
        6: "md",
        8: "lg",
        12: "xl",
        16: "2xl",
        24: "3xl",
        9999: "full"
      };
    }
  });

  // src/jsx.ts
  function resolveComponentName(node) {
    return __async(this, null, function* () {
      var _a;
      const main = yield node.getMainComponentAsync();
      const parent = main == null ? void 0 : main.parent;
      if ((parent == null ? void 0 : parent.type) === "COMPONENT_SET")
        return parent.name;
      return (_a = main == null ? void 0 : main.name) != null ? _a : node.name;
    });
  }
  function generateJsx(node, componentMap) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d, _e, _f;
      const componentName = yield resolveComponentName(node);
      const mapKey = Object.keys(componentMap).find(
        (k) => k.toLowerCase() === componentName.toLowerCase()
      );
      if (!mapKey)
        return null;
      const mapping = componentMap[mapKey];
      const props = [];
      for (const [figmaProp, propDef] of Object.entries((_a = mapping.props) != null ? _a : {})) {
        const cprop = findProp(node, figmaProp);
        if (!cprop || cprop.type === "BOOLEAN" || cprop.type === "INSTANCE_SWAP")
          continue;
        const figmaValue = String(cprop.value).trim();
        let reactProp;
        let reactValue;
        if (typeof propDef === "string") {
          reactProp = propDef;
          reactValue = figmaValue.toLowerCase();
        } else {
          const pm = propDef;
          reactProp = pm.prop;
          reactValue = (_c = (_b = pm.values) == null ? void 0 : _b[figmaValue]) != null ? _c : figmaValue.toLowerCase();
        }
        const defaultVal = (_d = mapping.defaults) == null ? void 0 : _d[reactProp];
        if (defaultVal && reactValue === defaultVal)
          continue;
        props.push(`${reactProp}="${reactValue}"`);
      }
      for (const [figmaProp, valueMap] of Object.entries((_e = mapping.booleans) != null ? _e : {})) {
        const cprop = findProp(node, figmaProp);
        if (!cprop)
          continue;
        const figmaValue = String(cprop.value);
        const boolProp = valueMap[figmaValue];
        if (boolProp)
          props.push(boolProp);
      }
      let children = null;
      if (mapping.children) {
        const cprop = findProp(node, mapping.children);
        if ((cprop == null ? void 0 : cprop.type) === "TEXT")
          children = String(cprop.value);
      }
      const tag = (_f = mapping.component) != null ? _f : mapKey;
      const propsStr = props.length > 0 ? " " + props.join(" ") : "";
      const jsx = children !== null ? `<${tag}${propsStr}>
  ${children}
</${tag}>` : `<${tag}${propsStr} />`;
      const importLine = `import { ${tag} } from "${mapping.import}"`;
      return { componentName: tag, importLine, jsx };
    });
  }
  function findProp(node, figmaPropName) {
    const key = Object.keys(node.componentProperties).find(
      // Figma appends "#NNN" to prop keys in some cases — strip it for matching
      (k) => k.replace(/#[\d:]+$/, "").toLowerCase() === figmaPropName.toLowerCase()
    );
    return key ? node.componentProperties[key] : void 0;
  }
  var init_jsx = __esm({
    "src/jsx.ts"() {
      "use strict";
    }
  });

  // src/lib/component-map.ts
  function lookupComponent(figmaName) {
    var _a;
    if (COMPONENT_MAP[figmaName])
      return COMPONENT_MAP[figmaName];
    const base = figmaName.split(/[/,]/)[0].trim();
    return (_a = COMPONENT_MAP[base]) != null ? _a : null;
  }
  var VARIANT_MAP, SIZE_MAP, CHECKED_MAP, COMPONENT_MAP;
  var init_component_map = __esm({
    "src/lib/component-map.ts"() {
      "use strict";
      VARIANT_MAP = {
        Primary: "default",
        Secondary: "secondary",
        Outline: "outline",
        Ghost: "ghost",
        Destructive: "destructive"
      };
      SIZE_MAP = {
        Default: "default",
        Regular: "default",
        Large: "lg",
        Small: "sm",
        Mini: "xs",
        "Extra Large": "2xl"
      };
      CHECKED_MAP = {
        True: "true",
        False: "false",
        Indeterminate: "indeterminate"
      };
      COMPONENT_MAP = {
        // ── Button ────────────────────────────────────────────────────────────────
        "Button": {
          component: "Button",
          importPath: "@/components/ui/button",
          props: {
            "Variant": { shadcnProp: "variant", values: VARIANT_MAP },
            "Size": { shadcnProp: "size", values: SIZE_MAP }
          },
          children: "Label",
          ignore: ["State", "Roundness", "Show right icon", "Show left icon", "\u2B91 Right icon", "\u2B91 Left icon"]
        },
        // ── Button Group ──────────────────────────────────────────────────────────
        "Button Group": {
          component: "Button",
          importPath: "@/components/ui/button",
          props: {
            "Skin": { shadcnProp: "variant", values: { Outlined: "outline", Ghost: "ghost" } },
            "Size": { shadcnProp: "size", values: SIZE_MAP }
          },
          children: "Label",
          ignore: ["State", "Position"]
        },
        "Button Group Icon Button": {
          component: "Button",
          importPath: "@/components/ui/button",
          props: {
            "Skin": { shadcnProp: "variant", values: { Outlined: "outline", Ghost: "ghost" } },
            "Size": { shadcnProp: "size", values: { Default: "icon", Small: "icon-sm", Large: "icon-lg" } }
          },
          ignore: ["State", "Position", "Icon"]
        },
        // ── Loading Button ────────────────────────────────────────────────────────
        "Loading Button": {
          component: "__loading_button__",
          importPath: "@/components/ui/button",
          props: {
            "Size": { shadcnProp: "size", values: { Default: null, Large: "lg", Small: "sm", Mini: "xs" } }
          },
          ignore: ["Roundness", "State"],
          children: "Label"
        },
        // ── Badge ─────────────────────────────────────────────────────────────────
        "Badge": {
          component: "Badge",
          importPath: "@/components/ui/badge",
          props: {
            "Variant": { shadcnProp: "variant", values: VARIANT_MAP }
          },
          children: "Label",
          ignore: ["State", "Roundness", "Show left icon", "Show right icon", "\u2B91 Icon left", "\u2B91 Icon right"]
        },
        // ── Alert ─────────────────────────────────────────────────────────────────
        "Alert": {
          component: "Alert",
          importPath: "@/components/ui/alert",
          props: {
            "Type": {
              shadcnProp: "variant",
              values: { Neutral: "default", Error: "destructive" }
            }
          },
          slots: [
            { key: "Line 1", component: "AlertTitle", importPath: "@/components/ui/alert" },
            { key: "\u21B3 Line 2", component: "AlertDescription", importPath: "@/components/ui/alert", scanChildren: true }
          ],
          ignore: ["Show Line 2", "Show Icon", "Show Button", "Flip Icon", "\u2B91 Icon", "\u2B91  Line 2"]
        },
        // ── Alert Dialog ──────────────────────────────────────────────────────────
        "Alert Dialog": {
          component: "AlertDialog",
          importPath: "@/components/ui/alert-dialog",
          ignore: ["Type"]
        },
        // ── Avatar ────────────────────────────────────────────────────────────────
        "Avatar": {
          component: "Avatar",
          importPath: "@/components/ui/avatar",
          ignore: ["Picture", "Size", "Roundness Type"]
        },
        "Avatar Stack": {
          component: "AvatarGroup",
          importPath: "@/components/ui/avatar",
          ignore: ["Size", "Type"]
        },
        // ── Textarea ──────────────────────────────────────────────────────────────
        "Textarea": {
          component: "Textarea",
          importPath: "@/components/ui/textarea",
          props: {
            "State": {
              shadcnProp: "disabled",
              values: { Disabled: "true", Empty: null, Placeholder: null, Value: null, Focus: null, Error: null, "Error Focus": null }
            }
          },
          ignore: ["Show resizable", "Roundness"]
        },
        // ── Select ────────────────────────────────────────────────────────────────
        "Select & Combobox": {
          component: "Select",
          importPath: "@/components/ui/select",
          ignore: ["Size", "State", "Lines", "Show Decoration", "Show Prepend"]
        },
        // ── Checkbox ──────────────────────────────────────────────────────────────
        "Checkbox": {
          component: "Checkbox",
          importPath: "@/components/ui/checkbox",
          props: {
            "Checked?": { shadcnProp: "checked", values: CHECKED_MAP },
            "State": {
              shadcnProp: "disabled",
              values: { Disabled: "true", Focus: null, Error: null, "Error Focus": null }
            }
          }
        },
        "Checkbox Group": {
          component: "__checkbox_group__",
          importPath: "@/components/ui/checkbox",
          props: {
            "Layout": {
              shadcnProp: "layout",
              values: { Inline: "inline", Stacked: "stacked" }
            }
          },
          ignore: ["Checked?"]
        },
        "Rich Checkbox Group": {
          component: "RichCheckboxGroup",
          importPath: "@/components/ui/rich-checkbox-group",
          props: {
            "Checked": { shadcnProp: "checked", values: { True: "true", False: null } },
            "Flipped": { shadcnProp: "flipped", values: { True: "true", False: null } }
          },
          children: "Line 1"
        },
        // ── Switch ────────────────────────────────────────────────────────────────
        "Switch": {
          component: "Switch",
          importPath: "@/components/ui/switch",
          props: {
            "Checked?": { shadcnProp: "checked", values: { True: "true", False: "false" } }
          },
          ignore: ["State"]
        },
        // ── Radio ─────────────────────────────────────────────────────────────────
        "Radio": {
          component: "RadioGroupItem",
          importPath: "@/components/ui/radio-group",
          props: {
            "Checked?": { shadcnProp: "checked", values: { True: "true", False: "false" } }
          },
          ignore: ["State"]
        },
        // ── Slider ────────────────────────────────────────────────────────────────
        "Slider Horizontal": {
          component: "Slider",
          importPath: "@/components/ui/slider",
          ignore: ["Type"]
        },
        "Slider Vertical": {
          component: "Slider",
          importPath: "@/components/ui/slider",
          props: {
            "Type": { shadcnProp: "orientation", values: { Default: "vertical", "Range narrow": "vertical", "Range wide": "vertical" } }
          }
        },
        // ── Progress ──────────────────────────────────────────────────────────────
        "Progress": {
          component: "Progress",
          importPath: "@/components/ui/progress",
          props: {
            "Progress": { shadcnProp: "value" }
          }
        },
        // ── Tabs ──────────────────────────────────────────────────────────────────
        "Tabs": {
          component: "Tabs",
          importPath: "@/components/ui/tabs",
          ignore: ["Size", "Content", "Parts"]
        },
        // ── Tooltip ───────────────────────────────────────────────────────────────
        "Tooltip": {
          component: "Tooltip",
          importPath: "@/components/ui/tooltip",
          props: {
            "Side": {
              shadcnProp: "side",
              values: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" }
            }
          },
          children: "Tooltip text"
        },
        // ── Separator ─────────────────────────────────────────────────────────────
        "Separator": {
          component: "Separator",
          importPath: "@/components/ui/separator",
          props: {
            "Direction": {
              shadcnProp: "orientation",
              values: { Default: "horizontal", Vertical: "vertical" }
            }
          },
          ignore: ["Spacing"]
        },
        // ── Command ───────────────────────────────────────────────────────────────
        "Command": {
          component: "__command__",
          importPath: "@/components/ui/command"
        },
        // ── Date Picker ───────────────────────────────────────────────────────────
        "Date Picker": {
          component: "__date_picker__",
          importPath: "@/components/ui/date-picker",
          ignore: ["State"]
        },
        "Calendar": {
          component: "__calendar__",
          importPath: "@/components/ui/calendar",
          props: {
            "Months": {
              shadcnProp: "months",
              values: { "1 month": "1", "2 month": "2", "3 month": "3" }
            }
          }
        },
        // ── Navigation Menu ───────────────────────────────────────────────────────
        "Navigation Menu": {
          component: "__navigation_menu__",
          importPath: "@/components/ui/navigation-menu",
          props: {},
          ignore: ["State"]
        },
        ".Navigation Menu Content": {
          component: "__navigation_menu_content__",
          importPath: "@/components/ui/navigation-menu",
          props: {}
        },
        "Menu Item": {
          component: "__menu_item__",
          importPath: "@/components/ui/navigation-menu",
          props: {
            "Size": { shadcnProp: "size", values: { Regular: null, Large: "lg" } },
            "Type": { shadcnProp: "type", values: { Default: null, Destructive: "destructive" } }
          },
          ignore: ["State"]
        },
        // ── Link Button ───────────────────────────────────────────────────────────
        "Link Button": {
          component: "LinkButton",
          importPath: "@/components/ui/button",
          props: {
            "Size": { shadcnProp: "size", values: { Default: null, Large: "lg", Small: "sm", Mini: "xs" } }
          },
          ignore: ["Roundness", "State"],
          children: "Label"
        },
        // ── Input OTP ─────────────────────────────────────────────────────────────
        "Input OTP": {
          component: "__input_otp__",
          importPath: "@/components/ui/input-otp",
          props: {
            "Position": { shadcnProp: "position", values: { Left: "left", Middle: "middle", Right: "right" } },
            "Size": { shadcnProp: "size", values: { Default: null, Large: "large", Small: "small", Mini: "mini" } },
            "State": { shadcnProp: "state", values: { Empty: null, Placeholder: null, Value: null, Focus: null, Error: "error", "Error Focus": "error", Disabled: "disabled" } }
          }
        },
        // ── Input ─────────────────────────────────────────────────────────────────
        "Input": {
          component: "__input__",
          importPath: "@/components/ui/input",
          props: {
            "Roundness": { shadcnProp: "roundness", values: { Default: null, Round: "full" } },
            "Size": { shadcnProp: "size", values: { Regular: null, Large: "large", Small: "small", Mini: "mini" } },
            "State": { shadcnProp: "state", values: { Empty: null, Placeholder: "placeholder", Value: "value", Focus: null, Error: "error", "Error Focus": "error", Disabled: "disabled" } }
          }
          // No children key — scan all children to detect Input Decoration instances and text nodes
        },
        "Input File": {
          component: "__input_file__",
          importPath: "@/components/ui/input",
          props: {
            "Roundness": { shadcnProp: "roundness", values: { Default: null, Round: "full" } },
            "Size": { shadcnProp: "size", values: { Default: null, Large: "large", Small: "small", Mini: "mini" } },
            "State": { shadcnProp: "state", values: { Focus: null, Error: "error", "Error Focus": "error" } },
            "File Chosen": { shadcnProp: "fileChosen", values: { True: "true", False: null } }
          }
        },
        ".Input Decoration": {
          component: "__input_decoration__",
          importPath: "@/components/ui/input-group",
          props: {
            "Type": { shadcnProp: "type", values: { "Icon": "icon", "Icon muted": "icon-muted" } },
            "Size": { shadcnProp: "size", values: { Default: null, Large: "large" } }
          }
        },
        // ── Item ──────────────────────────────────────────────────────────────────
        "Item": {
          component: "__item__",
          importPath: "@/components/ui/item",
          props: {
            "Variant": { shadcnProp: "variant", values: { Default: null, Outline: "outline", Muted: "muted" } },
            "Size": { shadcnProp: "size", values: { Default: null, Small: "sm", Mini: "xs" } },
            // Media type — Figma booleans come as "True"/"False" (capitalized)
            "ItemMedia: icon": { shadcnProp: "mediaType", values: { True: "icon", False: null } },
            "ItemMedia: iconBadge": { shadcnProp: "mediaType", values: { True: "iconBadge", False: null } },
            "ItemMedia: avatar": { shadcnProp: "mediaType", values: { True: "avatar", False: null } },
            "ItemMedia: avatarStack": { shadcnProp: "mediaType", values: { True: "avatarStack", False: null } },
            "ItemMedia: image": { shadcnProp: "mediaType", values: { True: "image", False: null } },
            // Action type — Figma booleans come as "True"/"False"
            "ItemAction: icon": { shadcnProp: "actionType", values: { True: "icon", False: null } },
            "ItemAction: button": { shadcnProp: "actionType", values: { True: "button", False: null } },
            "ItemAction: iconButton": { shadcnProp: "actionType", values: { True: "iconButton", False: null } },
            "ItemAction: label": { shadcnProp: "actionType", values: { True: "label", False: null } },
            // Text content — no values map → raw value preserved as-is
            "Title": { shadcnProp: "title" },
            "Description": { shadcnProp: "description" },
            "Label": { shadcnProp: "label" }
          },
          ignore: ["asChild", "State"]
        },
        // ── Empty ─────────────────────────────────────────────────────────────────
        "Empty": {
          component: "__empty__",
          importPath: "@/components/ui/empty",
          props: {
            "Variant": {
              shadcnProp: "variant",
              values: {
                Default: "default",
                Outline: "outline",
                Background: "background",
                "Outline dashed": "outline-dashed"
              }
            }
          },
          children: "\u2B91 title"
        },
        // ── Field ─────────────────────────────────────────────────────────────────
        "Vertical Field": {
          component: "__field_vertical__",
          importPath: "@/components/ui/field",
          props: {
            "Type": {
              shadcnProp: "type",
              values: {
                Select: "select",
                "Text Value": "text",
                Radio: "radio",
                Textarea: "textarea",
                Checkbox: "checkbox",
                Slider: "slider"
              }
            }
          }
        },
        "Horizontal Field": {
          component: "__field_horizontal__",
          importPath: "@/components/ui/field",
          props: {
            "Type": {
              shadcnProp: "type",
              values: {
                Select: "select",
                "Text Value": "text",
                Radio: "radio",
                Textarea: "textarea",
                Checkbox: "checkbox",
                Slider: "slider"
              }
            }
          }
        },
        // ── Label ─────────────────────────────────────────────────────────────────
        "Label": {
          component: "Label",
          importPath: "@/components/ui/label",
          ignore: ["Layout"]
        },
        // ── Skeleton ──────────────────────────────────────────────────────────────
        "Skeleton": {
          component: "Skeleton",
          importPath: "@/components/ui/skeleton"
        },
        // ── Spinner ───────────────────────────────────────────────────────────────
        "Spinner": {
          component: "Loader2",
          importPath: "lucide-react",
          ignore: ["Type"]
        },
        // ── Card ──────────────────────────────────────────────────────────────────
        "Card": {
          component: "Card",
          importPath: "@/components/ui/card",
          ignore: ["Main Slot", "Header Slot", "Footer Slot", "Slot No.", "State"]
        },
        // ── Breadcrumb ────────────────────────────────────────────────────────────
        "Breadcrumb": {
          component: "Breadcrumb",
          importPath: "@/components/ui/breadcrumb",
          ignore: ["Items"]
        },
        ".Breadcrumb item": {
          component: "BreadcrumbItem",
          importPath: "@/components/ui/breadcrumb",
          children: "\u2B91 Label",
          ignore: ["Content", "State"]
        },
        ".Breadcrumb separator": {
          component: "BreadcrumbSeparator",
          importPath: "@/components/ui/breadcrumb",
          ignore: ["Content"]
        },
        // ── Pagination ────────────────────────────────────────────────────────────
        "Pagination": {
          component: "Pagination",
          importPath: "@/components/ui/pagination",
          ignore: ["Type", "State"]
        },
        // ── Icon Button ───────────────────────────────────────────────────────────
        "Icon Button": {
          component: "__icon_button__",
          importPath: "@/components/ui/button",
          props: {
            "Variant": {
              shadcnProp: "variant",
              values: { Primary: "default", Secondary: "secondary", Outline: "outline", Ghost: "ghost", Destructive: "destructive" }
            },
            "Size": {
              shadcnProp: "size",
              values: { Default: "default", Large: "large", Small: "small", Mini: "mini" }
            },
            "Roundness": {
              shadcnProp: "roundness",
              values: { Default: null, Round: "full" }
            }
          },
          ignore: ["State"]
        },
        // ── Hover Card ────────────────────────────────────────────────────────────
        "Hover Card": {
          component: "__hover_card__",
          importPath: "@/components/ui/hover-card"
        },
        // ── Drawer ────────────────────────────────────────────────────────────────
        "Drawer": {
          component: "__drawer__",
          importPath: "@/components/ui/drawer"
        },
        // ── Dialog ────────────────────────────────────────────────────────────────
        "Dialog": {
          component: "__dialog__",
          importPath: "@/components/ui/dialog",
          ignore: ["Type"]
        },
        "Dialog Header": {
          component: "__dialog_header__",
          importPath: "@/components/ui/dialog",
          props: {
            "Type": {
              shadcnProp: "type",
              values: { "Header": "header", "Close Only": "close-only", "Icon Button Close": "icon-close" }
            }
          }
        },
        "Dialog Footer": {
          component: "__dialog_footer__",
          importPath: "@/components/ui/dialog",
          props: {
            "Type": {
              shadcnProp: "type",
              values: {
                "2 Buttons Right": "2-buttons-right",
                "2 Full-width Buttons": "2-full-width",
                "Single Full-width Button": "1-full-width"
              }
            }
          }
        },
        // ── Toggle Button ─────────────────────────────────────────────────────────
        "Toggle Button": {
          component: "Toggle",
          importPath: "@/components/ui/toggle",
          props: {
            "Skin": {
              shadcnProp: "variant",
              values: { Outlined: "outline", Ghost: "ghost" }
            },
            "Size": { shadcnProp: "size", values: SIZE_MAP },
            "Active?": {
              shadcnProp: "pressed",
              values: { Yes: "true", No: "false" }
            }
          },
          children: "Label",
          ignore: ["State", "Roundness", "Position", "Show left icon", "Show right icon", "\u2B91 Left icon", "\u2B91 Right icon"]
        },
        // ── Accordion ─────────────────────────────────────────────────────────────
        // "Bordered" variants are Figma-only visual styles — same shadcn output.
        // State (Closed/Open/Focus) and Position (First/Middle/Last) are design-only.
        "Accordion Trigger": {
          component: "AccordionTrigger",
          importPath: "@/components/ui/accordion",
          children: "Accordion label",
          ignore: ["State"]
        },
        "Accordion Content": {
          component: "AccordionContent",
          importPath: "@/components/ui/accordion"
        },
        "Accordion Trigger (Bordered)": {
          component: "AccordionTrigger",
          importPath: "@/components/ui/accordion",
          children: "Accordion label",
          ignore: ["State", "Position"]
        },
        "Accordion Content (Bordered)": {
          component: "AccordionContent",
          importPath: "@/components/ui/accordion"
        },
        // ── Charts ────────────────────────────────────────────────────────────────
        "Line chart": {
          component: "__chart_line__",
          importPath: "@/components/ui/chart",
          props: {
            "Type": {
              shadcnProp: "type",
              values: {
                Default: "default",
                Linear: "linear",
                Step: "step",
                Stacked: "stacked",
                Interactive: "interactive"
              }
            }
          }
        },
        "Area chart": {
          component: "__chart_area__",
          importPath: "@/components/ui/chart",
          props: {
            "Type": {
              shadcnProp: "type",
              values: {
                Default: "default",
                Linear: "linear",
                Step: "step",
                Stacked: "stacked",
                Interactive: "interactive"
              }
            }
          }
        },
        "Bar chart": {
          component: "__chart_bar__",
          importPath: "@/components/ui/chart",
          props: {
            "Type": {
              shadcnProp: "type",
              values: {
                Default: "default",
                Horizontal: "horizontal",
                Multiple: "multiple",
                Stacked: "stacked",
                Interactive: "interactive"
              }
            }
          }
        },
        // ── Table ─────────────────────────────────────────────────────────────────
        "Basic Table Header": {
          component: "TableHead",
          importPath: "@/components/ui/table",
          ignore: ["Cell Type", "State", "Alignment"]
        },
        "Basic Table Cell": {
          component: "TableCell",
          importPath: "@/components/ui/table",
          ignore: ["Parity", "State", "Alignment"]
        },
        "Table Header": {
          component: "__data_table_header__",
          importPath: "@/components/ui/table",
          ignore: ["Content", "Alignment", "State"]
        },
        "Table Cell": {
          component: "__data_table_cell__",
          importPath: "@/components/ui/table",
          ignore: ["Content", "Alignment", "State", "Parity"]
        },
        // ── Toggle Icon Button ────────────────────────────────────────────────────
        "Toggle Icon Button": {
          component: "Toggle",
          importPath: "@/components/ui/toggle",
          props: {
            "Skin": {
              shadcnProp: "variant",
              values: { Outlined: "outline", Ghost: "ghost" }
            },
            "Size": { shadcnProp: "size", values: SIZE_MAP },
            "Active?": {
              shadcnProp: "pressed",
              values: { Yes: "true", No: "false" }
            }
          },
          ignore: ["State", "Roundness", "Position", "Icon"]
        }
      };
    }
  });

  // src/lib/frame-scanner.ts
  function rgbToHex(r, g, b) {
    const h = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`;
  }
  function resolveColorToken(node, property) {
    return __async(this, null, function* () {
      const boundVars = node.boundVariables;
      const bound = boundVars == null ? void 0 : boundVars[property];
      if (bound) {
        const entry = Array.isArray(bound) ? bound[0] : bound;
        if ((entry == null ? void 0 : entry.type) === "VARIABLE_ALIAS") {
          const fetched = yield figma.variables.getVariableByIdAsync(entry.id);
          if (fetched) {
            const col = yield figma.variables.getVariableCollectionByIdAsync(fetched.variableCollectionId);
            if (col) {
              return toCssVarName(col.name, fetched.name).replace(/^--/, "");
            }
          }
        }
      }
      const paints = node[property];
      if (!Array.isArray(paints))
        return null;
      const s = paints.find((f) => f.type === "SOLID" && f.visible !== false);
      return s ? rgbToHex(s.color.r, s.color.g, s.color.b) : null;
    });
  }
  function extractVisual(node) {
    return __async(this, null, function* () {
      var _a, _b;
      return {
        bgColor: yield resolveColorToken(node, "fills"),
        radius: typeof node.cornerRadius === "number" ? node.cornerRadius : 0,
        shadow: ((_a = node.effects) != null ? _a : []).some((e) => e.type === "DROP_SHADOW" && e.visible !== false),
        opacity: (_b = node.opacity) != null ? _b : 1,
        borderColor: yield resolveColorToken(node, "strokes")
      };
    });
  }
  function toLucideName(raw) {
    var _a, _b;
    const segment = (_b = (_a = raw.split("/").pop()) == null ? void 0 : _a.trim()) != null ? _b : raw;
    const cleaned = segment.replace(/^icons?[-_\s]*/i, "").trim() || "Icon";
    return cleaned.split(/[-_\s]+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("");
  }
  function looksLikeIconName(name) {
    if (name.includes("/"))
      return true;
    return /^[a-z][a-z0-9\-_\s]*$/.test(name);
  }
  function extractLayout(node) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    if (node.layoutMode === "GRID") {
      const g = node;
      return {
        direction: "grid",
        gap: (_a = g.gridColumnGap) != null ? _a : 0,
        rowGap: (_b = g.gridRowGap) != null ? _b : 0,
        columns: (_c = g.gridColumnCount) != null ? _c : 1,
        paddingTop: (_d = node.paddingTop) != null ? _d : 0,
        paddingRight: (_e = node.paddingRight) != null ? _e : 0,
        paddingBottom: (_f = node.paddingBottom) != null ? _f : 0,
        paddingLeft: (_g = node.paddingLeft) != null ? _g : 0,
        wrap: false
      };
    }
    const isAuto = node.layoutMode !== "NONE";
    const isWrap = isAuto && node.layoutWrap === "WRAP";
    return {
      direction: node.layoutMode === "HORIZONTAL" ? "horizontal" : node.layoutMode === "VERTICAL" ? "vertical" : "none",
      gap: isAuto ? (_h = node.itemSpacing) != null ? _h : 0 : 0,
      rowGap: isWrap ? (_i = node.counterAxisSpacing) != null ? _i : 0 : 0,
      columns: 0,
      paddingTop: isAuto ? (_j = node.paddingTop) != null ? _j : 0 : 0,
      paddingRight: isAuto ? (_k = node.paddingRight) != null ? _k : 0 : 0,
      paddingBottom: isAuto ? (_l = node.paddingBottom) != null ? _l : 0 : 0,
      paddingLeft: isAuto ? (_m = node.paddingLeft) != null ? _m : 0 : 0,
      wrap: isWrap
    };
  }
  function resolveProps(instance, def) {
    var _a, _b;
    if (!def || !def.props)
      return [];
    const result = [];
    let rawProps;
    try {
      rawProps = (_a = instance.componentProperties) != null ? _a : {};
    } catch (e) {
      return [];
    }
    for (const [obraKey, propDef] of Object.entries(def.props)) {
      const figmaKey = Object.keys(rawProps).find((k) => k.split("#")[0] === obraKey);
      if (!figmaKey)
        continue;
      const rawValue = String(rawProps[figmaKey].value);
      if (propDef.values && propDef.values[rawValue] === null)
        continue;
      const mappedValue = propDef.values ? (_b = propDef.values[rawValue]) != null ? _b : rawValue.toLowerCase() : rawValue;
      result.push({ shadcnProp: propDef.shadcnProp, value: mappedValue });
    }
    return result;
  }
  function resolveChildren(instance, childrenKey) {
    var _a;
    if (!childrenKey)
      return null;
    let rawProps;
    try {
      rawProps = (_a = instance.componentProperties) != null ? _a : {};
    } catch (e) {
      return null;
    }
    const figmaKey = Object.keys(rawProps).find((k) => k.split("#")[0] === childrenKey);
    if (!figmaKey)
      return null;
    const val = rawProps[figmaKey].value;
    return typeof val === "string" ? val : null;
  }
  function findFirstUnusedText(node, used) {
    for (const child of node.children) {
      if (child.type === "TEXT") {
        const text = child.characters.trim();
        if (text && !used.has(text))
          return text;
      }
      if ("children" in child) {
        const found = findFirstUnusedText(child, used);
        if (found)
          return found;
      }
    }
    return null;
  }
  function scanNode(node) {
    return __async(this, null, function* () {
      var _a, _b;
      if (!node.visible)
        return null;
      if (node.type === "INSTANCE") {
        let mainComp = null;
        try {
          mainComp = yield node.getMainComponentAsync();
        } catch (e) {
          return scanFrameNode(node);
        }
        if (!mainComp)
          return scanFrameNode(node);
        const compName = ((_a = mainComp.parent) == null ? void 0 : _a.type) === "COMPONENT_SET" ? mainComp.parent.name : mainComp.name;
        const def = lookupComponent(compName);
        if (def) {
          if (def.slots && def.slots.length > 0) {
            const EMPTY_LAYOUT = { direction: "none", gap: 0, rowGap: 0, columns: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, wrap: false };
            const usedTexts = /* @__PURE__ */ new Set();
            const slotChildren = [];
            for (const slot of def.slots) {
              let text = slot.key ? resolveChildren(node, slot.key) : null;
              if (text)
                usedTexts.add(text);
              if (!text && slot.scanChildren) {
                text = findFirstUnusedText(node, usedTexts);
                if (text)
                  usedTexts.add(text);
              }
              if (text) {
                slotChildren.push({
                  id: `${node.id}-slot-${slot.component}`,
                  figmaName: slot.component,
                  layerName: slot.component,
                  component: slot.component,
                  importPath: slot.importPath,
                  props: [],
                  children: text,
                  layout: EMPTY_LAYOUT
                });
              }
            }
            return {
              id: node.id,
              figmaName: compName,
              layerName: node.name,
              component: def.component,
              importPath: def.importPath,
              props: resolveProps(node, def),
              children: slotChildren,
              layout: extractLayout(node)
            };
          }
          const textChildren = resolveChildren(node, def.children);
          if (textChildren !== null) {
            const iconNodes = [];
            try {
              for (const child of (_b = node.children) != null ? _b : []) {
                const s = yield scanNode(child);
                if (s && "isIcon" in s)
                  iconNodes.push(s);
              }
            } catch (e) {
            }
            const children = iconNodes.length > 0 ? [...iconNodes, { isInlineText: true, id: `${node.id}-text`, content: textChildren }] : textChildren;
            return {
              id: node.id,
              figmaName: compName,
              layerName: node.name,
              component: def.component,
              importPath: def.importPath,
              props: resolveProps(node, def),
              children,
              layout: extractLayout(node)
            };
          }
          const childNodes = yield scanChildren(node);
          return {
            id: node.id,
            figmaName: compName,
            component: def.component,
            importPath: def.importPath,
            props: resolveProps(node, def),
            children: childNodes,
            layout: extractLayout(node)
          };
        }
        const isSmall = node.width <= 48 && node.height <= 48;
        if (isSmall && looksLikeIconName(compName)) {
          return {
            isIcon: true,
            id: node.id,
            name: compName,
            lucideName: toLucideName(compName),
            width: Math.round(node.width),
            height: Math.round(node.height)
          };
        }
        return scanFrameNode(node);
      }
      if (node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT") {
        return scanFrameNode(node);
      }
      if (node.type === "TEXT") {
        const text = node;
        const content = text.characters.trim();
        if (!content)
          return null;
        const fontSize = typeof text.fontSize === "number" ? text.fontSize : 14;
        const fontWeight = typeof text.fontWeight === "number" ? text.fontWeight : 400;
        const bold = fontWeight >= 600;
        let tag = "p";
        if (fontSize >= 28)
          tag = "h1";
        else if (fontSize >= 22)
          tag = "h2";
        else if (fontSize >= 20)
          tag = "h3";
        else if (bold)
          tag = "span";
        const align = text.textAlignHorizontal === "CENTER" ? "center" : text.textAlignHorizontal === "RIGHT" ? "right" : text.textAlignHorizontal === "JUSTIFIED" ? null : null;
        const uppercase = text.textCase === "UPPER";
        const color = yield resolveColorToken(node, "fills");
        let styleName = null;
        const textStyleId = text.textStyleId;
        if (textStyleId && typeof textStyleId === "string") {
          const style = yield figma.getStyleByIdAsync(textStyleId);
          if (style) {
            styleName = style.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
          }
        }
        return { isText: true, id: node.id, content, tag, bold, align, color, uppercase, styleName };
      }
      if ("fills" in node && Array.isArray(node.fills)) {
        const hasImage = node.fills.some((f) => f.type === "IMAGE");
        if (hasImage) {
          return {
            isImage: true,
            id: node.id,
            name: node.name,
            width: Math.round(node.width),
            height: Math.round(node.height)
          };
        }
      }
      if (node.type === "RECTANGLE" || node.type === "ELLIPSE") {
        const visual = yield extractVisual(node);
        if (visual.bgColor || visual.borderColor) {
          const EMPTY_LAYOUT = { direction: "none", gap: 0, rowGap: 0, columns: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, wrap: false };
          return { isLayout: true, id: node.id, name: node.name, layout: EMPTY_LAYOUT, visual, children: [] };
        }
      }
      if (node.type === "LINE")
        return null;
      if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION" || node.type === "STAR" || node.type === "POLYGON") {
        if (!looksLikeIconName(node.name))
          return null;
        return {
          isIcon: true,
          id: node.id,
          name: node.name,
          lucideName: toLucideName(node.name),
          width: Math.round(node.width),
          height: Math.round(node.height)
        };
      }
      return null;
    });
  }
  function scanFrameNode(node) {
    return __async(this, null, function* () {
      const children = yield scanChildren(node);
      const isGroup = node.type === "GROUP";
      const layout = !isGroup ? extractLayout(node) : { direction: "none", gap: 0, rowGap: 0, columns: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, wrap: false };
      const visual = !isGroup ? yield extractVisual(node) : EMPTY_VISUAL;
      if (children.length === 0 && !visual.bgColor && !visual.borderColor)
        return null;
      return { isLayout: true, id: node.id, name: node.name, layout, visual, children };
    });
  }
  function scanChildren(node) {
    return __async(this, null, function* () {
      const results = [];
      for (const child of node.children) {
        const scanned = yield scanNode(child);
        if (scanned)
          results.push(scanned);
      }
      return results;
    });
  }
  function scanFrame(frame) {
    return __async(this, null, function* () {
      const children = yield scanChildren(frame);
      return {
        isLayout: true,
        id: frame.id,
        name: frame.name,
        layout: extractLayout(frame),
        visual: yield extractVisual(frame),
        children
      };
    });
  }
  var EMPTY_VISUAL;
  var init_frame_scanner = __esm({
    "src/lib/frame-scanner.ts"() {
      "use strict";
      init_component_map();
      init_transform();
      EMPTY_VISUAL = { bgColor: null, radius: 0, shadow: false, opacity: 1, borderColor: null };
    }
  });

  // src/lib/tailwind-layout.ts
  function gapClass(gap) {
    return GAP_MAP[gap] ? `gap-${GAP_MAP[gap]}` : gap ? `gap-[${gap}px]` : "";
  }
  function gapXClass(gap) {
    return GAP_MAP[gap] ? `gap-x-${GAP_MAP[gap]}` : gap ? `gap-x-[${gap}px]` : "";
  }
  function gapYClass(gap) {
    return GAP_MAP[gap] ? `gap-y-${GAP_MAP[gap]}` : gap ? `gap-y-[${gap}px]` : "";
  }
  function paddingClass(prefix, value) {
    const map = {
      2: "0.5",
      4: "1",
      6: "1.5",
      8: "2",
      10: "2.5",
      12: "3",
      16: "4",
      20: "5",
      24: "6",
      32: "8",
      40: "10",
      48: "12",
      64: "16"
    };
    return map[value] ? `${prefix}-${map[value]}` : `${prefix}-[${value}px]`;
  }
  function paddingClasses(layout) {
    const { paddingTop: t, paddingRight: r, paddingBottom: b, paddingLeft: l } = layout;
    if (t === 0 && r === 0 && b === 0 && l === 0)
      return "";
    if (t === b && l === r && t === l)
      return paddingClass("p", t);
    const parts = [];
    if (t === b && t > 0)
      parts.push(paddingClass("py", t));
    else {
      if (t > 0)
        parts.push(paddingClass("pt", t));
      if (b > 0)
        parts.push(paddingClass("pb", b));
    }
    if (l === r && l > 0)
      parts.push(paddingClass("px", l));
    else {
      if (l > 0)
        parts.push(paddingClass("pl", l));
      if (r > 0)
        parts.push(paddingClass("pr", r));
    }
    return parts.join(" ");
  }
  function gridColsClass(cols) {
    return cols >= 1 && cols <= 12 ? `grid-cols-${cols}` : cols > 0 ? `grid-cols-[repeat(${cols},minmax(0,1fr))]` : "";
  }
  function colorClass(prefix, value) {
    return value.startsWith("#") ? `${prefix}-[${value}]` : `${prefix}-${value}`;
  }
  function visualClasses(v) {
    var _a;
    const parts = [];
    if (v.bgColor)
      parts.push(colorClass("bg", v.bgColor));
    if (v.radius > 0)
      parts.push(v.radius >= 9999 ? "rounded-full" : (_a = RADIUS_MAP[v.radius]) != null ? _a : `rounded-[${v.radius}px]`);
    if (v.shadow)
      parts.push("shadow-md");
    if (v.borderColor)
      parts.push(`border ${colorClass("border", v.borderColor)}`);
    if (v.opacity < 1)
      parts.push(`opacity-[${Math.round(v.opacity * 100)}%]`);
    return parts.join(" ");
  }
  function textVisualClasses(align, color, uppercase, styleName) {
    const parts = [];
    if (styleName)
      parts.push(`font-style-${styleName}`);
    if (align === "center")
      parts.push("text-center");
    if (align === "right")
      parts.push("text-right");
    if (uppercase)
      parts.push("uppercase");
    if (color)
      parts.push(colorClass("text", color));
    return parts.join(" ");
  }
  function textDecorationClasses(align, color, uppercase) {
    const parts = [];
    if (align === "center")
      parts.push("text-center");
    if (align === "right")
      parts.push("text-right");
    if (uppercase)
      parts.push("uppercase");
    if (color)
      parts.push(colorClass("text", color));
    return parts.join(" ");
  }
  function layoutClasses(layout) {
    const pad = paddingClasses(layout);
    if (layout.direction === "grid") {
      const cols = gridColsClass(layout.columns);
      const gapStr2 = layout.gap === layout.rowGap ? gapClass(layout.gap) : [gapXClass(layout.gap), gapYClass(layout.rowGap)].filter(Boolean).join(" ");
      return ["grid", cols, gapStr2, pad].filter(Boolean).join(" ");
    }
    if (layout.direction === "none")
      return "";
    const dir = layout.direction === "horizontal" ? "flex-row" : "flex-col";
    const wrap = layout.wrap ? "flex-wrap" : "";
    const gapStr = layout.wrap && layout.rowGap && layout.rowGap !== layout.gap ? [gapXClass(layout.gap), gapYClass(layout.rowGap)].filter(Boolean).join(" ") : gapClass(layout.gap);
    return ["flex", dir, wrap, gapStr, pad].filter(Boolean).join(" ");
  }
  var GAP_MAP, RADIUS_MAP;
  var init_tailwind_layout = __esm({
    "src/lib/tailwind-layout.ts"() {
      "use strict";
      GAP_MAP = {
        0: "",
        2: "0.5",
        4: "1",
        6: "1.5",
        8: "2",
        10: "2.5",
        12: "3",
        16: "4",
        20: "5",
        24: "6",
        32: "8",
        40: "10",
        48: "12",
        64: "16"
      };
      RADIUS_MAP = {
        2: "rounded-sm",
        4: "rounded",
        6: "rounded-md",
        8: "rounded-lg",
        12: "rounded-xl",
        16: "rounded-2xl",
        24: "rounded-3xl"
      };
    }
  });

  // src/lib/jsx-generator.ts
  function addImport(imports, path, name) {
    if (!imports.has(path))
      imports.set(path, /* @__PURE__ */ new Set());
    imports.get(path).add(name);
  }
  function renderImports(imports) {
    const directives = imports.get(DIRECTIVE_KEY) ? Array.from(imports.get(DIRECTIVE_KEY)).join("\n") : "";
    const rawImports = imports.get(RAW_IMPORT_KEY) ? Array.from(imports.get(RAW_IMPORT_KEY)).join("\n") : "";
    const namedImports = Array.from(imports.entries()).filter(([path]) => !path.startsWith("__")).map(([path, names]) => `import { ${Array.from(names).join(", ")} } from "${path}";`).join("\n");
    return [directives, rawImports, namedImports].filter(Boolean).join("\n\n");
  }
  function isTableCellNode(node) {
    return "component" in node && TABLE_CELL_COMPONENTS.has(node.component);
  }
  function isDataTableCellNode(node) {
    return "component" in node && DATA_TABLE_CELL_COMPONENTS.has(node.component);
  }
  function isDataTableGrid(node) {
    return node.layout.direction === "grid" && node.layout.columns > 0 && node.children.some(isDataTableCellNode);
  }
  function isTableGrid(node) {
    return node.layout.direction === "grid" && node.layout.columns > 0 && node.children.some(isTableCellNode);
  }
  function renderTableGrid(node, imports, indent) {
    const pad = "  ".repeat(indent);
    const { columns } = node.layout;
    const rows = [];
    for (let i = 0; i < node.children.length; i += columns) {
      rows.push(node.children.slice(i, i + columns));
    }
    const isAllHeads = (row) => row.every((c) => "component" in c && c.component === "TableHead");
    const headerRows = [];
    while (rows.length > 0 && isAllHeads(rows[0]))
      headerRows.push(rows.shift());
    addImport(imports, "@/components/ui/table", "Table");
    addImport(imports, "@/components/ui/table", "TableBody");
    addImport(imports, "@/components/ui/table", "TableRow");
    if (headerRows.length > 0)
      addImport(imports, "@/components/ui/table", "TableHeader");
    const renderRow = (row, ri) => {
      const rp = "  ".repeat(ri);
      const cells = row.map((c) => renderNode(c, imports, ri + 1)).join("\n");
      return `${rp}<TableRow>
${cells}
${rp}</TableRow>`;
    };
    const parts = [];
    if (headerRows.length > 0) {
      const inner = headerRows.map((r) => renderRow(r, indent + 2)).join("\n");
      parts.push(`${pad}  <TableHeader>
${inner}
${pad}  </TableHeader>`);
    }
    const bodyInner = rows.map((r) => renderRow(r, indent + 2)).join("\n");
    parts.push(`${pad}  <TableBody>
${bodyInner}
${pad}  </TableBody>`);
    return `${pad}<Table>
${parts.join("\n")}
${pad}</Table>`;
  }
  function renderDataTable(_node, imports, _indent) {
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add table");
    addImport(imports, DIRECTIVE_KEY, '"use client"');
    addImport(imports, RAW_IMPORT_KEY, 'import * as React from "react"');
    addImport(imports, "@tanstack/react-table", "flexRender");
    addImport(imports, "@tanstack/react-table", "getCoreRowModel");
    addImport(imports, "@tanstack/react-table", "getFilteredRowModel");
    addImport(imports, "@tanstack/react-table", "getPaginationRowModel");
    addImport(imports, "@tanstack/react-table", "getSortedRowModel");
    addImport(imports, "@tanstack/react-table", "useReactTable");
    addImport(imports, "@tanstack/react-table", "type ColumnDef");
    addImport(imports, "@tanstack/react-table", "type ColumnFiltersState");
    addImport(imports, "@tanstack/react-table", "type SortingState");
    addImport(imports, "@tanstack/react-table", "type VisibilityState");
    addImport(imports, "lucide-react", "ArrowUpDown");
    addImport(imports, "lucide-react", "ChevronDown");
    addImport(imports, "lucide-react", "MoreHorizontal");
    addImport(imports, "@/components/ui/button", "Button");
    addImport(imports, "@/components/ui/checkbox", "Checkbox");
    addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenu");
    addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuCheckboxItem");
    addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuContent");
    addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuGroup");
    addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuItem");
    addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuLabel");
    addImport(imports, "@/components/ui/dropdown-menu", "DropdownMenuTrigger");
    addImport(imports, "@/components/ui/input", "Input");
    addImport(imports, "@/components/ui/table", "Table");
    addImport(imports, "@/components/ui/table", "TableBody");
    addImport(imports, "@/components/ui/table", "TableCell");
    addImport(imports, "@/components/ui/table", "TableHead");
    addImport(imports, "@/components/ui/table", "TableHeader");
    addImport(imports, "@/components/ui/table", "TableRow");
    const template = `// Sample payment data
const data: Payment[] = [
  { id: "m5gr84i9", amount: 316, status: "success",    email: "ken99@example.com" },
  { id: "3u1reuv4", amount: 242, status: "success",    email: "abe45@example.com" },
  { id: "derv1ws0", amount: 837, status: "processing", email: "monserrat44@example.com" },
  { id: "5kma53ae", amount: 874, status: "success",    email: "silas22@example.com" },
  { id: "bhqecj4p", amount: 721, status: "failed",     email: "carmella@example.com" },
  { id: "p9xk21hf", amount: 150, status: "pending",    email: "john.doe@example.com" },
  { id: "q8wm47js", amount: 499, status: "success",    email: "jane.smith@example.com" },
  { id: "r7vn63kt", amount: 299, status: "processing", email: "alex.johnson@example.com" },
  { id: "s6up89lu", amount: 125, status: "failed",     email: "sarah.williams@example.com" },
  { id: "t5to15mv", amount: 650, status: "pending",    email: "mike.brown@example.com" },
]

export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize \${
          status === "success"    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          : status === "processing" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
          : status === "failed"   ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
        }\`}>
          {status}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Email <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <div className="text-right">
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
                Copy payment ID
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function DataTableDemo() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  })

  return (
    <div className="container mx-auto py-10">
      <div className="w-full">
        <div className="flex items-center gap-4 py-4">
          <Input
            placeholder="Filter emails..."
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("email")?.setFilterValue(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end gap-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}`;
    addImport(imports, PREAMBLE_KEY, template);
    return "";
  }
  function isAccordionTrigger(node) {
    return "component" in node && node.component === "AccordionTrigger";
  }
  function isAccordionContent(node) {
    return "component" in node && node.component === "AccordionContent";
  }
  function isAccordionContainer(node) {
    return node.layout.direction === "vertical" && node.children.some(isAccordionTrigger);
  }
  function renderAccordion(node, imports, indent) {
    const pad = "  ".repeat(indent);
    const ip = "  ".repeat(indent + 1);
    addImport(imports, "@/components/ui/accordion", "Accordion");
    addImport(imports, "@/components/ui/accordion", "AccordionItem");
    const items = [];
    const children = node.children;
    let i = 0;
    while (i < children.length) {
      if (isAccordionTrigger(children[i])) {
        const next = children[i + 1];
        const hasContent = next != null && isAccordionContent(next);
        items.push({ trigger: children[i], content: hasContent ? next : null });
        i += hasContent ? 2 : 1;
      } else {
        i++;
      }
    }
    const itemsJsx = items.map((item, idx) => {
      const triggerJsx = renderNode(item.trigger, imports, indent + 2);
      const contentJsx = item.content ? "\n" + renderNode(item.content, imports, indent + 2) : "";
      return `${ip}<AccordionItem value="item-${idx + 1}">
${triggerJsx}${contentJsx}
${ip}</AccordionItem>`;
    }).join("\n");
    return `${pad}<Accordion type="single" collapsible>
${itemsJsx}
${pad}</Accordion>`;
  }
  function collectTexts(nodes) {
    const out = [];
    for (const n of nodes) {
      if ("isText" in n) {
        out.push(n.content);
        continue;
      }
      if ("isLayout" in n)
        out.push(...collectTexts(n.children));
      if ("component" in n && Array.isArray(n.children))
        out.push(...collectTexts(n.children));
    }
    return out;
  }
  function findIconChild(children) {
    if (typeof children === "string")
      return null;
    for (const c of children) {
      if ("isIcon" in c)
        return c.lucideName;
      if ("isLayout" in c) {
        const r = findIconChild(c.children);
        if (r)
          return r;
      }
      if ("component" in c) {
        const r = findIconChild(c.children);
        if (r)
          return r;
      }
    }
    return null;
  }
  function collectButtons(nodes) {
    const out = [];
    for (const n of nodes) {
      if ("component" in n) {
        const sn = n;
        if (sn.component === "Button") {
          out.push(sn);
          continue;
        }
        if (Array.isArray(sn.children))
          out.push(...collectButtons(sn.children));
      }
      if ("isLayout" in n)
        out.push(...collectButtons(n.children));
    }
    return out;
  }
  function renderAlertDialog(node, imports, indent) {
    var _a, _b, _c, _d, _e, _f;
    const p0 = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const p3 = "  ".repeat(indent + 3);
    const p4 = "  ".repeat(indent + 4);
    const children = Array.isArray(node.children) ? node.children : [];
    const texts = collectTexts(children);
    const buttons = collectButtons(children);
    const title = (_a = texts[0]) != null ? _a : "Are you absolutely sure?";
    const description = (_b = texts[1]) != null ? _b : "This action cannot be undone.";
    const isCancel = (b) => b.props.some((p) => p.shadcnProp === "variant" && ["outline", "ghost", "secondary"].includes(p.value));
    const cancelBtn = (_c = buttons.find(isCancel)) != null ? _c : buttons[1];
    const actionBtn = (_d = buttons.find((b) => b !== cancelBtn)) != null ? _d : buttons[0];
    const cancelLabel = typeof (cancelBtn == null ? void 0 : cancelBtn.children) === "string" ? cancelBtn.children : "Cancel";
    const actionLabel = typeof (actionBtn == null ? void 0 : actionBtn.children) === "string" ? actionBtn.children : "Continue";
    const cancelVariant = (_e = cancelBtn == null ? void 0 : cancelBtn.props.find((p) => p.shadcnProp === "variant")) == null ? void 0 : _e.value;
    const actionVariant = (_f = actionBtn == null ? void 0 : actionBtn.props.find((p) => p.shadcnProp === "variant")) == null ? void 0 : _f.value;
    const cancelProps = cancelVariant && cancelVariant !== "default" ? ` variant="${cancelVariant}"` : "";
    const actionProps = actionVariant && actionVariant !== "default" ? ` variant="${actionVariant}"` : "";
    const propsStr = renderProps(node.props);
    [
      "AlertDialog",
      "AlertDialogTrigger",
      "AlertDialogContent",
      "AlertDialogHeader",
      "AlertDialogTitle",
      "AlertDialogDescription",
      "AlertDialogFooter",
      "AlertDialogCancel",
      "AlertDialogAction"
    ].forEach((n) => addImport(imports, "@/components/ui/alert-dialog", n));
    addImport(imports, "@/components/ui/button", "Button");
    return [
      `${p0}<AlertDialog${propsStr}>`,
      `${p1}<AlertDialogTrigger asChild>`,
      `${p2}<Button variant="outline">Open</Button>`,
      `${p1}</AlertDialogTrigger>`,
      `${p1}<AlertDialogContent>`,
      `${p2}<AlertDialogHeader>`,
      `${p3}<AlertDialogTitle>${title}</AlertDialogTitle>`,
      `${p3}<AlertDialogDescription>${description}</AlertDialogDescription>`,
      `${p2}</AlertDialogHeader>`,
      `${p2}<AlertDialogFooter>`,
      `${p3}<AlertDialogCancel${cancelProps}>${cancelLabel}</AlertDialogCancel>`,
      `${p3}<AlertDialogAction${actionProps}>${actionLabel}</AlertDialogAction>`,
      `${p2}</AlertDialogFooter>`,
      `${p1}</AlertDialogContent>`,
      `${p0}</AlertDialog>`
    ].join("\n");
  }
  function renderBreadcrumb(node, imports, indent) {
    var _a;
    const p0 = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const p3 = "  ".repeat(indent + 3);
    const children = Array.isArray(node.children) ? node.children : [];
    const itemIndices = children.map((c, i) => "component" in c && c.component === "BreadcrumbItem" ? i : -1).filter((i) => i >= 0);
    const lastItemIdx = (_a = itemIndices[itemIndices.length - 1]) != null ? _a : -1;
    ["Breadcrumb", "BreadcrumbList", "BreadcrumbItem", "BreadcrumbLink", "BreadcrumbSeparator", "BreadcrumbPage"].forEach((n) => addImport(imports, "@/components/ui/breadcrumb", n));
    const listInner = children.map((c, idx) => {
      if (!("component" in c))
        return "";
      const sn = c;
      if (sn.component === "BreadcrumbSeparator") {
        return `${p2}<BreadcrumbSeparator />`;
      }
      if (sn.component === "BreadcrumbItem") {
        const label = typeof sn.children === "string" ? sn.children : "Link";
        if (idx === lastItemIdx) {
          return `${p2}<BreadcrumbItem>
${p3}<BreadcrumbPage>${label}</BreadcrumbPage>
${p2}</BreadcrumbItem>`;
        }
        return `${p2}<BreadcrumbItem>
${p3}<BreadcrumbLink href="/">${label}</BreadcrumbLink>
${p2}</BreadcrumbItem>`;
      }
      return renderNode(c, imports, indent + 2);
    }).filter(Boolean).join("\n");
    return `${p0}<Breadcrumb>
${p1}<BreadcrumbList>
${listInner}
${p1}</BreadcrumbList>
${p0}</Breadcrumb>`;
  }
  function renderCardHeader(slotChildren, imports, indent) {
    if (!(slotChildren == null ? void 0 : slotChildren.length))
      return "";
    const p1 = "  ".repeat(indent);
    const p2 = "  ".repeat(indent + 1);
    addImport(imports, "@/components/ui/card", "CardHeader");
    addImport(imports, "@/components/ui/card", "CardTitle");
    addImport(imports, "@/components/ui/card", "CardDescription");
    const texts = collectTexts(slotChildren);
    const lines = [];
    if (texts[0])
      lines.push(`${p2}<CardTitle>${texts[0]}</CardTitle>`);
    if (texts[1])
      lines.push(`${p2}<CardDescription>${texts[1]}</CardDescription>`);
    const nonText = slotChildren.filter((c) => !("isText" in c));
    nonText.forEach((c) => {
      const s = renderNode(c, imports, indent + 1);
      if (s)
        lines.push(s);
    });
    if (!lines.length)
      return "";
    return `${p1}<CardHeader>
${lines.join("\n")}
${p1}</CardHeader>`;
  }
  function renderCardContent(slotChildren, imports, indent) {
    if (!(slotChildren == null ? void 0 : slotChildren.length))
      return "";
    const p1 = "  ".repeat(indent);
    addImport(imports, "@/components/ui/card", "CardContent");
    const inner = slotChildren.map((c) => renderNode(c, imports, indent + 1)).filter(Boolean).join("\n");
    return inner ? `${p1}<CardContent>
${inner}
${p1}</CardContent>` : "";
  }
  function renderCardFooter(slotChildren, imports, indent) {
    if (!(slotChildren == null ? void 0 : slotChildren.length))
      return "";
    const p1 = "  ".repeat(indent);
    addImport(imports, "@/components/ui/card", "CardFooter");
    const inner = slotChildren.map((c) => renderNode(c, imports, indent + 1)).filter(Boolean).join("\n");
    return inner ? `${p1}<CardFooter>
${inner}
${p1}</CardFooter>` : "";
  }
  function renderCard(node, imports, indent) {
    const p0 = "  ".repeat(indent);
    addImport(imports, "@/components/ui/card", "Card");
    const children = Array.isArray(node.children) ? node.children : [];
    const layoutChildren = children.filter((c) => "isLayout" in c);
    let slotFrames;
    if (layoutChildren.length === 1 && layoutChildren[0].children.length > 0 && layoutChildren[0].children.every((c) => "isLayout" in c)) {
      slotFrames = layoutChildren[0].children;
    } else {
      slotFrames = layoutChildren;
    }
    const slotContents = slotFrames.map((f) => {
      var _a;
      return (_a = f.children) != null ? _a : [];
    });
    const sections = [];
    if (slotContents.length === 1) {
      const s = renderCardContent(slotContents[0], imports, indent + 1);
      if (s)
        sections.push(s);
    } else if (slotContents.length === 2) {
      const h = renderCardHeader(slotContents[0], imports, indent + 1);
      const c = renderCardContent(slotContents[1], imports, indent + 1);
      if (h)
        sections.push(h);
      if (c)
        sections.push(c);
    } else if (slotContents.length >= 3) {
      const h = renderCardHeader(slotContents[0], imports, indent + 1);
      if (h)
        sections.push(h);
      for (let i = 1; i < slotContents.length - 1; i++) {
        const c = renderCardContent(slotContents[i], imports, indent + 1);
        if (c)
          sections.push(c);
      }
      const f = renderCardFooter(slotContents[slotContents.length - 1], imports, indent + 1);
      if (f)
        sections.push(f);
    }
    const propsStr = renderProps(node.props);
    return `${p0}<Card${propsStr}>
${sections.join("\n")}
${p0}</Card>`;
  }
  function findFirstChartNode(nodes) {
    for (const n of nodes) {
      if ("component" in n && n.component.startsWith(CHART_COMPONENT_PREFIX)) {
        return n;
      }
      if ("isLayout" in n) {
        const found = findFirstChartNode(n.children);
        if (found)
          return found;
      }
    }
    return null;
  }
  function toJsKey(label) {
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/, "");
    return key || "value";
  }
  function extractSeries(legendLabels, count) {
    var _a, _b;
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push((_b = (_a = legendLabels[i]) != null ? _a : FALLBACK_SERIES[i]) != null ? _b : `series${i + 1}`);
    }
    return result;
  }
  function renderBarChart(node, imports, indent) {
    var _a;
    const typeProp = node.props.find((p) => p.shadcnProp === "type");
    const chartType = (_a = typeProp == null ? void 0 : typeProp.value) != null ? _a : "default";
    const children = Array.isArray(node.children) ? node.children : [];
    const allTexts = collectTexts(children);
    const legendLabels = allTexts.filter((t) => !/^[\d.,]+%?$/.test(t.trim()));
    const seriesCount = chartType === "multiple" || chartType === "stacked" ? 2 : 1;
    const series = extractSeries(legendLabels, seriesCount).map((label, i) => ({ label, key: toJsKey(label), idx: i }));
    const dataLines = CHART_MONTHS.map((m, mi) => {
      const vals = series.map((s) => {
        var _a2, _b;
        return `${s.key}: ${(_b = (_a2 = CHART_VALUES[s.idx]) == null ? void 0 : _a2[mi]) != null ? _b : 100}`;
      }).join(", ");
      return `  { month: "${m}", ${vals} },`;
    });
    const chartDataStr = `const chartData = [
${dataLines.join("\n")}
]`;
    const configLines = series.map(
      (s, i) => `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`
    );
    const chartConfigStr = `const chartConfig = {
${configLines.join("\n")}
} satisfies ChartConfig`;
    addImport(imports, "recharts", "BarChart");
    addImport(imports, "recharts", "Bar");
    addImport(imports, "recharts", "CartesianGrid");
    addImport(imports, "@/components/ui/chart", "ChartContainer");
    addImport(imports, "@/components/ui/chart", "type ChartConfig");
    addImport(imports, "@/components/ui/chart", "ChartTooltip");
    addImport(imports, "@/components/ui/chart", "ChartTooltipContent");
    const p0 = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const barElems = series.map((s, i) => {
      if (chartType === "stacked") {
        const isFirst = i === 0;
        const isLast = i === series.length - 1;
        const radius = isLast ? `{[4, 4, 0, 0]}` : isFirst ? `{[0, 0, 4, 4]}` : `{0}`;
        return `${p2}<Bar dataKey="${s.key}" fill="var(--color-${s.key})" radius=${radius} stackId="a" />`;
      }
      return `${p2}<Bar dataKey="${s.key}" fill="var(--color-${s.key})" radius={4} />`;
    }).join("\n");
    let chartInner;
    if (chartType === "horizontal") {
      addImport(imports, "recharts", "XAxis");
      addImport(imports, "recharts", "YAxis");
      chartInner = [
        `${p1}<BarChart accessibilityLayer data={chartData} layout="vertical">`,
        `${p2}<CartesianGrid horizontal={false} />`,
        `${p2}<XAxis type="number" hide />`,
        `${p2}<YAxis dataKey="month" type="category" tickLine={false} axisLine={false} />`,
        `${p2}<ChartTooltip content={<ChartTooltipContent />} />`,
        barElems,
        `${p1}</BarChart>`
      ].join("\n");
    } else {
      addImport(imports, "recharts", "XAxis");
      chartInner = [
        `${p1}<BarChart accessibilityLayer data={chartData}>`,
        `${p2}<CartesianGrid vertical={false} />`,
        `${p2}<XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />`,
        `${p2}<ChartTooltip content={<ChartTooltipContent />} />`,
        barElems,
        `${p1}</BarChart>`
      ].join("\n");
    }
    if (chartType === "interactive") {
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");
      addImport(imports, CSS_KEY, CHART_CSS_VARS);
      addImport(imports, "recharts", "BarChart");
      addImport(imports, "recharts", "Bar");
      addImport(imports, "recharts", "CartesianGrid");
      addImport(imports, "recharts", "XAxis");
      addImport(imports, "@/components/ui/chart", "ChartContainer");
      addImport(imports, "@/components/ui/chart", "type ChartConfig");
      addImport(imports, "@/components/ui/chart", "ChartTooltip");
      addImport(imports, "@/components/ui/chart", "ChartTooltipContent");
      const iSeries = series.length >= 2 ? series.slice(0, 2) : [{ label: "desktop", key: "desktop", idx: 0 }, { label: "mobile", key: "mobile", idx: 1 }];
      const DATES = ["2024-04-01", "2024-04-08", "2024-04-15", "2024-04-22", "2024-04-29", "2024-05-06", "2024-05-13", "2024-05-20", "2024-05-27", "2024-06-03", "2024-06-10", "2024-06-17", "2024-06-24"];
      const VALS2 = [222, 97, 167, 242, 373, 301, 245, 409, 59, 261, 327, 292, 342];
      const VALS3 = [150, 180, 120, 260, 290, 340, 180, 220, 100, 310, 250, 190, 280];
      const iDataLines = DATES.map((d, i) => {
        const vals = iSeries.map((s, si) => `${s.key}: ${si === 0 ? VALS2[i] : VALS3[i]}`).join(", ");
        return `  { date: "${d}", ${vals} },`;
      });
      addImport(imports, PREAMBLE_KEY, `const chartData = [
${iDataLines.join("\n")}
]`);
      addImport(imports, PREAMBLE_KEY, `const chartConfig = {
${iSeries.map((s, i) => `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`).join("\n")}
} satisfies ChartConfig`);
      const keys = iSeries.map((s) => `"${s.key}"`).join(" | ");
      addImport(imports, PREAMBLE_KEY, `const [activeChart, setActiveChart] = useState<${keys}>("${iSeries[0].key}")`);
      const p02 = "  ".repeat(indent);
      const p12 = "  ".repeat(indent + 1);
      const p22 = "  ".repeat(indent + 2);
      return `${p02}<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
${p12}<BarChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
${p22}<CartesianGrid vertical={false} />
${p22}<XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
${p22}<ChartTooltip content={<ChartTooltipContent className="w-[150px]" nameKey="views" labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />} />
${p22}<Bar dataKey={activeChart} fill={\`var(--color-\${activeChart})\`} />
${p12}</BarChart>
${p02}</ChartContainer>`;
    }
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");
    addImport(imports, CSS_KEY, CHART_CSS_VARS);
    addImport(imports, PREAMBLE_KEY, chartDataStr);
    addImport(imports, PREAMBLE_KEY, chartConfigStr);
    return `${p0}<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
${chartInner}
${p0}</ChartContainer>`;
  }
  function renderAreaChart(node, imports, indent) {
    var _a;
    const typeProp = node.props.find((p) => p.shadcnProp === "type");
    const chartType = (_a = typeProp == null ? void 0 : typeProp.value) != null ? _a : "default";
    const children = Array.isArray(node.children) ? node.children : [];
    const allTexts = collectTexts(children);
    const legendLabels = allTexts.filter((t) => !/^[\d.,]+%?$/.test(t.trim()));
    const seriesCount = chartType === "stacked" ? 2 : 1;
    const series = extractSeries(legendLabels, seriesCount).map((label, i) => ({ label, key: toJsKey(label), idx: i }));
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");
    addImport(imports, CSS_KEY, CHART_CSS_VARS);
    if (chartType === "interactive") {
      addImport(imports, "recharts", "AreaChart");
      addImport(imports, "recharts", "Area");
      addImport(imports, "recharts", "CartesianGrid");
      addImport(imports, "recharts", "XAxis");
      addImport(imports, "@/components/ui/chart", "ChartContainer");
      addImport(imports, "@/components/ui/chart", "type ChartConfig");
      addImport(imports, "@/components/ui/chart", "ChartTooltip");
      addImport(imports, "@/components/ui/chart", "ChartTooltipContent");
      const iSeries = series.length >= 2 ? series.slice(0, 2) : [{ label: "desktop", key: "desktop", idx: 0 }, { label: "mobile", key: "mobile", idx: 1 }];
      const DATES = ["2024-04-01", "2024-04-08", "2024-04-15", "2024-04-22", "2024-04-29", "2024-05-06", "2024-05-13", "2024-05-20", "2024-05-27", "2024-06-03", "2024-06-10", "2024-06-17", "2024-06-24"];
      const VALS_A = [222, 97, 167, 242, 373, 301, 245, 409, 59, 261, 327, 292, 342];
      const VALS_B = [150, 180, 120, 260, 290, 340, 180, 220, 100, 310, 250, 190, 280];
      const iDataLines = DATES.map((d, i) => {
        const vals = iSeries.map((s, si) => `${s.key}: ${si === 0 ? VALS_A[i] : VALS_B[i]}`).join(", ");
        return `  { date: "${d}", ${vals} },`;
      });
      addImport(imports, PREAMBLE_KEY, `const chartData = [
${iDataLines.join("\n")}
]`);
      addImport(imports, PREAMBLE_KEY, `const chartConfig = {
${iSeries.map((s, i) => `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`).join("\n")}
} satisfies ChartConfig`);
      const keys = iSeries.map((s) => `"${s.key}"`).join(" | ");
      addImport(imports, PREAMBLE_KEY, `const [activeChart, setActiveChart] = useState<${keys}>("${iSeries[0].key}")`);
      const p02 = "  ".repeat(indent);
      const p12 = "  ".repeat(indent + 1);
      const p22 = "  ".repeat(indent + 2);
      const p3 = "  ".repeat(indent + 3);
      const gradientDefs2 = iSeries.map((s) => {
        const cap = s.key.charAt(0).toUpperCase() + s.key.slice(1);
        return `${p3}<linearGradient id="fill${cap}" x1="0" y1="0" x2="0" y2="1">
${p3}  <stop offset="5%" stopColor="var(--color-${s.key})" stopOpacity={0.8} />
${p3}  <stop offset="95%" stopColor="var(--color-${s.key})" stopOpacity={0.1} />
${p3}</linearGradient>`;
      }).join("\n");
      const areaElems2 = iSeries.map((s) => {
        const cap = s.key.charAt(0).toUpperCase() + s.key.slice(1);
        return `${p3}<Area dataKey="${s.key}" type="natural" fill="url(#fill${cap})" fillOpacity={0.4} stroke="var(--color-${s.key})" />`;
      }).join("\n");
      return [
        `${p02}<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">`,
        `${p12}<AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>`,
        `${p22}<defs>`,
        gradientDefs2,
        `${p22}</defs>`,
        `${p22}<CartesianGrid vertical={false} />`,
        `${p22}<XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />`,
        `${p22}<ChartTooltip content={<ChartTooltipContent className="w-[150px]" labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />} />`,
        areaElems2,
        `${p12}</AreaChart>`,
        `${p02}</ChartContainer>`
      ].join("\n");
    }
    const dataLines = CHART_MONTHS.map((m, mi) => {
      const vals = series.map((s) => {
        var _a2, _b;
        return `${s.key}: ${(_b = (_a2 = CHART_VALUES[s.idx]) == null ? void 0 : _a2[mi]) != null ? _b : 100}`;
      }).join(", ");
      return `  { month: "${m}", ${vals} },`;
    });
    const chartDataStr = `const chartData = [
${dataLines.join("\n")}
]`;
    const configLines = series.map(
      (s, i) => `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`
    );
    const chartConfigStr = `const chartConfig = {
${configLines.join("\n")}
} satisfies ChartConfig`;
    addImport(imports, PREAMBLE_KEY, chartDataStr);
    addImport(imports, PREAMBLE_KEY, chartConfigStr);
    addImport(imports, "recharts", "AreaChart");
    addImport(imports, "recharts", "Area");
    addImport(imports, "recharts", "CartesianGrid");
    addImport(imports, "recharts", "XAxis");
    addImport(imports, "@/components/ui/chart", "ChartContainer");
    addImport(imports, "@/components/ui/chart", "type ChartConfig");
    addImport(imports, "@/components/ui/chart", "ChartTooltip");
    addImport(imports, "@/components/ui/chart", "ChartTooltipContent");
    const p0 = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const curveType = chartType === "linear" ? "linear" : chartType === "step" ? "step" : "natural";
    const gradientDefs = series.map((s) => {
      const capKey = s.key.charAt(0).toUpperCase() + s.key.slice(1);
      return [
        `${p2}  <linearGradient id="fill${capKey}" x1="0" y1="0" x2="0" y2="1">`,
        `${p2}    <stop offset="5%" stopColor="var(--color-${s.key})" stopOpacity={0.8} />`,
        `${p2}    <stop offset="95%" stopColor="var(--color-${s.key})" stopOpacity={0.1} />`,
        `${p2}  </linearGradient>`
      ].join("\n");
    }).join("\n");
    const areaElems = series.map((s) => {
      const capKey = s.key.charAt(0).toUpperCase() + s.key.slice(1);
      const stackProp = chartType === "stacked" ? ` stackId="a"` : "";
      return `${p2}<Area type="${curveType}" dataKey="${s.key}" fill="url(#fill${capKey})" fillOpacity={0.4} stroke="var(--color-${s.key})"${stackProp} />`;
    }).join("\n");
    const chartInner = [
      `${p1}<AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>`,
      `${p2}<defs>`,
      gradientDefs,
      `${p2}</defs>`,
      `${p2}<CartesianGrid vertical={false} />`,
      `${p2}<XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />`,
      `${p2}<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />`,
      areaElems,
      `${p1}</AreaChart>`
    ].join("\n");
    return `${p0}<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
${chartInner}
${p0}</ChartContainer>`;
  }
  function renderLineChart(node, imports, indent) {
    var _a;
    const typeProp = node.props.find((p) => p.shadcnProp === "type");
    const chartType = (_a = typeProp == null ? void 0 : typeProp.value) != null ? _a : "default";
    const children = Array.isArray(node.children) ? node.children : [];
    const allTexts = collectTexts(children);
    const legendLabels = allTexts.filter((t) => !/^[\d.,]+%?$/.test(t.trim()));
    const seriesCount = chartType === "stacked" ? 2 : 1;
    const series = extractSeries(legendLabels, seriesCount).map((label, i) => ({ label, key: toJsKey(label), idx: i }));
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add chart");
    addImport(imports, CSS_KEY, CHART_CSS_VARS);
    addImport(imports, "recharts", "LineChart");
    addImport(imports, "recharts", "Line");
    addImport(imports, "recharts", "CartesianGrid");
    addImport(imports, "recharts", "XAxis");
    addImport(imports, "@/components/ui/chart", "ChartContainer");
    addImport(imports, "@/components/ui/chart", "type ChartConfig");
    addImport(imports, "@/components/ui/chart", "ChartTooltip");
    addImport(imports, "@/components/ui/chart", "ChartTooltipContent");
    if (chartType === "interactive") {
      const iSeries = series.length >= 2 ? series.slice(0, 2) : [{ label: "desktop", key: "desktop", idx: 0 }, { label: "mobile", key: "mobile", idx: 1 }];
      const DATES = ["2024-04-01", "2024-04-08", "2024-04-15", "2024-04-22", "2024-04-29", "2024-05-06", "2024-05-13", "2024-05-20", "2024-05-27", "2024-06-03", "2024-06-10", "2024-06-17", "2024-06-24"];
      const VALS_A = [222, 97, 167, 242, 373, 301, 245, 409, 59, 261, 327, 292, 342];
      const VALS_B = [150, 180, 120, 260, 290, 340, 180, 220, 100, 310, 250, 190, 280];
      const iDataLines = DATES.map((d, i) => {
        const vals = iSeries.map((s, si) => `${s.key}: ${si === 0 ? VALS_A[i] : VALS_B[i]}`).join(", ");
        return `  { date: "${d}", ${vals} },`;
      });
      addImport(imports, PREAMBLE_KEY, `const chartData = [
${iDataLines.join("\n")}
]`);
      addImport(imports, PREAMBLE_KEY, `const chartConfig = {
${iSeries.map((s, i) => `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`).join("\n")}
} satisfies ChartConfig`);
      const keys = iSeries.map((s) => `"${s.key}"`).join(" | ");
      addImport(imports, PREAMBLE_KEY, `const [activeLine, setActiveLine] = useState<${keys}>("${iSeries[0].key}")`);
      const p02 = "  ".repeat(indent);
      const p12 = "  ".repeat(indent + 1);
      const p22 = "  ".repeat(indent + 2);
      const lineElems2 = iSeries.map(
        (s) => `${p22}<Line dataKey="${s.key}" type="natural" stroke="var(--color-${s.key})" strokeWidth={2} dot={false} strokeOpacity={activeLine === "${s.key}" ? 1 : 0.3} />`
      ).join("\n");
      return [
        `${p02}<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">`,
        `${p12}<LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>`,
        `${p22}<CartesianGrid vertical={false} />`,
        `${p22}<XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />`,
        `${p22}<ChartTooltip content={<ChartTooltipContent className="w-[150px]" labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />} />`,
        lineElems2,
        `${p12}</LineChart>`,
        `${p02}</ChartContainer>`
      ].join("\n");
    }
    const dataLines = CHART_MONTHS.map((m, mi) => {
      const vals = series.map((s) => {
        var _a2, _b;
        return `${s.key}: ${(_b = (_a2 = CHART_VALUES[s.idx]) == null ? void 0 : _a2[mi]) != null ? _b : 100}`;
      }).join(", ");
      return `  { month: "${m}", ${vals} },`;
    });
    addImport(imports, PREAMBLE_KEY, `const chartData = [
${dataLines.join("\n")}
]`);
    addImport(imports, PREAMBLE_KEY, `const chartConfig = {
${series.map((s, i) => `  ${s.key}: { label: "${s.label}", color: "var(--chart-${i + 1})" },`).join("\n")}
} satisfies ChartConfig`);
    const p0 = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const curveType = chartType === "linear" ? "linear" : chartType === "step" ? "step" : "natural";
    const lineElems = series.map(
      (s) => `${p2}<Line dataKey="${s.key}" type="${curveType}" stroke="var(--color-${s.key})" strokeWidth={2} dot={false} />`
    ).join("\n");
    return [
      `${p0}<ChartContainer config={chartConfig} className="min-h-[200px] w-full">`,
      `${p1}<LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>`,
      `${p2}<CartesianGrid vertical={false} />`,
      `${p2}<XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />`,
      `${p2}<ChartTooltip cursor={false} content={<ChartTooltipContent />} />`,
      lineElems,
      `${p1}</LineChart>`,
      `${p0}</ChartContainer>`
    ].join("\n");
  }
  function renderDatePickerSingle(imports, indent) {
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add calendar popover");
    addImport(imports, DIRECTIVE_KEY, '"use client"');
    addImport(imports, "react", "useState");
    addImport(imports, "date-fns", "format");
    addImport(imports, "@/components/ui/button", "Button");
    addImport(imports, "@/components/ui/calendar", "Calendar");
    addImport(imports, "@/components/ui/field", "Field");
    addImport(imports, "@/components/ui/field", "FieldLabel");
    addImport(imports, "@/components/ui/popover", "Popover");
    addImport(imports, "@/components/ui/popover", "PopoverContent");
    addImport(imports, "@/components/ui/popover", "PopoverTrigger");
    addImport(imports, PREAMBLE_KEY, `const [date, setDate] = useState<Date>()`);
    return [
      `${pad}<Field className="mx-auto w-44">`,
      `${p1}<FieldLabel htmlFor="date-picker">Date</FieldLabel>`,
      `${p1}<Popover>`,
      `${p2}<PopoverTrigger asChild>`,
      `${p2}  <Button variant="outline" id="date-picker" className="justify-start font-normal">`,
      `${p2}    {date ? format(date, "PPP") : <span>Pick a date</span>}`,
      `${p2}  </Button>`,
      `${p2}</PopoverTrigger>`,
      `${p2}<PopoverContent className="w-auto p-0" align="start">`,
      `${p2}  <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={date} />`,
      `${p2}</PopoverContent>`,
      `${p1}</Popover>`,
      `${pad}</Field>`
    ].join("\n");
  }
  function renderDatePickerRange(imports, indent, numberOfMonths = 2) {
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add calendar popover");
    addImport(imports, DIRECTIVE_KEY, '"use client"');
    addImport(imports, "react", "useState");
    addImport(imports, "date-fns", "addDays");
    addImport(imports, "date-fns", "format");
    addImport(imports, "lucide-react", "CalendarIcon");
    addImport(imports, "react-day-picker", "type DateRange");
    addImport(imports, "@/components/ui/button", "Button");
    addImport(imports, "@/components/ui/calendar", "Calendar");
    addImport(imports, "@/components/ui/field", "Field");
    addImport(imports, "@/components/ui/field", "FieldLabel");
    addImport(imports, "@/components/ui/popover", "Popover");
    addImport(imports, "@/components/ui/popover", "PopoverContent");
    addImport(imports, "@/components/ui/popover", "PopoverTrigger");
    addImport(
      imports,
      PREAMBLE_KEY,
      `const [date, setDate] = useState<DateRange | undefined>({
  from: new Date(new Date().getFullYear(), 0, 20),
  to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
})`
    );
    return [
      `${pad}<Field className="mx-auto w-60">`,
      `${p1}<FieldLabel htmlFor="date-picker-range">Date Range</FieldLabel>`,
      `${p1}<Popover>`,
      `${p2}<PopoverTrigger asChild>`,
      `${p2}  <Button variant="outline" id="date-picker-range" className="justify-start px-2.5 font-normal">`,
      `${p2}    <CalendarIcon />`,
      `${p2}    {date?.from ? (`,
      `${p2}      date.to ? (`,
      `${p2}        <>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>`,
      `${p2}      ) : format(date.from, "LLL dd, y")`,
      `${p2}    ) : <span>Pick a date</span>}`,
      `${p2}  </Button>`,
      `${p2}</PopoverTrigger>`,
      `${p2}<PopoverContent className="w-auto p-0" align="start">`,
      `${p2}  <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={${numberOfMonths}} />`,
      `${p2}</PopoverContent>`,
      `${p1}</Popover>`,
      `${pad}</Field>`
    ].join("\n");
  }
  function renderDatePicker(node, imports, indent) {
    var _a;
    const monthsProp = node.props.find((p) => p.shadcnProp === "months");
    const months = parseInt((_a = monthsProp == null ? void 0 : monthsProp.value) != null ? _a : "1", 10);
    return months >= 2 ? renderDatePickerRange(imports, indent, months) : renderDatePickerSingle(imports, indent);
  }
  function renderInputOTPGroup(slots, imports, indent) {
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add input-otp");
    addImport(imports, DIRECTIVE_KEY, '"use client"');
    addImport(imports, "@/components/ui/input-otp", "InputOTP");
    addImport(imports, "@/components/ui/input-otp", "InputOTPGroup");
    addImport(imports, "@/components/ui/input-otp", "InputOTPSlot");
    const count = slots.length || 6;
    const slotLines = Array.from({ length: count }, (_, i) => `${p2}<InputOTPSlot index={${i}} />`).join("\n");
    return [
      `${pad}<InputOTP maxLength={${count}}>`,
      `${p1}<InputOTPGroup>`,
      slotLines,
      `${p1}</InputOTPGroup>`,
      `${pad}</InputOTP>`
    ].join("\n");
  }
  function renderInputOTP(node, imports, indent) {
    return renderInputOTPGroup([node], imports, indent);
  }
  function findFirstText(children) {
    if (typeof children === "string")
      return children || null;
    for (const c of children) {
      if ("isText" in c)
        return c.content || null;
      if ("isInlineText" in c)
        return c.content || null;
      if ("isLayout" in c) {
        const found = findFirstText(c.children);
        if (found)
          return found;
      } else if ("component" in c) {
        const found = findFirstText(c.children);
        if (found)
          return found;
      }
    }
    return null;
  }
  function findDecorationNodes(children) {
    if (typeof children === "string")
      return [];
    const result = [];
    for (const c of children) {
      if ("component" in c && c.component === "__input_decoration__") {
        result.push(c);
      } else if ("isLayout" in c) {
        result.push(...findDecorationNodes(c.children));
      } else if ("component" in c) {
        result.push(...findDecorationNodes(c.children));
      }
    }
    return result;
  }
  function renderInputAddon(dec, imports, indent, align) {
    var _a, _b;
    addImport(imports, "@/components/ui/input-group", "InputGroupAddon");
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const alignAttr = align ? ` align="${align}"` : "";
    const muted = ((_a = dec.props.find((p) => p.shadcnProp === "type")) == null ? void 0 : _a.value) === "icon-muted";
    const iconCls = `size-4${muted ? " text-muted-foreground" : ""}`;
    const iconName = (_b = findIconChild(dec.children)) != null ? _b : "Search";
    addImport(imports, "lucide-react", iconName);
    return [
      `${pad}<InputGroupAddon${alignAttr}>`,
      `${p1}<${iconName} className="${iconCls}" />`,
      `${pad}</InputGroupAddon>`
    ].join("\n");
  }
  function renderInput(node, imports, indent) {
    var _a, _b, _c;
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const roundProp = node.props.find((p) => p.shadcnProp === "roundness");
    const sizeProp = node.props.find((p) => p.shadcnProp === "size");
    const stateProp = node.props.find((p) => p.shadcnProp === "state");
    const round = (roundProp == null ? void 0 : roundProp.value) === "full";
    const sizeVal = (_a = sizeProp == null ? void 0 : sizeProp.value) != null ? _a : "";
    const state = (_b = stateProp == null ? void 0 : stateProp.value) != null ? _b : "";
    const sizeClassMap = { large: "h-12", small: "h-8", mini: "h-6 text-xs" };
    const errorClass = state === "error" ? "border-destructive" : "";
    const classes = [(_c = sizeClassMap[sizeVal]) != null ? _c : "", round ? "rounded-full" : "", errorClass].filter(Boolean).join(" ");
    const classAttr = classes ? ` className="${classes}"` : "";
    const disAttr = state === "disabled" ? " disabled" : "";
    const rawText = findFirstText(node.children);
    let valueAttr = "";
    if (state === "value" && rawText) {
      valueAttr = ` defaultValue="${rawText}"`;
    } else if (state === "placeholder" && rawText) {
      valueAttr = ` placeholder="${rawText}"`;
    } else if (state === "placeholder") {
      valueAttr = ` placeholder="Enter a value"`;
    }
    const decorations = findDecorationNodes(node.children);
    if (decorations.length > 0) {
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add input input-group");
      addImport(imports, "@/components/ui/input-group", "InputGroup");
      addImport(imports, "@/components/ui/input-group", "InputGroupInput");
      const addonLines = decorations.map((dec) => {
        const isRight = /right/i.test(dec.layerName);
        return renderInputAddon(dec, imports, indent + 1, isRight ? "inline-end" : null);
      });
      return [
        `${pad}<InputGroup>`,
        `${p1}<InputGroupInput${valueAttr}${classAttr}${disAttr} />`,
        ...addonLines,
        `${pad}</InputGroup>`
      ].join("\n");
    }
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add input");
    addImport(imports, "@/components/ui/input", "Input");
    return `${pad}<Input${valueAttr}${classAttr}${disAttr} />`;
  }
  function renderInputDecoration(node, imports, indent) {
    return renderInputAddon(node, imports, indent, "inline-end");
  }
  function renderInputFile(node, imports, indent) {
    var _a, _b;
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add input field");
    addImport(imports, "@/components/ui/input", "Input");
    addImport(imports, "@/components/ui/field", "Field");
    addImport(imports, "@/components/ui/field", "FieldLabel");
    addImport(imports, "@/components/ui/field", "FieldDescription");
    const roundProp = node.props.find((p) => p.shadcnProp === "roundness");
    const sizeProp = node.props.find((p) => p.shadcnProp === "size");
    const stateProp = node.props.find((p) => p.shadcnProp === "state");
    const round = (roundProp == null ? void 0 : roundProp.value) === "full";
    const sizeVal = (_a = sizeProp == null ? void 0 : sizeProp.value) != null ? _a : "";
    const isError = (stateProp == null ? void 0 : stateProp.value) === "error";
    const sizeClassMap = { large: "h-12", small: "h-8", mini: "h-6 text-xs" };
    const classes = [(_b = sizeClassMap[sizeVal]) != null ? _b : "", round ? "rounded-full" : "", isError ? "border-destructive" : ""].filter(Boolean).join(" ");
    const classAttr = classes ? ` className="${classes}"` : "";
    return [
      `${pad}<Field>`,
      `${p1}<FieldLabel htmlFor="file">Label</FieldLabel>`,
      `${p1}<Input id="file" type="file"${classAttr} />`,
      `${p1}<FieldDescription>Select a file to upload.</FieldDescription>`,
      `${pad}</Field>`
    ].join("\n");
  }
  function renderField(node, imports, indent, orientation) {
    var _a;
    const typeProp = node.props.find((p) => p.shadcnProp === "type");
    const type = (_a = typeProp == null ? void 0 : typeProp.value) != null ? _a : "text";
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add field");
    addImport(imports, "@/components/ui/field", "Field");
    addImport(imports, "@/components/ui/field", "FieldLabel");
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const orientAttr = orientation === "horizontal" ? ` orientation="horizontal"` : "";
    const fieldId = `field-${type}`;
    let inner = "";
    if (type === "text") {
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add input");
      addImport(imports, "@/components/ui/input", "Input");
      inner = [
        `${p1}<FieldLabel htmlFor="${fieldId}">Label</FieldLabel>`,
        `${p1}<Input id="${fieldId}" placeholder="Enter a value" />`
      ].join("\n");
    } else if (type === "select") {
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add select");
      addImport(imports, "@/components/ui/select", "Select");
      addImport(imports, "@/components/ui/select", "SelectContent");
      addImport(imports, "@/components/ui/select", "SelectItem");
      addImport(imports, "@/components/ui/select", "SelectTrigger");
      addImport(imports, "@/components/ui/select", "SelectValue");
      inner = [
        `${p1}<FieldLabel htmlFor="${fieldId}">Label</FieldLabel>`,
        `${p1}<Select>`,
        `${p1}  <SelectTrigger id="${fieldId}"><SelectValue placeholder="Select an item" /></SelectTrigger>`,
        `${p1}  <SelectContent>`,
        `${p1}    <SelectItem value="option1">Option 1</SelectItem>`,
        `${p1}    <SelectItem value="option2">Option 2</SelectItem>`,
        `${p1}  </SelectContent>`,
        `${p1}</Select>`
      ].join("\n");
    } else if (type === "textarea") {
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add textarea");
      addImport(imports, "@/components/ui/textarea", "Textarea");
      inner = [
        `${p1}<FieldLabel htmlFor="${fieldId}">Label</FieldLabel>`,
        `${p1}<Textarea id="${fieldId}" placeholder="Type your message here" />`
      ].join("\n");
    } else if (type === "radio") {
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add radio-group");
      addImport(imports, "@/components/ui/radio-group", "RadioGroup");
      addImport(imports, "@/components/ui/radio-group", "RadioGroupItem");
      addImport(imports, "@/components/ui/label", "Label");
      inner = [
        `${p1}<FieldLabel>Label</FieldLabel>`,
        `${p1}<RadioGroup defaultValue="option1">`,
        `${p1}  <div className="flex items-center gap-2"><RadioGroupItem id="r1" value="option1" /><Label htmlFor="r1">Option 1</Label></div>`,
        `${p1}  <div className="flex items-center gap-2"><RadioGroupItem id="r2" value="option2" /><Label htmlFor="r2">Option 2</Label></div>`,
        `${p1}</RadioGroup>`
      ].join("\n");
    } else if (type === "checkbox") {
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add checkbox");
      addImport(imports, "@/components/ui/checkbox", "Checkbox");
      inner = [
        `${p1}<Checkbox id="${fieldId}" />`,
        `${p1}<FieldLabel htmlFor="${fieldId}">Label</FieldLabel>`
      ].join("\n");
      const checkboxOrient = ` orientation="horizontal"`;
      return [`${pad}<Field${checkboxOrient}>`, inner, `${pad}</Field>`].join("\n");
    } else if (type === "slider") {
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add slider");
      addImport(imports, "@/components/ui/slider", "Slider");
      inner = [
        `${p1}<FieldLabel>Label</FieldLabel>`,
        `${p1}<Slider defaultValue={[50]} max={100} step={1} />`
      ].join("\n");
    }
    return [`${pad}<Field${orientAttr}>`, inner, `${pad}</Field>`].join("\n");
  }
  function findAllTexts(children) {
    if (typeof children === "string")
      return children ? [children] : [];
    const out = [];
    for (const c of children) {
      if ("isText" in c) {
        if (c.content)
          out.push(c.content);
      } else if ("isInlineText" in c) {
        if (c.content)
          out.push(c.content);
      } else if ("isLayout" in c)
        out.push(...findAllTexts(c.children));
      else if ("component" in c)
        out.push(...findAllTexts(c.children));
    }
    return out;
  }
  function renderItem(node, imports, indent) {
    var _a, _b, _c, _d;
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const p3 = "  ".repeat(indent + 3);
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add item");
    addImport(imports, "@/components/ui/item", "Item");
    addImport(imports, "@/components/ui/item", "ItemContent");
    addImport(imports, "@/components/ui/item", "ItemTitle");
    const get = (prop) => {
      var _a2, _b2;
      return (_b2 = (_a2 = node.props.find((p) => p.shadcnProp === prop)) == null ? void 0 : _a2.value) != null ? _b2 : null;
    };
    const variant = get("variant");
    const size = get("size");
    const mediaType = get("mediaType");
    const actionType = get("actionType");
    const titleText = get("title") || findAllTexts(node.children)[0] || "Title";
    const descText = get("description") || findAllTexts(node.children)[1] || null;
    const labelText = get("label");
    const variantAttr = variant ? ` variant="${variant}"` : "";
    const sizeAttr = size ? ` size="${size}"` : "";
    const lines = [`${pad}<Item${variantAttr}${sizeAttr}>`];
    if (mediaType) {
      addImport(imports, "@/components/ui/item", "ItemMedia");
      if (mediaType === "icon" || mediaType === "iconBadge") {
        const iconName = (_a = findIconChild(node.children)) != null ? _a : "InboxIcon";
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
          `${p1}</ItemMedia>`
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
          `${p1}</ItemMedia>`
        );
      } else if (mediaType === "image") {
        lines.push(
          `${p1}<ItemMedia>`,
          `${p2}<img src="" alt="" className="size-10 rounded-sm object-cover" />`,
          `${p1}</ItemMedia>`
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
        const btnText = (_b = findAllTexts(node.children).find((t) => t !== titleText && t !== descText)) != null ? _b : "Action";
        lines.push(`${p1}<ItemActions>`, `${p2}<Button size="sm" variant="outline">${btnText}</Button>`, `${p1}</ItemActions>`);
      } else if (actionType === "iconButton") {
        const iconName = (_c = findIconChild(node.children)) != null ? _c : "Plus";
        addImport(imports, "@/components/ui/button", "Button");
        addImport(imports, "lucide-react", iconName);
        lines.push(`${p1}<ItemActions>`, `${p2}<Button size="icon-sm" variant="outline" className="rounded-full"><${iconName} /></Button>`, `${p1}</ItemActions>`);
      } else if (actionType === "label") {
        lines.push(`${p1}<ItemActions>`, `${p2}<span className="text-sm text-muted-foreground">${labelText != null ? labelText : ""}</span>`, `${p1}</ItemActions>`);
      } else if (actionType === "icon") {
        const iconName = (_d = findIconChild(node.children)) != null ? _d : "ChevronRight";
        addImport(imports, "@/components/ui/button", "Button");
        addImport(imports, "lucide-react", iconName);
        lines.push(`${p1}<ItemActions>`, `${p2}<Button size="icon-sm" variant="ghost"><${iconName} /></Button>`, `${p1}</ItemActions>`);
      }
    }
    lines.push(`${pad}</Item>`);
    return lines.join("\n");
  }
  function renderEmpty(node, imports, indent) {
    var _a, _b, _c;
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add empty");
    addImport(imports, "lucide-react", "Inbox");
    addImport(imports, "@/components/ui/button", "Button");
    addImport(imports, "@/components/ui/empty", "Empty");
    addImport(imports, "@/components/ui/empty", "EmptyContent");
    addImport(imports, "@/components/ui/empty", "EmptyDescription");
    addImport(imports, "@/components/ui/empty", "EmptyHeader");
    addImport(imports, "@/components/ui/empty", "EmptyMedia");
    addImport(imports, "@/components/ui/empty", "EmptyTitle");
    const variantProp = node.props.find((p) => p.shadcnProp === "variant");
    const variant = (_a = variantProp == null ? void 0 : variantProp.value) != null ? _a : "default";
    const children = Array.isArray(node.children) ? node.children : [];
    const texts = collectTexts(children);
    const title = (_b = texts[0]) != null ? _b : "No results";
    const desc = (_c = texts[1]) != null ? _c : "Try adjusting your search or filters.";
    const variantAttr = variant !== "default" ? ` variant="${variant}"` : "";
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
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
      `${pad}</Empty>`
    ].join("\n");
  }
  function renderNavigationMenuContent(items, imports, indent) {
    const p0 = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const p3 = "  ".repeat(indent + 3);
    const p4 = "  ".repeat(indent + 4);
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuContent");
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuLink");
    const lines = [
      `${p0}<NavigationMenuContent>`,
      `${p1}<ul className="grid gap-2 p-4 w-[400px]">`
    ];
    items.forEach((item) => {
      var _a, _b, _c;
      const texts = findAllTexts(item.children);
      const title = (_a = texts[0]) != null ? _a : "Item";
      const desc = (_b = texts[1]) != null ? _b : null;
      const isDestruct = ((_c = item.props.find((p) => p.shadcnProp === "type")) == null ? void 0 : _c.value) === "destructive";
      lines.push(
        `${p2}<li>`,
        `${p3}<NavigationMenuLink asChild>`,
        `${p4}<a href="#">`,
        `${p4}  <div className="flex flex-col gap-1 text-sm">`,
        `${p4}    <div className="font-medium leading-none${isDestruct ? " text-destructive" : ""}">${title}</div>`,
        ...desc ? [`${p4}    <div className="line-clamp-2 text-muted-foreground">${desc}</div>`] : [],
        `${p4}  </div>`,
        `${p4}</a>`,
        `${p3}</NavigationMenuLink>`,
        `${p2}</li>`
      );
    });
    lines.push(`${p1}</ul>`, `${p0}</NavigationMenuContent>`);
    return lines.join("\n");
  }
  function renderNavigationMenu(node, imports, indent) {
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const p3 = "  ".repeat(indent + 3);
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add navigation-menu");
    addImport(imports, DIRECTIVE_KEY, '"use client"');
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenu");
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuList");
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuItem");
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuLink");
    addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuTrigger");
    addImport(imports, "@/components/ui/navigation-menu", "navigationMenuTriggerStyle");
    const children = Array.isArray(node.children) ? node.children : [];
    const buttonChildren = children.filter(
      (c) => "component" in c && c.component === "Button"
    );
    const triggerLabels = buttonChildren.length > 0 ? buttonChildren.map((btn) => {
      var _a;
      return (_a = typeof btn.children === "string" ? btn.children : findFirstText(btn.children)) != null ? _a : "Menu";
    }) : findAllTexts(children).slice(0, 3);
    const lines = [`${pad}<NavigationMenu>`, `${p1}<NavigationMenuList>`];
    if (triggerLabels.length === 0) {
      lines.push(
        `${p2}<NavigationMenuItem>`,
        `${p3}<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>`,
        `${p3}  <a href="#">Home</a>`,
        `${p3}</NavigationMenuLink>`,
        `${p2}</NavigationMenuItem>`
      );
    } else {
      triggerLabels.forEach((label) => {
        lines.push(
          `${p2}<NavigationMenuItem>`,
          `${p3}<NavigationMenuTrigger>${label}</NavigationMenuTrigger>`,
          `${p3}<NavigationMenuContent>`,
          `${p3}  {/* Add your menu items here */}`,
          `${p3}</NavigationMenuContent>`,
          `${p2}</NavigationMenuItem>`
        );
      });
    }
    lines.push(`${p1}</NavigationMenuList>`, `${pad}</NavigationMenu>`);
    return lines.join("\n");
  }
  function renderIconButton(node, imports, indent) {
    var _a, _b, _c, _d;
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add button");
    addImport(imports, "@/components/ui/button", "Button");
    const pad = "  ".repeat(indent);
    const variantProp = node.props.find((p) => p.shadcnProp === "variant");
    const sizeProp = node.props.find((p) => p.shadcnProp === "size");
    const roundProp = node.props.find((p) => p.shadcnProp === "roundness");
    const disabledProp = node.props.find((p) => p.shadcnProp === "disabled");
    const variant = (_a = variantProp == null ? void 0 : variantProp.value) != null ? _a : "default";
    const sizeVal = (_b = sizeProp == null ? void 0 : sizeProp.value) != null ? _b : "default";
    const round = (roundProp == null ? void 0 : roundProp.value) === "full";
    const disabled = (disabledProp == null ? void 0 : disabledProp.value) === "true";
    const variantAttr = variant !== "default" ? ` variant="${variant}"` : "";
    const disabledAttr = disabled ? " disabled" : "";
    const sizeClassMap = { large: "size-12", small: "size-8", mini: "size-6" };
    const sizeClass = (_c = sizeClassMap[sizeVal]) != null ? _c : "";
    const roundClass = round ? "rounded-full" : "";
    const classes = [sizeClass, roundClass].filter(Boolean).join(" ");
    const classAttr = classes ? ` className="${classes}"` : "";
    const iconName = (_d = findIconChild(node.children)) != null ? _d : "Plus";
    addImport(imports, "lucide-react", iconName);
    return `${pad}<Button size="icon"${variantAttr}${classAttr}${disabledAttr}><${iconName} className="size-4" /></Button>`;
  }
  function renderHoverCard(node, imports, indent) {
    var _a;
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add hover-card avatar");
    addImport(imports, "@/components/ui/hover-card", "HoverCard");
    addImport(imports, "@/components/ui/hover-card", "HoverCardContent");
    addImport(imports, "@/components/ui/hover-card", "HoverCardTrigger");
    addImport(imports, "@/components/ui/button", "Button");
    addImport(imports, "@/components/ui/avatar", "Avatar");
    addImport(imports, "@/components/ui/avatar", "AvatarFallback");
    addImport(imports, "@/components/ui/avatar", "AvatarImage");
    addImport(imports, "lucide-react", "CalendarDays");
    const children = Array.isArray(node.children) ? node.children : [];
    const texts = collectTexts(children);
    const trigger = (_a = texts[0]) != null ? _a : "@nextjs";
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const p3 = "  ".repeat(indent + 3);
    const p4 = "  ".repeat(indent + 4);
    return [
      `${pad}<HoverCard>`,
      `${p1}<HoverCardTrigger asChild>`,
      `${p2}<Button variant="link">${trigger}</Button>`,
      `${p1}</HoverCardTrigger>`,
      `${p1}<HoverCardContent className="w-80">`,
      `${p2}<div className="flex justify-between space-x-4">`,
      `${p3}<Avatar>`,
      `${p4}<AvatarImage src="https://github.com/vercel.png" />`,
      `${p4}<AvatarFallback>VC</AvatarFallback>`,
      `${p3}</Avatar>`,
      `${p3}<div className="space-y-1">`,
      `${p4}<h4 className="text-sm font-semibold">${trigger}</h4>`,
      `${p4}<p className="text-sm">The React Framework \u2013 created and maintained by @vercel.</p>`,
      `${p4}<div className="flex items-center pt-2">`,
      `${p4}  <CalendarDays className="mr-2 h-4 w-4 opacity-70" />`,
      `${p4}  <span className="text-xs text-muted-foreground">Joined December 2021</span>`,
      `${p4}</div>`,
      `${p3}</div>`,
      `${p2}</div>`,
      `${p1}</HoverCardContent>`,
      `${pad}</HoverCard>`
    ].join("\n");
  }
  function renderDrawer(_node, imports, indent) {
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add drawer");
    addImport(imports, "@/components/ui/button", "Button");
    addImport(imports, "@/components/ui/drawer", "Drawer");
    addImport(imports, "@/components/ui/drawer", "DrawerClose");
    addImport(imports, "@/components/ui/drawer", "DrawerContent");
    addImport(imports, "@/components/ui/drawer", "DrawerDescription");
    addImport(imports, "@/components/ui/drawer", "DrawerFooter");
    addImport(imports, "@/components/ui/drawer", "DrawerHeader");
    addImport(imports, "@/components/ui/drawer", "DrawerTitle");
    addImport(imports, "@/components/ui/drawer", "DrawerTrigger");
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const p3 = "  ".repeat(indent + 3);
    addImport(
      imports,
      PREAMBLE_KEY,
      `const DRAWER_SIDES = ["top", "right", "bottom", "left"] as const`
    );
    return [
      `${pad}<div className="flex flex-wrap gap-2">`,
      `${p1}{DRAWER_SIDES.map((side) => (`,
      `${p2}<Drawer`,
      `${p2}  key={side}`,
      `${p2}  direction={side === "bottom" ? undefined : (side as "top" | "right" | "left")}`,
      `${p2}>`,
      `${p3}<DrawerTrigger asChild>`,
      `${p3}  <Button variant="outline" className="capitalize">{side}</Button>`,
      `${p3}</DrawerTrigger>`,
      `${p3}<DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">`,
      `${p3}  <DrawerHeader>`,
      `${p3}    <DrawerTitle>Move Goal</DrawerTitle>`,
      `${p3}    <DrawerDescription>Set your daily activity goal.</DrawerDescription>`,
      `${p3}  </DrawerHeader>`,
      `${p3}  <div className="no-scrollbar overflow-y-auto px-4">`,
      `${p3}    {Array.from({ length: 5 }).map((_, i) => (`,
      `${p3}      <p key={i} className="mb-4 leading-normal">`,
      `${p3}        Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      `${p3}      </p>`,
      `${p3}    ))}`,
      `${p3}  </div>`,
      `${p3}  <DrawerFooter>`,
      `${p3}    <Button>Submit</Button>`,
      `${p3}    <DrawerClose asChild>`,
      `${p3}      <Button variant="outline">Cancel</Button>`,
      `${p3}    </DrawerClose>`,
      `${p3}  </DrawerFooter>`,
      `${p3}</DrawerContent>`,
      `${p2}</Drawer>`,
      `${p1}  ))}`,
      `${pad}</div>`
    ].join("\n");
  }
  function dialogImports(imports) {
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add dialog");
    addImport(imports, "@/components/ui/button", "Button");
    addImport(imports, "@/components/ui/dialog", "Dialog");
    addImport(imports, "@/components/ui/dialog", "DialogClose");
    addImport(imports, "@/components/ui/dialog", "DialogContent");
    addImport(imports, "@/components/ui/dialog", "DialogDescription");
    addImport(imports, "@/components/ui/dialog", "DialogFooter");
    addImport(imports, "@/components/ui/dialog", "DialogHeader");
    addImport(imports, "@/components/ui/dialog", "DialogTitle");
    addImport(imports, "@/components/ui/dialog", "DialogTrigger");
  }
  function renderDialog(_node, imports, indent) {
    dialogImports(imports);
    addImport(imports, "@/components/ui/field", "Field");
    addImport(imports, "@/components/ui/field", "FieldGroup");
    addImport(imports, "@/components/ui/input", "Input");
    addImport(imports, "@/components/ui/label", "Label");
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const p3 = "  ".repeat(indent + 3);
    return [
      `${pad}<Dialog>`,
      `${p1}<form>`,
      `${p2}<DialogTrigger asChild>`,
      `${p3}<Button variant="outline">Open Dialog</Button>`,
      `${p2}</DialogTrigger>`,
      `${p2}<DialogContent className="sm:max-w-sm">`,
      `${p3}<DialogHeader>`,
      `${p3}  <DialogTitle>Edit profile</DialogTitle>`,
      `${p3}  <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>`,
      `${p3}</DialogHeader>`,
      `${p3}<FieldGroup>`,
      `${p3}  <Field>`,
      `${p3}    <Label htmlFor="name">Name</Label>`,
      `${p3}    <Input id="name" name="name" defaultValue="Pedro Duarte" />`,
      `${p3}  </Field>`,
      `${p3}  <Field>`,
      `${p3}    <Label htmlFor="username">Username</Label>`,
      `${p3}    <Input id="username" name="username" defaultValue="@peduarte" />`,
      `${p3}  </Field>`,
      `${p3}</FieldGroup>`,
      `${p3}<DialogFooter>`,
      `${p3}  <DialogClose asChild>`,
      `${p3}    <Button variant="outline">Cancel</Button>`,
      `${p3}  </DialogClose>`,
      `${p3}  <Button type="submit">Save changes</Button>`,
      `${p3}</DialogFooter>`,
      `${p2}</DialogContent>`,
      `${p1}</form>`,
      `${pad}</Dialog>`
    ].join("\n");
  }
  function renderDialogHeader(node, imports, indent) {
    var _a;
    dialogImports(imports);
    const typeProp = node.props.find((p) => p.shadcnProp === "type");
    const type = (_a = typeProp == null ? void 0 : typeProp.value) != null ? _a : "header";
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    if (type === "close-only" || type === "icon-close") {
      addImport(imports, "lucide-react", "X");
      return [
        `${pad}<DialogHeader>`,
        `${p1}<DialogTitle>Dialog Title</DialogTitle>`,
        `${p1}<DialogClose asChild>`,
        `${p1}  <Button variant="ghost" size="icon" className="absolute right-4 top-4"><X className="h-4 w-4" /></Button>`,
        `${p1}</DialogClose>`,
        `${pad}</DialogHeader>`
      ].join("\n");
    }
    return [
      `${pad}<DialogHeader>`,
      `${p1}<DialogTitle>Dialog Title</DialogTitle>`,
      `${p1}<DialogDescription>Dialog description goes here.</DialogDescription>`,
      `${pad}</DialogHeader>`
    ].join("\n");
  }
  function renderDialogFooter(node, imports, indent) {
    var _a;
    dialogImports(imports);
    const typeProp = node.props.find((p) => p.shadcnProp === "type");
    const type = (_a = typeProp == null ? void 0 : typeProp.value) != null ? _a : "2-buttons-right";
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    if (type === "1-full-width") {
      return [
        `${pad}<DialogFooter>`,
        `${p1}<Button type="submit" className="w-full">Save changes</Button>`,
        `${pad}</DialogFooter>`
      ].join("\n");
    }
    if (type === "2-full-width") {
      return [
        `${pad}<DialogFooter className="flex-col gap-2 sm:flex-col">`,
        `${p1}<Button type="submit" className="w-full">Save changes</Button>`,
        `${p1}<DialogClose asChild>`,
        `${p1}  <Button variant="outline" className="w-full">Cancel</Button>`,
        `${p1}</DialogClose>`,
        `${pad}</DialogFooter>`
      ].join("\n");
    }
    return [
      `${pad}<DialogFooter>`,
      `${p1}<DialogClose asChild>`,
      `${p1}  <Button variant="outline">Cancel</Button>`,
      `${p1}</DialogClose>`,
      `${p1}<Button type="submit">Save changes</Button>`,
      `${pad}</DialogFooter>`
    ].join("\n");
  }
  function renderCommand(_node, imports, indent) {
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    const p3 = "  ".repeat(indent + 3);
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add command");
    addImport(imports, "lucide-react", "Calendar");
    addImport(imports, "lucide-react", "Smile");
    addImport(imports, "lucide-react", "Calculator");
    addImport(imports, "lucide-react", "User");
    addImport(imports, "lucide-react", "CreditCard");
    addImport(imports, "lucide-react", "Settings");
    addImport(imports, "@/components/ui/command", "Command");
    addImport(imports, "@/components/ui/command", "CommandEmpty");
    addImport(imports, "@/components/ui/command", "CommandGroup");
    addImport(imports, "@/components/ui/command", "CommandInput");
    addImport(imports, "@/components/ui/command", "CommandItem");
    addImport(imports, "@/components/ui/command", "CommandList");
    addImport(imports, "@/components/ui/command", "CommandSeparator");
    addImport(imports, "@/components/ui/command", "CommandShortcut");
    return [
      `${pad}<Command className="max-w-sm rounded-lg border">`,
      `${p1}<CommandInput placeholder="Type a command or search..." />`,
      `${p1}<CommandList>`,
      `${p2}<CommandEmpty>No results found.</CommandEmpty>`,
      `${p2}<CommandGroup heading="Suggestions">`,
      `${p3}<CommandItem><Calendar /><span>Calendar</span></CommandItem>`,
      `${p3}<CommandItem><Smile /><span>Search Emoji</span></CommandItem>`,
      `${p3}<CommandItem disabled><Calculator /><span>Calculator</span></CommandItem>`,
      `${p2}</CommandGroup>`,
      `${p2}<CommandSeparator />`,
      `${p2}<CommandGroup heading="Settings">`,
      `${p3}<CommandItem><User /><span>Profile</span><CommandShortcut>\u2318P</CommandShortcut></CommandItem>`,
      `${p3}<CommandItem><CreditCard /><span>Billing</span><CommandShortcut>\u2318B</CommandShortcut></CommandItem>`,
      `${p3}<CommandItem><Settings /><span>Settings</span><CommandShortcut>\u2318S</CommandShortcut></CommandItem>`,
      `${p2}</CommandGroup>`,
      `${p1}</CommandList>`,
      `${pad}</Command>`
    ].join("\n");
  }
  function renderCheckbox(node, imports, indent) {
    var _a;
    const pad = "  ".repeat(indent);
    const ip = "  ".repeat(indent + 1);
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add checkbox");
    addImport(imports, "@/components/ui/checkbox", "Checkbox");
    addImport(imports, "@/components/ui/field", "Field");
    addImport(imports, "@/components/ui/field", "FieldLabel");
    const children = Array.isArray(node.children) ? node.children : [];
    const label = (_a = collectTexts(children)[0]) != null ? _a : "Label";
    const id = toJsKey(label) + "-checkbox";
    const disabled = node.props.find((p) => p.shadcnProp === "disabled" && p.value === "true");
    const checked = node.props.find((p) => p.shadcnProp === "checked");
    const checkedAttr = (checked == null ? void 0 : checked.value) === "true" ? " defaultChecked" : (checked == null ? void 0 : checked.value) === "indeterminate" ? ` checked="indeterminate"` : "";
    const disabledAttr = disabled ? " disabled" : "";
    return [
      `${pad}<Field orientation="horizontal">`,
      `${ip}<Checkbox id="${id}" name="${id}"${checkedAttr}${disabledAttr} />`,
      `${ip}<FieldLabel htmlFor="${id}">${label}</FieldLabel>`,
      `${pad}</Field>`
    ].join("\n");
  }
  function renderCheckboxGroup(node, imports, indent) {
    const pad = "  ".repeat(indent);
    const p1 = "  ".repeat(indent + 1);
    const p2 = "  ".repeat(indent + 2);
    addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add checkbox");
    addImport(imports, "@/components/ui/checkbox", "Checkbox");
    addImport(imports, "@/components/ui/field", "Field");
    addImport(imports, "@/components/ui/field", "FieldGroup");
    addImport(imports, "@/components/ui/field", "FieldLabel");
    addImport(imports, "@/components/ui/field", "FieldLegend");
    addImport(imports, "@/components/ui/field", "FieldSet");
    const childCheckboxes = (Array.isArray(node.children) ? node.children : []).filter((c) => "component" in c && c.component === "Checkbox");
    const items = childCheckboxes.length > 0 ? childCheckboxes : [null, null, null];
    const fieldItems = items.map((child, i) => {
      var _a;
      const childTexts = child ? collectTexts(Array.isArray(child.children) ? child.children : []) : [];
      const label = (_a = childTexts[0]) != null ? _a : `Option ${i + 1}`;
      const id = toJsKey(label) + "-checkbox";
      const checked = child == null ? void 0 : child.props.find((p) => p.shadcnProp === "checked");
      const checkedAttr = (checked == null ? void 0 : checked.value) === "true" ? " defaultChecked" : "";
      return [
        `${p2}<Field orientation="horizontal">`,
        `${p2}  <Checkbox id="${id}" name="${id}"${checkedAttr} />`,
        `${p2}  <FieldLabel htmlFor="${id}" className="font-normal">${label}</FieldLabel>`,
        `${p2}</Field>`
      ].join("\n");
    }).join("\n");
    return [
      `${pad}<FieldSet>`,
      `${p1}<FieldLegend variant="label">Group label</FieldLegend>`,
      `${p1}<FieldGroup className="gap-3">`,
      fieldItems,
      `${p1}</FieldGroup>`,
      `${pad}</FieldSet>`
    ].join("\n");
  }
  function isButtonGroupContainer(node) {
    if (node.layout.direction !== "horizontal")
      return false;
    const mappedChildren = node.children.filter((c) => "component" in c);
    return mappedChildren.length >= 2 && mappedChildren.every((c) => c.component === "Button") && node.children.every((c) => "component" in c);
  }
  function renderButtonGroup(node, imports, indent) {
    const pad = "  ".repeat(indent);
    addImport(imports, "@/components/ui/button-group", "ButtonGroup");
    const buttonsJsx = node.children.map((c) => renderNode(c, imports, indent + 1)).filter(Boolean).join("\n");
    return `${pad}<ButtonGroup>
${buttonsJsx}
${pad}</ButtonGroup>`;
  }
  function renderAvatar(node, imports, indent) {
    var _a;
    const pad = "  ".repeat(indent);
    const ip = "  ".repeat(indent + 1);
    const children = Array.isArray(node.children) ? node.children : [];
    const texts = collectTexts(children);
    const fallback = (_a = texts[0]) != null ? _a : "??";
    addImport(imports, "@/components/ui/avatar", "Avatar");
    addImport(imports, "@/components/ui/avatar", "AvatarImage");
    addImport(imports, "@/components/ui/avatar", "AvatarFallback");
    return `${pad}<Avatar>
${ip}<AvatarImage src="" alt="" />
${ip}<AvatarFallback>${fallback}</AvatarFallback>
${pad}</Avatar>`;
  }
  function renderProps(props) {
    if (props.length === 0)
      return "";
    return " " + props.map(({ shadcnProp, value }) => {
      if (value === "true")
        return shadcnProp;
      if (value === "false")
        return ``;
      if (value === "default")
        return "";
      return `${shadcnProp}="${value}"`;
    }).filter(Boolean).join(" ");
  }
  function renderNode(node, imports, indent) {
    var _a, _b;
    const pad = "  ".repeat(indent);
    if ("isInlineText" in node) {
      return `${pad}${node.content}`;
    }
    if ("isIcon" in node) {
      const icon = node;
      addImport(imports, "lucide-react", icon.lucideName);
      return `${pad}<${icon.lucideName} size={${Math.max(icon.width, icon.height)}} className="shrink-0" />`;
    }
    if ("isText" in node) {
      const t = node;
      if (t.styleName) {
        addImport(imports, "@/components/ui/text", "Text");
        const decorCls = textDecorationClasses(t.align, t.color, t.uppercase);
        const variantAttr = ` variant="${t.styleName}"`;
        const clsAttr2 = decorCls ? ` className="${decorCls}"` : "";
        return `${pad}<Text${variantAttr}${clsAttr2}>${t.content}</Text>`;
      }
      const visualCls = textVisualClasses(t.align, t.color, t.uppercase);
      const boldCls = t.tag === "span" && t.bold ? "font-semibold" : "";
      const cls = [boldCls, visualCls].filter(Boolean).join(" ");
      return `${pad}<${t.tag}${cls ? ` className="${cls}"` : ""}>${t.content}</${t.tag}>`;
    }
    if ("isImage" in node) {
      const img = node;
      return `${pad}<img src="" alt="${img.name}" width={${img.width}} height={${img.height}} className="w-full object-cover" />`;
    }
    if ("isLayout" in node) {
      if (node.children.length === 1 && "isImage" in node.children[0]) {
        return renderNode(node.children[0], imports, indent);
      }
      if (isDataTableGrid(node)) {
        return renderDataTable(node, imports, indent);
      }
      if (isTableGrid(node)) {
        return renderTableGrid(node, imports, indent);
      }
      if (isAccordionContainer(node)) {
        return renderAccordion(node, imports, indent);
      }
      if (isButtonGroupContainer(node)) {
        return renderButtonGroup(node, imports, indent);
      }
      const otpSlots = node.children.filter(
        (c) => "component" in c && c.component === "__input_otp__"
      );
      if (otpSlots.length > 0 && otpSlots.length === node.children.length) {
        return renderInputOTPGroup(otpSlots, imports, indent);
      }
      const chartDescendant = findFirstChartNode(node.children);
      if (chartDescendant) {
        return renderNode(chartDescendant, imports, indent);
      }
      const layoutCls = layoutClasses(node.layout);
      const visualCls = visualClasses(node.visual);
      const cls = [layoutCls, visualCls].filter(Boolean).join(" ");
      const clsAttr2 = cls ? ` className="${cls}"` : "";
      const childrenStr = node.children.map((c) => renderNode(c, imports, indent + 1)).filter(Boolean).join("\n");
      if (!childrenStr)
        return "";
      return `${pad}<div${clsAttr2}>
${childrenStr}
${pad}</div>`;
    }
    const sn = node;
    if (sn.component === "__chart_bar__")
      return renderBarChart(sn, imports, indent);
    if (sn.component === "__chart_area__")
      return renderAreaChart(sn, imports, indent);
    if (sn.component === "__chart_line__")
      return renderLineChart(sn, imports, indent);
    if (sn.component === "Card") {
      return renderCard(sn, imports, indent);
    }
    if (sn.component === "Breadcrumb") {
      return renderBreadcrumb(sn, imports, indent);
    }
    if (sn.component === "AlertDialog") {
      return renderAlertDialog(sn, imports, indent);
    }
    if (sn.component === "Avatar") {
      return renderAvatar(sn, imports, indent);
    }
    if (sn.component === "__data_table_header__" || sn.component === "__data_table_cell__") {
      return renderDataTable(sn, imports, indent);
    }
    if (sn.component === "__date_picker__")
      return renderDatePickerSingle(imports, indent);
    if (sn.component === "__calendar__")
      return renderDatePicker(sn, imports, indent);
    if (sn.component === "__input__")
      return renderInput(sn, imports, indent);
    if (sn.component === "__input_decoration__")
      return renderInputDecoration(sn, imports, indent);
    if (sn.component === "__input_file__")
      return renderInputFile(sn, imports, indent);
    if (sn.component === "__input_otp__")
      return renderInputOTP(sn, imports, indent);
    if (sn.component === "__field_vertical__")
      return renderField(sn, imports, indent, "vertical");
    if (sn.component === "__field_horizontal__")
      return renderField(sn, imports, indent, "horizontal");
    if (sn.component === "__item__")
      return renderItem(sn, imports, indent);
    if (sn.component === "__empty__")
      return renderEmpty(sn, imports, indent);
    if (sn.component === "__navigation_menu__")
      return renderNavigationMenu(sn, imports, indent);
    if (sn.component === "__navigation_menu_content__") {
      const pad2 = "  ".repeat(indent);
      const p1 = "  ".repeat(indent + 1);
      const p2 = "  ".repeat(indent + 2);
      const p3 = "  ".repeat(indent + 3);
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add navigation-menu");
      addImport(imports, DIRECTIVE_KEY, '"use client"');
      addImport(imports, "@/components/ui/navigation-menu", "NavigationMenu");
      addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuList");
      addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuItem");
      addImport(imports, "@/components/ui/navigation-menu", "NavigationMenuTrigger");
      const items = (Array.isArray(sn.children) ? sn.children : []).filter((c) => "component" in c && c.component === "__menu_item__");
      const content = renderNavigationMenuContent(items, imports, indent + 3);
      return [
        `${pad2}<NavigationMenu>`,
        `${p1}<NavigationMenuList>`,
        `${p2}<NavigationMenuItem>`,
        `${p3}<NavigationMenuTrigger>Menu</NavigationMenuTrigger>`,
        content,
        `${p2}</NavigationMenuItem>`,
        `${p1}</NavigationMenuList>`,
        `${pad2}</NavigationMenu>`
      ].join("\n");
    }
    if (sn.component === "__menu_item__")
      return "";
    if (sn.component === "__loading_button__") {
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add button spinner");
      addImport(imports, "@/components/ui/button", "Button");
      addImport(imports, "@/components/ui/spinner", "Spinner");
      const size = (_a = sn.props.find((p) => p.shadcnProp === "size")) == null ? void 0 : _a.value;
      const sizeAttr = size ? ` size="${size}"` : "";
      const label = typeof sn.children === "string" ? sn.children : "Loading";
      return `${pad}<Button variant="outline"${sizeAttr} disabled>
${pad}  <Spinner data-icon="inline-start" />
${pad}  ${label}
${pad}</Button>`;
    }
    if (sn.component === "LinkButton") {
      addImport(imports, INSTALL_KEY, "pnpm dlx shadcn@latest add button");
      addImport(imports, "@/components/ui/button", "Button");
      const size = (_b = sn.props.find((p) => p.shadcnProp === "size")) == null ? void 0 : _b.value;
      const sizeAttr = size ? ` size="${size}"` : "";
      const label = typeof sn.children === "string" ? sn.children : "Link";
      return `${pad}<Button variant="link"${sizeAttr}>${label}</Button>`;
    }
    if (sn.component === "__icon_button__")
      return renderIconButton(sn, imports, indent);
    if (sn.component === "__hover_card__")
      return renderHoverCard(sn, imports, indent);
    if (sn.component === "__drawer__")
      return renderDrawer(sn, imports, indent);
    if (sn.component === "__dialog__")
      return renderDialog(sn, imports, indent);
    if (sn.component === "__dialog_header__")
      return renderDialogHeader(sn, imports, indent);
    if (sn.component === "__dialog_footer__")
      return renderDialogFooter(sn, imports, indent);
    if (sn.component === "__command__") {
      return renderCommand(sn, imports, indent);
    }
    if (sn.component === "Checkbox") {
      return renderCheckbox(sn, imports, indent);
    }
    if (sn.component === "__checkbox_group__") {
      return renderCheckboxGroup(sn, imports, indent);
    }
    const { component, importPath, props, children } = node;
    addImport(imports, importPath, component);
    const propsStr = renderProps(props);
    const clsAttr = "";
    if (typeof children === "string" && children) {
      return `${pad}<${component}${propsStr}${clsAttr}>${children}</${component}>`;
    }
    if (Array.isArray(children) && children.length > 0) {
      const childrenStr = children.map((c) => renderNode(c, imports, indent + 1)).join("\n");
      return `${pad}<${component}${propsStr}${clsAttr}>
${childrenStr}
${pad}</${component}>`;
    }
    return `${pad}<${component}${propsStr}${clsAttr} />`;
  }
  function generateJSX(tree) {
    const imports = /* @__PURE__ */ new Map();
    const rawJsx = renderNode(tree, imports, 0);
    const preambleStr = imports.get(PREAMBLE_KEY) ? Array.from(imports.get(PREAMBLE_KEY)).join("\n\n") : "";
    const install = imports.get(INSTALL_KEY) ? Array.from(imports.get(INSTALL_KEY)).join("\n") : "";
    const css = imports.get(CSS_KEY) ? Array.from(imports.get(CSS_KEY)).join("\n\n") : "";
    const jsx = [preambleStr, rawJsx].filter(Boolean).join("\n\n");
    const components = Array.from(new Set(
      Array.from(imports.entries()).filter(([p]) => !p.startsWith("__")).flatMap(([, names]) => Array.from(names))
    ));
    return { install, imports: renderImports(imports), css, jsx, components };
  }
  var PREAMBLE_KEY, INSTALL_KEY, CSS_KEY, DIRECTIVE_KEY, RAW_IMPORT_KEY, TABLE_CELL_COMPONENTS, DATA_TABLE_CELL_COMPONENTS, CHART_COMPONENT_PREFIX, CHART_MONTHS, CHART_VALUES, FALLBACK_SERIES, CHART_CSS_VARS;
  var init_jsx_generator = __esm({
    "src/lib/jsx-generator.ts"() {
      "use strict";
      init_tailwind_layout();
      PREAMBLE_KEY = "__preamble__";
      INSTALL_KEY = "__install__";
      CSS_KEY = "__css__";
      DIRECTIVE_KEY = "__directive__";
      RAW_IMPORT_KEY = "__raw_import__";
      TABLE_CELL_COMPONENTS = /* @__PURE__ */ new Set(["TableHead", "TableCell"]);
      DATA_TABLE_CELL_COMPONENTS = /* @__PURE__ */ new Set(["__data_table_header__", "__data_table_cell__"]);
      CHART_COMPONENT_PREFIX = "__chart_";
      CHART_MONTHS = ["January", "February", "March", "April", "May", "June"];
      CHART_VALUES = [
        [186, 305, 237, 73, 209, 214],
        [80, 200, 120, 190, 130, 140]
      ];
      FALLBACK_SERIES = ["desktop", "mobile"];
      CHART_CSS_VARS = `:root {
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}

.dark {
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
}`;
    }
  });

  // src/lib/html-generator.ts
  function isTableCellNode2(node) {
    return "component" in node && TABLE_CELL_COMPONENTS2.has(node.component);
  }
  function isTableGrid2(node) {
    return node.layout.direction === "grid" && node.layout.columns > 0 && node.children.some(isTableCellNode2);
  }
  function renderTableGrid2(node, indent) {
    const pad = "  ".repeat(indent);
    const { columns } = node.layout;
    const rows = [];
    for (let i = 0; i < node.children.length; i += columns) {
      rows.push(node.children.slice(i, i + columns));
    }
    const isAllHeads = (row) => row.every((c) => "component" in c && c.component === "TableHead");
    const headerRows = [];
    while (rows.length > 0 && isAllHeads(rows[0]))
      headerRows.push(rows.shift());
    const tableDef = HTML_MAP["Table"];
    const theadDef = HTML_MAP["TableHeader"];
    const tbodyDef = HTML_MAP["TableBody"];
    const trDef = HTML_MAP["TableRow"];
    const renderRow = (row, ri) => {
      const rp = "  ".repeat(ri);
      const trCls = trDef.getClasses({});
      const cells = row.map((c) => renderNode2(c, ri + 1)).join("\n");
      return `${rp}<tr class="${trCls}">
${cells}
${rp}</tr>`;
    };
    const parts = [];
    if (headerRows.length > 0) {
      const inner = headerRows.map((r) => renderRow(r, indent + 2)).join("\n");
      parts.push(`${pad}  <thead class="${theadDef.getClasses({})}">
${inner}
${pad}  </thead>`);
    }
    const bodyInner = rows.map((r) => renderRow(r, indent + 2)).join("\n");
    parts.push(`${pad}  <tbody class="${tbodyDef.getClasses({})}">
${bodyInner}
${pad}  </tbody>`);
    return `${pad}<table class="${tableDef.getClasses({})}">
${parts.join("\n")}
${pad}</table>`;
  }
  function renderNode2(node, indent) {
    const pad = "  ".repeat(indent);
    if ("isIcon" in node) {
      const icon = node;
      const size = Math.max(icon.width, icon.height);
      return `${pad}<!-- lucide: ${icon.lucideName} -->
${pad}<span class="inline-flex shrink-0 w-[${size}px] h-[${size}px]" aria-hidden="true"></span>`;
    }
    if ("isText" in node) {
      const t = node;
      if (t.styleName) {
        const decorCls = textDecorationClasses(t.align, t.color, t.uppercase);
        const cls2 = [t.styleName, decorCls].filter(Boolean).join(" ");
        return `${pad}<${t.tag} class="${cls2}">${t.content}</${t.tag}>`;
      }
      const visualCls = textVisualClasses(t.align, t.color, t.uppercase);
      const boldCls = t.tag === "span" && t.bold ? "font-semibold" : "";
      const cls = [boldCls, visualCls].filter(Boolean).join(" ");
      return `${pad}<${t.tag}${cls ? ` class="${cls}"` : ""}>${t.content}</${t.tag}>`;
    }
    if ("isImage" in node) {
      const img = node;
      return `${pad}<img src="" alt="${img.name}" width="${img.width}" height="${img.height}" class="w-full object-cover" />`;
    }
    if ("isLayout" in node) {
      if (node.children.length === 1 && "isImage" in node.children[0]) {
        return renderNode2(node.children[0], indent);
      }
      if (isTableGrid2(node)) {
        return renderTableGrid2(node, indent);
      }
      const layoutCls = layoutClasses(node.layout);
      const visualCls = visualClasses(node.visual);
      const cls = [layoutCls, visualCls].filter(Boolean).join(" ");
      const clsAttr = cls ? ` class="${cls}"` : "";
      const childrenStr = node.children.map((c) => renderNode2(c, indent + 1)).filter(Boolean).join("\n");
      if (!childrenStr)
        return "";
      return `${pad}<div${clsAttr}>
${childrenStr}
${pad}</div>`;
    }
    const { component, props, children } = node;
    const def = HTML_MAP[component];
    const propsMap = {};
    for (const p of props) {
      if (p.value && p.value !== "false")
        propsMap[p.shadcnProp] = p.value;
    }
    if (!def) {
      const childrenStr = Array.isArray(children) && children.length > 0 ? "\n" + children.map((c) => renderNode2(c, indent + 1)).join("\n") + "\n" + pad : typeof children === "string" ? children : "";
      return `${pad}<div data-component="${component}">${childrenStr}</div>`;
    }
    const classes = def.getClasses(propsMap);
    const tag = def.tag;
    const interactiveSuffix = def.interactive ? ` <!-- interactive: add JS -->` : "";
    if (def.selfClosing) {
      const type = tag === "input" && component === "Checkbox" ? ` type="checkbox"` : "";
      return `${pad}<${tag}${type} class="${classes}" />${interactiveSuffix}`;
    }
    if (typeof children === "string" && children) {
      return `${pad}<${tag} class="${classes}">${children}</${tag}>${interactiveSuffix}`;
    }
    if (Array.isArray(children) && children.length > 0) {
      const childrenStr = children.map((c) => renderNode2(c, indent + 1)).join("\n");
      return `${pad}<${tag} class="${classes}">
${childrenStr}
${pad}</${tag}>${interactiveSuffix}`;
    }
    return `${pad}<${tag} class="${classes}"></${tag}>${interactiveSuffix}`;
  }
  function generateHTML(tree) {
    return renderNode2(tree, 0);
  }
  var BASE_BTN, HTML_MAP, TABLE_CELL_COMPONENTS2;
  var init_html_generator = __esm({
    "src/lib/html-generator.ts"() {
      "use strict";
      init_tailwind_layout();
      BASE_BTN = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
      HTML_MAP = {
        Button: {
          tag: "button",
          getClasses: ({ variant = "default", size = "default" }) => {
            var _a, _b;
            const v = {
              default: "bg-primary text-primary-foreground hover:bg-primary/90",
              secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
              ghost: "hover:bg-accent hover:text-accent-foreground",
              destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              link: "text-primary underline-offset-4 hover:underline"
            };
            const s = {
              default: "h-10 px-4 py-2",
              sm: "h-9 rounded-md px-3",
              lg: "h-11 rounded-md px-8",
              icon: "h-10 w-10"
            };
            return `${BASE_BTN} ${(_a = v[variant]) != null ? _a : v.default} ${(_b = s[size]) != null ? _b : s.default}`;
          }
        },
        Badge: {
          tag: "span",
          getClasses: ({ variant = "default" }) => {
            var _a;
            const v = {
              default: "bg-primary text-primary-foreground hover:bg-primary/80",
              secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              outline: "text-foreground",
              destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80"
            };
            return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${(_a = v[variant]) != null ? _a : v.default}`;
          }
        },
        Input: {
          tag: "input",
          selfClosing: true,
          getClasses: () => "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        },
        Textarea: {
          tag: "textarea",
          getClasses: () => "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        },
        Label: {
          tag: "label",
          getClasses: () => "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        },
        Separator: {
          tag: "div",
          getClasses: ({ orientation = "horizontal" }) => orientation === "vertical" ? "shrink-0 bg-border w-[1px] h-full" : "shrink-0 bg-border h-[1px] w-full my-4"
        },
        Avatar: {
          tag: "span",
          getClasses: () => "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full"
        },
        Skeleton: {
          tag: "div",
          getClasses: () => "animate-pulse rounded-md bg-muted"
        },
        Card: {
          tag: "div",
          getClasses: () => "rounded-lg border bg-card text-card-foreground shadow-sm"
        },
        CardHeader: {
          tag: "div",
          getClasses: () => "flex flex-col space-y-1.5 p-6"
        },
        CardTitle: {
          tag: "h3",
          getClasses: () => "text-2xl font-semibold leading-none tracking-tight"
        },
        CardDescription: {
          tag: "p",
          getClasses: () => "text-sm text-muted-foreground"
        },
        CardContent: {
          tag: "div",
          getClasses: () => "p-6 pt-0"
        },
        CardFooter: {
          tag: "div",
          getClasses: () => "flex items-center p-6 pt-0"
        },
        Alert: {
          tag: "div",
          getClasses: ({ variant = "default" }) => {
            const base = "relative w-full rounded-lg border p-4";
            return variant === "destructive" ? `${base} border-destructive/50 text-destructive` : base;
          }
        },
        AlertTitle: {
          tag: "h5",
          getClasses: () => "mb-1 font-medium leading-none tracking-tight"
        },
        AlertDescription: {
          tag: "div",
          getClasses: () => "text-sm [&_p]:leading-relaxed"
        },
        Checkbox: {
          tag: "input",
          selfClosing: true,
          getClasses: () => "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        },
        Switch: {
          tag: "button",
          interactive: true,
          getClasses: () => "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        },
        Select: {
          tag: "select",
          interactive: true,
          getClasses: () => "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        },
        Progress: {
          tag: "div",
          getClasses: () => "relative h-4 w-full overflow-hidden rounded-full bg-secondary"
        },
        Tooltip: {
          tag: "div",
          interactive: true,
          getClasses: () => "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md"
        },
        Tabs: {
          tag: "div",
          interactive: true,
          getClasses: () => "w-full"
        },
        TabsList: {
          tag: "div",
          getClasses: () => "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
        },
        TabsTrigger: {
          tag: "button",
          getClasses: () => "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        },
        TabsContent: {
          tag: "div",
          getClasses: () => "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        },
        Table: {
          tag: "table",
          getClasses: () => "w-full caption-bottom text-sm"
        },
        TableHeader: {
          tag: "thead",
          getClasses: () => "[&_tr]:border-b"
        },
        TableBody: {
          tag: "tbody",
          getClasses: () => "[&_tr:last-child]:border-0"
        },
        TableFooter: {
          tag: "tfoot",
          getClasses: () => "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0"
        },
        TableRow: {
          tag: "tr",
          getClasses: () => "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
        },
        TableHead: {
          tag: "th",
          getClasses: () => "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
        },
        TableCell: {
          tag: "td",
          getClasses: () => "p-4 align-middle [&:has([role=checkbox])]:pr-0"
        },
        // Interactive-only stubs
        Dialog: {
          tag: "dialog",
          interactive: true,
          getClasses: () => "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg rounded-lg"
        },
        Sheet: {
          tag: "div",
          interactive: true,
          getClasses: () => "fixed inset-y-0 right-0 z-50 h-full w-3/4 gap-4 bg-background p-6 shadow-lg sm:max-w-sm"
        },
        DropdownMenu: {
          tag: "div",
          interactive: true,
          getClasses: () => "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        },
        NavigationMenu: {
          tag: "nav",
          interactive: true,
          getClasses: () => "relative z-10 flex max-w-max flex-1 items-center justify-center"
        }
      };
      TABLE_CELL_COMPONENTS2 = /* @__PURE__ */ new Set(["TableHead", "TableCell"]);
    }
  });

  // src/lib/token-diff.ts
  function tokensToSnapshot(tokens) {
    const snapshot = {};
    for (const t of tokens) {
      snapshot[t.cssVar] = __spreadValues({ light: t.light }, t.dark ? { dark: t.dark } : {});
    }
    return snapshot;
  }
  function saveSnapshot(tokens) {
    const snapshot = tokensToSnapshot(tokens);
    figma.root.setSharedPluginData(PLUGIN_NAMESPACE, SNAPSHOT_KEY, JSON.stringify(snapshot));
  }
  function loadSnapshot() {
    const raw = figma.root.getSharedPluginData(PLUGIN_NAMESPACE, SNAPSHOT_KEY);
    if (!raw)
      return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  function diffTokens(previous, current) {
    const changes = [];
    if (!previous) {
      return { changes: [], hasChanges: false, added: 0, removed: 0, changed: 0 };
    }
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(previous), ...Object.keys(current)]);
    for (const cssVar of allKeys) {
      const before = previous[cssVar];
      const after = current[cssVar];
      if (!before && after) {
        changes.push({ cssVar, type: "added", after });
      } else if (before && !after) {
        changes.push({ cssVar, type: "removed", before });
      } else if (before && after) {
        if (before.light !== after.light || before.dark !== after.dark) {
          changes.push({ cssVar, type: "changed", before, after });
        }
      }
    }
    const order = { changed: 0, added: 1, removed: 2 };
    changes.sort((a, b) => order[a.type] - order[b.type]);
    return {
      changes,
      hasChanges: changes.length > 0,
      added: changes.filter((c) => c.type === "added").length,
      removed: changes.filter((c) => c.type === "removed").length,
      changed: changes.filter((c) => c.type === "changed").length
    };
  }
  function generatePatch(diff) {
    var _a;
    if (!diff.hasChanges)
      return "";
    const lines = [];
    const changed = diff.changes.filter((c) => c.type === "changed" || c.type === "added");
    const removed = diff.changes.filter((c) => c.type === "removed");
    if (changed.length > 0) {
      lines.push("/* Updated/Added tokens */");
      lines.push(":root {");
      for (const c of changed) {
        if (c.type === "changed" && c.before) {
          lines.push(`  /* was: ${c.before.light} */`);
        }
        lines.push(`  ${c.cssVar}: ${c.after.light};`);
      }
      lines.push("}");
      const darkChanged = changed.filter((c) => {
        var _a2;
        return (_a2 = c.after) == null ? void 0 : _a2.dark;
      });
      if (darkChanged.length > 0) {
        lines.push('\n[data-theme="dark"] {');
        for (const c of darkChanged) {
          if (c.type === "changed" && ((_a = c.before) == null ? void 0 : _a.dark)) {
            lines.push(`  /* was: ${c.before.dark} */`);
          }
          lines.push(`  ${c.cssVar}: ${c.after.dark};`);
        }
        lines.push("}");
      }
    }
    if (removed.length > 0) {
      lines.push("\n/* Removed tokens \u2014 delete these from your globals.css */");
      for (const c of removed) {
        lines.push(`/* ${c.cssVar}: ${c.before.light}; */`);
      }
    }
    return lines.join("\n");
  }
  var PLUGIN_NAMESPACE, SNAPSHOT_KEY;
  var init_token_diff = __esm({
    "src/lib/token-diff.ts"() {
      "use strict";
      PLUGIN_NAMESPACE = "figma_handoff";
      SNAPSHOT_KEY = "token-snapshot";
    }
  });

  // src/lib/theme-builder.ts
  function hexToHsl(hex) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3)
      hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }
  function hslString(h, s, l) {
    return `${h} ${s}% ${l}%`;
  }
  function generateScale(hex) {
    const [h, s] = hexToHsl(hex);
    const scale = {};
    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      const l = SCALE_LIGHTNESS[step];
      const adjS = Math.min(100, Math.round(s * SCALE_SATURATION_FACTOR[step]));
      scale[step] = hslString(h, adjS, l);
    }
    return scale;
  }
  function generateNeutralScale(preset) {
    const h = NEUTRAL_HUE[preset];
    const s = NEUTRAL_SATURATION[preset];
    const scale = {};
    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      const l = SCALE_LIGHTNESS[step];
      scale[step] = hslString(h, s, l);
    }
    return scale;
  }
  function buildTheme(config) {
    const brandScale = generateScale(config.brandHex);
    const neutralScale = generateNeutralScale(config.neutralPreset);
    const light = {
      "--background": neutralScale[50],
      "--foreground": neutralScale[950],
      "--card": neutralScale[50],
      "--card-foreground": neutralScale[950],
      "--popover": neutralScale[50],
      "--popover-foreground": neutralScale[950],
      "--primary": neutralScale[900],
      "--primary-foreground": neutralScale[50],
      "--secondary": neutralScale[100],
      "--secondary-foreground": neutralScale[900],
      "--muted": neutralScale[100],
      "--muted-foreground": neutralScale[500],
      "--accent": brandScale[100],
      "--accent-foreground": brandScale[900],
      "--destructive": "0 84% 60%",
      "--destructive-foreground": neutralScale[50],
      "--border": neutralScale[200],
      "--input": neutralScale[200],
      "--ring": brandScale[500]
    };
    const dark = {
      "--background": neutralScale[950],
      "--foreground": neutralScale[50],
      "--card": neutralScale[900],
      "--card-foreground": neutralScale[50],
      "--popover": neutralScale[900],
      "--popover-foreground": neutralScale[50],
      "--primary": neutralScale[50],
      "--primary-foreground": neutralScale[900],
      "--secondary": neutralScale[800],
      "--secondary-foreground": neutralScale[50],
      "--muted": neutralScale[800],
      "--muted-foreground": neutralScale[400],
      "--accent": brandScale[900],
      "--accent-foreground": brandScale[100],
      "--destructive": "0 72% 51%",
      "--destructive-foreground": neutralScale[50],
      "--border": neutralScale[800],
      "--input": neutralScale[800],
      "--ring": brandScale[400]
    };
    const indent = "    ";
    const toVarLines = (vars) => Object.entries(vars).map(([k, v]) => `${indent}${k}: ${v};`).join("\n");
    const scaleBlock = (name, scale) => `  /* ${name} */
` + Object.entries(scale).map(([step, val]) => `  --${name}-${step}: ${val};`).join("\n");
    const css = [
      `@layer base {`,
      `  :root {`,
      toVarLines(light),
      `  }`,
      ``,
      `  .dark {`,
      toVarLines(dark),
      `  }`,
      ``,
      scaleBlock("brand-shades", brandScale),
      ``,
      scaleBlock("brand-neutrals", neutralScale),
      `}`
    ].join("\n");
    return { brandScale, neutralScale, css, config };
  }
  var SCALE_LIGHTNESS, SCALE_SATURATION_FACTOR, NEUTRAL_HUE, NEUTRAL_SATURATION;
  var init_theme_builder = __esm({
    "src/lib/theme-builder.ts"() {
      "use strict";
      SCALE_LIGHTNESS = {
        50: 97,
        100: 94,
        200: 86,
        300: 74,
        400: 62,
        500: 50,
        600: 40,
        700: 32,
        800: 24,
        900: 16,
        950: 11
      };
      SCALE_SATURATION_FACTOR = {
        50: 0.3,
        100: 0.5,
        200: 0.7,
        300: 0.85,
        400: 0.95,
        500: 1,
        600: 0.95,
        700: 0.88,
        800: 0.8,
        900: 0.7,
        950: 0.6
      };
      NEUTRAL_HUE = {
        slate: 215,
        gray: 220,
        zinc: 240,
        stone: 25,
        neutral: 0
      };
      NEUTRAL_SATURATION = {
        slate: 16,
        gray: 9,
        zinc: 5,
        stone: 6,
        neutral: 0
      };
    }
  });

  // components.json
  var components_default;
  var init_components = __esm({
    "components.json"() {
      components_default = {
        Button: {
          import: "@/components/ui/button",
          props: {
            Variant: {
              prop: "variant",
              values: {
                Primary: "default",
                Secondary: "secondary",
                Outline: "outline",
                Ghost: "ghost",
                Destructive: "destructive",
                "Ghost Inactive": "ghost"
              }
            },
            Size: {
              prop: "size",
              values: {
                Default: "default",
                Small: "sm",
                Mini: "sm",
                Large: "lg",
                "Extra Small": "sm"
              }
            }
          },
          defaults: {
            variant: "default",
            size: "default"
          },
          booleans: {
            State: {
              Disabled: "disabled"
            }
          },
          children: "Label"
        },
        "Accordion Trigger": {
          component: "AccordionTrigger",
          import: "@/components/ui/accordion",
          children: "Accordion label"
        },
        Badge: {
          import: "@/components/ui/badge",
          props: {
            Variant: {
              prop: "variant",
              values: {
                Primary: "default",
                Default: "default",
                Secondary: "secondary",
                Destructive: "destructive",
                Outline: "outline"
              }
            }
          },
          defaults: {
            variant: "default"
          },
          children: "Label"
        },
        Input: {
          import: "@/components/ui/input",
          booleans: {
            State: {
              Disabled: "disabled"
            }
          }
        },
        Textarea: {
          import: "@/components/ui/textarea",
          booleans: {
            State: {
              Disabled: "disabled"
            }
          }
        },
        Checkbox: {
          import: "@/components/ui/checkbox",
          booleans: {
            "Checked?": {
              True: "defaultChecked"
            },
            State: {
              Disabled: "disabled"
            }
          }
        },
        Switch: {
          import: "@/components/ui/switch",
          booleans: {
            State: {
              Disabled: "disabled"
            },
            Checked: {
              True: "defaultChecked"
            }
          }
        },
        "Select & Combobox": {
          component: "Select",
          import: "@/components/ui/select",
          booleans: {
            State: {
              Disabled: "disabled"
            }
          }
        },
        Avatar: {
          import: "@/components/ui/avatar"
        },
        Alert: {
          import: "@/components/ui/alert",
          props: {
            Type: {
              prop: "variant",
              values: {
                Neutral: "default",
                Default: "default",
                Error: "destructive",
                Destructive: "destructive",
                Warning: "default",
                Success: "default",
                Info: "default"
              }
            }
          },
          defaults: {
            variant: "default"
          },
          children: "Line 1"
        },
        "Input OTP": {
          component: "InputOTP",
          import: "@/components/ui/input-otp",
          booleans: {
            State: {
              Disabled: "disabled"
            }
          }
        },
        Separator: {
          import: "@/components/ui/separator",
          props: {
            Orientation: "orientation"
          },
          defaults: {
            orientation: "horizontal"
          }
        },
        Label: {
          import: "@/components/ui/label"
        },
        Skeleton: {
          import: "@/components/ui/skeleton"
        },
        Sonner: {
          import: "@/components/ui/sonner"
        },
        Tabs: {
          import: "@/components/ui/tabs"
        },
        Breadcrumb: {
          import: "@/components/ui/breadcrumb"
        },
        "Button Group": {
          component: "ButtonGroup",
          import: "@/components/ui/button-group",
          props: {
            Skin: {
              prop: "variant",
              values: {
                Outlined: "outline",
                Default: "default",
                Ghost: "ghost",
                Destructive: "destructive"
              }
            },
            Size: {
              prop: "size",
              values: {
                Default: "default",
                Small: "sm",
                Mini: "sm",
                Large: "lg"
              }
            }
          },
          defaults: {
            variant: "outline",
            size: "default"
          },
          booleans: {
            State: {
              Disabled: "disabled"
            }
          },
          children: "Label"
        },
        Card: {
          import: "@/components/ui/card"
        },
        "Alert Dialog": {
          component: "AlertDialog",
          import: "@/components/ui/alert-dialog"
        },
        Dialog: {
          import: "@/components/ui/dialog"
        },
        Drawer: {
          import: "@/components/ui/drawer"
        },
        Sheet: {
          import: "@/components/ui/sheet"
        },
        "Toggle Button": {
          component: "Toggle",
          import: "@/components/ui/toggle",
          props: {
            Skin: {
              prop: "variant",
              values: {
                Ghost: "default",
                Outlined: "outline",
                Default: "default"
              }
            },
            Size: {
              prop: "size",
              values: {
                Default: "default",
                Small: "sm",
                Mini: "sm",
                Large: "lg"
              }
            }
          },
          defaults: {
            variant: "default",
            size: "default"
          },
          booleans: {
            "Active?": {
              Yes: "defaultPressed"
            },
            State: {
              Disabled: "disabled"
            }
          },
          children: "Label"
        },
        "Toggle Icon Button": {
          component: "Toggle",
          import: "@/components/ui/toggle",
          props: {
            Skin: {
              prop: "variant",
              values: {
                Ghost: "default",
                Outlined: "outline",
                Default: "default"
              }
            },
            Size: {
              prop: "size",
              values: {
                Default: "default",
                Small: "sm",
                Mini: "sm",
                Large: "lg"
              }
            }
          },
          defaults: {
            variant: "default",
            size: "default"
          },
          booleans: {
            "Active?": {
              Yes: "defaultPressed"
            },
            State: {
              Disabled: "disabled"
            }
          }
        },
        Tooltip: {
          component: "TooltipContent",
          import: "@/components/ui/tooltip",
          props: {
            Side: {
              prop: "side",
              values: {
                Top: "top",
                Right: "right",
                Bottom: "bottom",
                Left: "left"
              }
            }
          },
          defaults: {
            side: "top"
          },
          children: "Tooltip text"
        },
        "Navigation Menu": {
          component: "NavigationMenu",
          import: "@/components/ui/navigation-menu"
        },
        Pagination: {
          import: "@/components/ui/pagination"
        },
        Popover: {
          import: "@/components/ui/popover"
        },
        "Popover Content": {
          component: "PopoverContent",
          import: "@/components/ui/popover"
        },
        Progress: {
          import: "@/components/ui/progress",
          props: {
            Progress: "value"
          },
          defaults: {
            value: "0"
          }
        },
        DropdownMenu: {
          import: "@/components/ui/dropdown-menu"
        }
      };
    }
  });

  // src/code.ts
  var require_code = __commonJS({
    "src/code.ts"(exports) {
      init_resolve();
      init_transform();
      init_generate();
      init_tailwind();
      init_jsx();
      init_frame_scanner();
      init_jsx_generator();
      init_html_generator();
      init_token_diff();
      init_theme_builder();
      init_components();
      figma.showUI(__html__, { width: 360, height: 500, title: "Figma Handoff" });
      function collectVariables() {
        return __async(this, null, function* () {
          const collections = {};
          const variables = {};
          for (const v of yield figma.variables.getLocalVariablesAsync()) {
            variables[v.id] = {
              id: v.id,
              name: v.name,
              resolvedType: v.resolvedType,
              variableCollectionId: v.variableCollectionId,
              valuesByMode: v.valuesByMode
            };
            if (!collections[v.variableCollectionId]) {
              const col = yield figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
              if (col) {
                collections[col.id] = {
                  id: col.id,
                  name: col.name,
                  modes: col.modes,
                  defaultModeId: col.defaultModeId,
                  variableIds: col.variableIds
                };
              }
            }
          }
          return { collections, variables };
        });
      }
      function buildTokens(collections, variables) {
        const cssVarNames = /* @__PURE__ */ new Map();
        for (const v of Object.values(variables)) {
          const col = collections[v.variableCollectionId];
          if (!col)
            continue;
          cssVarNames.set(v.id, toCssVarName(col.name, v.name));
        }
        const tokens = [];
        for (const col of Object.values(collections)) {
          const [lightModeId, darkModeId] = col.modes.map((m) => m.modeId);
          for (const variableId of col.variableIds) {
            const variable = variables[variableId];
            if (!variable || variable.resolvedType === "BOOLEAN")
              continue;
            const cssVar = toCssVarName(col.name, variable.name);
            const rawLight = variable.valuesByMode[lightModeId];
            const rawDark = darkModeId ? variable.valuesByMode[darkModeId] : void 0;
            const resolvedLight = resolveValue(rawLight, lightModeId, variables);
            const resolvedDark = rawDark ? resolveValue(rawDark, darkModeId, variables) : void 0;
            tokens.push({
              cssVar,
              light: toCssValue(resolvedLight, cssVarNames),
              dark: resolvedDark ? toCssValue(resolvedDark, cssVarNames) : void 0,
              collection: col.name
            });
          }
        }
        return tokens;
      }
      function buildDraftEntry(componentName, defs) {
        var _a, _b;
        const props = {};
        const options = {};
        const defaults = {};
        const booleans = {};
        let children;
        for (const [rawKey, def] of Object.entries(defs)) {
          const key = rawKey.replace(/#[\d:]+$/, "");
          if (def.type === "VARIANT") {
            const opts = (_a = def.variantOptions) != null ? _a : [];
            if (key.toLowerCase() === "state") {
              const stateMap = {};
              for (const opt of opts) {
                const lo = opt.toLowerCase();
                if (lo !== "default" && lo !== "normal" && lo !== "rest") {
                  stateMap[opt] = lo;
                }
              }
              if (Object.keys(stateMap).length > 0)
                booleans[key] = stateMap;
            } else {
              const propName = key.toLowerCase();
              props[key] = propName;
              if (opts.length > 0)
                options[key] = opts;
              const defaultOpt = (_b = opts.find((v) => v.toLowerCase() === "default")) != null ? _b : opts[0];
              if (defaultOpt)
                defaults[propName] = defaultOpt.toLowerCase();
            }
          } else if (def.type === "TEXT" && !children) {
            children = key;
          }
        }
        return __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
          import: `@/components/ui/${componentName.toLowerCase().replace(/\s+/g, "-")}`
        }, Object.keys(props).length > 0 && { props }), Object.keys(options).length > 0 && { options }), Object.keys(defaults).length > 0 && { defaults }), Object.keys(booleans).length > 0 && { booleans }), children && { children });
      }
      function buildPropertyList(defs, currentValues) {
        return Object.entries(defs).map(([rawKey, def]) => {
          var _a;
          const key = rawKey.replace(/#[\d:]+$/, "");
          const instanceKey = Object.keys(currentValues).find(
            (k) => k.replace(/#[\d:]+$/, "") === key
          );
          const current = instanceKey ? currentValues[instanceKey] : null;
          return {
            name: key,
            type: def.type,
            options: (_a = def.variantOptions) != null ? _a : [],
            currentValue: current ? current.value : ""
          };
        });
      }
      function getComponentInfo(node) {
        return __async(this, null, function* () {
          var _a, _b, _c, _d;
          let componentName;
          let defs;
          let currentValues = {};
          if (node.type === "INSTANCE") {
            const main = yield node.getMainComponentAsync();
            if (!main)
              return null;
            const parent = main.parent;
            const isSet = (parent == null ? void 0 : parent.type) === "COMPONENT_SET";
            componentName = isSet ? parent.name : main.name;
            const source = isSet ? parent : main;
            defs = (_a = source.componentPropertyDefinitions) != null ? _a : {};
            currentValues = node.componentProperties;
          } else if (node.type === "COMPONENT_SET") {
            componentName = node.name;
            defs = (_b = node.componentPropertyDefinitions) != null ? _b : {};
          } else if (node.type === "COMPONENT") {
            const parent = node.parent;
            if ((parent == null ? void 0 : parent.type) === "COMPONENT_SET") {
              componentName = parent.name;
              defs = (_c = parent.componentPropertyDefinitions) != null ? _c : {};
            } else {
              componentName = node.name;
              defs = (_d = node.componentPropertyDefinitions) != null ? _d : {};
            }
          } else {
            return null;
          }
          const properties = buildPropertyList(defs, currentValues);
          const draftEntry = buildDraftEntry(componentName, defs);
          const draft = JSON.stringify({ [componentName]: draftEntry }, null, 2);
          return { componentName, figmaNodeName: node.name, properties, draft };
        });
      }
      figma.ui.onmessage = (msg) => __async(exports, null, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i;
        if (msg.type === "EXPORT_TOKENS") {
          try {
            const { collections, variables } = yield collectVariables();
            const tokens = buildTokens(collections, variables);
            const css = generateCss(tokens);
            const previous = loadSnapshot();
            const current = tokensToSnapshot(tokens);
            const diff = diffTokens(previous, current);
            const patch = generatePatch(diff);
            saveSnapshot(tokens);
            figma.ui.postMessage({
              type: "TOKENS_CSS",
              css,
              count: tokens.length,
              diff,
              patch
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
            const { collections, variables } = yield collectVariables();
            const classes = yield getTailwindClasses(node, variables, collections);
            let jsxResult = null;
            let htmlResult = null;
            let unmappedComponent = null;
            if (node.type === "FRAME" || node.type === "GROUP") {
              const tree = yield scanFrame(node);
              jsxResult = generateJSX(tree);
              htmlResult = generateHTML(tree);
            } else if (node.type === "TEXT") {
              const scanned = yield scanNode(node);
              if (scanned) {
                jsxResult = generateJSX(scanned);
                htmlResult = generateHTML(scanned);
              }
            } else if (node.type === "INSTANCE") {
              const scanned = yield scanNode(node);
              if (scanned) {
                jsxResult = generateJSX(scanned);
                htmlResult = generateHTML(scanned);
              } else {
                const legacyResult = yield generateJsx(node, components_default);
                if (legacyResult) {
                  jsxResult = {
                    imports: legacyResult.importLine,
                    jsx: legacyResult.jsx,
                    components: []
                  };
                } else {
                  const main = yield node.getMainComponentAsync();
                  unmappedComponent = ((_a = main == null ? void 0 : main.parent) == null ? void 0 : _a.type) === "COMPONENT_SET" ? main.parent.name : (_b = main == null ? void 0 : main.name) != null ? _b : node.name;
                }
              }
            }
            figma.ui.postMessage({
              type: "TAILWIND_RESULT",
              classes,
              nodeName: node.name,
              jsxResult,
              htmlResult,
              unmappedComponent
            });
          } catch (err) {
            figma.ui.postMessage({ type: "ERROR", message: String(err) });
          }
        }
        if (msg.type === "GET_TEXT_COMPONENT") {
          try {
            const styles = yield figma.getLocalTextStylesAsync();
            const entries = [];
            const SIZE_MAP2 = {
              12: "text-xs",
              14: "text-sm",
              16: "text-base",
              18: "text-lg",
              20: "text-xl",
              24: "text-2xl",
              30: "text-3xl",
              36: "text-4xl",
              48: "text-5xl",
              60: "text-6xl",
              72: "text-7xl"
            };
            const WEIGHT_MAP = {
              100: "font-thin",
              200: "font-extralight",
              300: "font-light",
              400: "font-normal",
              500: "font-medium",
              600: "font-semibold",
              700: "font-bold",
              800: "font-extrabold",
              900: "font-black"
            };
            for (const style of styles) {
              const variant = style.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
              const cls = [];
              const fs = (_c = style.fontSize) != null ? _c : 16;
              cls.push((_d = SIZE_MAP2[Math.round(fs)]) != null ? _d : `text-[${Math.round(fs)}px]`);
              if (typeof style.fontWeight === "number") {
                const w = WEIGHT_MAP[style.fontWeight];
                if (w && w !== "font-normal")
                  cls.push(w);
              }
              const lh = style.lineHeight;
              if (lh && lh.unit !== "AUTO") {
                const ratio = lh.unit === "PIXELS" ? lh.value / fs : lh.value / 100;
                const LEADING = [
                  [1, "leading-none"],
                  [1.25, "leading-tight"],
                  [1.375, "leading-snug"],
                  [1.5, "leading-normal"],
                  [1.625, "leading-relaxed"],
                  [2, "leading-loose"]
                ];
                const match = LEADING.find(([v]) => Math.abs(ratio - v) < 0.05);
                cls.push(match ? match[1] : `leading-[${+ratio.toFixed(3)}]`);
              }
              const ls = style.letterSpacing;
              if (ls && typeof ls.value === "number" && ls.value !== 0) {
                const em = ls.unit === "PIXELS" ? ls.value / fs : ls.value / 100;
                const TRACKING = [
                  [-0.05, "tracking-tighter"],
                  [-0.025, "tracking-tight"],
                  [0.025, "tracking-wide"],
                  [0.05, "tracking-wider"],
                  [0.1, "tracking-widest"]
                ];
                const match = TRACKING.find(([v]) => Math.abs(em - v) < 0.01);
                cls.push(match ? match[1] : `tracking-[${+em.toFixed(4)}em]`);
              }
              const tag = variant.startsWith("heading-1") ? "h1" : variant.startsWith("heading-2") ? "h2" : variant.startsWith("heading-3") ? "h3" : variant.startsWith("heading-4") ? "h4" : variant.startsWith("caption") ? "span" : variant.includes("mono") ? "code" : "p";
              entries.push({ variant, tag, classes: cls.join(" ") });
            }
            const mode = msg.mode;
            let component;
            if (mode === "css") {
              component = entries.map(
                (e) => `.${e.variant} {
  @apply ${e.classes};
}`
              ).join("\n\n");
            } else {
              const variantType = entries.map((e) => `"${e.variant}"`).join(" | ");
              const variantMap = entries.map((e) => `  "${e.variant}": "${e.classes}",`).join("\n");
              const tagMap = entries.map((e) => `  "${e.variant}": "${e.tag}",`).join("\n");
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
            let hslToRgba2 = function(hsl) {
              const parts = hsl.trim().split(/\s+/);
              const h = parseFloat(parts[0]) / 360;
              const s = parseFloat(parts[1]) / 100;
              const l = parseFloat(parts[2]) / 100;
              function hue2rgb(p2, q2, t) {
                if (t < 0)
                  t += 1;
                if (t > 1)
                  t -= 1;
                if (t < 1 / 6)
                  return p2 + (q2 - p2) * 6 * t;
                if (t < 1 / 2)
                  return q2;
                if (t < 2 / 3)
                  return p2 + (q2 - p2) * (2 / 3 - t) * 6;
                return p2;
              }
              if (s === 0)
                return { r: l, g: l, b: l, a: 1 };
              const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
              const p = 2 * l - q;
              return { r: hue2rgb(p, q, h + 1 / 3), g: hue2rgb(p, q, h), b: hue2rgb(p, q, h - 1 / 3), a: 1 };
            };
            var hslToRgba = hslToRgba2;
            const config = msg.config;
            const theme = buildTheme(config);
            const collections = yield figma.variables.getLocalVariableCollectionsAsync();
            const existingColl = collections.find((c) => c.name === "brand colors");
            let coll;
            if (existingColl) {
              coll = existingColl;
            } else {
              coll = figma.variables.createVariableCollection("brand colors");
              coll.renameMode(coll.modes[0].modeId, "light");
              coll.addMode("dark");
            }
            const lightModeId = (_f = (_e = coll.modes.find((m) => m.name === "light")) == null ? void 0 : _e.modeId) != null ? _f : coll.modes[0].modeId;
            const darkModeId = (_i = (_g = coll.modes.find((m) => m.name === "dark")) == null ? void 0 : _g.modeId) != null ? _i : (_h = coll.modes[1]) == null ? void 0 : _h.modeId;
            function upsertColorVar(name, lightHsl, darkHsl) {
              return __async(this, null, function* () {
                const allVars = yield figma.variables.getLocalVariablesAsync();
                let variable = allVars.find((v) => v.name === name && v.variableCollectionId === coll.id);
                if (!variable) {
                  variable = figma.variables.createVariable(name, coll, "COLOR");
                }
                variable.setValueForMode(lightModeId, hslToRgba2(lightHsl));
                if (darkModeId) {
                  variable.setValueForMode(darkModeId, hslToRgba2(darkHsl));
                }
              });
            }
            for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
              const hsl = theme.brandScale[step];
              yield upsertColorVar(`brand-shades/${step}`, hsl, hsl);
            }
            for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
              const hsl = theme.neutralScale[step];
              yield upsertColorVar(`brand-neutrals/${step}`, hsl, hsl);
            }
            figma.ui.postMessage({ type: "THEME_APPLIED", success: true });
          } catch (err) {
            figma.ui.postMessage({ type: "THEME_APPLIED", success: false, error: String(err) });
          }
        }
      });
      figma.on("selectionchange", () => __async(exports, null, function* () {
        var _a, _b;
        const node = figma.currentPage.selection[0];
        let componentInfo = null;
        const devTypes = ["INSTANCE", "COMPONENT", "COMPONENT_SET"];
        if (node && devTypes.includes(node.type)) {
          componentInfo = yield getComponentInfo(node).catch(() => null);
        }
        figma.ui.postMessage({
          type: "SELECTION_CHANGE",
          hasSelection: !!node,
          nodeName: (_a = node == null ? void 0 : node.name) != null ? _a : "",
          nodeType: (_b = node == null ? void 0 : node.type) != null ? _b : "",
          componentInfo
        });
      }));
    }
  });
  require_code();
})();
