// Debug script for src/tokens/resolve.ts
// Uses mock data — no Figma connection needed.
//
// Usage: tsx scripts/debug-resolve.ts

import { resolveValue } from "../src/tokens/resolve.js";
import type { FigmaVariable } from "../src/tokens/types.js";

const mockVariables: Record<string, FigmaVariable> = {
  "abc": {
    id: "abc", name: "raw/white", resolvedType: "COLOR",
    variableCollectionId: "c1",
    valuesByMode: { "m1": { r: 1, g: 1, b: 1, a: 1 }, "m2": { r: 0.95, g: 0.95, b: 0.95, a: 1 } },
  },
  "def": {
    id: "def", name: "general/background", resolvedType: "COLOR",
    variableCollectionId: "c1",
    // This variable aliases "abc"
    valuesByMode: { "m1": { type: "VARIABLE_ALIAS", id: "abc" }, "m2": { type: "VARIABLE_ALIAS", id: "abc" } },
  },
};

const cases = [
  { label: "non-alias → returns as-is",     value: { r: 1, g: 0, b: 0, a: 1 }, modeId: "m1" },
  { label: "alias → resolves one level",     value: { type: "VARIABLE_ALIAS" as const, id: "abc" }, modeId: "m1" },
  { label: "alias dark mode → resolves m2",  value: { type: "VARIABLE_ALIAS" as const, id: "abc" }, modeId: "m2" },
  { label: "alias unknown id → unchanged",   value: { type: "VARIABLE_ALIAS" as const, id: "MISSING" }, modeId: "m1" },
];

for (const { label, value, modeId } of cases) {
  const result = resolveValue(value, modeId, mockVariables);
  console.log(`[${label}]`);
  console.log("  input: ", JSON.stringify(value));
  console.log("  result:", JSON.stringify(result));
  console.log();
}
