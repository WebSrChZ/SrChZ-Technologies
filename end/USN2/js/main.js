/* ===== SrChZ — Guia Ultrassom N2 · interações ===== */

/* ---- CONFIG: preencha ao publicar os produtos ---- */
const CONFIG = {
  whatsappUrl: "https://wa.link/348mbv",             // link direto do WhatsApp (wa.link)
  buy: {
    livro: "https://pay.kiwify.com.br/Qh8ofcQ",      // Kiwify — Livro R$29,90
    kit:   "https://pay.kiwify.com.br/z5Ac6OJ",      // Kiwify — Kit Aprovação R$197
    vip:   ""                                        // VIP → cai no WhatsApp (venda assistida)
  },
  // Captura de lead da isca. A chave e publicavel por natureza: fica neste
  // arquivo e no DevTools de quem abrir a pagina. O que protege a base e a RLS
  // insert-only da tabela, nao a chave.
  leads: {
    url: "https://hhrllexkkbekdbzivlgi.supabase.co",
    key: "sb_publishable_f3GT1APWArXWS3O04z_S2Q_8FoOjGIF"
  },
  iscaFile: "downloads/isca-formulario-calibracao-ut.pdf"
};
const WA_MSG = {
  livro: "Olá! Quero comprar o Guia Ultrassom Nível II (R$29,90).",
  kit:   "Olá! Quero o Kit Aprovação de Ultrassom Nível II (R$197).",
  vip:   "Olá! Quero entrar no VIP · Aprovação Assistida (R$497)."
};

/* Mensagens criadas aqui no JavaScript — data-i18n nao as alcanca. O t() do
   motor traduz; sem dicionario, cai no texto em portugues escrito abaixo. */
function t(key, fallback) {
  return (window.SrChZI18n && window.SrChZI18n.t) ? window.SrChZI18n.t(key, fallback) : fallback;
}

/* ---- ano no rodapé ---- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---- nav: sombra ao rolar + menu mobile ---- */
const nav = document.getElementById("nav");
const navLinks = document.getElementById("navLinks");
const navToggle = document.getElementById("navToggle");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 24), { passive: true });
navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => navLinks.classList.remove("open")));

/* ---- reveal on scroll ---- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.14 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* ---- WhatsApp helper ---- */
function waLink(msgKey) {
  return CONFIG.whatsappUrl || null;
}

/* ---- botão flutuante WhatsApp ---- */
const wa = document.getElementById("waFloat");
if (CONFIG.whatsappUrl) { wa.href = CONFIG.whatsappUrl; wa.hidden = false; }

/* ---- botões de compra ---- */
document.querySelectorAll(".plan__buy").forEach(btn => {
  btn.addEventListener("click", (ev) => {
    const which = btn.dataset.buy;                 // livro | kit | vip
    const url = CONFIG.buy[which];
    if (url) { return; }                            // link real preenchido → segue o href (troque abaixo)
    ev.preventDefault();
    const w = waLink(which);
    if (w) { window.open(w, "_blank", "noopener"); }
    else { location.hash = "#isca"; alert(t("u.js.checkout","Checkout em configuração. Deixe seu e-mail que avisamos o lançamento e enviamos a amostra grátis!")); }
  });
  // se houver URL real, aplica no href
  const which = btn.dataset.buy;
  if (CONFIG.buy[which]) btn.setAttribute("href", CONFIG.buy[which]);
});

/* ---- formulário de captura (lead) ---- */
const form = document.getElementById("leadForm");
const ok = document.getElementById("leadOk");
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.nome || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    alert(t("u.js.errFields","Preencha nome e um e-mail válido."));
    return;
  }
  // A base legal do envio e o consentimento. O form e `novalidate`, entao o
  // `required` do checkbox nao e aplicado pelo navegador: checa aqui.
  if (!data.consent) {
    alert(t("u.js.errConsent","Marque a autorização de contato para receber a amostra."));
    return;
  }

  // 1) salva o lead. Antes daqui o `leadEndpoint` estava vazio e o lead era
  //    simplesmente descartado: a isca entregava o PDF e nao capturava nada.
  //    Vai para a mesma tabela dos outros formularios do site, com `source`
  //    separando a origem. A chave e publicavel e a RLS da tabela e
  //    insert-only, entao da para enviar e nao da para ler a base.
  try {
    await fetch(CONFIG.leads.url + "/rest/v1/srchz_leads", {
      method: "POST",
      headers: {
        "apikey": CONFIG.leads.key,
        "Authorization": "Bearer " + CONFIG.leads.key,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        name: data.nome,
        contact: data.email,
        segment: "isca-ultrassom-n2",
        message: data.whatsapp ? "WhatsApp: " + data.whatsapp : null,
        source: "srchz-usn2",
        consent: true,
        consent_at: new Date().toISOString(),
        user_agent: (navigator.userAgent || "").slice(0, 400)
      })
    });
  } catch (_) { /* segue mesmo se falhar — nao bloqueia o download prometido */ }

  // 2) entrega a amostra
  const a = document.createElement("a");
  a.href = CONFIG.iscaFile; a.download = "";
  document.body.appendChild(a); a.click(); a.remove();

  // 3) feedback
  ok.hidden = false;
  form.querySelector('button[type="submit"]').textContent = t("u.js.sent","Enviado ✓");
});
