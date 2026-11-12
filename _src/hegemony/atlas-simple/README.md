# 패권의 지도, 쉽게 읽기 / hegemony/atlas-simple 소스

중학생(전 세계 독자)용으로 줄인 패권의 지도. `{ko,en,id}/hegemony/atlas-simple/`은 모두 이 폴더에서 생성된다.

```
cd _src/hegemony/atlas-simple
npm install
node build.mjs        # 세 언어 모두(글 파일이 있는 언어만)
node build.mjs ko     # 한 언어만
```

- 지도는 패권의 지도(`hegemony/atlas`)의 빌드 결과 `ko/hegemony/atlas/data/{연도}.json`을 읽어, 장마다 주인공 나라는 나라별로 하나씩, 나머지 땅은 하나로 합친다. 국경 교정은 atlas에서만 한다(atlas를 먼저 빌드).
- `struct.json` — 11장: 연도(`year`, atlas의 지도 연도), 흡수한 atlas 시점(`from`, '더 자세히 보기' 링크), 주인공 나라(`stars`, 2~4개).
- `{lang}.json` — 장별 글: `title`, `sum`(한 줄 요약), `why`(원인 → 결과 3단계), `stars`(나라별 한 줄), `names`(카드의 나라 이름 바꿔 쓰기, 선택), `words`(낱말 풀이 `[낱말, 풀이]`).
- `{lang}.page.json` — 화면 문구, 글 규칙: `maxSentence`(한 문장 길이, ko는 글자 수, `sentenceUnit:"word"`이면 낱말 수), `maxYears`(장당 연도 수), `explain`(본문에 나오면 낱말 풀이가 있어야 하는 용어).
- 나라 이름(시점별)과 색은 atlas의 것을 쓴다.

## 글 원칙
- 해요체(ko). 특정 나라 독자를 전제하지 않는다("우리", "서양 열강" 같은 표현 금지).
- 사실은 atlas 본문에 있는 것만 쓴다. 쉽게 줄이면서 인과를 새로 만들거나 과장하지 않는다.
