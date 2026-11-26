"""마네킹 추천 시트(구글 시트 '패션몰 스토리 마네킹 추천 · 7장르 105개' xlsx)를 data/tables/mannequin_recs.json으로 바꾼다.

- 장르마다 15개, 마네킹마다 봄·가을/여름/겨울 코디(상의·하의 또는 셋업, 아우터·액세서리는 선택)
- 옷은 '이름 [사이트 의류 ID]'에서 ID만 뽑는다(새 노트 옷 id = 사이트 번호)
- 호감 손님 수·평균 선호·구매 추정·공식 코디 번호·호감 손님 명단도 같이 담는다
- 의류 원본의 계절 평균(소수 둘째 자리)으로 sales_avg도 다시 만든다
사용: python3 tools/sheets/import_mannequin_xlsx.py <xlsx 경로>
"""
import json, pathlib, re, sys
import openpyxl

ROOT = pathlib.Path(__file__).resolve().parents[2]
T = ROOT / "data" / "tables"
SEASON = {"봄·가을": "sa", "여름": "su", "겨울": "wi"}
GENRE = {"서브컬처": "서브컬쳐"}

def ids(v):
    return [int(x) for x in re.findall(r"\[(\d+)\]", str(v or ""))]

def one(v):
    l = ids(v); return l[0] if l else None

def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["계절별 코디"]; rows = list(ws.iter_rows(values_only=True)); head = rows[0]
    ix = {h: i for i, h in enumerate(head)}
    recs = {}
    for r in rows[1:]:
        if not r[ix["마네킹"]]: continue
        name = str(r[ix["마네킹"]]); g = GENRE.get(r[ix["대장르"]], r[ix["대장르"]]); k = int(name.split()[-1]) - 1
        sk = SEASON[r[ix["계절"]]]
        o = {}
        t = one(r[ix["셋업"]]) or one(r[ix["상의"]])
        if t: o["t"] = t
        b = one(r[ix["하의"]]) if not one(r[ix["셋업"]]) else None
        if b: o["b"] = b
        if one(r[ix["아우터"]]): o["o"] = one(r[ix["아우터"]])
        if one(r[ix["액세서리"]]): o["a"] = one(r[ix["액세서리"]])
        rec = recs.setdefault((g, k), {"genre": g, "k": k, "outfits": {}, "fav": {}, "pref": {}, "buy": {}, "style": {}, "official": {}, "favList": {}})
        rec["outfits"][sk] = o
        rec["fav"][sk] = int(r[ix["호감 손님"]] or 0)
        rec["pref"][sk] = float(r[ix["평균 선호"]] or 0)
        rec["buy"][sk] = float(r[ix["평균 구매 추정"]] or 0)
        rec["style"][sk] = r[ix["스타일"]] or ""
        if r[ix["공식 코디"]]: rec["official"][sk] = str(r[ix["공식 코디"]])
        rec["favList"][sk] = [x.strip() for x in str(r[ix["호감 손님 명단"]] or "").split(",") if x.strip()]
    ws = wb["마네킹"]; rows = list(ws.iter_rows(values_only=True)); h = rows[0]; jx = {x: i for i, x in enumerate(h)}
    for r in rows[1:]:
        if not r[0]: continue
        g = GENRE.get(r[0], r[0]); k = int(r[jx["추천 순위"]]) - 1
        if (g, k) in recs:
            recs[(g, k)]["favYear"] = int(r[jx["연중 호감"]] or 0); recs[(g, k)]["favAll"] = int(r[jx["세 계절 모두"]] or 0)
    out = sorted(recs.values(), key=lambda x: (x["genre"], x["k"]))
    for x in out: x["_doc"] = f'{x["genre"]}-{x["k"] + 1:02d}'
    meta = {"name": "mannequin_recs", "title": "마네킹 추천(7장르 × 15)", "key": "_doc", "desc": "장르마다 15개 마네킹의 봄·가을/여름/겨울 코디와 호감 손님 수·평균 선호·구매 추정(추정값)", "columns": [{"key": "genre", "label": "장르"}, {"key": "k", "label": "순위(0부터)"}, {"key": "outfits", "label": "계절별 옷 id"}, {"key": "fav", "label": "계절별 호감 손님"}], "source": "제제 구글 시트 '패션몰 스토리 마네킹 추천 · 7장르 105개'(사이트 판매·빌더 공식 기반 추정)", "rows": out}
    (T / "mannequin_recs.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    print("mannequin_recs", len(out))
    # 계절 평균(더 자세한 값)으로 sales_avg 교체
    ws = wb["의류 원본"]; rows = list(ws.iter_rows(values_only=True)); h = rows[0]; jx = {x: i for i, x in enumerate(h)}
    sa = json.loads((T / "sales_avg.json").read_text())
    by = {int(r[0]): r for r in rows[1:] if r[0] is not None}
    n = 0
    for row in sa["rows"]:
        r = by.get(int(row["id"]))
        if not r: continue
        row["sa"], row["su"], row["wi"] = r[jx["봄·가을 평균"]], r[jx["여름 평균"]], r[jx["겨울 평균"]]; n += 1
    (T / "sales_avg.json").write_text(json.dumps(sa, ensure_ascii=False, indent=1))
    print("sales_avg updated", n, "/", len(sa["rows"]))

if __name__ == "__main__":
    main(sys.argv[1])
