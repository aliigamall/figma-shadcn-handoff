# Decision Log

Architecture and design decisions for the Figma-to-code handoff toolchain.
Each entry follows ADR format: **Context → Decision → Rationale → Consequences**.

---

## ADR-001 — Hybrid Architecture

**Date:** 2026-04-23

**Context:**
Two workflows needed:
1. Export Figma variables → Tailwind v4 `globals.css`
2. Inspect a Figma frame → JSX with semantic Tailwind classes

Options considered:
- A) Build a custom MCP server for both workflows
- B) Use official Figma MCP for both (limited — no full collection export)
- C) Hybrid: REST API script for tokens, official Figma MCP for inspection

**Decision:** Option C — hybrid approach.

**Rationale:**
- The official Figma MCP (`get_design_context`) already solves inspect-to-JSX better than any custom implementation
- Full variable collection export (`GET /v1/files/:key/variables`) is not exposed by the official MCP — requires REST API directly
- Avoids building and maintaining a custom MCP server

**Consequences:**
- `export_design_tokens` = standalone CLI script using Figma REST API + PAT
- `inspect_component` = uses official Figma MCP's `get_design_context` + post-processing
- Token export works without Figma open; inspection requires Figma desktop plugin running

---

## ADR-002 — Token Naming Convention

**Date:** 2026-04-23

**Context:**
Figma variables are slash-separated paths within collections and groups.
Must map to CSS custom properties consumable by Tailwind v4 `@theme` and shadcn/ui.

**Decision:** shadcn-compatible flat naming, with collection-prefixed fallback for non-semantic tokens.

**Rules:**

| Collection | Figma path | CSS variable |
|---|---|---|
| semantic colors | `general/background` | `--background` |
| semantic colors | `general/primary` | `--primary` |
| semantic colors | `card/card` | `--card` |
| semantic colors | `card/card foreground` | `--card-foreground` |
| semantic colors | `popover/popover` | `--popover` |
| raw colors | `red/500` | `--color-red-500` |
| brand colors | `brand-neutrals/900` | `--color-brand-neutrals-900` |
| border radii | `md` | `--radius-md` |
| spacing | `4` | `--spacing-4` |
| typography | `body/size` | `--typography-body-size` |
| shadows | `md` | `--shadow-md` |

**Special rule for `general` group:** drop the group prefix entirely.
**Special rule for named groups (card, popover, etc.):** use `--{group}-{name}`, collapsing when name equals group (`card/card` → `--card`).

**Rationale:**
- shadcn/ui expects `--background`, `--primary`, `--card`, `--card-foreground` etc.
- Deviating from this breaks drop-in shadcn component compatibility
- Non-semantic tokens (raw colors, spacing) are not used directly by shadcn so prefixing is fine

---

## ADR-003 — Multi-mode / Dark Mode Detection

**Date:** 2026-04-23

**Context:**
Figma supports multiple modes per variable collection. Need to know which mode maps to light vs dark for generating `[data-theme="dark"]` CSS overrides.

**Decision:** First mode = light, second mode = dark. No config required.

**Rationale:**
- The obra shadcn plugin follows this convention (mode 1: `shadcn`, mode 2: `shadow-dark`)
- Avoids requiring users to configure mode names
- Simple and predictable

**Consequences:**
- If a collection has only one mode, no dark override is generated for it
- If a collection has 3+ modes, only the first two are used (light + dark); extras are ignored
- Teams that name their modes differently must ensure light is first

**Output shape:**
```css
@theme {
  --background: #ffffff;
}

[data-theme="dark"] {
  --background: #09090b;
}
```

---

## ADR-004 — Alias Resolution Depth

**Date:** 2026-04-23

**Context:**
Figma variables can alias other variables (e.g. `semantic/background` → `brand-neutrals/50`).
Alias chains can be multiple levels deep.

**Decision:** Resolve one level only. Stop at the first alias target; do not recurse further.

**Rationale:**
- One level captures the semantic → primitive relationship (the meaningful mapping)
- Deep resolution loses the semantic intent (e.g. resolving `primary` all the way to `#3B82F6` loses the fact that it references `brand-blue/500`)
- Keeps the CSS output readable and traceable back to Figma

**Consequences:**
- If an alias points to another alias, the intermediate name is used as the value
- The resolved name becomes the CSS var value: `--primary: var(--color-brand-blue-500)`

---

## ADR-005 — Output Path

**Date:** 2026-04-23

**Context:**
The token export script needs to write `globals.css` somewhere.

**Decision:** Fixed path `./globals.css` relative to where the script is run.

**Rationale:**
- Simplest option for the POC phase
- Avoids config complexity during initial development

**Future:** Make it a CLI argument (`--output ./src/app/globals.css`) once the core logic is stable.

---

## ADR-006 — inspect_component JSX Fidelity

**Date:** 2026-04-23

**Context:**
The inspect workflow needs to return JSX for a selected Figma frame.
Options: full DOM tree, semantic shell only, or raw `get_design_context` output post-processed.

**Decision:** Semantic shell — return the frame's own properties (fill, border, radius, shadow, typography) mapped to token classes. No full layout tree reconstruction.

**Rationale:**
- Full DOM reconstruction is fragile and already attempted (imperfectly) by `get_design_context`
- Developers need the token bindings, not the layout — they'll place the component themselves
- Reduces noise; output is immediately usable as a component shell

**Post-processing step:**
After `get_design_context` returns JSX, scan for raw hex values and replace with the nearest matching CSS variable from the exported token map.

---

## ADR-007 — Documentation Format

**Date:** 2026-04-23

**Context:**
Decisions need to be recorded so future contributors understand the why.

**Decision:** Both `DECISIONS.md` (this file, ADR-style) and inline comments in code at decision points.

**Rationale:**
- `DECISIONS.md` provides a browsable history
- Inline comments keep context visible when reading the code

---

## ADR-008 — Auth Strategy

**Date:** 2026-04-23

**Context:**
The token export CLI needs to authenticate with the Figma REST API.

**Decision:** Figma Personal Access Token (PAT) via environment variable `FIGMA_PAT`.

**Rationale:**
- Simplest auth for a POC / developer tooling context
- No OAuth flow needed for a CLI tool running locally

**Future:** OAuth 2.0 if this becomes a shared team service.
