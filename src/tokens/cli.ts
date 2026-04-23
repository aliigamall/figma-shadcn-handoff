// Entry point for the token export CLI.
// Usage: npm run export-tokens [collectionName]
//
// Reads FIGMA_PAT and FIGMA_FILE_KEY from environment (ADR-008).
// Writes globals.css to OUTPUT_PATH (ADR-005).

import "dotenv/config";
import { writeFileSync } from "fs";
import { fetchVariables } from "./api.js";
import { resolveValue } from "./resolve.js";
import { toCssVarName, toCssValue } from "./transform.js";
import { generateCss, OUTPUT_PATH } from "./generate.js";
import type { ResolvedToken } from "./types.js";

async function main() {
  const pat = process.env.FIGMA_PAT;
  const fileKey = process.env.FIGMA_FILE_KEY;
  const collectionFilter = process.argv[2]; // optional: filter by collection name

  if (!pat || !fileKey) {
    console.error("Error: FIGMA_PAT and FIGMA_FILE_KEY must be set in .env");
    process.exit(1);
  }

  console.log(`Fetching variables from file: ${fileKey}`);
  const { collections, variables } = await fetchVariables(fileKey, pat);

  // Pre-build variableId → cssVarName map so alias values can reference their target var
  const cssVarNames = new Map<string, string>();
  for (const variable of Object.values(variables)) {
    const collection = collections[variable.variableCollectionId];
    if (!collection) continue;
    cssVarNames.set(variable.id, toCssVarName(collection.name, variable.name));
  }

  const tokens: ResolvedToken[] = [];

  for (const collection of Object.values(collections)) {
    if (
      collectionFilter &&
      collection.name.toLowerCase() !== collectionFilter.toLowerCase()
    ) continue;

    // ADR-003: first mode = light, second mode = dark
    const [lightModeId, darkModeId] = collection.modes.map((m) => m.modeId);

    for (const variableId of collection.variableIds) {
      const variable = variables[variableId];
      if (!variable || variable.resolvedType === "BOOLEAN") continue;

      const cssVar = toCssVarName(collection.name, variable.name);

      const rawLight = variable.valuesByMode[lightModeId];
      const rawDark = darkModeId ? variable.valuesByMode[darkModeId] : undefined;

      // ADR-004: resolve one level of aliases
      const resolvedLight = resolveValue(rawLight, lightModeId, variables);
      const resolvedDark = rawDark
        ? resolveValue(rawDark, darkModeId, variables)
        : undefined;

      tokens.push({
        cssVar,
        light: toCssValue(resolvedLight, cssVarNames),
        dark: resolvedDark ? toCssValue(resolvedDark, cssVarNames) : undefined,
        collection: collection.name,
      });
    }
  }

  const css = generateCss(tokens);
  writeFileSync(OUTPUT_PATH, css, "utf-8");
  console.log(`Written ${tokens.length} tokens to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
