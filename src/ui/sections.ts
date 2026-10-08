// The four calculators, in GraphPad's order, as data: what each takes, what it gives, and its formula.
// The layout lives in Calculator.tsx; the science in engine/ and state/.

import type { FieldId, OutputId, Section } from "../state/model";

export interface CalculatorSpec {
  id: Section;
  title: string;
  formula: string;
  inputs: { field: FieldId; label: string }[];
  result: { quantity: OutputId; label: string };
  /** a second answer shown under the first */
  extra?: { quantity: OutputId; label: string };
}

export const CALCULATORS: CalculatorSpec[] = [
  {
    id: "mass",
    title: "Mass from volume and concentration",
    formula: "m = C × V × MW",
    inputs: [
      { field: "molarMass", label: "Formula weight" },
      { field: "volume", label: "Desired final volume" },
      { field: "concentration", label: "Desired concentration" },
    ],
    result: { quantity: "massResult", label: "Mass to weigh" },
    extra: { quantity: "moles", label: "Amount" },
  },
  {
    id: "volume",
    title: "Volume from mass and concentration",
    formula: "V = m / (C × MW)",
    inputs: [
      { field: "molarMass", label: "Formula weight" },
      { field: "mass", label: "Mass" },
      { field: "concentration", label: "Desired concentration" },
    ],
    result: { quantity: "volumeResult", label: "Final volume" },
  },
  {
    id: "concentration",
    title: "Molarity from mass and volume",
    formula: "C = m / (MW × V)",
    inputs: [
      { field: "molarMass", label: "Formula weight" },
      { field: "mass", label: "Mass" },
      { field: "volume", label: "Volume" },
    ],
    result: { quantity: "concentrationResult", label: "Concentration" },
  },
  {
    id: "dilution",
    title: "Dilute a stock solution",
    formula: "V₁ = C₂ × V₂ / C₁",
    inputs: [
      { field: "stock", label: "Stock concentration" },
      { field: "target", label: "Desired concentration" },
      { field: "finalVolume", label: "Desired final volume" },
    ],
    result: { quantity: "stockVolume", label: "Volume of stock" },
    extra: { quantity: "diluentVolume", label: "Volume of diluent" },
  },
];
