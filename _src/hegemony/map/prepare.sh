#!/usr/bin/env bash
# 원본 국경 데이터를 받아 시점별로 단순화한다. 결과: raw/
#  h{연도}.json  historical-basemaps (기원전은 음수: h-3000.json)
#  c{연도}.json  CShapes 2.0 (기준일의 국경)
#  n_usa.json, n_kor.json, n_disputed.json  Natural Earth (미국·한국 관점, 분쟁 지역)
set -euo pipefail
cd "$(dirname "$0")"; mkdir -p raw
[ -d .hb ] || git clone --depth 1 https://github.com/aourednik/historical-basemaps.git .hb
[ -d .cshapes ] || git clone --depth 1 https://github.com/cran/cshapes.git .cshapes
HB="bc3000 bc2000 bc1500 bc1000 bc700 bc500 bc400 bc323 bc300 bc200 bc100 bc1 100 200 300 400 500 600 700 800 900 1000 1100 1200 1279 1300 1400 1492 1500 1530 1600 1650 1700 1715 1783 1815 1880"
for y in $HB; do
  n=${y/bc/-}
  npx mapshaper ".hb/geojson/world_$y.geojson" -filter-fields NAME,SUBJECTO,BORDERPRECISION \
    -simplify 5% keep-shapes -o "raw/h$n.json" format=topojson quantization=1e5
done
xz -dkc .cshapes/inst/extdata/cshapes_2_gw.topojson.xz > raw/cshapes_gw.topojson
for d in 1886:1886-01-01 1900:1900-07-01 1914:1914-07-01 1920:1920-07-01 1930:1930-07-01 1938:1938-12-31 1945:1945-09-02 1950:1950-07-01 1960:1960-12-31 1970:1970-07-01 1980:1980-07-01 1991:1991-12-31 2000:2000-07-01 2010:2010-07-01 2019:2019-12-31; do
  y=${d%%:*}; D=${d#*:}
  npx mapshaper raw/cshapes_gw.topojson -filter "start <= '$D' && end >= '$D'" -filter-fields gwcode,country_name,status,owner \
    -simplify 4% keep-shapes -o "raw/c$y.json" format=topojson quantization=1e5
done
NE=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
for f in countries_usa countries_kor disputed_areas; do
  [ -f "raw/ne_$f.geojson" ] || curl -sSL --max-time 300 -o "raw/ne_$f.geojson" "$NE/ne_10m_admin_0_$f.geojson"
done
npx mapshaper raw/ne_countries_usa.geojson -filter-fields NAME,NAME_KO,NAME_LONG,ADM0_A3,SOVEREIGNT,TYPE,ADMIN -simplify 4% keep-shapes -o raw/n_usa.json format=topojson quantization=1e5
npx mapshaper raw/ne_countries_kor.geojson -filter-fields NAME,NAME_KO,ADM0_A3,SOVEREIGNT,ADMIN -simplify 4% keep-shapes -o raw/n_kor.json format=topojson quantization=1e5
npx mapshaper raw/ne_disputed_areas.geojson -filter-fields NAME,NAME_KO,BRK_NAME,NOTE_BRK,ADMIN,SOVEREIGNT,TYPE,ADM0_A3 -simplify 12% keep-shapes -o raw/n_disputed.json format=topojson quantization=1e5
