// Debug script for src/tokens/api.ts
// Prints the raw Figma API response shape so you can verify collections + variable names.
//
// Usage: tsx scripts/debug-api.ts
// Requires: FIGMA_PAT and FIGMA_FILE_KEY in .env

import "dotenv/config";
import { fetchVariables } from "../src/tokens/api.js";

const pat = process.env.FIGMA_PAT;
const fileKey = process.env.FIGMA_FILE_KEY;

if (!pat || !fileKey) {
  console.error("Set FIGMA_PAT and FIGMA_FILE_KEY in .env");
  process.exit(1);
}

const { collections, variables } = await fetchVariables(fileKey, pat);

console.log("\n=== Collections ===");
for (const col of Object.values(collections)) {
  console.log(`  [${col.name}] modes: ${col.modes.map((m) => m.name).join(", ")} | variables: ${col.variableIds.length}`);
}

console.log("\n=== First 10 variables ===");
for (const v of Object.values(variables).slice(0, 10)) {
  const col = collections[v.variableCollectionId];
  const modeId = col?.defaultModeId;
  const val = modeId ? v.valuesByMode[modeId] : "?";
  console.log(`  [${col?.name}] ${v.name} = ${JSON.stringify(val)}`);
}

console.log(`\nTotal: ${Object.keys(collections).length} collections, ${Object.keys(variables).length} variables`);
