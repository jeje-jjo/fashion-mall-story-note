/* 시작 순서: 로그인 확인 → 기준 데이터(Firestore ref/*) 받기 → DATA 만들기 → 화면 엔진(public/engine.js) 실행
   엔진은 기존 노트 코드 그대로라 window.__FMS_DATA__ 와 window.claude.use("db") 로 데이터·저장소를 받는다. */
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, db as fs, provider, MOCK } from "./firebase";
import { makeDb } from "./fsdb";
import { loadTables } from "./data";
import { buildData, TABLES, type Tables } from "./buildData";
import { mockDb } from "./mockdb";

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
  (window as any).__FMS_DATA__ = buildData(t);
  (window as any).claude = { use: async (n: string) => (n === "db" ? store : null) };
  (window as any).__fmsSignOut = () => (MOCK ? null : signOut(auth).then(() => location.reload()));
  const s = document.createElement("script");
  s.src = `${import.meta.env.BASE_URL}engine.js?v=${__BUILD__}`;
  s.onload = () => { $("gate").hidden = true; };
  s.onerror = () => gate("화면을 불러오지 못했어요", "새로 고쳐 주세요");
  document.body.appendChild(s);
}

$("gateLogin").addEventListener("click", () => {
  signInWithPopup(auth, provider).catch((e) => gate("로그인하지 못했어요", `${e.code} · 팝업이 막혔다면 허용한 뒤 다시 눌러 주세요`, true));
});

if (MOCK) {
  boot(mockDb());
} else {
  let started = false;
  onAuthStateChanged(auth, (u) => {
    if (!u) { gate("패션몰스토리 노트", "본인 계정으로만 쓸 수 있어요", true); return; }
    if (started) return;
    started = true;
    boot(makeDb(fs));
  });
}
