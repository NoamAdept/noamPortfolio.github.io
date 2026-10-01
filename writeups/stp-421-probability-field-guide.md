---
title: STP 421 probability field guide
date: 2026-10-01
description: Polished final-review notes — probability spaces through the CLT, the map I actually use.
series: stats & ML
---

<div class="challenge-hero" markdown="0">
  <div class="challenge-hero-copy" style="grid-column: 1 / -1">
    <p class="challenge-eyebrow">STP 421 · Probability · polished from Overleaf</p>
    <p class="challenge-prompt">From \((\Omega, \mathcal{F}, P)\) to the Central Limit Theorem — one shelf of tools.</p>
  </div>
</div>

These are my STP 421 final-review notes, rewritten into a field guide. Full PDF: [stp-421-final-review.pdf](pdf/stp-421-final-review.pdf).

## Probability space

A probability space is the triple \((\Omega, \mathcal{F}, P)\):

- \(\Omega\) — sample space (all outcomes)
- \(\mathcal{F}\) — \(\sigma\)-algebra of events (\(\emptyset, \Omega \in \mathcal{F}\); closed under complements and countable unions)
- \(P : \mathcal{F} \to [0,1]\) — probability measure with \(P(\emptyset)=0\), \(P(\Omega)=1\), and countable additivity on disjoint events

**Conditional probability.** For \(P(B)>0\),

\[
P(A\mid B) = \frac{P(A\cap B)}{P(B)}.
\]

Multiplication rule and independence follow from that definition. Independence of a collection means every finite subcollection multiplies.

**Law of total probability.** If \(\{F_i\}\) partitions \(\Omega\),

\[
P(E) = \sum_i P(E\mid F_i)\,P(F_i).
\]

**Bayes.**

\[
P(A\mid B) = \frac{P(A)\,P(B\mid A)}{P(B)},
\]

with the denominator expanded via total probability when useful.

## Discrete random variables

A discrete RV maps outcomes to a countable value set \(E\), with PMF \(p_X\).

\[
\mathbb{E}[X] = \sum_{x\in E} x\,p_X(x), \qquad
\operatorname{Var}(X) = \mathbb{E}[X^2] - (\mathbb{E}[X])^2.
\]

**LOTUS:** \(\mathbb{E}[f(X)] = \sum_x f(x)\,p_X(x)\).

| Law | Shape | Mean / Var |
| --- | --- | --- |
| Bernoulli\((p)\) | \(P(X=1)=p\) | \(p\), \(p(1-p)\) |
| Binomial\((n,p)\) | \(\binom{n}{k}p^k(1-p)^{n-k}\) | \(np\), \(np(1-p)\) |
| Geometric\((p)\) | \((1-p)^{k-1}p\) (first success at \(k\)) | \(\frac{1-p}{p}\), \(\frac{1-p}{p^2}\) — memoryless |
| Poisson\((\lambda)\) | \(e^{-\lambda}\lambda^k/k!\) | \(\lambda\), \(\lambda\) — Binomial limit with \(p=\lambda/n\) |

**PGF.** \(\varphi_X(s)=\mathbb{E}[s^X]\). Same PGF \(\iff\) same law on \(\mathbb{N}_0\). Independent sums multiply PGFs.

**Conditional expectation / LOIE.** \(\mathbb{E}[X]=\mathbb{E}[\mathbb{E}[X\mid Y]]\).

<aside class="callout callout-tip">
<strong>Exam move</strong>
Name the Bernoulli kernel first. Binomial / Geometric / Poisson are stories built on that coin.
</aside>

## Continuous random variables

CDF \(F(x)=P(X\le x)\): nondecreasing, right-continuous, limits \(0\) and \(1\). Continuous RVs have density \(p\) with \(F(b)-F(a)=\int_a^b p\), and \(p=F'\) where differentiable.

\[
\mathbb{E}[X]=\int_{-\infty}^{\infty} x\,p(x)\,dx, \qquad
\mathbb{E}[f(X)]=\int f(x)\,p(x)\,dx.
\]

Useful families from the notes:

- Uniform\((a,b)\): flat density \(1/(b-a)\); \(\mathbb{E}=\frac{a+b}{2}\), \(\operatorname{Var}=\frac{(b-a)^2}{12}\)
- Gamma / Beta via \(\Gamma\) and \(\beta\), with \(\beta(a,b)=\Gamma(a)\Gamma(b)/\Gamma(a+b)\)
- Exponential\((\lambda)\): waiting times; \(\mathbb{E}=1/\lambda\); **memoryless** \(P(X>t+s\mid X>t)=P(X>s)\)
- Normal\((\mu,\sigma^2)\): MGF of \(N(0,1)\) is \(e^{t^2/2}\)

**MGF.** \(\varphi_X(t)=\mathbb{E}[e^{tX}]\). Derivatives at \(0\) recover moments; independent sums multiply MGFs. The “same law after \(\sqrt{2}\) average of i.i.d. centered unit-variance copies” characterization yields the Gaussian MGF.

## Covariance, sample means, inequalities

\[
\operatorname{Cov}(X,Y)=\mathbb{E}[XY]-\mathbb{E}[X]\mathbb{E}[Y].
\]

Independence \(\Rightarrow\) uncorrelated; converse fails. For IID with mean \(\mu\) and variance \(\sigma^2\),

\[
\mathbb{E}[\bar X_n]=\mu, \qquad \operatorname{Var}(\bar X_n)=\frac{\sigma^2}{n}.
\]

**Markov** (nonnegative \(X\)): \(P(X>t)\le \mathbb{E}[X]/t\).  
**Chebyshev:** \(P(|X-\mu|>t)\le \sigma^2/t^2\).

## Convergence → LLN → CLT

Strength order from the notes:

\[
\text{a.s.} \Rightarrow \text{in probability} \Rightarrow \text{in distribution} \leftrightarrow \text{weak}.
\]

**WLLN.** IID finite mean/variance \(\Rightarrow\) \(\bar X_n \to \mu\) in probability (Chebyshev + \(\operatorname{Var}(\bar X_n)=\sigma^2/n\)).

**SLLN.** Same hypotheses \(\Rightarrow\) almost-sure convergence (stronger).

**CLT.** With \(\sigma>0\),

\[
Z_n = \frac{\sum_{i=1}^n (X_i-\mu)}{\sigma\sqrt{n}} \xrightarrow{d} N(0,1).
\]

<aside class="callout callout-info">
<strong>Source</strong>
Polished from <em>STP 421 Final Review</em> (May 2023, Overleaf). Download the original: <a href="pdf/stp-421-final-review.pdf">stp-421-final-review.pdf</a>.
</aside>
