# 모션그래픽 시안 (1편 첫 30초)

2026-11-27. 초벌(정지 그림을 천천히 당기는 방식)이 슬라이드쇼 같다는 검토에 따라, 픽토그램·모션그래픽 방식으로 1편 첫 30초를 시험했다.

| 장면 | 길이 | 해설 | 움직임 |
|---|---|---|---|
| s1 | 10.5초 | 600년쯤 전 명나라는 동아시아의 중심. 주변 나라들이 사신을 보냈다 | 세계 지도가 동아시아로 당겨지고, 명이 칠해지고, 주변에서 사신 화살표가 난징으로 모인다 |
| s2 | 10초 | 정화는 명 황제의 함대를 이끌고 인도양을 일곱 번 건넌 사람 | 정화 픽토그램이 튀어나오고, 배가 뱃길을 따라가며 뱃길이 일곱 번 그려지고 숫자가 오른다 |
| s3 | 11초 | 28년 동안 일곱 번 떠난 함대는 왜 멈췄을까? 정화는 왜, 무엇을 얻으려고 떠났을까? | 1405~1433 막대 위에 배 일곱 척이 차례로 뜨고, 여덟 번째 자리가 비어 X 표가 된 뒤 질문이 떠오른다 |

만드는 법: 화면은 SVG를 시간 t의 함수로 그리고(`build_html.py`), 브라우저로 프레임마다 찍고(`frames.js`), ffmpeg로 해설과 합친다. 해설은 `tts.py`(Supertonic 3, 0번 목소리). 지도는 `atlas-simple`의 1492년 데이터를 쓴다.

```
python3 build_html.py <저장소 경로> scenes.html
node frames.js scenes.html s1 10.5 frames_s1
ffmpeg -framerate 30 -i frames_s1/%04d.jpg -i s1.wav -filter_complex "[1:a]adelay=400|400,apad[a]" -map 0:v -map "[a]" -shortest -c:v libx264 -crf 22 -pix_fmt yuv420p clip_s1.mp4
```

결과물(1080p, 30초에 약 1.8MB)은 `hegemony-video-assets` 브랜치의 `_src/hegemony/video/assets/motion/`에 있다.
