# Padrão de publicação de artigo (desde 19/11/2026)

Este é o padrão que todo artigo novo do blog da BGL deve seguir, inclusive os publicados pela tarefa agendada. O objetivo é que cada artigo seja encontrado pelo Google e pelo Bing e possa ser citado por assistentes de IA. Use como modelo um artigo recente da mesma área, por exemplo `publicacoes/escala-6x1-padarias-bares-supermercados.html`.

## No próprio artigo

**Autoria ligada ao perfil.** No JSON-LD do `BlogPosting`, o `author` traz o `@id` da home (`https://www.bgladvogados.com.br/#cecilia-galvao` ou `#thallys-lopo`) e a `url` do perfil (`/advogados/cecilia-galvao/` ou `/advogados/thallys-lopo/`). O `publisher` traz o `@id` `https://www.bgladvogados.com.br/#legalservice`. A assinatura no topo (`.article-meta`) e o nome no `.author-box` são links para o perfil, com `rel="author"`. O `.author-box` termina com o link "Ver perfil completo".

**Resposta direta no início.** Se o primeiro parágrafo (`p.lead`) ainda não responde de forma direta à pergunta do título, o artigo abre com o bloco `aside.article-summary` ("Em resumo"): duas ou três frases, apenas com afirmações que estão no próprio texto. O mesmo texto vai no campo `abstract` do JSON-LD. Quando o `p.lead` já é a resposta direta, o bloco visível é dispensado e só o `abstract` é preenchido.

**Link para a página da área.** Antes do `.author-box`, inclua o parágrafo `p.article-area`, por exemplo: "Saiba como a BGL atua em direito imobiliário em Goiânia", com link para a página da área (`../direito-civel/`, `../direito-imobiliario/`, `../trabalhista-empresarial/` ou `../direito-empresarial/`).

**Leia também.** Na seção `.related`, coloque até dois artigos da mesma área, do mais recente para o mais antigo, e complete com um terceiro de outra área.

**Datas.** `datePublished` é a data da publicação. Ao revisar o conteúdo de um artigo já publicado, atualize o `dateModified` e a meta `article:modified_time`.

## Fora do artigo, na mesma publicação

1. Acrescente a entrada em `publicacoes/_publicacoes.json`, como já é feito hoje.
2. Inclua o card do artigo no índice `publicacoes/index.html`, na página da área correspondente (seção `#conteudos`) e na página de perfil do autor (seção `#publicacoes`).
3. Inclua a URL no `sitemap.xml` e uma linha em `llms.txt`, na seção "Publicações": título com link, área, autor e a primeira frase do resumo.
4. Depois que o GitHub Pages publicar a alteração, avise o IndexNow:

```bash
python3 scripts/indexnow.py https://www.bgladvogados.com.br/publicacoes/SLUG.html
```

5. Ao retirar um artigo do ar e publicá-lo de novo depois, mantenha o mesmo endereço (slug), para não perder a indexação que ele já tinha.

## Verificações automáticas

As tarefas que abrem páginas do site num navegador automatizado devem bloquear as chamadas a `googletagmanager.com` e `google-analytics.com`, ou abrir o site com `?interno=1`, para não contaminar o GA4.
