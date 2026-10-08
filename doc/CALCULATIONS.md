# Calculations

The reference for every number the calculator shows. The code is `src/engine/equations.ts` and `src/engine/solve.ts`;
the tests in `src/engine/solve.test.ts` and `src/state/model.test.ts` check the worked examples below.

## Units

Every value is stored in one canonical unit per kind of quantity. All other units are powers of ten of it.

| Quantity | Canonical | Units shown |
|---|---|---|
| Molar concentration | M = mol/L | M, mM (10⁻³), µM (10⁻⁶), nM (10⁻⁹), pM (10⁻¹²) |
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
C₁ × V₁ = C₂ × V₂  →  V₁ = C₂ × V₂ / C₁        dilution: the required volume of stock
```

These are the equations of GraphPad's molarity calculator, one per calculator on the page. n = m / MW is used only
by the tests. In a dilution C₁ and C₂ are compared in the same unit, whichever ones were chosen for them.

## Rules

| Input | Allowed | Why |
|---|---|---|
| Molecular weight | > 0 | divides every formula |
| Volume, desired volume | > 0 | a volume of 0 holds nothing; divides C |
| Concentration (solving for mass) | ≥ 0 | 0 M needs 0 g |
| Mass (solving for concentration) | ≥ 0 | 0 g gives 0 M |
| Concentration and mass (solving for volume) | > 0 | C = 0 divides by zero; m = 0 gives a volume of 0 |
| Stock and desired concentration | > 0 | C₁ = 0 divides by zero; C₂ = 0 is not a dilution |
| Desired vs stock | C₂ ≤ C₁ | a dilution can only lower a concentration |

C₂ = C₁ (within float noise, e.g. 1 mM against 1000 µM) is accepted: take the final volume of stock, no diluent.

## Worked examples

**Mass.** Glucose, MW 180.16 g/mol, 100 mM in 10 mL:
100 mM = 0.1 M; 10 mL = 0.01 L; m = 0.1 × 0.01 × 180.16 = 0.18016 g = **180.16 mg**; n = 1 mmol.

**Dilution.** 1 M stock, 10 mM desired, 100 mL desired volume:
V₁ = 0.01 × 0.1 / 1 = 0.001 L = **1 mL** of stock (made up to 100 mL).

**Refused dilution.** 10 mM stock, 100 mM desired: the desired concentration is above the stock, so no volume is given.

## Precision

Calculations use double precision (about 16 significant digits) and are not rounded. Display: a typed value keeps
up to 12 significant digits in every unit; a calculated value is shown to 6.
