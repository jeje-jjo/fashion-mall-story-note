/** 시각 디자인 선택만 담당한다. hybrid 화면 엔진·진행 데이터와 분리한다. */
export const SKINS = [
  { id: "classic", name: "현재 디자인", note: "익숙한 구성, 차분한 로즈", number: "01" },
  { id: "atelier", name: "아틀리에", note: "따뜻한 여백과 섬세한 깊이", number: "02" },
  { id: "paper", name: "페이퍼", note: "선명하고 담백한 기록의 표정", number: "03" },
] as const;

export function validSkin(value: unknown): string {
  if (import.meta.env.MODE === "preview" && value === "studio") return "studio";
  return SKINS.some(skin => skin.id === value) ? String(value) : "classic";
}

export function appearancePicker() {
  return `<div class="appearance-group"><div class="appearance-heading"><h3>디자인</h3><p>정보와 기능은 그대로, 분위기만 바꿔요.</p></div><div class="appearance-options" role="group" aria-label="화면 디자인">${SKINS.map(skin => `<button type="button" class="appearance-option" data-skin="${skin.id}" aria-pressed="false">
    <span class="appearance-preview preview-${skin.id}" aria-hidden="true"><span class="mini-rail"><i></i><i></i><i></i></span><span class="mini-main"><span class="mini-heading"></span><span class="mini-panel"><i></i><i></i><i></i></span><span class="mini-lines"><i></i><i></i><i></i></span></span><span class="preview-check">✓</span></span>
    <span class="appearance-label"><b>${skin.name}</b><span>${skin.number}</span></span><span class="appearance-note">${skin.note}</span>
  </button>`).join("")}</div></div>`;
}

/** 앱 시작 때도 적용해 로그인 게이트와 첫 화면의 디자인 깜박임을 줄인다. */
export function restoreAppearance() {
  try {
    const pref = JSON.parse(localStorage.getItem("fms-theme") || "{}");
    document.documentElement.dataset.skin = validSkin(pref.skin);
    if (pref.mode === "light" || pref.mode === "dark") document.documentElement.dataset.theme = pref.mode;
    if (["rose", "red", "taupe"].includes(pref.pal)) document.documentElement.dataset.pal = pref.pal;
    else if (pref.pal === "blue") document.documentElement.removeAttribute("data-pal");
  } catch {
    document.documentElement.dataset.skin = "classic";
  }
}
