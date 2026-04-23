"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
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
  function toCssVarName(collection, path) {
    const col = collection.toLowerCase().trim();
    const parts = path.split("/").map((p) => p.trim().toLowerCase().replace(/\s+/g, "-"));
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
    if (col === "spacing")
      return `--spacing-${parts.join("-")}`;
    if (col === "typography")
      return `--typography-${parts.join("-")}`;
    if (col === "shadows")
      return `--shadow-${parts.join("-")}`;
    const slug = col.replace(/\s+/g, "-");
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
      return String(value);
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
  function generateCss(tokens) {
    const themeLines = tokens.map((t) => `  ${t.cssVar}: ${t.light};`).join("\n");
    const darkTokens = tokens.filter((t) => t.dark !== void 0);
    let css = `@theme {
${themeLines}
}`;
    if (darkTokens.length > 0) {
      const darkLines = darkTokens.map((t) => `  ${t.cssVar}: ${t.dark};`).join("\n");
      css += `

[data-theme="dark"] {
${darkLines}
}`;
    }
    return css;
  }
  var init_generate = __esm({
    "src/lib/generate.ts"() {
      "use strict";
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
    const boundVars = node.boundVariables;
    const bound = boundVars == null ? void 0 : boundVars[property];
    if (bound) {
      const entry = Array.isArray(bound) ? bound[0] : bound;
      if ((entry == null ? void 0 : entry.type) === "VARIABLE_ALIAS") {
        const v = variables[entry.id];
        const col = v && collections[v.variableCollectionId];
        if (v && col) {
          const cssVar = toCssVarName(col.name, v.name);
          return `${prefix}-[var(${cssVar})]`;
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
  }
  function getTailwindClasses(node, variables, collections) {
    var _a, _b;
    const cls = [];
    if (node.type === "TEXT") {
      const color = resolveColorClass(node, "fills", "text", variables, collections);
      if (color)
        cls.push(color);
      if (typeof node.fontSize === "number") {
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
        cls.push((_a = SIZE[Math.round(node.fontSize)]) != null ? _a : `text-[${Math.round(node.fontSize)}px]`);
      }
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
    const bg = resolveColorClass(node, "fills", "bg", variables, collections);
    if (bg)
      cls.push(bg);
    const strokes = node.strokes;
    if (Array.isArray(strokes) && strokes.length > 0) {
      cls.push("border");
      const borderColor = resolveColorClass(node, "strokes", "border", variables, collections);
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
            const cssVar = toCssVarName(col.name, v.name);
            cls.push(`rounded-[var(${cssVar})]`);
          }
        } else {
          cls.push(radiusClass(radius));
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

  // src/code.ts
  var require_code = __commonJS({
    "src/code.ts"(exports) {
      init_resolve();
      init_transform();
      init_generate();
      init_tailwind();
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
      figma.ui.onmessage = (msg) => __async(exports, null, function* () {
        if (msg.type === "EXPORT_TOKENS") {
          try {
            const { collections, variables } = yield collectVariables();
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
            const { collections, variables } = yield collectVariables();
            const classes = getTailwindClasses(node, variables, collections);
            figma.ui.postMessage({
              type: "TAILWIND_RESULT",
              classes,
              nodeName: node.name
            });
          } catch (err) {
            figma.ui.postMessage({ type: "ERROR", message: String(err) });
          }
        }
      });
      figma.on("selectionchange", () => {
        var _a;
        const node = figma.currentPage.selection[0];
        figma.ui.postMessage({
          type: "SELECTION_CHANGE",
          hasSelection: !!node,
          nodeName: (_a = node == null ? void 0 : node.name) != null ? _a : ""
        });
      });
    }
  });
  require_code();
})();
