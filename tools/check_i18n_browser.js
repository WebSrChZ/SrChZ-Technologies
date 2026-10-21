#!/usr/bin/env node
/* O que so um navegador consegue ver.
 *
 * O check_i18n.js le arquivos: garante que toda chave existe em todo idioma.
 * Isso nao alcanca a classe de defeito que mais apareceu nesta traducao, que e
 * sempre a mesma — a chave existe, o texto esta certo, e mesmo assim o
 * visitante nao consegue usar a pagina:
 *
 *   - o rotulo do seletor nascia com class="sr-only" e quatro paginas nao
 *     definiam essa classe, entao "Idioma / Language" aparecia ESCRITO na
 *     barra de navegacao — e ainda empurrava o seletor 147px para fora da tela
 *   - o /tech/ metia 504px de navegacao numa tela de 390
 *   - o seletor do USN2 ficava dentro de uma gaveta fechada, parado a 156px
 *     ACIMA da area visivel, esperando um botao ☰ que a calculadora nem tinha
 *   - uma pagina sem <meta name="description"> aceitava a traducao em silencio
 *     e nao traduzia nada, porque o motor so reescreve tag que ja existe
 *
 * Nenhum desses aparece lendo o codigo. Todos aparecem medindo a pagina.
 *
 * Uso:   node tools/check_i18n_browser.js [raiz]
 * Browser: usa $CHROME_PATH se definido; senao procura Chrome/Chromium nos
 *          lugares usuais; senao deixa o playwright escolher o proprio.
 *
 * Sem playwright instalado o script AVISA e sai com 0 — para nao travar quem
 * so quer editar um texto. Dentro do CI ($CI definido) o mesmo caso vira
 * ERRO: um check que silenciosamente deixa de rodar nao esta protegendo nada.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(process.argv[2] || '.');
const PORT = Number(process.env.I18N_TEST_PORT || 8787);
const IN_CI = !!process.env.CI;
const LANGS = ['pt', 'en', 'es', 'ja'];
const HTML_LANG = { pt: 'pt-BR', en: 'en', es: 'es', ja: 'ja' };

/* Cada pagina traz uma SONDA: um seletor cujo texto muda de idioma. Onde a
   pagina monta o conteudo em JavaScript — o catalogo da KL Sports — a sonda
   aponta de proposito para um elemento GERADO, que e o unico jeito de provar
   que o caminho JS tambem traduz. */
const PAGES = [
  { id: 'home', url: '/', probe: '.nav-links a[data-i18n="nav.about"]',
    expect: { pt: 'Sobre', en: 'About', es: 'Quién soy', ja: '私について' },
    title: { pt: /Solutions Strategist/, en: /Solutions Strategist/,
             es: /Estratega de Soluciones/, ja: /ソリューション/ } },
  { id: 'tech', url: '/tech/', probe: 'h2[data-i18n="tech.caps.title"]',
    expect: { pt: 'Capacidades', en: 'Capabilities', es: 'Capacidades', ja: '提供範囲' },
    title: { pt: /Tecnologia/, en: /Technology/, es: /Tecnología/, ja: /テクノロジー/ } },
  { id: 'growth', url: '/growth/', probe: 'h2[data-i18n="gr.m.title"]',
    expect: { pt: 'Um único motor de crescimento.', en: 'One single growth engine.',
              es: 'Un único motor de crecimiento.', ja: '成長をつくる、一つのエンジン。' },
    title: { pt: /Growth/, en: /Growth/, es: /Growth/, ja: /グロース/ } },
  { id: 'end', url: '/end/', probe: 'h2[data-i18n="end.svc.title"]',
    expect: { pt: 'Serviços de Inspeção', en: 'Inspection Services',
              es: 'Servicios de Inspección', ja: '検査サービス' },
    title: { pt: /END/, en: /NDT/, es: /END/, ja: /非破壊検査/ } },
  { id: 'usn2', url: '/end/USN2/', probe: 'a[data-i18n="u.nav.plans"]',
    expect: { pt: 'Planos', en: 'Plans', es: 'Planes', ja: 'プラン' },
    title: { pt: /Ultrassom Nível II/, en: /Ultrasonic Level II/,
             es: /Ultrasonido Nivel II/, ja: /超音波探傷レベルII/ } },
  { id: 'calc', url: '/end/USN2/calculadora.html', probe: 'h3[data-i18n="calc.in.title"]',
    expect: { pt: 'Entradas', en: 'Inputs', es: 'Entradas', ja: '入力' },
    title: { pt: /Caminho do Som/, en: /Sound Path/, es: /Camino Sónico/, ja: /音響距離/ } },
  { id: 'kl', url: '/kl-sports/', probe: 'h2#h-kettlebells',
    expect: { pt: 'Kettlebells', en: 'Kettlebells', es: 'Pesas Rusas', ja: 'ケトルベル' },
    title: { pt: /Catálogo KL Sports/, en: /KL Sports Fitness Catalogue/,
             es: /Catálogo KL Sports/, ja: /KL Sports Fitness カタログ/ } },
  { id: 'privacy', url: '/privacidade.html', probe: 'h1[data-i18n="priv.h1"]',
    expect: { pt: 'Política de Privacidade', en: 'Privacy Policy',
              es: 'Política de Privacidad', ja: 'プライバシーポリシー' },
    title: { pt: /Política de Privacidade/, en: /Privacy Policy/,
             es: /Política de Privacidad/, ja: /プライバシーポリシー/ },
    langNote: true },
  { id: 'privacyEnd', url: '/end/privacidade.html', probe: 'h1[data-i18n="pend.h1"]',
    expect: { pt: 'Política de Privacidade', en: 'Privacy Policy',
              es: 'Política de Privacidad', ja: 'プライバシーポリシー' },
    title: { pt: /Política de Privacidade/, en: /Privacy Policy/,
             es: /Política de Privacidad/, ja: /プライバシーポリシー/ },
    langNote: true },
  /* Os dois 404 nao tem seletor de proposito: quem cai neles ja chegou com um
     idioma escolhido, e o que quer ali e sair. */
  { id: 'nf', url: '/404.html', probe: 'h1[data-i18n="nf.h1"]',
    expect: { pt: 'Página não encontrada', en: 'Page not found',
              es: 'Página no encontrada', ja: 'ページが見つかりません' },
    title: { pt: /404/, en: /404/, es: /404/, ja: /404/ },
    noSwitcher: true, noDesc: true },
  { id: 'nfGrowth', url: '/growth/404.html', probe: 'p[data-i18n="nfg.p"]',
    expect: { pt: 'Esta página não existe — mas o seu ecossistema pode existir.',
              en: 'This page does not exist — but your ecosystem can.',
              es: 'Esta página no existe — pero tu ecosistema sí puede existir.',
              ja: 'このページは存在しません——ですが、御社の仕組みはこれからつくれます。' },
    title: { pt: /não encontrada/, en: /Page not found/, es: /no encontrada/, ja: /見つかりません/ },
    noSwitcher: true, noDesc: true }
];

// ---- browser --------------------------------------------------------------

function loadChromium() {
  for (const mod of ['playwright', 'playwright-core']) {
    try { return require(mod).chromium; } catch (e) { /* tenta o proximo */ }
  }
  return null;
}

function findBrowserPath() {
  const explicit = process.env.CHROME_PATH || process.env.PLAYWRIGHT_CHROMIUM_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const fixed = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
                 '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const p of fixed) if (fs.existsSync(p)) return p;

  // instalacao do playwright nesta maquina (PLAYWRIGHT_BROWSERS_PATH)
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    for (const dir of fs.readdirSync(base)) {
      if (!/^chromium/.test(dir)) continue;
      const p = path.join(base, dir, 'chrome-linux', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  } catch (e) { /* pasta nao existe: o playwright resolve sozinho */ }
  return null;                       // deixa o playwright usar o dele
}

// ---- servidor estatico ----------------------------------------------------

const MIME = {
  '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain;charset=utf-8', '.webp': 'image/webp'
};

function serve() {
  return http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('404'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

// ---------------------------------------------------------------------------

let failures = 0;
const ok = (cond, msg) => {
  console.log((cond ? '  ok    ' : '  FALHA ') + msg);
  if (!cond) failures++;
};

async function checkPage(browser, spec, lang) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`http://localhost:${PORT}${spec.url}?lang=${lang}`, { waitUntil: 'networkidle' });

  const htmlLang = await page.getAttribute('html', 'lang');
  ok(htmlLang === HTML_LANG[lang], `${spec.id}/${lang}: <html lang> = "${htmlLang}"`);

  const title = await page.title();
  ok(spec.title[lang].test(title), `${spec.id}/${lang}: titulo "${title.slice(0, 48)}…"`);

  const txt = (await page.textContent(spec.probe) || '').trim();
  ok(txt === spec.expect[lang], `${spec.id}/${lang}: sonda "${txt}"` +
     (txt === spec.expect[lang] ? '' : ` (esperado "${spec.expect[lang]}")`));

  /* O motor esconde o corpo enquanto traduz. Se ele travar, o visitante fica
     olhando uma pagina em branco — pior do que ler em portugues. */
  const revealed = await page.evaluate(() =>
    !document.documentElement.classList.contains('i18n-pending') &&
    getComputedStyle(document.body).visibility === 'visible');
  ok(revealed, `${spec.id}/${lang}: corpo revelado`);

  const raw = await page.evaluate(() =>
    /\b(nav|hero|doors|about|method|contact|footer|tech|gr|end|u|calc|kl)\.[a-z0-9.]{3,}\b/i
      .test(document.body.innerText));
  ok(!raw, `${spec.id}/${lang}: nenhuma chave crua na tela`);

  if (!spec.noDesc) {
    const desc = await page.evaluate(() => {
      const el = document.querySelector('meta[name="description"]');
      return el ? el.getAttribute('content') : null;
    });
    ok(!!desc && desc.length > 20, `${spec.id}/${lang}: ` +
       (desc === null ? 'FALTA <meta name="description">' : `meta description (${desc.length} chars)`));
  }

  if (!spec.noSwitcher) {
    const sel = await page.inputValue('.i18n-sw select');
    ok(sel === lang, `${spec.id}/${lang}: seletor marca "${sel}"`);

    /* O rotulo do seletor existe para leitor de tela e NAO pode ser desenhado.
       Quando o motor confiava num .sr-only que metade das paginas nao definia,
       "Idioma / Language" aparecia escrito na barra de navegacao.

       Este check e geometrico de proposito. A primeira versao so media se o
       seletor continuava alcancavel pelo dedo — e, depois que a navegacao foi
       enxugada no telefone, os 74px do rotulo deixaram de empurrar o seletor
       para fora da tela. O defeito voltaria inteiro, visivel na barra, com o
       teste todo verde. Medir a caixa do rotulo pega o defeito na origem. */
    const label = await page.evaluate(() => {
      const el = document.querySelector('.i18n-sw .sr-only, .i18n-sw label');
      if (!el) return { missing: true };
      const r = el.getBoundingClientRect();
      return { missing: false, w: Math.round(r.width), h: Math.round(r.height),
               text: (el.textContent || '').trim().slice(0, 40) };
    });
    ok(!label.missing && label.w <= 2 && label.h <= 2,
       `${spec.id}/${lang}: rotulo do seletor nao e desenhado` +
       (label.missing ? ' — rotulo ausente (leitor de tela sem nome)'
                      : ` (${label.w}x${label.h}px${label.w > 2 ? ` — "${label.text}" aparecendo na tela` : ''})`));
  }

  /* O aviso de idioma prevalente: tem de existir fora do portugues, sumir
     dentro dele, e apontar para a versao que vale juridicamente. */
  if (spec.langNote) {
    const note = await page.evaluate(() => {
      const el = document.querySelector('.lang-note');
      if (!el) return { exists: false };
      return { exists: true, text: (el.textContent || '').trim(),
               shown: getComputedStyle(el).display !== 'none',
               linksPt: !!el.querySelector('a[href*="lang=pt"]') };
    });
    if (lang === 'pt') {
      ok(note.exists && !note.shown, `${spec.id}/${lang}: aviso de idioma oculto em portugues`);
    } else {
      ok(note.exists && note.shown && note.text.length > 40 && note.linksPt,
         `${spec.id}/${lang}: aviso de idioma visivel e apontando para o portugues`);
    }
  }

  /* Um link de WhatsApp leva a mensagem pronta dentro do endereco. O rotulo do
     botao e traduzido; a mensagem tambem precisa ser, senao o visitante clica
     em "Message us on WhatsApp" e o aplicativo abre com uma frase em portugues
     que ele nao le, prestes a sair em nome dele.

     A checagem varre TODO link de wa.me, nao so os marcados com data-i18n-wa —
     e essa diferenca que importa. Um dos links vive dentro de um bloco
     data-i18n-html, entao a traducao substitui o elemento inteiro e leva o
     atributo junto; olhando so os marcados, aquele link sumia da conta e
     continuava despachando portugues sem ninguem notar.

     O catalogo da KL Sports e a excecao deliberada: la quem recebe e a equipe
     do cliente, que so le portugues, e isso tem teste proprio mais abaixo. */
  if (lang !== 'pt' && spec.id !== 'kl') {
    const ptMsgs = await page.evaluate(() =>
      [...document.querySelectorAll('a[href*="wa.me/"]')]
        .map((a) => { try { return decodeURIComponent(new URL(a.href).searchParams.get('text') || ''); }
                      catch (e) { return ''; } })
        .filter((m) => /Olá Rafael/.test(m)));
    ok(ptMsgs.length === 0, `${spec.id}/${lang}: mensagens de WhatsApp traduzidas` +
       (ptMsgs.length ? ` — ${ptMsgs.length} ainda em portugues: ${JSON.stringify(ptMsgs[0].slice(0, 60))}` : ''));
  }

  /* Links de pagina carregam o idioma; PDF, imagem e download nao — o motor os
     ignora de proposito, entao cobrar deles nao faria sentido. */
  if (lang !== 'pt') {
    const semLang = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && !/^(#|https?:|mailto:|tel:)/.test(h))
        .filter((h) => /\.html?($|[?#])/.test(h) || /\/($|[?#])/.test(h))
        .filter((h) => !/lang=/.test(h)));
    ok(semLang.length === 0, `${spec.id}/${lang}: links propagam o idioma` +
       (semLang.length ? ` — sem lang: ${semLang.join(', ')}` : ''));
  }

  // ---- telefone ----
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(220);

  const over = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(over <= 1, `${spec.id}/${lang}: sem scroll lateral a 390px (sobra ${over}px)`);

  /* Medir so a caixa do seletor NAO basta, e foi exatamente assim que a gaveta
     fechada do USN2 passou verde: translateY(-140%) deixa largura e altura
     normais, so que 156px acima da tela. Entao exige-se tambem que o centro
     caia dentro da area visivel e que o dedo o acerte. Uma pagina pode ter
     mais de um ponto de ancoragem (um para desktop, outro para telefone) —
     importa que exista UM utilizavel, nao qual deles. */
  if (!spec.noSwitcher) {
    const reachable = await page.evaluate(() =>
      [...document.querySelectorAll('.i18n-sw select')].some((s) => {
        const r = s.getBoundingClientRect();
        if (r.width <= 20 || r.height <= 10) return false;
        const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
        if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return false;
        const top = document.elementFromPoint(cx, cy);
        return top === s || s.contains(top);
      }));
    ok(reachable, `${spec.id}/${lang}: seletor alcancavel pelo dedo no telefone`);
  }

  /* Japones nao usa espacamento largo de letras nem italico: o primeiro afasta
     os kana sem ajudar a leitura, e o segundo o navegador SINTETIZA, inclinando
     o kanji a forca. A auditoria roda na pagina renderizada porque foi assim
     que .portal-tag a .26em apareceu — procurando no CSS ela nao aparecia. */
  if (lang === 'ja') {
    const bad = await page.evaluate(() => {
      const cjk = /[぀-ヿ一-鿿]/;
      const out = [];
      document.querySelectorAll('body *').forEach((el) => {
        const own = [...el.childNodes].filter((n) => n.nodeType === 3)
          .map((n) => n.textContent).join('');
        if (!cjk.test(own)) return;
        const cs = getComputedStyle(el);
        const size = parseFloat(cs.fontSize);
        const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing);
        const name = el.tagName + (el.className ? '.' + String(el.className).slice(0, 24) : '');
        if (size > 0 && ls / size > 0.1) out.push(`${name} letter-spacing ${(ls / size).toFixed(2)}em`);
        if (cs.fontStyle === 'italic' || cs.fontStyle === 'oblique') out.push(`${name} ${cs.fontStyle}`);
      });
      return [...new Set(out)];
    });
    ok(bad.length === 0, `${spec.id}/ja: tipografia CJK` +
       (bad.length ? ` — ${bad.slice(0, 4).join(' | ')}` : ' adequada'));
  }

  ok(errors.length === 0, `${spec.id}/${lang}: console limpo` +
     (errors.length ? `: ${errors.join(' | ').slice(0, 140)}` : ''));

  await ctx.close();
}

/* O catalogo da KL Sports tem uma regra de negocio que nenhuma checagem de
   traducao enxerga: a tela segue o idioma do visitante, mas a mensagem do
   WhatsApp vai para o celular da equipe, em Minas. Um orcamento em japones,
   com nomes de produto em japones, ninguem ali atenderia — e atender e a unica
   coisa que a pagina faz. Se um dia alguem "terminar de traduzir" o catalogo e
   levar junto a mensagem, e aqui que isso para. */
async function checkQuoteStaysPortuguese(browser, lang) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/kl-sports/?lang=${lang}`, { waitUntil: 'networkidle' });

  const card = page.locator('#anilha-vazada-emborrachada');
  await card.locator('.chip').first().click();
  await card.locator('[data-action="add"]').click();

  const href = await page.locator('#dock-send').getAttribute('href');
  const msg = decodeURIComponent((href.split('text=')[1] || ''));

  ok(msg.includes('Olá, KL Sports Fitness!') && msg.includes('orçamento'),
     `kl/${lang}: mensagem para a equipe em portugues`);
  ok(msg.includes('Anilha Vazada Emborrachada'),
     `kl/${lang}: produto nomeado pelo SKU em portugues`);
  ok(!/[぀-ヿ一-鿿]/.test(msg), `kl/${lang}: mensagem sem japones`);

  // o link compartilhado, esse sim, leva o idioma de quem compartilhou
  const share = await page.locator('.topbar [data-share]').getAttribute('href');
  const shared = decodeURIComponent((share.split('text=')[1] || ''));
  ok(lang === 'pt' ? !/lang=/.test(shared) : shared.includes(`lang=${lang}`),
     `kl/${lang}: link compartilhado carrega o idioma`);

  await ctx.close();
}

/* A escolha do idioma tem de sobreviver a navegacao: o visitante escolhe uma
   vez, na home, e segue o site inteiro sem reescolher a cada clique. */
async function checkPersistence(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await Promise.all([
    page.waitForURL(/lang=ja/, { waitUntil: 'networkidle' }),
    page.selectOption('.i18n-sw select', 'ja')
  ]);
  ok(await page.getAttribute('html', 'lang') === 'ja', 'persistencia: seletor troca a home para japones');

  await page.goto(`http://localhost:${PORT}/tech/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.lang === 'ja', null, { timeout: 4000 })
    .catch(() => {});
  ok(await page.getAttribute('html', 'lang') === 'ja', 'persistencia: /tech/ herda sem parametro na URL');
  await ctx.close();
}

// ---------------------------------------------------------------------------

(async () => {
  const chromium = loadChromium();
  if (!chromium) {
    const msg = 'playwright nao esta instalado — instale com "npm i -D playwright-core" ' +
                'e aponte $CHROME_PATH para um Chrome/Chromium';
    if (IN_CI) { console.error('ERRO: ' + msg); process.exit(1); }
    console.log('AVISO: ' + msg + '\n(fora do CI isto nao falha; a checagem so nao rodou)');
    process.exit(0);
  }

  const executablePath = findBrowserPath();
  console.log(`Navegador: ${executablePath || '(o proprio do playwright)'}`);

  const server = serve();
  await new Promise((r) => server.listen(PORT, r));

  let browser;
  try {
    browser = await chromium.launch(executablePath ? { executablePath } : {});
  } catch (e) {
    server.close();
    const msg = `nao foi possivel abrir o navegador: ${e.message}`;
    if (IN_CI) { console.error('ERRO: ' + msg); process.exit(1); }
    console.log('AVISO: ' + msg + '\n(fora do CI isto nao falha)');
    process.exit(0);
  }

  try {
    for (const spec of PAGES) {
      console.log(`\n--- ${spec.id} (${spec.url}) ---`);
      for (const lang of LANGS) await checkPage(browser, spec, lang);
    }
    console.log('\n--- orcamento da KL Sports chega em portugues ---');
    for (const lang of ['pt', 'en', 'ja']) await checkQuoteStaysPortuguese(browser, lang);
    console.log('\n--- o idioma sobrevive a navegacao ---');
    await checkPersistence(browser);
  } finally {
    await browser.close();
    server.close();
  }

  const total = PAGES.length * LANGS.length;
  console.log(`\n${total} combinacoes de pagina x idioma verificadas`);
  if (failures) {
    console.error(`\nnavegador: FALHOU (${failures} verificacao(oes))`);
    process.exit(1);
  }
  console.log('\nnavegador: sem problemas');
})();
