import { useEffect, useMemo, useReducer, useState } from "react";

import { DILUTION_RESULT_OF, RESULT_OF, derive, initialState, reducer } from "./state/model";
import type { Section } from "./state/model";
import { entryFor, loadReport, rename, saveReport, toggleAll, toggleCollapsed } from "./state/report";
import type { ReportEntry } from "./state/report";
import { ConcentrationConverter } from "./ui/ConcentrationConverter";
import { Report } from "./ui/Report";
import { DILUTED_BY, SOLVED_BY } from "./ui/formulas";
import { DILUTION, SOLUTION } from "./ui/sections";
import { TileCard } from "./ui/TileCard";
import { dilutionWorked, solutionWorked } from "./ui/worked";
import { ThemeSwitch } from "./ui/ThemeSwitch";
import { ViewNav } from "./ui/ViewNav";
import type { View } from "./ui/ViewNav";

// The page: the frame every Clamk tool has (rail, header with the name and the theme switch, footer) around four
// views, one at a time: the three calculators (solution, dilution, conversion) and the report, chosen in a bar at the
// bottom of a phone or a rail on the left of a laptop (ui/ViewNav.tsx). All values live in one state
// (state/model.ts), kept while moving between views: the molecular weight typed in one calculator is the same in the
// others, and a unit chosen for a quantity shows everywhere. The report holds the calculations added to it with the
// icon beside each answer.

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const derived = useMemo(() => derive(state), [state]);
  const [view, setView] = useState<View>("solution");
  const [report, setReport] = useState<ReportEntry[]>(loadReport);
  useEffect(() => saveReport(report), [report]);
  const addToReport = (section: Section) => {
    const entry = entryFor(state, derived, section, `${Date.now()}-${Math.random()}`);
    if (entry) setReport((r) => [...r, entry]);
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
        <ViewNav view={view} onView={setView} reportCount={report.length} />
        <div className="panel" role="tabpanel" id="panel" aria-labelledby={`tab-${view}`}>
          {view === "solution" && (
            <TileCard
              spec={SOLUTION}
              find={state.find}
              result={RESULT_OF[state.find]}
              formula={SOLVED_BY[state.find]}
              problem={derived.solutions[state.find].outOfRange}
              worked={solutionWorked(state, derived)}
              reportWhat={state.find}
              state={state}
              derived={derived}
              dispatch={dispatch}
              onAdd={() => addToReport(state.find)}
            />
          )}
          {view === "dilution" && (
            <TileCard
              spec={DILUTION}
              find={state.dilutionFind}
              result={DILUTION_RESULT_OF[state.dilutionFind]}
              formula={DILUTED_BY[state.dilutionFind]}
              note={derived.dilution.note}
              problem={derived.dilution.outOfRange}
              worked={dilutionWorked(state, derived)}
              reportWhat="the dilution"
              state={state}
              derived={derived}
              dispatch={dispatch}
              onAdd={() => addToReport("dilution")}
            />
          )}
          {view === "convert" && <ConcentrationConverter state={state} derived={derived} dispatch={dispatch} />}
          {view === "report" && (
            <Report
              entries={report}
              onRename={(id, name) => setReport((r) => rename(r, id, name))}
              onToggle={(id) => setReport((r) => toggleCollapsed(r, id))}
              onToggleAll={() => setReport(toggleAll)}
              onRemove={(id) => setReport((r) => r.filter((e) => e.id !== id))}
              onClear={() => setReport([])}
            />
          )}
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
          </a>
        </p>
      </footer>
    </div>
  );
}
