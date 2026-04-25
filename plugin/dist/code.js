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
          ignore: ["State", "Roundness", "Show right icon", "Show left icon", "\u2B91 Right icon", "\u2B91 Left icon"]
        },
        // ── Icon Button ───────────────────────────────────────────────────────────
        "Icon Button": {
          component: "Button",
          importPath: "@/components/ui/button",
          props: {
            "Variant": { shadcnProp: "variant", values: VARIANT_MAP },
            "Size": { shadcnProp: "size", values: SIZE_MAP }
          },
          ignore: ["State", "Roundness", "Icon"]
        },
        // ── Link Button ───────────────────────────────────────────────────────────
        "Link Button": {
          component: "Button",
          importPath: "@/components/ui/button",
          props: {
            "Size": { shadcnProp: "size", values: SIZE_MAP }
          },
          children: "Label",
          ignore: ["State", "Roundness", "Show icon left", "Show icon right", "\u2B91 Icon left", "\u2B91 Icon right"]
        },
        // ── Loading Button ────────────────────────────────────────────────────────
        "Loading Button": {
          component: "Button",
          importPath: "@/components/ui/button",
          props: {
            "Variant": { shadcnProp: "variant", values: VARIANT_MAP },
            "Size": { shadcnProp: "size", values: SIZE_MAP }
          },
          ignore: ["State", "Roundness"]
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
          children: "Line 1",
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
        // ── Input ─────────────────────────────────────────────────────────────────
        "Input": {
          component: "Input",
          importPath: "@/components/ui/input",
          props: {
            "State": {
              shadcnProp: "disabled",
              values: { Disabled: "true", Empty: null, Placeholder: null, Value: null, Focus: null, Error: null, "Error Focus": null }
            }
          },
          children: "Value",
          ignore: ["Size", "Roundness", "Show decoration left", "Show decoration right", "Show cursor", "Show prepend text", "Show append text"]
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
            "Checked?": { shadcnProp: "checked", values: CHECKED_MAP }
          },
          ignore: ["State"]
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
          ignore: ["Main Slot", "Header Slot", "Footer Slot", "Slot No."]
        },
        // ── Accordion ─────────────────────────────────────────────────────────────
        "Accordion Trigger": {
          component: "Accordion",
          importPath: "@/components/ui/accordion",
          children: "Accordion label",
          ignore: ["State", "Show border", "Position"]
        },
        // ── Breadcrumb ────────────────────────────────────────────────────────────
        "Breadcrumb": {
          component: "Breadcrumb",
          importPath: "@/components/ui/breadcrumb",
          ignore: ["Items"]
        },
        // ── Pagination ────────────────────────────────────────────────────────────
        "Pagination": {
          component: "Pagination",
          importPath: "@/components/ui/pagination",
          ignore: ["Type", "State"]
        },
        // ── Dialog ────────────────────────────────────────────────────────────────
        "Dialog": {
          component: "Dialog",
          importPath: "@/components/ui/dialog",
          ignore: ["Type"]
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
  function solidColor(fills) {
    if (!Array.isArray(fills))
      return null;
    const s = fills.find((f) => f.type === "SOLID" && f.visible !== false);
    return s ? rgbToHex(s.color.r, s.color.g, s.color.b) : null;
  }
  function extractVisual(node) {
    var _a, _b, _c, _d;
    return {
      bgColor: solidColor((_a = node.fills) != null ? _a : []),
      radius: typeof node.cornerRadius === "number" ? node.cornerRadius : 0,
      shadow: ((_b = node.effects) != null ? _b : []).some((e) => e.type === "DROP_SHADOW" && e.visible !== false),
      opacity: (_c = node.opacity) != null ? _c : 1,
      borderColor: solidColor((_d = node.strokes) != null ? _d : [])
    };
  }
  function toLucideName(raw) {
    var _a, _b;
    const segment = (_b = (_a = raw.split("/").pop()) == null ? void 0 : _a.trim()) != null ? _b : raw;
    const cleaned = segment.replace(/^icons?[-_\s]*/i, "").trim() || "Icon";
    return cleaned.split(/[-_\s]+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("");
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
    const rawProps = (_a = instance.componentProperties) != null ? _a : {};
    for (const [obraKey, propDef] of Object.entries(def.props)) {
      const figmaKey = Object.keys(rawProps).find((k) => k.split("#")[0] === obraKey);
      if (!figmaKey)
        continue;
      const rawValue = String(rawProps[figmaKey].value);
      if (propDef.values && propDef.values[rawValue] === null)
        continue;
      const mappedValue = propDef.values ? (_b = propDef.values[rawValue]) != null ? _b : rawValue.toLowerCase() : rawValue.toLowerCase();
      result.push({ shadcnProp: propDef.shadcnProp, value: mappedValue });
    }
    return result;
  }
  function resolveChildren(instance, childrenKey) {
    var _a;
    if (!childrenKey)
      return null;
    const rawProps = (_a = instance.componentProperties) != null ? _a : {};
    const figmaKey = Object.keys(rawProps).find((k) => k.split("#")[0] === childrenKey);
    if (!figmaKey)
      return null;
    const val = rawProps[figmaKey].value;
    return typeof val === "string" ? val : null;
  }
  function scanNode(node) {
    return __async(this, null, function* () {
      var _a;
      if (!node.visible)
        return null;
      if (node.type === "INSTANCE") {
        const mainComp = yield node.getMainComponentAsync();
        if (!mainComp)
          return scanFrameNode(node);
        const compName = ((_a = mainComp.parent) == null ? void 0 : _a.type) === "COMPONENT_SET" ? mainComp.parent.name : mainComp.name;
        const def = lookupComponent(compName);
        if (def) {
          const textChildren = resolveChildren(node, def.children);
          const childNodes = textChildren === null ? yield scanChildren(node) : [];
          return {
            id: node.id,
            figmaName: compName,
            component: def.component,
            importPath: def.importPath,
            props: resolveProps(node, def),
            children: textChildren != null ? textChildren : childNodes,
            layout: extractLayout(node)
          };
        }
        const isSmall = node.width <= 48 && node.height <= 48;
        if (isSmall) {
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
        const color = solidColor(Array.isArray(text.fills) ? text.fills : []);
        return { isText: true, id: node.id, content, tag, bold, align, color, uppercase };
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
      if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION" || node.type === "STAR" || node.type === "POLYGON" || node.type === "LINE") {
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
      if (children.length === 0)
        return null;
      const isGroup = node.type === "GROUP";
      const layout = !isGroup ? extractLayout(node) : { direction: "none", gap: 0, rowGap: 0, columns: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, wrap: false };
      const visual = !isGroup ? extractVisual(node) : EMPTY_VISUAL;
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
        visual: extractVisual(frame),
        children
      };
    });
  }
  var EMPTY_VISUAL;
  var init_frame_scanner = __esm({
    "src/lib/frame-scanner.ts"() {
      "use strict";
      init_component_map();
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
  function visualClasses(v) {
    var _a;
    const parts = [];
    if (v.bgColor)
      parts.push(`bg-[${v.bgColor}]`);
    if (v.radius > 0)
      parts.push(v.radius >= 9999 ? "rounded-full" : (_a = RADIUS_MAP[v.radius]) != null ? _a : `rounded-[${v.radius}px]`);
    if (v.shadow)
      parts.push("shadow-md");
    if (v.borderColor)
      parts.push(`border border-[${v.borderColor}]`);
    if (v.opacity < 1)
      parts.push(`opacity-[${Math.round(v.opacity * 100)}%]`);
    return parts.join(" ");
  }
  function textVisualClasses(align, color, uppercase) {
    const parts = [];
    if (align === "center")
      parts.push("text-center");
    if (align === "right")
      parts.push("text-right");
    if (uppercase)
      parts.push("uppercase");
    if (color)
      parts.push(`text-[${color}]`);
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
    return Array.from(imports.entries()).map(([path, names]) => `import { ${Array.from(names).join(", ")} } from "${path}";`).join("\n");
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
    const pad = "  ".repeat(indent);
    if ("isIcon" in node) {
      const icon = node;
      addImport(imports, "lucide-react", icon.lucideName);
      return `${pad}<${icon.lucideName} size={${Math.max(icon.width, icon.height)}} className="shrink-0" />`;
    }
    if ("isText" in node) {
      const t = node;
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
    const jsx = renderNode(tree, imports, 0);
    const components = Array.from(
      new Set(Array.from(imports.values()).flatMap((s) => Array.from(s)))
    );
    return {
      imports: renderImports(imports),
      jsx,
      components
    };
  }
  var init_jsx_generator = __esm({
    "src/lib/jsx-generator.ts"() {
      "use strict";
      init_tailwind_layout();
    }
  });

  // src/lib/html-generator.ts
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
  var BASE_BTN, HTML_MAP;
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
              const defaultOpt = (_b = opts.find((v) => v.toLowerCase() === "default")) != null ? _b : opts[0];
              if (defaultOpt)
                defaults[propName] = defaultOpt.toLowerCase();
            }
          } else if (def.type === "TEXT" && !children) {
            children = key;
          }
        }
        return __spreadValues(__spreadValues(__spreadValues(__spreadValues({
          import: `@/components/ui/${componentName.toLowerCase().replace(/\s+/g, "-")}`
        }, Object.keys(props).length > 0 && { props }), Object.keys(defaults).length > 0 && { defaults }), Object.keys(booleans).length > 0 && { booleans }), children && { children });
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
        var _a, _b, _c, _d, _e, _f, _g;
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
            const lightModeId = (_d = (_c = coll.modes.find((m) => m.name === "light")) == null ? void 0 : _c.modeId) != null ? _d : coll.modes[0].modeId;
            const darkModeId = (_g = (_e = coll.modes.find((m) => m.name === "dark")) == null ? void 0 : _e.modeId) != null ? _g : (_f = coll.modes[1]) == null ? void 0 : _f.modeId;
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
