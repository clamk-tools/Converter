import { describe, expect, it } from "vitest";

import { derive, initialState, reducer } from "../state/model";
import type { Action, FieldId, State } from "../state/model";
import type { UnitId } from "../units/units";
import { allUnitsText, dilutionSummary, missingText, solutionSummary } from "./summary";

const typed = (field: FieldId, unit: UnitId, text: string): Action[] => [{ type: "type", field, unit, text }, { type: "leave", field }];
const run = (actions: Action[]): State => actions.reduce(reducer, initialState);
const glucose = [...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10"), ...typed("concentration", "mM", "100")];

describe("result sentences", () => {
  it("says how to make the solution, in the units chosen, and copies the answer", () => {
    const s = run(glucose);
    expect(solutionSummary(s, derive(s), "mass")).toEqual({ sentence: "Weigh 180.16 mg and make up to 10 mL to get 100 mM.", copy: "180.16 mg" });
    const g = reducer(s, { type: "unit", quantity: "massResult", unit: "g" });
    expect(solutionSummary(g, derive(g), "mass")?.copy).toBe("0.18016 g");
  });

  it("gives each calculator its own sentence", () => {
    const s = run([...glucose, ...typed("mass", "mg", "90.08")]);
    expect(solutionSummary(s, derive(s), "volume")?.sentence).toBe("Make 90.08 mg up to 5 mL to get 100 mM.");
    expect(solutionSummary(s, derive(s), "concentration")?.sentence).toBe("90.08 mg made up to 10 mL gives 50 mM.");
  });

  it("lists the answer in every other unit", () => {
    const s = run(glucose);
    expect(allUnitsText(s, derive(s), "massResult")).toBe("0.18016 g · 180160 µg · 180160000 ng");
  });

  it("says how to dilute", () => {
    const s = run([...typed("stock", "M", "1"), ...typed("target", "mM", "10"), ...typed("finalVolume", "mL", "100"), { type: "unit", quantity: "stockVolume", unit: "mL" }]);
    expect(dilutionSummary(s, derive(s))).toEqual({ sentence: "Add 1 mL of stock to 99 mL of diluent (100 mL in total): a 100-fold dilution.", copy: "1 mL" });
  });

  it("gives no sentence without a result, and lists what is missing", () => {
    expect(solutionSummary(initialState, derive(initialState), "mass")).toBeNull();
    expect(missingText(["molarMass", "concentration", "volume"])).toBe("Fill in formula weight, concentration and volume.");
    expect(missingText([])).toBeNull();
  });
});
