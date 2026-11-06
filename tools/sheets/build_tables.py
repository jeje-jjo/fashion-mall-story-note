"""기존 노트 데이터 + 공략 사이트 표 + reference 엑셀 → 조합용 표(data/tables/*.json)

입력
- snapshots/2026-11-06_note_data.xlsx   기존 노트 시트(사용자 수정 반영본, 노트 기준)
- snapshots/2026-11-06_full_backup.json 기존 노트 DATA(+DB)
- data/site/*.json                       tools/crawler/parse.py 결과(사이트 원값)
- reference/Fashion_Mall_Story_Challenge_Outfits.xlsx, reference/Fashion_Mall_Story_Offline_Guide_KO.md

원칙
- 노트 id는 그대로 둔다. 사이트 번호는 siteId 열에 따로 둔다.
- 노트 값(사용자가 고친 값 포함)을 덮어쓰지 않는다. 사이트 값은 site* 열에 나란히 두고, 다르면 *_diff 표에 남긴다.
- 진행 기록(완료 체크, 점수 기록, 전투 슬롯 등)은 넣지 않는다. 그건 Firestore 진행 데이터로 따로 옮긴다.

사용: python3 tools/sheets/build_tables.py
"""
from __future__ import annotations

import datetime
import difflib
import json
import pathlib
import re
from collections import Counter, defaultdict

import openpyxl

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITE = ROOT / "data" / "site"
OUT = ROOT / "data" / "tables"
NOTE_XLSX = ROOT / "snapshots" / "2026-11-06_note_data.xlsx"
NOTE_JSON = ROOT / "snapshots" / "2026-11-06_full_backup.json"
REF_XLSX = ROOT / "reference" / "Fashion_Mall_Story_Challenge_Outfits.xlsx"
REF_MD = ROOT / "reference" / "Fashion_Mall_Story_Offline_Guide_KO.md"
SITE_URL = "https://kairo.waterbeetles.dev/ko/fashion-mall-story/"

# ---------------------------------------------------------------- 표기 맞추기(노트 표기 = 게임 한국어판)

# 사이트 표기 → 노트 표기 (docs/plan.md 3절)
TERM = {
    "서브컬처": "서브컬쳐",
    "US 레트로": "US레트로",
    "80년대 레트로": "80년대레트로",
    "포클로어": "포크로어",
    "카무플라주": "카모플라주",
    "게리 코튼": "게리코튼",
    "너트와 볼트": "나사와 볼트",
    "호피": "레오파드",
    "와펜": "자수 패치",
    "고블랭직": "고블랭",
    "어른": "성숙",
    "대미지": "데미지",
    "물방울무늬": "물방울",
    "카모플라주 패턴": "카모플라주",
}
# 비교할 때만 같게 보는 표기(값은 바꾸지 않음)
SAME = {"꽃식물": "식물", "검은": "검정", "하얀": "흰색", "파란": "파랑", "빨간": "빨강", "노란": "노랑",
        "혼합": "다색", "갈": "갈색", "초록": "초록", "분홍": "분홍", "보라": "보라", "주황": "주황"}
# 노트 배틀 이름 → 사이트 배틀 이름(비교 키)
BATTLE_ALIAS = {"고저스챌린지": "성숙챌린지", "특기챌린지배틀": "자신있는챌린지", "특기챌린지": "자신있는챌린지"}
COLOR_SUFFIX = re.compile(r"(색|색깔)$")


def term(s: str | None) -> str:
    if not s:
        return ""
    s = s.strip()
    for a, b in TERM.items():
        s = s.replace(a, b)
    return s


def norm(s) -> str:
    """비교용: 공백·가운뎃점·기호 제거, 표기 통일"""
    if s is None:
        return ""
    s = term(str(s))
    s = s.replace("&", "·").replace("/", "·")
    s = re.sub(r"[\s·・,\-~()!?'\"‘’“”]", "", s).lower()
    return SAME.get(s, s)


def norm_color(s) -> str:
    parts = [SAME.get(p, p) for p in re.split(r"[·&/,\s]+", term(str(s or ""))) if p]
    return "·".join(sorted(SAME.get(COLOR_SUFFIX.sub("", p), COLOR_SUFFIX.sub("", p)) for p in parts))


def split_list(s) -> list[str]:
    if s is None or s == "":
        return []
    return [x.strip() for x in re.split(r"[,、]\s*", str(s)) if x.strip()]


# ---------------------------------------------------------------- 입력 읽기

def read_sheet(wb, name: str, header_row: int = 1, header_key: str | None = None) -> list[dict]:
    """header_key가 있으면 그 글자가 첫 칸인 행을 머리글로 쓴다(엑셀 위쪽 제목·빈 줄 건너뜀)."""
    ws = wb[name]
    rows = list(ws.iter_rows(values_only=True))
    if header_key:
        header_row = next(i for i, r in enumerate(rows, 1) if r and str(r[0]).strip() == header_key)
    hdr = [str(h).strip() if h is not None else f"col{i}" for i, h in enumerate(rows[header_row - 1])]
    out = []
    for r in rows[header_row:]:
        if all(v is None for v in r):
            continue
        out.append({h: v for h, v in zip(hdr, r)})
    return out


def site(name: str) -> dict:
    return json.loads((SITE / f"{name}.json").read_text(encoding="utf-8"))


def cell_text(row: dict, col: str) -> str:
    v = row.get(col)
    return v.get("text", "") if isinstance(v, dict) else (v or "")


def cell_refs(row: dict, col: str) -> list[str]:
    v = row.get(col)
    return v.get("refs", []) if isinstance(v, dict) else []


def cell_parts(row: dict, col: str) -> list[str]:
    v = row.get(col)
    if not isinstance(v, dict):
        return []
    return v.get("parts") or ([v["text"]] if v.get("text") else [])


# ---------------------------------------------------------------- 표 객체

class Table:
    def __init__(self, name: str, title: str, key: str, columns: list[tuple[str, str]], desc: str, source: list[str]):
        self.name, self.title, self.key, self.desc, self.source = name, title, key, desc, source
        self.columns = columns  # (key, 시트 머리글)
        self.rows: list[dict] = []

    def add(self, row: dict) -> None:
        self.rows.append(row)

    def dump(self) -> dict:
        keys = [k for k, _ in self.columns]
        rows = [{k: r.get(k) for k in keys} for r in self.rows]
        return {
            "name": self.name, "title": self.title, "key": self.key, "desc": self.desc,
            "source": self.source, "columns": [{"key": k, "label": l} for k, l in self.columns],
            "rows": rows,
        }


TABLES: dict[str, Table] = {}


def table(name, title, key, columns, desc, source) -> Table:
    t = Table(name, title, key, columns, desc, source)
    TABLES[name] = t
    return t


# ---------------------------------------------------------------- 매칭 도우미

def match_by_name(note_rows, site_rows, note_names, site_name, attr_score, key="id"):
    """노트 행 ↔ 사이트 행. 이름 → 속성 점수 순. 결과: {noteId: (siteRow|None, method, candidates)}"""
    by_name = defaultdict(list)
    for s in site_rows:
        by_name[norm(site_name(s))].append(s)
    used = set()
    res = {}
    # 1) 이름 정확히(노트 이름 여러 개 중 하나라도)
    for n in note_rows:
        hits = []
        for nm in note_names(n):
            hits = [s for s in by_name.get(norm(nm), []) if s["siteId"] not in used]
            if hits:
                break
        if len(hits) == 1:
            res[n[key]] = (hits[0], "name", [])
            used.add(hits[0]["siteId"])
        elif len(hits) > 1:
            best = sorted(hits, key=lambda s: -attr_score(n, s))
            res[n[key]] = (best[0], "name+attr", [s["siteId"] for s in best[1:3]])
            used.add(best[0]["siteId"])
    # 2) 속성 점수(이름이 다른 것). 확정하지 않고 후보만 남긴다.
    for n in note_rows:
        if n[key] in res:
            continue
        cands = sorted((s for s in site_rows if s["siteId"] not in used), key=lambda s: -attr_score(n, s))
        cands = [s for s in cands[:3] if attr_score(n, s) > 0]
        if not cands:  # 속성 후보가 없으면 이름이 비슷한 것(번역 차이)
            nm = norm(note_names(n)[0])
            sim = sorted(((difflib.SequenceMatcher(None, nm, norm(site_name(s))).ratio(), s) for s in site_rows
                          if s["siteId"] not in used), key=lambda x: -x[0])
            cands = [s for r, s in sim[:3] if r >= 0.6]
        if cands:
            res[n[key]] = (None, "후보", [s["siteId"] for s in cands])
        else:
            res[n[key]] = (None, "없음", [])
    return res, used


# ---------------------------------------------------------------- 표 만들기

def build():
    nb = openpyxl.load_workbook(NOTE_XLSX, read_only=True, data_only=True)
    nj = json.loads(NOTE_JSON.read_text(encoding="utf-8"))
    ND, NDB, NFC = nj["DATA"], nj["DB"], nj["fashion_check_facilities"]
    rb = openpyxl.load_workbook(REF_XLSX, read_only=True, data_only=True)
    today = datetime.date.today().isoformat()

    S_NOTE = "기존 노트(2026-11-06 백업)"
    S_SITE = "KairoHistory"
    S_REF = "reference 엑셀(2026-11-05)"

    id_map = table("id_map", "id 매칭표", "key", [
        ("key", "키"), ("kind", "종류"), ("noteId", "노트 id"), ("noteName", "노트 이름"),
        ("siteId", "사이트 #"), ("siteName", "사이트 이름"), ("method", "방법"),
        ("candidates", "후보(사이트 #)"), ("confirmed", "확인"),
    ], "노트 id ↔ 사이트 번호. 방법: name=이름 일치, name+attr=같은 이름 여럿 중 속성으로 고름, 후보=확인 필요, site-only=노트에 없음", [S_NOTE, S_SITE])

    # ============================================================ 옷
    s_clo = site("clothes")["rows"]
    s_clo_by = {r["siteId"]: r for r in s_clo}
    recipe_kind = {}
    for tname, kind in [("recipe_bases", "base"), ("recipe_forms", "form"), ("recipe_decos", "deco"), ("recipe_rares", "rare")]:
        for r in site(tname)["rows"]:
            if r.get("_rowId"):
                recipe_kind[r["_rowId"]] = kind
    # 희귀 옵션 표에는 행 id가 없어 이름으로 찾는다
    rare_names = {norm(cell_text(r, "옵션")) for r in site("recipe_rares")["rows"]}

    def site_recipe(s):
        base = [x["name"] for x in s.get("recipe", []) if x["id"] and x["id"].startswith("b")]
        opts = [x for x in s.get("recipe", []) if x["id"] and x["id"].startswith("o")]
        form = [term(x["name"]) for x in opts if recipe_kind.get(x["id"]) == "form"]
        deco = [term(x["name"]) for x in opts if recipe_kind.get(x["id"]) != "form"]
        return (base[0] if base else ""), form, deco

    n_clo = read_sheet(nb, "의류")
    for n in n_clo:
        n["id"] = int(n["id"])
    legacy_clo = {c["id"]: c for c in ND["clo"]}

    def clo_score(n, s):
        base, form, deco = site_recipe(s)
        sc = 0
        sc += 3 * (norm(n.get("장르")) == norm(s.get("sub")))
        sc += 2 * (norm(n.get("옷본")) == norm(base) and bool(base))
        sc += 2 * (bool(n.get("재료")) and norm(n.get("재료")) in [norm(x) for x in form])
        sc += 1 * (bool(n.get("옵션")) and norm(n.get("옵션")) in [norm(x) for x in deco])
        sc += 1 * (norm_color(n.get("색")) == norm_color(s.get("color")))
        sc += 1 * (norm(n.get("계절")) == norm(s.get("season")))
        return sc if sc >= 5 else 0

    m_clo, used_clo = match_by_name(
        n_clo, s_clo,
        note_names=lambda n: [n.get("이름(게임)"), n.get("원래 이름"), legacy_clo.get(n["id"], {}).get("n")],
        site_name=lambda s: s["name"], attr_score=clo_score)

    sub2genre = {}
    for s in s_clo:
        if s.get("sub"):
            sub2genre[term(s["sub"])] = term(s["genre"])

    def acquire(s):
        out = {"acquire": [], "goodWith": "", "badWith": ""}
        for t in s.get("notes", []):
            if t.startswith("잘 어울림:"):
                out["goodWith"] = t[6:].strip()
            elif t.startswith("안 어울림:"):
                out["badWith"] = t[6:].strip()
            else:
                out["acquire"].append(t)
        out["acquire"] = " / ".join(out["acquire"])
        return out

    clothes = table("clothes", "의류", "id", [
        ("id", "id"), ("siteId", "사이트 #"), ("name", "이름(게임)"), ("origName", "원래 이름"), ("siteName", "사이트 이름"),
        ("genre", "기본 장르"), ("sub", "세부 장르"), ("kind", "분류"), ("pattern", "옷본"), ("material", "재료"),
        ("option", "옵션"), ("color", "색"), ("season", "계절"), ("tags", "태그"), ("gender", "대상"),
        ("noteQuality", "품질(노트)"), ("noteCharm", "매력(노트)"),
        ("siteQuality", "기본 품질"), ("sitePop", "기본 인기"), ("sitePrice", "기본 가격"), ("siteStock", "재고"),
        ("tier", "Tier"), ("custType", "손님 성향"), ("custExamples", "성향 예시 직업"),
        ("styleScores", "스타일 점수"), ("sets", "코디 세트"), ("acquire", "입수 방법"),
        ("goodWith", "잘 어울림"), ("badWith", "안 어울림"),
        ("battle", "전투 추천(노트)"), ("coordGuests", "코디 요청 손님(노트)"), ("siteTags", "사이트 태그"),
        ("match", "매칭"),
    ], "노트 432벌 + 사이트에만 있는 옷. 노트 열이 기준, site*/기본* 열은 사이트 원값(가격·품질은 개량 전 기본값)",
        [S_NOTE, S_SITE + " clothes.html"])

    clo_diff = table("clothes_diff", "의류 다른 점", "key", [
        ("key", "키"), ("id", "id"), ("siteId", "사이트 #"), ("name", "이름(노트)"), ("field", "항목"),
        ("note", "노트 값"), ("site", "사이트 값"), ("choice", "선택(노트/사이트)"), ("memo", "메모"),
    ], "매칭된 옷 중 노트와 사이트 값이 다른 칸. choice가 비어 있으면 노트 값 유지", [S_NOTE, S_SITE])

    note2site_clo = {}
    for n in n_clo:
        s, method, cands = m_clo[n["id"]]
        lg = legacy_clo.get(n["id"], {})
        row = {
            "id": n["id"], "name": n.get("이름(게임)"), "origName": n.get("원래 이름"),
            "sub": n.get("장르"), "genre": sub2genre.get(term(n.get("장르") or ""), ""),
            "pattern": n.get("옷본"), "material": n.get("재료"), "option": n.get("옵션"),
            "color": n.get("색"), "season": n.get("계절"), "tags": n.get("태그"),
            "noteQuality": n.get("품질"), "noteCharm": n.get("매력"),
            "battle": n.get("전투 추천"), "coordGuests": n.get("코디 요청 손님"),
            "match": method,
        }
        if lg.get("x"):
            row["tags"] = " ".join(x for x in [row["tags"], lg["x"]] if x)
        if s:
            note2site_clo[n["id"]] = s["siteId"]
            base, form, deco = site_recipe(s)
            row.update({
                "siteId": s["siteId"], "siteName": s["name"], "kind": s.get("kind"),
                "gender": {"men": "남성", "women": "여성", "unisex": "공용"}.get(s["attrs"].get("gender"), ""),
                "siteQuality": s.get("quality"), "sitePop": s.get("pop"), "sitePrice": s.get("price"),
                "siteStock": s.get("stock"), "tier": s.get("tier"), "custType": s.get("custType"),
                "custExamples": s.get("custExamples"),
                "styleScores": {term(k): v for k, v in (s.get("styleScores") or {}).items()},
                "sets": [int(x[1:]) for x in s.get("sets", [])],
                "siteTags": s.get("tags"), **acquire(s),
            })
            pairs = [
                ("이름", n.get("이름(게임)"), s["name"], norm),
                ("세부 장르", n.get("장르"), term(s.get("sub")), norm),
                ("옷본", n.get("옷본"), base, norm),
                ("재료", n.get("재료"), "·".join(form), norm),
                ("옵션", n.get("옵션"), "·".join(deco), norm),
                ("색", n.get("색"), s.get("color"), norm_color),
                ("계절", n.get("계절"), s.get("season"), norm),
            ]
            for field, a, b, f in pairs:
                if not b and (field in ("색", "옷본")):
                    continue  # 사이트에 값이 없는 칸(액세서리 옷본, 색 없음)은 비교하지 않음
                if f(a) != f(b):
                    clo_diff.add({"key": f"{n['id']}:{field}", "id": n["id"], "siteId": s["siteId"],
                                  "name": n.get("이름(게임)"), "field": field, "note": a or "", "site": b or ""})
        id_map.add({"key": f"clo:{n['id']}", "kind": "clo", "noteId": n["id"], "noteName": n.get("이름(게임)"),
                    "siteId": s["siteId"] if s else None, "siteName": s["name"] if s else None, "method": method,
                    "candidates": [f"{c} {s_clo_by[c]['name']}" for c in cands],
                    "confirmed": method == "name"})
        clothes.add(row)
    for s in s_clo:
        if s["siteId"] in used_clo:
            continue
        base, form, deco = site_recipe(s)
        clothes.add({
            "id": None, "siteId": s["siteId"], "siteName": s["name"], "name": s["name"],
            "genre": term(s.get("genre")), "sub": term(s.get("sub")), "kind": s.get("kind"),
            "pattern": base, "material": "·".join(form), "option": "·".join(deco),
            "color": s.get("color"), "season": s.get("season"),
            "gender": {"men": "남성", "women": "여성", "unisex": "공용"}.get(s["attrs"].get("gender"), ""),
            "siteQuality": s.get("quality"), "sitePop": s.get("pop"), "sitePrice": s.get("price"),
            "siteStock": s.get("stock"), "tier": s.get("tier"), "custType": s.get("custType"),
            "custExamples": s.get("custExamples"),
            "styleScores": {term(k): v for k, v in (s.get("styleScores") or {}).items()},
            "sets": [int(x[1:]) for x in s.get("sets", [])], "siteTags": s.get("tags"),
            **acquire(s), "match": "site-only",
        })
        id_map.add({"key": f"clo:s{s['siteId']}", "kind": "clo", "noteId": None, "siteId": s["siteId"],
                    "siteName": s["name"], "method": "site-only", "candidates": [], "confirmed": False})
    site2note_clo = {v: k for k, v in note2site_clo.items()}

    # ============================================================ 레시피(옷본·재료·옵션)
    recipes = table("recipes", "옷본·재료·옵션", "siteKey", [
        ("siteKey", "사이트 키"), ("kind", "구분"), ("name", "이름(노트 표기)"), ("siteName", "사이트 이름"),
        ("price", "개방/가격"), ("tier", "Tier"), ("upParam", "upParam"), ("styleBonus", "스타일 보너스"),
        ("clothesCount", "옷 수"), ("clothes", "사용하는 옷(노트 id)"), ("rareStats", "희귀 옵션 수치"),
    ], "옷 베이스(옷본)·형태 옵션(재료)·장식/희귀 옵션. 노트의 옷본=베이스, 재료=형태 옵션, 옵션=장식·희귀 옵션",
        [S_SITE + " recipes.html"])
    kind_label = {"base": "옷본", "form": "재료", "deco": "옵션", "rare": "희귀 옵션"}
    rare_stats = {norm(cell_text(r, "옵션")): {k: num_or(cell_text(r, k)) for k in ("battle", "critic", "contest", "test")}
                  for r in site("recipe_rares")["rows"]}
    for tname, kind in [("recipe_bases", "base"), ("recipe_forms", "form"), ("recipe_decos", "deco")]:
        for r in site(tname)["rows"]:
            nm = cell_text(r, "베이스") or cell_text(r, "옵션")
            cl = [c for c in (cell_refs(r, "사용하는 옷")) if c.startswith("c")]
            rk = kind
            if kind == "deco" and norm(nm) in rare_names:
                rk = "rare"
            recipes.add({
                "siteKey": r.get("_rowId") or f"{kind}:{nm}", "kind": kind_label[rk], "name": term(nm), "siteName": nm,
                "price": num_or(cell_text(r, "개방 비용") or cell_text(r, "가격")), "tier": num_or(cell_text(r, "Tier")),
                "upParam": num_or(cell_text(r, "upParam")), "styleBonus": term(cell_text(r, "스타일 보너스")),
                "clothesCount": num_or(cell_text(r, "옷")),
                "clothes": [site2note_clo.get(int(c[1:]), f"s{c[1:]}") for c in cl],
                "rareStats": rare_stats.get(norm(nm)),
            })

    # ============================================================ 시설
    s_fac = site("facilities")["rows"]
    s_fac_by = {r["siteId"]: r for r in s_fac}
    n_fac = read_sheet(nb, "시설")
    for n in n_fac:
        n["id"] = int(n["id"])
    legacy_fac = {f["id"]: f for f in ND["fac"]}
    items = ND["items"]

    def fac_score(n, s):
        return 2 if norm(n.get("장르")) in [norm(term(x)) for x in s.get("labels", [])] and s.get("group") == "시설" else 0

    m_fac, used_fac = match_by_name(
        n_fac, s_fac, note_names=lambda n: [n.get("이름"), n.get("원래 이름"), legacy_fac.get(n["id"], {}).get("name")],
        site_name=lambda s: s["name"], attr_score=fac_score)

    facilities = table("facilities", "시설", "id", [
        ("id", "id"), ("siteId", "사이트 #"), ("name", "이름"), ("origName", "원래 이름"), ("siteName", "사이트 이름"),
        ("type", "장르"), ("group", "구분"), ("category", "분류"), ("p40", "우선개량(40P)"),
        ("w", "가로"), ("h", "세로"), ("area", "칸 수"), ("cost", "건설비"), ("costStep", "건설비 증가"), ("upkeep", "유지비"),
        ("charm", "매력"), ("pop", "인기"), ("fame", "평판"), ("effect", "효과"), ("checks", "패션 체크 번호"),
        ("goodItems", "상성 ◎"), ("okItems", "상성 ◯"), ("badItems", "상성 ×"), ("match", "매칭"),
    ], "노트 시설 84곳 + 사이트에만 있는 시설(환경·장식 포함). 상성은 노트 값(사이트에 없음)", [S_NOTE, S_SITE + " facilities.html"])
    fac_aff = table("facility_items", "시설 아이템 상성", "key", [
        ("key", "키"), ("facId", "시설 id"), ("facName", "시설 이름"), ("item", "아이템"), ("mark", "상성"),
    ], "시설 × 아이템 20종 상성(◎ 좋음, ◯ 보통, × 나쁨). 기존 노트 값", [S_NOTE])
    fac_diff = table("facilities_diff", "시설 다른 점", "key", [
        ("key", "키"), ("id", "id"), ("siteId", "사이트 #"), ("name", "이름(노트)"), ("field", "항목"),
        ("note", "노트 값"), ("site", "사이트 값"), ("choice", "선택(노트/사이트)"), ("memo", "메모"),
    ], "매칭된 시설 중 노트와 사이트 값이 다른 칸", [S_NOTE, S_SITE])

    for n in n_fac:
        s, method, cands = m_fac[n["id"]]
        lg = legacy_fac.get(n["id"], {})
        marks = lg.get("m", "")
        aff = {it: (marks[i] if i < len(marks) else "") for i, it in enumerate(items)}
        row = {
            "id": n["id"], "name": n.get("이름"), "origName": n.get("원래 이름"), "type": n.get("장르"),
            "p40": bool(n.get("우선개량")), "checks": n.get("패션 체크"), "match": method,
            "goodItems": [k for k, v in aff.items() if v == "◎"],
            "okItems": [k for k, v in aff.items() if v == "◯"],
            "badItems": [k for k, v in aff.items() if v == "×"],
        }
        for it, mk in aff.items():
            fac_aff.add({"key": f"{n['id']}:{it}", "facId": n["id"], "facName": n.get("이름"), "item": it, "mark": mk})
        if s:
            labels = [term(x) for x in s.get("labels", [])]
            st = s.get("stats") or {}
            row.update({
                "siteId": s["siteId"], "siteName": s["name"], "group": s.get("group"),
                "category": next((x for x in labels if x not in TYPE7), ""),
                "w": s.get("w"), "h": s.get("h"), "area": (s.get("w") or 0) * (s.get("h") or 0),
                "cost": s.get("cost"), "costStep": s.get("costStep"), "upkeep": s.get("upkeep"),
                "charm": st.get("매력"), "pop": st.get("인기"), "fame": st.get("평판"),
                "effect": " / ".join(e if isinstance(e, str) else e["text"] for e in s.get("effects", [])),
            })
            site_type = next((x for x in labels if x in TYPE7), "")
            for field, a, b in [("이름", n.get("이름"), s["name"]), ("장르", n.get("장르"), site_type)]:
                if norm(a) != norm(b):
                    fac_diff.add({"key": f"{n['id']}:{field}", "id": n["id"], "siteId": s["siteId"],
                                  "name": n.get("이름"), "field": field, "note": a or "", "site": b or ""})
        id_map.add({"key": f"fac:{n['id']}", "kind": "fac", "noteId": n["id"], "noteName": n.get("이름"),
                    "siteId": s["siteId"] if s else None, "siteName": s["name"] if s else None, "method": method,
                    "candidates": [f"{c} {s_fac_by[c]['name']}" for c in cands], "confirmed": method == "name"})
        facilities.add(row)
    for s in s_fac:
        if s["siteId"] in used_fac:
            continue
        labels = [term(x) for x in s.get("labels", [])]
        st = s.get("stats") or {}
        facilities.add({
            "id": None, "siteId": s["siteId"], "name": s["name"], "siteName": s["name"],
            "type": next((x for x in labels if x in TYPE7), ""), "group": s.get("group"),
            "category": next((x for x in labels if x not in TYPE7), ""),
            "w": s.get("w"), "h": s.get("h"), "area": (s.get("w") or 0) * (s.get("h") or 0),
            "cost": s.get("cost"), "costStep": s.get("costStep"), "upkeep": s.get("upkeep"),
            "charm": st.get("매력"), "pop": st.get("인기"), "fame": st.get("평판"),
            "effect": " / ".join(e if isinstance(e, str) else e["text"] for e in s.get("effects", [])),
            "match": "site-only",
        })
        id_map.add({"key": f"fac:s{s['siteId']}", "kind": "fac", "noteId": None, "siteId": s["siteId"],
                    "siteName": s["name"], "method": "site-only", "candidates": [], "confirmed": False})

    t_items = table("items", "시설 아이템", "name", [("name", "아이템"), ("order", "순서")],
                    "시설에 넣는 아이템 20종(상성 표의 열 순서)", [S_NOTE])
    for i, it in enumerate(items):
        t_items.add({"name": it, "order": i + 1})

    # ============================================================ 코디 세트(사이트) + 손님 코디 요청(노트)
    ref_sets = {}
    for r in read_sheet(rb, "장르별 코디 세트", header_key="기본 장르"):
        if num_or(r.get("코디 세트 ID")) is not None:
            ref_sets[int(r["코디 세트 ID"])] = r
    sets = table("outfit_sets", "코디 세트", "setId", [
        ("setId", "세트 #"), ("genre", "기본 장르"), ("sub", "세부 장르"), ("clothes", "구성(노트 id)"),
        ("siteClothes", "구성(사이트 #)"), ("names", "구성 이름"), ("parts", "액세서리 제외 파츠 수"),
        ("valid", "유효(2파츠 이상)"), ("missing", "노트에 없는 옷"),
    ], "사이트 코디 세트 207개. 유효 = reference 엑셀 기준 액세서리 제외 2파츠 이상(156개)", [S_SITE + " outfits.html", S_REF])
    for s in site("outfits")["rows"]:
        sid_list = [int(x["id"][1:]) for x in s["items"] if x["id"]]
        notes = [site2note_clo.get(x) for x in sid_list]
        rs = ref_sets.get(s["siteId"])
        sets.add({
            "setId": s["siteId"], "genre": term(s["genre"]), "sub": term(s["sub"]),
            "clothes": [x for x in notes if x is not None], "siteClothes": sid_list,
            "names": [site_name_or_note(x, site2note_clo, n_clo) for x in sid_list],
            "parts": int(rs["액세서리 제외 파츠 수"]) if rs and rs.get("액세서리 제외 파츠 수") is not None else None,
            "valid": rs is not None,
            "missing": [f"#{x}" for x, nid in zip(sid_list, notes) if nid is None],
        })

    coord = table("coord_requests", "손님 코디 요청", "id", [
        ("id", "id"), ("guest", "손님"), ("request", "요청"), ("origRequest", "원래 요청"),
        ("top", "상의"), ("bottom", "하의"), ("outer", "아우터"), ("acc", "액세서리"),
        ("topIds", "상의 id"), ("bottomIds", "하의 id"), ("outerIds", "아우터 id"), ("accIds", "액세서리 id"),
        ("note", "비고"),
    ], "기존 노트 손님 코디 요청 112건(사용자 수정 반영). *Ids는 이름으로 찾은 노트 옷 id", [S_NOTE])
    clo_by_name = defaultdict(list)
    for n in n_clo:
        for nm in [n.get("이름(게임)"), n.get("원래 이름")]:
            if nm:
                clo_by_name[norm(nm)].append(n["id"])

    def ids_of(s):
        out = []
        for part in re.split(r"\s*/\s*|\s+외\s*|,\s*", s or ""):
            out += clo_by_name.get(norm(part), [])
        return sorted(set(out))

    for r in read_sheet(nb, "코디 요청"):
        coord.add({
            "id": int(r["id"]), "guest": r.get("손님"), "request": r.get("요청"), "origRequest": r.get("원래 요청"),
            "top": r.get("상의"), "bottom": r.get("하의"), "outer": r.get("아우터"), "acc": r.get("액세서리"),
            "topIds": ids_of(r.get("상의")), "bottomIds": ids_of(r.get("하의")),
            "outerIds": ids_of(r.get("아우터")), "accIds": ids_of(r.get("액세서리")), "note": r.get("비고"),
        })

    # ============================================================ 전투
    s_bat = site("battles")["rows"]
    ref_bat = [r for r in read_sheet(rb, "챌린지 배틀 전체", header_key="배틀 ID") if num_or(r.get("배틀 ID")) is not None]
    ref_bat_by = {norm(re.sub(r"\s*배틀$", "", r["배틀 이름(원본)"])): r for r in ref_bat}
    ref_bat_by.update({norm(re.sub(r"\s*배틀$", "", r.get("화면 표시 이름", "").split("/")[0])): r for r in ref_bat})
    n_bat = read_sheet(nb, "전투")
    battles = table("battles", "배틀", "id", [
        ("id", "id"), ("name", "이름(노트)"), ("siteName", "사이트 이름"), ("kind", "구분"),
        ("cond", "조건(노트)"), ("stat", "능력"), ("reward", "보상"), ("note", "비고"),
        ("request", "요청 설명"), ("clothCond", "의류 조건"), ("values", "원문값(3)"),
        ("opponent", "상대"), ("fee", "참가비"), ("appear", "등장 조건"), ("win", "승리 시"),
        ("refBattleId", "엑셀 배틀 ID"), ("opponentOutfit", "상대 코디"),
    ], "챌린지 배틀 15(노트) + 다른 가게 직원 배틀 12(사이트). 원문값 3개는 의미 미확인", [S_NOTE, S_SITE + " progress.html", S_REF])
    s_bat_by = {norm(re.sub(r"\s*배틀$", "", cell_text(r, "배틀"))): r for r in s_bat}
    used_sb = set()
    for i, n in enumerate(n_bat):
        nm = n.get("전투") or ""
        k = BATTLE_ALIAS.get(norm(nm), norm(nm))
        sb = s_bat_by.get(k)
        rf = ref_bat_by.get(k)
        if sb is None:  # 이름이 다르면(어른→고저스 등) 엑셀 화면 이름으로
            for kk, v in s_bat_by.items():
                if k and (k in kk or kk in k):
                    sb = v
                    break
        if sb is not None:
            used_sb.add(id(sb))
        battles.add({
            "id": f"b{int(n['#']) if n.get('#') is not None else i}", "name": nm, "kind": "챌린지",
            "siteName": cell_text(sb, "배틀") if sb else None,
            "cond": n.get("조건"), "stat": n.get("능력"), "reward": n.get("보상"), "note": n.get("비고"),
            "request": rf.get("요청 설명") if rf else None, "clothCond": rf.get("의류 조건 전체") if rf else None,
            "values": [rf.get("원문값 1"), rf.get("원문값 2"), rf.get("원문값 3")] if rf else None,
            "refBattleId": int(rf["배틀 ID"]) if rf else None,
            "opponentOutfit": rf.get("상대 코디(추천 아님)") if rf else None,
            "opponent": cell_text(sb, "상대") if sb else None, "fee": num_or(cell_text(sb, "참가비")) if sb else None,
            "appear": cell_text(sb, "등장 조건") if sb else None, "win": cell_text(sb, "승리 시") if sb else None,
        })
    j = 0
    for sb in s_bat:
        if id(sb) in used_sb:
            continue
        battles.add({
            "id": f"sb{j}", "name": cell_text(sb, "배틀"), "siteName": cell_text(sb, "배틀"), "kind": "다른 가게 직원",
            "opponent": cell_text(sb, "상대"), "fee": num_or(cell_text(sb, "참가비")),
            "appear": cell_text(sb, "등장 조건"), "win": cell_text(sb, "승리 시"),
        })
        j += 1
    bname2id = {norm(b["name"]): b["id"] for b in battles.rows}
    ref2id = {b["refBattleId"]: b["id"] for b in battles.rows if b.get("refBattleId") is not None}

    bat_clo = table("battle_clothes", "배틀 일치·추천 의류", "key", [
        ("key", "키"), ("battleId", "배틀 id"), ("battle", "배틀"), ("cloId", "옷 id"), ("siteId", "사이트 #"),
        ("cloName", "옷 이름"), ("source", "출처"), ("detail", "충족 조건/비고"),
    ], "배틀별 의류. 출처: 엑셀 일치(조건 전부 충족) / 노트 전투 추천(사용자 태그)", [S_REF, S_NOTE])
    for r in read_sheet(rb, "배틀별 일치 의류", header_key="배틀 ID"):
        if num_or(r.get("배틀 ID")) is None or num_or(r.get("의류 ID")) is None:
            continue
        bid = ref2id.get(int(r["배틀 ID"]))
        sid = int(r["의류 ID"])
        nid = site2note_clo.get(sid)
        bat_clo.add({"key": f"{bid}:ref:{sid}", "battleId": bid, "battle": r.get("배틀 이름"), "cloId": nid, "siteId": sid,
                     "cloName": r.get("의류 이름"), "source": "엑셀 일치", "detail": r.get("충족 조건")})
    for cid, bname in NDB.get("cbattle", {}).items():
        nm = bname["name"] if isinstance(bname, dict) else bname
        bid = bname2id.get(norm(nm))
        cid = int(cid)
        bat_clo.add({"key": f"{bid}:note:{cid}", "battleId": bid, "battle": nm, "cloId": cid,
                     "siteId": note2site_clo.get(cid), "cloName": next((c["name"] for c in clothes.rows if c["id"] == cid), None),
                     "source": "노트 전투 추천"})

    bat_sets = table("battle_sets", "배틀 추천 코디", "key", [
        ("key", "키"), ("battleId", "배틀 id"), ("battle", "배틀"), ("rank", "순위"), ("setId", "세트 #"),
        ("eligible", "추천 적격"), ("result", "매칭 결과"), ("matched", "포함된 일치 의류"), ("reason", "판정 이유"),
        ("unmet", "구성품별 미충족 조건"),
    ], "reference 엑셀 '배틀별 추천 코디'", [S_REF])
    for r in read_sheet(rb, "배틀별 추천 코디", header_key="배틀 ID"):
        if num_or(r.get("배틀 ID")) is None:
            continue
        bid = ref2id.get(int(r["배틀 ID"]))
        bat_sets.add({"key": f"{bid}:{r.get('후보 순위')}", "battleId": bid, "battle": r.get("배틀 이름"),
                      "rank": num_or(r.get("후보 순위")), "setId": num_or(r.get("코디 세트 ID")),
                      "eligible": r.get("추천 적격"), "result": r.get("매칭 결과"), "matched": r.get("포함된 단독 일치 의류"),
                      "reason": r.get("판정 이유"), "unmet": r.get("구성품별 미충족 조건")})

    # ============================================================ 패션 체크
    s_fc = site("fashion_checks")["rows"]
    n_fc = read_sheet(nb, "패션 체크")
    fac_name = {f["id"]: f["name"] for f in facilities.rows if f["id"] is not None}
    checks = table("fashion_checks", "패션 체크", "id", [
        ("id", "번호"), ("name", "이름(노트)"), ("origName", "원래 이름"), ("siteName", "사이트 이름"),
        ("req", "요구"), ("reward", "보상(노트)"), ("note", "비고"),
        ("facilities", "필요 시설"), ("facIds", "필요 시설 id"), ("altFacilities", "대신 가능"), ("altFacIds", "대신 가능 id"),
        ("critic", "평론가"), ("prize", "상금"), ("rewardOption", "보상 옵션"), ("appear", "등장 조건"), ("success", "성공 시"),
    ], "노트 패션 체크 39개 + 사이트에만 있는 것. 점수 기록은 진행 데이터라 넣지 않음", [S_NOTE, S_SITE + " progress.html"])
    s_fc_by = defaultdict(list)
    for r in s_fc:
        s_fc_by[norm(cell_text(r, "패션 체크"))].append(r)
    used_fc = set()
    chk = NFC.get("chk", [])
    for i, n in enumerate(n_fc):
        names = [n.get("이름"), n.get("원래 이름")] + [c["name"] for c in ND["checks"][i:i + 1]]
        sr = None
        for x in names:
            free = [r for r in s_fc_by.get(norm(x), []) if id(r) not in used_fc] if x else []
            if free:
                sr = free[0]  # 같은 이름(모델 체크 등)은 순서대로
                break
        if sr is not None:
            used_fc.add(id(sr))
        main_ids = chk[i]["main"] if i < len(chk) else []
        alt_ids = chk[i]["alt"] if i < len(chk) else []
        checks.add({
            "id": int(n["번호"]), "name": n.get("이름"), "origName": n.get("원래 이름"),
            "siteName": cell_text(sr, "패션 체크") if sr else None,
            "req": n.get("요구"), "reward": n.get("보상"), "note": n.get("비고"),
            "facilities": n.get("필요 시설"), "facIds": main_ids,
            "altFacilities": n.get("대신 가능"), "altFacIds": alt_ids,
            "critic": cell_text(sr, "평론가") if sr else None, "prize": num_or(cell_text(sr, "상금")) if sr else None,
            "rewardOption": term(cell_text(sr, "보상 옵션")) if sr else None,
            "appear": cell_text(sr, "등장 조건") if sr else None, "success": cell_text(sr, "성공 시") if sr else None,
        })
    k = 100
    for sr in s_fc:
        if id(sr) in used_fc:
            continue
        checks.add({"id": k, "name": cell_text(sr, "패션 체크"), "siteName": cell_text(sr, "패션 체크"),
                    "critic": cell_text(sr, "평론가"), "prize": num_or(cell_text(sr, "상금")),
                    "rewardOption": term(cell_text(sr, "보상 옵션")), "appear": cell_text(sr, "등장 조건"),
                    "success": cell_text(sr, "성공 시"), "note": "사이트에만 있음(노트 id 아님, 확인 필요)"})
        k += 1

    # ============================================================ 노트 전용 표
    up = ND["up"]
    upg = table("upgrade_options", "개량 옵션", "option",
                [("option", "옵션")] + [(f"s{i}", st) for i, st in enumerate(up["staff"])],
                "옵션 × 직원(세부 장르) 개량 수치. 기존 노트 값", [S_NOTE])
    for opt, vals in up["rows"].items():
        upg.add({"option": opt, **{f"s{i}": v for i, v in enumerate(vals)}})

    verify = table("verify", "게임에서 확인할 것", "key", [("key", "키"), ("text", "내용"), ("ids", "옷 id"), ("memo", "메모")],
                   "기존 노트 '확인 필요' 목록", [S_NOTE])
    for v in ND.get("verify", []):
        verify.add({"key": v["k"], "text": v["t"], "ids": v.get("ids", []), "memo": v.get("n")})

    # ============================================================ 사이트 참고 표(그대로 평평하게)
    simple = [
        ("contests", "콘테스트", "progress.html"), ("ranks", "랭크", "progress.html"), ("trophies", "트로피", "progress.html"),
        ("investments", "투자", "progress.html"), ("sales_trips", "출장 판매", "progress.html"), ("exams", "자격시험", "progress.html"),
        ("missions", "미션", "missions.html"), ("skills", "점원 스킬", "skills.html"), ("studies", "스터디", "skills.html"),
        ("uniforms", "점원 유니폼", "staff.html"), ("items", "아이템(사이트)", "items.html"), ("goods", "음식·상품", "goods.html"),
        ("formulas", "공식", "mechanics.html"), ("grades", "등급", "mechanics.html"), ("fever", "좋아요 피버", "mechanics.html"),
        ("carryover_choices", "승계 선택지", "carryover.html"), ("clear_points", "클리어 포인트", "carryover.html"),
        ("activities", "활동", "story.html"), ("celebrities", "유명인", "story.html"), ("comment_replies", "댓글 답변", "story.html"),
    ]
    for name, title, page in simple:
        st = site(name)
        tname = "site_" + name
        cols = [(f"c{i}", c) for i, c in enumerate(st["columns"])]
        t = table(tname, title, "row", [("row", "행")] + cols + [("refs", "링크")],
                  f"사이트 {page} 표. 표기는 노트 표기로 바꿈", [S_SITE + " " + page])
        for i, r in enumerate(st["rows"]):
            row = {"row": i + 1}
            refs = []
            for ci, c in enumerate(st["columns"]):
                row[f"c{ci}"] = term(cell_text(r, c))
                refs += cell_refs(r, c)
            row["refs"] = refs
            t.add(row)

    # 캐릭터
    chars = table("characters", "캐릭터", "siteId", [
        ("siteId", "사이트 #"), ("name", "이름"), ("type", "구분"), ("profile", "나이·마을·성향"), ("likes", "좋아함"),
        ("clothes", "관련 옷(노트 id)"), ("info", "발견·해금"),
    ], "손님·직원·유명인. 사이트 원값", [S_SITE + " charas.html"])
    for c in site("charas")["rows"]:
        chars.add({
            "siteId": c["siteId"], "name": c["name"], "type": ", ".join(c.get("tags", [])),
            "profile": [term(x) for x in c.get("profile", [])], "likes": [term(x) for x in c.get("likes", [])],
            "clothes": [site2note_clo.get(int(x[1:]), f"s{x[1:]}") for x in c.get("clothes", [])],
            "info": " / ".join(i if isinstance(i, str) else i["text"] for i in c.get("info", [])),
        })

    # ============================================================ 공략 메모(reference md)
    guide = table("guide", "공략 메모", "key", [
        ("key", "키"), ("section", "절"), ("title", "제목"), ("grade", "등급"), ("body", "내용"),
    ], "reference 공략 정리 문서를 절 단위로. 등급: 확인/사례/추천/미확인/기타. 노트에는 확인 위주로 쓴다", ["reference 공략 문서"])
    cur = None
    sec = ""
    for line in REF_MD.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^(#{2,3})\s+(.*)$", line)
        if m:
            title = m.group(2).strip()
            if m.group(1) == "##":
                sec = title
            g = re.search(r"\[(확인|사례|추천|미확인|사용자[^\]]*|이전[^\]]*)", title)
            cur = {"key": f"g{len(guide.rows) + 1}", "section": sec, "title": re.sub(r"\s*`?\[.*?\]`?", "", title),
                   "grade": g.group(1) if g else "", "body": ""}
            guide.add(cur)
        elif cur is not None:
            cur["body"] += line + "\n"
    guide.rows = [g for g in guide.rows if g["body"].strip()]
    for g in guide.rows:
        g["body"] = g["body"].strip()

    # 표기 규칙
    terms = table("terms", "표기 규칙", "site", [("site", "사이트/공략 표기"), ("note", "노트 표기")],
                  "사이트 표기를 노트(게임 한국어판) 표기로 바꾸는 규칙", ["docs/plan.md 3절"])
    for a, b in TERM.items():
        terms.add({"site": a, "note": b})

    # 메타
    meta = table("_meta", "표 목록", "name", [
        ("name", "표"), ("title", "이름"), ("key", "키 열"), ("rows", "행 수"), ("desc", "설명"), ("source", "출처"), ("built", "만든 날"),
    ], "이 표들의 목록과 출처", [])
    for t in list(TABLES.values()):
        if t.name == "_meta":
            continue
        meta.add({"name": t.name, "title": t.title, "key": t.key, "rows": len(t.rows), "desc": t.desc,
                  "source": t.source, "built": today})
    meta.add({"name": "_source", "title": "출처 표기", "desc": f"공략 사이트 {SITE_URL} (비공식 팬 위키), 기존 노트, reference 공략 문서. 개인 참고용, 카이로소프트 공식 아님.",
              "built": today})


TYPE7 = {"내추럴", "쿨", "큐트", "성숙", "레트로", "하드", "서브컬쳐"}


def num_or(s):
    if s is None or s == "":
        return None
    if isinstance(s, (int, float)):
        return s
    m = re.search(r"-?\d[\d,]*(?:\.\d+)?", str(s))
    if not m:
        return None
    v = m.group(0).replace(",", "")
    return float(v) if "." in v else int(v)


def site_name_or_note(sid, site2note, n_clo):
    nid = site2note.get(sid)
    if nid is not None:
        for n in n_clo:
            if n["id"] == nid:
                return n.get("이름(게임)")
    return f"#{sid}"


def main():
    build()
    OUT.mkdir(parents=True, exist_ok=True)
    for t in TABLES.values():
        (OUT / f"{t.name}.json").write_text(json.dumps(t.dump(), ensure_ascii=False, indent=1), encoding="utf-8")
    for t in TABLES.values():
        extra = ""
        if t.name == "id_map":
            extra = "  " + str(Counter((r["kind"], r["method"]) for r in t.rows))
        print(f"{t.name:24s} {len(t.rows):5d}{extra}")


if __name__ == "__main__":
    main()
