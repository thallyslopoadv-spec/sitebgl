#!/usr/bin/env python3
"""Avisa o IndexNow (Bing, Yandex, Seznam, Naver e outros) sobre URLs novas ou alteradas.

Uso, depois que a alteração já estiver publicada no GitHub Pages:
  python3 scripts/indexnow.py https://www.bgladvogados.com.br/publicacoes/novo-artigo.html
  python3 scripts/indexnow.py --sitemap        # envia todas as URLs do sitemap.xml

A chave é o nome do arquivo <chave>.txt na raiz do site, que contém a própria chave.
O Google não usa IndexNow; para ele continua valendo o sitemap no Search Console.
"""
import glob, json, os, re, sys, urllib.request

HOST = "www.bgladvogados.com.br"
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def chave():
    for f in glob.glob(os.path.join(RAIZ, "*.txt")):
        nome = os.path.basename(f)[:-4]
        if re.fullmatch(r"[0-9a-f]{32}", nome) and open(f).read().strip() == nome:
            return nome
    sys.exit("Arquivo de chave do IndexNow não encontrado na raiz.")

def urls_do_sitemap():
    return re.findall(r"<loc>(.*?)</loc>", open(os.path.join(RAIZ, "sitemap.xml")).read())

def main(args):
    urls = urls_do_sitemap() if args == ["--sitemap"] else args
    if not urls:
        sys.exit(__doc__)
    k = chave()
    corpo = json.dumps({"host": HOST, "key": k, "keyLocation": f"https://{HOST}/{k}.txt", "urlList": urls}).encode()
    req = urllib.request.Request("https://api.indexnow.org/indexnow", data=corpo,
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow respondeu {r.status} para {len(urls)} URL(s).")
    except urllib.error.HTTPError as e:
        # 200/202 = recebido; 403 = chave não encontrada no site (publicar antes); 422 = URL fora do host
        sys.exit(f"IndexNow recusou: HTTP {e.code} {e.read().decode(errors='ignore')[:200]}")

if __name__ == "__main__":
    main(sys.argv[1:])
