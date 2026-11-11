/* 기존 노트(claude.ai 아티팩트 저장소)와 같은 모양의 저장소 API를 Firestore로 구현한다.
   화면 엔진(src/engine.js)은 window.claude.use("db")로 이 객체를 받아 그대로 쓴다.
   모든 경로 앞에 ROOT를 붙여 기준 데이터(ref/*)·백업(backup/*)과 섞이지 않게 한다. */
import {
  addDoc, collection, deleteDoc, doc, getDocsFromServer, onSnapshot, orderBy, limit, query, setDoc, updateDoc,
  type Firestore, type Query, type QueryConstraint,
} from "firebase/firestore";

export const ROOT = "note/v2";

type Snap = { exists: boolean; id: string; data: () => any };
type Unsub = () => void;

function docSnap(s: { exists(): boolean; id: string; data(): any }): Snap {
  const ex = s.exists();
  return { exists: ex, id: s.id, data: () => (ex ? s.data() : undefined) };
}

export function makeDb(fs: Firestore) {
  const full = (p: string) => `${ROOT}/${p}`;

  const docRef = (p: string) => ({
    onSnapshot(next: (s: Snap) => void, err?: (e: unknown) => void): Unsub {
      return onSnapshot(doc(fs, full(p)), (s) => next(docSnap(s)), (e) => err?.(e));
    },
    set: (data: Record<string, unknown>) => setDoc(doc(fs, full(p)), data),
    update: (data: Record<string, unknown>) => updateDoc(doc(fs, full(p)), data),
    delete: () => deleteDoc(doc(fs, full(p))),
  });

  const colRef = (p: string, cons: QueryConstraint[] = []) => {
    const api = {
      orderBy: (f: string, dir: "asc" | "desc" = "asc") => colRef(p, [...cons, orderBy(f, dir)]),
      limit: (n: number) => colRef(p, [...cons, limit(n)]),
      add: async (data: Record<string, unknown>) => ({ id: (await addDoc(collection(fs, full(p)), data)).id }),
      doc: (id: string) => docRef(`${p}/${id}`),
      /* 서버에서 한 번만 읽기: onSnapshot 첫 응답은 기기 캐시라 다른 기기 기록이 빠질 수 있다(클릭 기록 파일 받기) */
      async getServer(): Promise<{ docs: Snap[] }> {
        const q: Query = cons.length ? query(collection(fs, full(p)), ...cons) : collection(fs, full(p));
        const s = await getDocsFromServer(q);
        return { docs: s.docs.map((d) => docSnap(d as any)) };
      },
      onSnapshot(next: (s: { docs: Snap[] }) => void, err?: (e: unknown) => void): Unsub {
        const q: Query = cons.length ? query(collection(fs, full(p)), ...cons) : collection(fs, full(p));
        return onSnapshot(q, (s) => next({ docs: s.docs.map((d) => docSnap(d as any)) }), (e) => err?.(e));
      },
    };
    return api;
  };

  return { doc: docRef, collection: (p: string) => colRef(p) };
}
