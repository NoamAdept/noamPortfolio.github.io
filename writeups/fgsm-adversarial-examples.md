---
title: FGSM and adversarial examples
date: 2026-10-01
description: ML security notes — fast gradient sign method and why tiny perturbations flip classifiers.
series: course notes
---

<div class="challenge-hero" markdown="0">
  <div class="challenge-hero-copy" style="grid-column: 1 / -1">
    <p class="challenge-eyebrow">Adversarial ML · polished from Overleaf</p>
    <p class="challenge-prompt">A perturbation smaller than sensor noise can erase a correct label.</p>
  </div>
</div>

Neural nets are differentiable — which means an attacker with access to gradients can walk an image off its decision region. The **Fast Gradient Sign Method (FGSM)** is the one-step version of that idea. These notes polish Overleaf projects (**adversarial nn**, **fgsm**) into a short briefing aligned with [perturbedNN](https://github.com/NoamAdept/perturbedNN).

## Setup

Classifier \(f_\theta\), loss \(\mathcal{L}\), clean input \(x\) with label \(y\). We want \(x'\) close to \(x\) (often \(\|x'-x\|_\infty \le \varepsilon\)) such that \(\arg\max f_\theta(x') \neq y\).

## FGSM in one line

\[
x' = x + \varepsilon \cdot \mathrm{sign}\big(\nabla_x \mathcal{L}(f_\theta(x), y)\big).
\]

Interpretation: move every pixel in the direction that **increases** loss the fastest under an \(\ell_\infty\) budget.

<aside class="callout callout-info">
<strong>Why sign?</strong>
Under an <code>∞</code>-norm ball, the optimum linear step puts full budget on every coordinate — the sign of the gradient.
</aside>

## What the Overleaf labs emphasized

- **White-box vs black-box** — FGSM assumes gradients; transfer attacks approximate them.
- **Targeted vs untargeted** — flip to *any* wrong class vs a chosen class (sign flips / different loss).
- **Defenses are brittle** — adversarial training helps; simple input smoothing often fails adaptive attacks.
- **Perception gap** — \(\varepsilon\) imperceptible to humans can be fatal to the net.

## Minimal experiment checklist

1. Train or load a small CNN on MNIST / CIFAR.
2. Implement FGSM with a few \(\varepsilon\) values.
3. Plot accuracy vs \(\varepsilon\) and show example pairs \((x, x')\).
4. Optional: iterative FGSM / PGD and compare.

## Takeaways

- Differentiability is an attack surface.
- Norm choice (\(\ell_\infty, \ell_2\)) changes the craft of the perturbation.
- Robustness is a first-class evaluation target, not a footnote.

<aside class="callout callout-info">
<strong>Source</strong>
Polished from Overleaf <em>adversarial nn</em> and <em>fgsm</em>; survey code in perturbedNN.
</aside>
