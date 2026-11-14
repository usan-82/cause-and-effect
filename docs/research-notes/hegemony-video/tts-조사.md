# 무료 해설 TTS 조사 보고 (확인일 2026-11-14)

## 결론
- **1순위는 Google Cloud Text-to-Speech의 기존 음성(WaveNet·Neural2·Standard)입니다.** 한 도구로 세 언어를 처리할 수 있고, 월 무료 한도가 필요량(4만~6만 자)보다 수십 배 큽니다. 출처 표시 의무가 없고, 이 클라우드 세션에서 API까지 연결되는 것도 확인했습니다. 단점은 결제 계정(카드)이 필요하다는 점입니다.
- **2순위는 Supertonic 3입니다.** sherpa-onnx가 만든 int8 패키지로 받습니다. 모델 하나가 한·영·인니를 모두 지원하고 CPU로 돌아갑니다. 가중치는 GitHub 릴리스에서 받을 수 있어 이 세션에서도 가능하고, 계정·카드가 필요 없습니다. 라이선스는 OpenRAIL-M(상업 이용 허용, 용도 제한 있음)입니다. 다만 저장소가 보관(archived) 상태이고, 품질 근거는 개발사 자체 벤치마크뿐입니다.
- 영어만 따로 보면 **Kokoro(kokoro-onnx, Apache-2.0)**가 로컬 대안으로 가장 강합니다.
- **중학생 대상이라 직접 걸리는 위험이 있습니다.** 구글은 "18세 미만을 대상으로 하거나 18세 미만이 쓸 가능성이 높은 웹사이트·앱·온라인 서비스의 일부로 생성형 AI를 쓰지 말라"는 조항을 두고 있습니다. 이 조항이 Gemini TTS(무료 API)와 Chirp 3 HD에 적용되는지는 공식 답이 없습니다.
- **무료 등급에서 광고 붙는 영상에 쓸 수 없거나 근거가 없는 것:** ElevenLabs, Typecast 무료, CLOVA Dubbing 무료, Azure F0(상업 이용권이 유료 등급에만 명시됨), edge-tts, XTTS-v2, MMS, F5-TTS, Piper 인도네시아어 음성.

표기 규칙
- [직접] 이 세션에서 원문을 직접 열어 확인한 것
- [스니펫] 공식 페이지지만 세션에서 막혀 검색 요약으로만 확인한 것
- [2차 자료] 블로그 등
- [미확인] 확인하지 못한 것
- [해석] 제 판단

## 0. 이 세션의 네트워크 실측
페이지 읽기와 연결 확인만 했습니다. 설정 변경, 설치, 대용량 다운로드는 하지 않았고, 임시 파일은 삭제했습니다.

**열림**
- pypi.org, files.pythonhosted.org
- raw.githubusercontent.com
- GitHub 릴리스 다운로드 URL(302 응답 후 release-assets.githubusercontent.com으로 이동)
- archive.ubuntu.com
- API 엔드포인트 3곳: texttospeech.googleapis.com, generativelanguage.googleapis.com, polly.*.amazonaws.com
  - 셋 다 키 없이 보냈을 때 서비스 자체가 403/인증 오류를 돌려줬습니다. 즉 서비스까지는 도달합니다.
- cloud.google.com(요금·약관 페이지), www.microsoft.com

**막힘**
- 모델 배포처: huggingface.co, modelscope.cn, dl.fbaipublicfiles.com
- 구글 문서: ai.google.dev, docs.cloud.google.com
- MS: azure.microsoft.com, learn.microsoft.com, *.tts.speech.microsoft.com, speech.platform.bing.com(edge-tts가 쓰는 서버), explore.microsoft.com
- AWS 문서: aws.amazon.com, docs.aws.amazon.com
- 상용 TTS: api.elevenlabs.io, elevenlabs.io, typecast.ai, clovadubbing.naver.com, ncloud 문서
- Cloudflare: api.cloudflare.com, developers.cloudflare.com
- 기타: *.github.io, kaggle
- GitHub 저장소 웹페이지와 API는 이 세션에 붙지 않은 저장소라 프록시가 403을 냅니다. raw 파일과 릴리스 다운로드는 됩니다.
- 프록시 로그에는 10:06~10:08에 설치 시험 쪽의 시도도 남아 있습니다. huggingface.co, speech.platform.bing.com, api.elevenlabs.io, eastus.tts.speech.microsoft.com이 모두 403으로 거부됐습니다.

## 1-A. 클라우드·서비스 비교

| 후보 | 한/영/인니 | 무료 범위 | 가입·카드 | 광고 붙는 공개 영상에 사용 | 출처 표시 | 이 세션 | 근거 |
|---|---|---|---|---|---|---|---|
| **Google Cloud TTS 기존 음성**(Standard·WaveNet·Neural2) | ○/○/○. 인니에 Neural2가 있는지는 [미확인]이라 voices.list로 확인 필요 | 매월 Standard·WaveNet 0~400만 자, Neural2 0~100만 자 무료. 초과분 WaveNet·Standard $4/100만 자, Neural2 $16. SSML 태그도 글자 수에 포함 [직접] | 결제 사용 설정 필수("You must enable billing")이므로 카드 등 결제수단 필요 [직접] | 가능. 서비스 약관에 TTS 산출물 사용 제한 조항이 없음. 산출물로 유사 모델을 만들거나 개선하는 것만 금지(§17) [직접]. 기존 음성은 '생성형 AI' 조항 밖이라고 보는 편이 자연스러움 [해석] | 없음(약관에 조항 없음) [직접]. 커뮤니티 답변도 같음 [2차 자료] | **가능**(API 키 필요) | G1, G2 |
| Google Cloud TTS **Chirp 3: HD** | ○/○/○ [스니펫] | 매월 0~100만 자 무료, 초과 $30/100만 자 [직접] | 위와 같음 | 산출물 소유권은 고객(§20a). 다만 §20(d)가 18세 미만 대상·접근 가능 서비스에서 생성형 AI 사용을 금지함. 서비스 요약은 "모든 서비스의 생성형 AI 기능"까지 생성형 AI로 포함함 [직접]. 요금표가 Chirp 3 HD를 "LLM 기반" 최신 모델로 분류하므로 적용될 소지가 있음 [해석] | 없음 | **가능** | G1–G4 |
| **Gemini API TTS**(AI Studio 무료 등급, gemini-3.8-flash-tts 등) | ○/○/○. 3.8 Flash TTS는 130개 언어 [스니펫] | 무료 등급은 입·출력 "Free of charge" [2차 자료]. 무료 한도는 공식 문서에서 표가 빠지고 AI Studio 화면에만 표시 [2차 자료]. 예전 2.5 Flash TTS 무료 한도는 분당 3회·하루 15회 [2차 자료] | 구글 계정과 API 키만, 카드 불필요 [2차 자료] | **불명확, 비권장.** ① 18세 이상만 사용 가능하고, 18세 미만 대상·접근 가능 서비스에 사용 금지 [스니펫]. 미리 만든 어린이용 유튜브 영상·앱 오디오에 써도 되느냐는 포럼 질문이 여러 건 있으나, 구글은 "법률 안내 불가"로만 답함 [GA4] ② 무료 등급의 입력·출력은 구글 제품 개선에 쓰임 [스니펫] ③ 산출물 소유권은 주장하지 않음 [스니펫] | 명시된 의무 없음 [스니펫] | 가능(generativelanguage 도달, 키 필요). 문서는 막힘 | GA1–GA5 |
| Cloud TTS의 Gemini-TTS(유료 전용) | ○/○/○ [스니펫] | 무료 없음("Not available"). 3.8 Flash TTS는 2026-12-31까지 입력 $0.5·출력 $9(100만 토큰당), 2027-01-01부터 $1·$18 [직접] | 카드 | §20(d) 그대로 적용 | 없음 | 가능 | G1, G2 |
| **Azure AI Speech F0** | ○/○/○. id-ID Gadis·Ardi, ko-KR SunHi 등 [스니펫] | 신경망 음성 월 50만 자 [스니펫] | 가입 시 카드 본인확인, 선불·가상카드 불가 [스니펫] | **비권장.** Product Terms 원문: "For Customers of the **paid tier** TTS Service only, Customer may use the audio output of prebuilt neural voices… including for commercial purposes." [직접]. 무료 등급에는 이 권리가 명시되지 않음. MS Q&A 답변도 엇갈림 [2차 자료] | [미확인] | 불가(음성 서버 막힘) | M1–M5 |
| **Amazon Polly** | 한○(Seoyeon 1개) / 영○ / **인니✕**. 공식 SDK의 LanguageCode 목록에 id-ID 없음 [직접] | 옛 계정: 12개월간 월 표준 500만·뉴럴 100만 자 [스니펫·2차 자료]. 2025-07-15 이후 신규 계정: 크레딧 최대 $200, 무료 플랜 6개월 [스니펫] | AWS 가입 시 결제수단 [미확인] | 가능. "재배포 등 어떤 용도로든 오디오 파일 저장 가능" [스니펫] | 없음 [미확인] | 가능(키 필요) | A1–A5 |
| ElevenLabs Free | ○/○/○ | 월 1만 크레딧(약 10분) [스니펫]. 필요한 약 120분에 크게 부족 | 카드 불필요 [스니펫] | **불가.** 무료는 비상업 전용 + 출처 표시 [스니펫] | 필수 | 불가 | EL1, EL2 |
| 네이버 CLOVA Dubbing 무료 / CLOVA Voice | Dubbing: 한○ 영○ **인니✕**(KO/EN/JA) [스니펫]. Voice: KO/EN/JA/ZH/ES/대만어, 인니✕ [스니펫] | Dubbing 무료 월 15,000자·다운로드 20회 [2차 자료]. Voice는 종량제에 호출이 없어도 기본요금, 무료 없음 [스니펫] | 네이버 계정 | **불가.** 무료는 수익이 나지 않는 채널에만 게시 가능 [2차 자료] | 무료는 필수 [2차 자료] | 불가 | N1–N3 |
| Typecast 무료 | ○/○/○. ssfm-v30 37개 언어 [스니펫] | 웹 스튜디오 3,000 크레딧(약 5분, 평생 한 번). API 월 15k 크레딧(자료에 따라 30k로 상충) [스니펫] | 계정 | **비권장.** 무료 API 산출물은 상업 목적 사용 금지 [스니펫]. 상업 권리는 유료 플랜에 있음 [스니펫] | 필수: "Voice generated with Typecast (https://typecast.ai)" [스니펫] | 불가 | T1–T4 |
| edge-tts(비공식) | ○/○/○ | 사실상 무제한(비공식 경로) | 없음 | **근거 없음, 비권장.** 패키지 라이선스 LGPLv3는 코드에만 해당 [직접]. MS Q&A: Edge 낭독·edge-tts 오디오의 상업적 재배포 권리를 명시한 문서가 없음. MS 측은 유효한 구독 없이 쓰는 서드파티는 약관 위반 소지가 있다고 답함 [2차 자료]. 메인테이너는 개인용이라고 함 [스니펫] | — | 불가(서버 403) | E1–E3 |
| (추가) Cloudflare Workers AI | MeloTTS: 영○ 한○ 인니✕. Aura-2: 영·스페인어만 | 하루 1만 뉴런 무료. MeloTTS는 오디오 1분당 18.63 뉴런, Aura-2-en은 1천 자당 2,727 뉴런(하루 약 3,600자) [직접]. **MeloTTS는 2026-11-20 사용 중단 예정** [직접] | Cloudflare 계정(R2를 이미 씀) | [미확인] | [미확인] | 불가(api.cloudflare.com 막힘) | CF1, CF2 |

## 1-B. 로컬 오픈소스 비교

| 모델 | 한/영/인니 | 코드 / 가중치 라이선스 | 광고 영상 사용 | 가중치 받는 곳 | CPU | 품질 평판 | 이 세션 | 근거 |
|---|---|---|---|---|---|---|---|---|
| **Supertonic 3**(sherpa-onnx int8 패키지) | ○/○/○(31개 언어) [직접] | MIT / **OpenRAIL-M** [직접]. 상업 이용을 허용하되 위법·미성년자 해악·허위정보 등 용도 제한이 붙는 구조. 원문은 HF에 있어 못 봄 [미확인] | 가능(용도 제한 준수 조건). 출처 표시 의무 없음 [미확인] | 공식은 HF. sherpa-onnx GitHub 릴리스 `sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2`가 있음(302 확인). **주의: 이 tar 안의 LICENSE는 코드용 MIT 파일이고, 모델 라이선스가 아님** [직접] | 온디바이스용 99M [직접] | 자체 벤치마크: 한국어 CER 3.26, 인니어 WER 1.34(Qwen3-TTS 한국어 4.07보다 낮음) [직접]. 독립 평가 없음 [미확인]. 저장소 archived, 지원 종료 [직접]. 회사 해산설 [2차 자료] | **가능**(PyPI sherpa-onnx 2.0.1 + GitHub 릴리스). PyPI `supertonic` 패키지는 HF에서 자동 다운로드해서 불가 | S1–S5 |
| **Kokoro-82M / kokoro-onnx** | **영○** / 한✕ / 인니✕ [직접] | kokoro-onnx MIT, kokoro Apache / 가중치 Apache-2.0 [직접] | 가능, 출처 표시 의무 없음 | kokoro-onnx GitHub 릴리스 model-files-v1.1(302 확인). 공식 kokoro 패키지는 HF | CPU 지원 [직접] | Artificial Analysis 기준 오픈웨이트 상위권(5위권) [2차 자료] | **가능** | K1–K3 |
| Piper(piper-tts 1.8.0) | 영○ / 인니○(news_tts 1개) / 한✕ [직접] | 엔진 GPL-3.0 [직접] / 음성마다 데이터셋 라이선스가 다름 | 영어 ljspeech·cori는 공개 도메인이라 가능 [직접]. ryan·hfc_* 등은 CC BY-NC-SA라 불가. lessac 계열은 연구 전용이라 불가 [스니펫]. **인니 news_tts는 lessac에서 파인튜닝했고 데이터셋 라이선스가 "See URL"(링크가 엉뚱하게 말라얄람어 코퍼스)이라 비권장** [직접] | 공식은 HF. sherpa-onnx 릴리스에 vits-piper-* 변환본 있음(id_ID·ljspeech·cori 302 확인) | 가벼움 | 빠르지만 기계적인 편 [미확인] | 가능(sherpa-onnx 경유) | P1–P5 |
| MeloTTS | 한○ 영○ 인니✕ [직접] | MIT, "commercial and non-commercial" [직접] | 가능 | HF + 한국어 BERT(kykim/bert-kor-base, HF) [직접] | "CPU real-time" [직접] | [미확인] | 불가(HF 의존) | ML1 |
| Coqui XTTS-v2 | 한○ 영○ 인니✕(17개 언어) [직접] | MPL-2.0 / **CPML: 모델·산출물 비상업 전용**. Coqui 폐업으로 상업 라이선스를 살 길이 없음 [스니펫·2차 자료] | **불가** | HF | 느림 | 음성 복제 품질 좋음 | 불가 | X1, X2 |
| Meta MMS-TTS | 인니○ 영○ 한[미확인] | 가중치 **CC BY-NC** [직접] | **불가** | HF, dl.fbaipublicfiles(둘 다 막힘) | 가능 | [미확인] | 불가 | MM1 |
| F5-TTS | 영○ 중○, 한·인니 공식 지원 ✕ | MIT / 사전학습 가중치 **CC-BY-NC**(Emilia 데이터) [직접] | **불가** | HF/ModelScope | GPU 권장 | — | 불가 | F1 |
| CosyVoice 3 | 한○ 영○ 인니✕(9개 언어) [직접] | 코드 Apache-2.0 [직접] / 가중치 [미확인] | [미확인] | ModelScope/HF | GPU 권장 | 고품질 | 불가 | C1 |
| (추가) Qwen3-TTS | 한○ 영○ 인니✕(10개 언어) [직접] | Apache-2.0(PyPI) [직접] | 가능(가중치 카드는 [미확인]) | HF/ModelScope | GPU(FlashAttention 권장) [직접] | 고품질 | 불가 | Q1 |
| (추가) Chatterbox Multilingual V3 | 한○ 영○ 인니✕(말레이어만) [직접] | MIT, 저장소 보관 상태 [직접] | 가능. 모든 출력에 PerTh 워터마크가 들어감 [직접] | HF | GPU 위주. 영어 전용 Nano만 CPU | 좋음 | 불가 | CB1 |
| espeak-ng | ○/○/○ [직접] | GPL-3.0 [직접] | 가능 | apt / PyPI espeakng-loader | 가능 | 로봇 음성이라 해설용으로 부적합 | 가능 | ES1 |
| (참고) Wikidepia indonesian-tts | 인니○ | "DO NOT USE FOR COMMERCIAL PURPOSES" [직접] | **불가** | GitHub 릴리스 | — | — | — | W1 |

## 2. 추천

### 1순위: Google Cloud Text-to-Speech, 기존 음성(한·영 Neural2 또는 WaveNet, 인니 WaveNet)
- **무료 범위:** 월 무료 한도(Neural2 100만 자, WaveNet 400만 자) 대비 필요량은 6만 자이고, 다시 녹음을 여러 번 해도 넉넉합니다.
- **조건:** 광고 수익 영상에 쓰는 것을 막는 조항이 없고, 출처 표시 의무도 없습니다.
- **세션:** 이 세션에서 스크립트로 바로 호출할 수 있습니다(엔드포인트 도달 확인).
- **필요한 것:** 결제 계정(카드), API 키(TTS 전용으로 제한 권장), 예산 알림.
- 요청당 입력 상한은 5,000바이트로 알고 있습니다 [미확인]. 한국어 1,300자는 UTF-8로 약 3.9KB라서 문단 단위로 나눠 보내는 것이 안전합니다.
- API 키를 세션에 넣는 일은 작성자가 정할 일입니다. 저는 설정을 바꾸지 않았습니다.
- **Chirp 3 HD**는 품질이 더 낫고 월 100만 자가 무료지만, §20(d) 연령 조항이 적용될 수 있습니다. 미리 만든 영상 오디오라면 "서비스의 일부로 사용"이 아니라고 볼 여지도 있으나, 구글의 공식 해석은 없습니다. 쓸지는 작성자 판단입니다.

### 2순위: Supertonic 3(sherpa-onnx), 계정·카드 없이 완전 로컬
- 모델 하나로 세 언어를 처리하고 CPU로 돌아갑니다. PyPI와 GitHub 릴리스만으로 이 세션에서 받을 수 있습니다.
- **확인할 것 ① 라이선스:** OpenRAIL-M 원문을 HF에 접속되는 PC에서 직접 읽어야 합니다. 교육 해설은 용도 제한에 걸릴 내용이 아닐 것으로 봅니다 [해석].
- **확인할 것 ② 품질:** 자체 벤치마크뿐이므로 세 언어 모두 직접 들어 봐야 합니다. 배포 파일은 int8 양자화본입니다.
- **확인할 것 ③ 지속성:** 프로젝트는 보관 상태라 이후 지원이 없습니다.
- 영상 설명란에 "AI 합성 음성"이라고 적는 것을 권합니다(의무는 아닙니다).

### 언어별로 나눌 경우
- **영어:** 로컬은 Kokoro(kokoro-onnx, Apache-2.0, 이 세션 가능)가 가장 낫고, 클라우드는 Google Neural2/WaveNet.
- **한국어:** Google Neural2/WaveNet(품질을 원하면 Chirp 3 HD, 위험은 감수), 로컬은 Supertonic 3.
  - GPU가 있는 개인 PC라면 Qwen3-TTS(Apache)도 후보입니다. 다만 HF/ModelScope에서 받아야 해서 이 세션에서는 불가합니다.
- **인도네시아어:** Google WaveNet(또는 Chirp 3 HD), 로컬은 Supertonic 3.
  - Piper id_ID, MMS, Wikidepia 모델은 라이선스 때문에 피하는 것이 좋습니다.

### 쓰지 않는 편이 좋은 것
- **Gemini 무료 API:** 18세 조항, 무료 등급 데이터의 제품 개선 사용, 낮은 한도.
- **Azure F0:** 상업 이용권이 유료 등급에만 명시됨. 유료 등급(S0)으로 바꾸면 문제가 사라지지만 소액 과금이 생기고, 이 세션에서는 어차피 막혀 있습니다.
- **ElevenLabs·Typecast·CLOVA 무료:** 비상업 조건이거나 출처 표시가 필요하고, CLOVA는 인니어도 없습니다.
- **edge-tts:** 배포 권리 근거가 없습니다.
- **XTTS-v2·MMS·F5-TTS:** 가중치가 비상업 전용입니다.
- **Polly:** 인니어가 없고, 무료 기간이 한정됩니다.
- **Cloudflare MeloTTS:** 2026-11-20 중단 예정입니다.

## 3. 출처 (모두 2026-11-14 확인)

**Google Cloud**
- G1 요금(날짜 표기 없음) [직접]: https://cloud.google.com/text-to-speech/pricing
- G2 서비스별 약관(현행판 최종 수정 2026-11-11, §17·§20a·§20d) [직접]: https://cloud.google.com/terms/service-terms
- G3 서비스 요약(최종 수정 2026-10-30, "Generative AI Services also includes any generative AI features") [직접]: https://cloud.google.com/terms/services
- G4 Chirp 3 HD 지원 언어 [스니펫]: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd
- G5 Gemini-TTS 지원 언어 [스니펫]: https://docs.cloud.google.com/text-to-speech/docs/gemini-tts
- G6 음성 목록(막힘): https://docs.cloud.google.com/text-to-speech/docs/voices

**Gemini API**
- GA1 추가 약관 [스니펫, 2026-03-23 시행판으로 보임]: https://ai.google.dev/gemini-api/terms
- GA2 요금(막힘): https://ai.google.dev/gemini-api/docs/pricing
  - [2차 자료] https://www.eesel.ai/blog/gemini-3-8-flash-tts-pricing , https://projedefteri.com/en/blog/is-gemini-3-8-tts-free/
- GA3 무료 한도 [2차 자료]: https://aiplug.work/en/blog/gemini-free-tier-limits , https://glama.ai/mcp/servers/@PSYGER02/mcpserver/blob/5d77f6d5c7534750b9ff561f4272e2e2c111822d/MD%20files/API%20MODEL%20RATE%20LIMIT.md
- GA4 연령 조항 관련 포럼 질문:
  - https://discuss.ai.google.dev/t/clarification-on-gemini-api-tts-used-offline-for-pre-rendered-children-s-youtube-videos/185530
  - https://discuss.ai.google.dev/t/gemini-api-age-restriction-may-static-tts-audio-generated-offline-by-an-adult-ship-inside-a-childrens-learning-app/186036
  - https://discuss.ai.google.dev/t/can-i-use-free-tier-gemini-tts-audio-in-monetized-youtube-videos/196204
- GA5 3.8 Flash TTS 모델 페이지 [스니펫]: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts

**Microsoft**
- M1 Product Terms(TTS 산출물 사용권 조항) [직접]: https://www.microsoft.com/licensing/terms/en-US/productoffering/MicrosoftAzure/MCA
- M2 요금 [스니펫]: https://azure.microsoft.com/en-us/pricing/details/speech/
- M3 가입 시 카드 본인확인 [스니펫]: https://support.microsoft.com/en-us/help/4042959
- M4 MS Q&A [2차 자료]: https://learn.microsoft.com/en-us/answers/questions/5805156/please-clarify-the-conflicting-information-regardi
- M5 지원 언어 [스니펫]: https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts

**edge-tts**
- E1 README·LICENSE(LGPLv3) [직접]: https://raw.githubusercontent.com/rany2/edge-tts/master/LICENSE , https://pypi.org/project/edge-tts/
- E2 MS Q&A [2차 자료]: https://learn.microsoft.com/en-us/answers/questions/2088770/are-opensource-edge-tts-free-for-commercial-use , https://learn.microsoft.com/en-us/answers/a/12979213
- E3 메인테이너 토론 [스니펫]: https://github.com/rany2/edge-tts/discussions/261

**AWS**
- A1 요금 [스니펫]: https://aws.amazon.com/polly/pricing/
- A2 2025-07 프리티어 개편 [스니펫]: https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan
- A3 공식 SDK의 Polly 언어 코드 목록 [직접]: https://raw.githubusercontent.com/boto/botocore/develop/botocore/data/polly/2016-06-10/service-2.json
- A4 보관된 옛 음성 목록 [직접]: https://raw.githubusercontent.com/awsdocs/amazon-polly-developer-guide/master/doc_source/voicelist.md
- A5 제품 페이지("redistribution") [스니펫]: https://aws.amazon.com/polly/

**ElevenLabs**
- EL1 [스니펫]: https://elevenlabs.io/docs/overview/administration/billing
- EL2 [스니펫]: https://elevenlabs.io/pricing

**네이버**
- N1 CLOVA Dubbing 사양 [스니펫]: https://guide.ncloud-docs.com/docs/clovadubbing-spec
- N2 무료 한도·조건 [2차 자료]: https://www.inews24.com/view/1341575
- N3 CLOVA Voice 사양 [스니펫]: https://guide.ncloud-docs.com/docs/clovavoice-spec

**Typecast** [모두 스니펫]
- T1 https://typecast.ai/pricing
- T2 https://help.typecast.ai/en/articles/11872662-typecast-api-terms-of-use
- T3 https://help.typecast.ai/en/articles/6696789-how-do-i-attribute-the-source
- T4 https://typecast.ai/docs/models

**Cloudflare** [직접]
- CF1 https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/workers-ai/platform/pricing.mdx
- CF2 https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/workers-ai-models/melotts.json

**Supertonic**
- S1 README(Supertonic 3 공개 2026-04-29, archived) [직접]: https://raw.githubusercontent.com/supertone-inc/supertonic/main/README.md
- S2 sherpa-onnx 안내 [직접]: https://raw.githubusercontent.com/k2-fsa/sherpa/master/docs/source/onnx/tts/supertonic.rst
- S3 패키징 워크플로(MIT LICENSE를 넣음) [직접]: https://raw.githubusercontent.com/k2-fsa/sherpa-onnx/master/.github/workflows/export-supertonic.yaml
- S4 릴리스 파일(302 확인): https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2
- S5 모델 라이선스 원문(막힘): https://huggingface.co/supertone-oss-archive/supertonic-3

**Kokoro**
- K1 [직접]: https://raw.githubusercontent.com/hexgrad/kokoro/main/README.md
- K2 [직접]: https://raw.githubusercontent.com/thewh1teagle/kokoro-onnx/main/README.md
- K3 [2차 자료]: https://artificialanalysis.ai/text-to-speech/leaderboard

**Piper**
- P1 음성 목록 [직접]: https://raw.githubusercontent.com/OHF-Voice/piper1-gpl/main/docs/VOICES.md
- P2 인니 음성 모델 카드 [직접]: https://raw.githubusercontent.com/rhasspy/piper-samples/master/samples/id/id_ID/news_tts/medium/MODEL_CARD
- P3 lessac 연구 전용 라이선스 [스니펫]: https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html , https://github.com/rhasspy/piper/discussions/271
- P4 영어 모델 카드 [직접]: https://raw.githubusercontent.com/rhasspy/piper-samples/master/samples/en/en_US/ljspeech/high/MODEL_CARD (cori도 같은 경로 en/en_GB/cori/high)
- P5 [직접]: https://pypi.org/project/piper-tts/

**기타 로컬 모델**
- ML1 MeloTTS [직접]: https://raw.githubusercontent.com/myshell-ai/MeloTTS/main/README.md , https://raw.githubusercontent.com/myshell-ai/MeloTTS/main/melo/text/korean.py
- X1 XTTS-v2 [직접]: https://raw.githubusercontent.com/idiap/coqui-ai-TTS/dev/docs/source/models/xtts.md
- X2 CPML [스니펫]: https://huggingface.co/coqui/XTTS-v1/raw/main/LICENSE
- MM1 MMS [직접]: https://raw.githubusercontent.com/facebookresearch/fairseq/main/examples/mms/MODEL_CARD.md
- F1 F5-TTS [직접]: https://raw.githubusercontent.com/SWivid/F5-TTS/main/README.md
- C1 CosyVoice [직접]: https://raw.githubusercontent.com/FunAudioLLM/CosyVoice/main/README.md
- Q1 Qwen3-TTS [직접]: https://raw.githubusercontent.com/QwenLM/Qwen3-TTS/main/README.md
- CB1 Chatterbox [직접]: https://raw.githubusercontent.com/resemble-ai/chatterbox/master/README.md
- ES1 espeak-ng [직접]: https://raw.githubusercontent.com/espeak-ng/espeak-ng/master/docs/languages.md
- W1 Wikidepia [직접]: https://raw.githubusercontent.com/Wikidepia/indonesian-tts/master/README.md

**확인 못 한 것**
- Google 음성 이름 목록(ko-KR·id-ID의 Neural2·WaveNet 정확한 이름)
- Azure·Polly·ElevenLabs·Typecast·CLOVA 공식 페이지 원문(모두 막혀 검색 요약만 봄)
- Supertonic OpenRAIL-M 원문, CosyVoice·Qwen3 가중치 카드(HF 막힘)
- 각 모델의 독립적인 품질 평가