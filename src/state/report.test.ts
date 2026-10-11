import { afterEach, describe, expect, it, vi } from "vitest";

import type { UnitId } from "../units/units";
import type { ReportEntry } from "./report";
import { derive, initialState, reducer } from "./model";
import type { Action, FieldId, State } from "./model";
import { answerOf, displayName, entryFor, entryText, loadReport, readable, rename, saveReport, toggleAll, toggleCollapsed } from "./report";

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
    expect(e.title).toBe("Dilution: volume of stock");
    expect(e.convert).toEqual(["C₂ = 10 mM × 10⁻³ = 0.01 mol/L", "V₂ = 100 mL × 10⁻³ = 0.1 L"]);
    expect(e.formula).toBe("V₁ = C₂ × V₂ / C₁");
    expect(e.substitution).toEqual(["V₁ = 0.01 mol/L × 0.1 L / 1 mol/L", "= 0.001 L"]);
    expect(e.result).toEqual(["V₁ = 0.001 L", "V₁ = 1 mL"]);
    expect(e.check).toEqual({ text: "C₁ × V₁ = 1 × 0.001 = 0.001 mol, and C₂ × V₂ = 0.01 × 0.1 = 0.001 mol", ok: true });
  });

  it("dilution, the other way: 1 mL of 1 M stock makes 100 mL at 10 mM", () => {
    const tick = (target: "finalVolume" | "target"): Action => ({ type: "find", target });
    const base = [{ type: "unit", quantity: "stock", unit: "M" } as Action, ...typed("stock", "M", "1"), ...typed("target", "mM", "10")];
    const e = entry(run([tick("finalVolume"), ...base, ...typed("stockVolume", "mL", "1")]), "dilution")!;
    expect(e.title).toBe("Dilution: final volume");
    expect(e.formula).toBe("V₂ = C₁ × V₁ / C₂");
    expect(e.substitution).toEqual(["V₂ = 1 mol/L × 0.001 L / 0.01 mol/L", "= 0.1 L"]);
    expect(e.result).toEqual(["V₂ = 0.1 L", "V₂ = 100 mL"]);
    expect(e.check.ok).toBe(true);
    const c = entry(run([tick("target"), ...typed("stock", "M", "1"), ...typed("stockVolume", "mL", "1"), ...typed("finalVolume", "mL", "100")]), "dilution")!;
    expect(c.formula).toBe("C₂ = C₁ × V₁ / V₂");
    expect(c.result).toEqual(["C₂ = 0.01 mol/L", "C₂ = 10 mM"]);
    expect(c.check.ok).toBe(true);
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

describe("renaming and collapsing", () => {
  const a = entryFor(glucose, derive(glucose), "mass", "a")!;
  const b = entryFor(glucose, derive(glucose), "mass", "b")!;

  it("a name replaces the title on the page, and an empty name takes it back", () => {
    expect(displayName(a)).toBe("Mass from volume & concentration");
    const named = rename([a, b], "a", "  Buffer   A, 10 mL ");
    expect(named[0].name).toBe("Buffer A, 10 mL");
    expect(displayName(named[0])).toBe("Buffer A, 10 mL");
    expect(named[1]).toBe(b); // the others are untouched
    expect(displayName(rename(named, "a", "   ")[0])).toBe("Mass from volume & concentration");
  });

  it("a name is kept to 80 characters", () => {
    expect(rename([a], "a", "x".repeat(200))[0].name).toHaveLength(80);
  });

  it("folds and opens one calculation, and all of them", () => {
    const one = toggleCollapsed([a, b], "a");
    expect(one.map((e) => !!e.collapsed)).toEqual([true, false]);
    expect(toggleCollapsed(one, "a")[0].collapsed).toBe(false);
    expect(toggleAll(one).map((e) => e.collapsed)).toEqual([true, true]); // one is open: fold all
    expect(toggleAll(toggleAll(one)).map((e) => e.collapsed)).toEqual([false, false]); // all folded: open all
  });

  it("the copied text carries the name and the kind of calculation", () => {
    const text = entryText(rename([a], "a", "Buffer A")[0], 1);
    expect(text.split("\n")[0]).toBe("1. Buffer A (Mass from volume & concentration)");
  });
});

describe("as the report shows it", () => {
  it("the answer alone, for the header: in the unit chosen", () => {
    expect(answerOf(entry(glucose, "mass")!)).toBe("180.16 mg");
  });

  it("scientific notation written as a person writes it", () => {
    expect(readable("C = 9.98e11 pM × 10⁻¹² = 0.998 mol/L")).toBe("C = 9.98 × 10¹¹ pM × 10⁻¹² = 0.998 mol/L");
    expect(readable("V = 2.5e-7 L")).toBe("V = 2.5 × 10⁻⁷ L");
    expect(readable("m = 0.18016 g, MW = 180.16 g/mol")).toBe("m = 0.18016 g, MW = 180.16 g/mol"); // nothing else changes
  });

  it("a huge concentration: worked in the report's notation, and copied the same way", () => {
    // 9.98e11 pM = 0.998 mol/L; 8688 mL = 8.688 L; m = 0.998 × 8.688 × 5856 = 50775.174144 g
    const s = run([{ type: "unit", quantity: "concentration", unit: "pM" }, ...typed("concentration", "pM", "9.98e11"), ...typed("molarMass", "g_mol", "5856"), ...typed("volume", "mL", "8688")]);
    const e = entry(s, "mass")!;
    expect(readable(e.convert[0])).toBe("C = 9.98 × 10¹¹ pM × 10⁻¹² = 0.998 mol/L");
    expect(entryText(e, 1)).not.toMatch(/\de/);
  });
});

describe("the check", () => {
  it("writes the result rounded as it is shown, not to twelve digits", () => {
    // m = 0.998 × 8.688 × 5856 = 50775.174144 g, shown as 50775.2 g
    const s = run([{ type: "unit", quantity: "concentration", unit: "pM" }, ...typed("concentration", "pM", "9.98e11"), ...typed("molarMass", "g_mol", "5856"), ...typed("volume", "mL", "8688")]);
    const e = entry(s, "mass")!;
    expect(e.check).toEqual({ text: "C = m / (MW × V) = 50775.2 / (5856 × 8.688) = 0.998 mol/L", ok: true });
  });
});

describe("the report in the browser's storage", () => {
  // a stand-in for the browser's storage: the tests run outside a browser
  const stored = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => stored.get(k) ?? null, setItem: (k: string, v: string) => void stored.set(k, v) });
  afterEach(() => stored.clear());
  const a = entryFor(glucose, derive(glucose), "mass", "a")!;

  it("reads back what was saved", () => {
    saveReport([a]);
    expect(loadReport()).toEqual([a]);
  });

  it("leaves out an entry in another shape, instead of breaking the Report view", () => {
    const without = (field: keyof ReportEntry) => Object.fromEntries(Object.entries(a).filter(([k]) => k !== field));
    saveReport([a, without("result"), without("check"), { ...a, result: [] }, null] as unknown as ReportEntry[]);
    expect(loadReport()).toEqual([a]);
  });

  it("reads nothing from text that is not a report", () => {
    stored.set("molarity-calculator:report-v2", "not json");
    expect(loadReport()).toEqual([]);
  });
});
