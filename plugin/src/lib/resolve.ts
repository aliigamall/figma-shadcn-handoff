import type { FigmaVariable, FigmaVariableValue } from "./types";

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

  // One level only (ADR-004)
  const target = allVariables[value.id];
  if (!target) return value;

  return target.valuesByMode[modeId] ?? value;
}
