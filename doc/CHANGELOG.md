# Change log

What changed in Molarity Calculator, newest first. An entry says what the user sees, what changed inside, and any
decision taken (with its reason). Work not yet on `main` goes under **Unreleased**.

## Unreleased

### 2026-10-14 · Screen readers hear units in notation too

- **Seen:** nothing changes on screen. A screen reader now says a box's unit as it is written, "Concentration in mM",
  instead of "Concentration in millimolar".
- **Inside:** the boxes' labels use `symbol` (`ui/TileCard.tsx`, `ui/ConcentrationConverter.tsx`). The unit names in
  words (`name` in `units/units.ts`) had no other use and are removed. End-to-end tests find boxes by the new labels.

### 2026-10-13 · Unit menus in notation: mM, mL, mg

- **Seen:** every unit menu reads in notation (M, mM, µM… L, mL, µL… g, mg, µg…) instead of in words (millimolar,
  milliliter, milligrams), in all three calculators, including the two menus of the mass concentration in Convert.
- **Inside:** the menus show `symbol` instead of `name` (`ui/UnitSelect.tsx`, `ui/ConcentrationConverter.tsx`).
  `name` is kept for the boxes' labels, so screen readers still hear "Concentration in millimolar".
- **Decided:** notation is what is written on a tube or in a protocol, and it takes less room beside the number.

### 2026-10-11 · The report as numbered steps that fold

- **Seen:** each calculation in the report is a card of labelled rows: 1 Given, 2 Convert, 3 Apply, 4 Result, ✓ Check.
  The result sits in a blue band, in the unit chosen and, smaller, in base units. The answer stays in the card's
  header whether the card is open or folded; a tap anywhere on the header folds it. Rename and Remove moved to the
  foot of an open card, beside a green "✓ checked" (or "✗ check failed"). Collapse all, Copy as text and Clear report
  moved to a bar above the cards, which also counts them.
- **Fixed:** the check wrote the result to twelve digits (50775.174144); it is now rounded as the result is shown
  (50775.2). Very large or small numbers read 9.98 × 10¹¹ instead of 9.98e11, on the page and in the copied text.
- **Inside:** `ui/Report.tsx` and the report styles in `calc.css` rewritten; `answerOf()` and `readable()` in
  `state/report.ts`. The stored entries keep their shape, so reports already kept still open. 120 unit tests, 30
  end-to-end tests (updated for the new layout; one checks that the header folds the card).
- **Decided** (from ten report designs, then six variations of the numbered steps): labelled rows, as they read like a
  printed protocol, with folding. The warning for an unusually large amount (above 1 kg, say) is left for later: it
  needs a limit chosen.

### 2026-10-11 · The last three review items

- **Seen:** an answer too large or too small to calculate (beyond about 10^±308, from a mistyped exponent, say) now
  says so in red under the formula, in all three calculators, instead of staying blank or showing 0. `1,500e3` is
  refused like `1,500`: it could be 1500 or 1.5 million.
- **Inside:** `outOfRange()` in `engine/solve.ts`, `outOfRange` on each result, `converterOutOfRange()` in
  `state/model.ts`; unit and end-to-end tests for both.
- **Privacy guard:** `.githooks/check-privacy.sh` also blocks a Linux home folder path; `CLAUDE.md` says so.

### 2026-10-11 · Fixes from a code review

- **Seen:** **Clear report** now asks once more, **Delete all** or **Keep**, with Keep in focus so a second Enter
  does not delete; one tap no longer loses every kept calculation. **Copied** turns back into **Copy as text** after
  two seconds. On a phone the report's buttons wrap to a second line rather than breaking their words.
- **Screen readers:** the formula line under each calculator is no longer read out at every keystroke (the answer
  still is); the converter's error message is read with its boxes, as in the other two calculators.
- **Inside:** `loadReport()` checks every field the Report view reads, so an entry stored in another shape is left out
  instead of breaking the view (unit tests for it, and an end-to-end test for the two-step clear).
- **Docs:** `doc/DESIGN-ASSESSMENT.md` moved to `doc/archive/`: it described the first layout. The unit menu keeps
  its behaviour (a change of unit never changes the value), as decided.

### 2026-10-11 · Every calculator's formula, with the numbers in it

- **Seen:** under the formula of each calculator, a second line writes it out with the values as they are typed,
  each in the unit of its box; a value not typed yet shows as ?. Solution: m = 100 mM × 10 mL × 180.16 g/mol =
  180.16 mg (it follows the letter ticked). Dilution: V₁ = 10 mM × 100 mL / 1 M = 1 mL. Convert, which gains the same
  bottom line: Cm = 100 mM × 180.16 g/mol = 18.016 mg/mL, or C = Cm / MW = … when typing on the mass line. A number
  never parts from its unit at the end of a line on a phone.
- **Fixed:** the words "constant" and "g/mol or Da" in the molecular weight tile had taken the mono font and lost their
  grey (a style rule split in two in the previous change).
- **Inside:** `ui/worked.ts` builds the lines from the stored values; the answer in them is the engine's, so they
  cannot disagree with the page. 110 unit tests, 28 end-to-end tests.

### 2026-10-11 · Tiles and rows named by their letters: MW, C, V, m; Cm in Convert

- **Seen:** the Solution tiles are named MW, C, V and m, the letters of m = C × V × MW, as the Dilution tiles are named
  C₁, V₁, C₂, V₂. A letter keeps its case (m is a mass; an M would read as molar) and is set larger than a word.
- **Inside:** the labels in `ui/sections.ts`; `.tile-name.symbol` no longer turns letters into capitals. Screen
  readers still hear the words ("Concentration in millimolar").
- **Also in Convert:** its rows are named MW, C and **Cm** for the mass concentration (the MW row reads "g/mol or Da
  · constant" beside its box), and the "i" bubble and the docs write Cm = C × MW and C = Cm / MW where they had ρ.

### 2026-10-11 · One calculator at a time: a bar at the bottom of a phone, a rail on a laptop

- **Seen:** the calculators are no longer stacked. Four views, **Solution**, **Dilution**, **Convert** and **Report**,
  each an icon and a word: in a bar along the bottom of a phone, as in a phone app, and in a rail down the left of a
  laptop. Everything typed is kept when moving between them. The card titles lose their numbers. The molecular weight
  box is now white inside its grey tile (and in the converter's grey row), like every box typed in.
- **Inside:** `ui/ViewNav.tsx`; the old Calculators | Report tabs and their styles are replaced; the `--fixed-box`
  colour token is removed. 27 end-to-end tests: each opens the view it needs, and one checks the bar's place on a
  phone and on a laptop, and the arrow keys.
- **Decided** (from four phone designs and two laptop designs on the design canvas): a bottom bar on a phone, where a
  thumb reaches it; on a laptop, where a bottom bar looks out of place, the same four in a side rail.

### 2026-10-11 · The dilution as tiles: C₁, V₁, C₂, V₂, any one found

- **Seen:** calculator 2, "Dilute a stock solution", is now four tiles like calculator 1: C₁ and V₁ (the stock) on the
  top row, C₂ and V₂ (the final solution) on the bottom row, each with its own unit menu. Tick any of the four (V₁ at
  first) and type the other three. The formula used shows under the tiles, and the report writes out the calculation
  for whichever was found. A new message: finding a concentration with V₁ larger than V₂ is refused.
- **Inside:** `solveDilution(find, …)` in `engine/solve.ts` and three new equations; V₁ is now a typed quantity
  (`stockVolume`) with its own unit; `State.dilutionFind`; `ui/TileCard.tsx` draws calculators 1 and 2 (it replaces
  `SolutionCard.tsx`, and the GraphPad-style `Calculator.tsx` is removed, with its answer-row styles). 103 unit tests,
  26 end-to-end tests.
- **Decided:** names C₁, V₁, C₂, V₂ alone on the tiles (design A of two compared on the design canvas; screen readers
  hear "C₁, stock concentration" and so on). The concentrations are not grey: unlike the molecular weight, they are not
  constants of the substance. In the report, "desired" became "final" to match.

### 2026-10-10 · Calculators 1, 2 and 3 become one card

- **Seen:** mass, volume and concentration are one formula (m = C × V × MW), so they are now one card,
  "1. Mass, volume or concentration": four tiles, two by two, on a laptop and on a phone. Tick the name of the value
  to find (mass at first): its tile turns blue and shows the answer; type the other two. The molecular weight is the
  first tile, in light grey and marked "constant", as it is always typed; the converter's molecular weight row is grey
  the same way. The page now has three calculators: 1 this card, 2 the dilution, 3 the converter.
- **Inside:** `State.find` and the `find` action in `state/model.ts`; `ui/SolutionCard.tsx` replaces the three
  calculators; the add-to-report icon moved to `ui/AddToReport.tsx`; three `--fixed-*` colour tokens in `theme.css`.
  The engine and the report are unchanged. 95 unit tests, 24 end-to-end tests.
- **Decided** (from six designs, then eight phone versions of the tiles, compared on a design canvas): the answer shows
  in the ticked tile rather than in a separate answer row; ticking another tile keeps the answer as a typed value, so
  nothing seen disappears and switching back and forth is a check; the tile order is molecular weight, concentration,
  volume, mass.

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
