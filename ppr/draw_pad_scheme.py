#!/usr/bin/env python3
"""ППР: раскладка щебёночной площадки, шпал и рельсов."""

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon, Rectangle
from matplotlib.font_manager import FontProperties

SANS = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
BOLD = FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

INK = "#1a1a1a"
STONE = "#f3f0e8"
SLEEPER = "#e4dccb"
SLEEPER_EDGE = "#8a8172"
RAIL = "#3e4850"
MODULE = "#5c564c"
PAD_C = "#c8c2b6"

# Площадка 19,30 × 11,10 м. Берма 0,50 м за торцами и концами шпал.
# Три пути, колея 1520 мм между внутренними гранями головок.
PAD_L = 19.30
PAD_W = 11.10
BERM = 0.50
SLEEPER_L = 2.70
SLEEPER_W = 0.30
SLEEPER_H = 0.23
GAUGE = 1.52
HEAD = 0.075
AXIS_STEP = 3.70
AXES = (-AXIS_STEP, 0.0, AXIS_STEP)
RAIL_L = 18.0
MODULE_L = 18.0
MODULE_W = 9.0
STEP = 0.50
STONE_H = 0.25
# Вертикаль на поперечном разрезе крупнее, чтобы был виден слой.
STRETCH = 5.0


def comma(value, digits=2):
    return f"{value:.{digits}f}".replace(".", ",").replace(",00", "").replace(",50", ",5").replace(",30", ",3").replace(",70", ",7").replace(",25", ",25").replace(",10", ",1")


def nice(value):
    text = f"{value:.2f}".rstrip("0").rstrip(".")
    return text.replace(".", ",")


def style_ax(ax, xlim, ylim, equal=True):
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    if equal:
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
    ax.plot([x1, x1], [y_from, y], color=INK, lw=0.45, zorder=6)
    ax.plot([x2, x2], [y_from, y], color=INK, lw=0.45, zorder=6)
    ax.annotate(
        "", xy=(x2, y), xytext=(x1, y),
        arrowprops=dict(arrowstyle="<->", color=INK, lw=0.7, shrinkA=0, shrinkB=0),
        zorder=6,
    )
    label(ax, (x1 + x2) / 2, y + 0.10, text, size=size, va="bottom")


def vdim(ax, y1, y2, x, text, x_from, size=7.5, text_dx=0.12):
    ax.plot([x_from, x], [y1, y1], color=INK, lw=0.45, zorder=6)
    ax.plot([x_from, x], [y2, y2], color=INK, lw=0.45, zorder=6)
    ax.annotate(
        "", xy=(x, y2), xytext=(x, y1),
        arrowprops=dict(arrowstyle="<->", color=INK, lw=0.7, shrinkA=0, shrinkB=0),
        zorder=6,
    )
    ax.text(
        x + text_dx, (y1 + y2) / 2, text, ha="left", va="center", rotation=90,
        fontsize=size, fontproperties=SANS, color=INK, zorder=9,
    )


def sleeper_centers():
    n = int(round(RAIL_L / STEP))
    return [-RAIL_L / 2 + i * STEP for i in range(n + 1)]


def inner_faces(axis):
    return axis - GAUGE / 2, axis + GAUGE / 2


def draw_plan(ax):
    style_ax(ax, (-11.6, 12.4), (-7.45, 7.7))
    pad_x, pad_y = -PAD_L / 2, -PAD_W / 2
    ax.add_patch(Rectangle(
        (pad_x, pad_y), PAD_L, PAD_W,
        fc=STONE, ec="#ddd6c8", lw=0.6, hatch="..", zorder=0,
    ))
    # Контур модуля — пунктир, рельсы остаются видны.
    ax.add_patch(Rectangle(
        (-MODULE_L / 2, -MODULE_W / 2), MODULE_L, MODULE_W,
        fc="none", ec=MODULE, lw=1.0, ls=(0, (6, 2.5)), zorder=4,
    ))

    centers = sleeper_centers()
    for axis in AXES:
        for cx in centers:
            rect(
                ax, cx - SLEEPER_W / 2, axis - SLEEPER_L / 2, SLEEPER_W, SLEEPER_L,
                fc=SLEEPER, ec=SLEEPER_EDGE, lw=0.35, zorder=2,
            )
        for sign, parts in (
            (-1, ((-9.0, 3.5), (3.5, 9.0))),
            (1, ((-9.0, -3.5), (-3.5, 9.0))),
        ):
            inner = axis + sign * GAUGE / 2
            y0 = inner if sign > 0 else inner - HEAD
            for x0, x1 in parts:
                rect(ax, x0, y0, x1 - x0, HEAD, fc=RAIL, ec=INK, lw=0.25, zorder=3)
            joint = 3.5 if sign < 0 else -3.5
            plate_y = y0 - 0.10 if sign < 0 else y0 + HEAD
            rect(ax, joint - 0.18, plate_y, 0.36, 0.08, fc="#6a6258", ec=INK, lw=0.3, zorder=4)

    ax.annotate(
        "", xy=(4.6, 5.28), xytext=(1.2, 5.28),
        arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.0), zorder=6,
    )
    label(ax, 2.9, 5.62, "ход блока", size=7.5)
    label(ax, -6.2, 6.15, "пунктир — модуль 18 × 9 м", size=7.5)

    label(ax, -6.4, -4.85, "щебень", size=8)
    label(ax, 0.0, 6.85, "План", size=12, bold=True)

    # Берма за торцом шпалы и за концом шпалы.
    hdim(ax, 9.15, 9.65, 6.05, "0,50", y_from=5.05, size=7)
    vdim(ax, -5.55, -5.05, -10.35, "0,50", x_from=-5.55, size=7)
    hdim(ax, -9.0, 9.0, -6.15, "18,0", y_from=-4.5, size=7.5)
    hdim(ax, -9.65, 9.65, -6.95, "19,30", y_from=-5.55, size=8)
    vdim(ax, -4.5, 4.5, 10.55, "9,0", x_from=4.5, size=7.5)
    vdim(ax, -5.55, 5.55, 11.45, "11,10", x_from=5.55, size=8)

    upper = AXIS_STEP
    vdim(ax, upper - GAUGE / 2, upper + GAUGE / 2, -8.35, "1,52", x_from=upper, size=7.5, text_dx=-0.42)
    vdim(ax, 0.0, AXIS_STEP, 8.35, "3,70", x_from=1.35, size=7.5)

    hdim(ax, -9.0, 3.5, 1.85, "12,5", y_from=2.35, size=7)
    hdim(ax, 3.5, 9.0, 1.85, "5,5", y_from=2.35, size=7)
    label(ax, 3.5, 2.18, "накладка", size=6.5)
    hdim(ax, 0.0, 0.5, -1.85, "0,50", y_from=-1.35, size=7)
    label(ax, 2.3, -1.85, "шаг шпал, 37 на путь", size=7, ha="left")
    vdim(ax, AXIS_STEP - SLEEPER_L / 2, AXIS_STEP + SLEEPER_L / 2, 6.15, "2,70", x_from=AXIS_STEP + 0.2, size=7)


def rail_profile(ax, x, y, z=5):
    """Р65 упрощённо: подошва, шейка, головка. x — ось рельса."""
    foot_w, foot_h = 0.15, 0.018
    web_w, web_h = 0.02, 0.145
    head_w, head_h = HEAD, 0.045
    rect(ax, x - foot_w / 2, y, foot_w, foot_h, fc=RAIL, ec=INK, lw=0.35, zorder=z)
    rect(ax, x - web_w / 2, y, web_w, web_h + foot_h, fc=RAIL, ec=INK, lw=0.3, zorder=z)
    rect(ax, x - head_w / 2, y + 0.135, head_w, head_h, fc=RAIL, ec=INK, lw=0.35, zorder=z + 1)


def draw_section(ax):
    """Поперечный разрез. Вертикаль крупнее в STRETCH раз."""
    style_ax(ax, (-7.3, 7.6), (-1.15, 7.15), equal=False)
    v = STRETCH
    rect(ax, -PAD_W / 2, 0, PAD_W, STONE_H * v, fc=STONE, ec="#cfc6b6", lw=0.5, hatch="..", zorder=1)
    ax.plot([-PAD_W / 2 - 0.3, PAD_W / 2 + 0.3], [0, 0], color=INK, lw=1.0, zorder=2)
    rail_top = (STONE_H + SLEEPER_H + 0.02 + 0.18) * v
    for axis in AXES:
        rect(
            ax, axis - SLEEPER_L / 2, STONE_H * v, SLEEPER_L, SLEEPER_H * v,
            fc=SLEEPER, ec=SLEEPER_EDGE, lw=0.6, zorder=3,
        )
        for inner in inner_faces(axis):
            sign = 1 if inner > axis else -1
            center = inner + sign * HEAD / 2
            pad_y = (STONE_H + SLEEPER_H) * v
            rect(ax, center - 0.18, pad_y, 0.36, 0.02 * v, fc=PAD_C, ec=INK, lw=0.3, zorder=4)
            # Профиль в растянутых координатах рисуем вручную, пропорции слоя сохраняем.
            base = (STONE_H + SLEEPER_H + 0.02) * v
            rect(ax, center - 0.09, base, 0.18, 0.025 * v, fc=RAIL, ec=INK, lw=0.3, zorder=5)
            rect(ax, center - 0.028, base, 0.056, 0.155 * v, fc=RAIL, ec=INK, lw=0.25, zorder=5)
            rect(ax, center - 0.05, base + 0.125 * v, 0.10, 0.055 * v, fc=RAIL, ec=INK, lw=0.3, zorder=6)
    plate = 0.10 * v
    rect(ax, -MODULE_W / 2, rail_top, MODULE_W, plate, fc="#f6f1e4", ec=MODULE, lw=0.8, zorder=6)
    label(ax, -2.35, rail_top + plate + 0.28, "низ модуля", size=8)
    label(ax, 0.0, 6.7, "Разрез поперёк путей", size=11, bold=True)
    label(ax, 0.0, 6.15, "по вертикали в 5 раз крупнее", size=7.5)

    vdim(ax, 0, STONE_H * v, -6.55, "0,25", x_from=-5.55, size=7.5, text_dx=-0.15)
    hdim(ax, -PAD_W / 2, PAD_W / 2, -0.85, "11,10", y_from=0, size=7.5)
    hdim(ax, AXIS_STEP - GAUGE / 2, AXIS_STEP + GAUGE / 2, rail_top + plate + 0.72, "1,52", y_from=rail_top + plate, size=7)
    hdim(ax, 0, AXIS_STEP, rail_top + plate + 1.45, "3,70", y_from=rail_top + plate, size=7)
    hdim(ax, -MODULE_W / 2, MODULE_W / 2, -0.35, "9,0", y_from=0, size=7)
    label(ax, AXIS_STEP, STONE_H * v + 0.35, "Ш1", size=7)
    label(ax, -AXIS_STEP, (STONE_H + SLEEPER_H + 0.10) * v, "Р65", size=7)


def draw_detail(ax):
    """Узел: щебень, шпала, подкладка КБ, рельс. Масштаб одинаковый."""
    style_ax(ax, (-0.85, 0.95), (-0.35, 1.15))
    ax.plot([-0.8, 0.85], [0, 0], color=INK, lw=1.0, zorder=2)
    rect(ax, -0.7, 0, 1.4, STONE_H, fc=STONE, ec="#cfc6b6", lw=0.5, hatch="..", zorder=1)
    rect(ax, -0.15, STONE_H, 0.30, SLEEPER_H, fc=SLEEPER, ec=SLEEPER_EDGE, lw=0.7, zorder=3)
    # Обрыв шпалы: на узле виден торец по ширине шпалы, не вся длина 2,70.
    rect(ax, -0.16, STONE_H + SLEEPER_H, 0.32, 0.02, fc=PAD_C, ec=INK, lw=0.4, zorder=4)
    rail_profile(ax, 0.0, STONE_H + SLEEPER_H + 0.02, z=5)
    label(ax, 0.0, 1.02, "Узел рельса", size=11, bold=True)
    vdim(ax, 0, STONE_H, -0.58, "0,25", x_from=-0.7, size=7, text_dx=-0.28)
    label(ax, 0.48, STONE_H + 0.10, "шпала Ш1", size=7, ha="left")
    label(ax, 0.42, STONE_H + SLEEPER_H + 0.08, "КБ", size=7, ha="left")
    label(ax, 0.28, STONE_H + SLEEPER_H + 0.28, "Р65", size=7, ha="left")
    label(ax, -0.55, -0.18, "грунт", size=7)


def main():
    fig = plt.figure(figsize=(16.54, 11.69), dpi=160, facecolor="white")
    fig.text(
        0.04, 0.972, "Схема укладки площадки",
        ha="left", va="top", fontsize=16, fontproperties=BOLD, color=INK,
    )
    fig.text(
        0.04, 0.942,
        "Щебень, три пути колеи 1520 мм, шпалы Ш1, рельс Р65. Размеры в метрах.",
        ha="left", va="top", fontsize=9, fontproperties=SANS, color=INK,
    )

    draw_plan(fig.add_axes([0.02, 0.40, 0.62, 0.52]))
    draw_section(fig.add_axes([0.64, 0.55, 0.34, 0.36]))
    draw_detail(fig.add_axes([0.66, 0.30, 0.30, 0.24]))

    notes = (
        "1. Площадка 19,30 × 11,10 м.\n"
        "    Щебень фракции 20–40, слой 250 мм\n"
        "    в уплотнённом теле. Площадь 214 м².\n"
        "    К заказу 70 м³.\n"
        "    Берма за шпалой 0,50 м.\n"
        "2. Три отдельных пути. Колея каждого\n"
        "    1520 мм — между внутренними\n"
        "    гранями головок. Расстояние между\n"
        "    осями путей 3,70 м.\n"
        "3. Рельс Р65. Нить 18,0 м складывается\n"
        "    из 12,5 м и 5,5 м. В деле 6 × 18 м\n"
        "    = 108 м. Заказ: 9 рельсов по 12,5 м.\n"
        "    Накладок 6 комплектов. Стыки\n"
        "    соседних рельсов разведены.\n"
        "4. Шпала Ш1 под скрепление КБ,\n"
        "    длина 2,70 м. Шаг 0,50 м: 37 шпал\n"
        "    на путь, всего 111. Подкладок КБ 222.\n"
        "5. Модуль 18 × 9 м опирается на головки.\n"
        "    По щебню и по грунту его не тащат."
    )
    fig.text(
        0.64, 0.28, notes, ha="left", va="top", fontsize=8.0,
        fontproperties=SANS, color=INK, linespacing=1.28,
    )
    fig.add_artist(Rectangle(
        (0.012, 0.015), 0.976, 0.97, transform=fig.transFigure,
        fill=False, edgecolor=INK, lw=1.15,
    ))
    fig.savefig("/workspace/ppr/skhema-ploshchadka.png", dpi=160, facecolor="white")
    fig.savefig("/workspace/ppr/skhema-ploshchadka.pdf", facecolor="white")
    centers = sleeper_centers()
    print("sleepers_per_track", len(centers), "total", len(centers) * 3)
    print("pad", PAD_L, PAD_W, round(PAD_L * PAD_W, 1))


if __name__ == "__main__":
    main()
