"""사상의 분기점, 쉽게 읽기: python3 build.py OUT_ROOT [lang ...] [--check]"""
import html, json, os, re

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


# ---------- 화면 ----------
def esc(s):
    return html.escape(str(s), quote=True)


def _arrow(grade, word, reason, others, ui):
    extra = f'<p class="others"><b>{esc(ui["others"])}</b> {esc(others)}</p>' if grade == "part" and others else ""
    return (f'<div class="arrow {grade}"><b>{esc(word)}</b>'
            f'<p class="reason">{esc(reason)}</p>{extra}</div>')


def _side(say, ism_id, easy, names):
    name = easy or (names.get(ism_id) if ism_id else None)
    if ism_id:
        tag = f'<a class="ism" href="../ism/#ism-{esc(ism_id)}">{esc(name)}</a>'
    else:
        tag = f'<span class="noism">{esc(name)}</span>' if name else ""
    return f'<div class="side"><q>{esc(say)}</q>{tag}</div>'


def _duel(s, t, ui, names):
    grade = s["grade"]
    others = (f'<p class="others"><b>{esc(ui["others"])}</b> {esc(t["others"])}</p>'
              if grade == "part" and t.get("others") else "")
    events = "".join(f"<li>{esc(e)}</li>" for e in t["events"])
    return ('<div class="duel"><div class="sides">'
            + _side(t["a"], s.get("a"), t.get("aName"), names)
            + f'<span class="vs">{esc(ui["vs"])}</span>'
            + _side(t["b"], s.get("b"), t.get("bName"), names)
            + f'</div><p class="clash"><b>{esc(ui["clash"])}</b> {esc(t["clash"])}</p>'
            + f'<div class="darrow {grade}">{others}<ul class="events">{events}</ul></div></div>')


def _people(rows, label, cls):
    items = "".join(f'<li><b>{esc(r["who"])}</b><span>{esc(r["text"])}</span></li>' for r in rows)
    return f'<div class="{cls}"><h4>{esc(label)}</h4><ul>{items}</ul></div>'


def render_chapter(ch, c, inherit, pg, names, era=""):
    """한 장의 사슬. 칸 다섯 개와 그 사이 화살표 네 개."""
    ui = pg["ui"]
    arrows = list(ch["arrows"]) + ["part" if any(d["grade"] == "part" for d in ch["duels"]) else "sure"]
    others = list(c.get("whyOthers") or []) + [None]
    words = [ui["so"], ui["so"], ui["but"], ui["so"]]
    arrow = lambda i: _arrow(arrows[i], words[i], c["why"][i], others[i] if i < len(others) else None, ui)
    box = lambda cls, title, body: f'<section class="box {cls}"><h3>{esc(title)}</h3>{body}</section>'
    out = [f'<article class="ch" id="{esc(ch["id"])}">']
    if era:
        out.append(f'<p class="era">{esc(era)}</p>')
    out.append(f'<h2>{esc(c["title"])}</h2>')
    if inherit:
        out.append(f'<aside class="inherit"><b>{esc(ui["inherit"])}</b><p>{esc(inherit)}</p></aside>')
    out.append(f'<div class="ask"><span>{esc(ui["q"])}</span><p>{esc(c["q"])}</p></div>')
    out.append('<div class="chain">')
    out.append(box("box-event", ui["event"], f'<p>{esc(c["event"])}</p>'))
    out.append(arrow(0))
    out.append(box("box-shift", ui["shift"],
                   f'<div class="shift"><div><b>{esc(ui["before"])}</b><p>{esc(c["shift"]["before"])}</p></div>'
                   f'<div><b>{esc(ui["after"])}</b><p>{esc(c["shift"]["after"])}</p></div></div>'))
    out.append(arrow(1))
    out.append(box("box-people", ui["people"],
                   '<div class="people">' + _people(c["people"]["good"], ui["good"], "good")
                   + _people(c["people"]["bad"], ui["bad"], "bad") + "</div>"))
    out.append(arrow(2))
    out.append(box("box-duel", ui["duel"],
                   "".join(_duel(s, t, ui, names) for s, t in zip(ch["duels"], c["duels"]))))
    out.append(arrow(3))
    out.append(box("box-result", ui["result"], f'<p>{esc(c["result"])}</p>'))
    out.append("</div>")
    out.append(f'<div class="ask answer"><span>{esc(ui["today"])}</span><p>{esc(c["today"])}</p></div>')
    if c.get("next"):
        kind = ch.get("next", "sure")
        label = ui["parallel"] if kind == "parallel" else ui["next"]
        extra = (f'<p class="others"><b>{esc(ui["others"])}</b> {esc(c["nextOthers"])}</p>'
                 if kind == "part" and c.get("nextOthers") else "")
        out.append(f'<aside class="next {kind}"><b>{esc(label)}</b><p>{esc(c["next"])}</p>{extra}</aside>')
    if c.get("words"):
        rows = "".join(f"<details><summary>{esc(w)}</summary><p>{esc(d)}</p></details>" for w, d in c["words"])
        out.append(f'<section class="words"><h3>{esc(ui["words"])}</h3>{rows}</section>')
    out.append("</article>")
    return "".join(out)


def render_rail(struct, written, tp_names, soon=""):
    """분기점 8칸 줄. 쓰인 장은 링크, 안 쓰인 장은 흐리게. 칸 사이에는 앞 장이 넘긴 고리의 종류."""
    out, prev = ["<ol>"], None
    for n, ch in enumerate(struct["chapters"]):
        if prev is not None:
            kind = prev.get("next") if prev["id"] in written else None
            out.append(f'<li class="link {esc(kind)}" aria-hidden="true"></li>' if kind
                       else '<li class="link" aria-hidden="true"></li>')
        inner = f"<b>{n + 1}</b><span>{esc(tp_names[ch['tp']])}</span>"
        if ch["id"] in written:
            out.append(f'<li><a href="#{esc(ch["id"])}">{inner}</a></li>')
        else:
            out.append(f'<li><span class="off" title="{esc(soon)}">{inner}</span></li>')
        prev = ch
    out.append("</ol>")
    return "".join(out)


def build(lang, out_root, check_only=False):
    """검사하고, 통과하면 {out_root}/{lang}/ism-simple/index.html을 쓴다. 치명적 오류가 있으면 False."""
    struct, ism = load("struct.json"), load_ism("struct.json")
    txt, pg = load(f"{lang}.json"), load(f"{lang}.page.json")
    if report(check(lang, struct, txt, pg, ism)):
        return False
    if check_only:
        return True
    ism_txt = load_ism(f"{lang}.json")
    names = {k: v["n"] for k, v in ism_txt["isms"].items()}
    tps = ism_txt["tp"]
    chapters = struct["chapters"]
    written = [ch for ch in chapters if txt["chapters"].get(ch["id"])]
    parts = []
    for ch in written:
        n = chapters.index(ch)
        before = chapters[n - 1] if n else None
        inherit = txt["chapters"].get(before["id"], {}).get("next") if before else None
        era = f'{tps[ch["tp"]]["n"]} · {tps[ch["tp"]]["y"]}'
        parts.append(render_chapter(ch, txt["chapters"][ch["id"]], inherit, pg, names, era))
    ready = [l for l in LANGS if os.path.exists(os.path.join(HERE, f"{l}.json"))]
    langs = "".join(
        f'<span aria-current="page">{esc(load(f"{l}.page.json")["langName"])}</span>' if l == lang
        else f'<a href="../../{l}/ism-simple/" hreflang="{l}" lang="{l}">{esc(load(f"{l}.page.json")["langName"])}</a>'
        for l in ready)
    data = {"order": [ch["id"] for ch in chapters], "written": [ch["id"] for ch in written],
            "chapter": pg["ui"]["chapter"]}
    css = re.sub(r"\{\{(\w+)\}\}", lambda m: pg[m.group(1)], open(os.path.join(HERE, "style.css"), encoding="utf-8").read())
    fill = {
        "css": css, "langs": langs, "chapters": "".join(parts),
        "rail": render_rail(struct, {ch["id"] for ch in written}, [t["n"] for t in tps], pg["ui"]["soon"]),
        "data": json.dumps(data, ensure_ascii=False).replace("<", "\\u003c"),
        "footHtml": pg["footHtml"], "fontLink": pg["fontLink"],
    }

    def sub(m):
        k = m.group(1)
        if k in fill:
            return fill[k]
        if isinstance(pg.get(k), str):
            return esc(pg[k])
        if k in pg["ui"]:
            return esc(pg["ui"][k])
        raise KeyError(f"{lang}: 문구 {k} 없음")

    page = re.sub(r"\{\{(\w+)\}\}", sub, open(os.path.join(HERE, "template.html"), encoding="utf-8").read())
    out_dir = os.path.join(out_root, lang, "ism-simple")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(page)
    print(f"{lang}: {len(written)}/{len(chapters)}장 → {lang}/ism-simple")
    return True


# ---------- 명령 ----------
LANGS = ("ko", "en", "id")


def report(errs):
    """오류를 찍고 치명적인 것이 있는지 알려 준다."""
    for e in errs:
        print(("  · " if e.endswith("글 없음") else "  ✗ ") + e)
    return any(not e.endswith("글 없음") for e in errs)


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    out_root, only = args[0], args[1:]
    failed = False
    for lang in LANGS:
        if only and lang not in only:
            continue
        if not os.path.exists(os.path.join(HERE, f"{lang}.json")):
            print(f"{lang}: 글 파일 없음 — 건너뜀")
            continue
        failed = not build(lang, out_root, "--check" in argv) or failed
    if failed:
        print("검사 실패")
    return 1 if failed else 0


if __name__ == "__main__":
    import sys
    sys.exit(main(sys.argv[1:]))
