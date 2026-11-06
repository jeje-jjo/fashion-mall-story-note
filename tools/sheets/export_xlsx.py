"""data/tables/*.json → data/tables/fms_tables.xlsx (표마다 탭 하나, 구글 시트에 올려 보기·고치기용)

- 1행 머리글(시트 머리글), 배열·객체 칸은 글자로 풀어 쓴다(배열은 ", ", 객체는 "키 값").
- 맨 앞 탭은 _meta(표 목록).

사용: python3 tools/sheets/export_xlsx.py
"""
import json
import pathlib

import openpyxl
from openpyxl.styles import Font, PatternFill

ROOT = pathlib.Path(__file__).resolve().parents[2]
TABLES = ROOT / "data" / "tables"
OUT = TABLES / "fms_tables.xlsx"
HEAD = PatternFill("solid", fgColor="F3E4E6")  # 뮤트 로즈


def flat(v):
    if v is None:
        return None
    if isinstance(v, bool):
        return "✓" if v else ""
    if isinstance(v, list):
        return ", ".join(str(flat(x)) for x in v)
    if isinstance(v, dict):
        return ", ".join(f"{k} {flat(x)}" for k, x in v.items())
    return v


def main():
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    files = sorted(TABLES.glob("*.json"), key=lambda f: (f.stem != "_meta", f.stem.startswith("site_"), f.stem))
    for f in files:
        t = json.loads(f.read_text(encoding="utf-8"))
        ws = wb.create_sheet(t["name"][:31])
        ws.append([c["label"] for c in t["columns"]])
        for c in ws[1]:
            c.font = Font(bold=True)
            c.fill = HEAD
        for r in t["rows"]:
            ws.append([flat(r.get(c["key"])) for c in t["columns"]])
        ws.freeze_panes = "B2"
        for i, c in enumerate(t["columns"], 1):
            ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = min(40, max(8, len(c["label"]) * 2 + 2))
    wb.save(OUT)
    print(OUT, len(files), "sheets")


if __name__ == "__main__":
    main()
