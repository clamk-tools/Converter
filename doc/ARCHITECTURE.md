# Architecture

How Molarity Calculator is made, for whoever changes it next (a person or an LLM). `README.md` says what the tool
does for its user; `doc/CALCULATIONS.md` holds the science; `doc/CHANGELOG.md` says what changed.

## 1. In one paragraph

A static page (React + TypeScript, built by Vite, served by GitHub Pages), no backend. The state holds each
physical quantity **once**, in a canonical unit (concentration = 0.0001 M). Every box on the page is computed from
that state; typing in a box replaces the quantity it belongs to. The calculators are pure functions of the state, so
dependent quantities recalculate on every keystroke with no update loops.

## 2. The layers

```
 units/units.ts        unit definitions, canonical units, conversion (powers of ten)
 numbers/parse.ts      text → number | partial | invalid | empty
 numbers/format.ts     number → text (display precision, notation)
 engine/equations.ts   the bare formulas, canonical units
 engine/solve.ts       the two calculators: validation, then equations
 state/model.ts        the scientific state, the reducer (user actions), derive() and boxText()
 state/report.ts       the calculation report: each entry a worked calculation (given → base units → formula → substitution → result → check), kept in the browser's storage
 ui/sections.ts        GraphPad's four calculators as data: their rows in order, and their answer
 ui/formulas.ts       the formulas of each calculator, as text for its "i" bubble (documentation, not computation)
 ui/*.tsx              components: Calculator (one calculator), ConcentrationConverter (calculator 5), InfoBubble, Report, UnitSelect, ThemeSwitch
 App.tsx               the frame (rail, header, footer) around the four calculators
 styles/               theme.css: tokens and controls (shared with the other tools); app.css: frame; calc.css: the calculator
```

A layer imports only from the layers above it. No formula lives in a component; no component state holds a value.

## 3. The flow of one keystroke

```
 user types "100" in the µM box of Concentration
   → dispatch { type: "type", field: "concentration", unit: "uM", text: "100" }
   → reducer: parseNumber → 100 → toCanonical(100, µM) = 0.0001
              entries.concentration = { kind: "value", value: 0.0001 }
              editing = { field, unit, box, text }     (only for the box being typed in)
   → derive(state): solveSolution(...) × 3 → mass, volume, molarity; solveDilution(...) → required volume
   → every input box: boxText(state, derived, field, unit, calculator)
        the box being typed in → its raw text ("1e-" stays "1e-")
        any other box          → formatNumber(valueIn(field, unit), 12 digits)
   → every answer: resultText(state, derived, answer) → "180.16 mg", 6 digits, in its quantity's unit
```

Two kinds of relationship, kept apart:

- **Unit equivalence** (the M, mM, µM boxes of one quantity): not stored at all. Each box is `fromCanonical` of the
  one stored value, so they cannot disagree.
- **Scientific dependency** (mass ← concentration, volume, MW): computed in `derive()` by the engine. The answer is
  never written back into the state while it is the answer, so nothing loops.

### State (`state/model.ts`)

| Field | Holds |
|---|---|
| `entries` | the typed quantities: `molarMass`, `concentration`, `volume`, `mass`, `stock`, `target`, `finalVolume`. Each is empty, a canonical value, or invalid (with the reason) |
| `units` | the unit each quantity is shown in, everywhere it appears. An answer shares its quantity's unit (`SLOT`: `massResult` → `mass`; the required volume → the desired volume). The molecular weight has none: always g/mol. Changing a unit changes nothing else |
| `editing` | the box being typed in (quantity, unit and calculator) and its raw text |

Rules the reducer follows:

- A partial number (`1e-`, `.`) leaves the quantity at its last value; leaving the box with it marks it invalid.
- Answers have their own ids (`massResult`, `volumeResult`, `concentrationResult`, `stockVolume`) and are never
  stored: the mass to weigh in the first calculator and the mass typed in the second
  are different things on the page.
- Each calculator applies its own rules to the shared values (`issueAt`): a mass of 0 gives 0 M in *Molarity*, but
  is refused in *Volume*.

### Precision (`numbers/format.ts`)

Calculations use full doubles. Units are powers of ten applied by exact division or multiplication, so a unit change
adds no error. Display rounds: 12 significant digits for a typed value in any of its units (keeps what was typed,
hides float noise), 6 for a calculated value. Plain notation from 1e-5 to 1e10, `e` notation outside.

## 4. Tests

| Where | What |
|---|---|
| `src/units/units.test.ts` | every unit relation of the brief (1 g = 1000 mg…), no float noise through the canonical unit |
| `src/numbers/numbers.test.ts` | parsing (decimals, `e`, comma, partial, invalid, overflow), formatting (noise, notation, round trip) |
| `src/engine/solve.test.ts` | each equation, both sanity checks, every validation rule, tiny and huge values, overflow |
| `src/state/report.test.ts` | each calculation worked by hand (given, conversions, substitution, result, check), base-unit and tiny values, a snapshot that later edits do not change, the plain-text form, renaming and collapsing |
| `src/engine/solve.test.ts` also | ρ = C × MW and back, the checks of calculator 5 |
| `src/state/model.test.ts` | synchronisation (100 µM, 0.25 mM, 2 mL, 5 mg), linked boxes, unit changes, calculator 5 (two linked lines, each with its unit menu, across kinds through the molecular weight, "needs MW"), the three calculators on shared values, per-calculator rules, typing states, dilution |
| `e2e/calculator.spec.ts` | the built page used through the keyboard and mouse, in four browser set-ups; also fails on any request to another host |

## 5. Making a change

1. **Find the layer** in section 2. A new unit is one line in `units/units.ts`. A new formula goes in
   `engine/equations.ts`, its checks in `engine/solve.ts`, and its wiring in `derive()`.
2. **Write the test first** in the matching `*.test.ts`, with the numbers worked out by hand in
   `doc/CALCULATIONS.md`.
3. **Run the checks:** `npm test`, `npm run lint`, `npm run build`, then `npm run e2e`.
4. **Look at it** with `npm run dev`, in light and dark, at desktop and phone width.
5. **Update the docs**: `README.md` for what the user sees, `doc/CALCULATIONS.md` for any science,
   this file for structure, and an entry in `doc/CHANGELOG.md`.
6. **Stop before publishing.** A push to `main` deploys the site; that is the owner's decision.

Visual changes follow `doc/LLM feed for visual/LLMfeed_VISUAL-IDENTITY.md` and use the tokens in
`src/styles/theme.css` only.

## 6. Decisions that stand

- **Same stack as Metadata-Miner** (React, Vite, plain CSS with tokens, Vitest, Playwright, ESLint), the closest
  sibling tool, so the family stays maintainable by the same hands. No state library: one `useReducer` is enough.
- **No Calculate button.** Answers follow every keystroke, as the inputs are cheap to compute.
- **Text boxes, not `type="number"`**: number boxes reject `1e-` while it is typed and differ between browsers.
  Every number box has `inputMode="decimal"`, so a phone (Android and iPhone) shows the numeric keypad: digits and a
  decimal separator, as in a phone app. That keypad has no `e` and no minus, so on a phone a very small or large value
  is typed in a better unit (nM, µL…) rather than in scientific notation; a keyboard still accepts `1e-6`. The keypad's
  separator follows the phone's language (a comma in many), which is why the decimal comma is accepted.
- **A decimal comma is accepted**, but `1,500` is refused: it could mean either.
- **Fonts and code served by the site**, under a Content-Security-Policy: no third party sees who uses the tool.

## 7. Calculator 5 (the converter)

One concentration on two lines, molar and mass per volume, each with its own unit menu (`units.converterMolar`,
`units.converterMass`, changed by the `converterUnit` action). The mass line's unit is a *pair*: `units/units.ts` builds `"mg/mL"`-style
units from a mass unit and a volume unit (`pair`, `splitPair`), so the 4 × 4 combinations need no list, and the line shows
two menus for them; % w/v and ppm are the two units that are not pairs. It is stored once, as typed: `entries.converter` is a
canonical value *and its dimension* (`molar` in M, or `massConc` in g/L), which is why `Entry` carries `dimension`.
`converterValueIn()` shows it in any unit: a change of unit within its dimension, or, across dimensions, ρ = C × MW or
C = ρ / MW with the molecular weight of calculators 1 to 3 (`null` without one: the box says "needs MW"). Typing in a
line replaces the stored value, so the other follows. It is deliberately separate from `entries.concentration`:
converting a value must not change the mass worked out in calculator 1.
