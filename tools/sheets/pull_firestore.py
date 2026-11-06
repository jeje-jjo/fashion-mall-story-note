"""Firestore 기준 데이터 저장소 → 로컬 JSON (push_firestore.py의 반대)

- ref/{표} 정보와 ref/{표}/rows/* 를 읽어 data/pulled/{표}.json 으로 저장한다.
  형식은 data/tables/*.json 과 같다: name, title, key, desc, source, columns, rows
- 클라우드 세션처럼 로컬 data/가 없을 때 Firestore에서 다시 받아 쓰는 용도다.
- 인증: push_firestore.py 와 같다(firebase CLI 로그인 토큰).

사용: python3 tools/sheets/pull_firestore.py [표 이름 ...]
"""
from __future__ import annotations

import json
import sys
import urllib.parse

from push_firestore import DOCS, ROOT, call, token

OUT = ROOT / "data" / "pulled"


def unval(v: dict):
    if "nullValue" in v:
        return None
    if "booleanValue" in v:
        return v["booleanValue"]
    if "integerValue" in v:
        return int(v["integerValue"])
    if "doubleValue" in v:
        return v["doubleValue"]
    if "stringValue" in v:
        return v["stringValue"]
    if "timestampValue" in v:
        return v["timestampValue"]
    if "arrayValue" in v:
        return [unval(x) for x in v["arrayValue"].get("values", [])]
    if "mapValue" in v:
        return {k: unval(x) for k, x in v["mapValue"].get("fields", {}).items()}
    return None


def list_docs(tok: str, coll: str) -> list[dict]:
    out, page = [], None
    while True:
        q = "?pageSize=300" + (f"&pageToken={urllib.parse.quote(page)}" if page else "")
        res = call(tok, "GET", f"{DOCS}/{coll}{q}")
        out += res.get("documents", [])
        page = res.get("nextPageToken")
        if not page:
            return out


def main(names: list[str]) -> None:
    tok = token()
    OUT.mkdir(parents=True, exist_ok=True)
    for d in list_docs(tok, "ref"):
        name = d["name"].rsplit("/", 1)[1]
        if names and name not in names:
            continue
        meta = {k: unval(v) for k, v in d.get("fields", {}).items()}
        rows = []
        for r in list_docs(tok, f"ref/{name}/rows"):
            row = {k: unval(v) for k, v in r.get("fields", {}).items()}
            row["_doc"] = urllib.parse.unquote(r["name"].rsplit("/", 1)[1])
            rows.append(row)
        t = {"name": name, **{k: meta.get(k) for k in ("title", "key", "desc", "source", "columns")}, "rows": rows}
        (OUT / f"{name}.json").write_text(json.dumps(t, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{name:24s} {len(rows):5d} rows (meta {meta.get('rows')})")


if __name__ == "__main__":
    main(sys.argv[1:])
