# TEA Manim animations

Scenes live in `tea_scenes.py` (Manim Community Edition).
The writeup embeds one central video: `videos/tea_central.{mp4,webm}`.

Palette matches the portfolio Tetra light UI (`css/site.css`: `#0073EA` on `#F7F8FA`).

```bash
python3 -m venv /tmp/manim-venv
/tmp/manim-venv/bin/pip install manim
cd writeups/tea
/tmp/manim-venv/bin/manim -qm --format=mp4 -o tea_central.mp4 tea_scenes.py TeaCentral
# copy from media/videos/tea_scenes/720p30/ into videos/
# optional: ffmpeg -i in.mp4 -c:v libvpx-vp9 -b:v 0 -crf 32 -an out.webm
# poster: ffmpeg -ss 00:00:02 -i tea_central.mp4 -frames:v 1 tea_central_poster.jpg
```

Scene: `TeaCentral` — intro, pieces, one cycle, stir, delta, key-sibling idea, outro.
