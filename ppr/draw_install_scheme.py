#!/usr/bin/env python3
"""ППР: установка шести блоков на новую площадку."""

import math
import sys

import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, Polygon, Rectangle, Wedge
from matplotlib.transforms import Affine2D
from matplotlib.font_manager import FontProperties

sys.path.insert(0, "/workspace/ppr")
from draw_crane_scheme import fender, telescopic_boom, wheel_side  # noqa: E402

SANS = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
BOLD = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

INK = "#1a1a1a"
STONE = "#f3f0e8"
SLEEPER = "#e7dfd0"
RAIL = "#3e4850"
BLOCK = "#f6f1e4"
CAB = "#2f3d4a"
GLASS = "#d5e4ef"
PAD = "#5c656c"
STEEL_DK = "#3e4850"
BOOM = "#e7e1d4"
BOOM_EDGE = "#2c3136"

# Рельсы 0…18 м. Центр вращения крана так, чтобы ближняя грань посадки была в 6,5 м.
RAIL0 = 0.0
RAIL1 = 18.0
CENTER = -6.5
CAB_FRONT = CENTER + 5.0
BLOCK_W = 9.0
BLOCK_L = 3.0
BLOCK_H = 2.5
AXIS_STEP = 3.70
GAUGE = 1.52
AXES = (-AXIS_STEP, 0.0, AXIS_STEP)
PAD_X0 = -0.65
PAD_X1 = 18.65
PAD_Y = 5.55
STONE_H = 0.25
RAIL_TOP = 0.68
# Места 1…6: 1 — дальний торец, ставится первым; 6 — у крана, последним.
PLACES = ((1, 15.0), (2, 12.0), (3, 9.0), (4, 6.0), (5, 3.0), (6, 0.0))


def style_ax(ax, xlim, ylim):
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_facecolor("white")


def rect(ax, x, y, w, h, **kw):
    ax.add_patch(Rectangle((x, y), w, h, **kw))


def label(ax, x, y, text, size=8, bold=False, ha="center", va="center", color=INK, z=9, rotation=0):
    ax.text(
        x, y, text, ha=ha, va=va, color=color, fontsize=size, rotation=rotation,
        fontproperties=BOLD if bold else SANS, zorder=z,
        bbox=dict(fc="white", ec="none", pad=0.12, alpha=0.88),
    )


def hdim(ax, x1, x2, y, text, y_from, size=7.5):
    ax.plot([x1, x1], [y_from, y], color=INK, lw=0.45, zorder=6)
    ax.plot([x2, x2], [y_from, y], color=INK, lw=0.45, zorder=6)
    ax.annotate(
        "", xy=(x2, y), xytext=(x1, y),
        arrowprops=dict(arrowstyle="<->", color=INK, lw=0.7, shrinkA=0, shrinkB=0),
        zorder=6,
    )
    label(ax, (x1 + x2) / 2, y + 0.16, text, size=size, va="bottom")


def vdim(ax, y1, y2, x, text, x_from, size=7.5):
    ax.plot([x_from, x], [y1, y1], color=INK, lw=0.45, zorder=6)
    ax.plot([x_from, x], [y2, y2], color=INK, lw=0.45, zorder=6)
    ax.annotate(
        "", xy=(x, y2), xytext=(x, y1),
        arrowprops=dict(arrowstyle="<->", color=INK, lw=0.7, shrinkA=0, shrinkB=0),
        zorder=6,
    )
    ax.text(
        x + 0.16, (y1 + y2) / 2, text, ha="left", va="center", rotation=90,
        fontsize=size, fontproperties=SANS, color=INK, zorder=9,
        bbox=dict(fc="white", ec="none", pad=0.1, alpha=0.9),
    )


class XShift:
    def __init__(self, ax, dx):
        self._ax = ax
        self._dx = dx
        self._transform = Affine2D().translate(dx, 0) + ax.transData

    def add_patch(self, patch, **kwargs):
        patch.set_transform(self._transform)
        return self._ax.add_patch(patch, **kwargs)

    def plot(self, *args, **kwargs):
        if args and hasattr(args[0], "__iter__") and not isinstance(args[0], str):
            xs = [x + self._dx for x in args[0]]
            return self._ax.plot(xs, *args[1:], **kwargs)
        return self._ax.plot(*args, **kwargs)

    def text(self, x, y, s, **kwargs):
        return self._ax.text(x + self._dx, y, s, **kwargs)

    def annotate(self, text, xy, xytext=None, **kwargs):
        xy = (xy[0] + self._dx, xy[1])
        if xytext is not None:
            xytext = (xytext[0] + self._dx, xytext[1])
        return self._ax.annotate(text, xy=xy, xytext=xytext, **kwargs)

    def __getattr__(self, name):
        return getattr(self._ax, name)


def _along(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def boom_polygon(x0, y0, x1, y1, w0, w1):
    dx, dy = x1 - x0, y1 - y0
    length = (dx * dx + dy * dy) ** 0.5 or 1.0
    px, py = -dy / length, dx / length
    return [
        (x0 + px * w0 / 2, y0 + py * w0 / 2),
        (x1 + px * w1 / 2, y1 + py * w1 / 2),
        (x1 - px * w1 / 2, y1 - py * w1 / 2),
        (x0 - px * w0 / 2, y0 - py * w0 / 2),
    ]


def tire_plan(ax, x, y, w=0.62, h=0.32, z=4):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.01,rounding_size=0.08",
        fc="#242424", ec=INK, lw=0.4, zorder=z,
    ))


def draw_crane_plan(ax):
    """Кран в местных координатах: центр (0, 0), перед кабины x = 5."""
    ax.add_patch(FancyBboxPatch(
        (-3.55, -1.18), 8.55, 2.36,
        boxstyle="round,pad=0.02,rounding_size=0.12",
        fc="#d7dee4", ec=INK, lw=0.9, zorder=4,
    ))
    for wx in (3.25, -0.2, -1.55):
        tire_plan(ax, wx, 1.12, z=5)
        tire_plan(ax, wx, -1.44, z=5)
    ax.add_patch(FancyBboxPatch(
        (2.55, -1.05), 2.45, 2.10,
        boxstyle="round,pad=0.01,rounding_size=0.1",
        fc=CAB, ec=INK, lw=0.85, zorder=6,
    ))
    rect(ax, 4.75, -0.72, 0.18, 1.44, fc=GLASS, ec=INK, lw=0.3, zorder=7)
    pads = ((1.35, 2.05), (1.35, -2.65), (-2.15, 2.05), (-2.15, -2.65))
    roots = ((1.2, 0.95), (1.2, -0.95), (-0.9, 0.95), (-0.9, -0.95))
    for (px, py), (sx, sy) in zip(pads, roots):
        ax.add_patch(Polygon(
            boom_polygon(sx, sy, px + 0.32, py + 0.24, 0.22, 0.16),
            closed=True, fc="#4c565e", ec=INK, lw=0.45, zorder=5,
        ))
        rect(ax, px, py, 0.68, 0.48, fc=PAD, ec=INK, lw=0.5, zorder=6)
    ax.add_patch(Circle((0, 0), 0.95, fc="#e7ebef", ec=INK, lw=0.7, zorder=7))
    ax.add_patch(FancyBboxPatch(
        (-1.7, -0.62), 0.85, 1.24,
        boxstyle="round,pad=0.01,rounding_size=0.08",
        fc="#8b9298", ec=INK, lw=0.6, zorder=8,
    ))
    ax.add_patch(Circle((0, 0), 0.08, fc=INK, zorder=9))
    ax.plot([-0.22, 0.22], [0, 0], color="white", lw=0.6, zorder=9)
    ax.plot([0, 0], [-0.22, 0.22], color="white", lw=0.6, zorder=9)
    # Узкая стрела по оси, кабина остаётся видна по бокам. Крюк — середина блока, вылет 8 м.
    ax.add_patch(Polygon(
        boom_polygon(0.35, 0.0, 7.85, 0.0, 0.38, 0.16),
        closed=True, fc="#cfc6b4", ec=INK, lw=0.7, zorder=8,
    ))
    ax.plot([0.55, 7.7], [0.07, 0.07], color="#6a6256", lw=0.45, zorder=9)
    ax.add_patch(Circle((8.0, 0.0), 0.16, fc=INK, ec=INK, lw=0.4, zorder=10))
    ax.add_patch(Circle((8.0, 0.0), 0.06, fc="white", zorder=11))


def draw_rails(ax, x0, x1, z=2):
    step = 0.5
    x = x0
    while x <= x1 + 1e-6:
        for axis in AXES:
            rect(
                ax, x - 0.08, axis - 1.35, 0.16, 2.70,
                fc=SLEEPER, ec="#d5cbb8", lw=0.2, zorder=z,
            )
        x += step
    half = GAUGE / 2
    for axis in AXES:
        for sign in (-1, 1):
            y = axis + sign * half
            y0 = y if sign > 0 else y - 0.07
            rect(ax, x0, y0, x1 - x0, 0.07, fc=RAIL, ec=INK, lw=0.2, zorder=z + 1)


def draw_plan(ax):
    style_ax(ax, (-12.4, 21.4), (-9.05, 7.9))
    rect(ax, PAD_X0, -PAD_Y, PAD_X1 - PAD_X0, PAD_Y * 2, fc=STONE, ec="#ddd6c8", lw=0.5, hatch="..", zorder=0)
    draw_rails(ax, RAIL0, RAIL1)
    for number, x0 in PLACES:
        if number == 6:
            continue
        ax.add_patch(Rectangle(
            (x0, -BLOCK_W / 2), BLOCK_L, BLOCK_W,
            fc="none", ec=INK, lw=0.9, ls=(0, (5, 2.2)), zorder=4,
        ))
        label(ax, x0 + 1.5, 2.15, str(number), size=11, bold=True)
        if number == 1:
            label(ax, x0 + 1.5, -1.85, "первым", size=7)
    rect(ax, 0, -BLOCK_W / 2, BLOCK_L, BLOCK_W, fc=BLOCK, ec=INK, lw=1.15, zorder=5)
    for cx, cy in ((0, -4.5), (3, -4.5), (0, 4.5), (3, 4.5)):
        rect(ax, cx - 0.08, cy - 0.08, 0.16, 0.16, fc="#cfc6b4", ec=INK, lw=0.35, zorder=6)
    label(ax, 1.5, 2.15, "6", size=12, bold=True)
    label(ax, 1.5, -1.85, "посадка", size=8, bold=True)
    label(ax, 1.82, 0.42, "крюк", size=7, ha="left")

    crane = XShift(ax, CENTER)
    draw_crane_plan(crane)
    ax.plot([CENTER, CENTER], [-1.3, 1.3], color=INK, lw=0.7, zorder=3)
    label(ax, CENTER, 3.55, "центр\nвращения", size=7)

    ax.annotate(
        "", xy=(16.5, 6.05), xytext=(1.5, 6.05),
        arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.15), zorder=6,
    )
    label(ax, 9.0, 6.55, "блок 1 передвигают на место 1", size=8)

    label(ax, 9.0, 7.45, "План. Шесть мест на путях", size=12, bold=True)
    label(ax, -8.6, -4.6, "кран за торцом", size=7.5)

    hdim(ax, 0, 3, -6.05, "3,0", y_from=-4.5, size=7.5)
    hdim(ax, 0, 18, -6.85, "18,0", y_from=-4.5, size=8)
    hdim(ax, PAD_X0, PAD_X1, -7.6, "19,30", y_from=-PAD_Y, size=7.5)
    hdim(ax, CENTER, 0, -8.45, "6,5", y_from=-3.15, size=8)
    hdim(ax, CENTER, CAB_FRONT, -4.55, "5,0", y_from=-3.15, size=7.5)
    vdim(ax, -4.5, 4.5, 19.35, "9,0", x_from=18, size=8)
    vdim(ax, -PAD_Y, PAD_Y, 20.45, "11,10", x_from=18.65, size=7.5)
    label(ax, 10.5, -1.85, "места 2–5 — следующие", size=7)


def block_side(ax, x, y, w, h):
    rect(ax, x, y, w, h, fc=BLOCK, ec=INK, lw=1.0, zorder=4)
    rect(ax, x, y + h - 0.08, w, 0.08, fc="#e7dfd0", ec=INK, lw=0.25, zorder=5)
    rect(ax, x, y, 0.07, h, fc="#cfc6b4", ec=INK, lw=0.25, zorder=5)
    rect(ax, x + w - 0.07, y, 0.07, h, fc="#cfc6b4", ec=INK, lw=0.25, zorder=5)
    ww, wh = 1.15, h * 0.24
    rect(ax, x + (w - ww) / 2, y + h * 0.52, ww, wh, fc=GLASS, ec=INK, lw=0.4, zorder=5)


def draw_crane_side(ax):
    """Кран в местных координатах: перед кабины x = 5, как на схеме крана."""
    rect(ax, -3.55, 0.92, 8.55, 0.32, fc="#c5ced6", ec=INK, lw=0.7, zorder=3)
    rect(ax, 0.55, 0.55, 0.85, 0.42, fc="#8d98a2", ec=INK, lw=0.4, zorder=3)
    for cx, dual in ((3.95, False), (-0.15, True), (-1.55, True)):
        fender(ax, cx, 0.52, 0.48, z=3)
        wheel_side(ax, cx, 0.52, 0.48, dual=dual)
    for jx in (1.85, -2.55):
        rect(ax, jx, 0.08, 0.12, 0.86, fc="#4e585f", ec=INK, lw=0.35, zorder=3)
        rect(ax, jx - 0.18, 0.0, 0.48, 0.09, fc=PAD, ec=INK, lw=0.35, zorder=3)
    ax.add_patch(Polygon(
        [(2.55, 1.18), (2.55, 2.55), (2.85, 2.82), (4.15, 2.76),
         (4.55, 2.15), (5.00, 1.42), (5.00, 1.12), (2.55, 1.18)],
        closed=True, fc=CAB, ec=INK, lw=0.85, zorder=5,
    ))
    rect(ax, 2.82, 1.48, 1.05, 0.82, fc="#162430", ec=GLASS, lw=0.35, zorder=6)
    ax.add_patch(Polygon(
        [(4.22, 2.62), (4.48, 2.22), (4.82, 1.62), (4.48, 1.88)],
        closed=True, fc=GLASS, ec=INK, lw=0.35, zorder=6,
    ))
    rect(ax, -2.85, 1.22, 2.15, 1.45, fc="#9aa3ab", ec=INK, lw=0.7, zorder=4)
    for i in range(3):
        ax.plot([-2.65, -0.88], [1.48 + i * 0.32, 1.48 + i * 0.32], color="#6d767e", lw=0.5, zorder=5)
    ax.add_patch(FancyBboxPatch(
        (-0.55, 1.28), 1.35, 1.28,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        fc=CAB, ec=INK, lw=0.7, zorder=5,
    ))
    ax.add_patch(Polygon(
        [(-0.28, 1.85), (0.45, 1.85), (0.55, 2.22), (-0.18, 2.28)],
        closed=True, fc=GLASS, ec=INK, lw=0.35, zorder=6,
    ))
    root = (0.35, 2.35)
    tip = (8.0, 8.55)
    telescopic_boom(ax, root, tip, 0.48, z=4)
    seat = _along(root, tip, 0.28)
    ax.plot([0.05, seat[0]], [1.55, seat[1]], color="#3c454c", lw=3.2, solid_capstyle="butt", zorder=3)
    ax.add_patch(Circle(root, 0.11, fc="#2a2a2a", ec=INK, lw=0.4, zorder=6))
    ax.add_patch(Circle(tip, 0.16, fc="#efeae0", ec=INK, lw=0.5, zorder=6))
    ax.add_patch(Circle((tip[0] + 0.02, tip[1] - 0.02), 0.06, fc=INK, zorder=7))


def draw_side(ax):
    style_ax(ax, (-11.4, 7.6), (-2.15, 10.6))
    ax.plot([-11.0, 7.2], [0, 0], color=INK, lw=1.0, zorder=2)
    rect(ax, PAD_X0, -0.28, 6.2, 0.28, fc=STONE, ec="none", hatch="..", zorder=0)
    rect(ax, PAD_X0, 0.0, 6.2, STONE_H, fc=STONE, ec="#ddd6c8", lw=0.4, hatch="..", zorder=1)
    rect(ax, RAIL0, STONE_H, 5.2, 0.20, fc=SLEEPER, ec="#c9c1b4", lw=0.3, zorder=2)
    rect(ax, RAIL0, RAIL_TOP - 0.16, 5.2, 0.06, fc="#5c656c", ec=INK, lw=0.25, zorder=3)
    rect(ax, RAIL0, RAIL_TOP - 0.10, 5.2, 0.10, fc=RAIL, ec=INK, lw=0.3, zorder=3)

    crane = XShift(ax, CENTER)
    draw_crane_side(crane)

    top = RAIL_TOP + BLOCK_H
    ax.plot([1.46, 1.46], [8.35, top + 0.62], color=INK, lw=0.85, zorder=5)
    ax.plot([1.54, 1.54], [8.35, top + 0.62], color=INK, lw=0.55, zorder=5)
    ax.add_patch(FancyBboxPatch(
        (1.22, top + 0.42), 0.56, 0.28,
        boxstyle="round,pad=0.01,rounding_size=0.04",
        fc="#f4f4f4", ec=INK, lw=0.6, zorder=6,
    ))
    ax.add_patch(Wedge((1.5, top + 0.38), 0.16, 200, 340, width=0.045, fc=INK, ec=INK, zorder=7))

    block_side(ax, 0, RAIL_TOP, BLOCK_L, BLOCK_H)
    label(ax, 1.5, RAIL_TOP + 0.85, "блок", size=8, bold=True)
    label(ax, 2.35, top + 0.85, "крюк", size=7, ha="left")
    label(ax, CENTER - 3.3, 2.55, "кран", size=8)
    ax.plot([CENTER, CENTER], [0.0, 0.42], color=INK, lw=0.7, zorder=4)
    label(ax, CENTER - 0.85, -0.72, "центр вращения", size=7, ha="right")

    hdim(ax, CENTER, 0, -1.55, "6,5", y_from=0, size=7.5)
    vdim(ax, RAIL_TOP, top, 3.85, "2,5", x_from=3.0, size=7.5)
    ax.plot([5.55, 6.05], [0, 0], color=INK, lw=0.45, zorder=6)
    ax.plot([5.55, 6.05], [STONE_H, STONE_H], color=INK, lw=0.45, zorder=6)
    ax.annotate(
        "", xy=(6.05, STONE_H), xytext=(6.05, 0),
        arrowprops=dict(arrowstyle="<->", color=INK, lw=0.7, shrinkA=0, shrinkB=0),
        zorder=6,
    )
    label(ax, 6.55, 0.12, "0,25", size=7, ha="left")
    label(ax, -4.6, 9.85, "Посадка блока на рельсы", size=11, bold=True)


def main():
    fig = plt.figure(figsize=(16.54, 11.69), dpi=160, facecolor="white")
    fig.text(
        0.04, 0.972, "Схема установки блоков на новую площадку",
        ha="left", va="top", fontsize=16, fontproperties=BOLD, color=INK,
    )
    fig.text(
        0.04, 0.942,
        "Шесть блоков 3 × 9 × 2,5 м, масса каждого 8,7 т. Размеры в метрах.",
        ha="left", va="top", fontsize=9, fontproperties=SANS, color=INK,
    )
    draw_plan(fig.add_axes([0.012, 0.40, 0.976, 0.52]))
    draw_side(fig.add_axes([0.02, 0.045, 0.60, 0.33]))

    notes = (
        "1. Пути и щебень — по схеме площадки.\n"
        "    Три пути, колея 1520 мм.\n"
        "2. Кран ставят с торца, за площадкой.\n"
        "    Центр вращения — в 6,5 м от начала\n"
        "    рельсов. Опоры полностью. Стрела\n"
        "    только вперёд над кабиной.\n"
        "    5,0 м до переда кабины сверяют\n"
        "    обмером. На посадке кран с этой\n"
        "    стоянки не переезжает.\n"
        "3. Блок опускают на головки рельсов:\n"
        "    3 м вдоль путей, 9 м поперёк.\n"
        "    Середина блока — вылет 8,0 м.\n"
        "    Строп 4СЦ — по схеме строповки.\n"
        "    Длинномер подают и убирают\n"
        "    по схеме крана.\n"
        "4. После посадки кран собирает стрелу\n"
        "    и уходит со створа. Блок передвигают\n"
        "    по рельсам на своё место. Экскаватор\n"
        "    стоит дальше по ходу и тянет блок\n"
        "    к себе, по схеме передвижки.\n"
        "5. Первым уходит место 1, дальний\n"
        "    торец. Последним ставят место 6,\n"
        "    оно остаётся у крана. Блоки ставят\n"
        "    вплотную, торец к торцу.\n"
        "    В сборе модуль 18 × 9 м."
    )
    fig.text(
        0.64, 0.36, notes, ha="left", va="top", fontsize=8.0,
        fontproperties=SANS, color=INK, linespacing=1.28,
    )
    fig.add_artist(Rectangle(
        (0.012, 0.015), 0.976, 0.97, transform=fig.transFigure,
        fill=False, edgecolor=INK, lw=1.15,
    ))
    fig.savefig("/workspace/ppr/skhema-ustanovka.png", dpi=160, facecolor="white")
    fig.savefig("/workspace/ppr/skhema-ustanovka.pdf", facecolor="white")
    print("center", CENTER, "cab", CAB_FRONT, "outreach", 1.5 - CENTER)


if __name__ == "__main__":
    main()
