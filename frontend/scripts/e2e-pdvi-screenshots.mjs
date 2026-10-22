import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../tests/e2e-screenshots");

async function loginViaApi() {
  const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@smarttea.lk", password: "demo1234" }),
  });
  return res.json();
}

async function main() {
  const auth = await loginViaApi();
  const browser = await chromium.launch({ headless: true });
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
  await page.goto("http://127.0.0.1:5173/pdvi");
  await page.waitForTimeout(800);
  for (const width of [1280, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, `pdvi-${width}.png`), fullPage: true });
  }
  await browser.close();
  console.log("Screenshots written to", outDir);
}

main();
