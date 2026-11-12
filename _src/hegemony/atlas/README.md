# 패권의 지도 / hegemony/atlas 소스

`ko/hegemony/atlas/`, `en/hegemony/atlas/`, `id/hegemony/atlas/`의 파일은 모두 이 폴더에서 생성된다. 직접 고치지 말고 여기를 고친 뒤 다시 빌드한다.

```
cd _src/hegemony/atlas
npm install
npm run prepare-data           # historical-basemaps와 CShapes 2.0을 받아 시점별로 잘라 단순화 → raw/ (처음 한 번, 또는 연도를 바꿀 때)
npm run build                  # 세 언어 모두
node build.mjs raw ../../.. en # 한 언어만
REUSE=1 npm run build        # 글만 고쳤을 때: 지도·면적 계산을 건너뛰고 기존 결과를 재사용(몇 초)
```

- `template.html`, `style.css` — 공통 화면(지도, 시간축, 탭, 요충지 레이어)
- `struct.json` — 언어와 무관한 구조:
  - `years`: 시점별 패권 경쟁 주역(`rivals`)과 더 읽기 링크
  - `powers`: 세력별·시점별 상태(`rise` 부상 / `peak` 전성 / `hold` 유지 / `decline` 쇠퇴·흔들림 / `exit` 패권 퇴장·국가 존속 / `end` 소멸). 지도 색의 진하기와 빗금을 정한다
  - `choke`: 요충지 좌표, 시점별 지배 세력 키(`[시작 연도, 끝 연도, 세력 키]`), 재표기용 폴리곤(`poly`, 일부만 `polyYears`)
  - `patches`: 원본에서 빠지거나 틀린 지역을 다시 칠하는 폴리곤과 시점별 세력 키
- `clips.json` — 경계선 자체가 틀린 곳을 Cliopatria 경계로 고치는 조각. 직접 고치지 않는다: `../map/fixes.json`의 `clip` 항목에서 `../map/clip.mjs`가 만들며, 세계 영토 지도(hegemony/map)와 같은 교정을 쓴다. 조각마다 `{lang}.json`의 `clips`에 `[이름, 지배 세력, 주석]`이 있어야 한다
- `{ko,en,id}.json` — 글: 시점별 제목·패권 구도·사건과 손익·기술·사상, 국가별 흐름(`powers`, 직전 시점 이후 원인→결과), 요충지·패치의 범위별 `[표시 이름, 주석]`(`struct.json`의 범위와 순서가 같아야 한다), 데이터 보정 문구(`fixes`), 나라 이름(`short`는 `[이 연도 전까지, 이름]`, `full`은 전체 이름)
- 각주: 글 속에 `[^id]`를 쓰고 같은 파일의 `notes`에 `id: 설명`을 둔다. 해석이 갈리거나 단서가 필요한 대목에 쓴다(현재 한국어판만).
- `{ko,en,id}.page.json` — 제목, 안내문, 버튼 등 화면 문구와 글꼴. `sources`(`[제목, 주소]` 목록)가 있으면 페이지 맨 아래에 ‘검증에 참고한 출처’로 나온다(현재 한국어판만).
- `build.mjs`
  - 1880년까지는 historical-basemaps에 세력 키를 붙이고 소속 표기 오류를 연도별로 보정(`FIX`)한다.
  - 1914년부터는 CShapes 2.0(시점별 기준일은 `CS_DATE`)의 식민지 소유국 코드로 지도를 다시 그리고, 일부러 다르게 둔 곳은 `CS_FIX`에 모아 페이지에 공개한다.
  - 요충지·지역 패치를 덮어 그린다.
  - 0.25° 격자 표본으로 세력별 영토 면적과 두 원본 사이의 소속 일치율·불일치 지역을 계산해 `meta.json`에 넣는다.
  - 언어별 페이지를 생성하면서 요충지 범위가 시점을 빠짐없이 덮는지, 번역에 빠진 항목이 없는지 검사한다(전체 빌드 약 4분).
- `prepare.sh` — 연도 목록과 단순화 정도(6%)

시점을 추가하려면 `prepare.sh`와 `build.mjs`의 연도 목록, `struct.json`, 세 언어의 `{lang}.json`을 함께 고친다.

## 데이터와 한계

- 국경: [historical-basemaps](https://github.com/aourednik/historical-basemaps) (André Ourednik 외, **GPL-3.0**)와 [CShapes 2.0](https://icr.ethz.ch/data/cshapes/) (Schvitz·Girardin·Weidmann 외, CRAN 패키지 `cshapes`, **GPL ≥ 2**). 이 데이터에서 만든 `*/hegemony/atlas/data/`도 같은 라이선스를 따른다.
- 1886년 이전은 날짜 단위 교차 출처가 없어 원본 + 보정 + 재표기 수준이다. 이 시기 빠졌던 식민지(1600 브라질·뉴그라나다, 1650·1700 영국·프랑스령 북미 등)는 정착지·요새 중심의 근사 영역으로 다시 칠했다.
- 영토 면적은 1886년 이전의 명목상 영유권까지 포함해 실제 통제 범위보다 크게 나올 수 있다.
- 원본은 작업 중인 프로젝트다. 1700년 이전 국경은 세력권 수준의 근사이고, 연도와 맞지 않는 표기가 있다. 1800·1900·1930년은 오류가 커서 뺐다.
- 보정한 내용은 페이지의 시점별 ‘데이터 보정’에, 지도 색과 실제 지배가 어긋나는 요충지는 ‘요충지 점검’에 표시된다.
