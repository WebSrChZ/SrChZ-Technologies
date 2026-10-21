/* O filme institucional, nos dois formatos.
   Deterministico: a pagina nao "toca" sozinha. Cada quadro e render(t) mais
   um screenshot, e o screenshot vai direto para a entrada do ffmpeg — 1650
   quadros por formato em PNG dariam uns 2,5 GB de arquivo intermediario
   que ninguem vai olhar.

   modos:
     node film-render.js --check          confere a geometria e salva amostras
     node film-render.js --fmt v          renderiza so o 9:16
     node film-render.js                  renderiza os dois

   ambiente:
     VIDEO_WORK   pasta de trabalho, fora do repo (precisa ter film/ com as
                  capturas de film-capture.js)
     VIDEO_FONTS  pasta com os .woff2 (veja o README)
     VIDEO_OUT    pasta de saida dos mp4 (default: assets/video do site)
*/
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIR  = __dirname;
const SITE = process.env.SITE_ROOT || path.join(DIR, '..', '..');
const WORK = process.env.VIDEO_WORK;
const FONTS = process.env.VIDEO_FONTS;
if (!WORK || !fs.existsSync(path.join(WORK, 'film'))) {
  console.error('ERRO: VIDEO_WORK precisa apontar para a pasta de trabalho com film/ dentro.');
  process.exit(1);
}
if (!FONTS || !fs.existsSync(FONTS)) {
  console.error('ERRO: defina VIDEO_FONTS apontando para os .woff2.');
  process.exit(1);
}
const OUTDIR = process.env.VIDEO_OUT || path.join(SITE, 'assets', 'video');
const PORT = 8931;
const FPS = 30;

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const only = (() => { const i = argv.indexOf('--fmt'); return i < 0 ? null : argv[i + 1]; })();
/* o mesmo motor serve para o amostrador de efeitos: so muda a pagina */
const PAGE = (() => { const i = argv.indexOf('--page'); return i < 0 ? 'film.html' : argv[i + 1]; })();
const OUTNAME = (() => { const i = argv.indexOf('--out'); return i < 0 ? null : argv[i + 1]; })();
/* Desfoque de movimento de verdade: renderiza MB subquadros por quadro final
   e deixa o ffmpeg fundir cada grupo (tmix). E o que separa "animacao" de
   "motion graphics" — sem isso, movimento rapido vira pulo de posicao. Custa
   MB vezes o tempo de renderizacao, entao 1 enquanto se itera, 3 no master. */
const MB = (() => {
  const i = argv.indexOf('--mb');
  const n = i < 0 ? 1 : parseInt(argv[i + 1], 10);
  return Number.isFinite(n) && n >= 1 && n <= 6 ? n : 1;
})();
/* o wav do film-audio.py entra como segunda entrada do mesmo ffmpeg: nao
   ha motivo para escrever o mp4 mudo e remuxar depois */
const AUDIO = (() => {
  const i = argv.indexOf('--audio');
  if (i >= 0) return argv[i + 1];
  const d = path.join(OUTDIR, 'srchz-order-of-chaos.wav');
  return fs.existsSync(d) ? d : null;
})();
const FORMATS = (only ? [only] : ['v', 'h']).filter(f => f === 'v' || f === 'h');

const MIME = { '.html':'text/html;charset=utf-8', '.png':'image/png',
               '.woff2':'font/woff2', '.css':'text/css', '.js':'text/javascript' };

const server = http.createServer((q, r) => {
  const rel = decodeURIComponent(q.url.split('?')[0]);
  let f;
  if (rel.startsWith('/film/'))       f = path.join(WORK, 'film', rel.slice(6));
  else if (rel.startsWith('/brand/')) f = path.join(SITE, 'assets', 'brand', rel.slice(7));
  else if (rel.startsWith('/fonts/')) f = path.join(FONTS, rel.slice(7));
  else                                f = path.join(DIR, rel === '/' ? 'film.html' : rel);
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
/* japones da cena de idiomas: a Inter nao tem kana nem kanji */
@font-face{font-family:"Inter";font-weight:600;font-display:block;
  unicode-range:U+3000-30FF,U+4E00-9FFF,U+FF00-FFEF;
  src:local("IPAGothic"),local("IPAPGothic"),local("Noto Sans CJK JP")}
`;

/* Os instantes a conferir saem da propria lista de planos: o meio de cada
   um, mais um ponto logo depois da entrada. Plano novo entra na checagem
   sem ninguem lembrar de acrescentar um numero aqui. */
async function marksFor(page) {
  const shots = await page.evaluate(() => window.SHOTS);
  const out = [];
  for (const s of shots) {
    out.push(Math.round(s.a + Math.min(s.d * 0.5, 300)));   // logo apos a entrada
    if (s.d > 800) out.push(Math.round(s.a + s.d * 0.75));  // plano longo: mais um
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

/* o que nao pode se sobrepor nem sair do quadro.
   #dimg fica de fora de proposito: o plano de detalhe sangra no quadro,
   e e justamente esse o efeito. */
const BOXES = ['#brw','#panelTxt','#pChips','#langRow','#tech-dia','#graph',
  '#s1mark','#s1quote','#s2a','#s2b','#s2ps','#s7a','#s7b','#s7c',
  '#s8mark','#s8q','#s8s','#waBtn','#s8url','#s8sig'];
/* pares que precisam ficar separados (o cartao tecnico fica POR CIMA da
   moldura de proposito, entao essa dupla nao entra) */
const PAIRS = [
  ['#panelTxt','#pChips'], ['#panelTxt','#brw'], ['#pChips','#brw'],
  ['#tech-dia','#panelTxt'], ['#tech-dia','#pChips'],
  ['#graph','#panelTxt'], ['#graph','#pChips'],
  ['#s8q','#s8mark'], ['#waBtn','#s8s'], ['#s8url','#waBtn'], ['#s8sig','#s8url'],
  ['#s7c','#s7b'], ['#s2ps','#s2b'], ['#s1quote','#s1mark']
];

async function openPage(browser, fmt) {
  const W = fmt === 'v' ? 1080 : 1920, H = fmt === 'v' ? 1920 : 1080;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${PORT}/?fmt=${fmt}`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: FONT_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.ready());
  return { page, W, H };
}

async function check(browser) {
  const outDir = path.join(WORK, 'film-check');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const problems = [];

  for (const fmt of FORMATS) {
    const { page, W, H } = await openPage(browser, fmt);
    const bar = fmt === 'v' ? 92 : 0;   // tarja cinematografica, so no vertical
    const MARKS = await marksFor(page);

    for (const t of MARKS) {
      await page.evaluate(ms => window.render(ms), t);
      await page.waitForTimeout(40);

      const rects = await page.evaluate((sels) => {
        /* Mede com a camera neutralizada. Com o mundo girando, o retangulo
           devolvido e a caixa projetada: maior que a real, e dois vizinhos
           encostam na medicao sem encostar na tela. Zerar a transformacao
           do mundo da a geometria verdadeira e ainda respeita o
           translate(-50%,-50%) dos elementos centralizados, que a caixa de
           layout (offset*) ignora. */
        const world = document.getElementById('world');
        const savedT = world ? world.style.transform : '';
        if (world) { world.style.transform = 'none'; void world.offsetWidth; }
        const eff = (el) => { let o = 1, n = el;
          while (n && n !== document.body) { o *= parseFloat(getComputedStyle(n).opacity || '1'); n = n.parentElement; }
          return o; };
        const out = {};
        for (const s of sels) {
          const el = document.querySelector(s);
          if (!el) continue;
          const box = el.closest('.kLine') || el;     // linhas mascaradas: vale a moldura
          const r = box.getBoundingClientRect();
          if (r.width < 3 || r.height < 3) continue;
          if (getComputedStyle(box).display === 'none') continue;
          const o = eff(el);
          if (o < 0.06) continue;                      // invisivel no quadro
          /* Duas geometrias. A projetada (getBoundingClientRect) diz o que
             sai do quadro, porque e o que se ve. A de layout (offset*) diz
             se dois blocos se tocam: com a cena em perspectiva a caixa
             projetada e maior que a real, e dois vizinhos encostariam na
             medicao sem encostar na tela. */
          out[s] = { x: r.x, y: r.y, w: r.width, h: r.height, o: +o.toFixed(2) };
        }
        if (world) world.style.transform = savedT;
        return out;
      }, BOXES);

      const say = (m) => problems.push(`[${fmt} t=${t}] ${m}`);
      for (const [s, r] of Object.entries(rects)) {
        const pad = 16;
        if (r.x < pad || r.x + r.w > W - pad)
          say(`${s} sai na horizontal: ${Math.round(r.x)}..${Math.round(r.x + r.w)} (quadro 0..${W})`);
        if (r.y < bar + pad || r.y + r.h > H - bar - pad)
          say(`${s} sai na vertical: ${Math.round(r.y)}..${Math.round(r.y + r.h)} (area util ${bar}..${H - bar})`);
      }
      for (const [a, b] of PAIRS) {
        const A = rects[a], B = rects[b];
        if (!A || !B) continue;
        const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
        const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
        if (ox > 2 && oy > 2) say(`${a} e ${b} se sobrepoem (${Math.round(ox)}x${Math.round(oy)}px)`);
      }

      await page.screenshot({ path: path.join(outDir, `${fmt}-${String(t).padStart(5, '0')}.png`),
        animations: 'disabled' });
    }
    await page.close();
    console.log(`  ${fmt}: ${MARKS.length} amostras`);
  }

  console.log('');
  if (problems.length) {
    for (const p of problems) console.log(`  FALHA ${p}`);
    console.log(`\n  ${problems.length} problema(s) de geometria. Amostras em ${outDir}`);
    return 1;
  }
  console.log(`  geometria OK nos dois formatos. Amostras em ${outDir}`);
  return 0;
}

/* escreve respeitando a contrapressao do pipe: sem isso o buffer do ffmpeg
   estoura e o node come memoria ate morrer */
const put = (stream, buf) => new Promise((res, rej) => {
  if (stream.write(buf)) return res();
  /* os dois ouvintes saem juntos: deixar o de erro para tras acumularia um
     por quadro que precisou esperar, 1650 vezes */
  const onErr = (e) => { stream.off('drain', onDrain); rej(e); };
  const onDrain = () => { stream.off('error', onErr); res(); };
  stream.once('drain', onDrain);
  stream.once('error', onErr);
});

async function renderFormat(browser, fmt) {
  const { page, W, H } = await openPage(browser, fmt);
  const DUR = await page.evaluate(() => window.DUR);
  /* --secs N encurta a renderizacao para testar o caminho inteiro sem
     esperar o filme todo */
  const LIM = (() => { const i = argv.indexOf('--secs'); return i < 0 ? 0 : parseFloat(argv[i + 1]); })();
  const total = Math.round((LIM > 0 ? Math.min(LIM * 1000, DUR) : DUR) / 1000 * FPS);
  const sub = total * MB;                       // subquadros a desenhar
  const out = path.join(OUTDIR, OUTNAME
    || (fmt === 'v' ? 'srchz-order-of-chaos-9x16.mp4' : 'srchz-order-of-chaos-16x9.mp4'));
  fs.mkdirSync(OUTDIR, { recursive: true });
  console.log(`  ${fmt}: ${total} quadros · ${FPS}fps · ${(DUR / 1000).toFixed(1)}s · ${W}x${H}`
    + (MB > 1 ? ` · desfoque de movimento ${MB}x (${sub} subquadros)` : ''));

  const args = ['-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(FPS * MB), '-i', '-'];
  if (AUDIO) args.push('-i', AUDIO);
  /* funde cada grupo de MB subquadros num quadro final e volta para 30fps */
  if (MB > 1) args.push('-vf', `tmix=frames=${MB}:weights='${Array(MB).fill(1).join(' ')}',fps=${FPS}`);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(FPS));
  /* AAC 192k estereo: o wav sai mixado em -16 LUFS, entao aqui e so
     transportar. -shortest corta no mais curto dos dois, que e a imagem. */
  if (AUDIO) args.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest');
  args.push(out);
  console.log(AUDIO ? `  audio: ${AUDIO}` : '  sem audio');
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => {
    ff.on('exit', (c) => c === 0 ? res() : rej(new Error('ffmpeg saiu com ' + c)));
    ff.on('error', rej);
  });

  /* Obturador de 180 graus, como em cinema: os MB subquadros se espalham
     pela METADE do intervalo do quadro, nao pelo intervalo inteiro. Cobrindo
     tudo, o rastro dobra de tamanho e a imagem fica permanentemente mole. */
  const SHUTTER = 0.5;
  const t0 = Date.now();
  for (let i = 0; i < sub; i++) {
    const f = Math.floor(i / MB), k = i % MB;
    await page.evaluate(ms => window.render(ms), ((f + (k / MB) * SHUTTER) / FPS) * 1000);
    const buf = await page.screenshot({ animations: 'disabled' });
    await put(ff.stdin, buf);
    if (i % (150 * MB) === 0 || i === sub - 1) {
      const el = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`    ${String(Math.round((i + 1) / sub * 100)).padStart(3)}%  ${i + 1}/${sub}  (${el}s)`);
    }
  }
  ff.stdin.end();
  await done;
  await page.close();
  const mb = (fs.statSync(out).size / 1048576).toFixed(1);
  console.log(`  ${out}  ${mb} MB`);
}

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--force-device-scale-factor=1', '--disable-lcd-text']
  });

  let code = 0;
  try {
    if (CHECK) code = await check(browser);
    else for (const fmt of FORMATS) await renderFormat(browser, fmt);
  } finally {
    await browser.close();
    server.close();
  }
  process.exit(code);
})();
