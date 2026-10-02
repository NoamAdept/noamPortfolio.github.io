"""One central ManimCE story for the Tiny Encryption Algorithm writeup.

A single progressive animation: what TEA is, how one cycle works, the
<<4 / >>5 stir, then a plain-language equivalent-key / key-sibling demo
(no exploit recipe). Palette matches the portfolio Tetra light UI.
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


def caption(text: str) -> Text:
    """Bottom safe-zone caption — never overlaps the diagram band."""
    t = ink(text, 20, MUTED)
    t.to_edge(DOWN, buff=0.32)
    return t


def section_title(text: str) -> Text:
    t = ink(text, 32, INK, "BOLD")
    t.to_edge(UP, buff=0.28)
    return t


def chip(letter: str, sub: str, color: str, w: float = 1.7, h: float = 1.05) -> VGroup:
    badge = RoundedRectangle(
        width=w,
        height=h,
        corner_radius=0.14,
        fill_color=color,
        fill_opacity=0.10,
        stroke_color=color,
        stroke_width=2,
    )
    big = ink(letter, 36, color, "BOLD")
    small = mono(sub, 14, MUTED)
    small.next_to(big, DOWN, buff=0.04)
    label = VGroup(big, small).move_to(badge.get_center())
    return VGroup(badge, label)


def key_tile(name: str, value: str, color: str = PURPLE) -> VGroup:
    box = RoundedRectangle(
        width=2.15,
        height=0.85,
        corner_radius=0.12,
        fill_color=SURFACE,
        fill_opacity=1,
        stroke_color=color,
        stroke_width=1.8,
    )
    top = mono(name, 16, color)
    bot = mono(value, 18, INK)
    top.next_to(bot, UP, buff=0.06)
    lab = VGroup(top, bot).move_to(box.get_center())
    return VGroup(box, lab)


def lane_bar(label: str, color: str, width: float = 5.0) -> VGroup:
    bar = RoundedRectangle(
        width=width,
        height=0.55,
        corner_radius=0.1,
        fill_color=color,
        fill_opacity=0.12,
        stroke_color=color,
        stroke_width=1.5,
    )
    t = mono(label, 17, color)
    t.move_to(bar.get_center())
    return VGroup(bar, t)


class TeaCentral(Scene):
    """Single polished walkthrough: TEA mechanics + key-sibling idea."""

    def construct(self):
        self.camera.background_color = BG
        self._intro()
        self._parts()
        self._one_cycle()
        self._stir()
        self._delta()
        self._sibling_attack()
        self._outro()

    # ----- helpers -----

    def _clear(self):
        if self.mobjects:
            self.play(*[FadeOut(m) for m in list(self.mobjects)], run_time=0.45)

    def _swap_caption(self, old, new_text):
        new = caption(new_text)
        if old is None:
            self.play(FadeIn(new), run_time=0.4)
            return new
        self.play(FadeOut(old), FadeIn(new), run_time=0.4)
        return new

    # ----- acts -----

    def _intro(self):
        brand = mono("TEA", 20, BLUE)
        brand.to_edge(UP, buff=0.4)
        title = ink("Four Left, Five Right", 42, INK, "BOLD")
        title.next_to(brand, DOWN, buff=0.22)
        dek = ink("A tiny cipher you can watch bit by bit", 22, MUTED)
        dek.next_to(title, DOWN, buff=0.3)

        self.play(FadeIn(brand), FadeIn(title, shift=UP * 0.1), run_time=0.7)
        self.play(FadeIn(dek), run_time=0.45)

        # Three plain-language bullets, spaced in the middle band only
        bullets = VGroup(
            ink("1.  Split a message into two halves: L and R", 22, INK),
            ink("2.  Mix each half with a secret key, many times", 22, INK),
            ink("3.  The result looks random — unless you know the key", 22, INK),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.32)
        bullets.move_to(DOWN * 0.55)

        for b in bullets:
            self.play(FadeIn(b, shift=RIGHT * 0.15), run_time=0.4)
            self.wait(0.12)

        foot = caption("No crypto background needed — follow the shapes")
        self.play(FadeIn(foot), run_time=0.35)
        self.wait(1.0)
        self._clear()

    def _parts(self):
        title = section_title("The pieces")
        self.play(FadeIn(title), run_time=0.4)

        left = chip("L", "left half", BLUE).move_to(LEFT * 3.1 + UP * 0.7)
        right = chip("R", "right half", GREEN).move_to(RIGHT * 3.1 + UP * 0.7)
        block_brace = BraceBetweenPoints(
            left.get_bottom() + DOWN * 0.15 + LEFT * 0.1,
            right.get_bottom() + DOWN * 0.15 + RIGHT * 0.1,
            direction=DOWN,
            color=MUTED,
        )
        block_lab = ink("one block = 64 bits", 18, MUTED)
        block_lab.next_to(block_brace, DOWN, buff=0.12)

        self.play(FadeIn(left), FadeIn(right), run_time=0.55)
        self.play(GrowFromCenter(block_brace), FadeIn(block_lab), run_time=0.45)

        keys = VGroup(
            key_tile("k0", "word 0"),
            key_tile("k1", "word 1"),
            key_tile("k2", "word 2"),
            key_tile("k3", "word 3"),
        ).arrange(RIGHT, buff=0.28)
        keys.move_to(DOWN * 1.55)
        key_lab = ink("secret key = four words (128 bits)", 18, PURPLE)
        key_lab.next_to(keys, UP, buff=0.18)

        cap = caption("Message halves on top · secret key below")
        self.play(FadeIn(key_lab), LaggedStart(*[FadeIn(k) for k in keys], lag_ratio=0.12), FadeIn(cap), run_time=0.9)
        self.wait(1.0)
        self._clear()

    def _one_cycle(self):
        title = section_title("One cycle — step by step")
        self.play(FadeIn(title), run_time=0.35)

        left = chip("L", "v0", BLUE).move_to(LEFT * 4.0 + UP * 0.55)
        right = chip("R", "v1", GREEN).move_to(RIGHT * 4.0 + UP * 0.55)
        self.play(FadeIn(left), FadeIn(right), run_time=0.45)

        # Step 1: delta
        cap = caption("Step 1 · tick a public metronome called delta")
        delta = mono("sum  +=  0x9E3779B9", 24, YELLOW)
        delta.move_to(UP * 1.55)
        self.play(Write(delta), FadeIn(cap), run_time=0.75)
        self.wait(0.45)

        # Park delta to the top-right so it never collides with later labels
        self.play(
            delta.animate.scale(0.72).to_corner(UR, buff=0.35).shift(DOWN * 0.55),
            run_time=0.45,
        )

        # Step 2: fan R three ways — center band only
        cap = self._swap_caption(cap, "Step 2 · copy R three ways and slide the copies")
        fan = VGroup(
            lane_bar("R << 4   (four bits left)", YELLOW),
            lane_bar("R + sum  (add the metronome)", BLUE),
            lane_bar("R >> 5   (five bits right)", PURPLE),
        ).arrange(DOWN, buff=0.22)
        fan.move_to(ORIGIN + DOWN * 0.15)

        for lane in fan:
            self.play(GrowFromPoint(lane, right.get_center()), run_time=0.38)
        self.wait(0.25)

        # Step 3: mix with key
        cap = self._swap_caption(cap, "Step 3 · fold in two key words, then XOR the three lanes")
        mix = mono("⊕  with k0 and k1", 20, PURPLE)
        mix.next_to(fan, DOWN, buff=0.28)
        pulse = SurroundingRectangle(fan, buff=0.16, corner_radius=0.12, color=BLUE, stroke_width=2)
        self.play(Write(mix), Create(pulse), run_time=0.55)
        self.play(FadeOut(pulse), run_time=0.3)

        mask = chip("⊕", "mask", YELLOW, w=1.5, h=0.95).move_to(fan.get_center())
        self.play(ReplacementTransform(fan, mask), FadeOut(mix), run_time=0.7)

        # Step 4: add into L
        cap = self._swap_caption(cap, "Step 4 · add that mask into L  (L ← L + mask)")
        arrow = Arrow(
            mask.get_left() + LEFT * 0.05,
            left.get_right() + RIGHT * 0.08,
            buff=0.1,
            color=BLUE,
            stroke_width=3,
            max_tip_length_to_length_ratio=0.12,
        )
        add_lab = mono("L  ←  L + mask", 20, BLUE)
        add_lab.next_to(arrow, UP, buff=0.1)
        self.play(GrowArrow(arrow), FadeIn(add_lab), run_time=0.55)
        self.play(Indicate(left, color=BLUE, scale_factor=1.05), run_time=0.45)
        self.play(FadeOut(arrow), FadeOut(add_lab), FadeOut(mask), run_time=0.4)

        # Mirror half — label above the chips; arrow alone below
        cap = self._swap_caption(cap, "Step 5 · swap jobs: now L fans the same way into R")
        mirror = ink("mirror half · L mixes into R with k2, k3", 20, MUTED)
        mirror.next_to(title, DOWN, buff=0.22)
        arrow2 = CurvedArrow(
            left.get_bottom() + DOWN * 0.1,
            right.get_bottom() + DOWN * 0.1,
            angle=TAU / 5,
            color=GREEN,
        )
        self.play(FadeIn(mirror), Create(arrow2), Indicate(right, color=GREEN, scale_factor=1.05), run_time=0.8)
        self.wait(0.55)

        done = ink("Repeat 32 times. That is the whole cipher.", 22, BLUE)
        done.move_to(DOWN * 1.55)
        self.play(FadeOut(mirror), FadeOut(arrow2), FadeIn(done), run_time=0.55)
        self.wait(0.9)
        self._clear()

    def _stir(self):
        title = section_title("Why “four left, five right”?")
        self.play(FadeIn(title), run_time=0.35)

        bit_w, bit_h, gap = 0.24, 0.4, 0.045
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
                    fill_opacity=0.95 if b else 0.95,
                )
                cell.move_to(RIGHT * (i - (n - 1) / 2) * (bit_w + gap) + UP * y)
                cells.add(cell)
            tag = mono(label, 16, color)
            tag.next_to(cells, LEFT, buff=0.28)
            return VGroup(tag, cells)

        # Keep rows in middle band; caption owns the bottom
        base = make_row(pattern, INK, 1.15, "R")
        self.play(FadeIn(base), run_time=0.4)

        cap = caption("Same bits, copied — then slid so they almost, but never quite, line up")
        self.play(FadeIn(cap), run_time=0.35)

        left_bits = pattern[4:] + [0, 0, 0, 0]
        mid_bits = pattern[:]
        right_bits = [0, 0, 0, 0, 0] + pattern[:-5]

        ghost_l = make_row(pattern, YELLOW, 0.15, "<<4")
        row_m = make_row(mid_bits, BLUE, -0.65, "+sum")
        ghost_r = make_row(pattern, PURPLE, -1.45, ">>5")
        row_l = make_row(left_bits, YELLOW, 0.15, "<<4")
        row_r = make_row(right_bits, PURPLE, -1.45, ">>5")

        self.play(FadeIn(ghost_l), FadeIn(row_m), FadeIn(ghost_r), run_time=0.5)
        shift_l = (bit_w + gap) * 4
        shift_r = (bit_w + gap) * 5
        self.play(
            ghost_l[1].animate.shift(LEFT * shift_l),
            ghost_r[1].animate.shift(RIGHT * shift_r),
            run_time=1.25,
            rate_func=smooth,
        )
        self.play(FadeOut(ghost_l), FadeOut(ghost_r), FadeIn(row_l), FadeIn(row_r), run_time=0.4)

        brace = SurroundingRectangle(
            VGroup(row_l[1], row_m[1], row_r[1]),
            buff=0.14,
            corner_radius=0.1,
            color=BLUE,
            stroke_width=1.5,
        )
        cap = self._swap_caption(cap, "That misalignment is the stir — no S-boxes needed")
        self.play(Create(brace), run_time=0.55)
        self.wait(1.0)
        self._clear()

    def _delta(self):
        title = section_title("Delta is not a secret")
        self.play(FadeIn(title), run_time=0.35)

        formula = mono("delta = floor(2^32 / φ) = 0x9E3779B9", 24, BLUE)
        formula.move_to(UP * 1.25)
        self.play(Write(formula), run_time=0.8)

        axis = NumberLine(
            x_range=[0, 7, 1],
            length=9.0,
            color=LINE,
            include_numbers=False,
            stroke_width=2,
        ).move_to(DOWN * 0.15)
        self.play(Create(axis), run_time=0.4)

        dots = VGroup()
        labels = VGroup()
        for i in range(1, 6):
            d = Dot(axis.n2p(i), color=YELLOW, radius=0.08)
            lab = mono(f"+δ×{i}", 14, MUTED)
            lab.next_to(d, UP, buff=0.16)
            dots.add(d)
            labels.add(lab)

        for d, lab in zip(dots, labels):
            self.play(GrowFromCenter(d), FadeIn(lab, shift=UP * 0.08), run_time=0.22)

        cap = caption("Each cycle adds the same constant so rounds never copy each other")
        self.play(FadeIn(cap), run_time=0.4)
        self.wait(0.9)
        self._clear()

    def _sibling_attack(self):
        """Visual equivalent-key / key-sibling idea — concept only, no recipe."""
        title = section_title("The flaw · key siblings")
        self.play(FadeIn(title), run_time=0.35)

        cap = caption("Keys enter TEA only through addition — addition has look-alikes")
        self.play(FadeIn(cap), run_time=0.35)

        # Toy adder metaphor, clearly labeled as the shape of the bug
        a1 = ink("5", 48, INK, "BOLD").move_to(LEFT * 3.6 + UP * 0.55)
        plus = ink("+", 36, MUTED).next_to(a1, RIGHT, buff=0.35)
        b1 = ink("3", 48, INK, "BOLD").next_to(plus, RIGHT, buff=0.35)
        eq = ink("=", 36, MUTED).next_to(b1, RIGHT, buff=0.4)
        s1 = ink("8", 48, BLUE, "BOLD").next_to(eq, RIGHT, buff=0.4)
        row1 = VGroup(a1, plus, b1, eq, s1)
        row1.move_to(UP * 0.85)

        self.play(FadeIn(row1), run_time=0.5)

        nudge = ink("nudge both · sum unchanged", 18, YELLOW)
        nudge.move_to(ORIGIN)
        self.play(FadeIn(nudge), run_time=0.35)

        a2 = ink("6", 48, GREEN, "BOLD").move_to(a1.get_center())
        b2 = ink("2", 48, RED, "BOLD").move_to(b1.get_center())
        self.play(
            Transform(a1, a2),
            Transform(b1, b2),
            Indicate(s1, color=BLUE, scale_factor=1.08),
            run_time=0.7,
        )
        stay = ink("same sum", 18, BLUE)
        stay.next_to(s1, DOWN, buff=0.2)
        self.play(FadeIn(stay), run_time=0.3)
        self.wait(0.55)

        # Keep title + caption; clear the toy adder before the TEA diagram
        toy = VGroup(row1, nudge, stay)
        self.play(FadeOut(toy), run_time=0.4)

        cap = self._swap_caption(cap, "TEA has the same shape: different keys can encrypt identically")

        # Clean three-column layout with labels in empty space only
        pt = RoundedRectangle(
            width=2.2, height=1.0, corner_radius=0.12,
            fill_color=SOFT, fill_opacity=1, stroke_color=BLUE, stroke_width=1.5,
        ).move_to(LEFT * 4.5 + UP * 0.25)
        pt_lab = VGroup(
            ink("plaintext", 18, BLUE),
            mono("one block", 14, MUTED),
        ).arrange(DOWN, buff=0.08).move_to(pt)

        key_a = key_tile("Key A", "k0 k1 k2 k3", PURPLE).move_to(ORIGIN + UP * 1.15)
        key_b = key_tile("Key B", "sibling key", YELLOW).move_to(ORIGIN + DOWN * 0.85)

        cipher = RoundedRectangle(
            width=2.4, height=1.0, corner_radius=0.12,
            fill_color=SOFT, fill_opacity=1, stroke_color=GREEN, stroke_width=1.5,
        ).move_to(RIGHT * 4.4 + UP * 0.25)
        ct_lab = VGroup(
            ink("same", 16, GREEN),
            ink("ciphertext", 18, GREEN),
        ).arrange(DOWN, buff=0.06).move_to(cipher)

        arr_a = Arrow(
            key_a.get_right(), cipher.get_left() + UP * 0.35,
            buff=0.16, color=PURPLE, stroke_width=2.5,
            max_tip_length_to_length_ratio=0.1,
        )
        arr_b = Arrow(
            key_b.get_right(), cipher.get_left() + DOWN * 0.35,
            buff=0.16, color=YELLOW, stroke_width=2.5,
            max_tip_length_to_length_ratio=0.1,
        )
        arr_pt_a = Arrow(
            pt.get_right() + UP * 0.15, key_a.get_left(),
            buff=0.14, color=LINE, stroke_width=2,
            max_tip_length_to_length_ratio=0.1,
        )
        arr_pt_b = Arrow(
            pt.get_right() + DOWN * 0.15, key_b.get_left(),
            buff=0.14, color=LINE, stroke_width=2,
            max_tip_length_to_length_ratio=0.1,
        )

        self.play(FadeIn(pt), FadeIn(pt_lab), run_time=0.4)
        self.play(FadeIn(key_a), FadeIn(key_b), GrowArrow(arr_pt_a), GrowArrow(arr_pt_b), run_time=0.6)

        # Labels parked in clear vertical gaps — not on arrows
        diff = ink("different keys", 16, YELLOW)
        diff.next_to(key_b, DOWN, buff=0.18)
        same = ink("identical result", 16, GREEN)
        same.next_to(cipher, DOWN, buff=0.18)

        self.play(
            FadeIn(cipher), FadeIn(ct_lab),
            GrowArrow(arr_a), GrowArrow(arr_b),
            FadeIn(diff), FadeIn(same),
            run_time=0.85,
        )

        hint = ink("Paired tweaks cancel inside the adders · each key has 3 siblings", 18, MUTED)
        hint.move_to(DOWN * 1.95)
        self.play(FadeOut(cap), FadeOut(diff), FadeOut(same), FadeIn(hint), run_time=0.45)
        self.wait(0.25)

        punch = caption("Equivalent-key weakness — XTEA was born to fix it")
        punch.set_color(RED)
        self.play(FadeOut(hint), FadeIn(punch), run_time=0.5)
        self.wait(1.2)
        self._clear()

    def _outro(self):
        brand = mono("TEA", 20, BLUE)
        brand.to_edge(UP, buff=0.55)
        title = ink("Small. Watchable. Not quite enough.", 32, INK, "BOLD")
        title.next_to(brand, DOWN, buff=0.35)
        dek = ink("Wheeler & Needham · 1994  ·  Tetra light UI", 18, MUTED)
        dek.next_to(title, DOWN, buff=0.35)
        foot = caption("Scroll the writeup to scrub the same loop yourself")

        self.play(FadeIn(brand), FadeIn(title, shift=UP * 0.08), run_time=0.7)
        self.play(FadeIn(dek), FadeIn(foot), run_time=0.45)
        self.wait(1.4)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.5)
