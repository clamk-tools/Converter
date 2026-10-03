// Reading what the user types in a number box.
//
// Accepted: decimals ("0.25"), a comma as the decimal mark ("0,25"), scientific notation ("1e-6", "2.5E8"), a
// leading sign, and spaces around the number. Not accepted: thousands separators ("1,000.5", "1 000", and "1,500",
// which could mean either), units
// ("5 mg"), fractions.
//
// While the user is typing, a box often holds the start of a number that is not a number yet: "-", ".", "1e",
// "1e-". Those are `partial`: the page leaves them alone (no error, no reformatting) until the user leaves the box.

export type Parsed =
  | { kind: "empty" }
  | { kind: "number"; value: number }
  | { kind: "partial" } // the start of a number: "1e-", "."
  | { kind: "invalid"; reason: string };

const COMPLETE = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)(e[+-]?\d+)?$/i;
const START = /^[+-]?(\d*([.,]\d*)?)(e[+-]?)?$/i;

export function parseNumber(raw: string): Parsed {
  const text = raw.trim().replace(/−/g, "-"); // the typographic minus, as pasted from a document
  if (text === "") return { kind: "empty" };
  if (COMPLETE.test(text)) {
    // "1,500" is 1.5 with a decimal comma but 1500 with a thousands comma: refuse to guess. "0,500" is clear.
    if (/^[+-]?[1-9]\d{0,2},\d{3}$/.test(text)) {
      return { kind: "invalid", reason: "Ambiguous: write 1.5 for a decimal, or 1500 with no thousands separator." };
    }
    const value = Number(text.replace(",", "."));
    if (!Number.isFinite(value)) return { kind: "invalid", reason: "This number is too large." };
    return { kind: "number", value };
  }
  // "1e" and "-." match START; "e5" does not (no digits before the exponent) and neither does "1.2.3"
  if (START.test(text) && !/^[+-]?[.,]?e/i.test(text)) return { kind: "partial" };
  return { kind: "invalid", reason: "Not a number. Use digits, a decimal point and, if needed, e for powers of ten (1e-6)." };
}
