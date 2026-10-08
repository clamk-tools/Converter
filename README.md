# Molarity Calculator

Mass, concentration, volume and dilution for the bench, with every unit kept in step.

**Open it:** https://clamk-tools.github.io/Converter/

The tool is one of the [Clamk Tools](https://clamk-tools.github.io/). It runs entirely in the browser: nothing is
installed and nothing is sent anywhere.

## Using it

GraphPad's four molarity calculators, with the same rows in the same order. Each answer follows at every
keystroke; there is no Calculate button.

1. **Mass from volume & concentration:** Concentration, Molecular weight (g/mol or Da), Volume → **Mass =**.
   *100 mM, 180.16 g/mol, 10 mL → 180.16 mg.*
2. **Volume from mass & concentration:** Mass, Molecular weight, Concentration → **Volume =**.
3. **Molarity from mass & volume:** Mass, Molecular weight, Volume → **Molarity =**.
4. **Dilute a stock solution:** Stock concentration, Desired concentration, Desired volume → **Required volume =**,
   the volume of stock to take (C₁ × V₁ = C₂ × V₂). *1 M, 10 mM, 100 mL → 1 mL.*

### Linked boxes

Boxes of the same kind are linked across the first three calculators: the concentration, the molecular weight, the
volume and the mass are each one value, so typing one in any calculator fills it in the others. A unit chosen for a
quantity shows wherever it appears, and its answers are given in it too: pick molar for a concentration and every
concentration, including the Molarity answer, is in molar. Changing a unit changes how a value is shown, never the
value (100 micromolar switched to millimolar shows 0.1). The dilution keeps its own three values and units, and gives
the required volume in the unit of the desired volume.

Units, named as on GraphPad: molar to picomolar, liter to nanoliter, grams to nanograms. The molecular weight is in
grams/mole (= daltons).

### Calculation report

The icon beside each answer adds its calculation to the **Report** tab, written out so that a client can follow it:
what was entered, each conversion to base units with its factor, the formula, the numbers substituted, the result in
base units and in the unit chosen, and a check made by working backwards from the result (it must give back the input).

```
1  Mass from volume & concentration
   GIVEN         C = 100 mM · MW = 180.16 g/mol · V = 10 mL
   IN BASE UNITS C = 100 mM × 10⁻³ = 0.1 mol/L · V = 10 mL × 10⁻³ = 0.01 L
   FORMULA       m = C × V × MW
   SUBSTITUTION  m = 0.1 mol/L × 0.01 L × 180.16 g/mol = 0.18016 g
   RESULT        m = 0.18016 g = 180.16 mg
   CHECK         C = m / (MW × V) = 0.18016 / (180.16 × 0.01) = 0.1 mol/L ✓
```

The values are those at the moment of adding; later edits do not change an entry. Each calculation has a pencil to
rename it (for example "Glucose stock, 100 mM": the kind of calculation stays beside the name) and a chevron to
collapse it to its heading and result; it can also be removed. *Collapse all* folds the whole report, and the report
can be copied as text for a document or cleared. It is kept in your browser, so it survives a reload; it is not sent
anywhere.

### Typing numbers

`0.25`, `0,25` (decimal comma), `1e-6`, `2.5E8` and a leading minus are read. A number being typed (`1e-`, `0.`)
is left alone until you leave the box. `1,500` is refused as ambiguous (1.5 or 1500?), as are thousands separators.
Results are shown to 6 significant digits; typed values keep their digits (up to 12). Very small or very large
values are shown in the `e` notation the boxes accept, e.g. `2.5e-7`.

### What it refuses, and why

A zero or negative molecular weight or volume, a negative mass or concentration, a zero that would divide by zero
(solving for a volume with a concentration of 0), a zero stock, and a desired concentration above the stock: a
dilution can only lower a concentration. Each problem is explained under its box, and the answer stays empty.

### Light or dark

The page follows the system setting until the switch at the top right is used. The choice is then kept in the
browser, and it is the same one on the hub and on every Clamk tool.

## Privacy

Everything is calculated in the page. The page, its fonts and its code are served by the site itself: no CDN, no
analytics. The built page carries a Content-Security-Policy that makes the browser refuse requests to any other
host, and the end-to-end tests fail if the page asks anything of another host.

## Developing

Needs Node 22 or later.

```
npm install
npx playwright install chromium firefox webkit

npm run dev        # the page, at http://localhost:5184
npm test           # unit tests: units, numbers, equations, state, result sentences   < 1 s
npm run lint
npm run build      # type check, then build into dist/
npm run preview    # dist/ at http://localhost:4174/Converter/, the path it has on GitHub Pages
npm run e2e        # the built page in Chromium, Firefox, WebKit and a phone-sized Chromium (build first)
```

On a machine that already has a Chromium (such as a cloud container), use it and skip the other browsers:
`PLAYWRIGHT_CHROMIUM=/path/to/chrome PLAYWRIGHT_ONLY_CHROMIUM=1 npm run e2e`.

### Before changing it

| File | What it holds |
|---|---|
| [`doc/ARCHITECTURE.md`](doc/ARCHITECTURE.md) | How the tool is made, and how to make a change |
| [`doc/CALCULATIONS.md`](doc/CALCULATIONS.md) | Every formula, unit and rule, with the worked examples the tests check |
| [`doc/DESIGN-ASSESSMENT.md`](doc/DESIGN-ASSESSMENT.md) | What was taken from the other Clamk tools, and why |
| [`doc/CHANGELOG.md`](doc/CHANGELOG.md) | What changed, newest first |
| [`doc/LLM feed for visual/`](doc/LLM%20feed%20for%20visual/LLMfeed_VISUAL-IDENTITY.md) | The Clamk Tools visual identity brief, which the page follows |

### Publishing safely

The repo is public, so `.githooks/check-privacy.sh` keeps a personal email, a private path on a local machine and
secrets out of every commit (identity, message and content). Turn it on once per clone:
`git config core.hooksPath .githooks`. Private terms (an OS user name, a private folder name) go one per line in
`~/.git-privacy-terms` or `.git/privacy-terms`. A line holding an invented example carries the marker `privacy-ok`.

`.github/workflows/ci.yml` runs the privacy check, lint, unit tests, build and end-to-end tests on every push and
pull request, and publishes `dist/` to GitHub Pages from `main` (Settings → Pages → Source: GitHub Actions).
