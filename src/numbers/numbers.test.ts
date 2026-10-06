import { describe, expect, it } from "vitest";

import { COMPUTED, ENTERED, formatNumber } from "./format";
import { parseNumber } from "./parse";

const value = (text: string) => {
  const parsed = parseNumber(text);
  return parsed.kind === "number" ? parsed.value : parsed.kind;
};

describe("parseNumber", () => {
  it("reads decimals, scientific notation and a decimal comma", () => {
    expect(value("100")).toBe(100);
    expect(value("0.25")).toBe(0.25);
    expect(value(".5")).toBe(0.5);
    expect(value("5.")).toBe(5);
    expect(value("0,25")).toBe(0.25);
    expect(value("1e-6")).toBe(1e-6);
    expect(value("2.5e8")).toBe(2.5e8);
    expect(value("2.5E+8")).toBe(2.5e8);
    expect(value("  42 ")).toBe(42);
    expect(value("-3")).toBe(-3);
    expect(value("−3")).toBe(-3); // typographic minus
  });

  it("reads very small and very large values", () => {
    expect(value("1e-300")).toBe(1e-300);
    expect(value("6.022e23")).toBe(6.022e23);
  });

  it("lets the start of a number be typed", () => {
    for (const text of ["-", "+", ".", ",", "0.", "1e", "1e-", "1E+", "-.", "2.5e"]) {
      const kind = parseNumber(text).kind;
      expect(kind === "partial" || kind === "number", text).toBe(true);
    }
    expect(parseNumber("1e-").kind).toBe("partial");
    expect(parseNumber("").kind).toBe("empty");
    expect(parseNumber("   ").kind).toBe("empty");
  });

  it("refuses what is not a number", () => {
    for (const text of ["abc", "5 mg", "1.2.3", "e5", "1e5e3", "1 000", "1,000.5", "--1", "1/2", "0x10", "Infinity", "NaN"]) {
      expect(parseNumber(text).kind, text).toBe("invalid");
    }
  });

  it("refuses an ambiguous comma and an overflow", () => {
    expect(parseNumber("1,500").kind).toBe("invalid");
    expect(value("0,500")).toBe(0.5);
    expect(value("1,5")).toBe(1.5);
    expect(parseNumber("1e400").kind).toBe("invalid");
  });
});

describe("formatNumber", () => {
  it("hides float noise", () => {
    expect(formatNumber(0.1 + 0.2, ENTERED)).toBe("0.3");
    expect(formatNumber(0.0009999999999998, COMPUTED)).toBe("0.001");
    expect(formatNumber(0.00009999999999999999, ENTERED)).toBe("0.0001");
    expect(formatNumber(0.1 * 0.01 * 180.16, COMPUTED)).toBe("0.18016");
  });

  it("keeps the digits typed at the entered precision", () => {
    expect(formatNumber(1.2345678, ENTERED)).toBe("1.2345678");
    expect(formatNumber(1234.5678, ENTERED)).toBe("1234.5678");
    expect(formatNumber(1 / 3, COMPUTED)).toBe("0.333333");
  });

  it("writes plain numbers in the middle range and scientific notation outside it", () => {
    expect(formatNumber(100000000, ENTERED)).toBe("100000000");
    expect(formatNumber(0.00001, ENTERED)).toBe("0.00001");
    expect(formatNumber(1e-6, ENTERED)).toBe("1e-6");
    expect(formatNumber(2.5e-7, ENTERED)).toBe("2.5e-7");
    expect(formatNumber(1e12, ENTERED)).toBe("1e12");
    expect(formatNumber(6.02214076e23, COMPUTED)).toBe("6.02214e23");
    expect(formatNumber(-0.002, ENTERED)).toBe("-0.002");
    expect(formatNumber(0, ENTERED)).toBe("0");
  });

  it("rounds before it chooses the notation", () => {
    expect(formatNumber(9999999.9999, 4)).toBe("10000000");
    expect(formatNumber(9.9999999e9, 4)).toBe("1e10");
  });

  it("writes what it shows in a form the boxes read back", () => {
    for (const n of [1e-6, 2.5e-7, 1e12, 0.18016, 123456.789]) {
      const shown = formatNumber(n, ENTERED);
      expect(value(shown)).toBe(n);
    }
  });

  it("shows nothing for a value that is not finite", () => {
    expect(formatNumber(Infinity, ENTERED)).toBe("");
    expect(formatNumber(NaN, ENTERED)).toBe("");
  });
});
