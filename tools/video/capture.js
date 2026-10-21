/* Fase 1 — captura o site REAL em PNG, para a animação compor em cima.
   Determinístico de propósito: iframe carregando no meio da gravação daria
   timing irregular e quadro perdido. Aqui cada captura é um arquivo. */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.SITE_ROOT || path.join(__dirname, '..', '..');
const WORK = process.env.VIDEO_WORK;
if (!WORK) { console.error('ERRO: defina VIDEO_WORK (pasta de trabalho, fora do repo).'); process.exit(1); }
const OUT = path.join(WORK, 'shots');
const PORT = 8901;

const MIME = { '.html':'text/html;charset=utf-8', '.js':'text/javascript;charset=utf-8',
  '.css':'text/css;charset=utf-8', '.json':'application/json', '.png':'image/png',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon',
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

/* 540x960 CSS a 2x = 1080x1920 real, que é o quadro do vídeo. */
const VW = 540, VH = 960, SCALE = 2;

const SHOTS = [
  // home nos quatro idiomas, página inteira (para animar rolagem)
  { id: 'home-pt', url: '/?lang=pt', full: true },
  { id: 'home-en', url: '/?lang=en', full: true },
  { id: 'home-es', url: '/?lang=es', full: true },
  { id: 'home-ja', url: '/?lang=ja', full: true },
  // dobra de cada porta de serviço
  { id: 'tech',    url: '/tech/?lang=pt',   full: true },
  { id: 'growth',  url: '/growth/?lang=pt', full: true },
  { id: 'end',     url: '/end/?lang=pt',    full: true },
  // ferramenta e catálogo
  { id: 'calc',    url: '/end/USN2/calculadora.html?lang=pt', full: true },
  { id: 'kl',      url: '/kl-sports/?lang=pt', full: true },
  { id: 'kl-ja',   url: '/kl-sports/?lang=ja', full: true },
  // o guia
  { id: 'usn2',    url: '/end/USN2/?lang=pt', full: true }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });

  for (const s of SHOTS) {
    const ctx = await browser.newContext({
      viewport: { width: VW, height: VH }, deviceScaleFactor: SCALE
    });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}${s.url}`, { waitUntil: 'networkidle' });
    /* desliga animação de entrada: o site revela blocos ao rolar, e num
       print isso congelaria metade da página invisível */
    await page.addStyleTag({ content: `
      *,*::before,*::after{animation:none!important;transition:none!important}
      .reveal,[class*="reveal"]{opacity:1!important;transform:none!important}
      /* Elementos fixos renderizam UMA vez no print de pagina inteira, e caem
         no topo em vez de acompanhar a rolagem. O botao flutuante de WhatsApp
         e a barra de orcamento do catalogo apareciam soltos no meio da tela. */
      .wa, .wa-fab, .dock, .toast { display:none !important; }
    `});
    await page.waitForTimeout(450);
    const file = path.join(OUT, `${s.id}.png`);
    await page.screenshot({ path: file, fullPage: !!s.full });
    const { width, height } = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight
    }));
    console.log(`  ${s.id.padEnd(10)} ${width}x${height} css  ->  ${path.basename(file)}`);
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log(`\n${SHOTS.length} capturas em ${OUT}`);
})();
