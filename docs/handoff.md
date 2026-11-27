# 다음 세션 인계 (2026-11-27 기준)

새 세션은 이 문서 → `CLAUDE.md` → `docs/plan.md` → `docs/layout-plan.md` 순서로 읽는다.

## 작업 방식
- 브랜치 `claude/intelligent-newton-3bbaqc`에서 작업하고, 같은 커밋을 `main`에도 push → GitHub Actions가 Pages 배포.
- 확인 순서
  1. `cd app && npm run build:preview`
  2. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npx playwright test --trace off` → **21 passed**여야 한다(경로는 세션마다 `ls /opt/pw-browsers`로 확인).
- 시험 화면: `cd app && VITE_MOCK=1 npx vite --port 5199` → `http://localhost:5199/fashion-mall-story-note/`. 기준 데이터는 `data/tables/*.json`(없으면 `python3 tools/sheets/pull_firestore.py`, firebase 로그인 필요).
  - 시험 화면 DB에 값 넣기: `window.__mockDb.doc('runs/r3/...').set({...})`. 회차별 경로는 `runs/r3/`, 공용은 `ui/optcnt`, `chkscore/k0`처럼 루트.
- Firestore 쓰기(REST): `FIRESTORE_API=https://firestore.mtls.googleapis.com/v1/ python3 tools/sheets/push_firestore.py <표이름>`.
- 커밋 메시지는 한국어. 개인 데이터(진행 데이터 json, 클릭 기록, 백업)는 저장소에 절대 넣지 않는다(스크래치 폴더에만).

## 코드 위치
- 화면·동작 거의 전부: `app/src/engine.js`(문자열 템플릿 + `render()` + `data-*` 클릭 위임, 상태 `S`, `remember()`는 localStorage `fms-ui`).
- 기준 데이터 조립: `app/src/buildData.ts` / 표 읽기: `app/src/data.ts` / 시작·그림 로딩: `app/src/startup.ts`.
- 스타일: `app/src/styles/design-system.css`(최신 규칙이 맨 아래, 선택자는 `:root:root`). 디자인 3종(classic/atelier/paper) × 강조색 5종(rose/red/taupe/green/blue) × 라이트/다크를 같이 확인한다.

## 최근에 바뀐 것(2026-11-26~27)
- 의류 탭: 순서 = 필터 카드(장르·옷본·재료·옵션) → **특수옵션 별도 카드(한 줄 전체)** → 보기·검색 → 목록 → **필요한 옵션(접힌 작은 줄)** → **랭크 안내 카드**. '다음에 만들 옷' 카드는 없앰(함수 `nextMakeCard`는 남아 있지만 안 씀).
- 줄 색 고정: 장르 #C9664C · 옷본 #8C6FA6 · 재료 #3F8F86 · 옵션 #B58A33(강조색과 무관).
- 검색 칸 작게(휴대폰 32px·12.5px, 그 외 34px·13px), viewport `maximum-scale=1`(아이폰 입력 확대 방지).
- 일반 옷 '만든 것' 판정 `cloHave`: 완료 체크 OR (체크 대상 아님 AND 장르~옵션 다 열림 AND 열린 체크 대상 옷(특수옵션 옷 제외)이 전부 완료 AND 필요한 옵션 '만들 옷'에 없음).
- 마네킹: 시트 15개 + 추가 93개 = 198개(`ref/mannequin_recs`, 생성 `tools/sheets/mannequin_extra.py`, 시트를 다시 가져오면 이 스크립트도 다시 돌린다). 카드 4상태(완성 가능 → 만듦·액세서리 아직 → 만듦 → 옷 모자람). 장르 칩 아래 액세서리 이름 버튼(산 것 체크, `${RUN}/ui/mqacc`). 이름 누르면 "장르 N" 복사. 새로 완성 가능해지면 "마네킹 완성" 알림.
- 옷 그림: Firestore `ref/clo_img`(비공개), 의류 목록·마네킹·코디 팝업·목표치 추천 세트(줄 누르면 펼침)에 사용.
- 패션 체크: 패드·데스크탑에서 카드 좌우 배치(`.fc-cols`), 번호판에 지금 할 차례 강조(`.fcnext`).
- 랭크를 올리거나 보상(옷본·재료·옵션) 체크 시 바로 넘어가지 않고 아래 안내에 [이동] 버튼(10초) → 누르면 의류 목록 위치로(`goCloSoon` → `#toastGo` → `scrollCloList`, 11-27 변경).
- 특수옵션 경로: 직접 체크 칸을 켜면 그 특수옵션이 의류 옵션 선택에 자동 추가.
- 빠른 보기(오른쪽 아래): [날짜|목표치|개량 옵션|자격시험]. 자격시험 = 14장르 × 중급·상급(`${RUN}/ui/exams`), 상급 체크 시 중급 자동, 28칸 다 하면 탭 숨김. 오리지널리티·사이버 상급은 특수옵션 경로 자동 체크.
- 저장 실패 안내 뒤에 `(오류 코드 · 경로)`가 붙는다(원인 확인용). 아이패드 홈 화면 앱 저장 실패는 홈 화면 재추가로 해결됨(기기 캐시 문제).

## 11-27 추가
- 자격시험: 세로로 먼저 읽기(왼쪽·오른쪽 칸 따로 쌓음 `.excol`), 열린 장르(의류 장르 칩 `S.cloCat` 기준) → 안 열린 장르(흐리게) → 완료(상급까지). 장르 이름 누르면 중급·상급 파라미터·품질(최대 네 자리 숫자) 입력, [저장] 버튼으로만 저장(적는 중 값은 `S.examDraft`), 마지막 값만 `ui/examreq {req:{"장르|중":{p,q,t}}}`(회차 공용).
- 코디 요청 팝업: 지금 할 요청 → '예정 N' → '완료한 요청 N'.
- 개량 옵션 빠른 보기: 다중선택 대신 [직원|재료] 스위치(`S.upQMode`, fms-ui에 기억).

## Firestore 읽기 한도(2026-11-27)
- 11-27 오전에 하루 무료 읽기 5만 건을 다 써서 429 `Quota exceeded`가 남(한국 시각 오후 5시쯤 풀림).
- 원인: 앱을 열 때마다 기준 표 40여 개를 서버에서 통째로 다시 받음(`data.ts`의 뒤 새로 고침) + 변경 기록 500건 구독.
- 고침: 표 정보 문서 `ref/{표}`만 읽어 서명(`ver` 또는 [행 수, 열])이 바뀐 표만 다시 받음, 같아도 3일마다 한 번(localStorage `fms-refsig-v1`). `push_firestore.py`가 `ver`를 넣는다. 변경 기록은 평소 80건, 도구 > 관리·전체 기록 보기에서만 500건.
- 리스너는 30분 넘게 끊겼다 다시 열면 전체를 다시 읽는다(Firestore 과금 규칙). 그 외 큰 구독: `${RUN}/clo`, `${RUN}/fac`.

## 지금 상태
- 진행 중 회차: 16회차(`runs/r16`).
- 사용자 확인 대기: 자격시험 탭, 의류 화면 새 배치, 다음 회차의 일반 옷 판정·마네킹 완성 알림.
- 남은 아이디어(요청 오면): 자격시험 중급을 풀 때 상급도 같이 풀지, 모바일 글씨 전반 추가 축소.
