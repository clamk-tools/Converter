import { describe, expect, it } from "vitest";

import type { UnitId } from "../units/units";
import { derive, initialState, reducer } from "./model";
import type { Action, FieldId, State } from "./model";
import { entryFor, entryText } from "./report";

const typed = (field: FieldId, unit: UnitId, text: string): Action[] => [{ type: "type", field, unit, text }, { type: "leave", field }];
const run = (actions: Action[]): State => actions.reduce(reducer, initialState);
const entry = (s: State, section: Parameters<typeof entryFor>[2]) => entryFor(s, derive(s), section, "1");

const glucose = run([...typed("concentration", "mM", "100"), ...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "mL", "10")]);

describe("a worked calculation", () => {
  it("mass: given, conversions, formula, substitution, result and check, as worked by hand", () => {
    // 100 mM = 0.1 mol/L; 10 mL = 0.01 L; m = 0.1 × 0.01 × 180.16 = 0.18016 g = 180.16 mg; C = 0.18016 / (180.16 × 0.01) = 0.1
    const e = entry(glucose, "mass")!;
    expect(e.title).toBe("Mass from volume & concentration");
    expect(e.given.map((g) => g.text)).toEqual(["C = 100 mM", "MW = 180.16 g/mol", "V = 10 mL"]);
    expect(e.convert).toEqual(["C = 100 mM × 10⁻³ = 0.1 mol/L", "V = 10 mL × 10⁻³ = 0.01 L"]);
    expect(e.formula).toBe("m = C × V × MW");
    expect(e.substitution).toEqual(["m = 0.1 mol/L × 0.01 L × 180.16 g/mol", "= 0.18016 g"]);
    expect(e.result).toEqual(["m = 0.18016 g", "m = 180.16 mg"]);
    expect(e.check).toEqual({ text: "C = m / (MW × V) = 0.18016 / (180.16 × 0.01) = 0.1 mol/L", ok: true });
  });

  it("volume and molarity are worked from the same values", () => {
    const s = run([...typed("mass", "mg", "90.08"), ...typed("molarMass", "g_mol", "180.16"), ...typed("concentration", "mM", "100"), ...typed("volume", "mL", "10")]);
    const v = entry(s, "volume")!;
    expect(v.substitution).toEqual(["V = 0.09008 g / (0.1 mol/L × 180.16 g/mol)", "= 0.005 L"]);
    expect(v.result).toEqual(["V = 0.005 L", "V = 5 mL"]);
    expect(v.check.ok).toBe(true);
    const c = entry(s, "concentration")!;
    expect(c.substitution).toEqual(["C = 0.09008 g / (180.16 g/mol × 0.01 L)", "= 0.05 mol/L"]);
    expect(c.result).toEqual(["C = 0.05 mol/L", "C = 50 mM"]);
    expect(c.check.ok).toBe(true);
  });

  it("dilution: 1 M to 10 mM in 100 mL takes 1 mL of stock", () => {
    const s = run([{ type: "unit", quantity: "stock", unit: "M" }, ...typed("stock", "M", "1"), ...typed("target", "mM", "10"), ...typed("finalVolume", "mL", "100")]);
    const e = entry(s, "dilution")!;
    expect(e.convert).toEqual(["C₂ = 10 mM × 10⁻³ = 0.01 mol/L", "V₂ = 100 mL × 10⁻³ = 0.1 L"]);
    expect(e.formula).toBe("V₁ = C₂ × V₂ / C₁");
    expect(e.substitution).toEqual(["V₁ = 0.01 mol/L × 0.1 L / 1 mol/L", "= 0.001 L"]);
    expect(e.result).toEqual(["V₁ = 0.001 L", "V₁ = 1 mL"]);
    expect(e.check).toEqual({ text: "C₁ × V₁ = 1 × 0.001 = 0.001 mol, and C₂ × V₂ = 0.01 × 0.1 = 0.001 mol", ok: true });
  });

  it("shows only the base-unit result, and no conversion, when the units chosen are the base units", () => {
    const s = run([{ type: "unit", quantity: "mass", unit: "g" } as Action, { type: "unit", quantity: "volume", unit: "L" }, { type: "unit", quantity: "concentration", unit: "M" }, ...typed("concentration", "M", "0.1"), ...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "L", "0.01")]);
    const e = entry(s, "mass")!;
    expect(e.convert).toEqual([]);
    expect(e.result).toEqual(["m = 0.18016 g"]);
  });

  it("carries tiny values through in scientific notation", () => {
    const s = run([{ type: "unit", quantity: "concentration", unit: "pM" }, { type: "unit", quantity: "volume", unit: "nL" }, ...typed("concentration", "pM", "1"), ...typed("molarMass", "g_mol", "180.16"), ...typed("volume", "nL", "1")]);
    const e = entry(s, "mass")!;
    expect(e.convert).toEqual(["C = 1 pM × 10⁻¹² = 1e-12 mol/L", "V = 1 nL × 10⁻⁹ = 1e-9 L"]);
    expect(e.check.ok).toBe(true);
  });

  it("is a snapshot, and gives nothing without an answer", () => {
    const e = entry(glucose, "mass")!;
    reducer(glucose, { type: "type", field: "concentration", unit: "mM", text: "200" });
    expect(e.result[1]).toBe("m = 180.16 mg");
    expect(entry(initialState, "mass")).toBeNull();
  });

  it("as plain text, for copying into a document", () => {
    expect(entryText(entry(glucose, "mass")!, 1)).toBe(
      [
        "1. Mass from volume & concentration",
        "Given:",
        "  C = 100 mM  (concentration)",
        "  MW = 180.16 g/mol  (molecular weight)",
        "  V = 10 mL  (volume)",
        "In base units:",
        "  C = 100 mM × 10⁻³ = 0.1 mol/L",
        "  V = 10 mL × 10⁻³ = 0.01 L",
        "Formula:",
        "  m = C × V × MW",
        "Substitution:",
        "  m = 0.1 mol/L × 0.01 L × 180.16 g/mol",
        "  = 0.18016 g",
        "Result:",
        "  m = 0.18016 g",
        "  m = 180.16 mg",
        "Check:",
        "  C = m / (MW × V) = 0.18016 / (180.16 × 0.01) = 0.1 mol/L ✓",
      ].join("\n"),
    );
  });
});
