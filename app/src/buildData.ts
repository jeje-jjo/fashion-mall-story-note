/* 화면 엔진이 쓰는 DATA를 만든다.
   - 바탕: 기존 노트 DATA(legacy/data/data.json, 제제가 플레이하며 넣은 값)
   - 번호: 옷·시설은 사이트 번호로 바꾼다(Firestore ref/clothes, ref/facilities 의 legacyId).
     패션 체크·배틀은 엔진이 목록 순서로 저장하므로 순서를 유지하고, 사이트 번호는 site.id 에 둔다
     (패션 체크 = 순서 + 1, 챌린지 배틀 = 순서 + 12).
   - 사이트 값: 각 항목의 `site` 에 덧붙인다. 기준값·통과 점수는 사이트 값을 먼저 보여 준다(제제 결정).
   - 옷 기본 정보(옷본·재료·옵션·색·계절)는 Firestore 표 값(다른 점 18칸을 사이트 값으로 고른 결과)을 쓴다. */
import legacy from "../../legacy/data/data.json";
import type { Row } from "./data";

export const TABLES = [
  "clothes", "facilities", "fashion_checks", "battles", "site_contests", "outfit_sets",
  "coord_requests", "verify", "battle_clothes", "battle_sets", "recipes", "site_ranks",
  "site_trophies", "site_missions", "characters", "guide", "terms",
  // 자료 보기(기록 탭 [자료])용 사이트 표
  "site_skills", "site_studies", "site_exams", "site_investments", "site_sales_trips", "site_celebrities",
  "site_uniforms", "site_fever", "site_grades", "site_formulas", "site_clear_points", "site_carryover_choices",
  "site_comment_replies", "site_activities", "site_items", "site_goods",
  // 전체 정보 xlsx에서 묶은 표(2026-11-10): 요청별 조건·맞는 옷, 계절별 판매 점수 평균
  "req_site", "sales_avg",
] as const;
export type Tables = Record<(typeof TABLES)[number], Row[]>;

const num = (s: unknown) => {
  const n = Number(String(s ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && String(s ?? "").match(/\d/) ? n : null;
};
const txt = (v: any) => (v && typeof v === "object" && "text" in v ? v.text : v ?? "");

const REF_COLS: Record<string, Record<string, string>> = {"site_exams": {"c0": "#", "c1": "장르", "c2": "필요 품질", "c3": "보상 옵션", "c4": "합격 시"}, "site_studies": {"c0": "스터디", "c1": "능력치", "c2": "얻는 재료", "c3": "비용"}, "site_skills": {"c0": "스킬", "c1": "효과", "c2": "획득 조건", "c3": "포인트"}, "site_investments": {"c0": "투자", "c1": "제안자", "c2": "요청", "c3": "비용", "c4": "완료 시"}, "site_sales_trips": {"c0": "장소", "c1": "랭크", "c2": "비용", "c3": "등장 조건"}, "site_celebrities": {"c0": "유명인", "c1": "범위"}, "site_uniforms": {"c0": "유니폼", "c1": "여성", "c2": "남성"}, "site_items": {"c0": "#", "c1": "이름", "c2": "설명", "c3": "가격", "c4": "등장 조건"}, "site_fever": {"c0": "피버 레벨", "c1": "첫 좋아요 목표 (추정)", "c2": "목표 증가량 (추정)"}, "site_grades": {"c0": "등급", "c1": "품질 + 인기"}, "site_formulas": {"c0": "항목", "c1": "식"}, "site_clear_points": {"c0": "항목", "c1": "1당 클리어 포인트"}, "site_carryover_choices": {"c0": "선택지", "c1": "비용", "c2": "얻는 것"}, "site_comment_replies": {"c0": "댓글", "c1": "답변", "c2": "비용", "c3": "아주 좋아하는 손님 유형", "c4": "좋아요: 보통 / 아주 좋아할 때 (추정)"}, "site_activities": {"c0": "활동", "c1": "종류", "c2": "손님 성향"}, "site_goods": {"c0": "#", "c1": "이름", "c2": "가격", "c3": "비용"}};

export function buildData(t: Tables) {
  const L: any = structuredClone(legacy);

  // ---------------- 옷
  // 상하 궁합: 사이트는 하의 쪽에만 목록이 있고 8개까지만 보인다(+n은 잘림). 이름 → 사이트 번호로 바꿔 둔다.
  const salesBy = new Map<number, { sa: number; su: number; wi: number }>((t.sales_avg || []).map((r) => [r.id, { sa: r.sa, su: r.su, wi: r.wi }]));
  const reqBy = new Map<string, Row>((t.req_site || []).map((r) => [r.key, r]));
  // 패션 체크 추가 정보 "시설 39 / clothesValue 860": clothesValue = 필요 코디 점수, 시설 = 필요 시설 점수(제제 확인 2026-11-10)
  const exNum = (r: Row, k: string) => { const m = String(r.extra || "").match(new RegExp(k + "\\s*(\\d+)")); return m ? +m[1] : null; };
  const reqOf = (r: Row | undefined) => r ? { facN: exNum(r, "시설"), cv: exNum(r, "clothesValue"), title: r.title, person: r.person, text: r.text, conds: r.conds || [], extra: r.extra, oppo: r.oppo || [], rec: r.rec || [],
    full: r.full || [], part: (r.part || []).map((x: string) => { const [id, k] = String(x).split(":"); return { id: +id, k: +k }; }) } : null;
  const idBySite = new Map<string, number>(t.clothes.map((r) => [r.siteName, r.id]));
  const pairIds = (s: unknown) => String(s ?? "").replace(/\s*\+\d+\s*$/, "").split(",")
    .map((x) => idBySite.get(x.trim())).filter((x): x is number => x != null);
  const cut = (s: unknown) => /\+\d+\s*$/.test(String(s ?? ""));
  // 색 표기 흔들림(검은·하얀 등)은 계산용 cols에서만 맞춘다. 화면 표기(col)는 그대로.
  const COL_FIX: Record<string, string> = { "검은": "검정", "하얀": "흰색", "파란": "파랑", "노란": "노랑", "노란색": "노랑", "갈": "갈색" };
  const cols = (s: unknown) => String(s ?? "").split("·").map((x) => x.trim()).filter(Boolean).map((x) => COL_FIX[x] ?? x);

  const cloByLegacy = new Map<number, Row>(t.clothes.filter((r) => r.legacyId != null).map((r) => [r.legacyId, r]));
  const cloMap = new Map<number, number>();
  L.clo = L.clo.map((c: any) => {
    const r = cloByLegacy.get(c.id);
    if (!r) return c;
    cloMap.set(c.id, r.id);
    return {
      ...c,
      id: r.id, legacyId: c.id,
      p: r.pattern ?? c.p, m: r.material ?? c.m, o: r.option ?? c.o ?? "", col: r.color ?? c.col, s: r.season ?? c.s,
      site: {
        name: r.siteName, kind: r.kind, genre: r.genre, sub: r.sub, gender: r.gender,
        q: r.siteQuality, pop: r.sitePop, price: r.sitePrice, stock: r.siteStock, tier: r.tier,
        cust: r.custType, custEx: r.custExamples, styles: r.styleScores, sets: r.sets ?? [],
        acquire: r.acquire, good: r.goodWith, bad: r.badWith, tags: r.siteTags,
        goodIds: pairIds(r.goodWith), badIds: pairIds(r.badWith), pairCut: cut(r.goodWith) || cut(r.badWith),
        cols: cols(r.color ?? c.col),
        sales: salesBy.get(r.id) || null,
      },
    };
  });
  const cid = (id: number) => cloMap.get(id) ?? id;

  for (const c of L.clo) if (c.s === "봄&가을") c.s = "봄·가을";   // 표기 통일

  // 기록한 품질·매력(2026-10-30 영상) → 사이트 번호
  if (L.gs?.items) L.gs.items = L.gs.items.map(([id, q, ch]: number[]) => [cid(id), q, ch]);

  // ---------------- 시설
  const facByLegacy = new Map<number, Row>(t.facilities.filter((r) => r.legacyId != null).map((r) => [r.legacyId, r]));
  const facMap = new Map<number, number>();
  const facSite = (r: Row) => ({
    name: r.siteName, group: r.group, category: r.category, w: r.w, h: r.h, area: r.area,
    cost: r.cost, costStep: r.costStep, upkeep: r.upkeep, charm: r.charm, pop: r.pop, fame: r.fame,
    effect: r.effect, checks: r.checks,
  });
  L.fac = L.fac.map((f: any) => {
    const r = facByLegacy.get(f.id);
    if (!r) return f;
    facMap.set(f.id, r.id);
    return { ...f, id: r.id, legacyId: f.id, site: facSite(r) };
  });
  // 사이트에만 있는 시설(마네킹·바닥·조명 등): 체크 대상은 아니고 참고·추천용
  L.facExtra = t.facilities.filter((r) => r.legacyId == null).map((r) => ({ id: r.id, name: r.name, type: r.type, site: facSite(r) }));
  if (L.fc) L.fc = Object.fromEntries(Object.entries(L.fc).map(([k, v]) => [String(facMap.get(+k) ?? k), v]));

  // ---------------- 패션 체크 (순서 유지, site.id = 순서+1)
  const fcs = [...t.fashion_checks].sort((a, b) => a.id - b.id);
  L.checks = L.checks.map((c: any, i: number) => {
    const r = fcs.find((x) => x.id === i + 1);
    return r ? { ...c, site: { id: r.id, critic: r.critic, prize: r.prize, option: r.rewardOption, appear: r.appear, win: r.success, req: reqOf(reqBy.get(`f${r.id}`)) } } : c;
  });
  L.checksExtra = fcs.filter((r) => r.id > L.checks.length).map((r) => ({
    name: r.name, site: { id: r.id, critic: r.critic, prize: r.prize, option: r.rewardOption, appear: r.appear, win: r.success },
  }));

  // ---------------- 배틀 (순서 유지, site.id = 순서+12). value = 품질·매력·능력치(코디 합계)
  const bts = [...t.battles].sort((a, b) => a.id - b.id);
  const btSite = (r: Row) => ({
    id: r.id, name: r.siteName, request: r.request, clothCond: r.clothCond, values: r.values,
    fee: r.fee, appear: r.appear, win: r.win, opponent: r.opponent, opponentOutfit: r.opponentOutfit,
    clothes: t.battle_clothes.filter((x) => x.battleId === r.id).map((x) => ({ id: x.cloId, name: x.cloName, source: x.source, detail: x.detail })),
    sets: t.battle_sets.filter((x) => x.battleId === r.id).sort((a, b) => a.rank - b.rank)
      .map((x) => ({ setId: x.setId, result: x.result, matched: x.matched, unmet: x.unmet })),
  });
  L.battles = L.battles.map((b: any, i: number) => {
    const r = bts.find((x) => x.legacyId === `b${i}`);
    return r ? { ...b, site: btSite(r) } : b;
  });
  L.battlesExtra = bts.filter((r) => !r.legacyId).map((r) => ({ name: r.name, site: btSite(r) }));

  // 제제가 게임에서 확인한 코디 옷 번호(Firestore ref/coord_requests에 아직 반영 전이면 여기 값이 우선)
  // 2026-11-09: 79 매옥준③ 데이트 추운 날 코튼 팬츠 = #144(파랑)
  const COORD_ID_FIX: Record<number, { t?: number[]; b?: number[]; o?: number[]; a?: number[] }> = { 79: { b: [144] } };
  // ---------------- 코디 요청: 옷 번호 연결(77 코튼 팬츠 = #144 반영된 표)
  const cr = new Map<number, Row>(t.coord_requests.map((r) => [r.id, r]));
  L.coord = L.coord.map((c: any) => {
    const r = cr.get(c.id);
    if (!r) return c;
    const fx = COORD_ID_FIX[c.id] || {};
    return { ...c, ids: { t: fx.t ?? r.topIds, b: fx.b ?? r.bottomIds, o: fx.o ?? r.outerIds, a: fx.a ?? r.accIds }, req: reqOf(reqBy.get(`c${c.id}`)) };
  });

  // ---------------- 게임에서 확인할 것: 기존 + 표에만 있는 것
  const vmap = new Map(L.verify.map((v: any) => [v.k, v]));
  L.verify = L.verify.map((v: any) => ({ ...v, ids: (v.ids || []).map(cid) }));
  for (const r of t.verify) if (!vmap.has(r.key) && !["acc"].includes(r.key)) L.verify.push({ k: r.key, t: r.text, ids: r.ids || [], n: r.memo || "" });

  // ---------------- 사이트 표(새 기능용)
  L.sets = t.outfit_sets.map((s) => ({ id: s.setId, genre: s.genre, sub: s.sub, clothes: s.clothes, valid: s.valid }));
  L.contests = t.site_contests.map((r) => ({
    name: txt(r["콘테스트"]) || r.c0, desc: txt(r["설명"]) || r.c1, score: num(txt(r["점수"]) || r.c2),
    prize: num(txt(r["상금"]) || r.c3), option: txt(r["보상 옵션"]) || r.c4, appear: txt(r["등장 조건"]) || r.c5,
  }));
  L.recipes = t.recipes;
  L.ranks = t.site_ranks;
  L.trophies = t.site_trophies;
  L.missions = t.site_missions;
  L.chars = t.characters;
  L.guide = t.guide;
  // 랭크 진행(2026-11-09 제제): 랭크 → 배틀 상대 → 해금 캐릭터 → 그 캐릭터가 좋아하는 장르(괄호 안 세부 장르).
  // 같은 랭크의 새 옷 베이스(옷본)·새 스터디(얻는 재료·옵션)를 묶는다. 출처: KairoHistory 진행·스킬·배틀·캐릭터 표.
  {
    const studyBy = new Map<string, string[]>(t.site_studies.map((r) => [String(r.c0 ?? "").trim(), String(r.c2 ?? "").split(",").map((x) => x.trim()).filter(Boolean)]));
    const btBy = new Map<string, Row>(t.battles.map((b) => [String(b.name ?? "").trim(), b]));
    const chBy = new Map<string, Row>(t.characters.map((c) => [String(c.name ?? "").trim(), c]));
    const pick = (s: string, k: string) => (s.match(new RegExp(`${k}:\\s*([^/]+)`)) || [])[1]?.trim() || "";
    const charOf = (b: Row | undefined) => (String(b?.win ?? "").match(/해금 캐릭터:\s*\/\s*([^/]+)/) || [])[1]?.trim() || "";
    const genreOf = (c: string) => { const l = (chBy.get(c)?.likes || [])[0] || ""; return (String(l).match(/\(([^)]+)\)/) || [])[1]?.trim() || ""; };
    const step = (rank: number | null, battle: string, extra: Record<string, unknown> = {}) => {
      const b = btBy.get(battle), ch = charOf(b);
      return { rank, battle, char: ch, genre: genreOf(ch), appear: b?.appear ?? "", ...extra };
    };
    const ranks = [...t.site_ranks].sort((a, b) => (+a.c0) - (+b.c0));
    const plan: any[] = ranks.filter((r) => pick(String(r.c2 ?? ""), "배틀")).map((r) => {
      const s = String(r.c2 ?? ""), study = pick(s, "새 스터디");
      return step(+r.c0, pick(s, "배틀"), { base: pick(s, "새 옷 베이스"), study, studyItems: studyBy.get(study) || [] });
    });
    // 랭크 밖에서 열리는 장르(챌린지 배틀 조건 등)
    const inPlan = new Set(plan.map((p) => p.battle));
    t.battles.filter((b) => b.kind === "다른 가게 직원" && !inPlan.has(String(b.name).trim())).forEach((b) => plan.push(step(null, String(b.name).trim())));
    L.rankPlan = plan.filter((p) => p.genre);
    // 해금 순서(옷본·재료·옵션 칩 순서용): 만든 옷 개수 기준으로 랭크(새 옷 베이스 → 새 스터디 재료·옵션)와 패션 체크 보상을 섞어 줄 세움.
    // 랭크 1 스터디(접객 매너 강습)는 처음부터. 같은 개수면 랭크가 먼저.
    const made = (s: unknown) => +((String(s ?? "").match(/만든 옷 (?:개수|수)\s*:?\s*(\d+)/) || [])[1] || 0);
    const ev: { n: number; o: number; items: string[] }[] = [];
    const firstStudy = t.site_studies.find((r) => +r.row === 1);
    if (firstStudy) ev.push({ n: 0, o: 0, items: studyBy.get(String(firstStudy.c0).trim()) || [] });
    ranks.forEach((r) => { const s = String(r.c2 ?? ""); ev.push({ n: made(r.c1), o: 0, items: [pick(s, "새 옷 베이스"), ...(studyBy.get(pick(s, "새 스터디")) || [])].filter(Boolean) }); });
    t.fashion_checks.forEach((f) => { const rw = String(f.rewardOption || String(f.reward ?? "").split("&")[0] || "").trim(); if (rw) ev.push({ n: made(f.appear), o: 1, items: [rw] }); });
    L.unlockOrder = ev.sort((a, b) => a.n - b.n || a.o - b.o).flatMap((e) => e.items);
  }

  // ================= 사이트 값으로 맞추기 (제제 결정 2026-11-06) =================
  // 기존 노트 기준값은 일본 위키 번역 스프레드시트에서 왔다. 공략 사이트(한국어판 게임 데이터) 값이 더 정확하므로
  // 이름·표기·조건을 전부 사이트 값으로 바꾼다. 단, 게임 화면에서 확인한 표기 규칙(ref/terms 14개)은 그대로 쓴다.
  // 저장된 진행 데이터는 예전 이름을 키로 쓰는 곳이 있어 alias(예전 → 지금)를 같이 넘긴다(엔진이 읽을 때 바꿈).
  const TERM = new Map<string, string>(t.terms.map((r) => [r.site, r.note]));
  TERM.set("카무플라주 패턴", "카모플라주");
  const term = (v: string) => TERM.get(v) ?? v;
  const unq = (v: unknown) => String(v ?? "").replace(/^['"‘’“”]+|['"‘’“”]+$/g, "").trim();
  const alias: Record<string, Record<string, string>> = { clo: {}, fac: {}, item: {}, recipe: {}, battle: {}, check: {}, person: {} };
  const put = (k: string, a: string, b: string) => { if (a && b && a !== b) alias[k][a] = b; };

  // 옷: 이름·세부 장르·옷본/재료/옵션(옷마다 사이트 레시피)·색·계절·태그
  const rec = new Map<number, Record<string, string>>();   // 노트 id → {p,m,o}
  for (const r of t.recipes) {
    const slot = r.kind === "옷본" ? "p" : r.kind === "재료" ? "m" : "o";
    for (const lid of r.clothes || []) { const x = rec.get(lid) || {}; x[slot] = term(r.name); rec.set(lid, x); }
  }
  for (const c of L.clo) {
    const st = c.site; if (!st) continue;
    put("clo", c.n, st.name); c.n = st.name || c.n;
    if (st.sub) c.c = term(st.sub);
    const rc = rec.get(c.legacyId);
    if (rc) for (const k of ["p", "m", "o"]) if (rc[k] && rc[k] !== c[k]) { if (c[k]) put("recipe", c[k], rc[k]); c[k] = rc[k]; }
    const tags = (st.tags || []).map(term);
    c.tgs = [c.c, ...tags];
    c.tg = c.tgs.join(" · ");
  }

  // 노트 옷본 "기모노" = 사이트 베이스 "전통 의상"(옷 표는 이미 전통 의상) → 저장된 칩 순서·선택을 잇기 위해 연결만
  if (L.clo.some((c: any) => c.p === "전통 의상")) put("recipe", "기모노", "전통 의상");
  // 레시피 목록이 사이트에서 24벌까지만 보여서(+n 잘림) 옷마다 못 맞춘 옷은 같은 이름 바꾸기(띄어쓰기 등)를 그대로 적용
  for (const c of L.clo) for (const k of ["p", "m", "o"]) if (c[k] && alias.recipe[c[k]]) c[k] = alias.recipe[c[k]];

  // 개량 옵션 표: 옵션 이름 사이트 표기, 사이트에만 있는 옵션(특수 옵션 등)은 스타일 보너스로 행 추가
  {
    const staffSub = L.up.staff.map((x: string) => (x.match(/\(([^)]*)\)\s*$/) || [])[1] || "");
    const nk = (v: string) => term(v.trim()).replace(/\s/g, "");
    const rows: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(L.up.rows as Record<string, string[]>)) rows[alias.recipe[k] ?? k] = v;
    for (const r of t.recipes) {
      const name = term(r.name); if (!r.styleBonus || rows[name]) continue;
      const bonus = new Map<string, number>(String(r.styleBonus).split(",").map((x) => { const m = x.trim().match(/^(.*\S)\s+(\d+)$/); return m ? [nk(m[1]), +m[2]] : ["", 0]; }));
      rows[name] = staffSub.map((g: string) => { const v = bonus.get(nk(g)) ?? 0; return v ? `+${v}` : ""; });
    }
    L.up.rows = rows;
  }

  // 게임에서 확인할 것: 사이트 값으로 답이 나온 항목은 뺀다(레시피·계절·색·번호)
  const SITE_OK = new Set(["slit", "slit2", "q3", "opt_none", "bot", "acc", "kairo", "coord79"]);  // coord79: 제제 확인(#144)
  L.verify = L.verify.filter((v: any) => !SITE_OK.has(v.k));

  // 옷의 신규 손님·좋아하는 매장 칸: 사이트 캐릭터·시설 이름(띄어쓰기만 다른 것)으로
  const nsp = (v: string) => v.replace(/\s/g, "");
  const charBy = new Map<string, string>(t.characters.map((r) => [nsp(r.name), r.name]));
  const facBy = new Map<string, string>(t.facilities.map((r) => [nsp(r.name), r.name]));
  const FAC_WORD: Record<string, string> = { "수입차 매장": "수입차 가게" };
  for (const c of L.clo) {
    if (c.g) { const m = c.g.match(/^(.*?)(\s*\(.*\))?$/); const nm = charBy.get(nsp(m[1])); if (nm && nm !== m[1]) { put("person", m[1], nm); c.g = nm + (m[2] || ""); } }
    if (c.ld && c.lt === "신규 매장") c.ld = c.ld.split("/").map((x: string) => { const v = x.trim(); const nv = FAC_WORD[v] ?? alias.fac[v] ?? facBy.get(nsp(v)) ?? v; put("fac", v, nv); return nv; }).join("/");
  }

  // 시설: 이름
  for (const f of L.fac) { if (f.site?.name) { put("fac", f.name, f.site.name); f.name = f.site.name; } }
  const facById = new Map<number, any>(L.fac.map((f: any) => [f.id, f]));
  // 시설 아이템 20종: 사이트 이름(상성 표 순서는 그대로)
  const siteItems = (t.site_items || []).map((r) => String(r.c1 ?? "")).filter(Boolean);
  const ITEM_FIX: Record<string, string> = {};
  for (const it of L.items) { const hit = siteItems.find((x) => x === it) || siteItems.find((x) => x.replace(/\s/g, "").endsWith(it.replace(/\s/g, ""))) || siteItems.find((x) => x.includes(it));
    if (hit && hit !== it) ITEM_FIX[it] = hit; }
  if (ITEM_FIX["봉제인형"] == null && siteItems.includes("인형")) ITEM_FIX["봉제인형"] = "인형";
  if (ITEM_FIX["타블렛"] == null) { const x = siteItems.find((v) => v.includes("태블릿")); if (x) ITEM_FIX["타블렛"] = x; }
  Object.assign(alias.item, ITEM_FIX);
  L.items = L.items.map((x: string) => ITEM_FIX[x] ?? x);

  // 패션 체크: 이름·보상·필요 시설(사이트 번호)·대신 가능·계열 표기(그루메→미식, 어른→성숙)
  const REQ_FIX: [RegExp, string][] = [[/그루메|구루메/g, "미식"], [/어른스러운/g, "성숙한"], [/어른/g, "성숙"]];
  L.checks = L.checks.map((c: any, i: number) => {
    const r = fcs.find((x) => x.id === i + 1); if (!r) return c;
    const name = unq(r.siteName) || c.name; put("check", c.name, name);
    let req = c.req || ""; for (const [a, b] of REQ_FIX) req = req.replace(a, b);
    const main = (r.facIds || []).map((id: number) => facById.get(id)?.name).filter(Boolean);
    const alt = (r.altFacIds || []).map((id: number) => facById.get(id)?.name).filter(Boolean);
    // 보상: 성공 시 문구에서 새 옵션·새 옷 베이스와 돈(상금 칸과 다를 때는 성공 시 문구가 실제 지급액)
    const parts = String(r.success ?? "").split("/").map((x) => x.trim());
    const got = parts.map((x) => x.match(/^새 (?:옵션|옷 베이스):\s*(.+)$/)?.[1]).filter(Boolean).map((x) => term(x as string));
    const money = Number(parts.map((x) => x.match(/^돈:\s*(\d+)/)?.[1]).find(Boolean) ?? r.prize ?? NaN);
    const reward = [...got, Number.isFinite(money) ? `${money.toLocaleString("ko-KR")}G` : ""].filter(Boolean).join(" & ") || c.reward;
    let note = String(c.note || ""); for (const [a, b] of Object.entries(alias.fac)) note = note.split(a).join(b); for (const [a, b] of REQ_FIX) note = note.replace(a, b);
    return { ...c, name, req, reward, b: main.length ? main : c.b.map((x: string) => alias.fac[x] ?? x), altB: alt, note };
  });
  L.checksExtra = (L.checksExtra || []).map((c: any) => ({ ...c, name: unq(c.name) }));

  // 배틀: 이름(사이트), 의류 조건(사이트 clothCond → 노트 조건 단어), 예시 옷 이름
  const COND_KEY: Record<string, string> = { "스타일": "style", "베이스": "base", "태그": "tag", "계절": "season", "분류": "kind", "옵션": "option" };
  const condOf = (cc: unknown) => String(cc ?? "").split(";").map((x) => x.trim()).filter(Boolean).flatMap((x) => {
    const [k, ...v] = x.split(":"); const key = COND_KEY[k.trim()]; const val = v.join(":").trim();
    if (!key || !val) return [];
    if (key === "season") return [val.replace("봄&가을", "봄·가을")];
    return [term(val)];
  });
  L.battles = L.battles.map((b: any) => {
    if (!b.site) return b;
    const name = b.site.name || b.name; put("battle", b.name, name);
    const cond = condOf(b.site.clothCond);
    return { ...b, name, legacyCond: b.cond, stat: b.stat === "손재주" ? "솜씨" : b.stat, cond: cond.length ? cond.join("/") : (b.site.clothCond ? "-" : b.cond),
      reward: term(b.reward || ""), ex: (b.ex || []).map((x: string) => alias.clo[x] ?? x) };
  });

  // 코디 요청: 표의 요청 문구(제제 수정 반영), 옷 이름은 옷 번호로 다시 씀
  const nameOf = (id: number) => L.clo.find((c: any) => c.id === id)?.n;
  L.coord = L.coord.map((c: any) => {
    const r = cr.get(c.id); if (!r) return c;
    const part = (ids: number[] | undefined, old: string) => { const n = (ids || []).map(nameOf).filter(Boolean); return n.length ? n.join("/") : (old ? old.split("/").map((x) => alias.clo[x.trim()] ?? x.trim()).join("/") : old); };
    return { ...c, r: r.request || c.r, t: part(r.topIds, c.t), b: part(r.bottomIds, c.b), o: part(r.outerIds, c.o), a: part(r.accIds, c.a) };
  });
  L.verify = L.verify.map((v: any) => { let tx = String(v.t || ""); for (const [a, b] of Object.entries(alias.recipe)) tx = tx.split(a).join(b); return { ...v, t: tx }; });

  // 자료 보기용 사이트 표(열 이름 그대로)
  const REF = [
    ["site_exams", "자격시험"], ["site_studies", "스터디"], ["site_skills", "스킬"], ["site_investments", "투자"],
    ["site_sales_trips", "출장 판매"], ["site_celebrities", "유명인"], ["site_uniforms", "유니폼"], ["site_items", "아이템"],
    ["site_fever", "좋아요 피버"], ["site_grades", "옷 등급"], ["site_formulas", "가격·품질 식"], ["site_clear_points", "클리어 포인트"],
    ["site_carryover_choices", "이어받기"], ["site_comment_replies", "댓글 답하기"], ["site_activities", "활동"], ["site_goods", "상품"],
  ] as const;
  L.refTables = REF.map(([k, label]) => ({ key: k, label, rows: ((t as any)[k] || []).slice().sort((a: Row, b: Row) => (a.row ?? 0) - (b.row ?? 0)) }));
  L.alias = alias;
  // 자료 표 열 이름(ref 표의 columns, 2026-11-06 기준)
  L.refCols = REF_COLS;
  L.terms = Object.fromEntries(TERM);
  L.idMap = { clo: Object.fromEntries(cloMap), fac: Object.fromEntries(facMap) };
  return L;
}
