#!/usr/bin/env bash
# 원본 국경 데이터(historical-basemaps)를 받아 연도별로 단순화한다. 결과: raw/w{연도}.json
set -euo pipefail
cd "$(dirname "$0")"
YEARS="1492 1530 1600 1650 1700 1715 1783 1815 1880 1914 1920 1938 1945 1960 1994 2010"
[ -d .hb ] || git clone --depth 1 https://github.com/aourednik/historical-basemaps.git .hb
mkdir -p raw
for y in $YEARS; do
  npx mapshaper ".hb/geojson/world_$y.geojson" -filter-fields NAME,SUBJECTO,BORDERPRECISION \
    -simplify 6% keep-shapes -o "raw/w$y.json" format=topojson quantization=1e5
done
