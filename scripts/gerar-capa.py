# -*- coding: utf-8 -*-
"""Gera a capa de um artigo do blog da BGL na identidade visual do site.

Uso: python3 gerar-capa.py <area> <caminho-de-saida.jpg> [semente]
     area: imobiliario | trabalhista | civil | empresarial

A imagem sai em 1200x800, fundo azul-marinho com um motivo geometrico
proprio de cada area. Serve de capa quando nao ha uma imagem fornecida
para o artigo.
"""
import math
import random
import sys

from PIL import Image, ImageDraw, ImageFilter

W, H = 1200, 800
NAVY = (22, 36, 61)
NAVY_DEEP = (13, 22, 38)
CREAM = (233, 226, 212)
STEEL = (120, 142, 173)


def fundo():
    grad = Image.new("L", (W, H))
    gd = ImageDraw.Draw(grad)
    for i in range(W + H):
        gd.line([(i, 0), (0, i)], fill=int(255 * (1 - i / (W + H)) ** 1.6))
    base = Image.new("RGB", (W, H), NAVY)
    return Image.composite(base, Image.new("RGB", (W, H), NAVY_DEEP), grad)


def motivo_trabalhista(d, rnd):
    left, top, cw, ch, gap, cols, rows = 150, 190, 112, 58, 14, 7, 6
    for r in range(rows):
        for c in range(cols):
            x0, y0 = left + c * (cw + gap), top + r * (ch + gap)
            box = [x0, y0, x0 + cw, y0 + ch]
            if c < cols - 1 and rnd.random() < 0.45:
                d.rounded_rectangle(box, radius=6, fill=STEEL + (rnd.randint(45, 115),))
            else:
                d.rounded_rectangle(box, radius=6, outline=STEEL + (60,), width=1)
            if c == cols - 1:
                d.rounded_rectangle(box, radius=6, outline=CREAM + (150,), width=2)


def motivo_imobiliario(d, rnd):
    left, top, u = 170, 180, 92
    planta = [(0, 0, 5, 4), (5, 0, 8, 2), (5, 2, 8, 4), (0, 4, 3, 6), (3, 4, 8, 6)]
    for (a, b, c, e) in planta:
        box = [left + a * u, top + b * u, left + c * u, top + e * u]
        d.rectangle(box, outline=STEEL + (80,), width=2)
    d.rectangle([left, top, left + 8 * u, top + 6 * u], outline=CREAM + (150,), width=3)
    for i in range(1, 6):
        y = top + i * u
        d.line([(left - 40, y), (left - 16, y)], fill=STEEL + (70,), width=2)


def motivo_civil(d, rnd):
    left, top, w = 200, 170, 800
    for i in range(16):
        y = top + i * 30
        largura = w if i % 5 else int(w * 0.62)
        alpha = 95 if i % 5 else 150
        cor = STEEL + (alpha,) if i % 5 else CREAM + (alpha,)
        d.rounded_rectangle([left, y, left + largura, y + 10], radius=5, fill=cor)
    d.line([(left, top - 30), (left, top + 16 * 30 + 10)], fill=CREAM + (120,), width=2)


def motivo_empresarial(d, rnd):
    cx, top, u = W // 2, 200, 130
    nos = [(cx, top), (cx - 2 * u, top + 2 * u), (cx, top + 2 * u), (cx + 2 * u, top + 2 * u)]
    for (x, y) in nos[1:]:
        d.line([(cx, top + 34), (x, y - 34)], fill=STEEL + (80,), width=2)
    for i, (x, y) in enumerate(nos):
        r = 40 if i == 0 else 32
        cor = CREAM + (160,) if i == 0 else STEEL + (110,)
        d.ellipse([x - r, y - r, x + r, y + r], outline=cor, width=3)


MOTIVOS = {
    "trabalhista": motivo_trabalhista,
    "imobiliario": motivo_imobiliario,
    "civil": motivo_civil,
    "empresarial": motivo_empresarial,
}


def main():
    area = sys.argv[1].strip().lower()
    saida = sys.argv[2]
    semente = int(sys.argv[3]) if len(sys.argv) > 3 else 141
    if area not in MOTIVOS:
        raise SystemExit("area invalida: use imobiliario, trabalhista, civil ou empresarial")

    rnd = random.Random(semente)
    img = fundo()
    d = ImageDraw.Draw(img, "RGBA")
    MOTIVOS[area](d, rnd)

    brilho = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(brilho).ellipse([-460, -520, 760, 460], fill=(255, 246, 228, 42))
    brilho = brilho.filter(ImageFilter.GaussianBlur(150))
    img = Image.alpha_composite(img.convert("RGBA"), brilho).convert("RGB")

    vinheta = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vinheta)
    for y in range(H):
        t = max(0.0, (y - H * 0.35) / (H * 0.65))
        a = int(110 * t ** 2.2)
        if a:
            vd.line([(0, y), (W, y)], fill=(8, 14, 26, a))
    img = Image.alpha_composite(img.convert("RGBA"), vinheta).convert("RGB")

    img.filter(ImageFilter.SMOOTH).save(saida, quality=88, optimize=True)
    print(saida)


if __name__ == "__main__":
    main()
