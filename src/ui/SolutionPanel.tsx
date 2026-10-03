import type { Dispatch } from "react";

import type { Action, Derived, SolveFor, State } from "../state/model";
import { SOLUTION_FIELDS, firstProblem } from "../state/model";
import { QuantityCard } from "./QuantityCard";
import { ResultBar } from "./ResultBar";
import { missingText, solutionSummary } from "./summary";

const TARGETS: { value: SolveFor; label: string }[] = [
  { value: "mass", label: "Mass" },
  { value: "concentration", label: "Concentration" },
  { value: "volume", label: "Volume" },
];

const FORMULAS: Record<SolveFor, string> = {
  mass: "m = C × V × MW",
  concentration: "C = m / (MW × V)",
  volume: "V = m / (C × MW)",
};

// Make a solution: pick the quantity to solve for; the other three are typed, the fourth follows at each keystroke.
export function SolutionPanel({ state, derived, dispatch }: { state: State; derived: Derived; dispatch: Dispatch<Action> }) {
  const card = { state, derived, dispatch };
  return (
    <div className="panel">
      <div className="section-label">
        <span className="cap" id="solve-for">
          Solve for
        </span>
        <span className="rule" />
        <button type="button" className="quiet compact" onClick={() => dispatch({ type: "clear", tab: "solution" })}>
          Clear
        </button>
      </div>
      <div className="segmented" role="radiogroup" aria-labelledby="solve-for">
        {TARGETS.map((t) => (
          <label key={t.value} className={state.solveFor === t.value ? "on" : undefined}>
            <input type="radio" name="solve-for" value={t.value} checked={state.solveFor === t.value} onChange={() => dispatch({ type: "solveFor", target: t.value })} />
            {t.label}
          </label>
        ))}
      </div>

      <div className="section-label">
        <span className="cap">Quantities</span>
        <span className="rule" />
      </div>
      <div className="qgrid">
        <QuantityCard quantity="molarMass" title="Molecular weight" symbol="MW" hint="Formula weight from the label, including any water of hydration." {...card} />
        <QuantityCard quantity="concentration" title="Concentration" symbol="C" {...card} />
        <QuantityCard quantity="volume" title="Volume" symbol="V" hint="The final volume of solution." {...card} />
        <QuantityCard quantity="mass" title="Mass" symbol="m" {...card} />
        <QuantityCard quantity="moles" title="Amount of substance" symbol="n" hint="n = m / MW" {...card} />
      </div>

      <div className="section-label">
        <span className="cap">Result</span>
        <span className="rule" />
      </div>
      <ResultBar summary={solutionSummary(state, derived)} missing={missingText(derived.solution.missing)}
        problem={firstProblem(derived, SOLUTION_FIELDS)} formula={FORMULAS[state.solveFor]} copyLabel="Copy the result" />
    </div>
  );
}
