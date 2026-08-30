#!/usr/bin/env python3
"""Render deterministic PNG and favicon derivatives from the selected SVG logo."""

from pathlib import Path
from shutil import copyfile

import cairosvg
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "logo"
PUBLIC_BRAND = ROOT / "prototype" / "drive-lab" / "public" / "brand"


def render(svg_name: str, png_name: str, size: int) -> Path:
    output = LOGO / png_name
    cairosvg.svg2png(
        url=str(LOGO / svg_name),
        write_to=str(output),
        output_width=size,
        output_height=size,
    )
    return output


def main() -> None:
    PUBLIC_BRAND.mkdir(parents=True, exist_ok=True)
    render("sedicivalvole-mark-dark.svg", "sedicivalvole-mark-dark-512.png", 512)
    render("sedicivalvole-mark-dark.svg", "sedicivalvole-mark-dark-1024.png", 1024)
    render("sedicivalvole-mark-light.svg", "sedicivalvole-mark-light-512.png", 512)
    render("sedicivalvole-mark-light.svg", "sedicivalvole-mark-light-1024.png", 1024)
    render("sedicivalvole-mark-transparent.svg", "sedicivalvole-mark-transparent-512.png", 512)
    render("sedicivalvole-mark-transparent.svg", "sedicivalvole-mark-transparent-1024.png", 1024)

    icon_paths = []
    for size in (16, 32, 48, 180, 192, 512):
        icon_paths.append(render("sedicivalvole-mark-dark.svg", f"icon-{size}.png", size))

    images = [Image.open(path).convert("RGBA") for path in icon_paths[:3]]
    try:
        images[0].save(
            LOGO / "favicon.ico",
            format="ICO",
            sizes=[(16, 16), (32, 32), (48, 48)],
            append_images=images[1:],
        )
    finally:
        for image in images:
            image.close()

    for source_name, public_name in (
        ("sedicivalvole-mark-dark.svg", "sedicivalvole-mark.svg"),
        ("icon-32.png", "favicon-32.png"),
        ("icon-180.png", "apple-touch-icon.png"),
        ("icon-192.png", "product-icon-192.png"),
        ("icon-512.png", "product-icon-512.png"),
        ("favicon.ico", "favicon.ico"),
    ):
        copyfile(LOGO / source_name, PUBLIC_BRAND / public_name)


if __name__ == "__main__":
    main()
