"""지도와 카드의 HTML을 만든다. 그림체는 그림 지시문과 같은 평면 색을 쓴다."""
import json, os, html as H

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
LIB = os.path.join(REPO, "ko", "hegemony", "atlas-simple", "lib")
FONT = '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;900&display=swap" rel="stylesheet">'
INK, BG, MUTED = "#1b1a18", "#f4efe6", "#6f6a60"
ACC = ["#2b3a67", "#c0392b", "#c8922a", "#1f7a73"]
P = {"gb": "#d63a2f", "fr": "#2c63c9", "es": "#e0a100", "pt": "#2a9a46", "nl": "#ef7a12", "ru": "#6b4cc4", "ot": "#10998b",
     "cn": "#c22f6f", "us": "#27a2d8", "de": "#5a4f45", "at": "#d17ab9", "jp": "#9cb01c", "it": "#a0522d", "be": "#4f6d7a", "mg": "#8c6b3f"}

def _lib(name):
    return open(os.path.join(LIB, name), encoding="utf-8").read()

def map_html(spec, topo_path):
    topo = open(topo_path, encoding="utf-8").read()
    s = dict(spec); s["colors"] = P
    return f"""<!doctype html><html><head><meta charset="utf-8">{FONT}
<style>html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;background:#e9eef1;font-family:'Noto Sans KR',sans-serif}}
text{{font-family:'Noto Sans KR',sans-serif;paint-order:stroke;stroke:#fff;stroke-linejoin:round}}</style>
<script>window.onerror=(m)=>{{window.__err=String(m)}};</script>
<script>{_lib('d3.min.js')}</script><script>{_lib('topojson-client.min.js')}</script></head>
<body><svg id="m" width="1920" height="1080"></svg><script>
const S={json.dumps(s, ensure_ascii=False)}, T={topo}, W=1920, H=1080;
const outline=d3.geoGraticule().extent([[-180,-58],[180,84]]).outline();
const s0=d3.geoNaturalEarth1().fitSize([W,W*0.5],outline).scale();
const proj=d3.geoNaturalEarth1().scale(s0*S.k).center(S.center).translate([W/2,H/2]);
const path=d3.geoPath(proj), svg=d3.select('#m');
function rewind(f){{const g=f.geometry;if(!g)return f;const ps=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
 for(const p of ps)for(let i=0;i<p.length;i++){{if(d3.geoArea({{type:'Polygon',coordinates:[p[i]]}})>2*Math.PI)p[i]=p[i].slice().reverse();}}return f;}}
const feats=topojson.feature(T,T.objects.w).features.map(rewind);
svg.append('path').datum(outline).attr('d',path).attr('fill','#e9eef1');
const hl=new Set(S.highlight||[]);
svg.append('g').selectAll('path').data(feats).join('path').attr('d',path)
 .attr('fill',d=>hl.has(d.properties.k)?S.colors[d.properties.k]:'#d6d2c8').attr('stroke','#fff').attr('stroke-width',d=>hl.has(d.properties.k)?1.6:0.5);
for(const b of (S.bands||[])){{let ring=b.poly.concat([b.poly[0]]);if(d3.geoArea({{type:'Polygon',coordinates:[ring]}})>2*Math.PI)ring=ring.slice().reverse();
 svg.append('path').datum({{type:'Polygon',coordinates:[ring]}}).attr('d',path)
 .attr('fill',b.color).attr('fill-opacity',.28).attr('stroke',b.color).attr('stroke-width',4).attr('stroke-dasharray','14 10');
 const [x,y]=proj([b.lon,b.lat]);svg.append('text').attr('x',x).attr('y',y).attr('text-anchor','middle').attr('font-size',34).attr('font-weight',700)
 .attr('fill',b.color).attr('stroke-width',8).text(b.label);}}
for(const m of (S.meridians||[])){{const pts=d3.range(78,-58,-2).map(la=>proj([m.lon,la]));
 svg.append('path').attr('d',d3.line()(pts)).attr('fill','none').attr('stroke','{INK}').attr('stroke-width',5).attr('stroke-dasharray','20 12');
 const [x,y]=proj([m.lon,40]);svg.append('text').attr('x',x+16).attr('y',y).attr('font-size',34).attr('font-weight',700).attr('fill','{INK}').attr('stroke-width',8).text(m.label);}}
const line=d3.line().curve(d3.curveCatmullRom.alpha(.5));
svg.append('defs').html('<marker id="ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#b3282d"/></marker>');
for(const r of (S.routes||[])){{svg.append('path').attr('d',line(r.map(p=>proj(p)))).attr('fill','none').attr('stroke','#b3282d')
 .attr('stroke-width',7).attr('stroke-dasharray','18 12').attr('stroke-linecap','round').attr('marker-end','url(#ah)');}}
for(const m of (S.markers||[])){{const [x,y]=proj([m.lon,m.lat]);
 svg.append('circle').attr('cx',x).attr('cy',y).attr('r',12).attr('fill',S.dotcolor||'{INK}').attr('stroke','#fff').attr('stroke-width',5);
 svg.append('text').attr('x',x+22).attr('y',y+14).attr('font-size',m.size||40).attr('font-weight',700).attr('fill','{INK}').attr('stroke-width',9).text(m.name);}}
for(const m of (S.labels||[])){{const [x,y]=proj([m.lon,m.lat]);
 svg.append('text').attr('x',x).attr('y',y).attr('text-anchor','middle').attr('font-size',m.size||40).attr('font-weight',m.muted?500:900)
 .attr('fill',m.muted?'#6b7a86':'{INK}').attr('stroke-width',m.muted?0:10).text(m.name);}}
const cap=[(S.caption||''), '국경: '+S.year+'년 무렵'].filter(Boolean).join(' · ');
svg.append('text').attr('x',W-36).attr('y',H-32).attr('text-anchor','end').attr('font-size',26).attr('font-weight',500).attr('fill','{MUTED}').attr('stroke-width',6).text(cap);
</script></body></html>"""

def _e(t):
    return H.escape(t)

def card_html(spec):
    L = spec["layout"]
    css = f"""html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;background:{BG};color:{INK};font-family:'Noto Sans KR',sans-serif}}
.wrap{{position:absolute;inset:80px 120px;display:flex;flex-direction:column;justify-content:center;align-items:stretch;gap:44px}}
h1{{margin:0;font-size:68px;font-weight:900;text-align:center}}
.row{{display:flex;gap:40px;align-items:stretch;justify-content:center}}
.box{{flex:1;background:#fffdf8;border-radius:28px;overflow:hidden;box-shadow:0 0 0 4px {INK}22}}
.box .h{{padding:22px 30px;font-size:42px;font-weight:900;color:#fff}}
.box .b{{padding:28px 30px 34px;font-size:40px;font-weight:500;line-height:1.45}}
.foot{{text-align:center;font-size:48px;font-weight:900;color:{ACC[1]}}}
table{{border-collapse:separate;border-spacing:0 18px;width:100%;font-size:44px}}
th{{font-size:46px;font-weight:900;color:#fff;padding:18px 30px}} td{{background:#fffdf8;padding:26px 30px;font-weight:500;line-height:1.4}}
td.k{{font-weight:900;width:26%}}
.q{{text-align:center;font-size:76px;font-weight:900;line-height:1.35}} .q .last{{color:{ACC[1]};font-size:64px}}
.chain{{display:flex;align-items:center;justify-content:center;gap:18px}}
.pill{{background:#fffdf8;border-radius:24px;padding:26px 30px;font-size:42px;font-weight:700;box-shadow:0 0 0 4px {INK}22;text-align:center}}
.pill.big{{background:{ACC[2]};color:#fff;font-size:52px;padding:40px 40px;box-shadow:none}}
.arr{{font-size:56px;font-weight:900;color:{MUTED}}}
.note{{text-align:center;font-size:44px;font-weight:700;color:{MUTED}}} .sub{{text-align:center;font-size:48px;font-weight:900;color:#2a9a46}}
.lad{{display:flex;flex-direction:column-reverse;gap:16px;align-items:center}}
.step{{width:900px;text-align:center;font-size:44px;font-weight:700;padding:20px;border-radius:20px;background:#fffdf8;box-shadow:0 0 0 4px {INK}22}}
.step.on{{background:{ACC[1]};color:#fff;box-shadow:none}} .step.top{{background:{ACC[2]};color:#fff;box-shadow:none}}
.bar{{display:flex;align-items:center;gap:30px;font-size:38px;font-weight:700}} .bar .l{{width:620px;text-align:right}}
.track{{position:relative;flex:1;height:70px}} .seg{{position:absolute;top:0;height:70px;border-radius:12px}}
.val{{width:440px;font-weight:900;font-size:34px}}
.stack{{display:flex;height:110px;border-radius:18px;overflow:hidden;box-shadow:0 0 0 4px {INK}22}}
.stack div{{display:flex;align-items:center;justify-content:center;color:#fff;font-size:42px;font-weight:900}}
.bl{{font-size:46px;font-weight:900;margin:0 0 14px}} .bn{{font-size:38px;font-weight:500;color:{MUTED};margin-top:12px}}
.cr{{text-align:center;font-size:54px;font-weight:700;line-height:1.6}} .cr .s{{font-size:30px;font-weight:500;color:{MUTED};margin-top:40px;line-height:1.7}}"""
    body = ""
    if L == "question":
        lines = spec["lines"]
        out = []
        for i, t in enumerate(lines):
            cls = ' class="last"' if i == len(lines) - 1 and len(lines) > 2 else ""
            out.append(f"<div{cls}>{_e(t) or '&nbsp;'}</div>")
        body = f'<div class="q">{"".join(out)}</div>'
    elif L == "boxes":
        boxes = "".join(f'<div class="box"><div class="h" style="background:{ACC[i % 4]}">{_e(h)}</div><div class="b">{_e(b)}</div></div>'
                        for i, (h, b) in enumerate(spec["items"]))
        body = (f"<h1>{_e(spec['title'])}</h1>" if spec.get("title") else "") + f'<div class="row">{boxes}</div>' + \
               (f'<div class="foot">{_e(spec["footer"])}</div>' if spec.get("footer") else "")
    elif L == "table":
        head = "".join(f'<th style="background:{ACC[i % 4] if t else "transparent"}">{_e(t)}</th>' for i, t in enumerate(spec["head"]))
        if len(spec["head"]) == 2 and spec["head"][0] == "":
            head = f'<th></th><th style="background:{ACC[0]}">{_e(spec["head"][1])}</th>'
        rows = "".join("<tr>" + "".join(f'<td class="{"k" if j == 0 and spec["head"][0] == "" else ""}">{_e(c)}</td>' for j, c in enumerate(r)) + "</tr>"
                       for r in spec["rows"])
        body = f"<h1>{_e(spec['title'])}</h1><table><tr>{head}</tr>{rows}</table>"
    elif L == "chain":
        parts = []
        for i, t in enumerate(spec["steps"]):
            if i: parts.append('<div class="arr">→</div>')
            parts.append(f'<div class="pill{" big" if i == spec.get("big") else ""}">{_e(t)}</div>')
        body = f"<h1>{_e(spec['title'])}</h1><div class=\"chain\">{''.join(parts)}</div><div class=\"note\">{_e(spec['note'])}</div><div class=\"sub\">{_e(spec['sub'])}</div>"
    elif L == "ladder":
        n = len(spec["steps"])
        steps = "".join(f'<div class="step{" on" if i == spec["mark"] else (" top" if i == n - 1 else "")}">{_e(t)}</div>'
                        for i, t in enumerate(spec["steps"]))
        body = f"<h1>{_e(spec['title'])}</h1><div class=\"lad\">{steps}</div>"
    elif L == "ships":
        mx = 135.0
        rows = []
        for lab, lo, hi, style, val in spec["bars"]:
            if style == "dashed":
                seg = f'<div class="seg" style="left:0;width:{hi / mx * 100:.1f}%;border:6px dashed {ACC[1]};box-sizing:border-box"></div>'
            else:
                seg = (f'<div class="seg" style="left:0;width:{lo / mx * 100:.1f}%;background:{ACC[0]}"></div>'
                       f'<div class="seg" style="left:{lo / mx * 100:.1f}%;width:{(hi - lo) / mx * 100:.1f}%;background:{ACC[0]}77"></div>')
            rows.append(f'<div class="bar"><div class="l">{_e(lab)}</div><div class="track">{seg}</div><div class="val">{_e(val)}</div></div>')
        body = f"<h1>{_e(spec['title'])}</h1>" + "".join(rows)
    elif L == "bars":
        rows = []
        for lab, segs, note in spec["bars"]:
            sd = "".join(f'<div style="flex:{w};background:{c}">{_e(t)}</div>' for t, w, c in segs)
            rows.append(f'<div><div class="bl">{_e(lab)}</div><div class="stack">{sd}</div><div class="bn">{_e(note)}</div></div>')
        body = f"<h1>{_e(spec['title'])}</h1>" + "".join(rows)
    elif L == "credits":
        body = '<div class="cr">' + "<br>".join(_e(t) for t in spec["lines"]) + '<div class="s">' + "<br>".join(_e(t) for t in spec["small"]) + "</div></div>"
    else:
        raise ValueError(L)
    return f"""<!doctype html><html><head><meta charset="utf-8">{FONT}<style>{css}</style></head><body><div class="wrap">{body}</div></body></html>"""
