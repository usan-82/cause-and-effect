"""초벌 영상을 만든다: 해설 음성(Supertonic 3) + 그림·지도·카드 + 자막.

    python3 render.py --ep 1 --assets <그림 폴더> --model <Supertonic 모델 폴더> --out <출력 폴더>

- 해설은 ../epNN.md 의 컷 표에서 읽는다(한국어). 그림은 assets/epNN/ 의 epNN_c04.png 또는 epNN_cut4.png.
- 출력: epNN-ko.mp4 (자막 트랙 포함), epNN-ko.vtt, stills/ (컷별 정지 화면), audio/ (컷별 해설), cuts.json (컷별 길이)
"""
import argparse, glob, hashlib, json, os, re, subprocess, sys, wave
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import specs, templates  # noqa: E402

VIDEO = os.path.dirname(HERE)
REPO = templates.REPO
FPS = 30

def parse_cuts(ep):
    cuts = []
    for line in open(os.path.join(VIDEO, f"ep{ep:02d}.md"), encoding="utf-8"):
        m = re.match(r"^\| (\d+) \| \d+ \| (\S+)(?: ▶)? \| (.*?) \| (.*?) \| (.*?) \|$", line.rstrip("\n"))
        if m:
            cuts.append({"n": int(m.group(1)), "kind": m.group(2), "nar": m.group(4)})
    return cuts

def find_image(assets, ep, key):
    d = os.path.join(assets, f"ep{ep:02d}")
    if isinstance(key, str):
        pat = re.compile(rf"ep{ep:02d}_{key}\.png$")
    else:
        pat = re.compile(rf"ep{ep:02d}_(?:c|cut)0*{key}\.png$")
    hits = [f for f in os.listdir(d) if pat.search(f)]
    if len(hits) != 1:
        raise SystemExit(f"그림을 찾지 못함: {ep}편 {key} → {hits}")
    return os.path.join(d, hits[0])

def cover(img, w=1920, h=1080):
    r = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    x, y = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))

class TTS:
    def __init__(self, model, sid):
        import sherpa_onnx
        D = model
        cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            supertonic=sherpa_onnx.OfflineTtsSupertonicModelConfig(
                duration_predictor=f"{D}/duration_predictor.int8.onnx", text_encoder=f"{D}/text_encoder.int8.onnx",
                vector_estimator=f"{D}/vector_estimator.int8.onnx", vocoder=f"{D}/vocoder.int8.onnx",
                tts_json=f"{D}/tts.json", unicode_indexer=f"{D}/unicode_indexer.bin", voice_style=f"{D}/voice.bin"),
            debug=False, num_threads=4, provider="cpu"))
        assert cfg.validate()
        self.tts, self.sid, self.sherpa = sherpa_onnx.OfflineTts(cfg), sid, sherpa_onnx

    def say(self, text, lang, path):
        g = self.sherpa.GenerationConfig(); g.sid = self.sid; g.num_steps = 8; g.speed = 1.0; g.extra["lang"] = lang
        a = self.tts.generate(text, g)
        x = np.clip(np.array(a.samples, dtype=np.float32), -1, 1)
        w = wave.open(path, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(a.sample_rate)
        w.writeframes((x * 32767).astype("<i2").tobytes()); w.close()
        return len(x) / a.sample_rate

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(" ".join(cmd) + "\n" + r.stderr[-2000:])

def vtt_time(t):
    h, rem = divmod(t, 3600); m, s = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep", type=int, required=True); ap.add_argument("--assets", required=True)
    ap.add_argument("--model", required=True); ap.add_argument("--out", required=True)
    ap.add_argument("--sid", type=int, default=0); ap.add_argument("--lang", default="ko")
    ap.add_argument("--size", default="1280x720")
    a = ap.parse_args()
    ow, oh = map(int, a.size.split("x"))
    out = os.path.abspath(a.out); os.makedirs(out, exist_ok=True)
    for sub in ("stills", "audio", "html", "seg"): os.makedirs(os.path.join(out, sub), exist_ok=True)
    spec = specs.SPECS[a.ep]
    cuts = parse_cuts(a.ep) + [{"n": "end", "kind": "카드", "nar": ""}]
    missing = [c["n"] for c in cuts if c["n"] not in spec]
    if missing: raise SystemExit(f"화면 정의가 없는 컷: {missing}")

    # 1) 해설
    tts = TTS(a.model, a.sid)
    for c in cuts:
        c["audio"], c["adur"] = None, 0.0
        if c["nar"] and c["nar"] != "(해설 없음)":
            p = os.path.join(out, "audio", f"{c['n']}.wav")
            c["audio"], c["adur"] = p, tts.say(c["nar"], a.lang, p)

    # 2) 정지 화면
    jobs = []
    for c in cuts:
        s = spec[c["n"]]; png = os.path.join(out, "stills", f"{c['n']}.png"); c["still"] = png
        if s["type"] == "image":
            cover(Image.open(find_image(a.assets, a.ep, c["n"])).convert("RGB")).save(png)
        elif s["type"] == "crop":
            im = Image.open(find_image(a.assets, a.ep, s["file"])).convert("RGB")
            x0, y0, x1, y1 = s["box"]
            part = im.crop((int(x0 * im.width), int(y0 * im.height), int(x1 * im.width), int(y1 * im.height)))
            bg = Image.new("RGB", (1920, 1080), im.getpixel((5, 5)))
            r = 980 / part.height; part = part.resize((round(part.width * r), 980), Image.LANCZOS)
            bg.paste(part, ((1920 - part.width) // 2, 50)); bg.save(png)
        else:
            h = os.path.join(out, "html", f"{c['n']}.html")
            if s["type"] == "map":
                topo = os.path.join(REPO, "ko", "hegemony", "atlas-simple", "data", f"{s['year']}.json")
                open(h, "w", encoding="utf-8").write(templates.map_html(s, topo))
            else:
                open(h, "w", encoding="utf-8").write(templates.card_html(s))
            jobs.append({"html": h, "png": png})
    if jobs:
        jp = os.path.join(out, "html", "jobs.json"); json.dump(jobs, open(jp, "w"))
        run(["node", os.path.join(HERE, "stills.js"), jp])

    # 3) 컷별 영상
    t, cues, segs = 0.0, [], []
    for c in cuts:
        s = spec[c["n"]]
        dur = 5.0 if c["n"] == "end" else max(c["adur"] + 0.9, 3.5)
        n = round(dur * FPS); dur = n / FPS
        move = s.get("move", "zoom" if s["type"] in ("image", "map", "crop") else "none")
        if move == "zoom":
            vf = f"scale=3840:2160,zoompan=z='1+0.06*on/{n}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s={ow}x{oh}:fps={FPS}"
        elif move == "pan_left":
            vf = f"scale=3840:2160,zoompan=z='1.15':x='(iw-iw/zoom)*(1-on/{n})':y='(ih-ih/zoom)/2':d=1:s={ow}x{oh}:fps={FPS}"
        else:
            vf = f"scale={ow}:{oh},fps={FPS}"
        vf += f",fade=t=in:st=0:d=0.3,fade=t=out:st={dur - 0.3:.3f}:d=0.3,format=yuv420p"
        seg = os.path.join(out, "seg", f"{c['n']}.mp4"); segs.append(seg)
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", str(FPS), "-t", f"{dur:.3f}", "-i", c["still"]]
        if c["audio"]:
            cmd += ["-i", c["audio"], "-filter_complex", f"[1:a]adelay=350|350,apad,atrim=0:{dur:.3f},aresample=44100[a]", "-map", "0:v", "-map", "[a]"]
        else:
            cmd += ["-f", "lavfi", "-t", f"{dur:.3f}", "-i", "anullsrc=r=44100:cl=mono", "-map", "0:v", "-map", "1:a"]
        cmd += ["-vf", vf, "-frames:v", str(n), "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-r", str(FPS),
                "-c:a", "aac", "-b:a", "96k", "-ac", "1", "-shortest", seg]
        run(cmd)
        if c["audio"]:
            sents = [x for x in re.split(r"(?<=[.?!])\s+", c["nar"]) if x]
            tot = sum(len(x) for x in sents); st = t + 0.35
            for x in sents:
                d = c["adur"] * len(x) / tot
                cues.append((st, st + d, x)); st += d
        c["start"], c["dur"] = t, dur
        t += dur

    # 4) 잇기, 자막
    lst = os.path.join(out, "seg", "list.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in segs))
    vtt = os.path.join(out, f"ep{a.ep:02d}-{a.lang}.vtt")
    open(vtt, "w", encoding="utf-8").write("WEBVTT\n\n" + "".join(f"{vtt_time(s)} --> {vtt_time(e)}\n{x}\n\n" for s, e, x in cues))
    mp4 = os.path.join(out, f"ep{a.ep:02d}-{a.lang}.mp4")
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-i", vtt, "-map", "0", "-map", "1",
         "-c", "copy", "-c:s", "mov_text", "-metadata:s:s:0", f"language={'kor' if a.lang == 'ko' else a.lang}", "-movflags", "+faststart", mp4])
    json.dump([{k: c[k] for k in ("n", "kind", "adur", "start", "dur")} for c in cuts], open(os.path.join(out, "cuts.json"), "w"), ensure_ascii=False, indent=1)
    print(f"{mp4}  {t:.1f}s  {os.path.getsize(mp4) / 1e6:.1f}MB")

if __name__ == "__main__":
    main()
