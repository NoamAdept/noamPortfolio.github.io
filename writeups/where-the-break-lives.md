---
title: Where the Break Lives
date: 2026-10-04
description: Heap exploitation Part 1 — process memory layout, why long-lived dynamic memory exists, and how brk/mmap + glibc carve the heap before freelist tricks.
series: heap
---

<aside class="callout callout-info">
<strong>Series</strong>
Part 1 of a heap notes track. This page is foundations only: address space, why the heap exists, and the syscalls underneath <code>malloc</code>. Freelists, tcache, and fastbin attacks wait for Part 2.
</aside>

Before you overflow a chunk or chase a use-after-free, you need a map. Not of glibc’s freelist zoo — of the **process** those chunks live in. Where is the binary? Where is the stack? Where does “the heap” actually sit, and who asked the kernel for those pages?

This writeup answers that, then stops at the doorway of allocator internals.

## The address space, high to low

On a typical Linux **x86-64** userspace process, virtual memory is a sparse 64-bit landscape. Exact numbers move with ASLR, but the **neighborhood** is stable enough to teach from:

```text
HIGH  0x7fffffffffff ─────────────────────────────────
      │  stack                    grows ↓
      │  vdso / vvar              kernel↔user helpers
      │  libc.so, ld-linux…       shared objects (mmap)
      │  anonymous mmap           large malloc, thread stacks…
      │  ─── often a gap ───
      │  heap (main arena)        grows ↑ via program break
      │  ELF image                .text .rodata .data .bss
LOW   0x000000000000 ─────────────────────────────────
```

![Linux x86-64 userspace layout — high addresses to low, heap between ELF and mmap](img/heap/addr-space.png)

Read it top-down once, then pin three habits:

1. **Stack grows down** (toward lower addresses) as frames push.
2. **Classic heap grows up** from the end of the data segment by moving the **program break**.
3. **Lots of “heap-ish” memory is not on the break at all** — large allocations and libraries arrive through `mmap`.

<aside class="callout callout-tip">
<strong>ASLR note</strong>
Randomization slides the stack, libc, and often the binary/heap. Relative patterns still hold: stack near the top, ELF near the bottom of the used range, heap above the binary, libraries in the mmap belt. Teaching diagrams ignore the random slide on purpose.
</aside>

## What’s inside the binary

The ELF on disk is sections; at runtime the loader maps **segments**. For intuition, these names still matter:

| Region | Role |
| --- | --- |
| **`.text`** | Machine code. Usually read + execute. |
| **`.rodata`** | String literals, `const` data. Read-only. |
| **`.data`** | Initialized globals / statics. Writable. |
| **`.bss`** | Zero-initialized globals. Writable; often grows the data segment toward the classic heap. |
| **`.plt`** | Procedure Linkage Table — stub jumps for dynamically linked calls. |
| **`.got` / `.got.plt`** | Global Offset Table — addresses the PLT fills in (lazy binding on first call is the usual story). |

Picture the image as layers:

```text
  ┌────────────── ELF mapping ──────────────┐
  │  .text     code                         │
  │  .rodata   constants                    │
  │  .plt      “call puts@plt” stubs        │
  │  .got.plt  resolved libc pointers       │
  │  .data     initialized globals          │
  │  .bss      zeroed globals               │
  └──────────────────┬──────────────────────┘
                     │  program break starts near here
                     ▼
                 classic heap
```

`.plt` / `.got` are how your binary talks to libc without baking absolute addresses at link time. They live **with the binary** (or in related mappings), not on the heap — but once you can write GOT entries, control of a resolved pointer is a late-game prize. Part 1 only needs: **dynamic linking has tables in the process image; the heap is a different region.**

## A `/proc/self/maps` shaped sketch

If you `cat /proc/self/maps` in a tiny C program, the flavor looks like this (addresses invented; order is the lesson):

```text
00400000-00401000  r-xp  …  /tmp/demo          .text
00600000-00601000  rw-p  …  /tmp/demo          .data / .bss
0192c000-0194d000  rw-p  …  [heap]             ← brk heap
7f2a8c000000-…     r-xp  …  libc.so.6
7f2a8c1eb000-…     rw-p  …  libc.so.6          libc data
7f2a8c400000-…     rw-p  …                     anonymous mmap
7ffc1a3d0000-…     rw-p  …  [stack]
7ffc1a4e6000-…     r-xp  …  [vdso]
```

Relative placement to memorize:

- **Heap** sits above the binary’s writable data, labeled `[heap]` when it’s the main break region.
- **libc / ld** sit in the shared-library / mmap band, usually far above the heap.
- **Stack** sits near the top of userspace.
- Extra **anonymous `rw-p` maps** appear for large `malloc`s, thread arenas, and other mappings — still “heap” to the programmer, not always `[heap]` to `/proc`.

## Why the heap exists

The **stack** is automatic and scoped. Locals appear when a function runs and vanish when it returns. That is perfect for small, short-lived state — and terrible for everything else.

You reach for the heap when:

- an object must **outlive** the function that created it
- the size is **unknown at compile time** (or grows)
- the allocation is **large** (stack space is limited; deep recursion + big locals ends badly)
- many objects need **independent lifetimes** (`free` A while B still lives)

```c
/* Stack: dies when parse() returns — caller cannot keep it. */
char *bad_token(void) {
    char buf[64];
    fgets(buf, sizeof buf, stdin);
    return buf;           /* dangling — don't do this */
}

/* Heap: explicit lifetime. Caller frees when done. */
char *good_token(void) {
    char *buf = malloc(64);
    if (!buf) return NULL;
    if (!fgets(buf, 64, stdin)) { free(buf); return NULL; }
    return buf;           /* lives until free(buf) */
}
```

Growable structures (vectors, hash tables, AST nodes, packet reassembly buffers) are the same story: **allocate now, free later, maybe realloc in between.** That contract — explicit lifetime — is why heap bugs are interesting. The allocator trusts you to free correctly, not double-free, and not write past the payload.

<aside class="callout callout-warn">
<strong>Stack vs heap in one line</strong>
Stack lifetime is tied to control flow. Heap lifetime is tied to <code>malloc</code>/<code>free</code> (or <code>new</code>/<code>delete</code>) — and to whatever metadata the allocator tucked beside your bytes.
</aside>

## How the kernel hands out memory

Userspace never invents pages out of thin air. The C library asks the kernel for **virtual memory mappings**, then carves those mappings into chunks.

### `brk` / `sbrk` — the program break

The **program break** is the end of the process’s data segment. Raising it adds anonymous memory after `.bss`; that region is the classic `[heap]`.

```text
  .text .data .bss |######## heap ########|  break
                   ^                      ^
                   start                  current break

  brk(new_addr)  → move the break
  sbrk(delta)    → nudge it by delta (wrapper around brk)
```

Small and medium allocations historically grow this region. Shrinking is possible but constrained — free’d chunks usually stay mapped and get reused by the allocator instead of immediately returning pages to the kernel.

### `mmap` / `munmap` — maps of their own

`mmap` creates a **new** virtual memory region (file-backed or anonymous). glibc uses it for:

- **large** allocations (above a size threshold — “mmap chunks”)
- additional **arenas** / thread heaps
- the usual loading of **shared libraries**

`munmap` tears a region down. Large freed mmap chunks can return to the kernel more eagerly than break memory.

```text
  kernel view                          allocator view
  ────────────                         ──────────────
  [heap] via brk     ─────────────►    many chunks + free lists
  anon mmap #1       ─────────────►    one large chunk (or arena)
  anon mmap #2       ─────────────►    another large chunk
  libc.so mapping    ─────────────►    not “your” malloc heap
```

So “the heap” in conversation is often **several mappings**: main break heap + mmap’d large chunks + maybe more arenas. `/proc/self/maps` only stamps `[heap]` on the break region.

## What glibc does with those pages (high level)

You call `malloc` / `free`. glibc’s **ptmalloc** (and friends) sits between you and the syscalls.

Enough vocabulary for Part 2 — nothing deeper yet:

| Idea | Meaning |
| --- | --- |
| **Arena** | An allocator heap context (main arena on the break; others often mmap’d). |
| **Chunk** | Allocator record: metadata header + payload (what you get a pointer into). |
| **In-use vs free** | Free chunks are linked into bins/caches; metadata still sits in the mapping. |
| **Carving** | The kernel gave a big `rw` region; the allocator subdivides it. |

![Conceptual glibc chunk — prev_size, size/flags, then user payload](img/heap/chunk-anatomy.png)

```text
  malloc(n)
      │
      ├─ reuse a free chunk from a cache/bin?  ──► return payload
      ├─ carve from the top chunk / wilderness?
      └─ ask kernel: brk↑  or  mmap(anonymous)
```

Two layers, always:

1. **Kernel** — virtual pages exist and have permissions (`brk` / `mmap`).
2. **Allocator** — bytes inside those pages are labeled as chunks with sizes and free-list links.

Exploit intuition starts when those two layers disagree with the programmer’s story — especially when **metadata next to your buffer** is trusted by `malloc`/`free` on the next call.

## Light teaser: why attackers stare here

You do not need freelist diagrams yet. You only need the pressure points:

- **Overflow into the next chunk** — write past your payload into a neighbor’s size/field metadata.
- **Use-after-free** — keep a dangling pointer; the chunk gets reused; your old pointer now aliases someone else’s object (or freelist linkage).
- **Wrong lifetime / double free** — allocator bookkeeping assumes a clean in-use ↔ free protocol; break the protocol and later `malloc`/`free` walks corrupted state.

```text
  [ chunk A payload | A's meta | chunk B payload | … ]
         │                ▲
         └─ overflow ─────┘   ← adjacent metadata is close
```

Part 2 will open the bins: tcache, fastbins, unsorted/small/large, consolidation, and the classic ways corrupted metadata turns into overlapping chunks or write primitives. Not today.

## What you should be able to sketch

After this page, from memory:

1. High→low map: stack, libs/mmap, heap, ELF — and which way stack/heap grow.
2. Why `.plt`/`.got` exist (dynamic linking), and that they are **not** the heap.
3. Why programs need a heap (lifetime + size).
4. That `malloc` is userspace policy on top of `brk`/`mmap`.
5. That “heap” ≠ one `/proc` line — break heap plus mmap’d pieces.

<aside class="callout callout-tip">
<strong>Next</strong>
Part 2 — <em>Bins Before Shells</em> (working title): chunk flags, freelist shapes, and the first real heap primitives. Foundations first; tricks second.
</aside>
