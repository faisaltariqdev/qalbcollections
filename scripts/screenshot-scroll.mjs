import puppeteer from "puppeteer-core";

const url = process.argv[2] || "http://localhost:3000/";
const output = process.argv[3] || "test-results/qa/scrolled.png";
const scrollY = Number(process.argv[4] || 0);
const width = Number(process.argv[5] || 1440);
const height = Number(process.argv[6] || 900);

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=/tmp/qalb-screenshots-${Date.now()}`,
  ],
});

const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 1500));
await page.evaluate((y) => window.scrollTo(0, y), scrollY);
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: output, type: "png" });
await browser.close();
console.log("saved", output);
