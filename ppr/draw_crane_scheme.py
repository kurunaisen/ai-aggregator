#!/usr/bin/env python3
"""ППР: схема установки крана и погрузки блока."""

import math

import matplotlib.pyplot as plt
from matplotlib.path import Path
from matplotlib.patches import Arc, Circle, FancyBboxPatch, PathPatch, Polygon, Rectangle, Wedge
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


def wheel_side(ax, cx, cy, r, dual=False, z=5):
    if dual:
        ax.add_patch(Circle((cx + 0.06, cy), r * 0.97, fc="#161616", ec="#111", lw=0.35, zorder=z))
    ax.add_patch(Circle((cx, cy), r, fc="#2c2c2c", ec=INK, lw=0.65, zorder=z + 1))
    ax.add_patch(Circle((cx, cy), r * 0.78, fc="#3f3f3f", ec="#222", lw=0.3, zorder=z + 2))
    ax.add_patch(Circle((cx, cy), r * 0.48, fc="#ececec", ec=INK, lw=0.45, zorder=z + 3))
    ax.add_patch(Circle((cx, cy), r * 0.16, fc="#333", ec=INK, lw=0.3, zorder=z + 4))
    for i in range(6):
        a = math.radians(i * 60 + 12)
        ax.plot(
            [cx + 0.20 * r * math.cos(a), cx + 0.40 * r * math.cos(a)],
            [cy + 0.20 * r * math.sin(a), cy + 0.40 * r * math.sin(a)],
            color="#7a7a7a", lw=0.55, zorder=z + 4,
        )


def fender(ax, cx, cy, r, z=4):
    ax.add_patch(Arc((cx, cy), 2.25 * r, 2.05 * r, theta1=18, theta2=162,
                     lw=1.05, ec=INK, zorder=z))


def tire_plan(ax, x, y, w=0.72, h=0.34, z=4):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.01,rounding_size=0.08",
        fc="#242424", ec=INK, lw=0.45, zorder=z,
    ))
    for k in (0.22, 0.50, 0.78):
        ax.plot([x + 0.08, x + w - 0.08], [y + h * k, y + h * k], color="#4a4a4a", lw=0.35, zorder=z + 1)
    ax.add_patch(Circle((x + w * 0.5, y + h * 0.5), min(w, h) * 0.22, fc="#d5d5d5", ec=INK, lw=0.3, zorder=z + 2))


def draw_crane_plan(ax, boom_to):
    """Автокран в плане. Центр вращения (0, 0), кабина в сторону +X, перед кабины x = 5,0."""
    # Frame rails and running gear
    ax.add_patch(FancyBboxPatch(
        (-3.55, -1.18), 8.55, 2.36,
        boxstyle="round,pad=0.02,rounding_size=0.16",
        fc="#d7dee4", ec=INK, lw=1.05, zorder=2,
    ))
    rect(ax, -3.35, -0.42, 5.55, 0.16, fc="#8e99a2", ec=INK, lw=0.35, zorder=3)
    rect(ax, -3.35, 0.26, 5.55, 0.16, fc="#8e99a2", ec=INK, lw=0.35, zorder=3)
    rect(ax, -3.72, -1.22, 0.22, 2.44, fc=STEEL_DK, ec=INK, lw=0.6, zorder=3)
    rect(ax, 0.35, -0.95, 1.15, 0.55, fc="#9aa4ad", ec=INK, lw=0.45, zorder=3)
    rect(ax, 0.35, 0.40, 1.15, 0.55, fc="#8d98a2", ec=INK, lw=0.45, zorder=3)
    ax.add_patch(Circle((1.55, 0.0), 0.28, fc="#6a737a", ec=INK, lw=0.45, zorder=3))
    ax.add_patch(Circle((1.55, 0.0), 0.10, fc="#222", zorder=4))

    # KamAZ cab, front face on x = 5.0
    ax.add_patch(FancyBboxPatch(
        (2.55, -1.12), 2.28, 2.24,
        boxstyle="round,pad=0.01,rounding_size=0.14",
        fc=CAB, ec=INK, lw=1.0, zorder=4,
    ))
    ax.add_patch(FancyBboxPatch(
        (4.72, -1.02), 0.28, 2.04,
        boxstyle="round,pad=0.01,rounding_size=0.08",
        fc="#24323d", ec=INK, lw=0.6, zorder=5,
    ))
    rect(ax, 4.78, -0.72, 0.16, 1.44, fc=GLASS, ec=INK, lw=0.4, zorder=6)
    rect(ax, 2.78, 0.62, 1.55, 0.32, fc="#1c2a34", ec=GLASS, lw=0.35, zorder=5)
    rect(ax, 2.78, -0.94, 1.55, 0.32, fc="#1c2a34", ec=GLASS, lw=0.35, zorder=5)
    ax.plot([3.55, 3.55], [-0.55, 0.55], color="#1c2832", lw=0.55, zorder=5)
    for my, sign in ((1.18, 1), (-1.40, -1)):
        ax.plot([4.15, 4.55], [sign * 0.85, my + 0.08], color=INK, lw=0.7, zorder=6)
        rect(ax, 4.48, my, 0.42, 0.20, fc="#141414", ec=INK, lw=0.35, zorder=6)
    rect(ax, 4.55, 1.16, 0.55, 0.16, fc="#111", ec=INK, lw=0.3, zorder=5)
    rect(ax, 4.55, -1.32, 0.55, 0.16, fc="#111", ec=INK, lw=0.3, zorder=5)

    for wx in (3.35, -0.15, -1.55):
        tire_plan(ax, wx, 1.12)
        tire_plan(ax, wx, -1.46)

    # Outrigger beams, cylinders and pads. Pad corners stay put.
    pads = ((1.35, 2.35), (1.35, -3.15), (-2.25, 2.35), (-2.25, -3.15))
    roots = ((1.55, 1.05), (1.55, -1.05), (-1.15, 1.05), (-1.15, -1.05))
    for (px, py), (sx, sy) in zip(pads, roots):
        ex, ey = px + 0.42, py + 0.32
        poly = boom_polygon(sx, sy, ex, ey, 0.28, 0.22)
        ax.add_patch(Polygon(poly, closed=True, fc="#4c565e", ec=INK, lw=0.6, zorder=3))
        ax.plot([sx, ex], [sy, ey], color="#c5ced6", lw=1.15, solid_capstyle="round", zorder=4)
        ax.add_patch(FancyBboxPatch(
            (px, py), 0.84, 0.64,
            boxstyle="round,pad=0.01,rounding_size=0.05",
            fc=PAD, ec=INK, lw=0.7, zorder=4,
        ))
        rect(ax, px + 0.12, py + 0.10, 0.60, 0.44, fc="#3a4146", ec=INK, lw=0.35, zorder=5)
        ax.plot([px + 0.18, px + 0.66], [py + 0.32, py + 0.32], color="#9aa3aa", lw=0.4, zorder=6)
        ax.plot([px + 0.42, px + 0.42], [py + 0.16, py + 0.48], color="#9aa3aa", lw=0.4, zorder=6)
    label(ax, -3.15, 3.35, "опора", size=7, ha="left")

    # Slewing ring under a rectangular crane house, not a bare circle
    ax.add_patch(Circle((0, 0), 1.18, fc="#d7dee3", ec=INK, lw=0.9, zorder=5))
    for ang in range(0, 360, 30):
        a = math.radians(ang)
        ax.add_patch(Circle((0.92 * math.cos(a), 0.92 * math.sin(a)), 0.04, fc="#222", zorder=5))
    ax.add_patch(FancyBboxPatch(
        (-2.20, -0.92), 1.28, 1.84,
        boxstyle="round,pad=0.01,rounding_size=0.05",
        fc=COUNTER, ec=INK, lw=0.8, zorder=6,
    ))
    for i in range(5):
        ax.plot([-2.08, -1.05], [-0.68 + i * 0.28, -0.68 + i * 0.28], color="#5e676e", lw=0.5, zorder=7)
    ax.add_patch(FancyBboxPatch(
        (-0.95, -0.78), 2.05, 1.56,
        boxstyle="round,pad=0.01,rounding_size=0.06",
        fc="#eef1f3", ec=INK, lw=0.85, zorder=6,
    ))
    rect(ax, -0.55, -0.45, 0.85, 0.55, fc="#d5dbdf", ec=INK, lw=0.35, zorder=7)
    ax.add_patch(FancyBboxPatch(
        (0.05, 0.48), 1.20, 0.62,
        boxstyle="round,pad=0.01,rounding_size=0.06",
        fc=CAB, ec=INK, lw=0.6, zorder=7,
    ))
    rect(ax, 0.22, 0.60, 0.78, 0.36, fc=GLASS, ec=INK, lw=0.3, zorder=8)
    ax.add_patch(Circle((0, 0), 0.14, fc=INK, zorder=8))
    ax.plot([-0.40, 0.40], [0, 0], color="white", lw=0.75, zorder=9)
    ax.plot([0, 0], [-0.40, 0.40], color="white", lw=0.75, zorder=9)

    # Four-section telescopic boom, narrow enough that the cab shows beside it
    tip = boom_to - 0.22
    sections = (
        (0.18, 0.34, 0.62, 0.50, "#d9d3c4"),
        (0.30, 0.52, 0.50, 0.40, "#e4dece"),
        (0.48, 0.74, 0.40, 0.32, "#ece6d8"),
        (0.70, 0.98, 0.32, 0.24, "#f6f2e8"),
    )
    for a, b, w0, w1, color in sections:
        p0 = _along((0.15, 0.0), (tip, 0.0), a)
        p1 = _along((0.15, 0.0), (tip, 0.0), b)
        ax.add_patch(Polygon(boom_polygon(*p0, *p1, w0, w1), closed=True, fc=color, ec=BOOM_EDGE, lw=0.7, zorder=6))
    rect(ax, tip - 0.02, -0.22, 0.48, 0.44, fc="#efeae0", ec=INK, lw=0.75, zorder=7)
    for sy in (0.10, 0.0, -0.10):
        ax.add_patch(Circle((tip + 0.32, sy), 0.055, fc="#1c1c1c", ec=INK, lw=0.25, zorder=8))
    ax.plot(boom_to, 0, marker="+", color=INK, ms=11, mew=1.15, zorder=8)
    label(ax, 2.85, 1.58, "стрела", size=7.5)


def draw_block(ax, x0, y0=-4.5, length=3.0, width=9.0, caption=None, hook=None, caption_text="один блок 3 × 9 м", caption_ha="center"):
    rect(ax, x0, y0, length, width, fc=BLOCK, ec=INK, lw=1.25, zorder=4)
    if hook is not None:
        hx, hy = hook
        for cx, cy in ((x0, y0), (x0 + length, y0), (x0, y0 + width), (x0 + length, y0 + width)):
            ax.plot([cx, hx], [cy, hy], color="#3a342c", lw=0.75, zorder=5)
            ax.add_patch(Circle((cx, cy), 0.09, fc="#222", zorder=6))
        ax.add_patch(Circle((hx, hy), 0.13, fc=INK, zorder=7))
    if caption is None:
        caption = (x0 + length / 2, y0 + width + 0.48)
    label(ax, caption[0], caption[1], caption_text, size=8, bold=True, z=9, ha=caption_ha)


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
    rect(ax, 5.95, -8.55, 2.10, 1.85, fc="#c5ced6", ec=INK, lw=0.7, zorder=5)
    rect(ax, 6.15, -8.48, 0.16, 1.70, fc="#8e99a2", ec=INK, lw=0.3, zorder=5)
    rect(ax, 7.70, -8.48, 0.16, 1.70, fc="#8e99a2", ec=INK, lw=0.3, zorder=5)
    ax.add_patch(FancyBboxPatch(
        (6.05, -9.62), 1.90, 1.42,
        boxstyle="round,pad=0.01,rounding_size=0.12",
        fc=CAB, ec=INK, lw=0.9, zorder=6,
    ))
    rect(ax, 6.28, -9.55, 1.44, 0.22, fc=GLASS, ec=INK, lw=0.35, zorder=7)
    ax.add_patch(Circle((7.0, -8.35), 0.10, fc="#555", ec=INK, lw=0.3, zorder=7))
    for tx in (6.22, 7.52):
        tire_plan(ax, tx, -8.98, 0.46, 0.30, z=6)
        tire_plan(ax, tx, -8.18, 0.46, 0.30, z=6)
    label(ax, 7.0, -8.95, "тягач", size=6.5, color="white")
    label(ax, 5.45, -5.55, "шаланда\n13,6 × 2,5", size=7.5, ha="right")


def draw_plan_lift(ax):
    style_ax(ax, (-5.4, 12.3), (-12.3, 8.4))
    ax.plot([-4.2, 11.2], [0, 0], color="#9aa0a6", lw=0.6, ls=(0, (7, 2, 1.4, 2)), zorder=1)
    draw_crane_plan(ax, 8.0)
    draw_block(ax, 6.5, hook=(8.0, 0.0))
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
    draw_block(ax, 5.5, caption=(5.35, 3.75), hook=(7.0, 0.0), caption_text="один блок", caption_ha="right")
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


def _curve(ax, verts, fc, ec=INK, lw=0.9, z=4):
    codes = [Path.MOVETO] + [Path.CURVE4] * (len(verts) - 2) + [Path.CLOSEPOLY]
    # CURVE4 consumes points in threes; fall back when the outline is not a cubic chain.
    if (len(verts) - 1) % 3 != 0:
        ax.add_patch(Polygon(verts, closed=True, fc=fc, ec=ec, lw=lw, zorder=z))
        return
    ax.add_patch(PathPatch(Path(verts + [verts[0]], codes), fc=fc, ec=ec, lw=lw, zorder=z))


def block_wall(ax, x, y, w, h, z=4):
    """Сплошная стена одного блока. Стойки только по углам."""
    rect(ax, x, y, w, h, fc=BLOCK, ec=INK, lw=1.05, zorder=z)
    rect(ax, x - 0.03, y + h - 0.06, w + 0.06, 0.08, fc="#e7dfd0", ec=INK, lw=0.3, zorder=z + 1)
    rect(ax, x, y, w, 0.10, fc="#d9d0be", ec=INK, lw=0.3, zorder=z + 1)
    rect(ax, x, y, 0.06, h, fc="#cfc6b4", ec=INK, lw=0.25, zorder=z + 1)
    rect(ax, x + w - 0.06, y, 0.06, h, fc="#cfc6b4", ec=INK, lw=0.25, zorder=z + 1)
    if w < 5:
        ww, wh = min(1.15, w * 0.4), h * 0.26
        gx, gy = x + (w - ww) / 2, y + h * 0.52
        rect(ax, gx, gy, ww, wh, fc=GLASS, ec=INK, lw=0.4, zorder=z + 2)
        return
    rect(ax, x + 0.28, y + 0.10, 0.78, h * 0.58, fc="#efe8da", ec=INK, lw=0.4, zorder=z + 2)
    left, right, gap, n = x + 1.5, x + w - 0.35, 0.28, 3
    ww = (right - left - gap * (n - 1)) / n
    gy, wh = y + h * 0.58, h * 0.20
    for i in range(n):
        gx = left + i * (ww + gap)
        rect(ax, gx, gy, ww, wh, fc=GLASS, ec=INK, lw=0.4, zorder=z + 2)


def telescopic_boom(ax, root, tip, w0, z=4):
    """Four nested boom sections with a cabinet-projection top face."""
    sections = (
        (0.00, 0.46, 1.00, "#cfc8b6"),
        (0.32, 0.68, 0.80, "#ddd6c8"),
        (0.54, 0.86, 0.62, "#e8e1d2"),
        (0.74, 1.00, 0.48, "#f7f3ea"),
    )
    dx, dy = tip[0] - root[0], tip[1] - root[1]
    length = math.hypot(dx, dy) or 1.0
    px, py = -dy / length, dx / length
    ox, oy = -0.09, 0.14
    head = tip
    for a, b, scale, color in sections:
        p0 = _along(root, tip, a)
        p1 = _along(root, tip, b)
        side = boom_polygon(*p0, *p1, w0 * scale, w0 * scale * 0.94)
        top = [
            (side[0][0] + ox, side[0][1] + oy),
            (side[1][0] + ox, side[1][1] + oy),
            side[1],
            side[0],
        ]
        ax.add_patch(Polygon(side, closed=True, fc=color, ec=BOOM_EDGE, lw=0.75, zorder=z))
        ax.add_patch(Polygon(top, closed=True, fc="#fbf8f2", ec=BOOM_EDGE, lw=0.55, zorder=z + 1))
        if a > 0:
            half = w0 * scale / 2
            ax.plot(
                [p0[0] - px * half, p0[0] + px * half],
                [p0[1] - py * half, p0[1] + py * half],
                color=INK, lw=1.15, zorder=z + 2,
            )
        head = side[1]
    return head


def draw_box_boom(ax, root, tip, w0, w1, z=4):
    side = boom_polygon(*root, *tip, w0, w1)
    ox, oy = -0.10, 0.16
    top = [
        (side[0][0] + ox, side[0][1] + oy),
        (side[1][0] + ox, side[1][1] + oy),
        side[1],
        side[0],
    ]
    ax.add_patch(Polygon(side, closed=True, fc="#d7d1c4", ec=BOOM_EDGE, lw=0.9, zorder=z))
    ax.add_patch(Polygon(top, closed=True, fc="#f7f3ea", ec=BOOM_EDGE, lw=0.8, zorder=z + 1))
    dx, dy = tip[0] - root[0], tip[1] - root[1]
    length = math.hypot(dx, dy) or 1
    px, py = -dy / length, dx / length
    for t in (0.28, 0.50, 0.72):
        c = _along(root, tip, t)
        half = (w0 / 2) * (1 - t) + (w1 / 2) * t
        ax.plot(
            [c[0] - px * half, c[0] + px * half],
            [c[1] - py * half, c[1] + py * half],
            color=BOOM_EDGE, lw=0.65, zorder=z + 2,
        )
        ax.plot(
            [c[0] + px * half, c[0] + px * half + ox],
            [c[1] + py * half, c[1] + py * half + oy],
            color=BOOM_EDGE, lw=0.45, zorder=z + 2,
        )
    ax.plot(
        [side[0][0] + ox * 0.5, side[1][0] + ox * 0.5],
        [side[0][1] + oy * 0.55, side[1][1] + oy * 0.55],
        color="#6a6256", lw=0.7, zorder=z + 2,
    )
    return side[1]


def draw_crane_elevation(ax):
    style_ax(ax, (-4.6, 14.2), (-1.7, 13.6))
    ax.plot([-4.3, 13.6], [0, 0], color=INK, lw=1.15, zorder=2)
    rect(ax, -4.3, -0.55, 17.9, 0.55, fc=GROUND, ec="none", zorder=1)
    ax.add_patch(Polygon(
        [(-3.3, 0.02), (5.4, 0.02), (5.7, -0.08), (-3.6, -0.08)],
        closed=True, fc="#000000", ec="none", alpha=0.06, zorder=1,
    ))

    # Frame, tanks, steps
    rect(ax, -3.55, 0.92, 8.55, 0.32, fc="#c5ced6", ec=INK, lw=0.8, zorder=3)
    rect(ax, -3.62, 0.78, 0.22, 0.55, fc=STEEL_DK, ec=INK, lw=0.4, zorder=3)
    rect(ax, 0.55, 0.55, 0.85, 0.42, fc="#8d98a2", ec=INK, lw=0.45, zorder=3)  # fuel tank
    ax.add_patch(Circle((2.35, 0.78), 0.16, fc="#9aa3aa", ec=INK, lw=0.35, zorder=3))
    ax.add_patch(Circle((2.72, 0.78), 0.16, fc="#9aa3aa", ec=INK, lw=0.35, zorder=3))
    for cx, dual in ((3.95, False), (-0.15, True), (-1.55, True)):
        fender(ax, cx, 0.52, 0.52, z=3)
        wheel_side(ax, cx, 0.52, 0.52, dual=dual)

    # Hydraulic outrigger jacks
    for jx in (1.85, -2.55):
        rect(ax, jx, 0.10, 0.14, 0.88, fc="#4e585f", ec=INK, lw=0.4, zorder=3)
        rect(ax, jx + 0.03, 0.45, 0.08, 0.40, fc="#c5ced6", ec=INK, lw=0.3, zorder=4)
        rect(ax, jx - 0.22, 0.0, 0.58, 0.11, fc=PAD, ec=INK, lw=0.4, zorder=3)

    # Driver's cab, cab-over. Front face is the line x = 5.0.
    ax.add_patch(Polygon(
        [(2.55, 1.20), (2.55, 2.78), (2.72, 3.08), (4.15, 3.02),
         (4.42, 2.88), (4.92, 1.72), (5.00, 1.48), (5.00, 1.12),
         (4.15, 1.06), (2.55, 1.20)],
        closed=True, fc=CAB, ec=INK, lw=0.95, zorder=4,
    ))
    ax.add_patch(Polygon(
        [(4.18, 2.92), (4.42, 2.78), (4.88, 1.78), (4.55, 2.05)],
        closed=True, fc=GLASS, ec=INK, lw=0.4, zorder=5,
    ))
    ax.plot([4.30, 4.78], [2.55, 1.92], color="#f7fbfe", lw=0.45, zorder=6)
    rect(ax, 2.82, 1.58, 1.22, 1.05, fc="#162430", ec=GLASS, lw=0.4, zorder=5)
    rect(ax, 2.98, 1.74, 0.88, 0.72, fc="#243848", ec="#9bb4c6", lw=0.3, zorder=6)
    ax.plot([4.04, 4.04], [1.58, 2.63], color="#101920", lw=0.65, zorder=6)
    ax.add_patch(Circle((3.35, 1.48), 0.05, fc="#e8eef2", ec=INK, lw=0.2, zorder=6))
    rect(ax, 2.72, 1.08, 0.42, 0.10, fc="#3a434a", ec=INK, lw=0.25, zorder=4)
    rect(ax, 4.42, 1.02, 0.58, 0.14, fc="#1a2228", ec=INK, lw=0.35, zorder=5)
    for gy in (1.22, 1.34, 1.46):
        ax.plot([4.78, 4.98], [gy, gy], color="#c5d2de", lw=0.4, zorder=6)
    ax.add_patch(Circle((4.86, 1.28), 0.075, fc="#f7f9fb", ec=INK, lw=0.25, zorder=6))
    ax.plot([4.35, 5.22], [2.35, 1.95], color=INK, lw=0.8, zorder=6)
    rect(ax, 5.14, 1.72, 0.16, 0.30, fc="#e7eef4", ec=INK, lw=0.3, zorder=6)
    rect(ax, 2.32, 1.45, 0.14, 1.35, fc="#4a545c", ec=INK, lw=0.4, zorder=3)
    ax.add_patch(Circle((2.39, 2.86), 0.09, fc="#3a434a", ec=INK, lw=0.3, zorder=4))
    label(ax, 3.40, 3.72, "кабина", size=7)

    # Counterweight plates and operator cab
    rect(ax, -2.95, 1.32, 2.35, 1.72, fc="#9aa3ab", ec=INK, lw=0.8, zorder=4)
    for i in range(4):
        ax.plot([-2.75, -0.78], [1.58 + i * 0.30, 1.58 + i * 0.30], color="#6d767e", lw=0.55, zorder=5)
    ax.add_patch(FancyBboxPatch(
        (-0.45, 1.40), 1.55, 1.55,
        boxstyle="round,pad=0.02,rounding_size=0.1",
        fc=CAB, ec=INK, lw=0.85, zorder=5,
    ))
    ax.add_patch(Polygon(
        [(0.05, 2.15), (0.85, 2.15), (0.95, 2.55), (0.15, 2.62)],
        closed=True, fc=GLASS, ec=INK, lw=0.4, zorder=6,
    ))
    ax.add_patch(Circle((0.42, 2.72), 0.13, fc="#222", ec=INK, lw=0.4, zorder=6))

    root = (0.42, 2.72)
    tip = (6.35, 11.55)
    telescopic_boom(ax, root, tip, 0.62, z=4)
    # Lift cylinder: barrel, chrome rod, pins
    seat = _along(root, tip, 0.30)
    rod = _along(root, tip, 0.16)
    ax.plot([0.02, seat[0]], [1.78, seat[1]], color="#3c454c", lw=5.0, solid_capstyle="butt", zorder=3)
    ax.plot([0.18, rod[0]], [1.82, rod[1]], color="#e4ebf1", lw=2.0, solid_capstyle="round", zorder=4)
    ax.add_patch(Circle((0.08, 1.78), 0.09, fc="#222", ec=INK, lw=0.3, zorder=5))
    ax.add_patch(Circle(seat, 0.08, fc="#222", ec=INK, lw=0.3, zorder=5))
    ax.add_patch(Circle(root, 0.14, fc="#2a2a2a", ec=INK, lw=0.45, zorder=6))

    # Head, falls, hook block
    ax.add_patch(Circle((tip[0], tip[1]), 0.22, fc="#efeae0", ec=INK, lw=0.65, zorder=6))
    ax.add_patch(Circle((tip[0] + 0.04, tip[1] - 0.02), 0.09, fc="#1a1a1a", zorder=7))
    ax.plot([tip[0] + 0.02, 7.08], [tip[1] - 0.12, 10.02], color=INK, lw=0.9, zorder=5)
    ax.plot([tip[0] - 0.06, 6.72], [tip[1] - 0.16, 10.02], color=INK, lw=0.65, zorder=5)
    ax.add_patch(FancyBboxPatch(
        (6.62, 9.52), 0.76, 0.55,
        boxstyle="round,pad=0.01,rounding_size=0.06",
        fc="#f4f4f4", ec=INK, lw=0.75, zorder=6,
    ))
    for sx in (6.82, 7.08):
        ax.add_patch(Circle((sx, 9.78), 0.09, fc="#cfcfcf", ec=INK, lw=0.35, zorder=7))
        ax.add_patch(Circle((sx, 9.78), 0.035, fc="#222", zorder=8))
    ax.add_patch(Wedge((7.0, 9.42), 0.28, 205, 335, width=0.07, fc=INK, ec=INK, zorder=7))
    ax.plot([6.88, 7.05], [9.55, 9.78], color="#d0d0d0", lw=0.7, zorder=8)
    label(ax, 7.95, 10.45, "крюк", size=7.5, ha="left")

    # Flatbed end view: deck 2.50 m, beams, dual wheels
    rect(ax, 5.75, 1.16, 2.50, 0.14, fc=DECK, ec=INK, lw=0.7, zorder=4)
    for px in (5.95, 6.35, 6.75, 7.15, 7.55, 7.95):
        ax.plot([px, px], [1.18, 1.28], color=DECK_DK, lw=0.35, zorder=5)
    rect(ax, 5.88, 0.78, 0.16, 0.38, fc=STEEL, ec=INK, lw=0.35, zorder=3)
    rect(ax, 7.96, 0.78, 0.16, 0.38, fc=STEEL, ec=INK, lw=0.35, zorder=3)
    rect(ax, 6.20, 0.86, 1.60, 0.12, fc="#b7c0c8", ec=INK, lw=0.35, zorder=3)
    fender(ax, 6.22, 0.42, 0.40, z=3)
    fender(ax, 7.78, 0.42, 0.40, z=3)
    wheel_side(ax, 6.22, 0.42, 0.40, dual=True)
    wheel_side(ax, 7.78, 0.42, 0.40, dual=True)
    block_wall(ax, 5.5, 2.0, 3.0, 2.5)
    label(ax, 6.20, 4.05, "блок", size=8, bold=True)
    label(ax, 5.15, 1.05, "шаланда", size=7, ha="right")

    ax.plot([5.62, 7.0], [4.5, 9.58], color=INK, lw=1.05, zorder=5)
    ax.plot([8.38, 7.0], [4.5, 9.58], color=INK, lw=1.05, zorder=5)
    label(ax, 5.70, 7.15, "строп", size=7, ha="right")

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
    # Tractor frame, tanks, wheels, fenders
    rect(ax, 0.10, 0.82, 3.35, 0.36, fc="#b7c0c8", ec=INK, lw=0.7, zorder=3)
    rect(ax, 1.15, 0.55, 0.70, 0.28, fc="#8d98a2", ec=INK, lw=0.35, zorder=3)
    fender(ax, 0.85, 0.48, 0.50, z=3)
    fender(ax, 2.15, 0.48, 0.50, z=3)
    wheel_side(ax, 0.85, 0.48, 0.50, dual=True)
    wheel_side(ax, 2.15, 0.48, 0.50, dual=True)
    # Nose to the left, fifth wheel behind the cab
    ax.add_patch(Polygon(
        [(0.12, 1.16), (0.12, 1.58), (0.28, 1.82), (0.48, 2.95),
         (0.72, 3.22), (2.05, 3.16), (2.38, 2.82), (2.48, 1.22), (0.12, 1.16)],
        closed=True, fc=CAB, ec=INK, lw=0.9, zorder=4,
    ))
    ax.add_patch(Polygon(
        [(0.32, 1.88), (0.50, 2.88), (0.70, 3.08), (0.95, 2.15)],
        closed=True, fc=GLASS, ec=INK, lw=0.4, zorder=5,
    ))
    ax.plot([0.42, 0.78], [2.15, 2.55], color="#f7fbfe", lw=0.4, zorder=6)
    rect(ax, 1.05, 1.55, 0.95, 1.15, fc="#162430", ec=GLASS, lw=0.35, zorder=5)
    rect(ax, 1.18, 1.72, 0.68, 0.78, fc="#243848", ec="#9bb4c6", lw=0.3, zorder=6)
    ax.add_patch(Circle((1.85, 1.48), 0.045, fc="#e8eef2", zorder=6))
    rect(ax, 0.05, 1.05, 0.55, 0.12, fc="#1a2228", ec=INK, lw=0.3, zorder=5)
    ax.add_patch(Circle((0.22, 1.32), 0.07, fc="#f7f9fb", ec=INK, lw=0.25, zorder=6))
    ax.plot([0.20, -0.18], [2.15, 1.82], color=INK, lw=0.75, zorder=6)
    rect(ax, -0.26, 1.58, 0.14, 0.30, fc="#e7eef4", ec=INK, lw=0.25, zorder=6)
    rect(ax, 2.32, 1.55, 0.12, 1.45, fc="#4a545c", ec=INK, lw=0.35, zorder=3)
    ax.add_patch(Circle((2.38, 3.05), 0.08, fc="#3a434a", ec=INK, lw=0.25, zorder=4))
    label(ax, 1.25, 3.55, "тягач", size=7)
    ax.add_patch(Wedge((3.05, 1.22), 0.22, 0, 180, fc="#5c656c", ec=INK, lw=0.45, zorder=5))
    ax.add_patch(Circle((3.05, 1.22), 0.06, fc="#222", zorder=6))

    # Trailer frame, crossmembers, wood deck, rear
    rect(ax, deck_x, 0.88, deck_l, 0.32, fc="#9aa6b0", ec=INK, lw=0.65, zorder=3)
    for cx in [deck_x + 0.35 + i * 1.15 for i in range(12)]:
        if cx > deck_x + deck_l - 0.25:
            break
        rect(ax, cx, 0.72, 0.08, 0.18, fc="#7d8892", ec=INK, lw=0.25, zorder=3)
    rect(ax, deck_x, 1.20, deck_l, 0.19, fc=DECK, ec=INK, lw=0.7, zorder=4)
    for px in [deck_x + 0.18 + i * 0.42 for i in range(32)]:
        if px < deck_x + deck_l - 0.05:
            ax.plot([px, px], [1.22, 1.37], color=DECK_DK, lw=0.35, zorder=4)
    rect(ax, 3.35, 0.42, 0.10, 0.48, fc=STEEL_DK, ec=INK, lw=0.3, zorder=3)
    rect(ax, 3.85, 0.42, 0.10, 0.48, fc=STEEL_DK, ec=INK, lw=0.3, zorder=3)
    rect(ax, 3.22, 0.36, 0.78, 0.08, fc=PAD, ec=INK, lw=0.3, zorder=3)
    for sx in (2.75, 4.15, 14.35, 15.85):
        rect(ax, sx, 1.39, 0.07, 0.32, fc=STEEL, ec=INK, lw=0.3, zorder=5)
    rect(ax, deck_x + deck_l, 0.78, 0.16, 0.62, fc=STEEL_DK, ec=INK, lw=0.45, zorder=4)
    rect(ax, deck_x + deck_l + 0.02, 1.05, 0.10, 0.14, fc="#c0392b", ec=INK, lw=0.25, zorder=5)
    rect(ax, deck_x + deck_l + 0.02, 0.88, 0.10, 0.10, fc="#d9d9d9", ec=INK, lw=0.25, zorder=5)

    for cx in (13.55, 14.45, 15.35):
        fender(ax, cx, 0.46, 0.46, z=3)
        wheel_side(ax, cx, 0.46, 0.46, dual=True)
    rect(ax, 15.85, 0.15, 0.08, 0.55, fc="#2a2a2a", ec=INK, lw=0.3, zorder=4)

    block_x = deck_x + (deck_l - 9.0) / 2
    block_wall(ax, block_x, 1.39, 9.0, 2.5)
    label(ax, block_x + 5.2, 1.95, "один блок 3 × 9 × 2,5 м", size=7.5, bold=True)

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

    ax1 = fig.add_axes([0.012, 0.555, 0.488, 0.375])
    ax2 = fig.add_axes([0.505, 0.555, 0.488, 0.375])
    ax3 = fig.add_axes([0.012, 0.255, 0.63, 0.275])
    ax4 = fig.add_axes([0.012, 0.018, 0.64, 0.222])
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
        "    Строп 4СЦ, ветвь 8,0 т, длина 7 м.\n"
        "    Стрела 14 м. Схема строповки — отдельно.\n"
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
