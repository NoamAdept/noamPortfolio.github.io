"""One central ManimCE story for the HMAC writeup.

A single progressive animation: what a MAC is for, why H(key || msg) breaks
(length extension), the ipad / opad keys, the two nested hashes, why the
outer hash stops the extension, and constant-time verification. Palette
matches the portfolio Tetra light UI.

Uses the RFC 4231-style example everyone can check:
HMAC-SHA256(key="key", msg="The quick brown fox jumps over the lazy dog")
  = f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8
"""

from __future__ import annotations

import hashlib
import hmac

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

SANS = "Helvetica Neue"
MONO = "Menlo"

KEY = b"key"
MSG = b"The quick brown fox jumps over the lazy dog"
TAG = hmac.new(KEY, MSG, hashlib.sha256).hexdigest()
assert TAG == "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8"


def ink(text: str, size: float = 28, color: str = INK, weight: str = "MEDIUM") -> Text:
    return Text(text, font_size=size, color=color, font=SANS, weight=weight)


def mono(text: str, size: float = 22, color: str = BLUE) -> Text:
    return Text(text, font_size=size, color=color, font=MONO, weight="MEDIUM")


def caption(text: str) -> Text:
    """Bottom safe-zone caption — never overlaps the diagram band."""
    t = ink(text, 21, MUTED)
    t.to_edge(DOWN, buff=0.32)
    return t


def section_title(text: str) -> Text:
    t = ink(text, 32, INK, "BOLD")
    t.to_edge(UP, buff=0.28)
    return t


def pill(text: str, color: str, w: float | None = None, h: float = 0.62, size: float = 18,
         font_mono: bool = True, fill: float = 0.10) -> VGroup:
    label = mono(text, size, color) if font_mono else ink(text, size, color)
    width = w if w is not None else label.width + 0.5
    box = RoundedRectangle(
        width=width,
        height=h,
        corner_radius=0.12,
        fill_color=color,
        fill_opacity=fill,
        stroke_color=color,
        stroke_width=1.6,
    )
    label.move_to(box.get_center())
    return VGroup(box, label)


def hash_box(label: str = "SHA-256", color: str = INK) -> VGroup:
    box = RoundedRectangle(
        width=1.7,
        height=1.0,
        corner_radius=0.16,
        fill_color=SURFACE,
        fill_opacity=1,
        stroke_color=color,
        stroke_width=2.2,
    )
    h = ink("H", 30, color, "BOLD")
    sub = mono(label, 12, MUTED)
    sub.next_to(h, DOWN, buff=0.04)
    VGroup(h, sub).move_to(box.get_center())
    return VGroup(box, h, sub)


def byte_row(values: list[int], color: str, cell: float = 0.5, gap: float = 0.06,
             show_hex: bool = True, faded_zero: bool = False) -> VGroup:
    cells = VGroup()
    for i, v in enumerate(values):
        zero = faded_zero and v == 0
        sq = RoundedRectangle(
            width=cell,
            height=cell,
            corner_radius=0.06,
            fill_color=SURFACE if zero else color,
            fill_opacity=1 if zero else 0.14,
            stroke_color=LINE if zero else color,
            stroke_width=1.3,
        )
        sq.move_to(RIGHT * i * (cell + gap))
        grp = VGroup(sq)
        if show_hex:
            t = mono(f"{v:02x}", 13, FAINT if zero else color)
            t.move_to(sq.get_center())
            grp.add(t)
        cells.add(grp)
    return cells


def bit_row(bits: str, color: str, cell: float = 0.42, gap: float = 0.07) -> VGroup:
    cells = VGroup()
    for i, b in enumerate(bits):
        on = b == "1"
        sq = RoundedRectangle(
            width=cell,
            height=cell * 1.25,
            corner_radius=0.05,
            fill_color=color if on else SURFACE,
            fill_opacity=0.9 if on else 1,
            stroke_color=color if on else LINE,
            stroke_width=1.2,
        )
        sq.move_to(RIGHT * i * (cell + gap))
        t = mono(b, 14, SURFACE if on else FAINT).move_to(sq)
        cells.add(VGroup(sq, t))
    return cells


def arrow(a, b, color=LINE, width=2.5, buff=0.1):
    return Arrow(
        a, b, buff=buff, color=color, stroke_width=width,
        max_tip_length_to_length_ratio=0.18, max_stroke_width_to_length_ratio=8,
    )


class HmacCentral(Scene):
    """Single polished walkthrough: HMAC mechanics + why the double hash."""

    def construct(self):
        self.camera.background_color = BG
        self._intro()
        self._naive()
        self._pads()
        self._construction()
        self._why_outer()
        self._verify()
        self._outro()

    # ----- helpers -----

    def _clear(self):
        if self.mobjects:
            self.play(*[FadeOut(m) for m in list(self.mobjects)], run_time=0.45)

    def _swap_caption(self, old, new_text, color=MUTED):
        new = caption(new_text).set_color(color)
        if old is None:
            self.play(FadeIn(new), run_time=0.4)
            return new
        self.play(FadeOut(old), FadeIn(new), run_time=0.4)
        return new

    # ----- acts -----

    def _intro(self):
        brand = mono("HMAC", 20, BLUE)
        brand.to_edge(UP, buff=0.4)
        title = ink("Hash It Twice", 46, INK, "BOLD")
        title.next_to(brand, DOWN, buff=0.22)
        dek = ink("How a shared secret turns a hash into a tamper seal", 22, MUTED)
        dek.next_to(title, DOWN, buff=0.3)
        self.play(FadeIn(brand), FadeIn(title, shift=UP * 0.1), run_time=0.7)
        self.play(FadeIn(dek), run_time=0.45)

        # Alice -> message + tag -> Bob, both holding the key
        alice = pill("Alice", BLUE, w=1.8, h=0.72, font_mono=False, size=24).move_to(LEFT * 4.8 + DOWN * 0.5)
        bob = pill("Bob", GREEN, w=1.8, h=0.72, font_mono=False, size=24).move_to(RIGHT * 4.8 + DOWN * 0.5)
        k1 = ink("holds the key", 18, PURPLE).next_to(alice, DOWN, buff=0.18)
        k2 = ink("holds the key", 18, PURPLE).next_to(bob, DOWN, buff=0.18)
        self.play(FadeIn(alice), FadeIn(bob), FadeIn(k1), FadeIn(k2), run_time=0.5)

        packet = VGroup(
            pill("message", INK, w=2.1, h=0.72, font_mono=False, size=22, fill=0.04),
            pill("tag", YELLOW, w=1.2, h=0.72, size=22),
        ).arrange(RIGHT, buff=0.12)
        packet.next_to(alice, RIGHT, buff=0.35)
        self.play(FadeIn(packet, shift=RIGHT * 0.1), run_time=0.4)
        self.play(packet.animate.next_to(bob, LEFT, buff=0.35), run_time=1.1, rate_func=smooth)

        checks = VGroup(
            ink("✓  nobody changed it", 20, GREEN),
            ink("✓  it came from someone with the key", 20, GREEN),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.16)
        checks.move_to(DOWN * 2.15)
        self.play(LaggedStart(*[FadeIn(c, shift=RIGHT * 0.12) for c in checks], lag_ratio=0.4), run_time=0.8)

        foot = caption("HMAC = the recipe for that tag.  Not encryption — the message stays readable.")
        self.play(FadeIn(foot), run_time=0.35)
        self.wait(1.3)
        self._clear()

    def _naive(self):
        title = section_title("The obvious idea:  tag = H(key ‖ message)")
        self.play(FadeIn(title), run_time=0.4)

        cap = caption("SHA-256 eats input in 64-byte blocks, carrying a 32-byte state forward")
        self.play(FadeIn(cap), run_time=0.35)

        # Merkle–Damgård chain: IV -> f -> f -> digest
        y = 0.55
        iv = pill("IV", FAINT, w=0.9).move_to(LEFT * 5.6 + UP * y)
        blk1 = pill("key ‖ message", PURPLE, w=2.6, size=16).move_to(LEFT * 2.6 + UP * (y + 1.35))
        f1 = hash_box("compress").scale(0.8).move_to(LEFT * 2.6 + UP * y)
        blk2 = pill("…message ‖ pad", PURPLE, w=2.6, size=16).move_to(RIGHT * 0.9 + UP * (y + 1.35))
        f2 = hash_box("compress").scale(0.8).move_to(RIGHT * 0.9 + UP * y)
        tag = pill("tag", YELLOW, w=1.3).move_to(RIGHT * 4.2 + UP * y)

        a_iv = arrow(iv.get_right(), f1.get_left())
        a_b1 = arrow(blk1.get_bottom(), f1.get_top(), PURPLE)
        a_12 = arrow(f1.get_right(), f2.get_left())
        a_b2 = arrow(blk2.get_bottom(), f2.get_top(), PURPLE)
        a_t = arrow(f2.get_right(), tag.get_left(), YELLOW)

        self.play(FadeIn(iv), FadeIn(blk1), FadeIn(f1), GrowArrow(a_iv), GrowArrow(a_b1), run_time=0.6)
        self.play(GrowArrow(a_12), FadeIn(blk2), FadeIn(f2), GrowArrow(a_b2), run_time=0.6)
        self.play(GrowArrow(a_t), FadeIn(tag), run_time=0.45)
        self.wait(0.4)

        cap = self._swap_caption(cap, "Catch: the tag IS the final state. An attacker can just keep going.", RED)

        # Attacker continues from the tag
        f3 = hash_box("compress", RED).scale(0.8).move_to(RIGHT * 4.2 + DOWN * 1.35)
        extra = pill("‖ extra data", RED, w=2.2, size=16).move_to(RIGHT * 1.0 + DOWN * 1.35)
        forged = pill("valid tag", RED, w=1.7, fill=0.16).move_to(RIGHT * 4.2 + DOWN * 2.55)
        a_tf = arrow(tag.get_bottom(), f3.get_top(), RED)
        a_ef = arrow(extra.get_right(), f3.get_left(), RED)
        a_ff = arrow(f3.get_bottom(), forged.get_top(), RED)
        self.play(GrowArrow(a_tf), FadeIn(f3), run_time=0.5)
        self.play(FadeIn(extra, shift=RIGHT * 0.1), GrowArrow(a_ef), run_time=0.45)
        self.play(GrowArrow(a_ff), FadeIn(forged), run_time=0.45)

        note = ink("no key needed", 18, RED, "BOLD").next_to(forged, LEFT, buff=0.3)
        self.play(FadeIn(note), Indicate(forged, color=RED, scale_factor=1.08), run_time=0.6)
        cap = self._swap_caption(cap, "Length extension: a tag for  key ‖ message ‖ pad ‖ extra,  forged blind", RED)
        self.wait(1.4)
        self._clear()

    def _pads(self):
        title = section_title("Step 1 · stretch the key, then make two of it")
        self.play(FadeIn(title), run_time=0.4)

        # key "key" = 6b 65 79, padded with zeros (show 10 of 64 bytes)
        raw = list(KEY) + [0] * 7
        row = byte_row(raw, PURPLE, faded_zero=True).move_to(UP * 1.6)
        lab = mono("K'", 20, PURPLE).next_to(row, LEFT, buff=0.3)
        dots = mono("… 64 bytes", 16, FAINT).next_to(row, RIGHT, buff=0.25)
        cap = caption('Key "key" → zero-pad to SHA-256\'s 64-byte block.  (Longer than 64? Hash it first.)')
        self.play(FadeIn(lab), LaggedStart(*[FadeIn(c) for c in row[:3]], lag_ratio=0.15), FadeIn(cap), run_time=0.7)
        self.play(LaggedStart(*[FadeIn(c) for c in row[3:]], lag_ratio=0.06), FadeIn(dots), run_time=0.6)
        self.wait(0.4)

        # XOR with ipad / opad
        kin = [b ^ 0x36 for b in raw]
        kout = [b ^ 0x5C for b in raw]
        row_in = byte_row(kin, BLUE).move_to(UP * 0.15)
        row_out = byte_row(kout, YELLOW).move_to(DOWN * 1.2)
        lab_in = mono("K' ⊕ ipad", 18, BLUE).next_to(row_in, LEFT, buff=0.3)
        lab_out = mono("K' ⊕ opad", 18, YELLOW).next_to(row_out, LEFT, buff=0.3)
        pad_in = mono("ipad = 0x36 × 64", 15, BLUE).next_to(row_in, RIGHT, buff=0.25)
        pad_out = mono("opad = 0x5C × 64", 15, YELLOW).next_to(row_out, RIGHT, buff=0.25)

        cap = self._swap_caption(cap, "XOR every byte with 0x36 → the inner key.  With 0x5C → the outer key.")
        self.play(
            TransformFromCopy(row, row_in), FadeIn(lab_in), FadeIn(pad_in),
            run_time=0.9,
        )
        self.play(
            TransformFromCopy(row, row_out), FadeIn(lab_out), FadeIn(pad_out),
            run_time=0.9,
        )
        self.wait(0.5)

        # Zoom on why these two constants: they differ in half their bits
        grp = VGroup(row, lab, row_in, row_out, lab_in, lab_out)
        self.play(FadeOut(dots), FadeOut(pad_in), FadeOut(pad_out), run_time=0.3)
        self.play(grp.animate.scale(0.82).to_edge(LEFT, buff=0.45).shift(UP * 0.25), run_time=0.6)

        b36 = bit_row(f"{0x36:08b}", BLUE)
        b5c = bit_row(f"{0x5C:08b}", YELLOW)
        bx = bit_row(f"{0x36 ^ 0x5C:08b}", RED)
        bits = VGroup(b36, b5c, bx).arrange(DOWN, buff=0.22).move_to(RIGHT * 4.1 + UP * 0.15)
        l36 = mono("0x36", 16, BLUE).next_to(b36, LEFT, buff=0.22)
        l5c = mono("0x5C", 16, YELLOW).next_to(b5c, LEFT, buff=0.22)
        lx = mono("XOR", 16, RED).next_to(bx, LEFT, buff=0.22)
        self.play(FadeIn(b36), FadeIn(l36), FadeIn(b5c), FadeIn(l5c), run_time=0.5)
        self.play(FadeIn(bx), FadeIn(lx), run_time=0.5)
        cap = self._swap_caption(cap, "0x36 and 0x5C differ in 4 of 8 bits — the two keys look unrelated to H")
        self.wait(1.4)
        self._clear()

    def _construction(self):
        title = section_title("Step 2 · two nested hashes")
        self.play(FadeIn(title), run_time=0.4)

        formula = mono("HMAC(K, m) = H( K_out ‖ H( K_in ‖ m ) )", 24, INK)
        formula.next_to(title, DOWN, buff=0.3)
        self.play(Write(formula), run_time=0.9)

        # Inner lane
        y1, y2 = 0.55, -1.3
        kin = pill("K_in", BLUE, w=1.2).move_to(LEFT * 5.4 + UP * y1)
        msg = pill('"The quick brown fox…"', INK, w=3.6, size=15, fill=0.04).next_to(kin, RIGHT, buff=0.08)
        h1 = hash_box(color=BLUE).move_to(RIGHT * 1.7 + UP * y1)
        inner = pill("inner · 32 bytes", BLUE, w=2.4, size=15).move_to(RIGHT * 4.9 + UP * y1)
        a1 = arrow(msg.get_right(), h1.get_left(), BLUE)
        a2 = arrow(h1.get_right(), inner.get_left(), BLUE)

        cap = caption("Inner hash: the inner key glued in front of the message")
        self.play(FadeIn(cap), FadeIn(kin), FadeIn(msg), run_time=0.5)
        self.play(GrowArrow(a1), FadeIn(h1), run_time=0.45)
        self.play(Indicate(h1, color=BLUE, scale_factor=1.06), run_time=0.45)
        self.play(GrowArrow(a2), FadeIn(inner), run_time=0.45)
        self.wait(0.3)

        # Outer lane
        kout = pill("K_out", YELLOW, w=1.3).move_to(LEFT * 5.35 + UP * y2)
        inner_copy = inner.copy()
        h2 = hash_box(color=YELLOW).move_to(RIGHT * 1.7 + UP * y2)
        cap = self._swap_caption(cap, "Outer hash: the outer key glued in front of that 32-byte result")
        self.play(FadeIn(kout), run_time=0.35)
        self.play(inner_copy.animate.next_to(kout, RIGHT, buff=0.08), run_time=0.9, rate_func=smooth)
        a3 = arrow(inner_copy.get_right(), h2.get_left(), YELLOW)
        self.play(GrowArrow(a3), FadeIn(h2), run_time=0.45)
        self.play(Indicate(h2, color=YELLOW, scale_factor=1.06), run_time=0.45)

        tag = VGroup(
            mono("tag", 15, YELLOW),
            mono(TAG[:16], 15, INK),
            mono(TAG[16:32], 15, INK),
            mono(TAG[32:48], 15, INK),
            mono(TAG[48:], 15, INK),
        ).arrange(DOWN, buff=0.06, aligned_edge=LEFT)
        tag_box = SurroundingRectangle(tag, buff=0.16, corner_radius=0.12, color=YELLOW,
                                       fill_color=YELLOW, fill_opacity=0.08, stroke_width=1.6)
        tag_g = VGroup(tag_box, tag).move_to(RIGHT * 5.0 + UP * y2)
        a4 = arrow(h2.get_right(), tag_g.get_left(), YELLOW)
        self.play(GrowArrow(a4), FadeIn(tag_g), run_time=0.6)

        cap = self._swap_caption(cap, 'HMAC-SHA256("key", "The quick brown fox jumps over the lazy dog") — check it yourself')
        self.wait(1.6)
        self._clear()

    def _why_outer(self):
        title = section_title("Why the second hash kills length extension")
        self.play(FadeIn(title), run_time=0.4)

        # Attacker sees only the tag, tries to extend it
        tag = pill("tag", YELLOW, w=1.4).move_to(LEFT * 4.6 + UP * 1.0)
        f = hash_box("compress", RED).scale(0.8).move_to(LEFT * 1.5 + UP * 1.0)
        extra = pill("‖ extra", RED, w=1.6, size=16).next_to(f, UP, buff=0.45)
        out = pill("H(K_out ‖ inner ‖ pad ‖ extra)", RED, w=4.4, size=15).move_to(RIGHT * 3.3 + UP * 1.0)
        a1 = arrow(tag.get_right(), f.get_left(), RED)
        a2 = arrow(extra.get_bottom(), f.get_top(), RED)
        a3 = arrow(f.get_right(), out.get_left(), RED)

        cap = caption("Extending the tag only ever extends the OUTER hash…")
        self.play(FadeIn(cap), FadeIn(tag), run_time=0.4)
        self.play(GrowArrow(a1), FadeIn(f), FadeIn(extra), GrowArrow(a2), run_time=0.6)
        self.play(GrowArrow(a3), FadeIn(out), run_time=0.5)
        self.wait(0.4)

        # What the verifier would actually compute
        want = mono("verifier computes  H( K_out ‖ H( K_in ‖ m' ) )", 19, INK).move_to(DOWN * 0.35)
        self.play(FadeIn(want), run_time=0.45)
        cap = self._swap_caption(cap, "…but a real tag always hashes K_out with exactly 32 bytes — a fresh inner hash")
        self.wait(0.6)

        cross = Cross(out, stroke_color=RED, stroke_width=5)
        nomatch = ink("never matches", 20, RED, "BOLD").next_to(out, DOWN, buff=0.25)
        self.play(Create(cross), FadeIn(nomatch), run_time=0.6)

        punch = ink("To forge, you'd need the inner hash of your new message — which needs the key.", 20, INK)
        punch.move_to(DOWN * 1.65)
        self.play(FadeIn(punch, shift=UP * 0.08), run_time=0.5)
        cap = self._swap_caption(cap, "Same trick protects HMAC-MD5 and HMAC-SHA1 from their broken collisions — still, use SHA-256")
        self.wait(1.6)
        self._clear()

    def _verify(self):
        title = section_title("Step 3 · check the tag without leaking it")
        self.play(FadeIn(title), run_time=0.4)

        good = "f7bc83f4"
        guess = "f7b0ffff"
        n = len(good)

        def chars(s, color, y):
            row = VGroup()
            for i, ch in enumerate(s):
                box = RoundedRectangle(width=0.62, height=0.72, corner_radius=0.08,
                                       fill_color=SURFACE, fill_opacity=1,
                                       stroke_color=LINE, stroke_width=1.3)
                box.move_to(RIGHT * (i - (n - 1) / 2) * 0.72 + UP * y)
                t = mono(ch, 22, color).move_to(box)
                row.add(VGroup(box, t))
            return row

        real = chars(good, INK, 1.25)
        sent = chars(guess, RED, 0.35)
        lr = ink("expected", 16, MUTED).next_to(real, LEFT, buff=0.35)
        ls = ink("received", 16, MUTED).next_to(sent, LEFT, buff=0.35)
        self.play(FadeIn(real), FadeIn(sent), FadeIn(lr), FadeIn(ls), run_time=0.5)

        cap = caption("A normal == stops at the first wrong byte…")
        self.play(FadeIn(cap), run_time=0.35)

        # Early-exit scan
        scan = SurroundingRectangle(VGroup(real[0], sent[0]), buff=0.06, corner_radius=0.08,
                                    color=BLUE, stroke_width=2.4)
        self.play(Create(scan), run_time=0.25)
        for i in range(1, 4):
            self.play(scan.animate.move_to(VGroup(real[i], sent[i])), run_time=0.22)
        self.play(scan.animate.set_color(RED), Indicate(sent[3], color=RED), run_time=0.35)

        # Timing bars: more correct prefix = longer time
        bars = VGroup()
        labels = VGroup()
        for k, h in enumerate([1, 2, 3, 4]):
            bar = Rectangle(width=0.55, height=0.28 * h, fill_color=YELLOW if k < 3 else RED,
                            fill_opacity=0.85, stroke_width=0)
            bar.move_to(LEFT * 1.2 + RIGHT * k * 0.8 + DOWN * 1.8, aligned_edge=DOWN)
            bars.add(bar)
            labels.add(mono(f"{k}✓", 13, MUTED).next_to(bar, DOWN, buff=0.08))
        axis = mono("time", 14, MUTED).next_to(bars, LEFT, buff=0.35)
        cap = self._swap_caption(cap, "…so response time leaks how many bytes you got right. Guess byte by byte.", RED)
        self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars], lag_ratio=0.2), FadeIn(labels), FadeIn(axis), run_time=0.9)
        self.wait(0.7)

        # Constant-time compare: OR every diff, look once at the end
        self.play(FadeOut(bars), FadeOut(labels), FadeOut(axis), FadeOut(scan), run_time=0.35)
        sweep = SurroundingRectangle(VGroup(real, sent), buff=0.1, corner_radius=0.1, color=GREEN, stroke_width=2.4)
        ct = mono("diff |= a[i] ^ b[i]   for every i   →   return diff == 0", 19, GREEN).move_to(DOWN * 1.15)
        cap = self._swap_caption(cap, "Constant-time compare touches every byte, every time: hmac.compare_digest")
        self.play(Create(sweep), FadeIn(ct), run_time=0.7)
        flat = VGroup(*[
            Rectangle(width=0.55, height=1.12, fill_color=GREEN, fill_opacity=0.8, stroke_width=0)
            .move_to(LEFT * 1.2 + RIGHT * k * 0.8 + DOWN * 2.85, aligned_edge=DOWN)
            for k in range(4)
        ])
        flat_lab = ink("same time, right or wrong", 16, GREEN).next_to(flat, RIGHT, buff=0.35)
        self.play(FadeOut(cap), run_time=0.2)
        self.play(LaggedStart(*[GrowFromEdge(b, DOWN) for b in flat], lag_ratio=0.1), FadeIn(flat_lab), run_time=0.7)
        self.wait(1.4)
        self._clear()

    def _outro(self):
        brand = mono("HMAC", 20, BLUE)
        brand.to_edge(UP, buff=0.55)
        title = ink("Two pads. Two hashes. One secret.", 34, INK, "BOLD")
        title.next_to(brand, DOWN, buff=0.35)
        self.play(FadeIn(brand), FadeIn(title, shift=UP * 0.08), run_time=0.7)

        uses = [
            ("webhooks", BLUE), ("JWT · HS256", PURPLE), ("AWS SigV4", YELLOW),
            ("TOTP codes", GREEN), ("HKDF · TLS 1.3", BLUE), ("signed cookies", PURPLE),
        ]
        chips = VGroup(*[pill(u, c, size=17) for u, c in uses])
        chips.arrange_in_grid(rows=2, buff=(0.3, 0.3)).move_to(DOWN * 0.35)
        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.08) for c in chips], lag_ratio=0.12), run_time=1.0)

        dek = ink("Bellare, Canetti & Krawczyk · 1996  ·  RFC 2104", 18, MUTED)
        dek.next_to(chips, DOWN, buff=0.5)
        foot = caption("Scroll the writeup to compute every byte yourself")
        self.play(FadeIn(dek), FadeIn(foot), run_time=0.45)
        self.wait(1.6)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.5)


class HmacThumb(Scene):
    """Still frame for the writeups list card (render with -s, 4:3)."""

    def construct(self):
        self.camera.background_color = BG
        inner = pill("0x36", BLUE, w=3.0, h=2.2, size=48, fill=0.9)
        inner[1].set_color(SURFACE)
        outer = pill("0x5C", YELLOW, w=3.0, h=2.2, size=48, fill=0.9)
        outer[1].set_color(SURFACE)
        VGroup(inner, outer).arrange(RIGHT, buff=0.8).move_to(UP * 0.5)
        li = ink("ipad", 26, BLUE, "BOLD").next_to(inner, DOWN, buff=0.25)
        lo = ink("opad", 26, YELLOW, "BOLD").next_to(outer, DOWN, buff=0.25)
        f = mono("H( K⊕opad ‖ H( K⊕ipad ‖ m ) )", 30, INK).next_to(VGroup(li, lo), DOWN, buff=0.6)
        art = VGroup(inner, outer, li, lo, f)
        art.scale_to_fit_width(config.frame_width * 0.86).move_to(ORIGIN)
        self.add(art)
