#!/usr/bin/env python3
"""ППР: установка шести блоков на новую площадку."""

import math
import sys

import matplotlib.pyplot as plt
from matplotlib.patches import Arc, Circle, FancyBboxPatch, Polygon, Rectangle, Wedge
from matplotlib.transforms import Affine2D
from matplotlib.font_manager import FontProperties

sys.path.insert(0, "/workspace/ppr")
from draw_crane_scheme import fender, telescopic_boom, wheel_side  # noqa: E402

SANS = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
BOLD = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

INK = "#1a1a1a"
STONE = "#e4efe0"
SLEEPER = "#cbb892"
RAIL = "#163a5f"
BLOCK = "#f6d36b"
BLOCK_EDGE = "#8a5a12"
CAB = "#1d3f5a"
CRANE = "#2f7eb0"
GLASS = "#d5e4ef"
PAD = "#3d4c57"
STEEL_DK = "#3e4850"
BOOM = "#f3e3a4"
BOOM_EDGE = "#6b5a32"
DECK = "#e08a28"
DECK_DK = "#8a4e12"
WOOD = "#e7d3a6"
WOOD_EDGE = "#b08958"

# Кран сбоку площадки, шасси перпендикулярно путям. Кабина от площадки.
# Посадка: стрела над задом, вдоль стороны 9 м, вылет 8,4 м.
# Подъём: стрела вправо, блок на шаланде той же стороной, вылет тот же.
RAIL0 = 0.0
RAIL1 = 18.0
TRACK_FRONT = 2.05
TRACK_REAR = 1.89
SLEEPER_L = 2.70
BLOCK_W = 9.0
BLOCK_L = 3.0
BLOCK_H = 2.5
OUTREACH = 8.4
NEAR = OUTREACH - BLOCK_W / 2
CENTER = (BLOCK_L / 2, -(NEAR + BLOCK_W / 2))
SET_X = 0.0
HOOK = (CENTER[0], 0.0)
PICK = (CENTER[0] + OUTREACH, CENTER[1])
DECK_W = 2.50
DECK_L = 13.6
DECK_TOP = 1.30
DECK_X0 = PICK[0] - BLOCK_W / 2
DECK_Y0 = PICK[1] - DECK_W / 2
AXIS_STEP = 3.70
GAUGE = 1.52
AXES = (-AXIS_STEP, 0.0, AXIS_STEP)
PAD_X0 = -0.65
PAD_X1 = 18.65
PAD_Y = 5.55
STONE_H = 0.25
RAIL_TOP = 0.68
# Опорный контур 5,1 × 6,1 м — между центрами тарелок.
OUT_LONG = 2.55
OUT_WIDE = 3.05


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


class MirrorX:
    """Отражает местный X относительно нуля и ставит этот нуль в cx. Y не трогает."""

    def __init__(self, ax, cx):
        self._ax = ax
        self._m = Affine2D().scale(-1, 1).translate(cx, 0)
        self._transform = self._m + ax.transData

    def _xy(self, x, y):
        return self._m.transform((x, y))

    def add_patch(self, patch, **kwargs):
        patch.set_transform(self._transform)
        return self._ax.add_patch(patch, **kwargs)

    def plot(self, *args, **kwargs):
        if args and hasattr(args[0], "__iter__") and not isinstance(args[0], str):
            pts = [self._xy(x, y) for x, y in zip(args[0], args[1])]
            return self._ax.plot([p[0] for p in pts], [p[1] for p in pts], *args[2:], **kwargs)
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


def _tire(ax, x, y, w=0.70, h=0.32, z=5):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.01,rounding_size=0.1",
        fc="#1a1a1a", ec=INK, lw=0.45, zorder=z,
    ))
    ax.add_patch(Circle((x + w / 2, y + h / 2), min(w, h) * 0.28, fc="#d8d8d8", ec=INK, lw=0.3, zorder=z + 1))


def draw_crane_plan(ax):
    """Местные оси: +X — кабина водителя, −X — зад. Стрела над задом."""
    ax.add_patch(FancyBboxPatch(
        (-3.45, -1.22), 8.45, 2.44,
        boxstyle="round,pad=0.02,rounding_size=0.16",
        fc="#c5d0d8", ec=INK, lw=1.0, zorder=4,
    ))
    rect(ax, -3.2, -0.38, 5.3, 0.14, fc="#8e99a2", ec=INK, lw=0.3, zorder=4)
    rect(ax, -3.2, 0.24, 5.3, 0.14, fc="#8e99a2", ec=INK, lw=0.3, zorder=4)
    rect(ax, -3.55, -1.22, 0.18, 2.44, fc=STEEL_DK, ec=INK, lw=0.45, zorder=4)
    for wx, dual in ((3.45, False), (-0.15, True), (-1.5, True)):
        if dual:
            _tire(ax, wx, 1.05, 0.62, 0.28)
            _tire(ax, wx, 1.32, 0.62, 0.28)
            _tire(ax, wx, -1.33, 0.62, 0.28)
            _tire(ax, wx, -1.60, 0.62, 0.28)
        else:
            _tire(ax, wx, 1.08, 0.78, 0.34)
            _tire(ax, wx, -1.42, 0.78, 0.34)

    ax.add_patch(FancyBboxPatch(
        (2.55, -1.15), 2.30, 2.30,
        boxstyle="round,pad=0.01,rounding_size=0.12",
        fc=CAB, ec=INK, lw=1.0, zorder=6,
    ))
    rect(ax, 4.62, -0.95, 0.22, 1.90, fc=GLASS, ec=INK, lw=0.4, zorder=7)
    rect(ax, 2.75, 0.62, 1.55, 0.32, fc="#163040", ec=GLASS, lw=0.35, zorder=7)
    rect(ax, 2.75, -0.94, 1.55, 0.32, fc="#163040", ec=GLASS, lw=0.35, zorder=7)
    ax.plot([3.55, 3.55], [-0.5, 0.5], color="#10202a", lw=0.5, zorder=7)
    for lamp_y in (0.95, -1.15):
        ax.add_patch(Circle((4.85, lamp_y), 0.09, fc="#f4f7f8", ec=INK, lw=0.3, zorder=8))
    for sign in (1, -1):
        ax.plot([4.25, 4.55], [sign * 1.02, sign * 1.48], color=INK, lw=0.7, zorder=8)
        rect(ax, 4.42, sign * 1.40, 0.36, 0.16, fc="#141414", ec=INK, lw=0.3, zorder=8)
    ax.text(3.7, 0.0, "КРАН", ha="center", va="center", color="white", fontsize=8, fontproperties=BOLD, zorder=8)

    for cx, cy in (
        (OUT_LONG, OUT_WIDE), (OUT_LONG, -OUT_WIDE),
        (-OUT_LONG, OUT_WIDE), (-OUT_LONG, -OUT_WIDE),
    ):
        sx = 1.05 if cx > 0 else -1.05
        sy = 1.0 if cy > 0 else -1.0
        ax.add_patch(Polygon(
            boom_polygon(sx, sy, cx, cy, 0.28, 0.18),
            closed=True, fc="#4c565e", ec=INK, lw=0.55, zorder=5,
        ))
        ax.add_patch(FancyBboxPatch(
            (cx - 0.32, cy - 0.32), 0.64, 0.64,
            boxstyle="round,pad=0.01,rounding_size=0.06",
            fc=PAD, ec=INK, lw=0.6, zorder=6,
        ))
        rect(ax, cx - 0.18, cy - 0.18, 0.36, 0.36, fc="#2c3338", ec=INK, lw=0.3, zorder=7)

    ax.add_patch(Circle((0, 0), 1.15, fc="#d5dbdf", ec=INK, lw=0.85, zorder=7))
    for ang in range(0, 360, 30):
        a = math.radians(ang)
        ax.add_patch(Circle((0.92 * math.cos(a), 0.92 * math.sin(a)), 0.035, fc="#222", zorder=8))
    ax.add_patch(FancyBboxPatch(
        (0.55, -0.72), 1.35, 1.44,
        boxstyle="round,pad=0.01,rounding_size=0.06",
        fc="#8b9298", ec=INK, lw=0.7, zorder=8,
    ))
    for i in range(4):
        ax.plot([0.7, 1.75], [-0.5 + i * 0.28, -0.5 + i * 0.28], color="#5e676e", lw=0.45, zorder=9)
    ax.add_patch(FancyBboxPatch(
        (-0.85, -0.7), 1.35, 1.4,
        boxstyle="round,pad=0.01,rounding_size=0.06",
        fc=CRANE, ec=INK, lw=0.75, zorder=8,
    ))
    ax.add_patch(FancyBboxPatch(
        (-0.55, 0.22), 0.85, 0.42,
        boxstyle="round,pad=0.01,rounding_size=0.05",
        fc=CAB, ec=INK, lw=0.45, zorder=9,
    ))
    rect(ax, -0.42, 0.32, 0.55, 0.22, fc=GLASS, ec=INK, lw=0.25, zorder=10)
    ax.add_patch(Circle((0, 0), 0.1, fc=INK, zorder=10))
    ax.plot([-0.28, 0.28], [0, 0], color="white", lw=0.7, zorder=11)
    ax.plot([0, 0], [-0.28, 0.28], color="white", lw=0.7, zorder=11)

    hook_x = -OUTREACH
    sections = (
        (0.05, 0.32, 0.55, 0.42, "#d9d3c4"),
        (0.28, 0.55, 0.42, 0.32, "#e4dece"),
        (0.50, 0.78, 0.32, 0.24, "#ece6d8"),
        (0.74, 0.96, 0.24, 0.16, "#f7f3ea"),
    )
    root, tip = -0.2, hook_x + 0.55
    for a, b, w0, w1, color in sections:
        p0 = _along((root, 0.0), (tip, 0.0), a)
        p1 = _along((root, 0.0), (tip, 0.0), b)
        ax.add_patch(Polygon(boom_polygon(*p0, *p1, w0, w1), closed=True, fc=color, ec=BOOM_EDGE, lw=0.65, zorder=9))
    ax.add_patch(Circle((tip, 0), 0.16, fc="#efeae0", ec=INK, lw=0.6, zorder=10))
    ax.add_patch(Circle((hook_x, 0), 0.13, fc=INK, zorder=11))
    ax.add_patch(Circle((hook_x, 0), 0.05, fc="white", zorder=12))


def draw_flatbed(ax):
    """Шаланда в местных координатах крана. Длина поперёк стрелы, тягач к −Y."""
    deck_x = DECK_X - CENTER_X
    deck_y = DECK_Y
    rect(ax, deck_x, deck_y, DECK_W, DECK_L, fc=DECK, ec=DECK_DK, lw=0.8, zorder=3)
    for i in range(int(DECK_L / 0.28)):
        yy = deck_y + i * 0.28
        if -4.35 < yy < 4.35:
            continue
        ax.plot([deck_x, deck_x + DECK_W], [yy, yy], color=DECK_DK, lw=0.35, zorder=3)
    rect(ax, deck_x - 0.06, deck_y, 0.06, DECK_L, fc=STEEL_DK, ec=INK, lw=0.3, zorder=4)
    rect(ax, deck_x + DECK_W, deck_y, 0.06, DECK_L, fc=STEEL_DK, ec=INK, lw=0.3, zorder=4)
    rect(ax, deck_x - 0.08, deck_y + DECK_L, DECK_W + 0.16, 0.16, fc=STEEL_DK, ec=INK, lw=0.45, zorder=5)
    for lx in (deck_x + 0.15, deck_x + DECK_W - 0.40):
        rect(ax, lx, deck_y + DECK_L + 0.02, 0.26, 0.10, fc="#b23b3b", ec=INK, lw=0.25, zorder=6)

    def dual(cx, cy):
        for dx in (-0.34, -0.12):
            ax.add_patch(FancyBboxPatch(
                (cx + dx, cy), 0.20, 0.62,
                boxstyle="round,pad=0.005,rounding_size=0.05",
                fc="#2a2a2a", ec=INK, lw=0.35, zorder=5,
            ))

    for cy in (4.70, 5.35, 6.00):
        dual(deck_x - 0.60, cy)
        dual(deck_x + DECK_W + 0.10, cy)

    # Тягач у южного торца, за бровкой площадки.
    tx = deck_x + 0.20
    rect(ax, tx, deck_y - 1.75, 2.10, 1.75, fc="#c5ced6", ec=INK, lw=0.7, zorder=5)
    ax.add_patch(FancyBboxPatch(
        (tx + 0.10, deck_y - 2.85), 1.90, 1.20,
        boxstyle="round,pad=0.01,rounding_size=0.12",
        fc=CAB, ec=INK, lw=0.85, zorder=6,
    ))
    rect(ax, tx + 0.28, deck_y - 2.78, 1.50, 0.20, fc=GLASS, ec=INK, lw=0.3, zorder=7)
    for wx in (tx + 0.15, tx + 1.45):
        tire_plan(ax, wx, deck_y - 2.15, 0.46, 0.28, z=6)
        tire_plan(ax, wx, deck_y - 1.35, 0.46, 0.28, z=6)
    label(ax, tx + 1.05, deck_y - 2.25, "тягач", size=6.5, color="white")


def draw_rails(ax, x0, x1, z=2):
    step = 0.55
    x = x0 + 0.25
    while x <= x1 - 0.15:
        for axis in AXES:
            rect(
                ax, x - 0.09, axis - 1.35, 0.18, 2.70,
                fc=SLEEPER, ec="#8d7b5e", lw=0.35, zorder=z,
            )
        x += step
    half = GAUGE / 2
    for axis in AXES:
        for sign in (-1, 1):
            y = axis + sign * half
            ax.plot([x0, x1], [y, y], color=RAIL, lw=2.6, solid_capstyle="butt", zorder=z + 1)
            ax.plot([x0, x1], [y, y], color="#9eb4c9", lw=0.7, solid_capstyle="butt", zorder=z + 2)


def lifting_eye(ax, x, y, z=9):
    ax.add_patch(Rectangle((x - 0.18, y - 0.18), 0.36, 0.36, fc="#2c2c2c", ec=INK, lw=0.45, zorder=z))
    ax.add_patch(Circle((x, y), 0.10, fc="#f4f4f4", ec=INK, lw=0.35, zorder=z + 1))
    ax.add_patch(Circle((x, y), 0.035, fc="#161616", zorder=z + 2))


def draw_module_plan(ax, x, y, w, h, title="", subtitle="", z=6):
    """Крыша модуля: швы панелей и проушины по углам. Не сплошной прямоугольник."""
    ax.add_patch(Rectangle((x + 0.12, y - 0.14), w, h, fc="#000000", ec="none", alpha=0.12, zorder=z - 1))
    rect(ax, x, y, w, h, fc=BLOCK, ec=BLOCK_EDGE, lw=1.8, zorder=z)
    seam = "#e0b44a"
    if w >= h:
        t = 1.5
        while t < w - 0.3:
            ax.plot([x + t, x + t], [y + 0.1, y + h - 0.1], color=seam, lw=0.7, zorder=z + 1)
            t += 1.5
    else:
        t = 1.5
        while t < h - 0.3:
            ax.plot([x + 0.1, x + w - 0.1], [y + t, y + t], color=seam, lw=0.7, zorder=z + 1)
            t += 1.5
    rect(ax, x + 0.08, y + 0.08, w - 0.16, h - 0.16, fc="none", ec="#f8e7a8", lw=0.6, zorder=z + 1)
    for cx, cy in ((x, y), (x + w, y), (x, y + h), (x + w, y + h)):
        lifting_eye(ax, cx, cy, z=z + 2)
    if title:
        label(ax, x + w / 2, y + h - 0.7, title, size=9, bold=True, z=z + 3)
    if subtitle:
        label(ax, x + w / 2, y + h - 1.5, subtitle, size=7, z=z + 3)


def _plan_tire(ax, x, y, w=0.64, h=0.30, z=5):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.01,rounding_size=0.08",
        fc="#1a1a1a", ec=INK, lw=0.4, zorder=z,
    ))
    ax.plot([x + 0.08, x + w - 0.08], [y + h * 0.5, y + h * 0.5], color="#4a4a4a", lw=0.35, zorder=z + 1)


def _dual_plan(ax, x, y_outer, sign, z=5):
    """Двускатное колесо. sign > 0 — наружу в сторону +Y."""
    for i in range(2):
        _plan_tire(ax, x - 0.32, y_outer + sign * i * 0.30, z=z)


def _axle_duals(ax, x):
    """Двускатные колёса вплотную к бортам. Линию оси по настилу не проводим."""
    south = DECK_Y0 - 0.07
    north = DECK_Y0 + DECK_W + 0.07
    _plan_tire(ax, x - 0.34, south - 0.34, 0.68, 0.34, z=8)
    _plan_tire(ax, x - 0.34, south - 0.66, 0.68, 0.32, z=8)
    _plan_tire(ax, x - 0.34, north, 0.68, 0.34, z=8)
    _plan_tire(ax, x - 0.34, north + 0.34, 0.68, 0.32, z=8)


def draw_flatbed_world(ax):
    """Один длинномер в плане. Блок ляжет на площадку сверху. Второго вида нет."""
    # Рама и доски настила. Не сплошная заливка: иначе свободный кусок читается как контейнер.
    rect(ax, DECK_X0, DECK_Y0, DECK_L, 0.11, fc="#9aa6b0", ec=INK, lw=0.35, zorder=3)
    rect(ax, DECK_X0, DECK_Y0 + DECK_W - 0.11, DECK_L, 0.11, fc="#9aa6b0", ec=INK, lw=0.35, zorder=3)
    beam = DECK_X0 + 0.35
    while beam < DECK_X0 + DECK_L - 0.2:
        rect(ax, beam, DECK_Y0 + 0.11, 0.08, DECK_W - 0.22, fc="#7d8892", ec=INK, lw=0.2, zorder=3)
        beam += 1.35
    plank = DECK_X0 + 0.06
    while plank < DECK_X0 + DECK_L - 0.12:
        rect(ax, plank, DECK_Y0 + 0.16, 0.20, DECK_W - 0.32, fc=WOOD, ec=WOOD_EDGE, lw=0.25, zorder=4)
        plank += 0.28
    rect(ax, DECK_X0 - 0.16, DECK_Y0 - 0.06, 0.16, DECK_W + 0.12, fc=STEEL_DK, ec=INK, lw=0.45, zorder=5)
    rect(ax, DECK_X0 - 0.12, DECK_Y0 + 0.12, 0.08, 0.22, fc="#c0392b", ec=INK, lw=0.25, zorder=6)
    rect(ax, DECK_X0 - 0.12, DECK_Y0 + DECK_W - 0.34, 0.08, 0.22, fc="#c0392b", ec=INK, lw=0.25, zorder=6)

    nose = DECK_X0 + DECK_L
    for axle in (DECK_X0 + 1.25, DECK_X0 + 2.45, DECK_X0 + 3.65, nose - 1.85, nose - 0.95):
        _axle_duals(ax, axle)
    ax.add_patch(Circle((nose - 1.55, PICK[1]), 0.28, fc="#6a737a", ec=INK, lw=0.45, zorder=4))
    ax.add_patch(Circle((nose - 1.55, PICK[1]), 0.08, fc="#222", zorder=5))
    sy = DECK_Y0 + DECK_W + 0.02
    rect(ax, nose - 3.15, sy, 0.14, 0.28, fc="#4e585f", ec=INK, lw=0.35, zorder=4)
    rect(ax, nose - 3.28, sy + 0.26, 0.40, 0.08, fc=PAD, ec=INK, lw=0.3, zorder=4)
    sy = DECK_Y0 - 0.30
    rect(ax, nose - 3.15, sy, 0.14, 0.28, fc="#4e585f", ec=INK, lw=0.35, zorder=4)
    rect(ax, nose - 3.28, sy - 0.08, 0.40, 0.08, fc=PAD, ec=INK, lw=0.3, zorder=4)

    rect(ax, nose - 1.7, PICK[1] - 0.42, 3.55, 0.22, fc="#8e99a2", ec=INK, lw=0.4, zorder=4)
    rect(ax, nose - 1.7, PICK[1] + 0.20, 3.55, 0.22, fc="#8e99a2", ec=INK, lw=0.4, zorder=4)
    cab_x, cab_y = nose + 0.15, PICK[1] - 1.15
    ax.add_patch(FancyBboxPatch(
        (cab_x, cab_y), 2.35, 2.30,
        boxstyle="round,pad=0.01,rounding_size=0.12",
        fc=CAB, ec=INK, lw=1.0, zorder=6,
    ))
    rect(ax, cab_x + 2.05, cab_y + 0.28, 0.22, 1.74, fc=GLASS, ec=INK, lw=0.4, zorder=7)
    rect(ax, cab_x + 0.15, cab_y + 1.85, 1.70, 0.28, fc="#163040", ec=GLASS, lw=0.3, zorder=7)
    rect(ax, cab_x + 0.15, cab_y + 0.16, 1.70, 0.28, fc="#163040", ec=GLASS, lw=0.3, zorder=7)
    for my in (cab_y + 2.15, cab_y - 0.18):
        ax.plot([cab_x + 1.7, cab_x + 2.15], [cab_y + 1.15, my], color=INK, lw=0.65, zorder=8)
        rect(ax, cab_x + 2.05, my, 0.34, 0.16, fc="#141414", ec=INK, lw=0.3, zorder=8)
    for lamp_y in (cab_y + 1.95, cab_y + 0.15):
        ax.add_patch(Circle((cab_x + 2.42, lamp_y), 0.09, fc="#f7f9fb", ec=INK, lw=0.3, zorder=8))
    _plan_tire(ax, cab_x + 1.05, cab_y - 0.34, 0.80, 0.34, z=8)
    _plan_tire(ax, cab_x + 1.05, cab_y + 2.30, 0.80, 0.34, z=8)
    rect(ax, cab_x + 2.48, cab_y + 0.15, 0.14, 2.00, fc="#1a2228", ec=INK, lw=0.35, zorder=7)
    label(ax, cab_x + 1.15, cab_y - 0.72, "тягач", size=7)


def draw_pick_boom(ax):
    """Стрела в положении подъёма: от оси вправо, вдоль стороны 9 м."""
    root = (CENTER[0] + 1.25, CENTER[1])
    tip = (PICK[0] - 0.45, PICK[1])
    sections = (
        (0.00, 0.40, 0.46, 0.36, "#d9d3c4"),
        (0.28, 0.60, 0.36, 0.28, "#e4dece"),
        (0.50, 0.80, 0.28, 0.20, "#ece6d8"),
        (0.72, 1.00, 0.20, 0.14, "#f7f3ea"),
    )
    for a, b, w0, w1, color in sections:
        p0 = _along(root, tip, a)
        p1 = _along(root, tip, b)
        ax.add_patch(Polygon(
            boom_polygon(*p0, *p1, w0, w1), closed=True, fc=color, ec=BOOM_EDGE, lw=0.65, zorder=8,
        ))
    ax.add_patch(Circle(tip, 0.16, fc="#efeae0", ec=INK, lw=0.55, zorder=9))
    ax.add_patch(Circle((tip[0] + 0.02, tip[1]), 0.06, fc=INK, zorder=10))
    ax.plot([tip[0], PICK[0]], [tip[1] + 0.05, PICK[1]], color=INK, lw=0.7, zorder=9)
    ax.plot([tip[0], PICK[0]], [tip[1] - 0.05, PICK[1]], color=INK, lw=0.45, zorder=9)
    ax.add_patch(Circle(PICK, 0.12, fc=INK, zorder=11))
    ax.add_patch(Circle(PICK, 0.045, fc="white", zorder=12))


def draw_plan(ax):
    style_ax(ax, (-3.8, 24.2), (-16.6, 7.6))
    rect(ax, PAD_X0, -PAD_Y, PAD_X1 - PAD_X0, PAD_Y * 2, fc=STONE, ec="#ddd6c8", lw=0.5, hatch="..", zorder=0)
    draw_rails(ax, RAIL0, RAIL1)

    draw_flatbed_world(ax)
    label(ax, DECK_X0 + DECK_L / 2, DECK_Y0 + DECK_W + 1.35, "длинномер", size=8, bold=True)

    crane = Pose(ax, CENTER[0], CENTER[1], -90)
    draw_crane_plan(crane)

    draw_module_plan(ax, SET_X, -BLOCK_W / 2, BLOCK_L, BLOCK_W, z=5)
    label(ax, 1.5, 1.85, "БЛОК 1", size=9, bold=True)
    for corner in ((SET_X, -BLOCK_W / 2), (SET_X + BLOCK_L, -BLOCK_W / 2), (SET_X, BLOCK_W / 2), (SET_X + BLOCK_L, BLOCK_W / 2)):
        ax.plot([corner[0], HOOK[0]], [corner[1], HOOK[1]], color="#2a2622", lw=0.7, zorder=7)
    # Рельсы под блоком: три короткие нитки поверх заливки, чтобы было видно, на чём он стоит.
    for axis in AXES:
        for sign in (-1, 1):
            y = axis + sign * GAUGE / 2
            ax.plot([0.15, 2.85], [y, y], color=RAIL, lw=2.2, solid_capstyle="butt", zorder=6)
    # До длинномера: 3,9 м до ближнего торца, вылет 8,4 м до середины груза.
    # Ось вынесена влево, в обход кабины, размеры — ниже кабины.
    y_axis, y_close, y_reach = -13.55, -14.45, -15.30
    bypass = -3.15
    ax.plot([0.40, bypass], [CENTER[1], CENTER[1]], color=INK, lw=0.55, zorder=6)
    ax.plot([bypass, bypass], [CENTER[1], y_axis], color=INK, lw=0.55, zorder=6)
    ax.plot([bypass, CENTER[0]], [y_axis, y_axis], color=INK, lw=0.55, zorder=6)
    ax.plot([CENTER[0], CENTER[0]], [y_axis, y_reach - 0.18], color=INK, lw=0.55, zorder=6)
    label(ax, -1.55, -12.15, "центр\nвращения", size=6.5)
    for y, x2, text in (
        (y_close, DECK_X0, "3,9 до длинномера"),
        (y_reach, PICK[0], "вылет 8,4"),
    ):
        ax.annotate(
            "", xy=(x2, y), xytext=(CENTER[0], y),
            arrowprops=dict(arrowstyle="<->", color=INK, lw=0.85, shrinkA=0, shrinkB=0),
            zorder=6,
        )
        ax.plot([x2, x2], [y, DECK_Y0], color=INK, lw=0.7, zorder=6)
        ax.plot([x2 - 0.16, x2 + 0.16], [DECK_Y0, DECK_Y0], color=INK, lw=0.7, zorder=6)
        label(ax, (CENTER[0] + x2) / 2, y + 0.14, text, size=7.5, va="bottom")
    ax.plot([PICK[0] - 0.28, PICK[0] + 0.28], [PICK[1], PICK[1]], color=INK, lw=0.9, zorder=8)
    ax.plot([PICK[0], PICK[0]], [PICK[1] - 0.28, PICK[1] + 0.28], color=INK, lw=0.9, zorder=8)
    label(ax, PICK[0], -11.15, "середина груза", size=7)
    label(ax, 1.15, -16.05, "кабина от площадки", size=7)

    hdim(ax, 0, 3, 6.15, "3,0", y_from=4.5, size=7.5)
    vdim(ax, CENTER[1], -4.5, -1.35, "3,9", x_from=CENTER[0], size=7.5)
    vdim(ax, CENTER[1], 0, -2.15, "вылет 8,4", x_from=CENTER[0], size=8)
    vdim(ax, -4.5, 4.5, 20.3, "9,0", x_from=18.0, size=8)
    vdim(ax, -PAD_Y, PAD_Y, 22.2, "11,10", x_from=18.65, size=7)
    hdim(ax, 0, 18, 6.95, "18,0 пути", y_from=4.5, size=7.5)
    ax.annotate(
        "ЖД пути",
        xy=(11.2, 3.7), xytext=(11.2, 5.55),
        ha="center", va="bottom", fontsize=8, fontproperties=BOLD, color=RAIL, zorder=9,
        arrowprops=dict(arrowstyle="-|>", color=RAIL, lw=0.9),
        bbox=dict(fc="white", ec=RAIL, pad=0.2, alpha=0.95),
    )
    label(ax, 11.5, 7.15, "План. Кран перпендикулярно площадке, стрела вдоль 9 м", size=11, bold=True)


def module_wall(ax, x, y, w, h, z=4):
    """Стена модуля тем же жёлтым, что и крыша на плане."""
    rect(ax, x, y, w, h, fc=BLOCK, ec=BLOCK_EDGE, lw=1.15, zorder=z)
    rect(ax, x, y + h - 0.08, w, 0.08, fc="#e7c56a", ec=BLOCK_EDGE, lw=0.3, zorder=z + 1)
    rect(ax, x, y, w, 0.10, fc="#e0b44a", ec=BLOCK_EDGE, lw=0.3, zorder=z + 1)
    rect(ax, x, y, 0.08, h, fc="#e0b44a", ec=BLOCK_EDGE, lw=0.3, zorder=z + 1)
    rect(ax, x + w - 0.08, y, 0.08, h, fc="#e0b44a", ec=BLOCK_EDGE, lw=0.3, zorder=z + 1)
    if w < 5:
        ww, wh = min(1.15, w * 0.4), h * 0.26
        rect(ax, x + (w - ww) / 2, y + h * 0.52, ww, wh, fc=GLASS, ec=INK, lw=0.4, zorder=z + 2)
        return
    rect(ax, x + 0.35, y + 0.16, 0.9, h * 0.52, fc="#fff6dc", ec=BLOCK_EDGE, lw=0.45, zorder=z + 2)
    span = w - 2.3
    gap, n = 0.4, 3
    ww = (span - gap * (n - 1)) / n
    gy, wh = y + h * 0.56, h * 0.22
    for i in range(n):
        rect(ax, x + 1.7 + i * (ww + gap), gy, ww, wh, fc=GLASS, ec=INK, lw=0.4, zorder=z + 2)


def block_side(ax, x, y, w, h):
    rect(ax, x, y, w, h, fc=BLOCK, ec=INK, lw=1.0, zorder=4)
    rect(ax, x, y + h - 0.08, w, 0.08, fc="#e7dfd0", ec=INK, lw=0.25, zorder=5)
    rect(ax, x, y, 0.07, h, fc="#cfc6b4", ec=INK, lw=0.25, zorder=5)
    rect(ax, x + w - 0.07, y, 0.07, h, fc="#cfc6b4", ec=INK, lw=0.25, zorder=5)
    ww, wh = 1.15, h * 0.24
    rect(ax, x + (w - ww) / 2, y + h * 0.52, ww, wh, fc=GLASS, ec=INK, lw=0.4, zorder=5)


def draw_crane_side(ax, tip_x):
    """Кран в местных координатах: перед кабины x = 5, крюк над tip_x."""
    rect(ax, -3.55, 0.92, 8.55, 0.32, fc=CRANE, ec=INK, lw=0.8, zorder=3)
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
    """Вид сбоку на посадке. Кабина слева, от площадки. Стрела над задом, крюк над серединой 9 м."""
    style_ax(ax, (-16.2, 8.2), (-1.7, 12.4))
    ax.plot([-15.6, 7.6], [0, 0], color=INK, lw=1.0, zorder=2)
    rect(ax, -5.55, 0.0, 11.10, STONE_H, fc=STONE, ec="#ddd6c8", lw=0.35, hatch="..", zorder=1)
    rect(ax, -4.5, STONE_H, 9.0, 0.23, fc=SLEEPER, ec="#c9c1b4", lw=0.3, zorder=2)
    rect(ax, -4.5, RAIL_TOP - 0.16, 9.0, 0.16, fc=RAIL, ec=INK, lw=0.35, zorder=3)

    # Кабина в местных +X. Стрелу рисуем в −X, над задом, затем отражаем:
    # кабина остаётся от площадки, крюк приходит на середину блока.
    crane = MirrorX(ax, CENTER[1])
    draw_crane_side(crane, -OUTREACH)

    module_wall(ax, -BLOCK_W / 2, RAIL_TOP, BLOCK_W, BLOCK_H, z=4)
    label(ax, 1.6, RAIL_TOP + 1.35, "БЛОК", size=9, bold=True)
    label(ax, -11.2, 1.7, "КРАН", size=8, bold=True, color=CRANE)
    label(ax, 2.2, RAIL_TOP + 0.28, "рельс", size=7, color=RAIL)
    top = RAIL_TOP + BLOCK_H
    hook_z = top + 5.15
    ax.plot([-0.04, -0.04], [hook_z - 0.15, top + 0.15], color=INK, lw=0.9, zorder=6)
    ax.plot([0.04, 0.04], [hook_z - 0.15, top + 0.15], color=INK, lw=0.55, zorder=6)
    ax.plot([-4.5, 0], [top, hook_z], color="#2c2824", lw=0.9, zorder=6)
    ax.plot([4.5, 0], [top, hook_z], color="#2c2824", lw=0.9, zorder=6)
    ax.add_patch(Wedge((0, hook_z - 0.22), 0.18, 200, 340, width=0.05, fc=INK, ec=INK, zorder=7))
    label(ax, 0.55, hook_z + 0.15, "крюк, 4СЦ", size=7, ha="left")
    ax.plot([CENTER[1], CENTER[1]], [0.0, 0.4], color=INK, lw=0.7, zorder=4)
    label(ax, CENTER[1], -1.15, "центр вращения", size=7)

    hdim(ax, CENTER[1], -4.5, -0.55, "3,9", y_from=0, size=7)
    hdim(ax, CENTER[1], 0, -1.25, "вылет 8,4", y_from=0, size=7.5)
    vdim(ax, RAIL_TOP, top, 6.3, "2,5", x_from=4.5, size=7.5)
    vdim(ax, top, hook_z, 6.3, "5,15", x_from=4.5, size=7.5)
    label(ax, -6.5, 11.7, "Посадка. Стрела над задом, вдоль стороны 9 м", size=11, bold=True)


def main():
    fig = plt.figure(figsize=(16.54, 11.69), dpi=160, facecolor="white")
    fig.text(
        0.04, 0.972, "Схема установки блоков на новую площадку",
        ha="left", va="top", fontsize=16, fontproperties=BOLD, color=INK,
    )
    fig.text(
        0.04, 0.942,
        "Шесть блоков 3 × 9 × 2,5 м, по 8,7 т. Кран перпендикулярно площадке, берёт справа по стороне 9 м. Размеры в метрах.",
        ha="left", va="top", fontsize=9, fontproperties=SANS, color=INK,
    )
    draw_plan(fig.add_axes([0.02, 0.40, 0.96, 0.52]))
    draw_section(fig.add_axes([0.02, 0.045, 0.55, 0.34]))

    notes = (
        "1. Кран встаёт напротив блока, шасси\n"
        "    перпендикулярно площадке. Кабина\n"
        "    смотрит от площадки, зад — к блоку.\n"
        "    Опоры полностью, контур 5,1 × 6,1 м.\n"
        "    На шпалы и на щебень тарелки не ставят.\n"
        "2. Шаланда справа, перпендикулярно крану.\n"
        "    Ближний торец в 3,9 м от оси крана.\n"
        "    Вылет до середины груза на ней — 8,4 м.\n"
        "    Блок подают, 9 м вдоль шаланды, стрела\n"
        "    берёт по этой стороне.\n"
        "3. Стрела возвращается на площадку тем\n"
        "    же вылетом. На крюке 9,1 т. Стрела\n"
        "    14 м, зона над задом: на 8 м — 9,9 т,\n"
        "    на 8,4 м около 9,4 т. Над кабиной\n"
        "    этот блок не несут.\n"
        "4. Ближняя грань блока 3,9 м от оси,\n"
        "    середина — вылет 8,4 м, дальняя 12,9 м.\n"
        "    Если промер дал больше 8,5 м, стоянку\n"
        "    не используют. Строп 4СЦ, ветвь 7 м,\n"
        "    на ветвь 3,0 т при допускаемых 8 т.\n"
        "5. На площадке 9 м ложатся поперёк путей,\n"
        "    3 м — вдоль. Блок поворачивается\n"
        "    вместе со стрелой. Дальше кран\n"
        "    переезжает на 3 м к следующему блоку\n"
        "    и повторяет то же. Так все шесть."
    )
    fig.text(
        0.58, 0.375, notes, ha="left", va="top", fontsize=8.0,
        fontproperties=SANS, color=INK, linespacing=1.28,
    )
    legend = (
        (STONE, "щебень"),
        (RAIL, "ЖД путь"),
        (BLOCK, "блок"),
        (WOOD, "длинномер"),
        (CRANE, "кран"),
    )
    for i, (color, name) in enumerate(legend):
        yy = 0.84 - i * 0.032
        fig.add_artist(Rectangle(
            (0.745, yy), 0.02, 0.018, transform=fig.transFigure,
            fc=color, ec=INK, lw=0.7, zorder=5,
        ))
        fig.text(
            0.772, yy + 0.009, name, ha="left", va="center",
            fontsize=9, fontproperties=SANS, color=INK,
        )
    fig.add_artist(Rectangle(
        (0.012, 0.015), 0.976, 0.97, transform=fig.transFigure,
        fill=False, edgecolor=INK, lw=1.15,
    ))
    fig.savefig("/workspace/ppr/skhema-ustanovka.png", dpi=160, facecolor="white")
    fig.savefig("/workspace/ppr/skhema-ustanovka.pdf", facecolor="white")
    print(
        "center", tuple(round(v, 2) for v in CENTER),
        "pick", tuple(round(v, 2) for v in PICK),
        "near", NEAR, "outreach", OUTREACH,
        "moment", round(9.1 * OUTREACH, 1),
    )


if __name__ == "__main__":
    main()
