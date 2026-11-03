import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});
await page.goto("file:///workspace/.grok/og-card.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "/workspace/.grok/og-raw.png", type: "png" });

const icon = await browser.newPage({
  viewport: { width: 64, height: 64 },
  deviceScaleFactor: 1,
});
await icon.goto("file:///workspace/.grok/favicon.svg", { waitUntil: "networkidle" });
await icon.screenshot({ path: "/workspace/.grok/favicon-64.png", type: "png" });

const tiny = await browser.newPage({
  viewport: { width: 16, height: 16 },
  deviceScaleFactor: 4,
});
await tiny.goto("file:///workspace/.grok/favicon.svg", { waitUntil: "networkidle" });
await tiny.screenshot({ path: "/workspace/.grok/favicon-16.png", type: "png" });

await browser.close();
console.log("shot ok");
