"""ref/full_* (전체 정보 xlsx) → 화면에서 바로 쓰는 작은 표 두 개
  req_site   요청 하나 = 한 행. 손님 요청(노트 번호), 패션 체크(사이트 번호 = xlsx 항목 ID + 1), 배틀(사이트 번호)
             조건, 요청 문장, 완전 일치 옷, 일부 일치 옷(맞는 조건 수), 사이트 추천 코디
  sales_avg  옷 하나 = 한 행. 판매 점수 전체 손님 평균(유행색 없음) 봄·가을/여름/겨울
6130행짜리 조건별 추천 옷을 앱이 매번 읽지 않도록 미리 묶는다.
사용: python3 tools/sheets/build_req_site.py  (data/tables/full_*.json 필요) → push_firestore.py req_site sales_avg
"""
from __future__ import annotations

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
T = ROOT / "data" / "tables"
CIRC = "①②③④⑤⑥⑦⑧⑨⑩"
COND = ["장르", "스타일", "분류", "태그", "계절", "베이스", "색", "옵션", "지정 옷"]


def load(n):
    return json.loads((T / f"{n}.json").read_text(encoding="utf-8"))["rows"]


def ids(s):
    return [int(x) for x in re.findall(r"#(\d+)", s or "")]


def main():
    match = {}
    for r in load("full_match_clothes"):
        k = (r["c0"], r["c1"])
        m = match.setdefault(k, {"full": [], "part": []})
        if r["c7"] == "완전 일치":
            m["full"].append(r["c4"])
        else:
            m["part"].append(f"{r['c4']}:{r['c8']}")
    notes = load("coord_requests")
    key = {}
    for n in notes:
        g = n["guest"]; c = next((x for x in g if x in CIRC), "①")
        key[(g.replace(c, ""), c)] = n["id"]
    out = []
    for kind, tbl in (("손님 요청", "full_coord_requests"), ("패션 체크", "full_fashion_checks"), ("배틀", "full_battles")):
        for r in load(tbl):
            row = {"kind": kind, "xid": r["c0"], "title": r["c1"], "person": r["c2"], "text": r["c3"],
                   "conds": [f"{COND[i]}: {r[f'c{i + 4}']}" for i in range(9) if r.get(f"c{i + 4}")],
                   "extra": r.get("c13"), "oppo": ids(r.get("c14")), "rec": ids(r.get("c17")), "fullN": r.get("c16")}
            m = match.get((kind, r["c0"]), {"full": [], "part": []})
            row["full"], row["part"] = m["full"], m["part"]
            if kind == "손님 요청":
                c = next((x for x in r["c1"] if x in CIRC), "①")
                nid = key.get((r["c2"], c))
                if nid is None:
                    raise SystemExit(f"노트 코디 번호 없음: {r['c2']} {r['c1']}")
                row.update(key=f"c{nid}", noteId=nid)
            elif kind == "패션 체크":
                row.update(key=f"f{r['c0'] + 1}", siteId=r["c0"] + 1)
            else:
                row.update(key=f"b{r['c0']}", siteId=r["c0"])
            out.append(row)
    assert len({r["key"] for r in out}) == len(out)
    cols = [{"key": k, "label": k} for k in ["key", "kind", "xid", "noteId", "siteId", "title", "person", "text", "conds", "extra", "oppo", "rec", "fullN", "full", "part"]]
    (T / "req_site.json").write_text(json.dumps({"name": "req_site", "title": "요청별 사이트 조건·맞는 옷", "key": "key",
        "desc": "full_coord_requests·full_fashion_checks·full_battles + full_match_clothes 묶음(build_req_site.py)",
        "source": ["KairoHistory match (제제 정리 xlsx)"], "columns": cols, "rows": out}, ensure_ascii=False, indent=1), encoding="utf-8")
    sa = {}
    for k, tbl in (("sa", "full_sales_spring_autumn"), ("su", "full_sales_summer"), ("wi", "full_sales_winter")):
        for r in load(tbl):
            sa.setdefault(r["c0"], {"id": r["c0"]})[k] = round(r["c4"], 1) if r.get("c4") is not None else None
    rows = list(sa.values())
    (T / "sales_avg.json").write_text(json.dumps({"name": "sales_avg", "title": "판매 점수 평균(계절별)", "key": "id",
        "desc": "판매 점수 시트의 전체 손님 평균(유행색 없음). sa=봄·가을 su=여름 wi=겨울. 추정값",
        "source": ["KairoHistory sales (제제 정리 xlsx)"], "columns": [{"key": k, "label": k} for k in ["id", "sa", "su", "wi"]], "rows": rows},
        ensure_ascii=False, indent=1), encoding="utf-8")
    print("req_site", len(out), "sales_avg", len(rows))


if __name__ == "__main__":
    main()
