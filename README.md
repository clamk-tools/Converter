# Molarity Calculator

Mass, concentration, volume and dilution for the bench, with every unit kept in step.

**Open it:** https://clamk-tools.github.io/Converter/

The tool is one of the [Clamk Tools](https://clamk-tools.github.io/). It runs entirely in the browser: nothing is
installed and nothing is sent anywhere.

## Using it

Two tabs. Values typed in one are still there in the other, and the molecular weight is shared.

**Make a solution.** Choose what to solve for (mass, concentration or volume), then fill in the other three. The
answer follows at every keystroke; there is no Calculate button.

> 180.16 g/mol, 100 mM, 10 mL → *Weigh 180.16 mg and make up to 10 mL to get 100 mM.*

**Dilute a stock.** Give the stock concentration, the target concentration and the final volume. It gives the
volume of stock to take and of diluent to add (C₁ × V₁ = C₂ × V₂).

> 1 M stock, 10 mM target, 100 mL → *Add 1 mL of stock to 99 mL of diluent (100 mL in total): a 100-fold dilution.*

### One quantity, many boxes

Each card is one physical quantity. Its main box has a unit menu, and below it the same quantity is shown in every
unit. All the boxes are the same value: type 100 in µM and the M, mM, nM and pM boxes show 0.0001, 0.1, 100000 and
100000000. You can type in any of them. Changing the unit menu changes how the value is shown, never the value
itself (100 µM switched to mM shows 0.1).

- Concentration: M, mM, µM, nM, pM, and as a mass concentration mg/mL, µg/mL, ng/mL (needs the molecular weight).
- Volume: L, mL, µL, nL. Mass: g, mg, µg, ng. Amount: mol to pmol. Molecular weight: g/mol or kDa.
- The answer card has a blue background and a **Result** tag; its boxes can be selected but not typed in.
- **Copy** puts the answer on the clipboard as text, e.g. `180.16 mg`.

### Typing numbers

`0.25`, `0,25` (decimal comma), `1e-6`, `2.5E8` and a leading minus are read. A number being typed (`1e-`, `0.`)
is left alone until you leave the box. `1,500` is refused as ambiguous (1.5 or 1500?), as are thousands separators.
Results are shown to 6 significant digits; typed values keep their digits (up to 12). Very small or very large
values are shown in the `e` notation the boxes accept, e.g. `2.5e-7`.

### What it refuses, and why

A zero or negative molecular weight or volume, a negative mass or concentration, a zero that would divide by zero
(solving for a volume with a concentration of 0), a zero stock, and a target concentration above the stock: a
dilution can only lower a concentration. Each problem is explained under its box and in the result bar. A molar
stock and a mass-concentration target (or the other way) can only be compared with the molecular weight.

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
