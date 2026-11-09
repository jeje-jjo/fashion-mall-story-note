# fashion-mall-story-note

카이로소프트 게임 「패션몰스토리」 개인 진행 관리 노트.

- 화면: Vite + TypeScript, GitHub Pages
- 진행 데이터: Firebase Firestore (구글 로그인, 본인만 쓰기)
- 기준 데이터: 게임 화면 기록, 공략 사이트(https://kairo.waterbeetles.dev/ko/fashion-mall-story/), 일본어 위키(https://wikiwiki.jp/kairoparknew/)

개인 참고용이며 카이로소프트 공식 자료가 아닙니다.

`legacy/`는 이전 버전(claude.ai 아티팩트 단일 HTML)입니다. 작업 안내는 `CLAUDE.md`와 `docs/plan.md`에 있습니다.

## 개발·미리보기·빌드

```sh
cd app
npm ci
npm run dev                # Google 로그인 + 기존 Firestore
npm run dev:preview        # 로그인 없이 UI 확인, 기존 기준 데이터 + 상세 레이아웃 예시
npm run build              # GitHub Pages 배포용 app/dist 생성
npm run build:preview      # 독립 미리보기 app/preview-dist 생성
npx playwright install chromium
npm test                   # 빌드된 미리보기로 기능·반응형 검증
```

미리보기는 실제 Firestore에 연결하지 않으며 완료 체크는 창의 메모리에만 남습니다.
미리보기의 번호·수치는 기존 노트 기준 데이터와 일부 화면 검토용 예시입니다. 운영 사이트 기준 번호·진행률과 다르며, 예시 모듈은 운영 빌드에 포함되지 않습니다.
`main`에 앱 변경을 push하면 기존 GitHub Actions가 배포용 빌드만 Pages에 올립니다.

화면 구조와 이번 개편 범위: [픽셀 다이어리 개편](docs/pixel-diary.md).

디자인 선택: **도구 → 화면 → 디자인**에서 현재 디자인·아틀리에·페이퍼를 전환할 수 있습니다.
[실제 화면 비교](docs/appearance-gallery.md)에서 라이트·다크·모바일과 주요 상세를 확인할 수 있습니다.
