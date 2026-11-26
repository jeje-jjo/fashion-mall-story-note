"""마네킹 추가(제제 2026-11-26): 시트 추천 15개에 안 올라간 옷을 최대한 많이 올리는 마네킹을 장르마다 16번부터 붙인다.

- 같은 옷을 여러 마네킹에 넣을 수 있고 마네킹 개수 제한도 없다(제제).
- 호감 손님 = 상의·하의(셋업)·아우터·액세서리 평균 선호(full_sales_* 손님별 점수) 100 이상. 시트 값과 89% 일치하는 추정.
- 계절마다 조합을 고르는 순서: 아직 안 쓴 옷 수(액세서리 제외) → 호감 손님 → 코디 세트로 묶이는 옷 수 → 평균 선호.
  기준선 = 그 장르·계절 지금 15개 중 가장 낮은 호감의 80%.
- 새 옷이 없는 계절은 그 장르 1번 마네킹 코디를 같이 쓴다.
사용: python3 tools/sheets/mannequin_extra.py  (data/tables/mannequin_recs.json을 15개로 되돌린 뒤 추가분을 다시 붙임)
"""
import json, re, collections, pathlib

T = pathlib.Path(__file__).resolve().parents[2] / "data" / "tables"
C = {r["id"]: r for r in json.loads((T / "clothes.json").read_text())["rows"]}
SEAS = {"sa": "full_sales_spring_autumn", "su": "full_sales_summer", "wi": "full_sales_winter"}

def table(n):
    d = json.loads((T / f"{n}.json").read_text())
    gk = [(c["key"], re.sub(r" \(#\d+\)", "", c["label"])) for c in d["columns"] if "(#" in c["label"]]
    num = lambda v: float(v) if isinstance(v, (int, float)) else 0.0
    return {r["c0"]: [num(r.get(k)) for k, _ in gk] for r in d["rows"]}, [n for _, n in gk]

S = {s: table(n) for s, n in SEAS.items()}

def score(s, ids):
    sc, names = S[s]
    if any(i not in sc for i in ids): return None
    n = len(names)
    avg = [sum(sc[i][g] for i in ids) / len(ids) for g in range(n)]
    core = [i for i in ids if C[i]["kind"] != "액세서리"]
    pref = sum(sum(sc[i][g] for i in core) / len(core) for g in range(n)) / n
    fl = [names[g] for g in range(n) if avg[g] >= 100]
    return len(fl), round(pref, 2), fl

def setb(ids):
    c = collections.Counter(x for i in ids for x in (C[i].get("sets") or []))
    return max(c.values()) if c else 0

def combos(g, s):
    K = lambda k: [c["id"] for c in C.values() if c["genre"] == g and c["kind"] == k]
    cores = [(t,) for t in K("셋업")] + [(t, b) for t in K("상의") for b in K("하의")]
    out = []
    for core in cores:
        for o in [None] + K("아우터"):
            for a in [None] + K("액세서리"):
                ids = list(core) + [x for x in (o, a) if x]
                r = score(s, ids)
                if r: out.append((ids, r[0], setb(ids), r[1]))
    return out

def outfit(ids):
    o = {}
    for i in ids:
        k = C[i]["kind"]
        o[{"상의": "t", "셋업": "t", "하의": "b", "아우터": "o", "액세서리": "a"}[k]] = i
    return o

def main():
    meta = json.loads((T / "mannequin_recs.json").read_text())
    base = [r for r in meta["rows"] if r["k"] < 15]
    extra = []
    for g in sorted({r["genre"] for r in base}):
        rs = sorted([r for r in base if r["genre"] == g], key=lambda r: r["k"])
        used = {i for r in rs for o in r["outfits"].values() for i in o.values()}
        picks = {}
        for s in SEAS:
            lo = min(r["fav"][s] for r in rs); thr = int(lo * 0.8)
            cs = combos(g, s); cov = set(used); L = []
            while True:
                best = None
                for ids, f, sb, p in cs:
                    if f < thr: continue
                    nw = sum(1 for i in ids if i not in cov and C[i]["kind"] != "액세서리")
                    if not nw: continue
                    key = (nw, f, sb, p)
                    if best is None or key > best[0]: best = (key, ids)
                if not best: break
                L.append(best[1]); cov |= set(best[1])
            picks[s] = L
        n = max(len(L) for L in picks.values())
        recs = []
        for j in range(n):
            rec = {"genre": g, "outfits": {}, "fav": {}, "pref": {}, "buy": {}, "style": {}, "official": {}, "favList": {}, "extra": True}
            for s in SEAS:
                if j < len(picks[s]):
                    ids = picks[s][j]; f, p, fl = score(s, ids)
                    rec["outfits"][s] = outfit(ids); rec["fav"][s] = f; rec["pref"][s] = p; rec["favList"][s] = fl
                else:
                    r0 = rs[0]
                    for key in ("outfits", "fav", "pref", "favList"): rec[key][s] = r0[key][s]
            sets = [set(rec["favList"][s]) for s in SEAS]
            rec["favYear"] = len(set.union(*sets)); rec["favAll"] = len(set.intersection(*sets))
            recs.append(rec)
        recs.sort(key=lambda r: -sum(r["fav"].values()))
        for j, r in enumerate(recs):
            r["k"] = 15 + j; r["_doc"] = f'{g}-{r["k"] + 1:02d}'
        extra += recs
        print(g, "추가", n)
    meta["rows"] = sorted(base + extra, key=lambda x: (x["genre"], x["k"]))
    meta["title"] = "마네킹 추천(시트 15 + 추가)"
    meta["desc"] = "장르마다 시트 추천 15개 + 남는 옷을 올린 추가 마네킹(16번부터)의 계절별 코디와 호감 손님 수(추정값)"
    (T / "mannequin_recs.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    print("합계", len(meta["rows"]))

if __name__ == "__main__":
    main()
