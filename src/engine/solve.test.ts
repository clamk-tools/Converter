import { describe, expect, it } from "vitest";

import { concentrationFrom, massConcentrationOf, massFrom, molarConcentrationOf, moles, stockVolumeFrom, volumeFrom } from "./equations";
import { HIGHER_THAN_STOCK, solveDilution, solveSolution } from "./solve";

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
  });
  it("mass concentration = C × MW, and back", () => {
    expect(massConcentrationOf(0.1, MW)).toBeCloseTo(18.016, 12);
    expect(molarConcentrationOf(18.016, MW)).toBeCloseTo(0.1, 15);
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
    expect(solveSolution("mass", { molarMass: 1e300, concentration: 1e300, volume: 1, mass: null }).value).toBeNull(); // overflow
  });
});

describe("solveDilution", () => {
  it("solves the sanity check: 1 M stock, 10 mM target, 100 mL → 1 mL of stock", () => {
    const r = solveDilution({ stock: 1, target: 0.01, finalVolume: 0.1 });
    expect(r.stockVolume).toBeCloseTo(0.001, 15);
    expect(r.diluentVolume).toBeCloseTo(0.099, 15);
    expect(r.factor).toBe(100);
    expect(r.issues).toEqual([]);
  });

  it("refuses a target above the stock, and says why", () => {
    const r = solveDilution({ stock: 0.01, target: 0.1, finalVolume: 0.1 }); // 10 mM stock, 100 mM target
    expect(r.stockVolume).toBeNull();
    expect(r.issues).toEqual([{ input: "target", message: HIGHER_THAN_STOCK }]);
  });

  it("takes a target equal to the stock as no dilution", () => {
    const r = solveDilution({ stock: 0.001, target: 0.001, finalVolume: 0.05 });
    expect(r.stockVolume).toBe(0.05);
    expect(r.diluentVolume).toBe(0);
    expect(r.note).toMatch(/equals the stock/);
  });

  it("refuses zero or negative inputs (a zero stock would divide by zero)", () => {
    expect(solveDilution({ stock: 0, target: 0.01, finalVolume: 0.1 }).issues[0]).toEqual({ input: "stock", message: "Stock concentration must be greater than zero." });
    expect(solveDilution({ stock: 1, target: 0, finalVolume: 0.1 }).issues[0].input).toBe("target");
    expect(solveDilution({ stock: 1, target: 0.1, finalVolume: -1 }).issues[0].input).toBe("finalVolume");
    expect(solveDilution({ stock: 1, target: 0.1, finalVolume: 0 }).stockVolume).toBeNull();
  });

  it("lists what is missing", () => {
    expect(solveDilution({ stock: null, target: 0.01, finalVolume: null }).missing).toEqual(["stock", "finalVolume"]);
  });
});
