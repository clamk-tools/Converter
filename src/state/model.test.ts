import { describe, expect, it } from "vitest";

import type { UnitId } from "../units/units";
import { boxText, derive, initialState, reducer } from "./model";
import type { Action, FieldId, QuantityId, State } from "./model";

// Drives the state the way the page does: typing in a box, leaving it, choosing a unit.
const run = (actions: Action[], from: State = initialState) => actions.reduce(reducer, from);
const type = (field: FieldId, unit: UnitId, text: string): Action => ({ type: "type", field, unit, text });
const typed = (field: FieldId, unit: UnitId, text: string): Action[] => [type(field, unit, text), { type: "leave", field }];
const boxes = (state: State, quantity: QuantityId, units: UnitId[]) => {
  const derived = derive(state);
  return Object.fromEntries(units.map((u) => [u, boxText(state, derived, quantity, u)]));
};

const MOLAR: UnitId[] = ["M", "mM", "uM", "nM", "pM"];
const VOLUMES: UnitId[] = ["L", "mL", "uL", "nL"];
const MASSES: UnitId[] = ["g", "mg", "ug", "ng"];

describe("equivalent units stay in sync", () => {
  it("100 µM fills every concentration box", () => {
    const s = run(typed("concentration", "uM", "100"));
    expect(boxes(s, "concentration", MOLAR)).toEqual({ M: "0.0001", mM: "0.1", uM: "100", nM: "100000", pM: "100000000" });
  });

  it("0.25 mM typed in another box updates them all", () => {
    const s = run([...typed("concentration", "uM", "100"), ...typed("concentration", "mM", "0.25")]);
    expect(boxes(s, "concentration", MOLAR)).toEqual({ M: "0.00025", mM: "0.25", uM: "250", nM: "250000", pM: "250000000" });
  });

  it("2 mL and 5 mg fill their groups", () => {
    const s = run([...typed("volume", "mL", "2"), ...typed("mass", "mg", "5")]);
    expect(boxes(s, "volume", VOLUMES)).toEqual({ L: "0.002", mL: "2", uL: "2000", nL: "2000000" });
    // mass is the answer by default; solve for concentration so it is an input
    const t = run([{ type: "solveFor", target: "concentration" }, ...typed("mass", "mg", "5")]);
    expect(boxes(t, "mass", MASSES)).toEqual({ g: "0.005", mg: "5", ug: "5000", ng: "5000000" });
    expect(s.entries.mass.kind).toBe("empty"); // typing in the answer box does nothing
  });

  it("stores one value per quantity, in its canonical unit", () => {
    const s = run(typed("concentration", "uM", "100"));
    expect(s.entries.concentration).toEqual({ kind: "value", amount: { dimension: "molar", value: 0.0001 } });
  });

  it("follows a value while it is typed, without rewriting the box being typed in", () => {
    let s = run([type("concentration", "uM", "1")]);
    s = reducer(s, type("concentration", "uM", "1e"));
    expect(boxText(s, derive(s), "concentration", "uM")).toBe("1e"); // the user's text, left alone
    expect(boxText(s, derive(s), "concentration", "nM")).toBe("1000"); // the last complete value meanwhile
    s = reducer(s, type("concentration", "uM", "1e-"));
    s = reducer(s, type("concentration", "uM", "1e-3"));
    expect(boxText(s, derive(s), "concentration", "nM")).toBe("1");
    s = reducer(s, { type: "leave", field: "concentration" });
    expect(boxText(s, derive(s), "concentration", "uM")).toBe("0.001");
  });

  it("keeps a trailing point while typing", () => {
    const s = run([type("volume", "mL", "0.")]);
    expect(boxText(s, derive(s), "volume", "mL")).toBe("0.");
  });
});

describe("changing unit keeps the quantity", () => {
  it("100 µM shown in mM is 0.1 mM", () => {
    let s = run([{ type: "unit", quantity: "concentration", unit: "uM" }, ...typed("concentration", "uM", "100")]);
    const before = s.entries.concentration;
    s = reducer(s, { type: "unit", quantity: "concentration", unit: "mM" });
    expect(s.entries.concentration).toEqual(before);
    expect(boxText(s, derive(s), "concentration", s.units.concentration)).toBe("0.1");
  });

  it("1 mL shown in µL is 1000 µL", () => {
    let s = run(typed("volume", "mL", "1"));
    s = reducer(s, { type: "unit", quantity: "volume", unit: "uL" });
    expect(s.entries.volume).toEqual({ kind: "value", amount: { dimension: "volume", value: 0.001 } });
    expect(boxText(s, derive(s), "volume", s.units.volume)).toBe("1000");
  });
});

describe("dependent quantities recalculate", () => {
  const glucose = [...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10"), ...typed("concentration", "mM", "100")];

  it("solves the sanity check: 180.16 mg, in every mass unit", () => {
    const s = run(glucose);
    expect(boxes(s, "mass", MASSES)).toEqual({ g: "0.18016", mg: "180.16", ug: "180160", ng: "180160000" });
    expect(boxText(s, derive(s), "moles", "mmol")).toBe("1");
  });

  it("recalculates when an input changes: 200 mM doubles the mass", () => {
    const s = run([...glucose, ...typed("concentration", "mM", "200")]);
    expect(boxText(s, derive(s), "mass", "mg")).toBe("360.32");
  });

  it("solves for concentration and for volume", () => {
    const c = run([{ type: "solveFor", target: "concentration" }, ...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10"), ...typed("mass", "mg", "180.16")]);
    expect(boxText(c, derive(c), "concentration", "mM")).toBe("100");
    const v = run([{ type: "solveFor", target: "volume" }, ...typed("molarMass", "g_mol", "180.16"), ...typed("concentration", "M", "0.1"), ...typed("mass", "g", "0.18016")]);
    expect(boxes(v, "volume", VOLUMES)).toEqual({ L: "0.01", mL: "10", uL: "10000", nL: "10000000" });
  });

  it("keeps the answer as an input when another quantity is solved for", () => {
    let s = run(glucose);
    s = reducer(s, { type: "solveFor", target: "concentration" });
    expect(s.entries.mass).toEqual({ kind: "value", amount: { dimension: "mass", value: 0.18016 } });
    expect(boxText(s, derive(s), "concentration", "mM")).toBe("100");
  });

  it("takes the molecular weight in kDa", () => {
    const s = run([...typed("molarMass", "kDa", "66.5"), ...typed("volume", "mL", "1"), ...typed("concentration", "uM", "10")]); // BSA
    expect(boxText(s, derive(s), "molarMass", "g_mol")).toBe("66500");
    expect(boxText(s, derive(s), "mass", "mg")).toBe("0.665");
  });

  it("shows a molar concentration as a mass concentration through MW, and the other way", () => {
    const s = run(glucose);
    expect(boxText(s, derive(s), "concentration", "mg_mL")).toBe("18.016");
    const t = run([...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10"), ...typed("concentration", "mg_mL", "18.016")]);
    expect(boxText(t, derive(t), "concentration", "mM")).toBe("100");
    expect(boxText(t, derive(t), "mass", "mg")).toBe("180.16");
  });

  it("leaves the mass-concentration boxes empty until there is a molecular weight", () => {
    const s = run(typed("concentration", "mM", "100"));
    expect(boxText(s, derive(s), "concentration", "mg_mL")).toBe("");
    expect(derive(s).solution.missing).toEqual(["molarMass", "volume"]);
  });
});

describe("validation", () => {
  it("says what is wrong at the box, and gives no result", () => {
    const s = run([...typed("molarMass", "g_mol", "0"), ...typed("volume", "mL", "10"), ...typed("concentration", "mM", "100")]);
    const d = derive(s);
    expect(d.quantities.molarMass.issue).toBe("Molecular weight must be greater than zero.");
    expect(d.quantities.mass.amount).toBeNull();
  });

  it("flags text that is not a number, and a number left incomplete", () => {
    const s = run(typed("volume", "mL", "ten"));
    expect(derive(s).quantities.volume.issue).toMatch(/Not a number/);
    const t = run(typed("volume", "mL", "1e-"));
    expect(derive(t).quantities.volume.issue).toBe("This number is not complete.");
    expect(boxText(t, derive(t), "volume", "mL")).toBe("");
  });

  it("refuses negative and zero volumes", () => {
    const base = [...typed("molarMass", "g_mol", "180.16"), ...typed("concentration", "mM", "100")];
    expect(derive(run([...base, ...typed("volume", "mL", "-5")])).quantities.volume.issue).toBe("Volume cannot be negative.");
    expect(derive(run([...base, ...typed("volume", "mL", "0")])).quantities.volume.issue).toBe("Volume must be greater than zero.");
  });

  it("clearing a box empties the quantity", () => {
    const s = run([...typed("volume", "mL", "10"), ...typed("volume", "uL", "")]);
    expect(s.entries.volume.kind).toBe("empty");
    expect(boxText(s, derive(s), "volume", "mL")).toBe("");
  });
});

describe("dilution", () => {
  const dilute = (stock: [UnitId, string], target: [UnitId, string], volume: [UnitId, string], extra: Action[] = []) =>
    run([...extra, ...typed("stock", ...stock), ...typed("target", ...target), ...typed("finalVolume", ...volume)]);

  it("solves the sanity check: 1 M to 10 mM in 100 mL takes 1 mL of stock", () => {
    const s = dilute(["M", "1"], ["mM", "10"], ["mL", "100"]);
    expect(boxes(s, "stockVolume", VOLUMES)).toEqual({ L: "0.001", mL: "1", uL: "1000", nL: "1000000" });
    expect(boxText(s, derive(s), "diluentVolume", "mL")).toBe("99");
    expect(derive(s).dilution.factor).toBe(100);
  });

  it("refuses a target above the stock", () => {
    const s = dilute(["mM", "10"], ["mM", "100"], ["mL", "10"]);
    const d = derive(s);
    expect(d.dilution.stockVolume).toBeNull();
    expect(d.quantities.target.issue).toMatch(/more concentrated than the stock/);
  });

  it("compares a mg/mL stock with a molar target only with a molecular weight", () => {
    const without = derive(dilute(["mg_mL", "18.016"], ["mM", "10"], ["mL", "100"]));
    expect(without.dilution.stockVolume).toBeNull();
    expect(without.quantities.target.issue).toMatch(/molecular weight/);
    const withMw = dilute(["mg_mL", "18.016"], ["mM", "10"], ["mL", "100"], typed("molarMass", "g_mol", "180.16")); // a 100 mM stock
    expect(boxText(withMw, derive(withMw), "stockVolume", "mL")).toBe("10");
  });

  it("equal concentrations in different units are no dilution", () => {
    const s = dilute(["mM", "1"], ["uM", "1000"], ["mL", "5"]);
    expect(derive(s).dilution.note).toMatch(/equals the stock/);
    expect(boxText(s, derive(s), "stockVolume", "mL")).toBe("5");
  });
});
