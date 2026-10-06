import type { KeyboardEvent } from "react";
import { useMemo, useReducer } from "react";

import { derive, initialState, reducer } from "./state/model";
import type { Tab } from "./state/model";
import { DilutionPanel } from "./ui/DilutionPanel";
import { SolutionPanel } from "./ui/SolutionPanel";
import { ThemeSwitch } from "./ui/ThemeSwitch";

const TABS: { id: Tab; label: string }[] = [
  { id: "solution", label: "Make a solution" },
  { id: "dilution", label: "Dilute a stock" },
];

// The page: the frame every Clamk tool has (rail, header with the name and the theme switch, footer) around two tabs.
// All values live in one state (state/model.ts); the tabs only choose which calculator is shown, so values typed in
// one are still there on coming back, and the molecular weight is shared.
export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const derived = useMemo(() => derive(state), [state]);

  // arrow keys move between tabs, as in any tab list
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = TABS[(TABS.findIndex((t) => t.id === state.tab) + 1) % TABS.length].id;
    dispatch({ type: "tab", tab: next });
    document.getElementById(`tab-${next}`)?.focus();
  };

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
        <div className="tabs" role="tablist" aria-label="Calculator" onKeyDown={onTabKey}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={state.tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={state.tab === t.id ? 0 : -1}
              onClick={() => dispatch({ type: "tab", tab: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${state.tab}`} aria-labelledby={`tab-${state.tab}`}>
          {state.tab === "solution" ? <SolutionPanel state={state} derived={derived} dispatch={dispatch} /> : <DilutionPanel state={state} derived={derived} dispatch={dispatch} />}
        </div>
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
          </a>{" "}
          · Runs in your browser, nothing is sent.
        </p>
      </footer>
    </div>
  );
}
