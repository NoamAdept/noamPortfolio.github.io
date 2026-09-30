# Noam Yakar — Portfolio

Faav-inspired portfolio:
- Home = centered profile card
- Projects = black/red project list
- Writeups = markdown posts

## Add a writeup

1. Create `writeups/my-slug.md` (optional YAML frontmatter):

```md
---
title: My writeup
date: 2026-10-01
description: One-line summary
---

# My writeup

Body in markdown…
```

2. Add an entry to `writeups/manifest.json`:

```json
{
  "slug": "my-slug",
  "title": "My writeup",
  "date": "2026-10-01",
  "description": "One-line summary"
}
```

3. Visit `/writeups/` — post URL is `writeups/post.html?slug=my-slug`.

## Stack
HTML, CSS, JavaScript · [marked](https://marked.js.org/) for markdown
