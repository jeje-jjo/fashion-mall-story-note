"""cache/의 공략 사이트 페이지를 표(JSON)로 바꾼다 → data/site/<table>.json

- 카드 페이지(옷, 시설, 캐릭터, 코디 세트)는 카드마다 한 행.
- 표 페이지는 <table>마다 한 표. 셀은 글자(text), 줄 나눔(parts), 링크(refs: c18, s0, h45 ...)를 같이 남긴다.
- 사이트 값은 가공하지 않고 담는다. 노트 표기로 바꾸는 일은 tools/sheets/build_tables.py에서 한다.

사용: python3 tools/crawler/parse.py
"""
from __future__ import annotations

import datetime
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from htmltree import Node, parse  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent
CACHE = HERE / "cache"
ROOT = HERE.parent.parent
OUT = ROOT / "data" / "site"
BASE_URL = "https://kairo.waterbeetles.dev/ko/fashion-mall-story/"

BLOCK = {"br", "div", "p", "li"}


# ---------------------------------------------------------------- 공통

def load(page: str) -> Node:
    src = (CACHE / f"ko_fashion-mall-story_{page}.html").read_text(encoding="utf-8")
    root = parse(src)
    return root.find("main") or root


def num(s: str | None):
    """'¥1,090' '1,000 G' '58' → 숫자. 숫자가 없으면 None."""
    if s is None:
        return None
    m = re.search(r"-?\d[\d,]*(?:\.\d+)?", s)
    if not m:
        return None
    v = m.group(0).replace(",", "")
    return float(v) if "." in v else int(v)


def ref(href: str) -> str | None:
    """'clothes.html#c18' → 'c18'"""
    m = re.search(r"#([a-z]+\d+)$", href or "")
    return m.group(1) if m else None


def parts(node: Node) -> list[str]:
    """셀 안의 글자를 줄 단위로 나눈다(<br>, <div>, <a> 경계)."""
    out: list[str] = []
    buf: list[str] = []

    def flush():
        t = re.sub(r"\s+", " ", "".join(buf)).strip()
        if t:
            out.append(t)
        buf.clear()

    def walk(n: Node):
        for ch in n.children:
            if isinstance(ch, str):
                buf.append(ch)
            elif ch.tag == "img":
                continue
            elif ch.tag in BLOCK or ch.tag == "a":
                flush()
                walk(ch)
                flush()
            else:
                walk(ch)

    walk(node)
    flush()
    return out


def cell(node: Node) -> dict:
    ps = parts(node)
    refs = [r for r in (ref(h) for h, _ in node.links()) if r]
    c = {"text": " / ".join(ps)}
    if len(ps) > 1:
        c["parts"] = ps
    if refs:
        c["refs"] = refs
    return c


def tables(page: str) -> list[dict]:
    main = load(page)
    # 표마다 바로 앞의 h2/h3 제목을 붙인다
    heads: dict[int, str] = {}
    last = ""
    for n in main.iter():
        if n.tag in ("h2", "h3"):
            last = n.clean()
        elif n.tag == "table":
            heads[id(n)] = last
    result = []
    for t in main.find_all("table"):
        trs = list(t.find_all("tr"))
        if not trs:
            continue
        header = [c.clean() for c in trs[0].kids() if c.tag in ("th", "td")]
        rows = []
        for tr in trs[1:]:
            cells = [c for c in tr.kids() if c.tag in ("th", "td")]
            row = {"_rowId": tr.attrs.get("id")} if tr.attrs.get("id") else {}
            for i, c in enumerate(cells):
                key = header[i] if i < len(header) and header[i] else f"col{i}"
                row[key] = cell(c)
            rows.append(row)
        result.append({"heading": heads.get(id(t), ""), "columns": header, "rows": rows})
    return result


def cards(page: str) -> list[Node]:
    return [n for n in load(page).find_all("div", "card") if re.match(r"[a-z]+\d+$", n.attrs.get("id", ""))]


def card_lines(card: Node) -> list[Node]:
    """카드 본문의 div.m / div.scr 줄들(순서 유지)."""
    return [n for n in card.find_all("div") if n.has_class("m") or n.has_class("scr")]


def h3_name(card: Node) -> str:
    h3 = card.find("h3")
    if not h3:
        return ""
    return "".join(ch for ch in h3.children if isinstance(ch, str)).strip()


def tags(card: Node) -> list[str]:
    return [t.clean() for t in card.find_all("span", "tag")]


def data_attrs(card: Node) -> dict:
    return {k[5:]: v for k, v in card.attrs.items() if k.startswith("data-") and k != "data-s"}


# ---------------------------------------------------------------- 카드 페이지

def parse_clothes() -> list[dict]:
    rows = []
    for c in cards("clothes"):
        sid = int(c.attrs["id"][1:])
        h3 = c.find("h3")
        spans = [s.clean() for s in h3.find_all("span", "m")] if h3 else []
        tier = None
        for s in spans:
            m = re.search(r"Tier\s*(\d+)", s)
            if m:
                tier = int(m.group(1))
        r: dict = {"siteId": sid, "name": h3_name(c), "tier": tier, "tags": tags(c), "attrs": data_attrs(c)}
        extra = []
        for ln in card_lines(c):
            t = ln.clean()
            if not t:
                continue
            if t.startswith("레시피:"):
                r["recipe"] = [{"id": ref(h), "name": n} for h, n in ln.links()]
            elif t.startswith("품질"):
                m = re.match(r"품질\s*(-?\d+)\s*·\s*인기\s*(-?\d+)\s*·\s*¥([\d,]+)\s*·\s*재고\s*(\d+)", t)
                if m:
                    r.update(quality=int(m.group(1)), pop=int(m.group(2)),
                             price=num(m.group(3)), stock=int(m.group(4)))
                else:
                    extra.append(t)
            elif t.startswith("계절:"):
                body = t[3:].strip()
                season, _, cust = body.partition(" · ")
                r["season"] = season.strip()
                m = re.match(r"(.+?)\s*\(예:\s*(.+)\)$", cust.strip())
                r["custType"] = (m.group(1) if m else cust).strip()
                if m:
                    r["custExamples"] = [x.strip() for x in m.group(2).split(",")]
            elif t.startswith("포함된 세트:"):
                r["sets"] = [ref(h) for h, _ in ln.links() if ref(h)]
            elif t.startswith("스타일 점수:"):
                r["styleScores"] = {k.strip(): int(v) for k, v in re.findall(r"([^,:]+?)\s+(\d+)(?:,|$)", t[7:])}
            elif "·" in t and "kind" not in r:
                # '상의 · 내추럴 (캐주얼) · 갈'
                bits = [b.strip() for b in t.split("·")]
                r["kind"] = bits[0]
                g = bits[1] if len(bits) > 1 else ""
                m = re.match(r"(.+?)\s*\((.+)\)$", g)
                r["genre"], r["sub"] = (m.group(1), m.group(2)) if m else (g, "")
                r["color"] = bits[2] if len(bits) > 2 else ""
            else:
                extra.append(t)
        if extra:
            r["notes"] = extra
        rows.append(r)
    return rows


def parse_outfits() -> list[dict]:
    rows = []
    for c in cards("outfits"):
        sid = int(c.attrs["id"][1:])
        g = (c.find("span", "m").clean() if c.find("span", "m") else "")
        m = re.match(r"(.+?)\s*\((.+)\)$", g)
        genre, sub = (m.group(1), m.group(2)) if m else (g, "")
        items = [{"id": ref(a.attrs.get("href")), "name": a.clean()} for a in c.find_all("a", "cl")]
        notes = [ln.clean() for ln in card_lines(c) if ln.clean()]
        rows.append({"siteId": sid, "genre": genre, "sub": sub, "items": items, **({"notes": notes} if notes else {})})
    return rows


def parse_facilities() -> list[dict]:
    rows = []
    for c in cards("facilities"):
        sid = int(c.attrs["id"][1:])
        r: dict = {"siteId": sid, "name": h3_name(c), "attrs": data_attrs(c), "tags": tags(c)}
        lines = [ln for ln in card_lines(c)]
        texts = [ln.clean() for ln in lines]
        # 1줄: '시설 · 취미 · 성숙 · 1×2' / '환경 · 쿨 · 1×1'
        if texts:
            bits = [b.strip() for b in texts[0].split("·")]
            r["group"] = bits[0]
            size = bits[-1] if re.match(r"\d+×\d+$", bits[-1]) else ""
            if size:
                w, h = size.split("×")
                r["w"], r["h"] = int(w), int(h)
            r["labels"] = [b for b in bits[1:] if b != size]
        effects = []
        for t, ln in zip(texts[1:], lines[1:]):
            if not t:
                continue
            if t.startswith("건설"):
                m = re.match(r"건설\s*¥([\d,]+)(?:\s*\(\+([\d,]+)\))?\s*·\s*유지비\s*¥([\d,]+)", t)
                if m:
                    r["cost"] = num(m.group(1))
                    r["costStep"] = num(m.group(2)) if m.group(2) else None
                    r["upkeep"] = num(m.group(3))
                else:
                    effects.append(t)
            elif re.match(r"^(매력|인기|평판|만족도|체류|소비)\s*-?\d", t):
                r["stats"] = {k: int(v) for k, v in re.findall(r"(\S+)\s+(-?\d+)", t)}
            else:
                refs = [x for x in (ref(h) for h, _ in ln.links()) if x]
                effects.append({"text": t, "refs": refs} if refs else t)
        if effects:
            r["effects"] = effects
        rows.append(r)
    return rows


def parse_charas() -> list[dict]:
    rows = []
    for c in cards("charas"):
        sid = int(c.attrs["id"][1:])
        r: dict = {"siteId": sid, "name": h3_name(c), "attrs": data_attrs(c), "tags": tags(c)}
        clothes = [ref(a.attrs.get("href")) for a in c.find_all("a", "cl")]
        if clothes:
            r["clothes"] = [x for x in clothes if x]
        info = []
        for ln in card_lines(c):
            t = ln.clean()
            if not t:
                continue
            if t.startswith("좋아함:"):
                r["likes"] = [b.strip() for b in t[4:].split("·")]
            elif ln.has_class("scr") or t.endswith(":"):
                refs = [x for x in (ref(h) for h, _ in ln.links()) if x]
                info.append({"text": t, "parts": parts(ln), **({"refs": refs} if refs else {})})
            elif "profile" not in r and "·" in t:
                r["profile"] = [b.strip() for b in t.split("·")]
            else:
                info.append(t)
        if info:
            r["info"] = info
        rows.append(r)
    return rows


# ---------------------------------------------------------------- 표 페이지

# (페이지, 표 순서) → 표 이름. 표 순서는 페이지 안에서 0부터.
TABLE_NAMES = {
    ("recipes", 0): "recipe_bases",
    ("recipes", 1): "recipe_forms",
    ("recipes", 2): "recipe_decos",
    ("recipes", 3): "recipe_rares",
    ("progress", 0): "ranks",
    ("progress", 1): "trophies",
    ("progress", 2): "contests",
    ("progress", 3): "fashion_checks",
    ("progress", 4): "battles",
    ("progress", 5): "investments",
    ("progress", 6): "sales_trips",
    ("progress", 7): "exams",
    ("skills", 0): "skills",
    ("skills", 1): "studies",
    ("staff", 0): "uniforms",
    ("items", 0): "items",
    ("goods", 0): "goods",
    ("mechanics", 0): "formulas",
    ("mechanics", 1): "grades",
    ("mechanics", 2): "fever",
    ("carryover", 0): "carryover_choices",
    ("carryover", 1): "clear_points",
    ("story", 0): "activities",
    ("story", 1): "celebrities",
    ("story", 2): "comment_replies",
}
# 미션은 표 6개를 한 표로 합친다(분류 열 추가)
MISSION_PAGE = "missions"
# 옮기지 않는 열(긴 대사·설명 원문)
DROP_COLS = {"대사", "SNS 글"}


def parse_table_pages() -> dict[str, dict]:
    out: dict[str, dict] = {}
    pages = sorted({p for p, _ in TABLE_NAMES})
    for page in pages:
        for i, t in enumerate(tables(page)):
            name = TABLE_NAMES.get((page, i))
            if not name:
                print(f"  skip table {page}#{i} {t['heading']!r}")
                continue
            cols = [c for c in t["columns"] if c not in DROP_COLS]
            rows = [{k: v for k, v in r.items() if k not in DROP_COLS} for r in t["rows"]]
            out[name] = {"page": page, "heading": t["heading"], "columns": cols, "rows": rows}
    rows = []
    cols: list[str] = []
    for t in tables(MISSION_PAGE):
        group = re.sub(r"\s*\(\d+\)$", "", t["heading"])
        cols = ["분류"] + t["columns"]
        for r in t["rows"]:
            rows.append({"분류": {"text": group}, **r})
    out["missions"] = {"page": MISSION_PAGE, "heading": "미션", "columns": cols, "rows": rows}
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    fetched = datetime.date.fromtimestamp((CACHE / "ko_fashion-mall-story_clothes.html").stat().st_mtime).isoformat()
    all_tables: dict[str, dict] = {
        "clothes": {"page": "clothes", "rows": parse_clothes()},
        "outfits": {"page": "outfits", "rows": parse_outfits()},
        "facilities": {"page": "facilities", "rows": parse_facilities()},
        "charas": {"page": "charas", "rows": parse_charas()},
    }
    all_tables.update(parse_table_pages())
    index = {}
    for name, t in all_tables.items():
        t["source"] = BASE_URL + t["page"] + ".html"
        t["fetched"] = fetched
        (OUT / f"{name}.json").write_text(json.dumps(t, ensure_ascii=False, indent=1), encoding="utf-8")
        index[name] = {"rows": len(t["rows"]), "source": t["source"]}
        print(f"{name:20s} {len(t['rows']):4d}")
    (OUT / "_index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
