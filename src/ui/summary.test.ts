import { describe, expect, it } from "vitest";

import { derive, initialState, reducer } from "../state/model";
import type { Action, FieldId, State } from "../state/model";
import type { UnitId } from "../units/units";
import { dilutionSummary, missingText, solutionSummary } from "./summary";

const typed = (field: FieldId, unit: UnitId, text: string): Action[] => [{ type: "type", field, unit, text }, { type: "leave", field }];
const run = (actions: Action[]): State => actions.reduce(reducer, initialState);

describe("result sentences", () => {
  it("says how to make the solution, in the units chosen, and copies the answer", () => {
    const s = run([...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10"), ...typed("concentration", "mM", "100")]);
    expect(solutionSummary(s, derive(s))).toEqual({ sentence: "Weigh 180.16 mg and make up to 10 mL to get 100 mM.", copy: "180.16 mg" });
    const g = reducer(s, { type: "unit", quantity: "mass", unit: "g" });
    expect(solutionSummary(g, derive(g))?.copy).toBe("0.18016 g");
  });

  it("says how to dilute", () => {
    const s = run([...typed("stock", "M", "1"), ...typed("target", "mM", "10"), ...typed("finalVolume", "mL", "100"), { type: "unit", quantity: "stockVolume", unit: "mL" }]);
    expect(dilutionSummary(s, derive(s))).toEqual({ sentence: "Add 1 mL of stock to 99 mL of diluent (100 mL in total): a 100-fold dilution.", copy: "1 mL" });
  });

  it("gives no sentence without a result, and lists what is missing", () => {
    expect(solutionSummary(initialState, derive(initialState))).toBeNull();
    expect(missingText(["molarMass", "concentration", "volume"])).toBe("Fill in molecular weight, concentration and volume.");
    expect(missingText(["volume"])).toBe("Fill in volume.");
    expect(missingText([])).toBeNull();
  });
});
