# Design assessment

What was looked at before building this tool, and what was taken from it. Written 2026-10-03.

Sources, in order of authority: the visual brief (`doc/LLM feed for visual/`), then the other projects of the
`clamk-tools` organisation: the hub (`clamk-tools.github.io`, plain HTML), **Metadata-Miner** (a browser tool:
React, Vite) and **CellCounter** (Expo / React Native, also built for the web), plus `tool-template`. GraphPad's
molarity calculator was a reference for function only (the three solve-for forms and the dilution form); none of
its look or wording was used.

Metadata-Miner is the closest sibling: a form-like tool in the browser, built after the brief. Its frame, theme
tokens, theme switch and build set-up were reused as they are.

## Visual language

| | |
|---|---|
| Typography | Figtree 500/600/700 for content and UI; IBM Plex Mono 600 for labels, units and every number (tabular digits). Section labels: mono 0.7rem, uppercase, +0.1em, followed by a hairline. Headings with negative tracking |
| Colours | Cool neutrals (hue about 200°) and one blue accent (`#1f5fe0` / `#6fa0ff`) for everything interactive. Coral for errors, blue tint for the answer. Tokens in `src/styles/theme.css` |
| Backgrounds | Two levels: page `bg`, cards and inputs `surface`; pale tints for state (the answer area of each calculator) |
| Borders | 1px hairlines everywhere; the answer area has an accent hairline |
| Radius | 7px controls, 9px cards, 5px badges, pill for the switch |
| Spacing | Compact: 10px between cards, 12px from label to content, 26px between groups, 20px gutters |
| Inputs | `surface`, 1px border, 7px radius, 32–36px tall, mono numbers; hover `rail`, focus accent + ring; 16px text on touch screens |
| Selects | Same as inputs; unit names in words, as on GraphPad (millimolar) |
| Buttons | None in the calculators: GraphPad's orange "Mass =" button is an accent label, since answers follow typing |
| Cards | Flat, no shadow: one panel per calculator. Its answer label fills with the accent and its answer box turns accent-tint once there is an answer |
| Icons | 2px line icons in `currentColor` (sun, moon) |
| Navigation | Header: rail, blue dot and tool name, a quiet "← All tools" link, the theme switch. GraphPad's four calculators, rows and labels as on its page (requested 2026-10-08), no tabs |
| Responsive | "Label: [box] [unit]" rows as on GraphPad; below 560px the label goes above its box |
| Dark / light | System setting until the switch is used; the choice is stored under `clamk-tools:theme`, shared with the hub |
| Animation | 120ms colour changes, 180ms switch knob; none with reduced motion |
| Density | Dense, as the brief asks; type sizes raised to 14–16px where people read and type numbers |

No shadows anywhere.

## Technical conventions

| | |
|---|---|
| Framework | React 19 (as Metadata-Miner; CellCounter's React Native is for a phone app, not needed here) |
| Language | TypeScript, strict |
| Styling | Plain CSS files with the brief's tokens as CSS custom properties; no CSS framework |
| Components | Small function components; state in one `useReducer`; logic in plain TypeScript modules outside React |
| Build | Vite, relative base path, a Content-Security-Policy written into the built page, fonts self-hosted with `@fontsource` |
| Testing | Vitest for the logic, Playwright for the built page |
| Linting | ESLint with `typescript-eslint` and the React hooks rules |
| Formatting | As the sibling repos: 2 spaces, double quotes, long lines (no formatter is configured in the family) |
| Deployment | GitHub Actions: privacy check, lint, test, build, end-to-end, then GitHub Pages from `main` |
