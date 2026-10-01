---
title: Fixed-key Feistel recovery
date: 2026-10-01
description: Crypto notes — when a Feistel network reuses one round key, intermediate leaks give the key away.
series: course notes
---

<div class="challenge-hero" markdown="0">
  <div class="challenge-hero-copy" style="grid-column: 1 / -1">
    <p class="challenge-eyebrow">Crypto · CSE 494 / research notes · polished from Overleaf</p>
    <p class="challenge-prompt">No key schedule means the “round function” is a repeating confession.</p>
  </div>
</div>

A classical Feistel round splits the state \((L, R)\) and updates

\[
L' = R, \qquad R' = L \oplus F(R, K_i).
\]

If every round reuses the **same** key \(K\) (no schedule), and you can observe or force intermediate values, the cipher stops being a black box. These notes polish an Overleaf “Feistel Attack” write-up into the attack shape behind [leakyFeistel](https://github.com/NoamAdept/leakyFeistel).

## What goes wrong

With distinct round keys, \(F(\cdot, K_i)\) changes each round. With a fixed key:

- The same \(F_K\) is applied repeatedly.
- Differences / chosen inputs that cancel in one round cancel the same way in others.
- Any leak of an intermediate \(F_K(R)\) is a direct oracle for \(K\) if \(F\) is invertible in the key, or searchable if \(K\) is small.

<aside class="callout callout-warn">
<strong>Teaching point</strong>
Key schedules exist so that compromising one round does not automatically compromise every round. Fixed-key Feistel is a lab toy that makes that lesson visceral.
</aside>

## Attack sketch (chosen plaintext)

1. Choose plaintexts that fix one half of the block so \(R\) is known going into a round.
2. Read (or algebraically isolate) the value \(F(R, K)\).
3. Recover \(K\) by inverting \(F\) in the key coordinate, or by brute force if the key space is toy-sized.
4. Replay the same \(K\) through the remaining rounds to decrypt.

Exact algebra depends on \(F\). In the companion C++ demo, carefully chosen inputs make intermediate state print the information you need — the Overleaf notes were the proof outline; the repo is the executable footnote.

## Why Feistel usually survives

- **Diffusion across rounds** with independent \(K_i\).
- **Incomplete information** about intermediates in a real implementation (no debug dumps).
- **Larger keys / better \(F\)** so step 3 is not free.

Strip those away for a homework cipher and the “attack” is an afternoon.

## Linked work

- Implementation / demo: [NoamAdept/leakyFeistel](https://github.com/NoamAdept/leakyFeistel)
- Course variant: `cse494Feistel` (Feistel with a proper schedule for contrast)

## Takeaways

- Round keys must **evolve**.
- Intermediate leaks are first-class attacker data.
- A cipher can be “Feistel-shaped” and still fail Crypto 101.

<aside class="callout callout-info">
<strong>Source</strong>
Polished from Overleaf projects <em>Feistel Attack</em> and related CSE 494 notes; aligned with the public leakyFeistel repository.
</aside>
