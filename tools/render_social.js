/* Renderiza os 8 slides do carrossel do NA-001 em 1080x1350 (4:5), na
   identidade preto/dourado do /end/USN2/ — EB Garamond nos titulos,
   Inter no corpo, as mesmas variaveis de cor do styles.css do guia. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');


const OUT = process.env.SOCIAL_OUT || path.join(__dirname, '..', 'end', 'USN2', 'social');
/* As fontes nao moram no repo — sao baixadas sob demanda:
     npm pack @fontsource/eb-garamond @fontsource/inter
     tar xzf fontsource-eb-garamond-*.tgz && tar xzf fontsource-inter-*.tgz
   e aponta SOCIAL_FONTS para a pasta package/files resultante. */
const FONTS = process.env.SOCIAL_FONTS;
if (!FONTS || !fs.existsSync(FONTS)) {
  console.error('ERRO: defina SOCIAL_FONTS apontando para os .woff2 (veja o comentario acima).');
  process.exit(1);
}

const b64 = (f) => fs.readFileSync(path.join(FONTS, f)).toString('base64');
const face = (fam, w, f) =>
  `@font-face{font-family:"${fam}";font-weight:${w};font-style:normal;font-display:block;` +
  `src:url(data:font/woff2;base64,${b64(f)}) format("woff2")}`;

const FONT_CSS = [
  face('EB Garamond', 600, 'eb-garamond-latin-600-normal.woff2'),
  face('EB Garamond', 700, 'eb-garamond-latin-700-normal.woff2'),
  face('Inter', 300, 'inter-latin-300-normal.woff2'),
  face('Inter', 400, 'inter-latin-400-normal.woff2'),
  face('Inter', 600, 'inter-latin-600-normal.woff2'),
  face('Inter', 700, 'inter-latin-700-normal.woff2')
].join('\n');

/* Conteudo: identico ao que esta no ar em /end/USN2/, de proposito — o post
   nao pode afirmar nada que a pagina de destino nao afirme. */
const SLIDES = [
  { id: 1, kind: 'capa',
    eyebrow: 'SrChZ Technologies · Engenharia END',
    title: 'A prova de <span class="g">Ultrassom N2</span> tem três exames.',
    lead: 'Um deles pega quem sabe calibrar.',
    swipe: true },

  { id: 2, kind: 'card', num: '1', icon: '📋', label: 'Exame geral',
    big: '40', bigsub: 'questões, no mínimo',
    body: 'Múltipla escolha, com <b>1,5 minuto por questão</b>. O tempo é calculado em cima da quantidade — não sobra margem para travar numa conta.' },

  { id: 3, kind: 'card', num: '2', icon: '🔧', label: 'Exame específico',
    big: '20', bigsub: 'questões, no mínimo',
    body: 'Equipamentos, procedimentos e técnicas, com <b>até 3 minutos por questão</b>.' },

  { id: 4, kind: 'destaque', num: '3', icon: '✍️', label: 'Exame prático',
    title: 'Executar o ensaio <span class="g">e redigir uma instrução escrita</span> aplicável para o Nível 1.',
    body: 'Essa segunda parte é exigência do N2.<br>É onde muita gente que sabe calibrar escorrega — porque descobre no dia.' },

  { id: 5, kind: 'card', icon: '📆', label: 'Antes de agendar',
    big: '12', bigsub: 'meses de experiência',
    body: 'A tabela da NA-001 pede 12 meses no método para o Nível 2 — <b>3 meses para o N1</b>. Confere o seu caso antes de pagar a inscrição.' },

  { id: 6, kind: 'destaque', icon: '🧮', label: 'Por isso o cálculo pesa',
    title: 'Snell, campo próximo e caminho do som precisam sair <span class="g">no automático</span>.',
    body: 'Decorar fórmula não sustenta 1,5 minuto por questão.<br><b>Método sustenta.</b>' },

  { id: 7, kind: 'destaque', icon: '🎯', label: 'Crédito a quem merece',
    title: 'A ABENDI tem <span class="g">simulado oficial gratuito</span>. Usa.',
    body: '200+ questões, tentativas ilimitadas, direto da fonte.<br>O que ele não entrega é a <b>conta resolvida</b> — o porquê físico de cada passo.' },

  { id: 8, kind: 'cta',
    title: 'Escrevi o guia que eu queria <span class="g">ter tido</span>.',
    body: 'Teoria, cálculo resolvido passo a passo e questões comentadas.',
    foot: 'O curso credenciado e o exame continuam sendo no organismo certificador.',
    cta: 'Link na bio' }
];

function html(s) {
  const base = `
    <style>
      ${FONT_CSS}
      *{box-sizing:border-box;margin:0;padding:0}
      :root{
        --bg:#09090b; --panel:#121215; --ink:#f6f2e9; --soft:#cbc4b6; --muted:#8b8576;
        --gold:#c9a24b; --gold-2:#ead29a;
        --line:rgba(201,162,75,.24); --line-2:rgba(201,162,75,.12);
      }
      html,body{width:1080px;height:1350px}
      body{
        background:var(--bg); color:var(--ink);
        font-family:"Inter",sans-serif; font-weight:300;
        display:flex; flex-direction:column;
        padding:86px 78px 74px;
        position:relative; overflow:hidden;
        -webkit-font-smoothing:antialiased;
      }
      /* brilho dourado difuso, o mesmo clima do hero do guia */
      body::before{
        content:""; position:absolute; inset:0;
        background:
          radial-gradient(760px 520px at 78% -8%, rgba(201,162,75,.17), transparent 62%),
          radial-gradient(620px 460px at 6% 104%, rgba(201,162,75,.09), transparent 60%);
        pointer-events:none;
      }
      body::after{
        content:""; position:absolute; inset:26px;
        border:1px solid var(--line-2); border-radius:3px; pointer-events:none;
      }
      .wrap{position:relative; z-index:1; display:flex; flex-direction:column; height:100%}
      .g{
        background:linear-gradient(180deg,#f6e4ad,#cda74f 55%,#9a7833);
        -webkit-background-clip:text; background-clip:text; color:transparent;
      }
      .eyebrow{
        font-size:21px; letter-spacing:.2em; text-transform:uppercase;
        color:var(--muted); font-weight:600;
      }
      .icon{font-size:70px; line-height:1; margin-bottom:26px}
      .label{
        font-family:"EB Garamond",Georgia,serif; font-weight:600;
        font-size:58px; color:var(--gold-2); line-height:1.1; margin-bottom:34px;
      }
      .num{
        position:absolute; top:86px; right:78px;
        font-family:"EB Garamond",Georgia,serif; font-weight:700;
        font-size:150px; line-height:1; color:rgba(201,162,75,.16);
      }
      h1{
        font-family:"EB Garamond",Georgia,serif; font-weight:700;
        font-size:104px; line-height:1.02; letter-spacing:-.012em;
      }
      h2{
        font-family:"EB Garamond",Georgia,serif; font-weight:600;
        font-size:76px; line-height:1.1; letter-spacing:-.008em;
      }
      .lead{font-size:40px; line-height:1.4; color:var(--soft); font-weight:300}
      .body{font-size:35px; line-height:1.58; color:var(--soft); font-weight:300}
      .body b{color:var(--ink); font-weight:600}
      .big{
        font-family:"EB Garamond",Georgia,serif; font-weight:700;
        font-size:230px; line-height:.86; letter-spacing:-.02em;
      }
      .bigsub{
        font-size:30px; letter-spacing:.1em; text-transform:uppercase;
        color:var(--muted); font-weight:600; margin-top:12px;
      }
      .rule{height:1px; background:var(--line); margin:40px 0}
      .spacer{flex:1}
      .footline{
        display:flex; align-items:center; justify-content:space-between;
        font-size:24px; color:var(--muted); letter-spacing:.06em;
      }
      .swipe{font-size:28px; color:var(--gold-2); letter-spacing:.1em; font-weight:600}
      .btn{
        display:inline-block; background:linear-gradient(180deg,var(--gold-2),var(--gold));
        color:#0a0a0a; font-weight:700; font-size:38px; padding:26px 56px; border-radius:3px;
      }
      .fine{font-size:23px; color:var(--muted); line-height:1.5; margin-top:28px}
      .brand{font-size:25px; color:var(--muted); letter-spacing:.14em; text-transform:uppercase; font-weight:600}
    </style>`;

  const foot = (right = '@websrchz') =>
    `<div class="footline"><span class="brand">SrChZ Technologies</span><span>${right}</span></div>`;

  if (s.kind === 'capa') {
    return base + `<div class="wrap">
      <div class="eyebrow">⚜&nbsp;&nbsp;${s.eyebrow}&nbsp;&nbsp;⚜</div>
      <div class="spacer"></div>
      <h1>${s.title}</h1>
      <div class="rule"></div>
      <p class="lead">${s.lead}</p>
      <div class="spacer"></div>
      <div class="footline"><span class="brand">SrChZ Technologies</span><span class="swipe">arrasta →</span></div>
    </div>`;
  }

  if (s.kind === 'card') {
    return base + `<div class="wrap">
      ${s.num ? `<div class="num">${s.num}</div>` : ''}
      <div class="icon">${s.icon}</div>
      <div class="label">${s.label}</div>
      <div class="spacer"></div>
      <div class="big g">${s.big}</div>
      <div class="bigsub">${s.bigsub}</div>
      <div class="rule"></div>
      <p class="body">${s.body}</p>
      <div class="spacer"></div>
      ${foot()}
    </div>`;
  }

  if (s.kind === 'destaque') {
    return base + `<div class="wrap">
      ${s.num ? `<div class="num">${s.num}</div>` : ''}
      <div class="icon">${s.icon}</div>
      <div class="label">${s.label}</div>
      <div class="spacer"></div>
      <h2>${s.title}</h2>
      <div class="rule"></div>
      <p class="body">${s.body}</p>
      <div class="spacer"></div>
      ${foot()}
    </div>`;
  }

  // cta
  return base + `<div class="wrap">
    <div class="eyebrow">⚜&nbsp;&nbsp;Guia de Estudo · Ultrassom Nível II&nbsp;&nbsp;⚜</div>
    <div class="spacer"></div>
    <h2>${s.title}</h2>
    <div class="rule"></div>
    <p class="body">${s.body}</p>
    <div style="margin-top:52px"><span class="btn">${s.cta}</span></div>
    <p class="fine">${s.foot}</p>
    <div class="spacer"></div>
    ${foot()}
  </div>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1
  });

  for (const s of SLIDES) {
    await page.setContent(html(s), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(OUT, `na001-${String(s.id).padStart(2, '0')}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(`  slide ${s.id}: ${path.basename(file)}  ${kb} KB`);
  }

  await browser.close();
  console.log(`\n${SLIDES.length} slides em ${OUT}`);
})();
