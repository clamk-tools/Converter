import { useMemo, useReducer } from "react";

import { derive, initialState, reducer } from "./state/model";
import { Calculator } from "./ui/Calculator";
import { CALCULATORS } from "./ui/sections";
import { ThemeSwitch } from "./ui/ThemeSwitch";

// The page: the frame every Clamk tool has (rail, header with the name and the theme switch, footer) around the four
// calculators, stacked as on GraphPad's page. All values live in one state (state/model.ts), so a quantity typed in
// one calculator is the same in the others, and a unit chosen for it shows everywhere.
export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const derived = useMemo(() => derive(state), [state]);

  return (
    <div className="frame">
      <div className="rail" />
      <header className="wrap top">
        <h1 className="brand">
          <a href="./">Molarity Calculator</a>
        </h1>
        <div className="top-actions">
          <a className="quiet" href="https://clamk-tools.github.io/">
            ← All tools
          </a>
          <ThemeSwitch />
        </div>
      </header>

      <main className="wrap page">
        {CALCULATORS.map((spec) => (
          <Calculator key={spec.id} spec={spec} state={state} derived={derived} dispatch={dispatch} />
        ))}
      </main>

      <footer className="wrap foot">
        <p>
          One of the{" "}
          <a className="quiet" href="https://clamk-tools.github.io/">
            Clamk Tools
          </a>{" "}
          ·{" "}
          <a className="quiet" href="https://github.com/clamk-tools/Converter">
            Source
          </a>
        </p>
      </footer>
    </div>
  );
}
