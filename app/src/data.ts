import { collection, getDocs, getDocsFromCache } from "firebase/firestore";
import { db, MOCK } from "./firebase";

// Firestore ref/{표}/rows 를 읽는다(표 설계: docs/data.md)
export type Row = Record<string, any>;

async function fetchTable(name: string): Promise<Row[]> {
  if (MOCK) {
    const r = await fetch(`${import.meta.env.BASE_URL}__tables/${name}.json`);
    return (await r.json()).rows;
  }
  const ref = collection(db, "ref", name, "rows");
  // 캐시가 있으면 바로 쓰고 뒤에서 새로 고친다(다음에 열 때 반영)
  try {
    const c = await getDocsFromCache(ref);
    if (!c.empty) {
      getDocs(ref).catch(() => {});
      return c.docs.map((d) => d.data());
    }
  } catch { /* 캐시 없음 */ }
  return (await getDocs(ref)).docs.map((d) => d.data());
}

export async function loadTables<T extends string>(names: readonly T[]): Promise<Record<T, Row[]>> {
  const rows = await Promise.all(names.map(fetchTable));
  return Object.fromEntries(names.map((n, i) => [n, rows[i]])) as Record<T, Row[]>;
}
