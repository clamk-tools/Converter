// The formulas each calculator uses, written for the info bubble (the "i" beside its title). Plain text, no logic:
// the code that computes them is engine/equations.ts, and doc/CALCULATIONS.md is the reference these lines follow.

export interface Formula {
  /** the equation, in symbols */
  equation: string;
  /** a few words on what it gives, or empty */
  meaning: string;
}

export interface CalculatorInfo {
  formulas: Formula[];
  /** conventions and checks that apply to the whole calculator */
  notes: string[];
}


export const INFO: Record<"mass" | "volume" | "concentration" | "dilution" | "conversion", CalculatorInfo> = {
  mass: {
    formulas: [
      { equation: "n = C × V", meaning: "" },
      { equation: "m = n × MW = C × V × MW", meaning: "" },
    ],
    notes: ["C^{mol/L}, V^{L}, m^{g}, MW^{g/mol}, n^{mol}. Units are converted to these first."],
  },
  volume: {
    formulas: [
      { equation: "n = m / MW", meaning: "" },
      { equation: "V = n / C = m / (C × MW)", meaning: "" },
    ],
    notes: ["Same letters and base units. m, C and MW must be > 0."],
  },
  concentration: {
    formulas: [
      { equation: "n = m / MW", meaning: "" },
      { equation: "C = n / V = m / (MW × V)", meaning: "" },
    ],
    notes: ["Same letters and base units. MW and V must be > 0."],
  },
  dilution: {
    formulas: [
      { equation: "C₁V₁ = C₂V₂", meaning: "" },
      { equation: "V₁ = C₂ × V₂ / C₁", meaning: "stock to take" },
      { equation: "V₂ − V₁", meaning: "diluent to add" },
    ],
    notes: ["1 = stock, 2 = desired. C₂ ≤ C₁."],
  },
  conversion: {
    formulas: [
      { equation: "ρ = C × MW", meaning: "mol/L → g/L" },
      { equation: "C = ρ / MW", meaning: "g/L → mol/L" },
      { equation: "1 % w/v = 10 g/L", meaning: "" },
      { equation: "1 ppm = 1 mg/L", meaning: "" },
    ],
    notes: ["mg/mL = 1 g/L, µg/mL = 10⁻³ g/L. MW is needed only to cross between molar and mass."],
  },
};
