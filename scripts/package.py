#!/usr/bin/env python3
"""Build a Chrome Web Store ZIP from an explicit list of runtime files."""
import json
from pathlib import Path
import struct
import zipfile

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    "manifest.json", "background.js", "common.js",
    "popup.html", "popup.js", "popup.css",
    "offscreen.html", "offscreen.js",
    "recorder.html", "recorder.js",
    "permission.html", "permission.js", "page.css", "privacy.html",
    "icons/icon16.png", "icons/icon32.png", "icons/icon48.png", "icons/icon128.png",
    "LICENSE",
]

manifest = json.loads((ROOT / "manifest.json").read_text())
assert manifest["manifest_version"] == 3, "Manifest V3 is required"
assert len(manifest["description"]) <= 132, "Description exceeds the store limit"
for filename in FILES:
    assert (ROOT / filename).is_file(), f"Missing file: {filename}"
for size, filename in manifest["icons"].items():
    data = (ROOT / filename).read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", f"Not a PNG: {filename}"
    assert struct.unpack(">II", data[16:24]) == (int(size), int(size)), f"Wrong icon dimensions: {filename}"

destination = ROOT / "dist" / f"browser-recorder-{manifest['version']}.zip"
destination.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
    for filename in FILES:
        archive.write(ROOT / filename, filename)
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None, "ZIP integrity check failed"
    assert "manifest.json" in archive.namelist(), "Manifest must be at ZIP root"
print(f"Created {destination} ({destination.stat().st_size:,} bytes)")
