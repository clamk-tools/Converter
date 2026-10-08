import { describe, expect, it } from "vitest";

import type { UnitId } from "../units/units";
import { derive, initialState, reducer } from "./model";
import type { Action, FieldId } from "./model";
import { entryFor, entryLine } from "./report";

const typed = (field: FieldId, unit: UnitId, text: string): Action[] => [{ type: "type", field, unit, text }, { type: "leave", field }];
const glucose = [...typed("concentration", "mM", "100"), ...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10")].reduce(reducer, initialState);

describe("report entries", () => {
  it("records a calculation as a condensed line, in the units shown", () => {
    const e = entryFor(glucose, derive(glucose), "mass", ["concentration", "molarMass", "volume"], "massResult", "1");
    expect(e && entryLine(e)).toBe("Mass: C 100 mM · MW 180.16 g/mol · V 10 mL → m 180.16 mg");
  });

  it("records a dilution with its own symbols", () => {
    const s = [{ type: "unit", quantity: "stock", unit: "M" } as Action, ...typed("stock", "M", "1"), ...typed("target", "mM", "10"), ...typed("finalVolume", "mL", "100")].reduce(reducer, initialState);
    const e = entryFor(s, derive(s), "dilution", ["stock", "target", "finalVolume"], "stockVolume", "2");
    expect(e && entryLine(e)).toBe("Dilution: C₁ 1 M · C₂ 10 mM · V₂ 100 mL → V₁ 1 mL");
  });

  it("is a snapshot: a later change does not alter it", () => {
    const e = entryFor(glucose, derive(glucose), "mass", ["concentration", "molarMass", "volume"], "massResult", "1");
    reducer(glucose, { type: "type", field: "concentration", unit: "mM", text: "200" });
    expect(e?.result.text).toBe("180.16 mg");
  });

  it("gives nothing without an answer", () => {
    expect(entryFor(initialState, derive(initialState), "mass", ["concentration", "molarMass", "volume"], "massResult", "1")).toBeNull();
  });
});
