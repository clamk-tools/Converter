# Molarity Calculator

A free calculator for making solutions at the bench: mass, volume, concentration and dilution.

**Open it:** https://clamk-tools.github.io/Converter/

It works in any web browser, on a computer or a phone. Nothing to install, no account, and nothing you type leaves
your device. It is one of the [Clamk Tools](https://clamk-tools.github.io/).

---

## The three calculators

Type your numbers; the answer appears as you type. There is no Calculate button.

Each calculator has its own view, chosen with **Solution**, **Dilution** and **Convert**: in a bar at the bottom of a
phone, in a rail on the left of a laptop. The fourth, **Report**, holds the calculations you keep. Moving between them
keeps everything you typed.

| # | Calculator (view) | You enter | You get | Example |
|---|---|---|---|---|
| 1 | Mass, volume or concentration (Solution) | the molecular weight, and two of mass, volume, concentration | the third one | 100 mM, 180.16 g/mol, 10 mL → **180.16 mg** |
| 2 | Dilution (Dilution) | three of C₁, V₁ (the stock) and C₂, V₂ (the final solution) | the fourth | C₁ 1 M, C₂ 10 mM, V₂ 100 mL → V₁ **1 mL** |
| 3 | Converter (Convert) | MW, and a molar concentration C or a mass concentration Cm | the other one | 100 mM at 180.16 g/mol → **18.016 mg/mL** |

The molecular weight is in g/mol, which is the same number as daltons (Da).

### Calculator 1: tick what you want to find

Mass, volume and concentration are one formula, m = C × V × MW (mass = concentration × volume × molecular weight),
so they share one card of four tiles, each named by its letter: **MW**, **C**, **V**, **m**. **Tick the letter of the
value you want** (m, at first): its tile turns blue and shows the answer. Type the other two. The MW tile, top left
and grey, is the substance's constant: it is always typed.

When you tick another value, the answer you had stays in its box as a typed number. Found 180.16 mg, then ticked
Volume: the mass box keeps 180.16 mg and the volume shows 10 mL. Switching back and forth is a quick check.

### Calculator 2: the dilution, the same way

C₁V₁ = C₂V₂ as four tiles: the stock on the top row (C₁, its concentration; V₁, the volume of it to take), the final
solution on the bottom row (C₂, V₂). **Tick any one of the four** (V₁, at first) and type the other three: how much
stock to take, how much you can make, what concentration you get, or what stock you need. Each value has its own
unit menu.

### The formula, with your numbers

Under each calculator, the formula it uses is written out with your numbers as you type them, each in its own unit; a
value not typed yet shows as ?:

- Solution: m = 100 mM × 10 mL × 180.16 g/mol = 180.16 mg
- Dilution: V₁ = 10 mM × 100 mL / 1 M = 1 mL
- Convert: Cm = 100 mM × 180.16 g/mol = 18.016 mg/mL, or C = Cm / MW when you type on the mass line

### Units

Each box has a unit menu: molar to picomolar, liter to nanoliter, grams to nanograms.

- **Changing a unit never changes the value.** 100 µM switched to mM shows 0.1.
- **Calculator 3's mass concentration line (Cm) has two menus**, one for the mass and one for the volume, so you can build any pair:
  µg/mL, mg/L, ng/µL… It also offers **% w/v** (grams per 100 mL) and **ppm** (milligrams per liter).

### Boxes that are linked

Calculator 2 (dilution) keeps its own values. Calculator 3 shares only the molecular weight with calculator 1 (a grey
tile or row in both, as a constant; its box is white like the others), so converting a concentration never changes
calculator 1.

### The "i" button: the formulas

Each calculator has a small **i** at the right of its title. Press it to see the formulas that calculator uses, with
the unit of each symbol. Press it again to close it.

| Calculator | Formula |
|---|---|
| 1. Mass, volume or concentration | m = C × V × MW, so V = m / (C × MW) and C = m / (MW × V) |
| 2. Dilution | C₁V₁ = C₂V₂, so V₁ = C₂ × V₂ / C₁, V₂ = C₁ × V₁ / C₂, C₁ = C₂ × V₂ / V₁, C₂ = C₁ × V₁ / V₂ |
| 3. Converter | Cm = C × MW, so C = Cm / MW (Cm: mass concentration) |

m = mass (g), C = concentration (mol/L), V = volume (L), MW = molecular weight (g/mol). Every value is converted to
these units before calculating. [`doc/CALCULATIONS.md`](doc/CALCULATIONS.md) has every formula and rule in full.

---

## The report

Beside each answer is an icon that adds the calculation to the **Report** view. Each entry is written out as numbered
steps, so that someone else (a client, a colleague) can check it:

```
1  Mass from volume & concentration                    180.16 mg
   1 GIVEN    C = 100 mM · MW = 180.16 g/mol · V = 10 mL
   2 CONVERT  C = 100 mM × 10⁻³ = 0.1 mol/L · V = 10 mL × 10⁻³ = 0.01 L
   3 APPLY    m = C × V × MW
              m = 0.1 mol/L × 0.01 L × 180.16 g/mol = 0.18016 g
   4 RESULT   m = 180.16 mg  (0.18016 g)
   ✓ CHECK    C = m / (MW × V) = 0.18016 / (180.16 × 0.01) = 0.1 mol/L
   ✓ checked                                      Rename   Remove
```

The **CONVERT** step appears only when a value was not already in base units. The **CHECK** works backwards from the
answer to make sure it gives back what you entered; a passed check shows a green "✓ checked", a failed one "✗ check
failed". Very large or small numbers are written as a person writes them: 9.98 × 10¹¹ pM, not 9.98e11 pM.

In the report you can:

- **Fold** an entry by tapping its header (or the arrow), or fold them all at once with **Collapse all**. The answer
  stays in the header, so a folded report reads as a list of results.
- **Rename** an entry, for example "Glucose stock", or **Remove** it, from the foot of an open entry.
- **Copy as text** to paste the whole report into a document, or **Clear report**. These sit above the entries.

An entry keeps the values it had when you added it. The report stays in your browser after you close the page. It is
never sent anywhere. Calculator 3 cannot add to the report yet.

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
- in a dilution, C₂ is higher than C₁, or V₁ is larger than V₂: a dilution can only lower a concentration, and the
  stock you take cannot be more than the final volume.

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
  your computer, or a secret key or token. Turn it on once per copy of the repository:
  `git config core.hooksPath .githooks`.
- **Private words:** your computer user name or private project names go one per line in `~/.git-privacy-terms` or
  `.git/privacy-terms`, which are never published. A line holding an invented example can carry the marker
  `privacy-ok`.
- **Automatic checks:** on every push, `.github/workflows/ci.yml` runs the privacy check, code style, unit tests, build
  and browser tests. Only if all pass, a push to `main` publishes the site to GitHub Pages.
