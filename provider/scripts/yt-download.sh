#!/usr/bin/env bash
# Download the audio of one or more YouTube videos as mp3 into provider/mock.
# Usage: ./scripts/yt-download.sh <url> [url...]
# Env: OUT_DIR (output directory), OUTPUT (yt-dlp output template, default "%(title)s.%(ext)s")
# Requires: yt-dlp, ffmpeg

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${OUT_DIR:-$SCRIPT_DIR/../mock}"
OUTPUT="${OUTPUT:-%(title)s.%(ext)s}"

if [ "$#" -eq 0 ]; then
	echo "Usage: $0 <url> [url...]" >&2
	exit 1
fi

for bin in yt-dlp ffmpeg; do
	if ! command -v "$bin" >/dev/null 2>&1; then
		echo "Missing dependency: $bin" >&2
		exit 1
	fi
done

mkdir -p "$OUT_DIR"

yt-dlp \
	--extract-audio \
	--audio-format mp3 \
	--audio-quality 0 \
	--embed-thumbnail \
	--embed-metadata \
	--no-playlist \
	--output "$OUT_DIR/$OUTPUT" \
	"$@"
