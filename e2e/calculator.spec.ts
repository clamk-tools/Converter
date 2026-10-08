import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// The built page, used as a person would: typing in boxes, choosing units, reading the four calculators.
// Every box has an accessible name "<label> in <unit>"; each calculator is a section marked data-calculator.

const calc = (page: Page, id: "mass" | "volume" | "concentration" | "dilution") => page.locator(`[data-calculator="${id}"]`);
const box = (page: Page, id: Parameters<typeof calc>[1], name: string) => calc(page, id).getByLabel(name, { exact: true });

// Errors and requests to another host, per page, checked after each test.
const problems = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  problems.set(page, errors);
  page.on("pageerror", (e) => errors.push(e.message));
  // nothing may leave the site: no CDN, no analytics
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost:4174/")) errors.push(`request to ${r.url()}`);
  });
  await page.goto("./");
});

test.afterEach(async ({ page }) => {
  expect(problems.get(page)).toEqual([]);
});

const glucose = async (page: Page) => {
  await box(page, "mass", "Formula weight in g/mol").fill("180.16");
  await box(page, "mass", "Desired final volume in mL").fill("10");
  await box(page, "mass", "Desired concentration in mM").fill("100");
};

test("the four calculators are on the page, in GraphPad's order", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "Mass from volume and concentration",
    "Volume from mass and concentration",
    "Molarity from mass and volume",
    "Dilute a stock solution",
  ]);
});

test("the sanity check: 180.16 g/mol, 10 mL, 100 mM give 180.16 mg, in every unit, and follow each change", async ({ page }) => {
  await glucose(page);
  await expect(box(page, "mass", "Mass to weigh in mg")).toHaveValue("180.16");
  await expect(calc(page, "mass").getByText("= 0.18016 g · 180160 µg · 180160000 ng")).toBeVisible();
  await expect(box(page, "mass", "Amount in mmol")).toHaveValue("1");
  await expect(calc(page, "mass").getByRole("status")).toHaveText("Weigh 180.16 mg and make up to 10 mL to get 100 mM.");

  await box(page, "mass", "Desired concentration in mM").fill("200");
  await expect(box(page, "mass", "Mass to weigh in mg")).toHaveValue("360.32");
  await expect(box(page, "mass", "Mass to weigh in mg")).toHaveAttribute("readonly", "");
});

test("a value typed in one calculator is the same value in the others", async ({ page }) => {
  await glucose(page);
  await expect(box(page, "volume", "Formula weight in g/mol")).toHaveValue("180.16");
  await expect(box(page, "concentration", "Volume in mL")).toHaveValue("10");
  await expect(box(page, "volume", "Desired concentration in mM")).toHaveValue("100");

  await box(page, "volume", "Mass in mg").fill("90.08");
  await expect(box(page, "volume", "Final volume in mL")).toHaveValue("5");
  await expect(box(page, "concentration", "Mass in mg")).toHaveValue("90.08");
  await expect(box(page, "concentration", "Concentration in mM")).toHaveValue("50");
});

test("a unit chosen anywhere applies wherever the quantity appears, and keeps the value", async ({ page }) => {
  await glucose(page);
  await calc(page, "volume").getByLabel("Desired concentration: unit").selectOption("M");
  await expect(box(page, "mass", "Desired concentration in M")).toHaveValue("0.1");
  await expect(box(page, "volume", "Desired concentration in M")).toHaveValue("0.1");

  await calc(page, "mass").getByLabel("Desired final volume: unit").selectOption("uL");
  await expect(box(page, "concentration", "Volume in µL")).toHaveValue("10000");

  await calc(page, "mass").getByLabel("Mass to weigh: unit").selectOption("g");
  await expect(box(page, "mass", "Mass to weigh in g")).toHaveValue("0.18016");
  await expect(calc(page, "volume").getByLabel("Mass: unit")).toHaveValue("g");
});

test("typing is not fought: an incomplete number stays as typed, and is flagged only on leaving", async ({ page }) => {
  const input = box(page, "mass", "Desired final volume in mL");
  await input.pressSequentially("1e-");
  await expect(input).toHaveValue("1e-");
  await expect(calc(page, "mass").getByText("This number is not complete.", { exact: true })).toHaveCount(0);
  await input.pressSequentially("3");
  await expect(box(page, "concentration", "Volume in mL")).toHaveValue("0.001");
  await input.fill("2.");
  await expect(input).toHaveValue("2.");
  await input.fill("1e-");
  await input.blur();
  await expect(calc(page, "mass").getByText("This number is not complete.", { exact: true })).toBeVisible();
});

test("scientific notation and a decimal comma are read", async ({ page }) => {
  await calc(page, "mass").getByLabel("Desired concentration: unit").selectOption("M");
  await box(page, "mass", "Desired concentration in M").fill("2.5e-7");
  await calc(page, "mass").getByLabel("Desired concentration: unit").selectOption("nM");
  await expect(box(page, "mass", "Desired concentration in nM")).toHaveValue("250");
  await box(page, "mass", "Desired final volume in mL").fill("0,5");
  await calc(page, "mass").getByLabel("Desired final volume: unit").selectOption("uL");
  await expect(box(page, "mass", "Desired final volume in µL")).toHaveValue("500");
});

test("invalid values are explained at the box, in each calculator", async ({ page }) => {
  await box(page, "mass", "Formula weight in g/mol").fill("-5");
  await expect(calc(page, "mass").getByText("Formula weight cannot be negative.").first()).toBeVisible();
  await expect(calc(page, "concentration").getByText("Formula weight cannot be negative.").first()).toBeVisible();
  await box(page, "mass", "Desired final volume in mL").fill("abc");
  await expect(box(page, "mass", "Desired final volume in mL")).toHaveAttribute("aria-invalid", "true");
});

test("the dilution sanity check: 1 M to 10 mM in 100 mL takes 1 mL of stock", async ({ page }) => {
  await calc(page, "dilution").getByLabel("Stock concentration: unit").selectOption("M");
  await box(page, "dilution", "Stock concentration in M").fill("1");
  await calc(page, "dilution").getByLabel("Desired concentration: unit").selectOption("mM");
  await box(page, "dilution", "Desired concentration in mM").fill("10");
  await box(page, "dilution", "Desired final volume in mL").fill("100");
  await expect(box(page, "dilution", "Volume of stock in µL")).toHaveValue("1000");
  await expect(calc(page, "dilution").getByText("= 0.001 L · 1 mL · 1000000 nL")).toBeVisible();
  await expect(box(page, "dilution", "Volume of diluent in mL")).toHaveValue("99");
  await expect(calc(page, "dilution").getByText(/100-fold dilution/)).toBeVisible();
});

test("a target above the stock is refused, with the reason", async ({ page }) => {
  await box(page, "dilution", "Stock concentration in mM").fill("10");
  await calc(page, "dilution").getByLabel("Desired concentration: unit").selectOption("mM");
  await box(page, "dilution", "Desired concentration in mM").fill("100");
  await box(page, "dilution", "Desired final volume in mL").fill("10");
  await expect(calc(page, "dilution").getByText(/more concentrated than the stock/).first()).toBeVisible();
  await expect(box(page, "dilution", "Volume of stock in µL")).toHaveValue("");
});

test("Clear all empties every box", async ({ page }) => {
  await glucose(page);
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(box(page, "mass", "Formula weight in g/mol")).toHaveValue("");
  await expect(box(page, "mass", "Mass to weigh in mg")).toHaveValue("");
});

test("Copy puts the answer on the clipboard", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are a Chromium feature in Playwright");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await glucose(page);
  await calc(page, "mass").getByRole("button", { name: /Copy mass to weigh/ }).click();
  await expect(calc(page, "mass").getByText("Copied")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("180.16 mg");
});

test("the theme switch is shared with the hub through its storage key", async ({ page }) => {
  const toggle = page.getByRole("switch", { name: "Dark theme" });
  const before = await toggle.getAttribute("aria-checked");
  await toggle.click();
  const theme = await page.evaluate(() => localStorage.getItem("clamk-tools:theme"));
  expect(theme).toBe(before === "true" ? "light" : "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme!);
});
