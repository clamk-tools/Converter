// The scientific equations, in canonical units only: grams, litres, moles, mol/L (M), g/mol, g/L.
// No validation and no rounding here: these are the bare formulas, so they can be read against doc/CALCULATIONS.md.

/** n = m / MW */
export const moles = (massG: number, molarMassGPerMol: number) => massG / molarMassGPerMol;

/** C = m / (MW × V) */
export const concentrationFrom = (massG: number, molarMassGPerMol: number, volumeL: number) => massG / (molarMassGPerMol * volumeL);

/** m = C × V × MW */
export const massFrom = (concentrationM: number, volumeL: number, molarMassGPerMol: number) => concentrationM * volumeL * molarMassGPerMol;

/** V = m / (C × MW) */
export const volumeFrom = (massG: number, concentrationM: number, molarMassGPerMol: number) => massG / (concentrationM * molarMassGPerMol);

/** C1 × V1 = C2 × V2, so V1 = C2 × V2 / C1. C1 and C2 in the same unit, whichever it is. */
export const stockVolumeFrom = (stock: number, target: number, finalVolumeL: number) => (target * finalVolumeL) / stock;
