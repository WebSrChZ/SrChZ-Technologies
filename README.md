# SrChZ Technologies — Solutions Strategist

Site **guarda-chuva** da **SrChZ Technologies** (CNPJ 68.371.698/0001-95) · *Solutions Strategist*. Hub que apresenta a operação e roteia para cada prática.

> ⚜️ Perception, Strategy &amp; Execution — *solving what most people overlook.*

[![Live](https://img.shields.io/badge/live-srchz--technologies.com.br-c9a24b?style=flat-square&logo=google-chrome&logoColor=white)](https://www.srchz-technologies.com.br)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222?style=flat-square&logo=github&logoColor=white)

Arquitetura **hub-and-spoke**: a raiz é a home guarda-chuva (*Solutions Strategist*) que roteia para as práticas; cada prática vive na sua própria seção/subsite. Domínio próprio com **HTTPS forçado**, sem etapa de build.

## 🔗 Live
**https://www.srchz-technologies.com.br**

## 🧭 Estrutura
```
index.html              Home guarda-chuva — Solutions Strategist (apresentação, método, portas)
assets/                 logo, og.png, favicons, favicon.ico, manifest.webmanifest, ícones PWA 192/512
favicon.ico             ícone de aba (crawlers legados)
404.html · robots.txt · sitemap.xml · CNAME
growth/                 Prática Branding & Growth (one-page premium)
  ├─ index.html          método, planos, Portal do Cliente, caso ITS Power, FAQ, lead form
  ├─ css/ · js/          estilos, animações e main.js (nav, reveal, scroll-spy, count-up, lead)
  ├─ manifest.webmanifest · sw.js   PWA do subsite
  └─ Planos/Planos.GrowthBranding.v2.pdf   proposta para download
kl-sports/              Catálogo digital do cliente KL Sports Fitness (pesos para musculação)
  ├─ index.html          21 produtos, seleção de pesos e orçamento enviado pelo WhatsApp
  └─ assets/             fotos dos produtos, logos, capa e og.jpg (prévia do link no WhatsApp)
```
As **portas** da home levam a: **Branding &amp; Growth** (`/growth/`), **Engenharia &amp; END** (hub do livro *Ultrassom Nível II*, publicado na Amazon) e **Tecnologia &amp; Dados/IA** (em breve).

## ✨ Destaques
- **Design** preto / branco / dourado (Cormorant Garamond + Inter), responsivo mobile-first, reveal on-scroll.
- **Acessibilidade**: skip-link, foco visível, hierarquia de headings, ARIA, `prefers-reduced-motion`.
- **SEO**: Open Graph / Twitter Card (imagem absoluta), canonical, `sitemap.xml`, `robots.txt` e **JSON-LD** consolidado — a `Organization` (com `legalName` e `taxID`) é declarada uma vez na home sob o `@id` `/#organization`, e as outras seções a referenciam por esse `@id` em vez de repetir um nó solto.
- **PWA-ready**: `manifest.webmanifest`, ícones 192/512, `favicon.ico`, `theme-color`.
- **Captura de lead** (no growth): formulário → **Supabase** (`srchz_leads`, RLS insert-only, honeypot).
- **Zero dependências de build** — HTML, CSS e JavaScript vanilla.

## ✅ Verificação antes do merge

O deploy é o próprio repositório: o que entra na `main` vai ao ar. O workflow
`.github/workflows/pr-checks.yml` roda em todo PR, em três camadas.

**1. Estrutura — `tools/check_site.py`** (só stdlib do Python)
HTML malformado, JSON-LD inválido (o Google descarta o bloco em silêncio),
XML/manifest inválido, link ou asset interno apontando para arquivo
inexistente, página sem `<meta name="description">`. Também exige o bump do
`CACHE` em `growth/sw.js` quando `growth/` muda, senão visitantes recorrentes
continuam na versão antiga. Mais `node --check` em todo JavaScript.

**2. Tradução — `tools/check_i18n.js`** (só stdlib do Node)
Chave usada no HTML que falta em algum idioma, idiomas que divergiram entre si,
página que usa `data-i18n` sem carregar o motor / sem `[data-i18n-switcher]` /
sem `data-i18n-page`, `_meta.pages` sem título ou descrição, chave órfã. No
catálogo da KL Sports, onde as chaves são montadas em tempo de execução, exige
`name`, `finish` e `desc` nos três idiomas para **todo** `slug` do array — e
reclama de tradução sobrando para produto que saiu do catálogo.

**3. O que só o navegador vê — `tools/check_i18n_browser.js`**
As duas camadas acima leem arquivos, e a classe de defeito que mais apareceu na
tradução passa ilesa por elas: a chave existe, o texto está certo, e mesmo
assim o visitante não consegue usar a página. Foi assim que *"Idioma /
Language"* ficou **escrito na barra de navegação** de quatro páginas, que o
seletor do USN2 ficou parado 156px acima da área visível dentro de uma gaveta
fechada, e que a calculadora passou a vida com o menu inalcançável no celular.
Esta camada abre as 11 páginas nos 4 idiomas e mede: idioma do `<html>`, título
por página, corpo revelado, propagação de `?lang=` nos links, zero scroll
lateral a 390px, **seletor que o dedo alcança de fato** (centro dentro da
viewport + hit-test, não só a caixa), rótulo do seletor que não é desenhado,
tipografia CJK sem espaçamento latino nem itálico sintetizado, e console limpo.
Mais a regra de negócio do catálogo: **a tela segue o idioma do visitante, mas
o orçamento chega à equipe em português**, com o SKU que ela reconhece.

Localmente:

```bash
python3 tools/check_site.py .
node tools/check_i18n.js .

# a camada de navegador precisa do playwright e de um Chrome/Chromium:
npm i --no-save playwright-core
node tools/check_i18n_browser.js .        # use $CHROME_PATH se não achar sozinho
```

Sem playwright instalado, a terceira camada avisa e sai com 0 — para não travar
quem só quer corrigir um texto. Dentro do CI, o mesmo caso é **erro**: um check
que silenciosamente deixa de rodar não está protegendo nada.

## 🚀 Rodar localmente
```bash
python -m http.server 8080
# abra http://localhost:8080
```
Estático puro. **Deploy:** push na `main` → GitHub Pages publica em ~1 min (domínio próprio via `CNAME`).

## 🛠 Stack
`HTML5` · `CSS3` · `JavaScript (vanilla)` · `Supabase` · `GitHub Pages`

## 📬 Contato
**rafaelhenriquecsantosz@gmail.com** · [WhatsApp](https://wa.me/5511996869309)

---
<sub>© SrChZ Technologies · CNPJ 68.371.698/0001-95 — *Sua definição de qualidade.*</sub>
