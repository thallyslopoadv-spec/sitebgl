/* ==========================================================================
   BGL Advogados · Material rico com captura de lead
   --------------------------------------------------------------------------
   Componente reutilizavel. Cada bloco <section class="ebook"> declara:
     data-ebook   identificador curto (vai para a planilha como "ferramenta")
     data-titulo  nome legivel do material (vai para "problema" e para o e-mail)
     data-pdf     caminho do PDF

   O lead vai para o mesmo App da Web (Google Apps Script) das LPs: grava a
   linha na planilha e dispara o e-mail de aviso. O evento enviado e
   "formulario_concluido", que ja consta em AVISAR_EM no script, entao nada
   precisa mudar no Apps Script para o aviso chegar.

   O download e disparado no mesmo clique do envio (gesto do usuario), para
   nao ser barrado como pop-up. O envio do lead nao espera resposta.
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = {
    WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbxvjB7mb4ZsXnXXCt9eH-XmBIzBND6p9KoZj0kZIisjgq5KhOUJKFgksPg-SW8R8TTRRg/exec",
    WEBHOOK_TOKEN: "bgl-imob-2026",
    WHATSAPP: "5562992509988",
    /* Meta Pixel das LPs. Carregado so nas paginas com material rico, para
       medir Lead e permitir publico de quem baixou. Vazio = nao carrega. */
    META_PIXEL_ID: "1791041548696543"
  };

  var CHAVES_ORIGEM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];

  function origem() {
    var o = {};
    try {
      var p = new URLSearchParams(window.location.search);
      CHAVES_ORIGEM.forEach(function (k) { var v = p.get(k); if (v) o[k] = String(v).slice(0, 120); });
      if (!Object.keys(o).length) {
        var salvo = JSON.parse(window.localStorage.getItem("bgl_origem_site") || "null");
        if (salvo && (Date.now() - (salvo.ts || 0)) / 86400000 <= 30) o = salvo.dados || {};
      }
    } catch (e) { /* armazenamento bloqueado */ }
    o.referrer = (document.referrer || "").slice(0, 160);
    return o;
  }

  /* Mesma referencia de visita do main.js: cruza a planilha com a conversa. */
  function referencia() {
    try {
      var r = window.sessionStorage.getItem("bgl_ref_visita");
      if (r) return r;
      r = "BGL-" + Date.now().toString(36).slice(-4).toUpperCase() + Math.floor(Math.random() * 36).toString(36).toUpperCase();
      window.sessionStorage.setItem("bgl_ref_visita", r);
      return r;
    } catch (e) { return "BGL-" + Date.now().toString(36).slice(-5).toUpperCase(); }
  }

  function carregarPixel() {
    if (!CONFIG.META_PIXEL_ID || window.fbq) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("init", CONFIG.META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  function enviar(payload) {
    var corpo = JSON.stringify(payload);
    /* text/plain evita o preflight OPTIONS, que o Apps Script nao responde. */
    try {
      window.fetch(CONFIG.WEBHOOK_URL, { method: "POST", mode: "no-cors", keepalive: true,
        headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: corpo })
        .catch(function () { beacon(corpo); });
    } catch (e) { beacon(corpo); }
  }
  function beacon(corpo) {
    try { navigator.sendBeacon(CONFIG.WEBHOOK_URL, new Blob([corpo], { type: "text/plain;charset=UTF-8" })); } catch (e) { /* sem saida */ }
  }

  function baixar(pdf) {
    var a = document.createElement("a");
    a.href = pdf; a.download = pdf.split("/").pop(); a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  }

  function linkWhatsApp(titulo, ref) {
    var msg = "Olá! Baixei o " + titulo + " no site e quero conversar sobre a adequação da minha empresa. Ref.: " + ref;
    return "https://wa.me/" + CONFIG.WHATSAPP + "?text=" + encodeURIComponent(msg);
  }

  function mostrarSucesso(bloco, nome) {
    var form = bloco.querySelector(".ebook__form");
    var ok = bloco.querySelector(".ebook__ok");
    var pdf = bloco.getAttribute("data-pdf");
    var titulo = bloco.getAttribute("data-titulo");
    ok.querySelector("[data-nome]").textContent = nome ? nome.split(" ")[0] + ", o" : "O";
    ok.querySelector("[data-baixar]").setAttribute("href", pdf);
    ok.querySelector("[data-whats]").setAttribute("href", linkWhatsApp(titulo, referencia()));
    form.hidden = true; ok.hidden = false;
  }

  function validar(form) {
    var erros = [];
    function marca(campo, ok) { campo.setAttribute("aria-invalid", ok ? "false" : "true"); if (!ok) erros.push(campo); }
    var nome = form.nome, whats = form.whatsapp;
    marca(nome, nome.value.trim().length >= 2);
    var dig = whats.value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
    marca(whats, dig.length === 10 || dig.length === 11);
    ["empregados"].forEach(function (n) { marca(form[n], !!form[n].value.trim()); });
    return erros;
  }

  function iniciar(bloco) {
    var id = bloco.getAttribute("data-ebook");
    var titulo = bloco.getAttribute("data-titulo");
    var pdf = bloco.getAttribute("data-pdf");
    var form = bloco.querySelector(".ebook__form");
    var erro = bloco.querySelector(".ebook__erro");
    var chave = "bgl_ebook_" + id;
    var inicio = Date.now();

    /* Quem ja baixou nao preenche de novo. */
    try {
      var salvo = JSON.parse(window.localStorage.getItem(chave) || "null");
      if (salvo) mostrarSucesso(bloco, salvo.nome);
    } catch (e) { /* ignora */ }

    form.whatsapp.addEventListener("input", function () {
      var d = this.value.replace(/\D/g, "").slice(0, 11);
      if (d.length > 6) this.value = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
      else if (d.length > 2) this.value = "(" + d.slice(0, 2) + ") " + d.slice(2);
      else this.value = d;
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      erro.textContent = "";
      if (form.site && form.site.value) return;           /* robo preencheu o campo oculto */

      var falhas = validar(form);
      if (falhas.length) { erro.textContent = "Confira os campos destacados."; falhas[0].focus(); return; }

      var o = origem();
      var ref = referencia();
      var dig = form.whatsapp.value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
      var v = function (n) { return form[n].value.trim(); };
      var resumo = "Baixou o guia · " + v("empregados") + " empregados";
      var resumoOrigem = [o.utm_source, o.utm_medium, o.utm_campaign, o.utm_content].filter(Boolean).join(" / ") || (o.referrer ? "ref: " + o.referrer : "direto/orgânico");

      enviar({
        token: CONFIG.WEBHOOK_TOKEN,
        evento: "formulario_concluido",
        chave: ref + "|ebook_" + id,
        ref: ref,
        data_iso: new Date().toISOString(),
        nome: v("nome"),
        whatsapp: v("whatsapp"),
        whatsapp_e164: dig ? "55" + dig : "",
        email: "",
        cidade: "", uf: "",
        problema: "Download do " + titulo,
        valor_imovel: "", valor_divida: "",
        classificacao: "material_rico",
        pontuacao: 0,
        resumo: resumo,
        mensagem: "",
        origem: resumoOrigem,
        utm_source: o.utm_source || "", utm_medium: o.utm_medium || "", utm_campaign: o.utm_campaign || "",
        utm_content: o.utm_content || "", utm_term: o.utm_term || "",
        gclid: o.gclid || "", fbclid: o.fbclid || "", referrer: o.referrer || "",
        ferramenta: "ebook_" + id,
        pagina: window.location.href.split("#")[0],
        duracao_seg: Math.round((Date.now() - inicio) / 1000),
        respostas: { empregados: v("empregados"), consentimento_lgpd: "clique no botão de download com aviso de uso dos dados, " + new Date().toISOString() }
      });

      try { window.localStorage.setItem(chave, JSON.stringify({ nome: v("nome"), ts: Date.now() })); } catch (e) { /* ignora */ }
      try { if (window.gtag) window.gtag("event", "generate_lead", { material: id, empregados: v("empregados") }); } catch (e) { /* ignora */ }
      try { if (window.fbq) window.fbq("track", "Lead", { content_name: titulo, content_category: "material_rico" }); } catch (e) { /* ignora */ }

      baixar(pdf);
      mostrarSucesso(bloco, v("nome"));
    });
  }

  var blocos = document.querySelectorAll(".ebook[data-ebook]");
  if (!blocos.length) return;
  carregarPixel();
  Array.prototype.forEach.call(blocos, iniciar);
})();
