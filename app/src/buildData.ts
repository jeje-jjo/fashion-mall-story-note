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
  "site_trophies", "site_missions", "characters", "guide",
] as const;
export type Tables = Record<(typeof TABLES)[number], Row[]>;

const num = (s: unknown) => {
  const n = Number(String(s ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && String(s ?? "").match(/\d/) ? n : null;
};
const txt = (v: any) => (v && typeof v === "object" && "text" in v ? v.text : v ?? "");

export function buildData(t: Tables) {
  const L: any = structuredClone(legacy);

  // ---------------- 옷
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
      },
    };
  });
  const cid = (id: number) => cloMap.get(id) ?? id;

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
    return r ? { ...c, site: { id: r.id, critic: r.critic, prize: r.prize, option: r.rewardOption, appear: r.appear, win: r.success } } : c;
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

  // ---------------- 코디 요청: 옷 번호 연결(77 코튼 팬츠 = #144 반영된 표)
  const cr = new Map<number, Row>(t.coord_requests.map((r) => [r.id, r]));
  L.coord = L.coord.map((c: any) => {
    const r = cr.get(c.id);
    return r ? { ...c, ids: { t: r.topIds, b: r.bottomIds, o: r.outerIds, a: r.accIds } } : c;
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
  L.idMap = { clo: Object.fromEntries(cloMap), fac: Object.fromEntries(facMap) };
  return L;
}
