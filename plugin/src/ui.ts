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
const diffSection = document.getElementById("diff-section") as HTMLDivElement;
const diffSummary = document.getElementById("diff-summary") as HTMLDivElement;
const diffList = document.getElementById("diff-list") as HTMLDivElement;
const btnCopyPatch = document.getElementById("btn-copy-patch") as HTMLButtonElement;

const selectionBadge = document.getElementById("selection-badge") as HTMLDivElement;
const selectionLabel = document.getElementById("selection-label") as HTMLSpanElement;
const outputTailwind = document.getElementById("output-tailwind") as HTMLTextAreaElement;
const statusTailwind = document.getElementById("status-tailwind") as HTMLSpanElement;
const btnCopyTailwind = document.getElementById("btn-copy-tailwind") as HTMLButtonElement;

const jsxSection = document.getElementById("jsx-section") as HTMLDivElement;
const jsxImport = document.getElementById("jsx-import") as HTMLDivElement;
const outputJsx = document.getElementById("output-jsx") as HTMLTextAreaElement;
const btnCopyJsx = document.getElementById("btn-copy-jsx") as HTMLButtonElement;
const unmappedHint = document.getElementById("unmapped-hint") as HTMLDivElement;


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

btnCopyPatch.addEventListener("click", () => {
  copyToClipboard(btnCopyPatch.dataset.patch ?? "", btnCopyPatch);
});

// ── Tailwind tab ───────────────────────────────────────────────────────────

function triggerInspect(): void {
  statusTailwind.textContent = "";
  statusTailwind.className = "status";
  jsxSection.classList.add("hidden");
  unmappedHint.classList.add("hidden");
  parent.postMessage({ pluginMessage: { type: "GET_TAILWIND" } }, "*");
}

btnCopyTailwind.addEventListener("click", () => {
  copyToClipboard(outputTailwind.value, btnCopyTailwind);
});

btnCopyJsx.addEventListener("click", () => {
  const full = `${jsxImport.textContent}\n\n${outputJsx.value}`;
  copyToClipboard(full, btnCopyJsx);
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

    // Render diff if available
    const diff = msg.diff;
    if (diff && diff.hasChanges) {
      diffSection.classList.remove("hidden");
      btnCopyPatch.dataset.patch = msg.patch ?? "";

      // Summary badges
      const badges = [];
      if (diff.changed > 0) badges.push(`<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fef9c3] text-[#a16207]">${diff.changed} changed</span>`);
      if (diff.added > 0)   badges.push(`<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#dcfce7] text-[#15803d]">${diff.added} added</span>`);
      if (diff.removed > 0) badges.push(`<span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fee2e2] text-[#b91c1c]">${diff.removed} removed</span>`);
      diffSummary.innerHTML = badges.join("");

      // Change list
      diffList.innerHTML = diff.changes.map((c: any) => {
        const colors: Record<string, string> = {
          changed: "border-l-[#f59e0b]",
          added:   "border-l-[#22c55e]",
          removed: "border-l-[#ef4444]",
        };
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
      triggerInspect();
    } else {
      selectionBadge.classList.remove("has-selection");
      selectionLabel.textContent = "No node selected";
      outputTailwind.value = "";
      jsxSection.classList.add("hidden");
      unmappedHint.classList.add("hidden");
      btnCopyTailwind.disabled = true;
      statusTailwind.textContent = "";
    }
  }

  if (msg.type === "ERROR") {
    btnExport.disabled = false;
    btnExport.textContent = "Export globals.css";

    statusTokens.textContent = msg.message;
    statusTokens.className = "status error";
    statusTailwind.textContent = msg.message;
    statusTailwind.className = "status error";
  }
};
