import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// The built page, used as a person would: typing in boxes, choosing units, reading the four calculators.
// Each calculator is a section marked data-calculator; a box is named "<label> in <unit name>" ("Molecular weight (g/mol or Da)"
// has no unit menu); an answer is an <output> named after its label.

type Id = "mass" | "volume" | "concentration" | "dilution" | "conversion";
const calc = (page: Page, id: Id) => page.locator(`[data-calculator="${id}"]`);
const box = (page: Page, id: Id, name: string) => calc(page, id).getByLabel(name, { exact: true });
const answer = (page: Page, id: Id) => calc(page, id).locator("output");
const unitMenu = (page: Page, id: Id, label: string) => calc(page, id).getByLabel(`${label}: unit`);

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
  await box(page, "mass", "Concentration in millimolar").fill("100");
  await box(page, "mass", "Molecular weight (g/mol or Da)").fill("180.16");
  await box(page, "mass", "Volume in milliliter").fill("10");
};

test("GraphPad's four calculators, with their rows in GraphPad's order", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "1. Mass from volume & concentration",
    "2. Volume from mass & concentration",
    "3. Molarity from mass & volume",
    "4. Dilute a stock solution",
    "5. Convert between mass & molar concentration",
  ]);
  await expect(calc(page, "mass").locator(".row-label")).toHaveText(["Concentration:", "Molecular weight (g/mol or Da):", "Volume:"]);
  await expect(calc(page, "volume").locator(".row-label")).toHaveText(["Mass:", "Molecular weight (g/mol or Da):", "Concentration:"]);
  await expect(calc(page, "concentration").locator(".row-label")).toHaveText(["Mass:", "Molecular weight (g/mol or Da):", "Volume:"]);
  await expect(calc(page, "dilution").locator(".row-label")).toHaveText(["Stock concentration:", "Desired concentration:", "Desired volume:"]);
  await expect(page.locator(".result-label")).toHaveText(["Mass =", "Volume =", "Molarity =", "Required volume ="]);
});

test("the sanity check: 100 mM, 180.16 g/mol, 10 mL give 180.16 mg, and follow each change", async ({ page }) => {
  await glucose(page);
  await expect(answer(page, "mass")).toHaveText("180.16 mg");
  await box(page, "mass", "Concentration in millimolar").fill("200");
  await expect(answer(page, "mass")).toHaveText("360.32 mg");
});

test("boxes of the same kind are linked across calculators", async ({ page }) => {
  await glucose(page);
  await expect(box(page, "volume", "Molecular weight (g/mol or Da)")).toHaveValue("180.16");
  await expect(box(page, "concentration", "Molecular weight (g/mol or Da)")).toHaveValue("180.16");
  await expect(box(page, "volume", "Concentration in millimolar")).toHaveValue("100");
  await expect(box(page, "concentration", "Volume in milliliter")).toHaveValue("10");

  await box(page, "volume", "Mass in milligrams").fill("90.08");
  await expect(box(page, "concentration", "Mass in milligrams")).toHaveValue("90.08");
  await expect(answer(page, "volume")).toHaveText("5 mL");
  await expect(answer(page, "concentration")).toHaveText("50 mM");
});

test("a unit chosen anywhere applies wherever the quantity appears, answers included, and keeps the value", async ({ page }) => {
  await glucose(page);
  await box(page, "volume", "Mass in milligrams").fill("90.08");

  await unitMenu(page, "volume", "Concentration").selectOption("M");
  await expect(box(page, "mass", "Concentration in molar")).toHaveValue("0.1");
  await expect(answer(page, "concentration")).toHaveText("0.05 M");

  await unitMenu(page, "mass", "Volume").selectOption("uL");
  await expect(box(page, "concentration", "Volume in microliter")).toHaveValue("10000");
  await expect(answer(page, "volume")).toHaveText("5000 µL");

  await unitMenu(page, "concentration", "Mass").selectOption("g");
  await expect(answer(page, "mass")).toHaveText("0.18016 g");
});

test("the dilution keeps its own values", async ({ page }) => {
  await glucose(page);
  await expect(box(page, "dilution", "Stock concentration in millimolar")).toHaveValue("");
  await expect(box(page, "dilution", "Desired volume in milliliter")).toHaveValue("");
});

test("typing is not fought: an incomplete number stays as typed, and is flagged only on leaving", async ({ page }) => {
  const input = box(page, "mass", "Volume in milliliter");
  await input.pressSequentially("1e-");
  await expect(input).toHaveValue("1e-");
  await expect(calc(page, "mass").getByText("This number is not complete.", { exact: true })).toHaveCount(0);
  await input.pressSequentially("3");
  await expect(box(page, "concentration", "Volume in milliliter")).toHaveValue("0.001");
  await input.fill("2.");
  await expect(input).toHaveValue("2.");
  await input.fill("1e-");
  await input.blur();
  await expect(calc(page, "mass").getByText("This number is not complete.", { exact: true })).toBeVisible();
});

test("scientific notation and a decimal comma are read", async ({ page }) => {
  await unitMenu(page, "mass", "Concentration").selectOption("M");
  await box(page, "mass", "Concentration in molar").fill("2.5e-7");
  await unitMenu(page, "mass", "Concentration").selectOption("nM");
  await expect(box(page, "mass", "Concentration in nanomolar")).toHaveValue("250");
  await box(page, "mass", "Volume in milliliter").fill("0,5");
  await unitMenu(page, "mass", "Volume").selectOption("uL");
  await expect(box(page, "mass", "Volume in microliter")).toHaveValue("500");
});

test("invalid values are explained at the box, in each calculator", async ({ page }) => {
  await box(page, "mass", "Molecular weight (g/mol or Da)").fill("-5");
  await expect(calc(page, "mass").getByText("Molecular weight cannot be negative.")).toBeVisible();
  await expect(calc(page, "concentration").getByText("Molecular weight cannot be negative.")).toBeVisible();
  await box(page, "mass", "Volume in milliliter").fill("abc");
  await expect(box(page, "mass", "Volume in milliliter")).toHaveAttribute("aria-invalid", "true");
});

test("the dilution sanity check: 1 M to 10 mM in 100 mL takes 1 mL of stock", async ({ page }) => {
  await unitMenu(page, "dilution", "Stock concentration").selectOption("M");
  await box(page, "dilution", "Stock concentration in molar").fill("1");
  await box(page, "dilution", "Desired concentration in millimolar").fill("10");
  await box(page, "dilution", "Desired volume in milliliter").fill("100");
  await expect(answer(page, "dilution")).toHaveText("1 mL");
  await unitMenu(page, "dilution", "Desired volume").selectOption("uL");
  await expect(answer(page, "dilution")).toHaveText("1000 µL");
});

test("a desired concentration above the stock is refused, with the reason", async ({ page }) => {
  await box(page, "dilution", "Stock concentration in millimolar").fill("10");
  await box(page, "dilution", "Desired concentration in millimolar").fill("100");
  await box(page, "dilution", "Desired volume in milliliter").fill("10");
  await expect(calc(page, "dilution").getByText(/higher than the stock/)).toBeVisible();
  await expect(answer(page, "dilution")).toHaveText("");
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

test("an answer can be added to the report, which writes the calculation out step by step", async ({ page }) => {
  const add = calc(page, "mass").getByRole("button", { name: "Add mass to report" });
  await expect(add).toBeDisabled();
  await glucose(page);
  await add.click();
  await page.getByRole("tab", { name: "Report (1)" }).click();

  const sheet = page.locator(".calc-sheet");
  await expect(sheet.getByRole("heading")).toHaveText("1 Mass from volume & concentration");
  await expect(sheet.getByText("C = 100 mM × 10⁻³ = 0.1 mol/L")).toBeVisible();
  await expect(sheet.getByText("m = C × V × MW")).toBeVisible();
  await expect(sheet.getByText("m = 0.1 mol/L × 0.01 L × 180.16 g/mol")).toBeVisible();
  await expect(sheet.getByText("m = 180.16 mg")).toBeVisible();
  await expect(sheet.getByText("C = m / (MW × V) = 0.18016 / (180.16 × 0.01) = 0.1 mol/L ✓")).toBeVisible();

  await page.getByRole("button", { name: "Remove calculation 1" }).click();
  await expect(page.getByText("Nothing in the report yet.", { exact: false })).toBeVisible();
});

test("the report keeps what was calculated, and survives a reload", async ({ page }) => {
  await glucose(page);
  await calc(page, "mass").getByRole("button", { name: "Add mass to report" }).click();
  await box(page, "mass", "Concentration in millimolar").fill("200"); // later edits do not change it
  await page.reload();
  await page.getByRole("tab", { name: "Report (1)" }).click();
  await expect(page.locator(".calc-sheet").getByText("m = 180.16 mg")).toBeVisible();
});

test("a calculation in the report can be renamed and collapsed", async ({ page }) => {
  await glucose(page);
  await calc(page, "mass").getByRole("button", { name: "Add mass to report" }).click();
  await page.getByRole("tab", { name: "Report (1)" }).click();
  const sheet = page.locator(".calc-sheet");

  await page.getByRole("button", { name: "Rename calculation 1" }).click();
  await page.getByLabel("Name for calculation 1").fill("Buffer A, 10 mL");
  await page.keyboard.press("Enter");
  await expect(sheet.getByRole("heading")).toContainText("Buffer A, 10 mL");
  await expect(sheet.getByRole("heading")).toContainText("Mass from volume & concentration");

  await page.getByRole("button", { name: "Collapse calculation 1" }).click();
  await expect(sheet.getByText("m = C × V × MW")).toHaveCount(0);
  await expect(sheet.locator(".sheet-summary")).toHaveText("m = 180.16 mg"); // the result stays in view
  await page.getByRole("button", { name: "Expand calculation 1" }).click();
  await expect(sheet.getByText("m = C × V × MW")).toBeVisible();

  await page.getByRole("button", { name: "Rename calculation 1" }).click();
  await page.getByLabel("Name for calculation 1").fill("never saved");
  await page.keyboard.press("Escape");
  await expect(sheet.getByRole("heading")).toContainText("Buffer A, 10 mL");

  await page.reload();
  await page.getByRole("tab", { name: "Report (1)" }).click();
  await expect(sheet.getByRole("heading")).toContainText("Buffer A, 10 mL"); // the name survives a reload
});

test("Collapse all folds every calculation, then Expand all opens them", async ({ page }) => {
  await glucose(page);
  await calc(page, "mass").getByRole("button", { name: "Add mass to report" }).click();
  await box(page, "volume", "Mass in milligrams").fill("90.08");
  await calc(page, "volume").getByRole("button", { name: "Add volume to report" }).click();
  await page.getByRole("tab", { name: "Report (2)" }).click();
  await page.getByRole("button", { name: "Collapse all" }).click();
  await expect(page.locator(".steps")).toHaveCount(0);
  await expect(page.locator(".sheet-summary")).toHaveCount(2);
  await page.getByRole("button", { name: "Expand all" }).click();
  await expect(page.locator(".steps")).toHaveCount(2);
});

test("5. molecular weight, then one line for molar and one for mass; the mass line has a menu for the mass unit and one for the volume unit", async ({ page }) => {
  await expect(calc(page, "conversion").locator(".row-label")).toHaveText(["Molecular weight (g/mol or Da):", "Molar concentration:", "Mass concentration:"]);
  await expect(unitMenu(page, "conversion", "Molar concentration")).toHaveValue("mM");
  await expect(calc(page, "conversion").getByLabel("Mass concentration: mass unit")).toHaveValue("mg");
  await expect(calc(page, "conversion").getByLabel("Mass concentration: volume unit")).toHaveValue("mL");
});

test("5. the two lines are linked, and the mass and volume units of the mass line are chosen separately", async ({ page }) => {
  const massUnit = calc(page, "conversion").getByLabel("Mass concentration: mass unit");
  const volumeUnit = calc(page, "conversion").getByLabel("Mass concentration: volume unit");
  await box(page, "conversion", "Molecular weight (g/mol or Da)").fill("180.16");
  await box(page, "conversion", "Molar concentration in millimolar").fill("100");
  await expect(box(page, "conversion", "Mass concentration in milligrams/milliliter")).toHaveValue("18.016");

  await massUnit.selectOption("g"); // g/mL
  await expect(box(page, "conversion", "Mass concentration in grams/milliliter")).toHaveValue("0.018016");
  await volumeUnit.selectOption("L"); // g/L
  await expect(box(page, "conversion", "Mass concentration in grams/liter")).toHaveValue("18.016");
  await massUnit.selectOption("ug"); // µg/L
  await expect(box(page, "conversion", "Mass concentration in micrograms/liter")).toHaveValue("18016000");
  await volumeUnit.selectOption("uL"); // µg/µL
  await expect(box(page, "conversion", "Mass concentration in micrograms/microliter")).toHaveValue("18.016");

  await massUnit.selectOption("mg");
  await volumeUnit.selectOption("L"); // mg/L
  await box(page, "conversion", "Mass concentration in milligrams/liter").fill("9008"); // half of it, typed on the mass line
  await unitMenu(page, "conversion", "Molar concentration").selectOption("uM");
  await expect(box(page, "conversion", "Molar concentration in micromolar")).toHaveValue("50000");
});

test("5. % w/v and ppm are in the mass menu, with their fixed volume shown", async ({ page }) => {
  const massUnit = calc(page, "conversion").getByLabel("Mass concentration: mass unit");
  const volumeUnit = calc(page, "conversion").getByLabel("Mass concentration: volume unit");
  await box(page, "conversion", "Molecular weight (g/mol or Da)").fill("180.16");
  await box(page, "conversion", "Molar concentration in millimolar").fill("100");

  await massUnit.selectOption("pct_wv");
  await expect(volumeUnit).toBeDisabled();
  await expect(volumeUnit).toContainText("per 100 mL");
  await expect(box(page, "conversion", "Mass concentration in % w/v")).toHaveValue("1.8016");
  await massUnit.selectOption("ppm");
  await expect(volumeUnit).toContainText("per L");
  await expect(box(page, "conversion", "Mass concentration in ppm (mg/L)")).toHaveValue("18016");

  await box(page, "conversion", "Mass concentration in ppm (mg/L)").fill("9008");
  await expect(box(page, "conversion", "Molar concentration in millimolar")).toHaveValue("50");
  await massUnit.selectOption("g"); // back to a pair: the volume menu is usable again, at its default
  await expect(volumeUnit).toBeEnabled();
  await expect(volumeUnit).toHaveValue("mL");
});

test("5. it asks for a molecular weight to cross between the two lines, and shares the one of the other calculators", async ({ page }) => {
  await box(page, "conversion", "Molar concentration in millimolar").fill("100");
  await expect(box(page, "conversion", "Mass concentration in milligrams/milliliter")).toHaveValue("");
  await expect(box(page, "conversion", "Mass concentration in milligrams/milliliter")).toHaveAttribute("placeholder", "needs MW");
  await unitMenu(page, "conversion", "Molar concentration").selectOption("uM"); // within one kind: no weight needed
  await expect(box(page, "conversion", "Molar concentration in micromolar")).toHaveValue("100000");

  await box(page, "mass", "Molecular weight (g/mol or Da)").fill("180.16"); // typed in calculator 1
  await expect(box(page, "conversion", "Molecular weight (g/mol or Da)")).toHaveValue("180.16");
  await expect(box(page, "conversion", "Mass concentration in milligrams/milliliter")).toHaveValue("18.016");
});

test("5. it is its own value: it does not change the concentration in calculators 1 to 3", async ({ page }) => {
  await glucose(page);
  await box(page, "conversion", "Molar concentration in millimolar").fill("5");
  await expect(box(page, "mass", "Concentration in millimolar")).toHaveValue("100");
  await expect(answer(page, "mass")).toHaveText("180.16 mg");
});

test("5. a negative concentration and a molecular weight of zero are explained", async ({ page }) => {
  await box(page, "conversion", "Molecular weight (g/mol or Da)").fill("180.16");
  await box(page, "conversion", "Molar concentration in millimolar").fill("-5");
  await expect(calc(page, "conversion").getByText("Concentration cannot be negative.")).toBeVisible();
  await box(page, "conversion", "Molar concentration in millimolar").fill("5");
  await box(page, "conversion", "Molecular weight (g/mol or Da)").fill("0");
  await expect(calc(page, "conversion").getByText("Molecular weight must be greater than zero.")).toBeVisible();
});

test("each calculator has an i that opens a bubble with the formulas it uses", async ({ page }) => {
  const expected: [Id, string][] = [
    ["mass", "m = C × V × MW"],
    ["volume", "V = m / (C × MW)"],
    ["concentration", "C = m / (MW × V)"],
    ["dilution", "C₁ × V₁ = C₂ × V₂"],
    ["conversion", "ρ = C × MW"],
  ];
  for (const [id, formula] of expected) {
    const button = calc(page, id).getByRole("button", { name: /Formulas used in/ });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(calc(page, id).getByText(formula, { exact: true })).toHaveCount(0);
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(calc(page, id).getByText(formula, { exact: true })).toBeVisible();
    await button.click();
    await expect(calc(page, id).getByText(formula, { exact: true })).toHaveCount(0);
  }
});
