import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
const server = spawn(process.execPath, ["--import", "tsx", "tests/browser-server.ts"], { stdio: "inherit" });
let browser;
const viewport = { width: 390, height: 844 };
const base = "http://127.0.0.1:4173";
const errors = [];
async function verifyWidth(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, "Mobile layout must fit");
}
async function enabled(page) {
  await page.waitForFunction(() => {
    const red = document.querySelector('[data-testid="palette-red"]');
    return red && !red.disabled;
  }, null, { timeout: 10_000 });
}
try {
  const deadline = Date.now() + 20_000;
  while (true) {
    try { if ((await fetch(base)).ok) break; } catch {}
    if (server.exitCode !== null || Date.now() > deadline) throw new Error("Browser fixture did not start");
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  browser = await chromium.launch();
  mkdirSync("test-results", { recursive: true });
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base);
  await page.getByTestId("home-screen").waitFor();
  await page.getByRole("button", { name: /^classic/i }).click();
  await page.getByTestId("classic-screen").waitFor();
  await verifyWidth(page);
  await page.getByRole("button", { name: "Return to Color Merge home" }).click();
  await page.getByRole("button", { name: "Parents & heart shop" }).click();
  await page.getByRole("dialog", { name: "For parents" }).waitFor();
  assert.equal(await page.getByRole("button", { name: /hearts ·/ }).count(), 0, "Products stay behind parent area");
  await page.getByLabel("Parent area answer").fill("1");
  await page.getByRole("button", { name: "Open parent area" }).click();
  await page.getByText("Please ask a parent to help.").waitFor();
  await page.getByLabel("Parent area answer").fill("42");
  await page.getByRole("button", { name: "Open parent area" }).click();
  await page.getByRole("button", { name: "Refresh balance" }).waitFor();
  await page.getByRole("button", { name: "Back to free play" }).click();
  await page.getByTestId("home-screen").waitFor();
  await context.close();

  // Seed a valid saved progression, not game answers or an application cheat API.
  const styles = [[1, "mix"], [11, "rings"], [21, "fall"], [36, "strands"],
    [51, "recall"], [66, "tower"], [81, "swarm"], [101, "zen"], [121, "sphere"]];
  for (const [level, style] of styles) {
    const runContext = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    await runContext.addInitScript(({ level }) => {
      localStorage.setItem("colormerge.remix.v1", JSON.stringify({
        version: 1, unlockedLevel: 121, selectedLevel: level, bestTimes: {},
        settings: { sound: false, haptics: false, reducedMotion: true },
      }));
      sessionStorage.removeItem("colormerge.remix.run.v1");
      sessionStorage.setItem("colormerge.returnScreen", "home");
    }, { level });
    const run = await runContext.newPage();
    run.on("pageerror", error => errors.push(style + ": " + error.message));
    await run.goto(base);
    await run.getByRole("button", { name: /^remix/i }).click();
    await run.getByTestId("remix-screen").waitFor();
    await run.getByTestId("remix-start").click();
    if (style === "recall" || style === "zen") {
      assert.equal(await run.getByTestId("palette-red").isEnabled(), false, style + " gates mixing during reveal/fade");
    }
    await enabled(run);
    if (style === "rings") await run.getByRole("group", { name: "Concentric color rings" }).waitFor();
    if (style === "fall") await run.getByRole("group", { name: "Falling shapes" }).waitFor();
    if (style === "tower") await run.getByRole("group", { name: "Color Tower" }).waitFor();
    if (style === "swarm") await run.getByRole("group", { name: "Bouncing shapes" }).waitFor();
    if (style === "strands") {
      await run.getByRole("group", { name: "Select a strand to mix" }).waitFor();
      const before = await run.locator('[aria-label^="Strand "][aria-pressed="true"]').getAttribute("aria-label");
      await run.getByRole("button", { name: "Next strand" }).click();
      const after = await run.locator('[aria-label^="Strand "][aria-pressed="true"]').getAttribute("aria-label");
      assert.notEqual(after, before, "Next strand changes selection");
    }
    if (style === "recall") {
      await run.getByRole("button", { name: "Check", exact: true }).waitFor();
      await run.getByText("Mix the color from memory").waitFor();
    }
    if (style === "sphere") {
      const sphere = run.getByRole("group", { name: /^Rotatable color sphere/ });
      await sphere.waitFor();
      const before = await sphere.locator("[data-dimple-id] path").first().getAttribute("d");
      await sphere.focus();
      await sphere.press("ArrowRight");
      const after = await sphere.locator("[data-dimple-id] path").first().getAttribute("d");
      assert.notEqual(after, before, "Sphere rotation changes projected dimple geometry");
      await run.getByRole("button", { name: "Next unfinished" }).click();
      const dimple = sphere.getByRole("button", { name: /^Dimple / }).first();
      await dimple.focus();
      await dimple.press("Enter");
      assert.equal(await dimple.getAttribute("aria-pressed"), "true");
    }
    await verifyWidth(run);
    await run.screenshot({ path: "test-results/" + style + ".png", fullPage: true });
    await run.getByRole("button", { name: "Pause game" }).click();
    await run.getByRole("dialog", { name: "Paused", exact: true }).waitFor();
    assert.equal(await run.getByTestId("palette-red").isEnabled(), false);
    await run.getByRole("button", { name: "Resume", exact: true }).click();
    await enabled(run);
    await run.getByTestId("palette-red").click();
    await runContext.close();
    console.log("Verified Remix level " + level + ": " + style);
  }
  assert.deepEqual(errors, [], "No uncaught browser errors");
  console.log("Mobile smoke passed: home, Classic, parent area and all nine Remix styles");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
