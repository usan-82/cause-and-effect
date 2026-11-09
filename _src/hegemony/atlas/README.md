# 패권의 지도 / hegemony/atlas 소스

`ko/hegemony/atlas/`, `en/hegemony/atlas/`, `id/hegemony/atlas/`의 파일은 모두 이 폴더에서 생성된다. 직접 고치지 말고 여기를 고친 뒤 다시 빌드한다.

```
cd _src/hegemony/atlas
npm install
npm run prepare-data           # 원본 국경 데이터를 받아 단순화 → raw/ (처음 한 번, 또는 연도를 바꿀 때)
npm run build                  # 세 언어 모두
node build.mjs raw ../../.. en # 한 언어만
```

- `template.html`, `style.css` — 공통 화면(지도, 시간축, 탭, 요충지 레이어)
- `struct.json` — 언어와 무관한 구조: 시점별 패권 경쟁 주역(`rivals`)과 더 읽기 링크, 요충지 좌표와 시점별 지배 세력 키(`[시작 연도, 끝 연도, 세력 키]`)
- `{ko,en,id}.json` — 글: 시점별 제목·패권 구도·사건과 손익·기술·사상, 요충지 이름과 범위별 `[표시 이름, 주석]`(`struct.json`의 범위와 순서가 같아야 한다), 데이터 보정 문구(`fixes`), 지도 이름표(`short`, `[이 연도 전까지, 이름]`)
- `{ko,en,id}.page.json` — 제목, 안내문, 버튼 등 화면 문구와 글꼴
- `build.mjs` — 국경 데이터에 세력 키를 붙이고, 소속 표기 오류를 연도별로 보정(`FIX`, 문구는 언어별 `fixes`)하고, 요충지와 지도 색을 대조해 `meta.json`을 만든 뒤 언어별 페이지를 생성한다. 요충지 범위가 시점을 빠짐없이 덮는지, 번역에 빠진 항목이 없는지도 검사한다.
- `prepare.sh` — 연도 목록과 단순화 정도(6%)

시점을 추가하려면 `prepare.sh`와 `build.mjs`의 연도 목록, `struct.json`, 세 언어의 `{lang}.json`을 함께 고친다.

## 데이터와 한계

- 국경: [historical-basemaps](https://github.com/aourednik/historical-basemaps) (André Ourednik 외, **GPL-3.0**). 이 데이터에서 만든 `*/hegemony/atlas/data/`도 같은 라이선스를 따른다.
- 원본은 작업 중인 프로젝트다. 1700년 이전 국경은 세력권 수준의 근사이고, 연도와 맞지 않는 표기가 있다. 1800·1900·1930년은 오류가 커서 뺐다.
- 보정한 내용은 페이지의 시점별 ‘데이터 보정’에, 지도 색과 실제 지배가 어긋나는 요충지는 ‘요충지 점검’에 표시된다.
