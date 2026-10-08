import { describe, expect, it } from "vitest";

import type { UnitId } from "../units/units";
import { boxText, derive, initialState, issueAt, reducer, unitOf } from "./model";
import type { Action, FieldId, QuantityId, State } from "./model";

// Drives the state the way the page does: typing in a box, leaving it, choosing a unit.
const run = (actions: Action[], from: State = initialState) => actions.reduce(reducer, from);
const type = (field: FieldId, unit: UnitId, text: string): Action => ({ type: "type", field, unit, text });
const typed = (field: FieldId, unit: UnitId, text: string): Action[] => [type(field, unit, text), { type: "leave", field }];
const show = (s: State, quantity: QuantityId, unit: UnitId) => boxText(s, derive(s), quantity, unit);
const boxes = (s: State, quantity: QuantityId, units: UnitId[]) => Object.fromEntries(units.map((u) => [u, show(s, quantity, u)]));

const MOLAR: UnitId[] = ["M", "mM", "uM", "nM", "pM"];
const VOLUMES: UnitId[] = ["L", "mL", "uL", "nL"];
const MASSES: UnitId[] = ["g", "mg", "ug", "ng"];

describe("equivalent units stay in sync", () => {
  it("100 µM is shown the same in every unit", () => {
    const s = run(typed("concentration", "uM", "100"));
    expect(boxes(s, "concentration", MOLAR)).toEqual({ M: "0.0001", mM: "0.1", uM: "100", nM: "100000", pM: "100000000" });
  });

  it("0.25 mM typed in another unit replaces the value in all of them", () => {
    const s = run([...typed("concentration", "uM", "100"), ...typed("concentration", "mM", "0.25")]);
    expect(boxes(s, "concentration", MOLAR)).toEqual({ M: "0.00025", mM: "0.25", uM: "250", nM: "250000", pM: "250000000" });
  });

  it("2 mL and 5 mg in every unit", () => {
    const s = run([...typed("volume", "mL", "2"), ...typed("mass", "mg", "5")]);
    expect(boxes(s, "volume", VOLUMES)).toEqual({ L: "0.002", mL: "2", uL: "2000", nL: "2000000" });
    expect(boxes(s, "mass", MASSES)).toEqual({ g: "0.005", mg: "5", ug: "5000", ng: "5000000" });
  });

  it("stores one value per quantity, in its canonical unit", () => {
    const s = run(typed("concentration", "uM", "100"));
    expect(s.entries.concentration).toEqual({ kind: "value", amount: { dimension: "molar", value: 0.0001 } });
  });

  it("follows a value while it is typed, without rewriting the box being typed in", () => {
    let s = run([type("concentration", "uM", "1")]);
    s = reducer(s, type("concentration", "uM", "1e"));
    expect(show(s, "concentration", "uM")).toBe("1e"); // the user's text, left alone
    expect(show(s, "concentration", "nM")).toBe("1000"); // the last complete value meanwhile
    s = reducer(s, type("concentration", "uM", "1e-"));
    s = reducer(s, type("concentration", "uM", "1e-3"));
    expect(show(s, "concentration", "nM")).toBe("1");
    s = reducer(s, { type: "leave", field: "concentration" });
    expect(show(s, "concentration", "uM")).toBe("0.001");
  });

  it("shows the raw text only in the box being typed in, not in the same quantity's box in another calculator", () => {
    const s = run([{ type: "type", field: "volume", unit: "mL", text: "1e-3", box: "mass" }]);
    expect(boxText(s, derive(s), "volume", "mL", "mass")).toBe("1e-3");
    expect(boxText(s, derive(s), "volume", "mL", "concentration")).toBe("0.001");
  });

  it("keeps a trailing point while typing", () => {
    expect(show(run([type("volume", "mL", "0.")]), "volume", "mL")).toBe("0.");
  });
});

describe("changing unit keeps the quantity, and applies wherever the quantity appears", () => {
  it("100 µM shown in mM is 0.1 mM", () => {
    let s = run([{ type: "unit", quantity: "concentration", unit: "uM" }, ...typed("concentration", "uM", "100")]);
    const before = s.entries.concentration;
    s = reducer(s, { type: "unit", quantity: "concentration", unit: "mM" });
    expect(s.entries.concentration).toEqual(before);
    expect(show(s, "concentration", unitOf(s, "concentration"))).toBe("0.1");
  });

  it("1 mL shown in µL is 1000 µL", () => {
    let s = run(typed("volume", "mL", "1"));
    s = reducer(s, { type: "unit", quantity: "volume", unit: "uL" });
    expect(s.entries.volume).toEqual({ kind: "value", amount: { dimension: "volume", value: 0.001 } });
    expect(show(s, "volume", unitOf(s, "volume"))).toBe("1000");
  });

  it("a unit chosen on an answer is the quantity's unit, and the other way", () => {
    let s = reducer(initialState, { type: "unit", quantity: "concentrationResult", unit: "M" });
    expect(unitOf(s, "concentration")).toBe("M");
    s = reducer(s, { type: "unit", quantity: "mass", unit: "g" });
    expect(unitOf(s, "massResult")).toBe("g");
  });
});

describe("each calculator solves for its own quantity from the shared values", () => {
  const glucose = [...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10"), ...typed("concentration", "mM", "100")];

  it("mass: the sanity check gives 180.16 mg, in every mass unit", () => {
    const s = run(glucose);
    expect(boxes(s, "massResult", MASSES)).toEqual({ g: "0.18016", mg: "180.16", ug: "180160", ng: "180160000" });
    expect(show(s, "moles", "mmol")).toBe("1");
  });

  it("recalculates when an input changes: 200 mM doubles the mass", () => {
    expect(show(run([...glucose, ...typed("concentration", "mM", "200")]), "massResult", "mg")).toBe("360.32");
  });

  it("volume and molarity use the same typed values", () => {
    const s = run([...glucose, ...typed("mass", "mg", "90.08")]);
    expect(show(s, "volumeResult", "mL")).toBe("5"); // 90.08 mg at 100 mM
    expect(show(s, "concentrationResult", "mM")).toBe("50"); // 90.08 mg in 10 mL
    expect(show(s, "massResult", "mg")).toBe("180.16"); // unchanged: it does not use the typed mass
  });

  it("solves the inverse sanity checks", () => {
    const v = run([...typed("molarMass", "g_mol", "180.16"), ...typed("concentration", "M", "0.1"), ...typed("mass", "g", "0.18016")]);
    expect(boxes(v, "volumeResult", VOLUMES)).toEqual({ L: "0.01", mL: "10", uL: "10000", nL: "10000000" });
    const c = run([...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10"), ...typed("mass", "mg", "180.16")]);
    expect(show(c, "concentrationResult", "mM")).toBe("100");
  });

  it("takes the formula weight in kDa", () => {
    const s = run([...typed("molarMass", "kDa", "66.5"), ...typed("volume", "mL", "1"), ...typed("concentration", "uM", "10")]); // BSA
    expect(show(s, "molarMass", "g_mol")).toBe("66500");
    expect(show(s, "massResult", "mg")).toBe("0.665");
  });

  it("converts between molar and mass concentration through the formula weight", () => {
    expect(show(run(glucose), "concentration", "mg_mL")).toBe("18.016");
    const t = run([...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10"), ...typed("concentration", "mg_mL", "18.016")]);
    expect(show(t, "concentration", "mM")).toBe("100");
    expect(show(t, "massResult", "mg")).toBe("180.16");
    const c = run([...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10"), ...typed("mass", "mg", "180.16")]);
    expect(show(c, "concentrationResult", "mg_mL")).toBe("18.016");
  });

  it("leaves mass concentrations empty until there is a formula weight", () => {
    const s = run(typed("concentration", "mM", "100"));
    expect(show(s, "concentration", "mg_mL")).toBe("");
    expect(derive(s).solutions.mass.missing).toEqual(["molarMass", "volume"]);
  });
});

describe("validation", () => {
  it("says what is wrong, and gives no result", () => {
    const s = run([...typed("molarMass", "g_mol", "0"), ...typed("volume", "mL", "10"), ...typed("concentration", "mM", "100")]);
    const d = derive(s);
    expect(issueAt(s, d, "mass", "molarMass")).toBe("Formula weight must be greater than zero.");
    expect(d.quantities.massResult.amount).toBeNull();
  });

  it("applies each calculator's own rule to a shared value: a zero mass", () => {
    const s = run([...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10"), ...typed("concentration", "mM", "100"), ...typed("mass", "mg", "0")]);
    const d = derive(s);
    expect(show(s, "concentrationResult", "mM")).toBe("0"); // 0 mg in 10 mL is 0 mM
    expect(issueAt(s, d, "volume", "mass")).toBe("Mass must be greater than zero to calculate a volume.");
  });

  it("flags text that is not a number, and a number left incomplete, in every calculator", () => {
    const s = run(typed("volume", "mL", "ten"));
    expect(issueAt(s, derive(s), "mass", "volume")).toMatch(/Not a number/);
    expect(issueAt(s, derive(s), "concentration", "volume")).toMatch(/Not a number/);
    const t = run(typed("volume", "mL", "1e-"));
    expect(issueAt(t, derive(t), "mass", "volume")).toBe("This number is not complete.");
    expect(show(t, "volume", "mL")).toBe("");
  });

  it("refuses negative and zero volumes", () => {
    const base = [...typed("molarMass", "g_mol", "180.16"), ...typed("concentration", "mM", "100")];
    const neg = run([...base, ...typed("volume", "mL", "-5")]);
    expect(issueAt(neg, derive(neg), "mass", "volume")).toBe("Volume cannot be negative.");
    const zero = run([...base, ...typed("volume", "mL", "0")]);
    expect(issueAt(zero, derive(zero), "mass", "volume")).toBe("Volume must be greater than zero.");
  });

  it("clearing a box empties the quantity; Clear all empties everything but keeps the units", () => {
    const s = run([...typed("volume", "mL", "10"), ...typed("volume", "uL", "")]);
    expect(s.entries.volume.kind).toBe("empty");
    const t = run([{ type: "unit", quantity: "volume", unit: "uL" }, ...typed("volume", "uL", "10"), { type: "clear" }]);
    expect(t.entries.volume.kind).toBe("empty");
    expect(unitOf(t, "volume")).toBe("uL");
  });
});

describe("dilution", () => {
  const dilute = (stock: [UnitId, string], target: [UnitId, string], volume: [UnitId, string], extra: Action[] = []) =>
    run([...extra, ...typed("stock", ...stock), ...typed("target", ...target), ...typed("finalVolume", ...volume)]);

  it("solves the sanity check: 1 M to 10 mM in 100 mL takes 1 mL of stock", () => {
    const s = dilute(["M", "1"], ["mM", "10"], ["mL", "100"]);
    expect(boxes(s, "stockVolume", VOLUMES)).toEqual({ L: "0.001", mL: "1", uL: "1000", nL: "1000000" });
    expect(show(s, "diluentVolume", "mL")).toBe("99");
    expect(derive(s).dilution.factor).toBe(100);
  });

  it("refuses a target above the stock", () => {
    const s = dilute(["mM", "10"], ["mM", "100"], ["mL", "10"]);
    const d = derive(s);
    expect(d.dilution.stockVolume).toBeNull();
    expect(issueAt(s, d, "dilution", "target")).toMatch(/more concentrated than the stock/);
  });

  it("compares a mg/mL stock with a molar target only with a formula weight", () => {
    const without = dilute(["mg_mL", "18.016"], ["mM", "10"], ["mL", "100"]);
    expect(derive(without).dilution.stockVolume).toBeNull();
    expect(issueAt(without, derive(without), "dilution", "target")).toMatch(/formula weight/);
    const withMw = dilute(["mg_mL", "18.016"], ["mM", "10"], ["mL", "100"], typed("molarMass", "g_mol", "180.16")); // a 100 mM stock
    expect(show(withMw, "stockVolume", "mL")).toBe("10");
  });

  it("equal concentrations in different units are no dilution", () => {
    const s = dilute(["mM", "1"], ["uM", "1000"], ["mL", "5"]);
    expect(derive(s).dilution.note).toMatch(/equals the stock/);
    expect(show(s, "stockVolume", "mL")).toBe("5");
  });
});
