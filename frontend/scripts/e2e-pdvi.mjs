/**
 * One-off PDVI E2E via Playwright (run: node scripts/e2e-pdvi.mjs)
 */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEAF = path.resolve(__dirname, "../tests/fixtures/blister-upper.jpg");
const STORAGE_KEY = "smarttea-lk.member01.leafWorkflow";
const AUTH_KEY = "smarttea.auth.session";

const results = [];

function log(step, ok, detail = "") {
  results.push({ step, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${step}${detail ? `: ${detail}` : ""}`);
}

async function loginViaApi() {
  const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@smarttea.lk", password: "demo1234", rememberMe: false }),
  });
  if (!res.ok) throw new Error(`login failed ${res.status}`);
  return res.json();
}

async function main() {
  const auth = await loginViaApi();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(
    ({ key, payload }) => {
      sessionStorage.setItem(key, JSON.stringify(payload));
    },
    {
      key: AUTH_KEY,
      payload: {
        accessToken: auth.accessToken,
        tokenType: auth.tokenType ?? "Bearer",
        expiresIn: auth.expiresIn,
        user: auth.user,
      },
    },
  );

  const page = await context.newPage();
  const pdviPosts = [];

  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/api/v1/predict/pdvi")) {
      pdviPosts.push({ url: req.url(), body: req.postDataJSON?.() ?? req.postData() });
    }
  });

  await page.goto("http://127.0.0.1:5173/disease", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  const fileInput = page.locator('input[type="file"]');
  await fileInput.waitFor({ state: "attached", timeout: 20000 });
  await fileInput.setInputFiles(LEAF);

  await page.getByRole("button", { name: /Analyze Image/i }).click();
  await page.getByText(/Blister Blight/i).first().waitFor({ timeout: 120000 });

  const wf1 = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) || "null"), STORAGE_KEY);
  const m01ok =
    wf1?.model01?.classId === "blister" &&
    wf1?.model01?.inferenceEngine === "keras-efficientnetb0-v1";
  log("Model 01 saved to session", m01ok, JSON.stringify(wf1?.model01 ?? null));

  await page.goto("http://127.0.0.1:5173/risk", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Assess Environmental Risk/i }).click();

  await page.waitForFunction(
    (key) => {
      try {
        const wf = JSON.parse(sessionStorage.getItem(key) || "null");
        return Boolean(wf?.model02?.severityProbabilitiesForPdvi);
      } catch {
        return false;
      }
    },
    STORAGE_KEY,
    { timeout: 120000 },
  );

  const wf2 = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)), STORAGE_KEY);
  const probs = wf2?.model02?.severityProbabilitiesForPdvi;
  const keys = probs ? Object.keys(probs) : [];
  const sum = probs ? Object.values(probs).reduce((a, b) => a + b, 0) : 0;
  const m02ok =
    keys.length === 4 &&
    ["Low", "Moderate", "High", "Severe"].every((k) => keys.includes(k)) &&
    Object.values(probs).every((v) => Number(v) >= 0 && Number.isFinite(Number(v))) &&
    Math.abs(sum - 1) <= 0.02;
  log("Model 02 PDVI probs in session", m02ok, `keys=${keys.join(",")} sum=${sum.toFixed(4)} engine=${wf2?.model02?.inferenceEngine}`);

  await page.goto("http://127.0.0.1:5173/pdvi", { waitUntil: "domcontentloaded" });
  const calcBtn = page.getByRole("button", { name: /^Calculate PDVI$/ });
  await calcBtn.waitFor({ state: "visible", timeout: 15000 });
  log("Calculate PDVI enabled", !(await calcBtn.isDisabled()));

  pdviPosts.length = 0;
  await calcBtn.click();
  await page.waitForFunction(
    () => {
      const wf = JSON.parse(sessionStorage.getItem("smarttea-lk.member01.leafWorkflow") || "null");
      if (wf?.pdvi?.score == null) return false;
      const gauge = document.querySelector(".tabular-nums");
      return gauge && !document.body.innerText.includes("Calculating…");
    },
    { timeout: 90000 },
  );

  log("Single POST /predict/pdvi", pdviPosts.length === 1, `count=${pdviPosts.length}`);
  if (pdviPosts[0]?.body) {
    const b = pdviPosts[0].body;
    const payloadOk =
      b.model01Disease &&
      b.model01Confidence >= 0 &&
      b.model01Confidence <= 1 &&
      b.severityProbabilities &&
      Math.abs(Object.values(b.severityProbabilities).reduce((a, x) => a + x, 0) - 1) < 0.02;
    log("PDVI POST payload", payloadOk, JSON.stringify(b));
  }

  const wf3 = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)), STORAGE_KEY);
  log("Session pdvi stored", wf3?.pdvi?.score != null, `score=${wf3?.pdvi?.score}`);

  const exportBtn = page.getByRole("button", { name: /Export session result/i });
  log("Export enabled after calc", !(await exportBtn.isDisabled()));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error("\nE2E FAILED:", failed);
    process.exit(1);
  }
  console.log("\nE2E PASSED all steps");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
