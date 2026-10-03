// Showing a number. Calculations keep full double precision; only what is shown is rounded.
//
// Two precisions:
// - ENTERED (12 significant digits): a value the user typed, and its other units. Changing unit only shifts the
//   decimal point, so 12 digits keep everything the user typed while hiding float noise
//   (0.00009999999999999999 → 0.0001).
// - COMPUTED (6 significant digits): a result of an equation, where more digits would be noise
//   (mass = 0.18016000000000001 g → 0.18016).
//
// Plain notation between 1e-5 and 1e10, scientific outside it ("2.5e-7", "1e12"). Scientific is written the way the
// boxes accept it, so a shown value can be edited and typed back.

export const ENTERED = 12;
export const COMPUTED = 6;

const PLAIN_MIN = 1e-5;
const PLAIN_MAX = 1e10;

export function formatNumber(value: number, digits: number): string {
  if (!Number.isFinite(value)) return "";
  if (value === 0) return "0";
  const rounded = Number(value.toPrecision(digits)); // rounding first: 9.99999999999999e9 becomes 1e10
  const size = Math.abs(rounded);
  if (size >= PLAIN_MIN && size < PLAIN_MAX) return plain(rounded, digits);
  const [mantissa, exponent] = rounded.toExponential(digits - 1).split("e");
  return `${trimZeros(mantissa)}e${Number(exponent)}`;
}

// A plain decimal with at most `digits` significant digits, no trailing zeros, never in exponent form.
function plain(value: number, digits: number): string {
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const decimals = Math.min(100, Math.max(0, digits - 1 - magnitude));
  return trimZeros(value.toFixed(decimals));
}

function trimZeros(text: string): string {
  return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
}
