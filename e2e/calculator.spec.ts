import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// The built page, used as a person would: typing in boxes, choosing units, switching tabs.
// Every box has an accessible name "<quantity> in <unit>"; the main box comes first, then the same unit in the list.

const box = (page: Page, name: string, index = 0) => page.getByLabel(name, { exact: true }).nth(index);
const LIST = 1; // the box in the "all units" list, when the main box shows the same unit

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

test("100 µM typed in one box fills every concentration box", async ({ page }) => {
  await box(page, "Concentration in µM").fill("100");
  await expect(box(page, "Concentration in M")).toHaveValue("0.0001");
  await expect(box(page, "Concentration in mM")).toHaveValue("0.1"); // the main box (mM by default)
  await expect(box(page, "Concentration in mM", LIST)).toHaveValue("0.1");
  await expect(box(page, "Concentration in nM")).toHaveValue("100000");
  await expect(box(page, "Concentration in pM")).toHaveValue("100000000");

  await box(page, "Concentration in mM", LIST).fill("0.25");
  await expect(box(page, "Concentration in µM")).toHaveValue("250");
  await expect(box(page, "Concentration in M")).toHaveValue("0.00025");
});

test("changing the unit keeps the quantity", async ({ page }) => {
  await box(page, "Volume in mL").fill("1");
  await page.getByLabel("Volume: unit").selectOption("uL");
  await expect(box(page, "Volume in µL")).toHaveValue("1000");
  await expect(box(page, "Volume in L")).toHaveValue("0.001");
});

test("the sanity check: 180.16 g/mol, 10 mL, 100 mM give 180.16 mg, and follow each change", async ({ page }) => {
  await box(page, "Molecular weight in g/mol").fill("180.16");
  await box(page, "Volume in mL").fill("10");
  await box(page, "Concentration in mM").fill("100");
  await expect(box(page, "Mass in mg")).toHaveValue("180.16");
  await expect(box(page, "Mass in g")).toHaveValue("0.18016");
  await expect(box(page, "Mass in µg")).toHaveValue("180160");
  await expect(box(page, "Amount of substance in mmol")).toHaveValue("1");
  await expect(page.getByRole("status").filter({ hasText: "Weigh" })).toHaveText("Weigh 180.16 mg and make up to 10 mL to get 100 mM.");

  await box(page, "Concentration in mM").fill("200");
  await expect(box(page, "Mass in mg")).toHaveValue("360.32");
  await expect(box(page, "Mass in mg")).toHaveAttribute("readonly", "");
});

test("solving for another quantity keeps the numbers on screen", async ({ page }) => {
  await box(page, "Molecular weight in g/mol").fill("180.16");
  await box(page, "Volume in mL").fill("10");
  await box(page, "Concentration in mM").fill("100");
  await page.getByRole("radio", { name: "Concentration" }).check();
  await expect(box(page, "Mass in mg")).toHaveValue("180.16");
  await expect(box(page, "Concentration in mM")).toHaveValue("100");
  await box(page, "Mass in mg").fill("90.08");
  await expect(box(page, "Concentration in mM")).toHaveValue("50");
});

test("typing is not fought: an incomplete number stays as typed, and is flagged only on leaving", async ({ page }) => {
  const input = box(page, "Volume in mL");
  await input.pressSequentially("1e-");
  await expect(input).toHaveValue("1e-");
  await expect(page.getByText("This number is not complete.", { exact: true })).toHaveCount(0);
  await input.pressSequentially("3");
  await expect(box(page, "Volume in µL")).toHaveValue("1");
  await input.fill("2.");
  await expect(input).toHaveValue("2.");
  await input.fill("1e-");
  await input.blur();
  await expect(page.getByText("This number is not complete.", { exact: true })).toBeVisible();
});

test("scientific notation and a decimal comma are read", async ({ page }) => {
  await box(page, "Concentration in M").fill("2.5e-7");
  await expect(box(page, "Concentration in nM")).toHaveValue("250");
  await box(page, "Volume in mL").fill("0,5");
  await expect(box(page, "Volume in µL")).toHaveValue("500");
});

test("invalid values are explained at the box", async ({ page }) => {
  await box(page, "Molecular weight in g/mol").fill("-5");
  await expect(page.getByText("Molecular weight cannot be negative.").first()).toBeVisible();
  await box(page, "Volume in mL").fill("abc");
  await expect(page.getByText(/^Not a number/)).toBeVisible();
  await expect(box(page, "Volume in mL")).toHaveAttribute("aria-invalid", "true");
});

test("the dilution sanity check: 1 M to 10 mM in 100 mL takes 1 mL of stock", async ({ page }) => {
  await page.getByRole("tab", { name: "Dilute a stock" }).click();
  await page.getByLabel("Stock concentration: unit").selectOption("M");
  await box(page, "Stock concentration in M").fill("1");
  await page.getByLabel("Target concentration: unit").selectOption("mM");
  await box(page, "Target concentration in mM").fill("10");
  await box(page, "Final volume in mL").fill("100");
  await expect(box(page, "Stock to take in mL")).toHaveValue("1");
  await expect(box(page, "Stock to take in µL")).toHaveValue("1000"); // the main box (µL by default)
  await expect(box(page, "Diluent to add in mL")).toHaveValue("99");
  await expect(page.getByText(/100-fold dilution/)).toBeVisible();
});

test("a target above the stock is refused, with the reason", async ({ page }) => {
  await page.getByRole("tab", { name: "Dilute a stock" }).click();
  await box(page, "Stock concentration in mM").fill("10");
  await page.getByLabel("Target concentration: unit").selectOption("mM");
  await box(page, "Target concentration in mM").fill("100");
  await box(page, "Final volume in mL").fill("10");
  await expect(page.getByText(/more concentrated than the stock/).first()).toBeVisible();
  await expect(box(page, "Stock to take in µL")).toHaveValue("");
});

test("values and the molecular weight survive a tab switch", async ({ page }) => {
  await box(page, "Molecular weight in kDa").fill("66.5");
  await page.getByRole("tab", { name: "Dilute a stock" }).click();
  await expect(box(page, "Molecular weight in g/mol")).toHaveValue("66500");
  await page.getByRole("tab", { name: "Make a solution" }).click();
  await expect(box(page, "Molecular weight in kDa")).toHaveValue("66.5");
});

test("works from the keyboard: tabs with the arrow keys, solve-for with the arrow keys", async ({ page }) => {
  await page.getByRole("tab", { name: "Make a solution" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Dilute a stock" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Dilute a stock" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await page.getByRole("radio", { name: "Mass" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Concentration" })).toBeChecked();
});

test("Copy puts the answer on the clipboard", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are a Chromium feature in Playwright");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await box(page, "Molecular weight in g/mol").fill("180.16");
  await box(page, "Volume in mL").fill("10");
  await box(page, "Concentration in mM").fill("100");
  await page.getByRole("button", { name: /Copy the result/ }).click();
  await expect(page.getByText("Copied")).toBeVisible();
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
