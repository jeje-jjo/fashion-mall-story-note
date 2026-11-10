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
  } catch (e: any) {
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

$("gateLogin").addEventListener("click", () => {
  signInWithPopup(auth, provider).catch((e) => gate("로그인하지 못했어요", `${e.code} · 팝업이 막혔다면 허용한 뒤 다시 눌러 주세요`, true));
});

if (MOCK) {
  const m = mockDb(); (window as any).__mockDb = m; boot(m);
} else {
  let started = false;
  onAuthStateChanged(auth, (u) => {
    if (!u) { gate("패션몰스토리 노트", "본인 계정으로만 쓸 수 있어요", true); return; }
    if (started) return;
    started = true;
    boot(makeDb(fs));
  });
}
