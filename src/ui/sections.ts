// The page's three calculators as data: their titles, their boxes in order, and their answers. The layout lives in
// SolutionCard.tsx, Calculator.tsx and ConcentrationConverter.tsx; the science in engine/ and state/.

import type { FieldId, OutputId, Section, SolveFor } from "../state/model";

/** Calculator 1: m = C × V × MW as four tiles, two by two. The molecular weight comes first: it is the substance's
 *  constant, always typed. Each of the other three can be ticked to be found from the rest. */
export const SOLUTION = {
  title: "1. Mass, volume or concentration",
  tiles: [
    { field: "molarMass", label: "Molecular weight" },
    { field: "concentration", label: "Concentration" },
    { field: "volume", label: "Volume" },
    { field: "mass", label: "Mass" },
  ] as { field: SolveFor | "molarMass"; label: string }[],
};

export interface CalculatorSpec {
  id: Extract<Section, "dilution">;
  title: string;
  inputs: { field: FieldId; label: string }[];
  result: { quantity: OutputId; label: string };
}

/** Calculator 2: GraphPad's dilution, a row per input and its answer. */
export const DILUTION: CalculatorSpec = {
  id: "dilution",
  title: "2. Dilute a stock solution",
  inputs: [
    { field: "stock", label: "Stock concentration" },
    { field: "target", label: "Desired concentration" },
    { field: "finalVolume", label: "Desired volume" },
  ],
  result: { quantity: "stockVolume", label: "Required volume" },
};

export const CONVERTER_TITLE = "3. Convert between mass & molar concentration";
