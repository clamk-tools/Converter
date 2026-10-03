# Calculations

The reference for every number the calculator shows. The code is `src/engine/equations.ts` and `src/engine/solve.ts`;
the tests in `src/engine/solve.test.ts` and `src/state/model.test.ts` check the worked examples below.

## Units

Every value is stored in one canonical unit per kind of quantity. All other units are powers of ten of it.

| Quantity | Canonical | Units shown |
|---|---|---|
| Molar concentration | M = mol/L | M, mM (10⁻³), µM (10⁻⁶), nM (10⁻⁹), pM (10⁻¹²) |
| Mass concentration | g/L = mg/mL | mg/mL, µg/mL (10⁻³), ng/mL (10⁻⁶) |
| Volume | L | L, mL, µL, nL |
| Mass | g | g, mg, µg, ng |
| Amount of substance | mol | mol, mmol, µmol, nmol, pmol |
| Molecular weight | g/mol | g/mol, kDa (= kg/mol = 10³ g/mol) |

## Formulas

With m in g, MW in g/mol, V in L, C in M:

```
n = m / MW                       amount of substance
C = n / V = m / (MW × V)         concentration
m = C × V × MW                   mass
V = m / (C × MW)                 volume
ρ = C × MW   (g/L)               mass concentration, and C = ρ / MW
C₁ × V₁ = C₂ × V₂  →  V₁ = C₂ × V₂ / C₁        dilution; diluent = V₂ − V₁; factor = C₁ / C₂
```

In a dilution C₁ and C₂ only need the same unit. When one is molar and the other a mass concentration, both are
converted to molar through MW; without MW they cannot be compared and no result is given.

## Rules

| Input | Allowed | Why |
|---|---|---|
| Molecular weight | > 0 | divides every formula |
| Volume, final volume | > 0 | a volume of 0 holds nothing; divides C |
| Concentration (solving for mass) | ≥ 0 | 0 M needs 0 g |
| Mass (solving for concentration) | ≥ 0 | 0 g gives 0 M |
| Concentration and mass (solving for volume) | > 0 | C = 0 divides by zero; m = 0 gives a volume of 0 |
| Stock and target concentration | > 0 | C₁ = 0 divides by zero; C₂ = 0 is not a dilution |
| Target vs stock | C₂ ≤ C₁ | a dilution can only lower a concentration |

C₂ = C₁ (within float noise, e.g. 1 mM against 1000 µM) is accepted: take the final volume of stock, no diluent.

## Worked examples

**Mass.** Glucose, MW 180.16 g/mol, 100 mM in 10 mL:
100 mM = 0.1 M; 10 mL = 0.01 L; m = 0.1 × 0.01 × 180.16 = 0.18016 g = **180.16 mg**; n = 1 mmol;
ρ = 0.1 × 180.16 = 18.016 g/L = 18.016 mg/mL.

**Dilution.** 1 M stock, 10 mM target, 100 mL final:
V₁ = 0.01 × 0.1 / 1 = 0.001 L = **1 mL** of stock, 99 mL of diluent, a 100-fold dilution.

**Refused dilution.** 10 mM stock, 100 mM target: the target is above the stock, so no volume is given.

**Protein.** BSA, 66.5 kDa = 66 500 g/mol, 10 µM in 1 mL: m = 10⁻⁵ × 10⁻³ × 66 500 = 6.65 × 10⁻⁴ g = 0.665 mg.

## Precision

Calculations use double precision (about 16 significant digits) and are not rounded. Display: a typed value keeps
up to 12 significant digits in every unit; a calculated value is shown to 6. The Copy text is the value as shown.
