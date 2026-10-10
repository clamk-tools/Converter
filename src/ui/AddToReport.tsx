import { useEffect, useState } from "react";

interface Props {
  /** what is added, in words: "mass" gives "Add mass to report" */
  what: string;
  disabled: boolean;
  onAdd: () => void;
}

// The icon beside an answer that puts the calculation in the report. It turns into a tick for a moment once pressed.
export function AddToReport({ what, disabled, onAdd }: Props) {
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(timer);
  }, [added]);

  return (
    <button
      type="button"
      className={`icon add-report${added ? " added" : ""}`}
      aria-label={added ? "Added to report" : `Add ${what} to report`}
      title={added ? "Added to report" : "Add to report"}
      disabled={disabled}
      onClick={() => {
        onAdd();
        setAdded(true);
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {added ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M12 11v6M9 14h6" />
          </>
        )}
      </svg>
    </button>
  );
}
