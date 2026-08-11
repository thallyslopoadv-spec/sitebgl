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
