#!/usr/bin/env python3
"""ППР: передвижка блока экскаватором по рельсовым путям."""

import math

import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Ellipse, FancyBboxPatch, Polygon, Rectangle, Wedge
from matplotlib.transforms import Affine2D
from matplotlib.font_manager import FontProperties

SANS = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
BOLD = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

INK = "#1a1a1a"
GLASS = "#d5e4ef"
BLOCK = "#f6f1e4"
CAB = "#2f3d4a"
STEEL = "#6d7882"
STEEL_DK = "#3e4850"
PAD = "#5c656c"
STONE = "#f3f0e8"
RAIL = "#4a545c"
BOOM = "#e4dece"
BOOM_EDGE = "#2c3136"
COUNTER = "#8b9298"

GAUGE = 1.52
SLEEPER_L = 2.70
SLEEPER_W = 0.28
# Машина около 20 т: башмак 0,60 м, просвет между гусеницами 1,60 м.
# По гусеницам 2,80 м. Между осями двух путей нужно не меньше
# 2,70 + 2,80 = 5,50 м, иначе гусеница садится на шпалу.
SHOE = 0.60
TRACK_GAP = 1.60
MACHINE_W = TRACK_GAP + 2 * SHOE
AXIS_GAP = SLEEPER_L + MACHINE_W
AXES_Y = (-AXIS_GAP / 2, AXIS_GAP / 2)
# Торц решётки, куда подают блок под погрузку. На листе тянут блок,
# чей ближний торец в 9 м: рукоять 3 м, потом машина сдаёт назад.
RAIL0 = 0.0
RAIL1 = 18.0
FACE = 9.0
EYE_X = 6.0
STICK = 3.0
ALONG = 3.0
ACROSS = 9.0
HEIGHT = 2.5
HITCH = 0.6  # половина расстояния между точками на нижнем поясе
RAIL_TOP = 0.28
# Рым в местных координатах машины. На листе он в 3 м от торца блока.
EYE_LOCAL = 12.50
EX_SHIFT = EYE_X - EYE_LOCAL
EYE_SIDE = (12.48, 1.52)
SIDE_SHIFT = EYE_X - EYE_SIDE[0]
HITCH_Z = RAIL_TOP + 0.28


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


def box_boom(ax, root, tip, w0, w1, z=4, color=BOOM):
    side = boom_polygon(*root, *tip, w0, w1)
    ox, oy = -0.07, 0.11
    top = [
        (side[0][0] + ox, side[0][1] + oy),
        (side[1][0] + ox, side[1][1] + oy),
        side[1],
        side[0],
    ]
    ax.add_patch(Polygon(side, closed=True, fc=color, ec=BOOM_EDGE, lw=0.8, zorder=z))
    ax.add_patch(Polygon(top, closed=True, fc="#f7f3ea", ec=BOOM_EDGE, lw=0.65, zorder=z + 1))
    dx, dy = tip[0] - root[0], tip[1] - root[1]
    length = math.hypot(dx, dy) or 1
    px, py = -dy / length, dx / length
    for t in (0.38, 0.68):
        c = _along(root, tip, t)
        half = (w0 / 2) * (1 - t) + (w1 / 2) * t
        ax.plot(
            [c[0] - px * half, c[0] + px * half],
            [c[1] - py * half, c[1] + py * half],
            color=BOOM_EDGE, lw=0.55, zorder=z + 2,
        )
    return side[1]


def cylinder(ax, a, b, z=5):
    ax.plot([a[0], b[0]], [a[1], b[1]], color=STEEL_DK, lw=3.4, solid_capstyle="butt", zorder=z)
    mid = _along(a, b, 0.55)
    ax.plot([a[0], mid[0]], [a[1], mid[1]], color="#d5dee6", lw=1.5, solid_capstyle="butt", zorder=z + 1)
    ax.add_patch(Circle(a, 0.055, fc="#222", ec=INK, lw=0.3, zorder=z + 2))
    ax.add_patch(Circle(b, 0.055, fc="#222", ec=INK, lw=0.3, zorder=z + 2))


def wheel_side(ax, cx, cy, r, dual=False, z=5):
    if dual:
        ax.add_patch(Circle((cx + 0.05, cy), r * 0.96, fc="#161616", ec="#111", lw=0.3, zorder=z))
    ax.add_patch(Circle((cx, cy), r, fc="#2c2c2c", ec=INK, lw=0.6, zorder=z + 1))
    ax.add_patch(Circle((cx, cy), r * 0.72, fc="#4a4a4a", ec="#222", lw=0.3, zorder=z + 2))
    ax.add_patch(Circle((cx, cy), r * 0.42, fc="#ececec", ec=INK, lw=0.4, zorder=z + 3))
    ax.add_patch(Circle((cx, cy), r * 0.14, fc="#333", zorder=z + 4))


def tire_plan(ax, x, y, w=0.62, h=0.32, z=4):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.01,rounding_size=0.08",
        fc="#242424", ec=INK, lw=0.4, zorder=z,
    ))
    ax.add_patch(Circle((x + w * 0.5, y + h * 0.5), min(w, h) * 0.22, fc="#d8d8d8", ec=INK, lw=0.3, zorder=z + 1))


def draw_chain(ax, p0, p1, step=0.28):
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    dist = math.hypot(dx, dy) or 1.0
    ang = math.degrees(math.atan2(dy, dx))
    ax.plot([p0[0], p1[0]], [p0[1], p1[1]], color="#2a2a2a", lw=0.7, zorder=6, solid_capstyle="round")
    n = max(5, int(dist / step))
    for i in range(n):
        t = (i + 0.5) / n
        if t < 0.06 or t > 0.94:
            continue
        cx = p0[0] + dx * t
        cy = p0[1] + dy * t
        if i % 2 == 0:
            w, h, turn = step * 0.62, step * 0.22, ang
        else:
            w, h, turn = step * 0.22, step * 0.48, ang + 90
        ax.add_patch(Ellipse((cx, cy), w, h, angle=turn, fc="#f7f7f7", ec=INK, lw=0.45, zorder=7))


class XShift:
    """Сдвигает рисунок по X, не трогая подписи и размеры листа."""

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


def eye_mark(ax, x, y, r=0.09, z=8):
    ax.add_patch(Circle((x, y), r, fc="white", ec=INK, lw=0.75, zorder=z))
    ax.add_patch(Circle((x, y), r * 0.38, fc=INK, zorder=z + 1))


def block_wall(ax, x, y, w, h, z=4):
    """Сплошная стена одного блока. Стойки только по углам."""
    rect(ax, x, y, w, h, fc=BLOCK, ec=INK, lw=1.05, zorder=z)
    rect(ax, x - 0.02, y + h - 0.07, w + 0.04, 0.09, fc="#e7dfd0", ec=INK, lw=0.3, zorder=z + 1)
    rect(ax, x, y, w, 0.12, fc="#d9d0be", ec=INK, lw=0.35, zorder=z + 1)
    rect(ax, x, y, 0.07, h, fc="#cfc6b4", ec=INK, lw=0.3, zorder=z + 1)
    rect(ax, x + w - 0.07, y, 0.07, h, fc="#cfc6b4", ec=INK, lw=0.3, zorder=z + 1)
    if w < 5:
        ww, wh = min(1.15, w * 0.38), h * 0.24
        rect(ax, x + (w - ww) / 2, y + h * 0.52, ww, wh, fc=GLASS, ec=INK, lw=0.45, zorder=z + 2)
        return
    rect(ax, x + 0.28, y + 0.12, 0.78, h * 0.52, fc="#efe8da", ec=INK, lw=0.45, zorder=z + 2)
    left, right, gap, n = x + 1.55, x + w - 0.4, 0.28, 3
    ww = (right - left - gap * (n - 1)) / n
    gy, wh = y + h * 0.58, h * 0.18
    for i in range(n):
        rect(ax, left + i * (ww + gap), gy, ww, wh, fc=GLASS, ec=INK, lw=0.4, zorder=z + 2)


def draw_tracks_plan(ax, x0, x1):
    for axis in AXES_Y:
        sleeper_y = axis - SLEEPER_L / 2
        x = x0 + 0.40
        while x < x1 - 0.2:
            rect(
                ax, x - SLEEPER_W / 2, sleeper_y, SLEEPER_W, SLEEPER_L,
                fc="#ddd6ca", ec="#c9c1b4", lw=0.25, zorder=1,
            )
            x += 0.90
        for rail in rails_of(axis):
            ax.plot([x0, x1], [rail, rail], color=RAIL, lw=2.0, zorder=2, solid_capstyle="butt")
            ax.plot([x0, x1], [rail, rail], color="#9aa3aa", lw=0.55, zorder=3, solid_capstyle="butt")


def draw_tracks_side(ax, x0, x1):
    x = x0 + 0.3
    while x < x1:
        rect(ax, x, 0.0, 0.18, 0.16, fc="#ddd6ca", ec="#c9c1b4", lw=0.2, zorder=1)
        x += 1.0
    rect(ax, x0, 0.16, x1 - x0, 0.05, fc="#8d969e", ec="none", zorder=2)
    rect(ax, x0, RAIL_TOP - 0.06, x1 - x0, 0.06, fc=RAIL, ec=INK, lw=0.35, zorder=2)


def draw_crane_plan(ax, transport=False):
    ax.add_patch(FancyBboxPatch(
        (-3.55, -1.18), 8.55, 2.36,
        boxstyle="round,pad=0.02,rounding_size=0.14",
        fc="#d7dee4", ec=INK, lw=0.95, zorder=3,
    ))
    rect(ax, -3.35, -0.38, 5.4, 0.14, fc="#8e99a2", ec=INK, lw=0.3, zorder=3)
    rect(ax, -3.35, 0.24, 5.4, 0.14, fc="#8e99a2", ec=INK, lw=0.3, zorder=3)
    rect(ax, -3.7, -1.22, 0.2, 2.44, fc=STEEL_DK, ec=INK, lw=0.5, zorder=3)
    for wx in (3.25, -0.2, -1.55):
        tire_plan(ax, wx, 1.12)
        tire_plan(ax, wx, -1.44)

    ax.add_patch(FancyBboxPatch(
        (2.55, -1.08), 2.45, 2.16,
        boxstyle="round,pad=0.01,rounding_size=0.1",
        fc=CAB, ec=INK, lw=0.9, zorder=5,
    ))
    rect(ax, 4.72, -0.82, 0.22, 1.64, fc=GLASS, ec=INK, lw=0.35, zorder=6)
    rect(ax, 2.78, 0.55, 1.5, 0.28, fc="#1c2a34", ec=GLASS, lw=0.3, zorder=6)
    rect(ax, 2.78, -0.83, 1.5, 0.28, fc="#1c2a34", ec=GLASS, lw=0.3, zorder=6)
    if not transport:
        label(ax, 3.7, 0.0, "кабина", size=7, color="white")

    if not transport:
        pads = ((1.35, 2.15), (1.35, -2.85), (-2.15, 2.15), (-2.15, -2.85))
        roots = ((1.35, 0.95), (1.35, -0.95), (-0.85, 0.95), (-0.85, -0.95))
        for (px, py), (sx, sy) in zip(pads, roots):
            ex, ey = px + 0.38, py + 0.28
            ax.add_patch(Polygon(boom_polygon(sx, sy, ex, ey, 0.26, 0.2), closed=True, fc="#4c565e", ec=INK, lw=0.55, zorder=4))
            ax.add_patch(FancyBboxPatch(
                (px, py), 0.76, 0.56, boxstyle="round,pad=0.01,rounding_size=0.04",
                fc=PAD, ec=INK, lw=0.65, zorder=5,
            ))
            rect(ax, px + 0.12, py + 0.1, 0.52, 0.36, fc="#3a4146", ec=INK, lw=0.3, zorder=6)

    ax.add_patch(Circle((0, 0), 1.05, fc="#d5dbdf", ec=INK, lw=0.8, zorder=5))
    ax.add_patch(FancyBboxPatch(
        (-1.85, -0.72), 0.95, 1.44, boxstyle="round,pad=0.01,rounding_size=0.06",
        fc=COUNTER, ec=INK, lw=0.7, zorder=6,
    ))
    ax.add_patch(FancyBboxPatch(
        (-0.85, -0.62), 1.7, 1.24, boxstyle="round,pad=0.01,rounding_size=0.06",
        fc="#eef1f3", ec=INK, lw=0.75, zorder=6,
    ))
    ax.add_patch(FancyBboxPatch(
        (0.15, 0.28), 0.85, 0.42, boxstyle="round,pad=0.01,rounding_size=0.05",
        fc=CAB, ec=INK, lw=0.45, zorder=7,
    ))
    ax.add_patch(Circle((0, 0), 0.1, fc=INK, zorder=8))
    ax.plot([-0.28, 0.28], [0, 0], color="white", lw=0.7, zorder=9)
    ax.plot([0, 0], [-0.28, 0.28], color="white", lw=0.7, zorder=9)
    if transport:
        # Стрела уложена вдоль шасси, над кабиной, в транспортное положение.
        ax.add_patch(Polygon(
            boom_polygon(0.55, 0.0, 4.55, 0.0, 0.36, 0.22),
            closed=True, fc="#e7e1d4", ec=BOOM_EDGE, lw=0.6, zorder=7,
        ))
        label(ax, 2.4, 1.85, "стрела собрана", size=7)
        label(ax, 3.7, -1.7, "кабина", size=7)
        return
    for a, b, w0, w1, color in (
        (0.05, 0.42, 0.42, 0.34, "#d9d3c4"),
        (0.38, 0.72, 0.32, 0.26, "#e7e1d4"),
        (0.68, 1.0, 0.24, 0.18, "#f4f0e6"),
    ):
        p0 = _along((0.15, 0.0), (1.85, 0.0), a)
        p1 = _along((0.15, 0.0), (1.85, 0.0), b)
        ax.add_patch(Polygon(boom_polygon(*p0, *p1, w0, w1), closed=True, fc=color, ec=BOOM_EDGE, lw=0.6, zorder=7))
    label(ax, 0.15, 3.35, "стрела поднята", size=6.5)


def draw_crane_side(ax):
    rect(ax, -3.45, 0.78, 8.15, 0.28, fc="#c5ced6", ec=INK, lw=0.7, zorder=3)
    rect(ax, -3.55, 0.68, 0.18, 0.48, fc=STEEL_DK, ec=INK, lw=0.35, zorder=3)
    for cx, dual in ((3.85, False), (-0.15, True), (-1.5, True)):
        wheel_side(ax, cx, 0.46, 0.42, dual=dual)
    rect(ax, 1.55, 0.08, 0.12, 0.78, fc="#4e585f", ec=INK, lw=0.35, zorder=3)
    rect(ax, 1.28, 0.0, 0.62, 0.1, fc=PAD, ec=INK, lw=0.35, zorder=3)

    ax.add_patch(Polygon(
        [(2.55, 1.05), (2.55, 2.35), (2.72, 2.62), (4.05, 2.55),
         (4.35, 2.42), (4.92, 1.55), (5.0, 1.35), (5.0, 1.02)],
        closed=True, fc=CAB, ec=INK, lw=0.85, zorder=4,
    ))
    ax.add_patch(Polygon(
        [(4.15, 2.42), (4.38, 2.28), (4.85, 1.58), (4.52, 1.82)],
        closed=True, fc=GLASS, ec=INK, lw=0.35, zorder=5,
    ))
    rect(ax, 2.78, 1.35, 1.05, 0.78, fc="#162430", ec=GLASS, lw=0.3, zorder=5)
    label(ax, 3.55, 2.95, "кабина", size=6.5)

    rect(ax, -2.15, 1.15, 1.7, 1.25, fc="#9aa3ab", ec=INK, lw=0.7, zorder=4)
    for i in range(3):
        ax.plot([-2.0, -0.6], [1.38 + i * 0.28, 1.38 + i * 0.28], color="#6d767e", lw=0.45, zorder=5)
    ax.add_patch(FancyBboxPatch(
        (-0.35, 1.2), 1.35, 1.15, boxstyle="round,pad=0.02,rounding_size=0.08",
        fc=CAB, ec=INK, lw=0.7, zorder=5,
    ))
    rect(ax, 0.05, 1.7, 0.7, 0.4, fc=GLASS, ec=INK, lw=0.3, zorder=6)
    ax.add_patch(Circle((0.55, 2.15), 0.1, fc="#222", ec=INK, lw=0.35, zorder=6))
    box_boom(ax, (0.55, 2.15), (1.25, 4.65), 0.42, 0.22, z=4)
    ax.add_patch(Circle((1.25, 4.65), 0.12, fc="#efeae0", ec=INK, lw=0.5, zorder=6))
    ax.plot([1.25, 1.45], [4.5, 3.55], color=INK, lw=0.7, zorder=5)
    ax.add_patch(Wedge((1.45, 3.42), 0.16, 200, 340, width=0.045, fc=INK, zorder=6))
    ax.plot([0, 0], [0, 0.55], color=INK, lw=0.7, zorder=4)
    ax.plot([-0.12, 0.12], [0.08, 0.08], color=INK, lw=0.7, zorder=4)
    label(ax, -0.05, -0.28, "центр\nвращения", size=6.5)


def track_plan(ax, x, y, length, width):
    ax.add_patch(FancyBboxPatch(
        (x, y), length, width,
        boxstyle=f"round,pad=0,rounding_size={width / 2}",
        fc="#242424", ec=INK, lw=0.7, zorder=5,
    ))
    cy = y + width / 2
    ax.add_patch(Circle((x + 0.32, cy), width * 0.30, fc="#3a3a3a", ec="#111", lw=0.4, zorder=6))
    ax.add_patch(Circle((x + length - 0.32, cy), width * 0.34, fc="#4a4a4a", ec=INK, lw=0.45, zorder=6))
    ax.add_patch(Circle((x + length - 0.32, cy), width * 0.12, fc="#ddd", ec=INK, lw=0.3, zorder=7))
    step = 0.28
    gx = x + 0.15
    while gx < x + length - 0.12:
        ax.plot([gx, gx], [y + 0.05, y + width - 0.05], color="#6e6e6e", lw=0.4, zorder=6)
        gx += step


def draw_excavator_plan(ax):
    rear, length = 7.55, 4.65
    # Гусеницы в промежутке между шпалами двух путей.
    inner = TRACK_GAP / 2
    track_plan(ax, rear, -(inner + SHOE), length, SHOE)
    track_plan(ax, rear, inner, length, SHOE)
    ax.add_patch(FancyBboxPatch(
        (8.05, -0.72), 3.45, 1.44,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        fc="#b7c0c8", ec=INK, lw=0.75, zorder=6,
    ))
    ax.add_patch(FancyBboxPatch(
        (7.72, -0.52), 0.85, 1.04,
        boxstyle="round,pad=0.01,rounding_size=0.4",
        fc="#6e767c", ec=INK, lw=0.7, zorder=7,
    ))
    for i in range(3):
        ax.plot([7.88, 8.42], [-0.32 + i * 0.28, -0.32 + i * 0.28], color="#4e565c", lw=0.45, zorder=8)
    ax.add_patch(FancyBboxPatch(
        (8.4, -0.62), 2.7, 1.24,
        boxstyle="round,pad=0.02,rounding_size=0.1",
        fc="#d5dbe0", ec=INK, lw=0.8, zorder=7,
    ))
    ax.add_patch(Circle((9.45, 0.18), 0.5, fc="#e7ebef", ec=INK, lw=0.55, zorder=7))
    ax.add_patch(Circle((9.45, 0.18), 0.07, fc=INK, zorder=8))
    for k in range(3):
        ax.plot([8.55, 9.15], [-0.62 + k * 0.22, -0.62 + k * 0.22], color="#9aa3aa", lw=0.35, zorder=8)
    ax.add_patch(FancyBboxPatch(
        (9.55, 0.02), 1.45, 0.58,
        boxstyle="round,pad=0.01,rounding_size=0.08",
        fc=CAB, ec=INK, lw=0.65, zorder=8,
    ))
    rect(ax, 10.65, 0.12, 0.22, 0.36, fc=GLASS, ec=INK, lw=0.3, zorder=9)
    rect(ax, 9.75, 0.38, 0.7, 0.14, fc="#1c2a34", ec=GLASS, lw=0.25, zorder=9)
    ax.add_patch(Polygon(boom_polygon(10.85, 0.0, 12.15, 0.0, 0.38, 0.28), closed=True, fc=BOOM, ec=BOOM_EDGE, lw=0.6, zorder=8))
    ax.add_patch(Polygon(boom_polygon(12.05, 0.0, 12.45, 0.0, 0.26, 0.2), closed=True, fc="#d7d1c4", ec=BOOM_EDGE, lw=0.55, zorder=8))
    ax.add_patch(Polygon(
        [(12.35, -0.42), (12.95, -0.32), (12.85, 0.32), (12.35, 0.42)],
        closed=True, fc=STEEL_DK, ec=INK, lw=0.6, zorder=8,
    ))
    eye_mark(ax, 12.5, 0.0, r=0.1)
    label(ax, 9.7, -1.85, "экскаватор", size=7)


def sprocket(ax, cx, cy, r, z=6):
    ax.add_patch(Circle((cx, cy), r, fc="#333", ec=INK, lw=0.55, zorder=z))
    for i in range(12):
        a = math.radians(i * 30)
        ax.plot(
            [cx + r * 0.72 * math.cos(a), cx + (r + 0.07) * math.cos(a)],
            [cy + r * 0.72 * math.sin(a), cy + (r + 0.07) * math.sin(a)],
            color=INK, lw=0.7, zorder=z + 1,
        )
    ax.add_patch(Circle((cx, cy), r * 0.38, fc="#e6e6e6", ec=INK, lw=0.35, zorder=z + 2))


def draw_excavator_side(ax):
    x, length, h = 7.55, 4.6, 0.95
    y = 0.05
    ax.add_patch(FancyBboxPatch(
        (x, y), length, h,
        boxstyle=f"round,pad=0,rounding_size={h / 2}",
        fc="#2a2a2a", ec=INK, lw=0.75, zorder=4,
    ))
    gx = x + 0.22
    while gx < x + length - 0.15:
        ax.plot([gx, gx], [y - 0.02, y + 0.1], color="#111", lw=0.6, zorder=5)
        gx += 0.24
    sprocket(ax, 8.15, 0.52, 0.38)
    ax.add_patch(Circle((11.7, 0.52), 0.34, fc="#3a3a3a", ec=INK, lw=0.55, zorder=6))
    ax.add_patch(Circle((11.7, 0.52), 0.12, fc="#ddd", ec=INK, lw=0.3, zorder=7))
    for cx in (8.95, 9.7, 10.45, 11.15):
        ax.add_patch(Circle((cx, 0.38), 0.16, fc="#1c1c1c", ec=INK, lw=0.4, zorder=6))
        ax.add_patch(Circle((cx, 0.38), 0.05, fc="#bbb", zorder=7))
    ax.add_patch(Circle((9.9, 0.82), 0.1, fc="#444", ec=INK, lw=0.3, zorder=6))

    rect(ax, 7.85, 1.05, 3.55, 0.28, fc="#8d98a2", ec=INK, lw=0.55, zorder=4)
    rect(ax, 7.9, 1.28, 0.85, 1.25, fc="#6e767c", ec=INK, lw=0.6, zorder=4)
    for i in range(3):
        ax.plot([8.02, 8.62], [1.5 + i * 0.28, 1.5 + i * 0.28], color="#4a5258", lw=0.4, zorder=5)
    ax.add_patch(FancyBboxPatch(
        (8.65, 1.22), 2.35, 0.95,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        fc="#d5dbe0", ec=INK, lw=0.7, zorder=4,
    ))
    for k in range(3):
        ax.plot([8.85, 10.7], [1.4 + k * 0.22, 1.4 + k * 0.22], color="#9aa3aa", lw=0.35, zorder=5)
    ax.add_patch(Polygon(
        [(9.45, 2.05), (9.5, 3.05), (10.85, 3.2), (11.25, 2.55), (11.1, 2.05)],
        closed=True, fc=CAB, ec=INK, lw=0.75, zorder=5,
    ))
    ax.add_patch(Polygon(
        [(10.55, 2.85), (11.05, 2.35), (11.15, 2.15), (10.7, 2.6)],
        closed=True, fc=GLASS, ec=INK, lw=0.35, zorder=6,
    ))
    rect(ax, 9.7, 2.25, 0.7, 0.55, fc="#162430", ec=GLASS, lw=0.3, zorder=6)

    boom_root = (10.55, 2.2)
    boom_tip = (12.05, 3.32)
    stick_tip = (12.22, 1.95)
    box_boom(ax, boom_root, boom_tip, 0.42, 0.3, z=4)
    box_boom(ax, boom_tip, stick_tip, 0.32, 0.24, z=5, color="#d9d3c4")
    cylinder(ax, (9.15, 1.85), _along(boom_root, boom_tip, 0.42), z=3)
    cylinder(ax, _along(boom_root, boom_tip, 0.72), _along(boom_tip, stick_tip, 0.28), z=4)
    ax.add_patch(Circle(boom_root, 0.09, fc="#222", ec=INK, lw=0.35, zorder=7))
    ax.add_patch(Circle(boom_tip, 0.08, fc="#222", ec=INK, lw=0.35, zorder=7))

    ax.add_patch(Polygon(
        [(12.18, 1.92), (11.68, 1.58), (11.82, 1.18), (12.42, 1.02),
         (12.58, 1.32), (12.46, 1.58), (12.22, 1.74)],
        closed=True, fc=STEEL_DK, ec=INK, lw=0.7, zorder=6,
    ))
    ax.add_patch(Polygon(
        [(12.18, 1.92), (12.22, 1.74), (12.46, 1.58), (12.32, 1.78)],
        closed=True, fc="#5c656e", ec=INK, lw=0.4, zorder=6,
    ))
    for tx in (11.98, 12.14, 12.30, 12.44):
        ax.plot([tx, tx + 0.03], [1.02, 0.74], color=INK, lw=0.85, zorder=7)
    eye_mark(ax, EYE_SIDE[0], EYE_SIDE[1], r=0.09)
    label(ax, 12.9, 2.15, "рым", size=7)
    ax.plot([12.75, EYE_SIDE[0] + 0.04], [2.02, EYE_SIDE[1] + 0.06], color=INK, lw=0.45, zorder=8)
    label(ax, 13.2, 0.7, "зубья", size=6.5)


def branch_len():
    """Длина одной ветви: в плане до точки на поясе и по высоте до рыма."""
    dx = FACE - EYE_X
    dy = HITCH
    dz = EYE_SIDE[1] - HITCH_Z
    return math.sqrt(dx * dx + dy * dy + dz * dz)


def draw_block_at(ax, x, y0, text, dashed=False):
    kw = dict(fc=BLOCK, ec=INK, lw=1.1, zorder=4)
    if dashed:
        kw.update(fc="none", lw=0.9, ls=(0, (5, 2.2)))
    rect(ax, x, y0, ALONG, ACROSS, **kw)
    if not dashed:
        for cy in (-HITCH, HITCH):
            eye_mark(ax, x, y0 + ACROSS / 2 + cy, r=0.11)
        label(ax, x + ALONG / 2, y0 + ACROSS / 2 + 1.15, text, size=8, bold=True)


def draw_plan(ax):
    style_ax(ax, (-2.8, 19.4), (-7.3, 6.9))
    ax.add_patch(Rectangle(
        (-0.35, -4.85), 18.7, 9.7, fc=STONE, ec="#e4dfd4", lw=0.4, hatch="..", zorder=0,
    ))
    draw_tracks_plan(ax, RAIL0, RAIL1)
    ax.plot([RAIL0, RAIL0], [-4.6, 4.7], color=INK, lw=0.95, zorder=3)
    label(ax, 0.2, 5.05, "торц, сюда к погрузке", size=8, bold=True, ha="left")

    draw_block_at(ax, FACE, -ACROSS / 2, "тянут этот")
    for x in (12.0, 15.0):
        draw_block_at(ax, x, -ACROSS / 2, "", dashed=True)
    label(ax, 15.0, 0.55, "ещё стоят", size=7.5)

    machine = XShift(ax, EX_SHIFT)
    draw_excavator_plan(machine)
    for y in (-HITCH, HITCH):
        draw_chain(ax, (EYE_X, 0.0), (FACE, y), step=0.34)
    label(ax, 7.5, 1.55, "2СЦ", size=8, bold=True)

    ax.annotate(
        "", xy=(1.15, -3.85), xytext=(4.5, -3.85),
        arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.05), zorder=6,
    )
    label(ax, 2.85, -4.15, "назад по междупутью", size=7)
    ax.annotate(
        "", xy=(EYE_X + 0.35, -4.85), xytext=(FACE - 0.25, -4.85),
        arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.15), zorder=6,
    )
    label(ax, 7.5, -4.55, "сначала рукоять 3 м, на себя", size=7.5)
    label(ax, 3.2, 4.55, "гусеницы между шпалами", size=7.5)
    label(ax, 2.3, -5.2, "на цепи не стоять", size=7.5)

    vdim(ax, -MACHINE_W / 2, MACHINE_W / 2, -1.7, "2,80", x_from=-1.15, size=7)
    north = AXES_Y[1]
    vdim(ax, north - SLEEPER_L / 2, north + SLEEPER_L / 2, 16.7, "2,70", x_from=16.0, size=7)
    vdim(ax, AXES_Y[0], AXES_Y[1], 18.15, "5,50", x_from=16.9, size=7.5)
    hdim(ax, EYE_X, FACE, -5.85, "3,0 рукоять", y_from=-4.5, size=7)
    hdim(ax, RAIL0, FACE, -6.65, "9,0 до торца блока", y_from=-4.5, size=7)
    hdim(ax, 0, 18, 5.45, "решётка 18 м", y_from=4.5, size=7.5)
    label(ax, 8.2, 6.45, "План. Два пути, машина между ними, тяга на себя", size=11, bold=True)


def draw_side(ax):
    """Разрез по междупутью: под машиной рельса нет, блок стоит на путях."""
    style_ax(ax, (-1.4, 16.6), (-2.45, 5.55))
    ax.plot([-0.8, 16.2], [0, 0], color=INK, lw=1.0, zorder=2)
    ax.add_patch(Rectangle((-0.5, -0.55), 16.9, 0.55, fc=STONE, ec="none", hatch="..", zorder=0))
    draw_tracks_side(ax, FACE, RAIL1)
    ax.plot([RAIL0, RAIL0], [0, 4.15], color=INK, lw=0.9, zorder=3)
    label(ax, 0.12, 4.45, "торц", size=8, bold=True, ha="left")

    work = XShift(ax, SIDE_SHIFT)
    draw_excavator_side(work)
    label(ax, 3.2, -0.85, "грунт между путями", size=7)
    block_wall(ax, FACE, RAIL_TOP, ALONG, HEIGHT)
    eye_mark(ax, FACE, HITCH_Z, r=0.09)
    label(ax, FACE + 1.5, RAIL_TOP + 1.25, "блок", size=8, bold=True)
    eye = (EYE_X, EYE_SIDE[1])
    hitch = (FACE, HITCH_Z)
    draw_chain(ax, eye, hitch, step=0.26)
    label(ax, 7.4, 2.55, "ветвь " + comma(branch_len(), 1) + " м", size=8)
    label(ax, 7.5, 3.55, "не стоять", size=7.5)
    hdim(ax, EYE_X, FACE, -1.45, "3,0", y_from=0, size=7)
    hdim(ax, 0, FACE, -2.15, "9,0", y_from=0, size=7)
    label(ax, 6.4, 5.15, "Вид сбоку. Машина между путями, тяга на себя", size=11, bold=True)


def draw_face(ax):
    """Торец 9 м, обращённый к крану. Точки строповки на нижнем поясе."""
    style_ax(ax, (-1.3, 10.4), (-1.55, 4.55))
    block_wall(ax, 0, 0, ACROSS, HEIGHT)
    mid = ACROSS / 2
    for x in (mid - HITCH, mid + HITCH):
        eye_mark(ax, x, 0.34, r=0.11)
    for x in (0.18, ACROSS - 0.18):
        ax.add_patch(Circle((x, HEIGHT - 0.2), 0.09, fc="white", ec=INK, lw=0.55, zorder=6))
        ax.plot([x - 0.11, x + 0.11], [HEIGHT - 0.31, HEIGHT - 0.09], color=INK, lw=0.7, zorder=7)
        ax.plot([x - 0.11, x + 0.11], [HEIGHT - 0.09, HEIGHT - 0.31], color=INK, lw=0.7, zorder=7)
    hdim(ax, mid - HITCH, mid + HITCH, -0.9, comma(2 * HITCH, 1), y_from=0.34, size=7.5)
    label(ax, mid, 0.72, "нижний пояс", size=7.5)
    label(ax, mid, 4.15, "Торец к экскаватору", size=11, bold=True)
    label(ax, mid, 3.4, "верхние петли этим стропом не занимают", size=7)


def main():
    fig = plt.figure(figsize=(16.54, 11.69), dpi=160, facecolor="white")
    fig.text(
        0.04, 0.972, "Схема передвижки блока экскаватором",
        ha="left", va="top", fontsize=16, fontproperties=BOLD, color=INK,
    )
    fig.text(
        0.04, 0.942,
        "Место погрузки: два пути. Блок 3 × 9 × 2,5 м, масса 8,7 т. Машина между путями, тянет только на себя. Размеры в метрах.",
        ha="left", va="top", fontsize=9, fontproperties=SANS, color=INK,
    )

    draw_plan(fig.add_axes([0.012, 0.48, 0.70, 0.44]))
    draw_side(fig.add_axes([0.012, 0.04, 0.62, 0.42]))
    draw_face(fig.add_axes([0.64, 0.04, 0.34, 0.36]))

    length = branch_len()
    # Горизонтальную силу делят две ветви. Наклон увеличивает натяжение.
    tension = (4.4 / 2.0) * (length / (FACE - EYE_X))
    notes = (
        "1. Место погрузки, два пути, колея\n"
        "    1520 мм, шпала Ш1 — 2,70 м.\n"
        "    Экскаватор около 20 т, обратная\n"
        "    лопата. Башмак 0,60 м, просвет\n"
        "    между гусеницами 1,60 м, по\n"
        "    гусеницам 2,80 м.\n"
        "2. Машина встаёт между путями, по оси\n"
        "    блока. Между осями путей не меньше\n"
        "    5,50 м: 2,70 + 2,80. На схеме так\n"
        "    и взято. Гусеница к торцу шпалы\n"
        "    впритык, на шпалу не заезжает.\n"
        "    До внутреннего рельса остаётся\n"
        "    0,59 м. При осях 3,70 м просвет\n"
        "    между шпалами 1,00 м — туда\n"
        "    машина не проходит.\n"
        "3. Блоки по одному, с ближнего к торцу\n"
        "    погрузки. Машина заезжает между\n"
        "    путями к его торцу. На листе этот\n"
        "    торец в 9 м, рым в 3 м от него.\n"
        "4. Сначала рукоять на себя, около 3 м.\n"
        "    Дальше машина сдаёт назад по\n"
        "    междупутью, блок идёт за ковшом\n"
        "    по головкам двух путей. Цепь не\n"
        "    удлиняют. Ход ковша сверяют\n"
        "    с паспортом. По грунту блок не тащат.\n"
        "5. До торца, м:  3   6   9   12   15\n"
        "    рукоятью, м: 3   3   3    3    3\n"
        "    назад, м:    0   3   6    9   12\n"
        "    Блок, который уже у торца, не тянут.\n"
        "6. Строп 2СЦ, цепь 10 мм класса 8,\n"
        "    на ветвь не меньше 3,15 т. Две точки\n"
        "    на нижнем поясе торца, по центру,\n"
        "    между ними 1,2 м. На рым ковша.\n"
        "    Рым по паспорту не меньше 4,6 тс.\n"
        "    За зубья не цепляют. Верхние петли\n"
        "    оставляют крану.\n"
        "7. На листе ветвь " + comma(length, 1) + " м, и на ближнем,\n"
        "    и на дальнем блоке она такая же:\n"
        "    машина подъезжает, а не достаёт\n"
        "    с торца длинной цепью.\n"
        "8. Сила от длины цепи не растёт.\n"
        "    8,7 т × 0,30 = 2,6 тс, при 0,50\n"
        "    будет 4,4 тс на блок. С наклоном\n"
        "    ветви на листе на ветвь до "
        + comma(tension, 1) + " тс.\n"
        "9. При обрыве цепь бьёт на свою длину.\n"
        "    Люди не ближе " + comma(length, 1) + " м от линии\n"
        "    цепи и не стоят между машиной\n"
        "    и блоком."
    )
    fig.text(
        0.70, 0.90, notes, ha="left", va="top", fontsize=7.15,
        fontproperties=SANS, color=INK, linespacing=1.14,
    )
    fig.add_artist(Rectangle(
        (0.012, 0.015), 0.976, 0.97, transform=fig.transFigure,
        fill=False, edgecolor=INK, lw=1.15,
    ))
    fig.savefig("/workspace/ppr/skhema-ekskavator.png", dpi=160, facecolor="white")
    fig.savefig("/workspace/ppr/skhema-ekskavator.pdf", facecolor="white")
    rail_clear = AXIS_GAP / 2 - GAUGE / 2 - MACHINE_W / 2
    print(
        "axes", AXIS_GAP,
        "machine", MACHINE_W,
        "branch", round(branch_len(), 2),
        "rail_clear", round(rail_clear, 2),
        "shift", round(EX_SHIFT, 2),
    )


if __name__ == "__main__":
    main()
