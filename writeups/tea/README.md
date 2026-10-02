# TEA Manim animations

Scenes live in `tea_scenes.py` (Manim Community Edition).
Final embeds for the writeup are in `videos/`.

```bash
python3 -m venv /tmp/manim-venv
/tmp/manim-venv/bin/pip install manim
cd writeups/tea
/tmp/manim-venv/bin/manim -qm --format=mp4 -o feistel_cycle.mp4 tea_scenes.py FeistelCycle
# copy from media/videos/tea_scenes/720p30/ into videos/
# optional: ffmpeg -i in.mp4 -c:v libvpx-vp9 -b:v 0 -crf 32 -an out.webm
```

Scenes: `TeaIntro`, `FeistelCycle`, `ShiftStir`, `DeltaPulse`, `BitDiffusion`.
