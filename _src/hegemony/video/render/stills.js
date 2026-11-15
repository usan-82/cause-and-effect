// 지도·카드 HTML을 1920x1080 PNG로 찍는다. 인자: [{html, png}, ...]가 든 JSON 파일
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const j of jobs) {
    await page.goto('file://' + j.html);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const err = await page.evaluate(() => window.__err || '');
    if (err) { console.error(j.html, err); process.exitCode = 1; }
    await page.screenshot({ path: j.png });
  }
  await browser.close();
})();
