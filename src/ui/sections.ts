// The page's three calculators as data: their titles and their tiles in order. The layout lives in TileCard.tsx and
// ConcentrationConverter.tsx; the science in engine/ and state/.

import type { FieldId } from "../state/model";

export interface TileSpec {
  field: FieldId;
  /** the tile's name on the page: "Concentration", "C₁" */
  label: string;
  /** the name a screen reader says for its box and menu: "Concentration", "C₁, stock concentration" */
  spoken: string;
  /** what its tick button says: "Find mass" */
  findName: string;
  /** a constant of the substance (the molecular weight): grey, always typed, never found */
  fixed?: boolean;
}

export interface TileCardSpec {
  id: "solution" | "dilution";
  title: string;
  hint: string;
  /** two by two, in reading order */
  tiles: TileSpec[];
}

/** Calculator 1: m = C × V × MW. The molecular weight comes first: it is the substance's constant, always typed. */
export const SOLUTION: TileCardSpec = {
  id: "solution",
  title: "1. Mass, volume or concentration",
  hint: "Tick the value to find, type the other two.",
  tiles: [
    { field: "molarMass", label: "Molecular weight", spoken: "Molecular weight (g/mol or Da)", findName: "", fixed: true },
    { field: "concentration", label: "Concentration", spoken: "Concentration", findName: "concentration" },
    { field: "volume", label: "Volume", spoken: "Volume", findName: "volume" },
    { field: "mass", label: "Mass", spoken: "Mass", findName: "mass" },
  ],
};

/** Calculator 2: C₁V₁ = C₂V₂, the stock on the first row and the final solution on the second. Any one is found. */
export const DILUTION: TileCardSpec = {
  id: "dilution",
  title: "2. Dilute a stock solution",
  hint: "Tick the value to find, type the other three.",
  tiles: [
    { field: "stock", label: "C₁", spoken: "C₁, stock concentration", findName: "C₁, stock concentration" },
    { field: "stockVolume", label: "V₁", spoken: "V₁, volume of stock", findName: "V₁, volume of stock" },
    { field: "target", label: "C₂", spoken: "C₂, final concentration", findName: "C₂, final concentration" },
    { field: "finalVolume", label: "V₂", spoken: "V₂, final volume", findName: "V₂, final volume" },
  ],
};

export const CONVERTER_TITLE = "3. Convert between mass & molar concentration";
