#!/usr/bin/env bash
# 비공개 데이터 저장소(jeje-jjo/fashion-mall-story-data) → 이 저장소의 git 제외 폴더 채우기
#   tables/        → data/tables/, data/pulled/
#   site/          → data/site/
#   crawler-cache/ → tools/crawler/cache/
# 사용: tools/data_sync.sh [데이터 저장소 경로]   (기본: ../fashion-mall-story-data)
# 반대 방향(여기서 고친 걸 데이터 저장소로): tools/data_sync.sh --push [경로]
set -euo pipefail
cd "$(dirname "$0")/.."

push=0
if [[ "${1:-}" == "--push" ]]; then push=1; shift; fi
SRC="${1:-../fashion-mall-story-data}"
[[ -d "$SRC/.git" ]] || { echo "데이터 저장소가 없음: $SRC (git clone https://github.com/jeje-jjo/fashion-mall-story-data $SRC)"; exit 1; }

pairs=("tables:data/tables" "tables:data/pulled" "site:data/site" "crawler-cache:tools/crawler/cache")
for p in "${pairs[@]}"; do
  from="${p%%:*}"; to="${p#*:}"
  if (( push )); then
    [[ "$to" == data/pulled ]] && continue   # tables 하나만 올린다
    mkdir -p "$SRC/$from" && cp -r "$to/." "$SRC/$from/"
    echo "올림  $to → $SRC/$from"
  else
    mkdir -p "$to" && cp -r "$SRC/$from/." "$to/"
    echo "받음  $SRC/$from → $to ($(ls "$to" | wc -l)개)"
  fi
done
if (( push )); then echo "데이터 저장소에서 git add/commit/push 하세요."; fi
