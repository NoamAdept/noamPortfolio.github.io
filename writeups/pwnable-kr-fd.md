---
title: pwnable.kr — fd
date: 2026-09-30
description: Toddler's Bottle · a deep dive into Linux file descriptors, setgid binaries, and forcing read() onto stdin.
series: pwnable.kr
---

<div class="challenge-hero" markdown="0">
  <img class="challenge-art" src="img/pwnable-kr/fd-challenge.png" alt="Official fd challenge art from pwnable.kr" />
  <div class="challenge-hero-copy">
    <p class="challenge-eyebrow">Toddler's Bottle · Level 1</p>
    <p class="challenge-prompt">Mommy! what is a file descriptor in Linux?</p>
    <img class="challenge-logo" src="img/pwnable-kr/pwnable-logo.png" alt="pwnable.kr" />
  </div>
</div>

[pwnable.kr](https://pwnable.kr) is a classic binary exploitation wargame. Challenges live on a real Linux box you SSH into, and the first category — **Toddler's Bottle** — teaches core OS ideas with tiny, readable C programs.

`fd` is the first bottle. There is no shellcode, no ROP, no heap gymnastics. The whole problem is: **do you know what a file descriptor is, and can you make `read()` listen to you?**

<aside class="callout callout-info">
<strong>Approach</strong>
Study <code>fd.c</code> on the box. Figure out how <code>argv[1]</code> becomes a file descriptor, which fd you can actually control, and what bytes <code>strcmp</code> expects. This writeup teaches the concepts — the exact payload and flag stay with you on the server.
</aside>

## Challenge card

| | |
| --- | --- |
| **Site** | [pwnable.kr](https://pwnable.kr) |
| **Category** | Toddler's Bottle |
| **Hint** | *Mommy! what is a file descriptor in Linux?* |
| **SSH** | `ssh fd@pwnable.kr -p2222` |
| **Password** | `guest` |
| **Idea** | Control the fd passed to `read()`, then satisfy the string check |

## Connecting

```bash
ssh fd@pwnable.kr -p2222
# password: guest
```

You land in the `fd` user's home directory on their challenge host. Everything you need is already there: the binary, the source, and a flag you cannot read yet.

<aside class="callout callout-tip">
<strong>Tip</strong>
Copy the challenge into a temp directory before experimenting — keeps your home clean and matches how most writeups demo the box:
<code>mkdir /tmp/fdplay && cp ~/fd ~/fd.c /tmp/fdplay && cd /tmp/fdplay</code>
</aside>

## Reconnaissance

Start with permissions. This is where the challenge *tells* you the privilege model:

```text
$ ls -l
-rwxr-sr-x 1 fd_pwn fd_pwn 15148  fd
-rw-r--r-- 1 root   root     418  fd.c
-r--r----- 1 fd_pwn root      50  flag
```

![Home directory listing — setgid binary, readable source, locked flag](img/pwnable-kr/fd-home.png)

Three facts jump out:

1. **`fd` is executable and setgid `fd_pwn`.** The `s` in the group-execute bit (`-rwxr-sr-x`) means: when you run it, the process's *effective group* becomes `fd_pwn`.
2. **`flag` is readable only by owner `fd_pwn` (and group `root`).** Your login user `fd` is neither, so a direct `cat` fails.
3. **`fd.c` is world-readable.** No reverse engineering required — they hand you the source.

Confirm the lock:

```text
$ cat flag
cat: flag: Permission denied
```

And zoom in on the binary:

![ls -l on the setgid fd binary](img/pwnable-kr/fd-sgid.png)

<aside class="callout callout-warn">
<strong>Why setgid matters</strong>
Your real UID/GID stay <code>fd</code>, but the effective GID becomes <code>fd_pwn</code> while the binary runs. Later the program calls <code>setregid(getegid(), getegid())</code> before <code>system("/bin/cat flag")</code>, so the spawned shell inherits that privileged group and can open <code>flag</code>.
</aside>

## Source walkthrough

```bash
$ cat fd.c
```

Read it on the box yourself — the screenshot below has the compare string covered so you practice finding it:

![fd.c source on the challenge box — strcmp target redacted](img/pwnable-kr/fd-source.png)

Skeleton (compare string intentionally omitted — open `fd.c`):

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char buf[32];

int main(int argc, char* argv[], char* envp[]){
    if (argc < 2) {
        printf("pass argv[1] a number\n");
        return 0;
    }

    /* Your number → file descriptor */
    int fd = atoi(argv[1]) - 0x1234;

    /* Read up to 32 bytes FROM that fd into buf */
    int len = 0;
    len = read(fd, buf, 32);

    /* Exact match required — including trailing newline. See fd.c. */
    if (!strcmp(/* ??? */, buf)) {
        printf("good job :)\n");
        setregid(getegid(), getegid());
        system("/bin/cat flag");
        exit(0);
    }

    printf("learn about Linux file IO\n");
    return 0;
}
```

Walk it in order:

| Step | Code | Meaning |
| --- | --- | --- |
| 1 | `argc < 2` | You must pass a number as `argv[1]`. |
| 2 | `atoi(argv[1]) - 0x1234` | Convert that string to an int, subtract hex `0x1234`, treat the result as an fd. |
| 3 | `read(fd, buf, 32)` | Kernel reads ≤32 bytes from that fd into `buf`. |
| 4 | `!strcmp(…, buf)` | Buffer must equal the exact literal in `fd.c` (watch the `\n`). |
| 5 | `setregid` + `system("…/cat flag")` | Drop into a shell with the effective group, print the flag. |

If anything fails, you get the cheeky nudge: `learn about Linux file IO`.

![Wrong / missing argv — learn about Linux file IO](img/pwnable-kr/fd-wrong.png)

## Linux file descriptors (the real lesson)

A **file descriptor** is just a small non-negative integer the kernel uses as a handle for an open file, socket, pipe, or terminal. Every process starts with three:

| fd | Name | Usual meaning |
| ---: | --- | --- |
| **0** | stdin | Keyboard / pipe input |
| **1** | stdout | Terminal output |
| **2** | stderr | Error output |

`read(2)` does not care whether the fd came from `open("file")` or was stdin from birth:

```c
ssize_t read(int fd, void *buf, size_t count);
```

So when this challenge computes an `fd` and hands it to `read`, **you choose which stream the program listens to.**

<aside class="callout callout-info">
<strong>Mental model</strong>
Think of fds as numbered doors. Door <code>0</code> already opens onto your terminal. If you can force the program to knock on door <code>0</code>, anything you type (or pipe) becomes the bytes in <code>buf</code>.
</aside>

We control that door number through:

```c
int fd = atoi(argv[1]) - 0x1234;
```

We want `fd == 0` (stdin). Solve for the argument:

```text
argv[1] - 0x1234  =  0
argv[1]           =  0x1234
argv[1]           =  ?????   (convert hex → decimal yourself)
```

![Convert 0x1234 yourself — leave the calculator warm](img/pwnable-kr/fd-math.png)

<aside class="callout callout-tip">
<strong>Quick hex check</strong>
Break it down by place values, or run <code>python3 -c 'print(0x1234)'</code> on the box. That decimal is your <code>argv[1]</code> — don't skip the conversion.
</aside>

## Exploitation (no silver platter)

You now have the map. Assemble the path yourself:

1. Choose `argv[1]` so the subtraction yields stdin (`0`).
2. When `read` blocks, send **exactly** what `strcmp` expects — pull it from `fd.c`, including the newline.
3. You should see `good job :)` and then the flag (which this post will not show).

<details class="spoiler">
<summary>Spoiler — shape of the solve (still no literals)</summary>

```bash
./fd <decimal(0x1234)>
# type the strcmp string from fd.c, then Enter

# or pipe stdin the same way — remember echo adds a newline
echo '<string from fd.c>' | ./fd <decimal(0x1234)>
```

</details>

![Successful run — argv, payload, and flag all redacted](img/pwnable-kr/fd-flag.png)

### Why the newline matters

Whatever literal sits in `fd.c` almost certainly ends with `\n`. Typing the word and hitting Enter (or using `echo`, which appends a newline by default) supplies that byte. Miss it and you are back to learning about Linux file IO.

## Flag

<aside class="callout callout-warn">
<strong>Redacted</strong>
Not published here. Run the binary on the challenge host and submit what it prints. Screenshots in this post deliberately hide argv, payload, and flag.
</aside>

## What this teaches (keep these)

- **Fds are integers.** stdin/stdout/stderr are not magic — they are `0` / `1` / `2`.
- **`read(fd, …)` is the primitive.** Once you control `fd`, you control the data source.
- **Setgid (and setuid) are the privilege story.** The binary elevates so it can read a file you cannot.
- **Hex constants in challenges are invitations.** When you see `0x1234`, convert it and ask what value zeros the expression.
- **Exact string compares are picky.** Newlines, lengths, and nulls matter — read them from the source, don't invent them.

## Next bottle

With fds in your pocket, the Toddler's Bottle list opens up — `collision`, `bof`, and friends each teach one sharp idea the same way. Same SSH style, same habit: **read the source, map the privilege bits, force the program into a state you control.**

<div class="challenge-hero challenge-hero-footer" markdown="0">
  <img class="challenge-art" src="img/pwnable-kr/fd-challenge.png" alt="fd challenge art" />
  <div class="challenge-hero-copy">
    <p class="challenge-eyebrow">Official art · pwnable.kr</p>
    <p class="challenge-prompt">Same pink porings. Next bottle when you're ready.</p>
    <img class="challenge-logo" src="img/pwnable-kr/pwnable-logo.png" alt="pwnable.kr" />
  </div>
</div>
