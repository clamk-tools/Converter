import type { Dispatch } from "react";

import type { Action, Derived, State } from "../state/model";
import { DILUTION_FIELDS, firstProblem } from "../state/model";
import { QuantityCard } from "./QuantityCard";
import { ResultBar } from "./ResultBar";
import { dilutionSummary, missingText } from "./summary";

// Dilute a stock: C1 × V1 = C2 × V2. The stock and target can be molar or mass concentrations; mixing the two needs
// the molecular weight, which is the one shared with the other tab.
export function DilutionPanel({ state, derived, dispatch }: { state: State; derived: Derived; dispatch: Dispatch<Action> }) {
  const card = { state, derived, dispatch };
  return (
    <div className="panel">
      <div className="section-label">
        <span className="cap">You have, you want</span>
        <span className="rule" />
        <button type="button" className="quiet compact" onClick={() => dispatch({ type: "clear", tab: "dilution" })}>
          Clear
        </button>
      </div>
      <div className="qgrid">
        <QuantityCard quantity="stock" title="Stock concentration" symbol="C₁" {...card} />
        <QuantityCard quantity="target" title="Target concentration" symbol="C₂" {...card} />
        <QuantityCard quantity="finalVolume" title="Final volume" symbol="V₂" {...card} />
        <QuantityCard
          quantity="molarMass"
          title="Molecular weight"
          symbol="MW"
          hint="Optional: only to mix molar and mass concentrations (mM stock, µg/mL target)."
          {...card}
        />
      </div>

      <div className="section-label">
        <span className="cap">Result</span>
        <span className="rule" />
      </div>
      <div className="qgrid">
        <QuantityCard quantity="stockVolume" title="Stock to take" symbol="V₁" {...card} />
        <QuantityCard quantity="diluentVolume" title="Diluent to add" symbol="V₂ − V₁" {...card} />
      </div>
      <ResultBar
        summary={dilutionSummary(state, derived)}
        missing={missingText(derived.dilution.missing)}
        problem={firstProblem(derived, DILUTION_FIELDS)}
        note={derived.dilution.note}
        formula="V₁ = C₂ × V₂ / C₁"
        copyLabel="Copy the stock volume"
      />
    </div>
  );
}
