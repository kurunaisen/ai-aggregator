#!/usr/bin/env python3
"""ППР: схема строповки блока модульного здания."""

import math

import matplotlib.pyplot as plt
from matplotlib.patches import Arc, Circle, Ellipse, Rectangle, Wedge
from matplotlib.font_manager import FontProperties

SANS = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
BOLD = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

INK = "#1a1a1a"
GLASS = "#d5e4ef"
BLOCK = "#f6f1e4"
CHAIN = "#2c2824"

# Блок 3 × 9 × 2,5 м. Петли по верхним углам. Ветвь 7,0 м.
LENGTH = 9.0
WIDTH = 3.0
HEIGHT = 2.5
MASS = 8.7
BRANCH = 7.0
REACH = math.hypot(LENGTH / 2, WIDTH / 2)
ALPHA = math.asin(REACH / BRANCH)
HOOK_H = BRANCH * math.cos(ALPHA)
BRANCH_FORCE = MASS / (2 * math.cos(ALPHA))
WLL_16 = 8.0
WLL_13 = 5.3
HOLD_13 = 2 * WLL_13 * math.cos(ALPHA)


def comma(value, digits=2):
    return f"{value:.{digits}f}".replace(".", ",")


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
    )


def hdim(ax, x1, x2, y, text, y_from, size=7.5):
    ax.plot([x1, x1], [y_from, y], color=INK, lw=0.45, zorder=4)
    ax.plot([x2, x2], [y_from, y], color=INK, lw=0.45, zorder=4)
    ax.annotate(
        "", xy=(x2, y), xytext=(x1, y),
        arrowprops=dict(arrowstyle="<->", color=INK, lw=0.7, shrinkA=0, shrinkB=0),
        zorder=4,
    )
    label(ax, (x1 + x2) / 2, y + 0.12, text, size=size, va="bottom")


def vdim(ax, y1, y2, x, text, x_from, size=7.5):
    ax.plot([x_from, x], [y1, y1], color=INK, lw=0.45, zorder=4)
    ax.plot([x_from, x], [y2, y2], color=INK, lw=0.45, zorder=4)
    ax.annotate(
        "", xy=(x, y2), xytext=(x, y1),
        arrowprops=dict(arrowstyle="<->", color=INK, lw=0.7, shrinkA=0, shrinkB=0),
        zorder=4,
    )
    ax.text(
        x + 0.14, (y1 + y2) / 2, text, ha="left", va="center", rotation=90,
        fontsize=size, fontproperties=SANS, color=INK, zorder=9,
    )


def module_face(ax, x, y, w, h, bays, door=None, z=3):
    rect(ax, x, y, w, h, fc=BLOCK, ec=INK, lw=1.05, zorder=z)
    rect(ax, x - 0.04, y + h - 0.05, w + 0.08, 0.08, fc="#e7dfd0", ec=INK, lw=0.35, zorder=z + 1)
    rect(ax, x, y, w, 0.12, fc="#d9d0be", ec=INK, lw=0.3, zorder=z + 1)
    bay = w / bays
    for i in range(bays + 1):
        px = x + i * bay
        rect(ax, px - 0.03, y, 0.06, h, fc="#cfc6b4", ec=INK, lw=0.25, zorder=z + 1)
    for i in range(bays):
        wx = x + i * bay
        if i == door:
            rect(ax, wx + bay * 0.22, y + 0.12, bay * 0.48, h * 0.58, fc="#efe8da", ec=INK, lw=0.4, zorder=z + 2)
            ax.add_patch(Circle((wx + bay * 0.60, y + h * 0.36), 0.035, fc="#222", zorder=z + 3))
        else:
            gx = wx + bay * 0.16
            rect(ax, gx, y + h * 0.42, bay * 0.62, h * 0.30, fc=GLASS, ec=INK, lw=0.4, zorder=z + 2)
            ax.plot(
                [gx, gx + bay * 0.62], [y + h * 0.57, y + h * 0.57],
                color="#9bb0c0", lw=0.35, zorder=z + 3,
            )


def cg_mark(ax, x, y, r=0.16):
    ax.add_patch(Circle((x, y), r, fc="white", ec=INK, lw=0.8, zorder=8))
    ax.add_patch(Wedge((x, y), r * 0.98, 90, 180, fc=INK, ec="none", zorder=8))
    ax.add_patch(Wedge((x, y), r * 0.98, 270, 360, fc=INK, ec="none", zorder=8))


def eye(ax, x, y):
    ax.add_patch(Circle((x, y), 0.10, fc="white", ec=INK, lw=0.9, zorder=7))
    ax.add_patch(Circle((x, y), 0.04, fc="none", ec=INK, lw=0.55, zorder=8))


def master_and_hook(ax, x, y):
    ax.add_patch(Ellipse((x, y), 0.62, 0.34, fc="white", ec=INK, lw=1.5, zorder=8))
    ax.add_patch(Wedge((x, y + 0.34), 0.26, 205, 335, width=0.07, fc=INK, ec=INK, zorder=8))
    ax.add_patch(Circle((x, y + 0.52), 0.055, fc="#222", zorder=9))


def draw_chain(ax, p0, p1, step=0.38):
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    dist = math.hypot(dx, dy) or 1.0
    ang = math.degrees(math.atan2(dy, dx))
    ax.plot([p0[0], p1[0]], [p0[1], p1[1]], color=CHAIN, lw=1.15, zorder=5, solid_capstyle="round")
    n = max(5, int(dist / step))
    for i in range(n):
        t = (i + 0.5) / n
        cx = p0[0] + dx * t
        cy = p0[1] + dy * t
        if i % 2 == 0:
            w, h, turn = step * 0.78, step * 0.30, ang
        else:
            w, h, turn = step * 0.32, step * 0.58, ang + 90
        ax.add_patch(Ellipse((cx, cy), w, h, angle=turn, fc="white", ec=CHAIN, lw=0.65, zorder=6))


def draw_side(ax):
    """Длинная грань 9 м. Передняя и задняя ветви в этом виде совпадают."""
    style_ax(ax, (-1.6, 12.4), (-1.7, 9.3))
    module_face(ax, 0, 0, LENGTH, HEIGHT, 4, door=0)
    hook = (LENGTH / 2, HEIGHT + HOOK_H)
    ax.plot([hook[0], hook[0]], [HEIGHT, hook[1]], color="#8a8278", lw=0.6, ls=(0, (4, 2)), zorder=4)
    draw_chain(ax, (0, HEIGHT), hook)
    draw_chain(ax, (LENGTH, HEIGHT), hook)
    eye(ax, 0, HEIGHT)
    eye(ax, LENGTH, HEIGHT)
    master_and_hook(ax, *hook)
    cg_mark(ax, LENGTH / 2, HEIGHT / 2, r=0.12)
    label(ax, 5.55, 0.48, "Ц.Т.", size=7)
    label(ax, 3.30, 2.05, f"{comma(MASS, 1)} т", size=8, bold=True)

    label(ax, 1.35, 5.35, comma(BRANCH, 1), size=8, rotation=49)
    label(ax, 0.55, 3.55, "две ветви", size=7, ha="right")
    label(ax, -0.15, HEIGHT + 0.38, "петля", size=7, ha="right")
    label(ax, hook[0] + 0.55, hook[1] + 0.15, "крюк", size=7.5, ha="left")

    hdim(ax, 0, LENGTH, -1.15, comma(LENGTH, 1), y_from=0)
    vdim(ax, 0, HEIGHT, 10.15, comma(HEIGHT, 1), x_from=LENGTH, size=7.5)
    vdim(ax, HEIGHT, hook[1], 11.35, comma(HOOK_H, 2), x_from=LENGTH, size=7.5)
    label(ax, LENGTH / 2, 8.85, "Вид с длинной стороны", size=11, bold=True)


def draw_end(ax):
    """Торец 3 м. Ветви длинных граней в этом виде совпадают."""
    style_ax(ax, (-1.5, 6.4), (-1.7, 9.3))
    module_face(ax, 0, 0, WIDTH, HEIGHT, 2, door=0)
    hook = (WIDTH / 2, HEIGHT + HOOK_H)
    ax.plot([hook[0], hook[0]], [HEIGHT, hook[1]], color="#8a8278", lw=0.6, ls=(0, (4, 2)), zorder=4)
    draw_chain(ax, (0, HEIGHT), hook)
    draw_chain(ax, (WIDTH, HEIGHT), hook)
    eye(ax, 0, HEIGHT)
    eye(ax, WIDTH, HEIGHT)
    master_and_hook(ax, *hook)
    label(ax, hook[0] + 0.5, hook[1] + 0.55, "крюк", size=7.5, ha="left")
    hdim(ax, 0, WIDTH, -1.15, comma(WIDTH, 1), y_from=0)
    label(ax, WIDTH / 2, 8.85, "Вид с торца", size=11, bold=True)


def draw_plan(ax):
    style_ax(ax, (-1.3, 11.6), (-2.0, 5.3))
    rect(ax, 0, 0, LENGTH, WIDTH, fc=BLOCK, ec=INK, lw=1.15, zorder=3)
    rect(ax, 0, WIDTH - 0.08, LENGTH, 0.08, fc="#e7dfd0", ec=INK, lw=0.3, zorder=4)
    for k in (1, 2):
        ax.plot([0, LENGTH], [k * WIDTH / 3, k * WIDTH / 3], color="#e0d6c4", lw=0.4, zorder=3)
    center = (LENGTH / 2, WIDTH / 2)
    corners = ((0, 0), (LENGTH, 0), (0, WIDTH), (LENGTH, WIDTH))
    for corner in corners:
        draw_chain(ax, corner, center, step=0.42)
        eye(ax, *corner)
    ax.add_patch(Circle(center, 0.16, fc="white", ec=INK, lw=1.1, zorder=8))
    cg_mark(ax, center[0], center[1], r=0.13)
    label(ax, center[0], 2.15, "Ц.Т.", size=7)
    label(ax, -0.15, WIDTH + 0.28, "петля", size=7, ha="right")
    label(ax, 1.55, 1.50, comma(REACH, 2), size=7.5)
    hdim(ax, 0, LENGTH, -1.45, comma(LENGTH, 1), y_from=0)
    vdim(ax, 0, WIDTH, 10.35, comma(WIDTH, 1), x_from=LENGTH)
    label(ax, LENGTH / 2, 4.85, "План. Четыре ветви к центру", size=11, bold=True)


def draw_branch(ax):
    """Истинный треугольник ветви: не путать с углом на виде сбоку."""
    style_ax(ax, (-2.4, 6.6), (-1.8, 7.2))
    foot = (0.0, 0.0)
    hook = (0.0, HOOK_H)
    eye_pt = (REACH, 0.0)
    ax.plot([foot[0], hook[0]], [foot[1], hook[1]], color=INK, lw=0.9, zorder=4)
    ax.plot([foot[0], eye_pt[0]], [foot[1], eye_pt[1]], color=INK, lw=0.9, zorder=4)
    draw_chain(ax, eye_pt, hook, step=0.46)
    ax.plot([0.28, 0.28, 0.0], [0.0, 0.28, 0.28], color=INK, lw=0.6, zorder=5)
    eye(ax, *eye_pt)
    master_and_hook(ax, *hook)
    deg = math.degrees(ALPHA)
    arc_r = 1.15
    ax.add_patch(Arc(
        hook, 2 * arc_r, 2 * arc_r,
        theta1=-90, theta2=-90 + deg,
        ec=INK, lw=0.7, zorder=5,
    ))
    label(ax, -0.35, HOOK_H - 1.45, f"{deg:.0f}°", size=8, ha="right")
    vdim(ax, 0, HOOK_H, -1.55, comma(HOOK_H, 2), x_from=0, size=7)
    hdim(ax, 0, REACH, -1.15, comma(REACH, 2), y_from=0, size=7)
    label(ax, 2.85, 2.95, comma(BRANCH, 1), size=8, rotation=-47)
    label(ax, 2.4, 6.7, "Ветвь в пространстве", size=11, bold=True)


def main():
    fig = plt.figure(figsize=(16.54, 11.69), dpi=160, facecolor="white")
    fig.text(
        0.04, 0.972, "Схема строповки блока",
        ha="left", va="top", fontsize=16, fontproperties=BOLD, color=INK,
    )
    fig.text(
        0.04, 0.942,
        "Модульное здание, один блок. Петли по верхним углам. Размеры в метрах.",
        ha="left", va="top", fontsize=9, fontproperties=SANS, color=INK,
    )

    draw_side(fig.add_axes([0.02, 0.50, 0.50, 0.40]))
    draw_end(fig.add_axes([0.52, 0.50, 0.22, 0.40]))
    draw_plan(fig.add_axes([0.015, 0.04, 0.50, 0.42]))
    draw_branch(fig.add_axes([0.50, 0.20, 0.26, 0.28]))

    deg = math.degrees(ALPHA)
    notes = (
        f"1. Четыре петли — по верхним углам.\n"
        f"    Стропят за них, не за нижний пояс.\n"
        f"2. Строп 4СЦ, цепной. Длина ветви {comma(BRANCH, 1)} м.\n"
        f"    К вертикали ветвь наклонена на {deg:.0f}°.\n"
        f"    Между противоположными ветвями {2 * deg:.0f}°,\n"
        f"    то есть меньше 90°.\n"
        f"3. По РД 10-33-93 груз считают на две\n"
        f"    ветви из четырёх:\n"
        f"    {comma(MASS, 1)} / (2 × cos {deg:.0f}°) = {comma(BRANCH_FORCE, 1)} т\n"
        f"    на ветвь. Паспорт ветви — не меньше\n"
        f"    {comma(BRANCH_FORCE, 1)} т.\n"
        f"4. Цепь 16 мм класса 8, паспорт ветви\n"
        f"    {comma(WLL_16, 1)} т, для блока проходит.\n"
        f"    Цепь 13 мм, паспорт ветви {comma(WLL_13, 1)} т,\n"
        f"    не проходит: две ветви держат\n"
        f"    около {comma(HOLD_13, 1)} т при массе {comma(MASS, 1)} т.\n"
        f"5. На видах сбоку и с торца передняя\n"
        f"    и задняя ветви совпадают. Все четыре\n"
        f"    видны на плане.\n"
        f"6. Центр тяжести — геометрический\n"
        f"    центр. Крюк крана — за верхнее\n"
        f"    кольцо стропа. Ветви не перекручивают.\n"
        f"7. На месте работ сверяют бирку: длина\n"
        f"    ветви и паспортная грузоподъёмность."
    )
    fig.text(
        0.772, 0.46, notes, ha="left", va="top", fontsize=8.0,
        fontproperties=SANS, color=INK, linespacing=1.38,
    )

    fig.add_artist(Rectangle(
        (0.012, 0.015), 0.976, 0.97, transform=fig.transFigure,
        fill=False, edgecolor=INK, lw=1.15,
    ))
    fig.savefig("/workspace/ppr/skhema-stropovki.png", dpi=160, facecolor="white")
    fig.savefig("/workspace/ppr/skhema-stropovki.pdf", facecolor="white")
    print(
        f"alpha={math.degrees(ALPHA):.2f} H={HOOK_H:.3f} R={REACH:.3f} "
        f"S={BRANCH_FORCE:.3f} hold13={HOLD_13:.3f}"
    )


if __name__ == "__main__":
    main()
