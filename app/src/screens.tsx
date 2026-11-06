import { useMemo, useState, type ReactNode } from "react";
import { useTable, list, won, type Row } from "./data";

const TYPE7 = ["내추럴", "쿨", "큐트", "성숙", "레트로", "하드", "서브컬쳐"];
const SUB14 = ["캐주얼", "스트리트", "파스텔", "엘리건트", "US레트로", "록", "코스프레", "포크로어", "모드", "팝", "고저스", "80년대레트로", "오리지널리티", "사이버"];
const show = (s: string) => s.replace("서브컬쳐", "서브컬처"); // 키는 서브컬쳐, 화면은 서브컬처

function Loading({ error }: { error: string | null }) {
  return <p className="muted pad">{error ? `불러오지 못했어요 (${error})` : "불러오는 중…"}</p>;
}

function Chips({ items, value, onChange, all = "전체" }: { items: string[]; value: string; onChange: (v: string) => void; all?: string }) {
  return (
    <div className="chips" role="group">
      {[all, ...items].map((x) => (
        <button key={x} className="chip" aria-pressed={value === x} onClick={() => onChange(x)}>{show(x)}</button>
      ))}
    </div>
  );
}

function Seg<T extends string>({ items, value, onChange }: { items: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="group">
      {items.map(([k, l]) => <button key={k} aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}

function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input className="field" type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function Kv({ k, v }: { k: string; v: ReactNode }) {
  if (v == null || v === "" || (Array.isArray(v) && !v.length)) return null;
  return <div className="kv"><span>{k}</span><b>{v}</b></div>;
}

const has = (q: string, ...xs: unknown[]) => !q || xs.some((x) => list(x).toLowerCase().includes(q.toLowerCase()));

// ---------------------------------------------------------------- 메인
export function Home() {
  const verify = useTable("verify");
  const meta = useTable("_meta");
  return (
    <section className="stack">
      <div className="card">
        <h2>새 노트 준비 중</h2>
        <p className="muted">지금은 기준 데이터 보기만 돼요. 체크·기록 기능은 기존 노트 데이터를 옮긴 다음 켜요.</p>
      </div>
      <div className="card">
        <h2>게임에서 확인할 것</h2>
        {!verify.rows ? <Loading error={verify.error} /> : (
          <ul className="plain">{verify.rows.map((v) => <li key={v.key}>{v.text} <span className="muted">· 옷 {list(v.ids)}</span></li>)}</ul>
        )}
      </div>
      <details className="card">
        <summary>데이터 표 {meta.rows?.length ?? ""}개</summary>
        <ul className="plain small">{meta.rows?.filter((m) => m.rows != null).map((m) => <li key={m.name}>{m.title} <span className="muted">{m.rows}</span></li>)}</ul>
      </details>
    </section>
  );
}

// ---------------------------------------------------------------- 의류
export function Clothes() {
  const { rows, error } = useTable("clothes");
  const [q, setQ] = useState("");
  const [sub, setSub] = useState("전체");
  const [kind, setKind] = useState<"all" | "상의" | "하의" | "셋업" | "아우터" | "액세서리">("all");
  const [open, setOpen] = useState<string | null>(null);
  const shown = useMemo(() => (rows ?? [])
    .filter((r) => r.id != null)
    .filter((r) => sub === "전체" || r.sub === sub)
    .filter((r) => kind === "all" || r.kind === kind)
    .filter((r) => has(q, r.name, r.origName, r.pattern, r.material, r.option, r.tags, r.color))
    .sort((a, b) => a.id - b.id), [rows, q, sub, kind]);
  if (!rows) return <Loading error={error} />;
  return (
    <section className="stack">
      <div className="tools">
        <Search value={q} onChange={setQ} placeholder="옷 이름·옷본·재료·옵션" />
        <Seg items={[["all", "전체"], ["상의", "상의"], ["하의", "하의"], ["셋업", "셋업"], ["아우터", "아우터"], ["액세서리", "액세서리"]]} value={kind} onChange={setKind} />
      </div>
      <Chips items={SUB14} value={sub} onChange={setSub} />
      <p className="muted small">{shown.length}벌</p>
      <ul className="rows">
        {shown.map((r) => {
          const key = String(r.id);
          const isOpen = open === key;
          return (
            <li key={key} className="row">
              <button className="rowhead" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : key)}>
                <span className="num">{r.id}</span>
                <span className="title">{r.name}</span>
                <span className="tag cat">{r.sub}</span>
                {r.tier ? <span className="tag sem">T{r.tier}</span> : null}
              </button>
              <div className="rowsub muted">{[r.pattern, r.material, r.option].filter(Boolean).join(" · ")}{r.color ? ` · ${r.color}` : ""}{r.season ? ` · ${r.season}` : ""}</div>
              {isOpen && (
                <div className="detail">
                  <Kv k="사이트 #" v={r.siteId} />
                  <Kv k="분류" v={r.kind} />
                  <Kv k="품질·매력(노트)" v={r.noteQuality != null ? `${r.noteQuality} / ${r.noteCharm}` : null} />
                  <Kv k="기본 품질·인기" v={r.siteQuality != null ? `${r.siteQuality} / ${r.sitePop}` : null} />
                  <Kv k="기본 가격" v={won(r.sitePrice)} />
                  <Kv k="손님 성향" v={r.custType ? `${r.custType} (${list(r.custExamples)})` : null} />
                  <Kv k="스타일 점수" v={r.styleScores ? Object.entries(r.styleScores).map(([k, v]) => `${k} ${v}`).join(", ") : null} />
                  <Kv k="코디 세트" v={list(r.sets)} />
                  <Kv k="입수 방법" v={r.acquire} />
                  <Kv k="잘 어울림" v={r.goodWith} />
                  <Kv k="안 어울림" v={r.badWith} />
                  <Kv k="전투 추천" v={r.battle} />
                  <Kv k="코디 요청 손님" v={r.coordGuests} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- 시설
export function Facilities() {
  const { rows, error } = useTable("facilities");
  const [type, setType] = useState("전체");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const shown = useMemo(() => (rows ?? [])
    .filter((r) => r.id != null)
    .filter((r) => type === "전체" || (type === "우선개량" ? r.p40 : r.type === type))
    .filter((r) => has(q, r.name, r.goodItems))
    .sort((a, b) => a.id - b.id), [rows, type, q]);
  if (!rows) return <Loading error={error} />;
  return (
    <section className="stack">
      <Search value={q} onChange={setQ} placeholder="시설 이름·상성 좋은 아이템" />
      <Chips items={[...TYPE7, "우선개량"]} value={type} onChange={setType} />
      <ul className="rows">
        {shown.map((r) => {
          const key = String(r.id);
          const isOpen = open === key;
          return (
            <li key={key} className="row">
              <button className="rowhead" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : key)}>
                <span className="num">{r.id}</span>
                <span className="title">{r.name}</span>
                <span className="tag type">{show(r.type ?? "")}</span>
                {r.p40 ? <span className="tag sem">40P</span> : null}
              </button>
              <div className="rowsub muted">◎ {list(r.goodItems) || "없음"}</div>
              {isOpen && (
                <div className="detail">
                  <Kv k="크기" v={r.w ? `${r.w}×${r.h} (${r.area}칸)` : null} />
                  <Kv k="건설비" v={r.cost != null ? `${won(r.cost)}${r.costStep ? ` (+${r.costStep.toLocaleString("ko-KR")})` : ""}` : null} />
                  <Kv k="매력·인기·평판" v={r.charm != null ? `${r.charm} · ${r.pop} · ${r.fame}` : null} />
                  <Kv k="상성 ◯" v={list(r.okItems)} />
                  <Kv k="상성 ×" v={list(r.badItems)} />
                  <Kv k="패션 체크" v={r.checks} />
                  <Kv k="효과" v={r.effect} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- 코디
export function Coord() {
  const [mode, setMode] = useState<"req" | "set">("req");
  return (
    <section className="stack">
      <Seg items={[["req", "손님 요청"], ["set", "코디 세트"]]} value={mode} onChange={setMode} />
      {mode === "req" ? <CoordRequests /> : <OutfitSets />}
    </section>
  );
}

function CoordRequests() {
  const { rows, error } = useTable("coord_requests");
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of (rows ?? []).filter((r) => has(q, r.guest, r.request, r.top, r.bottom, r.outer, r.acc)).sort((a, b) => a.id - b.id)) {
      const g = String(r.guest ?? "").replace(/[①-⑳]/g, "");
      m.set(g, [...(m.get(g) ?? []), r]);
    }
    return [...m.entries()];
  }, [rows, q]);
  if (!rows) return <Loading error={error} />;
  return (
    <>
      <Search value={q} onChange={setQ} placeholder="손님·요청·옷 이름" />
      {groups.map(([g, rs]) => (
        <div key={g} className="card">
          <h3>{g}</h3>
          <ol className="reqs">
            {rs.map((r) => (
              <li key={r.id}>
                <b>{r.request}</b>
                <span className="muted">{[r.top, r.bottom, r.outer, r.acc].filter(Boolean).join(" + ")}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </>
  );
}

function OutfitSets() {
  const { rows, error } = useTable("outfit_sets");
  const [sub, setSub] = useState("전체");
  const [valid, setValid] = useState<"valid" | "all">("valid");
  if (!rows) return <Loading error={error} />;
  const shown = rows.filter((r) => (sub === "전체" || r.sub === sub) && (valid === "all" || r.valid)).sort((a, b) => a.setId - b.setId);
  return (
    <>
      <div className="tools">
        <Seg items={[["valid", "유효 세트"], ["all", "전체 세트"]]} value={valid} onChange={setValid} />
      </div>
      <Chips items={SUB14} value={sub} onChange={setSub} />
      <ul className="rows">
        {shown.map((r) => (
          <li key={r.setId} className="row">
            <div className="rowhead static">
              <span className="num">#{r.setId}</span>
              <span className="title">{list(r.names).replace(/, /g, " + ")}</span>
              <span className="tag cat">{r.sub}</span>
            </div>
            {r.missing?.length ? <div className="rowsub muted">노트에 없는 옷 {list(r.missing)}</div> : null}
          </li>
        ))}
      </ul>
    </>
  );
}

// ---------------------------------------------------------------- 기록(지금은 배틀·패션 체크 기준 데이터)
export function Records() {
  const [mode, setMode] = useState<"battle" | "check">("battle");
  const battles = useTable("battles");
  const checks = useTable("fashion_checks");
  const t = mode === "battle" ? battles : checks;
  return (
    <section className="stack">
      <p className="muted small">콘테스트·배치·개량·관리 기록은 데이터 이전 뒤에 켜요.</p>
      <Seg items={[["battle", "배틀"], ["check", "패션 체크"]]} value={mode} onChange={setMode} />
      {!t.rows ? <Loading error={t.error} /> : (
        <ul className="rows">
          {(mode === "battle" ? t.rows.filter((r) => r.kind === "챌린지") : t.rows.filter((r) => r.id < 100).sort((a, b) => a.id - b.id)).map((r) => (
            <li key={r.id} className="row">
              <div className="rowhead static">
                <span className="title">{r.name}</span>
                {mode === "battle" ? <span className="tag sem">{r.stat}</span> : <span className="muted small">#{r.id}</span>}
              </div>
              <div className="rowsub muted">
                {mode === "battle" ? `${r.cond ?? ""} · 보상 ${r.reward ?? ""}` : `${r.req ?? ""} · 시설 ${r.facilities ?? ""}`}
              </div>
              {mode === "battle" && r.clothCond ? <div className="rowsub small">조건: {r.clothCond}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- 공략
export function Guide() {
  const { rows, error } = useTable("guide");
  const [grade, setGrade] = useState<"확인" | "all">("확인");
  if (!rows) return <Loading error={error} />;
  const shown = rows.filter((r) => grade === "all" || String(r.grade).startsWith("확인"));
  return (
    <section className="stack">
      <Seg items={[["확인", "확인된 것"], ["all", "전체(참고 포함)"]]} value={grade} onChange={setGrade} />
      {shown.map((r) => (
        <details key={r.key} className="card">
          <summary>{r.title} {r.grade && <span className="tag sem">{r.grade}</span>}</summary>
          <pre className="body">{r.body}</pre>
        </details>
      ))}
    </section>
  );
}
