# ism 페이지 소스

`ko/ism`, `en/ism`, `id/ism`의 `index.html`은 이 폴더에서 생성된다. 직접 고치지 말고 여기를 고친 뒤 다시 빌드한다.

```
python3 _src/ism/build.py .          # 세 언어 모두
python3 _src/ism/build.py . en       # 한 언어만
```

- `template.html`, `style.css` — 공통 화면
- `struct.json` — 언어와 무관한 구조: 사상의 영역·탄생/쇠퇴 시점·계승/반발 관계, 시대별 그래프 좌표
- `{ko,en,id}.json` — 분기점·사상·시대별 그래프 문구 (그래프 이름표가 겹치면 `era[k].pos`로 언어별 좌표를 덮어쓴다)
- `{ko,en,id}.page.json` — 제목, 섹션 설명, 버튼 등 화면 문구
