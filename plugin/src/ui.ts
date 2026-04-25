// Plugin UI — runs in the iframe (DOM access, no figma.* API)

// ── Inline theme builder (mirrors lib/theme-builder.ts for UI use) ──────────

type NeutralPreset = "slate" | "gray" | "zinc" | "stone" | "neutral";
interface ThemeConfig { brandHex: string; neutralPreset: NeutralPreset; }
type ColorScale = Record<number, string>;

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

const SCALE_LIGHTNESS: Record<number, number> = {
  50: 97, 100: 94, 200: 86, 300: 74, 400: 62, 500: 50,
  600: 40, 700: 32, 800: 24, 900: 16, 950: 11,
};
const SCALE_SAT_FACTOR: Record<number, number> = {
  50: 0.3, 100: 0.5, 200: 0.7, 300: 0.85, 400: 0.95, 500: 1,
  600: 0.95, 700: 0.88, 800: 0.8, 900: 0.7, 950: 0.6,
};
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const NEUTRAL_HUE: Record<NeutralPreset, number> = { slate: 215, gray: 220, zinc: 240, stone: 25, neutral: 0 };
const NEUTRAL_SAT: Record<NeutralPreset, number> = { slate: 16, gray: 9, zinc: 5, stone: 6, neutral: 0 };

function hslStr(h: number, s: number, l: number) { return `hsl(${h} ${s}% ${l}%)`; }
function hslVar(h: number, s: number, l: number) { return `${h} ${s}% ${l}%`; }

function generateScale(hex: string): ColorScale {
  const [h, s] = hexToHsl(hex);
  const scale: ColorScale = {};
  for (const step of STEPS) {
    scale[step] = hslVar(h, Math.min(100, Math.round(s * SCALE_SAT_FACTOR[step])), SCALE_LIGHTNESS[step]);
  }
  return scale;
}

function generateNeutral(preset: NeutralPreset): ColorScale {
  const h = NEUTRAL_HUE[preset], s = NEUTRAL_SAT[preset];
  const scale: ColorScale = {};
  for (const step of STEPS) scale[step] = hslVar(h, s, SCALE_LIGHTNESS[step]);
  return scale;
}

function buildThemeCss(config: ThemeConfig): string {
  const brand = generateScale(config.brandHex);
  const neutral = generateNeutral(config.neutralPreset);

  // shadcn/ui default: primary = dark neutral (black buttons), accent = brand color
  const light: Record<string, string> = {
    "--background":            neutral[50],
    "--foreground":            neutral[950],
    "--card":                  neutral[50],
    "--card-foreground":       neutral[950],
    "--popover":               neutral[50],
    "--popover-foreground":    neutral[950],
    "--primary":               neutral[900],
    "--primary-foreground":    neutral[50],
    "--secondary":             neutral[100],
    "--secondary-foreground":  neutral[900],
    "--muted":                 neutral[100],
    "--muted-foreground":      neutral[500],
    "--accent":                brand[100],
    "--accent-foreground":     brand[900],
    "--destructive":           "0 84% 60%",
    "--destructive-foreground": neutral[50],
    "--border":                neutral[200],
    "--input":                 neutral[200],
    "--ring":                  brand[500],
  };
  const dark: Record<string, string> = {
    "--background":            neutral[950],
    "--foreground":            neutral[50],
    "--card":                  neutral[900],
    "--card-foreground":       neutral[50],
    "--popover":               neutral[900],
    "--popover-foreground":    neutral[50],
    "--primary":               neutral[50],
    "--primary-foreground":    neutral[900],
    "--secondary":             neutral[800],
    "--secondary-foreground":  neutral[50],
    "--muted":                 neutral[800],
    "--muted-foreground":      neutral[400],
    "--accent":                brand[900],
    "--accent-foreground":     brand[100],
    "--destructive":           "0 72% 51%",
    "--destructive-foreground": neutral[50],
    "--border":                neutral[800],
    "--input":                 neutral[800],
    "--ring":                  brand[400],
  };

  const indent = "    ";
  const vars = (obj: Record<string, string>) =>
    Object.entries(obj).map(([k, v]) => `${indent}${k}: ${v};`).join("\n");
  const scaleBlock = (name: string, sc: ColorScale) =>
    `  /* ${name} */\n` + STEPS.map(s => `  --${name}-${s}: ${sc[s]};`).join("\n");

  return [
    `@layer base {`,
    `  :root {`,
    vars(light),
    `  }`,
    ``,
    `  .dark {`,
    vars(dark),
    `  }`,
    ``,
    scaleBlock("brand-shades", brand),
    ``,
    scaleBlock("brand-neutrals", neutral),
    `}`,
  ].join("\n");
}

function copyToClipboard(text: string, btn: HTMLButtonElement): void {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  btn.textContent = "Copied!";
  setTimeout(() => (btn.textContent = btn.dataset.label ?? "Copy"), 1500);
}

// ── Tab switching ──────────────────────────────────────────────────────────

document.querySelectorAll<HTMLButtonElement>(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab!;
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
    tab.classList.add("active");
    document.getElementById(`panel-${target}`)!.classList.remove("hidden");
  });
});

// ── Element refs ───────────────────────────────────────────────────────────

const btnExport       = document.getElementById("btn-export") as HTMLButtonElement;
const outputTokens    = document.getElementById("output-tokens") as HTMLTextAreaElement;
const statusTokens    = document.getElementById("status-tokens") as HTMLSpanElement;
const btnCopyTokens   = document.getElementById("btn-copy-tokens") as HTMLButtonElement;
const diffSection     = document.getElementById("diff-section") as HTMLDivElement;
const diffSummary     = document.getElementById("diff-summary") as HTMLDivElement;
const diffList        = document.getElementById("diff-list") as HTMLDivElement;
const btnCopyPatch    = document.getElementById("btn-copy-patch") as HTMLButtonElement;

const selectionBadge  = document.getElementById("selection-badge") as HTMLDivElement;
const selectionLabel  = document.getElementById("selection-label") as HTMLSpanElement;
const inspectEmpty    = document.getElementById("inspect-empty") as HTMLDivElement;
const jsxSection      = document.getElementById("jsx-section") as HTMLDivElement;
const outputJsx       = document.getElementById("output-jsx") as HTMLTextAreaElement;
const btnCopyJsx      = document.getElementById("btn-copy-jsx") as HTMLButtonElement;
const unmappedHint    = document.getElementById("unmapped-hint") as HTMLDivElement;
const outputTailwind  = document.getElementById("output-tailwind") as HTMLTextAreaElement;
const btnCopyTailwind = document.getElementById("btn-copy-tailwind") as HTMLButtonElement;

// ── Tokens tab ─────────────────────────────────────────────────────────────

btnExport.addEventListener("click", () => {
  btnExport.disabled = true;
  btnExport.textContent = "Exporting…";
  statusTokens.textContent = "";
  statusTokens.className = "status";
  parent.postMessage({ pluginMessage: { type: "EXPORT_TOKENS" } }, "*");
});

btnCopyTokens.addEventListener("click", () => copyToClipboard(outputTokens.value, btnCopyTokens));

btnCopyPatch.addEventListener("click", () => {
  copyToClipboard(btnCopyPatch.dataset.patch ?? "", btnCopyPatch);
});

// ── Inspect tab ────────────────────────────────────────────────────────────

function triggerInspect(): void {
  parent.postMessage({ pluginMessage: { type: "GET_TAILWIND" } }, "*");
}

function showEmpty(): void {
  inspectEmpty.classList.remove("hidden");
  jsxSection.classList.add("hidden");
  unmappedHint.classList.add("hidden");
  outputTailwind.value = "";
  btnCopyTailwind.disabled = true;
}

function showResults(hasJsx: boolean): void {
  inspectEmpty.classList.add("hidden");
}

btnCopyJsx.addEventListener("click", () => {
  copyToClipboard(outputJsx.value, btnCopyJsx);
});

btnCopyTailwind.addEventListener("click", () => copyToClipboard(outputTailwind.value, btnCopyTailwind));

// ── Messages from plugin backend ───────────────────────────────────────────

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage as Record<string, any>;
  if (!msg) return;

  if (msg.type === "TOKENS_CSS") {
    outputTokens.value = msg.css;
    btnCopyTokens.disabled = false;
    btnExport.disabled = false;
    btnExport.textContent = "Export globals.css";
    statusTokens.textContent = `${msg.count} tokens exported`;
    statusTokens.className = "status success";

    const diff = msg.diff;
    if (diff && diff.hasChanges) {
      diffSection.classList.remove("hidden");
      btnCopyPatch.dataset.patch = msg.patch ?? "";

      const badges = [];
      if (diff.changed > 0) badges.push(`<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fef9c3] text-[#a16207]">${diff.changed} changed</span>`);
      if (diff.added > 0)   badges.push(`<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#dcfce7] text-[#15803d]">${diff.added} added</span>`);
      if (diff.removed > 0) badges.push(`<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fee2e2] text-[#b91c1c]">${diff.removed} removed</span>`);
      diffSummary.innerHTML = badges.join("");

      diffList.innerHTML = diff.changes.map((c: any) => {
        const colors: Record<string, string> = { changed: "border-l-[#f59e0b]", added: "border-l-[#22c55e]", removed: "border-l-[#ef4444]" };
        const valueStr = c.type === "removed"
          ? `<span class="text-[#ef4444]">${c.before.light}</span>`
          : c.type === "added"
          ? `<span class="text-[#22c55e]">${c.after.light}</span>`
          : `<span class="text-[#ef4444] line-through mr-1">${c.before.light}</span><span class="text-[#22c55e]">${c.after.light}</span>`;
        return `<div class="flex flex-col pl-2 border-l-2 ${colors[c.type]} py-0.5">
          <span class="font-mono text-[10px] text-[#555]">${c.cssVar}</span>
          <span class="text-[10px] mt-0.5">${valueStr}</span>
        </div>`;
      }).join("");
    } else if (diff) {
      diffSection.classList.add("hidden");
    }
  }

  if (msg.type === "TAILWIND_RESULT") {
    if (msg.error) {
      showEmpty();
      return;
    }

    showResults(!!msg.jsxResult);

    if (msg.jsxResult) {
      jsxSection.classList.remove("hidden");
      unmappedHint.classList.add("hidden");
      // Combine imports + JSX into one block
      const imports = msg.jsxResult.imports ?? msg.jsxResult.importLine ?? "";
      const jsx = msg.jsxResult.jsx ?? "";
      outputJsx.value = imports ? `${imports}\n\n${jsx}` : jsx;
    } else {
      jsxSection.classList.add("hidden");
      if (msg.unmappedComponent) {
        unmappedHint.classList.remove("hidden");
      } else {
        unmappedHint.classList.add("hidden");
      }
    }

    outputTailwind.value = msg.classes || "";
    btnCopyTailwind.disabled = !msg.classes;
  }

  if (msg.type === "SELECTION_CHANGE") {
    if (msg.hasSelection) {
      selectionBadge.classList.add("has-selection");
      selectionLabel.textContent = msg.nodeName || "1 node selected";
      triggerInspect();
    } else {
      selectionBadge.classList.remove("has-selection");
      selectionLabel.textContent = "No node selected";
      showEmpty();
    }
  }

  if (msg.type === "ERROR") {
    btnExport.disabled = false;
    btnExport.textContent = "Export globals.css";
    statusTokens.textContent = msg.message;
    statusTokens.className = "status error";
  }

  if (msg.type === "THEME_APPLIED") {
    const themeStatus = document.getElementById("theme-status") as HTMLSpanElement;
    themeStatus.textContent = msg.success ? "Applied to Figma variables!" : `Error: ${msg.error}`;
    themeStatus.style.color = msg.success ? "#080" : "#d00";
    const btnApply = document.getElementById("btn-apply-theme") as HTMLButtonElement;
    btnApply.disabled = false;
    btnApply.textContent = "Apply to Figma";
  }
};

// ── Theme tab ──────────────────────────────────────────────────────────────

(function initThemeTab() {
  const brandColorInput    = document.getElementById("theme-brand-color") as HTMLInputElement;
  const brandHexInput      = document.getElementById("theme-brand-hex") as HTMLInputElement;
  const neutralDot         = document.getElementById("theme-neutral-dot") as HTMLDivElement;
  const neutralOptions     = document.querySelectorAll<HTMLButtonElement>(".neutral-btn");
  const brandSwatches      = document.getElementById("theme-brand-swatches") as HTMLDivElement;
  const previewBrandSw     = document.getElementById("preview-brand-swatches") as HTMLDivElement;
  const previewNeutralSw   = document.getElementById("preview-neutral-swatches") as HTMLDivElement;
  const btnCopyCss         = document.getElementById("btn-copy-theme-css") as HTMLButtonElement;
  const btnApply           = document.getElementById("btn-apply-theme") as HTMLButtonElement;
  const btnExportTheme     = document.getElementById("btn-export-theme") as HTMLButtonElement;
  const importFile         = document.getElementById("theme-import-file") as HTMLInputElement;
  const themeStatus        = document.getElementById("theme-status") as HTMLSpanElement;

  // Preview element refs
  const pvApp        = document.getElementById("pv-app") as HTMLDivElement;
  const pvHeader     = document.getElementById("pv-header") as HTMLDivElement;
  const pvLogo       = document.getElementById("pv-logo") as HTMLDivElement;
  const pvAppName    = document.getElementById("pv-app-name") as HTMLSpanElement;
  const pvBadge      = document.getElementById("pv-badge") as HTMLSpanElement;
  const pvBtnNew     = document.getElementById("pv-btn-new") as HTMLButtonElement;
  const pvBody       = document.getElementById("pv-body") as HTMLDivElement;
  const pvCardA      = document.getElementById("pv-card-a") as HTMLDivElement;
  const pvCardALabel = document.getElementById("pv-card-a-label") as HTMLParagraphElement;
  const pvCardAValue = document.getElementById("pv-card-a-value") as HTMLParagraphElement;
  const pvCardASub   = document.getElementById("pv-card-a-sub") as HTMLParagraphElement;
  const pvCardB      = document.getElementById("pv-card-b") as HTMLDivElement;
  const pvCardBLabel = document.getElementById("pv-card-b-label") as HTMLParagraphElement;
  const pvCardBValue = document.getElementById("pv-card-b-value") as HTMLParagraphElement;
  const pvCardBSub   = document.getElementById("pv-card-b-sub") as HTMLParagraphElement;
  const pvTable      = document.getElementById("pv-table") as HTMLDivElement;
  const pvTableHead  = document.getElementById("pv-table-head") as HTMLDivElement;
  const pvRow1       = document.getElementById("pv-row-1") as HTMLDivElement;
  const pvRow2       = document.getElementById("pv-row-2") as HTMLDivElement;
  const pvStatusA    = document.getElementById("pv-status-a") as HTMLSpanElement;
  const pvStatusB    = document.getElementById("pv-status-b") as HTMLSpanElement;
  const pvForm       = document.getElementById("pv-form") as HTMLDivElement;
  const pvFormTitle  = document.getElementById("pv-form-title") as HTMLParagraphElement;
  const pvInput      = document.getElementById("pv-input") as HTMLDivElement;
  const pvBtnPrimary = document.getElementById("pv-btn-primary") as HTMLButtonElement;
  const pvBtnSecondary = document.getElementById("pv-btn-secondary") as HTMLButtonElement;

  let currentConfig: ThemeConfig = { brandHex: "#6366f1", neutralPreset: "slate" };
  let generatedCss = "";

  function isValidHex(hex: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(hex);
  }

  function hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function hslVarToHex(val: string): string {
    const parts = val.trim().split(/\s+/);
    return hslToHex(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
  }

  function applyBg(el: HTMLElement, hex: string)       { el.style.backgroundColor = hex; }
  function applyFg(el: HTMLElement, hex: string)       { el.style.color = hex; }
  function applyBorder(el: HTMLElement, hex: string)   { el.style.borderColor = hex; }

  function swatchRow(container: HTMLDivElement, scale: ColorScale, name: string) {
    container.innerHTML = STEPS.map(step => {
      const hex = hslVarToHex(scale[step]);
      return `<div title="${name}-${step}" style="flex:1;height:14px;border-radius:2px;background:${hex}"></div>`;
    }).join("");
  }

  function updatePreview() {
    if (!isValidHex(currentConfig.brandHex)) return;

    const brand   = generateScale(currentConfig.brandHex);
    const neutral = generateNeutral(currentConfig.neutralPreset);

    // Computed semantic colors
    const bg         = hslVarToHex(neutral[50]);
    const fg         = hslVarToHex(neutral[950]);
    const border     = hslVarToHex(neutral[200]);
    const muted      = hslVarToHex(neutral[500]);
    const mutedBg    = hslVarToHex(neutral[100]);
    const primaryBg  = hslVarToHex(neutral[900]);   // primary = dark neutral (shadcn default)
    const primaryFg  = hslVarToHex(neutral[50]);
    const accentHex  = hslVarToHex(brand[500]);
    const accentBg   = hslVarToHex(brand[100]);
    const accentFg   = hslVarToHex(brand[800]);
    const headBg     = hslVarToHex(neutral[100]);

    // ── App shell ──
    applyBg(pvApp, bg);
    applyBorder(pvApp, border);
    pvApp.style.color = fg;

    // Header
    applyBg(pvHeader, bg);
    applyBorder(pvHeader, border);
    applyFg(pvAppName, fg);
    // Logo dot = accent
    applyBg(pvLogo, accentHex);
    // Badge = accent
    applyBg(pvBadge, accentBg);
    applyFg(pvBadge, accentFg);
    // New button = secondary
    applyBg(pvBtnNew, mutedBg);
    applyFg(pvBtnNew, fg);
    applyBorder(pvBtnNew, border);

    // Body bg
    applyBg(pvBody, bg);

    // Stat cards
    [pvCardA, pvCardB].forEach(card => {
      applyBg(card, bg);
      applyBorder(card, border);
      card.style.borderWidth = "1px";
      card.style.borderStyle = "solid";
    });
    [pvCardALabel, pvCardBLabel, pvCardASub, pvCardBSub].forEach(el => applyFg(el, muted));
    [pvCardAValue, pvCardBValue].forEach(el => applyFg(el, fg));

    // Table
    applyBg(pvTable, bg);
    applyBorder(pvTable, border);
    applyBg(pvTableHead, headBg);
    applyFg(pvTableHead, muted);
    applyBorder(pvTableHead, border);
    [pvRow1, pvRow2].forEach(row => {
      applyBg(row, bg);
      applyBorder(row, border);
      applyFg(row, fg);
    });
    // "Paid" badge = accent
    applyBg(pvStatusA, accentBg);
    applyFg(pvStatusA, accentFg);
    // "Pending" = muted text
    applyFg(pvStatusB, muted);

    // Form card
    applyBg(pvForm, bg);
    applyBorder(pvForm, border);
    applyFg(pvFormTitle, fg);
    applyBg(pvInput, bg);
    applyBorder(pvInput, border);
    pvInput.style.borderWidth = "1px";
    pvInput.style.borderStyle = "solid";
    applyFg(pvInput, muted);
    // Primary button = dark neutral
    applyBg(pvBtnPrimary, primaryBg);
    applyFg(pvBtnPrimary, primaryFg);
    // Secondary button
    applyBg(pvBtnSecondary, mutedBg);
    applyFg(pvBtnSecondary, fg);

    // ── Inputs row swatches ──
    swatchRow(brandSwatches, brand, "accent");
    // Neutral dot = neutral[500]
    applyBg(neutralDot, hslVarToHex(neutral[500]));

    // ── Legend swatches ──
    swatchRow(previewBrandSw, brand, "accent");
    swatchRow(previewNeutralSw, neutral, "neutral");

    // ── Generate CSS ──
    generatedCss = buildThemeCss(currentConfig);
    btnCopyCss.disabled = false;
  }

  // Accent color picker ↔ hex text
  brandColorInput.addEventListener("input", () => {
    currentConfig.brandHex = brandColorInput.value;
    brandHexInput.value = brandColorInput.value;
    updatePreview();
  });
  brandHexInput.addEventListener("input", () => {
    const v = brandHexInput.value;
    if (isValidHex(v)) {
      currentConfig.brandHex = v;
      brandColorInput.value = v;
      updatePreview();
    }
  });

  // Neutral preset
  neutralOptions.forEach(btn => {
    btn.addEventListener("click", () => {
      neutralOptions.forEach(b => b.classList.remove("active-neutral"));
      btn.classList.add("active-neutral");
      currentConfig.neutralPreset = (btn.dataset.preset as NeutralPreset) ?? "slate";
      updatePreview();
    });
  });

  // Copy CSS
  btnCopyCss.addEventListener("click", () => {
    const ta = document.createElement("textarea");
    ta.value = generatedCss;
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    const orig = btnCopyCss.textContent ?? "Copy CSS";
    btnCopyCss.textContent = "Copied!";
    setTimeout(() => (btnCopyCss.textContent = orig), 1500);
  });

  // Apply to Figma
  btnApply.addEventListener("click", () => {
    btnApply.disabled = true;
    btnApply.textContent = "Applying…";
    themeStatus.textContent = "";
    parent.postMessage({ pluginMessage: { type: "APPLY_THEME", config: currentConfig } }, "*");
  });

  // Export JSON config
  btnExportTheme.addEventListener("click", () => {
    const json = JSON.stringify(currentConfig, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "figma-theme-config.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import JSON config
  importFile.addEventListener("change", () => {
    const file = importFile.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as Partial<ThemeConfig>;
        if (parsed.brandHex && isValidHex(parsed.brandHex)) {
          currentConfig.brandHex = parsed.brandHex;
          brandColorInput.value = parsed.brandHex;
          brandHexInput.value = parsed.brandHex;
        }
        if (parsed.neutralPreset && ["slate","gray","zinc","stone","neutral"].includes(parsed.neutralPreset)) {
          currentConfig.neutralPreset = parsed.neutralPreset;
          neutralOptions.forEach(b => b.classList.toggle("active-neutral", b.dataset.preset === parsed.neutralPreset));
        }
        updatePreview();
        themeStatus.textContent = "Config imported.";
        themeStatus.style.color = "#080";
      } catch {
        themeStatus.textContent = "Invalid JSON file.";
        themeStatus.style.color = "#d00";
      }
      importFile.value = "";
    };
    reader.readAsText(file);
  });

  updatePreview();
})();
