#!/usr/bin/env node
/* Guarda de CI para a traducao do site.
 *
 * O risco real deste desenho: marcar um texto novo com data-i18n numa pagina e
 * esquecer de acrescentar a chave em en/es/ja. O visitante estrangeiro cairia
 * numa pagina meio traduzida, e nada no build avisaria. Este check quebra o PR
 * nesse caso.
 *
 * Verifica:
 *   1. toda chave usada no HTML existe em todos os idiomas
 *   2. os idiomas tem exatamente o mesmo conjunto de chaves entre si
 *   3. _meta completo em cada idioma
 *   4. nenhum valor vazio
 *   5. nenhuma chave orfa (definida e nunca usada)
 *
 * Roda na stdlib do node, sem dependencia. Uso: node tools/check_i18n.js [raiz]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || '.');
const DICT_DIR = path.join(ROOT, 'assets', 'i18n');
const DEFAULT_LANG = 'pt';                 // o HTML ja esta escrito em portugues

let failed = false;
const fail = (msg) => { console.error('ERRO: ' + msg); failed = true; };
const note = (msg) => console.log('  ' + msg);

// ---- 1. varre o HTML atras de chaves -------------------------------------

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.html?$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function walkJs(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJs(full, out);
    else if (/\.js$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const pages = walk(ROOT);
const usedBy = new Map();                  // chave -> [paginas]
const instrumented = [];
const pageIds = new Set();                 // valores de data-i18n-page
const textKeys = new Set();                // chaves escritas via textContent

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const keys = new Set();

  for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]*)"/g)) {
    if (m[1]) keys.add(m[1]);
  }
  // `data-i18n` (sem -html) escreve em textContent: entidade ali sai literal
  for (const m of html.matchAll(/data-i18n="([^"]*)"/g)) {
    if (m[1]) textKeys.add(m[1]);
  }
  for (const m of html.matchAll(/data-i18n-attr="([^"]*)"/g)) {
    for (const pair of m[1].split(';')) {
      const parts = pair.split(':');
      if (parts.length >= 2 && parts[1].trim()) keys.add(parts[1].trim());
    }
  }
  /* Mensagem pronta de um link de WhatsApp. Vive no endereco, nao no texto do
     elemento, entao nenhuma das varreduras acima a alcancaria. O nome e
     `data-i18n-wa` porque o catalogo da KL Sports ja usa `data-wa-msg` para a
     sua mensagem literal em portugues — que, de proposito, nao se traduz. */
  for (const m of html.matchAll(/data-i18n-wa="([^"]+)"/g)) keys.add(m[1]);

  if (!keys.size) continue;
  instrumented.push(rel);
  for (const k of keys) {
    if (!usedBy.has(k)) usedBy.set(k, []);
    usedBy.get(k).push(rel);
  }

  // uma pagina com chaves precisa carregar o motor, senao nada e traduzido
  if (!/assets\/i18n\.js/.test(html)) {
    fail(`${rel} usa data-i18n mas nao carrega assets/i18n.js`);
  }
  /* ...e precisa de um ponto de ancoragem para o seletor, salvo numa pagina
     noindex. Um 404 nao e porta de entrada: o visitante ja chegou com um
     idioma escolhido e o que ele quer ali e sair. Enfiar um seletor no meio
     de um layout centrado de 404 custa mais do que entrega. */
  const noindex = /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html);
  if (!noindex && !/data-i18n-switcher/.test(html)) {
    fail(`${rel} usa data-i18n mas nao tem [data-i18n-switcher] para o seletor`);
  }
  // ...e precisa declarar qual pagina e, para titulo e descricao corretos
  const pid = html.match(/<html[^>]*\sdata-i18n-page="([^"]+)"/);
  if (!pid) {
    fail(`${rel} usa data-i18n mas o <html> nao declara data-i18n-page`);
  } else {
    pageIds.add(pid[1]);
  }
}

/* Chaves pedidas pelo JavaScript via t("chave", "alternativa") — mensagens que
   a pagina gera em tempo de execucao e que nenhum atributo data-i18n alcanca.
   Sem isto a checagem de orfas acusaria essas chaves de nao serem usadas.
   `tr` tambem conta: na calculadora o nome `t` ja e a espessura da peca, entao
   o helper ali se chama `tr`. Chamar o alias de orfa seria o check errando. */
const namespaces = new Map();              // prefixo -> [paginas]

function use(key, rel) {
  if (!usedBy.has(key)) usedBy.set(key, []);
  if (!usedBy.get(key).includes(rel)) usedBy.get(key).push(rel);
}

function collectRuntimeKeys(text, rel) {
  for (const m of text.matchAll(/\b(?:t|tr|fmt)\(\s*["'`]([A-Za-z0-9_.-]+)["'`]/g)) use(m[1], rel);
  /* Chave escolhida por condicao: fmt(n > 1 ? 'a.many' : 'a.one', …). As duas
     pontas sao usadas; so uma aparece por vez. */
  for (const m of text.matchAll(/\b(?:t|tr|fmt)\(\s*[^,;()]*?\?\s*["'`]([A-Za-z0-9_.-]+)["'`]\s*:\s*["'`]([A-Za-z0-9_.-]+)["'`]/g)) {
    use(m[1], rel); use(m[2], rel);
  }
  /* Chave montada em tempo de execucao: t(`kl.p.${slug}.desc`, …). O nome
     exato so existe com o dado em maos, mas o PREFIXO esta no codigo — e e
     ele que o check consegue honrar. Tudo que vive sob um prefixo declarado
     conta como usado; a completude de cada familia e cobrada logo abaixo. */
  for (const m of text.matchAll(/\b(?:t|tr|fmt)\(\s*`([A-Za-z0-9_.-]*?)\$\{/g)) {
    if (!m[1]) continue;
    if (!namespaces.has(m[1])) namespaces.set(m[1], []);
    if (!namespaces.get(m[1]).includes(rel)) namespaces.get(m[1]).push(rel);
  }
}

for (const file of pages) {
  const rel = path.relative(ROOT, file);
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) collectRuntimeKeys(m[1], rel);
}
for (const file of walkJs(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('assets/i18n') || rel.startsWith('tools/')) continue;
  collectRuntimeKeys(fs.readFileSync(file, 'utf8'), rel);
}

/* Produtos do catalogo: cada `slug` do array vira uma familia de chaves que
   o render pede por nome montado. Aqui a familia e cobrada por extenso —
   acrescentar um produto sem traduzi-lo quebra o PR, que e exatamente o
   descuido que o prefixo sozinho deixaria passar. */
const slugs = new Set();
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  if (!/\bkl\.p\./.test(html)) continue;
  for (const m of html.matchAll(/\bslug:\s*'([a-z0-9-]+)'/g)) slugs.add(m[1]);
}

console.log(`Paginas instrumentadas: ${instrumented.length}`);
instrumented.forEach((p) => note(p));
console.log(`Chaves usadas (HTML + JS): ${usedBy.size}`);
if (namespaces.size) {
  console.log(`Prefixos em tempo de execucao: ${[...namespaces.keys()].join(', ')}`);
}
if (slugs.size) console.log(`Produtos no catalogo: ${slugs.size}`);

// ---- 2. carrega os dicionarios -------------------------------------------

if (!fs.existsSync(DICT_DIR)) {
  fail(`pasta de dicionarios ausente: ${path.relative(ROOT, DICT_DIR)}`);
  process.exit(1);
}

global.window = {};
const langs = [];
for (const f of fs.readdirSync(DICT_DIR).sort()) {
  if (!f.endsWith('.js')) continue;
  const code = f.replace(/\.js$/, '');
  try {
    // eslint-disable-next-line no-eval
    eval(fs.readFileSync(path.join(DICT_DIR, f), 'utf8'));
    langs.push(code);
  } catch (e) {
    fail(`${f} nao avaliou: ${e.message}`);
  }
}

const dicts = global.window.SRCHZ_I18N || {};
console.log(`Idiomas encontrados: ${langs.join(', ') || '(nenhum)'}`);

for (const code of langs) {
  if (!dicts[code]) fail(`${code}.js nao define window.SRCHZ_I18N.${code}`);
}
if (langs.includes(DEFAULT_LANG)) {
  note(`aviso: ${DEFAULT_LANG}.js existe mas nao e carregado — o HTML ja esta em ${DEFAULT_LANG}`);
}

// ---- 3. cobertura --------------------------------------------------------

const present = {};
for (const code of langs) {
  present[code] = new Set(Object.keys(dicts[code] || {}).filter((k) => k !== '_meta'));
}

for (const code of langs) {
  const missing = [...usedBy.keys()].filter((k) => !present[code].has(k));
  if (missing.length) {
    fail(`[${code}] ${missing.length} chave(s) do HTML sem traducao:`);
    missing.slice(0, 25).forEach((k) => console.error(`        ${k}   (${usedBy.get(k).join(', ')})`));
    if (missing.length > 25) console.error(`        … e mais ${missing.length - 25}`);
  }
}

// ---- 4. paridade entre idiomas -------------------------------------------

const union = new Set();
for (const code of langs) for (const k of present[code]) union.add(k);
for (const code of langs) {
  const gaps = [...union].filter((k) => !present[code].has(k));
  if (gaps.length) fail(`[${code}] diverge do conjunto comum: ${gaps.slice(0, 15).join(', ')}`);
}

// ---- 5. _meta e valores vazios -------------------------------------------

for (const code of langs) {
  const d = dicts[code] || {};
  const meta = d._meta || {};
  for (const req of ['htmlLang', 'ogLocale']) {
    if (!meta[req]) fail(`[${code}] _meta.${req} ausente`);
  }
  // cada pagina instrumentada precisa do seu proprio titulo e descricao,
  // senao herdaria o rotulo da home no buscador
  for (const pid of pageIds) {
    const pm = (meta.pages || {})[pid];
    if (!pm) { fail(`[${code}] _meta.pages["${pid}"] ausente`); continue; }
    for (const req of ['title', 'description']) {
      if (!pm[req]) fail(`[${code}] _meta.pages["${pid}"].${req} ausente`);
    }
  }
  for (const [k, v] of Object.entries(d)) {
    if (k === '_meta') continue;
    if (typeof v !== 'string' || !v.trim()) fail(`[${code}] valor vazio ou nao-texto: ${k}`);
  }

  /* Entidade HTML num valor aplicado como TEXTO aparece literal na tela.
     `data-i18n` escreve em textContent, que nao decodifica nada — entao
     "Branding &amp; Growth" foi ao ar escrito exatamente assim, com o &amp;
     a vista, em ingles e espanhol, em cinco paginas. Veio de copiar o texto
     do HTML (onde o & PRECISA ser escrito &amp;) para dentro de uma string
     JS, onde ele e so uma sequencia de cinco caracteres.
     Em `data-i18n-html` a entidade e legitima: aquilo passa por innerHTML. */
  for (const [k, v] of Object.entries(d)) {
    if (k === '_meta' || typeof v !== 'string') continue;
    if (!textKeys.has(k)) continue;
    const m = v.match(/&(amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);/i);
    if (m) {
      fail(`[${code}] ${k} e aplicada como texto e traz a entidade "${m[0]}", ` +
           `que apareceria literal na tela: ${JSON.stringify(v.slice(0, 60))}`);
    }
  }
}

// ---- 6. chaves orfas ------------------------------------------------------

const prefixes = [...namespaces.keys()];
const covered = (k) => usedBy.has(k) || prefixes.some((p) => k.startsWith(p));
const orphans = [...union].filter((k) => !covered(k));
if (orphans.length) {
  fail(`${orphans.length} chave(s) definida(s) e nunca usada(s): ${orphans.slice(0, 20).join(', ')}`);
}

// ---- 7. familias de chaves do catalogo -----------------------------------

if (slugs.size) {
  for (const code of langs) {
    const have = present[code];
    const gaps = [];
    for (const slug of slugs) {
      for (const field of ['name', 'finish', 'desc']) {
        const k = `kl.p.${slug}.${field}`;
        if (!have.has(k)) gaps.push(k);
      }
    }
    if (gaps.length) {
      fail(`[${code}] ${gaps.length} chave(s) de produto ausente(s):`);
      gaps.slice(0, 20).forEach((k) => console.error(`        ${k}`));
    }
  }
  // o contrario: traducao sobrando para um produto que saiu do catalogo
  const stale = [...union].filter((k) => {
    const m = k.match(/^kl\.p\.([a-z0-9-]+)\./);
    return m && !slugs.has(m[1]);
  });
  if (stale.length) {
    fail(`${stale.length} chave(s) de produto que nao existe(m) mais: ${stale.slice(0, 10).join(', ')}`);
  }
}

// ---------------------------------------------------------------------------

if (failed) {
  console.error('\ni18n: FALHOU');
  process.exit(1);
}
console.log('\ni18n: sem problemas');
