"""Polished ManimCE animations for the Tiny Encryption Algorithm writeup.

Palette matches the portfolio Tetra light UI (css/site.css): blue accent
#0073EA on light surfaces — same chrome as the rest of noam.yakar.

Inspired by 3Blue1Brown's visual style (https://github.com/3b1b/manim),
rendered with Manim Community Edition for GitHub Pages embedding.
"""

from __future__ import annotations

from manim import *

# Tetra light UI — mirror css/site.css
BG = "#F7F8FA"
SURFACE = "#FFFFFF"
INK = "#323338"
MUTED = "#676879"
FAINT = "#9699A6"
BLUE = "#0073EA"
PURPLE = "#A25DDC"
GREEN = "#00C875"
YELLOW = "#FDAB3D"
RED = "#E2445C"
LINE = "#D0D4DC"
SOFT = "#E6F1FC"


def ink(text: str, size: float = 28, color: str = INK, weight: str = "MEDIUM") -> Text:
    return Text(text, font_size=size, color=color, font="DejaVu Sans", weight=weight)


def mono(text: str, size: float = 22, color: str = BLUE) -> Text:
    return Text(text, font_size=size, color=color, font="DejaVu Sans Mono", weight="MEDIUM")


class FeistelCycle(Scene):
    """One TEA cycle: delta, <<4/>>5 stir, XOR mix, add into left, then the mirror half."""

    def construct(self):
        self.camera.background_color = BG

        title = ink("One TEA cycle", 36, INK)
        title.to_edge(UP, buff=0.35)
        subtitle = mono("two Feistel half-rounds", 18, MUTED)
        subtitle.next_to(title, DOWN, buff=0.12)
        self.play(FadeIn(title, shift=UP * 0.15), FadeIn(subtitle), run_time=0.8)

        left = self._word_chip("L", "v0", BLUE).move_to(LEFT * 3.4 + UP * 0.55)
        right = self._word_chip("R", "v1", GREEN).move_to(RIGHT * 3.4 + UP * 0.55)
        self.play(FadeIn(left), FadeIn(right), run_time=0.6)

        delta = mono("sum += 0x9E3779B9", 24, YELLOW)
        delta.move_to(UP * 1.55)
        delta_note = ink("golden-ratio delta · keeps rounds from repeating", 18, MUTED)
        delta_note.next_to(delta, DOWN, buff=0.12)
        self.play(Write(delta), FadeIn(delta_note, shift=DOWN * 0.1), run_time=1.0)
        self.wait(0.35)
        self.play(FadeOut(delta_note), delta.animate.scale(0.85).to_edge(UP, buff=1.05), run_time=0.55)

        fan_label = ink("fan R three ways", 22, MUTED).move_to(DOWN * 0.15)
        self.play(FadeIn(fan_label), run_time=0.35)

        copies = VGroup(
            self._lane("R << 4", YELLOW),
            self._lane("R + sum", BLUE),
            self._lane("R >> 5", PURPLE),
        ).arrange(DOWN, buff=0.28).move_to(ORIGIN + DOWN * 0.55)

        for lane in copies:
            self.play(GrowFromPoint(lane, right.get_center()), run_time=0.45)
            self.wait(0.08)

        self.play(FadeOut(fan_label), run_time=0.3)

        mix_label = mono("(R<<4)+k0  ⊕  (R+sum)  ⊕  (R>>5)+k1", 20, INK)
        mix_label.move_to(DOWN * 2.15)
        self.play(Write(mix_label), run_time=0.9)

        pulse = SurroundingRectangle(copies, buff=0.18, corner_radius=0.14, color=BLUE, stroke_width=2)
        self.play(Create(pulse), run_time=0.45)
        self.play(FadeOut(pulse), run_time=0.35)

        mask = self._word_chip("⊕", "mask", YELLOW).move_to(DOWN * 0.55)
        self.play(
            ReplacementTransform(copies, mask),
            mix_label.animate.set_opacity(0.45),
            run_time=0.85,
        )

        arrow = Arrow(
            mask.get_left() + LEFT * 0.1,
            left.get_right() + RIGHT * 0.05,
            buff=0.12,
            color=BLUE,
            stroke_width=3,
            max_tip_length_to_length_ratio=0.12,
        )
        add_note = mono("L  ←  L + mask", 22, BLUE)
        add_note.next_to(arrow, UP, buff=0.12)
        self.play(GrowArrow(arrow), FadeIn(add_note), run_time=0.7)
        self.play(Indicate(left, color=BLUE, scale_factor=1.06), run_time=0.55)
        self.play(FadeOut(arrow), FadeOut(add_note), FadeOut(mask), FadeOut(mix_label), run_time=0.45)

        half2 = ink("mirror half · now L fans the same way", 20, MUTED)
        half2.move_to(DOWN * 0.35)
        self.play(FadeIn(half2), run_time=0.4)
        copies2 = VGroup(
            self._lane("L << 4", YELLOW),
            self._lane("L + sum", BLUE),
            self._lane("L >> 5", PURPLE),
        ).arrange(DOWN, buff=0.28).move_to(ORIGIN + DOWN * 0.9)
        self.play(LaggedStart(*[FadeIn(c, shift=RIGHT * 0.2) for c in copies2], lag_ratio=0.18), run_time=0.9)

        mix2 = mono("(L<<4)+k2  ⊕  (L+sum)  ⊕  (L>>5)+k3", 20, INK)
        mix2.move_to(DOWN * 2.35)
        self.play(Write(mix2), run_time=0.7)
        arrow2 = Arrow(
            copies2.get_right() + RIGHT * 0.05,
            right.get_left() + LEFT * 0.05,
            buff=0.1,
            color=GREEN,
            stroke_width=3,
            max_tip_length_to_length_ratio=0.12,
        )
        self.play(GrowArrow(arrow2), Indicate(right, color=GREEN, scale_factor=1.06), run_time=0.7)
        self.wait(0.25)

        done = ink("both halves moved · key used raw · next cycle", 22, MUTED)
        done.to_edge(DOWN, buff=0.4)
        self.play(
            FadeOut(copies2),
            FadeOut(mix2),
            FadeOut(arrow2),
            FadeOut(half2),
            FadeIn(done),
            run_time=0.7,
        )
        self.wait(1.1)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.6)

    def _word_chip(self, letter: str, name: str, color: str) -> VGroup:
        badge = RoundedRectangle(
            width=1.55,
            height=1.05,
            corner_radius=0.14,
            fill_color=color,
            fill_opacity=0.10,
            stroke_color=color,
            stroke_width=2,
        )
        big = ink(letter, 42, color, "BOLD")
        small = mono(name, 16, MUTED)
        small.next_to(big, DOWN, buff=0.05)
        label = VGroup(big, small).move_to(badge.get_center())
        return VGroup(badge, label)

    def _lane(self, label: str, color: str) -> VGroup:
        bar = RoundedRectangle(
            width=4.6,
            height=0.55,
            corner_radius=0.1,
            fill_color=color,
            fill_opacity=0.12,
            stroke_color=color,
            stroke_width=1.5,
        )
        t = mono(label, 20, color)
        t.move_to(bar.get_center())
        return VGroup(bar, t)


class ShiftStir(Scene):
    """The signature misalignment: four left, five right."""

    def construct(self):
        self.camera.background_color = BG
        title = ink("Four left, five right", 34)
        title.to_edge(UP, buff=0.4)
        self.play(FadeIn(title, shift=UP * 0.1), run_time=0.6)

        bit_w, bit_h, gap = 0.22, 0.42, 0.04
        n = 16
        pattern = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1]

        def make_row(bits, color, y, label):
            cells = VGroup()
            for i, b in enumerate(bits):
                cell = RoundedRectangle(
                    width=bit_w,
                    height=bit_h,
                    corner_radius=0.04,
                    stroke_width=1,
                    stroke_color=LINE,
                    fill_color=color if b else SURFACE,
                    fill_opacity=0.95 if b else 0.9,
                )
                cell.move_to(RIGHT * (i - (n - 1) / 2) * (bit_w + gap) + UP * y)
                cells.add(cell)
            tag = mono(label, 18, color)
            tag.next_to(cells, LEFT, buff=0.35)
            return VGroup(tag, cells)

        base = make_row(pattern, INK, 1.2, "R")
        self.play(FadeIn(base), run_time=0.5)

        note = ink("copy the same bits, then slide them out of line", 20, MUTED)
        note.next_to(base, DOWN, buff=0.45)
        self.play(FadeIn(note), run_time=0.45)

        left_bits = pattern[4:] + [0, 0, 0, 0]
        right_bits = [0, 0, 0, 0, 0] + pattern[:-5]
        mid_bits = pattern[:]

        row_l = make_row(left_bits, YELLOW, -0.15, "<< 4")
        row_m = make_row(mid_bits, BLUE, -0.95, "+sum")
        row_r = make_row(right_bits, PURPLE, -1.75, ">> 5")

        ghost_l = make_row(pattern, YELLOW, -0.15, "<< 4")
        ghost_r = make_row(pattern, PURPLE, -1.75, ">> 5")
        self.play(FadeOut(note), FadeIn(ghost_l), FadeIn(row_m), FadeIn(ghost_r), run_time=0.55)

        shift_l = (bit_w + gap) * 4
        shift_r = (bit_w + gap) * 5
        self.play(
            ghost_l[1].animate.shift(LEFT * shift_l),
            ghost_r[1].animate.shift(RIGHT * shift_r),
            run_time=1.4,
            rate_func=smooth,
        )
        self.play(
            FadeOut(ghost_l),
            FadeOut(ghost_r),
            FadeIn(row_l),
            FadeIn(row_r),
            run_time=0.45,
        )

        punch = ink("almost overlap · never quite · that is the stir", 22, BLUE)
        punch.to_edge(DOWN, buff=0.45)
        brace = SurroundingRectangle(
            VGroup(row_l[1], row_m[1], row_r[1]),
            buff=0.16,
            corner_radius=0.12,
            color=BLUE,
            stroke_width=1.5,
        )
        self.play(Create(brace), FadeIn(punch), run_time=0.7)
        self.wait(1.2)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.55)


class DeltaPulse(Scene):
    """Delta as the golden-ratio metronome for the round sum."""

    def construct(self):
        self.camera.background_color = BG
        title = ink("Delta is not a secret", 34)
        title.to_edge(UP, buff=0.4)
        self.play(FadeIn(title), run_time=0.55)

        formula = mono("delta = floor(2^32 / φ) = 0x9E3779B9", 26, BLUE)
        formula.move_to(UP * 1.35)
        self.play(Write(formula), run_time=1.0)

        axis = NumberLine(
            x_range=[0, 8, 1],
            length=9.5,
            color=LINE,
            include_numbers=False,
            stroke_width=2,
        ).move_to(DOWN * 0.35)
        self.play(Create(axis), run_time=0.5)

        dots = VGroup()
        labels = VGroup()
        for i in range(1, 7):
            d = Dot(axis.n2p(i), color=YELLOW, radius=0.08)
            lab = mono(f"+δ×{i}", 14, MUTED)
            lab.next_to(d, UP, buff=0.18)
            dots.add(d)
            labels.add(lab)

        caption = ink("each cycle adds the same constant so the schedule never stalls", 20, MUTED)
        caption.to_edge(DOWN, buff=0.5)

        for d, lab in zip(dots, labels):
            self.play(GrowFromCenter(d), FadeIn(lab, shift=UP * 0.1), run_time=0.28)

        self.play(FadeIn(caption), run_time=0.5)
        self.wait(0.9)

        linger = ink("Wheeler & Needham · 1994", 18, FAINT)
        linger.next_to(caption, UP, buff=0.25)
        self.play(FadeIn(linger), run_time=0.4)
        self.wait(1.0)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.5)


class BitDiffusion(Scene):
    """One flipped bit spreading across the 64-bit block over a few cycles."""

    def construct(self):
        self.camera.background_color = BG
        title = ink("One flipped bit", 34)
        title.to_edge(UP, buff=0.35)
        self.play(FadeIn(title), run_time=0.5)

        hammings = [1, 3, 7, 14, 24, 31, 33, 32, 34, 31, 33, 32]
        max_h = 64
        bars = VGroup()
        for i, h in enumerate(hammings):
            height = 3.2 * (h / max_h)
            bar = RoundedRectangle(
                width=0.42,
                height=max(height, 0.08),
                corner_radius=0.05,
                fill_color=YELLOW if i < 6 else BLUE,
                fill_opacity=0.9,
                stroke_width=0,
            )
            bar.move_to(LEFT * 4.4 + RIGHT * i * 0.78 + DOWN * 1.1 + UP * (height / 2))
            bars.add(bar)

        half = DashedLine(LEFT * 5.2 + UP * 0.5, RIGHT * 5.0 + UP * 0.5, color=MUTED, stroke_width=1.5)
        half_lab = mono("half the block", 16, MUTED)
        half_lab.next_to(half, RIGHT, buff=0.15)

        self.play(Create(half), FadeIn(half_lab), run_time=0.45)
        self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars], lag_ratio=0.08), run_time=1.6)

        note = ink("scar → stir → wander around half. that is what mixed looks like.", 20, MUTED)
        note.to_edge(DOWN, buff=0.45)
        self.play(FadeIn(note), run_time=0.5)
        self.wait(1.2)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.5)


class TeaIntro(Scene):
    """Short title card loop for the hero of the writeup."""

    def construct(self):
        self.camera.background_color = BG
        brand = mono("TEA", 22, BLUE)
        brand.to_edge(UP, buff=0.55)
        title = ink("Four Left, Five Right", 44)
        title.next_to(brand, DOWN, buff=0.25)
        dek = ink("a cipher small enough to hold in your head", 22, MUTED)
        dek.next_to(title, DOWN, buff=0.35)

        L = RoundedRectangle(
            width=1.8, height=1.1, corner_radius=0.14,
            color=BLUE, fill_color=BLUE, fill_opacity=0.10, stroke_width=2,
        )
        R = RoundedRectangle(
            width=1.8, height=1.1, corner_radius=0.14,
            color=GREEN, fill_color=GREEN, fill_opacity=0.10, stroke_width=2,
        )
        L.move_to(LEFT * 2.2 + DOWN * 1.15)
        R.move_to(RIGHT * 2.2 + DOWN * 1.15)
        Lt = ink("L", 36, BLUE, "BOLD").move_to(L)
        Rt = ink("R", 36, GREEN, "BOLD").move_to(R)
        arrows = VGroup(
            CurvedArrow(L.get_top() + UP * 0.05, R.get_top() + UP * 0.05, angle=-TAU / 6, color=YELLOW),
            CurvedArrow(R.get_bottom() + DOWN * 0.05, L.get_bottom() + DOWN * 0.05, angle=-TAU / 6, color=PURPLE),
        )

        self.play(FadeIn(brand), FadeIn(title, shift=UP * 0.12), run_time=0.8)
        self.play(FadeIn(dek), run_time=0.5)
        self.play(FadeIn(L), FadeIn(R), FadeIn(Lt), FadeIn(Rt), run_time=0.55)
        self.play(Create(arrows), run_time=0.9)
        self.wait(1.0)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.55)
