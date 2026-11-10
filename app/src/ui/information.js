/** 화면을 읽는 순서를 정하는 표현 컴포넌트. 저장·게임 계산에는 관여하지 않는다. */
export const safeText = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);

export function metricStrip(rows, label = "주요 수치") {
  rows = rows.filter(([,v]) => v != null && v !== "");
  if (!rows.length) return "";
  return `<dl class="metric-strip" aria-label="${safeText(label)}">${rows.filter(([,v]) => v != null && v !== "").map(([k,v]) => `<div><dt>${safeText(k)}</dt><dd>${safeText(v)}</dd></div>`).join("")}</dl>`;
}

function previewFactTags(key, value) {
  if (import.meta.env.MODE !== "preview" || !["옷본", "재료", "옵션", "색", "계절", "태그", "종류", "손님 성향"].includes(key)) return safeText(value);
  return String(value).split("·").map(v => `<span class="studio-fact-tag">${safeText(v.trim())}</span>`).join(" ");
}

export function factRows(rows) {
  rows = rows.filter(([,v]) => v != null && v !== "");
  if (!rows.length) return "";
  return `<dl class="fact-rows">${rows.filter(([,v]) => v != null && v !== "").map(([k,v]) => `<div><dt>${safeText(k)}</dt><dd>${previewFactTags(k,v)}</dd></div>`).join("")}</dl>`;
}

export function infoSection(title, body, className = "") {
  return body ? `<section class="info-section ${className}"><h3>${safeText(title)}</h3>${body}</section>` : "";
}

export function textList(items, className = "") {
  return items.length ? `<ul class="info-list ${className}">${items.map(item => `<li>${safeText(item)}</li>`).join("")}</ul>` : `<p class="info-empty">등록된 정보가 없어요.</p>`;
}

export function usageRow(label, items) {
  return items.length ? `<div class="usage-row"><h4>${safeText(label)}</h4><ul>${items.map(item => `<li>${item}</li>`).join("")}</ul></div>` : "";
}

const opened = new Map();
export function referenceBlock(key, title, body) {
  return `<details class="reference-block" data-reference="${safeText(key)}" ${opened.get(key) ? "open" : ""}><summary>${safeText(title)}</summary><div class="reference-content">${body}</div></details>`;
}

export function installReferenceState() {
  document.addEventListener("toggle", event => {
    const el = event.target;
    if (el instanceof HTMLDetailsElement && el.dataset.reference) opened.set(el.dataset.reference, el.open);
  }, true);
}
