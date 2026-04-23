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
  btnGetTailwind.textContent = "Generating…";
  statusTailwind.textContent = "";
  statusTailwind.className = "status";
  parent.postMessage({ pluginMessage: { type: "GET_TAILWIND" } }, "*");
});

btnCopyTailwind.addEventListener("click", () => {
  copyToClipboard(outputTailwind.value, btnCopyTailwind);
});

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
    btnGetTailwind.textContent = "Get Tailwind Classes";

    if (msg.error) {
      statusTailwind.textContent = msg.error;
      statusTailwind.className = "status error";
      return;
    }

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
      selectionLabel.textContent = "No frame selected";
    }
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
