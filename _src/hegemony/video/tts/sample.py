import sys, time, wave, json
import numpy as np
import sherpa_onnx
D, OUT = sys.argv[1], sys.argv[2]
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    supertonic=sherpa_onnx.OfflineTtsSupertonicModelConfig(
        duration_predictor=f"{D}/duration_predictor.int8.onnx", text_encoder=f"{D}/text_encoder.int8.onnx",
        vector_estimator=f"{D}/vector_estimator.int8.onnx", vocoder=f"{D}/vocoder.int8.onnx",
        tts_json=f"{D}/tts.json", unicode_indexer=f"{D}/unicode_indexer.bin", voice_style=f"{D}/voice.bin"),
    debug=False, num_threads=4, provider="cpu"))
assert cfg.validate()
tts = sherpa_onnx.OfflineTts(cfg)
def gen(text, lang, sid, speed=1.0):
    g = sherpa_onnx.GenerationConfig(); g.sid = sid; g.num_steps = 8; g.speed = speed; g.extra["lang"] = lang
    a = tts.generate(text, g); return np.array(a.samples, dtype=np.float32), a.sample_rate
def save(path, x, sr):
    x = np.clip(x, -1, 1); w = wave.open(path, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((x * 32767).astype("<i2").tobytes()); w.close()
TEXT = json.load(open(sys.argv[3]))
report = {}
# voice sampler: one Korean sentence per speaker
parts = []; sr0 = None
for sid in range(10):
    x, sr = gen(f"{sid}번 목소리예요. 정화는 명 황제의 함대를 이끌고 인도양을 일곱 번 건넌 사람이에요.", "ko", sid); sr0 = sr
    parts += [x, np.zeros(int(sr * 0.7), dtype=np.float32)]
save(f"{OUT}/voices-ko.wav", np.concatenate(parts), sr0)
SID = int(sys.argv[4])
for lang, text in TEXT.items():
    t = time.time(); x, sr = gen(text, lang, SID); el = time.time() - t
    save(f"{OUT}/sample-{lang}.wav", x, sr)
    report[lang] = {"chars": len(text), "seconds": round(len(x) / sr, 1), "gen_seconds": round(el, 1), "sr": sr}
print(json.dumps(report, ensure_ascii=False))
