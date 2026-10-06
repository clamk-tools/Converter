import { useEffect, useState } from "react";

import { copyText } from "./clipboard";

// Copies the result ("180.16 mg"). Says "Copied" for a moment, or "Select and copy" when the browser refuses.
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState<"copied" | "refused" | null>(null);
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(null), 1600);
    return () => clearTimeout(timer);
  }, [done]);
  return (
    <button type="button" className="with-icon copy" aria-label={`${label}: ${text}`} onClick={() => copyText(text).then((ok) => setDone(ok ? "copied" : "refused"))}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {done === "copied" ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
          </>
        )}
      </svg>
      <span aria-live="polite">{done === "copied" ? "Copied" : done === "refused" ? "Select and copy" : `Copy ${text}`}</span>
    </button>
  );
}
