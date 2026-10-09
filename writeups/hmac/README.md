# HMAC Manim animations

Scenes live in `hmac_scenes.py` (Manim Community Edition).
The writeup (`../hash-it-twice.html`) embeds one central video: `videos/hmac_central.{mp4,webm}`.

Palette matches the portfolio Tetra light UI (`css/site.css`: `#0073EA` on `#F7F8FA`).
Fonts: Helvetica Neue + Menlo (macOS).

```bash
python3 -m venv /tmp/manim-venv
/tmp/manim-venv/bin/pip install manim
cd writeups/hmac
/tmp/manim-venv/bin/manim -qm --format=mp4 -o hmac_central.mp4 hmac_scenes.py HmacCentral
# copy from media/videos/hmac_scenes/720p30/ into videos/
ffmpeg -i videos/hmac_central.mp4 -c:v libvpx-vp9 -b:v 0 -crf 32 -an videos/hmac_central.webm
ffmpeg -ss 29 -i videos/hmac_central.mp4 -frames:v 1 -q:v 3 videos/hmac_central_poster.jpg
# list thumbnail (4:3)
/tmp/manim-venv/bin/manim -s -r 1152,864 -o hmac_thumb.png hmac_scenes.py HmacThumb
```

Scene: `HmacCentral` — the job, H(key ‖ msg) + length extension, ipad/opad, two nested hashes,
why the outer hash blocks extension, constant-time compare, outro.
