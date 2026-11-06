import { useEffect, useState } from "react";
import { collection, getDocs, getDocsFromCache } from "firebase/firestore";
import { db, MOCK } from "./firebase";

// Firestore ref/{표}/rows 를 그대로 읽는다(표 설계: docs/data.md)
export type Row = Record<string, any>;

const memo = new Map<string, Promise<Row[]>>();

async function fetchTable(name: string): Promise<Row[]> {
  if (MOCK) {
    const r = await fetch(`/__tables/${name}.json`);
    return (await r.json()).rows;
  }
  const ref = collection(db, "ref", name, "rows");
  // 캐시에 있으면 먼저 쓰고, 없으면 서버에서
  try {
    const c = await getDocsFromCache(ref);
    if (!c.empty) {
      getDocs(ref).catch(() => {}); // 뒤에서 새로 고침(다음 열 때 반영)
      return c.docs.map((d) => d.data());
    }
  } catch { /* 캐시 없음 */ }
  return (await getDocs(ref)).docs.map((d) => d.data());
}

export function loadTable(name: string): Promise<Row[]> {
  if (!memo.has(name)) memo.set(name, fetchTable(name));
  return memo.get(name)!;
}

export function useTable(name: string): { rows: Row[] | null; error: string | null } {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadTable(name).then((r) => live && setRows(r)).catch((e) => {
      memo.delete(name);
      live && setError(String(e?.code ?? e));
    });
    return () => { live = false; };
  }, [name]);
  return { rows, error };
}

export const list = (v: unknown): string => (Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v));
export const won = (n: unknown) => (typeof n === "number" ? n.toLocaleString("ko-KR") + " G" : "");
