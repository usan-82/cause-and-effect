"""사상의 분기점, 쉽게 읽기: python3 build.py OUT_ROOT [lang ...] [--check]"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ISM_SRC = os.path.join(HERE, "..", "ism")
GRADES = ("sure", "part")
NEXTS = ("sure", "part", "parallel")
FIELDS = ("title", "q", "event", "shift", "people", "why", "whyOthers", "duels", "result", "today", "words")
YEAR = re.compile(r"(?<!\d)1\d{3}(?!\d)|(?<!\d)20\d{2}(?!\d)")


def _read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load(name):
    return _read(os.path.join(HERE, name))


def load_ism(name):
    return _read(os.path.join(ISM_SRC, name))


# ---------- 글 검사 ----------
def sentences(s):
    return [x.strip() for x in re.split(r"(?<=[.!?。])\s+", s) if x.strip()]


def strings(v):
    """값 안의 모든 문자열(딕셔너리·목록을 따라 내려간다)."""
    if isinstance(v, str):
        yield v
    elif isinstance(v, dict):
        for x in v.values():
            yield from strings(x)
    elif isinstance(v, list):
        for x in v:
            yield from strings(x)


def check(lang, struct, txt, pg, ism):
    """규칙을 어긴 곳의 목록. '글 없음'으로 끝나는 줄만 치명적이지 않다."""
    errs = []
    unit = pg.get("sentenceUnit", "char")  # ko: 글자 수, en·id: 낱말 수
    length = (lambda s: len(s.split())) if unit == "word" else (lambda s: len(re.sub(r"\[[^\]]*\]", "", s)))
    ism_ids = {i["id"] for i in ism["isms"]}
    chapters = struct["chapters"]
    for n, ch in enumerate(chapters):
        w = f"{lang} {ch['id']}"
        e = lambda msg: errs.append(f"{w}: {msg}")
        c = txt.get("chapters", {}).get(ch["id"])
        if not c:
            e("글 없음")
            continue
        last = n == len(chapters) - 1
        missing = [f for f in FIELDS if c.get(f) is None]
        if not last and not c.get("next"):
            missing.append("next")
        for f in missing:
            e(f"{f} 없음")
        if not 0 <= ch.get("tp", -1) < len(ism["tp"]):
            e(f"분기점 번호 {ch.get('tp')} 없음")

        # 화살표: 이유 네 개, 점선이면 다른 원인
        why = c.get("why") or []
        if len(why) != 4:
            e("why는 4개여야 함")
        for i, s in enumerate(why):
            if not (s or "").strip():
                e(f"why[{i}] 비어 있음")
        arrows = ch.get("arrows") or []
        if len(arrows) != 3:
            e("arrows는 3개여야 함")
        others = c.get("whyOthers") or []
        for i, g in enumerate(arrows):
            if g not in GRADES:
                e(f"arrows[{i}] 값({g})")
            elif g == "part" and not (i < len(others) and others[i]):
                e(f"whyOthers[{i}] 필요")

        # 사람들: 좋은 점과 나쁜 점, 누구에게
        for side in ("good", "bad"):
            rows = (c.get("people") or {}).get(side) or []
            if not rows:
                e(f"people.{side} 1개 이상")
            for i, r in enumerate(rows):
                for f in ("who", "text"):
                    if not r.get(f):
                        e(f"people.{side}[{i}].{f} 없음")

        # 대결
        sd, td = ch.get("duels") or [], c.get("duels") or []
        if len(sd) > 2 or len(td) > 2:
            e("대결은 2쌍 이하")
        if not sd:
            e("대결은 1쌍 이상")
        if len(sd) != len(td):
            e(f"duels 개수({len(td)}) ≠ struct({len(sd)})")
        for i, (s, t) in enumerate(zip(sd, td)):
            for k in ("a", "b"):
                if s.get(k) is not None and s[k] not in ism_ids:
                    e(f"사상 id {s[k]} 없음")
                if not t.get(k):
                    e(f"duels[{i}].{k} 없음")
            if not t.get("clash"):
                e(f"duels[{i}].clash 없음")
            if not t.get("events"):
                e(f"duels[{i}].events 없음")
            if s.get("grade") not in GRADES:
                e(f"duels[{i}] grade 값({s.get('grade')})")
            elif s["grade"] == "part" and not t.get("others"):
                e(f"duels[{i}].others 필요")

        # 다음 장으로 가는 고리
        if not last:
            if ch.get("next") not in NEXTS:
                e(f"next 값({ch.get('next')})")
            elif ch["next"] == "part" and not c.get("nextOthers"):
                e("nextOthers 필요")

        # 문장 길이, 연도 수, 낱말 풀이
        body = list(strings({k: v for k, v in c.items() if k != "words"}))
        for t in body + [d for _, d in c.get("words") or []]:
            for s in sentences(t):
                if length(s) > pg["maxSentence"]:
                    e(f"문장이 김({length(s)}>{pg['maxSentence']}) — {s}")
        text = " ".join(body)
        years = sorted(set(YEAR.findall(text)))
        if len(years) > pg["maxYears"]:
            e(f"연도가 많음({', '.join(years)})")
        words = {x[0].lower() for x in c.get("words") or []}
        for entry in pg.get("explain") or []:  # 'colony|colonies' → 풀이 낱말은 첫 번째
            key, *alts = entry.split("|")
            pat = (r"\b%s\b" if unit == "word" else r"(^|[^가-힣])%s")
            if any(re.search(pat % re.escape(t), text, re.I) for t in [key, *alts]) and key.lower() not in words:
                e(f"'{key}' 낱말 풀이 필요")
    return errs
