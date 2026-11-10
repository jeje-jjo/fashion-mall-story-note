"""제제가 드라이브에 올린 「패션몰 스토리 — 요청·옷·판매·코디 전체 정보.xlsx」(KairoHistory 수집, 2026-11-10)
→ data/tables/full_*.json. 그 다음 push_firestore.py full_... 로 Firestore ref/full_* 에 넣는다.

- 시트마다 표 하나. 열 이름은 Firestore 필드 이름 문제를 피하려고 c0, c1 … 로 두고 label에 원래 이름을 남긴다.
- 키: 첫 열 값이 모두 있고 겹치지 않으면 그 값, 아니면 행 번호.
- 숫자 2.0 같은 값은 정수로 바꾼다. 빈 칸은 null.

사용: python3 tools/sheets/import_full_xlsx.py reference/full_info.xlsx
"""
from __future__ import annotations

import json
import pathlib
import sys

import openpyxl

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "tables"
NAMES = {
    "안내": "full_guide", "옷": "full_clothes", "코디 세트": "full_outfit_sets", "손님 요청": "full_coord_requests",
    "패션 체크": "full_fashion_checks", "배틀": "full_battles", "조건별 추천 옷": "full_match_clothes",
    "판매 손님": "full_sales_guests", "판매 점수 봄가을": "full_sales_spring_autumn", "판매 점수 여름": "full_sales_summer",
    "판매 점수 겨울": "full_sales_winter", "판매 유행색별 평균": "full_sales_trend", "분류 사전": "full_codes", "설명·FAQ": "full_faq",
}


def norm(v):
    if v == "" or v is None:
        return None
    if isinstance(v, float) and v.is_integer():
        return int(v)
    return v


def main(path: str) -> None:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    for ws in wb.worksheets:
        rows = [list(r) for r in ws.iter_rows(values_only=True)]
        if not rows:
            continue
        head = [str(h or f"열{i + 1}") for i, h in enumerate(rows[0])]
        body = [r for r in rows[1:] if any(x not in (None, "") for x in r)]
        name = NAMES.get(ws.title) or "full_" + str(len(NAMES))
        first = [norm(r[0]) for r in body]
        unique = all(x is not None for x in first) and len(set(map(str, first))) == len(first)
        cols = [{"key": "row", "label": "행"}] + [{"key": f"c{i}", "label": h} for i, h in enumerate(head)]
        out = []
        for n, r in enumerate(body, 1):
            d = {"row": n}
            for i in range(len(head)):
                d[f"c{i}"] = norm(r[i] if i < len(r) else None)
            out.append(d)
        t = {"name": name, "title": ws.title, "key": "c0" if unique else "row",
             "desc": "KairoHistory 요청·옷·판매·코디 전체 정보 xlsx(2026-11-10 수집, 제제 드라이브)",
             "source": ["KairoHistory clothes·match·sales·coordinate (제제 정리 xlsx)"], "columns": cols, "rows": out}
        (OUT / f"{name}.json").write_text(json.dumps(t, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{name:28s} {ws.title:12s} {len(out):5d} rows  {len(head)} cols  key={t['key']}")


if __name__ == "__main__":
    main(sys.argv[1])
