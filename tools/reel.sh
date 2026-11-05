#!/usr/bin/env bash
# Usage: tools/reel.sh out.mp4 slide1.png slide2.png ...   -> 9:16 1080x1920 MP4, ~3.5s per slide, slow zoom + crossfades
set -euo pipefail
out=$1; shift; n=$#; D=3.5; F=0.5; i=0; args=(); filt=""
for img in "$@"; do
  args+=(-loop 1 -t $D -i "$img")
  filt+="[$i:v]scale=1080:1350,zoompan=z='min(zoom+0.0003,1.03)':d=$(python3 -c "print(int($D*30))"):s=1080x1350:fps=30,pad=1080:1920:0:285:color=0x070b14,format=yuv420p,setsar=1[v$i];"
  i=$((i+1))
done
prev="v0"; off=0
for ((k=1;k<n;k++)); do
  off=$(python3 -c "print(round($k*($D-$F),2))")
  filt+="[$prev][v$k]xfade=transition=slideleft:duration=$F:offset=$off[x$k];"; prev="x$k"
done
filt=${filt%;}
ffmpeg -y -loglevel error "${args[@]}" -f lavfi -t $(python3 -c "print($n*$D-($n-1)*$F)") -i anullsrc=r=44100:cl=stereo \
  -filter_complex "$filt" -map "[$prev]" -map $n:a -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -shortest -movflags +faststart "$out"
