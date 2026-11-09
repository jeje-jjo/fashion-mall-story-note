/** 저장소 어댑터와 화면 엔진의 경계. 기존 경로·체크 로직은 엔진에서 유지한다. */
export function startEngine(data: unknown, store: unknown, signOut: () => unknown) {
  const runtime = window as any;
  runtime.__FMS_DATA__ = data;
  runtime.claude = { use: async (name: string) => name === "db" ? store : null };
  runtime.__fmsSignOut = signOut;
  return import("./engine.js").then(() => undefined);
}
