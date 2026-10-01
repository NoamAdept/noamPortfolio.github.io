---
title: Three golden proofs
date: 2026-10-01
description: A short shelf of elegant proofs worth keeping — infinity of primes, √2 irrational, and uncountability of ℝ.
series: course notes
---

<div class="challenge-hero" markdown="0">
  <div class="challenge-hero-copy" style="grid-column: 1 / -1">
    <p class="challenge-eyebrow">Proof craft · polished from Overleaf</p>
    <p class="challenge-prompt">Three arguments that teach how mathematicians think.</p>
  </div>
</div>

Not every homework set deserves a write-up. **Three Golden Proofs** did — a pocket Overleaf of arguments that stay sharp for life. Here they are cleaned up for quick revisit.

## 1. Infinitely many primes (Euclid)

Suppose there are finitely many primes \(p_1,\ldots,p_k\). Form

\[
N = p_1 p_2 \cdots p_k + 1.
\]

\(N > 1\), so it has a prime factor \(q\). But \(q\) cannot be any \(p_i\) (each leaves remainder \(1\)). Contradiction. Hence there are infinitely many primes.

<aside class="callout callout-tip">
<strong>Style note</strong>
The proof never constructs the “next” prime explicitly — it only shows the finite list cannot be complete.
</aside>

## 2. \(\sqrt{2}\) is irrational

Assume \(\sqrt{2} = p/q\) in lowest terms. Then \(p^2 = 2q^2\), so \(p^2\) is even ⇒ \(p\) even. Write \(p = 2r\): \(4r^2 = 2q^2 ⇒ q^2 = 2r^2\), so \(q\) even. Then \(p\) and \(q\) share a factor \(2\), contradicting lowest terms.

## 3. \(\mathbb{R}\) is uncountable (Cantor)

Suppose \(f: \mathbb{N} \to (0,1)\) were a bijection. Write each \(f(n)\) in decimal (avoid dual expansions carefully). Build \(x = 0.d_1 d_2 d_3\ldots\) with \(d_n \neq\) the \(n\)th digit of \(f(n)\) (and \(d_n \notin \{0,9\}\)). Then \(x\) differs from every listed value — not in the image. Contradiction.

## Why keep them

- Contradiction + construction patterns show up everywhere (crypto hardness proofs, complexity separations, analysis).
- They calibrate taste: short hypotheses, violent conclusions.

<aside class="callout callout-info">
<strong>Source</strong>
Polished from Overleaf <em>Three Golden Proofs</em>, collected during proof-oriented coursework.
</aside>
