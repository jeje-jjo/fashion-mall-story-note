"""표준 라이브러리 html.parser로 만든 아주 작은 DOM. 외부 패키지 없이 카드·표를 읽기 위해 쓴다."""
from __future__ import annotations

import html
import re
from html.parser import HTMLParser

VOID = {"img", "br", "hr", "meta", "link", "input", "source", "wbr", "col", "area", "base", "embed", "param", "track"}
# 닫는 태그가 생략되어도 같은 태그가 다시 열리면 앞의 것을 닫는 태그들
AUTO_CLOSE = {"p", "li", "tr", "td", "th", "option"}


class Node:
    __slots__ = ("tag", "attrs", "children", "parent")

    def __init__(self, tag: str, attrs: dict | None = None, parent: "Node | None" = None):
        self.tag = tag
        self.attrs = attrs or {}
        self.children: list[Node | str] = []
        self.parent = parent

    # ---- 찾기
    def classes(self) -> list[str]:
        return (self.attrs.get("class") or "").split()

    def has_class(self, c: str) -> bool:
        return c in self.classes()

    def iter(self):
        for ch in self.children:
            if isinstance(ch, Node):
                yield ch
                yield from ch.iter()

    def find_all(self, tag: str | None = None, cls: str | None = None, **attrs):
        for n in self.iter():
            if tag and n.tag != tag:
                continue
            if cls and not n.has_class(cls):
                continue
            if any(n.attrs.get(k) != v for k, v in attrs.items()):
                continue
            yield n

    def find(self, tag: str | None = None, cls: str | None = None, **attrs):
        return next(self.find_all(tag, cls, **attrs), None)

    def kids(self):
        return [c for c in self.children if isinstance(c, Node)]

    # ---- 글자
    def text(self) -> str:
        out = []
        for ch in self.children:
            out.append(ch if isinstance(ch, str) else ch.text())
        return "".join(out)

    def clean(self) -> str:
        return re.sub(r"\s+", " ", self.text()).strip()

    def links(self) -> list[tuple[str, str]]:
        return [(a.attrs.get("href", ""), a.clean()) for a in self.find_all("a")]


class _Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root")
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        a = {k: (v if v is not None else "") for k, v in attrs}
        if tag in AUTO_CLOSE and self.cur.tag == tag:
            self.cur = self.cur.parent or self.root
        node = Node(tag, a, self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        a = {k: (v if v is not None else "") for k, v in attrs}
        self.cur.children.append(Node(tag, a, self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent or self.root

    def handle_data(self, data):
        self.cur.children.append(data)


def parse(src: str) -> Node:
    b = _Builder()
    b.feed(src)
    return b.root


def unesc(s: str) -> str:
    return html.unescape(s)
