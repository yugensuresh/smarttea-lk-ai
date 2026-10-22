/**
 * Capture /disease layout states at multiple viewports (Playwright).
 * Run: node scripts/e2e-disease-layout.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEAF = path.resolve(__dirname, "../tests/fixtures/blister-upper.jpg");
const OUT_DIR = path.resolve(__dirname, "../tests/e2e-screenshots/disease");
const WIDTHS = [1440, 768, 375];

async function loginViaApi() {
  const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@smarttea.lk", password: "demo1234" }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json();
}

async function newAuthedContext(browser, auth) {
  const context = await browser.newContext();
  await context.addInitScript(
    ({ key, payload }) => sessionStorage.setItem(key, JSON.stringify(payload)),
    {
      key: "smarttea.auth.session",
      payload: {
        accessToken: auth.accessToken,
        tokenType: auth.tokenType,
        expiresIn: auth.expiresIn,
        user: auth.user,
      },
    },
  );
  return context;
}

async function capture(page, filename) {
  const filePath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function assertNoStaleResult(page) {
  const blister = page.getByText(/Blister Blight/i);
  if (await blister.count()) {
    const visible = await blister.first().isVisible().catch(() => false);
    if (visible) throw new Error("Stale Blister Blight result still visible");
  }
}

async function runViewport(browser, auth, width) {
  const context = await newAuthedContext(browser, auth);
  const page = await context.newPage();
  await page.setViewportSize({ width, height: Math.min(1200, width === 375 ? 900 : 1100) });

  await page.goto("http://127.0.0.1:5173/disease", { waitUntil: "domcontentloaded" });
  const shots = [];
  shots.push(await capture(page, `disease-${width}px-empty.png`));

  await page.locator('input[type="file"]').setInputFiles(LEAF);
  await page.getByText(/Specimen ready/i).waitFor({ timeout: 15000 });
  shots.push(await capture(page, `disease-${width}px-uploaded-not-analyzed.png`));

  await page.getByRole("button", { name: /Analyze Image/i }).click();
  await page.getByText(/Blister Blight/i).first().waitFor({ timeout: 120000 });
  await page.getByText(/Verified disease model/i).waitFor({ timeout: 10000 });
  const engine = await page.getByText(/keras-efficientnetb0-v1/i).count();
  if (engine < 1) throw new Error(`Missing verified Keras engine badge at ${width}px`);

  shots.push(await capture(page, `disease-${width}px-verified-result.png`));

  await page.getByRole("button", { name: /^Remove$/i }).click();
  await page.getByText(/Drag and drop a leaf photo here|Upload a leaf image/i).first().waitFor({ timeout: 10000 });
  await assertNoStaleResult(page);
  shots.push(await capture(page, `disease-${width}px-after-remove.png`));

  await page.locator('input[type="file"]').setInputFiles(LEAF);
  await page.getByText(/Specimen ready/i).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Analyze Image/i }).click();
  await page.getByText(/Blister Blight/i).first().waitFor({ timeout: 120000 });
  await page.getByRole("button", { name: /^Replace$/i }).click();
  await page.locator('input[type="file"]').setInputFiles(LEAF);
  await page.getByText(/Specimen ready/i).waitFor({ timeout: 15000 });
  await assertNoStaleResult(page);
  shots.push(await capture(page, `disease-${width}px-after-replace.png`));

  await context.close();
  return shots;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const ml = await fetch("http://127.0.0.1:8000/api/v1/ml/status").then((r) => r.json());
  if (!ml.ok || !ml.diseaseModel) {
    throw new Error(`ML not ready: ${JSON.stringify(ml)}`);
  }
  console.log("ML status OK — diseaseModel:", ml.diseaseModel);

  const auth = await loginViaApi();
  const browser = await chromium.launch({ headless: true });
  const all = [];
  for (const width of WIDTHS) {
    const shots = await runViewport(browser, auth, width);
    all.push(...shots);
    console.log(`Captured ${width}px:`, shots.map((s) => path.basename(s)).join(", "));
  }
  await browser.close();
  console.log(`\nDone: ${all.length} screenshots in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
