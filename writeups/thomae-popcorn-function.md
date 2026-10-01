---
title: Thomae's popcorn function
date: 2026-10-01
description: Real analysis notes — continuity of Thomae's function (the popcorn / raindrop function) on ℝ.
series: course notes
---

<div class="challenge-hero" markdown="0">
  <div class="challenge-hero-copy" style="grid-column: 1 / -1">
    <p class="challenge-eyebrow">MAT · Real analysis · polished from Overleaf</p>
    <p class="challenge-prompt">A function continuous at every irrational — and discontinuous at every rational.</p>
  </div>
</div>

Thomae's function (also called the **popcorn** or **raindrop** function) is the classic example that separates “continuous almost everywhere” from “continuous everywhere.” These notes polish a university Overleaf write-up into a clean argument you can reuse on exams and in conversation.

## Definition

For \(x \in \mathbb{R}\),

\[
t(x) =
\begin{cases}
\dfrac{1}{q} & \text{if } x = \dfrac{p}{q} \in \mathbb{Q} \text{ in lowest terms, } q > 0, \\[0.6em]
0 & \text{if } x \notin \mathbb{Q}.
\end{cases}
\]

Integers are \(p/1\), so \(t(n) = 1\). Irrationals sit at height zero. Rationals with large denominators sit close to the axis — the “popcorn” settles toward the floor.

## Claim

**\(t\) is continuous at every irrational and discontinuous at every rational.**

## Continuity at irrationals

Fix irrational \(a\) (so \(t(a) = 0\)) and \(\varepsilon > 0\). Choose an integer \(N > 1/\varepsilon\).

In any bounded interval around \(a\), there are **only finitely many** rationals with denominator \(q \le N\) (for each \(q\), at most finitely many reduced \(p/q\) in that interval).

Those finitely many rationals are all a positive distance from \(a\). Pick \(\delta > 0\) small enough that the punctured neighborhood \((a-\delta, a+\delta)\) avoids every rational with \(q \le N\).

Then for \(0 < |x - a| < \delta\):

- if \(x\) is irrational, \(t(x) = 0 < \varepsilon\);
- if \(x = p/q\) in lowest terms, necessarily \(q > N\), hence \(t(x) = 1/q < 1/N < \varepsilon\).

So \(|t(x) - t(a)| < \varepsilon\). Continuity at \(a\).

<aside class="callout callout-tip">
<strong>Key move</strong>
For any height threshold <code>1/N</code>, the “tall” popcorn kernels are discrete and can be dodged with a small enough <code>δ</code>. Everything left is shorter than <code>ε</code>.
</aside>

## Discontinuity at rationals

Fix rational \(a = p/q\) in lowest terms, so \(t(a) = 1/q > 0\). Irrationals are dense, so every neighborhood of \(a\) contains an irrational \(x\) with \(t(x) = 0\).

Then

\[
|t(x) - t(a)| = \frac{1}{q},
\]

which cannot be made smaller than, say, \(1/(2q)\). Hence \(t\) fails the \(\varepsilon\)–\(\delta\) definition at \(a\).

## Why it matters

- Continuity is a **pointwise** property — the set of continuity points can be weird.
- Here the continuity set is \(\mathbb{R}\setminus\mathbb{Q}\): full measure, meager, dense, and co-dense.
- Riemann integrability still holds on compact intervals (bounded, discontinuities of measure zero), which is a nice follow-on exercise.

## Takeaways

- Density of \(\mathbb{Q}\) and \(\mathbb{R}\setminus\mathbb{Q}\) is the engine of both halves.
- “Only finitely many small-denominator rationals nearby” is the continuity engine.
- Popcorn is intuition, not decoration — height really is \(1/q\).

<aside class="callout callout-info">
<strong>Source</strong>
Polished from an Overleaf project originally titled <em>Continuity of Thomae's Function (Popcorn Function)</em>, alongside related continuity-theorem notes from analysis coursework.
</aside>
