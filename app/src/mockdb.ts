/* 개발용 가짜 저장소(VITE_MOCK=1). 브라우저 메모리에만 저장하고 onSnapshot 구독자에게 바로 알린다. */
type Snap = { exists: boolean; id: string; data: () => any };

export function mockDb() {
  const docs = new Map<string, any>();
  const subs = new Set<() => void>();
  const notify = () => setTimeout(() => subs.forEach((f) => f()), 0);
  const snap = (p: string): Snap => ({ exists: docs.has(p), id: p.split("/").pop()!, data: () => docs.get(p) });
  const children = (p: string) => [...docs.keys()].filter((k) => k.startsWith(p + "/") && k.split("/").length === p.split("/").length + 1);
  let seq = 0;

  const doc = (p: string) => ({
    onSnapshot(next: (s: Snap) => void) { const f = () => next(snap(p)); subs.add(f); setTimeout(f, 0); return () => subs.delete(f); },
    set: async (d: any) => { docs.set(p, d); notify(); },
    update: async (d: any) => { docs.set(p, { ...(docs.get(p) || {}), ...d }); notify(); },
    delete: async () => { docs.delete(p); notify(); },
  });
  const col = (p: string): any => ({
    orderBy: () => col(p),
    limit: () => col(p),
    doc: (id: string) => doc(`${p}/${id}`),
    add: async (d: any) => { const id = `m${++seq}`; docs.set(`${p}/${id}`, d); notify(); return { id }; },
    getLocal: async () => ({ docs: children(p).map(snap) }),
    getServer: async () => ({ docs: children(p).map(snap) }),
    onSnapshot(next: (s: { docs: Snap[] }) => void) { const f = () => next({ docs: children(p).map(snap) }); subs.add(f); setTimeout(f, 0); return () => subs.delete(f); },
  });
  return { doc, collection: col, _docs: docs };
}
