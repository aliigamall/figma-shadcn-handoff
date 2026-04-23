// Plugin UI — runs in the iframe (DOM access, no figma.* API)

// navigator.clipboard is unavailable in Figma plugin iframes (no secure context).
// Use the execCommand fallback instead.
function copyToClipboard(text: string, btn: HTMLButtonElement): void {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  btn.textContent = "Copied!";
  setTimeout(() => (btn.textContent = "Copy"), 1500);
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

const btnExport = document.getElementById("btn-export") as HTMLButtonElement;
const outputTokens = document.getElementById("output-tokens") as HTMLTextAreaElement;
const statusTokens = document.getElementById("status-tokens") as HTMLSpanElement;
const btnCopyTokens = document.getElementById("btn-copy-tokens") as HTMLButtonElement;

const selectionBadge = document.getElementById("selection-badge") as HTMLDivElement;
const selectionLabel = document.getElementById("selection-label") as HTMLSpanElement;
const btnGetTailwind = document.getElementById("btn-get-tailwind") as HTMLButtonElement;
const outputTailwind = document.getElementById("output-tailwind") as HTMLTextAreaElement;
const statusTailwind = document.getElementById("status-tailwind") as HTMLSpanElement;
const btnCopyTailwind = document.getElementById("btn-copy-tailwind") as HTMLButtonElement;

const jsxSection = document.getElementById("jsx-section") as HTMLDivElement;
const jsxImport = document.getElementById("jsx-import") as HTMLDivElement;
const outputJsx = document.getElementById("output-jsx") as HTMLTextAreaElement;
const btnCopyJsx = document.getElementById("btn-copy-jsx") as HTMLButtonElement;
const unmappedHint = document.getElementById("unmapped-hint") as HTMLDivElement;

const devEmpty = document.getElementById("dev-empty") as HTMLDivElement;
const devNodeType = document.getElementById("dev-node-type") as HTMLDivElement;
const devContent = document.getElementById("dev-content") as HTMLDivElement;
const devComponentName = document.getElementById("dev-component-name") as HTMLSpanElement;
const devFigmaName = document.getElementById("dev-figma-name") as HTMLSpanElement;
const devProps = document.getElementById("dev-props") as HTMLDivElement;
const devDraft = document.getElementById("dev-draft") as HTMLTextAreaElement;
const btnCopyDraft = document.getElementById("btn-copy-draft") as HTMLButtonElement;

// ── Tokens tab ─────────────────────────────────────────────────────────────

btnExport.addEventListener("click", () => {
  btnExport.disabled = true;
  btnExport.textContent = "Exporting…";
  statusTokens.textContent = "";
  statusTokens.className = "status";
  parent.postMessage({ pluginMessage: { type: "EXPORT_TOKENS" } }, "*");
});

btnCopyTokens.addEventListener("click", () => {
  copyToClipboard(outputTokens.value, btnCopyTokens);
});

// ── Tailwind tab ───────────────────────────────────────────────────────────

btnGetTailwind.addEventListener("click", () => {
  btnGetTailwind.disabled = true;
  btnGetTailwind.textContent = "Inspecting…";
  statusTailwind.textContent = "";
  statusTailwind.className = "status";
  jsxSection.classList.add("hidden");
  unmappedHint.classList.add("hidden");
  parent.postMessage({ pluginMessage: { type: "GET_TAILWIND" } }, "*");
});

btnCopyTailwind.addEventListener("click", () => {
  copyToClipboard(outputTailwind.value, btnCopyTailwind);
});

btnCopyJsx.addEventListener("click", () => {
  const full = `${jsxImport.textContent}\n\n${outputJsx.value}`;
  copyToClipboard(full, btnCopyJsx);
});

btnCopyDraft.addEventListener("click", () => {
  copyToClipboard(devDraft.value, btnCopyDraft);
});

// ── Dev tab renderer ───────────────────────────────────────────────────────

function renderDevTab(info: any, nodeType?: string): void {
  if (!info) {
    devEmpty.classList.remove("hidden");
    devContent.classList.add("hidden");
    const validTypes = ["INSTANCE", "COMPONENT", "COMPONENT_SET"];
    if (nodeType && !validTypes.includes(nodeType)) {
      devNodeType.classList.remove("hidden");
      devNodeType.textContent = `Selected: ${nodeType} — select a component, component set, or instance`;
    } else {
      devNodeType.classList.add("hidden");
    }
    return;
  }

  devEmpty.classList.add("hidden");
  devContent.classList.remove("hidden");

  devComponentName.textContent = info.componentName;
  devFigmaName.textContent = `Figma: "${info.figmaNodeName}"`;

  // Build properties list
  devProps.innerHTML = "";
  for (const prop of info.properties as any[]) {
    const el = document.createElement("div");
    el.className = "dev-prop";

    const header = document.createElement("div");
    header.className = "dev-prop-header";

    const nameEl = document.createElement("span");
    nameEl.className = "dev-prop-name";
    nameEl.textContent = prop.name;

    const badge = document.createElement("span");
    badge.className = `dev-type-badge ${prop.type.toLowerCase()}`;
    badge.textContent = prop.type;

    header.appendChild(nameEl);
    header.appendChild(badge);
    el.appendChild(header);

    if (prop.type === "VARIANT" && prop.options.length > 0) {
      const opts = document.createElement("div");
      opts.className = "dev-options";
      for (const opt of prop.options as string[]) {
        const chip = document.createElement("span");
        chip.className = "dev-option" + (
          String(prop.currentValue).toLowerCase() === opt.toLowerCase() ? " current" : ""
        );
        chip.textContent = opt;
        opts.appendChild(chip);
      }
      el.appendChild(opts);
    } else if (prop.type === "TEXT") {
      const val = document.createElement("div");
      val.className = "dev-text-value";
      val.textContent = `"${prop.currentValue}"`;
      el.appendChild(val);
    } else if (prop.type === "BOOLEAN") {
      const val = document.createElement("div");
      val.className = "dev-text-value";
      val.textContent = String(prop.currentValue);
      el.appendChild(val);
    }

    devProps.appendChild(el);
  }

  devDraft.value = info.draft;
}

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
  }

  if (msg.type === "TAILWIND_RESULT") {
    btnGetTailwind.disabled = false;
    btnGetTailwind.textContent = "Inspect";

    if (msg.error) {
      statusTailwind.textContent = msg.error;
      statusTailwind.className = "status error";
      return;
    }

    // JSX section
    if (msg.jsxResult) {
      jsxSection.classList.remove("hidden");
      unmappedHint.classList.add("hidden");
      jsxImport.textContent = msg.jsxResult.importLine;
      outputJsx.value = msg.jsxResult.jsx;
    } else if (msg.unmappedComponent) {
      jsxSection.classList.add("hidden");
      unmappedHint.classList.remove("hidden");
      unmappedHint.textContent = `"${msg.unmappedComponent}" is not in components.json yet`;
    } else {
      jsxSection.classList.add("hidden");
      unmappedHint.classList.add("hidden");
    }

    // Tailwind section
    outputTailwind.value = msg.classes || "(no classes generated)";
    btnCopyTailwind.disabled = !msg.classes;
    statusTailwind.textContent = msg.nodeName ? `From: ${msg.nodeName}` : "";
    statusTailwind.className = "status";
  }

  if (msg.type === "SELECTION_CHANGE") {
    if (msg.hasSelection) {
      selectionBadge.classList.add("has-selection");
      selectionLabel.textContent = msg.nodeName || "1 node selected";
    } else {
      selectionBadge.classList.remove("has-selection");
      selectionLabel.textContent = "No node selected";
    }
    renderDevTab(msg.componentInfo ?? null, msg.nodeType);
  }

  if (msg.type === "ERROR") {
    // Reset button states
    btnExport.disabled = false;
    btnExport.textContent = "Export globals.css";
    btnGetTailwind.disabled = false;
    btnGetTailwind.textContent = "Get Tailwind Classes";

    statusTokens.textContent = msg.message;
    statusTokens.className = "status error";
    statusTailwind.textContent = msg.message;
    statusTailwind.className = "status error";
  }
};
