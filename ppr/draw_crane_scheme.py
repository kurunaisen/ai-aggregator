#!/usr/bin/env python3
"""ППР: схема установки крана и погрузки блока."""

import math

import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, Polygon, Rectangle, Wedge
from matplotlib.font_manager import FontProperties

SANS = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
BOLD = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

INK = "#1a1a1a"
STEEL = "#6d7882"
STEEL_DK = "#3e4850"
CAB = "#2f3d4a"
GLASS = "#d5e4ef"
BOOM = "#e7e2d6"
BOOM_EDGE = "#2c3136"
DECK = "#e4c99a"
DECK_DK = "#c4a36e"
BLOCK = "#f6f1e4"
COUNTER = "#8b9298"
PAD = "#5c656c"
GROUND = "#eceae4"


def style_ax(ax, xlim, ylim):
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_facecolor("white")


def rect(ax, x, y, w, h, **kw):
    ax.add_patch(Rectangle((x, y), w, h, **kw))


def label(ax, x, y, text, size=8, bold=False, ha="center", va="center", color=INK, z=8, rotation=0):
    ax.text(
        x, y, text, ha=ha, va=va, color=color, fontsize=size, rotation=rotation,
        fontproperties=BOLD if bold else SANS, zorder=z,
    )


def hdim(ax, x1, x2, y, text, y_from, size=7.5):
    ax.plot([x1, x1], [y_from, y], color=INK, lw=0.45, zorder=4)
    ax.plot([x2, x2], [y_from, y], color=INK, lw=0.45, zorder=4)
    ax.annotate(
        "", xy=(x2, y), xytext=(x1, y),
        arrowprops=dict(arrowstyle="<->", color=INK, lw=0.7, shrinkA=0, shrinkB=0),
        zorder=4,
    )
    label(ax, (x1 + x2) / 2, y + 0.14, text, size=size, va="bottom")


def vdim(ax, y1, y2, x, text, x_from, size=7.5):
    ax.plot([x_from, x], [y1, y1], color=INK, lw=0.45, zorder=4)
    ax.plot([x_from, x], [y2, y2], color=INK, lw=0.45, zorder=4)
    ax.annotate(
        "", xy=(x, y2), xytext=(x, y1),
        arrowprops=dict(arrowstyle="<->", color=INK, lw=0.7, shrinkA=0, shrinkB=0),
        zorder=4,
    )
    ax.text(
        x + 0.16, (y1 + y2) / 2, text, ha="left", va="center", rotation=90,
        fontsize=size, fontproperties=SANS, color=INK, zorder=8,
    )


def _along(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def boom_polygon(x0, y0, x1, y1, w0, w1):
    dx, dy = x1 - x0, y1 - y0
    length = math.hypot(dx, dy) or 1.0
    px, py = -dy / length, dx / length
    return [
        (x0 + px * w0 / 2, y0 + py * w0 / 2),
        (x1 + px * w1 / 2, y1 + py * w1 / 2),
        (x1 - px * w1 / 2, y1 - py * w1 / 2),
        (x0 - px * w0 / 2, y0 - py * w0 / 2),
    ]


def wheel_side(ax, cx, cy, r, z=5):
    ax.add_patch(Circle((cx, cy), r, fc="#242424", ec=INK, lw=0.6, zorder=z))
    ax.add_patch(Circle((cx, cy), r * 0.62, fc="#efefef", ec=INK, lw=0.45, zorder=z + 1))
    ax.add_patch(Circle((cx, cy), r * 0.16, fc="#4a4a4a", ec=INK, lw=0.35, zorder=z + 2))


def draw_crane_plan(ax, boom_to):
    """Автокран в плане. Центр вращения (0, 0), кабина в сторону +X, перед кабины x = 5,0."""
    # Chassis
    ax.add_patch(FancyBboxPatch(
        (-3.55, -1.18), 8.55, 2.36,
        boxstyle="round,pad=0.02,rounding_size=0.18",
        fc="#d5dbe1", ec=INK, lw=1.05, zorder=2,
    ))
    # Rear bumper and mudflaps
    rect(ax, -3.72, -1.22, 0.22, 2.44, fc=STEEL_DK, ec=INK, lw=0.6, zorder=3)
    # Deck behind the cab
    rect(ax, 1.15, -1.05, 1.45, 2.10, fc="#c3ccd4", ec=INK, lw=0.6, zorder=3)
    # Cab
    ax.add_patch(FancyBboxPatch(
        (2.55, -1.12), 2.45, 2.24,
        boxstyle="round,pad=0.01,rounding_size=0.12",
        fc=CAB, ec=INK, lw=1.0, zorder=4,
    ))
    rect(ax, 4.58, -0.86, 0.32, 1.72, fc=GLASS, ec=INK, lw=0.5, zorder=5)
    rect(ax, 2.85, 0.55, 1.35, 0.38, fc="#24323d", ec=GLASS, lw=0.4, zorder=5)
    rect(ax, 2.85, -0.93, 1.35, 0.38, fc="#24323d", ec=GLASS, lw=0.4, zorder=5)
    for my in (1.20, -1.44):
        rect(ax, 4.25, my, 0.62, 0.22, fc="#1e1e1e", ec=INK, lw=0.4, zorder=5)

    # Wheels, three axles
    def tire(x, y):
        ax.add_patch(FancyBboxPatch(
            (x, y), 0.78, 0.36,
            boxstyle="round,pad=0.01,rounding_size=0.08",
            fc="#2a2a2a", ec=INK, lw=0.45, zorder=4,
        ))

    for wx in (3.35, -0.15, -1.55):
        tire(wx, 1.12)
        tire(wx, -1.48)

    # Outriggers and pads. Centres stay on the previous support contour.
    pads = ((1.35, 2.35), (1.35, -3.15), (-2.25, 2.35), (-2.25, -3.15))
    roots = ((1.55, 1.05), (1.55, -1.05), (-1.15, 1.05), (-1.15, -1.05))
    for (px, py), (sx, sy) in zip(pads, roots):
        ax.plot([sx, px + 0.42], [sy, py + 0.32], color=STEEL_DK, lw=4.2,
                solid_capstyle="round", zorder=3)
        ax.plot([sx, px + 0.42], [sy, py + 0.32], color="#9aa3aa", lw=1.4,
                solid_capstyle="round", zorder=3)
        ax.add_patch(FancyBboxPatch(
            (px, py), 0.84, 0.64,
            boxstyle="round,pad=0.01,rounding_size=0.06",
            fc=PAD, ec=INK, lw=0.7, zorder=4,
        ))
        rect(ax, px + 0.18, py + 0.14, 0.48, 0.36, fc="#3a4146", ec=INK, lw=0.35, zorder=5)
    label(ax, -3.15, 3.35, "опора", size=7, ha="left")

    # Turntable, counterweight, operator cab
    ax.add_patch(Circle((0, 0), 1.28, fc="#eceff2", ec=INK, lw=1.15, zorder=5))
    ax.add_patch(Circle((0, 0), 0.92, fc="#f7f8f8", ec=INK, lw=0.7, zorder=5))
    ax.add_patch(FancyBboxPatch(
        (-2.05, -0.78), 1.05, 1.56,
        boxstyle="round,pad=0.01,rounding_size=0.08",
        fc=COUNTER, ec=INK, lw=0.8, zorder=6,
    ))
    rect(ax, -0.05, 0.48, 0.95, 0.62, fc=CAB, ec=INK, lw=0.6, zorder=6)
    rect(ax, 0.15, 0.62, 0.55, 0.32, fc=GLASS, ec=INK, lw=0.35, zorder=7)
    ax.add_patch(Circle((0, 0), 0.13, fc=INK, ec=INK, zorder=7))
    ax.plot([-0.42, 0.42], [0, 0], color="white", lw=0.7, zorder=7)
    ax.plot([0, 0], [-0.42, 0.42], color="white", lw=0.7, zorder=7)

    # Narrow telescopic boom so the cab stays visible on both sides of it
    tip = boom_to - 0.15
    poly = boom_polygon(0.20, 0.0, tip, 0.0, 0.50, 0.22)
    ax.add_patch(Polygon(poly, closed=True, fc="#f3efe4", ec=BOOM_EDGE, lw=1.05, zorder=6))
    ax.plot([0.35, tip - 0.05], [0, 0], color="#b7b1a4", lw=0.6, zorder=7)
    for t in (0.36, 0.62, 0.82):
        p = _along((0.20, 0.0), (tip, 0.0), t)
        half = 0.25 - t * 0.13
        ax.plot([p[0], p[0]], [p[1] - half, p[1] + half], color=BOOM_EDGE, lw=0.75, zorder=7)
    rect(ax, tip - 0.02, -0.20, 0.42, 0.40, fc="#e4dfd2", ec=INK, lw=0.8, zorder=7)
    ax.add_patch(Circle((tip + 0.28, 0.08), 0.07, fc="#222", ec=INK, lw=0.3, zorder=8))
    ax.add_patch(Circle((tip + 0.28, -0.08), 0.07, fc="#222", ec=INK, lw=0.3, zorder=8))
    ax.plot(boom_to, 0, marker="+", color=INK, ms=10, mew=1.2, zorder=8)
    label(ax, 1.55, 1.85, "стрела", size=7.5)


def draw_block(ax, x0, y0=-4.5, length=3.0, width=9.0, caption=None):
    rect(ax, x0, y0, length, width, fc=BLOCK, ec=INK, lw=1.25, zorder=4)
    ax.plot([x0, x0 + length], [y0 + width / 2, y0 + width / 2], color="#c8bfae", lw=0.6, zorder=4)
    ax.plot([x0 + length / 2, x0 + length / 2], [y0, y0 + width], color="#c8bfae", lw=0.6, zorder=4)
    if caption is None:
        caption = (x0 + length / 2, y0 + width + 0.48)
    label(ax, caption[0], caption[1], "блок 3 × 9 м", size=8, bold=True)


def draw_flatbed_plan(ax):
    """Шаланда 13,6 × 2,5 м поперёк стрелы. Тягач со стороны −Y, за пределами площадки."""
    deck_x, deck_y, deck_w, deck_h = 5.75, -6.8, 2.50, 13.6
    rect(ax, deck_x, deck_y, deck_w, deck_h, fc=DECK, ec=DECK_DK, lw=0.8, zorder=2)
    # Planks on the ends that stay visible past the block
    for y in (i * 0.28 for i in range(int(13.6 / 0.28))):
        yy = deck_y + y
        if -4.35 < yy < 4.35:
            continue
        ax.plot([deck_x, deck_x + deck_w], [yy, yy], color=DECK_DK, lw=0.35, zorder=2)
    # Side rails
    rect(ax, deck_x - 0.06, deck_y, 0.06, deck_h, fc=STEEL, ec=INK, lw=0.3, zorder=3)
    rect(ax, deck_x + deck_w, deck_y, 0.06, deck_h, fc=STEEL, ec=INK, lw=0.3, zorder=3)
    # Rear bumper and lamps
    rect(ax, deck_x - 0.08, deck_y + deck_h, deck_w + 0.16, 0.16, fc=STEEL_DK, ec=INK, lw=0.45, zorder=5)
    for lx in (deck_x + 0.15, deck_x + deck_w - 0.40):
        rect(ax, lx, deck_y + deck_h + 0.02, 0.26, 0.10, fc="#b23b3b", ec=INK, lw=0.25, zorder=6)

    def dual(cx, cy):
        for dx in (-0.34, -0.12):
            ax.add_patch(FancyBboxPatch(
                (cx + dx, cy), 0.20, 0.62,
                boxstyle="round,pad=0.005,rounding_size=0.05",
                fc="#2a2a2a", ec=INK, lw=0.35, zorder=5,
            ))

    for cy in (4.70, 5.35, 6.00):
        dual(5.15, cy)
        dual(8.35, cy)

    # Tractor, cab-over, coupled at the near end
    rect(ax, 5.95, -8.55, 2.10, 1.85, fc="#c5ced6", ec=INK, lw=0.7, zorder=5)  # chassis
    ax.add_patch(FancyBboxPatch(
        (6.05, -9.55), 1.90, 1.35,
        boxstyle="round,pad=0.01,rounding_size=0.1",
        fc=CAB, ec=INK, lw=0.9, zorder=6,
    ))
    rect(ax, 6.25, -9.48, 1.50, 0.28, fc=GLASS, ec=INK, lw=0.35, zorder=7)
    for tx in (6.25, 7.55):
        ax.add_patch(FancyBboxPatch(
            (tx, -8.95), 0.42, 0.32,
            boxstyle="round,pad=0.005,rounding_size=0.04",
            fc="#2a2a2a", ec=INK, lw=0.35, zorder=6,
        ))
        ax.add_patch(FancyBboxPatch(
            (tx, -8.15), 0.42, 0.32,
            boxstyle="round,pad=0.005,rounding_size=0.04",
            fc="#2a2a2a", ec=INK, lw=0.35, zorder=6,
        ))
    label(ax, 7.0, -8.85, "тягач", size=6.5, color="white")
    label(ax, 5.45, -5.55, "шаланда\n13,6 × 2,5", size=7.5, ha="right")


def draw_plan_lift(ax):
    style_ax(ax, (-5.4, 12.3), (-12.3, 8.4))
    ax.plot([-4.2, 11.2], [0, 0], color="#9aa0a6", lw=0.6, ls=(0, (7, 2, 1.4, 2)), zorder=1)
    draw_crane_plan(ax, 8.0)
    draw_block(ax, 6.5)
    hdim(ax, 0, 5.0, -10.55, "5,0", y_from=-1.48)
    hdim(ax, 5.0, 6.5, -10.55, "1,5", y_from=-4.5)
    hdim(ax, 6.5, 9.5, -11.45, "3,0", y_from=-4.5)
    hdim(ax, 0, 8.0, -12.15, "вылет 8,0", y_from=0)
    vdim(ax, -4.5, 4.5, 11.15, "9,0", x_from=9.5)
    label(ax, -0.2, -4.15, "центр вращения", size=6.5)
    label(ax, 2.2, 7.85, "План. Подъём", size=12, bold=True)
    label(ax, 2.2, 7.15, "блок на земле, длинномера нет", size=8)


def draw_plan_set(ax):
    style_ax(ax, (-5.4, 12.3), (-12.3, 8.4))
    ax.plot([-4.2, 11.2], [0, 0], color="#9aa0a6", lw=0.6, ls=(0, (7, 2, 1.4, 2)), zorder=1)
    draw_flatbed_plan(ax)
    draw_crane_plan(ax, 7.0)
    draw_block(ax, 5.5, caption=(7.0, 2.6))
    # Entry arrow along the free side of the trailer
    ax.annotate(
        "", xy=(9.55, 2.6), xytext=(9.55, -1.6),
        arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.0),
        zorder=6,
    )
    label(ax, 10.05, 0.5, "заезд", size=7, rotation=90)
    hdim(ax, 5.0, 5.75, -10.55, "0,75", y_from=-1.48)
    hdim(ax, 5.5, 8.5, -11.45, "3,0", y_from=-4.5)
    hdim(ax, 0, 5.0, -11.45, "5,0", y_from=-1.48)
    hdim(ax, 0, 7.0, -12.15, "вылет 7,0", y_from=0)
    vdim(ax, -4.5, 4.5, 11.15, "9,0", x_from=9.5)
    label(ax, -0.2, -4.15, "центр вращения", size=6.5)
    label(ax, 1.4, 7.85, "План. Посадка", size=12, bold=True)
    label(ax, 1.4, 7.15, "блок на весу, площадка под крюком", size=8)


def draw_crane_elevation(ax):
    style_ax(ax, (-4.6, 14.2), (-1.7, 13.6))
    ax.plot([-4.3, 13.6], [0, 0], color=INK, lw=1.15, zorder=2)
    rect(ax, -4.3, -0.55, 17.9, 0.55, fc=GROUND, ec="none", zorder=1)
    for gx in range(-4, 14):
        ax.plot([gx, gx + 0.35], [-0.55, 0], color="#d4d0c8", lw=0.4, zorder=1)

    # Chassis and running gear
    rect(ax, -3.45, 0.78, 8.45, 0.42, fc="#b7c0c8", ec=INK, lw=0.8, zorder=3)
    rect(ax, -3.55, 0.62, 0.28, 0.28, fc=STEEL_DK, ec=INK, lw=0.4, zorder=3)
    for cx in (3.85, -0.15, -1.55):
        wheel_side(ax, cx, 0.52, 0.52)
    # Front outrigger jack, shown so the stance is readable
    rect(ax, 1.55, 0.08, 0.16, 0.78, fc=STEEL_DK, ec=INK, lw=0.45, zorder=3)
    rect(ax, 1.28, 0.0, 0.70, 0.12, fc=PAD, ec=INK, lw=0.45, zorder=3)

    # Cab
    cab = Polygon(
        [(2.62, 1.20), (4.92, 1.20), (5.00, 1.55), (4.72, 2.35),
         (4.28, 3.05), (2.72, 3.12), (2.62, 1.20)],
        closed=True, fc=CAB, ec=INK, lw=0.9, zorder=4,
    )
    ax.add_patch(cab)
    ax.add_patch(Polygon(
        [(4.55, 1.85), (4.88, 1.72), (4.62, 2.45), (4.22, 2.85)],
        closed=True, fc=GLASS, ec=INK, lw=0.45, zorder=5,
    ))
    rect(ax, 3.05, 1.85, 0.95, 0.78, fc="#24323d", ec=GLASS, lw=0.4, zorder=5)
    rect(ax, 4.95, 1.25, 0.12, 0.35, fc="#c8c8c8", ec=INK, lw=0.3, zorder=5)  # mirror stalk
    label(ax, 3.55, 3.45, "кабина", size=7)

    # Superstructure
    rect(ax, -2.85, 1.28, 2.15, 1.55, fc=COUNTER, ec=INK, lw=0.8, zorder=4)
    for i in range(3):
        ax.plot([-2.65, -0.85], [1.55 + i * 0.32, 1.55 + i * 0.32], color="#6e757b", lw=0.5, zorder=5)
    ax.add_patch(FancyBboxPatch(
        (-0.35, 1.35), 1.35, 1.45,
        boxstyle="round,pad=0.01,rounding_size=0.08",
        fc=CAB, ec=INK, lw=0.8, zorder=5,
    ))
    rect(ax, -0.05, 1.85, 0.85, 0.62, fc=GLASS, ec=INK, lw=0.4, zorder=6)
    ax.add_patch(Circle((0.35, 2.55), 0.16, fc="#222", ec=INK, lw=0.4, zorder=6))

    # Boom, 14 m drawn to the head above the hook
    root = (0.35, 2.55)
    tip = (6.55, 11.55)
    ax.add_patch(Polygon(boom_polygon(*root, *tip, 0.62, 0.28), closed=True,
                         fc=BOOM, ec=BOOM_EDGE, lw=0.95, zorder=4))
    for t in (0.30, 0.52, 0.74):
        a = _along(root, tip, t - 0.01)
        b = _along(root, tip, t + 0.01)
        # a short transverse tick via the polygon edges is enough: draw a line across
        dx, dy = tip[0] - root[0], tip[1] - root[1]
        length = math.hypot(dx, dy)
        px, py = -dy / length, dx / length
        half = 0.31 - t * 0.16
        c = _along(root, tip, t)
        ax.plot([c[0] - px * half, c[0] + px * half], [c[1] - py * half, c[1] + py * half],
                color=BOOM_EDGE, lw=0.7, zorder=5)
    # Lift cylinder
    seat = _along(root, tip, 0.28)
    ax.plot([0.15, seat[0]], [1.7, seat[1]], color=STEEL_DK, lw=2.2, solid_capstyle="round", zorder=3)
    # Head, falls, hook
    ax.add_patch(Circle(tip, 0.18, fc="#d7d1c4", ec=INK, lw=0.6, zorder=6))
    ax.plot([tip[0], 7.0], [tip[1], 9.85], color=INK, lw=0.8, zorder=5)
    ax.plot([tip[0] - 0.08, 6.82], [tip[1] - 0.12, 9.85], color=INK, lw=0.6, zorder=5)
    rect(ax, 6.72, 9.55, 0.56, 0.42, fc="#f4f4f4", ec=INK, lw=0.7, zorder=6)
    ax.add_patch(Wedge((7.0, 9.48), 0.22, 200, 340, fc=INK, ec=INK, zorder=6))
    label(ax, 7.7, 10.15, "крюк", size=7.5, ha="left")

    # Flatbed in cross-section and the block above it
    rect(ax, 5.75, 1.12, 2.50, 0.18, fc=DECK, ec=INK, lw=0.7, zorder=4)
    rect(ax, 5.85, 0.78, 2.30, 0.34, fc="#b9c2ca", ec=INK, lw=0.6, zorder=3)
    wheel_side(ax, 6.35, 0.42, 0.42, z=4)
    wheel_side(ax, 7.65, 0.42, 0.42, z=4)
    rect(ax, 5.5, 2.0, 3.0, 2.5, fc=BLOCK, ec=INK, lw=1.15, zorder=4)
    ax.plot([5.5, 8.5], [3.25, 3.25], color="#c8bfae", lw=0.5, zorder=4)
    label(ax, 7.0, 3.25, "блок", size=8, bold=True)
    label(ax, 5.15, 1.15, "шаланда", size=7, ha="right")

    ax.plot([5.62, 7.0], [4.5, 9.55], color=INK, lw=1.0, zorder=5)
    ax.plot([8.38, 7.0], [4.5, 9.55], color=INK, lw=1.0, zorder=5)
    label(ax, 4.55, 6.35, "строп", size=7, ha="right")

    vdim(ax, 0, 1.3, 9.55, "1,3", x_from=8.25, size=7)
    vdim(ax, 2.0, 4.5, 10.45, "2,5", x_from=8.5, size=7)
    vdim(ax, 0, 2.0, 11.45, "2,0", x_from=5.5, size=7)
    vdim(ax, 0, 9.7, 12.55, "около 10", x_from=8.5, size=7)
    label(ax, 4.4, 13.15, "Вид сбоку. Посадка блока", size=12, bold=True)


def draw_trailer_long(ax):
    """Шаланда вдоль площадки: тягач, борт 13,6 м, блок 9 м по центру."""
    style_ax(ax, (-1.2, 18.6), (-1.35, 6.3))
    ax.plot([-0.8, 18.2], [0, 0], color=INK, lw=1.1, zorder=2)
    rect(ax, -0.8, -0.7, 19.0, 0.7, fc=GROUND, ec="none", zorder=1)

    deck_x, deck_l = 2.55, 13.6
    # Tractor chassis and cab
    rect(ax, 0.15, 0.85, 3.15, 0.38, fc="#b7c0c8", ec=INK, lw=0.7, zorder=3)
    wheel_side(ax, 0.85, 0.48, 0.48)
    wheel_side(ax, 2.15, 0.48, 0.48)
    ax.add_patch(Polygon(
        [(0.25, 1.23), (2.55, 1.23), (2.55, 2.15), (2.25, 3.25),
         (0.45, 3.35), (0.25, 1.23)],
        closed=True, fc=CAB, ec=INK, lw=0.9, zorder=4,
    ))
    ax.add_patch(Polygon(
        [(1.55, 1.85), (2.42, 1.55), (2.42, 2.25), (1.85, 2.95)],
        closed=True, fc=GLASS, ec=INK, lw=0.4, zorder=5,
    ))
    rect(ax, 0.55, 1.7, 0.85, 0.85, fc="#24323d", ec=GLASS, lw=0.35, zorder=5)
    rect(ax, 0.15, 1.35, 0.18, 0.28, fc="#f2f2f2", ec=INK, lw=0.3, zorder=5)
    label(ax, 1.35, 3.65, "тягач", size=7)
    # Fifth wheel
    ax.add_patch(Circle((3.15, 1.28), 0.16, fc="#666", ec=INK, lw=0.4, zorder=5))

    # Deck, frame, side rail
    rect(ax, deck_x, 0.95, deck_l, 0.28, fc="#aeb6be", ec=INK, lw=0.6, zorder=3)
    rect(ax, deck_x, 1.23, deck_l, 0.16, fc=DECK, ec=INK, lw=0.7, zorder=4)
    ax.plot([deck_x, deck_x + deck_l], [1.23, 1.23], color=DECK_DK, lw=0.4, zorder=4)
    # Stake pockets outside the block
    for sx in (2.7, 4.3, 14.5, 15.9):
        rect(ax, sx, 1.39, 0.08, 0.28, fc=STEEL, ec=INK, lw=0.3, zorder=4)
    rect(ax, deck_x + deck_l, 0.85, 0.14, 0.55, fc=STEEL_DK, ec=INK, lw=0.4, zorder=4)
    rect(ax, deck_x + deck_l + 0.02, 1.15, 0.10, 0.12, fc="#b23b3b", ec=INK, lw=0.25, zorder=5)

    for cx in (13.55, 14.45, 15.35):
        wheel_side(ax, cx, 0.48, 0.48)

    # Block centered, 2.3 m clear at each end of the 13.6 m deck
    block_x = deck_x + (deck_l - 9.0) / 2
    rect(ax, block_x, 1.39, 9.0, 2.5, fc=BLOCK, ec=INK, lw=1.15, zorder=4)
    for j in range(1, 3):
        ax.plot([block_x + j * 3.0, block_x + j * 3.0], [1.39, 3.89], color="#c8bfae", lw=0.55, zorder=4)
    label(ax, block_x + 4.5, 2.64, "блок 3 × 9 × 2,5 м", size=8, bold=True)

    hdim(ax, deck_x, deck_x + deck_l, -1.15, "площадка 13,6", y_from=0)
    hdim(ax, block_x, block_x + 9.0, 4.55, "9,0", y_from=3.89)
    hdim(ax, deck_x, block_x, 4.55, "2,3", y_from=1.39, size=7)
    vdim(ax, 0, 1.39, 17.55, "1,3", x_from=16.3, size=7)
    vdim(ax, 1.39, 3.89, 18.15, "2,5", x_from=16.5, size=7)
    label(ax, 9.0, 5.85, "Длинномер сбоку. Блок вдоль площадки", size=12, bold=True)


def main():
    fig = plt.figure(figsize=(16.54, 11.69), dpi=160, facecolor="white")
    fig.text(
        0.045, 0.972, "Схема установки крана и погрузки блока",
        ha="left", va="top", fontsize=16, fontproperties=BOLD, color=INK,
    )
    fig.text(
        0.045, 0.942,
        "Демонтаж модульного здания. Автокран 25 т, стрела над кабиной, поворот не выполняется. Размеры в метрах.",
        ha="left", va="top", fontsize=9, fontproperties=SANS, color=INK,
    )

    ax1 = fig.add_axes([0.015, 0.50, 0.49, 0.42])
    ax2 = fig.add_axes([0.50, 0.50, 0.49, 0.42])
    ax3 = fig.add_axes([0.02, 0.255, 0.55, 0.23])
    ax4 = fig.add_axes([0.03, 0.035, 0.62, 0.20])
    draw_plan_lift(ax1)
    draw_plan_set(ax2)
    draw_crane_elevation(ax3)
    draw_trailer_long(ax4)

    notes = (
        "1. Кран вывешивают на полностью выдвинутые опоры\n"
        "    и с этой стоянки не переезжают.\n"
        "2. Блок подают в створ стрелы стороной 3 м вдоль\n"
        "    стрелы и стороной 9 м поперёк.\n"
        "3. Подъём — вылет 8,0 м. Затем блок подтягивают\n"
        "    стрелой до вылета 7,0 м.\n"
        "4. Длинномер заводят сбоку под висящий блок.\n"
        "    Середина площадки — под крюком.\n"
        "5. Масса блока 8,7 т, на крюке 9,1 т.\n"
        "    Строп 4СЦ-11,2/7000, стрела 14 м.\n"
        "6. 5,0 м — от центра вращения до переда кабины.\n"
        "    На рабочем кране размер сверяют обмером."
    )
    fig.text(
        0.655, 0.45, notes, ha="left", va="top", fontsize=8.2,
        fontproperties=SANS, color=INK, linespacing=1.42,
    )

    fig.add_artist(Rectangle(
        (0.012, 0.015), 0.976, 0.97, transform=fig.transFigure,
        fill=False, edgecolor=INK, lw=1.15,
    ))

    fig.savefig("/workspace/ppr/skhema-kran-blok.png", dpi=160, facecolor="white")
    fig.savefig("/workspace/ppr/skhema-kran-blok.pdf", facecolor="white")
    print("ok")


if __name__ == "__main__":
    main()
