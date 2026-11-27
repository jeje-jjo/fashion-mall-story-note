import { collection, getDocs, getDocsFromCache, getDocsFromServer } from "firebase/firestore";
import { db, MOCK } from "./firebase";

// Firestore ref/{표}/rows 를 읽는다(표 설계: docs/data.md)
export type Row = Record<string, any>;

/* 읽기 줄이기(2026-11-27, 하루 무료 읽기 5만 건 초과):
   예전엔 열 때마다 모든 표를 서버에서 통째로 다시 받았다(표 40여 개 · 수천 건).
   이제 표 정보 문서 ref/{표}(표 하나에 1건)만 읽어 바뀐 표만 다시 받는다.
   - 표 서명 = ver(push_firestore.py가 넣는 값) 또는 [행 수, 열 목록]
   - 서명이 같아도 3일이 지나면 한 번 새로 받는다(ver 없이 값만 바뀐 경우 대비) */
const SIG_KEY = "fms-refsig-v1";
const MAX_AGE = 3 * 24 * 3600e3;
type Sigs = Record<string, { s: string; at: number }>;

const readSigs = (): Sigs => { try { return JSON.parse(localStorage.getItem(SIG_KEY) || "{}"); } catch { return {}; } };
const saveSig = (name: string, s: string) => {
  try { const all = readSigs(); all[name] = { s, at: Date.now() }; localStorage.setItem(SIG_KEY, JSON.stringify(all)); } catch { /* 저장 못 함 */ }
};

let metaP: Promise<Record<string, string> | null> | null = null;
function refMeta() {
  return (metaP ??= getDocsFromServer(collection(db, "ref"))
    .then((s) => Object.fromEntries(s.docs.map((d) => {
      const m = d.data();
      return [d.id, String(m.ver ?? JSON.stringify([m.rows ?? null, m.columns ?? null]))];
    })))
    .catch(() => null));
}

async function refreshIfChanged(name: string, ref: ReturnType<typeof collection>) {
  const meta = await refMeta();
  if (!meta || !(name in meta)) return;  // 서버 정보를 못 받으면 캐시 그대로
  const sig = meta[name], old = readSigs()[name];
  if (old && old.s === sig && Date.now() - old.at < MAX_AGE) return;
  await getDocs(ref);
  saveSig(name, sig);
}

async function fetchTable(name: string): Promise<Row[]> {
  if (MOCK) {
    const r = await fetch(`${import.meta.env.BASE_URL}__tables/${name}.json`);
    return (await r.json()).rows;
  }
  const ref = collection(db, "ref", name, "rows");
  // 캐시가 있으면 바로 쓰고, 표가 바뀌었을 때만 뒤에서 새로 받는다(다음에 열 때 반영)
  try {
    const c = await getDocsFromCache(ref);
    if (!c.empty) {
      refreshIfChanged(name, ref).catch(() => {});
      return c.docs.map((d) => d.data());
    }
  } catch { /* 캐시 없음 */ }
  const rows = (await getDocs(ref)).docs.map((d) => d.data());
  refMeta().then((m) => { if (m?.[name]) saveSig(name, m[name]); }).catch(() => {});
  return rows;
}

export async function loadTables<T extends string>(names: readonly T[]): Promise<Record<T, Row[]>> {
  const rows = await Promise.all(names.map(fetchTable));
  return Object.fromEntries(names.map((n, i) => [n, rows[i]])) as Record<T, Row[]>;
}
