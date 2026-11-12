# 세계 영토 지도 / hegemony/map 소스

`ko/hegemony/map/`의 파일은 모두 이 폴더에서 생성된다.

```
cd _src/hegemony/map
npm install
npm run prepare-data   # 원본 국경 데이터를 받아 시점별로 단순화 → raw/
npm run build          # ko/hegemony/map/ 생성 (약 1분)
```

- `prepare.sh` — 시점 목록과 단순화 정도. historical-basemaps(기원전 3000~1880, 37개 시점), CShapes 2.0(1886~2019, 15개 시점), Natural Earth(2026: 미국·한국 관점 지도와 분쟁 지역)
- `build.mjs`
  - 지물마다 ‘주체’를 정한다: historical-basemaps는 `SUBJECTO`(없으면 `NAME`), CShapes는 소유국, Natural Earth는 주권국
  - 0.5° 격자 표본으로 인접 관계·면적·이름표 위치를 계산한다
  - 색: 어느 시점에든 국경을 맞댄 주체끼리 다른 색이 되도록 120색 팔레트에서 배정한다. `ko.json`의 `groups`에 묶인 이름(왕조·국호 변화)은 같은 색을 쓴다
  - 2026년: `UN_OVERRIDE`(유엔 표기를 우선하는 곳)를 적용하고, 분쟁 지역마다 미국·한국 관점 지도가 어느 나라로 그리는지 읽어 붙인다
- `alias.json` — 출처마다 다른 표기를 하나로 모으는 표
- `ko.json` — 한글 이름(`names`), 나라가 아닌 문화권·집단을 가려내는 규칙(`nonstate`), 같은 색 묶음(`groups`), 분쟁 지역의 유엔 표기 설명(`unRules`)
- `ko.page.json` — 화면 문구와 출처 목록
- `template.html`, `style.css` — 화면

## 한계

- 1886년 이전은 시점 사이의 변화를 그리지 않으며, 국경은 세력권을 어림한 것이다. 1800년 자료는 오류가 커서 뺐다.
- 원본 자료에 없는 나라는 표시되지 않는다(색 없는 땅 = 기록을 찾지 못함).
- 1886년 이전 자료의 식민지 소속 표기 오류는 여기서 고치지 않았다(`hegemony/atlas`에서 일부 보정).
- 한글 이름은 면적이 큰 것 위주로 약 450개만 붙였다. 나머지는 영어 표기 그대로 나온다.
- 유엔의 지도 데이터는 쓰지 못했다. 유엔 표기는 `unRules`에 직접 정리한 26곳뿐이다.
- 라이선스: historical-basemaps GPL-3.0, CShapes GPL(≥2), Natural Earth 퍼블릭 도메인.
