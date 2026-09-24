"""Convert captured preview frames to the 384 x 298 WebP library previews.

Input: PNGs written by scripts/capture-visual-previews.mjs (2x, DARK, chrome
hidden). Each frame is centre-cropped to the 192:149 library aspect and saved
at quality 84. Pass ids to convert a subset; air-atlas may come from an older
real capture when local traffic data is unavailable.
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "output" / "visual-previews"
TARGET = ROOT / "public" / "artwork" / "visuals"
IDS = ["aperture", "vertigo", "meridian", "drivey", "prtcl", "japanese-mist", "acid-orchard",
       "chromatic-silk", "atlas", "air-atlas", "discover", "stats"]


def convert(name: str) -> None:
    image = Image.open(SOURCE / f"{name}.png").convert("RGB")
    width, height = image.size
    aspect = 192 / 149
    if width / height > aspect:
        crop = round(height * aspect)
        box = ((width - crop) // 2, 0, (width - crop) // 2 + crop, height)
    else:
        crop = round(width / aspect)
        box = (0, (height - crop) // 2, width, (height - crop) // 2 + crop)
    image.crop(box).resize((384, 298), Image.LANCZOS).save(TARGET / f"{name}.webp", "WEBP", quality=84, method=6)


if __name__ == "__main__":
    for preview in sys.argv[1:] or IDS:
        convert(preview)
        print(f"{preview}.webp")
