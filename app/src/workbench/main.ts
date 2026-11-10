import { buildData, TABLES, type Tables } from '../buildData';
import { addPreviewDetails } from '../preview-fixture';
import { pixelIcon } from '../ui/pixel-icons';
import room from '../assets/workbench/workshop-room.svg';
import './style.css';
const data: any = addPreviewDetails(buildData(Object.fromEntries(TABLES.map(n => [n, []])) as unknown as Tables));
type Entry = Record<string, any>;
const $ = (s: string) => document.querySelector<HTMLElement>(s)!;
const safe = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const icon = (name: string) => { const paths: Record<string, string> = { search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>', chevron: '<path d="m9 5 7 7-7 7"/>', down: '<path d="m6 9 6 6 6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="m5 12 4 4L19 6"/>', filter: '<path d="M4 6h16M7 12h10M10 18h4"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>', pin: '<path d="m9 3 6 0-1 5 4 5H6l4-5-1-5ZM12 13v8"/>', arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>', heart: '<path d="M20 5c-3-3-6-1-8 1C8 0 0 5 4 11l8 9 8-9c2-2 2-4 0-6Z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>' }; return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`; };
const labels: Record<string, string> = { clo: '의류 도감', fac: '시설 노트', coord: '코디 & 배틀', tool: '자료와 도구' };
const state = { tab: 'clo', query: '', genre: 'US레트로', pattern: '', material: '', option: '', filter: '', selected: 143, detail: 'use', view: 'all', done: new Set<number>(), queue: new Set<number>(), facDone: new Set<number>(), facQueue: new Set<number>(), tool: 'guide', coordMode: 'request', mobileDetail: false };
const pill = (s: unknown, tone = '') => `<span class="badge ${tone}">${safe(s)}</span>`;
const small = (s: unknown) => `<span class="micro">${safe(s)}</span>`;
function clothes() { return data.clo.filter((c: Entry) => (!state.genre || c.c === state.genre) && (!state.pattern || c.p === state.pattern) && (!state.material || c.m === state.material) && (!state.option || c.o === state.option) && (!state.query || [c.n, c.p, c.m, c.o, c.col, c.x].join(' ').toLowerCase().includes(state.query.toLowerCase())) && (state.view !== 'queue' || state.queue.has(c.id)) && (state.view !== 'done' || state.done.has(c.id)) && (state.view !== 'todo' || !state.done.has(c.id))); }
function notify(text: string) { $('#wb-toast').textContent = text; $('#wb-toast').classList.add('visible'); setTimeout(() => $('#wb-toast').classList.remove('visible'), 2200); }
function shell() {
    $('#workbench').innerHTML = `<aside class="rail"><a href="#" class="brand" aria-label="패션몰 노트 홈"><span class="brand-icon">${pixelIcon('shop')}</span><span>패션몰 노트<small>MY LITTLE MALL</small></span></a><span class="nav-label">나의 작은 기록장</span><nav aria-label="주요 메뉴">${[['clo', '의류 도감', 'clo'], ['fac', '시설 노트', 'fac'], ['coord', '코디 & 배틀', 'coord'], ['tool', '자료와 도구', 'tool']].map(([id, name, ic]) => `<button data-nav="${id}" ${state.tab === id ? 'class="active" aria-current="page"' : ''}>${pixelIcon(ic)}<span>${name}</span>${id === 'clo' ? '<b>432</b>' : ''}</button>`).join('')}</nav><div class="rail-divider"></div><span class="nav-label">바로 꺼내 보기</span><button class="rail-shortcut" data-shortcut="queue">${icon('pin')}제작 목록<span id="rail-queue">${state.queue.size}</span></button><button class="rail-shortcut" data-shortcut="all">${icon('grid')}전체 의류 보기</button><div class="rail-bottom"><span class="pixel-sprout">✦</span><p>하나씩 모아가는 즐거움.<br><b>오늘도, 나만의 패션몰.</b></p><div class="local-note"><i></i>디자인 검토용 미리보기</div><a href="https://github.com/jeje-jjo/fashion-mall-story-note/blob/codex/design-studio-preview/docs/design-studies/dot-atlas/README.md" class="old-preview">이전 시안과 비교 ↗</a></div></aside><div class="workspace"><header class="topbar"><div class="breadcrumb"><span>나의 패션몰</span><span>/</span><b>${labels[state.tab]}</b></div><div class="top-actions"><span class="preview-badge">DESIGN STUDY 05</span><a href="https://kairo.waterbeetles.dev/ko/fashion-mall-story/" target="_blank" rel="noreferrer">위키 ${icon('arrow')}</a><span class="avatar">J</span></div></header><main id="wb-main"></main><footer class="wb-footer">기존 노트 + KairoHistory 기준 · 비공식 개인 참고용<span>샘플 진행 기록 · 실제 계정과 연결되지 않아요.</span></footer></div><div id="wb-toast" role="status"></div>`;
    renderMain();
}
function hero() { const info: Record<string, [
    string,
    string,
    string
]> = { clo: ['COLLECTION / 01', '작은 옷장, 무한한 이야기.', '필요한 옷을 찾고, 만드는 법과 쓰임을 한눈에 살펴보세요.'], fac: ['MY MALL / 02', '좋은 공간에는 이유가 있어요.', '시설마다 잘 맞는 아이템을 찾아, 나만의 매장을 채워보세요.'], coord: ['STYLING / 03', '취향을 잇는 한 벌의 조합.', '손님의 요청부터 챌린지까지, 다음 코디를 준비해 보세요.'], tool: ['REFERENCE / 04', '궁금한 순간, 바로 펼치는 노트.', '흩어져 있던 자료와 계산 도구를 필요한 순간에 꺼내 쓰세요.'] }; const [k, title, desc] = info[state.tab]; return `<section class="page-intro"><div class="intro-copy"><span class="eyebrow">${k}<span class="tiny-star">✦</span> FASHION MALL STORY</span><h1>${title}</h1><p>${desc}</p><div class="intro-meta">${state.tab === 'clo' ? `<span><b>${data.clo.length}</b>벌의 의류</span><i></i><span><b>${state.done.size}</b>벌 제작 완료</span><i></i><span class="green-text">기록은 이 미리보기에서만 유지돼요</span>` : state.tab === 'fac' ? `<span><b>${data.fac.length}</b>개 시설</span><i></i><span><b>${data.items.length}</b>종 아이템</span>` : state.tab === 'coord' ? `<span><b>${data.coord.length}</b>개 손님 요청</span><i></i><span><b>${data.battles.length}</b>개 배틀</span>` : '<span>자료는 주제별로, 도구는 목적별로.</span>'}</div></div><img src="${room}" class="intro-art" alt="직접 만든 도트 패션 공방. 옷걸이, 마네킹과 재봉틀이 놓여 있어요."></section>`; }
function filterMenu() { if (!state.filter)
    return ''; const prop = ({ genre: 'c', pattern: 'p', material: 'm', option: 'o' } as Record<string, string>)[state.filter]; const values = [...new Set<string>(data.clo.map((c: Entry) => c[prop]).filter(Boolean))]; const current = state[state.filter as 'genre']; return `<section class="filter-popover" aria-label="필터 선택"><div><b>${({ genre: '장르', pattern: '옷본', material: '재료', option: '옵션' } as Record<string, string>)[state.filter]} 선택</b><button data-close-filter aria-label="필터 닫기">${icon('close')}</button></div><div class="filter-options"><button data-filter-value="" class="${!current ? 'selected' : ''}">전체</button>${values.map(v => `<button class="${current === v ? 'selected' : ''}" data-filter-value="${safe(v)}">${safe(v)}<span>${data.clo.filter((c: Entry) => c[prop] === v).length}</span></button>`).join('')}</div></section>`; }
function catalog() { const rows = clothes(); return `<section class="catalog-panel"><div class="collection-toolbar"><div class="view-tabs" role="group" aria-label="목록 보기">${[['all', '전체 의류'], ['todo', '미완료'], ['done', '완료'], ['queue', '제작 목록']].map(([id, name]) => `<button data-view="${id}" aria-pressed="${state.view === id}" class="${state.view === id ? 'active' : ''}">${name}${id === 'queue' ? `<span>${state.queue.size}</span>` : ''}</button>`).join('')}</div><span class="result-count">${rows.length}<small>벌</small></span></div><div class="searchbox">${icon('search')}<input id="wb-search" type="search" autocomplete="off" placeholder="이름, 재료, 옵션으로 검색" aria-label="의류 검색" value="${safe(state.query)}"><kbd>/</kbd></div><div class="filter-bar">${icon('filter')}${[['genre', '장르', state.genre], ['pattern', '옷본', state.pattern], ['material', '재료', state.material], ['option', '옵션', state.option]].map(([id, title, value]) => `<button data-filter="${id}" class="${value ? 'has-value' : ''}" aria-expanded="${state.filter === id}"><span>${title}</span>${value ? `<b>${safe(value)}</b>` : ''}${icon('down')}</button>`).join('')}${state.genre || state.pattern || state.material || state.option ? '<button class="reset-filter" data-reset>초기화</button>' : ''}</div>${filterMenu()}<div class="list-caption"><span>의류 <small>· 이름을 누르면 옆에서 자세히 볼 수 있어요</small></span><span>제작 완료</span></div><div class="catalog-list" aria-label="의류 목록">${rows.length ? rows.map((c: Entry) => `<article class="catalog-row ${state.selected === c.id ? 'selected' : ''}"><button class="row-content" data-select="${c.id}" aria-pressed="${state.selected === c.id}"><div class="row-title"><span class="item-id">${String(c.id).padStart(3, '0')}</span><b>${safe(c.n)}</b>${c.o ? '' : pill('기본', 'neutral')}${c.site?.sets?.length ? '<span class="use-dot" title="코디 세트에 필요"></span>' : ''}</div><div class="row-tags">${pill(c.p, 'pattern')}${pill(c.m, 'material')}${c.o ? pill(c.o, c.o === '체크' ? 'lavender' : 'option') : ''}${c.site?.sets?.length ? '<span class="row-use">코디 세트</span>' : ''}</div></button><button class="done-check ${state.done.has(c.id) ? 'checked' : ''}" data-done="${c.id}" aria-label="${safe(c.n)} 제작 완료" aria-pressed="${state.done.has(c.id)}">${state.done.has(c.id) ? icon('check') : ''}</button></article>`).join('') : '<div class="empty-state">' + pixelIcon('clo') + '<b>조건에 맞는 옷이 없어요</b><p>다른 조건을 고르거나 필터를 초기화해 보세요.</p><button class="secondary" data-reset>전체 옷 보기</button></div>'}</div><div class="catalog-foot"><span><i class="legend-dot"></i>코디에 필요한 옷</span><span>기록은 작은 체크부터.</span></div></section>`; }
function detail() {
    const c: Entry = data.clo.find((x: Entry) => x.id === state.selected) || data.clo[0];
    const st = c.site || {};
    const recipe = [['옷본', c.p, 'pattern'], ['재료', c.m, 'material'], ['옵션', c.o || '없음', 'option']];
    const use = `<section class="inspector-section"><div class="section-title"><h3>이 옷이 필요한 곳</h3>${pill('USE', 'tiny')}</div>${st.sets?.length ? `<div class="relation-card"><span class="relation-icon">${pixelIcon('coord')}</span><div><b>${safe(st.sub || c.c)} 코디 세트</b><p>세트 #${st.sets[0]} · ${state.done.has(c.id) ? '1' : '0'}/${data.sets.find((s: Entry) => s.id === st.sets[0])?.clothes.length || 3} 제작 완료</p></div><span class="relation-status">진행 중</span></div>` : '<p class="muted-info">이 미리보기에 연결된 코디 세트가 없어요.</p>'}${c.x ? `<div class="subnote">${icon('info')}<span>${safe(c.x)}</span></div>` : c.id === 143 ? '<div class="person-chips"><span>손님 요청</span>' + pill('전미호①', 'neutral') + pill('고석준③', 'neutral') + '</div>' : ''}</section>${c.o ? `<section class="inspector-section"><div class="section-title"><h3>${safe(c.o)} 옵션 얻는 곳</h3>${icon('plus')}</div><div class="source-list"><div><span class="source-symbol lavender">${pixelIcon('check')}</span><span>자격시험</span><b>${safe(c.c.includes('레트로') ? '레트로 · 하드' : c.c)}</b></div><div><span class="source-symbol sand">${pixelIcon('tool')}</span><span>스터디</span><b>${c.id === 143 ? '계산 빨리 하기' : '기존 노트 참고'}</b></div></div><p class="section-footnote">검토용 예시 연결 정보입니다.</p></section>` : ''}<section class="next-step"><span>${pixelIcon('pin')}</span><div><b>지금 안 만들어도 괜찮아요.</b><p>제작 목록에 담아두고, 다음에 이어서 보세요.</p></div></section>`;
    const basic = `<section class="inspector-section"><h3>옷의 작은 특징들</h3><dl class="basic-facts">${[['종류', [st.kind, st.genre, st.sub].filter(Boolean).join(' · ') || c.c], ['색', c.col], ['계절', c.s], ['손님 성향', st.cust || '미확인'], ['태그', c.tg]].map(([k, v]) => `<div><dt>${safe(k)}</dt><dd>${String(v || '미확인').split('·').map(t => pill(t.trim(), 'neutral')).join('')}</dd></div>`).join('')}</dl></section><section class="inspector-section"><h3>스타일 점수</h3><div class="style-bars">${Object.entries(st.styles || {}).length ? Object.entries(st.styles).map(([k, v]) => `<div><span>${safe(k)}</span><i><b style="width:${Number(v) / 6 * 100}%"></b></i><strong>${v}</strong></div>`).join('') : '<p class="muted-info">등록된 스타일 점수가 없어요.</p>'}</div></section>`;
    const pairs = `<section class="inspector-section"><div class="section-title"><h3>잘 어울리는 옷</h3>${pill((st.goodIds?.length || 0) + '벌', 'green')}</div><div class="pair-list">${(st.goodIds || []).map((id: number) => { const x = data.clo.find((a: Entry) => a.id === id); return x ? `<button data-related="${id}"><span class="pair-mark">+</span><span>${safe(x.n)}</span>${icon('chevron')}</button>` : ''; }).join('') || '<p class="muted-info">등록된 조합이 없어요.</p>'}</div></section><section class="inspector-section"><h3>피하면 좋은 조합</h3><div class="avoid-list">${(st.badIds || []).map((id: number) => pill(data.clo.find((a: Entry) => a.id === id)?.n, 'peach')).join('') || '<p class="muted-info">등록된 조합이 없어요.</p>'}</div></section>`;
    return `<aside class="inspector ${state.mobileDetail ? 'mobile-open' : ''}" ${state.mobileDetail ? 'role="dialog" aria-modal="true"' : ''} aria-label="선택한 의류 상세"><div class="inspector-top"><span class="eyebrow">DETAIL / ${String(c.id).padStart(3, '0')}</span><div><button class="pin-button ${state.queue.has(c.id) ? 'pinned' : ''}" data-queue="${c.id}" aria-label="제작 목록에 ${state.queue.has(c.id) ? '빼기' : '담기'}" aria-pressed="${state.queue.has(c.id)}">${icon('pin')}</button><button class="mobile-close" data-close-detail aria-label="상세 닫기">${icon('close')}</button></div></div><div class="inspector-heading"><div class="detail-tags">${pill(c.c, 'genre')}${c.id === 143 ? pill('챌린지', 'peach') : ''}${state.done.has(c.id) ? pill('제작 완료', 'green') : ''}</div><h2>${safe(c.n)}</h2><p>${state.done.has(c.id) ? '내 옷장에 한 벌 더해졌어요.' : '한 벌을 만드는 작은 레시피'}</p></div><div class="recipe-strip">${recipe.map(([k, v, t]) => `<div><small>${k}</small>${pill(v, t)}</div>`).join('<span class="recipe-plus">+</span>')}</div><div class="detail-metrics">${[['품질', st.q], ['인기', st.pop], ['판매 가격', st.price != null ? Number(st.price).toLocaleString() + ' G' : null]].map(([k, v]) => `<div><span>${k}</span><b>${v ?? '—'}</b></div>`).join('')}</div><div class="inspector-tabs" role="group" aria-label="상세 정보 종류">${[['use', '활용처'], ['basic', '의류 정보'], ['pairs', '궁합']].map(([id, name]) => `<button data-detail-tab="${id}" aria-pressed="${state.detail === id}" class="${state.detail === id ? 'active' : ''}">${name}${id === 'pairs' && st.goodIds?.length ? `<span>${st.goodIds.length}</span>` : ''}</button>`).join('')}</div><div class="inspector-body">${state.detail === 'use' ? use : state.detail === 'basic' ? basic : pairs}</div><div class="inspector-actions"><button class="secondary" data-queue="${c.id}">${icon(state.queue.has(c.id) ? 'check' : 'plus')}${state.queue.has(c.id) ? '목록에 담김' : '제작 목록'}</button><button class="primary" data-done="${c.id}">${icon('check')}${state.done.has(c.id) ? '완료 취소' : '만들었어요'}</button></div><p class="inspector-source">일부 수치·관계는 시안용 예시 · 실제 기록과 다릅니다.</p></aside>`;
}
function facView() { const rows = data.fac.filter((f: Entry) => (!state.query || f.name.includes(state.query)) && (!state.genre || f.type === state.genre)); const current = rows.find((f: Entry) => f.id === state.selected) || rows[0]; const item = (val: string) => data.items.filter((_: string, i: number) => current?.m[i] === val); return `<div class="section-heading"><h2>시설 컬렉션 <span>${rows.length}</span></h2><div class="searchbox">${icon('search')}<input id="wb-search" aria-label="시설 검색" placeholder="시설 이름으로 검색" value="${safe(state.query)}"></div></div><div class="genre-tabs">${['', '내추럴', '쿨', '큐트', '성숙', '레트로', '하드', '서브컬처'].map(g => `<button data-fac-genre="${g}" class="${state.genre === g ? 'active' : ''}">${g || '전체'}</button>`).join('')}</div><div class="content-split"><section class="facility-grid">${rows.length ? rows.map((f: Entry) => `<article class="facility-card ${current?.id === f.id ? 'selected' : ''}"><button data-fac-select="${f.id}"><span class="facility-pixel">${pixelIcon('shop')}</span>${pill(f.type, 'genre')}<h3>${safe(f.name)}</h3><p>잘 맞는 아이템 ${[...f.m].filter(x => x === '◎').length}종</p><span class="facility-tags">${data.items.filter((_: string, i: number) => f.m[i] === '◎').slice(0, 3).map((x: string) => pill(x, 'neutral')).join('')}</span><span class="card-link">시설 노트 열기 ${icon('arrow')}</span></button></article>`).join('') : '<div class="empty-state">조건에 맞는 시설이 없어요</div>'}</section><aside class="inspector facility-inspector ${state.mobileDetail ? 'mobile-open' : ''}" ${state.mobileDetail ? 'role="dialog" aria-modal="true"' : ''} aria-label="시설 상세"><div class="inspector-top"><span class="eyebrow">FACILITY NOTE</span><div>${pixelIcon('fac')}<button class="mobile-close" data-close-detail aria-label="상세 닫기">${icon('close')}</button></div></div><div class="inspector-heading">${pill(current?.type || '시설', 'genre')}<h2>${safe(current?.name || '시설을 골라주세요')}</h2><p>작은 아이템으로 달라지는 공간</p></div><div class="inspector-body"><section class="inspector-section"><div class="section-title"><h3>아주 잘 맞아요</h3>${pill('◎', 'green')}</div><div class="facility-matches">${item('◎').map((x: string) => pill(x, 'green')).join('')}</div></section><section class="inspector-section"><div class="section-title"><h3>잘 어울려요</h3>${pill('○', 'neutral')}</div><div class="facility-matches">${item('◯').map((x: string) => pill(x, 'neutral')).join('')}</div></section><section class="inspector-section"><h3>이 아이템은 피해 주세요</h3><div class="facility-matches">${item('×').map((x: string) => pill(x, 'peach')).join('')}</div></section><div class="next-step">${pixelIcon('check')}<div><b>잘 맞는 아이템부터 하나씩.</b><p>시설별 아이템 체크는 적용 단계에서 연결할 수 있어요.</p></div></div></div><div class="inspector-actions"><button class="secondary" data-fac-queue="${current?.id}">${icon(state.facQueue.has(current?.id) ? 'check' : 'pin')}${state.facQueue.has(current?.id) ? '고정됨' : '시설 고정'}</button><button class="primary" data-fac-done="${current?.id}">${icon('check')}${state.facDone.has(current?.id) ? '완료 취소' : '시설 완료'}</button></div></aside></div>`; }
function coordView() { const isReq = state.coordMode === 'request'; return `<div class="section-heading"><h2>오늘의 코디 노트</h2><div class="view-tabs">${[['request', '손님 요청'], ['battle', '챌린지 배틀']].map(([id, name]) => `<button data-coord-mode="${id}" class="${state.coordMode === id ? 'active' : ''}" aria-pressed="${state.coordMode === id}">${name}</button>`).join('')}</div></div><div class="coord-grid">${(isReq ? data.coord : data.battles).slice(0, 12).map((c: Entry, i: number) => `<article class="request-card"><div class="request-top"><span class="person-avatar">${pixelIcon(isReq ? 'coord' : 'check')}</span><span><small>${isReq ? 'GUEST REQUEST' : 'CHALLENGE'} / ${String(i + 1).padStart(2, '0')}</small><h3>${safe(isReq ? c.p : c.name)}</h3></span>${pill('준비 중', 'neutral')}</div><div class="request-condition"><span>${isReq ? '손님의 한마디' : '코디 조건'}</span><b>${safe(isReq ? c.r : c.cond)}</b></div><div class="request-clothes">${(isReq ? [c.t, c.b, c.o, c.a] : c.ex).filter(Boolean).map((s: string) => { const cl = data.clo.find((x: Entry) => x.n === s); return `<button ${cl ? `data-find-clothes="${cl.id}"` : ''}>${pixelIcon('clo')}<span>${safe(s)}</span>${icon('chevron')}</button>`; }).join('') || '<p class="muted-info">추천 옷은 상세에서 확인해 주세요.</p>'}</div><div class="request-bottom"><span>${isReq ? '필요한 옷을 눌러 만드는 법 확인' : '보상 · ' + safe(c.reward)}</span>${icon('arrow')}</div></article>`).join('')}</div>`; }
function toolView() { const groups = [['guide', '진행과 성장', '랭크 · 자격시험 · 스터디', 'tool'], ['clothes', '옷과 코디', '의류 · 재료 · 조합', 'clo'], ['checks', '패션 체크', '대상 시설 · 조건 · 보상', 'check'], ['battle', '챌린지 배틀', '코디 조건 · 보상', 'coord']]; const rows = state.tool === 'checks' ? data.checks.map((c: Entry) => [c.name, c.req, c.reward]) : state.tool === 'battle' ? data.battles.map((c: Entry) => [c.name, c.cond, c.reward]) : state.tool === 'clothes' ? data.clo.slice(0, 40).map((c: Entry) => [c.n, [c.p, c.m, c.o].filter(Boolean).join(' · '), c.c]) : (data.refTables?.[0]?.rows || []).map((r: Entry) => ['자격시험 ' + r.c0, r.c1 + ' · 품질 ' + r.c2, r.c3]); return `<div class="section-heading"><h2>어떤 기록을 펼쳐볼까요?</h2><span class="muted-info">현재 구조를 묶음별로 다시 정리한 예시입니다.</span></div><div class="reference-groups">${groups.map(([id, title, desc, ic]) => `<button data-tool="${id}" class="${state.tool === id ? 'selected' : ''}"><span class="reference-icon">${pixelIcon(ic)}</span><b>${title}</b><p>${desc}</p>${icon('arrow')}</button>`).join('')}</div><section class="reference-table"><div class="reference-table-head"><h3>${groups.find(g => g[0] === state.tool)?.[1]}</h3>${small('REFERENCE NOTE')}</div><div class="ref-row ref-header"><span>이름</span><span>조건 · 정보</span><span>보상 · 분류</span></div>${rows.map((row: string[]) => `<div class="ref-row">${row.map((v, i) => i === 2 ? `<span>${pill(v, 'neutral')}</span>` : `<span>${safe(v)}</span>`).join('')}</div>`).join('')}</section>`; }
function renderMain(keepSearch = false) { const listTop = document.querySelector('.catalog-list')?.scrollTop; const focused = document.activeElement as HTMLInputElement | null; const active = focused?.id === 'wb-search'; const caret = focused?.selectionStart; $('#wb-main').innerHTML = hero() + (state.tab === 'clo' ? `<div class="section-heading collection-heading"><h2>나의 의류 도감</h2><span class="collection-tip">${icon('info')} 목록과 상세를 나란히, 작업은 끊김 없이.</span></div><div class="content-split">${catalog()}${detail()}</div>` : state.tab === 'fac' ? facView() : state.tab === 'coord' ? coordView() : toolView()); if (keepSearch && active) {
    const input = $('#wb-search') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(caret ?? null, caret ?? null);
} const list = document.querySelector<HTMLElement>('.catalog-list'); if (list) {
    list.style.scrollBehavior = 'auto';
    if (listTop != null)
        list.scrollTop = listTop;
    else {
        const selected = list.querySelector<HTMLElement>('.catalog-row.selected');
        if (selected)
            list.scrollTop = selected.offsetTop - list.offsetTop - 200;
    }
} const n = document.getElementById('rail-queue'); if (n)
    n.textContent = String(state.queue.size); document.body.classList.toggle('detail-is-open', state.mobileDetail); if (state.mobileDetail) {
    document.querySelector<HTMLElement>('.mobile-open .mobile-close')?.focus({ preventScroll: true });
} }
document.addEventListener('click', e => { const el = (e.target as HTMLElement).closest<HTMLElement>('button'); if (!el)
    return; const d = el.dataset; if (d.nav) {
    state.tab = d.nav;
    state.query = '';
    state.filter = '';
    state.mobileDetail = false;
    state.genre = d.nav === 'clo' ? 'US레트로' : '';
    state.selected = d.nav === 'clo' ? 143 : 1;
    shell();
    return;
} if (d.shortcut) {
    state.tab = 'clo';
    state.query = '';
    state.genre = '';
    state.view = d.shortcut;
    shell();
    return;
} if (d.select) {
    state.selected = +d.select;
    state.mobileDetail = window.innerWidth < 1000;
    renderMain();
    return;
} if (d.related || d.findClothes) {
    state.selected = +(d.related || d.findClothes)!;
    state.tab = 'clo';
    state.genre = '';
    state.query = '';
    state.detail = 'use';
    state.mobileDetail = window.innerWidth < 1000;
    shell();
    return;
} if (d.done) {
    const id = +d.done;
    state.done.has(id) ? state.done.delete(id) : state.done.add(id);
    renderMain();
    notify(state.done.has(id) ? '한 벌 완성! 내 옷장에 기록했어요.' : '제작 완료 기록을 취소했어요.');
    return;
} if (d.queue) {
    const id = +d.queue;
    state.queue.has(id) ? state.queue.delete(id) : state.queue.add(id);
    renderMain();
    notify(state.queue.has(id) ? '제작 목록에 담았어요.' : '제작 목록에서 뺐어요.');
    return;
} if (d.view) {
    state.view = d.view;
    renderMain();
    return;
} if (d.filter) {
    state.filter = state.filter === d.filter ? '' : d.filter;
    renderMain();
    return;
} if ('filterValue' in d) {
    (state as any)[state.filter] = d.filterValue;
    state.filter = '';
    renderMain();
    return;
} if ('reset' in d) {
    state.genre = state.pattern = state.material = state.option = state.query = '';
    state.filter = '';
    renderMain();
    return;
} if ('closeFilter' in d) {
    state.filter = '';
    renderMain();
    return;
} if (d.detailTab) {
    state.detail = d.detailTab;
    renderMain();
    return;
} if ('closeDetail' in d) {
    state.mobileDetail = false;
    renderMain();
    return;
} if ('facGenre' in d) {
    state.genre = d.facGenre!;
    renderMain();
    return;
} if (d.facSelect) {
    state.selected = +d.facSelect;
    state.mobileDetail = window.innerWidth < 1000;
    renderMain();
    return;
} if (d.facDone) {
    const id = +d.facDone;
    state.facDone.has(id) ? state.facDone.delete(id) : state.facDone.add(id);
    renderMain();
    notify(state.facDone.has(id) ? '시설 완료를 기록했어요.' : '시설 완료 기록을 취소했어요.');
    return;
} if (d.facQueue) {
    const id = +d.facQueue;
    state.facQueue.has(id) ? state.facQueue.delete(id) : state.facQueue.add(id);
    renderMain();
    return;
} if (d.coordMode) {
    state.coordMode = d.coordMode;
    renderMain();
    return;
} if (d.tool) {
    state.tool = d.tool;
    renderMain();
    return;
} });
document.addEventListener('input', e => { const el = e.target as HTMLInputElement; if (el.id === 'wb-search') {
    state.query = el.value;
    renderMain(true);
} });
document.addEventListener('keydown', e => { if (e.key === 'Tab' && state.mobileDetail) {
    const nodes = [...document.querySelectorAll<HTMLElement>('.mobile-open button,.mobile-open a')].filter(n => n.offsetParent !== null);
    if (e.shiftKey && document.activeElement === nodes[0]) {
        e.preventDefault();
        nodes.at(-1)?.focus();
    }
    else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
        e.preventDefault();
        nodes[0]?.focus();
    }
} if (e.key === 'Escape') {
    state.filter = '';
    state.mobileDetail = false;
    renderMain();
} if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
    e.preventDefault();
    document.querySelector<HTMLInputElement>('#wb-search')?.focus();
} });
shell();
