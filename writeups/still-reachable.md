---
title: Still Reachable
date: 2026-10-26
description: Heap notes Part 3 — memory leaks from malloc chunks to the OOM killer: why free doesn't shrink RSS, how a GC decides what's alive, exit code 137, and reading Valgrind, pprof, and heap snapshots.
series: heap
---

<aside class="callout callout-info">
<strong>Series</strong>
Part 3 of my heap notes. <a href="post.html?slug=where-the-break-lives">Part 1</a> built the map (<code>brk</code>, <code>mmap</code>, chunks). <a href="post.html?slug=someone-elses-chunk">Part 2</a> was about touching memory you no longer own. This one is the opposite bug: owning memory you never let go of.
</aside>

Most bugs fail loudly. A null pointer crashes on the first request. A typo breaks the build. You see it, you fix it, you move on.

Memory leaks don't. They pass every unit test, survive code review, and look fine in staging. Then, three days after a deploy, a production box slows to a crawl and the orchestrator kills it for blowing its memory limit. It restarts, looks healthy, and the clock starts again.

That delay is the whole danger. Cause and symptom are separated by hours, thousands of requests, and sometimes several deploys. I wanted to understand leaks all the way down — from the allocator, through the garbage collector, to the kernel deciding who dies — so this is that, plus the tools I actually use to find them.

## What a leak actually is

A memory leak is memory a program no longer needs but never gives back. Any single leak is small. The problem is that it **repeats**: once per request, per event, per loop iteration. Memory climbs and never comes back down.

How it happens depends on who manages memory:

| Model | Languages | What a leak looks like |
| --- | --- | --- |
| **Manual** | C, C++ | You never called `free()`, or lost the last pointer before you did. Nothing can reach it; nothing will clean it up. |
| **Tracing GC** | JavaScript, Java, Go, C# | You kept a reference to something you'll never use again. The GC has to assume you still want it. |
| **Refcounting** | CPython, Swift, `shared_ptr`, `Rc` | Two objects point at each other, so neither count ever hits zero. |

The line that reframed it for me: in a garbage-collected language, a leak isn't memory you forgot to *free*. It's memory you forgot to *stop referencing*. The runtime is doing exactly what you told it to.

<aside class="callout callout-tip">
<strong>Not just RAM</strong>
Same pattern, different resource: file descriptors, DB connections, sockets, threads, goroutines. A leaked connection barely costs memory — but leak enough and the pool runs dry and every request starts timing out.
</aside>

## Under `malloc`: why "free" doesn't mean "gone"

Part 1 covered how glibc gets pages from the kernel — `brk` for the main heap, `mmap` for big requests (at or above `M_MMAP_THRESHOLD`, which starts at 128 KiB and adjusts itself upward, up to 32 MiB on 64-bit). Leaks need one more layer: what happens *after* you call `free`.

You can watch the kernel side with `strace`:

```text
$ strace -e trace=brk,mmap,munmap ./app
brk(NULL)                               = 0x55d0c3a4e000
brk(0x55d0c3a6f000)                     = 0x55d0c3a6f000   ← heap grew 132 KiB
mmap(NULL, 1052672, PROT_READ|PROT_WRITE,
     MAP_PRIVATE|MAP_ANONYMOUS, -1, 0)  = 0x7f2b1c8f0000   ← one 1 MiB malloc
```

### Chunks and free lists

Inside the heap, every allocation is a **chunk**: an 8-byte size header (on x86-64), then your payload. The low bits of the size are flags — previous chunk in use, came from `mmap`, non-main arena. The minimum chunk is 32 bytes, so even `malloc(1)` costs 32.

```text
          ┌────────────────────────────┐
          │ size of chunk   │A│M│P│    │  ← 8-byte header
 ptr ───► ├────────────────────────────┤
          │ user data …                │  ← what malloc returns
          │                            │
          └────────────────────────────┘
```

`free(ptr)` almost never hands memory back to the kernel. The chunk goes onto a **free list** — tcache, fastbins, or the sorted bins — so the next `malloc` of a similar size can reuse it. Neighbouring free chunks get merged.

That's why a C leak is so final. A leaked chunk is still marked in-use. It never reaches a bin, so it can never be recycled.

### Why RSS stays high after you free

This one tripped me up for a while. Two numbers describe a process's memory:

- **VSZ** (virtual size) — all mapped address space. Cheap; none of it is RAM until touched.
- **RSS** (resident set size) — pages actually in physical RAM. The kernel only backs a page on its first write (demand paging).

Free a big burst of allocations and RSS often doesn't budge. The memory went back to *glibc's* free lists, not the kernel. glibc only trims the top of the heap once the free space there passes `M_TRIM_THRESHOLD` (128 KiB by default); holes in the middle stay mapped. `malloc_trim(0)` asks it to release what it can.

Threads make it worse. glibc creates extra **arenas** to cut lock contention — up to 8 per core on 64-bit — and each hoards its own free memory. A busy multi-threaded service can sit on gigabytes of freed-but-unreturned memory. `MALLOC_ARENA_MAX=2`, or swapping in jemalloc/tcmalloc, usually tames it.

### Fragmentation looks like a leak (but isn't)

Allocate a million 64-byte objects, free every other one. Half the memory is free — scattered in 64-byte holes. A 1 KiB request can't use any of them, so the heap grows again.

<aside class="callout callout-warn">
<strong>How I tell them apart</strong>
Leak: the <em>count of live allocations</em> keeps rising. Fragmentation: live allocations stay flat while RSS climbs. A profiler that counts allocations (Heaptrack, jemalloc's profiler) shows the difference immediately.
</aside>

## How a GC decides what's alive

A garbage collector never asks "will this be used again?" It can't know. It asks something simpler: **can the program still reach this object by following references?** If yes, it stays. That single rule explains every leak in a managed language.

### Roots, mark, sweep

Reachability starts from **GC roots** — references the runtime knows are live:

- locals and parameters in every active stack frame, on every thread
- globals and static fields
- values in CPU registers
- handles held by native code (JNI global refs)
- runtime internals: Node's module cache, loaded JVM classes, pending timers and promise callbacks

A tracing collector **marks** everything reachable from those roots, **sweeps** whatever wasn't marked, and often **compacts** the survivors together.

```text
  GC ROOTS          REACHABLE (kept alive)

  thread stack ───► Request handler ───► Response buffer

  global var ─────► sessionCache Map
                          ║ holds
                          ▼
                    Expired sessions   ← the leak:
                                         never used again,
                                         still reachable

  ┌ ─ UNREACHABLE: nothing points here ─ ─ ─ ─ ┐
    Old response buffer  → freed at next GC
  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

The old buffer gets collected because nothing points at it. The expired sessions don't, because a global `Map` still holds them. To the collector they're exactly as alive as the request being served right now.

### Generations make leaks expensive

Most objects die young — temp strings, request objects, iterators. Collectors exploit that with **generations**: new objects land in a small young generation that's collected often and cheaply; survivors get promoted to the old generation, collected less often at much higher cost. V8 runs a scavenger on the young gen and mark-compact on the old; the JVM's G1 and ZGC follow the same idea.

A leaked object survives every collection *by definition*, so it always ends up in the old gen. As that fills, the runtime runs more full collections, each scanning a bigger heap. That's where the latency spikes come from. Worst case, the JVM spends nearly all its time collecting, recovers almost nothing, and gives up:

```text
java.lang.OutOfMemoryError: GC overhead limit exceeded
```

### Refcounting and cycles

CPython, Swift's ARC, `std::shared_ptr`, and Rust's `Rc` count references instead and free at zero. Predictable, immediate — and blind to **cycles**. A → B → A never hits zero, even when nothing else can reach either.

CPython bolts on a cycle collector (the `gc` module). Swift, C++, and Rust don't, so a cycle there is permanent unless one side is weak: `weak` in Swift, `std::weak_ptr` in C++, `Weak` in Rust.

## When the kernel runs out

When a leak finally exhausts memory, the OS writes the ending. On Linux, it's abrupt.

### Overcommit: `malloc` lies

Linux overcommits by default — it lets processes reserve more memory than exists, betting most of it is never touched. The policy is `vm.overcommit_memory`:

| Value | Behaviour |
| --- | --- |
| `0` (default) | Heuristic: refuse only obviously impossible requests |
| `1` | Always allow |
| `2` | Strict: refuse once commits exceed swap + `vm.overcommit_ratio` of RAM (50% default) |

The consequence surprised me: on a default box, `malloc` almost never returns `NULL`. The allocation succeeds; the failure is postponed until you actually *touch* the pages — and by then there's no return code to check.

### Reclaim, swap, thrash

As free memory shrinks, `kswapd` starts evicting. File-backed pages go first (they can be re-read from disk), then anonymous pages — your heap — get written to swap. Leaked memory swaps out beautifully, since nobody touches it.

That sounds harmless. It isn't. The page cache shrinks, so disk reads slow down. Pages you *do* need get evicted and faulted back in. The machine starts **thrashing** — moving pages instead of running code. This is usually the moment a slow leak becomes an outage.

### The OOM killer

When reclaim can't keep up, the kernel picks a victim. Every process has a score from 0–1000 in `/proc/<pid>/oom_score`, driven mostly by RAM + swap usage. Highest score gets `SIGKILL`: no handler, no cleanup, no stack trace. Just a line in the kernel log:

```text
$ dmesg | grep -i "killed process"
Out of memory: Killed process 4127 (node) total-vm:4523712kB,
  anon-rss:3876544kB, file-rss:0kB, shmem-rss:0kB, UID:1000
  pgtables:8120kB oom_score_adj:0
```

`anon-rss` is the number to read — about 3.7 GiB of heap and other anonymous memory. You can bias the choice with `/proc/<pid>/oom_score_adj` (-1000 = never, +1000 = first). On a shared host the victim isn't always the leaker, which makes these incidents extra confusing.

### Containers and exit code 137

In containers you usually hit a limit long before the host runs dry. **cgroups v2** enforce `memory.max`; when a group hits it, the OOM killer runs *inside that cgroup only*. `memory.high` is the softer limit that throttles and forces reclaim first.

In Kubernetes, `resources.limits.memory` becomes `memory.max`. A killed container shows `OOMKilled` and exits **137** — that's 128 + 9, the signal number of `SIGKILL`. A pod restart-looping on 137 is a leak until proven otherwise.

<aside class="callout callout-warn">
<strong>The heap flag trap</strong>
<code>-Xmx</code> and Node's <code>--max-old-space-size</code> cap only the managed heap. Thread stacks, JIT code, metaspace, and native buffers live outside it. A service can sit comfortably under its heap limit and still get killed by the container. I leave 25%+ headroom between the two and monitor the container's total, not just the heap.
</aside>

## Why leaks are dangerous

It's tempting to file leaks under "uses a bit of extra RAM." Here's what they actually cost:

1. **Performance degrades first.** A growing heap means longer, more frequent GC pauses and CPU spent collecting instead of working. Once the box swaps, a fast service can get hundreds of times slower.
2. **Then the process dies.** `OutOfMemoryError`, "JavaScript heap out of memory", or a silent `SIGKILL`. In-flight requests drop; unpersisted state is gone.
3. **Crashes cascade.** Every instance in a fleet runs the same code and leaks at the same rate. One dies, its traffic shifts to the rest, their leak speeds up. A slow leak becomes a fleet-wide outage in minutes.
4. **It costs real money.** The quick fix — bigger instances, nightly restarts — works and hides the bug. Now you're paying 2–4× for RAM, forever, and nobody remembers why the cron job exists.
5. **It's a security bug.** If an attacker finds a request that leaks, they can loop it and exhaust the server on purpose — leaks that scale with input are a classic **DoS** vector and get CVEs for exactly that. Memory held too long also keeps tokens, passwords, and PII around longer, and the core dump from an OOM crash can contain all of it.
6. **It erodes trust.** On the client, the user *is* the monitoring. A 2 GB browser tab, a battery-draining app, a desktop app that gets slower the longer it's open — nobody files a heap-growth bug report. They just leave.

## The patterns

Most leaks I've seen fall into a handful of shapes. Once you know them, they jump out in review.

### The missing free (C)

The classic: an early return skips the cleanup.

```c
int process(const char *path) {
    char *buf = malloc(4096);
    FILE *f = fopen(path, "r");
    if (!f) return -1;          /* leaks buf */
    /* ... */
    fclose(f);
    free(buf);
    return 0;
}
```

Every failed open leaks 4 KB. A million bad paths is 4 GB.

### The `realloc` trap

```c
buf = realloc(buf, new_size);
if (!buf) return -1;
```

If `realloc` fails, it returns `NULL` but leaves the original block allocated — and you just overwrote your only pointer to it. Use a temporary:

```c
char *tmp = realloc(buf, new_size);
if (!tmp) { free(buf); return -1; }
buf = tmp;
```

### The unbounded cache

A map used as a cache with no size limit and no eviction. It feels like an optimization. It's a leak with a nicer name.

```javascript
const cache = new Map();

function getUser(id) {
  if (!cache.has(id)) cache.set(id, loadUser(id));
  return cache.get(id);
}
```

Fine with a few hundred users. With ten million unique IDs over a week, the process holds every user it has ever seen.

### Forgotten listeners and timers

A component subscribes to a global event and never unsubscribes. The listener's closure keeps the whole component alive, DOM nodes included.

```javascript
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);
  // missing: return () => window.removeEventListener('resize', onResize);
}, []);
```

Same thing with intervals — this one holds `widget` forever, refreshing it long after it left the page:

```javascript
function startPolling(widget) {
  setInterval(() => widget.refresh(), 1000);
}
```

### Detached DOM trees

```javascript
const rows = [];
function render(list) {
  const el = document.createElement('li');
  list.appendChild(el);
  rows.push(el);          // kept forever
}
list.innerHTML = '';      // gone from the page, not from memory
```

Each element points at its parent and siblings, so one stale reference can pin a whole subtree. DevTools labels these "Detached" in heap snapshots.

### Closures capturing too much

```javascript
function handle(request) {
  const hugePayload = request.body;   // say, 50 MB
  const id = hugePayload.id;
  return () => console.log(id);
}
```

Depending on the engine, the returned function can keep the whole scope alive, `hugePayload` included. Copy out what you need and let the rest go.

### Static collections and `ThreadLocal` (Java)

```java
public class AuditLog {
    private static final List<Event> events = new ArrayList<>();

    public static void record(Event e) {
        events.add(e);
    }
}
```

A `static` field lives as long as its classloader — usually the life of the app.

`ThreadLocal` is sneakier. Pool threads live forever, so a value you set and never `remove()` outlives the request that set it. On app servers it gets worse: if that value's class came from a web app, it pins the app's **classloader**, which pins every class it loaded, which pins every static field. Redeploy a few times and you get:

```text
java.lang.OutOfMemoryError: Metaspace
```

Always `remove()` in a `finally`.

### Smart-pointer cycles (C++, Rust)

```cpp
struct Node {
    std::shared_ptr<Node> next;
    std::shared_ptr<Node> prev;   // cycle: each node keeps its neighbour alive
};
```

Every node's count stays ≥ 1 forever, even after the list goes out of scope. Make `prev` a `std::weak_ptr`. Rust has the same problem with `Rc<RefCell<T>>` — and since leaking can't cause undefined behaviour, the language considers it *safe*. The compiler won't save you.

### Native memory behind tiny managed objects

Collectors schedule work based on *their own* heap size. Some small objects own huge amounts of memory outside it, so the GC never feels pressure to free them:

- **Node.js** — `Buffer`/`ArrayBuffer` contents live outside the V8 heap. A snapshot can look tiny while the process uses gigabytes. Check `process.memoryUsage().external` and `.arrayBuffers`.
- **Java** — a `DirectByteBuffer` is ~100 bytes on-heap but can own megabytes natively, freed only when the small object is collected. `-XX:MaxDirectMemorySize` caps it.
- **JNI** — every `NewGlobalRef` is a GC root until native code calls `DeleteGlobalRef`.

### Leaked goroutines (Go)

```go
func fetch(url string) string {
    ch := make(chan string)
    go func() { ch <- slowRequest(url) }()
    select {
    case r := <-ch:
        return r
    case <-time.After(time.Second):
        return ""   // goroutine blocks forever on send
    }
}
```

On timeout nobody reads `ch`, so the goroutine — and its stack — blocks forever. `make(chan string, 1)` or a cancellable `context` fixes it.

### Missing `Py_DECREF` (CPython extensions)

```c
PyObject *s = PyUnicode_FromString("hello");   /* new reference, count = 1 */
PyList_Append(list, s);                         /* list adds its own, count = 2 */
/* missing: Py_DECREF(s); */
```

`PyList_Append` doesn't steal your reference. Skip the `Py_DECREF` and the string outlives the list. Invisible from Python; only `tracemalloc` or a debug CPython build will show it.

### Unclosed resources

```python
def read_config(path):
    f = open(path)
    return f.read()      # handle left for the GC to *maybe* close
```

`with open(path) as f:` closes it the moment the block ends. Same story for DB connections, HTTP clients, and streams everywhere.

## Why they slip through

Leaks dodge the usual safety nets because those nets are built for a different kind of bug:

- **Tests are short.** A unit test runs for milliseconds, then the process exits and frees everything. 1 KB per call is invisible across ten calls.
- **Staging isn't prod.** Less traffic, fewer unique users, constant redeploys. A leak that needs 72 hours never gets 72 hours there.
- **Memory is noisy.** GC heaps sawtooth up and down. A slow upward trend hides in the noise unless you watch the *lows* over days.
- **The symptom points away from the cause.** The crash lands wherever the last allocation happened — usually innocent code. An OOM stack trace tells you who asked last, not who's been hoarding.
- **Restarts hide them.** Deploys, autoscaling, and crashes all reset memory. Teams that ship daily can carry a leak for months — until a holiday code freeze stops the deploys and the servers start falling over.

## Hunting one down

Two steps: prove memory is growing, then find what's holding it.

### 1. Watch the floor

In Prometheus / Datadog / CloudWatch, look at memory **after GC**, not the peaks. Healthy services have a flat floor. A floor that rises steadily over hours means something is accumulating. Two alerts worth having:

- memory above ~80% of the container limit
- >10% growth over 24 hours with no matching rise in traffic

### 2. Ask the kernel

Before opening a profiler, see what the process is really using:

```text
$ grep -E 'VmRSS|RssAnon|RssFile|VmSwap' /proc/4127/status
VmRSS:    3912448 kB
RssAnon:  3876544 kB
RssFile:    35904 kB
VmSwap:         0 kB
```

`RssAnon` is heap, stacks, and other anonymous memory — where leaks live. `RssFile` is mapped files like shared libs, which the kernel can drop and re-read. If `RssAnon` keeps climbing across samples minutes apart, it's real. `/proc/<pid>/smaps_rollup` gives more detail, and `pmap -x <pid>` lists every mapping — handy for spotting one giant anonymous region from an arena or native buffer.

### 3. Native code: Valgrind

```text
$ valgrind --leak-check=full --show-leak-kinds=all ./app
==31337== 4,096 bytes in 1 blocks are definitely lost in loss record 2 of 2
==31337==    at 0x4848899: malloc (vg_replace_malloc.c:381)
==31337==    by 0x109182: process (leak.c:3)
==31337==    by 0x1091D4: main (leak.c:12)
==31337==
==31337== LEAK SUMMARY:
==31337==    definitely lost: 4,096 bytes in 1 blocks
==31337==    indirectly lost: 0 bytes in 0 blocks
==31337==      possibly lost: 0 bytes in 0 blocks
==31337==    still reachable: 1,024 bytes in 1 blocks
```

The stack shows where the block was **allocated**, not where it should have been freed. The four categories:

| Kind | Meaning | Usually |
| --- | --- | --- |
| **Definitely lost** | No pointer to the block exists anywhere | A real leak. Fix first. |
| **Indirectly lost** | Only reachable through a block that's itself lost | Fixed by fixing its parent. |
| **Possibly lost** | Only a pointer into the *middle* of the block exists | Often a leak; sometimes pointer tricks. |
| **Still reachable** | A pointer still exists at exit | Often a global never freed — and sometimes a logical leak. |

That last row is where this post's title comes from. "Still reachable" is the GC-language leak, showing up in C.

Valgrind emulates the CPU, so it's 20–50× slower. For CI, **LeakSanitizer** is the better fit: compile with `-fsanitize=address -g` and you get a similar report at exit for roughly a 2× slowdown.

### 4. Go: diff two heap profiles

```text
$ curl -s localhost:6060/debug/pprof/heap > before.pb.gz
# ... run load for ten minutes ...
$ curl -s localhost:6060/debug/pprof/heap > after.pb.gz
$ go tool pprof -sample_index=inuse_space -base before.pb.gz after.pb.gz
(pprof) top
```

`-base` subtracts the first profile, so `top` shows only what grew. `inuse_space` counts memory still live rather than everything ever allocated. For goroutine leaks, `/debug/pprof/goroutine?debug=1` groups by stack — 40,000 goroutines parked on the same channel send points straight at the bug. Both endpoints come from importing `net/http/pprof`.

### 5. Managed heaps: retained size and dominators

Snapshot tools — Chrome DevTools, Eclipse MAT, dotMemory — show two sizes per object:

- **Shallow size** — the object itself. A `Map` might be 80 bytes.
- **Retained size** — what would be freed if it vanished, including everything only it keeps alive. That same `Map` might retain 2 GB.

Retained size comes from the **dominator tree**: A *dominates* B if every path from a root to B goes through A. Sort by retained size and the culprit is usually near the top — small shallow size, enormous retained size. That's the hoarder.

The technique that works almost everywhere:

1. Warm up the app, take a snapshot.
2. Run the suspect action ~1,000 times.
3. Force a GC, take a second snapshot.
4. Diff them (DevTools' **Comparison** view, `# Delta` column). Types that grew by ~1,000 are your leak.
5. Pick an instance and follow its **retainers** back to a root. That chain names the map, listener, or closure holding it.

Capturing from production:

- **Node.js** — start with `--heapsnapshot-signal=SIGUSR2`, then `kill -USR2 <pid>`.
- **JVM** — `jcmd <pid> GC.heap_dump /tmp/heap.hprof`, or `-XX:+HeapDumpOnOutOfMemoryError` to catch it at the moment of failure. MAT's *Leak Suspects* report reads it for you.
- **JVM native** — `-XX:NativeMemoryTracking=summary`, then `jcmd <pid> VM.native_memory summary` for threads, metaspace, code cache, and direct buffers.

<aside class="callout callout-warn">
<strong>Heap dumps are secrets</strong>
A dump is everything in memory — tokens, passwords, user data. Treat dump files like credentials and delete them when you're done.
</aside>

### Tools by ecosystem

| Ecosystem | Tools | Best for |
| --- | --- | --- |
| C / C++ | Valgrind (Memcheck), ASan / LSan, Heaptrack | Unfreed allocations + the stack that made them |
| JS (browser) | DevTools Memory panel, allocation timeline | Detached DOM, listeners, closures |
| Node.js | `--inspect` + DevTools, `heapdump`, `clinic.js` | Server-side heap growth |
| Java / JVM | VisualVM, Eclipse MAT, JFR, `jmap` | Large retained sets, statics, classloaders |
| Python | `tracemalloc`, `objgraph`, `memray` | Allocation sites, reference cycles |
| Go | `pprof` heap + goroutine profiles | Leaked goroutines, growing maps |
| .NET | dotMemory, VS Diagnostic Tools, `dotnet-dump` | Event-handler and static leaks |
| Rust | Valgrind, `heaptrack`, `dhat` | `Rc` cycles, leaked `Box`es |

The cheapest leak is the one that never ships: run tests under ASan/LSan in CI, and for managed languages add a soak test that hammers a key flow thousands of times and fails if memory grows past a threshold.

## Not writing them in the first place

Everything below is one rule wearing different clothes: **every acquisition needs a matching release, and the release should happen automatically.**

### Tie cleanup to scope

Let the language release things when a block ends instead of trusting someone to remember:

- **C++** — RAII: `std::unique_ptr` / `std::shared_ptr`, not raw `new`/`delete`
- **Rust** — ownership and `Drop`
- **Python** — `with` and context managers
- **Java** — try-with-resources for `AutoCloseable`
- **C#** — `using` for `IDisposable`
- **Go** — `defer f.Close()` right after a successful open

The C example from earlier, rewritten so cleanup can't be skipped:

```cpp
int process(const std::string& path) {
    auto buf = std::make_unique<char[]>(4096);
    std::ifstream f(path);
    if (!f) return -1;   // buf freed automatically
    /* ... */
    return 0;            // f closed, buf freed
}
```

### Bound everything that grows

Any collection keyed by input needs a max size or a TTL. Reach for an LRU — `lru-cache` in Node, `functools.lru_cache(maxsize=...)` in Python, Caffeine in Java — not a bare map. If a cache really has no limit, write down why.

### Weak references for metadata

To attach data to an object without keeping it alive: `WeakMap` / `WeakRef` in JS, `WeakHashMap` in Java, `weakref` in Python. The GC can reclaim the object once nothing else needs it.

### Teardown next to setup

Write the unsubscribe in the same place, at the same time, as the subscribe. Return a cleanup from `useEffect`. Use one `AbortController` to drop a batch of listeners. Clear every interval. Cancel every subscription when its owner dies.

### Give background work an exit

Every goroutine, thread, and async task needs a way out — a cancellable `context`, a timeout, a channel that will be closed. If I can't say how a background task ends, it probably doesn't.

### My review checklist

- [ ] Is every resource released on *every* path — errors and early returns included?
- [ ] Does any map, list, or set grow with user input? What bounds it?
- [ ] Is every listener, observer, and subscription removed when its owner goes away?
- [ ] Is every timer and interval cleared?
- [ ] Does every background task have a way to finish?
- [ ] Do closures capture only what they need?
- [ ] Are static / global collections actually necessary?

## What I keep coming back to

Leaks are dangerous not because they're complicated, but because they're **patient**. They hide in boring code — a cache with no limit, a listener nobody removed, an early return that skipped a `free()` — and wait until the system is under real load to surface somewhere unrelated.

The fix isn't heroic debugging. It's habits: tie cleanup to scope, bound what grows, write teardown next to setup, watch the memory floor, and keep heap snapshots in the toolbox for when it starts to rise.

GCs, smart pointers, and borrow checkers have erased whole classes of leaks. They haven't erased the need to think about lifetime. Every allocation should have an answer to one question: **when, and how, does this go away?**

<aside class="callout callout-tip">
<strong>Back to the start</strong>
If the chunk and <code>brk</code>/<code>mmap</code> parts went fast, <a href="post.html?slug=where-the-break-lives">Part 1 — Where the Break Lives</a> draws the full process map they sit on.
</aside>
