import '../styles/rose-workflow.css';
/** 검토용 기본값. 기존 사용자 설정은 덮어쓰지 않으며 운영 시작 경로에는 포함되지 않는다. */
export function prepareRoseWorkflow() {
    localStorage.setItem('fms-theme', JSON.stringify({ skin: 'dried-rose', mode: 'light', pal: 'rose' }));
    document.documentElement.dataset.skin = 'dried-rose';
    document.documentElement.dataset.theme = 'light';
    if (!localStorage.getItem('fms-ui')) {
        localStorage.setItem('fms-ui', JSON.stringify({
            tab: 'clo', cloSt: '미완료', cloKind: ['추가옵션', '전투 추천', '코디 추천'],
            cloMulti: true, cloRowMulti: { opt: true },
            cloOpt: ['프린트', '데미지', '프릴', '라인', '넥타이', '리본', '스트라이프', '체크', '벨트', '체인', '보더', '퍼', '꽃·식물', '지퍼', '링거넥', '셔링', '기하학', '레이스업', '물방울', '레이스', '아가일', '오로라', '카모플라주', '폼폼', '고블랭', '게리코튼'],
            facType: '전체', facExpPin: true, facExp: { genre: true, item: true },
        }));
    }
}
/** 실제 엔진의 버튼을 그대로 복제한다. 선택·저장·완료·되돌리기를 재구현하지 않는다. */
export function mountRoseWorkflow() {
    const banner = document.getElementById('previewBanner')!;
    banner.innerHTML = '<span>DRIED ROSE / 실제 기능으로 검토하는 시안 · 선택 26개는 예시이며 계정 기록과 연결되지 않아요.</span><span class="rose-compare"><button data-skin="classic" type="button">현재</button><button data-skin="dried-rose" type="button">말린 장미</button></span>';
    const dock = document.createElement('section');
    dock.id = 'roseDock';
    dock.hidden = true;
    dock.setAttribute('aria-label', '목록에서 바로 고르는 작업 필터');
    document.body.append(dock);
    const view = document.getElementById('view')!;
    let source: HTMLElement | null = null;
    let frame = 0;
    let rebuildNeeded = true;
    const rowScroll = new Map<number, number>();
    const itemOrder = new Map<string, number>();
    const tabPositions = new Map<string, number>();
    // 기존 재접속 복원과 별개로, 검토 화면에서 탭 왕복 위치도 보존한다.
    document.addEventListener('click', event => {
        if (document.documentElement.dataset.skin !== 'dried-rose')
            return;
        const next = (event.target as HTMLElement).closest<HTMLElement>('#tabs button[data-tab]');
        if (!next)
            return;
        const current = document.querySelector<HTMLElement>('#tabs [aria-current="page"]')?.dataset.tab;
        if (current)
            tabPositions.set(current, window.scrollY);
        const y = tabPositions.get(next.dataset.tab!) || 0;
        requestAnimationFrame(() => requestAnimationFrame(() => { window.scrollTo({ top: y, behavior: "instant" }); schedule(); }));
    }, true);
    view.addEventListener('scroll', event => {
        const strip = event.target as HTMLElement;
        if (!strip.matches('.cfoldchips'))
            return;
        const row = strip.closest('.filter-row');
        const index = [...view.querySelectorAll('.filter-row')].indexOf(row!);
        if (index >= 0)
            rowScroll.set(index, strip.scrollLeft);
    }, true);
    function rebuild() {
        const dockScroll = dock.querySelector<HTMLElement>('.rose-dock-general')?.scrollLeft || 0;
        const active = document.activeElement as HTMLButtonElement | null;
        const restore = active?.closest("#roseDock") ? { opt: active.dataset.copt, item: active.dataset.pick } : null;
        const clothes = view.querySelector<HTMLElement>('.wardrobe-card');
        const facilities = view.querySelector<HTMLElement>('.facility-catalog');
        const original = clothes
            ? clothes.querySelector<HTMLElement>('[data-cfold="opt"]')?.closest<HTMLElement>('.filter-row')
            : facilities?.querySelector<HTMLElement>('[data-fexp="item"]')?.closest<HTMLElement>('.frowgap');
        source = original || null;
        view.querySelectorAll<HTMLElement>('.filter-row .cfoldchips').forEach((strip, index) => {
            if (rowScroll.has(index))
                strip.scrollLeft = rowScroll.get(index)!;
        });
        dock.replaceChildren();
        if (!source)
            return;
        const heading = document.createElement('div');
        heading.className = 'rose-dock-heading';
        const selected = source.querySelectorAll(clothes ? '.cfoldchips [aria-pressed="true"]' : '.pills [aria-pressed="true"]').length;
        heading.innerHTML = `<b>${clothes ? '옵션' : '아이템'} <span>${clothes ? `${selected}개 선택` : '고르고, 체크하고, 다음 아이템'}</span></b><button type="button" class="rose-back">필터로 ↑</button>`;
        heading.querySelector('button')!.addEventListener('click', () => {
            source?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        });
        dock.append(heading);
        const chips = source.querySelector(clothes ? '.cfoldchips' : '.pills');
        if (chips) {
            const clone = chips.cloneNode(true) as HTMLElement;
            clone.classList.add('rose-dock-chips');
            clone.classList.remove('is-strip');
            clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
            if (clothes) {
                const normal = document.createElement('div');
                normal.className = 'chips rose-dock-general';
                const special = document.createElement('div');
                special.className = 'chips rose-dock-special';
                clone.querySelectorAll('button').forEach(button => (button.classList.contains('spchip') ? special : normal).append(button));
                dock.append(normal, special);
                normal.scrollLeft = dockScroll;
            }
            else {
                const buttons = [...clone.querySelectorAll<HTMLButtonElement>('button[data-pick]')];
                buttons.forEach(button => { const key = button.dataset.pick!; if (!itemOrder.has(key))
                    itemOrder.set(key, itemOrder.size); });
                buttons.sort((a, b) => itemOrder.get(a.dataset.pick!)! - itemOrder.get(b.dataset.pick!)!);
                clone.replaceChildren(...buttons);
                dock.append(clone);
            }
        }
        if (facilities) {
            const steps = [...facilities.querySelectorAll<HTMLButtonElement>('[data-act="fcprev"], [data-act="fcnext"]')];
            if (steps.length) {
                const wrap = document.createElement('div');
                wrap.className = 'rose-dock-steps';
                wrap.append(...steps.map(b => b.cloneNode(true)));
                heading.insertBefore(wrap, heading.lastElementChild);
            }
        }
        if (restore) {
            const key = restore.opt !== undefined ? 'copt' : 'pick';
            const value = restore.opt ?? restore.item;
            [...dock.querySelectorAll<HTMLButtonElement>('button')].find(button => button.dataset[key] === value)?.focus({ preventScroll: true });
        }
    }
    function refresh() {
        frame = 0;
        if (rebuildNeeded) {
            rebuild();
            rebuildNeeded = false;
        }
        const on = document.documentElement.dataset.skin === 'dried-rose';
        const list = view.querySelector<HTMLElement>('.list');
        const show = !!(on && source && list && source.getBoundingClientRect().bottom < 5 && list.getBoundingClientRect().bottom > 0);
        dock.hidden = !show;
        document.body.classList.toggle('rose-dock-visible', show);
    }
    function schedule(rebuild = false) {
        rebuildNeeded ||= rebuild;
        if (!frame)
            frame = requestAnimationFrame(refresh);
    }
    new MutationObserver(() => schedule(true)).observe(view, { childList: true, subtree: true });
    new MutationObserver(() => schedule()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-skin'] });
    addEventListener('scroll', () => schedule(), { passive: true });
    addEventListener('resize', () => schedule(), { passive: true });
    schedule(true);
}
