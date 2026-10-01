---
title: Diffie–Hellman weak-parameter CTF notes
date: 2026-10-01
description: Crypto CTF notes — small primes, reused secrets, and other ways DHKE falls over in challenges.
series: course notes
---

<div class="challenge-hero" markdown="0">
  <div class="challenge-hero-copy" style="grid-column: 1 / -1">
    <p class="challenge-eyebrow">Crypto CTF · polished from Overleaf</p>
    <p class="challenge-prompt">Diffie–Hellman is hard — until the parameters are a joke.</p>
  </div>
</div>

Diffie–Hellman key exchange is secure under honest parameter choices. CTF modules love dishonest ones. These notes polish an Overleaf **Diffie Hellman CTF** project into a field guide for the failure modes also explored in [diffie-culty](https://github.com/NoamAdept/diffie-culty.github.io).

## The honest protocol

Public: prime \(p\), generator \(g\).

- Alice: secret \(a\), sends \(A = g^a \bmod p\)
- Bob: secret \(b\), sends \(B = g^b \bmod p\)
- Shared: \(K = B^a = A^b = g^{ab} \bmod p\)

Security intuition: discrete log in a large prime-order subgroup is hard.

## Failure modes CTFs actually ship

| Weakness | What you do |
| --- | --- |
| Tiny \(p\) | Brute discrete log / baby-step giant-step |
| Smooth order | Pohlig–Hellman: break DL in subgroups, CRT together |
| \(g\) of tiny order | Shared key lives in a microscopic set — enumerate |
| Reused secret across sessions | Related-key / static-DH leaks |
| Bad RNG on \(a,b\) | Predict or narrow the secret |
| Missing auth | MITM: relay \(A', B'\) and terminate both sides |

<aside class="callout callout-tip">
<strong>First question in any DH challenge</strong>
Factor <code>p-1</code>. If it is smooth, Pohlig–Hellman is the main character.
</aside>

## Worked mindset (no spoilers)

1. Parse the challenge parameters — print bit-lengths, factor \(p-1\).
2. Classify: small field, smooth order, subgroup confinement, or protocol bug.
3. Only then write the solver (`sage` / `pwntools` / CRT glue).

The Overleaf deck walked examples of each class; the public CTF site turns them into interactive labs.

## Takeaways

- Hardness assumptions are **parameterized** — name the group.
- “We used DH” is not a security claim without sizes and validation.
- Protocol bugs (no auth) beat algebra when present.

<aside class="callout callout-info">
<strong>Source</strong>
Polished from Overleaf <em>Diffie Hellman CTF</em>; companion labs at diffie-culty.github.io.
</aside>
