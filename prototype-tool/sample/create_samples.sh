#!/bin/bash

# --- Configuration ---
# The full path to the video file you want to extract samples from.
# IMPORTANT: Update this path to match your video file location.
VIDEO_FILE="G:/共有ドライブ/kame.drive/Videos/OBS/2025-08-07_21-16-02.mp4"

# The directory where the output samples will be saved.
OUTPUT_DIR="prototype-tool/sample/audio/"

# The number of random samples to create.
NUM_SAMPLES=10

# The duration of each sample clip in seconds.
CLIP_DURATION=60
# --- End of Configuration ---

# Ensure the output directory exists
mkdir -p "$OUTPUT_DIR"

echo "Getting video duration..."
# Get the total duration of the video in seconds.
# The result from ffprobe might be a float (e.g., 3412.50), so we cut off the decimal part.
DURATION_FLOAT=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$VIDEO_FILE")
if [ -z "$DURATION_FLOAT" ]; then
    echo "Error: Could not get video duration. Check the path to your VIDEO_FILE."
    exit 1
fi
DURATION_INT=${DURATION_FLOAT%.*}
echo "Video duration: $DURATION_INT seconds."

# Calculate the latest possible start time for a clip.
MAX_OFFSET=$((DURATION_INT - CLIP_DURATION))

echo "Starting to create $NUM_SAMPLES samples..."

for i in $(seq 1 $NUM_SAMPLES)
do
  # Generate a random start time within the valid range.
  RANDOM_OFFSET=$(($RANDOM % MAX_OFFSET))

  # Create a zero-padded filename (e.g., sample_01.mp3, sample_02.mp3).
  # The user requested sample_XX_XX.mp3, this script creates sample_XX.mp3.
  # This can be easily changed if a different naming scheme is needed.
  OUTPUT_FILENAME=$(printf "sample_%02d.mp3" $i)
  FULL_OUTPUT_PATH="$OUTPUT_DIR/$OUTPUT_FILENAME"

  echo "($i/$NUM_SAMPLES) Creating '$FULL_OUTPUT_PATH' from ${RANDOM_OFFSET}s..."

  # Run ffmpeg to extract the clip.
  # -hide_banner -loglevel error: Reduces the amount of text ffmpeg prints.
  # -y: Overwrites the output file if it already exists.
  ffmpeg -hide_banner -loglevel error -ss $RANDOM_OFFSET -i "$VIDEO_FILE" -t $CLIP_DURATION -filter_complex "[0:a]amix" -y "$FULL_OUTPUT_PATH"
done

echo "Done. All samples created in '$OUTPUT_DIR'."
