"""app/pre.html + data/data.json + app/post.html -> dist/index.html (+ dist/template.html)"""
import json, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
pre = (root/"app/pre.html").read_text(encoding="utf-8")
post = (root/"app/post.html").read_text(encoding="utf-8")
data = (root/"data/data.json").read_text(encoding="utf-8").strip()
json.loads(data)  # 깨진 JSON이면 여기서 멈춤
assert pre.rstrip().endswith("const DATA ="), "pre.html은 'const DATA =' 로 끝나야 함"
out = root/"dist"; out.mkdir(exist_ok=True)
(out/"index.html").write_text(pre + data + post, encoding="utf-8")
(out/"template.html").write_text(pre + "__DATA__" + post, encoding="utf-8")
print("built", out/"index.html", f"{(out/'index.html').stat().st_size:,} bytes")
