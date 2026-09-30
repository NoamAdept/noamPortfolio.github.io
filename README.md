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
series: pwnable.kr
---

# My writeup

Body in markdown…

![screenshot](img/pwnable-kr/example.png)
```

Images go under `writeups/img/…` and are referenced with relative paths from the post.

2. Add an entry to `writeups/manifest.json` (optional `series` groups the list):

```json
{
  "slug": "my-slug",
  "title": "My writeup",
  "date": "2026-10-01",
  "description": "One-line summary",
  "series": "pwnable.kr"
}
```

3. Visit `/writeups/` — post URL is `writeups/post.html?slug=my-slug`.

Current series: **pwnable.kr** (starts with `fd`).

## Stack
HTML, CSS, JavaScript · [marked](https://marked.js.org/) for markdown

GitHub Pages: `.nojekyll` is required so frontmatter Markdown files are served as static assets (otherwise Jekyll hides them and posts 404).
