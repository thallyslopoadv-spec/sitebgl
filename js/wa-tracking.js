/* =========================================================================
   BGL ADVOGADOS — MEDIÇÃO DO CLIQUE NO WHATSAPP (GA4)
   -------------------------------------------------------------------------
   Arquivo único, carregado por TODAS as páginas do site. Antes esta lógica
   vivia duplicada em js/main.js e em scripts inline, o que fez páginas
   novas nascerem sem medição. Qualquer mudança na medição do WhatsApp é
   feita aqui e vale para o site inteiro.

   COMO FUNCIONA: um listener delegado no documento cobre todos os links de
   WhatsApp da página, inclusive o botão flutuante e o menu mobile. Como o
   site não tem roteamento client-side, um clique produz exatamente um
   evento. A guarda __bglWaTracker impede duplo registro caso o arquivo
   seja incluído duas vezes.

   PRIVACIDADE: nenhum dado pessoal é enviado. O número de telefone é
   removido tanto da URL quanto do texto do link antes do envio.
   ========================================================================= */
(function () {
  if (window.__bglWaTracker) return;
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
    if (el.closest(".link-card")) return "link_bio";
    if (el.closest(".hero, .pillar-hero, .article-hero")) return "hero";
    if (el.closest(".cta-band")) return "cta_final";
    if (el.closest(".section-actions")) return "cta_secao";
    if (el.closest("#contato")) return "contato";
    if (el.closest(".article-wa")) return "meio_artigo";
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

  /* Referência da visita: o mesmo código que o formulário do Guia grava na
     planilha (js/ebook.js). Vai na mensagem do WhatsApp para o escritório
     saber que a conversa veio do site e de qual página. Não identifica a
     pessoa: é um código aleatório por aba, que some ao fechá-la. */
  function referencia() {
    try {
      var r = window.sessionStorage.getItem("bgl_ref_visita");
      if (r) return r;
      r = "BGL-" + Date.now().toString(36).slice(-4).toUpperCase() + Math.floor(Math.random() * 36).toString(36).toUpperCase();
      window.sessionStorage.setItem("bgl_ref_visita", r);
      return r;
    } catch (e) { return "BGL-" + Date.now().toString(36).slice(-5).toUpperCase(); }
  }
  window.bglReferencia = referencia;

  /* Links sem mensagem própria ganham uma mensagem pré-preenchida com a
     página de origem e a referência. Links que já trazem ?text= (home,
     páginas de área, landing pages, Guia) ficam como estão. */
  function preencherMensagem(link, url) {
    if (url.searchParams.has("text")) return;
    var pagina = (document.title || "").split(" | ")[0].split(" — ")[0].trim().slice(0, 90);
    var msg = "Olá! Vim pelo site da BGL" + (pagina ? " (página: " + pagina + ")" : "") + ". Ref.: " + referencia();
    /* encodeURIComponent (espaço como %20): o "+" de URLSearchParams nem
       sempre é lido como espaço pelo WhatsApp. */
    var base = url.href.split("#")[0];
    link.href = base + (url.search ? "&" : "?") + "text=" + encodeURIComponent(msg);
  }

  /* Um único evento por abertura do WhatsApp, venha ela do clique no link
     ou da chamada que as landing pages fazem no fim do funil. Nas LPs o
     botão é um <a> do WhatsApp E chama a função: sem esta janela, o mesmo
     clique entraria duas vezes no relatório. Um segundo é folgado para o
     par clique/chamada e curto demais para engolir dois CTAs distintos. */
  var ultimoEnvio = 0;

  /* Enviado também quando o WhatsApp é aberto por código (as landing pages
     abrem a conversa no fim do fluxo, sem clique em link). */
  function registrarWhatsApp(info) {
    info = info || {};
    if (typeof window.gtag !== "function") return;
    var agora = Date.now();
    if (agora - ultimoEnvio < 1000) return;
    ultimoEnvio = agora;
    var params = {
      link_url: "https://wa.me/",
      link_domain: "wa.me",
      link_position: info.posicao || "conteudo",
      page_location: window.location.href,
      page_title: document.title
    };
    if (info.texto) params.link_text = info.texto;
    params.ref_visita = referencia();
    window.gtag("event", "whatsapp_click", params);
  }

  /* Exposto para as landing pages chamarem no mesmo ponto em que disparam
     o evento próprio do funil. */
  window.bglWhatsAppClick = registrarWhatsApp;

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

    preencherMensagem(link, url);
    registrarWhatsApp({ posicao: posicaoDoLink(link), texto: textoSeguro(link) });

    /* Conversão do Google Ads: ativar quando o rótulo for confirmado para o
       site institucional (as landing pages já usam AW-18117456860).
       window.gtag("event", "conversion", { send_to: "AW-18117456860/RÓTULO" }); */
  }, false);
})();
