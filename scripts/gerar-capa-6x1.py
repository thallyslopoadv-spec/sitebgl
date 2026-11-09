# -*- coding: utf-8 -*-
"""Gera a capa dos artigos do fim da escala 6x1 na identidade visual do site.

Uso:
  python3 gerar-capa-6x1.py <saida.jpg>                      motivo geometrico, sem texto
  python3 gerar-capa-6x1.py <saida.jpg> --com-titulo         arte assinada FIM DA ESCALA 6X1
  python3 gerar-capa-6x1.py <saida.jpg> --foto <foto> [...]  a arte sobre uma fotografia

Capa 1200x675, a proporcao da og:image do site. O motivo e uma semana que
passa de seis dias de trabalho com uma folga para cinco dias com duas
folgas, que e o que a Emenda Constitucional 141/2026 determina.

Com --foto, a fotografia entra como ambiente: puxada para o azul-marinho
do site e escurecida, com um degrade a esquerda para a tipografia sentar
em area limpa. A foto de origem nao fica no repositorio; a usada no
artigo do comercio e "bar sem licenca.jpg", da pasta Capas dos artigos no
Drive. Antes de usar qualquer foto, conferir se nao ha marca d'agua de
banco de imagem: uma prévia marcada nao pode ir ao ar.

Sem --com-titulo e sem --foto a capa sai sem texto grande, como as demais
do site: no artigo ela entra como fundo escurecido do cabecalho, atras do
h1, e tipografia na imagem competiria com o titulo da pagina.

Nenhuma data entra na imagem por padrao, para que a capa nao precise ser
refeita se o calendario da transicao for ajustado. A chamada da versao
com foto e a excecao, e esta num unico ponto do arquivo.
"""
import sys

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 1200, 675
NAVY = (22, 36, 61)
NAVY_DEEP = (13, 22, 38)
CREAM = (233, 226, 212)
STEEL = (120, 142, 173)
GOLD = (210, 164, 80)

FONTES = "/usr/share/fonts/opentype/inter/"
DISPLAY_BOLD = FONTES + "InterDisplay-Bold.otf"
DISPLAY_BLACK = FONTES + "InterDisplay-Black.otf"
INTER_MEDIUM = FONTES + "Inter-Medium.otf"
INTER_SEMIBOLD = FONTES + "Inter-SemiBold.otf"

CHAMADA = ("Padarias, bares e supermercados", "têm até 16 de dezembro para se adequar")


def fundo_geometrico():
    """Gradiente diagonal igual ao de scripts/gerar-capa.py."""
    grad = Image.new("L", (W, H))
    gd = ImageDraw.Draw(grad)
    for i in range(W + H):
        gd.line([(i, 0), (0, i)], fill=int(255 * (1 - i / (W + H)) ** 1.6))
    base = Image.new("RGB", (W, H), NAVY)
    img = Image.composite(base, Image.new("RGB", (W, H), NAVY_DEEP), grad)
    brilho = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(brilho).ellipse([-420, -480, 700, 400], fill=(255, 246, 228, 46))
    brilho = brilho.filter(ImageFilter.GaussianBlur(140))
    return Image.alpha_composite(img.convert("RGBA"), brilho).convert("RGB")


def cobrir(im, w, h):
    """Recorta a foto no enquadramento da capa sem deformar."""
    r = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    l, t = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((l, t, l + w, t + h))


def fundo_foto(caminho):
    foto = cobrir(Image.open(caminho).convert("RGB"), W, H)
    foto = ImageEnhance.Color(foto).enhance(0.5)
    foto = ImageEnhance.Brightness(foto).enhance(0.62)
    foto = Image.blend(foto, Image.new("RGB", (W, H), NAVY_DEEP), 0.42)
    img = foto.convert("RGBA")

    scrim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    for x in range(W):
        t = max(0.0, 1 - x / 820)
        sd.line([(x, 0), (x, H)], fill=NAVY_DEEP + (int(252 * t ** 1.25),))
    img = Image.alpha_composite(img, scrim)

    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(base)
    for y in range(H):
        t = max(0.0, (y - H * 0.5) / (H * 0.5))
        bd.line([(0, y), (W, y)], fill=NAVY_DEEP + (int(150 * t ** 1.8),))
    return Image.alpha_composite(img, base).convert("RGB")


def texto_espacado(d, xy, texto, fonte, cor, tracking=0):
    """Desenha texto com entreletra, que o PIL nao oferece nativamente."""
    x, y = xy
    for ch in texto:
        d.text((x, y), ch, font=fonte, fill=cor)
        x += d.textlength(ch, font=fonte) + tracking


def semana(d, x, y, trabalho, folga, cell, gap, apagado=False):
    """Uma faixa de sete dias: blocos de trabalho e blocos de folga."""
    for i in range(trabalho + folga):
        x0 = x + i * (cell + gap)
        box = [x0, y, x0 + cell, y + cell]
        raio = max(3, cell // 6)
        if i < trabalho:
            alpha = 60 if apagado else 130
            d.rounded_rectangle(box, radius=raio, fill=STEEL + (alpha,))
            d.rounded_rectangle(box, radius=raio, outline=STEEL + (alpha + 45,), width=1)
        else:
            alpha = 115 if apagado else 235
            d.rounded_rectangle(box, radius=raio, fill=CREAM + (alpha,))


def assinatura(d, x, y):
    d.rounded_rectangle([x, y, x + 2, y + 24], radius=1, fill=GOLD + (255,))
    texto_espacado(d, (x + 18, y + 4), "BGL ADVOGADOS",
                   ImageFont.truetype(INTER_SEMIBOLD, 16), CREAM + (225,), 2.6)


def titulo(d, M, linha1, linha2):
    texto_espacado(d, (M, 92), "TRABALHISTA EMPRESARIAL",
                   ImageFont.truetype(INTER_SEMIBOLD, 19), STEEL + (255,), 3.2)
    d.text((M, 140), "FIM DA ESCALA", font=ImageFont.truetype(DISPLAY_BOLD, 72), fill=CREAM + (255,))
    fn = ImageFont.truetype(DISPLAY_BLACK, 150)
    d.text((M, 222), "6X1", font=fn, fill=CREAM + (255,))
    wn = d.textlength("6X1", font=fn)
    d.line([(M - 14, 372), (M + wn + 14, 264)], fill=GOLD + (255,), width=9)
    d.rounded_rectangle([M, 418, M + 116, 422], radius=2, fill=CREAM + (210,))
    fs = ImageFont.truetype(INTER_MEDIUM, 25)
    d.text((M, 452), linha1, font=fs, fill=CREAM + (228,))
    d.text((M, 490), linha2, font=fs, fill=STEEL + (255,))


def main():
    if len(sys.argv) < 2:
        raise SystemExit("uso: gerar-capa-6x1.py <saida.jpg> [--com-titulo] [--foto <foto>]")
    saida = sys.argv[1]
    args = sys.argv[2:]
    com_titulo = "--com-titulo" in args
    foto = None
    if "--foto" in args:
        i = args.index("--foto")
        if i + 1 >= len(args):
            raise SystemExit("--foto exige o caminho da imagem")
        foto = args[i + 1]

    img = fundo_foto(foto) if foto else fundo_geometrico()
    d = ImageDraw.Draw(img.convert("RGBA"), "RGBA")
    img = img.convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    f_rotulo = ImageFont.truetype(INTER_SEMIBOLD, 19)
    M = 84

    if foto:
        titulo(d, M, CHAMADA[0], CHAMADA[1])
        fr = ImageFont.truetype(INTER_SEMIBOLD, 15)
        xs, cell, gap = 820, 36, 7
        texto_espacado(d, (xs, 470), "SEIS DIAS, UMA FOLGA", fr, STEEL + (225,), 1.6)
        semana(d, xs, 494, 6, 1, cell, gap, apagado=True)
        texto_espacado(d, (xs, 548), "CINCO DIAS, DUAS FOLGAS", fr, CREAM + (235,), 1.6)
        semana(d, xs, 572, 5, 2, cell, gap)
        assinatura(d, M, 580)
    elif com_titulo:
        titulo(d, M, "44h → 40h semanais", "e dois dias de descanso remunerado")
        xd, cell, gap = 712, 44, 9
        texto_espacado(d, (xd, 196), "SEIS DIAS, UMA FOLGA", f_rotulo, STEEL + (235,), 2.0)
        semana(d, xd, 226, 6, 1, cell, gap, apagado=True)
        cx = xd + 8
        d.line([(cx, 306), (cx, 342)], fill=CREAM + (150,), width=3)
        d.polygon([(cx - 8, 338), (cx + 8, 338), (cx, 352)], fill=CREAM + (190,))
        texto_espacado(d, (xd, 372), "CINCO DIAS, DUAS FOLGAS", f_rotulo, CREAM + (240,), 2.0)
        semana(d, xd, 402, 5, 2, cell, gap)
        assinatura(d, M, 580)
    else:
        cell, gap = 96, 20
        lw = 7 * cell + 6 * gap
        x0 = (W - lw) // 2
        texto_espacado(d, (x0, 158), "SEIS DIAS, UMA FOLGA", f_rotulo, STEEL + (190,), 3.0)
        semana(d, x0, 196, 6, 1, cell, gap, apagado=True)
        cx = W // 2
        d.line([(cx, 322), (cx, 368)], fill=CREAM + (120,), width=3)
        d.polygon([(cx - 10, 362), (cx + 10, 362), (cx, 380)], fill=CREAM + (160,))
        texto_espacado(d, (x0, 404), "CINCO DIAS, DUAS FOLGAS", f_rotulo, CREAM + (205,), 3.0)
        semana(d, x0, 442, 5, 2, cell, gap)
        d.rounded_rectangle([x0, 586, x0 + 90, 589], radius=2, fill=GOLD + (210,))

    if not foto:
        vinheta = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        vd = ImageDraw.Draw(vinheta)
        for y in range(H):
            t = max(0.0, (y - H * 0.42) / (H * 0.58))
            a = int(96 * t ** 2.2)
            if a:
                vd.line([(0, y), (W, y)], fill=(8, 14, 26, a))
        img = Image.alpha_composite(img, vinheta)

    img.convert("RGB").save(saida, quality=90, optimize=True)
    print(saida)


if __name__ == "__main__":
    main()
