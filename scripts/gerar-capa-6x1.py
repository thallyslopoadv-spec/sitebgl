# -*- coding: utf-8 -*-
"""Gera a capa do artigo do fim da escala 6x1 na identidade visual do site.

Uso: python3 gerar-capa-6x1.py <caminho-de-saida.jpg> [--com-titulo]

Capa 1200x675 (proporcao da og:image do site). O motivo e uma semana que
passa de seis dias de trabalho com uma folga para cinco dias com duas
folgas, que e o que a Emenda Constitucional 141/2026 determina.

Sem --com-titulo, a capa sai sem texto grande, como as demais capas do
site: no artigo ela entra como fundo escurecido do cabecalho, atras do
h1, e tipografia na imagem competiria com o titulo da pagina.

Com --com-titulo, sai a versao assinada "FIM DA ESCALA 6X1", para uso em
redes sociais, onde a imagem aparece sozinha.

Nenhuma data entra na imagem, para que a capa nao precise ser refeita se
o calendario da transicao for ajustado.
"""
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

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


def fundo():
    """Gradiente diagonal igual ao de scripts/gerar-capa.py."""
    grad = Image.new("L", (W, H))
    gd = ImageDraw.Draw(grad)
    for i in range(W + H):
        gd.line([(i, 0), (0, i)], fill=int(255 * (1 - i / (W + H)) ** 1.6))
    base = Image.new("RGB", (W, H), NAVY)
    return Image.composite(base, Image.new("RGB", (W, H), NAVY_DEEP), grad)


def texto_espacado(d, xy, texto, fonte, cor, tracking=0):
    """Desenha texto com entreletra, que o PIL nao oferece nativamente."""
    x, y = xy
    for ch in texto:
        d.text((x, y), ch, font=fonte, fill=cor)
        x += d.textlength(ch, font=fonte) + tracking
    return x


def largura_espacada(d, texto, fonte, tracking=0):
    return sum(d.textlength(c, font=fonte) + tracking for c in texto) - tracking


def semana(d, x, y, trabalho, folga, cell, gap, apagado=False):
    """Uma faixa de sete dias: blocos de trabalho e blocos de folga."""
    for i in range(trabalho + folga):
        x0 = x + i * (cell + gap)
        box = [x0, y, x0 + cell, y + cell]
        if i < trabalho:
            alpha = 55 if apagado else 120
            d.rounded_rectangle(box, radius=cell // 6, fill=STEEL + (alpha,))
            d.rounded_rectangle(box, radius=cell // 6, outline=STEEL + (alpha + 45,), width=1)
        else:
            alpha = 120 if apagado else 230
            d.rounded_rectangle(box, radius=cell // 6, fill=CREAM + (alpha,))


def largura_semana(cell, gap, n=7):
    return n * cell + (n - 1) * gap


def main():
    saida = sys.argv[1] if len(sys.argv) > 1 else "cover-escala-6x1.jpg"
    com_titulo = "--com-titulo" in sys.argv[2:]

    img = fundo()

    brilho = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(brilho).ellipse([-420, -480, 700, 400], fill=(255, 246, 228, 46))
    brilho = brilho.filter(ImageFilter.GaussianBlur(140))
    img = Image.alpha_composite(img.convert("RGBA"), brilho).convert("RGB")

    d = ImageDraw.Draw(img, "RGBA")
    f_rotulo = ImageFont.truetype(INTER_SEMIBOLD, 19)

    if com_titulo:
        # --- versao para redes sociais: titulo a esquerda, motivo a direita ---
        f_eyebrow = ImageFont.truetype(INTER_SEMIBOLD, 19)
        f_linha1 = ImageFont.truetype(DISPLAY_BOLD, 72)
        f_numero = ImageFont.truetype(DISPLAY_BLACK, 150)
        f_sub = ImageFont.truetype(INTER_MEDIUM, 25)
        f_marca = ImageFont.truetype(INTER_SEMIBOLD, 16)
        M = 84

        texto_espacado(d, (M, 92), "TRABALHISTA EMPRESARIAL", f_eyebrow, STEEL + (255,), 3.2)
        d.text((M, 140), "FIM DA ESCALA", font=f_linha1, fill=CREAM + (255,))

        y_num = 222
        d.text((M, y_num), "6X1", font=f_numero, fill=CREAM + (255,))
        w_num = d.textlength("6X1", font=f_numero)
        d.line([(M - 14, y_num + 150), (M + w_num + 14, y_num + 42)], fill=GOLD + (255,), width=9)

        d.rounded_rectangle([M, 418, M + 116, 422], radius=2, fill=CREAM + (210,))
        d.text((M, 452), "44h → 40h semanais", font=f_sub, fill=CREAM + (225,))
        d.text((M, 490), "e dois dias de descanso remunerado", font=f_sub, fill=STEEL + (255,))

        xd, cell, gap = 712, 44, 9
        texto_espacado(d, (xd, 196), "SEIS DIAS, UMA FOLGA", f_rotulo, STEEL + (235,), 2.0)
        semana(d, xd, 226, 6, 1, cell, gap, apagado=True)
        cx = xd + 8
        d.line([(cx, 306), (cx, 342)], fill=CREAM + (150,), width=3)
        d.polygon([(cx - 8, 338), (cx + 8, 338), (cx, 352)], fill=CREAM + (190,))
        texto_espacado(d, (xd, 372), "CINCO DIAS, DUAS FOLGAS", f_rotulo, CREAM + (240,), 2.0)
        semana(d, xd, 402, 5, 2, cell, gap)

        d.rounded_rectangle([M, 580, M + 2, 604], radius=1, fill=GOLD + (255,))
        texto_espacado(d, (M + 18, 584), "BGL ADVOGADOS", f_marca, CREAM + (225,), 2.6)
    else:
        # --- capa do site: so o motivo, centralizado, sem tipografia grande ---
        cell, gap = 96, 20
        lw = largura_semana(cell, gap)
        x0 = (W - lw) // 2

        texto_espacado(d, (x0, 158), "SEIS DIAS, UMA FOLGA", f_rotulo, STEEL + (190,), 3.0)
        semana(d, x0, 196, 6, 1, cell, gap, apagado=True)

        cx = W // 2
        d.line([(cx, 322), (cx, 368)], fill=CREAM + (120,), width=3)
        d.polygon([(cx - 10, 362), (cx + 10, 362), (cx, 380)], fill=CREAM + (160,))

        texto_espacado(d, (x0, 404), "CINCO DIAS, DUAS FOLGAS", f_rotulo, CREAM + (205,), 3.0)
        semana(d, x0, 442, 5, 2, cell, gap)

        d.rounded_rectangle([x0, 586, x0 + 90, 589], radius=2, fill=GOLD + (210,))

    vinheta = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vinheta)
    for y in range(H):
        t = max(0.0, (y - H * 0.42) / (H * 0.58))
        a = int(96 * t ** 2.2)
        if a:
            vd.line([(0, y), (W, y)], fill=(8, 14, 26, a))
    img = Image.alpha_composite(img.convert("RGBA"), vinheta).convert("RGB")

    img.save(saida, quality=90, optimize=True)
    print(saida)


if __name__ == "__main__":
    main()
