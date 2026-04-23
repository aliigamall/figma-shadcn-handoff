// Debug script for src/tokens/generate.ts
// Uses mock tokens — no Figma connection needed.
//
// Usage: tsx scripts/debug-generate.ts

import { generateCss } from "../src/tokens/generate.js";

const mockTokens = [
  { cssVar: "--background",       light: "#ffffff",  dark: "#09090b",  collection: "semantic colors" },
  { cssVar: "--foreground",       light: "#09090b",  dark: "#fafafa",  collection: "semantic colors" },
  { cssVar: "--primary",          light: "#18181b",  dark: "#fafafa",  collection: "semantic colors" },
  { cssVar: "--primary-foreground", light: "#fafafa", dark: "#18181b", collection: "semantic colors" },
  { cssVar: "--card",             light: "#ffffff",  dark: "#09090b",  collection: "semantic colors" },
  { cssVar: "--radius-md",        light: "6px",                        collection: "border radii" },
  { cssVar: "--spacing-4",        light: "16px",                       collection: "spacing" },
];

const css = generateCss(mockTokens);
console.log(css);
