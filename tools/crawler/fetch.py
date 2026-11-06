"""공략 사이트(KairoHistory) 페이지를 천천히 받아 cache/에 저장한다.

- robots.txt: User-Agent * 허용, Claude-User 허용(사람이 시킨 조회). 그래서 정직하게 Claude-User로 밝힌다.
- 이미 캐시에 있으면 다시 받지 않는다(--force로만 다시 받음).
- 요청 사이 3초 쉬고, 병렬 요청은 하지 않는다. 실패해도 자동 재시도하지 않는다.

사용: python3 tools/crawler/fetch.py            # PAGES 전부
      python3 tools/crawler/fetch.py clothes     # 일부만
"""
import pathlib
import sys
import time
import urllib.request

BASE = "https://kairo.waterbeetles.dev/ko/fashion-mall-story/"
UA = "Claude-User (personal game note; slow, cached)"
DELAY = 3.0
CACHE = pathlib.Path(__file__).resolve().parent / "cache"

# 인터랙티브 도구(builder, layout, sales, match)는 수집하지 않는다.
PAGES = [
    "index", "clothes", "recipes", "outfits", "staff", "charas", "skills",
    "facilities", "missions", "items", "goods", "progress", "mechanics",
    "story", "carryover",
]


def cache_path(page: str) -> pathlib.Path:
    return CACHE / f"ko_fashion-mall-story_{page}.html"


def main(argv: list[str]) -> None:
    force = "--force" in argv
    pages = [a for a in argv if not a.startswith("--")] or PAGES
    CACHE.mkdir(parents=True, exist_ok=True)
    first = True
    for page in pages:
        path = cache_path(page)
        if path.exists() and not force:
            print(f"cache  {page}")
            continue
        if not first:
            time.sleep(DELAY)
        first = False
        req = urllib.request.Request(BASE + page + ".html", headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                body = res.read()
        except Exception as e:  # 재시도하지 않고 넘어간다
            print(f"FAIL   {page}: {e}")
            continue
        path.write_bytes(body)
        print(f"fetch  {page} {len(body):,} bytes")


if __name__ == "__main__":
    main(sys.argv[1:])
