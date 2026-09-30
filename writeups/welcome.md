---
title: Welcome to writeups
date: 2026-09-30
description: How to add new markdown writeups to this site.
---

# Welcome to writeups

Drop a `.md` file in `writeups/`, then add an entry to `writeups/manifest.json`.

## Steps

1. Create `writeups/my-post.md` (optional YAML frontmatter at the top).
2. Append to `manifest.json`:

```json
{
  "slug": "my-post",
  "title": "My post title",
  "date": "2026-10-01",
  "description": "One-line summary for the list."
}
```

3. Open `/writeups/` — it should show up. The post URL is `post.html?slug=my-post`.

`slug` must match the filename without `.md`.
