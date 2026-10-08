# Change log

What changed in Molarity Calculator, newest first. An entry says what the user sees, what changed inside, and any
decision taken (with its reason). Work not yet on `main` goes under **Unreleased**.

## Unreleased

### 2026-10-08 · GraphPad's layout

- **Seen:** the two tabs are replaced by four calculators stacked on one page, in the order of GraphPad's molarity
  calculator: mass, volume, molarity, dilution. Each input is one box with a unit menu; each answer is listed in every
  other unit under its box. The calculators share their values and units: a formula weight typed once is in all
  three, and a unit picked for a quantity shows everywhere. "Molecular weight" is now "Formula weight", as on GraphPad.
- **Inside:** `state/model.ts` drops `solveFor` and the tabs; each calculator solves for its own answer from the shared
  values, and answers have their own ids so they are never stored. New `ui/sections.ts` and `ui/Calculator.tsx`
  replace the cards, panels and sticky result bar. Tests rewritten for the new page (67 unit, 12 end-to-end).
- **Decided:** values and units shared across the calculators (asked: "interconnected"); the all-units list kept for
  answers only. The equations and validation are unchanged: GraphPad's are the same.

## Released

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
