#!/usr/bin/env bash
# 원본 국경 데이터(historical-basemaps)를 받아 연도별로 단순화한다. 결과: raw/w{연도}.json
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p raw
YEARS="1492 1530 1600 1650 1700 1715 1783 1815 1880 1914 1920 1938 1945 1960 1994 2010"
[ -d .hb ] || git clone --depth 1 https://github.com/aourednik/historical-basemaps.git .hb
# 1914년부터의 교차검증·재작성용: CShapes 2.0 (CRAN 패키지 cshapes의 GitHub 미러)
[ -d .cshapes ] || git clone --depth 1 https://github.com/cran/cshapes.git .cshapes
xz -dkc .cshapes/inst/extdata/cshapes_2_gw.topojson.xz > raw/cshapes_gw.topojson
for d in 1914:1914-07-01 1920:1920-07-01 1938:1938-12-31 1945:1945-09-02 1960:1960-12-31 1994:1994-07-01 2010:2010-07-01; do
  y=${d%%:*}; D=${d#*:}
  npx mapshaper raw/cshapes_gw.topojson -filter "start <= '$D' && end >= '$D'" -filter-fields gwcode,country_name,status,owner \
    -simplify 5% keep-shapes -o "raw/c$y.json" format=topojson quantization=1e5
done
for y in $YEARS; do
  npx mapshaper ".hb/geojson/world_$y.geojson" -filter-fields NAME,SUBJECTO,BORDERPRECISION \
    -simplify 6% keep-shapes -o "raw/w$y.json" format=topojson quantization=1e5
done
