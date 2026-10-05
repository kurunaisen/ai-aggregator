#!/usr/bin/env python3
"""ППР: установка шести блоков на новую площадку."""

import math
import sys

import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, Polygon, Rectangle, Wedge
from matplotlib.transforms import Affine2D
from matplotlib.font_manager import FontProperties

sys.path.insert(0, "/workspace/ppr")
from draw_crane_scheme import block_wall, fender, telescopic_boom, wheel_side  # noqa: E402

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

# Рельсы 0…18 м. Кран сбоку площадки: стрела вдоль 9 м блока.
# Колея КамАЗ-65115 уже шпалы, на путь кран не встаёт.
RAIL0 = 0.0
RAIL1 = 18.0
TRACK_FRONT = 2.05
TRACK_REAR = 1.89
CRANE_WIDTH = 2.50
SLEEPER_L = 2.70
CAB_REACH = 5.0
GAP_CAB = 0.50
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
# Места 1…6 вдоль путей. Посадка показана на месте 6; к остальным кран переезжает сбоку.
PLACES = ((1, 15.0), (2, 12.0), (3, 9.0), (4, 6.0), (5, 3.0), (6, 0.0))
SET_X = 0.0
HOOK_X = SET_X + BLOCK_L / 2
NEAR_Y = -BLOCK_W / 2
# Перед кабины на торце шпал. Колёса позади переда, на шпалу не попадают.
CAB_Y = NEAR_Y - GAP_CAB
CENTER_Y = CAB_Y - CAB_REACH
OUTREACH = HOOK_X * 0 + (0.0 - CENTER_Y)


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


class Pose:
    """Поворот местных координат крана и перенос центра вращения."""

    def __init__(self, ax, cx, cy, deg):
        self._ax = ax
        self._m = Affine2D().rotate_deg(deg).translate(cx, cy)
        self._transform = self._m + ax.transData

    def _xy(self, x, y):
        return self._m.transform((x, y))

    def add_patch(self, patch, **kwargs):
        patch.set_transform(self._transform)
        return self._ax.add_patch(patch, **kwargs)

    def plot(self, *args, **kwargs):
        if args and hasattr(args[0], "__iter__") and not isinstance(args[0], str):
            pts = [self._xy(x, y) for x, y in zip(args[0], args[1])]
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            return self._ax.plot(xs, ys, *args[2:], **kwargs)
        return self._ax.plot(*args, **kwargs)

    def text(self, x, y, s, **kwargs):
        px, py = self._xy(x, y)
        return self._ax.text(px, py, s, **kwargs)

    def annotate(self, text, xy, xytext=None, **kwargs):
        xy = self._xy(*xy)
        if xytext is not None:
            xytext = self._xy(*xytext)
        return self._ax.annotate(text, xy=xy, xytext=xytext, **kwargs)

    def __getattr__(self, name):
        return getattr(self._ax, name)


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


def axle_tires(ax, x, track, dual=False):
    """Колея track — между серединами колёс. x — центр оси вдоль шасси."""
    half = track / 2
    if not dual:
        tire_plan(ax, x - 0.36, half - 0.15, w=0.72, h=0.30, z=5)
        tire_plan(ax, x - 0.36, -half - 0.15, w=0.72, h=0.30, z=5)
        return
    for sign in (1, -1):
        for dy in (-0.16, 0.16):
            tire_plan(ax, x - 0.34, sign * half + dy - 0.14, w=0.68, h=0.28, z=5)


def draw_crane_plan(ax, hook_x):
    """Кран в местных координатах: центр (0, 0), перед кабины x = 5, крюк на hook_x."""
    ax.add_patch(FancyBboxPatch(
        (-3.20, -1.25), 8.20, 2.50,
        boxstyle="round,pad=0.02,rounding_size=0.12",
        fc="#d7dee4", ec=INK, lw=0.9, zorder=4,
    ))
    axle_tires(ax, 3.55, TRACK_FRONT, dual=False)
    axle_tires(ax, -0.15, TRACK_REAR, dual=True)
    axle_tires(ax, -1.47, TRACK_REAR, dual=True)
    ax.add_patch(FancyBboxPatch(
        (2.55, -1.05), 2.45, 2.10,
        boxstyle="round,pad=0.01,rounding_size=0.1",
        fc=CAB, ec=INK, lw=0.85, zorder=6,
    ))
    rect(ax, 4.75, -0.72, 0.18, 1.44, fc=GLASS, ec=INK, lw=0.3, zorder=7)
    # Опорный контур 4,9 м вдоль шасси и 5,8 м поперёк.
    pads = ((1.70, 2.62), (1.70, -3.17), (-3.20, 2.62), (-3.20, -3.17))
    roots = ((1.85, 1.05), (1.85, -1.05), (-2.55, 1.05), (-2.55, -1.05))
    for (px, py), (sx, sy) in zip(pads, roots):
        ax.add_patch(Polygon(
            boom_polygon(sx, sy, px + 0.35, py + 0.28, 0.22, 0.16),
            closed=True, fc="#4c565e", ec=INK, lw=0.45, zorder=5,
        ))
        rect(ax, px, py, 0.70, 0.55, fc=PAD, ec=INK, lw=0.5, zorder=6)
    ax.add_patch(Circle((0, 0), 0.95, fc="#e7ebef", ec=INK, lw=0.7, zorder=7))
    ax.add_patch(FancyBboxPatch(
        (-1.7, -0.62), 0.85, 1.24,
        boxstyle="round,pad=0.01,rounding_size=0.08",
        fc="#8b9298", ec=INK, lw=0.6, zorder=8,
    ))
    ax.add_patch(Circle((0, 0), 0.08, fc=INK, zorder=9))
    ax.plot([-0.22, 0.22], [0, 0], color="white", lw=0.6, zorder=9)
    ax.plot([0, 0], [-0.22, 0.22], color="white", lw=0.6, zorder=9)
    ax.add_patch(Polygon(
        boom_polygon(0.35, 0.0, hook_x - 0.25, 0.0, 0.36, 0.16),
        closed=True, fc="#cfc6b4", ec=INK, lw=0.7, zorder=8,
    ))
    ax.plot([0.55, hook_x - 0.35], [0.06, 0.06], color="#6a6256", lw=0.45, zorder=9)
    ax.add_patch(Circle((hook_x, 0.0), 0.16, fc=INK, ec=INK, lw=0.4, zorder=10))
    ax.add_patch(Circle((hook_x, 0.0), 0.06, fc="white", zorder=11))


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
    style_ax(ax, (-4.6, 22.2), (-16.2, 8.5))
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
    rect(ax, SET_X, NEAR_Y, BLOCK_L, BLOCK_W, fc=BLOCK, ec=INK, lw=1.15, zorder=5)
    for cx, cy in ((SET_X, NEAR_Y), (SET_X + BLOCK_L, NEAR_Y), (SET_X, 4.5), (SET_X + BLOCK_L, 4.5)):
        rect(ax, cx - 0.08, cy - 0.08, 0.16, 0.16, fc="#cfc6b4", ec=INK, lw=0.35, zorder=6)
    label(ax, HOOK_X + 0.85, 2.15, "6", size=12, bold=True)
    label(ax, 2.15, -1.85, "посадка", size=7, bold=True, ha="left")
    label(ax, 2.25, 1.55, "крюк", size=7, ha="left")

    # +90°: вперёд по местной оси x смотрит на север, вдоль блока.
    crane = Pose(ax, HOOK_X, CENTER_Y, 90)
    draw_crane_plan(crane, OUTREACH)
    ax.plot([HOOK_X - 0.7, HOOK_X + 0.7], [CENTER_Y, CENTER_Y], color=INK, lw=0.7, zorder=3)
    label(ax, 4.7, -11.7, "центр вращения", size=7, ha="left")
    label(ax, 8.4, -8.6, "кран сбоку,\nстрела вдоль блока", size=8)

    ax.annotate(
        "", xy=(16.8, 6.35), xytext=(1.5, 6.35),
        arrowprops=dict(arrowstyle="<->", color=INK, lw=1.0), zorder=6,
    )
    label(ax, 9.2, 6.85, "кран переезжает вдоль площадки к каждому месту", size=8)

    label(ax, 9.0, 7.65, "План. Стрела вдоль блока", size=12, bold=True)

    hdim(ax, SET_X, SET_X + BLOCK_L, 5.85, "3,0", y_from=4.5, size=7.5)
    hdim(ax, 0, 18, -14.35, "18,0", y_from=-4.5, size=8)
    hdim(ax, PAD_X0, PAD_X1, -15.15, "19,30", y_from=-PAD_Y, size=7.5)
    vdim(ax, CENTER_Y, 0.0, -3.15, "10,0", x_from=HOOK_X, size=8)
    vdim(ax, CENTER_Y, CAB_Y, -4.15, "5,0", x_from=HOOK_X, size=7.5)
    vdim(ax, CAB_Y, NEAR_Y, -0.55, "0,50", x_from=0.15, size=7)
    vdim(ax, NEAR_Y, 4.5, 19.35, "9,0", x_from=18, size=8)
    vdim(ax, -PAD_Y, PAD_Y, 20.7, "11,10", x_from=18.65, size=7.5)
    label(ax, 10.5, -1.85, "места 1–5 — так же, сбоку", size=7)


def block_side(ax, x, y, w, h):
    rect(ax, x, y, w, h, fc=BLOCK, ec=INK, lw=1.0, zorder=4)
    rect(ax, x, y + h - 0.08, w, 0.08, fc="#e7dfd0", ec=INK, lw=0.25, zorder=5)
    rect(ax, x, y, 0.07, h, fc="#cfc6b4", ec=INK, lw=0.25, zorder=5)
    rect(ax, x + w - 0.07, y, 0.07, h, fc="#cfc6b4", ec=INK, lw=0.25, zorder=5)
    ww, wh = 1.15, h * 0.24
    rect(ax, x + (w - ww) / 2, y + h * 0.52, ww, wh, fc=GLASS, ec=INK, lw=0.4, zorder=5)


def draw_crane_side(ax, tip_x):
    """Кран в местных координатах: перед кабины x = 5, крюк над tip_x."""
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
    tip = (tip_x, 8.35)
    telescopic_boom(ax, root, tip, 0.48, z=4)
    seat = _along(root, tip, 0.28)
    ax.plot([0.05, seat[0]], [1.55, seat[1]], color="#3c454c", lw=3.2, solid_capstyle="butt", zorder=3)
    ax.add_patch(Circle(root, 0.11, fc="#2a2a2a", ec=INK, lw=0.4, zorder=6))
    ax.add_patch(Circle(tip, 0.16, fc="#efeae0", ec=INK, lw=0.5, zorder=6))
    ax.add_patch(Circle((tip[0] + 0.02, tip[1] - 0.02), 0.06, fc=INK, zorder=7))


def draw_section(ax):
    """Поперечник поперёк путей: стрела вдоль 9 м блока."""
    style_ax(ax, (-14.6, 7.2), (-2.35, 10.4))
    ax.plot([-14.2, 6.8], [0, 0], color=INK, lw=1.0, zorder=2)
    rect(ax, -PAD_Y, 0.0, PAD_Y * 2, STONE_H, fc=STONE, ec="#ddd6c8", lw=0.4, hatch="..", zorder=1)
    for axis in AXES:
        rect(ax, axis - SLEEPER_L / 2, STONE_H, SLEEPER_L, 0.23, fc=SLEEPER, ec="#c9c1b4", lw=0.35, zorder=2)
        for sign in (-1, 1):
            ry = axis + sign * (GAUGE / 2)
            rect(ax, ry - 0.04, RAIL_TOP - 0.16, 0.08, 0.16, fc=RAIL, ec=INK, lw=0.3, zorder=3)

    crane = XShift(ax, CENTER_Y)
    draw_crane_side(crane, OUTREACH)

    top = RAIL_TOP + BLOCK_H
    ax.plot([-0.04, -0.04], [8.15, top + 0.55], color=INK, lw=0.85, zorder=5)
    ax.plot([0.04, 0.04], [8.15, top + 0.55], color=INK, lw=0.55, zorder=5)
    ax.add_patch(FancyBboxPatch(
        (-0.28, top + 0.38), 0.56, 0.26,
        boxstyle="round,pad=0.01,rounding_size=0.04",
        fc="#f4f4f4", ec=INK, lw=0.6, zorder=6,
    ))
    ax.add_patch(Wedge((0.0, top + 0.34), 0.16, 200, 340, width=0.045, fc=INK, ec=INK, zorder=7))

    block_wall(ax, NEAR_Y, RAIL_TOP, BLOCK_W, BLOCK_H)
    label(ax, -2.2, RAIL_TOP + 1.15, "блок", size=8, bold=True)
    label(ax, 0.85, top + 0.7, "крюк", size=7, ha="left")
    label(ax, CENTER_Y - 2.6, 2.7, "кран", size=8)
    ax.plot([CENTER_Y, CENTER_Y], [0.0, 0.38], color=INK, lw=0.7, zorder=4)
    label(ax, CENTER_Y, -2.05, "центр вращения", size=7)

    hdim(ax, CENTER_Y, 0.0, -1.55, "10,0", y_from=0, size=7.5)
    hdim(ax, CENTER_Y, CAB_Y, -0.7, "5,0", y_from=0, size=7)
    label(ax, (CAB_Y + NEAR_Y) / 2, 1.35, "0,50", size=7)
    vdim(ax, RAIL_TOP, top, 5.35, "2,5", x_from=4.5, size=7.5)
    label(ax, -6.5, 9.7, "Поперечник. Стрела вдоль блока", size=11, bold=True)


def main():
    fig = plt.figure(figsize=(16.54, 11.69), dpi=160, facecolor="white")
    fig.text(
        0.04, 0.972, "Схема установки блоков на новую площадку",
        ha="left", va="top", fontsize=16, fontproperties=BOLD, color=INK,
    )
    fig.text(
        0.04, 0.942,
        "Шесть блоков 3 × 9 × 2,5 м, масса каждого 8,7 т. Кран сбоку, стрела вдоль блока. Размеры в метрах.",
        ha="left", va="top", fontsize=9, fontproperties=SANS, color=INK,
    )
    draw_plan(fig.add_axes([0.012, 0.40, 0.976, 0.52]))
    draw_section(fig.add_axes([0.02, 0.04, 0.58, 0.34]))

    notes = (
        "1. Колея КамАЗ-65115: передние колёса\n"
        "    2,05 м, задние 1,89 м между серединами\n"
        "    двойных скатов. Ширина крана 2,50 м.\n"
        "    Шпала Ш1 — 2,70 м. Шпала длиннее\n"
        "    колеи: между колёсами она не встаёт.\n"
        "    Просвет между торцами шпал 1,00 м,\n"
        "    уже крана. На путь и в междупутье\n"
        "    кран не ставят.\n"
        "2. Кран стоит сбоку площадки, за торцами\n"
        "    шпал. Опоры полностью, на грунте\n"
        "    у бровки. Стрела только вперёд над\n"
        "    кабиной, вдоль блока: 9 м по вылету,\n"
        "    3 м поперёк стрелы.\n"
        "3. 5,0 м до переда кабины сверяют обмером.\n"
        "    Зазор кабины до ближней грани 0,50 м.\n"
        "    Середина блока — вылет 10,0 м, дальняя\n"
        "    грань 14,5 м. На крюке 9,1 т, момент\n"
        "    91 т·м. У КС-55713 момент 80 т·м.\n"
        "    На стреле 14 м при вылете 8 м ещё\n"
        "    около 9,9 т. Вылет 10 м этим грузом\n"
        "    паспорт не принимает.\n"
        "4. К каждому месту кран переезжает вдоль\n"
        "    площадки со собранной стрелой. На\n"
        "    посадке с стоянки не переезжает.\n"
        "    Блок опускают на головки. Строп 4СЦ\n"
        "    — по схеме строповки. Блоки вплотную.\n"
        "    В сборе модуль 18 × 9 м."
    )
    fig.text(
        0.61, 0.37, notes, ha="left", va="top", fontsize=7.6,
        fontproperties=SANS, color=INK, linespacing=1.22,
    )
    fig.add_artist(Rectangle(
        (0.012, 0.015), 0.976, 0.97, transform=fig.transFigure,
        fill=False, edgecolor=INK, lw=1.15,
    ))
    fig.savefig("/workspace/ppr/skhema-ustanovka.png", dpi=160, facecolor="white")
    fig.savefig("/workspace/ppr/skhema-ustanovka.pdf", facecolor="white")
    moment = 9.1 * OUTREACH
    print(
        "track", TRACK_FRONT, TRACK_REAR, "sleeper", SLEEPER_L,
        "gap", round(AXIS_STEP - SLEEPER_L, 2),
        "center_y", CENTER_Y, "cab_y", CAB_Y,
        "outreach", OUTREACH, "moment", round(moment, 1),
    )


if __name__ == "__main__":
    main()
