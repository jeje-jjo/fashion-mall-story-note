/** 24px 격자의 공통 라인 아이콘. 기존 함수 이름과 클래스는 엔진 호환을 위해 유지한다. */
const marks: Record<string, string> = {
  home: '<path d="m3 11 9-7 9 7M5 10v10h5v-6h4v6h5V10"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  clo: '<path d="m8 5 4 3 4-3 5 4-3 4-2-1v8H8v-8l-2 1-3-4 5-4Z"/><path d="M9 5a3 3 0 0 0 6 0"/>',
  fac: '<path d="M4 10v10h16V10M3 10l2-6h14l2 6"/><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6"/>',
  coord: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 3.5 4.8V20"/>',
  tool: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h5M8 16h7M8 3v2M8 19v2"/>',
  shop: '<path d="M7 3h11a2 2 0 0 1 2 2v15H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM7 3v14M4 17h16"/><path d="M12 8a1.5 1.5 0 0 1 3 0c0 1-1.5 1-1.5 2l4 2.5h-8l4-2.5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  ok: '<path d="m5 12 4 4L19 6"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  log: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M4 10h16M8 14h2M14 14h2"/>',
  upg: '<path d="M12 17V4m-5 5 5-5 5 5M5 17v3h14v-3"/>',
  up: '<path d="M12 20V4m-5 5 5-5 5 5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none"/>',
  warn: '<path d="m12 4 9 16H3L12 4Z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none"/>',
  carry: '<path d="M20 10a8 8 0 0 0-13.7-4L4 8m0-4v4h4M4 14a8 8 0 0 0 13.7 4l2.3-2m0 4v-4h-4"/>',
  dots: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
  pen: '<path d="m15.5 4.5 4 4M4 20l4.5-1L20 7.5a2.8 2.8 0 0 0-4-4L4.5 15 4 20Z"/>',
  tagic: '<path d="M4 4h8l8 8-8 8-8-8V4Z"/><circle cx="8" cy="8" r="1"/>',
  sword: '<path d="m5 4 14 14M19 4 5 18M4 4l4 1-3 3-1-4ZM20 4l-4 1 3 3 1-4ZM3 15l6 6M15 21l6-6M4 20l1-1M19 19l1 1"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v6M12 7v.5"/>',
  note: '<path d="M5 4h14v13H9l-4 3V4Z"/><path d="M8 8h8M8 12h5"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0V4ZM8 6H4v3a4 4 0 0 0 4 4M16 6h4v3a4 4 0 0 1-4 4M12 14v6M8 20h8"/>',
};

export function pixelIcon(name: string) {
  return `<svg class="ui-icon pixel-icon${name === 'chev' ? ' chev' : ''}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${marks[name] ?? marks.shop}</svg>`;
}

export function installPixelIcons() {
  (window as any).__FMS_ICONS__ = Object.fromEntries(Object.keys(marks).map(name => [name, pixelIcon(name)]));
  document.querySelectorAll<HTMLElement>('[data-pixel]').forEach(el => { el.innerHTML = pixelIcon(el.dataset.pixel!); });
  document.getElementById('recentBtn')!.innerHTML = pixelIcon('clock');
  document.querySelector('#fab [data-q="memo"]')!.innerHTML = pixelIcon('cal');
  document.querySelector('#fab [data-q="up"]')!.innerHTML = pixelIcon('upg');
  document.querySelector('#fab [data-q="goal"]')!.innerHTML = pixelIcon('target');
}
