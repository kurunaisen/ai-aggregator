#!/usr/bin/env python3
"""ППР: передвижка блока экскаватором по рельсовым путям."""

import math

import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Ellipse, FancyBboxPatch, Polygon, Rectangle, Wedge
from matplotlib.font_manager import FontProperties

SANS = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
BOLD = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

INK = "#1a1a1a"
GLASS = "#d5e4ef"
BLOCK = "#f6f1e4"
CAB = "#2f3d4a"
STEEL = "#6d7882"
PAD = "#5c656c"
STONE = "#f4f1ea"
RAIL = "#4e585f"

GAUGE = 1.52
AXES_Y = (-3.0, 0.0, 3.0)
STOP = 6.5
CAB_FRONT = 5.0
# Показан промежуточный ход: ближняя грань ещё не дошла до стопа.
NEAR = 15.0
ALONG = 3.0
ACROSS = 9.0
HEIGHT = 2.5
HITCH = 0.6  # половина расстояния между точками на нижнем поясе
RAIL_TOP = 0.28


def comma(value, digits=1):
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
        x + 0.12, (y1 + y2) / 2, text, ha="left", va="center", rotation=90,
        fontsize=size, fontproperties=SANS, color=INK, zorder=9,
    )


def rails_of(axis):
    return axis - GAUGE / 2, axis + GAUGE / 2


def draw_chain(ax, p0, p1, step=0.36):
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    dist = math.hypot(dx, dy) or 1.0
    ang = math.degrees(math.atan2(dy, dx))
    ax.plot([p0[0], p1[0]], [p0[1], p1[1]], color=INK, lw=1.0, zorder=6, solid_capstyle="round")
    n = max(4, int(dist / step))
    for i in range(n):
        t = (i + 0.5) / n
        cx = p0[0] + dx * t
        cy = p0[1] + dy * t
        w, h, turn = (step * 0.7, step * 0.28, ang) if i % 2 == 0 else (step * 0.28, step * 0.55, ang + 90)
        ax.add_patch(Ellipse(
            (cx, cy), w, h, angle=turn, fc="white", ec=INK, lw=0.55, zorder=7,
        ))


def draw_tracks_plan(ax, x0, x1):
    for axis in AXES_Y:
        for rail in rails_of(axis):
            ax.plot([x0, x1], [rail, rail], color=RAIL, lw=1.35, zorder=2, solid_capstyle="butt")
        x = x0 + 0.4
        while x < x1:
            rect(ax, x, axis - 1.25, 0.12, 2.5, fc="#d9d3c8", ec="none", zorder=1)
            x += 1.0


def draw_tracks_side(ax, x0, x1):
    rect(ax, x0, 0.02, x1 - x0, 0.16, fc="#d9d3c8", ec="none", zorder=1)
    rect(ax, x0, RAIL_TOP - 0.08, x1 - x0, 0.08, fc=RAIL, ec=INK, lw=0.4, zorder=2)
    x = x0 + 0.35
    while x < x1:
        ax.plot([x, x], [0.02, 0.18], color="#b7aea2", lw=0.6, zorder=1)
        x += 1.0


def draw_crane_plan(ax):
    ax.add_patch(FancyBboxPatch(
        (-3.4, -1.15), 8.4, 2.3,
        boxstyle="round,pad=0.02,rounding_size=0.12",
        fc="#d7dee4", ec=INK, lw=0.9, zorder=3,
    ))
    ax.add_patch(FancyBboxPatch(
        (2.55, -1.05), 2.45, 2.1,
        boxstyle="round,pad=0.01,rounding_size=0.1",
        fc=CAB, ec=INK, lw=0.8, zorder=4,
    ))
    rect(ax, 4.65, -0.72, 0.28, 1.44, fc=GLASS, ec=INK, lw=0.35, zorder=5)
    for wx in (3.3, -0.2, -1.6):
        rect(ax, wx, 1.05, 0.7, 0.28, fc="#222", ec=INK, lw=0.3, zorder=4)
        rect(ax, wx, -1.33, 0.7, 0.28, fc="#222", ec=INK, lw=0.3, zorder=4)
    pads = ((1.35, 2.15), (1.35, -2.75), (-2.15, 2.15), (-2.15, -2.75))
    roots = ((1.2, 0.9), (1.2, -0.9), (-0.9, 0.9), (-0.9, -0.9))
    for (px, py), (sx, sy) in zip(pads, roots):
        ax.plot([sx, px + 0.35], [sy, py + 0.28], color="#3e4850", lw=3.2, solid_capstyle="round", zorder=3)
        rect(ax, px, py, 0.7, 0.55, fc=PAD, ec=INK, lw=0.6, zorder=4)
    ax.add_patch(Circle((0, 0), 1.05, fc="#e8ecef", ec=INK, lw=0.9, zorder=5))
    ax.add_patch(Circle((0, 0), 0.12, fc=INK, zorder=6))
    ax.plot([0.3, 2.1], [0, 0], color="#cfc8b6", lw=4.5, solid_capstyle="butt", zorder=6)
    label(ax, 1.15, 0.55, "стрела\nподнята", size=6.5)
    label(ax, 3.7, 0.15, "кабина", size=6.5, color="white")


def draw_crane_side(ax):
    rect(ax, -3.3, 0.85, 7.6, 0.32, fc="#c5ced6", ec=INK, lw=0.7, zorder=3)
    rect(ax, -0.15, 1.15, 1.7, 1.05, fc="#9aa3ab", ec=INK, lw=0.6, zorder=4)
    for cx in (3.5, -0.15, -1.5):
        ax.add_patch(Circle((cx, 0.48), 0.42, fc="#2a2a2a", ec=INK, lw=0.5, zorder=4))
        ax.add_patch(Circle((cx, 0.48), 0.16, fc="#ddd", ec=INK, lw=0.3, zorder=5))
    ax.add_patch(Polygon(
        [(2.55, 1.15), (2.55, 2.35), (3.3, 2.85), (4.55, 2.7), (5.0, 1.7), (5.0, 1.15)],
        closed=True, fc=CAB, ec=INK, lw=0.8, zorder=4,
    ))
    ax.add_patch(Polygon(
        [(4.15, 2.45), (4.7, 1.85), (4.9, 1.6), (4.35, 2.15)],
        closed=True, fc=GLASS, ec=INK, lw=0.35, zorder=5,
    ))
    rect(ax, 1.15, 0.08, 0.16, 0.85, fc="#4e585f", ec=INK, lw=0.35, zorder=3)
    rect(ax, 0.85, 0.0, 0.7, 0.1, fc=PAD, ec=INK, lw=0.35, zorder=3)
    ax.add_patch(Circle((1.2, 1.85), 0.16, fc="#333", ec=INK, lw=0.4, zorder=6))
    ax.plot([1.2, 1.55], [1.85, 4.55], color="#cfc8b6", lw=6.0, solid_capstyle="butt", zorder=5)
    ax.plot([1.2, 1.55], [2.02, 4.55], color="#f7f3ea", lw=1.6, solid_capstyle="butt", zorder=6)
    ax.plot([0, 0], [0, 0.7], color=INK, lw=0.7, zorder=4)
    label(ax, 0.15, -0.35, "центр\nвращения", size=6.5)
    label(ax, 3.5, 3.15, "кабина", size=7)


def draw_excavator_plan(ax):
    rear, length = 7.6, 4.5
    # Башмаки в промежутках между головками, не на рельсах ±0,76 и ±2,24.
    for s in (-1.90, 0.12):
        ax.add_patch(FancyBboxPatch(
            (rear, s), length, 0.50,
            boxstyle="round,pad=0.01,rounding_size=0.08",
            fc="#2a2a2a", ec=INK, lw=0.6, zorder=5,
        ))
        for k in range(8):
            ax.plot(
                [rear + 0.3 + k * 0.5, rear + 0.3 + k * 0.5],
                [s + 0.06, s + 0.46], color="#777", lw=0.45, zorder=6,
            )
    ax.add_patch(FancyBboxPatch(
        (8.15, -1.45), 3.15, 1.85,
        boxstyle="round,pad=0.02,rounding_size=0.1",
        fc="#c5ced6", ec=INK, lw=0.8, zorder=6,
    ))
    rect(ax, 7.75, -1.2, 0.7, 1.35, fc="#8b9298", ec=INK, lw=0.5, zorder=6)
    ax.add_patch(FancyBboxPatch(
        (9.45, -0.35), 1.5, 0.7,
        boxstyle="round,pad=0.01,rounding_size=0.08",
        fc=CAB, ec=INK, lw=0.6, zorder=7,
    ))
    rect(ax, 10.55, -0.18, 0.25, 0.38, fc=GLASS, ec=INK, lw=0.3, zorder=8)
    ax.plot([11.2, 12.55], [0, 0], color="#d7d1c4", lw=3.5, solid_capstyle="butt", zorder=7)
    ax.add_patch(Polygon(
        [(12.35, -0.38), (13.05, -0.28), (12.85, 0.28), (12.35, 0.38)],
        closed=True, fc="#4e585f", ec=INK, lw=0.6, zorder=7,
    ))
    ax.add_patch(Circle((12.45, 0), 0.1, fc="white", ec=INK, lw=0.7, zorder=8))
    label(ax, 9.6, 0.85, "экскаватор", size=7.5)


def draw_excavator_side(ax):
    rear = 7.6
    rect(ax, rear, 0.08, 4.5, 0.72, fc="#3a3a3a", ec=INK, lw=0.7, zorder=4)
    for cx in (8.25, 9.45, 10.6, 11.55):
        ax.add_patch(Circle((cx, 0.46), 0.38, fc="#1c1c1c", ec=INK, lw=0.45, zorder=5))
        ax.add_patch(Circle((cx, 0.46), 0.14, fc="#ccc", ec=INK, lw=0.3, zorder=6))
    rect(ax, 8.05, 1.05, 0.85, 1.15, fc="#8b9298", ec=INK, lw=0.55, zorder=4)
    ax.add_patch(FancyBboxPatch(
        (8.7, 0.95), 2.7, 0.85,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        fc="#c5ced6", ec=INK, lw=0.7, zorder=4,
    ))
    ax.add_patch(Polygon(
        [(9.35, 1.75), (9.4, 2.85), (10.7, 3.05), (11.15, 2.55), (11.05, 1.75)],
        closed=True, fc=CAB, ec=INK, lw=0.7, zorder=5,
    ))
    ax.add_patch(Polygon(
        [(10.35, 2.7), (10.95, 2.15), (11.05, 1.95), (10.5, 2.45)],
        closed=True, fc=GLASS, ec=INK, lw=0.35, zorder=6,
    ))
    ax.plot([10.85, 12.15], [2.15, 3.15], color="#d7d1c4", lw=6, solid_capstyle="butt", zorder=4)
    ax.plot([10.85, 12.15], [2.28, 3.15], color="#f4f0e6", lw=1.6, zorder=5)
    ax.plot([12.15, 12.85], [3.15, 1.75], color="#cfc8b6", lw=4.2, solid_capstyle="butt", zorder=4)
    ax.add_patch(Polygon(
        [(12.55, 1.15), (13.15, 1.35), (12.95, 1.85), (12.45, 1.7)],
        closed=True, fc="#4e585f", ec=INK, lw=0.6, zorder=6,
    ))
    for tx in (12.85, 13.0, 13.15):
        ax.plot([tx, tx - 0.05], [1.35, 1.05], color=INK, lw=0.7, zorder=6)
    ax.add_patch(Circle((12.45, 1.45), 0.1, fc="white", ec=INK, lw=0.8, zorder=7))
    label(ax, 13.4, 1.95, "рым", size=7, ha="left")
    label(ax, 13.45, 0.85, "зубья", size=6.5, ha="left")


def draw_block_plan(ax):
    rect(ax, NEAR, -ACROSS / 2, ALONG, ACROSS, fc=BLOCK, ec=INK, lw=1.15, zorder=4)
    for y in (-HITCH, HITCH):
        ax.add_patch(Circle((NEAR, y), 0.12, fc="white", ec=INK, lw=0.8, zorder=8))
    label(ax, NEAR + 1.5, 0.35, "один блок", size=8, bold=True)
    ax.annotate(
        "", xy=(NEAR - 0.3, 3.6), xytext=(NEAR + 2.2, 3.6),
        arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.1), zorder=6,
    )
    label(ax, NEAR + 0.9, 4.05, "ход блока", size=7.5)


def draw_block_side(ax):
    x, y = NEAR, RAIL_TOP
    rect(ax, x, y, ALONG, HEIGHT, fc=BLOCK, ec=INK, lw=1.0, zorder=4)
    rect(ax, x, y, 0.07, HEIGHT, fc="#cfc6b4", ec=INK, lw=0.25, zorder=5)
    rect(ax, x + ALONG - 0.07, y, 0.07, HEIGHT, fc="#cfc6b4", ec=INK, lw=0.25, zorder=5)
    rect(ax, x + 0.85, y + HEIGHT * 0.5, 1.2, HEIGHT * 0.26, fc=GLASS, ec=INK, lw=0.4, zorder=5)
    ax.add_patch(Circle((x, y + 0.28), 0.1, fc="white", ec=INK, lw=0.8, zorder=7))
    label(ax, x + 1.5, y + 0.45, "блок", size=8, bold=True)


def draw_plan(ax):
    style_ax(ax, (-4.6, 19.6), (-6.6, 6.9))
    rect(ax, 4.2, -5.5, 15.2, 11.0, fc=STONE, ec="#e0dbd2", lw=0.4, zorder=0)
    draw_tracks_plan(ax, 6.2, 19.2)
    draw_crane_plan(ax)
    draw_excavator_plan(ax)
    draw_block_plan(ax)
    eye = (12.45, 0.0)
    for y in (-HITCH, HITCH):
        draw_chain(ax, eye, (NEAR, y), step=0.42)
    ax.plot([STOP, STOP], [-5.2, 5.2], color=INK, lw=0.9, ls=(0, (5, 2.5)), zorder=3)
    label(ax, STOP, 5.7, "стоп", size=8, bold=True)
    label(ax, 13.6, -1.55, "не стоять", size=7)
    label(ax, 13.7, 1.15, "2СЦ", size=7.5)
    label(ax, 16.2, -5.15, "щебень", size=7)
    hdim(ax, 0, CAB_FRONT, -5.7, comma(CAB_FRONT, 1), y_from=-1.2, size=7)
    hdim(ax, 0, STOP, -6.35, comma(STOP, 1), y_from=0, size=7.5)
    vdim(ax, -ACROSS / 2, ACROSS / 2, 18.7, comma(ACROSS, 1), x_from=NEAR + ALONG, size=7)
    label(ax, 8.0, 6.45, "План. Тяга к крану", size=11, bold=True)


def draw_side(ax):
    style_ax(ax, (-4.2, 19.4), (-2.15, 5.7))
    ax.plot([-3.8, 19.2], [0, 0], color=INK, lw=1.0, zorder=2)
    rect(ax, 4.0, -0.45, 15.2, 0.45, fc=STONE, ec="none", zorder=0)
    draw_tracks_side(ax, 6.2, 19.0)
    draw_crane_side(ax)
    draw_excavator_side(ax)
    draw_block_side(ax)
    hitch = (NEAR, RAIL_TOP + 0.28)
    eye = (12.45, 1.45)
    draw_chain(ax, eye, hitch, step=0.34)
    length = math.hypot(eye[0] - hitch[0], eye[1] - hitch[1])
    label(ax, 14.35, 1.55, comma(length, 1), size=7.5)
    label(ax, 14.2, 2.35, "не стоять", size=7)
    ax.plot([STOP, STOP], [0, 3.4], color=INK, lw=0.9, ls=(0, (5, 2.5)), zorder=3)
    label(ax, STOP + 0.15, 3.7, "стоп", size=8, bold=True, ha="left")
    ax.annotate(
        "", xy=(NEAR - 0.15, RAIL_TOP + HEIGHT + 0.45),
        xytext=(NEAR + ALONG - 0.2, RAIL_TOP + HEIGHT + 0.45),
        arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.0), zorder=6,
    )
    label(ax, NEAR + 1.4, RAIL_TOP + HEIGHT + 0.85, "ход блока", size=7.5)
    hdim(ax, 0, STOP, -1.15, comma(STOP, 1), y_from=0, size=7.5)
    hdim(ax, 0, CAB_FRONT, -1.9, comma(CAB_FRONT, 1), y_from=1.15, size=7)
    label(ax, 16.5, 5.25, "Вид сбоку", size=11, bold=True)


def draw_face(ax):
    """Торец 9 м, обращённый к крану. Точки строповки на нижнем поясе."""
    style_ax(ax, (-1.3, 10.4), (-1.5, 4.6))
    rect(ax, 0, 0, ACROSS, HEIGHT, fc=BLOCK, ec=INK, lw=1.05, zorder=3)
    rect(ax, 0, 0, 0.08, HEIGHT, fc="#cfc6b4", ec=INK, lw=0.3, zorder=4)
    rect(ax, ACROSS - 0.08, 0, 0.08, HEIGHT, fc="#cfc6b4", ec=INK, lw=0.3, zorder=4)
    rect(ax, 0, 0, ACROSS, 0.16, fc="#d9d0be", ec=INK, lw=0.35, zorder=4)
    rect(ax, 2.3, HEIGHT * 0.55, 1.5, 0.55, fc=GLASS, ec=INK, lw=0.4, zorder=4)
    rect(ax, 5.2, HEIGHT * 0.55, 1.5, 0.55, fc=GLASS, ec=INK, lw=0.4, zorder=4)
    mid = ACROSS / 2
    for x in (mid - HITCH, mid + HITCH):
        ax.add_patch(Circle((x, 0.32), 0.12, fc="white", ec=INK, lw=0.8, zorder=6))
    for x in (0.15, ACROSS - 0.15):
        ax.add_patch(Circle((x, HEIGHT - 0.18), 0.1, fc="white", ec=INK, lw=0.6, zorder=5))
        ax.plot([x - 0.12, x + 0.12], [HEIGHT - 0.3, HEIGHT - 0.06], color=INK, lw=0.7, zorder=6)
        ax.plot([x - 0.12, x + 0.12], [HEIGHT - 0.06, HEIGHT - 0.3], color=INK, lw=0.7, zorder=6)
    hdim(ax, mid - HITCH, mid + HITCH, -0.85, comma(2 * HITCH, 1), y_from=0.32, size=7.5)
    label(ax, mid, 0.7, "нижний пояс", size=7.5)
    label(ax, mid, 4.15, "Торец к крану", size=11, bold=True)
    label(ax, mid, 3.35, "верхние петли этим стропом не занимают", size=7)


def main():
    fig = plt.figure(figsize=(16.54, 11.69), dpi=160, facecolor="white")
    fig.text(
        0.04, 0.972, "Схема передвижки блока экскаватором",
        ha="left", va="top", fontsize=16, fontproperties=BOLD, color=INK,
    )
    fig.text(
        0.04, 0.942,
        "Один блок 3 × 9 × 2,5 м, масса 8,7 т. Тяга по трём путям к крану. Размеры в метрах.",
        ha="left", va="top", fontsize=9, fontproperties=SANS, color=INK,
    )

    draw_plan(fig.add_axes([0.012, 0.50, 0.66, 0.40]))
    draw_side(fig.add_axes([0.012, 0.045, 0.66, 0.42]))
    draw_face(fig.add_axes([0.66, 0.55, 0.32, 0.35]))

    notes = (
        "1. Экскаватор гусеничный, около 20 т,\n"
        "    обратная лопата. Усилие рукояти\n"
        "    не меньше 90 кН. Стоит на щебне\n"
        "    по оси путей, между краном и блоком.\n"
        "    На головки рельсов гусеницы не ставят.\n"
        "2. Блок скользит по трём путям\n"
        "    колеи 1520 мм. По грунту его не тащат.\n"
        "3. Строп 2СЦ, цепь 10 мм класса 8,\n"
        "    по паспорту не меньше 4,2 т.\n"
        "    Ветви 2–3 м. Две точки на нижнем\n"
        "    поясе торца к крану, по центру,\n"
        "    между точками не больше 1,5 м.\n"
        "4. Строп — на рым ковша, если рым\n"
        "    по паспорту не меньше 4 т.\n"
        "    За зубья ковша не цепляют.\n"
        "5. Тянут ходом рукояти, короткими\n"
        "    подачами. Между экскаватором\n"
        "    и блоком не стоят.\n"
        "6. Стоп: ближняя грань блока — 6,5 м\n"
        "    от центра вращения. Строп снимают,\n"
        "    экскаватор уводят из створа стрелы.\n"
        "    Затем блок берёт кран.\n"
        "7. 5,0 м до переда кабины сверяют\n"
        "    обмером. На передвижке стрела\n"
        "    крана поднята."
    )
    fig.text(
        0.675, 0.50, notes, ha="left", va="top", fontsize=8.0,
        fontproperties=SANS, color=INK, linespacing=1.32,
    )
    fig.add_artist(Rectangle(
        (0.012, 0.015), 0.976, 0.97, transform=fig.transFigure,
        fill=False, edgecolor=INK, lw=1.15,
    ))
    fig.savefig("/workspace/ppr/skhema-ekskavator.png", dpi=160, facecolor="white")
    fig.savefig("/workspace/ppr/skhema-ekskavator.pdf", facecolor="white")
    hitch = (NEAR, RAIL_TOP + 0.28)
    eye = (12.45, 1.45)
    print("chain", round(math.hypot(eye[0] - hitch[0], eye[1] - hitch[1]), 2))


if __name__ == "__main__":
    main()
