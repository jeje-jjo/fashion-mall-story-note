/* 시작 순서: 로그인 확인 → 기준 데이터(Firestore ref/*) 받기 → DATA 만들기 → 화면 엔진(src/engine.js) 실행
   엔진은 기존 노트 코드 그대로라 window.__FMS_DATA__ 와 window.claude.use("db") 로 데이터·저장소를 받는다. */
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, db as fs, provider, MOCK } from "./firebase";
import { makeDb } from "./fsdb";
import { loadTables } from "./data";
import { buildData, TABLES, type Tables } from "./buildData";
import { mockDb } from "./mockdb";
import { startEngine } from "./engine-loader";

const $ = (id: string) => document.getElementById(id)!;
const gate = (msg: string, sub = "", login = false) => {
  $("gate").hidden = false;
  $("gateMsg").textContent = msg;
  $("gateSub").textContent = sub;
  $("gateLogin").hidden = !login;
};

async function boot(store: unknown) {
  gate("불러오는 중…", "기준 데이터를 받고 있어요");
  let t: Tables;
  try {
    t = await loadTables(TABLES);
    /* 옷 그림은 마네킹을 열 때만 받는다(ref/clo_img, 제제 2026-11-26) */
    (window as any).__fmsLoadImgs = () => loadTables(["clo_img"] as const);
  } catch (e: any) {
    /* 권한 거부 = 노트 주인이 아닌 구글 계정으로 로그인된 경우(다른 브라우저에 다른 계정이 남아 있을 때, 2026-11-17)
       → 지금 계정을 보여 주고 다른 계정으로 다시 로그인할 수 있게 */
    if (!MOCK && String(e?.code ?? "").includes("permission-denied")) {
      gate("이 계정으로는 열 수 없어요", `${auth.currentUser?.email || "지금 계정"}으로 로그인되어 있어요. 노트 주인 구글 계정으로 다시 로그인해 주세요.`, true);
      $("gateLogin").textContent = "다른 계정으로 로그인";
      return;
    }
    gate("기준 데이터를 받지 못했어요", `${e?.code ?? e} · 새로 고쳐 주세요`);
    return;
  }
  try {
    await startEngine(buildData(t), store, () => MOCK ? null : signOut(auth).then(() => location.reload()));
    $("gate").hidden = true;
  } catch {
    gate("화면을 불러오지 못했어요", "새로 고쳐 주세요");
  }
}

$("gateLogin").addEventListener("click", async () => {
  /* 다른 계정으로 로그인: 지금 계정을 먼저 내보내고, 구글 계정 고르는 창을 띄운다 */
  if (auth.currentUser) { await signOut(auth).catch(() => {}); provider.setCustomParameters({ prompt: "select_account" }); }
  signInWithPopup(auth, provider).catch((e) => gate("로그인하지 못했어요", `${e.code} · 팝업이 막혔다면 허용한 뒤 다시 눌러 주세요`, true));
});

if (MOCK) {
  const m = mockDb(); (window as any).__mockDb = m; boot(m);
} else {
  let started = false;
  onAuthStateChanged(auth, (u) => {
    if (!u) { gate("패션몰스토리 노트", "본인 계정으로만 쓸 수 있어요", true); return; }
    if (started) { location.reload(); return; }  // 다른 계정으로 다시 로그인하면 처음부터 다시 연다
    started = true;
    boot(makeDb(fs));
  });
}
