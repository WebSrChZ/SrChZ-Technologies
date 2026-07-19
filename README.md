# SrChZ Technologies — Solutions Strategist

Site **guarda-chuva** de **Rafael Cordeiro** · *Solutions Strategist*. Hub que apresenta o Rafael e roteia para cada prática.

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
```
As **portas** da home levam a: **Branding &amp; Growth** (`/growth/`), **Engenharia &amp; END** (hub do livro *Ultrassom Nível II*, publicado na Amazon) e **Tecnologia &amp; Dados/IA** (em breve).

## ✨ Destaques
- **Design** preto / branco / dourado (Cormorant Garamond + Inter), responsivo mobile-first, reveal on-scroll.
- **Acessibilidade**: skip-link, foco visível, hierarquia de headings, ARIA, `prefers-reduced-motion`.
- **SEO**: Open Graph / Twitter Card (imagem absoluta), canonical, `sitemap.xml`, `robots.txt` e **JSON-LD** (`Person` na home; `ProfessionalService` + `FAQPage` no growth).
- **PWA-ready**: `manifest.webmanifest`, ícones 192/512, `favicon.ico`, `theme-color`.
- **Captura de lead** (no growth): formulário → **Supabase** (`srchz_leads`, RLS insert-only, honeypot).
- **Zero dependências de build** — HTML, CSS e JavaScript vanilla.

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
<sub>© Rafael Cordeiro · SrChZ Technologies — *Sua definição de qualidade.*</sub>
