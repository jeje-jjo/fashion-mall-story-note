import { buildData, TABLES, type Tables } from "./buildData";
import { startEngine } from "./engine-loader";
import { mockDb } from "./mockdb";

// 공개 저장소의 기존 기준 데이터만 사용한다. 사이트 번호·실제 진행률을 흉내 내지 않는다.
const tables = Object.fromEntries(TABLES.map(name => [name, []])) as unknown as Tables;
(window as any).__FMS_PREVIEW__ = true;
document.getElementById("previewBanner")!.hidden = false;
startEngine(buildData(tables), mockDb(), () => undefined).then(() => {
  document.getElementById("gate")!.hidden = true;
}).catch(() => {
  document.getElementById("gateMsg")!.textContent = "미리보기를 불러오지 못했어요";
});
