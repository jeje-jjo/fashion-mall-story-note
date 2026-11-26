"""옷 단독 이미지(제제가 준 zip, 파일 이름 '#{사이트 의류 ID}_{이름}.png')를 data/tables/clo_img.json으로 묶는다.

- 64장씩 한 문서(base64 data URL). 문서 하나가 1MB를 넘지 않게
- Firestore ref/clo_img 에 올리면 보안 규칙상 제제 계정만 읽을 수 있다(공개 저장소에는 그림을 넣지 않음)
사용: python3 tools/sheets/import_clo_images.py <png 폴더>
"""
import base64, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
T = ROOT / "data" / "tables"

def main(folder):
    items = []
    for p in sorted(pathlib.Path(folder).glob("*.png")):
        m = re.match(r"#(\d+)_", p.name)
        if m: items.append((int(m.group(1)), "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode()))
    items.sort()
    rows = [{"_doc": f"c{i // 64:02d}", "imgs": {str(k): v for k, v in items[i:i + 64]}} for i in range(0, len(items), 64)]
    meta = {"name": "clo_img", "title": "옷 그림(마네킹용)", "key": "_doc", "desc": "옷 사이트 ID → 50×50 PNG data URL, 64장씩 묶음", "columns": [{"key": "imgs", "label": "id → 그림"}], "source": "제제 제공 zip(게임 화면 그림, 개인 참고용)", "rows": rows}
    (T / "clo_img.json").write_text(json.dumps(meta, ensure_ascii=False))
    print("images", len(items), "docs", len(rows), "max doc KB", max(len(json.dumps(r)) for r in rows) // 1024)

if __name__ == "__main__":
    main(sys.argv[1])
