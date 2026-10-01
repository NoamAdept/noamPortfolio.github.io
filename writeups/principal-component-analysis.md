---
title: Principal Component Analysis
date: 2026-10-01
description: Dimensionality reduction from the spectral theorem — covariance, variance-maximizing directions, and when PCA fails.
series: stats & ML
---

<div class="challenge-hero" markdown="0">
  <div class="challenge-hero-copy" style="grid-column: 1 / -1">
    <p class="challenge-eyebrow">Data science · Linear algebra · polished from Overleaf</p>
    <p class="challenge-prompt">Find the directions that carry the variance — then project.</p>
  </div>
</div>

PCA is the dimensionality-reduction tool I care about most when data is wide: RNA-seq, embeddings, anything with too many correlated features. These notes polish my ASU PCA presentation into a short argument. Slides PDF: [pca-presentation.pdf](pdf/pca-presentation.pdf).

## Why PCA

High-dimensional data is expensive to train on and hard to visualize. PCA asks: **is there a lower-dimensional subspace that still carries most of the variance?**

**Wins**

- Compresses large feature sets
- 2D / 3D visualization of structure
- Soft noise reduction along low-variance axes
- Names the directions that drive spread

**Costs / failure modes**

- Linear only — nonlinear manifolds need kernel PCA / t-SNE / UMAP
- Components mix original features (interpretability drops)
- Scale-sensitive — standardize first
- Throw away too many components and you discard signal

<aside class="callout callout-warn">
<strong>When PCA fails</strong>
Nonlinear relationships. That is exactly where kernel PCA or neighborhood embeddings earn their keep.
</aside>

## Spectral theorem (the engine)

For real symmetric \(A \in \mathbb{R}^{n\times n}\),

\[
A = Q D Q^\top
\]

with \(Q\) orthogonal and \(D\) diagonal. Covariance matrices are symmetric and positive semi-definite, so they diagonalize. The eigenvectors are the variance-maximizing directions.

## Covariance matrix

Let \(X \in \mathbb{R}^{n\times d}\) be \(n\) observations of \(d\) features. Treat features as RVs \(X_1,\ldots,X_d\) with finite means and variances. The covariance matrix

\[
S =
\begin{bmatrix}
\operatorname{var}(X_1) & \operatorname{cov}(X_1,X_2) & \cdots & \operatorname{cov}(X_1,X_d) \\
\operatorname{cov}(X_2,X_1) & \operatorname{var}(X_2) & \cdots & \operatorname{cov}(X_2,X_d) \\
\vdots & \vdots & \ddots & \vdots \\
\operatorname{cov}(X_d,X_1) & \operatorname{cov}(X_d,X_2) & \cdots & \operatorname{var}(X_d)
\end{bmatrix}
\]

is symmetric PSD — hence diagonalizable.

Variance of the data along a unit vector \(a\) is the quadratic form

\[
a^\top S a.
\]

The maximizers are the **eigenvectors** of \(S\) (principal components), ordered by eigenvalue (explained variance).

<aside class="callout callout-tip">
<strong>Intuition</strong>
\(a^\top S a\) is “how spread out is the cloud when you look along \(a\)?” PCA picks the longest axes of that cloud.
</aside>

## Recipe (top to bottom)

1. Start with data \(X \in \mathbb{R}^{n\times d}\) (center / scale as needed).
2. Form the empirical covariance \(S\).
3. Choose \(k < d\); take \(P\) as the top \(k\) eigenvectors of \(S\).
4. Project: reduced data lives in the span of those columns.

Choosing \(k\): scree plot / cumulative explained variance — keep enough mass for the task, not vanity dimensions.

## Case study: gene expression

RNA-seq can measure thousands of genes per cell. PCA collapses that into a handful of components so disease / cell-type structure shows up in a plot instead of a \(d\)-dimensional fog. Same pattern shows up anywhere features are correlated and \(d \gg 1\).

## Takeaways

- PCA = spectral theorem applied to covariance.
- Principal components maximize projected variance.
- Linear tool with nonlinear escape hatches.
- Still the default preprocessing step before heavier models.

<aside class="callout callout-info">
<strong>Source</strong>
Polished from <em>PCAPRES</em> — Principal Component Analysis presentation (ASU, October 2023). Download: <a href="pdf/pca-presentation.pdf">pca-presentation.pdf</a>.
</aside>
