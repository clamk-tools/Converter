# Change log

What changed in Molarity Calculator, newest first. An entry says what the user sees, what changed inside, and any
decision taken (with its reason). Work not yet on `main` goes under **Unreleased**.

## Unreleased

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
