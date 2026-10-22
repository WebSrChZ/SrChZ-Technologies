/* SrChZ Technologies — /growth/: formulario de diagnostico.
   Navegacao, revelacao ao rolar e contadores ficam em /assets/js/srchz.js,
   comum as paginas de entrada; aqui so o que e desta pagina. */
(() => {
  'use strict';
  /* lead form -> Supabase (insert-only, tabela srchz_leads) */
  const SB_URL = 'https://hhrllexkkbekdbzivlgi.supabase.co';
  const SB_KEY = 'sb_publishable_f3GT1APWArXWS3O04z_S2Q_8FoOjGIF';
  /* Mensagens criadas aqui no JavaScript — data-i18n nao as alcanca. O t() do
     motor traduz; sem dicionario, cai no texto em portugues escrito abaixo. */
  const t = (key, fallback) =>
    (window.SrChZI18n && window.SrChZI18n.t) ? window.SrChZI18n.t(key, fallback) : fallback;

  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    const statusEl = document.getElementById('leadStatus');
    const setStatus = (msg, cls) => { statusEl.textContent = msg; statusEl.className = 'lead-status' + (cls ? ' ' + cls : ''); };
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(leadForm);
      if ((fd.get('website') || '').trim()) return;          // honeypot: provável bot
      const name = (fd.get('name') || '').trim();
      const contact = (fd.get('contact') || '').trim();
      if (!name || contact.length < 3) { setStatus(t('gr.form.errFields','Preencha nome e um contato válido.'), 'err'); return; }
      // O form é novalidate, então o `required` do checkbox não é aplicado pelo
      // navegador — a base legal do envio (consentimento LGPD) é checada aqui.
      if (!fd.get('consent')) {
        setStatus(t('gr.form.errConsent','Marque a autorização de contato para enviar.'), 'err');
        document.getElementById('leadConsent')?.focus();
        return;
      }

      const btn = leadForm.querySelector('.lead-btn');
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = t('gr.form.sending','Enviando…'); setStatus('', '');
      try {
        const res = await fetch(SB_URL + '/rest/v1/srchz_leads', {
          method: 'POST',
          headers: {
            'apikey': SB_KEY,
            'Authorization': 'Bearer ' + SB_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          // Prova de consentimento: as colunas `consent` e `consent_at` existem
          // no banco desde a migracao leads_prova_de_consentimento. Sob LGPD,
          // consentimento que nao da para demonstrar nao se sustenta.
          body: JSON.stringify({
            name, contact,
            segment: (fd.get('segment') || '').trim() || null,
            message: (fd.get('message') || '').trim() || null,
            source: 'srchz-growth',
            consent: true,
            consent_at: new Date().toISOString(),
            user_agent: (navigator.userAgent || '').slice(0, 400)
          })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        leadForm.reset();
        setStatus(t('gr.form.ok','✓ Recebido! Rafael entra em contato em breve.'), 'ok');
      } catch (err) {
        setStatus(t('gr.form.errSend','Não consegui enviar agora. Tente pelo WhatsApp acima.'), 'err');
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });
  }
})();
