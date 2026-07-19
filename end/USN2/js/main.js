/* ===== SrChZ — Guia Ultrassom N2 · interações ===== */

/* ---- CONFIG: preencha ao publicar os produtos ---- */
const CONFIG = {
  whatsappUrl: "https://wa.link/348mbv",             // link direto do WhatsApp (wa.link)
  buy: {
    livro: "https://pay.kiwify.com.br/Qh8ofcQ",      // Kiwify — Livro R$29,90
    kit:   "https://pay.kiwify.com.br/z5Ac6OJ",      // Kiwify — Kit Aprovação R$197
    vip:   ""                                        // VIP → cai no WhatsApp (venda assistida)
  },
  leadEndpoint: "",                // Brevo (a configurar)
  iscaFile: "downloads/isca-formulario-calibracao-ut.pdf"
};
const WA_MSG = {
  livro: "Olá! Quero comprar o Guia Ultrassom Nível II (R$29,90).",
  kit:   "Olá! Quero o Kit Aprovação de Ultrassom Nível II (R$197).",
  vip:   "Olá! Quero entrar no VIP · Aprovação Assistida (R$497)."
};

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
    else { location.hash = "#isca"; alert("Checkout em configuração. Deixe seu e-mail que avisamos o lançamento e enviamos a amostra grátis!"); }
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
    alert("Preencha nome e um e-mail válido.");
    return;
  }
  // 1) salva o lead (se houver endpoint configurado)
  if (CONFIG.leadEndpoint) {
    try {
      await fetch(CONFIG.leadEndpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, produto: "isca-ultrassom-n2", origem: location.href })
      });
    } catch (_) { /* segue mesmo se falhar — não bloqueia o download */ }
  }
  // backup local
  try { localStorage.setItem("srchz_lead", JSON.stringify({ ...data, ts: Date.now() })); } catch (_) {}

  // 2) entrega a amostra
  const a = document.createElement("a");
  a.href = CONFIG.iscaFile; a.download = "";
  document.body.appendChild(a); a.click(); a.remove();

  // 3) feedback
  ok.hidden = false;
  form.querySelector('button[type="submit"]').textContent = "Enviado ✓";
});
