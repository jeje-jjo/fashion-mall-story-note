# 픽셀 다이어리 레이아웃

2026-11-09 · 의류 이미지 없이 도트 느낌을 살리는 화면 개편.

## 바뀐 화면

- 크림색 종이·작은 도트 배경·로즈 선택 상태·각진 프레임으로 통일.
- 제목에 Galmuri 도트 서체, 목록·입력에는 읽기 쉬운 기존 서체 사용.
- 내비게이션·빠른 보기·완료 표시는 직접 그린 공통 SVG. 의류별 이미지와 이미지 DB는 없음.
- 검색과 보기 선택을 의류 도감 위에 배치. 필터 칩은 한 줄 가로 스크롤, 펼치면 전체 표시.
- 1100px 이상에서 필터 2열, 1180px 이상에서 넓은 왼쪽 메뉴. 모바일은 기존 하단 메뉴.
- 의류 상세는 기존처럼 행 아래로 펼침. 목록 번호·체크 접근성·본문/목록 바로가기 추가.
- 다음에 만들 옷은 의류 도감 뒤로 이동. 기존 네 탭·다중 선택·선택 저장·옵션 카운터·빠른 보기 유지.

## 코드 경계

| 파일 | 역할 |
|---|---|
| `app/index.html` | 앱 셸·로그인 게이트·출처 |
| `app/src/main.ts` | 스타일·공통 아이콘 설치, 실행 모드 분기 |
| `app/src/startup.ts` | 기존 Firebase 인증·기준 데이터 로딩 |
| `app/src/engine-loader.ts` | 데이터·저장소 주입 후 엔진 import |
| `app/src/engine.js` | 기존 화면·상태·저장 동작. public에서 Vite 모듈로 이동 |
| `app/src/styles/legacy.css` | 기존 기능 화면 호환 스타일 |
| `app/src/ui/information.js` | 주요 수치·항목/값·활용처·참고 정보의 공통 표현 |
| `app/src/styles/pixel-diary.css` | 신규 색상 토큰·도트 표현·도감 배치 |
| `app/src/ui/pixel-icons.ts` | 16×16 공통 벡터 아이콘 |
| `app/src/preview.ts` | 별도 미리보기 진입점, 기존 공개 기준 데이터·명시적인 레이아웃 예시·메모리 저장소 |

인증·Firestore 경로·항목 ID 변환·기존 사용자 수정값 처리·보안 규칙은 유지한다.
화면 엔진 전체를 새 프레임워크로 다시 쓰지는 않았다. 기존 기능 회귀를 줄이면서
향후 화면 단위 분리가 가능하도록 엔트리·스타일·아이콘·빌드 경계를 먼저 나눴다.
엔진은 Vite 해시 자산으로 배포되어 변경 시 캐시가 갱신된다.

## 위키 참고 범위

KairoHistory의 패션몰스토리 홈에서 옷·재료·코디·시설·게임 진행 분류를 참고했다.
기존 Firestore 사이트 기준 데이터와 출처 링크를 유지했다. 위키의 이미지나 전체
문서를 복제하지 않았으며, 대량 수집·DB 변경·진행 데이터 이전을 하지 않았다.

## 검증과 배포

- `npm run build`: 인증·Firestore를 사용하는 운영 빌드.
- `npm test`: `build:preview` 후 빌드 결과를 실제 Chromium으로 실행.
- 검색·다중 필터·완료 체크·상세·시설 체크·탭 전환·테마·빠른 보기·최근 변경 검증.
- 320/390/768/1440px에서 탭 전환과 필터 펼침 시 가로 넘침 검증.
- 미리보기에서 Firestore/Auth 네트워크 요청이 발생하지 않는지 검증.
- 실제 계정 Google 로그인·Firestore 동기화, iPhone Safari 실기기 확인은 별도 필요.
- 배포 구조는 기존 GitHub Pages/Actions 유지. `build:preview` 결과는 운영 배포에 사용하지 않음.

서체: [Galmuri](https://github.com/quiple/galmuri), SIL Open Font License 1.1.
라이선스 사본은 `app/public/licenses/Galmuri-OFL.txt`에 포함한다.

후속 개편: [한 화면에서 비교하는 정보 구조](readable-information.md).
