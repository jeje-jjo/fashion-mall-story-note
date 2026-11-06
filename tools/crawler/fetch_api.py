"""공략 사이트 인터랙티브 도구의 데이터(JSON)를 한 번만 받아 cache/api/에 저장한다.

- 클라우드 세션에서는 Cloudflare가 막아서(403) 맥에서 실행한다.
- robots.txt: Claude-User 허용. 정직하게 Claude-User로 밝힌다. 이미 받았으면 다시 받지 않는다(--force).
- 요청 사이 3초. 실패해도 재시도하지 않는다.

사용(맥):  python3 tools/crawler/fetch_api.py match
          tools/data_sync.sh --push   → 데이터 저장소(fashion-mall-story-data)에서 git add/commit/push
"""
import pathlib
import sys
import time
import urllib.request

BASE = "https://kairo.waterbeetles.dev/api/fashion-mall-story/ko/"
UA = "Claude-User (personal game note; slow, cached)"
CACHE = pathlib.Path(__file__).resolve().parent / "cache" / "api"
TOOLS = {"match": "match.html"}   # 손님 요청·패션 체크·배틀 조건과 맞는 옷(요청 매처)


def main(argv):
    force = "--force" in argv
    names = [a for a in argv if not a.startswith("--")] or list(TOOLS)
    CACHE.mkdir(parents=True, exist_ok=True)
    for i, name in enumerate(names):
        path = CACHE / f"ko_{name}.json"
        if path.exists() and not force:
            print(f"cache  {name}")
            continue
        if i:
            time.sleep(3)
        req = urllib.request.Request(BASE + name, headers={
            "User-Agent": UA, "Accept": "application/json",
            "Referer": f"https://kairo.waterbeetles.dev/ko/fashion-mall-story/{TOOLS.get(name, name + '.html')}"})
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                body = res.read()
        except Exception as e:
            print(f"FAIL   {name}: {e}")
            continue
        if not body.lstrip().startswith((b"{", b"[")):
            print(f"FAIL   {name}: JSON이 아님(차단 페이지일 수 있음)")
            continue
        path.write_bytes(body)
        print(f"fetch  {name} {len(body):,} bytes → {path}")


if __name__ == "__main__":
    main(sys.argv[1:])
