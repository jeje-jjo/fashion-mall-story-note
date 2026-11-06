// 빌드된 dist/index.html을 가짜 저장소(mockdb)로 열어 탭마다 오류가 없는지 확인
const path = require('path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const url = 'file://' + path.join(root, 'dist/index.html');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript({ path: path.join(__dirname, 'mockdb.js') });
  for (const tab of ['home', 'fac', 'clo', 'coord', 'rec']) {
    await p.goto(url + '#' + tab); await p.waitForTimeout(1200);
    await p.evaluate(t => { S.tab = t; render(); }, tab);
    await p.screenshot({ path: path.join(root, `dist/shot_${tab}.png`) });
  }
  const n = await p.evaluate(() => ({ clo: DATA.clo.length, fac: DATA.fac.length, coord: DATA.coord.length }));
  console.log(JSON.stringify(n));
  console.log(errs.length ? 'ERRORS ' + JSON.stringify(errs) : 'ok, no page errors');
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
