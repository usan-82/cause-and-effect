# 사상의 분기점, 쉽게 읽기 / ism-simple 소스

중학생용으로 다시 쓴 사상의 분기점. 분기점마다 "사건 → 바뀐 생각 → 사람들의 삶 → 맞붙은 두 생각 → 벌어진 일"을 화살표로 잇는다. `{ko,en,id}/ism-simple/index.html`은 이 폴더에서 생성된다. 직접 고치지 말고 여기를 고친 뒤 다시 빌드한다.

```
python3 _src/ism-simple/build.py .              # 글 파일이 있는 언어 모두
python3 _src/ism-simple/build.py . ko           # 한 언어만
python3 _src/ism-simple/build.py . ko --check   # 검사만(파일을 쓰지 않음)
python3 _src/ism-simple/test_build.py           # 검사기와 화면 검사
```

파이썬 표준 라이브러리만 쓴다. 사상 이름과 분기점 이름은 `_src/ism/`의 데이터를 읽어 온다. 설계는 `docs/superpowers/specs/2026-11-13-ism-simple-design.md`.

## 파일

- `struct.json` — 8장의 `id`와 분기점 번호(`tp`, `_src/ism/struct.json`의 순서). 쓰인 장에는 화살표 세기, 대결의 사상 id, 다음 장으로 가는 고리의 종류.
- `{lang}.json` — 장별 글. 글이 없는 장은 건너뛴다.
- `{lang}.page.json` — 화면 문구(`ui`), 글 규칙(`maxSentence`, `maxYears`, `explain`).
- `template.html`, `style.css` — 공통 화면. 장은 빌드 때 HTML로 그리고, 스크립트는 장 넘기기만 한다.
- `build.py` — `check()` 규칙 검사, `render_chapter()`·`render_rail()` 그리기, `build()`.

## 데이터 모양

`struct.json`의 장:

| 필드 | 값 | 뜻 |
|---|---|---|
| `arrows` | `sure`/`part` 3개 | ①→②, ②→③, ③→④ 화살표의 세기. 넷째(④→⑤)는 대결 중 하나라도 `part`면 `part` |
| `duels` | `[{a, b, grade}]` 1~2개 | `a`·`b`는 `_src/ism`의 사상 id, 맞는 것이 없으면 `null`. `grade`는 `sure`/`part` |
| `next` | `sure`/`part`/`parallel` | 다음 장으로 가는 고리. 마지막 장에는 없다 |

`sure`는 실선(역사학자들이 대체로 동의), `part`는 점선(여러 원인 중 하나이거나 논쟁 중), `parallel`은 "같은 때 다른 곳에서"(인과 아님).

`{lang}.json`의 장:

| 필드 | 모양 | 뜻 |
|---|---|---|
| `title`, `scene`, `q` | 문자열 | 제목, 오늘의 장면(질문이 나오는 일상의 한 장면), 여는 질문 |
| `event`, `result` | 문자열 | ① 사건, ⑤ 벌어진 일 |
| `today`, `now`, `think` | 문자열 | 여는 질문의 답, 지금도 이어지는 사례 한두 문장(출처 필요), 생각해 볼 질문 하나 |
| `debate` | 문자열(선택) | ③ 칸 아래 "학자들은 아직 다퉈요" 줄. 사실은 확실하지만 좋은 점·나쁜 점 어느 쪽에도 넣을 수 없을 때만 쓴다. 두 문장 이하 |
| `shift` | `{before, after}` | ② 바뀐 생각 |
| `people` | `{good: [{who, text}], bad: [{who, text}]}` | ③ 누구에게 좋았고 누구에게 나빴나 |
| `why` | 문자열 4개 | 화살표마다 붙는 이유 |
| `whyOthers` | 3개, 문자열 또는 `null` | 그 화살표가 `part`일 때의 "다른 원인도 있어요" |
| `duels` | `[{a, b, clash, events, others, aName?, bName?}]` | ④ 대결. `struct`와 같은 순서. `others`는 `part`일 때 필수. `aName`·`bName`은 쉬운 이름(없으면 `_src/ism`의 이름) |
| `next`, `nextOthers` | 문자열 | 다음 장에 넘겨준 것. `nextOthers`는 `part`일 때 필수 |
| `words` | `[[낱말, 풀이]]` | 낱말 풀이 |

## 빌드가 막는 것

이유 문장이 빈 화살표, "다른 원인"이 없는 점선, "누구에게"가 빠진 좋은 점·나쁜 점, 대결 3쌍 이상, `_src/ism`에 없는 사상 id, 긴 문장(ko 45글자, en·id 22낱말), 장당 연도 4개 이상, `explain`에 있는데 풀이가 없는 낱말.

## 언어

한국어(`ko.json`)가 원문이다. 영어와 인도네시아어는 한국어를 그대로 옮긴 것이고, 숫자와 사실은 근거 파일의 원문 인용에 맞춘다. 본문을 고칠 때는 한국어를 먼저 고치고 두 언어를 따라 고친다. `explain`(풀이가 필요한 낱말)은 언어마다 `{lang}.page.json`에 따로 둔다. 영어·인도네시아어는 낱말 단위로 찾으므로 변화형을 `colony|colonies`처럼 적는다(첫 낱말이 풀이의 표제어).

## 글 원칙

- 해요체. 짧은 문장과 쉬운 낱말. 특정 나라 독자를 전제하지 않는다("우리", "서양 열강" 금지).
- 사상은 그 사상이 하는 말로 먼저 쓰고, 이름은 뒤에 붙인다. 그 사상을 믿는 사람이 고개를 끄덕일 문장으로 쓴다.
- 이유 문장은 순서가 아니라 "왜"를 말한다.
- 전쟁과 혁명을 사상 하나로 설명하지 않는다. 사상에 옳고 그름을 매기지 않는다. 학살 같은 사실은 흐리지 않는다.
- 한 낱말의 풀이는 모든 장에서 같은 문장으로 쓴다.
- **`research/04-사상-분기점-근거.md`에 출처가 있는 사실만 쓴다.** 출처의 등급이 화살표의 세기를 정한다(확실 → `sure`, 유력·논쟁 → `part`).
