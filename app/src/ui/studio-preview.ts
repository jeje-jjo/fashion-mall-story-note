import scene from '../assets/studio/boutique.svg';
import '../styles/studio.css';
/** 운영 설정과 분리한 디자인 검토 전용 진입점. */
export function mountStudioPreview() {
 localStorage.setItem('fms-theme', JSON.stringify({skin:'studio',mode:'light',pal:'rose'}));
 document.documentElement.dataset.skin = 'studio';
 document.documentElement.dataset.theme = 'light';
 const art = document.createElement('div');
 art.className = 'studio-scene';
 art.setAttribute('aria-hidden', 'true');
 art.innerHTML = `<span>A LITTLE SHOP,<br>A LOT OF STORIES.</span><img src="${scene}" alt="" width="144" height="48">`;
 document.querySelector('.brandbar')?.insertBefore(art, document.querySelector('.hdr-r'));
 const banner = document.getElementById('previewBanner')!;
 banner.innerHTML = '<span>디자인 시안 · 도트 아틀라스 / 데이터는 화면 검토용 예시입니다.</span><span class="studio-switch"><button type="button" data-preview-skin="classic" data-skin="classic" aria-pressed="false">현재</button><button type="button" data-preview-skin="studio" data-skin="studio" aria-pressed="true">시안</button></span>';
 banner.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-preview-skin]');
  if (!button) return;
  document.documentElement.dataset.skin = button.dataset.previewSkin;
  banner.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 });
}
