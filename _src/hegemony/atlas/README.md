# 패권의 지도 / hegemony/atlas 소스

`ko/hegemony/atlas/`의 파일은 모두 이 폴더에서 생성된다. 직접 고치지 말고 여기를 고친 뒤 다시 빌드한다.

```
cd _src/hegemony/atlas
npm install
npm run prepare-data   # 원본 국경 데이터를 받아 단순화 → raw/ (처음 한 번, 또는 연도를 바꿀 때)
npm run build          # ko/hegemony/atlas/ 생성
```

- `template.html` — 화면 전체(지도, 시간축, 탭, 요충지 레이어). 빌드 때 `index.html`로 복사된다.
- `content.json` — 시점별 글: 제목, 패권 경쟁 주역(`rivals`), 패권 구도·사건과 손익·기술·사상, 더 읽기 링크
- `choke.json` — 요충지 19곳의 시점별 지배 세력(`[시작 연도, 끝 연도, 세력 키, 표시 이름, 주석]`). 국경 데이터와 별개로 확인한 값이다.
- `build.mjs` — 국경 데이터에 세력 키를 붙이고, 소속 표기 오류를 연도별로 보정(`FIX`)하고, 요충지와 지도 색을 대조해 `meta.json`을 만든다.
- `prepare.sh` — 연도 목록과 단순화 정도(6%)

시점을 추가하려면 `prepare.sh`와 `build.mjs`의 연도 목록, `content.json`, `choke.json`(모든 시점을 빠짐없이 덮어야 한다)을 함께 고친다.

## 데이터와 한계

- 국경: [historical-basemaps](https://github.com/aourednik/historical-basemaps) (André Ourednik 외, **GPL-3.0**). 이 데이터에서 만든 `ko/hegemony/atlas/data/`도 같은 라이선스를 따른다.
- 원본은 작업 중인 프로젝트다. 1700년 이전 국경은 세력권 수준의 근사이고, 연도와 맞지 않는 표기가 있다. 1800·1900·1930년은 오류가 커서 뺐다.
- 보정한 내용은 페이지의 시점별 ‘데이터 보정’에, 지도 색과 실제 지배가 어긋나는 요충지는 ‘요충지 점검’에 표시된다.
