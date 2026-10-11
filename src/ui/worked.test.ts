import { describe, expect, it } from "vitest";

import type { UnitId } from "../units/units";
import { derive, initialState, reducer } from "../state/model";
import type { Action, FieldId, State } from "../state/model";
import { dilutionWorked } from "./worked";

const typed = (field: FieldId, unit: UnitId, text: string): Action[] => [{ type: "type", field, unit, text }, { type: "leave", field }];
const run = (actions: Action[]): State => actions.reduce(reducer, initialState);
// the number and its unit are joined by a no-break space; read here as a plain one
const worked = (s: State) => dilutionWorked(s, derive(s)).replace(/\u00a0/g, " ");

describe("the dilution's formula with its numbers", () => {
  it("fills in as the values are typed, ? for those still missing", () => {
    expect(worked(initialState)).toBe("V₁ = ? × ? / ? = ?");
    expect(worked(run(typed("target", "mM", "10")))).toBe("V₁ = 10 mM × ? / ? = ?");
  });

  it("1 M stock to 10 mM in 100 mL: V₁ = 10 mM × 100 mL / 1 M = 1 mL", () => {
    const s = run([{ type: "unit", quantity: "stock", unit: "M" }, ...typed("stock", "M", "1"), ...typed("target", "mM", "10"), ...typed("finalVolume", "mL", "100")]);
    expect(worked(s)).toBe("V₁ = 10 mM × 100 mL / 1 M = 1 mL");
  });

  it("follows the value ticked: V₂, then C₂", () => {
    const base: Action[] = [{ type: "unit", quantity: "stock", unit: "M" }, ...typed("stock", "M", "1"), ...typed("target", "mM", "10")];
    const v2 = run([{ type: "find", target: "finalVolume" }, ...base, ...typed("stockVolume", "mL", "1")]);
    expect(worked(v2)).toBe("V₂ = 1 M × 1 mL / 10 mM = 100 mL");
    const c2 = run([{ type: "find", target: "target" }, ...typed("stock", "M", "1"), ...typed("stockVolume", "mL", "1"), ...typed("finalVolume", "mL", "100")]);
    expect(worked(c2)).toBe("C₂ = 1000 mM × 1 mL / 100 mL = 10 mM"); // C₁ typed as 1 M, shown in its box's unit, millimolar
  });
});
