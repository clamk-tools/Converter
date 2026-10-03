import { describe, expect, it } from "vitest";

import { convert, fromCanonical, toCanonical, unitsOf } from "./units";

describe("unit conversion", () => {
  it("mass: 1 g = 1000 mg, 1 mg = 1000 µg, 1 µg = 1000 ng", () => {
    expect(convert(1, "g", "mg")).toBe(1000);
    expect(convert(1, "mg", "ug")).toBe(1000);
    expect(convert(1, "ug", "ng")).toBe(1000);
  });

  it("volume: 1 L = 1000 mL, 1 mL = 1000 µL, 1 µL = 1000 nL", () => {
    expect(convert(1, "L", "mL")).toBe(1000);
    expect(convert(1, "mL", "uL")).toBe(1000);
    expect(convert(1, "uL", "nL")).toBe(1000);
  });

  it("concentration: 1 M = 1000 mM, 1 mM = 1000 µM, 1 µM = 1000 nM, 1 nM = 1000 pM", () => {
    expect(convert(1, "M", "mM")).toBe(1000);
    expect(convert(1, "mM", "uM")).toBe(1000);
    expect(convert(1, "uM", "nM")).toBe(1000);
    expect(convert(1, "nM", "pM")).toBe(1000);
  });

  it("molecular weight: 1 kDa = 1000 g/mol; mass concentration: 1 mg/mL = 1000 µg/mL", () => {
    expect(convert(1, "kDa", "g_mol")).toBe(1000);
    expect(convert(1, "mg_mL", "ug_mL")).toBe(1000);
  });

  it("goes through the canonical unit without float noise", () => {
    expect(toCanonical(100, "uM")).toBe(0.0001); // not 0.00009999999999999999
    expect(toCanonical(2, "mL")).toBe(0.002);
    expect(toCanonical(5, "mg")).toBe(0.005);
    expect(fromCanonical(0.0001, "nM")).toBeCloseTo(100000, 9);
  });

  it("refuses to convert between dimensions", () => {
    expect(() => convert(1, "mL", "mg")).toThrow();
  });

  it("lists each dimension's units largest first", () => {
    expect(unitsOf("molar").map((u) => u.symbol)).toEqual(["M", "mM", "µM", "nM", "pM"]);
    expect(unitsOf("volume").map((u) => u.symbol)).toEqual(["L", "mL", "µL", "nL"]);
    expect(unitsOf("mass").map((u) => u.symbol)).toEqual(["g", "mg", "µg", "ng"]);
  });
});
