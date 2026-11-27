import sys, json, wave, numpy as np, sherpa_onnx
D, out = sys.argv[1], sys.argv[2]
T = {"s1": "600년쯤 전, 중국의 명나라는 동아시아의 중심이었어요. 주변의 여러 나라가 명에 사신을 보냈어요.",
     "s2": "정화는 명 황제의 함대를 이끌고, 인도양을 일곱 번 건넌 사람이에요.",
     "s3": "28년 동안 일곱 번 떠난 함대는, 왜 멈췄을까요? 그리고 정화는 왜, 무엇을 얻으려고 떠났을까요?"}
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(supertonic=sherpa_onnx.OfflineTtsSupertonicModelConfig(
    duration_predictor=f"{D}/duration_predictor.int8.onnx", text_encoder=f"{D}/text_encoder.int8.onnx", vector_estimator=f"{D}/vector_estimator.int8.onnx",
    vocoder=f"{D}/vocoder.int8.onnx", tts_json=f"{D}/tts.json", unicode_indexer=f"{D}/unicode_indexer.bin", voice_style=f"{D}/voice.bin"), num_threads=4, provider="cpu"))
tts = sherpa_onnx.OfflineTts(cfg); res = {}
for k, t in T.items():
    g = sherpa_onnx.GenerationConfig(); g.sid = 0; g.num_steps = 8; g.speed = 1.0; g.extra["lang"] = "ko"
    a = tts.generate(t, g); x = np.clip(np.array(a.samples, dtype=np.float32), -1, 1)
    w = wave.open(f"{out}/{k}.wav", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(a.sample_rate); w.writeframes((x*32767).astype("<i2").tobytes()); w.close()
    # 문장 경계 시각: 침묵 구간 찾기
    sr=a.sample_rate; fr=int(sr*0.02); e=np.sqrt(np.mean(x[:len(x)//fr*fr].reshape(-1,fr)**2,axis=1)); sil=e<0.008
    gaps=[]; i=0
    while i<len(sil):
        if sil[i]:
            j=i
            while j<len(sil) and sil[j]: j+=1
            if (j-i)*0.02>=0.18 and i>0 and j<len(sil): gaps.append(round((i+j)/2*0.02,2))
            i=j
        else: i+=1
    res[k] = {"dur": round(len(x)/sr, 2), "gaps": gaps}
json.dump(res, open(f"{out}/timing.json", "w")); print(res)
