/**
 * Theme Builder
 *
 * Given a brand color (hex), neutral preset, destructive color, and radius,
 * generates a full shadcn/ui-compatible globals.css content.
 *
 * Color scale: HSL-based 50→950 derived from a single input hex.
 */

// ─── HSL helpers ─────────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
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
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslString(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

// ─── Color scale generation ───────────────────────────────────────────────────

const SCALE_LIGHTNESS: Record<number, number> = {
  50: 97, 100: 94, 200: 86, 300: 74, 400: 62, 500: 50,
  600: 40, 700: 32, 800: 24, 900: 16, 950: 11,
};

const SCALE_SATURATION_FACTOR: Record<number, number> = {
  50: 0.3, 100: 0.5, 200: 0.7, 300: 0.85, 400: 0.95, 500: 1,
  600: 0.95, 700: 0.88, 800: 0.8, 900: 0.7, 950: 0.6,
};

export type ColorScale = Record<number, string>; // { 50: "210 40% 97%", ... }

export function generateScale(hex: string): ColorScale {
  const [h, s] = hexToHsl(hex);
  const scale: ColorScale = {};
  for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
    const l = SCALE_LIGHTNESS[step];
    const adjS = Math.min(100, Math.round(s * SCALE_SATURATION_FACTOR[step]));
    scale[step] = hslString(h, adjS, l);
  }
  return scale;
}

// ─── Neutral presets ──────────────────────────────────────────────────────────

export type NeutralPreset = "slate" | "gray" | "zinc" | "stone" | "neutral";

const NEUTRAL_HUE: Record<NeutralPreset, number> = {
  slate: 215, gray: 220, zinc: 240, stone: 25, neutral: 0,
};

const NEUTRAL_SATURATION: Record<NeutralPreset, number> = {
  slate: 16, gray: 9, zinc: 5, stone: 6, neutral: 0,
};

export function generateNeutralScale(preset: NeutralPreset): ColorScale {
  const h = NEUTRAL_HUE[preset];
  const s = NEUTRAL_SATURATION[preset];
  const scale: ColorScale = {};
  for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
    const l = SCALE_LIGHTNESS[step];
    scale[step] = hslString(h, s, l);
  }
  return scale;
}

// ─── Semantic variable derivation ─────────────────────────────────────────────

export interface ThemeConfig {
  brandHex: string;
  neutralPreset: NeutralPreset;
}

export interface GeneratedTheme {
  brandScale: ColorScale;
  neutralScale: ColorScale;
  css: string;
  config: ThemeConfig;
}

export function buildTheme(config: ThemeConfig): GeneratedTheme {
  const brandScale   = generateScale(config.brandHex);
  const neutralScale = generateNeutralScale(config.neutralPreset);

  // shadcn/ui default: primary = dark neutral (black buttons), accent = brand
  const light: Record<string, string> = {
    "--background":            neutralScale[50],
    "--foreground":            neutralScale[950],
    "--card":                  neutralScale[50],
    "--card-foreground":       neutralScale[950],
    "--popover":               neutralScale[50],
    "--popover-foreground":    neutralScale[950],
    "--primary":               neutralScale[900],
    "--primary-foreground":    neutralScale[50],
    "--secondary":             neutralScale[100],
    "--secondary-foreground":  neutralScale[900],
    "--muted":                 neutralScale[100],
    "--muted-foreground":      neutralScale[500],
    "--accent":                brandScale[100],
    "--accent-foreground":     brandScale[900],
    "--destructive":           "0 84% 60%",
    "--destructive-foreground": neutralScale[50],
    "--border":                neutralScale[200],
    "--input":                 neutralScale[200],
    "--ring":                  brandScale[500],
  };

  const dark: Record<string, string> = {
    "--background":            neutralScale[950],
    "--foreground":            neutralScale[50],
    "--card":                  neutralScale[900],
    "--card-foreground":       neutralScale[50],
    "--popover":               neutralScale[900],
    "--popover-foreground":    neutralScale[50],
    "--primary":               neutralScale[50],
    "--primary-foreground":    neutralScale[900],
    "--secondary":             neutralScale[800],
    "--secondary-foreground":  neutralScale[50],
    "--muted":                 neutralScale[800],
    "--muted-foreground":      neutralScale[400],
    "--accent":                brandScale[900],
    "--accent-foreground":     brandScale[100],
    "--destructive":           "0 72% 51%",
    "--destructive-foreground": neutralScale[50],
    "--border":                neutralScale[800],
    "--input":                 neutralScale[800],
    "--ring":                  brandScale[400],
  };

  const indent = "    ";
  const toVarLines = (vars: Record<string, string>) =>
    Object.entries(vars).map(([k, v]) => `${indent}${k}: ${v};`).join("\n");

  const scaleBlock = (name: string, scale: ColorScale) =>
    `  /* ${name} */\n` +
    Object.entries(scale).map(([step, val]) => `  --${name}-${step}: ${val};`).join("\n");

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
    `}`,
  ].join("\n");

  return { brandScale, neutralScale, css, config };
}

// ─── Export / import config ───────────────────────────────────────────────────

export function exportConfig(config: ThemeConfig): string {
  return JSON.stringify(config, null, 2);
}

export function importConfig(json: string): ThemeConfig | null {
  try {
    const parsed = JSON.parse(json) as Partial<ThemeConfig>;
    if (
      typeof parsed.brandHex === "string" &&
      typeof parsed.neutralPreset === "string"
    ) {
      return parsed as ThemeConfig;
    }
    return null;
  } catch {
    return null;
  }
}
