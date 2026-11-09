/** 직접 그린 16×16 SVG. DB·이미지 수집·게임 원본 에셋이 필요 없다. */
const paths: Record<string, string> = {
  clo: "M5 2h2v2h2V2h2v1h2v2h2v3h-3v6H4V8H1V5h2V3h2z M6 6v6h4V6z",
  shop: "M3 1h10v2h1v2h1v3h-1v6H2V8H1V5h1V3h1z M3 5v2h2V5z M7 5v2h2V5z M11 5v2h2V5z M4 9v3h3V9z M10 9v5h2V9z",
  fac: "M3 1h10v2h1v2h1v3h-1v6H2V8H1V5h1V3h1z M3 5v2h2V5z M7 5v2h2V5z M11 5v2h2V5z M4 9v3h3V9z M10 9v5h2V9z",
  coord: "M6 1h4v1h1v4h-1v1H6V6H5V2h1z M4 9h8v1h2v4H2v-4h2z M6 3v2h4V3z M5 11v1h6v-1z",
  tool: "M3 1h10v14H3z M5 3v10h6V3z M6 5h4v1H6z M6 8h4v1H6z M6 11h3v1H6z",
  check: "M12 3h2v3h-2v2h-2v2H8v2H5v-2H3V8H1V5h2v2h2v2h2V7h2V5h3z",
  chev: "M6 2h2v2h2v2h2v4h-2v2H8v2H6v-3h2V9h2V7H8V5H6z",
  clock: "M5 1h6v1h2v2h1v8h-1v2h-2v1H5v-1H3v-2H2V4h1V2h2z M5 3v1H4v8h1v1h6v-1h1V4h-1V3z M7 4h2v4h2v2H7z",
  cal: "M4 1h2v2h4V1h2v2h2v12H2V3h2z M4 7v6h8V7z M5 9h2v2H5z M9 9h2v2H9z",
  upg: "M7 1h2v2h2v2h2v2h-3V5H9v7H7V5H6v2H3V5h2V3h2z M2 13h12v2H2z",
};

export function pixelIcon(name: string) {
  return `<svg class="pixel-icon ${name === "chev" ? "chev" : ""}" width="24" height="24" viewBox="0 0 16 16" fill="currentColor" fill-rule="evenodd" shape-rendering="crispEdges" aria-hidden="true"><path d="${paths[name] ?? paths.shop}"/></svg>`;
}

export function installPixelIcons() {
  (window as any).__FMS_ICONS__ = Object.fromEntries(Object.keys(paths).map(name => [name, pixelIcon(name)]));
  document.querySelectorAll<HTMLElement>("[data-pixel]").forEach(el => {
    el.innerHTML = pixelIcon(el.dataset.pixel!);
  });
  document.getElementById("recentBtn")!.innerHTML = pixelIcon("clock");
  document.querySelector('#fab [data-q="memo"]')!.innerHTML = pixelIcon("cal");
  document.querySelector('#fab [data-q="up"]')!.innerHTML = pixelIcon("upg");
}
