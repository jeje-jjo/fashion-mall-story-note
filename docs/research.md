# 조사 결과와 계획 제안

작성: 2026-11-06 · 상태: 확인 완료, 수집 진행함

> 2026-11-06: 제제 확인 후 수집 진행함(인터랙티브 도구 4쪽 제외). 결과와 표 설계는 docs/data.md.

## 1. 공략 사이트(KairoHistory) 조사

### robots.txt와 약관
- `User-Agent: *`는 `Allow: /`다. 사람이 시킨 조회(`Claude-User`)도 허용한다.
- 학습용·대량 수집 봇(`ClaudeBot`, `anthropic-ai`, `GPTBot`, `CCBot`, `Scrapy` 등)은 `Disallow: /`다.
- 약관(2026-10-18 수정)의 관련 내용
  - 개인 참고와 커뮤니티 토론 목적의 이용은 된다.
  - **열람 수준의 자동 접근은 허용되고, 과도한 수집이나 과부하는 안 된다.**
  - 데이터 배치, 페이지 구성, 문구는 운영자의 것이다.
  - 표를 공식 기록처럼 재게시하면 안 된다.
- 그래서 이렇게 하자는 제안이다.
  - User-Agent는 `Claude-User`라고 정직하게 밝힌다.
  - 한 번 받은 페이지는 캐시만 쓰고, 다시 받지 않는다.
  - 공개 저장소에는 노트에 필요한 값만 남기고 원문 HTML은 올리지 않는다(`tools/crawler/cache/`는 git 제외).
  - 화면 하단에 출처와 "비공식·개인 참고용"을 표기한다.

### 페이지 구성
한 페이지에 그 분류 전체가 들어 있다(예: 옷 448벌이 `clothes.html` 한 장). 그래서 **필요한 페이지는 15장 안팎이면 된다.**

| 페이지 | 내용 | 노트 활용 |
|---|---|---|
| clothes.html | 옷 448벌: 사이트 #, 분류, 장르(세부), 색, 레시피(옷본+재료), 품질, 인기, 가격, 재고, 계절, 손님 성향, 포함된 세트, 스타일 점수, Tier | ★ 핵심 |
| recipes.html | 옷본·재료와 만드는 옷 | ★ |
| outfits.html | 코디 세트 `#s0~` 와 구성 옷 | ★ |
| facilities.html | 시설 비용, 효과, 시너지 | ★ |
| charas.html | 손님, 직원, 유명인의 취향, 직업, 등장 조건 | ◯ |
| missions.html / progress.html | 미션 보상, 진행 | ◯ |
| skills.html / staff.html | 점원 스킬, 스터디, 유니폼 | ◯ |
| carryover.html / mechanics.html | 회차 승계, 공식 | ◯ 공략 메모용 |
| items.html / goods.html | 아이템, 음식·상품 | △ |
| builder / layout / sales / match | 인터랙티브 도구(JS) | ✕ 수집 안 함. 링크만 |

옷 카드는 `data-type/genre/color/style/season` 속성과 정해진 문구 형식이라 파싱이 쉽다.

### 지금까지 받은 페이지 (총 5번 요청, 3초 간격)
robots.txt, index.html, 약관, clothes.html, outfits.html. 전부 `tools/crawler/cache/`에 있다.

## 2. 기존 노트 id ↔ 사이트 id 맞추기

받아 둔 clothes.html로 이름 매칭을 시험해 봤다(띄어쓰기 무시).

| 결과 | 수 |
|---|---|
| 노트 옷 | 432 |
| 사이트 옷 | 448 |
| 이름이 하나로 딱 맞음 | **414** |
| 같은 이름이 사이트에 2개 | 2 |
| 이름이 달라 못 찾음 | 16 |

- 못 찾은 16개는 대부분 번역 차이다. 노트가 게임 표기를 따른다.
  - 예: 고블랭직 스커트, 호피무늬 후드티, 나비넥타이 달린 셔츠, 데코데코 베스트, 몬츠키 하카마.
  - 그 밖에 아직 못 만든 옷(382, 426, 427)도 있다.

맞추는 순서는 이렇게 제안한다.
1. 이름으로 맞춘다(414개 자동).
2. 남은 것은 분류, 세부 장르, 옷본, 재료, 계절 같은 속성이 같은 후보를 1~3개 뽑는다.
3. 제제는 후보 중 하나를 탭해서 고른다(타이핑 없음). 결과는 `id_map` 탭에 저장한다.
4. 사이트에만 있는 옷(약 16~18벌)은 새 노트 id `433~`로 붙이되, 확인을 받고 붙인다.
5. 노트 id는 절대 바꾸지 않는다. 사이트 번호는 `siteId`에 둔다.

시설(노트 84곳), 코디(노트 112건 ↔ 사이트 세트 207개), 전투도 같은 방식으로 맞춘다.

## 3. 수집 범위와 순서 (제안)
1. 옷: clothes.html, recipes.html를 파싱해 `id_map`(옷)과 "다른 점 목록"을 만든다.
2. 코디 세트: outfits.html를 reference 엑셀(장르별 코디 세트, 유효 156/207)과 대조한다.
3. 시설: facilities.html로 비용, 효과, 시너지를 가져와 노트 시설 84곳과 맞춘다.
4. 챌린지 배틀: reference 엑셀(15개, 일치 의류 38, 추천 코디)을 기준으로 하고, 사이트 match/missions에서 확인만 한다.
5. 캐릭터, 미션, 스킬, 승계, 공식: 공략 메모용으로 `[확인]` 수치만 쓴다.

규칙은 이렇다.
- 페이지마다 1번만 요청한다. 간격은 3초 이상이고 병렬 요청은 하지 않는다.
- 실패해도 자동 재시도를 반복하지 않는다.

## 4. 구글 시트 탭 설계 (제안)

| 탭 | 주요 열 | 비고 |
|---|---|---|
| `clo` | id, siteId, name, siteName, cat(분류), genre, sub(세부 장르), pat(옷본), mat(재료), opt, col, season, quality, pop, price, stock, sets, styleScore, tier, verify | 노트 기준 + 사이트 값 |
| `clo_diff` | id, field, note값, site값, 선택(노트/사이트) | 체크박스·드롭다운으로 고름 |
| `id_map` | kind(clo/fac/coord), noteId, siteId, 방법(name/attr/manual), 확인 | |
| `fac` | id, siteId, name, type, m(상성), p40, cost, area, effect, synergy | |
| `coord` | id(노트), person, req, top, bottom, outer, acc | 손님 요청(기존) |
| `sets` | setId, genre, sub, items(siteId…), noteIds, valid | 코디 세트(새로 추가) |
| `battles` | id, name, cond, stat, reward, values(3), clothCond | 엑셀 '챌린지 배틀 전체' |
| `battle_clo` | battleId, cloId, 비고 | 배틀별 일치 의류 |
| `checks` | id, name, req, facilities, alt, reward | 패션 체크 39 |
| `guide` | 주제, 내용, 등급([확인]/[참고]), 출처 | 공략 메모 |
| `meta` | 수집일, 출처 URL, 버전 | |

- 시트는 사람이 고르고 고치는 곳이다. 빌드는 `tools/sheets`가 `src/data/*.json`으로 내보낸다.
- 진행 체크는 시트에 넣지 않는다. Firestore에만 둔다.

## 5. 새 노트 화면 초안
- 휴대폰은 아래 탭바, 900px 이상은 왼쪽 레일이다. 뮤트 로즈 톤에 파란 버튼은 쓰지 않는다. 헤더는 pill 세그먼트로 한다.

| 탭 | 화면 |
|---|---|
| 메인 | 검색, 남은 할 일, 개량 옵션, 최근, 콘테스트, 회차 전환 |
| 시설 | 기존 기능 전부 + (새) 비용·면적·효과·시너지 펼침 |
| 의류 | 기존 보기·필터·카운터 + (새) 품질·인기·가격·Tier, 포함된 세트, 스타일 점수, 획득 조건 |
| 코디 | [손님 요청 \| 코디 세트] 세그먼트. 세트는 세부 장르별 목록과 만든 옷 ✓ 진행률 |
| 기록 | 콘테스트, 배치, 전투(새: 상세 조건·일치 의류·추천 코디), 패션 체크, 관리 로그 |
| 공략 (새) | 랭크 조건표, 클리어 점수 계산기, 계승·씨앗 계산, 확인된 수치 메모, 출처 |

## 6. 이미 끝난 것 (확인만)
- 저장소: `jeje-jjo/fashion-mall-story-note`, main에 첫 커밋을 올렸다.
- Firebase: docs/firebase.md 참고(Firestore 서울 리전, 웹 앱, 본인 전용 규칙, 승인 도메인).
