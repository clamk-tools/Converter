# Change log

What changed in Molarity Calculator, newest first. An entry says what the user sees, what changed inside, and any
decision taken (with its reason). Work not yet on `main` goes under **Unreleased**.

## Unreleased

### 2026-10-10 · A simpler README

- **Seen:** `README.md` is rewritten in plain words for someone who just wants to use the tool: a table of the five
  calculators with an example each, then units, linked boxes, the formulas, the report, typing numbers, when there is
  no answer, and privacy. The developer part is at the end, under its own heading.
- **Decided:** the science stays complete in `doc/CALCULATIONS.md`; the README links to it rather than repeating it.

### 2026-10-10 · Numeric keypad on a phone

- **Seen:** on a phone, every number box opens the numeric keypad (digits and a decimal separator) instead of the full
  keyboard, on Android and iPhone.
- **Inside:** `inputMode="decimal"` on every number box (the four calculators, and the molecular weight and the
  concentration of calculator 5); the boxes stay text boxes. 23 end-to-end tests.
- **Decided:** `inputMode="decimal"` rather than `"numeric"`, since `"numeric"` has no decimal point. The keypad has
  no `e` and no minus, so on a phone scientific notation is typed in a better unit instead (nM, µL); a keyboard still
  takes `1e-6`. The decimal comma, which many phones' keypads give, was already accepted.

### 2026-10-10 · An "i" on each calculator, with its formulas

- **Seen:** every calculator has a small **i** beside its title. Pressed, it opens a compact bubble under the title with
  the formulas that calculator uses (symbols in bold, units regular and, in the letters line of every bubble, raised beside their symbol as C^mol/L; a few words beside some) and one line of letters, units and rules. The **i** sits at
  the right end of the title row. Pressed again, or Escape, it closes. Calculators 1 to 3: n = C × V, n = m / MW and the two combined;
  4: C₁V₁ = C₂V₂, V₁ = C₂ × V₂ / C₁, V₂ − V₁; 5: ρ = C × MW, C = ρ / MW, % w/v and ppm.
- **Inside:** the text is data in `ui/formulas.ts`, shown by `ui/InfoBubble.tsx`; no formula is computed there. 22
  end-to-end tests.
- **Decided:** a bubble under the title (not a hover tip) so it works on a phone and can be read at length.

### 2026-10-09 · Calculator 5: choose the mass and the volume unit

- **Seen:** the mass concentration line of calculator 5 has two menus, a mass unit (grams, milligrams, micrograms,
  nanograms) and a volume unit (liter, milliliter, microliter, nanoliter), so any pair can be chosen: µg/mL, mg/L, ng/µL,
  g/nL… The mass menu still offers % w/v and ppm, and then the volume menu shows "per 100 mL" or "per L" and is fixed.
- **Inside:** a mass concentration unit is now built from its two parts (`pair("mg", "mL")` is `"mg/mL"`, exponent: mass
  unit minus volume unit) instead of a fixed list; `g_L`, `mg_mL`, `ug_mL`, `ng_mL` become `"g/L"`, `"mg/mL"`,
  `"ug/mL"`, `"ng/mL"`. 88 unit tests, 21 end-to-end tests.

### 2026-10-09 · Calculator 5: mass and molar concentration

- **Seen:** a fifth calculator under the four, in the same style: Molecular weight (g/mol or Da), then two lines, **Molar
  concentration** (molar to picomolar) and **Mass concentration** (g/L, mg/mL, % w/v, µg/mL, ppm, ng/mL), each a box
  with a unit menu. The lines are linked: 100 mM at 180.16 g/mol shows 18.016 mg/mL, or 1.8016 % w/v in the other
  unit. The mass line says "needs MW" until there is a molecular weight; a negative concentration and a molecular
  weight of zero are explained.
- **Inside:** units `g/L`, `mg/mL`, `% w/v`, `µg/mL`, `ppm`, `ng/mL` (exact powers of ten); `ρ = C × MW` and its inverse in
  `engine/equations.ts`; `checkConversion` in `engine/solve.ts`; `Entry` now records its dimension; the two menus are
  state (`converterUnit`); new `ui/ConcentrationConverter.tsx`. 84 unit tests, 19 end-to-end tests.
- **Decided:** its concentration is its own value (not the concentration of calculators 1 to 3); it shares only the
  molecular weight. No report entry for it yet. Two lines with menus rather than a grid of every unit, so the units are
  chosen, as in the other calculators.

### 2026-10-09 · The report is a calculation report, with names and folding

- **Seen:** each entry of the Report tab is now a worked calculation: given, conversions to base units (with the
  factor, e.g. `10 mL × 10⁻³ = 0.01 L`), formula, substitution, result in base units and in the unit chosen, and a
  check by working backwards from the result, marked ✓ when it gives back the input. *Copy as text* puts the whole
  report in the clipboard for a document. Each calculation can be renamed (pencil; Enter saves, Escape cancels, an
  empty name gives the title back) and collapsed (chevron) to its heading and result; *Collapse all* / *Expand all*
  does the whole report. A name and the folded state are kept with the entry.
- **Inside:** `state/report.ts` builds entries from the same stored values and equations as the calculators; the
  check calls `engine/equations.ts`, so it is a real recalculation. The storage key is now `…:report-v2` (earlier
  one-line entries are not read). `ui/clipboard.ts` is back for Copy as text. 72 unit tests, 15 end-to-end tests.

### 2026-10-08 · A report, and "molecular weight"

- **Seen:** each answer has an icon to add it to a report. A second tab, *Report*, lists what was added as one
  condensed numbered line each (`Mass  C 100 mM · MW 180.16 g/mol · V 10 mL → m 180.16 mg`), with the values as they were
  when added; a line can be removed and the report cleared. The report is kept in the browser. The row is now
  "Molecular weight (g/mol or Da)" (was "Formula weight"), and the messages say the same.
- **Inside:** new `state/report.ts` (entries as snapshots, browser storage guarded) and `ui/Report.tsx`; the page gets
  two tabs. 65 unit tests, 12 end-to-end tests.
- **Decided:** the label says "g/mol or Da" and the unit stays g/mol, as 1 Da = 1 g/mol.

### 2026-10-08 · Less text

- **Seen:** the paragraph above the calculators and "Runs in your browser, nothing is sent." in the footer are gone.
  The footer keeps the links to the hub and the source.

## Released

### 2026-10-08 · GraphPad's calculators, exactly

- **Seen:** the calculators are now the ones on GraphPad's page, from screenshots of it: the same four, numbered, with
  the same rows in the same order ("Concentration:", "Formula weight (g/mol):", "Volume:" → "Mass ="), unit menus
  in words (millimolar, milliliter, milligrams) and the answer in one box with its unit ("180.16 mg"). Removed, as
  GraphPad has none of them: kDa, mass concentrations (mg/mL…), the amount and diluent rows, the every-unit lines,
  the result sentences, the Copy buttons and Clear all. The links stay: concentration, formula weight, volume and
  mass are one value each across the first three calculators, and a unit chosen for one shows everywhere, answers
  included. The dilution keeps its own values.
- **Inside:** the unit system has names and loses the mass-concentration, amount and kDa units; the state stores one
  number per quantity. `ui/summary.ts`, `CopyButton.tsx` and `clipboard.ts` are deleted. 61 unit tests, 11
  end-to-end tests.
- **Decided:** GraphPad's orange "Mass =" button is a Clamk accent label, not a button, since answers follow typing.

### 2026-10-08 · GraphPad's layout

- **Seen:** the two tabs are replaced by four calculators stacked on one page, in the order of GraphPad's molarity
  calculator: mass, volume, molarity, dilution. Each input is one box with a unit menu; each answer is listed in every
  other unit under its box. The calculators share their values and units: a molecular weight typed once is in all
  three, and a unit picked for a quantity shows everywhere. "Molecular weight" is now "Formula weight", as on GraphPad.
- **Inside:** `state/model.ts` drops `solveFor` and the tabs; each calculator solves for its own answer from the shared
  values, and answers have their own ids so they are never stored. New `ui/sections.ts` and `ui/Calculator.tsx`
  replace the cards, panels and sticky result bar. Tests rewritten for the new page (67 unit, 12 end-to-end).
- **Decided:** values and units shared across the calculators (asked: "interconnected"); the all-units list kept for
  answers only. The equations and validation are unchanged: GraphPad's are the same.

### 2026-10-03 · First version

- **Seen:** two tabs, *Make a solution* (solve for mass, concentration or volume; molecular weight in g/mol or kDa)
  and *Dilute a stock* (C₁V₁ = C₂V₂). Every quantity is shown in all its units at once, all editable and in step;
  concentrations also as mg/mL, µg/mL, ng/mL through the molecular weight. Answers follow each keystroke, are
  stated in a sentence and can be copied. Problems are explained at the box. Light and dark themes.
- **Inside:** layers for units, number parsing and formatting, equations, validation, state and UI
  (`doc/ARCHITECTURE.md`). 62 unit tests and 13 end-to-end tests (desktop and phone).
- **Decided:** same stack as Metadata-Miner. The tool template's plain `index.html` and its deploy-only
  `pages.yml` were replaced by the Vite page and `ci.yml` (which tests before deploying); both remain in the git
  history. The tool name is *Molarity Calculator*; the repository keeps the name `Converter`, so the address is
  `/Converter/`.
