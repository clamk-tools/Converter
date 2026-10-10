import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useReducer, useState } from "react";

import { derive, initialState, reducer } from "./state/model";
import type { Section } from "./state/model";
import { entryFor, loadReport, rename, saveReport, toggleAll, toggleCollapsed } from "./state/report";
import type { ReportEntry } from "./state/report";
import { Calculator } from "./ui/Calculator";
import { ConcentrationConverter } from "./ui/ConcentrationConverter";
import { Report } from "./ui/Report";
import { DILUTION } from "./ui/sections";
import { SolutionCard } from "./ui/SolutionCard";
import { ThemeSwitch } from "./ui/ThemeSwitch";

// The page: the frame every Clamk tool has (rail, header with the name and the theme switch, footer) around the three
// calculators, stacked: mass, volume or concentration; dilution; conversion. All values live in one state (state/model.ts), so a quantity typed in
// one calculator is the same in the others, and a unit chosen for it shows everywhere. A second tab holds the report:
// the calculations added to it with the icon beside each answer.
type Tab = "calculators" | "report";

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const derived = useMemo(() => derive(state), [state]);
  const [tab, setTab] = useState<Tab>("calculators");
  const [report, setReport] = useState<ReportEntry[]>(loadReport);
  useEffect(() => saveReport(report), [report]);
  const addToReport = (section: Section) => {
    const entry = entryFor(state, derived, section, `${Date.now()}-${Math.random()}`);
    if (entry) setReport((r) => [...r, entry]);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "calculators", label: "Calculators" },
    { id: "report", label: `Report${report.length ? ` (${report.length})` : ""}` },
  ];
  // arrow keys move between the two tabs, as in any tab list
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = tab === "calculators" ? "report" : "calculators";
    setTab(next);
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
        <div className="tabs" role="tablist" aria-label="View" onKeyDown={onTabKey}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="panel"
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="panel" role="tabpanel" id="panel" aria-labelledby={`tab-${tab}`}>
          {tab === "calculators" ? (
            <>
              <SolutionCard state={state} derived={derived} dispatch={dispatch} onAdd={() => addToReport(state.find)} />
              <Calculator spec={DILUTION} state={state} derived={derived} dispatch={dispatch} onAdd={() => addToReport("dilution")} />
              <ConcentrationConverter state={state} derived={derived} dispatch={dispatch} />
            </>
          ) : (
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
