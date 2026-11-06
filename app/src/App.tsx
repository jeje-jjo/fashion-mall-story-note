import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, provider, MOCK } from "./firebase";
import { Home, Clothes, Facilities, Coord, Records, Guide } from "./screens";

const TABS = [
  { id: "home", label: "메인", el: Home },
  { id: "fac", label: "시설", el: Facilities },
  { id: "clo", label: "의류", el: Clothes },
  { id: "coord", label: "코디", el: Coord },
  { id: "rec", label: "기록", el: Records },
  { id: "guide", label: "공략", el: Guide },
] as const;
type TabId = (typeof TABS)[number]["id"];

function tabFromHash(): TabId {
  const h = location.hash.slice(1);
  return (TABS.find((t) => t.id === h)?.id ?? "home") as TabId;
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(MOCK ? ({ uid: "mock", displayName: "목업" } as User) : undefined);
  const [tab, setTab] = useState<TabId>(tabFromHash);
  const [err, setErr] = useState("");

  useEffect(() => (MOCK ? undefined : onAuthStateChanged(auth, setUser)), []);
  useEffect(() => {
    const f = () => setTab(tabFromHash());
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);

  if (user === undefined) return <div className="center muted">불러오는 중…</div>;
  if (user === null) {
    return (
      <div className="center login">
        <h1 className="brand">패션몰스토리 노트</h1>
        <p className="muted">본인 계정으로만 쓸 수 있어요.</p>
        <button className="btn primary" onClick={() => signInWithPopup(auth, provider).catch((e) => setErr(e.code))}>
          구글로 로그인
        </button>
        {err && <p className="error">로그인하지 못했어요 ({err}). 팝업이 막혔다면 허용한 뒤 다시 눌러 주세요.</p>}
      </div>
    );
  }

  const Screen = TABS.find((t) => t.id === tab)!.el;
  return (
    <div className="shell">
      <header className="top">
        <span className="brand small">패션몰스토리 노트</span>
        <button className="link" onClick={() => !MOCK && signOut(auth)} title={user.uid}>로그아웃</button>
      </header>
      <nav className="tabs" aria-label="탭">
        {TABS.map((t) => (
          <a key={t.id} href={"#" + t.id} aria-current={t.id === tab ? "page" : undefined}>{t.label}</a>
        ))}
      </nav>
      <main className="main">
        <Screen />
        <footer className="source">
          출처: 기존 노트 기록, <a href="https://kairo.waterbeetles.dev/ko/fashion-mall-story/" target="_blank" rel="noreferrer">KairoHistory</a>(비공식 팬 위키) · 개인 참고용, 카이로소프트 공식 아님
        </footer>
      </main>
    </div>
  );
}
