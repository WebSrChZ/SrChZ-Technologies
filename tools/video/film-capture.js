/* Capturas para o filme institucional, em dois formatos.
   O 9:16 usa o layout de telefone; o 16:9 usa o de desktop — recortar o
   mobile para paisagem daria uma coluna estreita no meio de uma tela larga,
   que nao e como o site se apresenta num monitor. */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.SITE_ROOT || path.join(__dirname, '..', '..');
const WORK = process.env.VIDEO_WORK;
if (!WORK) { console.error('ERRO: defina VIDEO_WORK.'); process.exit(1); }
const OUT = path.join(WORK, 'film');
const PORT = 8921;

const MIME = { '.html':'text/html;charset=utf-8', '.js':'text/javascript;charset=utf-8',
  '.css':'text/css;charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.json':'application/json',
  '.webmanifest':'application/manifest+json', '.xml':'application/xml', '.pdf':'application/pdf' };

const server = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    r.writeHead(404); r.end('404'); return;
  }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});

const PAGES = [
  { id: 'home',   url: '/?lang=pt' },
  { id: 'growth', url: '/growth/?lang=pt' },
  { id: 'end',    url: '/end/?lang=pt' },
  { id: 'tech',   url: '/tech/?lang=pt' },
  { id: 'calc',   url: '/end/USN2/calculadora.html?lang=pt' },
  { id: 'usn2',   url: '/end/USN2/?lang=pt' },
  { id: 'kl',     url: '/kl-sports/?lang=pt' },
  { id: 'home-en', url: '/?lang=en' },
  { id: 'home-ja', url: '/?lang=ja' }
];

/* v = vertical (telefone), h = horizontal (desktop) */
const VIEWS = {
  v: { width: 540,  height: 960, scale: 2 },
  h: { width: 1280, height: 800, scale: 1.5 }
};

const QUIET = `
  *,*::before,*::after{animation:none!important;transition:none!important}
  .reveal,[class*="reveal"]{opacity:1!important;transform:none!important}
  /* fixos caem no topo num print de pagina inteira; viram sujeira solta */
  .wa,.wa-fab,.dock,.toast{display:none!important}
`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });

  for (const [tag, v] of Object.entries(VIEWS)) {
    for (const pg of PAGES) {
      const ctx = await browser.newContext({
        viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.scale
      });
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}${pg.url}`, { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: QUIET });
      await page.waitForTimeout(420);
      const raw = path.join(OUT, `${tag}-${pg.id}.raw.png`);
      await page.screenshot({ path: raw, fullPage: true });
      await ctx.close();

      /* recorta: alem de ~5200px de altura nada entra no filme, e um PNG de
         36.000px faz o compositor arrastar */
      const final = path.join(OUT, `${tag}-${pg.id}.png`);
      const { execFileSync } = require('child_process');
      const h = parseInt(execFileSync('ffprobe', ['-v','error','-select_streams','v',
        '-show_entries','stream=height','-of','csv=p=0', raw]).toString().trim(), 10);
      const w = Math.round(v.width * v.scale);
      const nh = Math.min(h, 5200);
      execFileSync('ffmpeg', ['-loglevel','error','-y','-i',raw,
        '-vf',`crop=${w}:${nh}:0:0`, final]);
      fs.unlinkSync(raw);
      console.log(`  ${tag}-${pg.id.padEnd(9)} ${w}x${nh}`);
    }
  }

  await browser.close();
  server.close();
  console.log(`\ncapturas em ${OUT}`);
})();
