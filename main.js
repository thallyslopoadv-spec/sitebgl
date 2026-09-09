/* ==========================================================================
   BGL Advogados — comportamento compartilhado
   Vanilla JS, sem dependências. Respeita prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  // Sinaliza que o JS está ativo: só então o conteúdo é ocultado para animar.
  document.documentElement.classList.add("js");

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Sequência de entrada no carregamento --- */
  window.addEventListener("load", function () {
    document.documentElement.classList.add("is-loaded");
  });
  // fallback caso 'load' demore
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () { document.documentElement.classList.add("is-loaded"); }, 600);
  });

  /* --- Navegação: encolher ao rolar + barra de progresso + parallax --- */
  var nav = document.querySelector(".nav");
  var progress = document.querySelector(".scroll-progress");
  var parallaxEls = prefersReduced ? [] : Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var ticking = false;

  var onScroll = function () {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle("is-scrolled", y > 24);
    if (progress) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + "%";
    }
    parallaxEls.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
      var scale = el.getAttribute("data-parallax-scale") || "1";
      var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
      el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0) scale(" + scale + ")";
    });
    ticking = false;
  };
  var requestScroll = function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  };
  onScroll();
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll, { passive: true });

  /* --- Menu mobile (hambúrguer) --- */
  var toggle = document.querySelector(".nav__toggle");
  if (toggle && nav) {
    var closeMenu = function () {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    // fechar ao clicar num link do menu
    document.querySelectorAll(".nav__menu a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    // fechar com ESC
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) closeMenu();
    });
  }

  /* --- Scroll reveal + stagger --- */
  // Hero stagger/reveal elements are already in view on load — mark them immediately.
  document.querySelectorAll(".hero .reveal, .hero [data-stagger]").forEach(function (el) {
    el.classList.add("is-visible");
  });

  var revealEls = document.querySelectorAll(".reveal, [data-stagger]");
  if (revealEls.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
      // Rede de segurança: revela tudo após 2,5s caso algo impeça o observer.
      setTimeout(function () {
        revealEls.forEach(function (el) { el.classList.add("is-visible"); });
      }, 2500);
    }
  }

  /* --- Contadores animados (números do "Sobre") --- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var animateCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      if (prefersReduced) { el.textContent = target + suffix; return; }
      var start = null, dur = 1100;
      var tick = function (t) {
        if (!start) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { cio.observe(c); });
    }
  }

  /* --- Áreas de atuação: abas interativas --- */
  var areaTabs = Array.prototype.slice.call(document.querySelectorAll(".areas__tab"));
  var areaPanels = Array.prototype.slice.call(document.querySelectorAll(".areas__panel"));
  if (areaTabs.length) {
    var mqDesktop = window.matchMedia("(min-width: 861px)");
    var activateArea = function (i) {
      areaTabs.forEach(function (t, idx) {
        var on = idx === i;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      areaPanels.forEach(function (p, idx) {
        var on = idx === i;
        p.classList.toggle("is-active", on);
        if (on) p.removeAttribute("hidden"); else p.setAttribute("hidden", "");
      });
    };
    areaTabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        activateArea(i);
        if (!mqDesktop.matches) {
          document.querySelector(".areas__panels").scrollIntoView({
            behavior: prefersReduced ? "auto" : "smooth", block: "nearest"
          });
        }
      });
      t.addEventListener("mouseenter", function () { if (mqDesktop.matches) activateArea(i); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % areaTabs.length;
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + areaTabs.length) % areaTabs.length;
        if (n !== null) { e.preventDefault(); activateArea(n); areaTabs[n].focus(); }
      });
    });
  }

  /* ======================================================================
     GA4 — evento whatsapp_click
     ----------------------------------------------------------------------
     UM único listener delegado no documento cobre todos os links de
     WhatsApp da página, inclusive o botão flutuante e o menu mobile.
     Como o site não tem roteamento client-side nem re-renderização, um
     clique produz exatamente um evento. A guarda __bglWaTracker impede
     duplo registro caso o arquivo seja incluído duas vezes.

     PRIVACIDADE: nenhum dado pessoal é enviado. O número de telefone é
     removido tanto da URL quanto do texto do link antes do envio.
     ====================================================================== */
  /* ======================================================================
     CAPTURA DO CLIQUE NA PLANILHA
     ----------------------------------------------------------------------
     Mesmo endpoint usado pela calculadora (captura-lead/apps-script.gs).
     Enquanto ENDPOINT estiver vazio, nada e enviado.

     O QUE ISTO CAPTURA, COM HONESTIDADE: o clique, nao a pessoa. Numa LP
     sem formulario o visitante nao informou nome nem telefone, entao a
     linha na planilha registra origem, pagina, posicao do botao e horario.
     Quem e a pessoa so aparece quando ela manda a mensagem, dentro do
     WhatsApp.

     A ponte entre as duas coisas e a referencia: com CARIMBAR_REFERENCIA
     ligado, a mensagem ja abre com um codigo curto que tambem esta na
     planilha. Quando a conversa chega, o codigo diz de qual anuncio e de
     qual pagina aquela pessoa veio.
     ====================================================================== */
  var CAPTURA = {
    /* URL /exec do App da Web publicado no Google Apps Script. */
    ENDPOINT: "https://script.google.com/macros/s/AKfycbxvjB7mb4ZsXnXXCt9eH-XmBIzBND6p9KoZj0kZIisjgq5KhOUJKFgksPg-SW8R8TTRRg/exec",

    /* Mesma palavra-chave configurada no script da planilha. */
    TOKEN: "bgl-imob-2026",

    /* Abre o WhatsApp com "Ref.: BGL-XXXX" na mensagem. Desligue para
       manter os CTAs abrindo a conversa em branco - a planilha continua
       registrando o clique, mas sem como cruzar com a conversa.          */
    CARIMBAR_REFERENCIA: true,

    /* Texto inicial usado apenas quando o link nao tem mensagem propria. */
    MENSAGEM_PADRAO: "Olá! Vim pelo site da BGL Advogados e gostaria de falar com um advogado."
  };

  var CHAVES_ORIGEM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];

  /* Origem da visita: o que vier na URL manda; na falta, vale o que ficou
     guardado de uma visita anterior (30 dias), como na calculadora.      */
  function origemDaVisita() {
    var atual = {}, params;
    try { params = new URLSearchParams(window.location.search); } catch (err) { params = null; }
    if (params) {
      CHAVES_ORIGEM.forEach(function (k) {
        var v = params.get(k);
        if (v) atual[k] = String(v).slice(0, 120);
      });
    }
    var temAtual = Object.keys(atual).length > 0;

    try {
      if (temAtual) {
        window.localStorage.setItem("bgl_origem_site", JSON.stringify({ ts: Date.now(), dados: atual }));
      } else {
        var bruto = window.localStorage.getItem("bgl_origem_site");
        if (bruto) {
          var obj = JSON.parse(bruto);
          if ((Date.now() - (obj.ts || 0)) / 86400000 <= 30) atual = obj.dados || {};
        }
      }
    } catch (err) { /* armazenamento bloqueado: usa so o que veio na URL */ }

    return atual;
  }

  /* Uma referencia por visita: varios cliques da mesma pessoa carregam o
     mesmo codigo, o que evita tratar o mesmo interessado como tres leads. */
  function referenciaDaVisita() {
    var chave = "bgl_ref_visita";
    try {
      var salva = window.sessionStorage.getItem(chave);
      if (salva) return salva;
    } catch (err) { /* segue para gerar em memoria */ }

    var nova = "BGL-" + Date.now().toString(36).slice(-4).toUpperCase() +
               Math.floor(Math.random() * 36).toString(36).toUpperCase();
    try { window.sessionStorage.setItem(chave, nova); } catch (err) { /* ignora */ }
    return nova;
  }

  var refVisita = null;
  function refAtual() {
    if (!refVisita) refVisita = referenciaDaVisita();
    return refVisita;
  }

  /* Acrescenta a referencia a mensagem do link, sem apagar texto existente. */
  function carimbarReferencia(link, url) {
    if (!CAPTURA.CARIMBAR_REFERENCIA) return;
    var texto = url.searchParams.get("text") || CAPTURA.MENSAGEM_PADRAO;
    if (texto.indexOf("Ref.:") !== -1) return;
    texto = texto + "\n\nRef.: " + refAtual();

    /* Montagem manual da query: searchParams grava espaco como "+", que o
       WhatsApp mostra literalmente na caixa de mensagem. */
    url.searchParams["delete"]("text");
    var resto = url.searchParams.toString();
    link.href = url.origin + url.pathname + "?" + (resto ? resto + "&" : "") +
                "text=" + encodeURIComponent(texto);
  }

  /* Envio disparado no clique. sendBeacon primeiro: e o unico transporte
     que o navegador garante quando a pagina vai para segundo plano ao
     abrir o WhatsApp.                                                    */
  function registrarClique(dados) {
    if (!CAPTURA.ENDPOINT) return;
    var corpo = JSON.stringify(dados);
    try {
      if (navigator.sendBeacon &&
          navigator.sendBeacon(CAPTURA.ENDPOINT, new Blob([corpo], { type: "text/plain;charset=UTF-8" }))) return;
    } catch (err) { /* cai para o fetch */ }
    try {
      window.fetch(CAPTURA.ENDPOINT, {
        method: "POST", keepalive: true, mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: corpo
      })["catch"](function () { /* clique perdido nao vira erro na tela */ });
    } catch (err) { /* ignora */ }
  }

  if (!window.__bglWaTracker) {
    window.__bglWaTracker = true;

    var WA_HOST = /(^|\.)wa\.me$|(^|\.)whatsapp\.com$/i;
    /* Guarda contra duplo disparo do MESMO elemento (toque que gera click
       sintético no mobile). Compara o elemento, nunca a URL: todos os CTAs
       do site apontam para o mesmo número, e comparar href faria um clique
       no hero ser descartado logo após um clique no header. */
    var ultimoClique = { el: null, t: 0 };

    function posicaoDoLink(el) {
      if (el.closest(".wa-float")) return "botao_flutuante";
      if (el.closest("header.nav")) return "header";
      if (el.closest(".hero, .pillar-hero, .article-hero")) return "hero";
      if (el.closest(".cta-band")) return "cta_final";
      if (el.closest(".section-actions")) return "cta_secao";
      if (el.closest("#contato")) return "contato";
      if (el.closest(".article-body")) return "artigo";
      if (el.closest("footer")) return "footer";
      return "conteudo";
    }

    /* Descarta qualquer texto que pareça telefone (o CTA da seção de
       contato usa o próprio número como rótulo visível). */
    function textoSeguro(el) {
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if ((t.match(/\d/g) || []).length >= 6) t = "";
      if (!t) t = (el.getAttribute("aria-label") || "").trim();
      if ((t.match(/\d/g) || []).length >= 6) t = "";
      return t.slice(0, 100);
    }

    document.addEventListener("click", function (e) {
      var alvo = e.target;
      if (!alvo || typeof alvo.closest !== "function") return;
      var link = alvo.closest("a[href]");
      if (!link) return;

      var url;
      try { url = new URL(link.href, window.location.href); } catch (err) { return; }
      if (!WA_HOST.test(url.hostname)) return;

      var agora = Date.now();
      if (link === ultimoClique.el && agora - ultimoClique.t < 350) return;
      ultimoClique = { el: link, t: agora };

      /* Planilha primeiro: o GA4 pode nem estar carregado, e o registro do
         clique nao pode depender disso. Tambem carimba a referencia antes
         de o navegador seguir o link. */
      var origem = origemDaVisita();
      carimbarReferencia(link, url);
      registrarClique({
        token: CAPTURA.TOKEN,
        evento: "cta_whatsapp",
        chave: refAtual() + "|cta|" + agora,
        ref: refAtual(),
        data_iso: new Date().toISOString(),
        pagina: window.location.href,
        titulo: document.title,
        posicao: posicaoDoLink(link),
        texto_cta: textoSeguro(link),
        utm_source: origem.utm_source || "",
        utm_medium: origem.utm_medium || "",
        utm_campaign: origem.utm_campaign || "",
        utm_content: origem.utm_content || "",
        utm_term: origem.utm_term || "",
        gclid: origem.gclid || "",
        fbclid: origem.fbclid || "",
        referrer: (document.referrer || "").slice(0, 160)
      });

      if (typeof window.gtag !== "function") return;

      var params = {
        link_url: url.protocol + "//" + url.hostname + "/", // sem o telefone
        link_domain: url.hostname,
        link_position: posicaoDoLink(link),
        page_location: window.location.href,
        page_title: document.title
      };
      var texto = textoSeguro(link);
      if (texto) params.link_text = texto;

      window.gtag("event", "whatsapp_click", params);

      /* Conversão do Google Ads: ativar quando o rótulo for confirmado.
         window.gtag("event", "conversion", { send_to: "AW-18117456860/RÓTULO" }); */
    }, false);
  }

  /* --- Ano dinâmico no rodapé (se houver placeholder) --- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
