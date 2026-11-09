/** 정보량이 많은 상세를 검토하기 위한 예시. preview 빌드에서만 사용한다.
 * 사이트 기준 데이터나 사용자 진행 데이터가 아니며 운영 빌드에는 포함하지 않는다. */
export function addPreviewDetails(data: any) {
  const target = data.clo.find((c: any) => c.id === 143);
  const tops = data.clo.filter((c: any) => c.p === "컷앤소").slice(0, 9);
  target.site = {
    preview: true, q: 34, pop: 20, price: 1560, stock: 27, tier: 1,
    kind: "하의", genre: "레트로", sub: "US레트로", cust: "성실",
    styles: { "US레트로": 6, "80년대레트로": 3, "캐주얼": 1 },
    sets: [124], goodIds: tops.slice(0, 6).map((c: any) => c.id),
    badIds: tops.slice(6).map((c: any) => c.id),
  };
  const first = data.clo.find((c: any) => c.id === 6);
  first.site = {
    preview: true, q: 24, pop: 18, price: 1200, stock: 20, tier: 1,
    kind: "상의", genre: "내추럴", sub: "캐주얼", sets: [125],
    styles: { "캐주얼": 5, "스트리트": 2 }, goodIds: [143], badIds: [],
  };
  data.sets = [
    { id: 124, genre: "레트로", sub: "US레트로", valid: true, clothes: [143, 6, 18] },
    { id: 125, genre: "내추럴", sub: "캐주얼", valid: true, clothes: [6, 18] },
  ];
  data.fac[0].site = { preview: true, w: 2, h: 2, cost: 1200, upkeep: 80, charm: 12, pop: 8, fame: 3, group: "서비스 시설", category: "매장", effect: "손님이 쉬어 갈 수 있는 편의시설입니다." };
  data.battles[0].site = {
    preview: true, id: 12, request: "단정한 카디건을 활용한 코디로 도전합니다.",
    clothCond: "캐주얼;카디건;단정한", values: [4230, 3800, 120],
    fee: 3000, win: "게리코튼", appear: "조건 달성 시",
    clothes: [{ id: 143, source: "예시" }, { id: 6, source: "예시" }],
    sets: [{ setId: 124, result: "추천 예시" }],
  };
  data.checks[0].site = { preview: true, critic: "평론가", prize: 10000, option: "프린트", appear: "대상 시설 건설 후" };
  data.refTables = [
    { key: "site_exams", label: "자격시험 · 예시", rows: [
      { c0: "11", c1: "레트로", c2: "1200", c3: "체크", c4: "화면 검토용 예시 보상" },
      { c0: "12", c1: "하드", c2: "1500", c3: "체크", c4: "화면 검토용 예시 보상" },
    ] },
    { key: "site_studies", label: "스터디 · 예시", rows: [
      { c0: "계산 빨리 하기", c1: "수행", c2: "체크", c3: "1000 G" },
    ] },
  ];
  return data;
}
