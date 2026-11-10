import { appearancePicker, validSkin } from "./ui/appearance.ts";
import { metricStrip, factRows, infoSection, textList, usageRow, referenceBlock, installReferenceState } from "./ui/information.js";
installReferenceState();
/* 패션몰스토리 노트 화면 엔진 — legacy/app/post.html에서 옮겨 옴(2026-11-06). 이제 이 파일이 원본이다. */
const DATA = window.__FMS_DATA__;

/* 저장소 구조 (2026-10-28 이전)
   runs/{회차}/fac/f{id}  {done, put}            회차별 시설 진행
   runs/{회차}/clo/c{id}  {done, opt}            회차별 옷 진행 (추가옵션·특수 옵션 체크 통합)
   runs/{회차}/misc/coord {list}                 회차별 코디 최종 완료 손님
   names/all              {fac, clo, people}     번역·수정 이름 (회차 무관)
   checks/k{oi}           {name, main, alt}      패션 체크 이름·대상 시설 수정
   clofix / coordfix / cbattle                   옷 기본정보 수정 · 코디 요청 수정 · 전투 추천
   contest / chkscore / cyear / log / ui         기록 (그대로)
   예전 r2*, r3* 컬렉션은 보관용으로 남겨 둠 */
const R = "r3";
/* 회차 진행 저장 위치. meta/round {n, run}에 적힌 run을 씀(없으면 runs/r3). 새 회차 시작 = 새 run 경로 */
let RUN = `runs/${R}`;
/* 화면에 보이는 회차 번호. 저장소 경로(R)와 별개로 meta/round {n}에 저장, "새 회차 시작" 때 1 올림 */
const roundNo = () => S.roundNo || +R.replace(/^r/, "");
const roundLabel = () => roundNo() + "회차";
const ITEMS = DATA.items;
/* 예전 이름 → 사이트 이름(buildData의 DATA.alias). 저장된 진행 데이터가 예전 이름을 키로 쓰는 곳은 읽을 때 바꾼다 */
const AL = DATA.alias || {};
const al = (k, v) => (v != null && AL[k] && AL[k][v]) || v;
const alArr = (k, a) => Array.isArray(a) ? [...new Set(a.map(v => al(k, v)))] : a;
const alSlash = (k, v) => v ? String(v).split("/").map(x => { const t = x.trim(), m = t.match(/^(.*?)(\s*외)$/); return m ? al(k, m[1]) + m[2] : al(k, t); }).join("/") : v;
/* 색 체계: 장르(옷 14·시설 7)는 연한 채움, 상태·추가옵션 태그는 테두리형 */
const CAT_COLOR = {"캐주얼":"#0369A1","스트리트":"#1E3A8A","파스텔":"#F472B6","엘리건트":"#A21CAF","US레트로":"#F97316","록":"#B91C1C","코스프레":"#D946EF","포크로어":"#92400E","모드":"#4338CA","팝":"#CA8A04","고저스":"#BE185D","80년대레트로":"#65A30D","오리지널리티":"#15803D","사이버":"#14B8A6"};
const SEM_COLOR = {guest:"#2563EB", shop:"#059669", item:"#D97706", battle:"#DC2626", sp:"#7C3AED", fc:"#EA580C", done:"#0D9488", part:"#4F46E5", fix:"#0891B2", wrong:"#E11D48", req:"#DB2777", set:"#0F766E", mq:"#A16207"};
const semTag = (k, label) => `<span class="tag sem" style="--c:${SEM_COLOR[k]}">${label}</span>`;
const typeTag = t => `<span class="tag cat" style="--c:${TYPE_COLOR[t]||"#6B7280"}">${esc(t)}</span>`;
const catTag = k => `<span class="tag cat" style="--c:${CAT_COLOR[k]||"#6B7280"}">${esc(k)}</span>`;
const TYPE_COLOR = {"내추럴":"#D97706","쿨":"#3B82F6","큐트":"#EC4899","성숙":"#8B5CF6","레트로":"#EA580C","하드":"#475569","서브컬쳐":"#0891B2"};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ICON = {
  tool:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M14.5 5.5a4 4 0 00-5.2 5.2L4 16l4 4 5.3-5.3a4 4 0 005.2-5.2l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/></svg>',
  upg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18V6M6.5 11.5L12 6l5.5 5.5M5 20.5h14"/></svg>',
  warn:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5L2.8 19.5h18.4L12 3.5z"/><path d="M12 10v4.2"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>`,
  carry:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0113.7-5.6L20 8.7M20 4v4.7h-4.7M20 12a8 8 0 01-13.7 5.6L4 15.3M4 20v-4.7h4.7"/></svg>`,
  dots:`<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`,
  pen:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  tagic:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>`,
  sword:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 17.5 3 3 3-3-3-3"/><path d="M3 3l11 11"/><path d="m13 19 6-6"/><path d="M5 21l-2-2 4-4"/></svg>`,
  spark:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>`,
  star:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z"/></svg>`,
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  chev:'<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  fac:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 10l1.4-5h13.2L20 10M4 10v9h16v-9M4 10h16M9.5 19v-5h5v5"/></svg>',
  clo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9 4l3 2 3-2 5 3-2 4-2-1v10H8V10l-2 1-2-4 5-3z"/></svg>',
  coord:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z"/></svg>',
  log:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="8.5"/></svg>',
  up:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 19V6M6.5 11.5L12 6l5.5 5.5"/></svg>',
  note:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>',
  x:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M8 4h8v5a4 4 0 01-8 0V4zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8.5 20h7M10 17h4v3h-4z"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M4 10.5L12 4l8 6.5V20h-5.5v-6h-5v6H4z"/></svg>',
  search:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
  ok:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
};

Object.assign(ICON, window.__FMS_ICONS__ || {});

/* ---------- state ---------- */
const S = {
  tab:"clo", recSub:"contest", homeQ:"", homeOpen:"", homeCt:false, facType:"전체", facSt:"전체", facSort:"기본순", facQ:"", facOpen:null,
  people:{}, contests:[], itemPick:"", itemAlt:"", resetAsk:false, sheet:null, cp:{}, ih:{}, memo:null, memoEdit:false, battleRec:{}, btDraft:{}, btListAll:false, cloBt:null, cloBtView:false, btOpen:true, btNote:false, fcMode:"single", fcNoteOpen:false, fcDraft:{}, coordFixOpen:{}, upHl:null, facFcSel:[], facFcOpen:false, cEdit:null, cScore:"", cRes:"실패", cMsg:"", cMsgErr:false, cReset:false,
  rnKind:"시설", rnOld:"", rnNew:"", rnErr:"",
  cloCat:[], cloPat:[], cloMat:[], cloOpt:[], cloSlot:{}, cloExp:{}, cloMulti:false, cloRowMulti:{}, cloSt:"추가옵션", cloQ:"", cloOpen:null, cloSp:false, names:{fac:{}, clo:{}, people:{}}, optDraft:{}, chkname:{}, chkscore:{}, scErr:"", scErr2:"", cbattle:{}, cyears:[], cyPick:{}, cyErr:"", cyAsk:null, cyEdit:null, coordDone:[], slotOpen:null, upMulti:false, upStaffs:[], cfxPart:{}, clofix:{}, cloField:{}, fcEdit:{}, facExp:{genre:true}, cloEdit:{}, optKind:{}, cfix:{}, cfxPick:{}, cfxKind:{},
  coordQ:"", coordOpen:[], coordSub:"req", setF:"전체", setG:"전체", setQ:"", setOpen:null, own:{pat:[],mat:[],opt:[]}, nmOpen:false, nmEdit:false, nmAll:false, logAll:false, confirmSync:false,
  fac:{}, clo:{}, logs:[], live:false
};
try{ const m = JSON.parse(localStorage.getItem("fms-ui")||"{}"); Object.assign(S, m); }catch(e){}
/* 의류 보기: cloKind = 겹쳐 고르는 [추가옵션, 전투 추천], cloSt = 전체|미완료|완료 */
if (!Array.isArray(S.cloKind)) S.cloKind = [];
if (S.cloSt==="추가옵션"){ S.cloKind = ["추가옵션"]; S.cloSt = "전체"; }
else if (S.cloSt==="전투 추천"){ S.cloKind = ["전투 추천"]; S.cloSt = "전체"; }
else if (S.cloSt==="전체 옷" || !["전체","미완료","완료"].includes(S.cloSt)) S.cloSt = "전체";
/* ★ 특수 탭은 없앰(옵션 줄 "★ 특수 전체"로 대신) */
S.cloSp = false;
/* 특수 옵션 이름 변경: 호피 → 레오파드 */
["cloPat","cloMat","cloOpt"].forEach(k => { if (Array.isArray(S[k])) S[k] = alArr("recipe", S[k]); });
if (S.itemPick) S.itemPick = al("item", S.itemPick);
if (Array.isArray(S.cloOpt)){ const RN = {"호피":"레오파드","와펜":"자수 패치","고블랭직":"고블랭"}; S.cloOpt = S.cloOpt.map(x => RN[x] || x); }
/* 메인 클리어 포인트·회차 연계는 항상 접힌 상태로 시작 */
S.homeCp = false; S.homeIh = false; S.cpCapOpen = false; S.ihStaffOpen = false;
const facSts = () => Array.isArray(S.facSt) ? S.facSt : (S.facSt && S.facSt!=="전체" ? [S.facSt] : []);
/* 의류 선택 자동 저장(제제 2026-11-09): 장르·옷본·재료·옵션 선택이 바뀌면 ui/slots의 slot.all에 바로 저장, 다른 기기 변경은 바로 반영.
   selSig = 마지막으로 저장/반영한 선택. 서버 첫 응답 전(null)에는 저장하지 않음 */
let selSig = null, selTimer = null, selPending = false;
const curSel = () => ({cat:[...S.cloCat], pat:[...S.cloPat], mat:[...S.cloMat], opt:[...S.cloOpt]});
function autoSaveSel(){
  if (!db || selSig === null) return;
  const sig = JSON.stringify(curSel()); if (sig === selSig) return;
  selSig = sig; selPending = true; clearTimeout(selTimer);
  selTimer = setTimeout(() => { const all = curSel(); S.cloSlot = {...S.cloSlot, all, ...all};
    writeSerial("ui/slots", {slot:S.cloSlot}).catch(() => showNotice("선택을 저장하지 못했어요. 도구 > 화면에서 수동 저장해 주세요.")).finally(() => { selPending = false; }); }, 400);
}
const remember = () => { autoSaveSel(); try{ localStorage.setItem("fms-ui", JSON.stringify({tab:S.tab,facType:S.facType,facSt:S.facSt,facSort:S.facSort,facFcSel:S.facFcSel,facFcOpen:S.facFcOpen,coordHideDone:S.coordHideDone,cloBt:S.cloBt,cloBtView:S.cloBtView,btOpen:S.btOpen,facExpPin:S.facExpPin,...(S.facExpPin?{facExp:S.facExp,facFcOpen:S.facFcOpen}:{}),itemAlt:S.itemAlt,fcMode:S.fcMode,upMode:S.upMode,upStaff:S.upStaff,upOpt:S.upOpt,upMulti:S.upMulti,upStaffs:S.upStaffs,itemPick:S.itemPick,cloCat:S.cloCat,cloPat:S.cloPat,cloMat:S.cloMat,cloOpt:S.cloOpt,cloSlot:S.cloSlot,cloExp:S.cloExp,cloExpInit:S.cloExpInit,cloMulti:S.cloMulti,cloRowMulti:S.cloRowMulti,cloSt:S.cloSt,cloKind:S.cloKind,cntMode:S.cntMode,recSub:S.recSub,coordSub:S.coordSub,setF:S.setF,setG:S.setG})); }catch(e){} };
if (S.facType!=="전체" && S.facType!=="우선개량" && !(S.facType in TYPE_COLOR)) S.facType = "전체";
if (!Array.isArray(S.cloCat)) S.cloCat = S.cloCat && S.cloCat!=="전체" ? [S.cloCat] : [];
if (!Array.isArray(S.cloPat)) S.cloPat = S.cloPat && S.cloPat!=="전체" ? [S.cloPat] : [];
S.cloCat = S.cloCat.map(k => k==="포클로어" ? "포크로어" : k).filter(k => DATA.clo.some(c => c.c===k));
if (!Array.isArray(S.upStaffs)) S.upStaffs = [];
/* 2026-11-06 제제 결정: 의류 칩 줄은 모두 다중 선택이 기본(한 번만 켬, 이후엔 고른 대로) */
try{ if (localStorage.getItem("fms-v2-multi") !== "1"){ S.cloMulti = true; localStorage.setItem("fms-v2-multi", "1"); } }catch(e){}
/* 의류 필터는 열 때마다 전부 접힌 상태로 시작(선택은 유지) */
S.cloExp = {}; S.btOpen = false;
if (S.facSort==="타입순") S.facSort = "장르순";
if (S.facSort==="필요 적은순") S.facSort = "좋음 적은순";
const tabFromHash = location.hash.replace("#","");
const OLD_TAB = {contest:"contest", info:"contest", log:"log"};
if (S.recSub==="info" || S.recSub==="battle") S.recSub = "contest";
/* 2026-11-06 개편: 메인·기록 탭을 없애고 도구 탭으로. 예전 주소·저장값은 새 탭으로 넘김 */
const TAB_MAP = {home:"clo", rec:"tool"};
const TAB_KEYS = ["clo","fac","coord","tool"];
if (OLD_TAB[S.tab]){ S.recSub = OLD_TAB[S.tab]; S.tab = "tool"; }
if (TAB_MAP[S.tab]) S.tab = TAB_MAP[S.tab];
if (TAB_KEYS.includes(tabFromHash)) S.tab = tabFromHash;
else if (TAB_MAP[tabFromHash]) S.tab = TAB_MAP[tabFromHash];
else if (OLD_TAB[tabFromHash]){ S.tab = "tool"; S.recSub = OLD_TAB[tabFromHash]; }
if (!TAB_KEYS.includes(S.tab)) S.tab = "clo";

/* 인물: 코디 요청 이름에서 ①②③④ 번호를 떼어 기본 이름으로 묶음. people = {원래 기본이름: 현재 이름} */
const NUM_RE = /\s*[①②③④⑤⑥⑦⑧⑨⑩]+\s*$/;
DATA.coord.forEach(c => { const m = c.p.match(NUM_RE); c.pb = c.p.replace(NUM_RE, "").trim(); c.ps = m ? m[0].trim() : ""; });
const BASE_PEOPLE = [...new Set(DATA.coord.map(c => c.pb))];
const curPerson = base => S.people[base] ?? base;
const peopleNow = () => [...new Set(BASE_PEOPLE.map(curPerson))];
const coordName = c => curPerson(c.pb) + (c.ps ? c.ps : "");
const withNames = text => { let t = text || ""; for (const [b, n] of Object.entries(S.people)) if (b !== n) t = t.split(b).join(n); return t; };
const facName = f => S.names.fac[f.id] ?? f.name;
const facDone = f => S.fac[f.id]?.done ?? f.done;
/* 40P 우선개량 체크(새 노트): 태그 옆 작은 체크. 회차별 runs/rN/fac/f{id}.p40 */
const p40Done = f => !!S.fac[f.id]?.p40;
const p40Tag = f => `<span class="tag p40${p40Done(f)?" on":""}" title="40P로 포인트 2 업그레이드">40P<span class="p40ck" role="checkbox" tabindex="0" aria-checked="${p40Done(f)}" aria-label="${esc(facName(f))} 40P 업그레이드 했음" data-p40ck="${f.id}">${p40Done(f)?"✓":""}</span></span>`;
function toggleP40(id){ const f = DATA.fac.find(x => x.id===id); if (!f) return; const on = !p40Done(f);
  persist("fac", id, {p40: on}); toast(on?"40P 업그레이드 체크":"40P 체크 해제"); }
const SP_OPTS = ["카모플라주","폼폼","자수","레오파드","보타이","스터드","고블랭","게리코튼","하네스","자수 패치","크로스","나사와 볼트","찐빵"];
const isSp = c => SP_OPTS.includes(c.o);
/* 체크 대상: 추가옵션이 있는 옷(시트 반영) + 특수 옵션 옷(노트 전용). 예전 특수옵션 체크(sp)는 읽기만 하고 clo로 합쳐 씀 */
const isOptKind = c => c.done !== null || isSp(c);
const isBtKind = c => battleOf(c) >= 0;
/* 코디 추천: 코디 요청(수정 반영)에 들어 있는 옷. "A/B", "A 외" 같은 표기는 나눠서 비교 */
let _coSet = null, _coKey = "";
/* 이름이 같은 옷(예: 코튼 팬츠 #136 갈색·#144 파랑)이 있어서, 직접 고치지 않은 칸은 표의 옷 번호(c.ids)로 비교하고
   번호가 없거나 직접 고친 칸만 이름으로 비교(2026-11-09) */
const coordPartIds = (c, k) => (!S.cfix[c.id]?.["p"+k] && c.ids?.[k]?.length) ? c.ids[k] : null;
const coordPartNames = (c, k) => String(cPart(c, k) || "").split("/").map(v => v.replace(/\s*외$/,"").trim()).filter(Boolean);
const coordHasClo = (r, c) => { const names = [c.n, cloName(c)];
  return ["t","b","o","a"].some(k => { const ids = coordPartIds(r, k); return ids ? ids.includes(c.id) : coordPartNames(r, k).some(v => names.includes(v)); }); };
const coordCloSet = () => {
  const key = JSON.stringify(S.cfix) + JSON.stringify(S.names.clo);
  if (_coSet && _coKey === key) return _coSet;
  const set = new Set(), ids = new Set();
  DATA.coord.forEach(c => ["t","b","o","a"].forEach(k => { const pi = coordPartIds(c, k); if (pi) pi.forEach(x => ids.add(x)); else coordPartNames(c, k).forEach(v => set.add(v)); }));
  set.ids = ids; _coSet = set; _coKey = key; return set;
};
const isCoKind = c => { const st = coordCloSet(); return st.ids.has(c.id) || st.has(c.n) || st.has(cloName(c)); };
/* 실제 전투 슬롯에 등록된 옷인지 */
const btWorn = c => { const nm = [c.n, cloName(c)]; return Object.values(S.battleRec || {}).some(r => Object.values(r.slots || {}).some(v => v && nm.includes(v.n))); };
/* 체크 대상: 추가옵션·특수 옵션 옷 + 전투 추천 옷 */
const tracked = c => isOptKind(c) || isBtKind(c) || isCoKind(c);
const cloDone = c => S.clo[c.id]?.done ?? c.done ?? false;
const needOf = f => ITEMS.filter((_,i) => f.m[i] === "◎");
const badOf = f => ITEMS.filter((_,i) => f.m[i] === "×");
const putOf = f => S.fac[f.id]?.put || [];
/* 화면 표시용: 완료된 시설은 상성 좋음 항목을 전부 넣은 것으로 보여줌 */
const putShown = f => facDone(f) ? [...new Set([...putOf(f), ...needOf(f)])] : putOf(f);
const facPartial = f => !facDone(f) && putOf(f).some(i => needOf(f).includes(i));
const goodOf = f => ITEMS.filter((_,i) => f.m[i] === "◯");

/* ---------- db ---------- */
let db = null;
/* 클릭 기록 상태(아래 "클릭 기록" 참고). 시작할 때 도구 > 화면을 바로 그릴 수 있어서 맨 위에 둠 */
const CLK_KEY = "fms-clicklog-off";
const clkOff = () => { try{ return localStorage.getItem(CLK_KEY) === "1"; }catch(e){ return false; } };
const CLK = { sid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), seq: 0, buf: [], sent: 0 };
const queue = {};
function writeSerial(path, data){
  const prev = queue[path] || Promise.resolve();
  const p = prev.catch(()=>{}).then(() => db.doc(path).set(data));
  queue[path] = p; return p;
}
async function persist(kind, id, patch, logEntry){
  const store = kind === "fac" ? S.fac : S.clo;
  store[id] = {...(store[id]||{}), ...patch};
  render();
  if (!db) return;
  try{
    await writeSerial(`${RUN}/${kind}/${kind[0]}${id}`, store[id]);
    if (logEntry) await db.collection("log").add({...logEntry, t:Date.now(), synced: logEntry.synced ?? false, by:"app"});
  }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
function saveCoordOpen(){ if (db) writeSerial("ui/coordopen", {list:S.coordOpen, hide:!!S.coordHideDone, t:Date.now()}).catch(()=>{}); }
function showNotice(msg){ const n=$("#notice"); n.textContent=msg; n.hidden=!msg; }

(async () => {
  const cl = window.claude;
  db = cl && cl.use ? await cl.use("db") : null;
  if (!db){
    setSync(false, "이 화면에서는 저장 안 됨");
    showNotice("저장소에 연결하지 못했어요. 로그인 상태를 확인하고 새로 고쳐 주세요.");
    return;
  }
  setSync(true, "저장됨");
  const fail = () => setSync(false, "연결 끊김");
  /* 회차 정보를 먼저 받고(첫 응답) 그 run 경로로 나머지를 구독. 이후 다른 기기에서 run이 바뀌면 새로고침 */
  let runReady = false;
  await new Promise(res => { let first = true; const fin = () => { if (first){ first = false; res(); } };
    db.doc("meta/round").onSnapshot(s => { const md = s.exists ? s.data() : null;
      if (first){ if (md?.run) RUN = md.run; if (md?.n) S.roundNo = +md.n; runReady = true; fin(); render(); return; }
      if (runReady && md?.run && md.run !== RUN){ location.reload(); return; }
      if (md?.n){ S.roundNo = +md.n; render(); } }, () => fin());
    setTimeout(fin, 5000); });
  db.collection(`${RUN}/fac`).onSnapshot(s => { S.fac = Object.fromEntries(s.docs.map(d => { const v = {...d.data()}; if (v.put) v.put = alArr("item", v.put); return [+d.id.slice(1), v]; })); render(); }, fail);
  db.collection(`${RUN}/clo`).onSnapshot(s => { S.clo = Object.fromEntries(s.docs.map(d => { const v = {...d.data()};
    if (v.opt){ const o = {...v.opt}; if (o.guest) o.guest = o.guest.replace(/^(.*?)(\s*\(.*\))?$/, (m, a, b) => al("person", a) + (b || "")); if (o.likeDetail) o.likeDetail = alSlash("fac", o.likeDetail); v.opt = o; }
    return [+d.id.slice(1), v]; })); render(); }, fail);
  /* 선택 저장 칸: 기기 간 공유 (예전엔 브라우저에만 저장했으므로, 서버가 비어 있으면 이 기기 것을 올림) */
  let slotFirst = true;
  db.doc("ui/slots").onSnapshot(s => {
    const remote = s.exists ? (s.data().slot || {}) : null;
    if (slotFirst && !remote && Object.keys(S.cloSlot||{}).length){ writeSerial("ui/slots", {slot:S.cloSlot}).catch(()=>{}); }
    else if (remote) { S.cloSlot = slotAlias(remote);
      const a = S.cloSlot.all;
      if (a && typeof a === "object" && !selPending){ const sig = JSON.stringify({cat:a.cat||[], pat:a.pat||[], mat:a.mat||[], opt:a.opt||[]});
        if (sig !== JSON.stringify(curSel())){ Object.entries(ROWF).forEach(([k,f]) => { S[f] = [...(a[k]||[])]; if (S[f].length > 1 && !S.cloMulti) S.cloRowMulti = {...S.cloRowMulti, [k]:true}; }); }
        selSig = sig; }
      render(); }
    if (selSig === null) selSig = JSON.stringify(curSel());
    slotFirst = false;
  }, fail);
  db.collection("battles").onSnapshot(s => { S.battleRec = Object.fromEntries(s.docs.map(d => { const v = {...d.data()}; const k = d.id.slice(1), i = /^\d+$/.test(k) ? +k : k;
    /* 예전 조건(스프레드시트 표기)을 그대로 저장한 것은 버리고 사이트 조건을 씀 */
    if (v.cond && DATA.battles[i] && v.cond === DATA.battles[i].legacyCond) delete v.cond;
    if (v.slots) v.slots = Object.fromEntries(Object.entries(v.slots).map(([k, x]) => [k, x && x.n ? {...x, n: al("clo", x.n)} : x]));
    const wear = t => t && t.wear ? {...t, wear: t.wear.map(w => ({...w, n: al("clo", w.n)}))} : t;
    if (v.tries) v.tries = v.tries.map(wear); if (v.prev) v.prev = v.prev.map(wear);
    return [i, v]; })); render(); }, fail);
  db.collection("cbattle").onSnapshot(s => { S.cbattle = Object.fromEntries(s.docs.map(d => { const v = {...d.data()}; if (v.name) v.name = al("battle", v.name); return [+d.id.slice(1), v]; })); render(); }, fail);
  db.collection("cyear").onSnapshot(s => { S.cyears = s.docs.map(d => ({_id:d.id, ...d.data()})); render(); }, fail);
  [1,2,3,4,5].forEach(n => db.doc(`layslots/s${n}`).onSnapshot(s => { S.laySlots = {...(S.laySlots||{}), [n]: s.exists ? s.data() : null}; render(); }, () => {}));
  db.doc("ui/coordopen").onSnapshot(s => { if (!s.exists) return; const v = s.data(); S.coordOpen = v.list || []; S.coordHideDone = !!v.hide; render(); }, () => {});
  db.doc("ui/layout").onSnapshot(s => { S.layout = {rects: (s.exists && s.data().rects) || []}; render(); }, () => {});
  /* 칩 순서는 해금 순서로 고정(순서 수정 기능을 뺐으므로 ui/chiporder는 읽지 않음, 문서는 그대로 둠) */
  db.doc("ui/optcnt").onSnapshot(s => { const dd = (s.exists && s.data()) || {}, c = dd.counts || {}; S.optCnt = Object.fromEntries(Object.entries(c).map(([k, v]) => [al("recipe", k), v])); S.optPicks = (dd.picks || []).filter(id => CLO_BY_ID.has(id)); render(); }, () => {});
  db.doc("meta/verify").onSnapshot(s => { S.verifyDone = (s.exists && s.data().done) || {}; render(); }, () => {});
  db.doc(`${RUN}/ui/recipes`).onSnapshot(s => { const d = (s.exists && s.data()) || {}; S.own = {pat:alArr("recipe", d.pat||[]), mat:alArr("recipe", d.mat||[]), opt:alArr("recipe", d.opt||[])}; render(); }, () => {});
  db.collection(`${RUN}/mannequins`).onSnapshot(s => { S.mq = Object.fromEntries(s.docs.map(d => [+d.id.slice(1), d.data()])); render(); }, () => {});
  db.doc(`${RUN}/ui/goals`).onSnapshot(s => { S.goals = (s.exists && s.data()) || null; render(); }, () => {});
  db.doc(`${RUN}/ui/now`).onSnapshot(s => { S.now = (s.exists && s.data()) || null; render(); }, () => {});
  db.doc(`${RUN}/ui/mqcfg`).onSnapshot(s => { S.mqCfg = (s.exists && s.data()) || null; render(); }, () => {});
  db.doc(`${RUN}/misc/coord`).onSnapshot(s => { S.coordDone = (s.exists && s.data().list) || []; render(); }, fail);
  db.collection("coordfix").onSnapshot(s => { S.cfix = Object.fromEntries(s.docs.map(d => { const v = {...d.data()}; ["pt","pb","po","pa"].forEach(k => { if (v[k]) v[k] = alSlash("clo", v[k]); }); return [+d.id.slice(1), v]; })); render(); }, fail);
  db.collection("chkscore").onSnapshot(s => { S.chkscore = Object.fromEntries(s.docs.map(d => [+d.id.slice(1), d.data()])); render(); }, fail);
  db.collection("checks").onSnapshot(s => { S.chkname = Object.fromEntries(s.docs.map(d => [+d.id.slice(1), d.data()])); render(); }, fail);
  db.collection("clofix").onSnapshot(s => { S.clofix = Object.fromEntries(s.docs.map(d => { const v = {...d.data()}; ["p","m","o"].forEach(k => { if (v[k]) v[k] = al("recipe", v[k]); }); return [+d.id.slice(1), v]; })); applyCloFix(); render(); }, fail);
  db.collection("log").orderBy("t","desc").limit(500).onSnapshot(s => { S.logs = s.docs.map(d => ({_id:d.id, ...d.data()})); render(); }, fail);
  db.doc("names/all").onSnapshot(s => { const d = (s.exists && s.data()) || {}; S.names = {fac:{}, clo:{}, people:{}, ...d}; S.people = S.names.people; render(); }, fail);
  db.collection("contest").onSnapshot(s => { S.contests = s.docs.map(d => ({_id:d.id, ...d.data()})); render(); }, fail);
  db.doc("calc/clear").onSnapshot(s => { if (document.activeElement?.id?.startsWith("cp-")) return; S.cp = (s.exists && s.data()) || {}; render(); }, fail);
  db.doc("memo/reset").onSnapshot(s => { S.memo = (s.exists && s.data()) || null; render(); }, fail);
  db.doc("calc/carry").onSnapshot(s => { if (document.activeElement?.id?.startsWith("ih-")) return; S.ih = (s.exists && s.data()) || {}; render(); }, fail);
})();

async function saveNames(patch){ S.names = {...S.names, ...patch}; S.people = S.names.people; render(); if (db) await writeSerial("names/all", S.names); }
async function renamePerson(oldName, nn){
  nn = nn.trim();
  const bases = BASE_PEOPLE.filter(b => curPerson(b) === oldName);
  if (!bases.length || !nn || nn === oldName) return;
  const map = {...S.people}; bases.forEach(b => map[b] = nn);
  const n = DATA.coord.filter(c => bases.includes(c.pb)).length;
  toast(`${oldName} → ${nn} · 코디 ${n}건 함께 바꿨어요`);
  try{
    await saveNames({people:map});
    if (!db) return;
    await db.collection("log").add({kind:"person", id:bases.join(","), name:nn, from:oldName, to:nn, t:Date.now(), synced:false, by:"app"});
  }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}

const GRADES = ["초급","중급","상급","우주급"];
const CONTESTS = [["charm","매력 그랑프리"],["staff","직원 페스티벌"],["shop","숍 어워드"],["model","모델 쇼"],["quality","품질 콘테스트"]];
const cKey = (c, gi) => `${c}-g${gi+1}`;
const cRec = key => S.contests.find(r => r._id === key);
/* 규칙: 성공은 실패를 덮어씀. 실패끼리는 더 높은 점수만 갱신. 이미 성공이면 실패는 무시, 성공 점수는 새 값으로 */
function contestDecide(cur, score, result){
  if (!cur) return {ok:true};
  if (result === "성공") return cur.result === "성공" && cur.score === score ? {ok:false, why:"같은 기록이 이미 있어요"} : {ok:true};
  if (cur.result === "성공") return {ok:false, why:`이미 ${cur.score.toLocaleString("ko-KR")}점으로 성공한 기록이 있어서 그대로 뒀어요`};
  if (score <= cur.score) return {ok:false, why:`기존 실패 점수 ${cur.score.toLocaleString("ko-KR")}점보다 높지 않아서 그대로 뒀어요`};
  return {ok:true};
}
async function saveContest(key){
  const score = Number(String(S.cScore).replace(/[^\d]/g, ""));
  if (!S.cScore.trim() || !Number.isFinite(score) || score <= 0){ S.cMsg = "점수를 숫자로 입력해 주세요"; S.cMsgErr = true; render(); return; }
  const cur = cRec(key);
  const dec = contestDecide(cur, score, S.cRes);
  if (!dec.ok){ S.cMsg = dec.why; S.cMsgErr = false; render(); return; }
  const [c, g] = key.split("-g");
  const rec = {contest:c, grade:GRADES[+g-1], score, result:S.cRes, t:Date.now(), by:"app", prev: cur ? {score:cur.score, result:cur.result} : null, hist: cHistNext(cur), ...(S.cFrom && S.cFrom.score === score ? {from:S.cFrom.from} : {})};
  S.contests = [...S.contests.filter(r => r._id !== key), {_id:key, ...rec}];
  S.cEdit = null; S.cScore = ""; S.cFrom = null; S.cMsg = ""; render();
  toast(`${CONTESTS.find(x=>x[0]===c)[1]} ${rec.grade} ${score.toLocaleString("ko-KR")}점 ${rec.result} 저장`);
  if (db) try{ await writeSerial("contest/"+key, rec); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
async function resetContest(key){
  S.contests = S.contests.filter(r => r._id !== key); S.cEdit = null; S.cReset = false; S.sheet = null; render();
  if (db) try{ await db.doc("contest/"+key).delete(); }catch(e){}
}
/* 지금 저장: 앱 상태를 저장소에 다시 전부 써서 혹시 빠진 변경이 없게 함 */
async function saveAll(){
  if (!db){ showNotice("미리보기에서는 저장할 수 없어요."); return; }
  const btn = $("#saveAll"); btn.disabled = true; btn.textContent = "저장 중…";
  const w = []; const put = (path, data) => w.push(writeSerial(path, data));
  Object.entries(S.fac).forEach(([id,v]) => put(`${RUN}/fac/f${id}`, v));
  Object.entries(S.clo).forEach(([id,v]) => put(`${RUN}/clo/c${id}`, v));
  Object.entries(S.clofix).forEach(([id,v]) => { if (Object.keys(v).length) put(`clofix/c${id}`, v); });
  Object.entries(S.chkname).forEach(([id,v]) => put(`checks/k${id}`, v));
  Object.entries(S.chkscore).forEach(([id,v]) => put(`chkscore/k${id}`, v));
  Object.entries(S.cbattle).forEach(([id,v]) => put(`cbattle/c${id}`, v));
  Object.entries(S.cfix).forEach(([id,v]) => put(`coordfix/k${id}`, v));
  put(`${RUN}/misc/coord`, {list:S.coordDone}); put("names/all", S.names);
  const r = await Promise.allSettled(w); const bad = r.filter(x => x.status==="rejected").length;
  btn.disabled = false; btn.textContent = "지금 저장";
  if (bad) showNotice(`${bad}건을 저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.`); else toast(`${w.length}건 모두 저장했어요`);
}
function setSync(on, txt){ if (window.__FMS_PREVIEW__) txt = "미리보기"; const el=$("#sync"); el.classList.toggle("on", on); el.querySelector("span").textContent=txt; }

/* ---------- actions ---------- */
let undoFn = null, toastT = null;
function toast(msg, undo){
  if (S.sheet && S.sheet.kind!=="fc" && S.sheet.kind!=="clo" && S.sheet.kind!=="coord"){ S.sheet = null; render(); }
  $("#toastMsg").textContent = msg; undoFn = undo;
  $("#toastUndo").hidden = !undo;
  const t=$("#toast"); t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove("show"), 3200);
}
$("#toastUndo").onclick = () => { $("#toast").classList.remove("show"); undoFn && undoFn(); };

function togglePut(id, it){
  const f = DATA.fac.find(x => x.id === id);
  const base = putShown(f);
  const put = base.includes(it) ? base.filter(x => x !== it) : [...base, it];
  const all = needOf(f).every(x => put.includes(x));
  if (!all && facDone(f)){
    persist("fac", id, {put, done:false}, {kind:"fac", id, name:facName(f), from:true, to:false});
    toast(`${facName(f)} ${it} 넣음 취소 · 완료를 풀었어요`);
  } else if (all && !facDone(f)){
    persist("fac", id, {put, done:true}, {kind:"fac", id, name:facName(f), from:false, to:true});
    toast(`${facName(f)} 상성 좋음을 다 넣어서 완료로 바꿨어요`);
  } else {
    persist("fac", id, {put}, null);
    toast(`${facName(f)} ${it} ${put.includes(it)?"넣음":"넣음 취소"}`);
  }
}
/* 항목으로 찾기에서 보이는 시설 전부에 한 번에 넣기(되돌리기 가능) */
function bulkPut(ids, it){
  const before = {}, changed = [];
  ids.forEach(id => { const f = DATA.fac.find(x => x.id===id); if (!f || putShown(f).includes(it)) return;
    before[id] = {put: putOf(f).slice(), done: facDone(f)};
    const put = [...putShown(f), it], all = needOf(f).every(x => put.includes(x));
    changed.push(f.id);
    persist("fac", id, all ? {put, done:true} : {put}, all ? {kind:"fac", id, name:facName(f), from:false, to:true} : null); });
  if (!changed.length){ toast("이미 다 넣었어요"); return; }
  const doneN = changed.filter(id => facDone(DATA.fac.find(x => x.id===id))).length;
  toast(`${changed.length}곳에 ${it} 넣음${doneN?` · ${doneN}곳 완료`:""}`, () => {
    changed.forEach(id => { const f = DATA.fac.find(x => x.id===id), b = before[id];
      persist("fac", id, {put:b.put, done:b.done}, b.done !== facDone(f) ? {kind:"fac", id, name:facName(f), from:facDone(f), to:b.done} : null); });
    toast("되돌렸어요");
  });
}
function toggleFac(id, silent){
  const f = DATA.fac.find(x => x.id === id); const from = facDone(f), to = !from;
  persist("fac", id, {done:to}, {kind:"fac", id, name:facName(f), from, to});
  if (!silent) toast(`${facName(f)} ${to?"완료":"미완료"}`, () => toggleFac(id, true));
}
const SP = DATA.clo.filter(isSp);
/* 장르·옷본·재료 필터: 기본은 하나만 선택, 다중선택을 켜면 여러 개. 접힌 상태에선 전체+선택된 것만 */
const isMulti = key => S.cloMulti || !!S.cloRowMulti[key];
const allSel = (cur, key) => { const av = S.rowAvail?.[key] || []; return av.length > 0 && av.every(x => cur.includes(x)); };
const pickChip = (cur, k, key) => k==="전체" ? (allSel(cur, key) ? [] : (S.cloMulti || (S.cloRowMulti = {...S.cloRowMulti, [key]:true}), [...(S.rowAvail?.[key] || [])])) : cur.includes(k) ? cur.filter(x => x!==k) : (isMulti(key) ? [...cur, k] : [k]);
const ROWF = {cat:"cloCat", pat:"cloPat", mat:"cloMat", opt:"cloOpt"};
/* 선택 저장 칸 값도 예전 표기를 사이트 이름으로 */
const slotAlias = sl => { const f = v => Array.isArray(v) ? alArr("recipe", v) : v; const o = {}; for (const [k, v] of Object.entries(sl || {})) o[k] = (k==="all" && v && typeof v==="object") ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, f(b)])) : f(v); return o; };
if (S.cloSlot) S.cloSlot = slotAlias(S.cloSlot);
const slotBtns = key => { const has = S.cloSlot[key] != null;
  return `<button class="chip sm ghostchip" data-slot="save|${key}">${key==="all"?"전체 저장":"저장"}</button><button class="chip sm ghostchip" data-slot="load|${key}" ${has?"":'aria-disabled="true"'} style="${has?"":"opacity:.45"}">불러오기</button>${has?`<button class="chip sm ghostchip" data-slot="del|${key}" aria-label="저장 삭제">×</button>`:""}`; };
const rowHead = (label, key, attr, cur, total) => { label = `<i class="rdot r-${key}" aria-hidden="true"></i>${label}`; const open = S.slotOpen===key, has = S.cloSlot[key] != null, exp = !!S.cloExp[key];
  return `<div class="fhead rowhead"><span class="fh-l"><span class="sublbl" style="margin:0">${label}</span><button class="chip sm ${allSel(cur, key)?"on":""}" data-${attr}="전체" aria-pressed="${allSel(cur, key)}" title="${allSel(cur, key)?"전체 해제":"이 줄 전체 선택"}">전체${total!=null?`<b>${total}</b>`:""}</button>${key==="opt" && S.spAvail?.length ? (() => { const all = S.spAvail.every(k => cur.includes(k)); return `<button class="chip sm spchip ${all?"on":""}" data-act="spall" aria-pressed="${all}" title="${all?"특수 옵션만 해제":"특수 옵션만 전체 선택"}">★ 특수${all?" 해제":" 전체"}</button>`; })() : ""}<button class="chip sm fold" data-cfold="${key}" aria-expanded="${exp}">${exp?"접기 ▴":`펼치기 ▾${cur.length?` <b>${cur.length}</b>`:""}`}</button></span><span class="fh-act">${cur.length?`<button class="chip sm" data-cclear="${key}">전체해제</button>`:""}<button class="chip sm ${isMulti(key)?"on":""}" data-rmulti="${key}" aria-pressed="${isMulti(key)}">${isMulti(key)?"다중":"단일"}</button></span></div>
  `; };
/* 접힘: 칩을 모두 숨김(선택은 유지, 머리에 선택 개수 표시). 펼침: 전체 칩 */
const ORDER_KEYS = ["pat","mat","opt"];
/* 기존 노트에서 정해 둔 칩 순서(2026-11-06 기존 노트 ui/chiporder). 새 노트에 순서가 저장돼 있지 않으면 이 순서를 씀.
   예전 표기는 사이트 이름으로 바꿔서 쓰고, 노트에 없던 새 값은 뒤에 붙는다 */
const NOTE_CHIP_ORDER = {"pat": ["없음", "컷앤소", "팬츠", "스커트", "앞트임", "재킷", "원피스", "민소매", "카디건", "오버올", "베스트", "셋업", "코트", "판초", "기모노", "액세서리"], "mat": ["없음", "라운드넥", "스트레이트", "브이넥", "롤업", "A라인", "플레어", "스키니", "칼라", "플리츠", "와이드", "슬릿", "오프숄더", "센터프레스", "암커버", "타이트", "카고", "랩", "스탠드칼라", "퍼프소매", "슬릿넥", "크롭", "하이넥", "사루엘", "후드", "홀터넥", "세일러칼라", "벌룬", "원숄더", "나팔바지", "티어드", "세퍼레이트", "머메이드"], "opt": ["없음", "프린트", "데미지", "프릴", "라인", "넥타이", "리본", "스트라이프", "체크", "벨트", "체인", "보더", "퍼", "꽃·식물", "지퍼", "링거넥", "셔링", "기하학", "레이스업", "물방울", "레이스", "아가일", "오로라", "카모플라주", "폼폼", "자수", "레오파드", "보타이", "스터드", "고블랭", "게리코튼", "하네스", "자수 패치", "크로스", "나사와 볼트", "찐빵"]};
/* 해금 순서로 다시 줄 세움(제제 2026-11-09): 옷본은 랭크업 순서, 재료·옵션은 스터디 → 패션 체크 보상(만든 옷 개수 기준, DATA.unlockOrder).
   해금 순서에 없는 값(처음부터 있는 것·재킷 등)은 기존 노트 순서에서 바로 앞 값 뒤에 붙어 다님 */
function unlockSorted(list){
  const nk2 = x => String(x || "").replace(/\s/g, ""), U = (DATA.unlockOrder || []).map(nk2);
  const groups = [{i:-1, items:[]}];
  list.forEach(v => { const i = U.indexOf(nk2(v)); if (i >= 0) groups.push({i, items:[v]}); else groups[groups.length-1].items.push(v); });
  return groups.sort((a,b) => a.i - b.i).flatMap(g => g.items);
}
const noteChipOrder = () => ({pat:unlockSorted(alArr("recipe", NOTE_CHIP_ORDER.pat)), mat:unlockSorted(alArr("recipe", NOTE_CHIP_ORDER.mat)), opt:(l => [...l.filter(k => !SP_OPTS.includes(k)), ...l.filter(k => SP_OPTS.includes(k))])(unlockSorted(alArr("recipe", NOTE_CHIP_ORDER.opt)))});
S.chipOrder = noteChipOrder();
/* 옷본·재료·옵션 칩 순서: ui/chiporder {pat:[],mat:[],opt:[]}. 목록에 없는 새 값은 기본 순서대로 뒤에 */
const chipOrdered = (key, keys) => { const o = S.chipOrder?.[key]; if (!o || !o.length) return keys; const idx = new Map(o.map((k,i) => [k,i])); return [...keys].sort((a,b) => (idx.has(a) ? idx.get(a) : 1e6 + keys.indexOf(a)) - (idx.has(b) ? idx.get(b) : 1e6 + keys.indexOf(b))); };
async function saveChipOrder(order){
  S.chipOrder = order; render();
  if (db) try{ await writeSerial("ui/chiporder", {...order, t:Date.now()}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
const foldChips = (list, cur, attr, key) => {
  if (S.orderEdit && ORDER_KEYS.includes(key)) return `<div class="chips cfoldchips dragwrap" data-dwrap="${key}">${list.filter(([k]) => k!=="전체").map(([k,label]) => `<span class="chip dragchip" data-dk="${key}" data-dv="${esc(k)}"><i aria-hidden="true">⋮⋮</i>${label}</span>`).join("")}</div>`;
  return `<div class="chips cfoldchips ${S.cloExp[key]?"is-expanded":"is-strip"}" aria-label="${({cat:"장르",pat:"옷본",mat:"재료",opt:"옵션"})[key]} 선택">${list.filter(([k]) => k!=="전체").map(([k,label,meta]) => `<button class="chip ${isOn(k,cur)?"on":""} ${attr==="copt" && SP_OPTS.includes(k)?"spchip":""} ${meta===0?"zero":""}" data-${attr}="${esc(k)}" aria-pressed="${isOn(k,cur)}" ${S.nextTgt?.[key]?.includes(k)&&!isOn(k,cur)?'data-next="1" title="다음 랭크에서 열려요"':""}>${label}${meta!==""&&meta!=null?`<b>${meta}</b>`:""}</button>`).join("")}</div>`;
};

const cloName = c => S.names.clo[c.id] || c.n;
const cloRenamed = () => { const m = {}; DATA.clo.forEach(c => { const nn = S.names.clo[c.id]; if (nn && nn !== c.n) m[c.n] = nn; }); return m; };
const withClo = (v, m) => (v && m[v]) ? m[v] : v;
async function saveCheckTargets(oi, main, alt){
  const rec = {...(S.chkname[oi]||{})};
  const dm = CHECK_BY_OI[oi]?.main.map(f=>f.id) || [], da = CHECK_BY_OI[oi]?.alt.map(f=>f.id) || [];
  const same = (a,b) => a.length===b.length && a.every((x,i)=>x===b[i]);
  if (same(main, dm)) delete rec.main; else rec.main = main;
  if (same(alt, da)) delete rec.alt; else rec.alt = alt;
  S.chkname = {...S.chkname, [oi]:rec}; buildFC(); render();
  toast("패션 체크 대상 시설을 저장했어요");
  if (db) try{ await writeSerial(`checks/k${oi}`, rec); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
async function renameCheck(oi, nn){
  const from = checkName(oi); nn = nn.trim(); if (!nn || nn === from) return;
  S.chkname = {...S.chkname, [oi]:{...(S.chkname[oi]||{}), name:nn}}; delete S.optDraft["ck-"+oi]; render();
  toast(`패션 체크 이름을 ${nn}(으)로 바꿨어요`);
  if (db) try{
    await writeSerial(`checks/k${oi}`, S.chkname[oi]);
    await db.collection("log").add({kind:"chkname", id:oi, name:nn, from, to:nn, t:Date.now(), synced:false, by:"app"});
  }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
async function renameClo(id, nn){
  const c = DATA.clo.find(x => x.id === id); const from = cloName(c);
  nn = nn.trim(); if (!nn || nn === from) return;
  delete S.optDraft["cn-"+id];
  toast(`옷 이름을 ${nn}(으)로 바꿨어요`);
  try{
    await saveNames({clo:{...S.names.clo, [id]:nn}});
    if (db)
    await db.collection("log").add({kind:"cloname", id, name:nn, from, to:nn, t:Date.now(), synced:false, by:"app"});
  }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
/* 추가옵션: 기준 데이터(g,l,lt,ld)가 기본, 앱에서 고치면 옷 문서의 opt가 덮어씀 */
const optOf = c => S.clo[c.id]?.opt || {guest:c.g||"", like:c.l||"", likeType:c.lt||"", likeDetail:c.ld||""};
/* 의류 수정창: 이름 / 추가옵션(손님·선호 토글) / 전투 추천 — 한 벌의 에디터 스타일 */
function cloEditor(c){
  const o = optOf(c), mode = S.cloEdit[c.id] || "";
  const kind = S.optKind[c.id] || (o.guest ? "손님" : o.likeType==="아이템" ? "아이템" : o.like ? "매장" : "손님");
  const bn = S.cbattle[c.id]?.name || "";
  const pick = `<div class="edl-h"><span class="fl">수정</span><div class="opts mini">${[["name","옷 이름"],["info","기본정보"],["opt","추가옵션"],["battle","전투 추천"]].map(([k,l]) => `<button type="button" class="opt ${mode===k?"on":""}" data-cled="${c.id}|${k}" aria-pressed="${mode===k}">${l}</button>`).join("")}</div></div>`;
  let line = "";
  if (mode==="name") line = `<form class="inl" data-cnform="${c.id}"><input class="field" id="cn-${c.id}" value="${esc(S.optDraft["cn-"+c.id] ?? cloName(c))}" aria-label="새 옷 이름"><button class="btn" type="submit">저장</button></form>`;
  if (mode==="opt"){
    const nameVal = kind==="손님" ? (S.optDraft["og-"+c.id] ?? o.guest ?? "") : (S.optDraft["ol-"+c.id] ?? o.like ?? "");
    line = `<form class="inl" data-optform="${c.id}">
      <select class="field kind" id="ok-${c.id}" aria-label="종류">${["손님","매장","아이템"].map(k => `<option ${k===kind?"selected":""}>${k}</option>`).join("")}</select>
      <input class="field" id="${kind==="손님"?"og":"ol"}-${c.id}" value="${esc(nameVal)}" placeholder="${kind==="손님"?"손님 이름":"선호 손님 이름"}" aria-label="이름">
      ${kind==="매장" ? `<input class="field" id="od-${c.id}" value="${esc(S.optDraft["od-"+c.id] ?? (o.likeType==="신규 매장" ? o.likeDetail : "") ?? "")}" placeholder="매장 이름" aria-label="매장 이름">` : ""}
      <button class="btn" type="submit">저장</button></form>
      <div class="hint">${kind==="아이템" ? "아이템은 인기 UP 씨앗으로 저장돼요. " : ""}이름을 비우고 저장하면 지워져요.</div>`;
  }
  if (mode==="info"){ const fk = S.cloField[c.id] || "p"; const cur = c[fk] || "";
    const vals = [...new Set(DATA.clo.map(x => x._o[fk]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko"));
    line = `<form class="inl" data-cfform="${c.id}">
      <select class="field kind" id="cf-${c.id}" aria-label="항목">${CLO_FIELDS.map(([k,l]) => `<option value="${k}" ${k===fk?"selected":""}>${l}</option>`).join("")}</select>
      ${CLO_SELECT.includes(fk) ? cloSelect(`cv-${c.id}`, fk, S.optDraft["cv-"+c.id] ?? cur)
        : `<input class="field" id="cv-${c.id}" list="dl-${fk}" value="${esc(S.optDraft["cv-"+c.id] ?? cur)}" placeholder="${CLO_FIELDS.find(x=>x[0]===fk)[1]}" aria-label="값"><datalist id="dl-${fk}">${vals.map(v => `<option value="${esc(v)}">`).join("")}</datalist>`}
      <button class="btn" type="submit">저장</button></form>
      <div class="hint">${S.clofix[c.id]?.[fk] ? `원래 ${esc(c._o[fk]||"-")} · 비우고 저장하면 원래대로` : "원래 값과 다르게 저장하면 수정됨으로 기록돼요"}</div>`; }
  if (mode==="battle") line = `<form class="inl" data-btform="${c.id}"><select class="field" id="bn-${c.id}" aria-label="전투"><option value="">추천 안 함</option>${DATA.battles.map(x => `<option ${x.name===bn?"selected":""}>${esc(x.name)}</option>`).join("")}</select><button class="btn" type="submit">저장</button></form>`;
  return `<div class="edl">${pick}${line}</div>`;
}
const battleForm = c => { const b = S.cbattle[c.id] || {}; const on = S.optDraft["bo-"+c.id] ?? !!b.on; const nm = S.optDraft["bn-"+c.id] ?? b.name ?? "";
  return `<form class="ed" data-btform="${c.id}">
    <div class="ed-h"><span class="ed-ic">${ICON.sword}</span><b>전투 추천</b></div>
    <div class="opts"><button type="button" class="opt ${on?"on":""}" data-btog="${c.id}" aria-pressed="${on}"><i class="lg-red"></i>전투에 추천</button></div>
    ${on?`<label class="fld"><span class="fl">전투</span><select class="field" id="bn-${c.id}"><option value="">전투 선택</option>${DATA.battles.map(x => `<option ${x.name===nm?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>`:""}
    <div class="ed-act"><button class="btn" type="submit">저장</button></div>
  </form>`; };
async function saveBattleValue(id, name){
  const on = !!name; S.cbattle = {...S.cbattle, [id]:{on, name}}; delete S.optDraft["bo-"+id]; delete S.optDraft["bn-"+id]; render();
  toast(on ? `전투 추천 저장 · ${name}` : "전투 추천을 해제했어요");
  if (db) try{ await writeSerial(`cbattle/c${id}`, {on, name, t:Date.now()}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
async function saveBattle(id){
  const b = S.cbattle[id] || {}; const on = S.optDraft["bo-"+id] ?? !!b.on; const name = on ? (document.getElementById("bn-"+id)?.value ?? b.name ?? "") : "";
  S.cbattle = {...S.cbattle, [id]:{on, name}}; delete S.optDraft["bo-"+id]; delete S.optDraft["bn-"+id]; render();
  toast(on ? `전투 추천 저장${name?" · "+name:""}` : "전투 추천을 해제했어요");
  if (db) try{ await writeSerial(`cbattle/c${id}`, {on, name, t:Date.now()}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
/* 전투(챌린지): 개량 옵션 표의 장르 순서 = 전투 순서 (마지막 특기는 장르 없음)
   조건은 "/"로 나뉘고, 옷의 분류·옷본·재료·옵션·색·계절·태그 중 하나와 같으면 맞음.
   COND_ALIAS: 전투 조건 단어 → 옷 데이터에 쓰인 단어 (확인 필요한 임시값)
   전투 추천: cbattle(손으로 켠/끈 것)이 있으면 그대로, 없으면 장르+조건이 모두 맞을 때 자동 */
const BATTLE_GENRE = DATA.up.staff.map(x => (x.match(/\(([^)]*)\)\s*$/)||[])[1] || "");
const COND_ALIAS = {"바지":["팬츠"]};
const BT_SLOTS = [["t","상의"],["b","하의"],["o","아우터"],["a","액세서리"]];
const bShort = i => DATA.battles[i].name.replace(/\s*챌린지.*$/,"");
const bRec = i => S.battleRec[i] || {};
/* 전투 완료(제제 2026-11-10): battles/b{번호}.doneRun = 그 회차 run. 다른 가게 직원은 사이트 번호로 battles/bx{id}. 회차가 바뀌면 저절로 미완료 */
const btKeyX = b => `x${b.site?.id}`;
const btDone = k => bRec(k).doneRun === RUN;
async function toggleBtDone(k){
  const on = !btDone(k), rec = {...bRec(k)};
  if (on) rec.doneRun = RUN; else delete rec.doneRun;
  S.battleRec = {...S.battleRec, [k]:rec}; render();
  const nm = typeof k === "number" ? DATA.battles[k]?.name : (DATA.battlesExtra||[]).find(b => btKeyX(b)===k)?.name;
  toast(on ? `${nm || "전투"} 승리로 체크` : `${nm || "전투"} 체크 취소`);
  if (db) try{ await writeSerial(`battles/b${k}`, {...rec, t:Date.now(), by:"app"}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
const btDoneBtn = (k, label) => `<button class="iconbtn act ${btDone(k)?"on":""}" data-btdone="${k}" aria-label="${esc(label)} ${btDone(k)?"승리 체크 취소":"승리 체크"}" aria-pressed="${btDone(k)}">${ICON.ok}</button>`;
const bCond = i => String(bRec(i).cond ?? DATA.battles[i].cond).split("/").map(x => x.trim()).filter(x => x && x!=="-");
/* 조건 단어(사이트 의류 조건): 세부 장르·옷본(베이스)·재료·옵션·색·계절·태그, "셋업"은 옷 종류 */
const termHit = (c, t) => (COND_ALIAS[t] || [t]).some(a => ["c","p","m","o","col","s"].some(f => c[f]===a) || (c.tgs || String(c.tg||"").split(/\s+/)).includes(a) || (a==="셋업" && c.site?.kind==="셋업"));
const bGenreIdx = c => { const i = BATTLE_GENRE.indexOf(c.c); return i >= 0 && DATA.battles[i] ? i : -1; };
const autoBattle = c => { const i = bGenreIdx(c); if (i < 0) return -1; const cs = bCond(i); return cs.length && cs.every(t => termHit(c, t)) ? i : -1; };
const battleOf = c => { const m = S.cbattle[c.id]; if (m) return m.on ? DATA.battles.findIndex(b => b.name===m.name) : -1; return autoBattle(c); };
const bRate = (c, i) => { const cs = bCond(i); return cs.length ? `${cs.filter(t => termHit(c, t)).length}/${cs.length}` : ""; };
const optLine = c => { const o = optOf(c); const bi = battleOf(c); const bt = bi >= 0 ? semTag("battle", btWorn(c) ? "전투 · ⚔️" : `전투${bRate(c, bi) ? " · " + bRate(c, bi) : ""}`) : "";
  if (!o || (!o.guest && !o.like && !o.likeType)) return bt ? `<div class="optline">${bt}</div>` : "";
  const likeTag = o.like ? (o.likeType==="아이템" ? semTag("item", `${esc(o.likeDetail||SEED)}(${esc(o.like)})`)
    : o.likeType==="신규 매장" ? semTag("shop", `${esc(o.likeDetail||"매장 미정")}(${esc(o.like)})`)
    : `<span class="tag">${esc(o.like)}</span>`) : "";
  return `<div class="optline">${o.guest?semTag("guest", esc(o.guest)):""}${likeTag}${bt}</div>`; };
/* 목록 행용 추가옵션 태그: 손님·매장·아이템만(전투 태그는 챌린지 태그로 합침, 제제 2026-11-09) */
const rowOptTags = c => { const o = optOf(c); if (!o || (!o.guest && !o.like && !o.likeType)) return "";
  /* 추가옵션 태그는 앞에 작은 종류 글자(손님·매장·아이템)를 붙여 다른 태그와 구분 */
  const kt = k => `<span class="tk">${k}</span>`;
  const likeTag = o.like ? (o.likeType==="아이템" ? semTag("item", `${kt("아이템")}${esc(o.likeDetail||SEED)}(${esc(o.like)})`)
    : o.likeType==="신규 매장" ? semTag("shop", `${kt("매장")}${esc(o.likeDetail||"매장 미정")}(${esc(o.like)})`)
    : `<span class="tag">${kt("선호")}${esc(o.like)}</span>`) : "";
  return `${o.guest?semTag("guest", `${kt("손님")}${esc(o.guest)}`):""}${likeTag}`; };
const optTags = c => { const h = optLine(c); return h ? h.replace(/^<div class="optline">/,"").replace(/<\/div>$/,"") : ""; };
/* 새 추가옵션 요약: 상세의 '신규' 행 */
const newLines = c => { const o = optOf(c), out = [];
  if (o.guest) out.push(["손님", o.guest]);
  if (o.like){ if (o.likeType==="아이템") out.push(["아이템", `${o.likeDetail||SEED}(${o.like})`]);
    else if (o.likeType==="신규 매장") out.push(["매장", `${o.likeDetail||"매장 미정"}(${o.like})`]);
    else out.push(["선호", o.like]); }
  return out; };
const LEGEND = `<div class="legend"><span><i style="background:${SEM_COLOR.guest}"></i>손님</span><span><i style="background:${SEM_COLOR.shop}"></i>매장</span><span><i style="background:${SEM_COLOR.item}"></i>아이템</span><span><i style="background:${SEM_COLOR.battle}"></i>챌린지</span><span class="lg-sep">아래 줄 점:</span><span><i style="background:${SEM_COLOR.req}"></i>손님 요청</span><span><i style="background:${SEM_COLOR.set}"></i>코디 세트</span><span><i style="background:${SEM_COLOR.mq}"></i>마네킹</span><button class="linkbtn" data-act="golegend" style="margin-left:auto;font-size:11.5px">장르 색 보기</button></div>`;
const LIKE_TYPES = ["신규 매장","아이템"];
const SEED = "인기 UP 씨앗";
/* 기본정보 수정: clofix/c{id} = {c?,p?,m?,o?,col?,s?,tg?}. 원본은 c._o에 보관, 스냅샷마다 원본 복원 후 덮어씀 */
const CLO_FIELDS = [["c","분류"],["p","옷본"],["m","재료"],["o","옵션"],["col","색"],["s","계절"],["tg","태그"]];
/* 옷 수정: 분류·옷본·재료·옵션·계절은 입력 대신 선택 칸(항상 전체 목록이 보이게) */
const CLO_SELECT = ["c","p","m","o","s"];
const cloAllVals = (k, cur) => [...new Set([...DATA.clo.map(x => x._o[k]), ...DATA.clo.map(x => x[k]), cur].filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko"));
const cloSelect = (id, k, cur) => `<select class="field" id="${id}">${k==="c" ? "" : `<option value="" ${!cur?"selected":""}>없음</option>`}${cloAllVals(k, cur).map(v => `<option ${v===cur?"selected":""}>${esc(v)}</option>`).join("")}</select>`;
DATA.clo.forEach(c => { c._o = {c:c.c,p:c.p,m:c.m,o:c.o,col:c.col,s:c.s,tg:c.tg}; });
function applyCloFix(){ DATA.clo.forEach(c => { Object.assign(c, c._o); const f = S.clofix[c.id]; if (f) CLO_FIELDS.forEach(([k]) => { if (f[k]) c[k] = f[k]; }); }); }
async function saveCloFix(id, key, val){
  const c = DATA.clo.find(x => x.id===id); val = val.trim(); const from = c[key];
  const rec = {...(S.clofix[id]||{})}; if (!val || val===c._o[key]) delete rec[key]; else rec[key] = val;
  S.clofix = {...S.clofix, [id]:rec}; applyCloFix(); delete S.optDraft["cv-"+id]; render();
  const label = CLO_FIELDS.find(x => x[0]===key)[1];
  toast(`${cloName(c)} ${label}: ${from||"-"} → ${c[key]||"-"}`);
  if (!db) return;
  try{ await writeSerial(`clofix/c${id}`, rec);
    await db.collection("log").add({kind:"clofix", id, name:cloName(c), from:`${label} ${from||"-"}`, to:`${label} ${c[key]||"-"}`, t:Date.now(), synced:false, by:"app"});
  }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
/* 기존 추가옵션에서 이름/내용 꺼내기: "이름[마을]" → shop, "[원함]이름→내용" → want, target */
const oldOpt = c => {
  const X = withNames(c.x || "").trim();
  const w = X.match(/^\[원함\]([^→]+?)\s*(?:→\s*(.*))?$/);
  if (w) return {want:w[1].trim(), target:(w[2]||"").trim()};
  const sh = X.match(/^([^\[\]→]+)\[[^\]]*\]\s*$/);
  return sh ? {shop:sh[1].trim()} : {};
};
async function saveOpt(id, guest, like, likeType, likeDetail){
  guest = guest.trim(); like = like.trim(); likeDetail = likeType ? likeDetail.trim() : "";
  if (likeType==="아이템" && !likeDetail) likeDetail = SEED;
  const c = DATA.clo.find(x => x.id === id);
  const rec = {guest, like, likeType, likeDetail};
  S.clo[id] = {...(S.clo[id]||{}), opt:{...rec, t:Date.now()}}; ["og-","ol-","ot-","od-"].forEach(k => delete S.optDraft[k+id]); render();
  /* 규칙: 신규 손님을 넣었고 기존 추가옵션이 "이름[마을]" 형태면 그 이름을 모두 신규 손님 이름으로 바꿈 */
  const m = (c.x || "").match(/^([^\[\]→]+)\[[^\]]*\]\s*$/);
  const base = m ? m[1].trim() : "";
  const cur = base ? (S.people[base] ?? base) : "";
  if (guest && base && cur !== guest){
    const map = {...S.people};
    Object.keys(map).forEach(k => { if (map[k] === cur) map[k] = guest; });
    map[base] = guest;
    toast(`${cloName(c)} 저장 · ${cur} → ${guest} 이름도 모두 바꿨어요`);
    try{
      await saveNames({people:map});
      if (db)
      await db.collection("log").add({kind:"person", id:base, name:guest, from:cur, to:guest, t:Date.now(), synced:false, by:"app"});
    }catch(e){}
  } else toast(`${cloName(c)} 새 추가옵션 저장`);
  if (db) try{ await writeSerial(`${RUN}/clo/c${id}`, S.clo[id]); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
function toggleClo(id, silent){
  const c = DATA.clo.find(x => x.id === id); const from = cloDone(c), to = !from;
  /* 추가옵션이 없는 특수 옵션 옷은 노트 전용: 시트 반영 목록에 안 올림 */
  persist("clo", id, {done:to}, {kind:"clo", id, name:cloName(c), from, to, synced: c.done===null});
  if (!silent) toast(`${cloName(c)} ${to?"완료":"미완료"}`, () => toggleClo(id, true));
}
function renameFac(id, nn){
  const f = DATA.fac.find(x => x.id === id); const from = facName(f);
  nn = nn.trim(); if (!nn || nn === from) return;
  toast(`이름을 ${nn}(으)로 바꿨어요`);
  saveNames({fac:{...S.names.fac, [id]:nn}}).then(() => db && db.collection("log").add({kind:"rename", id, name:nn, from, to:nn, t:Date.now(), synced:false, by:"app"})).catch(() => showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
}

/* ---------- counts ---------- */
function counts(){
  buildFC();
  const fd = DATA.fac.filter(facDone).length, ft = DATA.fac.length;
  const tracked = DATA.clo.filter(c => c.done !== null);
  const cd = tracked.filter(cloDone).length, ct = tracked.length;
  $("#sub").textContent = `${roundLabel()} · 시설 ${Math.round(fd/ft*100)}% · 신규 손님 옷 ${Math.round(cd/ct*100)}%`;
  $("#ttl").textContent = ({clo:"의류",fac:"시설",coord:"코디",tool:"도구"})[S.tab] || "";
  $("#saveAll").hidden = !db;
}
const pendingList = () => {
  const net = new Map();
  const lastReset = Math.max(0, ...S.logs.filter(l => l.kind==="reset" && !l.synced).map(l => l.t));
  [...S.logs].filter(l => !l.synced && !(lastReset && (l.kind==="fac"||l.kind==="clo") && l.t < lastReset)).sort((a,b)=>a.t-b.t).forEach(l => {
    const key = l.kind + ":" + l.id;
    const cur = net.get(key);
    net.set(key, cur ? {...cur, to:l.to, name:(l.kind==="rename"||l.kind==="person"||l.kind==="cloname")?l.to:cur.name, t:l.t, ids:[...cur.ids,l._id]} : {...l, ids:[l._id]});
  });
  return [...net.values()].filter(x => x.from !== x.to).sort((a,b)=>b.t-a.t);
};

/* ---------- 디자인: 기존(인라인 편집) / 하이브리드(폼은 시트) ---------- */
const hybrid = () => document.documentElement.getAttribute("data-design")==="hybrid";
const editSlot = (kind, id, html, label="수정") => hybrid() ? `<div class="editslot"><button class="btn sm ghost" data-sheet="${kind}|${esc(String(id))}">${ICON.pen}${label}</button></div>` : html;
const SHEET_TITLE = {coordreq:"코디 요청 수정",fac:"시설 이름 수정", clo:"옷 수정", coord:"손님 이름 수정", fc:"패션 체크 수정", contest:"콘테스트 기록", battle:"전투 추천", bt:"전투 기록 수정"};
const battleFor = c => DATA.battles[bGenreIdx(c)]?.name || DATA.battles[0]?.name || "";
/* PC·패드는 가운데 모달, 핸드폰은 바텀 시트. 설정이 auto면 화면 너비로 */
/* 2026-11-06: 아래에서 올라오는 시트는 쓰지 않고 항상 가운데 창으로(제제: 올라오는 창은 불편) */
const isDesk = () => true;
const fld = (label, inner) => {
  const id = inner.match(/\bid="([^"]+)"/)?.[1];
  return `<div class="fld">${id ? `<label class="fl" for="${id}">${label}</label>` : `<span class="fl">${label}</span>`}${inner}</div>`;
};
const dl = (id, vals) => `<datalist id="${id}">${vals.map(v => `<option value="${esc(v)}">`).join("")}</datalist>`;
/* 옷 수정 전체 폼: 이름 · 기본정보 · 추가옵션 · 전투 추천을 한 번에, 저장하면 바뀐 것만 반영 */
function cloFullForm(c){
  const o = optOf(c), kind = S.optKind[c.id] || (o.guest ? "손님" : o.likeType==="아이템" ? "아이템" : o.like ? "매장" : "손님");
  const vals = k => [...new Set(DATA.clo.map(x => x._o[k]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko"));
  const bi0 = battleOf(c), bn = bi0 >= 0 ? DATA.battles[bi0].name : "";
  return `<form class="ed full" data-clofull="${c.id}">
    ${fld("옷 이름", `<input class="field" id="cn-${c.id}" value="${esc(cloName(c))}"${cloName(c)!==c.n?` placeholder="원래 ${esc(c.n)}"`:""}>`)}
    <div class="ed-sec"><div class="ed-h"><b>기본정보</b><span>원래와 다르게 저장하면 수정됨으로 표시</span></div>
      <div class="fld-row g2">${CLO_FIELDS.map(([k,l]) => CLO_SELECT.includes(k)
        ? fld(l, cloSelect(`cf-${k}-${c.id}`, k, c[k]||""))
        : fld(l, `<input class="field" id="cf-${k}-${c.id}" list="dl-${k}" value="${esc(c[k]||"")}" placeholder="${c._o[k]?`원래 ${esc(c._o[k])}`:"-"}">${dl("dl-"+k, vals(k))}`)).join("")}</div></div>
    <div class="ed-sec"><div class="ed-h"><b>추가옵션</b><span>이름을 비우면 지워져요</span></div>
      <div class="fld-row"><select class="field kind" id="ok-${c.id}" aria-label="종류">${["손님","매장","아이템"].map(k => `<option ${k===kind?"selected":""}>${k}</option>`).join("")}</select>
      <input class="field" id="on-${c.id}" value="${esc(kind==="손님" ? o.guest : o.like)}" placeholder="${kind==="손님"?"손님 이름":"선호 손님 이름"}" aria-label="이름">
      ${kind==="매장" ? `<input class="field" id="od-${c.id}" value="${esc(o.likeType==="신규 매장" ? o.likeDetail : "")}" placeholder="매장 이름" aria-label="매장 이름">` : kind==="아이템" ? `<span class="hint" style="align-self:center">${SEED}</span>` : ""}</div></div>
    ${fld("전투 추천", `<select class="field" id="bn-${c.id}"><option value="">추천 안 함</option>${DATA.battles.map(x => `<option ${x.name===bn?"selected":""}>${esc(x.name)}</option>`).join("")}</select>`)}
    <div class="ed-act"><button class="btn ghost" type="button" data-sheet="close">취소</button><button class="btn" type="submit">변경사항 저장</button></div>
  </form>`;
}
function saveCloFull(id){
  const c = DATA.clo.find(x => x.id===id); const vals = {}; document.querySelectorAll("form[data-clofull] input, form[data-clofull] select").forEach(el => { if (el.id) vals[el.id] = el.value; });
  const v = i => (vals[i] ?? "").trim(); let n = 0;
  const nn = v("cn-"+id); if (nn && nn !== cloName(c)){ renameClo(id, nn); n++; }
  CLO_FIELDS.forEach(([k]) => { const x = v(`cf-${k}-${id}`); if (x !== (c[k]||"")){ saveCloFix(id, k, x); n++; } });
  const o = optOf(c), kind = v("ok-"+id) || "손님", nm = v("on-"+id);
  if (kind==="손님"){ if (nm !== (o.guest||"")){ saveOpt(id, nm, o.like, o.likeType, o.likeDetail); n++; } }
  else { const det = kind==="매장" ? v("od-"+id) : SEED, lt = nm ? (kind==="매장" ? "신규 매장" : "아이템") : "";
    if (nm !== (o.like||"") || lt !== (o.likeType||"") || (nm && det !== (o.likeDetail||""))){ saveOpt(id, o.guest, nm, lt, det); n++; } }
  const bn = v("bn-"+id), bc = battleOf(c), cur = bc >= 0 ? DATA.battles[bc].name : "";
  if (bn !== cur){ saveBattleValue(id, bn); n++; }
  S.sheet = null; delete S.optKind[id]; render();
  if (!n) toast("바뀐 내용이 없어요");
}
/* 코디 수정 전체 폼: 손님의 요청을 모두 펼쳐 놓고 바뀐 것만 저장 */
function coordFullForm(n, list, mode){
  mode = mode || {};
  const cloNames = [...new Set(DATA.clo.map(cloName))].sort((a,b)=>a.localeCompare(b,"ko"));
  return `<form class="ed full" data-cofull="${esc(n)}">
    ${mode.one ? "" : fld("손님 이름", `<input class="field" id="pn-${esc(n)}" value="${esc(n)}">`)}
    ${mode.nameOnly ? "" : list.map(c => { const fx = S.cfix[c.id]||{}; return `<div class="ed-sec"><div class="ed-h"><b>${mode.one ? "" : `${esc(c.ps||"-")} ${esc(c.r)}`}</b><label class="chk"><input type="checkbox" id="cw-${c.id}" ${fx.wrong?"checked":""}> 잘못된 정보</label></div>
      ${fld("제목", `<input class="field" id="ct-${c.id}" value="${esc(cTitle(c))}" placeholder="원래 ${esc(c.r)}">`)}
      <div class="fld-row g2">${PARTS.map(([k,l]) => fld(l, `<input class="field" id="cp-${k}-${c.id}" list="dl-clo" value="${esc(cPart(c,k)||"")}" placeholder="${c[k]?`원래 ${esc(c[k])}`:"-"}">`)).join("")}</div>
    </div>`; }).join("")}${dl("dl-clo", cloNames)}
    <div class="ed-act"><button class="btn ghost" type="button" data-sheet="close">취소</button><button class="btn" type="submit">변경사항 저장</button></div>
  </form>`;
}
function saveCoordFull(n){
  const list = DATA.coord.filter(c => curPerson(c.pb)===n); const vals = {}, chk = {}; document.querySelectorAll("form[data-cofull] input").forEach(el => { if (el.type==="checkbox") chk[el.id] = el.checked; else if (el.id) vals[el.id] = el.value; });
  const v = i => (vals[i] ?? "").trim(); let k = 0;
  const nn = v("pn-"+n); if (("pn-"+n) in vals && nn && nn !== n){ renamePerson(n, nn); k++; }
  list.filter(c => ("ct-"+c.id) in vals).forEach(c => {
    const patch = {}, logs = [];
    const t = v("ct-"+c.id); if (t !== cTitle(c)){ patch.title = (!t || t===c.r) ? "" : t; logs.push({kind:"coordreq", from:cTitle(c), to:t||c.r, synced:false}); }
    PARTS.forEach(([pk, l]) => { const x = v(`cp-${pk}-${c.id}`); if (x !== (cPart(c,pk)||"")){ patch[PK(pk)] = (!x || x===c[pk]) ? "" : x; logs.push({kind:"coordreq", from:`${l} ${cPart(c,pk)||"-"}`, to:`${l} ${(x||c[pk])||"-"}`, synced:false}); } });
    const w = !!chk["cw-"+c.id]; if (w !== !!(S.cfix[c.id]?.wrong)){ patch.wrong = w; logs.push({kind:"coordwrong", from:cTitle(c), to:w?"잘못된 정보 표시":"표시 해제", synced:true}); }
    if (Object.keys(patch).length){ saveCfix(c, patch, logs[0]); k++; }
  });
  S.sheet = null; render(); toast(k ? `코디 ${k}건 저장했어요` : "바뀐 내용이 없어요");
}
/* 패션 체크 수정 전체 폼: 이름 · 통과 기록 · 코디 기록 · 대상 시설 · 대신 가능 */
function fcFullForm(oi){
  const r = S.chkscore[oi]||{}; const main = checkMain(oi), alt = checkAlt(oi);
  const facOpts = (sel) => `<option value="">+ 시설 추가</option>${DATA.fac.filter(f => !sel.includes(f.id)).map(f => `<option value="${f.id}">${esc(facName(f))}</option>`).join("")}`;
  const picked = (ids, key) => `<div class="pills">${ids.map(id => `<span class="pill must">${esc(facName(facById(id)))}<button type="button" class="pillx" data-fcrm="${key}|${id}" aria-label="빼기">×</button></span>`).join("")||`<span class="hint">없음</span>`}</div>`;
  const dm = S.fcDraft?.[oi]?.main ?? main.map(f=>f.id), da = S.fcDraft?.[oi]?.alt ?? alt.map(f=>f.id);
  return `<form class="ed full" data-fcfull="${oi}">
    ${fld("이름", `<input class="field" id="ck-${oi}" value="${esc(checkName(oi))}" placeholder="원래 ${esc(DATA.checks[oi].name)}">`)}
    <div class="fld-row g2">${fld("통과 · 인기도", `<input class="field" id="sp-${oi}" inputmode="numeric" value="${esc(r.pop ?? "")}">`)}${fld("통과 · 점수 /25", `<input class="field" id="ss-${oi}" inputmode="numeric" value="${esc(r.score ?? "")}">`)}
    ${fld("코디 · 매력", `<input class="field" id="cm-${oi}" inputmode="numeric" value="${esc(r.charm ?? "")}">`)}${fld("코디 · 점수 /25", `<input class="field" id="cs-${oi}" inputmode="numeric" value="${esc(r.cscore ?? "")}">`)}</div>
    ${S.scErr?`<div class="err">${esc(S.scErr)}</div>`:""}${S.scErr2?`<div class="err">${esc(S.scErr2)}</div>`:""}
    <div class="ed-sec"><div class="ed-h"><b>대상 시설</b></div>${picked(dm,"main")}<select class="field" id="fa-main-${oi}" data-fcadd="main">${facOpts([...dm,...da])}</select></div>
    <div class="ed-sec"><div class="ed-h"><b>대신 가능</b></div>${picked(da,"alt")}<select class="field" id="fa-alt-${oi}" data-fcadd="alt">${facOpts([...dm,...da])}</select></div>
    <div class="ed-act"><button class="btn ghost" type="button" data-sheet="close">취소</button><button class="btn ghost" type="button" data-fctemp="${oi}">임시저장</button><button class="btn" type="submit">변경사항 저장</button></div>
  </form>`;
}
function saveFcFull(oi){
  const vals = {}; document.querySelectorAll("form[data-fcfull] input").forEach(el => { if (el.id) vals[el.id] = el.value; });
  const v = i => (vals[i+"-"+oi] ?? "").trim(); let n = 0;
  const r = S.chkscore[oi]||{};
  const doPass = (v("sp")||v("ss")) && (String(r.pop??"")!==v("sp") || String(r.score??"")!==v("ss"));
  const doCoord = (v("cm")||v("cs")) && (String(r.charm??"")!==v("cm") || String(r.cscore??"")!==v("cs"));
  if (doPass){ saveScore(oi, v("sp"), v("ss")); n++; if (S.scErr) return; }
  if (doCoord){ saveCoordScore(oi, v("cm"), v("cs")); n++; if (S.scErr2) return; }
  const nm = v("ck"); if (nm && nm !== checkName(oi)){ renameCheck(oi, nm); n++; }
  const d = S.fcDraft?.[oi]; if (d){ const cm = checkMain(oi).map(f=>f.id), ca = checkAlt(oi).map(f=>f.id);
    if (JSON.stringify(d.main||cm)!==JSON.stringify(cm) || JSON.stringify(d.alt||ca)!==JSON.stringify(ca)){ saveCheckTargets(oi, d.main||cm, d.alt||ca); n++; } }
  S.sheet = null; S.fcDraft = {}; render(); if (!n) toast("바뀐 내용이 없어요");
}
/* 수정 팝업: 폰·PC 모두 가운데 모달.
   저장소 변경 등으로 다시 그려질 때 같은 팝업이면 입력 중인 값·커서·스크롤을 그대로 살리고, 열릴 때만 애니메이션 */
let sheetKey = "";
function renderSheet(){
  const box = $("#sheet"), key = S.sheet && hybrid() ? `${S.sheet.kind}|${S.sheet.id}` : "";
  const same = key && key === sheetKey, keep = {};
  let sc = 0, fid = "", caret = null;
  if (same){
    box.querySelectorAll("input[id],textarea[id],select[id]").forEach(el => { keep[el.id] = el.type==="checkbox" ? el.checked : el.value; });
    sc = box.querySelector(".sheet")?.scrollTop || 0;
    const ae = document.activeElement; if (ae && box.contains(ae) && ae.id){ fid = ae.id; try{ caret = ae.selectionStart; }catch(e){} }
  }
  box.innerHTML = sheetHtml();
  sheetKey = key;
  document.documentElement.classList.toggle("sheet-open", !!key);
  if (!key) return;
  const sh = box.querySelector(".sheet"), scrim = box.querySelector(".scrim");
  if (!same){ scrim?.classList.add("enter"); return; }
  Object.entries(keep).forEach(([id, v]) => { const el = document.getElementById(id); if (!el || !box.contains(el)) return; if (el.type==="checkbox") el.checked = v; else if (el.value !== v) el.value = v; });
  if (sh) sh.scrollTop = sc;
  if (fid){ const el = document.getElementById(fid); if (el && box.contains(el) && el.tagName!=="SELECT"){ el.focus({preventScroll:true}); try{ if (caret != null) el.setSelectionRange(caret, caret); }catch(e){} } }
}
function sheetHtml(){
  const sh = S.sheet; if (!sh || !hybrid()) return "";
  let sub = "", body = "";
  if (sh.kind==="fac"){ const f = DATA.fac.find(x => x.id===+sh.id); if (!f) return ""; sub = f.name !== facName(f) ? `원래 ${esc(f.name)}` : esc(f.name); body = facRenameForm(f); }
  if (sh.kind==="clo"){ const c = DATA.clo.find(x => x.id===+sh.id); if (!c) return ""; sub = `${esc(cloName(c))} · ${esc(c.c)}`; body = cloFullForm(c); }
  if (sh.kind==="coord"){ const n = sh.id; const list = DATA.coord.filter(c => curPerson(c.pb)===n); if (!list.length) return ""; sub = `${esc(n)} · 손님 이름`; body = coordFullForm(n, list, {nameOnly:true}); }
  if (sh.kind==="coordreq"){ const c = DATA.coord.find(x => x.id===+sh.id); if (!c) return ""; const n = curPerson(c.pb); sub = `${esc(n)} ${esc(c.ps||"")} · ${esc(cTitle(c))}`; body = coordFullForm(n, [c], {one:true}); }
  if (sh.kind==="fc"){ const oi = +sh.id; sub = `${oi+1}. ${esc(checkName(oi))}`; body = fcFullForm(oi); }
  if (sh.kind==="contest"){ const key = sh.id; const [c, g] = key.split("-g"); sub = `${CONTESTS.find(x=>x[0]===c)[1]} · ${GRADES[+g-1]}`; body = contestForm(key); }
  if (sh.kind==="bt"){ const i = +sh.id; if (!DATA.battles[i]) return ""; sub = esc(DATA.battles[i].name); body = btForm(i); }
  if (sh.kind==="battle"){ const c = DATA.clo.find(x => x.id===+sh.id); if (!c) return ""; const on = battleOf(c) >= 0; sub = esc(cloName(c));
    body = `<p class="confirm-p">${on ? `전투 추천을 해제할까요?` : `<b>${esc(battleFor(c))}</b>에 추천할까요?`}</p><div class="ed-act"><button class="btn ghost" type="button" data-sheet="close">취소</button><button class="btn" type="button" data-battle="${c.id}">${on?"해제":"추천"}</button></div>`; }
  return `<div class="scrim modal" data-sheet="close"><div class="sheet" role="dialog" aria-modal="true" aria-label="${SHEET_TITLE[sh.kind]}">
    <div class="sh-t"><div><h3>${SHEET_TITLE[sh.kind]}</h3><div class="ss">${sub}</div></div><button class="close" data-sheet="close" aria-label="닫기">${ICON.x}</button></div>${body}</div></div>`;
}
const facRenameForm = f => { const nm = facName(f); return `<div class="edl"><div class="edl-h"><span class="fl">번역 이름 수정${nm!==f.name?` · 원래 ${esc(f.name)}`:""}</span></div>
            <form class="inl" data-rfac="${f.id}"><input class="field" id="rn-${f.id}" value="${esc(nm)}" aria-label="새 이름"><button class="btn" type="submit">저장</button></form></div>`; };

/* ---------- views ---------- */
const isOn = (k, cur) => Array.isArray(cur) ? (k==="전체" ? cur.length===0 : cur.includes(k)) : k===cur;
const chips = (list, cur, attr) => `<div class="chips" role="${Array.isArray(cur)?"group":"tablist"}">${list.map(([k,label,meta]) =>
  `<button class="chip ${isOn(k,cur)?"on":""}" data-${attr}="${esc(k)}" ${Array.isArray(cur)?`aria-pressed="${isOn(k,cur)}"`:`role="tab" aria-selected="${isOn(k,cur)}"`}>${label}${meta?`<b>${meta}</b>`:""}</button>`).join("")}</div>`;
const seg = (list, cur, attr) => `<div class="seg">${list.map(k => `<button class="${k===cur?"on":""}" data-${attr}="${k}">${k}</button>`).join("")}</div>`;
const ck = on => `<span class="ck ${on?"on":""}" aria-hidden="true">${ICON.check}</span>`;
const ckFac = f => { const d = facDone(f), p = putOf(f).filter(x => needOf(f).includes(x)).length;
  return !d && p ? `<span class="ck part" aria-hidden="true">${p}/${needOf(f).length}</span>` : ck(d); };
const stTag = f => facDone(f) ? semTag("done","완료") : facPartial(f) ? semTag("part","일부완료") : "";
const needLine = f => needOf(f).map(i => putShown(f).includes(i) ? `<span class="putdone">${i} ✓</span>` : i).join(" · ") || "상성 좋음 항목 없음";

/* 아이템 조건: 모아야 할 항목. 고르면 아래 시설 목록이 그 항목 기준으로 걸러짐 */
function itemRow(){
  const openF = DATA.fac.filter(f => !facDone(f));
  const need = {}; openF.forEach(f => needOf(f).filter(i => !putOf(f).includes(i)).forEach(i => need[i]=(need[i]||0)+1));
  const sorted = Object.entries(need).sort((a,b)=>b[1]-a[1]);
  const it = S.itemPick, o = !!S.facExp.item, rel = S.itemAlt || "좋음";
  return `<div class="fhead rowhead"><span class="fh-l"><span class="sublbl" style="margin:0">아이템</span>${it?`<button class="chip sm on" data-pick="">${esc(it)} ×</button>`:""}<button class="chip sm fold" data-fexp="item" aria-expanded="${o}">${o?"접기 ▴":"펼치기 ▾"}</button></span>
    ${it ? `<span class="fh-act"><span class="seg mini">${["좋음","보통","나쁨"].map(k=>`<button class="${rel===k?"on":""}" data-ialt="${k}" aria-pressed="${rel===k}">${k}</button>`).join("")}</span></span>` : ""}</div>
  ${o ? `<div class="hint" style="margin:-2px 0 8px">완료 안 된 ${openF.length}곳 · 시설당 2개 기준 · 좋음은 상태 '전체'면 아직 안 넣은 미완료 시설, 상태를 고르면 그 상태 전부 · 보통·나쁨은 완료 포함 전체</div>
  <div class="pills">${sorted.map(([k,v],i)=>`<button class="pill ${k===it?"need":i<3?"must":""}" data-pick="${esc(k)}" aria-pressed="${k===it}">${esc(k)}<b>${v*2}</b></button>`).join("")}${ITEMS.filter(k => !need[k]).map(k=>`<button class="pill ${k===it?"need":"off"}" data-pick="${esc(k)}" aria-pressed="${k===it}">${esc(k)}<b>0</b></button>`).join("")}</div>` : ""}`;
}
/* 장르 조건 */
function genreRow(typeChips){
  const o = !!S.facExp.genre, cur = S.facType;
  return `<div class="fhead rowhead"><span class="fh-l"><span class="sublbl" style="margin:0">장르</span>${cur!=="전체"?`<button class="chip sm on" data-ftype="전체">${esc(cur)} ×</button>`:""}<button class="chip sm fold" data-fexp="genre" aria-expanded="${o}">${o?"접기 ▴":"펼치기 ▾"}</button></span>
    <span class="fh-act"><button class="chip sm" data-act="ffoldall">전체 접기</button><button class="chip sm" data-act="fopenall">전체 펼치기</button><button class="chip sm ${S.facExpPin?"on":""}" data-act="fpin" aria-pressed="${!!S.facExpPin}" title="지금 접힘 상태를 다음에도 유지">${S.facExpPin?"고정됨":"고정"}</button></span></div>
  ${o ? chips(typeChips, cur, "ftype") : ""}`;
}
/* 요구·보상 태그: "서브컬쳐 계열" → 장르 태그 + 계열, "자수 & 50000엔" → 특수 옵션 태그 + 상금 */
/* 요구 문구 정리: 일본어 직역은 한국어로, 장르는 시설 장르 태그로 (어른→성숙, 서브컬처→서브컬쳐, 그루메→음식) */
const REQ_WORD = {"어른":"성숙","어른스러운":"성숙","성숙한":"성숙","서브컬처":"서브컬쳐","서브컬쳐":"서브컬쳐","그루메":"미식","구루메":"미식"};
function reqTags(req){
  const words = String(req||"").split(/\s+/).filter(Boolean); if (!words.length) return "";
  const TYPES = Object.keys(TYPE_COLOR);
  return words.filter(w => w!=="계열").map(w => { const base = (REQ_WORD[w] || w).replace(/(스러운|한)$/,""); const g = TYPES.find(t => base===t) || TYPES.find(t => REQ_WORD[base]===t);
    return g ? typeTag(g) : `<span class="tag plain">${esc(REQ_WORD[w] || w)}</span>`; }).join("");
}
function rewardTags(rw){
  const parts = String(rw||"").split("&").map(x=>x.trim()).filter(Boolean); if (!parts.length) return "";
  return parts.map(x => /엔$|원$|G$|^\d/.test(x) ? `<span class="tag plain">${esc(x.replace(/(엔|원)$/,"G"))}</span>` : semTag("sp", esc(x))).join("");
}
/* 패션 체크 보기: 읽기 전용. 시설 탭의 완료/일부완료 상태를 그대로 보여줌 */
const FAC_BY_NAME = Object.fromEntries(DATA.fac.map(f => [f.name, f]));
const checkName = oi => S.chkname[oi]?.name || DATA.checks[oi].name;
const CHECKS = DATA.checks.map((c,oi) => ({...c, oi})).filter(c => c.b.some(x => FAC_BY_NAME[x])).map(c => {
  const m = (c.note || "").match(/^(.*?)도 가능/);
  const alt = (c.altB && c.altB.length) ? c.altB.map(x => FAC_BY_NAME[x]).filter(Boolean) : m ? m[1].split("·").map(x => x.trim().replace(/\s*등$/, "")).map(x => FAC_BY_NAME[al("fac", x)]).filter(Boolean) : [];
  return {...c, main:c.b.map(x => FAC_BY_NAME[x]).filter(Boolean), alt};
});
/* 패션 체크는 1~20번만 시설과 관련(21번부터는 모델 체크). 대상·대신 가능은 chkname 문서의 main/alt(시설 id 배열)로 덮어쓸 수 있음 */
const FC_MAX = Math.min(20, DATA.checks.length);
const CHECK_BY_OI = Object.fromEntries(CHECKS.map(c => [c.oi, c]));
const facById = id => DATA.fac.find(f => f.id===id);
const checkMain = oi => { const o = S.chkname[oi]?.main; return (o ? o.map(facById) : (CHECK_BY_OI[oi]?.main || [])).filter(Boolean); };
const checkAlt = oi => { const o = S.chkname[oi]?.alt; return (o ? o.map(facById) : (CHECK_BY_OI[oi]?.alt || [])).filter(Boolean); };
/* 시설별 패션 체크 번호(1부터), 대신 가능 포함. 상태가 바뀌면 다시 계산 */
let FC_OF = {}, FC_ALT = {};
function buildFC(){
  FC_OF = {}; FC_ALT = {};
  for (let oi = 0; oi < FC_MAX; oi++){
    checkMain(oi).forEach(f => { (FC_OF[f.id] ||= []); if (!FC_OF[f.id].includes(oi+1)) FC_OF[f.id].push(oi+1); });
    checkAlt(oi).forEach(f => { (FC_OF[f.id] ||= []); if (!FC_OF[f.id].includes(oi+1)) FC_OF[f.id].push(oi+1); (FC_ALT[f.id] ||= []).push(oi+1); });
  }
  Object.values(FC_OF).forEach(a => a.sort((x,y) => x-y));
}
buildFC();
const scVal = (v, out) => v ? `<b>${v}</b>${out?` <span>/ 25</span>`:""}` : `<span class="pend">결과 대기</span>`;
const scoreLine = oi => { const r = S.chkscore[oi]; if (!r) return "";
  return `${r.pop?`<div class="scline">인기도 <b>${r.pop}</b> · 점수 ${scVal(r.score, true)}</div>`:""}${r.charm?`<div class="scline">코디 · 매력 <b>${r.charm}</b> · 점수 ${scVal(r.cscore, true)}</div>`:""}`; };
/* 임시저장: 인기도·매력만 먼저 적어 두고 점수는 나중에. 적은 칸만 저장 */
async function saveFcTemp(oi){
  const vals = {}; document.querySelectorAll("form[data-fcfull] input").forEach(el => { if (el.id) vals[el.id] = el.value; });
  const num = k => { const x = String(vals[k+"-"+oi] ?? "").replace(/[^\d]/g,""); return x ? +x : null; };
  const rec = {...(S.chkscore[oi]||{})}; let n = 0;
  for (const [k, f] of [["sp","pop"],["ss","score"],["cm","charm"],["cs","cscore"]]){ const v = num(k); if (v != null && v !== rec[f]){ if ((f==="score"||f==="cscore") && v > 25){ S.scErr = "점수는 25점 만점이에요"; render(); return; } rec[f] = v; n++; } }
  const nm = String(vals["ck-"+oi] ?? "").trim(); if (nm && nm !== checkName(oi)){ renameCheck(oi, nm); n++; }
  S.sheet = null; S.scErr = ""; S.scErr2 = ""; S.fcDraft = {};
  if (!n){ render(); toast("바뀐 내용이 없어요"); return; }
  S.chkscore = {...S.chkscore, [oi]:rec}; render(); toast("임시저장했어요 · 점수는 나오면 채워 주세요");
  if (db) try{ await writeSerial(`chkscore/k${oi}`, {...rec, t:Date.now(), by:"app"}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
async function saveCoordScore(oi, cv, sv){
  const charm = Number(String(cv ?? document.getElementById("cm-"+oi).value).replace(/[^\d]/g,""));
  const cscore = Number(String(sv ?? document.getElementById("cs-"+oi).value).replace(/[^\d]/g,""));
  if (!charm || !cscore){ S.scErr2 = "매력과 점수를 숫자로 넣어 주세요"; render(); return; }
  if (cscore > 25){ S.scErr2 = "점수는 25점 만점이에요"; render(); return; }
  S.scErr2 = ""; const rec = {...(S.chkscore[oi]||{}), charm, cscore};
  S.chkscore = {...S.chkscore, [oi]:rec}; delete S.optDraft["cm-"+oi]; delete S.optDraft["cs-"+oi]; render();
  toast(`코디 매력 ${charm} · 점수 ${cscore} 저장`);
  if (db) try{ await writeSerial(`chkscore/k${oi}`, {...rec, t:Date.now(), by:"app"}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
async function saveScore(oi, pv, sv){
  const pop = Number(String(pv ?? document.getElementById("sp-"+oi).value).replace(/[^\d]/g,""));
  const score = Number(String(sv ?? document.getElementById("ss-"+oi).value).replace(/[^\d]/g,""));
  if (!pop || !score){ S.scErr = "인기도와 점수를 숫자로 넣어 주세요"; render(); return; }
  if (score > 25){ S.scErr = "점수는 25점 만점이에요"; render(); return; }
  S.scErr = ""; S.chkscore = {...S.chkscore, [oi]:{...(S.chkscore[oi]||{}), pop, score}}; delete S.optDraft["sp-"+oi]; delete S.optDraft["ss-"+oi]; render();
  toast(`인기도 ${pop} · 점수 ${score} 저장`);
  if (db) try{ await writeSerial(`chkscore/k${oi}`, {...S.chkscore[oi], t:Date.now(), by:"app"}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
/* 시설 관리의 패션 체크 필터: 전체 + 선택한 번호, 펼치면 1~19 번호판(다중선택) */
function fcFilterRow(){
  const sel = S.facFcSel, open = !!S.facFcOpen, multi = S.fcMode==="multi";
  const nums = Array.from({length:FC_MAX}, (_,i) => i+1);
  return `<div class="fhead rowhead"><span class="fh-l"><span class="sublbl" style="margin:0">패션 체크</span>${sel.map(n => `<button class="chip sm on ${fcDone(n-1)?"fcdone":""}" data-fcn="${n}" title="${esc(checkName(n-1))}${fcDone(n-1)?" · 완료":""}">${n}</button>`).join("")}${!multi && sel.length===1 ? `<button class="chip sm ghostchip" data-act="fcprev" ${sel[0]<=1?'disabled style="opacity:.4"':""} aria-label="이전 패션 체크">‹ ${sel[0]>1?sel[0]-1:""}</button><button class="chip sm ghostchip" data-act="fcnext" ${sel[0]>=FC_MAX?'disabled style="opacity:.4"':""} aria-label="다음 패션 체크">${sel[0]<FC_MAX?sel[0]+1:""} ›</button>` : ""}<button class="chip sm fold" data-fexp="fc" aria-expanded="${open}">${open?"접기 ▴":"펼치기 ▾"}</button></span>
    <span class="fh-act"><button class="chip sm" data-act="fcreset" ${sel.length||open?"":'disabled style="opacity:.5"'}>초기화</button><button class="chip sm ${multi?"":"on"}" data-act="fcsingle" aria-pressed="${!multi}">단일</button><button class="chip sm ${multi?"on":""}" data-act="fcmulti" aria-pressed="${multi}">다중</button></span></div>
  ${open ? `<div class="numpad">${nums.map(n => `<button class="${sel.includes(n)?"on":""} ${fcDone(n-1)?"fcdone":""}" data-fcn="${n}" aria-pressed="${sel.includes(n)}" title="${esc(checkName(n-1))}${fcDone(n-1)?" · 완료":""}">${n}</button>`).join("")}</div>${(DATA.checksExtra||[]).length?`<div class="chips" style="margin-top:8px"><button class="chip sm ${S.fcExtra?"on":""}" data-act="fcextra" aria-pressed="${!!S.fcExtra}">모델 체크 ${(DATA.checksExtra||[]).length}</button></div>${S.fcExtra?fcExtraList():""}`:""}` : ""}`;
}
/* 패션 체크 완료(제제 2026-11-09): chkscore/k{oi}.doneRun = 그 회차 run 경로. 회차가 바뀌면 자연히 미완료로 */
const fcDone = oi => S.chkscore[oi]?.doneRun === RUN;
/* 시설에 걸린 패션 체크(대신 가능 포함)가 전부 완료면 목록 아래로. 하나라도 남으면 그대로 */
const facFcAllDone = f => { const l = FC_OF[f.id]; return !!(l && l.length && l.every(n => fcDone(n-1))); };
/* 패션 체크 보상(옷본·재료·옵션)을 의류 필터 칩으로: 완료하면 그 칩을 선택, 취소하면 선택에서 뺌(제제 2026-11-09) */
function fcRewardChip(oi){
  const c = DATA.checks[oi]; if (!c) return null;
  const raw = c.site?.option && c.site.option !== "—" ? c.site.option : String(c.reward || "").split("&")[0];
  const nk2 = x => String(x || "").replace(/\s/g, "");
  const v = nk2(al("recipe", String(raw).trim())); if (!v) return null;
  for (const [key, f] of [["pat","p"],["mat","m"],["opt","o"]]){
    const hit = DATA.clo.find(x => nk2(x[f]) === v); if (hit) return [key, hit[f]];
  }
  return null;
}
function applyFcReward(oi, on){
  const r = fcRewardChip(oi); if (!r) return "";
  const [key, val] = r, f = ROWF[key], cur = S[f] || [];
  if (on){ if (cur.includes(val)) return val; S[f] = isMulti(key) ? [...cur, val] : [val]; }
  else { if (!cur.includes(val)) return ""; S[f] = cur.filter(x => x !== val); }
  remember(); return val;
}
async function toggleFcDone(oi){
  const on = !fcDone(oi), rec = {...(S.chkscore[oi]||{})};
  if (on) rec.doneRun = RUN; else delete rec.doneRun;
  const rw = applyFcReward(oi, on);
  S.chkscore = {...S.chkscore, [oi]:rec}; render(); toast(on ? `패션 체크 ${oi+1} 완료${rw ? ` · 의류 필터에 ${rw} 선택` : ""}` : `패션 체크 ${oi+1} 완료 취소${rw ? ` · ${rw} 선택 해제` : ""}`);
  if (db) try{ await writeSerial(`chkscore/k${oi}`, {...rec, t:Date.now(), by:"app"}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
const fcTag = f => FC_OF[f.id] ? semTag(facFcAllDone(f) ? "done" : "fc", `패션 체크 ${FC_OF[f.id].join("·")}${facFcAllDone(f) ? " 완료" : ""}`) + (S.facFcSel.length && S.facFcSel.every(n => (FC_ALT[f.id]||[]).includes(n)) ? `<span class="tag">대신 가능</span>` : "") : "";
const dotFac = f => facDone(f) ? `<span class="fdot on" aria-label="완료">${ICON.check}</span>` : facPartial(f) ? `<span class="fdot part" aria-label="일부완료">${putOf(f).filter(x => needOf(f).includes(x)).length}/${needOf(f).length}</span>` : `<span class="fdot" aria-label="미완료"></span>`;
/* 패션 체크 수정 폼(기존 디자인 인라인용): 이름 / 통과 기록 / 코디 기록 */
function fcEditForm(oi){
  const ed = S.fcEdit; const any = ed.name||ed.pass||ed.coord;
  return `<form class="edl" data-fcall="${oi}">
      <div class="edl-h"><span class="fl">수정</span><div class="opts mini">${[["name","이름"],["pass","통과 기록"],["coord","코디 기록"]].map(([k,l]) => `<button type="button" class="opt ${ed[k]?"on":""}" data-fced="${k}" aria-pressed="${!!ed[k]}">${l}</button>`).join("")}</div>${any?`<button class="btn sm" type="submit" style="margin-left:auto">일괄 저장</button>`:""}</div>
      ${ed.name?`<div class="inl"><span class="fl" style="width:64px">이름</span><input class="field" id="ck-${oi}" value="${esc(S.optDraft["ck-"+oi] ?? checkName(oi))}" aria-label="새 패션 체크 이름"></div>`:""}
      ${ed.pass?`<div class="inl"><span class="fl" style="width:64px">통과 기록</span><input class="field" id="sp-${oi}" inputmode="numeric" value="${esc(S.optDraft["sp-"+oi] ?? S.chkscore[oi]?.pop ?? "")}" placeholder="인기도"><input class="field" id="ss-${oi}" inputmode="numeric" value="${esc(S.optDraft["ss-"+oi] ?? S.chkscore[oi]?.score ?? "")}" placeholder="점수 /25"></div>${S.scErr?`<div class="err">${esc(S.scErr)}</div>`:""}`:""}
      ${ed.coord?`<div class="inl"><span class="fl" style="width:64px">코디 기록</span><input class="field" id="cm-${oi}" inputmode="numeric" value="${esc(S.optDraft["cm-"+oi] ?? S.chkscore[oi]?.charm ?? "")}" placeholder="매력"><input class="field" id="cs-${oi}" inputmode="numeric" value="${esc(S.optDraft["cs-"+oi] ?? S.chkscore[oi]?.cscore ?? "")}" placeholder="점수 /25"></div>${S.scErr2?`<div class="err">${esc(S.scErr2)}</div>`:""}`:""}
      ${any?`<div class="hint">비워 둔 칸은 그대로 두고, 적은 것만 한 번에 저장해요.</div>`:`<div class="hint">바꿀 것을 고르면 입력 칸이 열려요.</div>`}
    </form>`;
}
/* 패션 체크 사이트 기준: 평론가·상금·보상 옵션·등장 조건 */
const fcSiteLine = st => !st ? "" : `<div class="check-facts">${factRows([["평론가", st.critic], ["상금", st.prize == null ? null : nf0(st.prize) + " G"], ["보상", st.option && st.option !== "—" ? st.option : st.win && st.win.replace(/\s*\/\s*/g, " · ").replace(/(액세서리|옷):\s*(\d+)/g, (m,k,id) => { const c = CLO_BY_ID.get(+id); return c ? `${k}: ${cloName(c)}` : m; })], ["등장 조건", st.appear && st.appear.replace(/^조건:\s*/, "").replace(/['‘’]/g, "")]])}</div>`;
function fcExtraList(){
  return `<div class="btextra">${(DATA.checksExtra||[]).map(c => `<div class="fccard"><div class="fc-h"><span class="fcnum">${c.site?.id ?? ""}</span><b class="fc-n">${esc(c.name)}</b></div>${fcSiteLine(c.site)}</div>`).join("")}<div class="hint">모델 체크는 사이트에만 있어요(필요 시설 없음) · 출처: KairoHistory 패션 체크</div></div>`;
}
/* 패션 체크 정보 카드: 이름 옆에 수정·주석 아이콘, 아래는 요구·보상 태그 */
function fcInfoCard(oi){
  const c = DATA.checks[oi]; if (!c) return "";
  const main = checkMain(oi), alt = checkAlt(oi), n = main.filter(facDone).length;
  const noteOpen = !!S.fcNoteOpen, hasNote = !!(alt.length || c.note);
  return `<div class="fccard">
    <div class="fc-h"><span class="fcnum">${oi+1}</span><b class="fc-n">${esc(checkName(oi))}</b>
      ${hybrid()?`<button class="iconbtn act" data-sheet="fc|${oi}" aria-label="이름·기록 수정">${ICON.pen}</button>`:""}<button class="iconbtn act ${fcDone(oi)?"on":""}" data-fcdone="${oi}" aria-label="패션 체크 ${oi+1} ${fcDone(oi)?"완료 취소":"완료"}" aria-pressed="${fcDone(oi)}">${ICON.ok}</button>${hasNote?`<button class="iconbtn act ${noteOpen?"on":""}" data-act="fcnote" aria-label="주석 보기" aria-expanded="${noteOpen}">${ICON.note}</button>`:""}
      <span class="fc-c">${main.length?`${n} / ${main.length}`:"대상 없음"}</span></div>
    <div class="check-overview">${factRows([["요구 조건",c.req],["보상",c.reward]])}</div>
    ${fcSiteLine(c.site)}
    ${scoreLine(oi) ? `<button type="button" class="linkbtn" data-fcrec="${oi}" aria-expanded="${S.fcRecOpen===oi}">${S.fcRecOpen===oi?"기록 접기":"기록 보기"}</button>${S.fcRecOpen===oi ? scoreLine(oi) : ""}` : ""}
    ${noteOpen ? `${alt.length?`<div class="altline">대신 가능: ${alt.map(f => `<span class="${facDone(f)?"altdone":""}">${esc(facName(f))}${facDone(f)?" ✓":""}</span>`).join(" · ")}</div>`:""}${c.note?`<div class="note-bar" style="margin-top:8px">${esc(c.note)}</div>`:""}` : ""}
    ${!hybrid() ? fcEditForm(oi) : ""}
  </div>`;
}

/* 신규 매장: 그 매장을 여는 옷이 있고 전부 미완료면 아직 없는 매장 (매장 이름과 시설 이름은 같게 맞춰 둠) */
const nk = x => x.replace(/\s/g,"");
function missingShopSet(){
  const ref = {};
  DATA.clo.forEach(c => { if (c.done===null) return; const o = optOf(c); if (o.likeType!=="신규 매장" || !o.likeDetail) return;
    o.likeDetail.split("/").forEach(n => { const k = nk(n); (ref[k] ||= []).push(c); }); });
  return f => { const l = ref[nk(facName(f))] || ref[nk(f.name)]; return !!l && l.every(c => !cloDone(c)); };
}
function viewFac(){
  const types = ["전체", ...Object.keys(TYPE_COLOR)];
  const typeChips = types.map(t => { const g = DATA.fac.filter(f => t==="전체" || f.type===t); return [t, t, `${g.filter(facDone).length}/${g.length}`]; });
  { const g = DATA.fac.filter(f => f.p40); typeChips.push(["우선개량", "우선개량", `40P ${g.filter(p40Done).length}/${g.length}`]); }
  let rows = DATA.fac.filter(f => S.facType==="전체" || (S.facType==="우선개량" ? f.p40 : f.type===S.facType));
  const stOf = f => facDone(f) ? "완료" : facPartial(f) ? "일부완료" : "미완료";
  if (facSts().length) rows = rows.filter(f => facSts().includes(stOf(f)));
  if (S.facFcSel.length) rows = rows.filter(f => (FC_OF[f.id]||[]).some(n => S.facFcSel.includes(n)));
  /* 항목으로 찾기: 좋음은 상태가 '전체'일 때만 아직 안 넣은 미완료 시설로 좁힘.
     미완료·일부완료·완료를 고르면 그 상태에서 상성 좋음인 시설을 전부 보여 줌(넣고 완료한 시설이 완료 탭에서 사라지던 문제, 2026-11-09) */
  const it = S.itemPick, idx = ITEMS.indexOf(it), rel = S.itemAlt || "좋음";
  const notPut = f => !facDone(f) && !putOf(f).includes(it);
  if (idx >= 0) rows = rows.filter(f => rel==="좋음" ? (f.m[idx]==="◎" && (facSts().length || notPut(f))) : rel==="보통" ? f.m[idx]==="◯" : f.m[idx]==="×");
  const q = S.facQ.trim();
  if (q) rows = rows.filter(f => facName(f).includes(q) || f.name.includes(q) || needOf(f).some(i => i.includes(q)));
  const TYPES = Object.keys(TYPE_COLOR);
  const baseSort = (a,b) => TYPES.indexOf(a.type) - TYPES.indexOf(b.type) || needOf(a).length - needOf(b).length || a.id - b.id;
  const first = {
    "이름순": (a,b) => facName(a).localeCompare(facName(b), "ko"),
    "장르순": (a,b) => TYPES.indexOf(a.type) - TYPES.indexOf(b.type) || a.id - b.id,
    "좋음 적은순": (a,b) => needOf(a).length - needOf(b).length,
    "패션 체크순": (a,b) => (FC_OF[b.id]?.length||0) - (FC_OF[a.id]?.length||0) || (FC_OF[a.id]?.[0]||99) - (FC_OF[b.id]?.[0]||99),
  }[S.facSort];
  const noStore = missingShopSet();
  /* 아직 안 연 매장이 맨 아래. 패션 체크 완료 시설은 '패션 체크순'일 때만, 안 연 매장보다는 위로 내림(제제 2026-11-09) */
  const fcSink = S.facSort==="패션 체크순" ? facFcAllDone : () => false;
  rows = [...rows].sort((a,b) => (noStore(a)?1:0) - (noStore(b)?1:0) || (fcSink(a)?1:0) - (fcSink(b)?1:0) || (first ? first(a,b) : 0) || baseSort(a,b));
  const pc = rows.filter(facPartial).length;
  const fcOne = S.facFcSel.length===1 && S.facFcSel[0] <= FC_MAX ? S.facFcSel[0]-1 : null;
  const canPut = idx >= 0 && rel==="좋음";
  return `<section class="card facility-catalog">
    ${genreRow(typeChips)}
    <div class="frowgap nol">${fcFilterRow()}</div>
    ${fcOne!=null ? fcInfoCard(fcOne) : ""}
    <div class="frowgap nol">${itemRow()}</div>
    <div class="tools toolsgap"><div class="seg">${["전체","미완료","일부완료","완료"].map(k => { const on = k==="전체" ? !facSts().length : facSts().includes(k); return `<button class="${on?"on":""}" data-fst="${k}" aria-pressed="${on}">${k}</button>`; }).join("")}</div></div>
    <div class="tools" style="margin-top:8px">${seg(["기본순","좋음 적은순","패션 체크순","장르순","이름순"], ["이름순","장르순","좋음 적은순","패션 체크순"].includes(S.facSort)?S.facSort:"기본순", "fsort")}<input class="search" id="facQ" placeholder="시설이나 항목 검색" value="${esc(S.facQ)}" aria-label="시설 검색"></div>
    ${canPut && rows.filter(notPut).length ? `<div class="bulkput"><span>보이는 ${rows.filter(notPut).length}곳에 <b>${esc(it)}</b>을(를) 넣었다면</span><button class="btn sm" data-putall="${rows.filter(notPut).map(f=>f.id).join(",")}|${esc(it)}">모두 넣었어요</button></div>` : ""}
    <div class="filterline"><span>${rows.filter(facDone).length} / ${rows.length} 완료${pc?` · 일부 ${pc}`:""}${it?` · ${esc(it)} 상성 ${rel}`:""}${fcOne!=null?` · 패션 체크 ${fcOne+1}`:S.facFcSel.length?` · 패션 체크 ${S.facFcSel.join("·")}`:""}</span></div>
    <div class="list">${rows.length ? rows.map(f => {
      const d = facDone(f), opened = S.facOpen===f.id, nm = facName(f), put = putShown(f);
      return `<div class="${opened?"open":""}">
        <div class="row ${d?"done":""} ${noStore(f)?"nostore":""}">
          <button data-tfac="${f.id}" aria-label="${esc(nm)} ${d?"미완료로":"전체 완료로"} 바꾸기">${ckFac(f)}</button>
          <button class="body" data-ofac="${f.id}" style="text-align:left">
            <div class="t"><span class="n">${esc(nm)}</span>${noStore(f)?`<span class="tag nostore">아직 없는 매장</span>`:""}${typeTag(f.type)}${facPartial(f)?semTag("part","일부완료"):""}${fcTag(f)}${f.p40?p40Tag(f):""}</div>
          </button>
          ${canPut && notPut(f) ? `<button class="btn sm ghost" data-put="${f.id}|${esc(it)}">넣었어요</button>` : ""}
          ${opened && hybrid() ? `<button class="iconbtn act" data-sheet="fac|${f.id}" aria-label="${esc(nm)} 이름 수정">${ICON.pen}</button>` : ""}
          <button class="iconbtn" data-ofac="${f.id}" aria-label="자세히">${ICON.chev}</button>
        </div>
        <div class="rowpills pills">${needOf(f).map(i=>`<button class="pill ${put.includes(i)?"need":"must"}" data-put="${f.id}|${esc(i)}" aria-pressed="${put.includes(i)}">${put.includes(i)?"✓ ":""}${i}</button>`).join("")||'<span class="hint">상성 좋음 항목 없음</span>'}</div>
        ${opened ? `<div class="detail item-detail">${facDetail(f)}${hybrid() ? "" : facRenameForm(f)}</div>` : ""}
      </div>`; }).join("") : `<div class="empty">조건에 맞는 시설이 없어요</div>`}</div>
  </section>`;
}

/* 시설 상세(2026-11-07): 옷 상세와 같은 틀. 사이트 값 → 상성 보통·나쁨 · 패션 체크 · 효과 · 40P. 상성 좋음은 행 아래 칩에 이미 있어서 뺌 */
function facDetail(f){
  const st = f.site || {};
  const money = v => v == null ? null : Number(v).toLocaleString("ko-KR") + " G";
  const metrics = metricStrip([["크기", st.w != null && st.h != null ? `${st.w} × ${st.h}` : null], ["건설비", money(st.cost)], ["유지비", money(st.upkeep)], ["매력", st.charm], ["인기", st.pop], ["평판", st.fame]], "시설 기준 수치");
  const checks = (FC_OF[f.id] || []).map(n => `<li><button class="text-action" data-fcn="${n}">${n}. ${esc(checkName(n-1))}</button>${(FC_ALT[f.id] || []).includes(n)?'<span class="inline-progress">대신 가능</span>':""}</li>`).join("");
  return `${metrics}<div class="detail-layout"><div class="detail-column">${infoSection("시설 정보",factRows([["구분",[st.group,st.category].filter(Boolean).join(" · ")],["효과",st.effect]]))}${checks ? infoSection("이 시설이 필요한 패션 체크", `<ul class="info-list">${checks}</ul>`) : ""}${f.p40?infoSection("우선개량",`<div class="upgrade-line">${p40Tag(f)}<p>40P로 이용 포인트 2</p></div>`):""}</div><div class="detail-column">${infoSection("아이템 상성",`<div class="pair-grid"><div class="pair-group"><h4>상성 보통 ◯</h4>${textList(goodOf(f))}</div><div class="pair-group negative"><h4>상성 나쁨 ×</h4>${textList(badOf(f))}</div></div>`)}</div></div><div class="detail-footer"><span class="source-caption">${f.site?.preview?"화면 검토용 예시 수치":f.site?"기준값: KairoHistory 시설":"기준값: 기존 노트"}</span><button class="text-action" data-sheet="fac|${f.id}">시설 이름 수정</button></div>`;
}
/* 게임에서 확인할 것: 경고 아이콘 → 펼침. 확인한 항목은 meta/verify {done:{k:true}}에 저장 */
const verifyLeft = () => (DATA.verify||[]).filter(v => !S.verifyDone?.[v.k]);
function verifyBtn(){ const n = verifyLeft().length, o = !!S.verifyOpen;
  return `<button class="iconbtn warnbtn ${n?"has":""} ${o?"on":""}" data-act="verify" aria-expanded="${o}" aria-label="게임에서 확인할 것 ${n}건" title="게임에서 확인할 것">${ICON.warn}${n?`<b>${n}</b>`:""}</button>`; }
function verifyBox(){
  const list = DATA.verify||[], done = S.verifyDone||{};
  const nm = (id, sh) => { const c = DATA.clo.find(x => x.id===id); return c ? `<button class="pill vchip" data-sheet="clo|${id}">${esc(cloName(c))}${sh?`<span class="hint">${esc(c[sh]||"-")}</span>`:""}</button>` : ""; };
  return `<div class="vbox"><div class="vbox-h">${ICON.warn}<b>게임에서 확인할 것</b><span class="hint">${verifyLeft().length} / ${list.length}</span></div>
    ${list.map(v => { const on = !!done[v.k]; return `<div class="vrow ${on?"done":""}"><button class="ck ${on?"on":""}" data-vdone="${v.k}" aria-pressed="${on}" aria-label="${esc(v.t)} 확인함">${on?ICON.check:""}</button>
      <div class="vbody"><div class="vt">${esc(v.t)}</div>${v.n?`<div class="hint">${esc(v.n)}</div>`:""}<div class="pills">${(v.ids||[]).map(id => nm(id, v.sh)).join("")}${(v.names||[]).map(x => `<span class="pill">${esc(x)}</span>`).join("")}</div></div></div>`; }).join("")}
  </div>`;
}
/* 필요한 옵션: counts{옵션: 개수} + picks[옷 번호](2026-11-09 추가, 제제 승인). picks가 없는 예전 문서도 그대로 읽힘 */
async function saveOptCnt(cnt, picks = S.optPicks || []){
  S.optCnt = cnt; S.optPicks = picks; render();
  if (db) try{ await writeSerial("ui/optcnt", {counts:cnt, picks, t:Date.now()}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
async function toggleVerify(k){
  S.verifyDone = {...(S.verifyDone||{}), [k]: !S.verifyDone?.[k]}; render();
  if (db) try{ await writeSerial("meta/verify", {done:S.verifyDone, t:Date.now()}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
/* 다른 가게 직원 배틀(사이트에만 있음, 노트 기록 없음): 참가비·등장 조건·보상만 */
function btExtraList(){
  return `<div class="btextra">${(DATA.battlesExtra||[]).map(b => `<div class="fccard ${btDone(btKeyX(b))?"btdone":""}"><div class="fc-h"><b class="fc-n">${esc(b.name)}</b>${btDoneBtn(btKeyX(b), b.name)}${b.site?.fee!=null?`<span class="fc-c">${nf0(b.site.fee)}G</span>`:""}</div>${btSiteBlock({...b.site, fee:null}, {noSrc:true})}</div>`).join("")}<div class="hint">다른 가게 직원 배틀은 사이트에만 있어 기록 칸은 없고, ✓로 승리만 체크해요 · 출처: KairoHistory 배틀</div></div>`;
}
function battleRow(){
  const sel = S.cloBt, o = S.btOpen !== false, on = !!S.cloBtView;
  return `<div class="fhead rowhead"><span class="fh-l"><span class="sublbl" style="margin:0"><i class="rdot r-bt" aria-hidden="true"></i>전투</span><span class="hint">승리 ${DATA.battles.filter((b,i) => btDone(i)).length}/${DATA.battles.length}</span>${sel!=null&&DATA.battles[sel]?`<button class="chip sm on" data-cbt="${sel}">${esc(bShort(sel))} ×</button>`:""}<button class="chip sm fold" data-act="btopen" aria-expanded="${o}">${o?"접기 ▴":"펼치기 ▾"}</button></span>
    <span class="fh-act">${verifyBtn()}<button class="switch ${on?"on":""}" data-act="btview" role="switch" aria-checked="${on}" ${sel==null?'disabled':''}><i aria-hidden="true"></i>전투 리스트</button></span></div>
  ${o ? `<div class="chips cfoldchips">${DATA.battles.map((b,i) => `<button class="chip ${sel===i?"on":""} ${btDone(i)?"fcdone":""}" data-cbt="${i}" aria-pressed="${sel===i}" title="${btDone(i)?"승리":""}">${btDone(i)?ICON.ok:""}${esc(bShort(i))}</button>`).join("")}${(DATA.battlesExtra||[]).length?`<button class="chip ${S.btExtra?"on":""}" data-act="btextra" aria-pressed="${!!S.btExtra}">다른 가게 직원 ${(DATA.battlesExtra||[]).filter(b => btDone(btKeyX(b))).length}/${(DATA.battlesExtra||[]).length}</button>`:""}</div>` : ""}
  ${o && S.btExtra ? btExtraList() : ""}`;
}
const gsOf = name => { const c = DATA.clo.find(x => cloName(x)===name || x.n===name); const g = c && GS_BY[c.id]; return g ? {q:g[1], charm:g[2]} : null; };
const btOverall = res => { const v = ["q","c","s"].map(k => res[k]).filter(Boolean); if (!v.length) return null;
  const ok = v.filter(x => x==="성공").length; if (ok===3) return {cls:"green", t:"전체 성공"}; if (ok) return {cls:"amber", t:`부분 성공 ${ok}/3`}; return {cls:"red", t:"실패"}; };
async function btSave(i, rec){ S.battleRec = {...S.battleRec, [i]:rec}; render(); if (db) try{ await writeSerial(`battles/b${i}`, rec); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); } }
function btTotals(i){ const r = bRec(i), b = DATA.battles[i]; const sl = btSlots(i).map(([k]) => r.slots?.[k] || {});
  const sum = f => { const v = sl.reduce((a,x) => a + (Number(x[f])||0), 0); return v || null; }; return {q:sum("q"), c:sum("charm"), s:r.stat ?? null}; }
const btTryRow = (t, n, b) => `<div class="bttry-row"><span class="k">${n+1}차</span><span class="btres">${[["q","품질"],["c","매력"],["s",esc(b.stat)]].map(([k,l]) => `<span class="v">${l} <b>${t[k]!=null?nf0(+t[k]):"-"}</b>${t.res?.[k]?`<i class="${t.res[k]==="성공"?"ok":"ng"}">${t.res[k]}</i>`:""}</span>`).join("")}</span><span class="d">${fmtT(t.t)}</span></div>${t.wear?.length ? `<div class="bttry-wear">${t.wear.map(x => `<div><span class="k">${(BT_SLOTS.find(s => s[0]===x.k)||[])[1]||""}</span><span class="n">${esc(x.n||"-")}</span><span class="v">품질 <b>${x.q!=null?nf0(+x.q):"-"}</b></span><span class="v">매력 <b>${x.charm!=null?nf0(+x.charm):"-"}</b></span></div>`).join("")}</div>` : ""}`;
/* 전투 사이트 기준(제제 원칙: 기준값 먼저): 요청·의류 조건·기준값(품질·매력·능력치, 코디 합계)·참가비·보상, 일치 의류·추천 세트 */
/* 보상 글 정리: "해금 캐릭터: / 오립우 / 해금 시설: / 현관 / 해금 시설: / 귀여운 바닥" → 해금 캐릭터 오립우 · 해금 시설 현관, 귀여운 바닥 */
function fmtWin(w){
  if (!w) return null; const out = []; let cur = null;
  String(w).split(/\s*\/\s*/).filter(Boolean).forEach(t => { const m = t.match(/^([^:]+):\s*(.*)$/);
    if (m){ const k = m[1].trim(); cur = out.find(x => x.k === k) || (out.push({k, v:[]}), out[out.length-1]); if (m[2]) cur.v.push(m[2].trim()); }
    else if (cur) cur.v.push(t.trim()); else out.push({k:"", v:[t.trim()]}); });
  return out.map(x => (x.k ? `${x.k} ` : "") + x.v.join(", ")).join(" · ");
}
const btAppear = a => a ? String(a).replace(/^조건:\s*/, "").replace(/^배틀:\s*(.+)$/, "$1 승리 후") : null;
const btStatName = (st, fb) => fb || (String(st?.request || "").match(/(\S+)\s*능력도/) || [])[1] || "능력치";
/* 전투 상세(제제 2026-11-10 정리): 조건·보상 한 칸 / 맞는 의류·추천 세트·상대 코디 / 상대 기준과 내 기록(결과 버튼 포함).
   예전 '내 전투 준비'(노트 조건·보상 옵션·점원 능력)와 합계 줄은 위와 겹쳐서 없앰. 요청 문장도 조건+능력과 같은 말이라 뺌 */
function btSiteBlock(st, o = {}){
  if (!st) return "";
  const {mine, stat, res, i, noSrc} = o, rec = mine != null;
  const values = st.values || [], sn = btStatName(st, stat);
  const keys = ["q","c","s"], labels = ["품질", "매력", sn];
  const rsBtn = (k, l) => { const v = res?.[k]; return `<button class="rs ${v==="성공"?"ok":v==="실패"?"ng":""}" data-btres="${i}|${k}" aria-label="${l} 결과: ${v||"미정"}">${v||"결과"}</button>`; };
  const comparisons = values.map((v,n) => v == null ? "" : `<div class="comparison-row ${rec?"":"norec"}"><span>${labels[n]}</span><strong>${nf0(v)}</strong>${rec ? `<span>${mine[n] == null ? "-" : nf0(mine[n])}</span>${mine[n] == null ? "<span></span>" : `<span class="${mine[n]>=v?"bt-ok":"bt-ng"}">${mine[n]>=v?"+":"−"}${nf0(Math.abs(mine[n]-v))}</span>`}<span>${rsBtn(keys[n], labels[n])}</span>` : ""}</div>`).join("");
  const cond = (st.clothCond || "").split(";").map(x => x.trim()).filter(Boolean).map(x => { const m = x.match(/^([^:]+):\s*(.*)$/); return m ? [m[1], m[2]] : ["조건", x]; });
  const facts = factRows([...(cond.length ? [["의류 조건", cond.map(x => x[1]).join(" · ")]] : []), ...(values[2] != null || stat ? [["능력", sn]] : []), ["보상", fmtWin(st.win)], ["참가비", st.fee == null ? null : nf0(st.fee) + " G"], ["등장", btAppear(st.appear)]]);
  const clothes = [...new Map((st.clothes || []).map(x => ({x,c:CLO_BY_ID.get(x.id)})).filter(x => x.c).map(x => [x.c.id,x])).values()].sort((a,b) => cloDone(b.c)-cloDone(a.c));
  /* 추천 세트: 같은 번호의 코디 세트가 있으면 구성 옷과 완료 상태까지, 누르면 코디 > 코디 세트의 그 세트로(2026-11-09) */
  const sets = (st.sets || []).map(x => { const set = (DATA.sets || []).find(s => s.id===x.setId), inf = set && setInfo(set);
    if (!inf) return `<li>세트 ${x.setId} · ${esc(x.result || "")}</li>`;
    return `<li class="btset ${inf.left?"":"is-done"}"><button type="button" class="btset-h" data-gset="${x.setId}" title="코디 세트에서 보기"><strong>세트 ${x.setId}</strong><span>${esc([set.genre, set.sub].filter(Boolean).join(" · "))}</span><span>${esc(x.result || "")}</span><span class="btset-c">${inf.left?`${inf.done}/${inf.total} 완료`:"완성"} ›</span></button>
      <ul class="btset-items">${inf.items.map(it => it.c ? `<li><span class="inline-state ${cloDone(it.c)?"is-done":""}">${cloDone(it.c)?"✓":"○"}</span>${esc(cloName(it.c))}</li>` : `<li><span class="inline-state">·</span>${esc(it.name || "#"+it.id)}</li>`).join("")}</ul></li>`; });
  return `<div class="battle-detail"><div class="detail-layout"><div class="detail-column">${infoSection("조건과 보상", facts)}</div><div class="detail-column">${clothes.length?infoSection(`조건에 맞는 의류 · ${clothes.filter(x=>cloDone(x.c)).length}/${clothes.length} 완료`,`<ul class="info-list">${clothes.map(({c})=>`<li><span class="inline-state ${cloDone(c)?"is-done":""}">${cloDone(c)?"✓":"○"}</span>${esc(cloName(c))}</li>`).join("")}</ul>`):""}${sets.length?infoSection("추천 세트",`<ul class="info-list btsets">${sets.join("")}</ul>`+`<p class="section-note">사이트 추천입니다. 세트 조건 결합은 미확정이에요. 세트를 누르면 코디 세트로 가요.</p>`):""}${st.opponentOutfit?referenceBlock(`opponent-${st.id}`,"상대 코디",`<p>${esc(st.opponentOutfit.replace(/\s*#\d+/g,""))}</p>`):""}</div></div>${comparisons?`<div class="btcompare">${infoSection(rec?"상대 기준과 내 기록":"상대 기준",`<div class="comparison-table ${rec?"":"norec"}"><div class="comparison-label ${rec?"":"norec"}"><span>항목</span><span>상대</span>${rec?"<span>내 기록</span><span>차이</span><span>결과</span>":""}</div>${comparisons}</div>`)}</div>`:""}${noSrc?"":`<p class="source-caption">${st.preview?"화면 검토용 예시 수치":"기준값: KairoHistory 배틀·코디 세트"}</p>`}</div>`;
}
function battleCard(i){
  const b = DATA.battles[i], r = bRec(i), cs = bCond(i), noteOpen = !!S.btNote;
  const rec = DATA.clo.filter(c => battleOf(c)===i).length;
  const slots = btSlots(i).map(([k,l,j]) => { const v = r.slots?.[k] || {}; const n = v.n ?? (b.ex[j]||""); return {k, l, n, charm:v.charm, q:v.q}; }).filter(x => x.n || x.charm || x.q);
  const sum = slots.reduce((a,x) => a + (Number(x.charm)||0), 0), qsum = slots.reduce((a,x) => a + (Number(x.q)||0), 0);
  const res = r.res || {}, ov = btOverall(res) || (r.result ? {cls:r.result==="성공"?"green":"red", t:r.result} : null);
  const tries = r.tries || [], prev = r.prev || [];
  return `<div class="fccard btcard">
    <div class="fc-h"><b class="fc-n">${esc(b.name)}</b>
      <button class="iconbtn act" data-sheet="bt|${i}" aria-label="전투 기록 수정">${ICON.pen}</button>${btDoneBtn(i, b.name)}${b.note?`<button class="iconbtn act ${noteOpen?"on":""}" data-act="btnote" aria-label="코멘트 보기" aria-expanded="${noteOpen}">${ICON.note}</button>`:""}
      ${ov?`<span class="tag ${ov.cls}">${ov.t}</span>`:""}<span class="fc-c">추천 ${rec}벌</span></div>
    ${btSiteBlock(b.site, {mine:[qsum||null, sum||null, r.stat ?? null], stat:b.stat, res, i})}
    ${slots.length || r.stat || tries.length || prev.length || r.res ? `<div class="btslots"><div class="btslots-h">내 코디</div>${slots.map(x => `<div class="btslot"><span class="k">${x.l}</span><span class="n">${esc(x.n||"-")}</span>${x.q?`<span class="v">품질 <b>${nf0(+x.q)}</b></span>`:""}${x.charm?`<span class="v">매력 <b>${nf0(+x.charm)}</b></span>`:""}</div>`).join("")}
      <div class="btslot sum"><span class="hint">합계와 결과는 위 표에 있어요</span><button class="btn sm ghost bttry" data-bttry="${i}" title="지금 합계와 결과를 아래 기록에 남기고 결과를 비워요">재시도</button></div>
      ${tries.length || prev.length ? `<button type="button" class="linkbtn" data-btrec="${i}" aria-expanded="${!!S.btRecOpen?.[i]}">${S.btRecOpen?.[i]?"기록 접기":`시도 기록 보기 ${tries.length + prev.length}건`}</button>` : ""}
      ${(tries.length || prev.length) && S.btRecOpen?.[i] ? `<div class="bttries">${tries.map((t,n) => btTryRow(t, n, b)).join("")}${prev.length ? `<div class="prevfold"><button type="button" class="prevbtn" data-btprev="${i}" aria-expanded="${!!S.btPrevOpen?.[i]}">이전 회차 기록 ${prev.length}건 ${S.btPrevOpen?.[i]?"접기 ▴":"보기 ▾"}</button></div>${S.btPrevOpen?.[i] ? prev.map((t,n) => btTryRow(t, n, b)).join("") : ""}` : ""}</div>` : ""}
    </div>` : ""}
    ${noteOpen && b.note ? `<div class="note-bar" style="margin-top:8px">${esc(b.note)}</div>` : ""}
    ${!hybrid() ? `<div class="edl" style="margin-top:10px">${btForm(i)}</div>` : ""}
  </div>`;
}
/* 조건에 셋업이 있으면 하의는 쓰지 않음 */
/* 부위: 사이트 옷 종류로 나눔(상의·셋업 / 하의 / 아우터 / 액세서리) */
const SLOT_KIND = {t:["상의","셋업"], b:["하의"], o:["아우터"], a:["액세서리"]};
const btSlots = i => BT_SLOTS.map(([k,l],j) => [k,l,j]).filter(([k]) => !(k==="b" && (bCond(i).includes("셋업") || bCond(i).includes("원세트"))));
/* 고를 수 있는 옷: 추천 모드는 이 전투 장르(또는 이 전투로 추천한 옷) 중 조건이 하나 이상 맞는 것, 전체 모드는 부위만 맞으면 전부 */
function btOptions(i, k){
  const cs = bCond(i), all = !!S.btListAll;
  /* 장르는 항상 전투 장르와 같아야 함(특기는 장르 없음 → 전부). 전체 모드는 조건만 안 봄 */
  const inGenre = c => BATTLE_GENRE[i] ? (bGenreIdx(c)===i || battleOf(c)===i) : true;
  return DATA.clo.filter(c => SLOT_KIND[k].includes(c.site?.kind) && inGenre(c) && (all || !cs.length || cs.some(t => termHit(c, t))))
    .sort((a,b) => cs.filter(t => termHit(b,t)).length - cs.filter(t => termHit(a,t)).length || a.id - b.id);
}
function btForm(i){
  const b = DATA.battles[i], r = bRec(i), dr = S.btDraft?.[i] || {};
  const val = (id, base) => dr[id] ?? base;
  return `<form class="ed full btform" data-btfull="${i}">
    <div class="btf-top">
      <label class="btf-c"><span>조건</span><input class="field sm" id="bc-${i}" value="${esc(val(`bc-${i}`, bCond(i).join("/")))}" placeholder="${esc(b.cond)}"></label>
      <label class="btf-s"><span>${esc(b.stat)}</span><input class="field sm num" id="bs-${i}" inputmode="numeric" value="${esc(val(`bs-${i}`, r.stat ?? ""))}" placeholder="수치"></label>
    </div>
    <div class="btf-h"><span class="sublbl" style="margin:0">옷</span><span class="seg mini"><button type="button" class="${S.btListAll?"":"on"}" data-btlist="0">전투 추천</button><button type="button" class="${S.btListAll?"on":""}" data-btlist="1">전체</button></span><span class="btf-cols"><span>품질</span><span>매력</span></span></div>
    ${btSlots(i).map(([k,l,j]) => { const v = r.slots?.[k] || {}; const n = val(`btn-${k}-${i}`, v.n ?? (b.ex[j]||"")); const opts = btOptions(i, k); const g = gsOf(n);
      const names = opts.map(c => cloName(c)); const has = !n || names.includes(n);
      return `<div class="btf-row"><span class="btf-k">${l}</span>
        <select class="field sm" id="btn-${k}-${i}" aria-label="${l}"><option value="">선택 안 함</option>${has?"":`<option selected>${esc(n)}</option>`}${opts.map(c => { const nm = cloName(c), h = bCond(i).filter(t => termHit(c,t)).length; return `<option value="${esc(nm)}" ${nm===n?"selected":""}>${esc(nm)}${bCond(i).length?` · ${h}/${bCond(i).length}`:""}</option>`; }).join("")}</select>
        <input class="field sm num" id="btq-${k}-${i}" inputmode="numeric" maxlength="5" value="${esc(val(`btq-${k}-${i}`, v.q ?? ""))}" placeholder="${g?g.q:""}" aria-label="${l} 품질">
        <input class="field sm num" id="btc-${k}-${i}" inputmode="numeric" maxlength="5" value="${esc(val(`btc-${k}-${i}`, v.charm ?? ""))}" placeholder="${g?g.charm:""}" aria-label="${l} 매력"></div>`; }).join("")}
    <div class="hint">흐린 숫자는 노트의 옷 매력 현황 값이에요. ${S.btListAll?"전체: 이 전투 장르의 옷이 조건과 상관없이 모두 나와요.":"전투 추천: 이 전투 장르 중 조건이 하나 이상 맞는 옷만 나와요."}</div>
    <div class="ed-act">${hybrid()?`<button class="btn ghost" type="button" data-sheet="close">취소</button>`:""}<button class="btn" type="submit">변경사항 저장</button></div>
  </form>`;
}
/* 목록 전환 전에 입력 중인 값을 잡아 둠 */
function btKeepDraft(i){ const f = document.querySelector(`form[data-btfull="${i}"]`); if (!f) return; const dr = {};
  f.querySelectorAll("input,select").forEach(el => { if (el.type==="radio"){ if (el.checked) dr[el.name] = el.value; } else if (el.id) dr[el.id] = el.value; });
  S.btDraft = {...(S.btDraft||{}), [i]:dr}; }
async function saveBtFull(i){
  const f = document.querySelector(`form[data-btfull="${i}"]`); const vals = {};
  f.querySelectorAll("input,select").forEach(el => { if (el.type==="radio"){ if (el.checked) vals[el.name] = el.value; } else if (el.id) vals[el.id] = el.value.trim(); });
  const num = v => { const x = String(v||"").replace(/[^\d]/g,""); return x ? +x : null; };
  const b = DATA.battles[i], old = bRec(i), rec = {}; ["res","tries","result"].forEach(k => { if (old[k] !== undefined) rec[k] = old[k]; });
  const cond = vals["bc-"+i]; if (cond && cond !== b.cond) rec.cond = cond;
  const st = num(vals["bs-"+i]); if (st != null) rec.stat = st;
  const slots = {}; BT_SLOTS.forEach(([k],j) => { if (vals[`btn-${k}-${i}`] === undefined) return; const n = vals[`btn-${k}-${i}`] || "", ch = num(vals[`btc-${k}-${i}`]), q = num(vals[`btq-${k}-${i}`]);
    if (n || ch != null || q != null){ slots[k] = {n}; if (ch != null) slots[k].charm = ch; if (q != null) slots[k].q = q; } else if (b.ex[j]) slots[k] = {n:""}; });
  if (Object.keys(slots).length) rec.slots = slots;
  S.sheet = null; if (S.btDraft) delete S.btDraft[i];
  if (JSON.stringify(bRec(i)) === JSON.stringify(rec)){ render(); toast("바뀐 내용이 없어요"); return; }
  S.battleRec = {...S.battleRec, [i]:rec}; render(); toast(`${b.name} 기록을 저장했어요`);
  if (db) try{ await writeSerial(`battles/b${i}`, rec); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
/* 옷 상세 맨 위: 사이트 기준값 먼저(제제 원칙), 기록한 품질·매력(2026-10-30 영상)은 "기록 보기"로 연다 */
function cloSiteBlock(c){
  const st = c.site || {};
  const money = v => v == null ? null : Number(v).toLocaleString("ko-KR") + " G";
  const rev = positive => DATA.clo.filter(x => (positive ? x.site?.goodIds : x.site?.badIds)?.includes(c.id)).map(x => x.id);
  const related = positive => [...new Set([...(positive ? st.goodIds || [] : st.badIds || []), ...rev(positive)])].map(id => CLO_BY_ID.get(id)).filter(Boolean);
  const pairing = (title, list, tone) => list.length ? `<div class="pair-group ${tone}"><h4>${title}<span>${list.length}벌</span></h4><ul>${list.map(x => `<li><span class="inline-state ${cloDone(x)?"is-done":""}" aria-label="${cloDone(x)?"완료":"미완료"}">${cloDone(x)?"✓":"○"}</span><span>${esc(cloName(x))}</span></li>`).join("")}</ul></div>` : "";
  const styleRows = Object.entries(st.styles || {}).sort((a,b) => b[1]-a[1]);
  const g = GS_BY[c.id], recordOpen = S.cloRecOpen === c.id;
  const recipe = factRows([["옷본", c.p || "없음"], ["재료", c.m || "없음"], ["옵션", c.o || "없음"]]);
  const basic = factRows([["종류", [st.kind, st.genre && layGName(st.genre), st.sub].filter(Boolean).join(" · ")], ["색", c.col || "미확인"], ["계절", c.s || "미확인"], ["손님 성향", st.cust], ["태그", c.tg]]);
  const newInfo = newLines(c);
  const battle = battleOf(c) >= 0 ? factRows([["전투 추천", DATA.battles[battleOf(c)].name + (S.cbattle[c.id] ? "" : " · 자동")]]) : "";
  const good = related(true), bad = related(false);
  const metrics = metricStrip([["품질", st.q], ["인기", st.pop], ["가격", money(st.price)], ["재고", st.stock], ["Tier", st.tier]], "의류 기준 수치");
  const records = g ? `<button class="text-action" data-clorec="${c.id}" aria-expanded="${recordOpen}">${recordOpen?"내 기록 접기":"내 기록 보기"}</button>${recordOpen ? factRows([["품질", g[1]], ["매력", g[2]], ["확인일", "2026-10-30 게임 화면"]]) : ""}` : "";
  return `${metrics}<div class="detail-layout clothing-layout">
    <div class="detail-column">${infoSection("만드는 법", recipe)}${newInfo.length ? infoSection("새로 열리는 것", factRows(newInfo)) : ""}${battle ? infoSection("전투", battle) : ""}</div>
    <div class="detail-column">${cloNeedBlock(c) || '<p class="info-empty">연결된 손님 요청이나 코디 세트가 없어요.</p>'}</div>
    <div class="detail-column">${infoSection("의류 정보", basic)}${styleRows.length ? infoSection("스타일 점수", `<div class="style-scores">${styleRows.map(([k,v]) => `<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("")}</div>`) : ""}</div>
  </div>${good.length || bad.length ? `<div class="detail-secondary">${infoSection("상의·하의 궁합", `<div class="pair-grid">${pairing("잘 어울리는 옷",good,"positive")}${pairing("피해야 할 조합",bad,"negative")}</div>${st.pairCut?'<p class="section-note">위키에서 일부 조합이 생략되어 있어요.</p>':""}`)}</div>` : ""}<div class="detail-footer"><span class="source-caption">${c.site?.preview ? "화면 검토용 예시 수치" : c.site ? "기준값: KairoHistory 옷 목록" : "기준값: 기존 노트"}</span>${records}</div>${c.x ? referenceBlock(`clo-${c.id}-notes`, "기존 추가옵션 메모", `<p>${esc(withNames(c.x))}</p>`) : ""}`;
}
/* 옷 상세: 이 옷이 필요한 곳 · 옵션 얻는 곳(2026-11-06 개편). 기준 표와 진행 상태를 이어서 보여 주기만 하고 따로 저장하지 않음 */
const optToks = v => String(v||"").split(/[,、·\/]/).map(x => x.replace(/^★\s*/,"").trim()).filter(Boolean);
const _optSrc = {};
function optSources(o){
  if (!o || o==="없음") return [];
  if (_optSrc[o]) return _optSrc[o];
  const has = v => optToks(v).includes(o), out = [];
  (DATA.checks||[]).forEach((k, i) => { if (has(k.site?.option)) out.push(`패션 체크 ${i+1}`); });
  (DATA.checksExtra||[]).forEach(k => { if (has(k.site?.option)) out.push(`모델 체크 ${k.site.id}`); });
  (DATA.contests||[]).forEach(k => { if (has(k.option)) out.push(String(k.name||"콘테스트").replace(/\s+/g," ")); });
  const ref = key => ((DATA.refTables||[]).find(t => t.key===key)?.rows || []);
  ref("site_exams").forEach(r => { if (has(r.c3)) out.push(`자격시험 ${r.c1||""}`.trim()); });
  ref("site_studies").forEach(r => { if (has(r.c2)) out.push(`스터디 ${r.c0||""}`.trim()); });
  return (_optSrc[o] = [...new Set(out)]);
}
function cloNeedBlock(c){
  const names = new Set([c.n, cloName(c)]);
  const sets = (c.site?.sets || []).map(id => (DATA.sets || []).find(x => x.id === id)).filter(Boolean).map(setInfo).sort((a,b) => (a.left || 99) - (b.left || 99));
  const groups = [];
  groups.push(usageRow("코디 세트", sets.map(x => `<span>세트 ${x.s.id}</span><span class="inline-progress ${x.left === 0 ? "is-done" : ""}">${x.done}/${x.total} 완료${x.left === 1 ? " · 1벌 남음" : ""}</span>`)));
  const battles = DATA.battles.flatMap((b,i) => (b.site?.clothes || []).some(x => x.id === c.id) ? [esc(bShort(i))] : []);
  groups.push(usageRow("챌린지", battles));
  const guests = [...new Set(DATA.coord.filter(r => coordHasClo(r, c)).map(coordName))];
  groups.push(usageRow("손님 요청", guests.map(esc)));
  const mannequins = [];
  for (let i = 0; i < mqN(); i++) if (Object.values(mqOf(i).outfit || {}).includes(c.id)) mannequins.push(`마네킹 ${i+1}`);
  groups.push(usageRow("세운 코디", mannequins));
  const uses = groups.filter(Boolean).join("");
  const sources = optSources(c.o);
  return `${uses ? infoSection("이 옷이 필요한 곳", uses) : ""}${sources.length ? infoSection(`${c.o} 얻는 곳`, textList(sources)) : ""}`;
}
/* 랭크 진행 다음 대상(제제 2026-11-09): 장르 줄에서 고른(=연) 장르를 기준으로, 랭크 순서상 아직 안 연 첫 장르의 단계.
   그 단계의 장르·새 옷 베이스(옷본)·새 스터디 재료/옵션을 칩에서 은은하게 표시. 패션 체크 보상은 완료하면 자동 선택이라 제외 */
/* 현재 랭크: runs/rN/ui/now.rank (제제 2026-11-09). 정하면 랭크+1 단계부터, 안 정했으면 장르 줄 기준.
   그 단계의 점선 칩(장르·옷본·재료·옵션)을 전부 선택하면 다음 단계로 넘어감 */
/* 게임 랭크는 0부터 10까지(제제 2026-11-09). 사이트 진행 표는 1부터 11까지라 사이트 번호 = 게임 랭크 + 1.
   저장(ui/now.rank)과 화면 표시는 게임 랭크, 진행 표를 찾을 때만 +1 */
const RANK_MAX = 10;
const curRank = () => { const v = S.now?.rank; return v === 0 || v ? +v : null; };
const gRank = siteRank => siteRank - 1;
function nextRankStep(avail){
  const steps = (DATA.rankPlan || []).filter(p => p.rank != null).sort((a,b) => a.rank - b.rank), R = curRank(), opened = S.cloCat || [];
  let list;
  if (R != null) list = steps.filter(p => gRank(p.rank) > R);
  else { if (!opened.length) return null; const i = steps.findIndex(p => !opened.includes(p.genre)); list = i < 0 ? [] : steps.slice(i); }
  const allSel = st => { const t = nextTargets(st, avail); return Object.entries(t).every(([k, l]) => l.every(v => (S[ROWF[k]] || []).includes(v))); };
  return list.find(st => !allSel(st)) || null;
}
function rankPanel(){
  const R = curRank();
  return `<div class="rankpick"><div class="sublbl" style="margin:0 0 8px">현재 랭크 <span class="hint">${R != null ? `${R}랭크` : "아직 안 정함"} · 게임 화면 숫자(0~10) · 10을 고르면 이 버튼은 사라져요</span></div>
    <div class="numpad rankpad">${Array.from({length: RANK_MAX + 1}, (_, i) => i).map(n => `<button type="button" class="${n===R?"on":""}" data-rankset="${n}" aria-pressed="${n===R}">${n}</button>`).join("")}</div>
    ${R != null ? `<button type="button" class="linkbtn" data-rankclr="1" style="margin-top:8px">랭크 지우기</button>` : ""}</div>`;
}
function nextTargets(step, avail){
  const out = {cat:[], pat:[], mat:[], opt:[]}; if (!step) return out;
  const nk2 = x => String(x || "").replace(/\s/g, "");
  const find = (key, v) => (avail[key] || []).find(k => nk2(k) === nk2(al("recipe", v)));
  if ((avail.cat || []).includes(step.genre)) out.cat.push(step.genre);
  const b = find("pat", step.base); if (b) out.pat.push(b);
  (step.studyItems || []).forEach(v => { for (const key of ["mat","opt"]){ const k = find(key, v); if (k){ out[key].push(k); break; } } });
  return out;
}
/* 목록 행 태그 순서(제제 2026-11-09): [장르] [추가옵션] [챌린지 = 전투 추천] [코디 추천: 손님 요청·마네킹·코디 세트] */
const isChal = c => isBtKind(c) || DATA.battles.some(b => (b.site?.clothes || []).some(x => x.id === c.id));
function cloUseTags(c){
  const names = new Set([c.n, cloName(c)]), out = [];
  const um = (k, l) => `<span class="usemark" style="--c:${SEM_COLOR[k]}"><i aria-hidden="true"></i>${l}</span>`;
  if (DATA.coord.some(r => coordHasClo(r, c))) out.push(um("req", "손님 요청"));
  for (let i = 0; i < mqN(); i++) if (Object.values(mqOf(i).outfit || {}).includes(c.id)){ out.push(um("mq", "마네킹")); break; }
  if ((c.site?.sets || []).length) out.push(um("set", "코디 세트"));
  return out.join("");
}
function viewClo(){
  const cats = ["전체", ...new Set(DATA.clo.map(c => c.c))];
  const kinds = S.cloKind || [];
  const base = c => kinds.length ? ((kinds.includes("추가옵션") && isOptKind(c)) || (kinds.includes("전투 추천") && isBtKind(c)) || (kinds.includes("코디 추천") && isCoKind(c))) : (S.cloSt==="전체" ? true : tracked(c));
  /* 칩 숫자 = 완성/전체(제제 2026-11-09). 옵션기준: 체크가 필요한 옷만. 전체기준: 모든 옷, 일반 옷은 만든 걸로 보되 필요한 옵션에 넣은 옷은 안 만든 걸로.
     장르 → 옷본 → 재료 → 옵션 순서로 앞 줄 선택을 걸어서 셈(상태·보기 버튼과는 상관없이) */
  const cntMode = S.cntMode === "all" ? "all" : "opt";
  const cntDone = c => tracked(c) ? cloDone(c) : !(S.optPicks||[]).includes(c.id);
  const frac = l => l.length ? `${l.filter(cntDone).length}/${l.length}` : 0;
  const cnt0 = DATA.clo.filter(c => cntMode==="all" || tracked(c));
  const cnt1 = cnt0.filter(c => !S.cloCat.length || S.cloCat.includes(c.c));
  const cnt2 = cnt1.filter(c => !S.cloPat.length || S.cloPat.includes(c.p || "없음"));
  const cnt3 = cnt2.filter(c => !S.cloMat.length || S.cloMat.includes(c.m || "없음"));
  const catChips = cats.map(k => { const r = frac(cnt0.filter(c => k==="전체" || c.c===k)); return [k, k, r || ""]; });
  let rows = DATA.clo.filter(c => (!S.cloCat.length || S.cloCat.includes(c.c)) && base(c) && (!S.cloSp || isSp(c)));
  const patCount = {}; rows.forEach(c => { const k = c.p || "없음"; patCount[k] = (patCount[k]||0) + 1; });
  /* 옷본·재료·옵션 칩은 앞 조건과 상관없이 항상 전부 보여 줌(선택도 유지). 숫자는 지금 조건에서 남는 벌 수, 0이면 흐리게 */
  const gCount = f => { const m = {}; DATA.clo.forEach(c => { const k = f(c); if (k) m[k] = (m[k]||0) + 1; }); return m; };
  const patName = c => c.p || "없음", matName = c => c.m || "없음";
  const allPat = gCount(patName), allMat = gCount(matName), allOpt = gCount(c => c.o || "없음");
  const pats = chipOrdered("pat", Object.keys(allPat).sort((a,b) => allPat[b]-allPat[a])).map(k => [k, frac(cnt1.filter(c => (c.p || "없음")===k))]);
  const patChips = [["전체","전체 옷본",rows.length], ...pats.map(([k,v]) => [k,k,v])];
  if (S.cloPat.length) rows = rows.filter(c => S.cloPat.includes(patName(c)));
  const matCount = {}; rows.forEach(c => { const k = matName(c); matCount[k] = (matCount[k]||0) + 1; });
  const mats = chipOrdered("mat", Object.keys(allMat).sort((a,b) => allMat[b]-allMat[a])).map(k => [k, frac(cnt2.filter(c => (c.m || "없음")===k))]);
  const matChips = [["전체","전체 재료",rows.length], ...mats.map(([k,v]) => [k,k,v])];
  if (S.cloMat.length) rows = rows.filter(c => S.cloMat.includes(matName(c)));
  const optName = c => c.o || "없음";
  const optCount = {}; rows.forEach(c => { const k = optName(c); optCount[k] = (optCount[k]||0) + 1; });
  /* 순서: 개량 옵션 표 순서 → 표에 없는 일반 옵션(많은 순) → 없음 → ★ 특수 옵션(정해진 순서) */
  const UP_ORDER = Object.keys(DATA.up.rows);
  const optRank = k => SP_OPTS.includes(k) ? 3000 + SP_OPTS.indexOf(k) : k==="없음" ? 2000 : UP_ORDER.includes(k) ? UP_ORDER.indexOf(k) : 1000;
  const opts = chipOrdered("opt", Object.keys(allOpt).sort((a,b) => optRank(a) - optRank(b) || allOpt[b]-allOpt[a])).map(k => [k, frac(cnt3.filter(c => (c.o || "없음")===k))]);
  S.spAvail = opts.map(([k]) => k).filter(k => SP_OPTS.includes(k));
  S.rowAvail = {cat: cats.filter(k => k!=="전체"), pat: pats.map(([k]) => k), mat: mats.map(([k]) => k), opt: opts.map(([k]) => k)};
  const rankStep = nextRankStep(S.rowAvail); S.nextTgt = nextTargets(rankStep, S.rowAvail);
  const optChips = [["전체","전체 옵션",rows.length], ...opts.map(([k,v]) => [k, SP_OPTS.includes(k) ? "★ "+k : k, v])];
  if (S.cloOpt.length) rows = rows.filter(c => S.cloOpt.includes(optName(c)));
  if (S.cloSt==="미완료") rows = rows.filter(c => !cloDone(c));
  if (S.cloSt==="완료") rows = rows.filter(c => cloDone(c));
  const q = S.cloQ.trim();
  if (q) rows = rows.filter(c => [c.n,cloName(c),c.p,c.m,c.o,withNames(c.x),c.tg,c.col,optOf(c).guest,optOf(c).like,optOf(c).likeDetail].some(v => (v||"").includes(q)));
  /* 정렬: 신규 손님 있는 옷 먼저 > 장르 순서 > 원래 순서 */
  const catOrder = Object.fromEntries(cats.map((k,i) => [k,i]));
  rows = [...rows].sort((a,b) => ((optOf(b).guest?1:0) - (optOf(a).guest?1:0)) || (catOrder[a.c]-catOrder[b.c]) || a.id-b.id);
  /* 전투 리스트: 다른 조건은 그대로 두고 목록만 바꿔 보여 줌. 장르가 같은 옷 + 이 전투로 추천한 옷, 추천 → 맞는 조건 많은 순 */
  const btOn = S.cloBtView && S.cloBt != null && DATA.battles[S.cloBt];
  const btCs = btOn ? bCond(S.cloBt) : [], btHits = c => btCs.filter(t => termHit(c, t)).length;
  const btMatchTag = c => { if (!btCs.length || battleOf(c)===S.cloBt) return ""; const h = btHits(c); return h===btCs.length ? `<span class="tag plain">조건 ${h}/${btCs.length}</span>` : `<span class="tag plain">조건 ${h}/${btCs.length}</span>`; };
  if (btOn){ const bi = S.cloBt, cs = bCond(bi), hits = c => cs.filter(t => termHit(c, t)).length;
    rows = DATA.clo.filter(c => (bGenreIdx(c)===bi || battleOf(c)===bi) && (!q || [c.n,cloName(c),c.p,c.m,c.o,c.tg,c.col,c.s].some(v => String(v||"").includes(q))))
      .sort((a,b) => (battleOf(b)===bi) - (battleOf(a)===bi) || hits(b) - hits(a) || a.id - b.id); }
  const shown = rows.slice(0, 200);
  /* 추가옵션 미완료일 때: 지금 조건의 미완료 옷에 필요한 옵션과 개수 */
  let needOpt = "";
  if (S.cloSt==="미완료"){
    const oc = {}; rows.forEach(c => { const k = optName(c); oc[k] = (oc[k]||0) + 1; });
    const list = Object.entries(oc).filter(([k]) => k!=="없음").sort((a,b) => b[1]-a[1]);
    const no = !!S.needOptOpen;
    needOpt = `<div class="needopt ${no?"":"closed"}"><div class="fhead" style="margin:0"><span class="fh-l"><span class="sublbl" style="margin:0">필요한 옵션</span><span class="hint">미완료 ${rows.length}벌 기준</span></span><button class="chip sm fold" data-act="needopt" aria-expanded="${no}">${no?"접기 ▴":"펼치기 ▾"}</button></div>
      ${no ? (list.length ? `<div class="pills sm" style="margin-top:10px">${list.map(([k,v],i) => `<button class="pill ${i<3?"need":"must"}" data-copt="${esc(k)}">${esc(k)}<b>${v}</b></button>`).join("")}${oc["없음"]?`<span class="pill off">옵션 없음<b>${oc["없음"]}</b></span>`:""}</div>` : `<div class="hint" style="margin-top:8px">옵션이 필요한 옷이 없어요</div>`) : ""}
    </div>`;
  }
  /* 모든 보기에서 항상: 옵션 줄에서 고른 옵션마다 필요한 개수를 직접 세는 칸(ui/optcnt에 저장) */
  let cntBox = "";
  {
    const cnt = S.optCnt || {}, sel = S.cloOpt || [];
    const keys = [...new Set([...sel, ...Object.keys(cnt).filter(k => cnt[k] > 0)])].filter(k => k!=="없음");
    const o = S.optCntOpen !== false, dec = !!S.optCntDec;
    const mode = S.ocMode || "pick", picks = (S.optPicks || []).map(id => CLO_BY_ID.get(id)).filter(Boolean);
    const pk = S.ocPick && keys.includes(S.ocPick) ? S.ocPick : null;
    /* 옷으로 고르기: 추가옵션·전투 추천·코디 추천이 아닌 일반 옷 중 장르·옷본·재료 조건과 누른 옵션에 맞는 옷 */
    const cand = pk ? DATA.clo.filter(c => !tracked(c) && (c.o || "없음") === pk && (!S.cloCat.length || S.cloCat.includes(c.c)) && (!S.cloPat.length || S.cloPat.includes(c.p || "없음")) && (!S.cloMat.length || S.cloMat.includes(c.m || "없음")) && !(S.optPicks||[]).includes(c.id)) : [];
    const modeSeg = `<div class="seg ocseg">${[["pick","옷으로 고르기"],["inc","+1"],["dec","−1"]].map(([v,l]) => `<button type="button" class="${mode===v?"on":""}" data-ocmode="${v}" aria-pressed="${mode===v}">${l}</button>`).join("")}</div><button type="button" class="chip sm ${S.ocPlan?"on":""}" data-act="ocplan" aria-pressed="${!!S.ocPlan}" title="고른 장르의 다음 장르에서 필요한 옵션">필요예정</button>`;
    /* 필요예정(제제 2026-11-09): 장르 줄에서 고른 장르 중 가장 뒤의 다음 장르 → 그 장르 옷에 필요한 옵션(특수 옵션·없음 제외).
       옵션기준이면 체크가 필요한 옷 중 미완료, 전체기준이면 그 장르 옷 전부(완료 체크한 옷 제외) 기준으로 셈 */
    let planBox = "";
    if (S.ocPlan && o){
      const lastIdx = Math.max(-1, ...(S.cloCat||[]).map(k => cats.indexOf(k)));
      const nextG = lastIdx > 0 ? cats[lastIdx + 1] : null;
      if (!nextG) planBox = `<div class="ocplan"><div class="hint">${lastIdx > 0 ? "고른 장르가 마지막 장르예요" : "장르 줄에서 지금까지 연 장르를 골라 주세요. 가장 뒤 장르의 다음 장르를 보여 줘요."}</div></div>`;
      else {
        /* 다음 장르는 아직 안 열렸으니 전체기준이면 그 장르 옷 전부(완료 체크한 옷만 뺌) */
        const pm = S.planMode || cntMode;
        const pend = c => pm==="all" ? !(tracked(c) && cloDone(c)) : (tracked(c) && !cloDone(c));
        const need = {}; DATA.clo.forEach(c => { if (c.c !== nextG || !pend(c)) return; const k = c.o || "없음"; if (k==="없음" || SP_OPTS.includes(k)) return; need[k] = (need[k]||0) + 1; });
        const list = Object.entries(need).sort((a,b) => (sel.includes(b[0]) - sel.includes(a[0])) || b[1]-a[1] || optRank(a[0]) - optRank(b[0]));
        planBox = `<div class="ocplan"><div class="ochead"><b>다음 장르 ${esc(nextG)}</b><span class="seg mini cntseg" role="group" aria-label="필요예정 기준">${[["opt","옵션기준"],["all","전체기준"]].map(([v,l]) => `<button type="button" class="${pm===v?"on":""}" data-planmode="${v}" aria-pressed="${pm===v}">${l}</button>`).join("")}</span><span class="hint">옵션 ${list.length}종 ${list.reduce((t,[,v]) => t+v, 0)}벌 · 누르면 옵션 줄에서 선택</span></div>
          ${list.length ? `<div class="pills sm">${list.map(([k,v]) => `<button type="button" class="pill ${sel.includes(k)?"need":"must"}" data-copt="${esc(k)}" aria-pressed="${sel.includes(k)}">${esc(k)}<b>${v}</b></button>`).join("")}</div>` : `<div class="hint">필요한 일반 옵션이 없어요</div>`}</div>`;
      }
    }
    /* 옷본·재료·옵션을 이름 옆에 한 줄로, 장르는 색 태그로(제제 2026-11-09) */
    const ocSpec = c => esc([c.c, c.p, c.m, c.o ? (SP_OPTS.includes(c.o) ? "★ " : "") + c.o : ""].filter(Boolean).join(" · "));
    const pickRow = c => `<button type="button" class="ocrow" data-ocadd="${c.id}"><span class="ocb"><span class="ocn">${esc(cloName(c))}</span><span class="ocs">${ocSpec(c)}</span></span><span class="ocplus" aria-hidden="true">＋</span></button>`;
    const doneRow = c => `<button type="button" class="ocrow got" data-ocdone="${c.id}" title="누르면 만든 걸로 보고 목록에서 빼요"><span class="ock" aria-hidden="true"></span><span class="ocb"><span class="ocn">${esc(cloName(c))}</span><span class="ocs">${ocSpec(c)}</span></span></button>`;
    cntBox = `<div class="needopt optcnt"><div class="fhead" style="margin:0;flex-wrap:wrap;gap:6px"><span class="fh-l"><span class="sublbl" style="margin:0">필요한 옵션</span>${picks.length?`<span class="hint">고른 옷 ${picks.length}벌</span>`:""}</span><span class="fh-act" style="gap:6px;flex-wrap:wrap">${modeSeg}<button class="chip sm" data-act="ocsel" title="옵션 줄에서 고른 옵션만 0으로">선택 초기화</button><button class="chip sm" data-act="ocall">전체 초기화</button><button class="chip sm fold" data-act="optcnt" aria-expanded="${o}">${o?"접기 ▴":"펼치기 ▾"}</button></span></div>
      ${o ? (keys.length ? `<div class="pills sm" style="margin-top:10px">${keys.map(k => `<button class="pill ${pk===k?"need":(cnt[k]||0)>0?"need":"must"} ${pk===k?"picking":""}" data-occ="${esc(k)}" aria-pressed="${pk===k}">${SP_OPTS.includes(k)?"★ ":""}${esc(k)}<b>${cnt[k]||0}</b></button>`).join("")}</div>` : `<div class="hint" style="margin-top:8px">옵션 줄에서 옵션을 고르면 여기에 나와요</div>`) : ""}
      ${o && mode==="pick" && !pk && keys.length ? `<div class="hint" style="margin-top:6px">옵션을 누르면 그 옵션이 붙은 일반 옷(추가옵션·전투 추천·코디 추천 제외)이 나와요. 장르·옷본·재료에서 고른 조건도 같이 걸려요.</div>` : ""}
      ${o && pk ? `<div class="ocpick"><div class="ochead"><b>${SP_OPTS.includes(pk)?"★ ":""}${esc(pk)}</b><span class="hint">일반 옷 ${cand.length}벌${S.cloCat.length||S.cloPat.length||S.cloMat.length?" · 위 조건 적용":""} · 누르면 아래 목록에 들어가요</span><button type="button" class="chip sm fold" data-ocpick="">닫기</button></div>
        <div class="oclist">${cand.length ? cand.slice(0, 60).map(pickRow).join("") : `<div class="hint" style="padding:8px 2px">맞는 일반 옷이 없어요</div>`}</div></div>` : ""}
      ${planBox}
      ${o && picks.length ? `<div class="ocgot"><div class="ochead"><b>만들 옷</b><span class="hint">누르면 만든 걸로 보고 목록에서 빼요(옷 완료 체크는 안 해요)</span></div><div class="oclist">${picks.map(doneRow).join("")}</div></div>` : ""}
    </div>`;
  }
  const spAll = SP.length, spDoneN = SP.filter(cloDone).length;
  return `<section class="card wardrobe-card">
    <div class="catalog-head slim"><a href="#clothesList" class="catalog-jump">목록으로 ↓ <span>${rows.length}벌</span></a></div>
    <div class="tools ctools toolsgap"><div class="cloview"><div class="pillseg" role="group" aria-label="보기"><button type="button" class="${!kinds.length && S.cloSt==="전체"?"on":""}" data-cst="전체 옷">전체 옷</button>${["추가옵션","전투 추천","코디 추천"].map(k => `<button type="button" class="${kinds.includes(k)?"on":""}" data-ckind="${k}" aria-pressed="${kinds.includes(k)}">${k}</button>`).join("")}</div><div class="pillseg" role="group" aria-label="완료 상태">${["미완료","완료"].map(k => `<button type="button" class="${S.cloSt===k?"on":""}" data-cst="${k}" aria-pressed="${S.cloSt===k}">${k}</button>`).join("")}</div></div><input class="search" id="cloQ" placeholder="옷 이름, 옵션, 인물 검색" value="${esc(S.cloQ)}" aria-label="옷 검색"></div>
    <div class="filter-toolbar fhead" style="gap:6px;margin-bottom:22px;flex-wrap:wrap"><span class="fh-l">${(() => { const allExp = ["cat","pat","mat","opt"].every(k => S.cloExp[k]); return `<button class="chip sm" data-act="${allExp?"foldall":"openall"}" aria-expanded="${allExp}">${allExp?"전체 접기":"전체 펼치기"}</button>`; })()}<button class="chip sm ${S.cloMulti?"on":""}" data-act="cmulti" aria-pressed="${S.cloMulti}">전체 다중선택</button><span class="seg mini cntseg" role="group" aria-label="숫자 기준">${[["opt","옵션기준"],["all","전체기준"]].map(([v,l]) => `<button type="button" class="${cntMode===v?"on":""}" data-cntmode="${v}" aria-pressed="${cntMode===v}">${l}</button>`).join("")}</span></span></div>
    <div class="filter-grid">
    <div class="filter-row">${rowHead("장르","cat","ccat",S.cloCat)}${foldChips(catChips, S.cloCat, "ccat", "cat")}</div>
    <div class="filter-row">${rowHead("옷본","pat","cpat",S.cloPat,rows.length)}${foldChips(patChips, S.cloPat, "cpat", "pat")}</div>
    <div class="filter-row">${rowHead("재료","mat","cmat",S.cloMat)}${foldChips(matChips, S.cloMat, "cmat", "mat")}</div>
    <div class="filter-row">${rowHead("옵션","opt","copt",S.cloOpt)}${foldChips(optChips, S.cloOpt, "copt", "opt")}</div>
    </div>
    ${rankStep ? `<div class="ranknext"><span class="rn-k">${curRank()!=null?`현재 ${curRank()} · `:""}다음 랭크 ${gRank(rankStep.rank)}</span><span class="rn-v">배틀 ${esc(rankStep.battle)} → ${esc(rankStep.char)} → <b>${esc(rankStep.genre)}</b>${rankStep.base?` · 옷본 <b>${esc(rankStep.base)}</b>`:""}${rankStep.study?` · 스터디 ${esc(rankStep.study)}${rankStep.studyItems?.length?`(<b>${rankStep.studyItems.map(esc).join("·")}</b>)`:""}`:""}</span><span class="rn-h">점선 칩이 다음에 열리는 것 · 모두 고르면 다음 단계</span></div>` : ""}
    ${cntBox}
    <div class="frowgap">${battleRow()}</div>
    ${S.verifyOpen ? verifyBox() : ""}
    ${S.cloBt != null && DATA.battles[S.cloBt] ? battleCard(S.cloBt) : ""}

    ${needOpt}
    ${LEGEND}
    <div class="list" id="clothesList" tabindex="-1">${shown.length ? shown.map(c => {
      const tr = tracked(c), d = tr && cloDone(c), opened = S.cloOpen===c.id;
      const X = withNames(c.x);
      const want = X.match(/\[원함\]([^→\s]+(?: [^→\s\[]+)?)/);
      const shop = X.match(/^([^\[]+)\[([^\]]+)\]/);
      return `<div class="${opened?"open":""}">
        <div class="row ${d?"done":""} ${btOn && btHits(c)===btCs.length && btCs.length ? "btfull" : ""}">
          ${tr ? `<button data-tclo="${c.id}" aria-pressed="${!!d}" aria-label="${esc(cloName(c))} 완료 바꾸기">${ck(d)}</button>` : `<span style="width:26px;flex:none"></span>`}
          <button class="body" data-oclo="${c.id}" aria-expanded="${opened}" style="text-align:left">
            <div class="t"><span class="item-number">#${String(c.id).padStart(3,"0")}</span><span class="n">${esc(cloName(c))}</span>${catTag(c.c)}${SP_OPTS.includes(c.o)?semTag("sp","★ "+esc(c.o)):""}${rowOptTags(c)}${isChal(c)?`<span class="tag chal">${btWorn(c) ? "챌린지 · ⚔️" : "챌린지"}</span>`:""}${btOn ? btMatchTag(c) : ""}${Object.keys(S.clofix[c.id]||{}).length?semTag("fix","수정됨"):""}${want?`<span class="tag blue">원함</span>`:shop?`<span class="tag amber">상점</span>`:""}</div>
            <div class="s"><span class="sspec">${[c.p,c.m,c.o].filter(Boolean).map(esc).join(" · ")}${X?` — ${esc(X)}`:""}</span>${cloUseTags(c)}</div>
          </button>

          ${c.site ? `<span class="rowvals" aria-hidden="true"><span>품질 ${c.site.q ?? "-"}</span><span>인기 ${c.site.pop ?? "-"}</span><span>${c.site.price!=null ? Number(c.site.price).toLocaleString("ko-KR")+"G" : "-"}</span></span>` : ""}
          <button class="iconbtn" data-oclo="${c.id}" aria-label="자세히">${ICON.chev}</button>
        </div>
        ${opened ? `<div class="detail item-detail">${cloSiteBlock(c)}<div class="detail-actions"><button class="btn ghost" data-sheet="clo|${c.id}">${ICON.pen}정보 수정</button><button class="btn ghost" data-sheet="battle|${c.id}">${ICON.sword}전투 추천 ${battleOf(c)>=0?"관리":"추가"}</button></div>${hybrid()?"":cloEditor(c)}</div>` : ""}
      </div>`; }).join("") : `<div class="empty">조건에 맞는 옷이 없어요</div>`}</div>
    ${rows.length>200?`<div class="empty" style="padding:12px">200벌까지 보여요. 검색으로 좁혀 주세요.</div>`:""}
  </section>${nextMakeCard()}`;
}

/* 코디 요청 수정: 제목이 바뀐 경우(새 제목 저장) / 잘못된 정보(표시만, 노트 전용). coordfix/k{id} */
const cTitle = c => S.cfix[c.id]?.title || c.r;
const PARTS = [["t","상의"],["b","하의"],["o","아우터"],["a","액세서리"]];
/* 저장 키는 부위 앞에 p를 붙임(pt/pb/po/pa). t는 저장 시각이라 겹치면 안 됨 */
const PK = k => "p"+k;
const cPart = (c, k) => S.cfix[c.id]?.[PK(k)] ?? c[k];
const hasPartFix = c => PARTS.some(([k]) => S.cfix[c.id]?.[PK(k)]);
async function saveCfix(c, patch, logEntry){
  const rec = {...(S.cfix[c.id]||{}), ...patch, t:Date.now()};
  if (!rec.title) delete rec.title; if (!rec.wrong) delete rec.wrong; PARTS.forEach(([k]) => { if (!rec[PK(k)]) delete rec[PK(k)]; });
  const empty = !rec.title && !rec.wrong && !PARTS.some(([k]) => rec[PK(k)]);
  const next = {...S.cfix}; if (empty) delete next[c.id]; else next[c.id] = rec; S.cfix = next; render();
  if (!db) return;
  try{
    if (empty) await db.doc(`coordfix/k${c.id}`).delete(); else await writeSerial(`coordfix/k${c.id}`, rec);
    if (logEntry) await db.collection("log").add({...logEntry, id:c.id, name:coordName(c), t:Date.now(), by:"app"});
  }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
function coordFixBox(n, list){
  const pick = list.find(c => c.id===S.cfxPick[n]);
  const kind = pick ? S.cfxKind[n] : "";
  const fx = pick ? (S.cfix[pick.id]||{}) : {};
  const pk = pick ? (S.cfxPart[pick.id] || "t") : "t";
  const cloNames = [...new Set(DATA.clo.map(cloName))].sort((a,b)=>a.localeCompare(b,"ko"));
  return `<div class="edl cfxbox">
    <div class="edl-h"><span class="fl">수정</span><div class="opts mini">${list.map((c,i) => `<button type="button" class="opt num ${pick && pick.id===c.id?"on":""}" data-cfxn="${esc(n)}|${c.id}">${esc(c.ps || String(i+1))}</button>`).join("")}</div>
    ${pick ? `<div class="opts mini"><button type="button" class="opt ${kind==="title"?"on":""}" data-cfxk="${esc(n)}|title" aria-pressed="${kind==="title"}">제목</button><button type="button" class="opt ${kind==="part"?"on":""}" data-cfxk="${esc(n)}|part" aria-pressed="${kind==="part"}">옷</button><button type="button" class="opt wrong ${fx.wrong?"on":""}" data-cfxwrong="${pick.id}" aria-pressed="${!!fx.wrong}">${fx.wrong?"잘못된 정보 ✓":"잘못된 정보로 표시"}</button></div>` : ""}</div>
    ${pick && kind==="title" ? `<form class="inl" data-cfxform="${pick.id}"><input class="field" id="cfx-${pick.id}" value="${esc(S.optDraft["cfx-"+pick.id] ?? cTitle(pick))}" aria-label="새 제목"><button class="btn" type="submit">저장</button></form>${fx.title?`<div class="hint">원래 ${esc(pick.r)} · <button type="button" class="linkbtn" data-cfxreset="${pick.id}">원래대로</button></div>`:""}` : ""}
    ${pick && kind==="part" ? `<form class="inl" data-cfpform="${pick.id}"><select class="field kind" id="cfp-${pick.id}" aria-label="부위">${PARTS.map(([k,l]) => `<option value="${k}" ${k===pk?"selected":""}>${l}</option>`).join("")}</select><input class="field" id="cfv-${pick.id}" list="dl-clo" value="${esc(S.optDraft["cfv-"+pick.id] ?? cPart(pick,pk) ?? "")}" placeholder="옷 이름" aria-label="옷 이름"><datalist id="dl-clo">${cloNames.map(v => `<option value="${esc(v)}">`).join("")}</datalist><button class="btn" type="submit">저장</button></form><div class="hint">${fx[PK(pk)]?`원래 ${esc(pick[pk]||"-")} · 비우고 저장하면 원래대로`:"원래 값과 다르면 수정됨으로 표시돼요"}</div>` : ""}
  </div>`;
}
/* 손님 등장 순서(제제 2026-11-09): 정춘자(처음부터 있음) → 그 손님이 등장하는 옷(옷 "손님" 칸)이 옷 목록에서 앞선 순서 → 정보 없는 손님은 뒤 */
function guestRank(){
  const m = new Map([["정춘자", -1], [curPerson("정춘자"), -1]]);
  DATA.clo.forEach((c, i) => { const g = String(optOf(c).guest || "").replace(/\s*\(.*\)\s*$/, "").trim(); if (!g) return;
    [g, curPerson(g)].forEach(k => { if (!m.has(k)) m.set(k, i); }); });
  return m;
}
/* 펼친 손님 칩을 다시 누르면 그 카드로 이동하고 테두리를 깜빡임 */
function coordJump(n){
  const el = [...document.querySelectorAll(".cocard")].find(x => x.dataset.coname === n); if (!el) return;
  el.scrollIntoView({behavior:"smooth", block:"start"});
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 1700);
}
function viewCoordReq(){
  const q = S.coordQ.trim();
  const cm = cloRenamed();
  const rows = DATA.coord.filter(c => !q || coordName(c).includes(q) || [c.r,cTitle(c),c.t,c.b,c.o,c.a,cPart(c,"t"),cPart(c,"b"),cPart(c,"o"),cPart(c,"a"),c.e,withClo(c.t,cm),withClo(c.b,cm),withClo(c.o,cm),withClo(c.a,cm)].some(v => String(v).includes(q)));
  const groups = {};
  rows.forEach(c => { const n = curPerson(c.pb); (groups[n] = groups[n] || []).push(c); });
  const cdone = n => S.coordDone.includes(n);
  const gr = guestRank(), rk = n => gr.get(n) ?? 9999;
  const byAppear = (a,b) => rk(a) - rk(b) || a.localeCompare(b, "ko");
  const names = Object.keys(groups).sort((a,b) => (cdone(a) - cdone(b)) || byAppear(a,b));
  const open = n => q ? true : S.coordOpen.includes(n);
  const allOpen = names.length && names.every(n => S.coordOpen.includes(n));
  const entry = c => `<article class="coord sub request-entry">
    <div class="request-heading"><h3>${c.ps?`<span class="request-stage">${esc(c.ps)}</span>`:""}<span class="request-title">${esc(cTitle(c))}</span>${S.cfix[c.id]?.title||hasPartFix(c)?semTag("fix","직접 수정"):""}${S.cfix[c.id]?.wrong?semTag("wrong","잘못된 정보"):""}</h3><button class="iconbtn coedit" data-cedit3="${c.id}" aria-label="${esc(cTitle(c))} 수정">${ICON.pen}</button></div>
    ${c.e?`<p class="request-note">${esc(c.e)}</p>`:""}
    ${factRows(PARTS.map(([k,l]) => [l,withClo(cPart(c,k),cm)]))}
  </article>`;
  const all = Object.keys(groups).sort(byAppear);
  const shownCards = q ? names : names.filter(n => S.coordOpen.includes(n));
  const card = n => { const dn = cdone(n), fo = !!S.coordFixOpen[n]; return `<div class="fccard cocard ${dn?"cdone":""}" data-coname="${esc(n)}">
    <div class="fc-h"><b class="fc-n">${esc(n)}</b>
      <button class="iconbtn act" data-cedit2="${esc(n)}" aria-label="${esc(n)} 이름 수정" aria-pressed="${fo}">${ICON.pen}</button>
      <button class="iconbtn act ${dn?"on":""}" data-cdone="${esc(n)}" aria-label="${esc(n)} ${dn?"완료 취소":"최종 완료"}" aria-pressed="${dn}">${ICON.ok}</button>
      <span class="fc-c">${dn?"완료":`${groups[n].length}건`}</span>
      <button class="iconbtn" data-coordp="${esc(n)}" aria-label="닫기">${ICON.x}</button></div>
    <div class="request-grid">${groups[n].map(entry).join("")}</div>${!hybrid() && fo ? coordFixBox(n, groups[n]) : ""}
  </div>`; };
  return `<section class="card customer-catalog">
    <div class="tools toolsgap"><input class="search" id="coordQ" placeholder="인물, 요청, 옷 이름 검색" value="${esc(q)}" aria-label="코디 검색"></div>
    <div class="fhead rowhead"><span class="fh-l"><span class="sublbl" style="margin:0">손님</span><span class="hint">${all.length}명 · 완료 ${all.filter(cdone).length}명</span></span>
      <span class="fh-act">${S.coordOpen.length?`<button class="chip sm ${S.coordUnsel?"on":""}" data-act="coord-unsel" aria-pressed="${!!S.coordUnsel}" title="켜고 손님을 누르면 그 손님만 닫혀요">${S.coordUnsel?"선택 해제 끝":"선택 해제"}</button><button class="chip sm" data-act="coord-close">전체 해제</button>`:""}<button class="chip sm ${S.coordHideDone?"on":""}" data-act="coord-hidedone" aria-pressed="${!!S.coordHideDone}">완료 숨기기</button></span></div>
    <div class="chips cfoldchips cochips">${all.filter(n => !S.coordHideDone || !cdone(n) || S.coordOpen.includes(n)).map(n => `<button class="chip ${S.coordOpen.includes(n)?"on":""} ${cdone(n)?"done":""}" data-cochip="${esc(n)}" aria-pressed="${S.coordOpen.includes(n)}">${cdone(n)?ICON.ok:""}${esc(n)}${S.coordUnsel && S.coordOpen.includes(n)?` <span class="cox" aria-hidden="true">×</span>`:""}</button>`).join("") || `<span class="hint">검색 결과가 없어요</span>`}</div>

  </section>
  ${shownCards.length ? `<div class="cogrid">${shownCards.map(card).join("")}</div>` : `<section class="card"><div class="empty">${q?"검색 결과가 없어요":"위에서 손님을 누르면 요청이 나와요"}</div></section>`}`;
}

/* ---------- 코디 탭: [손님 요청 | 코디 세트] ---------- */
function viewCoord(){
  const subs = [["req","손님 요청"],["set","코디 세트"],["mq","마네킹"]];
  return `<section class="card subnav"><div class="seg wide">${subs.map(([k,l]) => `<button class="${S.coordSub===k?"on":""}" data-csub="${k}" aria-pressed="${S.coordSub===k}">${l}</button>`).join("")}</div></section>
  ${S.coordSub==="set" ? viewSets() : S.coordSub==="mq" ? viewMannequin() : viewCoordReq()}`;
}
/* 코디 세트(사이트 207개 중 2파츠 이상 유효 세트): 구성 옷을 다 만들면 완성.
   세트 상태 = 노트에 있는 구성 옷의 완료 체크로 계산(따로 저장하지 않음). 노트에 없는 옷은 회색 표시, 계산에서는 남은 옷으로 셈 */
const SET_GENRES = ["내추럴","큐트","쿨","성숙","레트로","하드","서브컬쳐"];
const CLO_BY_ID = new Map(DATA.clo.map(c => [c.id, c]));
function setInfo(s){
  const items = (s.clothes || []).map((id, i) => ({ id, c: CLO_BY_ID.get(id) || null, name: s.names?.[i] }));
  const done = items.filter(x => x.c && cloDone(x.c)).length;
  return { s, items, done, total: items.length, left: items.length - done };
}
function viewSets(){
  const q = S.setQ.trim();
  const all = (DATA.sets || []).filter(s => s.valid).map(setInfo);
  const fs = { "전체": () => true, "1벌 남음": x => x.left===1, "완성": x => x.left===0, "미완성": x => x.left>0 };
  const inG = x => S.setG==="전체" || x.s.genre===S.setG;
  const hit = x => !q || [x.s.sub, x.s.genre, ...x.items.map(it => it.c ? cloName(it.c) : it.name)].some(v => String(v||"").includes(q));
  const rows = all.filter(x => inG(x) && (fs[S.setF] || fs["전체"])(x) && hit(x))
    .sort((a,b) => (a.left===0) - (b.left===0) || a.left - b.left || b.done - a.done || a.s.id - b.s.id);
  const nDone = all.filter(x => !x.left).length, nOne = all.filter(x => x.left===1).length;
  const gChips = [["전체","전체", `${nDone}/${all.length}`], ...SET_GENRES.map(g => { const l = all.filter(x => x.s.genre===g); return [g, g, `${l.filter(x=>!x.left).length}/${l.length}`]; })];
  const groups = {};
  rows.forEach(x => { const k = `${x.s.genre} · ${x.s.sub}`; (groups[k] = groups[k] || []).push(x); });
  const pill = (x, it) => {
    const key = `${x.s.id}:${it.id}`, d = it.c && cloDone(it.c);
    if (!it.c) return `<span class="pill off" title="노트에 없는 옷">${esc(it.name || "#"+it.id)}</span>`;
    return `<button type="button" class="pill ${d?"must":""}" data-setpill="${key}" aria-expanded="${S.setOpen===key}">${d?"✓ ":""}${esc(cloName(it.c))}</button>`;
  };
  const detail = x => {
    const it = x.items.find(it => S.setOpen===`${x.s.id}:${it.id}`); if (!it || !it.c) return "";
    const c = it.c, st = c.site || {}, d = cloDone(c);
    const facts = [["옷본", c.p], ["재료", c.m], ["옵션", c.o], ["계절", c.s], ["품질", st.q], ["인기", st.pop], ["가격", st.price], ["Tier", st.tier]].filter(([,v]) => v!=null && v!=="");
    return `<div class="edl setdet"><div class="edl-h"><span class="fl">${esc(cloName(c))} <small class="desc">${esc(c.c||"")}</small></span>
      <button type="button" class="btn ${d?"ghost":""}" data-setdone="${c.id}">${d?"완료 취소":"완료 체크"}</button></div>
      ${factRows(facts)}</div>`;
  };
  const card = x => `<div class="fccard setcard ${x.left?"":"cdone"} ${S.setFocus===x.s.id?"focus":""}" id="set-${x.s.id}">
    <div class="fc-h"><b class="fc-n">세트 ${x.s.id}</b>${x.left===1?semTag("part","1벌 남음"):""}${x.left===0?semTag("done","완성"):""}<span class="fc-c">${x.done}/${x.total}</span></div>
    <div class="pills">${x.items.map(it => pill(x, it)).join("")}</div>${detail(x)}</div>`;
  const keys = Object.keys(groups);
  return `<section class="card">
    <div class="fhead rowhead"><span class="fh-l"><span class="sublbl" style="margin:0">코디 세트</span><span class="hint">${all.length}개 · 완성 ${nDone} · 1벌 남음 ${nOne}</span></span></div>
    ${chips(gChips, S.setG, "setg")}
    <div class="tools toolsgap">${seg(["전체","1벌 남음","미완성","완성"], S.setF, "setf")}<input class="search" id="setQ" placeholder="옷 이름, 세부 장르 검색" value="${esc(q)}" aria-label="코디 세트 검색"></div>
    <div class="hint" style="margin-top:8px">구성 옷을 모두 완료하면 세트 완성 · 옷을 누르면 정보와 완료 체크 · 출처: KairoHistory 코디 세트</div>
  </section>
  ${keys.length ? keys.map(k => `<section class="card"><div class="fhead rowhead"><span class="sublbl" style="margin:0">${esc(k)}</span><span class="hint">${groups[k].filter(x=>!x.left).length}/${groups[k].length}</span></div><div class="cardgrid">${groups[k].map(card).join("")}</div></section>`).join("")
    : `<section class="card"><div class="empty">${q?"검색 결과가 없어요":"조건에 맞는 세트가 없어요"}</div></section>`}`;
}

/* ---------- 마네킹 플래너 (코디 탭 [마네킹]) ----------
   완료한 옷으로 마네킹 코디를 추천한다. 상의+하의 또는 셋업에 아우터·액세서리까지 넣는다(제제 결정).
   구매 확률은 사이트 빌더의 게임 식(AppData.MannequinPercent: 상의·셋업+하의만 봄)을 쓰고,
   손님이 좋아하는 색(+10/벌)은 손님마다 달라 뺀다. 아우터·액세서리는 확률 식에 없고 세트·장르·계절에만 쓴다.
   정렬: 반대 계절 옷 제외 → 마네킹 장르 옷 수 → 세트 완성 → 확률 → 장르 스타일 점수 → 인기+품질(사이트 값).
   저장: 지금 상태 runs/rN/ui/now {season, trend} · 마네킹 runs/rN/mannequins/m1..m5 {genre, season, outfit, t} · 칸 수 runs/rN/ui/mqcfg {n} */
const MQ_SEASONS = ["봄·가을","여름","겨울"];
const MQ_SLOTS = [["t","상의"],["b","하의"],["o","아우터"],["a","액세서리"]];
const MQ_KIND = {"상의":"t","셋업":"t","하의":"b","아우터":"o","액세서리":"a"};
const SUB_GENRE = (() => { const m = {}; DATA.clo.forEach(c => { if (c.site?.sub) m[c.site.sub.replace(/\s/g,"")] = c.site.genre; }); return m; })();
const MQ_COLORS = (() => { const n = {}; DATA.clo.forEach(c => (c.site?.cols||[]).forEach(x => { if (x !== "다색") n[x] = (n[x]||0) + 1; })); return Object.keys(n).sort((a,b) => n[b]-n[a]); })();
const MQ_PAIR = (() => { const m = new Map(); const put = (a, b, v) => { m.set(a+":"+b, v); m.set(b+":"+a, v); };
  DATA.clo.forEach(c => { (c.site?.goodIds||[]).forEach(x => put(c.id, x, 1)); (c.site?.badIds||[]).forEach(x => put(c.id, x, -1)); }); return m; })();
const mqPair = (a, b) => MQ_PAIR.get(a.id+":"+b.id) ?? 0;
const mqNow = () => ({season:"봄·가을", trend:"", ...(S.now||{})});
const TREND_HEX = {"검정":"#222","흰색":"#fff","파랑":"#3B82F6","빨강":"#E11D48","분홍":"#F9A8D4","갈색":"#92400E","초록":"#16A34A","보라":"#8B5CF6","주황":"#F97316","노랑":"#FACC15","회색":"#9CA3AF"};
const mqSeasonOf = m => m.season || mqNow().season;
/* 옷 계절과 목표 계절의 궁합(AppData.GetMatchSeason): 봄·가을 옷은 봄·가을에 +1, 여름·겨울 옷은 제 계절 +1 · 반대 계절 −1 */
const mqMatch = (c, now) => { const se = c.s; if (!MQ_SEASONS.includes(se)) return 0;
  if (se==="봄·가을") return now==="봄·가을" ? 1 : 0;
  if (se===now) return 1; return (now==="봄·가을" || now===se) ? 0 : -1; };
const mqStyle = (c, g) => Object.entries(c.site?.styles||{}).reduce((a,[k,v]) => a + (SUB_GENRE[k.replace(/\s/g,"")]===g ? v : 0), 0);
const mqPop = c => (c.site?.pop||0) + (c.site?.q||0);
const MQ_SETS = (DATA.sets||[]).filter(s => s.valid && (s.clothes||[]).every(id => CLO_BY_ID.get(id)));
const MQ_SETS_OF = (() => { const m = new Map(); MQ_SETS.forEach(s => s.clothes.forEach(id => m.set(id, [...(m.get(id)||[]), s]))); return m; })();
function mqEval(o, m){
  const now = mqSeasonOf(m), trend = mqNow().trend, g = m.genre;
  const pcs = MQ_SLOTS.map(([k]) => o[k]).filter(Boolean);
  const top = o.t, bot = o.b, base = [top, bot].filter(Boolean);
  const ms = base.reduce((a,c) => a + mqMatch(c, now), 0), hasSe = base.some(c => MQ_SEASONS.includes(c.s));
  const setup = top?.site?.kind==="셋업";
  const pair = setup ? 1 : (top && bot ? mqPair(top, bot) : 0);
  const trendN = trend ? base.reduce((a,c) => a + (c.site?.cols||[]).filter(x => x===trend).length, 0) : 0;
  const parts = [["계절", !hasSe ? 0 : ms>0 ? 30 : ms<0 ? -10 : 10], ["유행색", 20*trendN], ["셋업", setup ? 15 : 0], ["궁합", pair>=1 ? 10 : pair<0 ? -10 : 0]];
  const pct = Math.max(5, Math.min(95, parts.reduce((a,p) => a + p[1], 0)));
  const ids = new Set(pcs.map(c => c.id));
  const sets = [...new Set(pcs.flatMap(c => MQ_SETS_OF.get(c.id) || []))].filter(s => s.clothes.every(id => ids.has(id)));
  return { o, pcs, pct, parts, pair, setup, trendN, sets,
    gN: pcs.filter(c => c.site?.genre===g).length, style: pcs.reduce((a,c) => a + mqStyle(c, g), 0), pop: pcs.reduce((a,c) => a + mqPop(c), 0),
    bad: pcs.some(c => mqMatch(c, now) < 0), key: MQ_SLOTS.map(([k]) => o[k]?.id||"").join("-") };
}
const mqCmp = (a, b) => b.gN - a.gN || b.sets.length - a.sets.length || b.pct - a.pct || b.style - a.style || b.pop - a.pop;
let _mqCache = {};
function mqRank(m){
  const doneKey = DATA.clo.filter(cloDone).map(c => c.id).join(",");
  const ck = [m.genre, mqSeasonOf(m), mqNow().trend, doneKey].join("|");
  if (_mqCache[ck]) return _mqCache[ck];
  const now = mqSeasonOf(m), g = m.genre;
  const ok = c => cloDone(c) && mqMatch(c, now) >= 0;
  const by = {t:[], b:[], o:[], a:[]};
  DATA.clo.forEach(c => { const k = MQ_KIND[c.site?.kind]; if (k && ok(c)) by[k].push(c); });
  /* 바탕(상의+하의 / 셋업)을 먼저 고르고, 아우터·액세서리는 바탕마다 가장 좋은 것으로 채운다 */
  const bases = [];
  by.t.forEach(t => { if (t.site.kind==="셋업") bases.push({t}); else by.b.forEach(b => bases.push({t, b})); });
  const quick = o => mqEval(o, m);
  /* 바탕 2만여 개는 가벼운 점수(같은 정렬 순서를 숫자 하나로)로 먼저 120개만 남긴다 */
  const trend = mqNow().trend;
  const pre = c => ({g: c.site?.genre===g ? 1 : 0, se: MQ_SEASONS.includes(c.s), ms: mqMatch(c, now), tr: trend ? (c.site?.cols||[]).filter(x => x===trend).length : 0, st: mqStyle(c, g), pop: mqPop(c)});
  const P = new Map(); [...by.t, ...by.b].forEach(c => P.set(c.id, pre(c)));
  const score = o => { const a = P.get(o.t.id), b = o.b ? P.get(o.b.id) : null, setup = !o.b;
    const ms = a.ms + (b ? b.ms : 0), hasSe = a.se || (b && b.se);
    const pair = setup ? 1 : mqPair(o.t, o.b);
    const pct = Math.max(5, Math.min(95, (!hasSe ? 0 : ms>0 ? 30 : ms<0 ? -10 : 10) + 20*(a.tr + (b ? b.tr : 0)) + (setup ? 15 : 0) + (pair>=1 ? 10 : pair<0 ? -10 : 0)));
    const set2 = b && (MQ_SETS_OF.get(o.t.id)||[]).some(s => s.clothes.length===2 && s.clothes.includes(o.b.id)) ? 1 : 0;
    return (a.g + (b ? b.g : 0))*1e12 + set2*1e10 + pct*1e7 + (a.st + (b ? b.st : 0))*1e4 + a.pop + (b ? b.pop : 0); };
  const top = bases.map(o => [score(o), o]).sort((x, y) => y[0] - x[0]).slice(0, 120).map(x => x[1]);
  /* 구성 옷이 다 완료된 세트는 그 조합을 바탕으로 넣는다(빠진 칸은 채움) */
  MQ_SETS.forEach(s => { const o = {}; let fine = true;
    s.clothes.forEach(id => { const c = CLO_BY_ID.get(id), k = MQ_KIND[c.site?.kind]; if (!k || !ok(c) || o[k]) fine = false; else o[k] = c; });
    if (!fine) return;
    if (o.t?.site.kind==="셋업") delete o.b;
    if (!o.t && o.b) { const best = by.t.filter(t => t.site.kind!=="셋업").map(t => quick({...o, t})).sort(mqCmp)[0]; if (best) o.t = best.o.t; }
    if (o.t && o.t.site.kind!=="셋업" && !o.b) { const best = by.b.map(b => quick({...o, b})).sort(mqCmp)[0]; if (best) o.b = best.o.b; }
    if (o.t) top.push(o); });
  /* 아우터·액세서리 후보: 장르·스타일·인기로 앞선 12벌 + 바탕 옷과 같은 세트에 든 옷 */
  const indiv = c => (c.site?.genre===g ? 1e8 : 0) + mqStyle(c, g)*1e4 + mqPop(c);
  const head = {o: [...by.o].sort((x, y) => indiv(y) - indiv(x)).slice(0, 12), a: [...by.a].sort((x, y) => indiv(y) - indiv(x)).slice(0, 12)};
  const okSet = {o: new Set(by.o.map(c => c.id)), a: new Set(by.a.map(c => c.id))};
  const cands = (o, k) => { const ex = []; MQ_SLOTS.forEach(([j]) => { if (o[j]) (MQ_SETS_OF.get(o[j].id)||[]).forEach(st => st.clothes.forEach(id => { if (okSet[k].has(id)) ex.push(CLO_BY_ID.get(id)); })); });
    return [...new Set([...head[k], ...ex])]; };
  const fill = (o, k) => { if (o[k]) return o; const best = cands(o, k).map(c => quick({...o, [k]:c})).sort(mqCmp)[0]; return best ? best.o : o; };
  const seen = new Set(), out = [];
  top.map(o => fill(fill(o, "o"), "a")).map(quick).sort(mqCmp).forEach(x => { if (!seen.has(x.key)){ seen.add(x.key); out.push(x); } });
  if (Object.keys(_mqCache).length > 20) _mqCache = {};
  return (_mqCache[ck] = out);
}
const mqN = () => Math.max(1, Math.min(5, +(S.mqCfg?.n) || 5));
const mqOf = i => ({genre: LAY_G[i % LAY_G.length], season: "", outfit: null, ...(S.mq?.[i+1]||{})});
const mqOutfit = m => { const o = {}; if (!m.outfit) return null; for (const [k] of MQ_SLOTS) { const id = m.outfit[k]; if (id != null){ const c = CLO_BY_ID.get(id); if (c) o[k] = c; } } return o; };
const mqUsedElse = i => { const s = new Set(); for (let j = 0; j < mqN(); j++) if (j !== i) Object.values(mqOf(j).outfit||{}).forEach(id => s.add(id)); return s; };
function mqSave(i, patch){ const cur = mqOf(i), next = {...cur, ...patch, t:Date.now()}; S.mq = {...(S.mq||{}), [i+1]: next}; render();
  if (db) writeSerial(`${RUN}/mannequins/m${i+1}`, next).catch(() => showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.")); }
function mqNowSave(patch){ S.now = {...mqNow(), ...patch, t:Date.now()}; render();
  if (db) writeSerial(`${RUN}/ui/now`, S.now).catch(() => showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.")); }
function mqTags(x, m){
  const now = mqSeasonOf(m), t = [];
  const sv = x.parts[0][1]; t.push(`<span class="tag ${sv>=30?"mq-ok":sv<0?"mq-ng":""}" title="상의·하의 기준">상하 계절 ${sv>=30?"✓":sv<0?"✕":"보통"}</span>`);
  if (x.setup) t.push(`<span class="tag mq-ok">셋업</span>`);
  else if (x.o.t && x.o.b && x.pair) t.push(`<span class="tag ${x.pair>0?"mq-ok":"mq-ng"}">궁합 ${x.pair>0?"+1":"−1"}</span>`);
  if (x.trendN) t.push(`<span class="tag mq-ok">유행색 ${x.trendN}</span>`);
  x.sets.forEach(s => t.push(semTag("done", `세트 ${s.id} 완성`)));
  t.push(`<span class="tag">${esc(layGName(m.genre))} ${x.gN}/${x.pcs.length}벌</span>`);
  if (x.pcs.some(c => mqMatch(c, now) < 0)) t.push(`<span class="tag mq-ng">반대 계절 옷</span>`);
  return t.join("");
}
const mqPcs = (x, used) => MQ_SLOTS.map(([k,l]) => x.o[k] ? `<span class="mq-pc ${used?.has(x.o[k].id)?"dim":""}"><small>${x.o[k].site?.kind==="셋업"?"셋업":l}</small>${esc(cloName(x.o[k]))}</span>` : "").join("");
function mqCard(i){
  const m = mqOf(i), now = mqSeasonOf(m), used = mqUsedElse(i);
  const saved = mqOutfit(m), sx = saved && saved.t ? mqEval(saved, m) : null;
  const notDone = saved ? Object.values(saved).filter(c => !cloDone(c)) : [];
  const open = S.mqOpen === i || !sx;
  const list = open ? mqRank(m).slice(0, S.mqMore===i ? 10 : 3) : [];
  const gChips = LAY_G.map(g => `<button class="chip sm ${m.genre===g?"on":""}" data-mqg="${i}|${g}" aria-pressed="${m.genre===g}">${esc(layGName(g))}</button>`).join("");
  const sChips = [["", `기본(${mqNow().season})`], ...MQ_SEASONS.map(s => [s, s])].map(([v,l]) => `<button class="chip sm ${(m.season||"")===v?"on":""}" data-mqs="${i}|${v}" aria-pressed="${(m.season||"")===v}">${esc(l)}</button>`).join("");
  return `<div class="fccard mqcard">
    <div class="fc-h"><b class="fc-n">마네킹 ${i+1}</b>${catTagG(m.genre)}<span class="tag">${esc(now)}</span>${sx ? `<span class="fc-c">${sx.pct}%</span>` : ""}</div>
    <div class="chips mq-chips">${gChips}</div><div class="chips mq-chips">${sChips}</div>
    ${sx ? `<div class="mq-saved"><div class="sublbl" style="margin:0 0 6px">세운 코디</div><div class="mq-pcs">${mqPcs(sx)}</div><div class="mq-tags">${mqTags(sx, m)}</div>
      ${sx.bad ? `<div class="mq-warn">${ICON.warn}지금 계절(${esc(now)})과 반대인 옷이 있어요. 바꿔 주세요.</div>` : ""}
      ${notDone.length ? `<div class="mq-warn">${ICON.warn}완료 해제된 옷: ${notDone.map(c => esc(cloName(c))).join(", ")}</div>` : ""}
      <div class="mq-act"><button class="chip sm" data-mqopen="${i}">${open?"추천 접기":"다른 코디 보기"}</button><button class="chip sm" data-mqclear="${i}">내리기</button></div></div>` : ""}
    ${open ? (list.length ? `<div class="mq-list">${list.map((x, r) => `<div class="mq-row ${sx && x.key===sx.key?"on":""}"><div class="mq-rk">${r+1}</div><div class="mq-body"><div class="mq-pcs">${mqPcs(x, used)}</div><div class="mq-tags"><span class="tag mq-pct">${x.pct}%</span>${mqTags(x, m)}</div></div>
        <button class="btn sm ${sx && x.key===sx.key?"ghost":""}" data-mqset="${i}|${x.key}">${sx && x.key===sx.key?"세움":"이 코디로 세움"}</button></div>`).join("")}</div>
        ${S.mqMore!==i ? `<button class="linkbtn" data-mqmore="${i}">더 보기</button>` : ""}`
      : `<div class="empty">이 계절에 쓸 수 있는 완료한 옷 조합이 없어요</div>`) : ""}
  </div>`;
}
const catTagG = g => `<span class="tag cat" style="--c:${TYPE_COLOR[g]||"#6B7280"}">${esc(layGName(g))}</span>`;
function viewMannequin(){
  const n = mqNow(), cnt = mqN();
  const doneN = DATA.clo.filter(c => cloDone(c) && MQ_KIND[c.site?.kind]).length;
  return `<section class="card">
    <div class="fhead rowhead"><span class="fh-l"><span class="sublbl" style="margin:0">마네킹</span><span class="hint">계절·유행색은 회차별로 저장해요</span></span></div>
    <div class="sublbl" style="margin:6px 0">계절</div>
    <div class="chips">${MQ_SEASONS.map(x => `<button class="chip ${n.season===x?"on":""}" data-nows="${x}" aria-pressed="${n.season===x}">${x}</button>`).join("")}</div>
    <div class="sublbl" style="margin:10px 0 6px">유행색</div>
    <div class="chips">${[["","모름"], ...MQ_COLORS.map(c => [c,c])].map(([v,l]) => `<button class="chip sm ${n.trend===v?"on":""}" data-nowt="${esc(v)}" aria-pressed="${n.trend===v}">${v?`<i class="trdot" style="background:${TREND_HEX[v]||"#ccc"}"></i>`:""}${esc(l)}</button>`).join("")}</div>
    <div class="sublbl" style="margin:10px 0 6px">마네킹 수</div>
    ${seg(["1","2","3","4","5"], String(cnt), "mqn")}
    <div class="hint" style="margin-top:10px">완료한 옷 ${doneN}벌로 추천해요. 상의+하의(또는 셋업)에 아우터·액세서리까지 넣어요.
      확률은 사이트 빌더의 게임 식(계절·유행색·셋업·상하 궁합, 상의·하의만 계산)이고 손님이 좋아하는 색은 빠져 있어요. 다른 마네킹에 세운 옷은 흐리게 보여요. 출처: KairoHistory 코디 빌더</div>
  </section>
  <section class="card"><div class="cardgrid mqgrid">${Array.from({length: cnt}, (_, i) => mqCard(i)).join("")}</div></section>`;
}

/* ---------- 다음에 만들 옷 (의류 탭 맨 위) ----------
   가진 옷본·재료·옵션(회차별 runs/rN/ui/recipes)으로 만들 수 있는 미완료 옷을 이유 태그와 함께 보여 준다.
   이름은 노트 옷 목록의 표기(c.p·c.m·c.o)를 그대로 쓴다. 옵션이 없는 옷은 옵션 조건 없음. */
const NM_KEYS = [["pat","옷본","p"],["mat","재료","m"],["opt","옵션","o"]];
const nmVals = k => { const f = NM_KEYS.find(x => x[0]===k)[2]; const cnt = {}; DATA.clo.forEach(c => { const v = c[f]; if (v && v!=="???") cnt[v] = (cnt[v]||0) + 1; }); return chipOrdered(k, Object.keys(cnt).sort((a,b) => cnt[b]-cnt[a])); };
const nmNeed = c => NM_KEYS.map(([k,l,f]) => [k, l, c[f]]).filter(([,,v]) => v && v!=="???");
/* 가진 옷본·재료·옵션은 자동(제제 2026-11-09): 만든 옷(체크가 필요한 옷은 완료 체크, 일반 옷은 만든 걸로 보되 필요한 옵션에 넣은 옷은 제외)에 쓰인 값 */
const cloMade = c => tracked(c) ? cloDone(c) : !(S.optPicks||[]).includes(c.id);
function autoOwn(){
  const own = {pat:new Set(), mat:new Set(), opt:new Set()};
  DATA.clo.forEach(c => { if (!cloMade(c)) return; NM_KEYS.forEach(([k,,f]) => { const v = c[f]; if (v && v!=="???") own[k].add(v); }); });
  return own;
}
let _own = null;
const nmMissing = c => nmNeed(c).filter(([k,,v]) => !_own[k].has(v));
function nmLastOfSet(){   /* 유효 세트에서 이 옷만 남은 경우 */
  const m = new Map();
  (DATA.sets||[]).filter(s => s.valid).forEach(s => { const left = (s.clothes||[]).filter(id => { const c = CLO_BY_ID.get(id); return !c || !cloDone(c); });
    if (left.length===1 && CLO_BY_ID.get(left[0])) m.set(left[0], [...(m.get(left[0])||[]), s.id]); });
  return m;
}
function nextMakeCard(){
  _own = autoOwn();
  const ownN = NM_KEYS.reduce((a,[k]) => a + _own[k].size, 0);
  const todo = DATA.clo.filter(c => !cloMade(c) && c.done !== undefined);
  const last = nmLastOfSet();
  const tags = c => [last.has(c.id) && semTag("part", `세트 1벌 남음`), isOptKind(c) && c.done!==null && `<span class="tag">추가옵션</span>`, isBtKind(c) && `<span class="tag">전투 추천</span>`, isCoKind(c) && `<span class="tag">손님 요청</span>`].filter(Boolean);
  const can = todo.filter(c => nmNeed(c).length && !nmMissing(c).length).map(c => ({c, t:tags(c)})).sort((a,b) => b.t.length - a.t.length || cloName(a.c).localeCompare(cloName(b.c),"ko"));
  /* 하나만 더 있으면 만들 수 있는 옷이 많은 옷본·재료·옵션 */
  const unlock = {};
  todo.forEach(c => { const ms = nmMissing(c); if (ms.length===1){ const key = `${ms[0][1]} ${ms[0][2]}`; unlock[key] = (unlock[key]||0) + 1; } });
  const unl = Object.entries(unlock).sort((a,b) => b[1]-a[1]).slice(0, 6);
  const shown = S.nmAll ? can : can.slice(0, 8);
  const row = ({c, t}) => `<div class="nmrow"><button type="button" class="iconbtn act" data-nmdone="${c.id}" aria-label="${esc(cloName(c))} 완료">${ICON.ok}</button>
    <span class="nm-n">${esc(cloName(c))}<small class="desc">${esc([c.p, c.m, c.o].filter(Boolean).join(" · "))}</small></span><span class="nm-t">${t.join("")}</span></div>`;
  const ownLine = NM_KEYS.map(([k,l]) => `${l} ${_own[k].size}/${nmVals(k).length}`).join(" · ");
  const body = !S.nmOpen ? "" : `
    <div class="hint" style="margin:2px 0 8px">가진 것은 만든 옷 기준으로 자동 계산해요(${ownLine}). 일반 옷은 만든 걸로 보고, 필요한 옵션에 넣은 옷은 빼요.</div>
    ${ownN ? (can.length ? `<div class="nmlist">${shown.map(row).join("")}</div>${can.length>8?`<button class="linkbtn" data-nm="all">${S.nmAll?"접기":`${can.length-8}벌 더 보기`}</button>`:""}` : `<div class="empty">지금 가진 것으로 만들 수 있는 미완료 옷이 없어요</div>`) : ""}
    ${ownN && unl.length ? `<div class="sublbl" style="margin:12px 0 6px">하나만 더 열면</div><div class="pills">${unl.map(([k,n]) => `<span class="pill">${esc(k)} <b>+${n}벌</b></span>`).join("")}</div>` : ""}`;
  return `<section class="card nmcard"><div class="fhead rowhead"><button class="fh-l linkhead" data-nm="open" aria-expanded="${S.nmOpen}"><span class="sublbl" style="margin:0">다음에 만들 옷</span><span class="hint">${`만들 수 있음 ${can.length}벌`}${last.size?` · 세트 1벌 남음 ${last.size}`:""}</span></button><span class="fh-act"><button class="chip sm" data-nm="open">${S.nmOpen?"접기":"열기"}</button></span></div>${body}</section>`;
}

/* 개량 옵션 찾기: 직원별 / 옵션별. +2 이상만 묶어서 보여주고 +1은 개수만 */
function upFinder(bare, staffOnly){
  const staff = DATA.up.staff.map(x => { const m = x.match(/^(.*) \((.*)\)$/); return {name:m?m[1]:x, g:m?m[2]:""}; });
  /* 오른쪽 아래 빠른 보기(staffOnly)에서는 특수 옵션을 뺌(제제 2026-11-09) */
  const opts = Object.keys(DATA.up.rows).filter(o => !staffOnly || !SP_OPTS.includes(o));
  const val = (o,i) => parseInt(DATA.up.rows[o][i]) || 0;
  const mode = staffOnly ? "직원별" : (S.upMode || "직원별");
  const groupLine = (items) => [4,3,2].map(n => { const xs = items.filter(x => x.v===n); return xs.length ? `<div class="upg"><span class="upv v${n}">+${n}</span><div class="pills">${xs.map(x => `<span class="pill ${n>=3?"must":""}">${esc(x.label)}</span>`).join("")}</div></div>` : ""; }).join("");
  let body = "";
  if (mode==="직원별"){
    const si = S.upStaff ?? 0;
    const sel = S.upMulti ? (S.upStaffs.length ? S.upStaffs : [si]) : [si];
    const block = i => { const items = opts.map(o => ({label:o, v:val(o,i)})); return `<div class="upblk">${S.upMulti?`<div class="upname"><b>${esc(staff[i].name)}</b><span>${esc(staff[i].g)}</span></div>`:""}${groupLine(items)}<div class="hint" style="margin-top:4px">나머지 ${items.filter(x => x.v<=1).length}개 옵션은 +1</div></div>`; };
    body = `<div class="chips" style="margin-top:10px">${staff.map((x,i) => `<button class="chip ${sel.includes(i)?"on":""}" data-upstaff="${i}" aria-pressed="${sel.includes(i)}">${esc(x.g)}<b>${esc(x.name)}</b></button>`).join("")}</div>
      <div style="margin-top:12px;display:flex;flex-direction:column;gap:${S.upMulti?14:0}px">${sel.map(block).join("")}</div>`;
  } else {
    const o = S.upOpt && DATA.up.rows[S.upOpt] ? S.upOpt : opts[0];
    const items = staff.map((x,i) => ({label:`${x.name} (${x.g})`, v:val(o,i)}));
    body = `<div class="chips" style="margin-top:10px">${opts.map(k => `<button class="chip ${k===o?"on":""}" data-upopt="${esc(k)}">${esc(k)}</button>`).join("")}</div>
      <div style="margin-top:12px">${groupLine(items) || `<div class="hint">모든 직원이 +1이에요</div>`}<div class="hint" style="margin-top:6px">나머지 직원 ${items.filter(x => x.v<=1).length}명은 +1</div></div>`;
  }
  if (staffOnly) return `<div class="qup"><div class="fhead" style="margin:0;gap:8px"><span class="hint">직원을 골라요</span><button class="chip sm ${S.upMulti?"on":""}" data-act="upmulti" aria-pressed="${!!S.upMulti}">다중선택</button></div>${body}</div>`;
  return `<div class="uppad ${bare?"":"uptop"}">
    <div class="sec-h" style="margin:14px 0 8px"><h2 style="font-size:16px">개량 옵션 찾기</h2></div>
    <div class="fhead" style="margin:0;gap:8px">${seg(["직원별","옵션별"], mode, "upmode")}${mode==="직원별"?`<button class="chip sm ${S.upMulti?"on":""}" data-act="upmulti" aria-pressed="${!!S.upMulti}">다중선택</button>`:""}</div>
    ${body}
  </div>`;
}
function upTable(note){
  const hl = S.upHl;
  return `<div class="uppad2"><div class="tbl-wrap"><table class="up"><thead><tr><th>옵션</th>${DATA.up.staff.map((s,i)=>{const m=s.match(/^(.*) \((.*)\)$/);return `<th class="${hl===i?"hl":""}"><button class="thbtn" data-uphl="${i}" aria-pressed="${hl===i}">${m?esc(m[2]):esc(s)}<br><span style="opacity:.7">${m?esc(m[1]):""}</span></button></th>`}).join("")}</tr></thead>
      <tbody>${Object.entries(DATA.up.rows).map(([k,vs])=>`<tr><td>${esc(k)}</td>${vs.map((v,i)=>{const n=parseInt(v);return `<td class="${hl===i?"hl":""}"><i class="uv v${Math.min(n,4)}">${esc(v)}</i></td>`}).join("")}</tr>`).join("")}</tbody></table></div>
      <p style="font-size:12px;color:var(--fg3);margin:10px 0 0">+3 이상만 색으로 표시했어요. 표는 옆으로 밀어서 볼 수 있어요.</p></div>`;
}
/* 메인 화면 개량 옵션 카드: 찾기는 항상 보이고, 표는 펼쳐서 봄 */
function homeLegend(){
  const o = !!S.homeLegend;
  return `<section class="card fold-card ${o?"open":""}">
    <button class="fold-h" data-act="hlegend" aria-expanded="${o}"><span class="fold-ic lgic">${ICON.tagic}</span><span class="fold-t"><b>태그 색 안내</b><span>장르는 채움, 상태는 테두리</span></span>${ICON.chev}</button>
    ${o ? `<div class="fold-b">
      <div class="sublbl" style="margin:0 0 8px">옷 장르</div>
      <div class="pills">${Object.keys(CAT_COLOR).map(catTag).join("")}</div>
      <div class="sublbl" style="margin:14px 0 8px">시설 장르</div>
      <div class="pills">${Object.keys(TYPE_COLOR).map(typeTag).join("")}</div>
      <div class="sublbl" style="margin:14px 0 8px">상태 · 추가옵션</div>
      <div class="pills">${semTag("guest","손님 이름")}${semTag("shop","매장(선호 손님)")}${semTag("item","인기 UP 씨앗(선호 손님)")}${semTag("battle","전투 추천")}${semTag("sp","★ 특수 옵션")}${semTag("fc","패션 체크 번호")}${semTag("done","완료")}${semTag("part","일부완료")}${semTag("fix","수정됨")}${semTag("wrong","잘못된 정보")}<span class="tag nostore">아직 없는 매장</span></div>
    </div>` : ""}
  </section>`;
}
function homeUp(){
  return `<section class="card flush">
    ${upFinder(true)}
    <button class="upfold" data-act="huptbl" aria-expanded="${!!S.homeUpTbl}">개량 옵션 표 ${S.homeUpTbl?"접기 ▴":"펼치기 ▾"}</button>
    ${S.homeUpTbl ? upTable() : ""}
  </section>`;
}
function viewBattle(){
  return `<section class="card flush">${DATA.battles.map(b => `<div class="coord">
      <div class="who">${esc(b.name)} <span class="tag blue">${esc(b.stat)}</span></div>
      <div class="req">조건 ${esc(b.cond)} · 보상 ${esc(b.reward)}</div>
      ${b.ex.filter(Boolean).length?`<div class="pills">${b.ex.filter(Boolean).map(x=>`<span class="pill">${esc(x)}</span>`).join("")}</div>`:""}
      ${b.note?`<div class="note">${esc(b.note)}</div>`:""}</div>`).join("")}</section>`;
}
function viewUp(){ return `<section class="card flush">${upTable(true)}${upFinder()}</section>`; }

const fmtT = t => { const d=new Date(t); return `${d.getMonth()+1}.${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const kindLabel = {fac:"시설", clo:"의류", rename:"시설 이름", person:"인물 이름", type:"시설 장르", genre:"장르 이름", battle:"전투 비고", reset:"전체", staff:"직원 이름", pattern:"옷본 이름", cloname:"옷 이름", clofix:"옷 정보", coordreq:"코디 요청", coordwrong:"코디 정보 확인", chkname:"패션 체크 이름"};
const valLabel = (l,v) => (l.kind==="rename"||l.kind==="person"||l.kind==="type"||l.kind==="genre"||l.kind==="battle"||l.kind==="reset"||l.kind==="staff"||l.kind==="pattern"||l.kind==="cloname"||l.kind==="coordreq"||l.kind==="coordwrong"||l.kind==="chkname"||l.kind==="clofix") ? v : (v ? "완료" : "미완료");
/* 콘테스트 출현 년도 + 출현 당시 점수
   다음 출현 기록에서 등급이 올라갔거나(건너뛰기 포함) 콘테스트가 사라졌으면,
   올라간 년도에 입력한 점수를 "새 등급 바로 아래 등급"의 통과 점수로 쓸지 물어봄(보수적). 그 점수가 없으면(사라진 경우 포함) 묻지 않음.
   물어본 결과는 다음 년도 기록의 promo에 남겨서 다시 묻지 않음 */
const cyNum = v => Number(String(v ?? "").replace(/[^\d]/g,"")) || 0;
const cyRound = x => x.round || "";
const cyPrev = x => S.cyears.filter(o => o.picks && o.year != null && cyRound(o)===cyRound(x) && o.year < x.year && o.t !== x.t).sort((a,b) => b.year - a.year)[0];
const cyNext = x => S.cyears.filter(o => o.picks && o.year != null && cyRound(o)===cyRound(x) && o.year > x.year && o.t !== x.t).sort((a,b) => a.year - b.year)[0];
function cyPromos(from, to){
  if (!from || !to || !from.picks || !to.picks) return [];
  const out = [];
  CONTESTS.forEach(([k, n]) => {
    const g0 = GRADES.indexOf(from.picks[k]); if (g0 < 0) return;
    const g1 = to.picks[k] ? GRADES.indexOf(to.picks[k]) : GRADES.length;   /* 없어졌으면 우주급 다음 단계로 취급 */
    if (g1 <= g0) return;
    if ((to.promo||{})[k]) return;
    const gi = g1 - 1, score = cyNum(to.scores?.[k]), cur = cRec(cKey(k, gi));
    if (!score) return;   /* 올라간 년도에 점수를 안 넣었으면 묻지 않음(넣으면 그때 다시 물어봄) */
    out.push({k, n, gi, score, cur, fromY:from.year, toY:to.year, fromG:GRADES[g0], toG:to.picks[k] || "없어짐", toT:to.t, round:cyRound(from)});
  });
  return out;
}
function cyCheck(rec){
  const items = [...cyPromos(cyPrev(rec), rec), ...cyPromos(rec, cyNext(rec))];
  if (!items.length) return;
  S.cyAsk = {items, sel:Object.fromEntries(items.filter(x => x.score).map(x => [x.toT+"|"+x.k, true]))};
}
async function cyPromoMark(marks){   /* marks: [{toT,k,v}] */
  const byT = {}; marks.forEach(m => (byT[m.toT] = byT[m.toT] || {})[m.k] = m.v);
  for (const [t, pm] of Object.entries(byT)){
    const r = S.cyears.find(x => String(x.t) === String(t)); if (!r) continue;
    r.promo = {...(r.promo||{}), ...pm};
    if (db){ const {_id, ...data} = r; try{ await writeSerial("cyear/"+_id, data); }catch(e){} }
  }
}
async function cyApply(apply){
  const a = S.cyAsk; if (!a) return; S.cyAsk = null;
  const ok = a.items.filter(x => x.score), use = apply ? ok.filter(x => a.sel[x.toT+"|"+x.k]) : [];
  const recs = use.map(x => { const key = cKey(x.k, x.gi), cur = cRec(key);
    return [key, {contest:x.k, grade:GRADES[x.gi], score:x.score, result:"성공", t:Date.now(), by:"app", from:`${x.round} ${x.toY}년 입력 점수`, prev: cur ? {score:cur.score, result:cur.result} : null, hist: cHistNext(cur)}]; });
  S.contests = [...S.contests.filter(r => !recs.some(([k]) => k===r._id)), ...recs.map(([k,r]) => ({_id:k, ...r}))];
  render();
  if (use.length) toast(`${use.map(x => `${x.n} ${GRADES[x.gi]}`).join(", ")} 성공으로 바꿨어요`);
  if (db) for (const [k, r] of recs){ try{ await writeSerial("contest/"+k, r); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); } }
  await cyPromoMark(ok.map(x => ({toT:x.toT, k:x.k, v: use.includes(x) ? "ok" : "skip"})));
  render();
}
function cyAskBox(){
  const a = S.cyAsk; if (!a) return "";
  const ok = a.items.filter(x => x.score), miss = a.items.filter(x => !x.score);
  const line = x => { const cur = x.cur ? `지금 ${GRADES[x.gi]} 기록 ${nf(x.cur.score)}점 ${x.cur.result}` : `${GRADES[x.gi]} 기록 없음`;
    return `<b>${x.n}</b> ${x.fromY}년 ${x.fromG} → ${x.toY}년 ${x.toG}<br><span class="hint">${x.toY}년 입력 점수 ${nf(x.score)}점을 <b>${GRADES[x.gi]}</b> 통과 점수로 · ${cur}</span>`; };
  return `<div class="cyask" role="group" aria-label="입력 점수로 통과 처리">
    <div class="cyask-h">${ICON.spark}<b>등급이 올라간 콘테스트가 있어요</b></div>
    <p class="hint" style="margin:2px 0 10px">지금 년도에 입력한 점수를 아래 등급 통과 점수로 쓰고 성공으로 바꿀까요? 건너뛴 경우는 새 등급 바로 아래 등급에만 넣어요.</p>
    ${ok.map(x => { const id = x.toT+"|"+x.k, on = !!a.sel[id]; return `<button type="button" class="cyask-it ${on?"on":""}" data-cyasel="${id}" aria-pressed="${on}"><span class="ck">${on?ICON.ok:""}</span><span>${line(x)}</span></button>`; }).join("")}
    ${miss.length ? `<div class="hint" style="margin-top:8px">${miss.map(x => `${x.n} ${x.fromY}년 ${x.fromG} → ${x.toY}년 ${x.toG}`).join(" · ")} — ${miss.length>1?"이 콘테스트들은 ":""}${miss[0].fromY}년 점수가 없어요. 그 년도 기록에 점수를 넣으면 다시 물어볼게요.</div>` : ""}
    <div class="frow" style="margin-top:12px">${ok.length ? `<button class="btn ghost" type="button" data-act="cya-no">안 바꿀래요</button><button class="btn" type="button" data-act="cya-ok" style="flex:1">고른 것 성공으로 바꾸기</button>` : `<button class="btn ghost" type="button" data-act="cya-close" style="flex:1">확인</button>`}</div>
  </div>`;
}
/* 이번 회차 출현 기록 다음 년도(없으면 1년) */
const cyThisRound = () => roundLabel();
const cyNextYear = () => { const ys = S.cyears.filter(x => cyRound(x) === cyThisRound() && x.year != null).map(x => +x.year); return ys.length ? Math.max(...ys) + 1 : 1; };
/* 콘테스트 칸(예: charm-g1)에 맞는 출현 년도 점수: 그 등급으로 나온 기록 중 가장 최근 것 */
const cyScoreFor = key => { const [c, g] = key.split("-g"), gname = GRADES[+g-1];
  const xs = S.cyears.filter(x => x.picks?.[c] === gname && cyNum(x.scores?.[c])).sort((a,b) => cyRound(b).localeCompare(cyRound(a)) || (b.year ?? 0) - (a.year ?? 0) || b.t - a.t);
  return xs[0] ? {score: cyNum(xs[0].scores[c]), from: `${cyRound(xs[0])} ${xs[0].year}년 출현 점수`, t: xs[0].t || 0} : null; };
/* 콘테스트 기록의 이전 기록 목록(최신이 위). 예전 기록은 prev 하나만 있음 */
const cHist = r => !r ? [] : (r.hist || (r.prev ? [{score:r.prev.score, result:r.prev.result}] : []));
const cHistNext = cur => cur ? [...cHist(cur), {score:cur.score, result:cur.result, t:cur.t ?? null, from:cur.from || ""}].slice(-30) : [];
function yearCard(){
  const list = [...S.cyears].sort((a,b) => (cyRound(b)).localeCompare(cyRound(a)) || (b.year ?? 0) - (a.year ?? 0) || b.t - a.t);
  const byRound = {}; list.forEach(x => (byRound[x.round] = byRound[x.round] || []).push(x));
  const pick = S.cyPick || {};
  const showText = x => x.picks ? CONTESTS.filter(([k]) => x.picks[k]).map(([k,n]) => `${n} ${x.picks[k]}${x.scores?.[k]?` <b class="cysc">${nf(cyNum(x.scores[k]))}</b>`:""}`).join(" · ") : esc((x.text||"").split(",").slice(1).map(t => t.trim().replace("모델 그랑프리","모델 쇼")).filter(Boolean).join(" · "));
  const showYear = x => x.year != null ? `${x.year}년` : ((x.text||"").split(",")[0] || "-").trim();
  const edit = x => `<form class="ed soft cyedit" data-cyeform="${x._id}">
      ${CONTESTS.filter(([k]) => x.picks[k]).map(([k,n]) => `<label class="cyline cyl2"><span class="cyname">${n} <span class="hint">${x.picks[k]}</span></span><input class="field cysin" id="cye-${k}" inputmode="numeric" autocomplete="off" value="${esc(S.optDraft["cye-"+k] ?? x.scores?.[k] ?? "")}" placeholder="점수"></label>`).join("")}
      <div class="frow"><button class="btn ghost" type="button" data-cyedit="">취소</button><button class="btn" type="submit" style="flex:1">점수 저장</button></div>
    </form>`;
  return `<section class="card">
    <div class="sec-h"><h2>콘테스트 출현 년도</h2><span>${list.length}건</span></div>
    <form class="ed soft" id="cyForm">
      <label class="fld" style="max-width:160px"><span class="fl">년도</span><div class="inl"><input class="field" id="cyYear" inputmode="numeric" value="${esc(S.optDraft.cyYear ?? cyNextYear())}" placeholder="1"><span class="hint" style="align-self:center">년</span></div></label>
      <div class="cyhead"><span>콘테스트 · 등급</span><span>당시 점수</span></div>
      ${CONTESTS.map(([k,n]) => `<div class="cyline cyl3"><span class="cyname">${n}</span><div class="seg cyseg">${GRADES.map(g => `<button type="button" class="${pick[k]===g?"on":""}" data-cypick="${k}|${g}">${g}</button>`).join("")}</div><input class="field cysin" id="cys-${k}" inputmode="numeric" autocomplete="off" value="${esc(S.optDraft["cys-"+k] ?? "")}" placeholder="점수" aria-label="${n} 당시 점수"></div>`).join("")}
      ${S.cyErr?`<div class="err">${esc(S.cyErr)}</div>`:""}
      <div class="ed-act"><button class="btn" type="submit" style="flex:1">추가</button></div>
    </form>
    ${cyAskBox()}
    ${(() => { const cur = cyThisRound(), rows = ([r, xs]) => `<div class="sublbl" style="margin-top:14px">${esc(r)}</div>
      ${xs.map(x => `<div class="cyrow"><span class="fcnum" style="background:var(--blue-soft);color:var(--blue-ink)">${esc(showYear(x))}</span><span style="flex:1;min-width:0">${showText(x)}</span>${x.picks?`<button class="iconbtn" data-cyedit="${x._id}" aria-label="${esc(showYear(x))} 점수 입력" aria-pressed="${S.cyEdit===x._id}">${ICON.pen}</button>`:""}<button class="iconbtn" data-cydel="${x._id}" aria-label="기록 삭제">${ICON.x}</button></div>
      ${S.cyEdit===x._id && x.picks ? edit(x) : ""}`).join("")}`;
      const all = Object.entries(byRound), now = all.filter(([r]) => r === cur), old = all.filter(([r]) => r !== cur), o = !!S.cyPrevOpen;
      const oldN = old.reduce((a, [, xs]) => a + xs.length, 0);
      return (now.map(rows).join("") || `<div class="hint" style="margin-top:10px;text-align:center">${esc(cur)} 기록은 아직 없어요</div>`)
        + (old.length ? `<div class="prevfold"><button type="button" class="prevbtn" data-act="cyprev" aria-expanded="${o}">이전 회차 기록 ${oldN}건 ${o?"접기 ▴":"보기 ▾"}</button></div>${o ? old.map(rows).join("") : ""}` : ""); })()}
  </section>`;
}
async function addYear(){
  const y = Number(String(document.getElementById("cyYear")?.value || "").replace(/[^\d]/g,""));
  const picks = {...(S.cyPick||{})}, scores = {};
  CONTESTS.forEach(([k]) => { const v = cyNum(document.getElementById("cys-"+k)?.value); if (v) scores[k] = v; });
  if (!y){ S.cyErr = "년도를 숫자로 넣어 주세요"; render(); return; }
  if (!Object.keys(picks).length){ S.cyErr = "등급을 하나 이상 골라 주세요"; render(); return; }
  const noG = Object.keys(scores).filter(k => !picks[k]);
  if (noG.length){ S.cyErr = `${noG.map(k => CONTESTS.find(c => c[0]===k)[1]).join(", ")}는 점수만 있고 등급이 없어요`; render(); return; }
  const round = roundLabel();
  const rec = {year:y, picks, round, t:Date.now(), ...(Object.keys(scores).length ? {scores} : {})};
  S.cyErr = ""; S.cyPick = {}; delete S.optDraft.cyYear; CONTESTS.forEach(([k]) => delete S.optDraft["cys-"+k]);
  const local = {_id:"l"+rec.t, ...rec};
  S.cyears = [...S.cyears, local]; cyCheck(local); render();
  if (!db) return;
  try{ const ref = await db.collection("cyear").add(rec); if (ref?.id) local._id = ref.id; toast(`${y}년 출현 기록을 추가했어요`); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
async function saveYearScores(id){
  const r = S.cyears.find(x => x._id === id); if (!r) return;
  const scores = {};
  CONTESTS.filter(([k]) => r.picks[k]).forEach(([k]) => { const v = cyNum(document.getElementById("cye-"+k)?.value); if (v) scores[k] = v; });
  r.scores = scores; S.cyEdit = null; CONTESTS.forEach(([k]) => delete S.optDraft["cye-"+k]);
  cyCheck(r); render(); toast(`${r.year}년 점수를 저장했어요`);
  if (db){ const {_id, ...data} = r; try{ await writeSerial("cyear/"+_id, data); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); } }
}
function charmCard(){
  const gs = DATA.gs; if (!gs || !gs.items.length) return "";
  const nm = id => { const c = DATA.clo.find(o => o.id === id); return c ? cloName(c) : "#"+id; };
  const its = gs.items, n = its.length;
  const avg = its.reduce((a,x) => a + x[2], 0) / n, avgQ = its.reduce((a,x) => a + x[1], 0) / n;
  const goal = 350, over = its.filter(x => x[2] >= goal).length;
  const low = [...its].sort((a,b) => a[2]-b[2]).slice(0,8);
  const pct = Math.min(100, Math.round(avg/goal*100));
  return `<section class="card">
    <div class="sec-h"><h2>옷 매력 현황</h2><span>${esc(gs.date)} 게임 기준 · ${n}벌</span></div>
    <div class="frow" style="gap:18px;flex-wrap:wrap">
      <div><div class="hint">평균 매력</div><div style="font-size:24px;font-weight:800">${avg.toFixed(1)}</div></div>
      <div><div class="hint">평균 품질</div><div style="font-size:24px;font-weight:800">${avgQ.toFixed(1)}</div></div>
      <div><div class="hint">매력 ${goal} 이상</div><div style="font-size:24px;font-weight:800">${over}벌</div></div>
    </div>
    <div class="bar" style="margin-top:10px;height:8px;border-radius:4px;background:var(--line);overflow:hidden"><div style="width:${pct}%;height:100%;background:var(--blue)"></div></div>
    <div class="hint" style="margin-top:6px">일본 위키 게시판에 매력 그랑프리 우주급은 옷 전체 평균 매력 ${goal} 이상이라는 제보가 있어요 (검증 안 됨).</div>
    <div class="sublbl" style="margin-top:12px">매력 낮은 옷</div>
    ${low.map(x => `<div class="cyrow"><span style="flex:1;min-width:0">${esc(nm(x[0]))}</span><span class="hint">품질 ${x[1]}</span><b style="margin-left:10px">${x[2]}</b></div>`).join("")}
  </section>`;
}
const nf = n => n.toLocaleString("ko-KR");
function contestForm(key, inline){
  const r = cRec(key);
  const hint = S.cMsg ? `<div class="${S.cMsgErr?"err":"hint"}">${esc(S.cMsg)}</div>`
    : S.cFrom && cyNum(S.cScore)===S.cFrom.score ? `<div class="hint">${esc(S.cFrom.from)}를 넣어 뒀어요 · 고쳐서 저장해도 돼요</div>`
    : !r ? `<div class="hint">실패는 더 높은 점수일 때만 바뀌고, 성공하면 그 점수로 바뀌어요.</div>` : "";
  const hist = r ? [{...r, now:true}, ...cHist(r).slice().reverse()] : [];
  return `<form class="ed cform ${inline?"detail":""}" id="cEditForm" data-key="${key}">
          <div class="cform-row"><input class="field" id="cScore" inputmode="numeric" placeholder="${r?nf(r.score)+"점보다 높게":"점수"}" value="${esc(S.cScore)}" aria-label="점수"><div class="opts">${[["실패","lg-red"],["성공","lg-green"]].map(([k,cl]) => `<button type="button" class="opt ${S.cRes===k?"on":""}" data-cres="${k}" aria-pressed="${S.cRes===k}"><i class="${cl}"></i>${k}</button>`).join("")}</div><button class="btn" type="submit">저장</button></div>
          ${hint}
          ${hist.length ? `<div class="chist"><div class="chist-h"><span>점수 기록 ${hist.length}건</span>${S.cReset?`<span class="chist-act"><button class="linkbtn" type="button" data-creset="0">취소</button><button class="linkbtn danger" type="button" data-cresetok="${key}">정말 지우기</button></span>`:`<button class="linkbtn" type="button" data-creset="1">기록 지우기</button>`}</div><div class="chist-list">${hist.map(x => `<div class="chist-row"><span class="tag ${x.result==="성공"?"green":"red"}">${x.result}</span><b>${nf(x.score)}점</b><span class="hint">${x.now?"지금 기록":""}${x.t?`${x.now?" · ":""}${fmtT(x.t)}`:x.now?"":"날짜 없음"}${x.by==="chat"?" · 대화":""}${x.from?` · ${esc(x.from)}`:""}</span></div>`).join("")}</div></div>` : ""}
        </form>`;
}
/* 사이트 콘테스트 20개: 이름 "숍 어워드 Lv.2" → 노트 칸(Lv.1~4 = 초급~우주급으로 봄) */
const siteContest = (cname, gi) => (DATA.contests||[]).find(x => String(x.name||"").replace(/\s/g,"") === `${cname}Lv.${gi+1}`.replace(/\s/g,""));
const contestSiteLine = sc => !sc ? "" : [sc.score!=null ? `통과 ${nf(sc.score)}점` : "", sc.prize!=null ? `${nf(sc.prize)}G` : "", sc.option ? `보상 ${sc.option}` : ""].filter(Boolean).join(" · ");
function viewContest(){
  const filled = S.contests.length;
  return `${yearCard()}<section class="card">
    <div class="sec-h"><h2>콘테스트 통과 기준</h2><span>${filled} / ${CONTESTS.length*GRADES.length} 기록</span></div>
    <p style="margin:0;color:var(--fg2);font-size:14px">칸마다 사이트 통과 점수·상금·보상 옵션을 먼저 보여 줘요. 칸을 누르면 내 점수 기록을 보고 남길 수 있어요(실패는 더 높은 점수일 때만, 성공은 그 점수로 바뀌어요).</p>
    <div class="hint" style="margin-top:6px">Lv.1~4를 초급~우주급으로 맞췄어요 · 출처: KairoHistory 콘테스트</div>
  </section>
  ${CONTESTS.map(([c, cname]) => {
    const done = GRADES.filter((_, gi) => cRec(cKey(c, gi))?.result === "성공").length;
    return `<section class="card">
    <div class="sec-h"><h2>${cname}</h2><span>통과 ${done} / ${GRADES.length}</span></div>
    <div class="flushlist" style="margin-bottom:-8px">${GRADES.map((g, gi) => {
      const key = cKey(c, gi), r = cRec(key), ed = S.cEdit === key;
      const line = !r ? "내 기록 없음" : r.result === "성공" ? `내 기록 ${nf(r.score)}점 통과${r.from?` · ${r.from}`:""}` : `내 기록 ${nf(r.score)}점 부족`;
      const sc = siteContest(cname, gi), sl = contestSiteLine(sc);
      return `<div class="${ed?"open":""}">
        <button class="row" data-cedit="${key}">
          <span class="grade-dot g${gi+1}" aria-hidden="true">${g[0]}</span>
          <div class="body"><div class="t">${g} ${r?`<span class="tag ${r.result==="성공"?"green":"red"}">${r.result}</span>`:""}</div>${sl?`<div class="s cs-site">${esc(sl)}</div>`:""}<div class="s">${line}</div></div>
          ${r?`<span class="cscore">${nf(r.score)}</span>`:""}
          ${ICON.chev}
        </button>
        ${ed ? (sc?.appear && sc.appear!=="항상" ? `<div class="hint" style="padding:0 0 6px 44px">등장: ${esc(sc.appear.replace(/^조건:\s*/,""))}</div>` : "") + contestForm(key, true) : ""}
      </div>`; }).join("")}</div>
  </section>`; }).join("")}`;
}

function renameCard(){
  const isFac = S.rnKind === "시설";
  const opts = isFac ? DATA.fac.map(facName) : peopleNow().sort((a,b)=>a.localeCompare(b,"ko"));
  const cur = opts.includes(S.rnOld) ? S.rnOld : "";
  let hint = "";
  if (cur && !isFac){
    const bases = BASE_PEOPLE.filter(b => curPerson(b) === cur);
    const nc = DATA.coord.filter(c => bases.includes(c.pb)).length;
    const nx = DATA.clo.filter(c => bases.some(b => (c.x||"").includes(b))).length;
    hint = `코디 요청 ${nc}건${nx?`, 옷 목록 추가옵션 ${nx}건`:""}이 함께 바뀌어요.`;
  } else if (cur) hint = "시설 정리 원본 이름이 바뀌어요.";
  return `<section class="card">
    <div class="sec-h"><h2>번역 이름 수정</h2></div>
    <form id="rnForm" class="ed soft">
      <div class="fld"><span class="fl">무엇을 바꾸나요?</span><div class="opts">${["시설","인물"].map(k => `<button type="button" class="opt ${S.rnKind===k?"on":""}" data-rnkind="${k}" aria-pressed="${S.rnKind===k}">${k}</button>`).join("")}</div></div>
      <label class="fld"><span class="fl">현재 이름</span><select class="field" id="rnOld" aria-label="현재 이름"><option value="">${isFac?"시설":"인물"} 선택</option>${opts.map(o=>`<option ${o===cur?"selected":""}>${esc(o)}</option>`).join("")}</select></label>
      <label class="fld"><span class="fl">새 이름</span><div class="inl"><input class="field" id="rnNew" placeholder="새 한국어 이름" value="${esc(S.rnNew)}" aria-label="새 이름"><button class="btn" type="submit">바꾸기</button></div></label>
      ${S.rnErr?`<div class="err">${esc(S.rnErr)}</div>`:hint?`<div class="hint">${hint}</div>`:""}
    </form>
  </section>`;
}

function resetCard(){
  const nf = DATA.fac.filter(f => facDone(f) || facPartial(f)).length;
  const nc = DATA.clo.filter(c => c.done !== null && cloDone(c)).length;
  const ns = SP.filter(c => c.done===null && cloDone(c)).length;
  return `<section class="card">
    <div class="sec-h"><h2>새 회차 시작</h2></div>
    <p style="margin:0;color:var(--fg2);font-size:14px">시설 완료·일부완료 ${nf}곳, 추가옵션 의류 ${nc}벌, 특수 옵션 ${ns}벌, 코디 최종 완료 ${S.coordDone.length}명이 미완료가 돼요. 전투 결과와 재시도 기록은 "이전 회차 기록" 아래로 옮겨져요. 이름 수정, 패션 체크 기록, 콘테스트 기록은 그대로예요. 의류 선택은 처음 값(모든 줄의 없음, 캐주얼·스트리트, 컷앤소·팬츠, 라운드넥·스트레이트)으로 돌아가요.</p>
    ${S.resetAsk ? `<div class="confirm"><span style="flex:1;min-width:160px">정말 전부 해제할까요? 되돌릴 수 없어요.</span><button class="btn sm ghost" data-act="reset-no">취소</button><button class="btn sm danger" data-act="reset-ok">초기화</button></div>`
      : `<div style="margin-top:12px"><button class="btn ghost" data-act="reset-ask" style="width:100%">체크 전부 해제</button></div>`}
  </section>`;
}
async function resetAll(){
  S.resetAsk = false;
  /* 전투: 지금 결과까지 기록으로 넘긴 뒤 이번 회차 기록 전체를 "이전 회차"로 옮김. 옷·능력 수치는 다음 시도의 출발점으로 남김 */
  const btNew = {};
  Object.entries(S.battleRec).forEach(([i, r]) => { const cur = (r.tries||[]).slice();
    if (r.res && Object.keys(r.res).length){ const t = btTotals(+i); cur.push({...t, res:r.res, t:Date.now()}); }
    if (!cur.length) return;
    btNew[i] = {...r, res:{}, tries:[], prev:[...(r.prev||[]), ...cur]}; delete btNew[i].result; });
  const nextRound = roundNo() + 1, newRun = `runs/r${nextRound}`;
  /* 새 추가옵션(opt)은 회차와 상관없는 노트 내용이라 새 위치로 옮김 */
  const carry = Object.entries(S.clo).filter(([, v]) => v && v.opt).map(([id, v]) => [id, {done:false, opt:v.opt}]);
  /* 새 회차 의류 선택 초기값(제제 2026-11-09): 처음부터 가진 장르·옷본·재료와 모든 줄의 [없음] */
  const selInit = {cat:["캐주얼","스트리트"], pat:["없음","컷앤소","팬츠"], mat:["없음","라운드넥","스트레이트"], opt:["없음"]};
  Object.entries(ROWF).forEach(([k,f]) => { S[f] = [...selInit[k]]; if (S[f].length > 1 && !S.cloMulti) S.cloRowMulti = {...S.cloRowMulti, [k]:true}; });
  selSig = JSON.stringify(curSel()); S.cloSlot = {...S.cloSlot, all:selInit, ...selInit}; remember();
  if (!db){ S.fac = {}; S.clo = Object.fromEntries(carry); S.coordDone = []; S.battleRec = {...S.battleRec, ...btNew}; S.roundNo = nextRound; render(); toast("새 회차를 시작했어요"); return; }
  try{
    for (const [id, v] of carry) await writeSerial(`${newRun}/clo/c${id}`, v);
    for (const [i, v] of Object.entries(btNew)) await writeSerial(`battles/b${i}`, v);
    await writeSerial("ui/slots", {slot:S.cloSlot});
    await db.collection("log").add({kind:"reset", id:"all", name:"회차 초기화", from:`${roundNo()}회차 (${RUN})`, to:`${nextRound}회차 (${newRun})`, t:Date.now(), synced:false, by:"app"});
    await writeSerial("meta/round", {n: nextRound, run: newRun, prevRun: RUN, t: Date.now(), by: "app"});
    toast("새 회차를 시작했어요"); setTimeout(() => location.reload(), 600);
  }catch(e){ showNotice("새 회차 시작 중 일부를 저장하지 못했어요. 다시 눌러 주세요."); }
}

/* ---------- 기존 노트에서 가져오기 (기록 탭 [관리]) ----------
   Claude가 기존 노트 저장소를 읽어 만든 가져오기 파일(fms-import JSON)을 골라, 로그인한 본인 계정으로 저장소에 쓴다.
   토큰 없이 아이패드에서도 된다(파일 앱 → 구글 드라이브). 경로는 정해진 것만 받고, 회차 정보(meta/round)는 마지막에 쓴다. */
const IMP_OK = /^(runs\/r\d+\/(fac\/f\d+|clo\/c\d+|misc\/coord|ui\/(recipes|goals|now|mqcfg)|mannequins\/m\d)|calc\/(clear|carry)|meta\/(round|verify)|memo\/reset|names\/(all|people)|checks\/k\d+|coordfix\/k\d+|cbattle\/c\d+|battles\/b\d+|contest\/[\w-]+|chkscore\/k\d+|cyear\/[\w-]+|layslots\/s\d|ui\/(slots|chiporder|coordopen|layout|optcnt)|log\/[\w-]+)$/;
const IMP_LABEL = {fac:"시설 체크", clo:"의류 체크·추가옵션", misc:"코디 완료", ui:"화면·가진 재료", calc:"클리어 포인트·회차 연계", meta:"회차 정보", memo:"메모", names:"이름", checks:"패션 체크 대상", coordfix:"코디 수정", cbattle:"추천 전투", battles:"전투 기록", contest:"콘테스트", chkscore:"패션 체크 점수", cyear:"출현 년도", layslots:"내 배치", log:"기록 로그", mannequins:"마네킹"};
const impKind = p => { const a = p.split("/"); return a[0]==="runs" ? a[2] : a[0]; };
function importCard(){
  const m = S.imp || {};
  const groups = {}; Object.keys(m.docs||{}).forEach(p => { const k = impKind(p); groups[k] = (groups[k]||0) + 1; });
  const total = Object.keys(m.docs||{}).length;
  return `<section class="card">
    <div class="sec-h"><h2>기존 노트에서 가져오기</h2><span>${total ? `${total}건` : ""}</span></div>
    <p style="margin:0;color:var(--fg2);font-size:14px">Claude가 만든 가져오기 파일(.json)을 고르면, 무엇을 넣을지 보여 준 뒤 이 계정으로 저장해요. 같은 칸은 파일 내용으로 바뀌어요.</p>
    <label class="btn ghost" style="width:100%;margin-top:12px;justify-content:center;cursor:pointer">파일 고르기<input type="file" id="impFile" accept=".json,application/json" hidden></label>
    ${m.err ? `<div class="err" style="margin-top:8px">${esc(m.err)}</div>` : ""}
    ${total ? `<div class="cs-line"><small>${esc(m.name||"")}${m.made?` · 만든 때 ${esc(m.made)}`:""}${m.note?` · ${esc(m.note)}`:""}</small>${Object.entries(groups).map(([k,n]) => `<span class="tag plain">${esc(IMP_LABEL[k]||k)} ${n}</span>`).join("")}</div>
      ${m.skip ? `<div class="hint" style="margin-top:6px">받지 않는 경로 ${m.skip}건은 뺐어요</div>` : ""}
      ${m.done ? `<div class="hint" style="margin-top:8px;color:var(--green)">${m.done}건 저장했어요${m.reload?" · 회차가 바뀌어 곧 새로 고쳐져요":""}</div>`
        : m.busy ? `<div class="hint" style="margin-top:8px">저장하는 중… ${m.prog||0}/${total}</div>`
        : `<div class="ed-act" style="margin-top:10px"><button class="btn ghost" data-act="impclear">취소</button><button class="btn" data-act="impgo" style="flex:1">${total}건 가져오기</button></div>`}` : ""}
  </section>`;
}
async function importRead(file){
  S.imp = {err:""}; render();
  try{
    const j = JSON.parse(await file.text());
    if (j?.format !== "fms-import" || !j.docs || typeof j.docs !== "object") throw new Error("가져오기 파일이 아니에요(format: fms-import)");
    const docs = {}; let skip = 0;
    for (const [p, d] of Object.entries(j.docs)) { if (IMP_OK.test(p) && d && typeof d === "object" && !Array.isArray(d)) docs[p] = d; else skip++; }
    if (!Object.keys(docs).length) throw new Error("넣을 수 있는 내용이 없어요");
    S.imp = {name:file.name, made:j.made||"", note:j.note||"", docs, skip};
  }catch(e){ S.imp = {err: e.message || "파일을 읽지 못했어요"}; }
  render();
}
async function importGo(){
  const m = S.imp; if (!m?.docs || m.busy) return;
  if (!db){ m.err = "저장소에 연결되지 않았어요"; render(); return; }
  const list = Object.entries(m.docs).sort(([a],[b]) => (a==="meta/round") - (b==="meta/round"));
  m.busy = true; m.prog = 0; render();
  try{
    for (const [p, d] of list){
      if (p === "meta/round" && d.run && d.run !== RUN) m.reload = true;
      await db.doc(p).set(d); m.prog++; if (m.prog % 20 === 0) render();
    }
    m.done = m.prog; m.busy = false; toast(`기존 노트 데이터 ${m.done}건을 가져왔어요`);
    if (db.collection) db.collection("log").add({kind:"reset", name:"기존 노트에서 가져오기", from:"", to:`${m.done}건`, t:Date.now(), synced:true, by:"app"}).catch(()=>{});
  }catch(e){ m.busy = false; m.err = `저장하다 멈췄어요(${m.prog}/${list.length}). 다시 누르면 처음부터 다시 써요.`; }
  render();
}
function viewLog(){
  const pend = pendingList();
  const hist = S.logs.slice(0, S.logAll ? 500 : 30);
  return `${importCard()}${renameCard()}${resetCard()}<section class="card">
    <div class="sec-h"><h2>시트에 반영할 변경</h2><span>${pend.length}건</span></div>
    <p style="margin:0;color:var(--fg2);font-size:14px">여기 쌓인 변경은 아직 구글 시트에 들어가지 않았어요. 대화에서 "시트에 반영해줘"라고 하면 이 목록대로 넣어 드려요.</p>
    ${pend.length ? `<div class="flushlist" style="margin-top:12px">${pend.map(p => `<div class="log"><span class="ic">${ICON.up}</span><div class="body"><div class="t">${esc(p.kind==="rename"||p.kind==="person"||p.kind==="cloname"?p.from:p.name)}</div><div class="s">${kindLabel[p.kind]} · ${esc(valLabel(p,p.from))} → <b style="color:var(--fg)">${esc(valLabel(p,p.to))}</b></div></div><span class="s" style="font-size:12px;color:var(--fg3)">${fmtT(p.t)}</span></div>`).join("")}</div>
    ${S.confirmSync ? `<div class="confirm"><span style="flex:1;min-width:160px">시트에 직접 옮겼다면 반영 완료로 표시할게요.</span><button class="btn sm ghost" data-act="sync-cancel">취소</button><button class="btn sm" data-act="sync-ok">반영 완료</button></div>`
      : `<div style="margin-top:12px"><button class="btn ghost" data-act="sync-ask" style="width:100%">직접 반영했어요</button></div>`}`
    : `<div class="empty" style="padding:20px 0 4px">모두 시트와 같아요</div>`}
  </section>
  <section class="card">
    <div class="sec-h"><h2>최근 기록</h2><span>${S.logs.length}건</span></div>
    ${hist.length ? `<div class="flushlist">${hist.map(l => `<div class="log"><span class="ic ${l.synced?"ok":""}">${l.synced?ICON.ok:ICON.log.replace('viewBox','width="18" height="18" viewBox')}</span><div class="body"><div class="t">${esc(l.kind==="rename"||l.kind==="person"||l.kind==="cloname"?l.from:l.name)}</div><div class="s">${kindLabel[l.kind]} · ${esc(valLabel(l,l.from))} → ${esc(valLabel(l,l.to))}${l.by==="chat"?" · 대화":""}${l.synced?" · 시트 반영됨":""}</div></div><span class="s" style="font-size:12px;color:var(--fg3)">${fmtT(l.t)}</span></div>`).join("")}</div>` : `<div class="empty">아직 바꾼 내용이 없어요. 시설이나 옷을 체크하면 여기에 남아요.</div>`}
    ${S.logs.length>30&&!S.logAll?`<button class="more" data-act="log-all">전체 기록 보기</button>`:""}
  </section>`;
}

/* ---------- 메인 ---------- */
const nf0 = n => n.toLocaleString("ko-KR");
const GS_BY = Object.fromEntries(((DATA.gs||{}).items||[]).map(x => [x[0], x]));
const coordPieces = c => { const cm = cloRenamed(); return [["상의",withClo(c.t,cm)],["하의",withClo(c.b,cm)],["아우터",withClo(c.o,cm)],["액세서리",withClo(c.a,cm)]].filter(x => x[1]); };
function homeSearch(q){
  const ql = q.toLowerCase(), has = v => String(v||"").toLowerCase().includes(ql);
  const clo = DATA.clo.filter(c => [c.n,cloName(c),c.p,c.m,c.o,c.col,c.tg,optOf(c).guest,optOf(c).like,optOf(c).likeDetail].some(has))
    .sort((a,b) => (has(cloName(b))&&cloName(b).startsWith(q)) - (has(cloName(a))&&cloName(a).startsWith(q)) || (b.done!==null) - (a.done!==null) || a.id-b.id);
  const ppl = {}; DATA.coord.forEach(c => { const n = curPerson(c.pb); if (has(n) || has(c.r) || coordPieces(c).some(x => has(x[1]))) (ppl[n] = ppl[n] || []).push(c); });
  const fac = DATA.fac.filter(f => has(facName(f)) || needOf(f).some(has));
  const chk = DATA.checks.map((c,oi) => ({c,oi})).filter(({c,oi}) => has(checkName(oi)) || c.b.some(has));
  return {clo, ppl, fac, chk};
}
const moreBtn = (n, go, label) => n > 0 ? `<button class="hmore" data-hgo="${go}">${label} ${n}개 더 보기 ${ICON.chev}</button>` : "";
function homeResults(q){
  const r = homeSearch(q);
  const pNames = Object.keys(r.ppl);
  const total = r.clo.length + pNames.length + r.fac.length + r.chk.length;
  if (!total) return `<div class="hempty">'${esc(q)}'(으)로 찾은 게 없어요. 옷 이름, 손님 이름, 시설, 옵션으로 찾아보세요.</div>`;
  const grp = (title, n, body) => n ? `<div class="hgrp"><div class="hgrp-h"><span>${title}</span><b>${n}</b></div>${body}</div>` : "";
  const cloRow = c => { const tr = tracked(c), d = tr && cloDone(c), o = S.homeOpen==="c"+c.id; const gg = GS_BY[c.id], g = gg ? [gg[1], gg[2]] : null;
    const inCoord = DATA.coord.filter(x => coordPieces(x).some(p => p[1]===cloName(c) || p[1]===c.n));
    return `<div class="hrow ${o?"open":""}">
      <div class="row ${d?"done":""}">
        ${tr ? `<button data-tclo="${c.id}" aria-pressed="${!!d}" aria-label="${esc(cloName(c))} 완료 바꾸기">${ck(d)}</button>` : `<span class="ck ghost" aria-hidden="true"></span>`}
        <button class="body" data-hopen="c${c.id}" style="text-align:left">
          <div class="t"><span class="item-number">#${String(c.id).padStart(3,"0")}</span><span class="n">${esc(cloName(c))}</span><span class="tag">${esc(c.c)}</span>${SP_OPTS.includes(c.o)?semTag("sp","★ "+esc(c.o)):""}</div>
          <div class="s">${[c.p,c.m,c.o].filter(Boolean).map(esc).join(" · ")}</div>${optLine(c)}
        </button>${ICON.chev}
      </div>
      ${o ? `<div class="detail"><dl class="kv">
        <dt>색</dt><dd>${esc(c.col)||"-"}</dd><dt>계절</dt><dd>${esc(c.s)||"-"}</dd><dt>태그</dt><dd>${esc(c.tg)||"-"}</dd>
        ${g?`<dt>품질·매력</dt><dd>${g[0]} · ${g[1]}</dd>`:""}
        ${inCoord.length?`<dt>코디 요청</dt><dd>${inCoord.map(x => esc(coordName(x)+" "+x.r)).join("<br>")}</dd>`:""}
      </dl></div>` : ""}
    </div>`; };
  const pRow = n => { const dn = S.coordDone.includes(n), list = r.ppl[n], o = S.homeOpen==="p"+n;
    return `<div class="hrow ${o?"open":""}">
      <div class="row ${dn?"done":""}">
        <button data-cdone="${esc(n)}" aria-label="${esc(n)} ${dn?"완료 취소":"코디 완료"}">${ck(dn)}</button>
        <button class="body" data-hopen="p${esc(n)}" style="text-align:left">
          <div class="t"><span class="n">${esc(n)}</span><span class="tag blue">코디 ${list.length}건</span></div>
          <div class="s">${list.map(c => esc((c.ps?c.ps+" ":"")+c.r)).join(" · ")}</div>
        </button>${ICON.chev}
      </div>
      ${o ? `<div class="detail">${list.map(c => `<div class="hcoord"><div class="who"><span class="tag">${esc(c.ps||"-")}</span>${esc(c.r)}</div><div class="pills">${coordPieces(c).map(([k,v]) => `<span class="pill"><span class="pk">${k}</span>${esc(v)}</span>`).join("")}</div>${c.e?`<div class="note">${esc(c.e)}</div>`:""}</div>`).join("")}</div>` : ""}
    </div>`; };
  const fRow = f => { const d = facDone(f);
    return `<div class="hrow"><div class="row ${d?"done":""}">
      <button data-tfac="${f.id}" aria-label="${esc(facName(f))} 완료 바꾸기">${ckFac(f)}</button>
      <div class="body"><div class="t"><span class="n">${esc(facName(f))}</span>${typeTag(f.type)}${fcTag(f)}</div>
      <div class="s">${needLine(f)}</div></div></div></div>`; };
  const kRow = ({c,oi}) => `<div class="hrow"><button class="row" data-fcgo="${oi}" style="text-align:left"><span class="fcnum">${oi+1}</span><div class="body"><div class="t"><span class="n">${esc(checkName(oi))}</span><span class="tag blue">${esc(c.req)}</span></div><div class="s">${c.b.filter(x=>x&&x!=="-").map(esc).join(" · ")}${c.reward?" · 보상 "+esc(c.reward):""}</div>${scoreLine(oi)}</div>${ICON.chev}</button></div>`;
  return grp("옷", r.clo.length, r.clo.slice(0,5).map(cloRow).join("") + moreBtn(r.clo.length-5, "cloq", "의류 탭에서"))
    + grp("코디 손님", pNames.length, pNames.slice(0,4).map(pRow).join("") + moreBtn(pNames.length-4, "coordq", "코디 탭에서"))
    + grp("시설", r.fac.length, r.fac.slice(0,4).map(fRow).join("") + moreBtn(r.fac.length-4, "facq", "시설 탭에서"))
    + grp("패션 체크", r.chk.length, r.chk.slice(0,3).map(kRow).join(""));
}
function homeTodo(){
  const fOpen = DATA.fac.filter(f => !facDone(f)), fPart = fOpen.filter(facPartial).length;
  const tr = DATA.clo.filter(c => c.done !== null), cOpen = tr.filter(c => !cloDone(c)).length;
  const ppl = peopleNow(), pOpen = ppl.filter(n => !S.coordDone.includes(n)).length;
  const spOpen = SP.filter(c => !cloDone(c)).length;
  const tile = (go, label, left, total, sub) => { const pct = total ? Math.round((total-left)/total*100) : 100;
    return `<button class="tile" data-hgo="${go}"><span class="tk">${label}</span><span class="tv">${left}<small>${left?"남음":"끝"}</small></span><span class="ts">${sub}</span><span class="bar"><i style="width:${pct}%"></i></span></button>`; };
  return `<section class="card">
    <div class="sec-h"><h2>남은 할 일</h2><span>누르면 미완료만 모아서 열려요</span></div>
    <div class="tiles">
      ${tile("fac", "시설", fOpen.length, DATA.fac.length, `${DATA.fac.length}곳 중${fPart?` · 일부 ${fPart}`:""}`)}
      ${tile("clo", "신규 손님 옷", cOpen, tr.length, `${tr.length}벌 중`)}
      ${tile("coord", "코디 손님", pOpen, ppl.length, `${ppl.length}명 중`)}
      ${tile("sp", "특수 옵션", spOpen, SP.length, `${SP.length}벌 중`)}
    </div>
  </section>`;
}
/* 기억할 것: 펌프킨 숍 리셋(시작 월부터 4개월마다), 손님 활동 목록 리셋 월(직접 고름) */
const MEMO_DEF = {pumpkin:null, guest:[1,6,10]};
const memoNow = () => ({...MEMO_DEF, ...(S.memo||{})});
const pumpkinMonths = m => m ? [0,1,2].map(i => (m - 1 + i*4) % 12 + 1).sort((a,b)=>a-b) : [];
const monthsText = ms => ms.length ? ms.map(m => `<span class="mchip">${m}월</span>`).join("") : "";
function memoSave(patch){ S.memo = {...memoNow(), ...patch}; render(); if (db) writeSerial("memo/reset", S.memo).catch(() => showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.")); }
function homeMemo(view){
  const m = memoNow(), ed = !view && !!S.memoEdit, pk = pumpkinMonths(m.pumpkin), gs = [...(m.guest||[])].sort((a,b)=>a-b);
  const grid = (attr, on) => `<div class="mgrid">${Array.from({length:12}, (_,i) => i+1).map(n => `<button type="button" class="chip sm ${on(n)?"on":""}" data-${attr}="${n}" aria-pressed="${on(n)}">${n}월</button>`).join("")}</div>`;
  const rows = `<div class="memo">
      <div class="mrow"><div class="mh"><b>펌프킨 숍 리셋</b><span>4개월마다</span></div>
        <div class="mv">${pk.length ? monthsText(pk) : `<span class="hint">아직 모름 · ${view?"메인 리셋 주기에서 고를 수 있어요":"수정에서 열린 월을 골라 주세요"}</span>`}</div>
        ${ed ? `<div class="hint" style="margin:8px 0 6px">열린 월 하나를 고르면 4개월 간격으로 채워요</div>${grid("mpk", n => pk.includes(n))}` : ""}</div>
      <div class="mrow"><div class="mh"><b>손님 활동 목록 리셋</b><span>회차마다 확인</span></div>
        <div class="mv">${gs.length ? monthsText(gs) : `<span class="hint">고른 월 없음</span>`}</div>
        ${ed ? `<div class="hint" style="margin:8px 0 6px">리셋되는 월을 모두 골라요</div>${grid("mgs", n => gs.includes(n))}` : ""}</div>
    </div>`;
  if (view) return rows;
  return `<section class="card">
    <div class="sec-h"><h2>리셋 주기</h2><button class="chip sm ${ed?"on":""}" data-act="memoedit" aria-pressed="${ed}">${ed?"완료":`${ICON.pen}수정`}</button></div>
    ${rows}
  </section>`;
}
function homeRecent(){
  const list = S.logs.filter(l => ["fac","clo","rename","person","cloname","clofix","coordreq"].includes(l.kind)).slice(0, 6);
  const canUndo = l => { if (l.kind==="fac"){ const f = DATA.fac.find(x => x.id===l.id); return f && facDone(f)===l.to; } if (l.kind==="clo"){ const c = DATA.clo.find(x => x.id===l.id); return c && cloDone(c)===l.to; } return false; };
  const o = !!S.homeRc, last = list[0];
  return `<section class="card fold-card ${o?"open":""}">
    <button class="fold-h" data-act="hrc" aria-expanded="${o}"><span class="fold-ic rcic">${ICON.ok}</span><span class="fold-t"><b>최근에 바꾼 것</b><span>${last ? `${esc(last.kind==="rename"||last.kind==="person"||last.kind==="cloname"?last.to:last.name)} · ${fmtT(last.t)}` : "아직 없음"}</span></span>${ICON.chev}</button>
    ${o ? `<div class="fold-b">${list.length ? `<div class="rlist">${list.map(l => `<div class="rrow">
      <span class="rdot ${l.to===true?"on":""}" aria-hidden="true">${l.to===true?ICON.ok:""}</span>
      <div class="body"><div class="t">${esc(l.kind==="rename"||l.kind==="person"||l.kind==="cloname"?l.from+" → "+l.to:l.name)}</div><div class="s">${kindLabel[l.kind]} · ${l.kind==="fac"||l.kind==="clo" ? (l.to?"완료로 체크":"미완료로 되돌림") : l.kind==="clofix"||l.kind==="coordreq" ? `${esc(l.from)} → ${esc(l.to)}` : "이름 변경"} · ${fmtT(l.t)}</div></div>
      ${canUndo(l) ? `<button class="btn sm ghost" data-hundo="${l._id}">되돌리기</button>` : ""}
    </div>`).join("")}</div>` : `<div class="hempty">체크하거나 이름을 바꾸면 여기에 최근 6개가 남아요.</div>`}<button class="linkbtn" data-hgo="log" style="display:block;margin:10px auto 0">전체 기록 보기</button></div>` : ""}
  </section>`;
}
/* 클리어 포인트 계산기 — 3회차 10년 점수 발표(합계 23,465)로 맞춰 본 공식
   최종 자금÷5,000 · 팔로워×1 · 옷 파라미터×3÷1,000 · 손님 파라미터×3÷100 · 시설 업그레이드×5 (모두 소수점 버림)
   옷 파라미터 = 만든 옷 전부의 (품질+매력) 합계 ≈ 만든 옷 수 × (평균 품질 + 평균 매력) */
const CP_FREE = [
  ["money", "최종 자금", v => Math.floor(v/5000), "5,000G = 1점"],
  ["follow", "가게 팔로워", v => v, "1명 = 1점"],
  ["cloParam", "옷 파라미터", v => Math.floor(v*3/1000), "1,000 = 3점"],
  ["guestParam", "손님 파라미터", v => Math.floor(v*3/100), "100 = 3점"],
  ["upg", "시설 업그레이드", v => v*5, "2회 = 10점"],
];
const CP_CAP = [
  ["made", "만든 옷 개수", 5, () => 391],
  ["rank", "가게 랭크", 30, () => 10],
  ["guests", "발견한 손님 수", 15, () => new Set(DATA.clo.map(c => optOf(c).guest).filter(Boolean)).size],
  ["trophy", "트로피 획득", 50, () => 33],
  ["bld", "획득한 건물", 8, () => DATA.fac.length],
  ["battle", "클리어한 배틀", 40, () => DATA.battles.length + (DATA.battlesExtra||[]).length],
  ["fc", "클리어한 패션 체크", 25, () => DATA.checks.length + (DATA.checksExtra||[]).length],
  ["wish", "대성공한 요청", 5, () => Math.max(0, peopleNow().length*4 - 10)],
  ["exam", "합격한 자격시험", 35, () => DATA.up.staff.length*2],
];
const CP_SRC = {made:"가게 정보", rank:"가게 정보", trophy:"가게 정보", guests:"신규 손님 수", bld:"노트 시설 수", battle:"사이트 배틀 수(챌린지+다른 가게)", fc:"사이트 체크 수(모델 체크 포함)", wish:"코디 인원×4−10", exam:"직원 14명×2"};
const cpRaw = k => { const v = S.cp?.[k]; if (v !== undefined && v !== "") return v; const d = CP_CAP.find(x => x[0]===k)?.[3]; return d ? d() : ""; };
const cpNum = k => Number(String(cpRaw(k)).replace(/[^\d]/g,"")) || 0;
function cpCalc(){
  const free = Object.fromEntries(CP_FREE.map(([k,,f]) => [k, f(cpNum(k))]));
  const cap = Object.fromEntries(CP_CAP.map(([k,,m]) => [k, cpNum(k)*m]));
  const fs = Object.values(free).reduce((a,b)=>a+b,0), cs = Object.values(cap).reduce((a,b)=>a+b,0);
  return {free, cap, fs, cs, total: fs+cs, missing: CP_CAP.filter(([k]) => cpRaw(k)==="").length};
}
/* 옷 파라미터 추정: 만든 옷 수 × (평균 품질 + 평균 매력). 평균은 회차 연계 칸 값 */
function cpEstText(){
  const n = cpNum("made"), q = ihNum("q"), c = ihNum("c");
  if (!n || !(q || c)) return "파라미터는 옷 전체·손님 전체 합계예요. 회차 연계에 옷 평균 품질·매력을 넣으면 옷 파라미터를 추정해 드려요.";
  const v = n*(q+c);
  return `옷 파라미터 추정: 만든 옷 ${nf0(n)}벌 × (품질 ${nf0(q)} + 매력 ${nf0(c)}) ≈ ${nf0(v)} → ${nf0(Math.floor(v*3/1000))}점 · 평균이 소수점 아래를 버린 값이라 실제는 조금 더 높아요`;
}
function cpRefresh(){
  const est = document.getElementById("cpEst"); if (est) est.textContent = cpEstText();
  const r = cpCalc();
  Object.entries({...r.free, ...r.cap}).forEach(([k,v]) => { const el = document.getElementById("cpv-"+k); if (el) el.textContent = nf0(v); });
  const t = document.getElementById("cpTotal"); if (t) t.textContent = nf0(r.total);
  const sp = document.getElementById("cpSplit"); if (sp) sp.textContent = `올릴 항목 ${nf0(r.fs)} · 천장 항목 ${nf0(r.cs)}${r.missing?` · 천장 ${r.missing}칸 비어 있음`:""}`;
}
let cpT = null;
function cpSave(){ clearTimeout(cpT); cpT = setTimeout(() => { if (db) writeSerial("calc/clear", S.cp).catch(() => showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.")); }, 600); }
function homeClear(){
  const o = !!S.homeCp, r = cpCalc(), co = !!S.cpCapOpen;
  const row = (k, label, hint, pts) => `<div class="cprow"><label for="cp-${k}"><b>${label}</b><span>${hint}</span></label><input class="field" id="cp-${k}" inputmode="numeric" autocomplete="off" value="${esc(cpRaw(k))}" placeholder="0"><span class="cpv" id="cpv-${k}">${nf0(pts)}</span></div>`;
  return `<section class="card fold-card ${o?"open":""}">
    <button class="fold-h" data-act="hcp" aria-expanded="${o}">
      <span class="fold-ic">${ICON.spark}</span>
      <span class="fold-t"><b>클리어 포인트</b><span>합계 ${nf0(r.total)}점</span></span>${ICON.chev}
    </button>
    ${o ? `<div class="fold-b">
      <div class="cptot"><span class="cpt" id="cpTotal">${nf0(r.total)}</span><span class="hint" id="cpSplit">올릴 항목 ${nf0(r.fs)} · 천장 항목 ${nf0(r.cs)}${r.missing?` · 천장 ${r.missing}칸 비어 있음`:""}</span></div>
      <div class="sublbl">올릴 항목</div>
      <div class="cpgrid">${CP_FREE.map(([k,l,,h]) => row(k, l, h, r.free[k])).join("")}</div>
      <div class="hint" style="margin-top:6px" id="cpEst">${cpEstText()}</div>
      <div class="fhead" style="margin:16px 0 8px"><span class="sublbl" style="margin:0">천장 항목</span><button class="chip sm fold" data-act="cpcap" aria-expanded="${co}">${co?"접기 ▴":"펼치기 ▾"}</button></div>
      ${co ? `<div class="cpgrid">${CP_CAP.map(([k,l,m,d]) => row(k, l, `×${m}${d?` · ${CP_SRC[k]||"노트 기준"}`:""}`, r.cap[k])).join("")}</div>
      <div class="hint" style="margin-top:6px">한 번 넣어 두면 저장돼요. "노트 기준"은 노트에 있는 목록 수로 채워 둔 값이라 게임과 다르면 고쳐 주세요.</div>` : ""}
    </div>` : ""}
  </section>`;
}
/* 회차 연계(인계) 계산 — 클리어 포인트와는 별개
   돈·포인트는 100점마다 20%씩 최대 3회(60%), 옷·점원 파라미터는 50점에 20%. 이어지는 값은 소수점 아래 버림 */
const IH_ITEMS = [
  ["money", "돈 20%", 100, 3], ["pts", "포인트 20%", 100, 3],
  ["clo", "옷 파라미터 20%", 50, 1], ["staff", "점원 파라미터 20%", 50, 1],
  ["rnd", "랜덤 옵션", 30, 1], ["facSeed", "시설 인기 UP 씨앗", 30, 1], ["cloSeed", "옷 매력 UP 씨앗", 30, 1],
];
const IH_ST = [["a","접객"],["b","속도"],["c","솜씨"]];
const ihStaffName = i => DATA.up.staff[i].replace(/\s*\(.*\)$/, "");
const ihNum = k => Number(String(S.ih?.[k] ?? "").replace(/[^\d]/g,"")) || 0;
const ihBuy = k => Math.max(0, Math.min(IH_ITEMS.find(x => x[0]===k)[3], Number(S.ih?.["b_"+k]) || 0));
function ihCalc(){
  const cost = IH_ITEMS.reduce((a,[k,,c]) => a + ihBuy(k)*c, 0), picked = IH_ITEMS.filter(([k]) => ihBuy(k)).length;
  const st = DATA.up.staff.flatMap((_,i) => IH_ST.map(([k]) => S.ih?.[`s${i}${k}`])).filter(v => v !== undefined && v !== "").map(v => Number(String(v).replace(/[^\d]/g,"")) || 0);
  const staffAvg = st.length ? st.reduce((a,b)=>a+b,0)/st.length : ihNum("sa");
  const pct = k => ihBuy(k)*20, carry = (v, k) => Math.floor(v * pct(k) / 100);
  const out = {money: carry(ihNum("money"), "money"), pts: carry(ihNum("pts"), "pts"), q: carry(ihNum("q"), "clo"), c: carry(ihNum("c"), "clo"), sa: carry(staffAvg, "staff")};
  DATA.up.staff.forEach((_,i) => IH_ST.forEach(([k]) => out[`s${i}${k}`] = carry(ihNum(`s${i}${k}`), "staff")));
  return {cost, picked, staffAvg, stN: st.length, out, pct};
}
const ihVal = (r, k, buyKey) => r.pct(buyKey) ? `+${nf0(r.out[k])}` : "미선택";
function ihRefresh(){
  const r = ihCalc(), keys = {money:"money", pts:"pts", q:"clo", c:"clo", sa:"staff"};
  Object.entries(keys).forEach(([k,b]) => { const el = document.getElementById("ihv-"+k); if (el){ el.textContent = ihVal(r, k, b); el.classList.toggle("off", !r.pct(b)); } });
  DATA.up.staff.forEach((_,i) => IH_ST.forEach(([k]) => { const el = document.getElementById(`ihv-s${i}${k}`); if (el){ el.textContent = r.pct("staff") ? `→ +${nf0(r.out[`s${i}${k}`])}` : ""; } }));
  const est = document.getElementById("cpEst"); if (est) est.textContent = cpEstText();
  const a = document.getElementById("ihSA"); if (a) a.textContent = r.stN ? `점원별 ${r.stN}칸 평균 ${nf0(Math.floor(r.staffAvg))}` : "미션 화면 평균";
}
let ihT = null;
function ihSave(){ clearTimeout(ihT); ihT = setTimeout(() => { if (db) writeSerial("calc/carry", S.ih).catch(() => showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.")); }, 600); }
function homeCarry(){
  const o = !!S.homeIh, r = ihCalc(), so = !!S.ihStaffOpen;
  const buyRow = ([k, l, c, max]) => { const n = ihBuy(k);
    return `<div class="ihbuy ${n?"on":""}"><span class="ihl"><b>${l}</b><span>${c}점${max>1?` · 최대 ${max}번`:""}</span></span>
      ${max>1 ? `<span class="seg ihseg">${[0,1,2,3].map(v => `<button class="${n===v?"on":""}" data-ihb="${k}" data-v="${v}" aria-pressed="${n===v}">${v?v*20+"%":"안 함"}</button>`).join("")}</span>`
              : `<button class="chip sm ${n?"on":""}" data-ihb="${k}" data-v="${n?0:1}" aria-pressed="${!!n}">${n?"선택함":"선택"}</button>`}</div>`; };
  const row = (k, label, hint, b) => `<div class="cprow ihrow"><label for="ih-${k}"><b>${label}</b><span${k==="sa"?' id="ihSA"':""}>${hint}</span></label><input class="field" id="ih-${k}" inputmode="numeric" autocomplete="off" value="${esc(S.ih?.[k] ?? "")}" placeholder="0"><span class="cpv ihv ${r.pct(b)?"":"off"}" id="ihv-${k}">${ihVal(r, k, b)}</span></div>`;
  return `<section class="card fold-card ${o?"open":""}">
    <button class="fold-h" data-act="hih" aria-expanded="${o}">
      <span class="fold-ic">${ICON.carry}</span>
      <span class="fold-t"><b>회차 연계</b><span>${r.picked ? `${r.picked}개 선택 · 필요 ${nf0(r.cost)}점` : "고른 항목 없음"}</span></span>${ICON.chev}
    </button>
    ${o ? `<div class="fold-b">
      <div class="cptot"><span class="cpt">${nf0(r.cost)}<small>점</small></span><span class="hint">고른 연계 항목에 필요한 포인트 · 클리어 포인트 계산과는 따로예요</span></div>
      <div class="sublbl">연계 항목</div>
      <div class="ihlist">${IH_ITEMS.map(buyRow).join("")}</div>
      <div class="sublbl" style="margin-top:18px">지금 값 → 다음 회차로 이어지는 값</div>
      <div class="cpgrid">
        ${row("money", "소지금", "돈 연계", "money")}
        ${row("pts", "포인트", "포인트 연계", "pts")}
        ${row("q", "옷 평균 품질", "미션 화면 · 옷 파라미터", "clo")}
        ${row("c", "옷 평균 매력", "미션 화면 · 옷 파라미터", "clo")}
        ${row("sa", "점원 평균 능력", r.stN ? `점원별 ${r.stN}칸 평균 ${nf0(Math.floor(r.staffAvg))}` : "미션 화면 평균", "staff")}
      </div>
      <div class="fhead" style="margin:16px 0 8px"><span class="sublbl" style="margin:0">점원별 능력</span><button class="chip sm fold" data-act="ihstaff" aria-expanded="${so}">${so?"접기 ▴":"펼치기 ▾"}</button></div>
      ${so ? `<div class="ihst"><div class="ihst-h"><span></span>${IH_ST.map(([,l]) => `<span>${l}</span>`).join("")}</div>
        ${DATA.up.staff.map((n,i) => `<div class="ihst-r"><span class="ihst-n"><b>${esc(ihStaffName(i))}</b><span>${esc((n.match(/\((.*)\)/)||[])[1]||"")}</span></span>${IH_ST.map(([k,l]) => `<span class="ihst-c"><input class="field" id="ih-s${i}${k}" inputmode="numeric" autocomplete="off" value="${esc(S.ih?.[`s${i}${k}`] ?? "")}" placeholder="0" aria-label="${esc(ihStaffName(i))} ${l}"><i id="ihv-s${i}${k}">${r.pct("staff") ? `→ +${nf0(r.out[`s${i}${k}`])}` : ""}</i></span>`).join("")}</div>`).join("")}</div>
      <div class="hint" style="margin-top:6px">점원 평균 능력은 세 능력을 모두 더해 나눈 값이에요(미션 화면과 같음).</div>` : ""}
      <div class="hint" style="margin-top:10px">캡처나 영상을 보내 주시면 대신 넣어 둘게요. 이어지는 값은 소수점 아래를 버려요.</div>
    </div>` : ""}
  </section>`;
}
function homeContest(){
  const gs = DATA.gs, avg = gs && gs.items.length ? gs.items.reduce((a,x) => a+x[2], 0)/gs.items.length : 0;
  return `<section class="card fold-card ${S.homeCt?"open":""}">
    <button class="fold-h" data-act="hct" aria-expanded="${S.homeCt}">
      <span class="fold-ic">${ICON.trophy}</span>
      <span class="fold-t"><b>12월 콘테스트</b><span>평균 매력 ${avg.toFixed(1)} · 기록 ${S.contests.length}건</span></span>${ICON.chev}
    </button>
    ${S.homeCt ? `<div class="fold-b">${charmCard().replace('<section class="card">','<div>').replace(/<\/section>\s*$/,'</div>')}<button class="btn" data-hgo="contest" style="width:100%;margin-top:14px">콘테스트 기록하러 가기</button></div>` : ""}
  </section>`;
}
function viewHome(){
  const q = S.homeQ.trim();
  return `<section class="card hsearch-card">
    <form id="homeForm" class="hsearch" role="search">${ICON.search}<input class="search" id="homeQ" type="search" enterkeyhint="search" autocomplete="off" placeholder="옷, 손님, 시설, 옵션 한 번에 찾기" value="${esc(S.homeQ)}" aria-label="통합 검색">${q?`<button type="button" class="iconbtn" data-act="hclear" aria-label="검색어 지우기">${ICON.x}</button>`:""}</form>
    ${q ? `<div class="hres">${homeResults(q)}</div>` : `<div class="hint" style="margin-top:10px">예: 크롭 · 도찬배 · 카페 · 폼폼 · 고딕</div>`}
  </section>
  ${q ? "" : homeToday() + homeTodo() + homeMemo() + homeUp() + homeRecent() + homeLegend() + homeClear() + homeCarry()}`;
}
function homeGo(go){
  if (go==="fac"){ S.tab="fac"; S.itemPick=""; S.facType="전체"; S.facSt=["미완료","일부완료"]; S.facFcSel=[]; S.facFcOpen=false; S.facQ=""; }
  else if (go==="clo"){ S.tab="clo"; S.cloSp=false; S.cloSt="미완료"; S.cloKind=["추가옵션"]; S.cloCat=[]; S.cloPat=[]; S.cloMat=[]; S.cloOpt=[]; S.cloQ=""; }
  else if (go==="sp"){ S.tab="clo"; S.cloSp=false; S.cloSt="미완료"; S.cloKind=["추가옵션"]; S.cloCat=[]; S.cloPat=[]; S.cloMat=[]; S.cloOpt=[...SP_OPTS]; S.cloRowMulti={...S.cloRowMulti, opt:true}; S.cloQ=""; }
  else if (go==="coord"){ S.tab="coord"; S.coordQ=""; }
  else if (go==="cloq"){ S.tab="clo"; S.cloSp=false; S.cloSt="전체"; S.cloKind=[]; S.cloCat=[]; S.cloPat=[]; S.cloMat=[]; S.cloOpt=[]; S.cloQ=S.homeQ.trim(); }
  else if (go==="coordq"){ S.tab="coord"; S.coordQ=S.homeQ.trim(); }
  else if (go==="facq"){ S.tab="fac"; S.itemPick=""; S.facType="전체"; S.facSt="전체"; S.facFcSel=[]; S.facFcOpen=false; S.facQ=S.homeQ.trim(); }
  else if (go==="log" || go==="contest"){ S.tab="tool"; S.recSub=go; }
  remember(); render(); scrollTo({top:0});
}
function homeUndo(id){
  const l = S.logs.find(x => x._id===id); if (!l) return;
  if (l.kind==="fac") toggleFac(l.id); else if (l.kind==="clo") toggleClo(l.id);
}
/* ---------- 배치 연습: 30×30 판, 전부 일반 격자 ---------- */
const LAY_N = 30, LAY_G = ["내추럴","쿨","큐트","성숙","레트로","하드","서브컬쳐"];
const layGName = g => g === "서브컬쳐" ? "서브컬처" : g;
const layRoad = i => i === 9 || i === 19 || i === 29;
const layRects = () => (S.layout && S.layout.rects) || [];
const layHit = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
const layOverlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const LAY_REC = [
  {n:"2단 · 위 4 아래 3", d:"가로 복도 3칸 하나, 매장 사이 2칸. 매장을 크게(88~99칸) 잡아 빈 곳이 가장 적음", z:[[0,0,6,16],[8,0,6,16],[16,0,6,16],[24,0,6,16],[0,19,9,11],[11,19,8,11],[21,19,9,11]]},
  {n:"2단 · 위 3 아래 4", d:"1번을 위아래로 뒤집은 배치. 입구가 위쪽이면 이쪽", z:[[0,0,9,11],[11,0,8,11],[21,0,9,11],[0,14,6,16],[8,14,6,16],[16,14,6,16],[24,14,6,16]]},
  {n:"세로 2단", d:"세로 복도 3칸 하나, 매장 사이 2칸. 1번을 옆으로 돌린 배치", z:[[0,0,16,6],[0,8,16,6],[0,16,16,6],[0,24,16,6],[19,0,11,9],[19,11,11,8],[19,21,11,9]]},
  {n:"3단 · 2-3-2", d:"가로 복도 3칸 두 줄. 위·아래 가운데 6×8 틈 두 곳에 시설", z:[[0,0,12,8],[18,0,12,8],[0,11,10,8],[10,11,10,8],[20,11,10,8],[0,22,12,8],[18,22,12,8]]},
  {n:"3단 · 3-1-3", d:"가로 복도 2칸 두 줄. 가운데 매장 양옆 9×8 두 곳에 시설", z:[[0,0,10,9],[10,0,10,9],[20,0,10,9],[9,11,12,8],[0,21,10,9],[10,21,10,9],[20,21,10,9]]},
  {n:"넓은 매장 · 2단 위 4 아래 3", d:"매장 104~117칸. 가로 복도 2칸, 위 가운데·아래 매장 사이 2칸", z:[[0,0,7,15],[7,0,7,15],[16,0,7,15],[23,0,7,15],[0,17,9,13],[11,17,8,13],[21,17,9,13]]},
  {n:"넓은 매장 · 3단 2-3-2", d:"매장 100~112칸. 가로 복도 2칸 두 줄, 위·아래 매장 사이 2칸", z:[[0,0,14,8],[16,0,14,8],[0,10,10,10],[10,10,10,10],[20,10,10,10],[0,22,14,8],[16,22,14,8]]},
  {n:"넓은 매장 · 세로 2단", d:"6번을 옆으로 돌린 배치. 세로 복도 2칸", z:[[0,0,15,7],[0,7,15,7],[0,16,15,7],[0,23,15,7],[17,0,13,9],[17,11,13,8],[17,21,13,9]]},
  {n:"넓은 매장 · 가운데 홀", d:"양옆 11×10 매장 3개씩, 위 가운데 8×13. 가운데 8×17 홀에 시설", z:[[0,0,11,10],[0,10,11,10],[0,20,11,10],[19,0,11,10],[19,10,11,10],[19,20,11,10],[11,0,8,13]]},
  {n:"넓은 매장 · 가운데 섬", d:"매장이 가장 큼(100~120칸). 가운데 10×10 섬을 2칸 복도가 둘러쌈, 시설 자리는 적음", z:[[0,0,15,8],[15,0,15,8],[0,22,15,8],[15,22,15,8],[0,8,8,14],[22,8,8,14],[10,10,10,10]]},
];
const layRecRects = i => LAY_REC[i].z.map(([x,y,w,h], k) => ({id:"r"+k, g:LAY_G[k], x, y, w, h}));
function viewLayout(){
  const rec = S.layRec != null ? LAY_REC[S.layRec] : null;
  const g = S.layG || LAY_G[0], rects = rec ? layRecRects(S.layRec) : layRects(), sel = rec ? null : S.laySel;
  const cells = [];
  const lines = []; for (let i = 0; i <= LAY_N; i++) lines.push(`M${i} 0V${LAY_N}M0 ${i}H${LAY_N}`);
  const rs = rects.map(r => `<g class="lay-r ${r.id===sel?"sel":""}" data-lid="${r.id}"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${TYPE_COLOR[r.g]}" fill-opacity="${r.id===sel?0.75:0.5}" stroke="${TYPE_COLOR[r.g]}" stroke-width="${r.id===sel?0.18:0.08}"/>${r.w>=2&&r.h>=1?`<text x="${r.x + r.w/2}" y="${r.y + r.h/2}" text-anchor="middle" dominant-baseline="central" class="lay-t">${r.w}×${r.h}</text>`:""}${r.id===sel ? [["tl",r.x,r.y],["tr",r.x+r.w,r.y],["bl",r.x,r.y+r.h],["br",r.x+r.w,r.y+r.h]].map(([k,hx,hy]) => `<circle cx="${hx}" cy="${hy}" r="0.65" class="lay-h" data-lh="${k}" stroke="${TYPE_COLOR[r.g]}"/>`).join("") : ""}</g>`).join("");
  const tot = {}; rects.forEach(r => tot[r.g] = (tot[r.g]||0) + r.w*r.h);
  const sr = rects.find(r => r.id===sel);
  return `<section class="card">
    <div class="sec-h"><h2>배치 연습</h2><span>${rects.length}개 영역</span></div>
    <div class="laygs">${LAY_G.map(k => `<button type="button" class="laygbtn ${k===g?"on":""}" data-layg="${k}" aria-pressed="${k===g}" style="--c:${TYPE_COLOR[k]}"><i></i>${layGName(k)}${tot[k]?`<b>${tot[k]}</b>`:""}</button>`).join("")}</div>
    <div class="layrec">${S.layRecOpen ? `<span class="layrec-l">추천</span>${LAY_REC.map((r,i) => `<button type="button" class="laynum ${S.layRec===i?"on":""}" data-lrec="${i}" aria-pressed="${S.layRec===i}">${i+1}</button>`).join("")}<button type="button" class="chip sm" data-act="layrecx">닫기</button>` : `<button type="button" class="chip sm" data-act="layreco">추천 배치 보기</button>`}</div>
    <div class="layrec"><span class="layrec-l">내 배치</span>${[1,2,3,4,5].map(n => `<button type="button" class="laynum ${S.laySlot===n?"on":""} ${S.laySlots?.[n]?.rects?.length?"has":""}" data-lslot="${n}" aria-pressed="${S.laySlot===n}">${n}</button>`).join("")}</div>
    ${S.laySlot ? laySlotBox(S.laySlot) : ""}
    ${rec ? `<div class="layrecbox"><b>${S.layRec+1}. ${rec.n}</b> · 통로·시설 ${900 - rects.reduce((a,r)=>a+r.w*r.h,0)}칸<div class="hint">${rec.d}</div><div class="layact" style="margin-top:8px">${S.layAsk2 ? `<span class="hint">지금 그린 영역이 지워져요</span><button class="chip sm danger" data-act="layapplyok">덮어쓰기</button><button class="chip sm" data-act="layapplyno">취소</button>` : `<button class="chip sm" data-act="layapply">이 배치로 그리기</button>`}</div></div>` : ""}
    <div class="layinfo" id="layInfo">${rec ? "미리보기 중이에요. 장르 색은 순서대로 넣었어요" : sr ? `<b style="color:${TYPE_COLOR[sr.g]}">${layGName(sr.g)}</b> ${sr.w}×${sr.h} · ${sr.w*sr.h}칸 선택됨` : `판 위에서 끌면 <b style="color:${TYPE_COLOR[g]}">${layGName(g)}</b> 영역이 그려져요`}</div>
    <div class="laywrap"><svg id="laySvg" viewBox="-0.2 -0.2 ${LAY_N+0.4} ${LAY_N+0.4}" class="laysvg" role="img" aria-label="30×30 배치 판">${cells.join("")}<path d="${lines.join("")}" class="lay-l"/>${rs}<rect id="layPrev" x="0" y="0" width="0" height="0" fill="${TYPE_COLOR[g]}" fill-opacity="0.35" stroke="${TYPE_COLOR[g]}" stroke-width="0.12" stroke-dasharray="0.3 0.2"/><text id="layPrevT" class="lay-t big" text-anchor="middle" dominant-baseline="central"></text></svg></div>
    ${sr ? `<div class="layedit">
      <div class="layedit-r"><span class="layedit-l">이동</span><button class="laykey" data-lmv="-1,0" aria-label="왼쪽">←</button><button class="laykey" data-lmv="0,-1" aria-label="위">↑</button><button class="laykey" data-lmv="0,1" aria-label="아래">↓</button><button class="laykey" data-lmv="1,0" aria-label="오른쪽">→</button></div>
      <div class="layedit-r"><span class="layedit-l">가로</span><button class="laykey" data-lsz="-1,0" aria-label="가로 줄이기">−</button><b>${sr.w}</b><button class="laykey" data-lsz="1,0" aria-label="가로 늘리기">+</button><span class="layedit-l" style="margin-left:10px">세로</span><button class="laykey" data-lsz="0,-1" aria-label="세로 줄이기">−</button><b>${sr.h}</b><button class="laykey" data-lsz="0,1" aria-label="세로 늘리기">+</button></div>
      <div class="hint">영역 안을 끌면 이동, 모서리 동그라미를 끌면 크기 조절. 위 장르 버튼을 누르면 장르가 바뀌어요.</div>
    </div>` : ""}
    <div class="layact">${sr ? `<button class="chip sm" data-act="laydel">선택 영역 지우기</button><button class="chip sm" data-act="laysel0">선택 취소</button>` : ""}<button class="chip sm" data-act="laygclear">${layGName(g)} 초기화</button>${S.layAsk ? `<button class="chip sm danger" data-act="layallok">정말 전부 지우기</button><button class="chip sm" data-act="layallno">취소</button>` : `<button class="chip sm" data-act="layall">전체 삭제</button>`}</div>
    ${rects.length ? `<div class="laylist">${LAY_G.filter(k => tot[k]).map(k => `<div class="layrow"><span class="laydot" style="background:${TYPE_COLOR[k]}"></span><b>${layGName(k)}</b><span class="laysz">${rects.filter(r => r.g===k).map(r => `<button type="button" class="pill ${r.id===sel?"need":"must"}" data-lsel="${r.id}">${r.w}×${r.h}</button>`).join("")}</span><span class="hint">${tot[k]}칸</span></div>`).join("")}</div>` : ""}
    <div class="hint" style="margin-top:8px">영역을 누르면 선택돼요.</div>
  </section>`;
}
function layMini(rects){
  return `<svg viewBox="0 0 30 30" class="laymini">${rects.map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${TYPE_COLOR[r.g]}" fill-opacity="0.7"/>`).join("")}</svg>`;
}
function laySlotBox(n){
  const sv = S.laySlots?.[n], has = sv?.rects?.length, cur = layRects().length;
  const when = has && sv.t ? new Date(sv.t).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
  const ask = S.laySlotAsk;
  return `<div class="layrecbox laysbox">${has ? layMini(sv.rects) : `<div class="laymini empty">비어 있음</div>`}<div style="flex:1;min-width:0">
    <b>${n}번</b> ${has ? `· 영역 ${sv.rects.length}개 · ${when}` : "· 저장된 배치 없음"}
    <div class="layact" style="justify-content:flex-start;margin-top:8px">${
      ask==="save" ? `<span class="hint">${n}번에 저장된 배치를 덮어써요</span><button class="chip sm danger" data-act="layssaveok">덮어쓰기</button><button class="chip sm" data-act="laysno">취소</button>`
      : ask==="load" ? `<span class="hint">지금 판에 그린 영역이 바뀌어요</span><button class="chip sm danger" data-act="layloadok">불러오기</button><button class="chip sm" data-act="laysno">취소</button>`
      : `<button class="chip sm" data-act="layssave" ${cur?"":"disabled"}>지금 판 저장</button>${has ? `<button class="chip sm" data-act="layload">불러오기</button>` : ""}`}</div>
  </div></div>`;
}
async function saveLaySlot(n){
  const v = {rects: layRects(), t: Date.now()};
  S.laySlots = {...(S.laySlots||{}), [n]: v}; S.laySlotAsk = null; render(); toast(`${n}번에 저장했어요`);
  if (db) try{ await writeSerial(`layslots/s${n}`, v); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
function layEdit(id, f){
  const rs = layRects(), r = rs.find(x => x.id===id); if (!r) return;
  const n = f({...r});
  if (n.w < 1 || n.h < 1 || n.x < 0 || n.y < 0 || n.x + n.w > LAY_N || n.y + n.h > LAY_N){ toast("판 밖으로 나가요"); return; }
  if (rs.some(o => o.id!==id && layOverlap(o, n))){ toast("다른 영역과 겹쳐요"); render(); return; }
  saveLayout(rs.map(o => o.id===id ? n : o));
}
async function saveLayout(rects){
  S.layout = {rects}; render();
  if (db) try{ await writeSerial("ui/layout", {rects, t:Date.now()}); }catch(e){ showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."); }
}
/* ---------- 목표 (기록 탭 [목표]): 트로피·미션 체크, 랭크 조건표 ----------
   사이트 표(트로피 40·미션 71·랭크 11)의 행 번호(row)로 체크한다. 회차별 저장 runs/rN/ui/goals {tro:{row:true}, mis:{row:true}, rank}
   → 새 회차는 새 run 경로라 이전 회차 체크는 그대로 남는다. */
const GOAL_T = [...(DATA.trophies||[])].sort((a,b) => a.row - b.row);
const GOAL_M = [...(DATA.missions||[])].sort((a,b) => a.row - b.row);
const GOAL_R = [...(DATA.ranks||[])].sort((a,b) => a.row - b.row);
const goals = () => ({tro:{}, mis:{}, rank:0, ...(S.goals||{})});
function goalSave(patch){ S.goals = {...goals(), ...patch, t:Date.now()}; render();
  if (db) writeSerial(`${RUN}/ui/goals`, S.goals).catch(() => showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.")); }
const misGroups = () => { const g = {}; GOAL_M.forEach(m => (g[m.c0] = g[m.c0] || []).push(m)); return g; };
const misNext = list => list.find(m => !goals().mis[m.row]);
const rankNext = () => GOAL_R.find(r => +r.c0 === (+goals().rank || 0) + 1);
function viewGoals(){
  const G = goals(), sub = S.goalSub || "tro";
  const tDone = GOAL_T.filter(t => G.tro[t.row]).length, tPts = GOAL_T.filter(t => G.tro[t.row]).reduce((a,t) => a + (+t.c3||0), 0);
  const mDone = GOAL_M.filter(m => G.mis[m.row]).length;
  const head = `<section class="card"><div class="fhead rowhead"><span class="fh-l"><span class="sublbl" style="margin:0">목표</span><span class="hint">${roundLabel()} · 트로피 ${tDone}/${GOAL_T.length} · 미션 ${mDone}/${GOAL_M.length}${G.rank?` · 랭크 ${G.rank}`:""}</span></span></div>
    ${seg(["트로피","미션","랭크"], {tro:"트로피",mis:"미션",rank:"랭크"}[sub], "goalsub")}
    <div class="hint" style="margin-top:8px">회차마다 따로 체크해요(이전 회차 체크는 그대로 남아요) · 출처: KairoHistory 진행</div></section>`;
  if (sub === "mis"){
    const gs = misGroups();
    return head + `<section class="card"><div class="cardgrid">${Object.entries(gs).map(([k, list]) => { const n = misNext(list), d = list.filter(m => G.mis[m.row]).length;
      return `<div class="fccard"><div class="fc-h"><b class="fc-n">${esc(k)}</b><span class="fc-c">${d}/${list.length}</span></div>
        ${n ? `<div class="cs-line" style="margin-top:6px"><small>다음</small><b>${esc(n.c2)}</b>${n.c3?`<span class="tag plain">보상 ${esc(n.c3)}</span>`:""}</div>` : `<div class="cs-line">${semTag("done","모두 달성")}</div>`}
        <div class="pills" style="margin-top:8px">${list.map(m => `<button type="button" class="pill ${G.mis[m.row]?"must":""}" data-gmis="${m.row}" aria-pressed="${!!G.mis[m.row]}" title="${esc(m.c2)} · ${esc(m.c3||"")}">${G.mis[m.row]?"✓ ":""}${esc(m.c1)}단계</button>`).join("")}</div></div>`; }).join("")}</div>
      <div class="hint" style="margin-top:8px">단계를 누르면 그 단계까지 한 번에 체크돼요. 체크된 단계를 다시 누르면 그 단계부터 해제돼요.</div></section>`;
  }
  if (sub === "rank"){
    const cur = +G.rank || 0;
    return head + `<section class="card"><div class="sublbl" style="margin:0 0 6px">지금 랭크</div>
      <div class="chips">${GOAL_R.map(r => `<button class="chip sm ${cur===+r.c0?"on":""}" data-grank="${esc(r.c0)}" aria-pressed="${cur===+r.c0}">${esc(r.c0)}</button>`).join("")}</div>
      <div class="cardgrid" style="margin-top:10px">${GOAL_R.map(r => { const n = +r.c0, st = n <= cur ? "done" : n === cur + 1 ? "next" : "";
        return `<div class="fccard ${st==="done"?"cdone":""}"><div class="fc-h"><b class="fc-n">랭크 ${esc(r.c0)}</b>${st==="done"?semTag("done","달성"):st==="next"?semTag("part","다음"):""}</div>
          ${r.c1 && r.c1!=="—" ? `<div class="cs-line"><small>조건</small>${r.c1.split(",").map(x => `<span class="tag plain">${esc(x.trim())}</span>`).join("")}</div>` : ""}
          ${r.c2 ? `<div class="cs-line"><small>랭크업 시</small>${esc(r.c2.replace(/\s*\/\s*/g, " · "))}</div>` : ""}</div>`; }).join("")}</div>
      <div class="hint" style="margin-top:8px">* 표시는 사이트 표기 그대로예요(평균값 등).</div></section>`;
  }
  return head + `<section class="card"><div class="fhead rowhead"><span class="fh-l"><span class="hint">점수 합 ${nf0(tPts)}</span></span></div><div class="list">${GOAL_T.map(t => { const d = !!G.tro[t.row];
    return `<div class="row ${d?"done":""}"><button data-gtro="${t.row}" aria-label="${esc(t.c0)} ${d?"해제":"달성"}">${ck(d)}</button>
      <div class="body"><div class="t"><span class="n">${esc(t.c0)}</span>${t.c3?`<span class="tag plain">${esc(t.c3)}점</span>`:""}</div><div class="s">${esc(t.c1||"")}${t.c2?` · ${esc(t.c2.replace(/^조건:\s*/,""))}`:""}</div></div></div>`; }).join("")}</div></section>`;
}

/* ---------- 메인 "오늘 할 일" 요약: 누르면 해당 화면으로 ---------- */
function homeToday(){
  const items = [];
  const last = nmLastOfSet();
  if (last.size) items.push(["set", "세트 1벌 남음", `${last.size}벌`, [...last.keys()].slice(0,3).map(id => cloName(CLO_BY_ID.get(id))).join(", ")]);
  _own = autoOwn(); const ownN = NM_KEYS.reduce((a,[k]) => a + _own[k].size, 0);
  if (ownN){ const can = DATA.clo.filter(c => !cloMade(c) && c.done !== undefined && nmNeed(c).length && !nmMissing(c).length); if (can.length) items.push(["make", "만들 수 있는 옷", `${can.length}벌`, can.slice(0,3).map(cloName).join(", ")]); }
  const fcOk = CHECKS.filter(c => { const m = checkMain(c.oi); return c.oi < FC_MAX && m.length && m.every(facDone) && !S.chkscore[c.oi]; });
  if (fcOk.length) items.push(["fc|"+(fcOk[0].oi+1), "도전 가능한 패션 체크", `${fcOk.length}개`, fcOk.slice(0,3).map(c => `${c.oi+1}. ${checkName(c.oi)}`).join(", ")]);
  const yr = S.cyears.filter(x => cyRound(x) === cyThisRound() && x.picks && x.year != null).sort((a,b) => b.year - a.year)[0];
  items.push(["contest", yr ? `최근 콘테스트(${yr.year}년)` : "콘테스트", yr ? `${Object.keys(yr.picks).length}개` : "기록 없음", yr ? CONTESTS.filter(([k]) => yr.picks[k]).map(([k,nm]) => `${nm} ${yr.picks[k]}`).join(", ") : "출현하면 기록 탭에 남겨 주세요"]);
  const mqSet = Array.from({length: mqN()}, (_, i) => mqOf(i)), mqBad = mqSet.filter(m => { const o = mqOutfit(m); return o && o.t && mqEval(o, m).bad; }).length, mqEmpty = mqSet.filter(m => !m.outfit).length;
  if (mqBad || mqEmpty) items.push(["mq", "마네킹", mqBad ? `계절 안 맞음 ${mqBad}` : `빈 칸 ${mqEmpty}`, mqBad && mqEmpty ? `빈 칸 ${mqEmpty}` : `${mqN()}칸 중`]);
  const rn = rankNext(); if (rn && goals().rank) items.push(["rank", `다음 랭크 ${rn.c0}`, "", (rn.c1||"").split(",").slice(0,3).map(x => x.trim()).join(" · ")]);
  const vl = verifyLeft().length; if (vl) items.push(["verify", "게임에서 확인할 것", `${vl}개`, verifyLeft().slice(0,2).map(v => v.t).join(", ")]);
  if (!items.length) return "";
  return `<section class="card"><div class="sec-h"><h2>오늘 할 일</h2><span>누르면 그 화면으로 가요</span></div>
    <div class="list">${items.map(([go, k, v, s]) => `<button class="row today" data-today="${esc(go)}"><div class="body"><div class="t"><span class="n">${esc(k)}</span>${v?`<span class="tag plain">${esc(v)}</span>`:""}</div>${s?`<div class="s">${esc(s)}</div>`:""}</div>${ICON.chev}</button>`).join("")}</div></section>`;
}
function todayGo(go){
  const [k, a] = go.split("|");
  if (k==="set"){ S.tab="coord"; S.coordSub="set"; S.setF="1벌 남음"; S.setG="전체"; }
  else if (k==="make"){ S.tab="clo"; S.nmOpen=true; }
  else if (k==="fc"){ S.tab="fac"; S.facFcSel=[+a]; S.facFcOpen=false; }
  else if (k==="contest"){ S.tab="tool"; S.recSub="contest"; }
  else if (k==="mq"){ S.tab="coord"; S.coordSub="mq"; }
  else if (k==="rank"){ S.tab="tool"; S.recSub="goal"; S.goalSub="rank"; }
  else if (k==="verify"){ S.tab="clo"; S.verifyOpen=true; }
  remember(); render(); scrollTo({top:0});
}

/* ---------- 자료 (기록 탭 [자료]): 사이트 표 그대로 보기 + 검색 ----------
   열 이름은 사이트 표기 그대로. 돈은 G로 바꿔 보여 준다. 출처: KairoHistory */
const TERM_RE = Object.keys(DATA.terms||{}).length ? new RegExp(Object.keys(DATA.terms).sort((a,b) => b.length - a.length).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g") : null;
const moneyG = v => { let t = String(v ?? "").replace(/¥\s?([\d,]+)/g, "$1G"); if (TERM_RE) t = t.replace(TERM_RE, m => DATA.terms[m]); return t; };
function viewRef(){
  const tabs = DATA.refTables || [], cur = tabs.find(t => t.key===S.refKey) || tabs[0]; if (!cur) return `<section class="card"><div class="empty">자료가 없어요</div></section>`;
  const cols = Object.keys(cur.rows[0] || {}).filter(k => /^c\d+$/.test(k)).sort((a,b) => +a.slice(1) - +b.slice(1));
  const lab = (DATA.refCols||{})[cur.key] || {};
  const q = (S.refQ||"").trim();
  const rows = cur.rows.filter(r => !q || cols.some(k => String(r[k]??"").includes(q)));
  const shown = rows.slice(0, S.refAll ? 1000 : 60);
  return `<section class="card">
    <div class="fhead rowhead"><span class="fh-l"><span class="sublbl" style="margin:0">자료</span><span class="hint">공략 사이트 표 ${tabs.length}개</span></span></div>
    <div class="chips">${tabs.map(t => `<button class="chip sm ${t.key===cur.key?"on":""}" data-refk="${t.key}" aria-pressed="${t.key===cur.key}">${esc(t.label)} <span class="hint" style="margin:0">${t.rows.length}</span></button>`).join("")}</div>
    <div class="tools toolsgap"><input class="search" id="refQ" placeholder="${esc(cur.label)} 안에서 검색" value="${esc(q)}" aria-label="자료 검색"></div>
    <div class="hint" style="margin-top:8px">출처: KairoHistory(개인 참고용, 카이로소프트 공식 아님)</div>
  </section>
  <section class="card"><div class="list">${shown.map(r => `<div class="refrow"><div class="rh">${esc(moneyG(r[cols[0]]))}</div>${factRows(cols.slice(1).filter(k => r[k]!=null && r[k]!=="").map(k => [lab[k] || k, moneyG(r[k])]))}</div>`).join("") || `<div class="empty">검색 결과가 없어요</div>`}</div>
    ${rows.length > shown.length ? `<button class="linkbtn" data-act="refall">${rows.length - shown.length}개 더 보기</button>` : ""}</section>`;
}
function viewRec(){
  const pc = pendingList().length;
  const subs = [["contest","콘테스트"],["goal","목표"],["ref","자료"],["layout","배치"],["up","개량 옵션"],["log","관리"]];
  return `<section class="card subnav"><div class="seg wide">${subs.map(([k,l]) => `<button class="${S.recSub===k?"on":""}" data-rsub="${k}" aria-pressed="${S.recSub===k}">${l}${k==="log"&&pc?` <span class="badge-in">${pc}</span>`:""}</button>`).join("")}</div></section>
  ${(({contest:viewContest, goal:viewGoals, ref:viewRef, layout:viewLayout, up:viewUp, log:viewLog})[S.recSub] || viewContest)()}`;
}

/* ---------- 도구 탭(2026-11-06 개편): 콘테스트 · 계산기 · 자료 · 관리 · 화면 · 더 보기 ---------- */
const TOOL_SUBS = [["contest","콘테스트"],["calc","계산기"],["ref","자료"],["log","관리"],["set","화면"],["more","더 보기"]];
const MORE_SUBS = [["todo","할 일·검색"],["goal","목표"],["layout","배치"],["up","개량 옵션 표"]];
function viewTool(){
  if (["goal","layout","up","home"].includes(S.recSub)){ S.moreSub = S.recSub==="home" ? "todo" : S.recSub; S.recSub = "more"; }
  const cur = TOOL_SUBS.some(([k]) => k===S.recSub) ? S.recSub : "contest";
  const pc = pendingList().length;
  return `<section class="card subnav"><div class="seg wide">${TOOL_SUBS.map(([k,l]) => `<button class="${cur===k?"on":""}" data-rsub="${k}" aria-pressed="${cur===k}">${l}</button>`).join("")}</div></section>
  ${({contest:viewContest, calc:viewCalc, ref:viewRef, log:viewLog, set:viewSet, more:viewMore})[cur]()}`;
}
function viewCalc(){ return homeClear() + homeCarry(); }
function viewSet(){
  const row = (label, inner) => `<div class="setrow"><span class="setk">${label}</span>${inner}</div>`;
  const segB = (attr, list) => `<div class="seg">${list.map(([v,l]) => `<button type="button" data-${attr}="${v}">${l}</button>`).join("")}</div>`;
  return `<section class="card prefs-card">
    <div class="sec-h"><h2>화면</h2><span>이 기기에만 저장돼요</span></div>
    ${appearancePicker()}
    ${row("기기", segB("device", [["auto","자동"],["phone","핸드폰"],["desk","PC·패드"]]))}
    ${row("테마", segB("mode", [["system","시스템"],["light","라이트"],["dark","다크"]]))}
    ${row("메인 색상", `<div class="pals">${[["rose","#955F64","빈티지 로즈"],["red","#994F53","뮤트 레드"],["taupe","#8E706E","로즈 토프"],["blue","#3182F6","기존 블루"]].map(([k,c,l]) => `<button type="button" class="pal" data-pal="${k}" style="--p:${c}"><i aria-hidden="true"></i>${l}</button>`).join("")}</div>`)}
  </section><section class="card prefs-card"><div class="sec-h"><h2>현재 랭크</h2><span>오른쪽 아래 R 버튼과 같아요 · 10이면 버튼이 사라지니 여기서 고쳐요</span></div>${rankPanel()}</section>${selSaveCard()}${clickLogCard()}${homeLegend()}`;
}
function viewMore(){
  const cur = MORE_SUBS.some(([k]) => k===S.moreSub) ? S.moreSub : "todo";
  const q = S.homeQ.trim();
  const todo = () => `<section class="card hsearch-card">
    <form id="homeForm" class="hsearch" role="search">${ICON.search}<input class="search" id="homeQ" type="search" enterkeyhint="search" autocomplete="off" placeholder="옷, 손님, 시설, 옵션 한 번에 찾기" value="${esc(S.homeQ)}" aria-label="통합 검색">${q?`<button type="button" class="iconbtn" data-act="hclear" aria-label="검색어 지우기">${ICON.x}</button>`:""}</form>
    ${q ? `<div class="hres">${homeResults(q)}</div>` : `<div class="hint" style="margin-top:10px">예: 크롭 · 도찬배 · 카페 · 폼폼 · 고딕</div>`}
  </section>${q ? "" : homeToday() + homeTodo()}`;
  return `<section class="card subnav"><div class="hint" style="margin:0 0 8px">자주 안 쓰는 화면을 모아 뒀어요</div><div class="seg wide">${MORE_SUBS.map(([k,l]) => `<button class="${cur===k?"on":""}" data-msub="${k}" aria-pressed="${cur===k}">${l}</button>`).join("")}</div></section>
  ${({todo, goal:viewGoals, layout:viewLayout, up:viewUp})[cur]()}`;
}
/* 머리줄 🕘: 최근에 바꾼 것(되돌리기)을 머리줄 아래로 펼침 */
function recentPanel(){
  const keep = S.homeRc; S.homeRc = true;
  const html = homeRecent().replace('<section class="card fold-card open">', '<section class="card recent-card">').replace(/<button class="fold-h"[\s\S]*?<\/button>/, '<div class="sec-h" style="margin:0 0 6px"><h2>최근에 바꾼 것</h2><button type="button" class="chip sm fold" data-act="recent">닫기</button></div>');
  S.homeRc = keep; return html;
}

const TABS = [["clo","의류",ICON.clo],["fac","시설",ICON.fac],["coord","코디",ICON.coord],["tool","도구",ICON.tool]];
/* 검색창은 다시 그리지 않고 그대로 둠: 아이폰·아이패드 한글 조합이 끊기지 않게 함 */
function patchKeep(oldEl, newEl, keep){
  const oc = [...oldEl.childNodes], nc = [...newEl.childNodes];
  const ki = oc.findIndex(n => n===keep || (n.nodeType===1 && n.contains(keep)));
  const nki = nc.findIndex(n => n.nodeType===1 && (n.id===keep.id || n.querySelector("#"+CSS.escape(keep.id))));
  if (ki < 0 || nki < 0){ oldEl.replaceChildren(...nc); return false; }
  const anchor = oc[ki];
  oc.forEach((n,i) => { if (i!==ki) n.remove(); });
  nc.slice(0, nki).forEach(n => oldEl.insertBefore(n, anchor));
  nc.slice(nki+1).forEach(n => oldEl.appendChild(n));
  if (anchor !== keep){
    const ne = nc[nki];
    [...anchor.attributes].forEach(a => { if (!ne.hasAttribute(a.name)) anchor.removeAttribute(a.name); });
    [...ne.attributes].forEach(a => { if (anchor.getAttribute(a.name) !== a.value) anchor.setAttribute(a.name, a.value); });
    return patchKeep(anchor, ne, keep);
  }
  return true;
}
function render(){
  counts();
  const ae = document.activeElement;
  const html = `<div class="stack">${({fac:viewFac,clo:viewClo,coord:viewCoord,tool:viewTool})[S.tab]()}</div>`;
  const view = $("#view");
  if (ae && ae.classList?.contains("search") && ae.id && view.contains(ae)){
    const tmp = document.createElement("div"); tmp.innerHTML = html;
    if (!patchKeep(view, tmp, ae)) view.innerHTML = html;
  } else {
    const focusId = ae && (ae.tagName==="INPUT" || ae.tagName==="TEXTAREA") ? ae.id : "", caret = ae?.selectionStart;
    view.innerHTML = html;
    if (focusId){ const el=document.getElementById(focusId); if(el){ el.focus({preventScroll:true}); try{el.setSelectionRange(caret,caret)}catch(e){} } }
  }
  renderSheet();
  const qk = $("#quick");
  { const rb = document.querySelector('#fab [data-q="rank"]'); if (rb){ const R = curRank(); rb.hidden = R != null && R >= RANK_MAX; rb.querySelector(".fabrank").textContent = R != null ? `R${R}` : "R?"; if (rb.hidden && S.quick==="rank") S.quick = null; } }
  if (qk){ qk.innerHTML = S.quick ? `<div class="qpanel">${S.quick==="memo" ? homeMemo(true) : S.quick==="rank" ? rankPanel() : upFinder(true, true)}</div>` : ""; qk.hidden = !S.quick; }
  document.querySelectorAll("#fab [data-q]").forEach(b => { const on = S.quick===b.dataset.q; b.classList.toggle("on", on); b.setAttribute("aria-expanded", on); });
  const rp = $("#recentPanel"); if (rp){ rp.innerHTML = S.recentOpen ? recentPanel() : ""; rp.hidden = !S.recentOpen; }
  $("#recentBtn")?.classList.toggle("on", !!S.recentOpen); $("#recentBtn")?.setAttribute("aria-expanded", !!S.recentOpen);
  window.__prefsApply?.();
  renderSum();
  const pc = pendingList().length;
  $("#tabs").style.setProperty("--tabn", TABS.length); $("#tabs").innerHTML = TABS.map(([k,l,ic]) => `<button class="${S.tab===k?"on":""}" data-tab="${k}" aria-current="${S.tab===k?"page":"false"}"><span class="tic">${ic}</span><span>${l}</span></button>`).join("");
}

/* 내려 볼 때 위에 붙는 요약줄(2026-11-06 제제: 고른 칩 요약만). 의류 = 고른 칩, 시설 = 장르·패션 체크(이전·다음)·아이템 */
function sumHtml(){
  const chip = (attr, v, label) => `<button class="chip sm on" data-${attr}="${esc(v)}" aria-label="${esc(label)} 빼기">${esc(label)} ×</button>`;
  if (S.tab==="clo"){
    const cs = [...S.cloCat.map(v => chip("ccat", v, v)), ...S.cloPat.map(v => chip("cpat", v, v)), ...S.cloMat.map(v => chip("cmat", v, v)), ...S.cloOpt.map(v => chip("copt", v, (SP_OPTS.includes(v)?"★ ":"")+v))];
    const bt = S.cloBt != null && DATA.battles[S.cloBt] ? `<button class="chip sm on" data-cbt="${S.cloBt}">${esc(bShort(S.cloBt))} ×</button>` : "";
    if (!cs.length && !bt) return "";
    return `<div class="sum-chips">${cs.join("")}${bt}</div><button class="chip sm" data-act="sumtop">조건 ▴</button>`;
  }
  if (S.tab==="fac"){
    const sel = S.facFcSel, one = sel.length===1 && S.fcMode!=="multi";
    const fc = sel.length ? `${one?`<button class="chip sm ghostchip" data-act="fcprev" aria-label="이전 패션 체크">‹</button>`:""}${sel.map(n => chip("fcn", n, `체크 ${n}`)).join("")}${one?`<button class="chip sm ghostchip" data-act="fcnext" aria-label="다음 패션 체크">›</button>`:""}` : "";
    const ty = S.facType && S.facType!=="전체" ? `<button class="chip sm on" data-ftype="전체">${esc(S.facType)} ×</button>` : "";
    const it = S.itemPick ? `<button class="chip sm on" data-pick="">${esc(S.itemPick)} ×</button>` : "";
    if (!ty && !fc && !it) return "";
    return `<div class="sum-chips">${ty}${fc}${it}</div><button class="chip sm" data-act="sumtop">조건 ▴</button>`;
  }
  return "";
}
function renderSum(){ const el = $("#sumBar"); if (!el) return; const h = sumHtml(); el.innerHTML = h; el.dataset.on = h ? "1" : ""; sumVis(); }
function sumVis(){ const el = $("#sumBar"); if (!el) return; const list = document.querySelector("#view .list"); const top = list ? list.getBoundingClientRect().top : 1e9; el.classList.toggle("show", !!el.dataset.on && top < 40 && !S.sheet); }
addEventListener("scroll", sumVis, {passive:true});
/* 떠 있는 버튼 팝업: 바깥을 누르면 닫음(다시 그리지 않고 숨기기만) */
document.addEventListener("click", e => {
  if (!S.quick || e.target.closest("#quick,#fab")) return;
  S.quick = null; const qk = $("#quick"); if (qk) qk.hidden = true;
  document.querySelectorAll("#fab [data-q]").forEach(b => { b.classList.remove("on"); b.setAttribute("aria-expanded", "false"); });
}, true);
/* ---------- events ---------- */
document.addEventListener("click", e => {
  const pk = e.target.closest("[data-p40ck]"); if (pk){ e.preventDefault(); toggleP40(+pk.dataset.p40ck); return; }
  const b = e.target.closest("button"); if (!b) return;
  if (b.id==="saveAll"){ saveAll(); return; }
  const d = b.dataset;
  if (d.tab || d.go){ const t = TAB_MAP[d.tab || d.go] || d.tab || d.go; if (OLD_TAB[t]){ S.tab="tool"; S.recSub=OLD_TAB[t]; } else S.tab = t; S.confirmSync=false; remember(); render(); scrollTo({top:0}); return; }
  if (d.ihb){ S.ih = {...(S.ih||{}), ["b_"+d.ihb]: +d.v}; ihSave(); render(); return; }
  if (d.nm){ if (d.nm==="open") S.nmOpen = !S.nmOpen; if (d.nm==="edit") S.nmEdit = !S.nmEdit; if (d.nm==="all") S.nmAll = !S.nmAll; render(); return; }
  if (d.own){ const [k, v] = d.own.split("|"); const cur = S.own[k] || []; S.nmEdit = true; S.own = {...S.own, [k]: cur.includes(v) ? cur.filter(x => x!==v) : [...cur, v]}; render();
    if (db) writeSerial(`${RUN}/ui/recipes`, {...S.own, t:Date.now()}).catch(() => showNotice("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.")); return; }
  if (d.nmdone){ toggleClo(+d.nmdone); return; }
  if (d.csub){ S.coordSub = d.csub; S.setOpen = null; remember(); render(); return; }
  if (d.setf){ S.setF = d.setf; remember(); render(); return; }
  if (d.setg){ S.setG = d.setg; remember(); render(); return; }
  if (d.gset){ const id = +d.gset; S.tab="coord"; S.coordSub="set"; S.setF="전체"; S.setG="전체"; S.setQ=""; S.setFocus=id; remember(); render(); setTimeout(() => document.getElementById("set-"+id)?.scrollIntoView({block:"center", behavior:"smooth"}), 60); return; }
  if (d.setpill){ S.setOpen = S.setOpen===d.setpill ? null : d.setpill; render(); return; }
  if (d.setdone){ toggleClo(+d.setdone); return; }
  if (d.act==="fcextra"){ S.fcExtra = !S.fcExtra; render(); return; }
  if (d.fcdone !== undefined){ toggleFcDone(+d.fcdone); return; }
  if (d.btdone !== undefined){ toggleBtDone(/^\d+$/.test(d.btdone) ? +d.btdone : d.btdone); return; }
  if (d.fcrec){ S.fcRecOpen = S.fcRecOpen===+d.fcrec ? null : +d.fcrec; render(); return; }
  if (d.act==="btextra"){ S.btExtra = !S.btExtra; render(); return; }
  if (d.btrec){ S.btRecOpen = {...(S.btRecOpen||{}), [d.btrec]: !S.btRecOpen?.[d.btrec]}; render(); return; }
  if (d.clorec){ S.cloRecOpen = S.cloRecOpen===+d.clorec ? null : +d.clorec; render(); return; }
  if (d.mqg){ const [i, g] = d.mqg.split("|"); mqSave(+i, {genre:g}); return; }
  if (d.mqs !== undefined){ const [i, v] = d.mqs.split("|"); mqSave(+i, {season:v}); return; }
  if (d.mqset){ const [i, key] = d.mqset.split("|"); const ids = key.split("-"); const outfit = {};
    MQ_SLOTS.forEach(([k], j) => { if (ids[j]) outfit[k] = +ids[j]; }); mqSave(+i, {outfit}); S.mqOpen = null; toast(`마네킹 ${+i+1}에 세웠어요`); return; }
  if (d.mqclear){ mqSave(+d.mqclear, {outfit:null}); return; }
  if (d.mqopen){ S.mqOpen = S.mqOpen===+d.mqopen ? null : +d.mqopen; render(); return; }
  if (d.mqmore){ S.mqMore = +d.mqmore; render(); return; }
  if (d.mqn){ S.mqCfg = {n:+d.mqn}; render(); if (db) writeSerial(`${RUN}/ui/mqcfg`, {n:+d.mqn, t:Date.now()}).catch(() => {}); return; }
  if (d.today){ todayGo(d.today); return; }
  if (d.act==="impgo"){ importGo(); return; }
  if (d.act==="impclear"){ S.imp = null; render(); return; }
  if (d.refk){ S.refKey = d.refk; S.refAll = false; render(); return; }
  if (d.act==="refall"){ S.refAll = true; render(); return; }
  if (d.goalsub){ S.goalSub = {"트로피":"tro","미션":"mis","랭크":"rank"}[d.goalsub]; render(); return; }
  if (d.gtro){ const G = goals(), tro = {...G.tro}; if (tro[d.gtro]) delete tro[d.gtro]; else tro[d.gtro] = true; goalSave({tro}); return; }
  if (d.gmis){ const G = goals(), mis = {...G.mis}, row = +d.gmis, m = GOAL_M.find(x => x.row===row); const list = misGroups()[m.c0];
    const idx = list.findIndex(x => x.row===row), on = !mis[row];
    list.forEach((x, j) => { if (on && j <= idx) mis[x.row] = true; if (!on && j >= idx) delete mis[x.row]; }); goalSave({mis}); return; }
  if (d.grank){ goalSave({rank: +d.grank === +goals().rank ? 0 : +d.grank}); return; }
  if (d.nows){ mqNowSave({season:d.nows}); return; }
  if (d.nowt !== undefined){ mqNowSave({trend:d.nowt}); return; }
  if (d.rsub){ S.recSub = d.rsub; S.confirmSync=false; remember(); render(); return; }
  if (d.act==="clkon" || d.act==="clkoff"){ try{ localStorage.setItem(CLK_KEY, d.act==="clkoff" ? "1" : "0"); }catch(e){} render(); return; }
  if (d.act==="clkdown"){ clickLogDownload(); return; }
  if (d.msub){ S.moreSub = d.msub; remember(); render(); return; }
  if (d.act==="recent"){ S.recentOpen = !S.recentOpen; render(); return; }
  if (d.hgo){ homeGo(d.hgo); return; }
  if (d.hopen !== undefined){ S.homeOpen = S.homeOpen===d.hopen ? "" : d.hopen; render(); return; }
  if (d.hundo){ homeUndo(d.hundo); return; }
  if (d.cedit2 !== undefined){ S.sheet = {kind:"coord", id:d.cedit2}; render(); return; }
  if (d.occ){ const k = d.occ, mode = S.ocMode || "pick";
    if (mode==="pick"){ S.ocPick = S.ocPick===k ? null : k; render(); return; }
    const cnt = {...(S.optCnt||{})}; const v = Math.max(0, (cnt[k]||0) + (mode==="dec" ? -1 : 1)); if (v) cnt[k] = v; else delete cnt[k]; saveOptCnt(cnt); return; }
  if (d.ocmode){ S.ocMode = d.ocmode; if (d.ocmode!=="pick") S.ocPick = null; render(); return; }
  if (d.ocpick !== undefined){ S.ocPick = d.ocpick || null; render(); return; }
  if (d.ocadd){ const c = CLO_BY_ID.get(+d.ocadd); if (!c) return; const k = c.o || "없음", cnt = {...(S.optCnt||{})}; cnt[k] = (cnt[k]||0) + 1;
    saveOptCnt(cnt, [...(S.optPicks||[]), c.id]); toast(`${cloName(c)} 넣었어요`); return; }
  if (d.ocdone){ const c = CLO_BY_ID.get(+d.ocdone); if (!c) return; const k = c.o || "없음", prev = {cnt:{...(S.optCnt||{})}, picks:[...(S.optPicks||[])]};
    const cnt = {...prev.cnt}; const v = Math.max(0, (cnt[k]||0) - 1); if (v) cnt[k] = v; else delete cnt[k];
    saveOptCnt(cnt, prev.picks.filter(id => id !== c.id)); toast(`${cloName(c)} 뺐어요`, () => saveOptCnt(prev.cnt, prev.picks)); return; }
  if (d.act==="ocsel"){ const cnt = {...(S.optCnt||{})}; (S.cloOpt||[]).forEach(k => delete cnt[k]); saveOptCnt(cnt, (S.optPicks||[]).filter(id => !(S.cloOpt||[]).includes(CLO_BY_ID.get(id)?.o || "없음"))); toast("고른 옵션의 개수를 0으로 했어요"); return; }
  if (d.act==="ocall"){ saveOptCnt({}, []); S.ocPick = null; toast("필요한 옵션 개수와 고른 옷을 모두 지웠어요"); return; }
  if (d.act==="optcnt"){ S.optCntOpen = S.optCntOpen === false; render(); return; }
  if (d.act==="orderedit"){ S.orderEdit = !S.orderEdit; render(); return; }
  if (d.act==="orderreset"){ saveChipOrder({}); toast("옷본·재료·옵션을 기본 순서로 돌렸어요"); return; }
  if (d.lrec != null){ const i = +d.lrec; S.layRec = S.layRec===i ? null : i; S.layAsk2 = false; S.laySel = null; render(); return; }
  if (d.act==="layreco"){ S.layRecOpen = true; S.layRec = 0; render(); return; }
  if (d.act==="layrecx"){ S.layRecOpen = false; S.layRec = null; S.layAsk2 = false; render(); return; }
  if (d.act==="layapply" || d.act==="layapplyok"){
    if (d.act==="layapply" && layRects().length){ S.layAsk2 = true; render(); return; }
    const rs = layRecRects(S.layRec).map((r,k) => ({...r, id:"l"+Date.now().toString(36)+k}));
    S.layRecOpen = false; S.layRec = null; S.layAsk2 = false; saveLayout(rs); toast("추천 배치를 그렸어요"); return; }
  if (d.act==="layapplyno"){ S.layAsk2 = false; render(); return; }
  if (d.layg){ if (S.laySel && S.layRec == null){ layEdit(S.laySel, r => ({...r, g:d.layg})); return; } S.layG = d.layg; render(); return; }
  if (d.lmv){ const [dx,dy] = d.lmv.split(",").map(Number); layEdit(S.laySel, r => ({...r, x:r.x+dx, y:r.y+dy})); return; }
  if (d.lsz){ const [dw,dh] = d.lsz.split(",").map(Number); layEdit(S.laySel, r => ({...r, w:r.w+dw, h:r.h+dh})); return; }
  if (d.lslot){ const n = +d.lslot; S.laySlot = S.laySlot===n ? null : n; S.laySlotAsk = null; render(); return; }
  if (d.act==="layssave"){ const n = S.laySlot; if (S.laySlots?.[n]?.rects?.length){ S.laySlotAsk = "save"; render(); } else saveLaySlot(n); return; }
  if (d.act==="layssaveok"){ saveLaySlot(S.laySlot); return; }
  if (d.act==="layload" || d.act==="layloadok"){ const n = S.laySlot;
    if (d.act==="layload" && layRects().length){ S.laySlotAsk = "load"; render(); return; }
    S.laySlotAsk = null; S.laySel = null; S.layRec = null; S.layRecOpen = false; saveLayout((S.laySlots[n].rects||[]).map(r => ({...r}))); toast(`${n}번 배치를 불러왔어요`); return; }
  if (d.act==="laysno"){ S.laySlotAsk = null; render(); return; }
  if (d.lsel){ S.laySel = S.laySel===d.lsel ? null : d.lsel; render(); return; }
  if (d.act==="laysel0"){ S.laySel = null; render(); return; }
  if (d.act==="laydel"){ const id = S.laySel; S.laySel = null; saveLayout(layRects().filter(r => r.id!==id)); return; }
  if (d.act==="laygclear"){ const g = S.layG || LAY_G[0]; S.laySel = null; saveLayout(layRects().filter(r => r.g!==g)); toast(`${layGName(g)} 영역을 지웠어요`); return; }
  if (d.act==="layall"){ S.layAsk = true; render(); return; }
  if (d.act==="layallno"){ S.layAsk = false; render(); return; }
  if (d.act==="layallok"){ S.layAsk = false; S.laySel = null; saveLayout([]); toast("배치를 모두 지웠어요"); return; }
  if (d.act==="cyprev"){ S.cyPrevOpen = !S.cyPrevOpen; render(); return; }
  if (d.btprev !== undefined){ S.btPrevOpen = {...(S.btPrevOpen||{}), [d.btprev]: !S.btPrevOpen?.[d.btprev]}; render(); return; }
  if (d.act==="verify"){ S.verifyOpen = !S.verifyOpen; render(); return; }
  if (d.vdone){ toggleVerify(d.vdone); return; }
  if (d.cedit3 !== undefined){ S.sheet = {kind:"coordreq", id:d.cedit3}; render(); return; }
  if (d.battle){ const id = +d.battle; const c = DATA.clo.find(x => x.id===id); S.sheet = null; saveBattleValue(id, battleOf(c) >= 0 ? "" : battleFor(c)); return; }
  if (d.cclear){ S[ROWF[d.cclear]] = []; remember(); render(); return; }
  if (d.cbt !== undefined){ const i = +d.cbt; S.cloBt = S.cloBt===i ? null : i; if (S.cloBt==null){ S.cloBtView = false; S.btOpen = false; } S.btNote = false; remember(); render(); return; }
  if (d.act==="btopen"){ S.btOpen = S.btOpen === false; remember(); render(); return; }
  if (d.act==="btview"){ if (S.cloBt==null) return; S.cloBtView = !S.cloBtView; remember(); render(); return; }
  if (d.fctemp !== undefined){ saveFcTemp(+d.fctemp); return; }
  if (d.btlist !== undefined){ const f = b.closest("form[data-btfull]"); if (f) btKeepDraft(+f.dataset.btfull); S.btListAll = d.btlist==="1"; render(); return; }
  if (d.btres){ const [i, k] = d.btres.split("|"); const r = {...bRec(+i)}; const res = {...(r.res||{})}; res[k] = !res[k] ? "성공" : res[k]==="성공" ? "실패" : ""; if (!res[k]) delete res[k]; r.res = res; delete r.result; btSave(+i, r); return; }
  if (d.bttry !== undefined){ const i = +d.bttry, r = {...bRec(i)}, t = btTotals(i); if (!r.res || !Object.keys(r.res).length){ toast("결과를 먼저 눌러 주세요"); return; }
    const b0 = DATA.battles[i], wear = btSlots(i).map(([k,,j]) => { const v = r.slots?.[k] || {}; const n = v.n ?? (b0.ex[j]||""); return n || v.q || v.charm ? {k, n, q:v.q ?? null, charm:v.charm ?? null} : null; }).filter(Boolean);
    r.tries = [...(r.tries||[]), {...t, res:r.res, wear, t:Date.now()}]; r.res = {}; delete r.result; btSave(i, r); toast(`${(r.tries.length)}차 기록을 남겼어요`); return; }
  if (d.act==="btnote"){ S.btNote = !S.btNote; render(); return; }
  if (d.act==="spall"){ const sp = S.spAvail || []; const all = sp.every(k => S.cloOpt.includes(k));
    S.cloOpt = all ? S.cloOpt.filter(k => !sp.includes(k)) : [...S.cloOpt, ...sp.filter(k => !S.cloOpt.includes(k))];
    if (S.cloOpt.length > 1 && !S.cloMulti) S.cloRowMulti = {...S.cloRowMulti, opt:true}; remember(); render(); return; }
  if (d.act==="needopt"){ S.needOptOpen = !S.needOptOpen; render(); return; }
  if (d.planmode){ S.planMode = d.planmode; render(); return; }
  if (d.act==="ocplan"){ S.ocPlan = !S.ocPlan; render(); return; }
  if (d.cntmode){ S.cntMode = d.cntmode; remember(); render(); return; }
  if (d.act==="foldall"){ S.cloExp = {}; remember(); render(); return; }
  if (d.act==="openall"){ S.cloExp = {cat:true, pat:true, mat:true, opt:true}; remember(); render(); return; }
  if (d.act==="fcreset"){ S.facFcSel = []; S.fcNoteOpen = false; remember(); render(); return; }
  if (d.act==="fcsingle"){ S.fcMode = "single"; if (S.facFcSel.length > 1) S.facFcSel = S.facFcSel.slice(-1); remember(); render(); return; }
  if (d.act==="fcmulti"){ S.fcMode = "multi"; remember(); render(); return; }
  if (d.act==="fcnote"){ S.fcNoteOpen = !S.fcNoteOpen; render(); return; }
  if (d.uphl !== undefined){ S.upHl = S.upHl===+d.uphl ? null : +d.uphl; render(); return; }
  if (d.fcrm){ const [key, id] = d.fcrm.split("|"); const oi = +S.sheet.id; const cur = S.fcDraft[oi] || {main:checkMain(oi).map(f=>f.id), alt:checkAlt(oi).map(f=>f.id)}; cur[key] = cur[key].filter(x => x!==+id); S.fcDraft = {...S.fcDraft, [oi]:cur}; render(); return; }
  if (d.fced){ S.fcEdit = {...S.fcEdit, [d.fced]: !S.fcEdit[d.fced]}; render(); return; }
  if (d.act==="golegend"){ S.tab="tool"; S.recSub="set"; S.homeLegend=true; remember(); render(); setTimeout(() => document.querySelector(".lgic")?.closest(".card")?.scrollIntoView({block:"start",behavior:"smooth"}), 50); return; }
  if (d.act==="hrc"){ S.homeRc = !S.homeRc; render(); return; }
  if (d.act==="hlegend"){ S.homeLegend = !S.homeLegend; render(); return; }
  if (d.act==="huptbl"){ S.homeUpTbl = !S.homeUpTbl; render(); return; }
  if (d.act==="hcp"){ S.homeCp = !S.homeCp; render(); return; }
  if (d.rankset !== undefined){ const n = +d.rankset; mqNowSave({rank: n}); S.quick = null; toast(`현재 랭크 ${n}`); render(); return; }
  if (d.rankclr){ mqNowSave({rank: null}); toast("랭크를 지웠어요"); render(); return; }
  if (d.act==="quick"){ S.quick = S.quick===d.q ? null : d.q; render(); return; }
  if (d.act==="memoedit"){ S.memoEdit = !S.memoEdit; render(); return; }
  if (d.mpk){ const n = +d.mpk, cur = memoNow().pumpkin; memoSave({pumpkin: pumpkinMonths(cur).includes(n) ? null : n}); return; }
  if (d.mgs){ const n = +d.mgs, g = memoNow().guest || []; memoSave({guest: g.includes(n) ? g.filter(x => x!==n) : [...g, n].sort((a,b)=>a-b)}); return; }
  if (d.act==="hih"){ S.homeIh = !S.homeIh; render(); return; }
  if (d.act==="ihstaff"){ S.ihStaffOpen = !S.ihStaffOpen; remember(); render(); return; }
  if (d.act==="cpcap"){ S.cpCapOpen = !S.cpCapOpen; remember(); render(); return; }
  if (d.act==="hct"){ S.homeCt = !S.homeCt; render(); return; }
  if (d.act==="hclear"){ S.homeQ = ""; S.homeOpen = ""; render(); document.getElementById("homeQ")?.focus(); return; }
  if (d.ialt){ S.itemAlt=d.ialt; remember(); render(); return; }
  if (d.putall){ const [ids, it] = d.putall.split("|"); bulkPut(ids.split(",").map(Number), it); return; }
  if (d.put){ const [fid, it] = d.put.split("|"); togglePut(+fid, it); return; }
  if (d.pick !== undefined){ S.itemAlt=""; S.itemPick = S.itemPick===d.pick ? "" : d.pick; S.facType="전체"; S.facFcSel=[]; if (S.itemPick){ S.tab="fac"; } remember(); render(); return; }
  if (d.fcgo !== undefined){ S.tab="fac"; S.facFcSel=[+d.fcgo+1]; S.itemPick=""; S.facType="전체"; S.facFcOpen=false; S.facSt="전체"; S.facQ=""; remember(); render(); scrollTo({top:0}); return; }
  if (d.ftype){ S.facType=d.ftype; S.facFcSel=[]; S.itemPick=""; S.fcNoteOpen=false; remember(); render(); return; }
  if (d.act==="ffoldall"){ S.facExp = {genre:false, fc:false, item:false}; S.facFcOpen = false; remember(); render(); return; }
  if (d.act==="fopenall"){ S.facExp = {genre:true, fc:true, item:true}; S.facFcOpen = true; remember(); render(); return; }
  if (d.act==="fpin"){ S.facExpPin = !S.facExpPin; remember(); render(); return; }
  if (d.fexp){ if (d.fexp==="fc") S.facFcOpen = !S.facFcOpen; else S.facExp = {...S.facExp, [d.fexp]: !S.facExp[d.fexp]}; remember(); render(); return; }
  if (d.fst){ const k = d.fst, cur = facSts();
    /* 미완료·일부완료는 함께 고를 수 있고, 완료는 따로 */
    let next = k==="전체" ? [] : k==="완료" ? (cur.includes("완료") ? [] : ["완료"]) : cur.includes(k) ? cur.filter(x => x!==k) : [...cur.filter(x => x!=="완료"), k];
    S.facSt = next.length ? next : "전체"; remember(); render(); return; }
  if (d.fsort){ S.facSort=d.fsort; remember(); render(); return; }
  if (d.act==="chist"){ S.cHistOpen = !S.cHistOpen; render(); return; }
  if (d.cedit){ S.cEdit = S.cEdit===d.cedit ? null : d.cedit; const ys = S.cEdit ? cyScoreFor(S.cEdit) : null, cr = S.cEdit ? cRec(S.cEdit) : null; /* 출현 점수가 지금 기록보다 나중에 들어왔으면 그 점수, 아니면 지금 기록 점수를 띄움 */ const useY = ys && (!cr || ys.t > (cr.t || 0)); S.cScore = useY ? String(ys.score) : cr ? String(cr.score) : ""; S.cFrom = useY ? ys : null; S.cRes = cr?.result || "실패"; S.cHistOpen = false; S.cMsg=""; S.cReset=false; S.sheet = null; render(); return; }
  if (d.sheet !== undefined){ if (d.sheet==="close"){ S.btDraft={}; S.sheet=null; S.cEdit=null; S.fcEdit={}; S.fcDraft={}; S.scErr=""; S.scErr2=""; render(); return; } const [k, id] = d.sheet.split("|"); S.sheet = {kind:k, id}; render(); return; }
  if (d.cres){ S.cRes=d.cres; S.cMsg=""; render(); return; }
  if (d.creset){ S.cReset = d.creset==="1"; render(); return; }
  if (d.cresetok){ resetContest(d.cresetok); return; }
  if (d.rnkind){ S.rnKind=d.rnkind; S.rnOld=""; S.rnErr=""; render(); return; }
  if (d.tfac){ toggleFac(+d.tfac); return; }
  if (d.ofac){ S.facOpen = S.facOpen===+d.ofac ? null : +d.ofac; render(); return; }
  if (d.cpat){ S.cloPat = pickChip(S.cloPat, d.cpat, "pat"); remember(); render(); return; }
  if (d.ccat){ S.cloCat = pickChip(S.cloCat, d.ccat, "cat"); remember(); render(); return; }
  if (d.cmat){ S.cloMat = pickChip(S.cloMat, d.cmat, "mat"); remember(); render(); return; }
  if (d.copt){ S.cloOpt = pickChip(S.cloOpt, d.copt, "opt"); remember(); render(); return; }
  if (d.slot){ const [act, key] = d.slot.split("|");
    if (act==="save"){
      if (key==="all"){ const all = Object.fromEntries(Object.entries(ROWF).map(([k,f]) => [k, [...S[f]]])); S.cloSlot = {...S.cloSlot, all, ...all}; toast("전체 선택을 저장했어요 · 줄마다 따로 불러올 수 있어요"); }
      else { S.cloSlot = {...S.cloSlot, [key]: [...S[ROWF[key]]]}; toast("이 줄 선택을 저장했어요"); } }
    if (act==="load"){ const v = S.cloSlot[key]; if (v == null){ toast("저장된 선택이 없어요"); return; }
      if (key==="all") Object.entries(ROWF).forEach(([k,f]) => S[f] = [...(v[k]||[])]); else S[ROWF[key]] = [...v];
      Object.entries(ROWF).forEach(([k,f]) => { if (S[f].length > 1 && !S.cloMulti) S.cloRowMulti = {...S.cloRowMulti, [k]:true}; });
      toast("저장한 선택을 불러왔어요"); }
    if (act==="del"){ const n = {...S.cloSlot}; delete n[key]; S.cloSlot = n; toast("저장한 선택을 지웠어요"); }
    S.slotOpen = null; remember(); render(); if (db) writeSerial("ui/slots", {slot:S.cloSlot}).catch(()=>{}); return; }
  if (d.cfold){ S.cloExp = {...S.cloExp, [d.cfold]: !S.cloExp[d.cfold]}; remember(); render(); return; }
  if (d.act==="cmulti"){ S.cloMulti = !S.cloMulti; if (!S.cloMulti){ if (!S.cloRowMulti.cat) S.cloCat = S.cloCat.slice(-1); if (!S.cloRowMulti.pat) S.cloPat = S.cloPat.slice(-1); if (!S.cloRowMulti.mat) S.cloMat = S.cloMat.slice(-1); if (!S.cloRowMulti.opt) S.cloOpt = S.cloOpt.slice(-1); } remember(); render(); return; }
  if (d.rmulti){ const k = d.rmulti; if (S.cloMulti){ S.cloMulti = false; S.cloRowMulti = {cat:true, pat:true, mat:true, opt:true}; } S.cloRowMulti = {...S.cloRowMulti, [k]: !S.cloRowMulti[k]};
    if (!S.cloRowMulti[k]){ const f = ROWF[k]; S[f] = S[f].slice(-1); } remember(); render(); return; }
  if (d.cst){ if (d.cst==="전체 옷"){ S.cloKind = []; S.cloSt = "전체"; } else S.cloSt = S.cloSt===d.cst ? "전체" : d.cst; remember(); render(); return; }
  if (d.ckind){ const k = d.ckind, cur = S.cloKind || []; S.cloKind = cur.includes(k) ? cur.filter(x => x!==k) : [...cur, k]; remember(); render(); return; }
  if (d.tclo){ toggleClo(+d.tclo); return; }
  if (d.ofill){ S.optDraft[d.ofill] = d.val; render(); const el = document.getElementById(d.ofill); if (el) el.focus(); return; }
  if (d.otype){ const [cid, k] = d.otype.split("|"); const cur = S.optDraft["ot-"+cid] ?? optOf(DATA.clo.find(x=>x.id===+cid)).likeType ?? ""; S.optDraft["ot-"+cid] = cur===k ? "" : k;
    /* 아이템은 항상 인기 UP 씨앗: 내용이 비었거나 매장명이면 자동 입력 */
    if (S.optDraft["ot-"+cid]==="아이템"){ const dv = document.getElementById("od-"+cid)?.value ?? S.optDraft["od-"+cid] ?? optOf(DATA.clo.find(x=>x.id===+cid)).likeDetail ?? ""; if (cur!=="아이템") S.optDraft["od-"+cid] = SEED; else if (!dv) S.optDraft["od-"+cid] = SEED; }
    else if (cur==="아이템") S.optDraft["od-"+cid] = "";
    render(); return; }
  if (d.cfxn){ const [n, id] = d.cfxn.split("|"); S.cfxPick[n] = S.cfxPick[n]===+id ? null : +id; S.cfxKind[n] = ""; render(); return; }
  if (d.cfxk){ const [n, k] = d.cfxk.split("|"); S.cfxKind[n] = S.cfxKind[n]===k ? "" : k; render(); return; }
  if (d.cfxwrong){ const c = DATA.coord.find(x => x.id===+d.cfxwrong); const to = !S.cfix[c.id]?.wrong; saveCfix(c, {wrong:to}, {kind:"coordwrong", from:cTitle(c), to:to?"잘못된 정보 표시":"표시 해제", synced:true}); toast(to?"잘못된 정보로 표시했어요":"표시를 해제했어요"); return; }
  if (d.cfpart){ return; }
  if (d.cfxreset){ const c = DATA.coord.find(x => x.id===+d.cfxreset); const from = cTitle(c); delete S.optDraft["cfx-"+c.id]; saveCfix(c, {title:""}, {kind:"coordreq", from, to:c.r, synced:false}); toast("원래 제목으로 되돌렸어요"); return; }
  if (d.slotmenu){ S.slotOpen = S.slotOpen===d.slotmenu ? null : d.slotmenu; render(); return; }
  if (d.act==="csp"){ S.cloSp = !S.cloSp; remember(); render(); return; }
  if (d.oclo){ S.cloOpen = S.cloOpen===+d.oclo ? null : +d.oclo; render(); return; }
  if (d.act==="log-all"){ S.logAll=true; render(); return; }
  if (d.act==="sync-ask"){ S.confirmSync=true; render(); return; }
  if (d.act==="sync-cancel"){ S.confirmSync=false; render(); return; }
  if (d.act==="sync-ok"){ markSynced(); return; }
  if (d.cochip !== undefined){ const n = d.cochip;
    if (S.coordOpen.includes(n)){
      if (S.coordUnsel){ S.coordOpen = S.coordOpen.filter(x => x!==n); if (!S.coordOpen.length) S.coordUnsel = false; saveCoordOpen(); render(); return; }
      coordJump(n); return; }
    S.coordOpen = [...S.coordOpen, n]; saveCoordOpen(); render(); requestAnimationFrame(() => coordJump(n)); return; }
  if (d.coordp !== undefined){ const n = d.coordp; S.coordOpen = S.coordOpen.includes(n) ? S.coordOpen.filter(x => x!==n) : [...S.coordOpen, n]; if (!S.coordOpen.length) S.coordUnsel = false; saveCoordOpen(); render(); return; }
  if (d.act==="coord-open"){ S.coordOpen = [...new Set(DATA.coord.map(c => curPerson(c.pb)))]; saveCoordOpen(); render(); return; }
  if (d.act==="coord-hidedone"){ S.coordHideDone = !S.coordHideDone; remember(); saveCoordOpen(); render(); return; }
  if (d.act==="coord-unsel"){ S.coordUnsel = !S.coordUnsel; render(); return; }
  if (d.act==="coord-close"){ S.coordUnsel = false; S.coordOpen = []; saveCoordOpen(); render(); return; }
  if (d.act==="fcprev" || d.act==="fcnext"){ const cur = S.facFcSel[0] || 0, n = Math.min(FC_MAX, Math.max(1, cur + (d.act==="fcnext" ? 1 : -1))); S.facType="전체"; S.itemPick=""; S.facFcSel = [n]; S.fcNoteOpen = false; remember(); render(); return; }
  if (d.act==="sumtop"){ const el = document.querySelector("#view .card"); scrollTo({top:0, behavior:"smooth"}); return; }
  if (d.fcn !== undefined){ const n = +d.fcn; S.facType="전체"; S.itemPick=""; if (S.fcMode==="multi") S.facFcSel = S.facFcSel.includes(n) ? S.facFcSel.filter(x => x!==n) : [...S.facFcSel, n].sort((a,b)=>a-b); else { S.facFcSel = S.facFcSel.includes(n) && S.facFcSel.length===1 ? [] : [n]; } if (!S.facFcSel.length) S.facFcOpen = false; S.fcNoteOpen = false; remember(); render(); return; }
  if (d.act==="fcopen"){ S.facFcOpen = !S.facFcOpen; remember(); render(); return; }
  if (d.cdone !== undefined){ const n = d.cdone; S.coordDone = S.coordDone.includes(n) ? S.coordDone.filter(x => x!==n) : [...S.coordDone, n]; S.coordOpen = S.coordOpen.filter(x => x!==n); saveCoordOpen(); render(); toast(S.coordDone.includes(n) ? `${n} 코디 완료` : `${n} 완료 취소`); if (db) writeSerial(`${RUN}/misc/coord`, {list:S.coordDone}).catch(()=>{}); return; }
  if (d.cled){ const [id,k] = d.cled.split("|"); S.cloEdit[+id] = S.cloEdit[+id]===k ? "" : k; render(); return; }
  if (d.ptog){ const k = d.ptog, id = +k.slice(3); const o = optOf(DATA.clo.find(x=>x.id===id)); const cur = S.optDraft[k] ?? !!(k.startsWith("gx")?o.guest:o.like); S.optDraft[k] = !cur; render(); return; }
  if (d.btog){ const id = +d.btog; const cur = S.optDraft["bo-"+id] ?? !!S.cbattle[id]?.on; S.optDraft["bo-"+id] = !cur; render(); return; }
  if (d.cypick){ const [k,g] = d.cypick.split("|"); const p = {...(S.cyPick||{})}; if (p[k]===g) delete p[k]; else p[k]=g; S.cyPick = p; S.cyErr = ""; render(); return; }
  if (d.cyedit !== undefined){ S.cyEdit = S.cyEdit===d.cyedit || !d.cyedit ? null : d.cyedit; CONTESTS.forEach(([k]) => delete S.optDraft["cye-"+k]); render(); return; }
  if (d.cyasel){ const a = S.cyAsk; if (a){ a.sel = {...a.sel, [d.cyasel]: !a.sel[d.cyasel]}; render(); } return; }
  if (d.act==="cya-ok"){ cyApply(true); return; }
  if (d.act==="cya-no"){ cyApply(false); return; }
  if (d.act==="cya-close"){ S.cyAsk = null; render(); return; }
  if (d.cydel){ const id = d.cydel; S.cyears = S.cyears.filter(x => x._id!==id); render(); if (db) db.doc("cyear/"+id).delete().catch(()=>{}); return; }
  if (d.upmode){ S.upMode = d.upmode; remember(); render(); return; }
  if (d.upstaff !== undefined){ const i = +d.upstaff; if (S.upMulti){ S.upStaffs = S.upStaffs.includes(i) ? S.upStaffs.filter(x => x!==i) : [...S.upStaffs, i].sort((a,b)=>a-b); } else S.upStaff = i; remember(); render(); return; }
  if (d.act==="upmulti"){ S.upMulti = !S.upMulti; if (S.upMulti && !S.upStaffs.length) S.upStaffs = [S.upStaff ?? 0]; remember(); render(); return; }
  if (d.upopt !== undefined){ S.upOpt = d.upopt; remember(); render(); return; }
  if (d.act==="reset-ask"){ S.resetAsk=true; render(); return; }
  if (d.act==="reset-no"){ S.resetAsk=false; render(); return; }
  if (d.act==="reset-ok"){ resetAll(); return; }
});
let qT=null;
document.addEventListener("compositionend", e => { if (["homeQ","facQ","cloQ","coordQ","setQ","refQ"].includes(e.target.id)) e.target.dispatchEvent(new Event("input", {bubbles:true})); });
document.addEventListener("input", e => {
  const id = e.target.id;
  if (/^ih-\w+$/.test(id)){ S.ih = {...(S.ih||{}), [id.slice(3)]: e.target.value.replace(/[^\d]/g,"")}; ihRefresh(); ihSave(); return; }
  if (/^cp-\w+$/.test(id)){ S.cp = {...(S.cp||{}), [id.slice(3)]: e.target.value.replace(/[^\d]/g,"")}; cpRefresh(); cpSave(); return; }
  if (id==="cyYear"){ S.optDraft.cyYear = e.target.value; if (S.cyErr){ S.cyErr=""; } return; }
  if (/^cy[se]-\w+$/.test(id)){ S.optDraft[id] = e.target.value; return; }
  if (/^bn-\d+$/.test(id)){ S.optDraft[id] = e.target.value; return; }
  if (/^(o[gld]|cn|ck|sp|ss|cm|cs|cfx)-\d+$/.test(id)){ if (S.scErr && /^s[ps]-/.test(id)) S.scErr = ""; if (S.scErr2 && /^c[ms]-/.test(id)) S.scErr2 = ""; S.optDraft[id] = e.target.value; return; }
  if (e.isComposing) return;
  if (id==="cScore"){ S.cScore = e.target.value; if (S.cMsg){ S.cMsg=""; } return; }
  if (id==="rnNew"){ S.rnNew = e.target.value; S.rnErr=""; return; }
  /* 셀렉트는 고른 뒤 포커스를 풀고 다시 그림: 다시 포커스하면 아이폰에서 선택 창이 한 번 더 뜸 */
  if (/^cfp-\d+$/.test(id)){ e.target.blur(); S.cfxPart[+id.slice(4)] = e.target.value; delete S.optDraft["cfv-"+id.slice(4)]; render(); return; }
  if (/^cfv-\d+$/.test(id)){ S.optDraft[id] = e.target.value; return; }
  if (/^cf-\d+$/.test(id)){ e.target.blur(); S.cloField[+id.slice(3)] = e.target.value; delete S.optDraft["cv-"+id.slice(3)]; render(); return; }
  if (/^cv-\d+$/.test(id)){ S.optDraft[id] = e.target.value; return; }
  if (/^ok-\d+$/.test(id)){ e.target.blur(); S.optKind[+id.slice(3)] = e.target.value; render(); return; }
  if (/^bq-\d+$/.test(id)){ const cid = +id.slice(3); S.optDraft["bo-"+cid] = !!e.target.value; S.optDraft["bn-"+cid] = e.target.value; const el = document.getElementById("bn-"+cid); saveBattleValue(cid, e.target.value); return; }
  if (/^fa-(main|alt)-\d+$/.test(id)){ e.target.blur(); const [,key,oi] = id.match(/^fa-(main|alt)-(\d+)$/); const fid = +e.target.value; if (!fid) return; const cur = S.fcDraft[oi] || {main:checkMain(+oi).map(f=>f.id), alt:checkAlt(+oi).map(f=>f.id)}; if (!cur[key].includes(fid)) cur[key] = [...cur[key], fid]; S.fcDraft = {...S.fcDraft, [oi]:cur}; render(); return; }
  if (id==="rnOld"){ e.target.blur(); S.rnOld = e.target.value; S.rnErr=""; render(); return; }
  if (!["homeQ","facQ","cloQ","coordQ","setQ","refQ"].includes(id)) return;
  S[id] = e.target.value; if (id==="homeQ") S.homeOpen = ""; clearTimeout(qT); qT = setTimeout(render, 150);
});
document.addEventListener("change", e => {
  if (e.target.id==="impFile"){ const f = e.target.files?.[0]; if (f) importRead(f); e.target.value = ""; return; }
  if (/^bq-\d+$/.test(e.target.id)){ e.target.dispatchEvent(new Event("input",{bubbles:true})); return; } if (/^fa-(main|alt)-\d+$/.test(e.target.id)) return; if (e.target.tagName==="SELECT" && (["rnOld"].includes(e.target.id) || /^(ok|cf|cfp|bq)-\d+$/.test(e.target.id) || /^fa-(main|alt)-\d+$/.test(e.target.id)) && e.target.value !== ({rnOld:S.rnOld})[e.target.id] && !/^(ok|cf|cfp|bq|fa)-/.test(e.target.id)) e.target.dispatchEvent(new Event("input",{bubbles:true})); });
document.addEventListener("submit", e => {
  if (e.target.id==="cyForm"){ e.preventDefault(); addYear(); return; }
  if (e.target.dataset?.cyeform){ e.preventDefault(); saveYearScores(e.target.dataset.cyeform); return; }
  if (e.target.id==="homeForm"){ e.preventDefault(); document.getElementById("homeQ")?.blur(); return; }
  const full = e.target.closest("form[data-clofull],form[data-cofull],form[data-fcfull],form[data-btfull]");
  if (full){ e.preventDefault(); const d = full.dataset; if (d.btfull) saveBtFull(+d.btfull); else if (d.clofull) saveCloFull(+d.clofull); else if (d.cofull) saveCoordFull(d.cofull); else saveFcFull(+d.fcfull); return; }
  const bf = e.target.closest("form[data-btform]");
  if (bf){ e.preventDefault(); const id = +bf.dataset.btform; S.optDraft["bo-"+id] = !!document.getElementById("bn-"+id)?.value; saveBattle(id); return; }
  const df = e.target.closest("form[data-cdform]");
  if (df){ e.preventDefault(); saveCoordScore(+df.dataset.cdform); return; }
  const sf = e.target.closest("form[data-scform]");
  if (sf){ e.preventDefault(); saveScore(+sf.dataset.scform); return; }
  const fa = e.target.closest("form[data-fcall]");
  if (fa){ e.preventDefault(); const oi = +fa.dataset.fcall, ed = S.fcEdit; const v = id => (document.getElementById(id+"-"+oi)?.value ?? "").trim(); let n = 0;
    if (ed.name && v("ck") && v("ck")!==checkName(oi)){ renameCheck(oi, v("ck")); n++; }
    if (ed.pass && (v("sp") || v("ss"))){ saveScore(oi); n++; }
    if (ed.coord && (v("cm") || v("cs"))){ saveCoordScore(oi); n++; }
    if (!n) toast("저장할 내용이 없어요"); else { S.fcEdit = {}; S.sheet = null; } render(); return; }
  const kf = e.target.closest("form[data-ckform]");
  if (kf){ e.preventDefault(); const oi = +kf.dataset.ckform; renameCheck(oi, document.getElementById("ck-"+oi).value); return; }
  const cpf = e.target.closest("form[data-cfpform]");
  if (cpf){ e.preventDefault(); const c = DATA.coord.find(x => x.id===+cpf.dataset.cfpform); const k = document.getElementById("cfp-"+c.id).value, v = (document.getElementById("cfv-"+c.id)?.value ?? "").trim();
    const from = cPart(c,k); const label = PARTS.find(x=>x[0]===k)[1]; delete S.optDraft["cfv-"+c.id];
    if (v===from) return; saveCfix(c, {[PK(k)]: (!v || v===c[k]) ? "" : v}, {kind:"coordreq", from:`${label} ${from||"-"}`, to:`${label} ${(v||c[k])||"-"}`, synced:false}); toast(`${label}을(를) ${v||c[k]||"-"}(으)로 바꿨어요`); return; }
  const cff = e.target.closest("form[data-cfform]");
  if (cff){ e.preventDefault(); const id = +cff.dataset.cfform; saveCloFix(id, document.getElementById("cf-"+id).value, document.getElementById("cv-"+id)?.value ?? ""); return; }
  const xf = e.target.closest("form[data-cfxform]");
  if (xf){ e.preventDefault(); const c = DATA.coord.find(x => x.id===+xf.dataset.cfxform); const nt = document.getElementById("cfx-"+c.id).value.trim(); if (!nt || nt===cTitle(c)) return; const from = cTitle(c); delete S.optDraft["cfx-"+c.id]; saveCfix(c, {title: nt===c.r ? "" : nt}, {kind:"coordreq", from, to:nt, synced:false}); toast(`제목을 ${nt}(으)로 바꿨어요`); return; }
  const cf = e.target.closest("form[data-cnform]");
  if (cf){ e.preventDefault(); const id = +cf.dataset.cnform; renameClo(id, document.getElementById("cn-"+id).value); return; }
  const of = e.target.closest("form[data-optform]");
  if (of){ e.preventDefault(); const id = +of.dataset.optform; const c = DATA.clo.find(x=>x.id===id), o = optOf(c);
    const kind = document.getElementById("ok-"+id)?.value || "손님";
    if (kind==="손님") saveOpt(id, document.getElementById("og-"+id)?.value ?? "", o.like, o.likeType, o.likeDetail);
    else { const l = (document.getElementById("ol-"+id)?.value ?? "").trim();
      if (!l) saveOpt(id, o.guest, "", "", "");
      else if (kind==="매장") saveOpt(id, o.guest, l, "신규 매장", document.getElementById("od-"+id)?.value ?? "");
      else saveOpt(id, o.guest, l, "아이템", SEED); }
    return; }
  if (e.target.id==="cEditForm"){ e.preventDefault(); saveContest(e.target.dataset.key); return; }
  if (e.target.id==="rnForm"){
    e.preventDefault();
    if (!S.rnOld){ S.rnErr = "바꿀 이름을 먼저 골라 주세요"; render(); return; }
    if (!S.rnNew.trim()){ S.rnErr = "새 이름을 입력해 주세요"; render(); return; }
    if (S.rnKind==="시설"){ const f = DATA.fac.find(x => facName(x)===S.rnOld); renameFac(f.id, S.rnNew); }
    else renamePerson(S.rnOld, S.rnNew);
    S.rnOld = S.rnNew.trim(); S.rnNew = ""; S.rnErr = ""; render(); return;
  }
  const f = e.target.closest("form[data-rfac]"); if (!f) return;
  e.preventDefault(); const id=+f.dataset.rfac; renameFac(id, document.getElementById("rn-"+id).value);
});
async function markSynced(){
  S.confirmSync=false;
  const ids = S.logs.filter(l => !l.synced).map(l => l._id);
  S.logs = S.logs.map(l => ({...l, synced:true})); render();
  if (!db) return;
  for (const id of ids){ try{ await db.doc("log/"+id).update({synced:true}); }catch(e){} }
  toast("반영 완료로 표시했어요");
}

/* ---------- 테마 선택: 모드는 html[data-theme], 팔레트는 html[data-pal]. 선택은 이 기기 브라우저에만 저장 ---------- */
(function(){
  const root = document.documentElement;
  let pref = {mode:"system", pal:"rose", design:"hybrid", device:"auto", skin:"classic"}; let palOpen = false;
  try{ Object.assign(pref, JSON.parse(localStorage.getItem("fms-theme")||"{}")); }catch(e){}
  function apply(){
    if (pref.mode==="system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", pref.mode);
    if (pref.pal==="blue") root.removeAttribute("data-pal"); else root.setAttribute("data-pal", pref.pal);
    root.setAttribute("data-design", "hybrid");
    pref.skin = validSkin(pref.skin);
    root.setAttribute("data-skin", pref.skin);
    document.querySelectorAll("button[data-skin]").forEach(b => { const on = b.dataset.skin === pref.skin; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
    root.setAttribute("data-device", pref.device||"auto");
    document.querySelectorAll("[data-device]:not(html)").forEach(b => b.classList.toggle("on", b.dataset.device===(pref.device||"auto")));
    document.querySelectorAll("button[data-mode]").forEach(b => { const on=b.dataset.mode===pref.mode; b.classList.toggle("on",on); b.setAttribute("aria-pressed",String(on)); });
    document.querySelectorAll("button[data-pal]").forEach(b => { const on=b.dataset.pal===pref.pal; b.classList.toggle("on",on); b.setAttribute("aria-pressed",String(on)); });
    try{ localStorage.setItem("fms-theme", JSON.stringify(pref)); }catch(e){}
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("button[data-mode],button[data-pal],button[data-device],button[data-skin]"); if (!b) return;
    if (b.dataset.act==="palopen") palOpen = !palOpen;
    else if (b.dataset.skin) pref.skin = validSkin(b.dataset.skin);
    else if (b.dataset.mode) pref.mode = b.dataset.mode; else if (b.dataset.design){ pref.design = b.dataset.design; S.sheet = null; } else if (b.dataset.device) pref.device = b.dataset.device; else pref.pal = b.dataset.pal;
    apply(); if (b.dataset.design || b.dataset.device) render();
  });
  window.__prefsApply = apply;
  apply();
})();
render();

/* ---------- 숫자 입력칸: 보일 때는 쉼표(12,345), 저장은 숫자만 ---------- */
const fmtNum = v => { const d = String(v ?? "").replace(/[^\d]/g,""); return d ? Number(d).toLocaleString("en-US") : ""; };
function fmtNumInputs(){
  document.querySelectorAll('input[inputmode="numeric"]').forEach(el => {
    const f = fmtNum(el.value); if (el.value !== f) el.value = f;
    if (/^\d{4,}$/.test(el.placeholder || "")) el.placeholder = fmtNum(el.placeholder);
  });
}
document.addEventListener("input", e => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement) || el.inputMode !== "numeric" || e.isComposing) return;
  const pos = el.selectionStart ?? el.value.length;
  const before = el.value.slice(0, pos).replace(/[^\d]/g,"").length;
  const f = fmtNum(el.value); if (f === el.value) return;
  el.value = f;
  let i = 0, n = 0; while (i < f.length && n < before){ if (/\d/.test(f[i])) n++; i++; }
  try{ el.setSelectionRange(i, i); }catch(_){}
}, true);
{ const render0 = render; render = function(){ render0.apply(this, arguments); fmtNumInputs(); }; }
fmtNumInputs();

/* ---------- 칩 끌어서 순서 바꾸기 ---------- */
(() => {
  let drag = null;
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest?.(".dragchip"); if (!el) return;
    e.preventDefault();
    drag = {el, wrap: el.parentElement, key: el.dataset.dk, moved:false};
    el.classList.add("dragging");
  });
  document.addEventListener("pointermove", e => {
    if (!drag) return; e.preventDefault(); drag.moved = true;
    drag.el.style.pointerEvents = "none";
    const t = document.elementFromPoint(e.clientX, e.clientY)?.closest(".dragchip");
    drag.el.style.pointerEvents = "";
    if (!t || t === drag.el || t.parentElement !== drag.wrap) return;
    const r = t.getBoundingClientRect();
    const after = e.clientY > r.bottom ? true : e.clientY < r.top ? false : e.clientX > r.left + r.width/2;
    drag.wrap.insertBefore(drag.el, after ? t.nextSibling : t);
  }, {passive:false});
  const end = () => {
    if (!drag) return; const {el, wrap, key, moved} = drag; drag = null; el.classList.remove("dragging");
    if (!moved) return;
    const order = [...wrap.querySelectorAll(".dragchip")].map(x => x.dataset.dv);
    saveChipOrder({...(S.chipOrder||{}), [key]: order});
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
})();

/* ---------- 배치 판: 끌어서 그리기 / 선택 영역 이동·크기 조절 ---------- */
(() => {
  let st = null;
  const cell = (svg, e) => { const r = svg.getBoundingClientRect(), u = r.width / (LAY_N + 0.4);
    return [Math.max(0, Math.min(LAY_N-1, Math.floor((e.clientX - r.left)/u - 0.2))), Math.max(0, Math.min(LAY_N-1, Math.floor((e.clientY - r.top)/u - 0.2)))]; };
  const box = (a, b) => ({x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(a[0]-b[0]) + 1, h: Math.abs(a[1]-b[1]) + 1});
  const cand = () => {
    if (st.mode === "draw") return {g: S.layG || LAY_G[0], ...box(st.a, st.b)};
    const r = st.r;
    if (st.mode === "move") return {...r, x: Math.max(0, Math.min(LAY_N - r.w, r.x + st.b[0] - st.a[0])), y: Math.max(0, Math.min(LAY_N - r.h, r.y + st.b[1] - st.a[1]))};
    return {...r, ...box(st.anchor, st.b)};
  };
  document.addEventListener("pointerdown", e => {
    const svg = e.target.closest?.("#laySvg"); if (!svg || S.layRec != null) return;
    e.preventDefault(); const c = cell(svg, e);
    const sel = S.laySel && layRects().find(r => r.id===S.laySel), h = e.target.getAttribute?.("data-lh");
    if (sel && h){
      const ax = h[1]==="l" ? sel.x + sel.w - 1 : sel.x, ay = h[0]==="t" ? sel.y + sel.h - 1 : sel.y;
      st = {svg, a:c, b:c, moved:false, mode:"size", r:sel, anchor:[ax, ay]};
    } else if (sel && layHit(sel, c[0], c[1])) st = {svg, a:c, b:c, moved:false, mode:"move", r:sel};
    else st = {svg, a:c, b:c, moved:false, mode:"draw"};
  });
  document.addEventListener("pointermove", e => {
    if (!st) return; e.preventDefault(); const c = cell(st.svg, e);
    if (c[0]!==st.b[0] || c[1]!==st.b[1]){ st.b = c; st.moved = true; }
    if (!st.moved) return;
    const b = cand(), col = TYPE_COLOR[b.g], pr = document.getElementById("layPrev"), pt = document.getElementById("layPrevT");
    if (st.r){ const gEl = st.svg.querySelector(`[data-lid="${st.r.id}"]`); if (gEl) gEl.style.opacity = 0.2; }
    pr.setAttribute("x", b.x); pr.setAttribute("y", b.y); pr.setAttribute("width", b.w); pr.setAttribute("height", b.h); pr.setAttribute("fill", col); pr.setAttribute("stroke", col);
    pt.setAttribute("x", b.x + b.w/2); pt.setAttribute("y", b.y + b.h/2); pt.textContent = `${b.w}×${b.h}`;
    const info = document.getElementById("layInfo"); if (info) info.innerHTML = `<b style="color:${col}">${layGName(b.g)}</b> ${b.w}×${b.h} · ${b.w*b.h}칸`;
  }, {passive:false});
  const end = () => {
    if (!st) return; const s0 = st, {a, moved} = s0; st = null;
    if (!moved){ const hit = [...layRects()].reverse().find(r => layHit(r, a[0], a[1])); S.laySel = hit ? (S.laySel===hit.id && s0.mode!=="size" ? null : hit.id) : null; render(); return; }
    st = s0; const nb = cand(); st = null;
    if (s0.mode !== "draw"){ layEdit(s0.r.id, () => nb); render(); return; }
    nb.id = "l" + Date.now().toString(36);
    if (layRects().some(r => layOverlap(r, nb))){ toast("다른 영역과 겹쳐요. 먼저 지우고 그려 주세요"); render(); return; }
    S.laySel = null; saveLayout([...layRects(), nb]);
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", () => { st = null; render(); });
})();

/* ---------- 클릭 기록(2026-11-09 제제 요청: 마지막 회차 동안 새 노트에서 수집) ----------
   누른 버튼의 data-* 값·글자·탭과 필터 상태(누르기 전후)·화면 폭·스크롤을 20초마다 모아 note/v2/uilog/{세션}-{순번}에 저장.
   입력칸은 글자 수만 남김. 진행 데이터 경로는 건드리지 않음. 기기별로 도구 > 화면에서 끄고 켬(localStorage fms-clicklog-off) */
/* 의류 선택 수동 저장·불러오기: 평소엔 자동 저장(ui/slots slot.all), 기기 간 연동이 안 될 때 대비 */
function selSaveCard(){
  const a = S.cloSlot?.all, n = a && typeof a === "object" ? ["cat","pat","mat","opt"].reduce((t,k) => t + (a[k]||[]).length, 0) : 0;
  const cur = curSel(), cn = Object.values(cur).reduce((t,l) => t + l.length, 0);
  return `<section class="card prefs-card">
    <div class="sec-h"><h2>의류 선택 저장</h2><span>지금 ${cn}개 선택 · 저장된 것 ${n}개</span></div>
    <p class="hint" style="margin:0 0 10px">의류 탭의 장르·옷본·재료·옵션 선택은 누를 때마다 자동으로 저장돼요. 다른 기기와 맞지 않을 때만 아래 버튼을 써 주세요.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn ghost sm" data-slot="save|all">지금 선택 수동 저장</button><button type="button" class="btn ghost sm" data-slot="load|all" ${n?"":"disabled"}>저장된 선택 불러오기</button></div>
  </section>`;
}
function clickLogCard(){
  const off = clkOff();
  return `<section class="card prefs-card">
    <div class="sec-h"><h2>클릭 기록</h2><span>${off ? "이 기기에서 꺼짐" : `기록 중 · 이번에 ${CLK.sent + CLK.buf.length}건`}</span></div>
    <div class="setrow"><span class="setk">이 기기</span><div class="seg"><button type="button" class="${off?"":"on"}" data-act="clkon" aria-pressed="${!off}">켜기</button><button type="button" class="${off?"on":""}" data-act="clkoff" aria-pressed="${off}">끄기</button></div></div>
    <p class="hint" style="margin:8px 0 0">화면 개편 참고용으로 누른 버튼과 화면 상태만 모아요(입력한 글자는 저장 안 함). 마지막 회차가 끝나면 Claude에게 말해 주세요.</p>
    <div style="margin-top:10px"><button type="button" class="btn ghost sm" data-act="clkdown">모은 기록 파일로 받기</button></div>
  </section>`;
}
(() => {
  const ua = navigator.userAgent, touch = "ontouchend" in document;
  const dev = /iPhone/.test(ua) ? "iphone" : (/iPad/.test(ua) || (/Macintosh/.test(ua) && touch)) ? "ipad" : /Macintosh/.test(ua) ? "mac" : "other";
  let lastY = -1, lastScrollT = 0, typing = null;
  const arr = v => Array.isArray(v) ? v.length : (v && v !== "전체" ? 1 : 0);
  const st = () => { try{ return { tab:S.tab, rec:S.recSub, more:S.moreSub, co:S.coordSub, cs:S.cloSt, ck:(S.cloKind||[]).join(","), cc:arr(S.cloCat), cp:arr(S.cloPat), cm:arr(S.cloMat), cop:arr(S.cloOpt), cbt:S.cloBt, cbv:!!S.cloBtView, fs:Array.isArray(S.facSt)?S.facSt.join(","):S.facSt, ft:S.facType, fc:(S.facFcSel||[]).length, ip:S.itemPick||"", om:S.ocMode||"pick", op:S.ocPick||"", open:S.cloOpen??S.facOpen??null }; }catch(e){ return {}; } };
  const push = ev => { if (clkOff()) return; ev.t = Date.now(); ev.w = innerWidth; ev.y = Math.round(scrollY); CLK.buf.push(ev); if (CLK.buf.length >= 60) flush(); };
  const pick = el => {
    const d = {}; for (const [k, v] of Object.entries(el.dataset || {})) d[k] = String(v).slice(0, 40);
    const isInput = /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    return { el: el.tagName.toLowerCase() + (el.id ? "#" + el.id : ""), cls: typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 3).join(".") : "", d,
      x: isInput ? "" : (el.innerText || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 30) };
  };
  document.addEventListener("click", e => {
    if (clkOff()) return;
    const el = e.target.closest("button,a,input,select,textarea,label,summary,[role=button],[role=checkbox],[data-tab]");
    const ev = { k:"c", ...(el ? pick(el) : { el:"(빈 곳)" }), s0:st() };
    setTimeout(() => { ev.s1 = st(); push(ev); }, 0);
  }, true);
  document.addEventListener("change", e => { const el = e.target; if (el && (el.tagName === "SELECT" || el.type === "checkbox" || el.type === "radio")) push({ k:"ch", ...pick(el), s1:st() }); }, true);
  document.addEventListener("input", e => { const el = e.target; if (!el || !el.id) return; clearTimeout(typing); typing = setTimeout(() => push({ k:"in", el:el.id, len:(el.value||"").length, s1:st() }), 1500); }, true);
  document.addEventListener("toggle", e => { const el = e.target; if (el && el.tagName === "DETAILS") push({ k:"tg", el:"details", d:{...(el.dataset||{})}, open:el.open, s1:st() }); }, true);
  addEventListener("scroll", () => { const now = Date.now(); if (now - lastScrollT < 2500) return; lastScrollT = now; const y = Math.round(scrollY); if (Math.abs(y - lastY) < 400) return; lastY = y; push({ k:"s", h:document.documentElement.scrollHeight, s1:{ tab:S.tab, rec:S.recSub, co:S.coordSub } }); }, { passive:true });
  async function flush(){
    if (!CLK.buf.length || !db) return;
    const ev = CLK.buf; CLK.buf = [];
    try{ await db.collection("uilog").doc(`${CLK.sid}-${String(CLK.seq++).padStart(3, "0")}`).set({ sid:CLK.sid, dev, ua:ua.slice(0, 120), round:roundNo(), run:RUN, skin:document.documentElement.dataset.skin || "", t:Date.now(), n:ev.length, ev }); CLK.sent += ev.length; }
    catch(err){ CLK.buf = ev.concat(CLK.buf).slice(-400); }
  }
  setInterval(flush, 20000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
  addEventListener("pagehide", flush);
  push({ k:"open", s1:st(), dev, sh:screen.height, sw:screen.width });
  window.__fmsClickFlush = flush;
})();
/* 모은 기록을 한 파일(JSON)로 받기: Claude에게 넘기거나 드라이브 claude 폴더에 올릴 때 */
function clickLogDownload(){
  if (!db){ toast("로그인한 상태에서 받을 수 있어요"); return; }
  window.__fmsClickFlush?.();
  let done = false;
  const un = db.collection("uilog").onSnapshot(s => {
    if (done) return; done = true; setTimeout(() => un?.(), 0);
    const docs = s.docs.map(d => ({ id:d.id, ...d.data() }));
    const blob = new Blob([JSON.stringify({ exported:new Date().toISOString(), docs }, null, 0)], { type:"application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `fms-clicklog-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast(`클릭 기록 ${docs.length}묶음을 파일로 받았어요`);
  }, () => toast("기록을 불러오지 못했어요"));
}

// Vite가 이 파일을 모듈로 묶어 엔진도 버전별 해시 자산으로 배포한다.
export {};
