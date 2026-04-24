# Figma Handoff

A Figma plugin that bridges your Figma designs and [shadcn/ui](https://ui.shadcn.com/) components — export design tokens, inspect Tailwind classes, and generate JSX for mapped components.

## Features

- **Export Tokens** — Export Figma variables as a `globals.css` file with CSS custom properties ready for shadcn/ui.
- **Inspect** — Select any node and get its Tailwind CSS classes. For mapped components, get a JSX snippet with the correct props.
- **Dev** — Inspect component instances, view all properties and their current values, and generate a draft JSON for mapping new components.

## Getting Started

### Install the plugin

1. Open Figma → **Plugins** → **Development** → **Import plugin from manifest**
2. Select `plugin/manifest.json` from this repo

### Development

```bash
cd plugin
npm install
npm run dev   # watch mode — rebuilds on changes
```

```bash
npm run build # single build
```

The plugin UI is written in plain HTML + TypeScript and styled with Tailwind CSS (CDN). The plugin backend (`code.ts`) runs in Figma's sandbox and communicates with the UI via `postMessage`.

## Project Structure

```
plugin/
  src/
    ui.html       # Plugin UI markup (Tailwind CSS)
    ui.ts         # UI logic (DOM, message handling)
    code.ts       # Plugin backend (Figma API)
    jsx.ts        # JSX generation for mapped components
    tailwind.ts   # Tailwind class extraction
    lib/          # Shared utilities
  dist/           # Built output (loaded by Figma)
  manifest.json
```

## Environment Variables

Create a `.env` file in the root with your Figma personal access token:

```
FIGMA_TOKEN=your_token_here
```

> Never commit `.env` — it is gitignored.
