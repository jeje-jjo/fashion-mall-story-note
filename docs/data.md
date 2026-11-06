# 기준 데이터 표 설계

정리: 2026-11-06 · 기존 노트 + 공략 사이트(KairoHistory) + reference 엑셀·공략 문서를 조합한 표.
처음 설계안이라 쓰면서 바꾼다.

## 흐름

```
tools/crawler/fetch.py     사이트 15쪽 → tools/crawler/cache/ (한 번만, 3초 간격, Claude-User)
tools/crawler/parse.py     cache → data/site/*.json      (사이트 원값, 30개 표)
tools/sheets/build_tables.py  노트 xlsx·백업 + data/site + reference → data/tables/*.json (40개 표)
tools/sheets/push_firestore.py  data/tables → Firestore ref/*
tools/sheets/export_xlsx.py     data/tables → data/tables/fms_tables.xlsx (시트용, 탭 40개)
```

- `data/`, `cache/`, `snapshots/`, `reference/`는 공개 저장소에 올리지 않는다.
- 기준 데이터 원본은 Firestore `ref/*`에 있다(본인만 읽기·쓰기).
- 다시 만들려면 snapshots·reference를 넣고 위 순서대로 실행한다.

## Firestore 구조

```
ref/{표}            표 정보: title, key, desc, source, columns[{key,label}], rows(행 수)
ref/{표}/rows/{키}  한 행 = 한 문서
```

- 진행 데이터(체크, 기록)는 `ref` 밖에 따로 둔다. 회차별 경로 `runs/rN`을 이어서 쓴다.
- 키 열 값이 없는 행(사이트에만 있는 옷·시설)은 `s{사이트번호}`를 키로 쓴다.

## 원칙
- **노트 id가 기준**이다. 사이트 번호는 `siteId` 열에 따로 둔다. 예: 노트 5 브이넥 스웨터 = 사이트 #18.
- 노트 값(사용자 수정 반영)은 덮어쓰지 않는다.
  - 사이트 값은 `site*`, `기본*` 열에 나란히 둔다.
  - 둘이 다르면 `*_diff` 표에 남긴다. `choice` 칸이 비어 있으면 노트 값을 쓴다.
- 사이트 표기는 노트 표기로 바꾼다(`terms` 표). 예: 서브컬처→서브컬쳐, 카무플라주→카모플라주, 대미지→데미지.
- 진행 기록(완료, 점수, 전투 슬롯, 추가옵션 메모)은 이 표들에 넣지 않는다. tools/migrate에서 따로 옮긴다.

## 표 목록

### 핵심(노트 id 기준)
| 표 | 키 | 행 | 내용 |
|---|---|---|---|
| `clothes` | id | 450 | 노트 옷 432 + 사이트에만 있는 18(점원 유니폼 16, 카이로군 2). 노트 열 + 사이트 기본 품질·인기·가격·재고·Tier·손님 성향·스타일 점수·코디 세트·입수 방법·잘/안 어울림 |
| `clothes_diff` | id:항목 | 20 | 노트 ↔ 사이트 다른 칸(색, 옷본 기모노/전통 의상, 계절 등) |
| `facilities` | id | 140 | 노트 시설 84 + 사이트에만 있는 56(환경·장식 등). 크기, 칸 수, 건설비, 유지비, 매력·인기·평판, 효과, 상성 ◎◯× 목록 |
| `facility_items` | 시설id:아이템 | 1680 | 시설 × 아이템 20 상성(노트) |
| `items` | name | 20 | 상성 아이템 20종 |
| `fashion_checks` | 번호 | 44 | 노트 39 + 사이트 모델 체크 5(100번대). 필요·대신 가능 시설 id, 평론가, 상금, 보상 옵션, 등장 조건 |
| `battles` | b0~b14, sb0~ | 27 | 챌린지 15(노트) + 다른 가게 직원 12. 요청 설명, 의류 조건, 원문값 3개, 참가비, 등장 조건 |
| `battle_clothes` | | 79 | 배틀별 의류: 엑셀 일치 38 + 노트 전투 추천 41 |
| `battle_sets` | | 40 | 배틀별 추천 코디(엑셀) |
| `coord_requests` | id | 112 | 손님 코디 요청(노트). 옷 이름 → 노트 옷 id 자동 연결 |
| `outfit_sets` | setId | 207 | 사이트 코디 세트. 구성(노트 id/사이트 #), 유효(2파츠 이상) 156 |
| `recipes` | 사이트 키 | 81 | 옷본(베이스) 14, 재료(형태) 32, 옵션(장식)·희귀 옵션. 개방 비용, Tier, 스타일 보너스, 희귀 옵션 수치 |
| `upgrade_options` | option | 22 | 개량 옵션 × 직원(노트) |
| `characters` | siteId | 118 | 손님·직원·유명인: 나이·마을·성향, 좋아함, 관련 옷 |
| `verify` | key | 7 | 게임에서 확인할 것(노트) |
| `guide` | g# | 42 | 공략 문서 절 단위(등급: 확인/사례/추천/미확인) |

### 사이트 참고 표(`site_*`)
- contests 20, ranks 11, trophies 40, investments 71, sales_trips 5, exams 28, missions 71
- skills 5, studies 11, uniforms 8, items 26, goods 420
- formulas 3, grades 9, fever 7, carryover_choices 9, clear_points 14
- activities 12, celebrities 17, comment_replies 48

열 이름은 사이트 표 머리글 그대로다(`c0, c1 …` = 머리글). 긴 대사·SNS 글 원문은 옮기지 않았다.

### 관리용
| 표 | 내용 |
|---|---|
| `id_map` | 노트 id ↔ 사이트 #, 방법(name / name+attr / 후보 / site-only), 확인 |
| `terms` | 표기 규칙 |
| `_meta` | 표 목록·행 수·출처 |

## 매칭 결과
- **옷**: 이름 일치 429벌.
  - 같은 이름 2개(코튼 팬츠: 노트 140 → 사이트 #136으로 골랐고 #144가 후보)는 확인이 필요하다.
  - 카이로군 변신 슈트·헤드(노트 426, 427)는 사이트 이름이 "변장"이라 후보 #218·#459만 붙였다(확인 필요).
- **시설**: 84곳 전부 이름 일치. 노트·사이트 장르 차이 없음.
- **패션 체크**: 39개 전부 일치. 모델 체크 5개가 사이트에 더 있다.
- **배틀**: 15개 전부 일치. 고저스 챌린지 = 사이트 "성숙 챌린지 배틀", 특기 챌린지 배틀 = "자신 있는 챌린지 배틀".

## 출처 표기(앱 화면 하단)
- 공략 사이트: https://kairo.waterbeetles.dev/ko/fashion-mall-story/ (KairoHistory, 비공식 팬 위키)
- 개인 참고용, 카이로소프트 공식 아님
