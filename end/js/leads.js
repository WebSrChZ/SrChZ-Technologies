/* Pedido de inspeção -> Supabase (insert-only na tabela srchz_leads).
 *
 * Mesmo caminho do formulário do /growth/, com três diferenças:
 *   - `source: 'srchz-end'`, para separar lead de inspeção de lead de growth
 *     na mesma tabela;
 *   - `segment` carrega componente e norma, que é o que qualifica o pedido;
 *   - grava a prova de consentimento, que as colunas `consent`/`consent_at`
 *     agora suportam.
 *
 * A chave abaixo é publicável por natureza: está neste arquivo e no DevTools de
 * quem abrir a página. Ela não protege nada — o que protege é a RLS da tabela,
 * que só permite INSERT (`select`, `update` e `delete` foram revogados de
 * `anon`). Ou seja: dá para enviar um lead, não dá para ler a base de leads.
 */
(function () {
  'use strict';

  var SB_URL = 'https://hhrllexkkbekdbzivlgi.supabase.co';
  var SB_KEY = 'sb_publishable_f3GT1APWArXWS3O04z_S2Q_8FoOjGIF';

  var form = document.getElementById('inspForm');
  if (!form) return;

  var statusEl = document.getElementById('inspStatus');
  /* Mensagens criadas aqui no JavaScript — data-i18n nao as alcanca. O t() do
     motor traduz; sem dicionario, cai no texto em portugues escrito abaixo. */
  function t(key, fallback) {
    return (window.SrChZI18n && window.SrChZI18n.t) ? window.SrChZI18n.t(key, fallback) : fallback;
  }

  function setStatus(msg, cls) {
    statusEl.textContent = msg;
    statusEl.className = 'insp-status' + (cls ? ' ' + cls : '');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);

    if ((fd.get('website') || '').trim()) return;   // honeypot: provável bot

    var name = (fd.get('name') || '').trim();
    var contact = (fd.get('contact') || '').trim();
    if (!name || contact.length < 3) {
      setStatus(t('end.form.errFields','Preencha nome e um contato válido.'), 'err');
      return;
    }

    // O form é `novalidate`, então o `required` do checkbox não é aplicado pelo
    // navegador. A base legal do envio é checada aqui, antes de qualquer fetch.
    if (!fd.get('consent')) {
      setStatus(t('end.form.errConsent','Marque a autorização de contato para enviar.'), 'err');
      var cb = document.getElementById('inspConsent');
      if (cb) cb.focus();
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    setStatus(t('end.form.sending','Enviando…'));

    try {
      var res = await fetch(SB_URL + '/rest/v1/srchz_leads', {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: name,
          contact: contact,
          segment: (fd.get('segment') || '').trim() || null,
          message: (fd.get('message') || '').trim() || null,
          source: 'srchz-end',
          consent: true,
          consent_at: new Date().toISOString(),
          user_agent: navigator.userAgent
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      setStatus(t('end.form.ok','Recebido. Retorno com escopo, método e prazo.'), 'ok');
    } catch (err) {
      console.error('[end/leads]', err);
      setStatus(t('end.form.errSend','Não consegui enviar agora. Me chame no WhatsApp acima.'), 'err');
    } finally {
      if (btn) btn.disabled = false;
    }
  });
})();
