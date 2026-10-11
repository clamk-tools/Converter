import { describe, expect, it } from "vitest";

import type { UnitId } from "../units/units";
import { derive, initialState, reducer } from "../state/model";
import type { Action, InputId, State } from "../state/model";
import { converterWorked, dilutionWorked, solutionWorked } from "./worked";

const typed = (field: InputId, unit: UnitId, text: string): Action[] => [{ type: "type", field, unit, text }, { type: "leave", field }];
const run = (actions: Action[]): State => actions.reduce(reducer, initialState);
// the number and its unit are joined by a no-break space; read here as a plain one
const plain = (text: string) => text.replace(/\u00a0/g, " ");
const worked = (s: State) => plain(dilutionWorked(s, derive(s)));

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

describe("calculator 1's formula with its numbers", () => {
  const solution = (s: State) => plain(solutionWorked(s, derive(s)));
  const glucose = [...typed("concentration", "mM", "100"), ...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10")];

  it("m = C × V × MW, filled in as typed", () => {
    expect(solution(initialState)).toBe("m = ? × ? × ? = ?");
    expect(solution(run(glucose))).toBe("m = 100 mM × 10 mL × 180.16 g/mol = 180.16 mg");
  });

  it("follows the letter ticked: V, then C", () => {
    expect(solution(run([...glucose, { type: "find", target: "volume" }]))).toBe("V = 180.16 mg / (100 mM × 180.16 g/mol) = 10 mL");
    expect(solution(run([...glucose, { type: "find", target: "concentration" }]))).toBe("C = 180.16 mg / (180.16 g/mol × 10 mL) = 100 mM");
  });
});

describe("calculator 3's formula with its numbers", () => {
  const converter = (s: State) => plain(converterWorked(s, derive(s)));

  it("from the molar line: Cm = C × MW", () => {
    expect(converter(initialState)).toBe("Cm = ? × ? = ?");
    expect(converter(run([...typed("molarMass", "g_mol", "180.16"), ...typed("converter", "mM", "100")]))).toBe("Cm = 100 mM × 180.16 g/mol = 18.016 mg/mL");
    expect(converter(run(typed("converter", "mM", "100")))).toBe("Cm = 100 mM × ? = ?"); // no MW yet
  });

  it("from the mass line: C = Cm / MW", () => {
    expect(converter(run([...typed("molarMass", "g_mol", "180.16"), ...typed("converter", "mg/mL", "18.016")]))).toBe("C = 18.016 mg/mL / 180.16 g/mol = 100 mM");
  });
});
