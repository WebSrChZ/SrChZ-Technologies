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

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const keys = new Set();

  for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]*)"/g)) {
    if (m[1]) keys.add(m[1]);
  }
  for (const m of html.matchAll(/data-i18n-attr="([^"]*)"/g)) {
    for (const pair of m[1].split(';')) {
      const parts = pair.split(':');
      if (parts.length >= 2 && parts[1].trim()) keys.add(parts[1].trim());
    }
  }

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
function collectRuntimeKeys(text, rel) {
  for (const m of text.matchAll(/\b(?:t|tr)\(\s*["'`]([A-Za-z0-9_.-]+)["'`]/g)) {
    if (!usedBy.has(m[1])) usedBy.set(m[1], []);
    if (!usedBy.get(m[1]).includes(rel)) usedBy.get(m[1]).push(rel);
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

console.log(`Paginas instrumentadas: ${instrumented.length}`);
instrumented.forEach((p) => note(p));
console.log(`Chaves usadas (HTML + JS): ${usedBy.size}`);

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
}

// ---- 6. chaves orfas ------------------------------------------------------

const orphans = [...union].filter((k) => !usedBy.has(k));
if (orphans.length) {
  fail(`${orphans.length} chave(s) definida(s) e nunca usada(s): ${orphans.slice(0, 20).join(', ')}`);
}

// ---------------------------------------------------------------------------

if (failed) {
  console.error('\ni18n: FALHOU');
  process.exit(1);
}
console.log('\ni18n: sem problemas');
