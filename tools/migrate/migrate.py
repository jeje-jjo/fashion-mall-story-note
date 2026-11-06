"""기존 노트(claude.ai 아티팩트 저장소) → 새 노트(Firestore note/v2/...) 이전.

입력: 아티팩트 저장소를 컬렉션별로 내려받은 폴더(ArtifactData list → out_dir). 문서 하나 = {컬렉션}/{doc}.json
규칙(제제 2026-11-06):
  - 회차 초기화 때 지워지는 것(runs/* : 시설·의류 체크, 넣은 아이템, 추가옵션 메모, 코디 완료, 가진 재료)은 옮기지 않는다.
  - 나머지(이름 수정·옷 정보 수정·코디 수정·패션 체크 이름/대상·전투 기록·추천 전투·콘테스트·점수·년도·계산기·메모·배치·화면 설정·회차 정보·확인 체크·로그)는 옮긴다.
  - 옷·시설 번호는 사이트 번호로 바꾼다(ref 표 clothes/facilities 의 legacyId). 이름 값은 그대로 두고 새 노트가 읽을 때 DATA.alias 로 바꾼다.
  - 기존 노트는 읽기만 한다.

사용:
  python3 tools/migrate/migrate.py DUMP_DIR                 # 계획만 출력(쓰지 않음) → tools/migrate/out/plan.json
  python3 tools/migrate/migrate.py DUMP_DIR --write         # Firestore에 쓰기(프록시가 인증을 넣어 줌, 토큰 필요)
  python3 tools/migrate/migrate.py DUMP_DIR --only runs,calc,meta --import OUT.json
      # 앱의 "기존 노트에서 가져오기"용 파일(토큰 필요 없음). runs = 회차별(시설·의류 체크, 넣은 아이템, 추가옵션 메모,
      #   코디 완료, 가진 재료), calc = 클리어 포인트·회차 연계, meta = 회차 정보
"""
import json
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROJECT = "fashion-mall-story"
PREFIX = "note/v2"
DB = f"projects/{PROJECT}/databases/(default)"
API = f"https://firestore.googleapis.com/v1/{DB}/documents"

# clofix(옷 정보 수정 7벌)는 모두 사이트 값과 같아 옮기지 않는다(사이트 값 우선, 2026-11-06 확인)
KEEP = ["meta", "names", "checks", "coordfix", "cbattle", "battles", "contest", "chkscore",
        "cyear", "calc", "memo", "layslots", "ui", "log"]


def table(name):
    return json.load(open(ROOT / "data" / "tables" / f"{name}.json"))["rows"]


CLO = {r["legacyId"]: r["id"] for r in table("clothes") if r.get("legacyId") is not None}
FAC = {r["legacyId"]: r["id"] for r in table("facilities") if r.get("legacyId") is not None}


def cid(x):
    return CLO.get(int(x), int(x))


def fid(x):
    return FAC.get(int(x), int(x))


def transform(col, doc, d):
    """(컬렉션, 문서 id, 데이터) → (새 경로, 새 데이터). 바꿀 것 없으면 그대로."""
    m = re.fullmatch(r"runs/(r\d+)/(fac|clo|misc|ui)", col)
    if m:   # 회차별: 시설 f{노트id}·옷 c{노트id} → 사이트 번호
        kind = m.group(2)
        if kind == "fac" and re.fullmatch(r"f\d+", doc):
            doc = f"f{fid(doc[1:])}"
        elif kind == "clo" and re.fullmatch(r"c\d+", doc):
            doc = f"c{cid(doc[1:])}"
        return f"{col}/{doc}", d
    if col == "names" and doc == "all":
        d = dict(d)
        d["clo"] = {str(cid(k)): v for k, v in (d.get("clo") or {}).items()}
        d["fac"] = {str(fid(k)): v for k, v in (d.get("fac") or {}).items()}
    elif col == "checks":
        d = dict(d)
        d.pop("name", None)   # 패션 체크 이름은 사이트 이름을 쓴다(제제 결정). 대상 시설 수정(main/alt)만 옮김
        for k in ("main", "alt"):
            if isinstance(d.get(k), list):
                d[k] = [fid(x) for x in d[k]]
    elif col in ("clofix", "cbattle") and re.fullmatch(r"c\d+", doc):
        doc = f"c{cid(doc[1:])}"
    elif col == "log":
        d = dict(d)
        if d.get("id") is not None and str(d["id"]).isdigit():
            if d.get("kind") in ("clo", "cloname", "clofix", "battle", "opt"):
                d["id"] = cid(d["id"])
            elif d.get("kind") in ("fac", "rename", "type"):
                d["id"] = fid(d["id"])
    return f"{col}/{doc}", d


def load(dump, only=None):
    out = {}
    cols = list(KEEP)
    rdir = dump / "runs"
    if rdir.is_dir():   # runs/{rN}/{fac,clo,misc,ui}
        for rd in sorted(rdir.iterdir()):
            for sub in ("fac", "clo", "misc", "ui"):
                if (rd / sub).is_dir():
                    cols.append(f"runs/{rd.name}/{sub}")
    if only:
        cols = [c for c in cols if c.split("/")[0] in only]
    for col in cols:
        for p in sorted((dump / col).glob("*.json")) if (dump / col).is_dir() else []:
            raw = json.load(open(p))
            data = raw["data"] if isinstance(raw, dict) and "data" in raw and "version" in raw else raw
            out[(col, p.stem)] = data
    # 최근 로그(정렬 조회로 받은 것) 합치기
    extra = dump / "log_recent"
    if extra.is_dir() and (not only or "log" in only):
        for p in extra.glob("*.json"):
            raw = json.load(open(p))
            out[("log", p.stem)] = raw["data"] if isinstance(raw, dict) and "data" in raw and "version" in raw else raw
    return out


def fs_value(v):
    if v is None:
        return {"nullValue": None}
    if isinstance(v, bool):
        return {"booleanValue": v}
    if isinstance(v, int):
        return {"integerValue": str(v)}
    if isinstance(v, float):
        return {"doubleValue": v}
    if isinstance(v, str):
        return {"stringValue": v}
    if isinstance(v, list):
        return {"arrayValue": {"values": [fs_value(x) for x in v]}}
    if isinstance(v, dict):
        return {"mapValue": {"fields": {k: fs_value(x) for k, x in v.items()}}}
    raise TypeError(type(v))


def commit(writes):
    body = json.dumps({"writes": writes}).encode()
    req = urllib.request.Request(f"https://firestore.googleapis.com/v1/{DB}/documents:commit", data=body, method="POST",
                                 headers={"Content-Type": "application/json", "Authorization": "Bearer proxy-injected"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main(argv):
    dump = pathlib.Path(argv[0])
    write = "--write" in argv
    only = None
    if "--only" in argv:
        only = set(argv[argv.index("--only") + 1].split(","))
    imp = argv[argv.index("--import") + 1] if "--import" in argv else None
    src = load(dump, only)
    plan = {}
    for (col, doc), d in src.items():
        if d is None:
            continue
        path, nd = transform(col, doc, d)
        if nd == {}:
            continue
        plan[path] = nd
    outdir = ROOT / "tools" / "migrate" / "out"
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1))
    cnt = {}
    for p in plan:
        cnt[p.split("/")[0]] = cnt.get(p.split("/")[0], 0) + 1
    print("옮길 문서:", sum(cnt.values()), cnt)
    if imp:
        import datetime
        out = {"format": "fms-import", "version": 1, "made": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
               "note": "기존 노트 → 새 노트(번호는 사이트 번호로 바꿈)", "docs": plan}
        pathlib.Path(imp).write_text(json.dumps(out, ensure_ascii=False))
        print("가져오기 파일:", imp)
        return
    if not write:
        print("계획만 만들었어요(쓰지 않음):", outdir / "plan.json")
        return
    items = list(plan.items())
    for i in range(0, len(items), 400):
        chunk = items[i:i + 400]
        writes = [{"update": {"name": f"{DB}/documents/{PREFIX}/{p}", "fields": {k: fs_value(v) for k, v in d.items()}}} for p, d in chunk]
        r = commit(writes)
        print(f"썼어요 {i + len(chunk)}/{len(items)} ({len(r.get('writeResults', []))})")


if __name__ == "__main__":
    main(sys.argv[1:])
