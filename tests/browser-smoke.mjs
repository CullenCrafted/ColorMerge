import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const server = spawn(process.execPath, ["--import", "tsx", "tests/browser-server.ts"], { stdio: "inherit" });
let browser;
try {
  const deadline = Date.now() + 20_000;
  while (true) {
    try { if ((await fetch("http://127.0.0.1:4173")).ok) break; } catch {}
    if (server.exitCode !== null || Date.now() > deadline) throw new Error("Browser fixture did not start");
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:4173");
  await page.getByTestId("home-screen").waitFor();
  await page.getByRole("button", { name: /^classic/i }).click();
  await page.getByTestId("classic-screen").waitFor();
  await page.goto("http://127.0.0.1:4173");
  await page.getByTestId("home-screen").waitFor();
  await page.getByRole("button", { name: /^remix/i }).click();
  await page.getByTestId("remix-screen").waitFor();
  await page.getByTestId("remix-start").click();
  await page.getByTestId("palette-red").waitFor({ state: "visible" });
  assert.equal(await page.getByTestId("palette-red").isEnabled(), true);
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert.equal(overflows, false, "Mobile layout must not overflow horizontally");
  assert.deepEqual(errors, [], "No uncaught browser errors");
  await context.close();
  console.log("Mobile viewport smoke passed: home, Classic and Remix ready-to-play");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
