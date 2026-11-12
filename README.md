# cause-and-effect

중학생을 위한 **원인과 결과로 읽는 세계사** 작업 저장소.

- [`00-기획안.md`](00-기획안.md) — 방향, 장 구성, 편향 방지 원칙
- `research/` — 자료조사
  - [`01-교육과정-연계.md`](research/01-교육과정-연계.md) — 2022 개정 중학교 역사·사회와의 연결, 세계사 교육의 편향 논의
  - [`02-방법론-편향방지.md`](research/02-방법론-편향방지.md) — 다중관점, 공동교과서 사례, 성장격차 이론 비교, 편향 체크리스트
  - [`03-기존-도서-비교.md`](research/03-기존-도서-비교.md) — 기존 청소년 세계사 책과 차별점

> 조사 자료의 `[미확인]` 표시는 출처로 검증하지 못한 내용이다. 원고에 쓰기 전에 원문 확인이 필요하다.

## 사상의 분기점 / ism (인터랙티브 페이지)

과학혁명부터 AI혁명까지 7개 분기점과 53개 사상(ism)을 정리한 페이지. 분기점별 기준 변화, 사상 흐름도, 시대별 사상그래프(x·y축), 마인드맵, 사상 사전.

| 언어 | 파일 | 웹 (GitHub Pages 활성화 후) |
|---|---|---|
| 한국어 | [`ko/ism/`](ko/ism/index.html) | https://usan-82.github.io/cause-and-effect/ko/ism/ |
| English | [`en/ism/`](en/ism/index.html) | https://usan-82.github.io/cause-and-effect/en/ism/ |
| Bahasa Indonesia | [`id/ism/`](id/ism/index.html) | https://usan-82.github.io/cause-and-effect/id/ism/ |

소스와 빌드 방법은 [`_src/ism/`](_src/ism/README.md).

## 세계 영토 지도 / hegemony/map (인터랙티브 지도)

기원전 3000년부터 2026년까지 53개 시점의 세계 영토를 나라별 색으로 보여 주는 페이지. 색 없는 땅은 기록을 찾지 못한 곳이고, 2026년의 분쟁 지역은 유엔 → 미국 → 한국 순으로 우선해 칠했다. 독립 자료 Cliopatria와 교차검증한 결과를 시점마다 싣고, 스위치를 켜면 기록이 없는 땅을 Cliopatria의 영역으로 보충해(빗금) 볼 수 있다.

| 언어 | 파일 | 웹 (GitHub Pages) |
|---|---|---|
| 한국어 | [`ko/hegemony/map/`](ko/hegemony/map/index.html) | https://usan-82.github.io/cause-and-effect/ko/hegemony/map/ |
| English | [`en/hegemony/map/`](en/hegemony/map/index.html) | https://usan-82.github.io/cause-and-effect/en/hegemony/map/ |
| Bahasa Indonesia | [`id/hegemony/map/`](id/hegemony/map/index.html) | https://usan-82.github.io/cause-and-effect/id/hegemony/map/ |

소스와 빌드 방법은 [`_src/hegemony/map/`](_src/hegemony/map/README.md).

## 패권의 지도 / hegemony/atlas (인터랙티브 지도)

1492~2010년 16개 시점의 세계지도에 그 시기 지배 세력을 나라별 고유색으로 칠하고, 지배력의 강약(공고·유지·쇠퇴·퇴장)을 진하기와 빗금으로 나타낸 페이지. 시점마다 패권 구도 · 사건과 손익 · 기술 발전 · 사상 발전을 정리하고, '국가별 흐름'에서 한 나라의 인과 흐름과 영토 면적 변화를 따라갈 수 있다. 1914년 이후 국경은 CShapes 2.0으로 다시 그려 원본 오픈소스와의 교차검증 결과를 공개하고, 원본이 틀린 요충지·지역은 검증한 값으로 다시 칠했다.

| 언어 | 파일 | 웹 (GitHub Pages 활성화 후) |
|---|---|---|
| 한국어 | [`ko/hegemony/atlas/`](ko/hegemony/atlas/index.html) | https://usan-82.github.io/cause-and-effect/ko/hegemony/atlas/ |
| English | [`en/hegemony/atlas/`](en/hegemony/atlas/index.html) | https://usan-82.github.io/cause-and-effect/en/hegemony/atlas/ |
| Bahasa Indonesia | [`id/hegemony/atlas/`](id/hegemony/atlas/index.html) | https://usan-82.github.io/cause-and-effect/id/hegemony/atlas/ |

> 지도·데이터 파일을 불러오는 구조라, 파일을 내려받아 더블클릭으로 열면 지도가 뜨지 않는다. 웹 주소나 로컬 서버(`python3 -m http.server`)로 연다.

소스와 빌드 방법은 [`_src/hegemony/atlas/`](_src/hegemony/atlas/README.md).
