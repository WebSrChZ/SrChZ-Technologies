/* ============================================================================
   SrChZ Technologies — i18n
   ----------------------------------------------------------------------------
   Por que assim, e nao com uma pasta por idioma:

   O site e estatico no GitHub Pages, sem etapa de build. Duplicar 11 paginas
   em 4 idiomas daria 44 arquivos para manter em sincronia a mao, e eles
   divergiriam na primeira correcao de texto. Aqui cada pagina tem uma fonte
   unica e os idiomas vivem em `assets/i18n/<lang>.js`.

   Os dicionarios sao carregados como <script>, nao via fetch: algumas paginas
   do site declaram `connect-src 'none'` na CSP, o que bloquearia fetch, mas
   todas permitem `script-src 'self'`. Carregar como script funciona sob a CSP
   que ja esta publicada, sem afrouxar nada.

   O idioma e resolvido nesta ordem:
     1. ?lang= na URL   (permite link direto e indexacao por hreflang)
     2. localStorage    (a escolha do visitante persiste entre paginas)
     3. navigator.language
     4. pt (padrao, que e o que esta escrito no HTML)

   Para o visitante em portugues nao ha custo nenhum: o HTML ja esta em
   portugues, nenhum dicionario e baixado e nada e reescrito.

   Como marcar texto no HTML:
     data-i18n="chave"              -> troca textContent
     data-i18n-html="chave"         -> troca innerHTML (para texto com <b>, <a>)
     data-i18n-attr="attr:chave;…"  -> troca atributos (placeholder, aria-label…)
   ========================================================================== */
(function () {
  'use strict';

  /* `short` e o que aparece no seletor fechado, e por isso define a largura dele.
     Rotulo longo ("PT · Português") empurrava o <select> para 133px e estourava
     a barra de navegacao em tela de telefone — medido em 390px. Codigo curto
     resolve e combina melhor com a navegacao minimalista do site. O japones usa
     o proprio endonimo, que e curto e dispensa saber o que "JA" significa. */
  var LANGS = {
    pt: { label: 'Português', short: 'PT',    htmlLang: 'pt-BR', ogLocale: 'pt_BR' },
    en: { label: 'English',   short: 'EN',    htmlLang: 'en',    ogLocale: 'en_US' },
    es: { label: 'Español',   short: 'ES',    htmlLang: 'es',    ogLocale: 'es_ES' },
    ja: { label: '日本語',     short: '日本語', htmlLang: 'ja',    ogLocale: 'ja_JP' }
  };
  var DEFAULT = 'pt';
  var STORE_KEY = 'srchz.lang';
  var html = document.documentElement;

  /* Base das URLs de dicionario, derivada do src deste proprio script. Resolve
     a profundidade da pagina (/, /end/, /end/USN2/) sem configuracao manual. */
  var BASE = (function () {
    var s = document.currentScript;
    if (s && s.src) return s.src.replace(/[^/]+$/, '');
    return 'assets/';
  })();

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* modo privado: segue sem persistir */ }
  }

  function fromQuery() {
    var m = /[?&]lang=([a-zA-Z-]+)/.exec(location.search);
    return m ? m[1].toLowerCase().slice(0, 2) : null;
  }

  function fromNavigator() {
    var list = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i]).toLowerCase().slice(0, 2);
      if (LANGS[code]) return code;
    }
    return null;
  }

  function resolve() {
    var q = fromQuery();
    if (q && LANGS[q]) { write(STORE_KEY, q); return q; }
    var stored = read(STORE_KEY);
    if (stored && LANGS[stored]) return stored;
    var nav = fromNavigator();
    if (nav) return nav;
    return DEFAULT;
  }

  var current = resolve();

  /* ---- CSS do componente e ajustes tipograficos --------------------------
     Injetado aqui para que cada pagina precise apenas da tag <script>: nada
     de switcher duplicado em 11 arquivos de HTML.

     O bloco `ja` troca a familia de fontes porque Cormorant Garamond nao tem
     glifo CJK — sem isso o japones cai num fallback qualquer do sistema e o
     texto perde o alinhamento com o resto do desenho. Nao carrego webfont
     japonesa de proposito: Noto Sans JP passa de 1 MB e destruiria o
     carregamento para ganhar pouco. A pilha abaixo usa o que o sistema do
     visitante japones ja tem instalado. */
  var css = ''
    + 'html.i18n-pending body{visibility:hidden}'
    + '.i18n-sw{position:relative;display:inline-flex;align-items:center}'
    /* O rotulo e so para leitor de tela. Ele nascia com class="sr-only"
       contando que a pagina definisse essa classe — e metade das paginas nao
       define, entao "Idioma / Language" aparecia escrito na barra de navegacao
       e ainda empurrava o seletor para fora da tela no telefone. Quem cria o
       elemento e este arquivo, entao a regra mora aqui, escopada em .i18n-sw
       para nao brigar com o .sr-only das paginas que ja tem o seu. */
    + '.i18n-sw .sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;'
    + 'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}'
    + '.i18n-sw select{appearance:none;-webkit-appearance:none;background:transparent;'
    + 'border:1px solid rgba(201,162,75,.3);color:#cfc7b6;font:inherit;font-size:.82rem;'
    + 'font-weight:500;padding:.38rem 1.7rem .38rem .66rem;border-radius:999px;cursor:pointer;'
    + 'line-height:1.2;transition:border-color .2s,color .2s}'
    + '.i18n-sw select:hover,.i18n-sw select:focus{border-color:#c9a24b;color:#ead29a;outline:none}'
    + '.i18n-sw select option{background:#111113;color:#f6f2e9}'
    + '.i18n-sw::after{content:"";position:absolute;right:.62rem;top:50%;width:.36rem;height:.36rem;'
    + 'border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;color:#8c8675;'
    + 'transform:translateY(-70%) rotate(45deg);pointer-events:none}'
    + '.i18n-sw:hover::after{color:#ead29a}'
    /* telefone: aperta o seletor para disputar menos espaco com a navegacao */
    + '@media(max-width:720px){.i18n-sw select{font-size:.78rem;padding:.34rem 1.5rem .34rem .56rem}}'
    /* japones: pilha CJK do sistema + respiro de linha maior, que texto
       japones exige para nao ficar apertado */
    + 'html[lang="ja"]{--serif:"Hiragino Mincho ProN","Yu Mincho",YuMincho,"Noto Serif JP","Source Han Serif JP",serif;'
    + '--sans:"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic",YuGothic,Meiryo,"Noto Sans JP",sans-serif}'
    + 'html[lang="ja"] body{line-height:1.85;font-weight:400}'
    + 'html[lang="ja"] h1,html[lang="ja"] h2,html[lang="ja"] h3{line-height:1.4;letter-spacing:.01em}'
    /* Japones nao tem italico. Nao existindo o desenho inclinado na fonte, o
       navegador sintetiza um — inclina o glifo a forca — e kanji tombado fica
       simplesmente errado. Vale para <em>/<i> e para todo seletor do site que
       pede italico por estilo. */
    + 'html[lang="ja"] :is(em,i,.case-quote,.hero-line,.hero-sign,.hero-title,'
    + '.hero__lead,.pull){font-style:normal}'
    /* quebra de linha adequada a CJK */
    + 'html[lang="ja"] p,html[lang="ja"] li,html[lang="ja"] h1,html[lang="ja"] h2,'
    + 'html[lang="ja"] h3{line-break:strict;overflow-wrap:break-word}'
    /* O espacamento largo de letras e um recurso tipografico latino: em texto
       japones ele so afasta os kana e atrapalha a leitura. A lista abaixo e
       todo seletor do site com letter-spacing >= .14em — as duas convencoes de
       nome convivem (.hero-kicker na home, .hero__kicker no /tech/), entao
       ambas precisam estar aqui, senao o ajuste passa longe da pagina errada. */
    + 'html[lang="ja"] :is(.badge,.book__eyebrow,.case-deliver-h,.channel__fmt,'
    + '.contact small,.door .d-n,.eyebrow,.footer-brand p,.hero-disc li,'
    + '.cat-count,.hero-kicker,.hero-title .line,.hero-title,.hero__kicker,'
    + '.hero__sub,.lead-or,.plan-badge,.plan-sub,.plan__ribbon,.portal-tag,'
    + '.proof__tag,.q-phone legend,.r-label,.sharebox label,.spec-label,'
    + '.step-k,.trail__tag,.card-k,.card-tag){letter-spacing:.06em}';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  (document.head || html).appendChild(styleEl);

  /* Esconde o corpo so quando ha traducao pendente. Em portugues a pagina
     pinta normalmente, sem penalidade alguma. */
  if (current !== DEFAULT) html.classList.add('i18n-pending');

  function reveal() { html.classList.remove('i18n-pending'); }

  /* Rede de seguranca: se o dicionario nao chegar, o conteudo aparece em
     portugues em vez de ficar invisivel. Pagina em idioma errado e ruim;
     pagina em branco e pior. */
  setTimeout(reveal, 1500);

  // ---- aplicacao -----------------------------------------------------------

  function lookup(dict, key) {
    return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : null;
  }

  function applyNodes(dict) {
    var missing = [];

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = lookup(dict, el.getAttribute('data-i18n'));
      if (v === null) { missing.push(el.getAttribute('data-i18n')); return; }
      el.textContent = v;
    });

    /* innerHTML aqui recebe apenas conteudo dos dicionarios deste repositorio
       — texto autoral, nunca entrada de usuario. */
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = lookup(dict, el.getAttribute('data-i18n-html'));
      if (v === null) { missing.push(el.getAttribute('data-i18n-html')); return; }
      el.innerHTML = v;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        if (!pair.trim()) return;
        var parts = pair.split(':');
        if (parts.length < 2) return;
        var attr = parts[0].trim();
        var v = lookup(dict, parts[1].trim());
        if (v === null) { missing.push(parts[1].trim()); return; }
        el.setAttribute(attr, v);
      });
    });

    if (missing.length && window.console && console.warn) {
      console.warn('[i18n] chaves ausentes em "' + current + '":', missing);
    }
  }

  /* Titulo e descricao sao por pagina, nao por idioma: cada pagina declara sua
     identidade em <html data-i18n-page="…"> e o dicionario guarda um bloco por
     pagina em _meta.pages. Sem isso toda pagina herdaria o titulo da home, que
     e pior do que nao traduzir — o buscador mostraria o rotulo errado. */
  function applyMeta(dict) {
    var meta = dict._meta || {};
    var pageId = html.getAttribute('data-i18n-page') || 'home';
    var pm = (meta.pages && meta.pages[pageId]) || {};

    html.setAttribute('lang', meta.htmlLang || LANGS[current].htmlLang);

    if (pm.title) {
      document.title = pm.title;
      setProp('meta[property="og:title"]', 'content', pm.ogTitle || pm.title);
      setProp('meta[name="twitter:title"]', 'content', pm.ogTitle || pm.title);
    } else if (window.console && console.warn) {
      console.warn('[i18n] sem _meta.pages["' + pageId + '"] em "' + current + '"');
    }
    if (pm.description) {
      setProp('meta[name="description"]', 'content', pm.description);
      setProp('meta[property="og:description"]', 'content', pm.description);
      setProp('meta[name="twitter:description"]', 'content', pm.description);
    }
    setProp('meta[property="og:locale"]', 'content', meta.ogLocale || LANGS[current].ogLocale);
  }

  function setProp(sel, attr, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  }

  /* Mantem o idioma ao navegar entre paginas. O localStorage ja resolveria,
     mas carregar o parametro deixa o link compartilhavel e faz com que o
     buscador enxergue as versoes por idioma. Links externos, downloads,
     mailto:, tel:, wa.me e ancoras puras ficam intactos. */
  function propagateLang() {
    if (current === DEFAULT) return;
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
      if (a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (e) { return; }
      if (url.origin !== location.origin) return;
      if (!/\.(html?)$|\/$/.test(url.pathname)) return;   // nao mexe em pdf, imagem etc.
      /* Link que ja declara um idioma foi escrito de proposito — o aviso de
         idioma prevalente na politica de privacidade aponta para a versao em
         portugues, e sobrescrever isso o mandaria de volta para a traducao. */
      if (url.searchParams.has('lang')) return;
      url.searchParams.set('lang', current);
      a.setAttribute('href', url.pathname + url.search + url.hash);
    });
  }

  // ---- seletor de idioma ---------------------------------------------------

  function buildSwitcher() {
    var hosts = document.querySelectorAll('[data-i18n-switcher]');
    if (!hosts.length) return;

    hosts.forEach(function (host) {
      if (host.querySelector('select')) return;          // idempotente
      var wrap = document.createElement('div');
      wrap.className = 'i18n-sw';

      var label = document.createElement('label');
      label.className = 'sr-only';
      label.setAttribute('for', 'i18n-select-' + Math.random().toString(36).slice(2, 7));
      label.textContent = 'Idioma / Language';

      var sel = document.createElement('select');
      sel.id = label.getAttribute('for');
      sel.setAttribute('aria-label', 'Idioma / Language');

      Object.keys(LANGS).forEach(function (code) {
        var o = document.createElement('option');
        o.value = code;
        o.textContent = LANGS[code].short;
        /* Nome completo no title: o seletor fechado fica compacto, e quem
           passa o mouse ou usa leitor de tela recebe o nome do idioma. */
        o.title = LANGS[code].label;
        if (code === current) o.selected = true;
        sel.appendChild(o);
      });
      sel.title = LANGS[current].label;

      sel.addEventListener('change', function () {
        var next = sel.value;
        if (!LANGS[next] || next === current) return;
        write(STORE_KEY, next);
        var url = new URL(location.href);
        url.searchParams.set('lang', next);
        location.href = url.toString();       // recarrega: mais previsivel que
      });                                     // remontar a pagina no lugar

      wrap.appendChild(label);
      wrap.appendChild(sel);
      host.appendChild(wrap);
    });
  }

  // ---- orquestracao --------------------------------------------------------

  /* Um link de WhatsApp carrega a mensagem pronta dentro do proprio endereco.
     O ROTULO do botao ja era traduzido; a mensagem, nao — entao o visitante
     estrangeiro clicava em "Message us on WhatsApp" e o aplicativo abria com
     uma frase em portugues que ele nao le, prestes a sair em nome dele.

     Aqui o destinatario e o proprio Rafael, que quer cliente de fora: a
     mensagem vai no idioma do visitante. Isso e o OPOSTO do que o catalogo da
     KL Sports faz, e de proposito — la o destinatario e a equipe do cliente,
     que so le portugues, e o orcamento tem de chegar em portugues. Por isso o
     ajuste e por adesao (`data-wa-msg`) e nao varre todo link de WhatsApp. */
  function translateWaLinks(dict) {
    /* `data-i18n-wa`, e nao `data-wa-msg`: o catalogo da KL Sports ja usa esse
       outro nome para carregar a mensagem literal em portugues das suas CTAs.
       Reaproveitar o nome faria as duas coisas disputarem o mesmo atributo. */
    var links = document.querySelectorAll('a[data-i18n-wa]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var msg = dict[a.getAttribute('data-i18n-wa')];
      if (!msg) continue;
      /* encodeURIComponent, e NAO URLSearchParams: o segundo serializa em
         formato de formulario, trocando espaco por "+". O wa.me nao desfaz
         essa troca, entao o visitante receberia "Hi+Rafael,+I+came+from+the"
         escrito assim, com os sinais a vista. Os enderecos em portugues ja
         usam %20; aqui se escreve do mesmo jeito. */
      var base = a.href.split('?')[0];
      a.setAttribute('href', base + '?text=' + encodeURIComponent(msg));
    }
  }

  function run(dict) {
    try {
      applyMeta(dict);
      applyNodes(dict);
      translateWaLinks(dict);
    } catch (e) {
      if (window.console && console.error) console.error('[i18n]', e);
    }
    reveal();
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function loadDict(cb) {
    var bag = window.SRCHZ_I18N;
    if (bag && bag[current]) { cb(bag[current]); return; }
    var s = document.createElement('script');
    s.src = BASE + 'i18n/' + current + '.js';
    s.async = false;
    s.onload = function () {
      var b = window.SRCHZ_I18N;
      cb(b && b[current] ? b[current] : null);
    };
    s.onerror = function () { cb(null); };
    (document.head || html).appendChild(s);
  }

  /* Paginas que montam o proprio conteudo em JavaScript — o catalogo da KL
     Sports gera cada ficha a partir de um array — nao podem desenhar antes do
     dicionario chegar, senao desenham em portugues e nada mais passa por ali
     para corrigir. `ready` avisa quando `t()` ja responde no idioma final; em
     portugues, ou se o dicionario falhar, avisa do mesmo jeito, porque ai o
     texto certo e justamente a alternativa em portugues. */
  var settled = false;
  var waiting = [];
  function settle() {
    if (settled) return;
    settled = true;
    while (waiting.length) {
      try { waiting.shift()(); } catch (e) {
        if (window.console && console.error) console.error('[i18n] ready:', e);
      }
    }
  }

  onReady(function () {
    buildSwitcher();

    if (current === DEFAULT) {
      html.setAttribute('lang', LANGS.pt.htmlLang);
      settle();
      reveal();
      return;
    }

    loadDict(function (dict) {
      if (!dict) {
        /* Sem dicionario: fica em portugues e o seletor continua funcionando,
           entao o visitante pode tentar outro idioma. */
        if (window.console && console.warn) {
          console.warn('[i18n] dicionario "' + current + '" nao carregou; mantendo pt');
        }
        settle();
        reveal();
        return;
      }
      settle();          /* antes de run(): o que o callback criar tambem e
                            varrido pelo data-i18n logo em seguida */
      run(dict);
      propagateLang();
    });
  });

  /* Rede de seguranca: se o dicionario travar, a pagina nao pode ficar sem
     catalogo. O mesmo 1,5s que revela o corpo tambem solta quem espera. */
  setTimeout(settle, 1500);

  /* API publica.
     `t(chave, alternativa)` serve o texto que a pagina gera em JavaScript —
     mensagens de validacao de formulario, por exemplo — que nao existem no HTML
     e portanto nao sao alcancadas por data-i18n. Em portugues, ou enquanto o
     dicionario nao chegou, devolve a alternativa, que e o texto ja escrito na
     pagina. Assim a mensagem nunca some, no pior caso aparece em portugues. */
  window.SrChZI18n = {
    current: function () { return current; },
    langs: LANGS,
    t: function (key, fallback) {
      var bag = window.SRCHZ_I18N;
      var dict = bag && bag[current];
      if (dict && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
      return fallback;
    },
    ready: function (fn) {
      if (typeof fn !== 'function') return;
      if (settled) fn();
      else waiting.push(fn);
    },
    set: function (code) {
      if (!LANGS[code]) return;
      write(STORE_KEY, code);
      var url = new URL(location.href);
      url.searchParams.set('lang', code);
      location.href = url.toString();
    }
  };
})();
