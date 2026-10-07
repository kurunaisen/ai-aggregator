#!/usr/bin/env python3
"""ППР: строповка блока при укладке на новую площадку."""

import math
import sys

import matplotlib.pyplot as plt
from matplotlib.patches import Arc, Circle, Ellipse, Rectangle, Wedge
from matplotlib.font_manager import FontProperties

sys.path.insert(0, "/workspace/ppr")
from draw_sling_scheme import (  # noqa: E402
    ALPHA,
    BRANCH,
    BRANCH_FORCE,
    HEIGHT,
    HOOK_H,
    HOLD_13,
    LENGTH,
    MASS,
    REACH,
    WIDTH,
    WLL_13,
    WLL_16,
    cg_mark,
    comma,
    draw_chain,
    eye,
    master_and_hook,
)

SANS = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
BOLD = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

INK = "#1a1a1a"
STONE = "#e4efe0"
SLEEPER = "#cbb892"
RAIL = "#163a5f"
BLOCK = "#f6d36b"
BLOCK_EDGE = "#8a5a12"
GLASS = "#d5e4ef"
GAUGE = 1.52
AXIS_STEP = 3.70
AXES = (-AXIS_STEP, 0.0, AXIS_STEP)
STONE_H = 0.25
RAIL_TOP = 0.68


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
        bbox=dict(fc="white", ec="none", pad=0.15, alpha=0.92),
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
        x + 0.16, (y1 + y2) / 2, text, ha="left", va="center", rotation=90,
        fontsize=size, fontproperties=SANS, color=INK, zorder=9,
        bbox=dict(fc="white", ec="none", pad=0.1, alpha=0.9),
    )


def block_box(ax, x, y, w, h, z=4):
    rect(ax, x, y, w, h, fc=BLOCK, ec=BLOCK_EDGE, lw=1.25, zorder=z)
    if w >= 5:
        rect(ax, x + 0.35, y + 0.18, 0.7, h * 0.45, fc="#fff4cc", ec=BLOCK_EDGE, lw=0.4, zorder=z + 1)
        gap, n = 0.35, 3
        left, right = x + 1.7, x + w - 0.45
        ww = (right - left - gap * (n - 1)) / n
        for i in range(n):
            rect(
                ax, left + i * (ww + gap), y + h * 0.55, ww, h * 0.22,
                fc=GLASS, ec=INK, lw=0.4, zorder=z + 1,
            )
        return
    ww, wh = min(1.15, w * 0.4), h * 0.24
    rect(ax, x + (w - ww) / 2, y + h * 0.52, ww, wh, fc=GLASS, ec=INK, lw=0.4, zorder=z + 1)


def rails_section(ax, x_left, x_right):
    """Поперечный разрез трёх путей. Ноль по высоте — низ щебня."""
    rect(ax, x_left, 0, x_right - x_left, STONE_H, fc=STONE, ec="#c5d4bc", lw=0.4, hatch="..", zorder=1)
    mid = (x_left + x_right) / 2
    for axis in AXES:
        cx = mid + axis
        rect(ax, cx - 1.35, STONE_H, 2.70, 0.23, fc=SLEEPER, ec="#8d7b5e", lw=0.4, zorder=2)
        for sign in (-1, 1):
            rx = cx + sign * GAUGE / 2
            rect(ax, rx - 0.07, STONE_H + 0.23, 0.14, RAIL_TOP - STONE_H - 0.23, fc=RAIL, ec=INK, lw=0.3, zorder=3)


def draw_across(ax):
    """Вид поперёк путей: сторона блока 9 м, под ним три пути."""
    style_ax(ax, (-1.8, 12.6), (-1.9, 9.6))
    rails_section(ax, -0.7, 9.7)
    block_box(ax, 0, RAIL_TOP, LENGTH, HEIGHT)
    hook = (LENGTH / 2, RAIL_TOP + HEIGHT + HOOK_H)
    top = RAIL_TOP + HEIGHT
    draw_chain(ax, (0, top), hook)
    draw_chain(ax, (LENGTH, top), hook)
    eye(ax, 0, top)
    eye(ax, LENGTH, top)
    master_and_hook(ax, *hook)
    cg_mark(ax, LENGTH / 2, RAIL_TOP + HEIGHT / 2, r=0.12)
    label(ax, 3.15, RAIL_TOP + 0.7, f"{comma(MASS, 1)} т", size=8, bold=True)
    label(ax, 1.55, 4.7, comma(BRANCH, 1), size=8, rotation=42)
    label(ax, hook[0] + 0.45, hook[1] + 0.15, "крюк", size=7.5, ha="left")
    label(ax, -0.2, top + 0.35, "петля", size=7, ha="right")
    label(ax, 4.5, 0.55, "ЖД пути", size=7.5, color=RAIL)
    hdim(ax, 0, LENGTH, -1.25, comma(LENGTH, 1), y_from=0)
    vdim(ax, RAIL_TOP, top, 10.3, comma(HEIGHT, 1), x_from=LENGTH, size=7.5)
    vdim(ax, top, hook[1], 11.5, comma(HOOK_H, 2), x_from=LENGTH, size=7.5)
    label(ax, LENGTH / 2, 9.15, "Поперёк путей. Сторона 9 м", size=11, bold=True)


def draw_along(ax):
    """Вид вдоль путей: сторона блока 3 м."""
    style_ax(ax, (-1.4, 6.2), (-1.9, 9.6))
    rect(ax, -0.4, 0, 3.8, STONE_H, fc=STONE, ec="#c5d4bc", lw=0.4, hatch="..", zorder=1)
    rect(ax, -0.15, STONE_H, 3.3, 0.23, fc=SLEEPER, ec="#8d7b5e", lw=0.4, zorder=2)
    rect(ax, -0.15, RAIL_TOP - 0.15, 3.3, 0.15, fc=RAIL, ec=INK, lw=0.3, zorder=3)
    block_box(ax, 0, RAIL_TOP, WIDTH, HEIGHT)
    hook = (WIDTH / 2, RAIL_TOP + HEIGHT + HOOK_H)
    top = RAIL_TOP + HEIGHT
    draw_chain(ax, (0, top), hook)
    draw_chain(ax, (WIDTH, top), hook)
    eye(ax, 0, top)
    eye(ax, WIDTH, top)
    master_and_hook(ax, *hook)
    label(ax, hook[0] + 0.4, hook[1] + 0.2, "крюк", size=7.5, ha="left")
    label(ax, 1.5, 0.55, "рельс", size=7, color=RAIL)
    hdim(ax, 0, WIDTH, -1.25, comma(WIDTH, 1), y_from=0)
    label(ax, WIDTH / 2, 9.15, "Вдоль путей. Сторона 3 м", size=11, bold=True)


def draw_plan(ax):
    """План: блок 3 м вдоль путей и 9 м поперёк, четыре петли к крюку."""
    style_ax(ax, (-2.2, 8.6), (-6.4, 6.6))
    rect(ax, -1.2, -5.55, 5.4, 11.1, fc=STONE, ec="#c5d4bc", lw=0.5, hatch="..", zorder=0)
    for axis in AXES:
        x = -0.9
        while x < 4.5:
            rect(ax, x, axis - 1.35, 0.22, 2.70, fc=SLEEPER, ec="#8d7b5e", lw=0.3, zorder=1)
            x += 0.55
        for sign in (-1, 1):
            y = axis + sign * GAUGE / 2
            ax.plot([-1.0, 4.6], [y, y], color=RAIL, lw=2.2, solid_capstyle="butt", zorder=2)
    rect(ax, 0, -LENGTH / 2, WIDTH, LENGTH, fc=BLOCK, ec=BLOCK_EDGE, lw=1.4, zorder=3)
    center = (WIDTH / 2, 0.0)
    corners = ((0, -LENGTH / 2), (WIDTH, -LENGTH / 2), (0, LENGTH / 2), (WIDTH, LENGTH / 2))
    for corner in corners:
        draw_chain(ax, corner, center, step=0.42)
        eye(ax, *corner)
    for axis in AXES:
        for sign in (-1, 1):
            y = axis + sign * GAUGE / 2
            ax.plot([0.08, WIDTH - 0.08], [y, y], color=RAIL, lw=1.6, solid_capstyle="butt", zorder=4)
    cg_mark(ax, *center, r=0.14)
    label(ax, center[0], 0.55, "крюк", size=7.5)
    label(ax, 1.5, -3.35, "БЛОК", size=9, bold=True)
    label(ax, 5.55, 3.7, "ЖД пути", size=8, color=RAIL, ha="left")
    hdim(ax, 0, WIDTH, -6.0, comma(WIDTH, 1), y_from=-4.5, size=7.5)
    vdim(ax, -LENGTH / 2, LENGTH / 2, 6.7, comma(LENGTH, 1), x_from=3.0, size=7.5)
    label(ax, 2.4, 6.15, "План. Блок на трёх путях", size=11, bold=True)


def main():
    fig = plt.figure(figsize=(16.54, 11.69), dpi=160, facecolor="white")
    fig.text(
        0.04, 0.972, "Схема строповки блока на новой площадке",
        ha="left", va="top", fontsize=16, fontproperties=BOLD, color=INK,
    )
    fig.text(
        0.04, 0.942,
        "Один блок 3 × 9 × 2,5 м, масса 8,7 т. Строп 4СЦ за верхние углы. Размеры в метрах.",
        ha="left", va="top", fontsize=9, fontproperties=SANS, color=INK,
    )

    draw_across(fig.add_axes([0.02, 0.48, 0.52, 0.42]))
    draw_along(fig.add_axes([0.52, 0.48, 0.24, 0.42]))
    draw_plan(fig.add_axes([0.02, 0.04, 0.48, 0.42]))

    deg = math.degrees(ALPHA)
    four = MASS / (4 * math.cos(ALPHA))
    notes = (
        "1. Блок сажают на головки трёх путей.\n"
        "    Стропят до посадки и снимают строп,\n"
        "    когда ветви провисли и блок стоит.\n"
        "2. Четыре петли — по верхним углам.\n"
        "    Нижний пояс этим стропом не занимают:\n"
        "    туда крепили тягу экскаватора.\n"
        f"3. Строп 4СЦ, ветвь {comma(BRANCH, 1)} м.\n"
        f"    К вертикали ветвь наклонена на {deg:.0f}°.\n"
        f"    Крюк выше верха блока на {comma(HOOK_H, 2)} м.\n"
        "4. По РД 10-33-93 груз считают на две\n"
        "    ветви из четырёх:\n"
        f"    {comma(MASS, 1)} / (2 × cos {deg:.0f}°) = {comma(BRANCH_FORCE, 1)} т.\n"
        f"    На все четыре ветви приходится по {comma(four, 1)} т.\n"
        f"5. Цепь 16 мм класса 8, паспорт ветви\n"
        f"    {comma(WLL_16, 1)} т, для блока проходит.\n"
        f"    Цепь 13 мм, паспорт {comma(WLL_13, 1)} т, не проходит:\n"
        f"    две ветви держат около {comma(HOLD_13, 1)} т.\n"
        "6. Крюк — над центром блока, на пересечении\n"
        "    диагоналей. Ветви одной длины, без\n"
        "    перекрута. На бирке сверяют 7 м и 8 т.\n"
        "7. На видах сбоку передняя и задняя ветви\n"
        "    совпадают. Все четыре видны на плане."
    )
    fig.text(
        0.55, 0.44, notes, ha="left", va="top", fontsize=8.2,
        fontproperties=SANS, color=INK, linespacing=1.32,
    )
    fig.add_artist(Rectangle(
        (0.012, 0.015), 0.976, 0.97, transform=fig.transFigure,
        fill=False, edgecolor=INK, lw=1.15,
    ))
    fig.savefig("/workspace/ppr/skhema-stropovka-ploshchadka.png", dpi=160, facecolor="white")
    fig.savefig("/workspace/ppr/skhema-stropovka-ploshchadka.pdf", facecolor="white")
    print(f"alpha={deg:.1f} H={HOOK_H:.2f} four={four:.2f} two={BRANCH_FORCE:.2f}")


if __name__ == "__main__":
    main()
