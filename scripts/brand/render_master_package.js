const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SVG_DIR = path.resolve(__dirname, '../../scratch/master_brand_svgs');
const OUTPUT_BRAND_DIR = path.resolve(__dirname, '../../packages/design-system/brand');

async function renderPng(browser, svgPath, outPngPath, width, height, bgColor = 'transparent') {
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  const page = await browser.newPage({ viewport: { width, height } });
  
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    margin: 0; 
    padding: 0; 
    background: ${bgColor}; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    width: ${width}px; 
    height: ${height}px; 
    overflow: hidden; 
  }
  svg { 
    width: 100%; 
    height: 100%; 
  }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

  await page.setContent(html);
  fs.mkdirSync(path.dirname(outPngPath), { recursive: true });
  await page.screenshot({ path: outPngPath, omitBackground: bgColor === 'transparent' });
  await page.close();
  console.log(`Rendered: ${path.basename(outPngPath)} (${width}x${height})`);
}

async function renderOgCard(browser, outPngPath) {
  const symbolSvg = fs.readFileSync(path.join(SVG_DIR, 'tukubi-symbol.svg'), 'utf8');
  const logoDarkSvg = fs.readFileSync(path.join(SVG_DIR, 'tukubi-logo-dark.svg'), 'utf8');
  
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background: #0B1B3B;
    font-family: -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", sans-serif;
    color: #FFFFFF;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 72px 80px;
  }
  /* Caribbean Ambient Glows */
  .glow-teal {
    position: absolute;
    top: -120px;
    left: -100px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(0, 194, 168, 0.28) 0%, transparent 65%);
    filter: blur(60px);
    pointer-events: none;
  }
  .glow-violet {
    position: absolute;
    bottom: -150px;
    right: 100px;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 65%);
    filter: blur(70px);
    pointer-events: none;
  }
  .glow-orange {
    position: absolute;
    top: 50%;
    right: -100px;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 60%);
    filter: blur(60px);
    pointer-events: none;
  }
  .header-logo {
    width: 380px;
    height: auto;
    z-index: 10;
  }
  .hero-content {
    z-index: 10;
    max-width: 900px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    background: rgba(0, 194, 168, 0.15);
    border: 1px solid rgba(0, 194, 168, 0.35);
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #00E5C9;
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  .title {
    font-size: 56px;
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -0.02em;
    margin-bottom: 18px;
    background: linear-gradient(135deg, #FFFFFF 30%, #E2E8F0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .subtitle {
    font-size: 24px;
    font-weight: 500;
    color: #94A3B8;
    line-height: 1.4;
  }
  .footer-row {
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 24px;
    font-size: 16px;
    color: #64748B;
    font-weight: 600;
  }
  .categories {
    display: flex;
    gap: 20px;
    color: #CBD5E1;
  }
</style>
</head>
<body>
  <div class="glow-teal"></div>
  <div class="glow-violet"></div>
  <div class="glow-orange"></div>

  <div class="header-logo">
    ${logoDarkSvg}
  </div>

  <div class="hero-content">
    <div class="badge">Caribbean Futurism • Official Identity</div>
    <div class="title">The Caribbean Connected.<br>Built for the World.</div>
    <div class="subtitle">Real People. Real Culture. Real Connections.</div>
  </div>

  <div class="footer-row">
    <div class="categories">
      <span>PEOPLE</span> • <span>CULTURE</span> • <span>CREATORS</span> • <span>COMMUNITIES</span> • <span>BUSINESS</span>
    </div>
    <div>tukubi.com</div>
  </div>
</body>
</html>`;

  await page.setContent(html);
  await page.screenshot({ path: outPngPath });
  await page.close();
  console.log(`Rendered: ${path.basename(outPngPath)} (1200x630)`);
}

async function main() {
  fs.mkdirSync(OUTPUT_BRAND_DIR, { recursive: true });
  
  // Copy SVGs to design-system/brand/
  const svgs = fs.readdirSync(SVG_DIR).filter(f => f.endsWith('.svg'));
  for (const svg of svgs) {
    fs.copyFileSync(path.join(SVG_DIR, svg), path.join(OUTPUT_BRAND_DIR, svg));
  }
  console.log(`Copied ${svgs.length} SVGs to ${OUTPUT_BRAND_DIR}`);

  const browser = await chromium.launch();

  // 1. Standalone Symbol PNGs
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-symbol.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-symbol-1024.png'), 1024, 1024);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-symbol.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-symbol-512.png'), 512, 512);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-symbol.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-symbol-128.png'), 128, 128);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-symbol.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-emblem.png'), 192, 192);

  // 2. Horizontal Logos
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-logo.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-logo.png'), 920, 220);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-logo-dark.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-logo-dark.png'), 920, 220);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-logo-dark.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-logo-transparent.png'), 920, 220);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-logo-dark.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-footer-dark.png'), 460, 110, '#0B1B3B');
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-logo-dark.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-footer-transparent.png'), 460, 110);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-logo-compact.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-logo-compact.png'), 560, 120);

  // 3. Stacked Logos
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-logo-stacked.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-logo-stacked.png'), 480, 400);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-logo-stacked-dark.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-logo-stacked-dark.png'), 480, 400);

  // 4. App Icons
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-app-icon.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-app-icon-1024.png'), 1024, 1024);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-app-icon.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-app-icon-512.png'), 512, 512);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-app-icon-adaptive-foreground.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-adaptive-foreground.png'), 1024, 1024);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-app-icon-adaptive-background.svg'), path.join(OUTPUT_BRAND_DIR, 'tukubi-adaptive-background.png'), 1024, 1024, '#0B1B3B');

  // 5. Web App Manifest Icons & Favicons
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-app-icon.svg'), path.join(OUTPUT_BRAND_DIR, 'apple-touch-icon.png'), 180, 180);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-app-icon.svg'), path.join(OUTPUT_BRAND_DIR, 'icon-192.png'), 192, 192);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-app-icon.svg'), path.join(OUTPUT_BRAND_DIR, 'icon-512.png'), 512, 512);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-app-icon.svg'), path.join(OUTPUT_BRAND_DIR, 'icon-maskable-192.png'), 192, 192, '#0B1B3B');
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-app-icon.svg'), path.join(OUTPUT_BRAND_DIR, 'icon-maskable-512.png'), 512, 512, '#0B1B3B');
  
  // Favicons (Standalone symbol on transparent background)
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-symbol.svg'), path.join(OUTPUT_BRAND_DIR, 'favicon-48.png'), 48, 48);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-symbol.svg'), path.join(OUTPUT_BRAND_DIR, 'favicon-32.png'), 32, 32);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-symbol.svg'), path.join(OUTPUT_BRAND_DIR, 'favicon-16.png'), 16, 16);
  await renderPng(browser, path.join(SVG_DIR, 'tukubi-symbol.svg'), path.join(OUTPUT_BRAND_DIR, 'favicon.png'), 32, 32);

  // 6. OpenGraph Card
  await renderOgCard(browser, path.join(OUTPUT_BRAND_DIR, 'tukubi-og-card.png'));

  await browser.close();
  console.log("Master asset package successfully generated in packages/design-system/brand!");
}

main().catch(err => {
  console.error("Error generating master package:", err);
  process.exit(1);
});
