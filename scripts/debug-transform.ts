// Debug script for src/tokens/transform.ts
// Uses hardcoded inputs — no Figma connection needed.
//
// Usage: tsx scripts/debug-transform.ts

import { toCssVarName, rgbaToHex, toCssValue } from "../src/tokens/transform.js";

// ---- toCssVarName ----
console.log("=== toCssVarName (ADR-002 cases) ===");
const nameCases: [string, string, string][] = [
  ["semantic colors", "general/background",     "--background"],
  ["semantic colors", "general/primary",         "--primary"],
  ["semantic colors", "general/primary foreground", "--primary-foreground"],
  ["semantic colors", "card/card",               "--card"],
  ["semantic colors", "card/card foreground",    "--card-foreground"],
  ["semantic colors", "popover/popover",         "--popover"],
  ["semantic colors", "popover/popover foreground", "--popover-foreground"],
  ["raw colors",      "red/500",                 "--color-red-500"],
  ["brand colors",    "brand-neutrals/900",      "--color-brand-neutrals-900"],
  ["border radii",    "md",                      "--radius-md"],
  ["spacing",         "4",                       "--spacing-4"],
  ["typography",      "body/size",               "--typography-body-size"],
  ["shadows",         "md",                      "--shadow-md"],
];

let allPassed = true;
for (const [col, path, expected] of nameCases) {
  const result = toCssVarName(col, path);
  const pass = result === expected;
  if (!pass) allPassed = false;
  console.log(`  ${pass ? "✓" : "✗"} [${col}] "${path}" → ${result} ${pass ? "" : `(expected ${expected})`}`);
}
console.log(allPassed ? "\nAll passed." : "\nSome failed — check transform.ts rules.");

// ---- rgbaToHex ----
console.log("\n=== rgbaToHex ===");
console.log(" ", rgbaToHex({ r: 1, g: 1, b: 1, a: 1 }));     // #ffffff
console.log(" ", rgbaToHex({ r: 0, g: 0, b: 0, a: 1 }));     // #000000
console.log(" ", rgbaToHex({ r: 1, g: 0, b: 0, a: 0.5 }));   // #ff000080
console.log(" ", rgbaToHex({ r: 0.071, g: 0.071, b: 0.071, a: 1 })); // ~#121212

// ---- toCssValue ----
console.log("\n=== toCssValue ===");
const varNames = new Map([["var-id-1", "--primary"]]);
console.log(" ", toCssValue({ r: 1, g: 1, b: 1, a: 1 }, varNames));                   // #ffffff
console.log(" ", toCssValue(42, varNames));                                              // 42
console.log(" ", toCssValue("bold", varNames));                                          // bold
console.log(" ", toCssValue({ type: "VARIABLE_ALIAS", id: "var-id-1" }, varNames));     // var(--primary)
console.log(" ", toCssValue({ type: "VARIABLE_ALIAS", id: "missing" }, varNames));      // unset
