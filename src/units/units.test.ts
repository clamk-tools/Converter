import { describe, expect, it } from "vitest";

import { convert, fromCanonical, isPair, pair, splitPair, toCanonical, unit, unitsOf } from "./units";

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

  it("mass concentration is a pair, a mass unit per a volume unit: any of the 4 × 4", () => {
    expect(convert(1, "g/L", "mg/mL")).toBe(1);
    expect(convert(1, "mg/mL", "ug/mL")).toBe(1000);
    expect(convert(1, "ug/mL", "ng/mL")).toBe(1000);
    expect(convert(1, "g/mL", "g/L")).toBe(1000);
    expect(convert(1, "mg/L", "ug/mL")).toBe(1);
    expect(convert(1, "ug/L", "ng/mL")).toBe(1);
    expect(convert(1, "ng/uL", "ug/mL")).toBe(1);
    expect(convert(1, "g/nL", "g/L")).toBe(1e9);
    expect(convert(1, "ng/L", "g/L")).toBe(1e-9);
    expect(toCanonical(5, "mg/mL")).toBe(5); // g/L is the canonical unit, and mg/mL is the same thing
    expect(toCanonical(5, "ug/mL")).toBe(0.005);
  });

  it("names a pair from its two units, and lists every pair, then % w/v and ppm", () => {
    expect(unit("ug/mL")).toMatchObject({ symbol: "µg/mL", name: "micrograms/milliliter", dimension: "massConc", exponent: -3 });
    expect(unit("mg/L").exponent).toBe(-3);
    const all = unitsOf("massConc").map((u) => u.symbol);
    expect(all).toHaveLength(18);
    expect(all.slice(0, 5)).toEqual(["g/L", "g/mL", "g/µL", "g/nL", "mg/L"]);
    expect(all.slice(-2)).toEqual(["% w/v", "ppm"]);
    expect(isPair("mg/mL")).toBe(true);
    expect(isPair("ppm")).toBe(false);
    expect(splitPair("ug/mL")).toEqual(["ug", "mL"]);
    expect(pair("ng", "uL")).toBe("ng/uL");
  });

  it("1 % w/v is 10 g/L and 1 ppm is 1 mg/L", () => {
    expect(convert(1, "pct_wv", "g/L")).toBe(10);
    expect(convert(1, "ppm", "g/L")).toBe(0.001);
    expect(convert(1, "ppm", "mg/L")).toBe(1);
    expect(convert(1, "ppm", "ug/mL")).toBe(1);
  });

  it("names the units as GraphPad does", () => {
    expect(unitsOf("molar").map((u) => u.name)).toEqual(["molar", "millimolar", "micromolar", "nanomolar", "picomolar"]);
    expect(unitsOf("volume").map((u) => u.name)).toEqual(["liter", "milliliter", "microliter", "nanoliter"]);
    expect(unitsOf("mass").map((u) => u.name)).toEqual(["grams", "milligrams", "micrograms", "nanograms"]);
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
