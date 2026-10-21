/* Fase 2 — renderiza a timeline quadro a quadro e codifica em H.264.
   Determinístico: a página não "toca" sozinha; cada quadro é render(t) e um
   screenshot. Assim o movimento não depende da velocidade da máquina. */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR  = __dirname;                       // timeline.html mora aqui
/* Pasta de trabalho FORA do repositorio: guarda as capturas, os recortes e os
   ~960 quadros intermediarios (uns 300 MB). Nada disso e versionado — o que
   se versiona e o roteiro (timeline.html) e o mp4 final. */
const WORK = process.env.VIDEO_WORK;
if (!WORK) {
  console.error('ERRO: defina VIDEO_WORK — pasta de trabalho, fora do repo.');
  process.exit(1);
}
/* As fontes tambem nao moram no repo:
     npm pack @fontsource/eb-garamond @fontsource/inter
     tar xzf fontsource-eb-garamond-*.tgz && tar xzf fontsource-inter-*.tgz
   e aponte VIDEO_FONTS para a pasta package/files. */
const FONTS = process.env.VIDEO_FONTS;
if (!FONTS || !fs.existsSync(FONTS)) {
  console.error('ERRO: defina VIDEO_FONTS apontando para os .woff2 (veja o comentario acima).');
  process.exit(1);
}
const FRAMES = path.join(WORK, 'frames');
const OUT    = process.env.VIDEO_OUT || path.join(DIR, 'srchz-site.mp4');
const PORT   = 8902;
const FPS    = 30;

const MIME = { '.html':'text/html;charset=utf-8', '.png':'image/png',
               '.woff2':'font/woff2', '.css':'text/css', '.js':'text/javascript' };

/* serve a timeline, as capturas (pasta crop renomeada para shots) e as fontes */
const server = http.createServer((q, r) => {
  const rel = decodeURIComponent(q.url.split('?')[0]);
  let f;
  if (rel.startsWith('/shots/'))      f = path.join(WORK, 'crop', rel.slice(7));
  else if (rel.startsWith('/fonts/')) f = path.join(FONTS, rel.slice(7));
  else                                f = path.join(DIR, rel === '/' ? 'timeline.html' : rel);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});

const FONT_CSS = `
@font-face{font-family:"EB Garamond";font-weight:600;font-display:block;src:url(/fonts/eb-garamond-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:"EB Garamond";font-weight:700;font-display:block;src:url(/fonts/eb-garamond-latin-700-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:300;font-display:block;src:url(/fonts/inter-latin-300-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:600;font-display:block;src:url(/fonts/inter-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:"Inter";font-weight:700;font-display:block;src:url(/fonts/inter-latin-700-normal.woff2) format("woff2")}
/* japonês do seletor no fecho */
@font-face{font-family:"Inter";font-weight:600;font-display:block;unicode-range:U+3000-30FF,U+4E00-9FFF;src:local("IPAGothic"),local("Noto Sans CJK JP")}
`;

(async () => {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  await new Promise((r) => server.listen(PORT, r));

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--force-device-scale-factor=1', '--disable-lcd-text']
  });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1
  });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: FONT_CSS });
  await page.evaluate(() => document.fonts.ready);

  /* pré-carrega todas as capturas: trocar o src no meio da renderização
     deixaria um quadro em branco no corte */
  const shots = fs.readdirSync(path.join(WORK, 'crop')).filter(f => f.endsWith('.png'));
  await page.evaluate(async (list) => {
    window.__cache = await Promise.all(list.map(n => new Promise((res) => {
      const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null);
      im.src = 'shots/' + n;
    })));
  }, shots);

  const DUR = await page.evaluate(() => window.DUR);
  const total = Math.round(DUR / 1000 * FPS);
  console.log(`  ${total} quadros · ${FPS}fps · ${(DUR/1000).toFixed(1)}s · 1080x1920`);

  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const t = (i / FPS) * 1000;
    await page.evaluate((ms) => window.render(ms), t);
    await page.screenshot({
      path: path.join(FRAMES, `f${String(i).padStart(5, '0')}.png`),
      animations: 'disabled'
    });
    if (i % 90 === 0 || i === total - 1) {
      const pct = Math.round((i + 1) / total * 100);
      const el = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`    ${String(pct).padStart(3)}%  quadro ${i + 1}/${total}  (${el}s)`);
    }
  }

  await browser.close();
  server.close();

  console.log('\n  codificando...');
  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y',
    '-framerate', String(FPS),
    '-i', path.join(FRAMES, 'f%05d.png'),
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',          // compatibilidade com telefone e redes
    '-movflags', '+faststart',      // começa a tocar antes de baixar tudo
    '-r', String(FPS),
    OUT
  ], { stdio: 'inherit' });

  const mb = (fs.statSync(OUT).size / 1048576).toFixed(1);
  console.log(`\n  ${OUT}  ${mb} MB`);
})();
