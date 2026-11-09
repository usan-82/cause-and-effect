"""Build ko/en/id ism pages: python3 build.py OUT_ROOT"""
import json, sys, os, html

HERE = os.path.dirname(os.path.abspath(__file__))
LANGS = [("ko", "한국어"), ("en", "English"), ("id", "Bahasa Indonesia")]


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def build(lang, out_root):
    st = load("struct.json")
    tx = load(f"{lang}.json")
    pg = load(f"{lang}.page.json")
    isms = []
    for s in st["isms"]:
        t = tx["isms"][s["id"]]
        isms.append({**s, **t})
    tps = [{**s, **t} for s, t in zip(st["tp"], tx["tp"])]
    eras = []
    for k, (s, t) in enumerate(zip(st["era"], tx["era"])):
        pts = [list(p) for p in s["p"]]
        for p in pts:  # per-language label overrides {id:[x,y,anchor]}
            ov = t.get("pos", {}).get(p[0])
            if ov:
                p[1:] = ov
        eras.append({"p": pts, **{k2: v for k2, v in t.items() if k2 != "pos"}})
    data = {"lanes": tx["lanes"], "ax": tx["ax"], "axs": tx["axs"], "tp": tps,
            "isms": isms, "era": eras, "ui": pg["ui"], "mmRoot": pg["mmRoot"]}
    tpl = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
    css = open(os.path.join(HERE, "style.css"), encoding="utf-8").read()
    langs = "".join(
        f'<span aria-current="page">{html.escape(n)}</span>' if c == lang
        else f'<a href="../../{c}/ism/" hreflang="{c}" lang="{c}">{html.escape(n)}</a>'
        for c, n in LANGS)
    out = tpl.replace("{{css}}", css).replace("{{langs}}", langs)
    out = out.replace("{{data}}", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
    for k, v in pg.items():
        if isinstance(v, str):
            out = out.replace("{{" + k + "}}", html.escape(v, quote=True))
    assert "{{" not in out, [l for l in out.splitlines() if "{{" in l][:3]
    d = os.path.join(out_root, lang, "ism")
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
        f.write(out)
    return os.path.join(d, "index.html")


if __name__ == "__main__":
    root = sys.argv[1]
    for lang in (sys.argv[2:] or [c for c, _ in LANGS]):
        print(build(lang, root))
