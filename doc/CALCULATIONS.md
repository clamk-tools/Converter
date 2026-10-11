# Calculations

The reference for every number the calculator shows. The code is `src/engine/equations.ts` and `src/engine/solve.ts`;
the tests in `src/engine/solve.test.ts` and `src/state/model.test.ts` check the worked examples below.

## Units

Every value is stored in one canonical unit per kind of quantity. All other units are powers of ten of it.

| Quantity | Canonical | Units shown |
|---|---|---|
| Molar concentration | M = mol/L | M, mM (10⁻³), µM (10⁻⁶), nM (10⁻⁹), pM (10⁻¹²) |
| Mass concentration | g/L | a pair, any mass unit per any volume unit: g, mg, µg, ng per L, mL, µL, nL (the exponent of the mass unit minus that of the volume unit: mg/mL = 10⁰, µg/mL = 10⁻³, ng/L = 10⁻⁹, g/nL = 10⁹); and % w/v (10), ppm (10⁻³) |
| Volume | L | L, mL, µL, nL |
| Mass | g | g, mg, µg, ng |
| Molecular weight | g/mol (= Da) | g/mol only (labelled "g/mol or Da") |

## Formulas

With m in g, MW in g/mol, V in L, C in M:

```
n = m / MW                       amount of substance
C = n / V = m / (MW × V)         concentration
m = C × V × MW                   mass
V = m / (C × MW)                 volume
C₁ × V₁ = C₂ × V₂  →  V₁ = C₂ × V₂ / C₁        dilution: the volume of stock to take
                   →  V₂ = C₁ × V₁ / C₂        the final volume
                   →  C₁ = C₂ × V₂ / V₁        the stock concentration needed
                   →  C₂ = C₁ × V₁ / V₂        the final concentration
Cm = C × MW   and   C = Cm / MW                mass concentration Cm (g/L) and molar concentration C (mol/L)
```

The first four are the equations of GraphPad's molarity calculator. Mass, concentration and volume are one formula solved three ways: calculator 1 on the page, which solves it for the quantity ticked; the dilution is calculator 2, which solves C₁V₁ = C₂V₂ for any one of its four; the last is calculator 3. The mass-concentration units are exact: g/L and mg/mL are the same thing; 1 % w/v is 1 g per 100 mL = 10 g/L; 1 ppm is taken as 1 mg/L (right for a dilute aqueous solution, where 1 L weighs 1 kg). n = m / MW is used only
by the tests. In a dilution C₁ and C₂ are compared in the same unit, whichever ones were chosen for them.

## Rules

| Input | Allowed | Why |
|---|---|---|
| Molecular weight | > 0 | divides every formula |
| Volume, V₁, V₂ | > 0 | a volume of 0 holds nothing; divides C |
| Concentration (solving for mass) | ≥ 0 | 0 M needs 0 g |
| Mass (solving for concentration) | ≥ 0 | 0 g gives 0 M |
| Concentration and mass (solving for volume) | > 0 | C = 0 divides by zero; m = 0 gives a volume of 0 |
| Concentration to convert (calculator 3) | ≥ 0 | 0 converts to 0; negative has no meaning. The molecular weight is needed only to cross between molar and mass |
| C₁ and C₂ | > 0 | C₁ = 0 divides by zero; C₂ = 0 is not a dilution |
| C₂ against C₁ (finding V₁ or V₂) | C₂ ≤ C₁ | a dilution can only lower a concentration |
| V₁ against V₂ (finding C₁ or C₂) | V₁ ≤ V₂ | the stock taken cannot be more than the final volume; this is the same rule, as C₂ = C₁ × V₁ / V₂ |

C₂ = C₁ (within float noise, e.g. 1 mM against 1000 µM), or V₁ = V₂, is accepted: no dilution, no diluent.

## Worked examples

**Mass.** Glucose, MW 180.16 g/mol, 100 mM in 10 mL:
100 mM = 0.1 M; 10 mL = 0.01 L; m = 0.1 × 0.01 × 180.16 = 0.18016 g = **180.16 mg**; n = 1 mmol.

**Conversion.** 100 mM, MW 180.16 g/mol: Cm = 0.1 mol/L × 180.16 g/mol = 18.016 g/L = 18.016 mg/mL = 1.8016 % w/v = 18 016 µg/mL = 18 016 ppm. Back: 1 % w/v = 10 g/L; C = 10 g/L / 180.16 g/mol = 0.0555062 mol/L = 55.5062 mM.

**Dilution.** C₁ = 1 M stock, C₂ = 10 mM, V₂ = 100 mL:
V₁ = 0.01 × 0.1 / 1 = 0.001 L = **1 mL** of stock (made up to 100 mL). The other three from the same solution:
V₂ = 1 × 0.001 / 0.01 = 0.1 L = 100 mL; C₁ = 0.01 × 0.1 / 0.001 = 1 M; C₂ = 1 × 0.001 / 0.1 = 0.01 M = 10 mM.

**Refused dilution.** 10 mM stock, C₂ = 100 mM: above the stock, so no volume is given. Finding C₂ from 20 mL of stock
in 10 mL: V₁ is larger than V₂, so no concentration is given.

## Precision

Calculations use double precision (about 16 significant digits) and are not rounded. Display: a typed value keeps
up to 12 significant digits in every unit; a calculated value is shown to 6.

A double holds values from about 10⁻³⁰⁸ to 10³⁰⁸. An answer beyond that (1e300 g/mol × 1e300 M, say) is not shown; the
calculator says it is too large or too small to calculate (`outOfRange` in `engine/solve.ts`). A result of exactly 0
from a factor of 0 (0 M needs 0 g) is a true zero, not out of range.
