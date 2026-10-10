---
title: The Bird in the Stack
date: 2026-10-10
description: Building libCanary — a real, custom stack-canary library — and watching the same buffer overflow hijack a program with no protection, then get caught cold once the canary is in place.
series: mitigations
---

Coal miners used to carry a canary in a cage. The bird was more sensitive to
toxic gas than a person, so if it keeled over, you still had time to get out.
A **stack canary** is the same trick in software: plant a small, fragile value
in a dangerous spot, and if something ever tramples it, you know an attack is
underway *before* it can do real harm.

This is the story of [**libCanary**](https://github.com/NoamAdept/libCanary) —
turning that idea into a real, linkable C library you can use to harden your own
binaries — and a demo you can run to watch the mitigation earn its keep.

<aside class="callout callout-info">
<strong>Who this is for</strong>
Students who have heard "stack canary" and "-fstack-protector" thrown around and
want to see exactly what they are, written out in about 120 lines of C you can
read top to bottom.
</aside>

## The bug a canary defends against

Here is the entire problem, in five lines:

```c
void greet(const char *name) {
    char buf[32];
    strcpy(buf, name);     // no length check — writes until it hits a '\0'
    printf("hello, %s\n", buf);
}
```

`strcpy` copies until it finds a null byte. If `name` is longer than 32 bytes,
it keeps writing **past the end of `buf`**, straight up the stack. And the stack
is not empty space — it holds the bookkeeping the CPU needs to get back to where
it was called from.

```text
higher addresses
   [ saved return address ]   <- where the CPU jumps when greet() finishes
   [ saved frame pointer  ]
   [ buf[32]              ]   <- strcpy starts writing here, grows upward
lower addresses
```

Overflow `buf` far enough and you overwrite the **saved return address**. When
`greet` returns, the CPU jumps to whatever you wrote there. That is the classic
stack-smash: one missing bounds check hands an attacker control over where the
program goes next.

## The idea: a tripwire in front of what matters

What if we put a secret value *between* the buffer and the return address, and
checked it was still intact right before returning?

```text
   [ saved return address ]
   [  🐤 canary (secret)  ]   <- any overflow must cross this first
   [ buf[32]              ]
```

A linear overflow can't reach the return address without going through the
canary. So if the canary still holds its secret value at the end of the
function, the return address is safe. If it changed, something ran off the end
of a buffer — abort immediately, before the corrupted return address is ever
used. That is precisely what the compiler flag `-fstack-protector` does for you.
libCanary builds it by hand so you can see every piece.

## Piece 1 — a secret worth guarding

A canary only works if an attacker can't guess it. So the value is random,
chosen once per process from the operating system's cryptographic RNG:

```c
/* getrandom(2) -> /dev/urandom -> ASLR-seeded fallback */
if (!fill_random(&secret, sizeof secret)) { /* ... mix in runtime entropy ... */ }

/* Force the least-significant byte to 0x00 — a "terminator canary". */
secret &= ~(uint64_t)0xFF;
```

That last line is a lovely detail worth pausing on. String functions like
`strcpy` stop at the first null byte (`0x00`). By forcing the canary's lowest
byte to zero, we make sure an attacker overflowing *with a string* can't
faithfully write the canary back — their copy halts the moment it emits that
null. glibc's real canary uses the same trick.

## Piece 2 — two ways to plant it

libCanary gives you two tools. The first is the **textbook frame canary** —
exactly what the compiler emits — as two macros:

```c
void risky(const char *in) {
    LC_GUARD;                        // plant the cookie at function entry
    char name[32];
    strncpy(name, in, sizeof name - 1);
    name[sizeof name - 1] = '\0';
    LC_VERIFY();                      // check it right before returning
}
```

`LC_GUARD` drops a local `volatile uint64_t` initialised to the secret;
`LC_VERIFY()` compares it against the secret again and aborts on a mismatch.

The second tool is a **guarded buffer** — a redzone that sits in memory
*immediately after* a specific buffer, so it catches a linear overflow no matter
how the compiler happened to arrange the stack:

```c
void handle(const char *in) {
    LC_GUARDED(buf, 32);             // 32-byte buffer + a trailing guard word
    strcpy((char *)buf.data, in);    // untrusted copy
    lc_buf_check(&buf);               // aborts cleanly if the guard was hit
    puts((char *)buf.data);
}
```

Under the hood `LC_GUARDED` is just a struct — `{ unsigned char data[32]; uint64_t guard; }`
— with `guard` armed to the secret. Because `guard` lives right after `data`,
any overflow that runs off the end of `data` has to clobber it. Deterministic,
and easy to reason about.

## Piece 3 — failing loudly, and safely

When a guard is found broken, we do **not** quietly return:

```c
void lc_report_and_abort(const char *where) {
    /* raw write(), not printf — stdio buffers may already be corrupted */
    (void)!write(STDERR_FILENO, "*** libcanary: stack corruption detected ...", ...);
    abort();   // SIGABRT — never return into a frame we no longer trust
}
```

This is called **failing closed**: a detected attack ends the program rather
than letting it limp forward into attacker-controlled territory. A crash you
caused on purpose is a far better outcome than a silent hijack.

## The payoff: watch it happen

The repo ships a demo that compiles one program **twice** from identical source
— once with no protection, once hardened with libCanary — so you can see the
difference directly. `make run-demo` builds and runs the whole comparison.

### Demo 1 — hijacking a function pointer

The vulnerable function keeps a 16-byte buffer with a function pointer right
after it, and overflows the buffer onto the pointer:

```text
UNPROTECTED
  [!!]  danger_action(): ATTACKER-CONTROLLED CODE IS NOW RUNNING.
  [!!]  In a real program this is where a shell would spawn.

PROTECTED (libcanary)
  *** libcanary: stack corruption detected in handle() — aborting ***
  [killed by signal 6 — SIGABRT]
```

Same overflow, same input. Without the canary, the overwritten pointer gets
called and attacker code runs. With it, the guard between the buffer and the
pointer is checked *before* the call, the corruption is spotted, and the program
aborts before the hijacked pointer is ever used.

### Demo 2 — the classic strcpy smash

An 80-byte name copied into a 32-byte buffer:

```text
UNPROTECTED, 80-byte input
  [killed by signal 11 — SIGSEGV]        # smashed the return address, crashed

PROTECTED (libcanary), same 80-byte input
  *** libcanary: stack corruption detected in guarded buffer — aborting ***
  [killed by signal 6 — SIGABRT]         # caught, clean, deliberate
```

The unprotected build corrupts its saved return address and dies with a
segfault when it tries to return — messy and, in a real bug, potentially
exploitable. The protected build turns that into a clear, deliberate abort with
a diagnostic that tells you exactly what happened.

<aside class="callout callout-tip">
<strong>Why the demos build with <code>-fno-stack-protector</code></strong>
So that libCanary is unambiguously the <em>only</em> canary in play. Otherwise
the compiler's own protector would also fire and you couldn't tell which guard
caught the overflow.
</aside>

## What a canary does *not* do

Honesty matters more than a tidy ending. A canary is one layer, not a cure:

- It **detects** corruption after the fact; it doesn't prevent the out-of-bounds
  write itself. The fix for the bug is still to bound your copies.
- It guards against **linear** overflows that run past a buffer. An attacker who
  can write to an arbitrary offset (skipping over the canary) can sidestep it.
- If the secret leaks — through a separate info-leak bug — it can be forged.

That is why the canary is step one of a stack, not the whole stack. In
production you still compile with `-fstack-protector-strong` **and**
`-D_FORTIFY_SOURCE=2`, prefer bounded APIs (`fgets`, `snprintf`) over `gets` and
`strcpy`, and layer ASLR and non-executable stacks on top. libCanary exists to
make the canary layer legible — not to replace the others.

## Try it

```bash
git clone https://github.com/NoamAdept/libCanary
cd libCanary
make lib        # build the static library, libcanary/libcanary.a
make test       # run the unit tests
make run-demo   # watch the before/after exploitation demo
```

The whole mitigation is in
[`libcanary/canary.c`](https://github.com/NoamAdept/libCanary/blob/main/libcanary/canary.c)
— around 120 lines, written to be read. If you have smashed a stack in a CTF and
wondered what the defenders were doing on the other side, this is it.

## What this taught me

- **A mitigation is often simpler than the attack it stops.** The canary is one
  random number and one comparison.
- **Fail closed.** A crash you chose beats a hijack you didn't.
- **Small details carry weight** — the null terminator byte in the secret is a
  single line that defeats a whole class of string-copy forgeries.
- **Name your layers.** Knowing what a canary does *not* cover is what tells you
  which other defenses you still need.
