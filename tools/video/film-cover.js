/* Capa do Reels do filme: renderiza film-cover.html em 1080x1920 e grava o
   jpg ao lado dos masters.

   VIDEO_FONTS=... node film-cover.js [praticas|solucoes]
   (a pasta de fontes e a do render, mais a Cormorant Garamond 700, que e a
   do nome no site; o README diz como montar)
*/
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const SITE = process.env.SITE_ROOT || path.join(DIR, '..', '..');
const FONTS = process.env.VIDEO_FONTS;
const OUT = process.env.VIDEO_OUT || path.join(SITE, 'assets', 'video');
const PORT = 8939;
const VARIANT = process.argv[2] || 'praticas';

if (!FONTS || !fs.existsSync(FONTS)) {
  console.error('ERRO: defina VIDEO_FONTS apontando para os .woff2.');
  process.exit(1);
}

const MIME = { '.html': 'text/html;charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => {
  const rel = decodeURIComponent(q.url.split('?')[0]);
  let f;
  if (rel.startsWith('/brand/'))      f = path.join(SITE, 'assets', 'brand', rel.slice(7));
  else if (rel.startsWith('/fonts/')) f = path.join(FONTS, rel.slice(7));
  else                                f = path.join(DIR, rel === '/' ? 'film-cover.html' : rel);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  // erro na pagina (variante que nao existe, por exemplo) falha na hora, e
  // nao depois de esperar o window.drawn ate o timeout
  page.on('pageerror', (e) => { console.error('ERRO na pagina: ' + e.message); process.exit(1); });
  await page.goto(`http://localhost:${PORT}/?v=${encodeURIComponent(VARIANT)}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.drawn === true);

  /* document.fonts.check() devolve true quando nenhuma fonte casa com a
     descricao, entao nao serve de prova. load() devolve as faces que de fato
     carregaram: lista vazia e nome saindo em Georgia. */
  const missing = await page.evaluate(async () => {
    const want = ['700 172px "Cormorant Garamond"', '500 34px "Inter"'];
    const out = [];
    for (const w of want) if (!(await document.fonts.load(w)).length) out.push(w);
    const img = document.getElementById('mark');
    if (!img.complete || !img.naturalWidth) out.push('logo');
    return out;
  });
  if (missing.length) {
    console.error('ERRO: nao carregou: ' + missing.join(', '));
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });
  const dst = path.join(OUT, 'srchz-order-of-chaos-reels-capa.jpg');
  await page.locator('#c').screenshot({ path: dst, type: 'jpeg', quality: 95 });
  console.log(`  ${dst}`);
  await browser.close();
  server.close();
})();
