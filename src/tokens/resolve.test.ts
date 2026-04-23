import { describe, it, expect } from "vitest";
import { resolveValue } from "./resolve.js";
import type { FigmaVariable } from "./types.js";

const mockVariables: Record<string, FigmaVariable> = {
  "raw-white": {
    id: "raw-white", name: "raw/white", resolvedType: "COLOR",
    variableCollectionId: "c1",
    valuesByMode: {
      "light": { r: 1, g: 1, b: 1, a: 1 },
      "dark":  { r: 0.95, g: 0.95, b: 0.95, a: 1 },
    },
  },
  "semantic-bg": {
    id: "semantic-bg", name: "general/background", resolvedType: "COLOR",
    variableCollectionId: "c1",
    valuesByMode: {
      "light": { type: "VARIABLE_ALIAS", id: "raw-white" },
      "dark":  { type: "VARIABLE_ALIAS", id: "raw-white" },
    },
  },
};

describe("resolveValue — ADR-004: one level only", () => {
  it("non-alias value is returned as-is", () => {
    const val = { r: 1, g: 0, b: 0, a: 1 };
    expect(resolveValue(val, "light", mockVariables)).toEqual(val);
  });

  it("alias resolves to target's value in the same mode (light)", () => {
    const alias = { type: "VARIABLE_ALIAS" as const, id: "raw-white" };
    expect(resolveValue(alias, "light", mockVariables)).toEqual({ r: 1, g: 1, b: 1, a: 1 });
  });

  it("alias resolves to target's value in the same mode (dark)", () => {
    const alias = { type: "VARIABLE_ALIAS" as const, id: "raw-white" };
    expect(resolveValue(alias, "dark", mockVariables)).toEqual({ r: 0.95, g: 0.95, b: 0.95, a: 1 });
  });

  it("alias pointing to another alias returns that alias's raw value (one level — does not recurse)", () => {
    // semantic-bg aliases raw-white; resolving semantic-bg should return raw-white's alias, not recurse
    const alias = { type: "VARIABLE_ALIAS" as const, id: "semantic-bg" };
    // One level: returns the value of semantic-bg in "light" mode, which is itself an alias
    expect(resolveValue(alias, "light", mockVariables)).toEqual({ type: "VARIABLE_ALIAS", id: "raw-white" });
  });

  it("alias with unknown id returns the alias unchanged", () => {
    const alias = { type: "VARIABLE_ALIAS" as const, id: "does-not-exist" };
    expect(resolveValue(alias, "light", mockVariables)).toEqual(alias);
  });

  it("primitive types (number, string) pass through", () => {
    expect(resolveValue(42, "light", mockVariables)).toBe(42);
    expect(resolveValue("bold", "light", mockVariables)).toBe("bold");
  });
});
