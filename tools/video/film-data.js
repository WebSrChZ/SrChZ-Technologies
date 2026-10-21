/* Imprime, em JSON, o que o roteiro calcula: duracao, BPM, marcas de som e
   legendas. Existe porque CUES deixou de ser uma tabela escrita a mao e
   passou a sair da lista de planos — ler isso com expressao regular seria
   refazer a conta do outro lado e abrir espaco para os dois lados
   divergirem. Aqui o valor vem da propria pagina.

   node film-data.js            > dados.json
   (film-audio.py chama sozinho; nao precisa rodar na mao) */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const PORT = 8937;

const server = http.createServer((q, r) => {
  const rel = decodeURIComponent(q.url.split('?')[0]);
  const f = path.join(DIR, rel === '/' ? 'film.html' : rel);
  if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    r.writeHead(404); r.end('404'); return;
  }
  r.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
  fs.createReadStream(f).pipe(r);
});

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  /* sem esperar por window.ready(): as capturas nao importam para os dados,
     e exigi-las aqui amarraria o audio a ter as imagens prontas */
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  const data = await page.evaluate(() => ({
    DUR: window.DUR, BPM: window.BPM, CUES: window.CUES, CAPS: window.CAPS,
    SHOTS: window.SHOTS.length
  }));
  await browser.close();
  server.close();
  process.stdout.write(JSON.stringify(data));
})();
