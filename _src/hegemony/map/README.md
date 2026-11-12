# 세계 영토 지도 / hegemony/map 소스

`ko/hegemony/map/`의 파일은 모두 이 폴더에서 생성된다.

```
cd _src/hegemony/map
npm install
npm run prepare-data   # 원본 국경 데이터를 받아 시점별로 단순화 → raw/
npm run build          # ko/hegemony/map/ 생성 (약 1분)
npm run verify         # 완성된 지도를 Cliopatria와 교차검증 → verify.json, 보충 층 → raw/sup/ (몇 분)
npm run build          # 검증 결과와 보충 층을 페이지에 싣기
```

- `prepare.sh` — 시점 목록과 단순화 정도. historical-basemaps(기원전 3000~1880, 37개 시점), CShapes 2.0(1886~2019, 15개 시점), Natural Earth(2026: 미국·한국 관점 지도와 분쟁 지역)
- `build.mjs`
  - 지물마다 ‘주체’를 정한다: historical-basemaps는 `SUBJECTO`(없으면 `NAME`), CShapes는 소유국, Natural Earth는 주권국
  - 0.5° 격자 표본으로 인접 관계·면적·이름표 위치를 계산한다
  - 색: 어느 시점에든 국경을 맞댄 주체끼리 다른 색이 되도록 120색 팔레트에서 배정한다. `ko.json`의 `groups`에 묶인 이름(왕조·국호 변화)은 같은 색을 쓴다
  - 2026년: `UN_OVERRIDE`(유엔 표기를 우선하는 곳)를 적용하고, 분쟁 지역마다 미국·한국 관점 지도가 어느 나라로 그리는지 읽어 붙인다
- `verify.mjs` — 완성된 지도를 독립 자료 Cliopatria와 0.5° 격자로 비교한다. 시점마다 경계 일치율, 한쪽에만 있는 나라, 서로 다르게 그린 곳을 계산한다
  - 보충 층도 여기서 만든다: Cliopatria의 영역에서 이 지도가 나라로 칠한 곳을 잘라 내고(mapshaper `-erase`), 두 자료의 경계가 어긋나 생기는 가는 띠(넓이÷둘레 30km 미만 또는 8,000km² 미만)를 버린 뒤 `raw/sup/{연도}.json`으로 낸다. `build.mjs`가 읽어 `data/s{연도}.json`으로 싣고, 화면의 ‘Cliopatria 보충’ 스위치로 켠다(기본은 꺼짐)
- `clio.json` — 보충 층의 이름 처리. `alias`는 Cliopatria 이름을 이 지도의 같은 나라에 잇는 표(색과 한글 이름을 같이 쓴다. 직접 확인한 동의어만 넣는다), `ko`는 한글 이름
- `alias.json` — 출처마다 다른 표기를 하나로 모으는 표
- `ko.json` — 한글 이름(`names`), 나라가 아닌 문화권·집단을 가려내는 규칙(`nonstate`), 같은 색 묶음(`groups`), 분쟁 지역의 유엔 표기 설명(`unRules`)
- `ko.page.json` — 화면 문구, 출처 목록, 출처 아래에 싣는 용어 풀이(`glossary`)
- `template.html`, `style.css` — 화면

## 한계

- 1886년 이전은 시점 사이의 변화를 그리지 않으며, 국경은 세력권을 어림한 것이다. 1800년 자료는 오류가 커서 뺐다.
- 원본 자료에 없는 나라는 표시되지 않는다(색 없는 땅 = 기록을 찾지 못함). ‘Cliopatria 보충’을 켜면 Cliopatria에만 있는 영역이 빗금으로 채워지지만, 그 부분은 교차검증을 거치지 않았고 본 지도와 경계 기준이 다르다.
- 1886년 이전 자료의 식민지 소속 표기 오류는 여기서 고치지 않았다(`hegemony/atlas`에서 일부 보정).
- 한글 이름은 면적이 큰 것 위주로 약 450개만 붙였다. 나머지는 영어 표기 그대로 나온다.
- 유엔의 지도 데이터는 쓰지 못했다. 유엔 표기는 `unRules`에 직접 정리한 26곳뿐이다.
- 라이선스: historical-basemaps GPL-3.0, CShapes GPL(≥2), Natural Earth 퍼블릭 도메인.
