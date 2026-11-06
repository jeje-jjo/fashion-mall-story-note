"""기준 데이터 id를 공략 사이트 번호로 바꾼다 (2026-11-06 제제 결정, CLAUDE.md 규칙 5)

입력: data/pulled/*.json (pull_firestore.py로 Firestore에서 받은 표, 노트 id 기준)
출력: data/tables/*.json (사이트 번호 기준) → push_firestore.py로 다시 올린다

바꾸는 규칙
- 옷: id = 사이트 번호. 기존 노트 번호는 legacyId. 점원 유니폼(사이트에만 있음)은 뺀다.
  카이로군 426 → #218, 427 → #459 (데이터 확인 페이지에서 고른 값, 게임 확인 대기)
- 시설: id = 사이트 번호. 사이트에만 있는 시설(마네킹·바닥 등)도 사이트 번호로 둔다.
- 패션 체크: id = 사이트 목록 순서(1부터). 노트 1~39는 그대로, 모델 체크 100~104 → 40~44
- 배틀: id = 사이트 목록 순서(0부터). 노트 b0~b14 → 12~26, 다른 가게 직원 sb0~sb11 → 0~11
- 옷 값이 다른 칸(clothes_diff)은 제제 결정대로 사이트 값으로 바꾼다. 옵션이 노트 "(없음)"인 33, 42는 노트 값 유지 + 확인 목록.
- 이 표들을 가리키는 다른 표(facility_items, battle_clothes, battle_sets, coord_requests, outfit_sets, verify, id_map)도 같이 바꾼다.
- reference 엑셀 탭도 xlsx_* 표로 함께 넣는다(모든 자료는 Firestore에 둔다).

사용: python3 tools/sheets/rekey_site_ids.py
"""
from __future__ import annotations

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "data" / "pulled"
OUT = ROOT / "data" / "tables"
REF_XLSX = ROOT / "reference" / "Fashion_Mall_Story_Challenge_Outfits.xlsx"

DIFF_FIELD = {"색": "color", "계절": "season", "옷본": "pattern", "재료": "material", "옵션": "option"}
DIFF_KEEP_NOTE = {"33:옵션", "42:옵션"}           # 게임에서 확인 대기
KAIRO = {426: 218, 427: 459}
COORD_PICK = {77: {"bottomIds": [144]}}          # 아이비 룩 재킷과 같은 세트 #131


def load(name: str) -> dict:
    t = json.loads((SRC / f"{name}.json").read_text(encoding="utf-8"))
    for r in t["rows"]:
        r.pop("_doc", None)
    return t


def save(t: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{t['name']}.json").write_text(json.dumps(t, ensure_ascii=False, indent=1), encoding="utf-8")


def add_col(t: dict, key: str, label: str, after: str) -> None:
    cols = t["columns"]
    if any(c["key"] == key for c in cols):
        return
    i = next((n for n, c in enumerate(cols) if c["key"] == after), 0)
    cols.insert(i + 1, {"key": key, "label": label})


def main() -> None:
    tables = {p.stem: load(p.stem) for p in SRC.glob("*.json")}
    report: list[str] = []

    # ---------------------------------------------------------------- 옷
    clo = tables["clothes"]
    clo_map: dict[int, int] = {}               # 노트 id → 사이트 번호
    site_rows = {r["siteId"]: r for r in clo["rows"] if r["id"] is None}
    rows = []
    for r in clo["rows"]:
        if r["id"] is None:
            continue                            # 사이트에만 있는 행: 카이로군은 아래에서 합치고 유니폼은 버린다
        sid = r["siteId"] or KAIRO.get(r["id"])
        if sid is None:
            raise SystemExit(f"옷 {r['id']} {r['name']}: 사이트 번호 없음")
        if r["id"] in KAIRO:                    # 사이트 행 값으로 채우고 노트 이름·기록은 유지
            s = site_rows[sid]
            for k, v in s.items():
                if r.get(k) in (None, "", []) and k not in ("id",):
                    r[k] = v
            r["match"] = "후보(게임 확인 대기)"
        clo_map[r["id"]] = sid
        r["legacyId"], r["id"], r["siteId"] = r["id"], sid, sid
        rows.append(r)
    dropped = [r["siteId"] for r in clo["rows"] if r["id"] is None and r["siteId"] not in KAIRO.values()]
    report.append(f"옷 {len(rows)}벌(사이트 번호), 뺀 점원 유니폼 {len(dropped)}벌")
    assert len(set(clo_map.values())) == len(clo_map), "옷 사이트 번호 중복"

    # 값이 다른 칸 → 사이트 값
    diff = tables["clothes_diff"]
    by_legacy = {r["legacyId"]: r for r in rows}
    applied = 0
    for d in diff["rows"]:
        f = DIFF_FIELD[d["field"]]
        r = by_legacy[d["id"]]
        if d["key"] in DIFF_KEEP_NOTE:
            d["choice"], d["memo"] = "check", "게임에서 확인(노트 '(없음)')"
        else:
            r[f] = d["site"]
            d["choice"] = "site"
            applied += 1
        d["legacyId"], d["id"] = d["id"], d["siteId"]
    add_col(diff, "legacyId", "기존 노트 id", "id")
    report.append(f"값이 다른 칸 {applied}개를 사이트 값으로, 2개는 확인 대기")

    rows.sort(key=lambda r: r["id"])
    clo["rows"] = rows
    clo["desc"] = (clo.get("desc") or "") + " · id는 사이트 번호, legacyId는 기존 노트 번호(2026-11-06)"
    add_col(clo, "legacyId", "기존 노트 id", "id")

    # ---------------------------------------------------------------- 시설
    fac = tables["facilities"]
    fac_map: dict[int, int] = {}
    for r in fac["rows"]:
        if r["id"] is not None:
            fac_map[r["id"]] = r["siteId"]
        r["legacyId"], r["id"] = r["id"], r["siteId"]
    fac["rows"].sort(key=lambda r: r["id"])
    add_col(fac, "legacyId", "기존 노트 id", "id")
    assert len(set(fac_map.values())) == len(fac_map)
    report.append(f"시설 {len(fac['rows'])}곳(노트 {len(fac_map)} + 사이트에만 {len(fac['rows']) - len(fac_map)})")

    fi = tables["facility_items"]
    for r in fi["rows"]:
        r["facId"] = fac_map[r["facId"]]
        r["key"] = f"{r['facId']}:{r['item']}"

    # ---------------------------------------------------------------- 패션 체크
    fc = tables["fashion_checks"]
    chk_map: dict[int, int] = {}
    for r in fc["rows"]:
        new = r["id"] if r["id"] < 100 else r["id"] - 100 + 40
        chk_map[r["id"]] = new
        r["legacyId"] = r["id"] if r["id"] < 100 else None
        r["id"] = new
        r["facIds"] = [fac_map[i] for i in r.get("facIds") or []]
        r["altFacIds"] = [fac_map[i] for i in r.get("altFacIds") or []]
    fc["rows"].sort(key=lambda r: r["id"])
    add_col(fc, "legacyId", "기존 노트 id", "id")
    for r in fac["rows"]:                       # 시설의 패션 체크 번호 글자도 바꾼다
        if r.get("checks"):
            r["checks"] = " · ".join(str(chk_map.get(int(x), x)) for x in re.findall(r"\d+", str(r["checks"])))

    # ---------------------------------------------------------------- 배틀
    bt = tables["battles"]
    bt_map: dict[str, int] = {}
    for r in bt["rows"]:
        if r["id"].startswith("sb"):
            new = int(r["id"][2:])
        else:
            new = r["refBattleId"]
        bt_map[r["id"]] = new
        r["legacyId"] = r["id"] if not r["id"].startswith("sb") else None
        r["id"] = new
    assert sorted(bt_map.values()) == list(range(27)), sorted(bt_map.values())
    bt["rows"].sort(key=lambda r: r["id"])
    add_col(bt, "legacyId", "기존 노트 id", "id")
    bt["desc"] = (bt.get("desc") or "") + " · values = (코디 합계) 품질, 매력, 능력치 순서(제제 확인)"

    for name in ("battle_clothes", "battle_sets"):
        for r in tables[name]["rows"]:
            r["battleId"] = bt_map[r["battleId"]]
            if name == "battle_clothes":
                if r.get("cloId") is not None:
                    r["cloId"] = clo_map.get(r["cloId"], r["cloId"])
                r["key"] = f"{r['battleId']}:{r['source'][:2]}:{r['cloId'] if r.get('cloId') is not None else r.get('siteId')}"
            else:
                r["key"] = f"{r['battleId']}:{r['rank']}"

    # ---------------------------------------------------------------- 옷을 가리키는 표
    for r in tables["coord_requests"]["rows"]:
        for k in ("topIds", "bottomIds", "outerIds", "accIds"):
            r[k] = [clo_map[i] for i in r.get(k) or []]
        for k, v in COORD_PICK.get(r["id"], {}).items():
            r[k] = v
    for r in tables["outfit_sets"]["rows"]:
        r["clothes"] = list(r["siteClothes"])
    for r in tables["verify"]["rows"]:
        if r.get("ids"):
            r["ids"] = [clo_map.get(i, i) for i in r["ids"]]
    tables["verify"]["rows"].append({"key": "opt_none", "text": "옵션: 노트 (없음) / 사이트 프린트", "ids": [clo_map[33], clo_map[42]], "memo": "2026-11-06 다른 점 확인에서 보류"})
    tables["verify"]["rows"].append({"key": "coord79", "text": "코디 79 매옥준③ 데이트 추운 날: 코튼 팬츠 #136(갈색) / #144(파랑)", "ids": [136, 144], "memo": "맞는 코디 세트 없음"})
    tables["verify"]["rows"].append({"key": "kairo", "text": "카이로군 변신 슈트·헤드 = 사이트 #218·#459 맞는지", "ids": [218, 459], "memo": "노트 426·427"})

    im = tables["id_map"]
    im["rows"] = [r for r in im["rows"] if not (r["kind"] == "clo" and r["noteId"] is None and r["siteId"] not in KAIRO.values())]
    for r in im["rows"]:
        if r["kind"] == "clo" and r["noteId"] in KAIRO:
            r["siteId"], r["method"] = KAIRO[r["noteId"]], "후보 선택(게임 확인 대기)"
        if r["kind"] == "clo" and r["noteId"] is None:
            r["confirmed"] = None                # 카이로군 사이트 행은 노트 426·427에 합쳐짐
            r["memo"] = "노트 426·427에 합침"
        if r["noteId"] == 140 and r["kind"] == "clo":
            r["confirmed"], r["method"] = True, "name+attr(제제 확인)"
    im["rows"] = [r for r in im["rows"] if r.get("memo") != "노트 426·427에 합침"]
    for old, new in chk_map.items():
        im["rows"].append({"key": f"chk:{old}", "kind": "chk", "noteId": old if old < 100 else None, "siteId": new, "method": "order", "confirmed": True})
    for old, new in bt_map.items():
        im["rows"].append({"key": f"battle:{old}", "kind": "battle", "noteId": old if not old.startswith("sb") else None, "siteId": new, "method": "order", "confirmed": True})
    report.append(f"매칭표 {len(im['rows'])}행(패션 체크·배틀 포함)")

    # ---------------------------------------------------------------- reference 엑셀 → xlsx_* 표
    if REF_XLSX.exists():
        import openpyxl
        wb = openpyxl.load_workbook(REF_XLSX, read_only=True, data_only=True)
        for i, ws in enumerate(wb.worksheets):
            vals = [list(r) for r in ws.iter_rows(values_only=True)]
            vals = [r for r in vals if any(v not in (None, "") for v in r)]
            if not vals:
                continue
            head = [str(h) if h not in (None, "") else f"c{j}" for j, h in enumerate(vals[0])]
            cols = [{"key": f"c{j}", "label": h} for j, h in enumerate(head)]
            data = []
            for n, r in enumerate(vals[1:]):
                row = {"key": f"r{n + 1}"}
                row.update({f"c{j}": v for j, v in enumerate(r) if v not in (None, "")})
                data.append(row)
            name = f"xlsx_{i + 1}"
            tables[name] = {"name": name, "title": f"엑셀: {ws.title}", "key": "key",
                            "desc": "reference 엑셀(공략 사이트에서 가져온 값, 2026-11-05) 탭 그대로. 사이트와 다르면 사이트가 맞다",
                            "source": ["reference/Fashion_Mall_Story_Challenge_Outfits.xlsx"],
                            "columns": [{"key": "key", "label": "행"}] + cols, "rows": data}
            report.append(f"{name} {ws.title} {len(data)}행")

    tables["guide"]["desc"] = (tables["guide"].get("desc") or "") + " · 참고용(위키·검색 정리). 사이트와 다르면 사이트가 맞다"

    # _meta 다시 만들기
    meta = tables.pop("_meta")
    meta["rows"] = [{"name": n, "title": t.get("title"), "rows": len(t["rows"]), "source": t.get("source"), "desc": t.get("desc")}
                    for n, t in sorted(tables.items())]
    tables["_meta"] = meta

    for t in tables.values():
        save(t)
    print("\n".join(report))


if __name__ == "__main__":
    main()
