# 초벌 영상 만들기

`render.py`가 한 편의 초벌 영상을 만든다: 해설 음성(Supertonic 3) + 그림·지도·카드 + 자막.

```
pip install sherpa-onnx numpy pillow        # 그리고 node와 playwright, ffmpeg
python3 render.py --ep 1 --assets <그림 폴더> --model <Supertonic 모델 폴더> --out <출력 폴더>
```

- **해설**은 `../epNN.md`의 컷 표에서 읽는다. 목소리는 0번(2026-11-15 결정), 속도 1.0.
- **화면**은 `specs.py`에 컷마다 적는다.
  - `image`: 그림 도구로 뽑은 그림을 천천히 당긴다.
  - `crop`: 설정화에서 인물 정면을 잘라 쓴다.
  - `map`: `atlas-simple`의 지도 데이터로 그린다(`templates.py`). 뱃길과 선은 대강 그린 것이라고 화면 아래에 적는다.
  - `card`: 글자 화면(언어별로 만든다).
- **그림 폴더**는 `hegemony-video-assets` 브랜치의 `_src/hegemony/video/assets/`를 내려받은 것이다. 파일 이름은 `ep01_c04.png`와 `ep01_cut4.png`를 모두 알아본다.
- **출력**은 `epNN-ko.mp4`(한국어 자막 트랙 포함), `epNN-ko.vtt`, 컷별 정지 화면과 음성, `cuts.json`(컷별 시작 시각과 길이)이다.
- 컷 길이는 해설 길이 + 0.9초(최소 3.5초)로 정한다. 끝에 상상화 고지 카드를 5초 붙인다.

## 초벌에 아직 없는 것

- 영어·인도네시아어 판 (해설 번역과 카드 번역이 필요하다)
- 화면 아래 낱말 풀이
- 배경 음악
