# Figma Handoff

A Figma plugin that solves the designer-to-engineer handoff problem for teams using [shadcn/ui](https://ui.shadcn.com/).

---

## The Problem

Most product teams face two painful handoff issues:

**1. Inaccurate AI-generated code from designs**
Engineers use AI tools to convert Figma screenshots into code. Because screenshots carry no structural information, the AI guesses at which components to use and what props to set — the output is almost never correct and requires significant manual fixing.

**2. Design changes go unnoticed**
When a designer updates a color variable, adjusts spacing, or tweaks a component, engineers have no visibility into what changed. They either miss the update entirely or have to manually re-inspect the design and redo their work.

Both issues slow down delivery, create inconsistency between design and production, and cause unnecessary back-and-forth between designers and engineers.

---

## The Solution

This plugin bridges Figma and shadcn/ui by treating the design file as a **structured data source**, not an image.

**The approach:**
- Designers work in Figma using the **[Obra shadcn/ui kit](https://www.figma.com/community/file/obra-shadcn-ui-kit)** — a Figma component library that mirrors shadcn/ui 1:1 in naming and structure.
- The plugin reads the Figma component tree directly (not a screenshot) and maps each Obra component to its shadcn/ui equivalent with correct props.
- Engineers get accurate, copy-paste-ready JSX — no guessing required.
- When designers change tokens or components, engineers export the diff and update only what changed.

---

## Features

### Export Tokens
Export Figma variables as a `globals.css` file with CSS custom properties aligned to shadcn/ui's theming system. Run this whenever a designer updates colors, spacing, or typography to keep your codebase in sync.

### Inspect
Select any frame or component instance and get:
- **Tailwind CSS classes** for layout and styling
- **JSX snippet** for mapped shadcn/ui components with correct props — no clicking required, updates automatically on selection

### Dev
Inspect any component instance's full property tree — variants, text values, booleans, and instance swaps — and generate a draft JSON payload useful for extending the component mapping.

---

## Why Obra?

[Obra shadcn/ui kit](https://www.figma.com/community/file/obra-shadcn-ui-kit) is a Figma component library built to mirror shadcn/ui exactly. Its components share the same names and variant structure as shadcn/ui props, making the mapping deterministic.

**Example — Button in Obra:**
```
Variant: Primary | Secondary | Outline | Ghost | Destructive
Size:    Default | Small | Mini | Large | Extra Large
```

**Maps directly to shadcn/ui:**
```jsx
<Button variant="outline" size="sm">Label</Button>
```

No interpretation needed. The plugin reads Obra's component properties and generates the correct JSX.

**Supported Obra components:**
Accordion, Alert, Alert Dialog, Avatar, Badge, Breadcrumb, Button, Button Group, Card, Carousel, Charts, Checkbox, Command, Data Table, Date Picker & Calendar, Dialog, Drawer, Field, Hover Card, Icon Button, Input, Input OTP, Kbd, Label, Link Button, Loading Button, Navigation Menu, Pagination, Popover, Progress, Radio, Select & Combobox, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toggle & Toggle Group, Tooltip.

---

## Getting Started

### 1. Set up the design system

Have your designers duplicate the [Obra shadcn/ui kit](https://www.figma.com/community/file/obra-shadcn-ui-kit) into your Figma workspace and use it as the base for all UI work.

### 2. Install the plugin

1. Open Figma → **Plugins** → **Development** → **Import plugin from manifest**
2. Select `plugin/manifest.json` from this repo

### 3. Use it

- **Designers**: Work as usual in Figma using Obra components and Figma variables.
- **Engineers**: Open the plugin, select any frame or component, and copy the generated JSX or Tailwind classes directly into your codebase.
- **On design changes**: Re-run **Export Tokens** to get an updated `globals.css` with only what changed.

---

## Development

```bash
cd plugin
npm install
npm run dev   # watch mode
npm run build # single build
```

The plugin UI is written in HTML + TypeScript, styled with Tailwind CSS (CDN). The backend (`code.ts`) runs in Figma's sandbox and communicates with the UI via `postMessage`.

## Project Structure

```
plugin/
  src/
    ui.html       # Plugin UI (Tailwind CSS)
    ui.ts         # UI logic (DOM, message handling)
    code.ts       # Plugin backend (Figma API)
    jsx.ts        # JSX generation for mapped components
    tailwind.ts   # Tailwind class extraction
    lib/          # Shared utilities
  dist/           # Built output loaded by Figma
  manifest.json
```

## Environment

Create a `.env` file with your Figma personal access token if needed for API access:

```
FIGMA_TOKEN=your_token_here
```

> `.env` is gitignored — never commit it.
