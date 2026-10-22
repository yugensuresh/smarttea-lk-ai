import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import pdf from "pdf-parse/lib/pdf-parse.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEAF = path.resolve(__dirname, "../tests/fixtures/blister-upper.jpg");
const OUT_DIR = path.resolve(__dirname, "../tests/e2e-screenshots");

async function loginViaApi() {
  const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@smarttea.lk", password: "demo1234" }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json();
}

async function newAuthedPage(browser, auth) {
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
  const page = await context.newPage();
  return { context, page };
}

async function uploadAndAnalyze(page) {
  await page.goto("http://127.0.0.1:5173/disease", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="file"]').setInputFiles(LEAF);
  await page.getByRole("button", { name: /Analyze Image/i }).click();
  await page.getByText(/Blister Blight/i).first().waitFor({ timeout: 120000 });
  await page.getByText(/Verified disease model/i).waitFor({ timeout: 10000 });
}

function inspectPdfText(text) {
  const required = [
    "SmartTea-LK",
    "Disease Detection Report",
    "blister-upper.jpg",
    "Blister Blight",
    "Model-reported confidence",
    "Four-class probability",
    "Blister Blight:",
    "Healthy:",
    "Grey Blight:",
    "Red Rust:",
    "Disclaimer",
    "Held-out test accuracy",
  ];
  const missing = required.filter((s) => !text.includes(s));
  if (missing.length) throw new Error(`PDF missing expected text: ${missing.join(", ")}`);
  const pctMatches = text.match(/\d+\.\d%/g) ?? [];
  if (pctMatches.length < 4) {
    throw new Error(`Expected at least 4 probability percentages in PDF, found ${pctMatches.length}`);
  }
  return { textLength: text.length, probabilityTokens: pctMatches.length };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const auth = await loginViaApi();
  const browser = await chromium.launch({ headless: true });
  const { context, page } = await newAuthedPage(browser, auth);

  await uploadAndAnalyze(page);
  const exportBtn = page.getByRole("button", { name: /^Export Result$/ });
  if (await exportBtn.isDisabled()) throw new Error("Export disabled after verified result");

  const downloadPromise = page.waitForEvent("download", { timeout: 90000 });
  await exportBtn.click();
  const download = await downloadPromise;
  const name = download.suggestedFilename();
  if (!name.endsWith(".pdf") || !name.startsWith("SmartTea-LK_Disease_Report_")) {
    throw new Error(`Unexpected download name: ${name}`);
  }
  const pdfPath = path.join(OUT_DIR, name);
  await download.saveAs(pdfPath);
  const buf = fs.readFileSync(pdfPath);
  if (buf.slice(0, 5).toString() !== "%PDF-") throw new Error("Download is not a valid PDF header");

  const parsed = await pdf(buf);
  const inspection = inspectPdfText(parsed.text);
  console.log("PASS PDF content inspection", inspection);

  await page.getByRole("button", { name: /^Remove$/i }).click();
  await page.getByText(/Drag and drop a leaf photo here/i).waitFor({ timeout: 10000 });
  const exportAfterRemove = page.getByRole("button", { name: /^Export Result$/ });
  if (await exportAfterRemove.count()) {
    if (!(await exportAfterRemove.isDisabled())) throw new Error("Export should be unavailable after Remove");
  } else {
    console.log("PASS Export control hidden after Remove");
  }

  await page.locator('input[type="file"]').setInputFiles(LEAF);
  await page.getByText(/Specimen ready/i).waitFor({ timeout: 15000 });
  const exportBeforeAnalyze = page.getByRole("button", { name: /^Export Result$/ });
  if (await exportBeforeAnalyze.count()) {
    if (!(await exportBeforeAnalyze.isDisabled())) throw new Error("Export should be disabled before new analysis");
  } else {
    console.log("PASS Export hidden before re-analysis");
  }

  await page.getByRole("button", { name: /Analyze Image/i }).click();
  await page.getByText(/Blister Blight/i).first().waitFor({ timeout: 120000 });
  if (await exportBtn.isDisabled()) throw new Error("Export should enable after new verified result");
  console.log("PASS Export re-enabled after new verified analysis");

  await page.getByRole("button", { name: /^Replace$/i }).click();
  await page.locator('input[type="file"]').setInputFiles(LEAF);
  await page.getByText(/Specimen ready/i).waitFor({ timeout: 15000 });
  const exportAfterReplace = page.getByRole("button", { name: /^Export Result$/ });
  if (await exportAfterReplace.count()) {
    if (!(await exportAfterReplace.isDisabled())) throw new Error("Export should be disabled after Replace");
  } else {
    console.log("PASS Export hidden after Replace (stale result cleared)");
  }

  await context.close();
  await browser.close();
  console.log("PASS PDF download", name, `${buf.length} bytes`, pdfPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
