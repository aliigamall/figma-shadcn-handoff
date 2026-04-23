import { describe, it, expect } from "vitest";
import { toCssVarName, rgbaToHex, toCssValue } from "./transform.js";

describe("toCssVarName — ADR-002 naming rules", () => {
  describe("semantic colors / general group → drop group prefix", () => {
    it("background", () => expect(toCssVarName("semantic colors", "general/background")).toBe("--background"));
    it("primary", () => expect(toCssVarName("semantic colors", "general/primary")).toBe("--primary"));
    it("primary foreground", () => expect(toCssVarName("semantic colors", "general/primary foreground")).toBe("--primary-foreground"));
    it("muted foreground", () => expect(toCssVarName("semantic colors", "general/muted foreground")).toBe("--muted-foreground"));
  });

  describe("semantic colors / named groups → --{group}-{name}, collapse duplicate", () => {
    it("card/card → --card (collapse duplicate)", () => expect(toCssVarName("semantic colors", "card/card")).toBe("--card"));
    it("card/card foreground → --card-foreground", () => expect(toCssVarName("semantic colors", "card/card foreground")).toBe("--card-foreground"));
    it("popover/popover → --popover", () => expect(toCssVarName("semantic colors", "popover/popover")).toBe("--popover"));
    it("popover/popover foreground → --popover-foreground", () => expect(toCssVarName("semantic colors", "popover/popover foreground")).toBe("--popover-foreground"));
  });

  describe("raw colors / brand colors → --color- prefix", () => {
    it("red/500", () => expect(toCssVarName("raw colors", "red/500")).toBe("--color-red-500"));
    it("brand-neutrals/900", () => expect(toCssVarName("brand colors", "brand-neutrals/900")).toBe("--color-brand-neutrals-900"));
  });

  describe("other collections → collection-prefixed", () => {
    it("border radii / md → --radius-md", () => expect(toCssVarName("border radii", "md")).toBe("--radius-md"));
    it("spacing / 4 → --spacing-4", () => expect(toCssVarName("spacing", "4")).toBe("--spacing-4"));
    it("typography / body/size → --typography-body-size", () => expect(toCssVarName("typography", "body/size")).toBe("--typography-body-size"));
    it("shadows / md → --shadow-md", () => expect(toCssVarName("shadows", "md")).toBe("--shadow-md"));
  });
});

describe("rgbaToHex", () => {
  it("white", () => expect(rgbaToHex({ r: 1, g: 1, b: 1, a: 1 })).toBe("#ffffff"));
  it("black", () => expect(rgbaToHex({ r: 0, g: 0, b: 0, a: 1 })).toBe("#000000"));
  it("alpha < 1 → 8-digit hex", () => expect(rgbaToHex({ r: 1, g: 0, b: 0, a: 0.5 })).toBe("#ff000080"));
  it("full alpha → 6-digit hex", () => expect(rgbaToHex({ r: 0, g: 1, b: 0, a: 1 })).toBe("#00ff00"));
});

describe("toCssValue", () => {
  const varNames = new Map([["var-1", "--primary"]]);

  it("rgba → hex", () => expect(toCssValue({ r: 1, g: 1, b: 1, a: 1 }, varNames)).toBe("#ffffff"));
  it("number → string", () => expect(toCssValue(42, varNames)).toBe("42"));
  it("string → as-is", () => expect(toCssValue("bold", varNames)).toBe("bold"));
  it("alias with known id → var(...)", () => expect(toCssValue({ type: "VARIABLE_ALIAS", id: "var-1" }, varNames)).toBe("var(--primary)"));
  it("alias with unknown id → unset", () => expect(toCssValue({ type: "VARIABLE_ALIAS", id: "missing" }, varNames)).toBe("unset"));
});
