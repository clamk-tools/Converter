# Change log

What changed in Molarity Calculator, newest first. An entry says what the user sees, what changed inside, and any
decision taken (with its reason). Work not yet on `main` goes under **Unreleased**.

## Unreleased

### 2026-10-08 · Less text

- **Seen:** the paragraph above the calculators and "Runs in your browser, nothing is sent." in the footer are gone.
  The footer keeps the links to the hub and the source.

## Released

### 2026-10-08 · GraphPad's calculators, exactly

- **Seen:** the calculators are now the ones on GraphPad's page, from screenshots of it: the same four, numbered, with
  the same rows in the same order ("Concentration:", "Molecular weight (g/mol):", "Volume:" → "Mass ="), unit menus
  in words (millimolar, milliliter, milligrams) and the answer in one box with its unit ("180.16 mg"). Removed, as
  GraphPad has none of them: kDa, mass concentrations (mg/mL…), the amount and diluent rows, the every-unit lines,
  the result sentences, the Copy buttons and Clear all. The links stay: concentration, molecular weight, volume and
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
  three, and a unit picked for a quantity shows everywhere. "Molecular weight" is now "Molecular weight", as on GraphPad.
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
