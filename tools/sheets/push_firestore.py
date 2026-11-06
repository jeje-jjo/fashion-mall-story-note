"""data/tables/*.json → Firestore 기준 데이터 저장소

구조(진행 데이터와 섞이지 않게 ref 아래에 둔다)
  ref/{표 이름}                 표 정보: title, key, desc, source, columns, rows(행 수), built
  ref/{표 이름}/rows/{키}       한 행 = 한 문서. 키는 표의 key 열 값(없으면 s{siteId} 또는 행 번호)

- REST batchWrite(500개씩)로 쓴다. 같은 키는 덮어쓰고, 이번에 없는 옛 행은 지운다(표 단위로 다시 만듦).
- 인증: firebase CLI 로그인 토큰(~/.config/configstore/firebase-tools.json). 먼저 firebase 명령을 한 번 실행해 토큰을 새로 고친다.

사용: python3 tools/sheets/push_firestore.py [표 이름 ...]
"""
from __future__ import annotations

import json
import os
import pathlib
import subprocess
import sys
import urllib.parse
import urllib.error
import urllib.request

PROJECT = "fashion-mall-story"
ROOT = pathlib.Path(__file__).resolve().parents[2]
TABLES = ROOT / "data" / "tables"
DOCS = f"projects/{PROJECT}/databases/(default)/documents"
API = "https://firestore.googleapis.com/v1/"


def token() -> str:
    subprocess.run(["firebase", "projects:list", "--json"], capture_output=True, check=True)
    cfg = json.loads(pathlib.Path(os.path.expanduser("~/.config/configstore/firebase-tools.json")).read_text())
    return cfg["tokens"]["access_token"]


def call(tok: str, method: str, path: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json",
                                          "x-goog-user-project": PROJECT})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        if e.code == 404 and method == "GET":
            return {}
        raise SystemExit(f"{method} {path[:120]} → {e.code} {e.read().decode()[:500]}")


def val(v):
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
        # Firestore는 배열 안의 배열을 못 담아서 안쪽 배열은 JSON 글자로 둔다
        return {"arrayValue": {"values": [val(json.dumps(x, ensure_ascii=False) if isinstance(x, list) else x) for x in v]}}
    if isinstance(v, dict):
        return {"mapValue": {"fields": {str(k): val(x) for k, x in v.items()}}}
    return {"stringValue": str(v)}


def doc_id(t: dict, i: int, r: dict) -> str:
    k = r.get(t["key"])
    if k is None or k == "":
        k = f"s{r['siteId']}" if r.get("siteId") is not None else f"r{i + 1}"
    return str(k).replace("/", "∕")


def list_ids(tok: str, coll: str) -> set[str]:
    ids, page = set(), None
    while True:
        q = "?pageSize=300&mask.fieldPaths=_nofield" + (f"&pageToken={urllib.parse.quote(page)}" if page else "")
        res = call(tok, "GET", f"{DOCS}/{coll}{q}")
        for d in res.get("documents", []):
            ids.add(d["name"].rsplit("/", 1)[1])
        page = res.get("nextPageToken")
        if not page:
            return ids


def push(tok: str, t: dict) -> None:
    name = t["name"]
    coll = f"ref/{name}/rows"
    writes, keep = [], set()
    for i, r in enumerate(t["rows"]):
        did = doc_id(t, i, r)
        keep.add(did)
        writes.append({"update": {"name": f"{DOCS}/{coll}/{urllib.parse.quote(did, safe='')}",
                                  "fields": {k: val(v) for k, v in r.items()}}})
    old = list_ids(tok, coll)
    for did in old - keep:
        writes.append({"delete": f"{DOCS}/{coll}/{urllib.parse.quote(did, safe='')}"})
    meta = {k: t[k] for k in ("title", "key", "desc", "source", "columns")}
    meta["rows"] = len(t["rows"])
    writes.append({"update": {"name": f"{DOCS}/ref/{name}", "fields": {k: val(v) for k, v in meta.items()}}})
    for i in range(0, len(writes), 500):
        res = call(tok, "POST", f"{DOCS}:batchWrite", {"writes": writes[i:i + 500]})
        bad = [s for s in res.get("status", []) if s.get("code")]
        if bad:
            raise SystemExit(f"{name}: {bad[:3]}")
    print(f"{name:24s} {len(t['rows']):5d} rows")


def main(names: list[str]) -> None:
    tok = token()
    files = sorted(TABLES.glob("*.json"))
    for f in files:
        t = json.loads(f.read_text(encoding="utf-8"))
        if names and t["name"] not in names:
            continue
        push(tok, t)


if __name__ == "__main__":
    main(sys.argv[1:])
