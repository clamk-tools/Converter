# Molarity Calculator

A free calculator for making solutions at the bench: mass, volume, concentration and dilution.

**Open it:** https://clamk-tools.github.io/Converter/

It works in any web browser, on a computer or a phone. Nothing to install, no account, and nothing you type leaves
your device. It is one of the [Clamk Tools](https://clamk-tools.github.io/).

---

## The five calculators

Type your numbers; the answer appears as you type. There is no Calculate button.

| # | Calculator | You enter | You get | Example |
|---|---|---|---|---|
| 1 | Mass | concentration, molecular weight, volume | the mass to weigh | 100 mM, 180.16 g/mol, 10 mL → **180.16 mg** |
| 2 | Volume | mass, molecular weight, concentration | the volume to make up | 180.16 mg, 180.16 g/mol, 100 mM → **10 mL** |
| 3 | Molarity | mass, molecular weight, volume | the concentration | 180.16 mg, 180.16 g/mol, 10 mL → **100 mM** |
| 4 | Dilution | stock concentration, desired concentration, desired volume | the volume of stock to take | 1 M, 10 mM, 100 mL → **1 mL** |
| 5 | Converter | molecular weight, and a molar or mass concentration | the other one | 100 mM at 180.16 g/mol → **18.016 mg/mL** |

Calculators 1 to 4 are the same as GraphPad's molarity calculator. The molecular weight is in g/mol, which is the same
number as daltons (Da).

### Units

Each box has a unit menu: molar to picomolar, liter to nanoliter, grams to nanograms.

- **Changing a unit never changes the value.** 100 µM switched to mM shows 0.1.
- **Calculator 5's mass line has two menus**, one for the mass and one for the volume, so you can build any pair:
  µg/mL, mg/L, ng/µL… It also offers **% w/v** (grams per 100 mL) and **ppm** (milligrams per liter).

### Boxes that are linked

Calculators 1, 2 and 3 share their values. Type a molecular weight once and it appears in all three. Choose millimolar
for a concentration and every concentration, answers included, is shown in millimolar.

Calculator 4 (dilution) keeps its own values. Calculator 5 shares only the molecular weight, so converting a
concentration never changes the other calculators.

### The "i" button: the formulas

Each calculator has a small **i** at the right of its title. Press it to see the formulas that calculator uses, with
the unit of each symbol. Press it again to close it.

| Calculator | Formula |
|---|---|
| 1. Mass | m = C × V × MW |
| 2. Volume | V = m / (C × MW) |
| 3. Molarity | C = m / (MW × V) |
| 4. Dilution | C₁V₁ = C₂V₂, so V₁ = C₂ × V₂ / C₁ |
| 5. Converter | mass concentration = C × MW |

m = mass (g), C = concentration (mol/L), V = volume (L), MW = molecular weight (g/mol). Every value is converted to
these units before calculating. [`doc/CALCULATIONS.md`](doc/CALCULATIONS.md) has every formula and rule in full.

---

## The report

Beside each answer is an icon that adds the calculation to the **Report** tab. Each entry is written out step by step,
so that someone else (a client, a colleague) can check it:

```
1  Mass from volume & concentration
   GIVEN         C = 100 mM · MW = 180.16 g/mol · V = 10 mL
   IN BASE UNITS C = 100 mM × 10⁻³ = 0.1 mol/L · V = 10 mL × 10⁻³ = 0.01 L
   FORMULA       m = C × V × MW
   SUBSTITUTION  m = 0.1 mol/L × 0.01 L × 180.16 g/mol = 0.18016 g
   RESULT        m = 0.18016 g = 180.16 mg
   CHECK         C = m / (MW × V) = 0.18016 / (180.16 × 0.01) = 0.1 mol/L ✓
```

The last line, **CHECK**, works backwards from the answer to make sure it gives back what you entered.

In the report you can:

- **Rename** an entry (pencil icon), for example "Glucose stock".
- **Fold** an entry to its title and result (arrow icon), or fold them all at once.
- **Remove** an entry, or clear the whole report.
- **Copy as text** to paste the whole report into a document.

An entry keeps the values it had when you added it. The report stays in your browser after you close the page. It is
never sent anywhere. Calculator 5 cannot add to the report yet.

---

## Typing numbers

- **Decimals:** `0.25` and `0,25` both mean a quarter.
- **Powers of ten:** `1e-6` means 0.000001 (on a computer keyboard).
- **On a phone** the number keypad opens, as in a phone app. It has no `e` key, so for very small or large values pick a
  better unit instead (nM rather than M).
- **Refused:** `1,500`, because it could mean 1.5 or 1500. Write `1500`.
- **Precision:** answers show 6 significant figures. A number you typed keeps up to 12.

## When there is no answer

The answer stays empty, and a short message under the box says why, when:

- a molecular weight or volume is zero or negative;
- a mass or concentration is negative;
- a zero would mean dividing by zero (for example a concentration of 0 when solving for a volume);
- the desired concentration is higher than the stock: a dilution can only lower a concentration.

## Light or dark

The page follows your device's setting. The switch at the top right changes it, and the choice is shared with the
other Clamk tools.

## Privacy

All calculations happen on your device. The page loads nothing from other websites: no analytics, no outside fonts,
no trackers. The browser is told to block any such request, and the automatic tests fail if the page ever tries one.

---

## For developers

The rest of this page is for whoever changes the tool.

**Built with:** React and TypeScript, built by Vite, tested with Vitest (calculations) and Playwright (the page in real
browsers). Needs Node 22 or later.

```
npm install
npx playwright install chromium firefox webkit

npm run dev        # the page, at http://localhost:5184
npm test           # unit tests (units, numbers, formulas, state, report), under a second
npm run lint       # code style
npm run build      # type check, then build into dist/
npm run preview    # dist/ at http://localhost:4174/Converter/, as on GitHub Pages
npm run e2e        # the built page in Chromium, Firefox, WebKit and a phone-sized Chromium (build first)
```

On a machine that already has Chromium (a cloud container, say), skip the other browsers:
`PLAYWRIGHT_CHROMIUM=/path/to/chrome PLAYWRIGHT_ONLY_CHROMIUM=1 npm run e2e`.

### Read before changing anything

| File | What it explains |
|---|---|
| [`doc/ARCHITECTURE.md`](doc/ARCHITECTURE.md) | How the tool is built, and the steps for making a change |
| [`doc/CALCULATIONS.md`](doc/CALCULATIONS.md) | Every formula, unit and rule, with the worked examples the tests check |
| [`doc/DESIGN-ASSESSMENT.md`](doc/DESIGN-ASSESSMENT.md) | What was reused from the other Clamk tools, and why |
| [`doc/CHANGELOG.md`](doc/CHANGELOG.md) | What changed, newest first |
| [`doc/LLM feed for visual/`](doc/LLM%20feed%20for%20visual/LLMfeed_VISUAL-IDENTITY.md) | The Clamk Tools visual identity, which the page follows |

### Publishing safely

This repository is public, so everything committed here is public forever.

- **Privacy check:** `.githooks/check-privacy.sh` blocks a commit that contains a personal email, a private path on
  your computer, or a secret key or token. Turn it on once per copy of the repository: `git config core.hooksPath .githooks`.
- **Private words:** your computer user name or private project names go one per line in `~/.git-privacy-terms` or
  `.git/privacy-terms`, which are never published. A line holding an invented example can carry the marker
  `privacy-ok`.
- **Automatic checks:** on every push, `.github/workflows/ci.yml` runs the privacy check, code style, unit tests, build
  and browser tests. Only if all pass, a push to `main` publishes the site to GitHub Pages.
