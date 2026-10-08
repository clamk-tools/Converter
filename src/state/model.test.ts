import { describe, expect, it } from "vitest";

import type { UnitId } from "../units/units";
import { boxText, derive, initialState, issueAt, reducer, resultText, unitOf } from "./model";
import type { Action, FieldId, State } from "./model";

// Drives the state the way the page does: typing in a box, leaving it, choosing a unit.
const run = (actions: Action[], from: State = initialState) => actions.reduce(reducer, from);
const type = (field: FieldId, unit: UnitId, text: string, box?: string): Action => ({ type: "type", field, unit, text, box });
const typed = (field: FieldId, unit: UnitId, text: string): Action[] => [type(field, unit, text), { type: "leave", field }];
const show = (s: State, field: FieldId, unit: UnitId, box?: string) => boxText(s, derive(s), field, unit, box);
const boxes = (s: State, field: FieldId, units: UnitId[]) => Object.fromEntries(units.map((u) => [u, show(s, field, u)]));
const unitTo = (quantity: Parameters<typeof unitOf>[1], unit: UnitId): Action => ({ type: "unit", quantity, unit });

const MOLAR: UnitId[] = ["M", "mM", "uM", "nM", "pM"];
const VOLUMES: UnitId[] = ["L", "mL", "uL", "nL"];
const MASSES: UnitId[] = ["g", "mg", "ug", "ng"];
const glucose = [...typed("concentration", "mM", "100"), ...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10")];

describe("one value per quantity, shown in any unit", () => {
  it("100 µM is the same value in every unit", () => {
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
    expect(run(typed("concentration", "uM", "100")).entries.concentration).toEqual({ kind: "value", value: 0.0001 });
  });

  it("follows a value while it is typed, without rewriting the box being typed in", () => {
    let s = run([type("concentration", "uM", "1")]);
    s = reducer(s, type("concentration", "uM", "1e"));
    expect(show(s, "concentration", "uM")).toBe("1e"); // the user's text, left alone
    expect(show(s, "concentration", "nM")).toBe("1000"); // the last complete value meanwhile
    s = reducer(s, type("concentration", "uM", "1e-3"));
    expect(show(s, "concentration", "nM")).toBe("1");
    s = reducer(s, { type: "leave", field: "concentration" });
    expect(show(s, "concentration", "uM")).toBe("0.001");
  });

  it("shows the raw text only in the box being typed in, not in the same quantity's box in another calculator", () => {
    const s = run([type("volume", "mL", "1e-3", "mass")]);
    expect(show(s, "volume", "mL", "mass")).toBe("1e-3");
    expect(show(s, "volume", "mL", "concentration")).toBe("0.001");
  });

  it("keeps a trailing point while typing", () => {
    expect(show(run([type("volume", "mL", "0.")]), "volume", "mL")).toBe("0.");
  });
});

describe("changing unit keeps the quantity, and applies wherever the quantity appears", () => {
  it("starts with GraphPad's units: millimolar, milliliter, milligrams", () => {
    expect([unitOf(initialState, "concentration"), unitOf(initialState, "volume"), unitOf(initialState, "mass")]).toEqual(["mM", "mL", "mg"]);
    expect(unitOf(initialState, "molarMass")).toBe("g_mol");
  });

  it("100 µM shown in millimolar is 0.1", () => {
    let s = run([unitTo("concentration", "uM"), ...typed("concentration", "uM", "100")]);
    const before = s.entries.concentration;
    s = reducer(s, unitTo("concentration", "mM"));
    expect(s.entries.concentration).toEqual(before);
    expect(show(s, "concentration", unitOf(s, "concentration"))).toBe("0.1");
  });

  it("1 mL shown in microliter is 1000", () => {
    const s = run([...typed("volume", "mL", "1"), unitTo("volume", "uL")]);
    expect(s.entries.volume).toEqual({ kind: "value", value: 0.001 });
    expect(show(s, "volume", unitOf(s, "volume"))).toBe("1000");
  });

  it("an answer is shown in its quantity's unit", () => {
    const s = run([...glucose, unitTo("mass", "g")]);
    expect(resultText(s, derive(s), "massResult")).toBe("0.18016 g");
  });

  it("the molecular weight has no unit to change", () => {
    expect(reducer(initialState, unitTo("molarMass", "g_mol"))).toBe(initialState);
  });
});

describe("each calculator solves for its own quantity from the shared values", () => {
  it("1. mass: the sanity check gives 180.16 mg", () => {
    const s = run(glucose);
    expect(resultText(s, derive(s), "massResult")).toBe("180.16 mg");
  });

  it("recalculates when an input changes: 200 mM doubles the mass", () => {
    const s = run([...glucose, ...typed("concentration", "mM", "200")]);
    expect(resultText(s, derive(s), "massResult")).toBe("360.32 mg");
  });

  it("2. volume and 3. molarity use the same typed values", () => {
    const s = run([...glucose, ...typed("mass", "mg", "90.08")]);
    const d = derive(s);
    expect(resultText(s, d, "volumeResult")).toBe("5 mL"); // 90.08 mg at 100 mM
    expect(resultText(s, d, "concentrationResult")).toBe("50 mM"); // 90.08 mg in 10 mL
    expect(resultText(s, d, "massResult")).toBe("180.16 mg"); // unchanged: it does not use the typed mass
  });

  it("solves the inverse sanity checks", () => {
    const v = run([...typed("mass", "g", "0.18016"), ...typed("molarMass", "g_mol", "180.16"), ...typed("concentration", "M", "0.1")]);
    expect(resultText(v, derive(v), "volumeResult")).toBe("10 mL");
    const c = run([...typed("mass", "mg", "180.16"), ...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10")]);
    expect(resultText(c, derive(c), "concentrationResult")).toBe("100 mM");
  });

  it("gives no answer until its inputs are there", () => {
    const s = run(typed("concentration", "mM", "100"));
    expect(resultText(s, derive(s), "massResult")).toBe("");
    expect(derive(s).solutions.mass.missing).toEqual(["molarMass", "volume"]);
  });
});

describe("validation", () => {
  it("says what is wrong, and gives no answer", () => {
    const s = run([...glucose, ...typed("molarMass", "g_mol", "0")]);
    const d = derive(s);
    expect(issueAt(s, d, "mass", "molarMass")).toBe("Molecular weight must be greater than zero.");
    expect(resultText(s, d, "massResult")).toBe("");
  });

  it("applies each calculator's own rule to a shared value: a zero mass", () => {
    const s = run([...glucose, ...typed("mass", "mg", "0")]);
    const d = derive(s);
    expect(resultText(s, d, "concentrationResult")).toBe("0 mM"); // 0 mg in 10 mL is 0 mM
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
    const base = [...typed("concentration", "mM", "100"), ...typed("molarMass", "g_mol", "180.16")];
    const neg = run([...base, ...typed("volume", "mL", "-5")]);
    expect(issueAt(neg, derive(neg), "mass", "volume")).toBe("Volume cannot be negative.");
    const zero = run([...base, ...typed("volume", "mL", "0")]);
    expect(issueAt(zero, derive(zero), "mass", "volume")).toBe("Volume must be greater than zero.");
  });

  it("clearing a box empties the quantity", () => {
    const s = run([...typed("volume", "mL", "10"), ...typed("volume", "uL", "")]);
    expect(s.entries.volume.kind).toBe("empty");
  });
});

describe("4. dilution", () => {
  const dilute = (stock: [UnitId, string], target: [UnitId, string], volume: [UnitId, string]) =>
    run([...typed("stock", ...stock), ...typed("target", ...target), ...typed("finalVolume", ...volume)]);

  it("solves the sanity check: 1 M to 10 mM in 100 mL takes 1 mL of stock", () => {
    const s = dilute(["M", "1"], ["mM", "10"], ["mL", "100"]);
    expect(resultText(s, derive(s), "stockVolume")).toBe("1 mL");
    expect(resultText(reducer(s, unitTo("finalVolume", "uL")), derive(s), "stockVolume")).toBe("1000 µL");
  });

  it("keeps its values apart from the other calculators", () => {
    const s = run([...glucose, ...typed("stock", "M", "1")]);
    expect(s.entries.concentration).toEqual({ kind: "value", value: 0.1 });
    expect(s.entries.stock).toEqual({ kind: "value", value: 1 });
  });

  it("refuses a desired concentration above the stock", () => {
    const s = dilute(["mM", "10"], ["mM", "100"], ["mL", "10"]);
    const d = derive(s);
    expect(d.dilution.stockVolume).toBeNull();
    expect(issueAt(s, d, "dilution", "target")).toMatch(/higher than the stock/);
  });

  it("equal concentrations in different units are no dilution", () => {
    const s = dilute(["mM", "1"], ["uM", "1000"], ["mL", "5"]);
    expect(derive(s).dilution.note).toMatch(/equals the stock/);
    expect(resultText(s, derive(s), "stockVolume")).toBe("5 mL");
  });
});
