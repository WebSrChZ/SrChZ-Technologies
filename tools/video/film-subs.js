/* Legendas em pt-BR, tiradas do proprio roteiro.
   O filme nao tem narracao: estas linhas transcrevem o que aparece escrito,
   com o tempo de cada cena. Ficam ao lado do mp4 em .srt em vez de queimadas
   no quadro — seria o mesmo texto duas vezes, e no 9:16 cairiam em cima dos
   chips. Quem quiser queimar usa o comando que esta no README.

   node film-subs.js            escreve ao lado dos mp4 (assets/video)
   VIDEO_OUT=... node film-subs.js
*/
const fs = require('fs');
const path = require('path');

const DIR  = __dirname;
const SITE = process.env.SITE_ROOT || path.join(DIR, '..', '..');
const OUT  = process.env.VIDEO_OUT || path.join(SITE, 'assets', 'video');

const src = fs.readFileSync(path.join(DIR, 'film.html'), 'utf8');
const m = src.match(/const CAPS=(\[[\s\S]*?\]);/);
if (!m) { console.error('ERRO: nao achei CAPS em film.html.'); process.exit(1); }
const CAPS = new Function('return ' + m[1])();

/* 4900 -> 00:00:04,900 */
const stamp = (ms) => {
  const h = Math.floor(ms / 3600000);
  const mi = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  const f = ms % 1000;
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(mi)}:${p(s)},${p(f, 3)}`;
};

const srt = CAPS.map(([a, b, txt], i) =>
  `${i + 1}\n${stamp(a)} --> ${stamp(b)}\n${txt}\n`).join('\n');

fs.mkdirSync(OUT, { recursive: true });
for (const f of ['srchz-order-of-chaos-9x16', 'srchz-order-of-chaos-16x9']) {
  const p = path.join(OUT, `${f}.pt-BR.srt`);
  fs.writeFileSync(p, srt, 'utf8');
  console.log(`  ${p}`);
}
console.log(`  ${CAPS.length} legendas · ${(CAPS[CAPS.length - 1][1] / 1000).toFixed(1)}s`);
