// Resolves variable aliases one level deep (ADR-004).
//
// Rule: if a variable's value for a mode is a VARIABLE_ALIAS,
// look up the target variable and return its value in the same mode.
// Do NOT recurse further — the alias target name becomes the reference.

import type { FigmaVariable, FigmaVariableValue } from "./types.js";

export function resolveValue(
  value: FigmaVariableValue,
  modeId: string,
  allVariables: Record<string, FigmaVariable>
): FigmaVariableValue {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    value.type !== "VARIABLE_ALIAS"
  ) {
    return value;
  }

  // One level only (ADR-004): look up the alias target and return its raw value
  const target = allVariables[value.id];
  if (!target) return value; // target not found — return alias unchanged

  return target.valuesByMode[modeId] ?? value;
}
