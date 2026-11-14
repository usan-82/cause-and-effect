# 해설 합성음성 (Supertonic 3) 시험

2026-11-14 결정: 해설 음성은 무료 로컬 모델 Supertonic 3로 시작하고, 품질이 모자라면 구글 클라우드 TTS를 검토한다. 후보 비교는 설계 문서 8장과 [`docs/research-notes/hegemony-video/tts-조사.md`](../../../../docs/research-notes/hegemony-video/tts-조사.md).

## 준비

모델 파일(약 130MB)은 저장소에 넣지 않는다. sherpa-onnx의 GitHub 릴리스에서 받는다.

```
pip install sherpa-onnx numpy
curl -L -O https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2
tar xjf sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2
```

## 견본 만들기

```
mkdir out
python3 sample.py ./sherpa-onnx-supertonic-3-tts-int8-2026-05-11 ./out ./sample-text.json 0
```

- `out/voices-ko.wav`: 목소리 0~9번이 같은 한국어 문장을 차례로 읽는다.
- `out/sample-{ko,en,id}.wav`: 1편 첫머리 해설을 세 언어로, 마지막 인자의 목소리 번호로 읽는다.
- 견본(mp3)은 `hegemony-video-assets` 브랜치의 `_src/hegemony/video/assets/tts-samples/`에 있다.

## 2026-11-14 시험 결과 (이 세션, CPU)

| 언어 | 글자 수 | 읽은 길이 | 만드는 데 걸린 시간 |
|---|---|---|---|
| 한국어 | 222자 (한글·숫자만 세면 158자) | 29.1초 | 7.0초 |
| 영어 | 472자 | 33.6초 | 7.2초 |
| 인도네시아어 | 538자 | 40.7초 | 9.1초 |

- 한국어는 1초에 한글 5.4자쯤으로 읽었다(속도 1.0). 콘티는 1초에 4.4자로 길이를 잡았다.
- 같은 내용이 인도네시아어로는 한국어보다 40% 길다. 그림 컷의 길이는 가장 긴 언어에 맞추거나 언어마다 따로 잡아야 한다.
- 소리가 깨지는 곳(최대 음량 0.5 안팎)은 없었다. 이 세션에서는 귀로 들어 보지 못했으므로, 발음과 숫자 읽기("1405년", "2만 7천 명", "27,000", "27.000")는 작성자가 들어 보고 판단한다.

## 라이선스

- 실행 코드(sherpa-onnx, Supertonic 예제)는 MIT다. 내려받은 묶음 안의 `LICENSE` 파일도 코드용 MIT다.
- **모델 가중치는 OpenRAIL-M**이라고 묶음 안의 README가 적는다. 상업 이용을 허용하고 용도를 제한하는 형식으로 알려져 있다. 원문은 Hugging Face에 있고 이 세션에서는 열리지 않아 아직 읽지 못했다. 공개 전에 원문을 확인한다.
- Supertonic 저장소는 개발이 끝나 보관(archived)된 상태다.
