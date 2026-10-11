import { describe, expect, it } from "vitest";

import { concentrationFrom, finalVolumeFrom, massConcentrationOf, massFrom, molarConcentrationOf, moles, stockFrom, stockVolumeFrom, targetFrom, volumeFrom } from "./equations";
import { HIGHER_THAN_STOCK, LARGER_THAN_FINAL, TOO_LARGE, TOO_SMALL, checkConversion, solveDilution, solveSolution } from "./solve";

// Glucose: MW 180.16 g/mol. 100 mM in 10 mL needs 180.16 mg (doc/CALCULATIONS.md, worked example).
const MW = 180.16;

describe("equations", () => {
  it("moles = mass / MW", () => {
    expect(moles(0.18016, MW)).toBeCloseTo(0.001, 15);
  });
  it("mass = C × V × MW", () => {
    expect(massFrom(0.1, 0.01, MW)).toBeCloseTo(0.18016, 15);
  });
  it("concentration = mass / (MW × V)", () => {
    expect(concentrationFrom(0.18016, MW, 0.01)).toBeCloseTo(0.1, 15);
  });
  it("volume = mass / (C × MW)", () => {
    expect(volumeFrom(0.18016, 0.1, MW)).toBeCloseTo(0.01, 15);
  });
  it("V1 = C2 × V2 / C1", () => {
    expect(stockVolumeFrom(1, 0.01, 0.1)).toBeCloseTo(0.001, 15);
    expect(finalVolumeFrom(1, 0.001, 0.01)).toBeCloseTo(0.1, 15);
    expect(stockFrom(0.01, 0.1, 0.001)).toBeCloseTo(1, 15);
    expect(targetFrom(1, 0.001, 0.1)).toBeCloseTo(0.01, 15);
  });
});

describe("converting a concentration", () => {
  it("Cm = C × MW and C = Cm / MW", () => {
    expect(massConcentrationOf(0.1, MW)).toBeCloseTo(18.016, 12); // 0.1 mol/L × 180.16 g/mol
    expect(molarConcentrationOf(18.016, MW)).toBeCloseTo(0.1, 15);
    expect(molarConcentrationOf(massConcentrationOf(0.0123, 58.44), 58.44)).toBeCloseTo(0.0123, 15);
  });

  it("accepts zero, and refuses a negative concentration or a molecular weight of zero or less", () => {
    expect(checkConversion(0, MW).issues).toEqual([]);
    expect(checkConversion(null, null).issues).toEqual([]);
    expect(checkConversion(null, 100).issues).toEqual([]);
    expect(checkConversion(-1, MW).issues).toEqual([{ input: "converter", message: "Concentration cannot be negative." }]);
    expect(checkConversion(1, 0).issues).toEqual([{ input: "molarMass", message: "Molecular weight must be greater than zero." }]);
    expect(checkConversion(1, -5).issues[0].input).toBe("molarMass");
  });
});

describe("solveSolution", () => {
  it("solves the sanity check: 100 mM, 10 mL, 180.16 g/mol → 0.18016 g", () => {
    const r = solveSolution("mass", { molarMass: MW, concentration: 0.1, volume: 0.01, mass: null });
    expect(r.value).toBeCloseTo(0.18016, 15);
    expect(r.moles).toBeCloseTo(0.001, 15);
    expect(r.issues).toEqual([]);
  });

  it("solves for concentration and for volume, ignoring the quantity being solved", () => {
    expect(solveSolution("concentration", { molarMass: MW, concentration: 999, volume: 0.01, mass: 0.18016 }).value).toBeCloseTo(0.1, 15);
    expect(solveSolution("volume", { molarMass: MW, concentration: 0.1, volume: 999, mass: 0.18016 }).value).toBeCloseTo(0.01, 15);
  });

  it("lists what is missing, and gives no result until it is there", () => {
    const r = solveSolution("mass", { molarMass: null, concentration: 0.1, volume: null, mass: null });
    expect(r.value).toBeNull();
    expect(r.missing).toEqual(["molarMass", "volume"]);
  });

  it("refuses zero or negative molecular weight and volume", () => {
    for (const molarMass of [0, -1]) {
      const r = solveSolution("mass", { molarMass, concentration: 0.1, volume: 0.01, mass: null });
      expect(r.value).toBeNull();
      expect(r.issues[0].input).toBe("molarMass");
    }
    expect(solveSolution("mass", { molarMass: MW, concentration: 0.1, volume: 0, mass: null }).issues[0].message).toBe("Volume must be greater than zero.");
    expect(solveSolution("concentration", { molarMass: MW, concentration: null, volume: -1, mass: 1 }).issues[0].message).toBe("Volume cannot be negative.");
  });

  it("refuses a negative mass or concentration, and a zero that would divide by zero", () => {
    expect(solveSolution("concentration", { molarMass: MW, concentration: null, volume: 1, mass: -1 }).issues[0].message).toBe("Mass cannot be negative.");
    expect(solveSolution("mass", { molarMass: MW, concentration: -1, volume: 1, mass: null }).issues[0].input).toBe("concentration");
    const zero = solveSolution("volume", { molarMass: MW, concentration: 0, volume: null, mass: 1 });
    expect(zero.value).toBeNull();
    expect(zero.issues[0].message).toBe("Concentration must be greater than zero to calculate a volume.");
  });

  it("accepts zero where it means nothing dissolved", () => {
    expect(solveSolution("mass", { molarMass: MW, concentration: 0, volume: 1, mass: null }).value).toBe(0);
    expect(solveSolution("concentration", { molarMass: MW, concentration: null, volume: 1, mass: 0 }).value).toBe(0);
  });

  it("handles tiny and huge values", () => {
    const tiny = solveSolution("mass", { molarMass: MW, concentration: 1e-12, volume: 1e-9, mass: null }); // 1 pM in 1 nL
    expect(tiny.value).toBeCloseTo(1.8016e-19, 30);
    expect(tiny.value! / 1.8016e-19).toBeCloseTo(1, 12);
    const huge = solveSolution("mass", { molarMass: 1e6, concentration: 10, volume: 1e3, mass: null });
    expect(huge.value).toBe(1e10);
    expect(huge.outOfRange).toBeNull();
  });

  it("says why there is no answer when it is beyond what a double holds (about 10^±308)", () => {
    const over = solveSolution("mass", { molarMass: 1e300, concentration: 1e300, volume: 1, mass: null });
    expect(over.value).toBeNull();
    expect(over.outOfRange).toBe(TOO_LARGE);
    const under = solveSolution("mass", { molarMass: 1e-200, concentration: 1e-200, volume: 1, mass: null }); // 1e-400: rounds to 0
    expect(under.value).toBeNull();
    expect(under.outOfRange).toBe(TOO_SMALL);
    expect(solveSolution("volume", { molarMass: 1e-300, concentration: 1e-300, volume: null, mass: 1 }).outOfRange).toBe(TOO_LARGE);
    // a zero factor is a true zero, not an underflow: 0 M needs 0 g
    const zero = solveSolution("mass", { molarMass: MW, concentration: 0, volume: 1e-300, mass: null });
    expect(zero.value).toBe(0);
    expect(zero.outOfRange).toBeNull();
  });
});

describe("solveDilution: C₁V₁ = C₂V₂, any one from the other three", () => {
  const sanity = { stock: 1, stockVolume: 0.001, target: 0.01, finalVolume: 0.1 }; // 1 M, 1 mL, 10 mM, 100 mL
  const without = (k: keyof typeof sanity) => ({ ...sanity, [k]: null });

  it("finds V₁: 1 M stock to 10 mM in 100 mL takes 1 mL of stock", () => {
    const r = solveDilution("stockVolume", without("stockVolume"));
    expect(r.value).toBeCloseTo(0.001, 15);
    expect(r.diluentVolume).toBeCloseTo(0.099, 15);
    expect(r.factor).toBe(100);
    expect(r.issues).toEqual([]);
  });

  it("finds V₂, C₁ and C₂ from the same solution", () => {
    expect(solveDilution("finalVolume", without("finalVolume")).value).toBeCloseTo(0.1, 15);
    expect(solveDilution("stock", without("stock")).value).toBeCloseTo(1, 15);
    expect(solveDilution("target", without("target")).value).toBeCloseTo(0.01, 15);
    expect(solveDilution("target", without("target")).factor).toBeCloseTo(100, 10);
  });

  it("ignores the value of the quantity it finds", () => {
    expect(solveDilution("stockVolume", { ...sanity, stockVolume: 42 }).value).toBeCloseTo(0.001, 15);
  });

  it("refuses C₂ above C₁ when finding a volume, and says why", () => {
    const r = solveDilution("stockVolume", { stock: 0.01, stockVolume: null, target: 0.1, finalVolume: 0.1 }); // 10 mM stock, 100 mM final
    expect(r.value).toBeNull();
    expect(r.issues).toEqual([{ input: "target", message: HIGHER_THAN_STOCK }]);
    expect(solveDilution("finalVolume", { stock: 0.01, stockVolume: 0.001, target: 0.1, finalVolume: null }).issues).toEqual([{ input: "target", message: HIGHER_THAN_STOCK }]);
  });

  it("refuses V₁ above V₂ when finding a concentration, and says why", () => {
    const r = solveDilution("target", { stock: 1, stockVolume: 0.2, target: null, finalVolume: 0.1 });
    expect(r.value).toBeNull();
    expect(r.issues).toEqual([{ input: "stockVolume", message: LARGER_THAN_FINAL }]);
    expect(solveDilution("stock", { stock: null, stockVolume: 0.2, target: 0.01, finalVolume: 0.1 }).issues[0].input).toBe("stockVolume");
  });

  it("takes equal concentrations, or equal volumes, as no dilution", () => {
    const r = solveDilution("stockVolume", { stock: 0.001, stockVolume: null, target: 0.001, finalVolume: 0.05 });
    expect(r.value).toBe(0.05);
    expect(r.diluentVolume).toBe(0);
    expect(r.note).toMatch(/equals C₁/);
    expect(solveDilution("target", { stock: 0.5, stockVolume: 0.01, target: null, finalVolume: 0.01 }).value).toBe(0.5);
  });

  it("refuses zero or negative inputs (a zero would divide by zero)", () => {
    expect(solveDilution("stockVolume", { ...without("stockVolume"), stock: 0 }).issues[0]).toEqual({ input: "stock", message: "C₁ must be greater than zero." });
    expect(solveDilution("stockVolume", { ...without("stockVolume"), target: 0 }).issues[0].input).toBe("target");
    expect(solveDilution("stockVolume", { ...without("stockVolume"), finalVolume: -1 }).issues[0].input).toBe("finalVolume");
    expect(solveDilution("stock", { ...without("stock"), stockVolume: 0 }).value).toBeNull();
  });

  it("says why there is no answer when it is too large or too small to calculate", () => {
    const over = solveDilution("finalVolume", { stock: 1e300, stockVolume: 1e300, target: 1, finalVolume: null });
    expect(over.value).toBeNull();
    expect(over.outOfRange).toBe(TOO_LARGE);
    expect(solveDilution("stockVolume", { stock: 1e300, stockVolume: null, target: 1e-10, finalVolume: 1e-10 }).outOfRange).toBe(TOO_SMALL);
    expect(solveDilution("stockVolume", { stock: 1, stockVolume: null, target: 0.01, finalVolume: 0.1 }).outOfRange).toBeNull();
  });

  it("lists what is missing, in the order of the page", () => {
    expect(solveDilution("stockVolume", { stock: null, stockVolume: null, target: 0.01, finalVolume: null }).missing).toEqual(["stock", "finalVolume"]);
    expect(solveDilution("target", { stock: 1, stockVolume: null, target: null, finalVolume: null }).missing).toEqual(["stockVolume", "finalVolume"]);
  });
});
