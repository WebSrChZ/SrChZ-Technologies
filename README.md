# SrChZ Technologies — Growth &amp; Branding

Site institucional de **Rafael Cordeiro** · *Growth &amp; Branding Strategist*.

> ⚜️ Perception, Strategy &amp; Execution — *solving what most people overlook.*

[![Live](https://img.shields.io/badge/live-websrchz.github.io-c9a24b?style=flat-square&logo=google-chrome&logoColor=white)](https://websrchz.github.io/SrChZ-Technologies/)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222?style=flat-square&logo=github&logoColor=white)

Landing one-page premium que apresenta o modelo de operação (**Engenharia · Psicanálise · Estética High-End**), os planos de serviço, o diferencial de **Portal do Cliente** próprio, um **caso real** e captura de leads — tudo sem etapa de build.

## 🔗 Live
**https://websrchz.github.io/SrChZ-Technologies/**

## 🧭 Seções
Hero → **Método** (3 pilares) → **Planos** (4 níveis) → **Portal do Cliente** (mockup + stats animadas) → **Casos** (ITS Power) → **FAQ** → **Contato** (CTA + formulário de lead).

## ✨ Destaques
- **Design** preto / branco / dourado, responsivo mobile-first, com microinterações e reveal on-scroll.
- **Acessibilidade**: navegação por teclado, foco visível, `prefers-reduced-motion`, contraste alto, skip-link, ARIA e FAQ em `<details>` nativo.
- **SEO**: meta tags, Open Graph / Twitter Card, canonical, `sitemap.xml`, `robots.txt` e **JSON-LD** — `ProfessionalService` + `FAQPage` (elegível a *rich results*).
- **Performance / CWV**: `preload` + `fetchpriority` do LCP, dimensões explícitas de imagem (anti-CLS), JS leve com `IntersectionObserver`.
- **Captura de lead**: formulário → **Supabase** (tabela `srchz_leads`, RLS *insert-only*, honeypot anti-bot) com alerta opcional por e-mail (Edge Function + Resend).
- **PWA-ready**: `manifest.webmanifest`, favicons e `theme-color`.
- **Zero dependências de build** — HTML, CSS e um `main.js` em JavaScript vanilla.

## 🗂 Estrutura
```
index.html              página principal (one-page)
404.html                página de erro
css/styles.css          estilos, responsividade e animações
js/main.js              nav, menu mobile, reveal, scroll-spy, count-up, lead form
assets/                 logos (logo-icon/mark/lockup), favicons, og.png, case-itspower.jpg
manifest.webmanifest    PWA
robots.txt · sitemap.xml
Planos.GrowthBranding.v2.pdf   proposta para download
```

## 🚀 Rodar localmente
```bash
python -m http.server 8080
# abra http://localhost:8080
```
Estático puro — qualquer servidor de arquivos serve. **Deploy:** push na `main` → GitHub Pages publica em ~1 min.

## 🛠 Stack
`HTML5` · `CSS3` · `JavaScript (vanilla)` · `Supabase` · `GitHub Pages`

## 📬 Contato
**rafaelhenriquecsantosz@gmail.com** · Cláudio, MG · [WhatsApp](https://wa.me/5511996869309)

---
<sub>© Rafael Cordeiro · SrChZ Technologies — *Sua definição de qualidade.*</sub>
