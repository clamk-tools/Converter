// The four calculators of GraphPad's molarity page, in its order, as data: the rows each takes, top to bottom, and
// the answer it gives. The layout lives in Calculator.tsx; the science in engine/ and state/.

import type { FieldId, OutputId, Section } from "../state/model";

export interface CalculatorSpec {
  id: Section;
  title: string;
  inputs: { field: FieldId; label: string }[];
  result: { quantity: OutputId; label: string };
}

const MOLECULAR_WEIGHT = { field: "molarMass", label: "Molecular weight (g/mol or Da)" } as const;

export const CALCULATORS: CalculatorSpec[] = [
  {
    id: "mass",
    title: "1. Mass from volume & concentration",
    inputs: [{ field: "concentration", label: "Concentration" }, MOLECULAR_WEIGHT, { field: "volume", label: "Volume" }],
    result: { quantity: "massResult", label: "Mass" },
  },
  {
    id: "volume",
    title: "2. Volume from mass & concentration",
    inputs: [{ field: "mass", label: "Mass" }, MOLECULAR_WEIGHT, { field: "concentration", label: "Concentration" }],
    result: { quantity: "volumeResult", label: "Volume" },
  },
  {
    id: "concentration",
    title: "3. Molarity from mass & volume",
    inputs: [{ field: "mass", label: "Mass" }, MOLECULAR_WEIGHT, { field: "volume", label: "Volume" }],
    result: { quantity: "concentrationResult", label: "Molarity" },
  },
  {
    id: "dilution",
    title: "4. Dilute a stock solution",
    inputs: [
      { field: "stock", label: "Stock concentration" },
      { field: "target", label: "Desired concentration" },
      { field: "finalVolume", label: "Desired volume" },
    ],
    result: { quantity: "stockVolume", label: "Required volume" },
  },
];
