/* 아이콘: 소프트 플랫 부티크 묶음(2026-11-10 제제). 탭·버튼·작은 기호 전부 같은 그림체.
   SVG를 문서 안에 바로 넣고 색은 CSS 변수로 칠한다 → 라이트·다크·스킨에 따라 자동으로 바뀐다(design-system.css). */
import { FLAT as PACK } from "./flat-icons";
import { LINE } from "./line-icons";

/* 어떤 아이콘을 쓸지: "pack" = 소프트 플랫 부티크 묶음(지금 배포), "line" = 직접 그린 선 아이콘(제제 확인 대기) */
const SET = "pack" as "pack" | "line";
const FLAT = SET === "line" ? LINE : PACK;
const CLS = SET === "line" ? "line-icon" : "flat-icon";

const BASE = (import.meta as any).env?.BASE_URL ?? "/";
const V = "flat-1";

/** 같은 그림을 다른 이름으로도 부른다(예전 코드에서 쓰던 이름) */
const ALIAS: Record<string, string> = { star: "spark" };

export function flatIcon(name: string, px = 24) {
  const key = FLAT[name] ? name : (ALIAS[name] ?? "shop");
  return `<svg class="ui-icon ${CLS} fi-${key}${name === "chev" ? " chev" : ""}" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" ${SET === "line" ? 'stroke="currentColor" stroke-width="1.75"' : 'stroke-width="1.7"'} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${FLAT[key]}</svg>`;
}
/** 예전 이름 유지(다른 파일에서 부를 수 있음) */
export const pixelIcon = (name: string) => flatIcon(name, 16);

/** 머리줄·로그인 화면 로고: 앱 대표 아이콘(라이트·다크 두 벌, CSS로 하나만 보인다) */
const appMark = (px: number) =>
  ["light", "dark"].map(t => `<img class="app-mark app-${t}" src="${BASE}icons/${t}/app-128.png?v=${V}" width="${px}" height="${px}" alt="" aria-hidden="true" draggable="false">`).join("");

export function installPixelIcons() {
  /* 체크 칸(.ck) 안 표시는 색이 찬 동그라미 위에 올라가므로 칸 모양 없이 체크만(흰 선) 쓴다 */
  const names = [...Object.keys(FLAT), ...Object.keys(ALIAS)];
  (window as any).__FMS_ICONS__ = {
    ...Object.fromEntries(names.map(n => [n, flatIcon(n)])),
    check: flatIcon("ok").replace(CLS, `${CLS} on-fill`),
    "check-box": flatIcon("check"),
  };
  document.querySelectorAll<HTMLElement>('.brandmark[data-pixel]').forEach(el => { el.innerHTML = appMark(32); el.classList.add("has-app"); });
  document.querySelectorAll<HTMLElement>('.gate-mark[data-pixel]').forEach(el => { el.innerHTML = appMark(64); });
  document.getElementById('recentBtn')!.innerHTML = flatIcon('clock');
  document.querySelector('#fab [data-q="memo"]')!.innerHTML = flatIcon('cal');
  document.querySelector('#fab [data-q="up"]')!.innerHTML = flatIcon('upg');
  document.querySelector('#fab [data-q="goal"]')!.innerHTML = flatIcon('target');
}
