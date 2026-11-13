# 사상의 분기점, 쉽게 읽기 — 시안(1단계) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설계 10장의 1단계만 만든다: 인과 규칙을 검사하는 빌드, 사슬 화면, 산업혁명 한 장(한국어)과 그 근거 파일.

**Architecture:** `_src/ism-simple/build.py`가 구조·글·화면 문구 JSON을 읽어 규칙을 검사하고, 장을 **빌드 때 HTML로 그려** `ko/ism-simple/index.html` 한 파일로 낸다. 스크립트는 장 넘기기만 맡으므로, 스크립트가 꺼져 있어도 모든 장이 차례로 읽힌다. 사상 이름과 분기점 이름은 기존 `_src/ism/`의 데이터를 읽어 쓴다.

**Tech Stack:** Python 3 표준 라이브러리만(`json`, `html`, `re`, `unittest`). 외부 의존성 없음. HTML + CSS + 최소한의 JS.

**Spec:** `docs/superpowers/specs/2026-11-13-ism-simple-design.md` (이하 "설계"). 2~4단계(나머지 7장, 영어·인도네시아어, 기존 페이지와 상호 링크)는 작성자가 시안을 본 뒤 따로 계획한다.

## Global Constraints

- 글: 해요체, 한 문장 **45글자 이하**, 장당 서로 다른 연도 **3개 이하**, "우리"·"서양 열강" 금지, 특정 나라 독자를 전제하지 않는다.
- 화살표마다 이유 한 문장. 세기가 `part`이면 "다른 원인도 있어요" 문장 필수.
- 좋은 점·나쁜 점은 각각 1개 이상, 모두 "누구에게"가 있다.
- 한 장의 대결은 2쌍 이하(사상 4개 이하). 사상 id는 `_src/ism/struct.json`의 53개 안에서만 쓴다. 맞는 id가 없으면 `null`.
- 새 사실은 작업 중 **실제로 열어 본 출처**가 있는 것만 싣는다. 기억에만 의존한 것은 근거 파일에 `[미확인]`으로 적고 본문에 넣지 않는다.
- 그림은 사슬과 대결 카드뿐이다. 흐름도·좌표 그래프·마인드맵을 넣지 않는다.
- 기존 `_src/ism/`과 `{ko,en,id}/ism/`은 이 계획에서 고치지 않는다.
- 휴대전화 폭(360px)에서 가로 스크롤이 생기지 않는다. 밝은 화면·어두운 화면 모두 지원(atlas-simple의 색 토큰을 그대로 쓴다).
- 커밋은 브랜치 `ism-simple`에, `git -c user.name="usan-82" -c user.email=<기존 커밋의 작성자 메일>`로 한다. 푸시는 하지 않는다.

## Review Focus

1. 글에 `<`, `&`, `"`가 들어가도 화면이 깨지지 않고 글자 그대로 보인다. → Task 3 `test_escapes_text`
2. 글이 없는 장의 주소(`#science`)로 들어와도 빈 화면이 아니라 쓰인 장이 보인다. → Task 3 Step 6 확인 항목
3. 사상 id가 `null`인 대결 쪽은 이름과 링크 없이 문장만 나오고, 빌드가 죽지 않는다. → Task 1 `test_null_ism_allowed`, Task 3 `test_null_ism_has_no_link`
4. 앞 장의 글이 없으면 "앞에서 넘겨받은 것" 칸이 통째로 빠진다(빈 칸이 남지 않는다). → Task 3 `test_no_inherit_box_without_prev`
5. 따옴표·괄호가 섞인 짧은 구절(대결의 `a`, `b`, `events`)도 문장 길이와 연도 수 검사에 들어간다. → Task 1 `test_duel_text_counted`

---

## File Structure

| 파일 | 맡는 일 |
|---|---|
| `_src/ism-simple/build.py` | `check()` 규칙 검사, `render_*()` HTML 그리기, `build()` 파일 쓰기, CLI |
| `_src/ism-simple/test_build.py` | `check()`와 `render_chapter()` 단위 검사 |
| `_src/ism-simple/struct.json` | 8장의 id·분기점 번호, 쓰인 장의 화살표 세기·대결 사상 id·다음 고리 종류 |
| `_src/ism-simple/ko.json` | 장별 글 |
| `_src/ism-simple/ko.page.json` | 화면 문구, 글 규칙 값(`maxSentence`, `maxYears`, `explain`) |
| `_src/ism-simple/template.html`, `style.css` | 공통 화면 |
| `_src/ism-simple/README.md` | 빌드 방법, 데이터 모양, 글 원칙 |
| `research/04-사상-분기점-근거.md` | 장별 주장·출처·등급 |
| `ko/ism-simple/index.html` | 빌드 결과(직접 고치지 않는다) |
| `README.md` | 색인에 새 페이지 한 단락 추가 |

### 데이터 모양(모든 Task가 따른다)

`struct.json`:

```json
{"chapters": [
  {"id": "premodern", "tp": 0}, {"id": "science", "tp": 1}, {"id": "french", "tp": 2},
  {"id": "industrial", "tp": 3,
   "arrows": ["sure", "sure", "sure"],
   "duels": [{"a": "classical", "b": "socialism", "grade": "part"},
             {"a": "imperialism", "b": null, "grade": "part"}],
   "next": "part"},
  {"id": "worldwar", "tp": 4}, {"id": "coldwar", "tp": 5}, {"id": "digital", "tp": 6}, {"id": "ai", "tp": 7}
]}
```

- `arrows`는 정확히 3개: ①→②, ②→③, ③→④. 넷째(④→⑤)는 대결들의 `grade` 중 하나라도 `part`면 `part`.
- `grade` ∈ {`sure`, `part`}. `next` ∈ {`sure`, `part`, `parallel`}. 위 값들은 초안이며 Task 2의 근거 등급에 맞춰 고친다(확실 → `sure`, 유력·논쟁 → `part`).

`ko.json`: `{"chapters": {"industrial": {...}}}`. 장의 필드:

| 필드 | 모양 | 뜻 |
|---|---|---|
| `title`, `q`, `event`, `result`, `today` | 문자열 | 제목, 여는 질문, ① 칸, ⑤ 칸, "그래서 오늘" |
| `shift` | `{before, after}` | ② 칸 |
| `people` | `{good: [{who, text}], bad: [{who, text}]}` | ③ 칸 |
| `why` | 문자열 4개 | 화살표 이유(①→② … ④→⑤) |
| `whyOthers` | 3개, 각각 문자열 또는 `null` | `arrows[i]`가 `part`일 때의 "다른 원인" |
| `duels` | `[{a, b, clash, events: [..], others}]` | ④ 칸. `struct`의 `duels`와 같은 순서·같은 개수. `others`는 `grade`가 `part`일 때 필수 |
| `next`, `nextOthers` | 문자열 | 다음 장에 넘겨준 것. `nextOthers`는 `struct.next`가 `part`일 때 필수 |
| `words` | `[[낱말, 풀이], …]` | 낱말 풀이 |

---

### Task 1: 규칙 검사기

**Files:**
- Create: `_src/ism-simple/build.py`, `_src/ism-simple/test_build.py`, `_src/ism-simple/struct.json`, `_src/ism-simple/ko.page.json`

**Interfaces:**
- Produces: `check(lang: str, struct: dict, txt: dict, pg: dict, ism: dict) -> list[str]`. `ism`은 `_src/ism/struct.json`을 읽은 값. 오류 문자열은 `"{lang} {장 id}: …"`로 시작한다. 글이 없는 장은 `"{lang} {id}: 글 없음"` 한 줄만 내고(치명적이지 않음) 나머지 검사를 건너뛴다.
- Produces: `load(name: str) -> dict`(이 폴더의 JSON), `load_ism(name: str) -> dict`(`../ism/`의 JSON).
- Produces: `ko.page.json`의 규칙 값 `"maxSentence": 45, "maxYears": 3, "explain": []`(낱말은 Task 2가 채운다).

- [ ] **Step 1: `struct.json`을 위 "데이터 모양"대로 쓴다.**

- [ ] **Step 2: 실패하는 검사를 쓴다** (`test_build.py`, `unittest`). 올바른 장 하나를 돌려주는 `good()` 도우미를 두고, 검사마다 한 군데만 망가뜨린다. 문장은 모두 45자 이하의 해요체 가짜 문장으로 채운다.

| 검사 이름 | 망가뜨리는 것 | 기대(`any(sub in e for e in errs)`) |
|---|---|---|
| `test_good_chapter_passes` | 없음 | `글 없음`이 아닌 오류가 0개 |
| `test_missing_text_is_not_fatal` | `txt["chapters"] = {}` | 8줄 모두 `글 없음`으로 끝남 |
| `test_missing_field` | `q` 삭제 | `industrial: q 없음` |
| `test_why_needs_four` | `why`를 3개로 | `why는 4개` |
| `test_empty_reason` | `why[1] = ""` | `why[1] 비어 있음` |
| `test_part_arrow_needs_others` | `struct.arrows[0]="part"`, `whyOthers[0]=None` | `whyOthers[0] 필요` |
| `test_part_duel_needs_others` | 첫 대결의 `others` 삭제 | `duels[0].others 필요` |
| `test_part_next_needs_others` | `nextOthers` 삭제 | `nextOthers 필요` |
| `test_next_required_except_last` | `next` 삭제 | `next 없음`; 같은 글을 `ai` 장에 넣으면 그 오류가 없음 |
| `test_people_need_who` | `people.bad[0].who` 삭제 | `people.bad[0].who 없음` |
| `test_people_need_both` | `people.good = []` | `people.good 1개 이상` |
| `test_duel_count_matches` | 글의 `duels`를 1개로 | `duels 개수` |
| `test_max_two_duels` | 구조와 글에 대결 3개 | `대결은 2쌍 이하` |
| `test_unknown_ism` | `struct.duels[0].a = "nope"` | `사상 id nope 없음` |
| `test_null_ism_allowed` | `struct.duels[1].b = None` (기본값) | 오류 없음 |
| `test_bad_grade` | `grade = "maybe"` | `grade 값` |
| `test_long_sentence` | `event`에 46자 문장 | `문장이 김(46>45)` |
| `test_too_many_years` | 글 곳곳에 연도 4개 | `연도가 많음` |
| `test_duel_text_counted` | `duels[0].events`에 연도 4개 | `연도가 많음` |
| `test_explain_needs_word` | `pg.explain=["자본"]`, 본문에 "자본", `words=[]` | `'자본' 낱말 풀이 필요` |

- [ ] **Step 3: 실패를 확인한다.**

Run: `python3 _src/ism-simple/test_build.py`
Expected: `ImportError` 또는 `AttributeError: … 'check'`

- [ ] **Step 4: `build.py`에 `load`, `load_ism`, `check`를 쓴다.**

문장 나누기, 길이 세기(`[…]` 안은 세지 않음), 연도 정규식(`(?<!\d)1\d{3}(?!\d)|(?<!\d)20\d{2}(?!\d)`), `explain`의 `key|alt` 처리는 `_src/hegemony/atlas-simple/build.mjs`의 `check()`와 같은 규칙으로 한다. 검사 대상 글은 장의 모든 문자열이다(`title`, `q`, `event`, `shift.*`, `people.*.who/text`, `why`, `whyOthers`, `duels.*`의 모든 문자열, `result`, `today`, `next`, `nextOthers`). `words`의 풀이는 문장 길이만 검사하고 연도 수에는 넣지 않는다.

- [ ] **Step 5: 통과를 확인한다.**

Run: `python3 _src/ism-simple/test_build.py`
Expected: `OK` (20 tests)

- [ ] **Step 6: 커밋** — `ism-simple: 인과 규칙 검사기와 구조 파일`

---

### Task 2: 산업혁명 장의 근거와 글

**Files:**
- Create: `research/04-사상-분기점-근거.md`, `_src/ism-simple/ko.json`
- Modify: `_src/ism-simple/struct.json`(등급 반영), `_src/ism-simple/ko.page.json`(`explain`), `_src/ism-simple/build.py`(CLI에 `--check`)

**Interfaces:**
- Consumes: Task 1의 `check()`.
- Produces: `python3 _src/ism-simple/build.py . ko --check` — 검사만 하고 파일을 쓰지 않는다. 치명적 오류가 있으면 종료 코드 1.
- Produces: `ko.json`의 `chapters.industrial`(위 "데이터 모양" 그대로).

- [ ] **Step 1: 근거 파일 머리를 쓴다.** 등급 기준을 이렇게 적는다.

| 등급 | 기준 | 화면 |
|---|---|---|
| 확실 | 서로 독립된 믿을 만한 출처 2곳 이상이 같은 말을 하고, 반대 견해를 찾지 못했다 | 실선(`sure`) |
| 유력 | 다수 견해지만 다른 원인을 함께 드는 출처가 있다 | 점선(`part`) |
| 논쟁 | 출처끼리 엇갈린다 | 점선(`part`) |

표의 열: `칸 | 주장 | 출처(주소) | 열어 본 날 | 등급`. 믿을 만한 출처는 대학·박물관·기록원·의회 누리집, 백과사전(브리태니커 등), 학술서와 그 서평 순으로 고른다. 위키백과는 길잡이로만 쓰고 출처 칸에 적지 않는다.

- [ ] **Step 2: 아래 주장들의 출처를 찾아 열어 보고 표를 채운다.** 주장은 초안이다. 출처가 다르게 말하면 출처를 따라 고친다.

| 칸 | 확인할 주장(초안) |
|---|---|
| ① 사건 | 1769년 와트의 증기기관 개량 특허. 공장제 생산의 확산. |
| ② 바뀐 생각 | 부의 원천이 땅에서 기계·자본으로 옮겨 갔다. 일과 시간을 돈으로 재는 생각이 퍼졌다. |
| ①→② | 왜 공장이 이 생각을 낳았나(작동 방식). |
| ③ 좋은 점 | 누구에게: 물건을 사는 도시 사람들, 공장 주인. 무엇이: 면직물 등 값 하락. |
| ③ 나쁜 점 | 누구에게: 공장의 어린이 노동자(노동 시간, 1833년 공장법 이전 실태), 일감을 잃은 수공업 직조공, 식민지의 직물 생산자. |
| ②→③ | 바뀐 생각이 어떻게 이 결과로 이어졌나. |
| ③→④ | 손해 본 사람들 쪽에서 맞서는 생각(사회주의)이 나왔다는 것. |
| ④ 대결 1 | 자본주의(고전경제학) 대 사회주의. 왜 부딪쳤나. |
| ④ 대결 2 | 제국주의 대 그에 맞선 사람들. 공장의 원료·시장 수요와 식민지 확대의 관계. |
| ④→⑤ | 노동조합, 1848년 혁명, 러시아혁명과 이 대결의 관계. 다른 원인들(흉년, 민족 문제, 전쟁 등). |
| 그래서 오늘 | 여는 질문 "왜 학교는 종이 울리면 시작할까요?"의 답. |
| 다음 분기점으로 | 공장이 만든 힘 → 식민지 경쟁 → 세계대전. |

**여는 질문 판정 규칙:** "학교의 종과 시간표가 공장에서 왔다"는 설명은 널리 퍼졌지만 역사학자 사이에 반론이 있다고 알려져 있다. 출처를 열어 보고, 등급이 "논쟁"이면 여는 질문을 **"왜 모두가 같은 시계에 맞춰 살까요?"**(공장의 시간 규율과 철도 시간표)로 바꾸고 그 근거를 채운다.

- [ ] **Step 3: `ko.json`의 `industrial` 장을 쓴다.** 근거 표에서 `[미확인]`이 아닌 주장만 쓴다. 대결은 두 쌍을 모두 쓴다(시안에서 두 쌍 배치를 확인하려는 것). 다만 대결 2의 근거가 `[미확인]`뿐이면 대결 1만 쓰고 `struct.json`에서도 뺀다. 연도는 3개까지만 쓴다. 사상의 말(`a`, `b`)은 그 사상을 지지하는 사람이 고개를 끄덕일 문장으로 쓴다(한쪽을 우스꽝스럽게 쓰지 않는다).

- [ ] **Step 4: `struct.json`의 `arrows`, `grade`, `next`를 근거 등급에 맞춘다. `ko.page.json`의 `explain`에 본문에 쓴 어려운 낱말(예: `자본`, `식민지`, `노동조합`, `혁명`, `제국주의`)을 넣고 `words`에 풀이를 쓴다.**

- [ ] **Step 5: `build.py`에 CLI를 붙인다.** `python3 build.py OUT_ROOT [lang …] [--check]`. 언어를 생략하면 글 파일(`{lang}.json`)이 있는 언어 전부. 오류는 atlas-simple처럼 `  ✗ …`, 글 없음은 `  · …`로 찍는다.

- [ ] **Step 6: 검사를 통과시킨다.**

Run: `python3 _src/ism-simple/build.py . ko --check`
Expected: `· ko premodern: 글 없음` 등 7줄, `✗` 0줄, 종료 코드 0

- [ ] **Step 7: 글을 처음 보는 눈으로 다시 읽는다.** 확인: (가) 이유 문장 네 개가 각각 "왜"를 말하는가, 순서만 말하고 있지 않은가. (나) ③의 내용이 ②에서 따라 나오는가. (다) 전쟁·혁명을 사상 하나로 설명한 문장이 없는가. (라) 사상에 옳고 그름을 매긴 문장이 없는가. (마) 본문의 모든 사실이 근거 표에 있는가.

- [ ] **Step 8: 커밋** — `ism-simple: 산업혁명 장 글과 근거`

---

### Task 3: 사슬 화면

**Files:**
- Create: `_src/ism-simple/template.html`, `_src/ism-simple/style.css`, `_src/ism-simple/README.md`, `ko/ism-simple/index.html`(빌드 결과)
- Modify: `_src/ism-simple/build.py`, `_src/ism-simple/test_build.py`, `_src/ism-simple/ko.page.json`(화면 문구), `README.md`

**Interfaces:**
- Consumes: Task 1의 `check`, `load`, `load_ism`; Task 2의 `ko.json`.
- Produces: `render_chapter(ch: dict, c: dict, inherit: str | None, pg: dict, names: dict[str, str]) -> str` — 한 장의 `<article class="ch" id="{id}">…</article>`. `inherit`는 앞 장의 `next` 글(없으면 `None`). `names`는 사상 id → 그 언어의 이름(`_src/ism/{lang}.json`의 `isms[id].n`).
- Produces: `render_rail(struct: dict, written: set[str], tp_names: list[str]) -> str` — 8칸 줄.
- Produces: `build(lang: str, out_root: str, check_only: bool = False) -> bool`.

**화면 문구(`ko.page.json`의 `ui`)** — 설계가 정한 말이다. 그대로 쓴다.

```json
{"q": "오늘의 질문", "inherit": "앞에서 넘겨받은 것",
 "event": "무슨 일이 있었나요?", "shift": "생각이 이렇게 바뀌었어요", "before": "전에는", "after": "이제는",
 "people": "사람들의 삶", "good": "좋아진 사람들", "bad": "힘들어진 사람들",
 "duel": "맞붙은 두 생각", "vs": "대", "clash": "왜 부딪쳤나요?",
 "result": "그래서 벌어진 일", "so": "그래서", "but": "그런데", "others": "다른 원인도 있어요",
 "today": "그래서 오늘", "next": "다음 분기점으로", "parallel": "같은 때 다른 곳에서",
 "legendSure": "실선: 역사학자들이 대체로 동의하는 원인",
 "legendPart": "점선: 여러 원인 중 하나이거나 아직 논쟁 중",
 "soon": "아직 쓰는 중이에요", "words": "낱말 풀이", "full": "자세한 판",
 "prev": "이전", "nextBtn": "다음", "chapter": "{n}장 / {total}장"}
```

머리: `title` "사상의 분기점, 쉽게 읽기", `subtitle` "큰 사건이 일어나면 사람들의 생각이 바뀌어요. 바뀐 생각은 또 다른 사건을 일으켜요. 그 사슬을 따라가 봐요." 글꼴 값(`fontLink`, `fontSans`, `fontSerif`)과 색 토큰은 `_src/hegemony/atlas-simple/`의 것을 그대로 가져온다. 맺음말(`footHtml`)에는 설계 5장의 한계(서구 근대사를 축으로 삼은 틀)를 해요체 한두 문장으로 쓰고 `../ism/` 링크를 건다.

**마크업 약속**(검사와 CSS가 이 이름에 기댄다):

- 장: `<article class="ch" id="{id}">`. 칸: `<section class="box box-event|box-shift|box-people|box-duel|box-result">`.
- 화살표: `<div class="arrow sure|part"><b>그래서</b><p class="reason">…</p><p class="others"><b>다른 원인도 있어요</b> …</p></div>`. `others` 문단은 `part`일 때만. 셋째 화살표(③→④)의 낱말만 `but`("그런데"), 나머지는 `so`.
- 대결 카드: `<div class="duel">` 안에 양쪽 `<div class="side">`(말 `<q>`, 이름이 있으면 `<a class="ism" href="../ism/#ism-{id}">이름</a>`), 가운데 `<span class="vs">`, `clash`, 카드 자신의 화살표(`arrow` + `grade`), `events`를 `<ul class="events">`로.
- 줄: `<nav class="rail">`. 쓰인 장은 `<a href="#{id}">`, 안 쓰인 장은 `<span class="off" title="아직 쓰는 중이에요">`. 칸 사이 표시는 `<i class="link sure|part|parallel">`(앞 장의 `struct.next`를 알 때만).
- 실선과 점선은 색이 아니라 **선 모양**(`border-left: 3px solid` / `3px dashed`)으로 가른다.

- [ ] **Step 1: 실패하는 검사를 `test_build.py`에 더한다.**

| 검사 이름 | 입력 | 기대 |
|---|---|---|
| `test_chain_order` | 올바른 장 | 결과 문자열에서 `box-event` < `box-shift` < `box-people` < `box-duel` < `box-result` 순서로 나타남 |
| `test_four_arrows_with_reasons` | 올바른 장(대결 1쌍) | `class="reason"`이 4번, 각 `why[i]` 글이 들어 있음 |
| `test_part_arrow_shows_others` | `arrows[0]="part"`, `whyOthers[0]="흉년도 있었어요."` | `arrow part`와 그 글이 있음 |
| `test_sure_arrow_has_no_others` | 모든 화살표·대결 `sure` | `class="others"`가 0번 |
| `test_third_arrow_says_but` | 올바른 장 | 셋째 화살표에 `<b>그런데</b>`, 나머지에 `<b>그래서</b>` |
| `test_ism_link` | `a="classical"` | `href="../ism/#ism-classical"`과 `names["classical"]` |
| `test_null_ism_has_no_link` | `b=None` | 그 쪽 `side`에 `class="ism"` 없음, 말(`<q>`)은 있음 |
| `test_people_show_who` | 올바른 장 | 각 `who`와 `text`가 있음 |
| `test_no_inherit_box_without_prev` | `inherit=None` | `앞에서 넘겨받은 것` 없음; `inherit="…"`이면 있음 |
| `test_escapes_text` | `event='<b>1 & 2 "셋"</b>'` | `&lt;b&gt;1 &amp; 2 &quot;셋&quot;&lt;/b&gt;`가 있고 `<b>1 &`는 없음 |
| `test_rail_marks_unwritten` | `written={"industrial"}` | `href="#industrial"` 1번, `class="off"` 7번 |

- [ ] **Step 2: 실패를 확인한다.**

Run: `python3 _src/ism-simple/test_build.py`
Expected: 새 검사 11개가 `AttributeError: … 'render_chapter'`로 실패

- [ ] **Step 3: `render_chapter`, `render_rail`을 쓴다.** 모든 글은 `html.escape(…, quote=True)`를 거친다.

- [ ] **Step 4: 통과를 확인한다.**

Run: `python3 _src/ism-simple/test_build.py`
Expected: `OK` (31 tests)

- [ ] **Step 5: `template.html`, `style.css`, `build()`를 쓴다.**

- 한 화면 한 장. 스크립트는 (가) 주소의 `#id`가 쓰인 장이면 그 장, 아니면 첫 번째 쓰인 장만 보이게 하고 (나) 이전/다음 단추와 줄의 칸으로 장을 넘기며 (다) 쓰인 장이 하나뿐이면 이전/다음을 비활성으로 둔다. 스크립트가 없으면 모든 장이 차례로 보인다(`<html class="no-js">`를 스크립트가 지우는 방식).
- 배치: 한 줄 폭 최대 720px, 가운데. 칸은 atlas-simple의 `.card`와 같은 면·테두리·둥글기. 화살표는 칸과 칸 사이 왼쪽에 세로선(실선/점선)과 이유 문장. 대결 카드는 넓은 화면에서 양쪽이 나란히, 좁은 화면(≤520px)에서 위아래.
- 여는 질문은 장 맨 위에 가장 큰 글씨로, "그래서 오늘"은 같은 모양으로 맨 아래에 둔다(사슬의 양 끝임이 보이게).
- 줄 아래에 실선·점선 범례 두 줄.
- `build()`는 `check()`에 치명적 오류가 있으면 쓰지 않고 `False`. 결과는 `{out_root}/{lang}/ism-simple/index.html`. 언어 고르기 링크는 글 파일이 있는 언어만 낸다.

- [ ] **Step 6: 빌드하고 눈으로 확인한다.**

Run: `python3 _src/ism-simple/build.py . ko`
Expected: `ko: 1/8장 → ko/ism-simple`

확인(머리 없는 브라우저를 쓸 수 있으면 360×800과 1280×800, 밝은·어두운 화면에서 찍어 본다. 쓸 수 없으면 그 사실을 보고에 적는다):
- 360px에서 `document.documentElement.scrollWidth <= window.innerWidth`.
- 사슬이 위에서 아래로 한 줄로 읽히고, 실선과 점선이 구별된다.
- `…/index.html#science`로 열면 산업혁명 장이 보인다.
- 사상 이름을 누르면 `ko/ism/index.html#ism-classical`의 그 사상 카드로 간다.
- 결과 파일에 `{{`가 남아 있지 않다: `grep -c '{{' ko/ism-simple/index.html` → `0`.

- [ ] **Step 7: `_src/ism-simple/README.md`를 쓴다**(빌드 명령, 파일별 역할, 데이터 모양 표, 글 원칙, "근거 파일에 없는 사실은 쓰지 않는다"). **`README.md` 색인에 "사상의 분기점, 쉽게 읽기 / ism-simple" 단락을 기존 단락들과 같은 꼴로 더한다**(지금은 한국어 한 줄, 시안이라고 밝힌다).

- [ ] **Step 8: 전체 검사를 다시 돌리고 커밋** — `ism-simple: 사슬 화면과 산업혁명 시안(한국어)`

Run: `python3 _src/ism-simple/test_build.py && python3 _src/ism-simple/build.py . ko`
Expected: `OK`, `ko: 1/8장 → ko/ism-simple`
