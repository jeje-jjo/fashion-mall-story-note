# 작업 진행 상황 (다음 세션 시작 메모)

갱신: 2026-11-06 · 브랜치 `claude/brave-archimedes-bep53r` (main에는 아직 안 합침 → 깃허브 페이지는 예전 뼈대)

## 지금 앱 구조 (2026-11-06 결정)
- **기존 노트 화면을 그대로 쓴다**(제제: 원래 디자인·레이아웃 유지, 꾸미기는 나중). React는 걷어냄.
  - `app/index.html` = 기존 노트 CSS·마크업(legacy/app/pre.html에서 옮김) + 로그인 화면·출처 표기
  - `app/public/engine.js` = 기존 노트 화면 코드(legacy/app/post.html에서 옮김). **이제 이 파일이 원본**. 새 기능도 여기에 같은 방식(문자열 템플릿 + render + data-* 클릭)으로 넣는다.
  - `app/src/main.ts` 로그인 → `ref/*` 표 받기 → `buildData.ts`로 DATA 만들기 → engine.js 실행
  - `app/src/fsdb.ts` 기존 저장소 API(doc/collection/onSnapshot/set/add)를 Firestore로 구현. 경로 앞에 `note/v2/`를 붙인다.
  - `app/src/mockdb.ts` + `VITE_MOCK=1 npx vite` → 로그인 없이 `data/tables/*.json`과 메모리 저장소로 실행(테스트용)
- 번호: 옷·시설 = 사이트 번호(`legacyId`에 기존 번호). 패션 체크·배틀은 엔진이 목록 순서로 저장하므로 순서 유지, 사이트 번호는 `site.id`(체크 = 순서+1, 챌린지 배틀 = 순서+12).
- 사이트 값은 DATA 항목의 `site`에 붙어 있다: 옷(`q, pop, price, tier, sets, styles, good, bad, cust…`), 시설(`w,h,cost,effect…`), 체크(`critic, prize, option, appear`), 배틀(`request, clothCond, values[품질,매력,능력치], fee, clothes, sets`).
  추가 목록: `DATA.facExtra`(마네킹 46~52 등 사이트에만 있는 시설), `checksExtra`(모델 체크 40~44), `battlesExtra`(다른 가게 직원 0~11), `sets`(코디 세트 207), `contests`(통과 점수·상금·보상), `recipes`, `ranks`, `trophies`, `missions`, `chars`, `guide`.

## 테스트 방법
```
cd app && npm ci && VITE_MOCK=1 npx vite --port 5199
# 다른 창: playwright로 http://localhost:5199/fashion-mall-story-note/ 열고 S.tab='fac' 등 바꿔 render()
```
**데이터 준비(클라우드 세션 포함, 2026-11-06~)**: 비공개 저장소 `jeje-jjo/fashion-mall-story-data`에 Firestore `ref` 45표·사이트 정리 JSON·크롤러 캐시가 있다.
```
git clone https://github.com/jeje-jjo/fashion-mall-story-data ../fashion-mall-story-data
tools/data_sync.sh          # → data/tables, data/pulled, data/site, tools/crawler/cache
```
- Firestore 표를 고치면 pull → `tools/data_sync.sh --push` → 데이터 저장소 커밋.
- 맥이 아닌 곳에서 Firestore를 읽어야 하면: OAuth Playground(datastore 범위) 1시간 토큰을 환경의 network secret(`firestore.googleapis.com`)으로 넣고, `push_firestore.token`을 `'proxy-injected'`로 바꿔 실행한다.
- `battle_clothes`·`battle_sets`·`facility_items`·`id_map`에는 번호 바꾸기 전 문서가 Firestore에 남아 있음(앱 영향 없음, 정리는 제제 확인 후).

## 끝난 것
- [x] 기존 노트 화면·기능 전부 새 앱에서 실행(5탭 오류 없음)
- [x] 시설 40P 태그 옆 작은 체크(회차별, `runs/rN/fac/f{id}.p40`), 우선개량 칩에 `40P n/33`
- [x] 코디 탭 [손님 요청 | 코디 세트]: 유효 세트 156개, 기본 장르 칩(완성/전체), 전체·1벌 남음·미완성·완성, 검색, 옷 누르면 정보·완료 체크. 세트 상태는 옷 완료로 계산(따로 저장 안 함)
- [x] 의류 탭 맨 위 "다음에 만들 옷"(접힘): 가진 옷본·재료·옵션 칩(회차별 `runs/rN/ui/recipes`, 노트 표기 그대로) → 만들 수 있는 미완료 옷, 태그(세트 1벌 남음·추가옵션·전투 추천·손님 요청), ✓로 바로 완료, "하나만 더 열면 +n벌". 계절 태그는 8번(지금 상태) 뒤에

## 남은 일 (제제 결정 반영, 순서는 Claude 재량)
제제 원칙: **매력·품질·능력치·통과 점수 등 기준값은 사이트 값을 먼저 보여 주고, 제제가 넣은 기록은 "기록 보기"로 연다.** 기존 노트 데이터(플레이하며 넣은 값)는 모두 유지. 새로 넣으면 좋을 기능은 다 넣고, 빼는 건 제제가 한다.
1. 옷 상세: 사이트 품질·인기·가격·Tier·스타일 점수·코디 세트·상하 궁합 먼저, 기존 기록(DATA.gs 품질·매력)은 "기록 보기"
2. 전투: 사이트 요청·의류 조건·value(품질·매력·능력치)·참가비·보상 먼저, 시도 기록은 "기록 보기". 일치 의류·추천 코디. 다른 가게 직원 배틀 12개
3. 콘테스트: 등급 칸마다 사이트 통과 점수·보상 옵션. 기존 점수 기록은 "기록 보기"
4. 패션 체크: 평론가·상금·보상 옵션·등장 조건, 모델 체크 5개
7. 마네킹 플래너: 칸 5개(장르·계절) → 완료한 옷 조합(아우터·액세서리 포함) 순위, 저장 `runs/rN/mannequins`
8. 헤더 "지금 상태"(년·월·계절·유행색). 월→계절은 제제가 게임에서 알려 줄 예정
9. 메인 "오늘 할 일" 요약, 트로피·미션 체크(회차별, 이전 회차 보존), 랭크 조건표
10. 데이터 이전(tools/migrate): 기존 아티팩트 저장소(ArtifactData, url X6H5NaXw1k8pZD98Raioum) → Firestore `note/v2/...`, 옷·시설 번호를 `DATA.idMap`/`ref/id_map`으로 바꿔서. 백업 후 제제 확인 뒤 실행
11. main에 합쳐 배포 → 맥·아이폰·아이패드 확인

## 데이터 메모
- 옷 계절 `봄&가을` 2벌 → `봄·가을` 통일 필요
- 상하 궁합 목록이 사이트에서 8개까지만 보이고 `+3`처럼 잘림 → cache의 clothes.html 원문에서 전체 목록 확인
- 게임 확인 대기: 옵션 33·42, 카이로군 #218·#459, 코디 79 코튼 팬츠(#136/#144)
