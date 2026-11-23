/**
 * 視覺驗證截圖 / Visual verification screenshots
 * 載入網站、切換至各個分頁，並擷取畫面。
 * Loads the site, switches to each tab, and captures screenshots.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync, mkdirSync } from 'node:fs';
import WS from 'ws';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const BASE = process.argv[2] || 'http://127.0.0.1:8765';
const OUT = process.argv[3] || '/tmp/shots';
mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=/tmp/chrome-shot-${Date.now()}`,
  '--window-size=1440,1000',
  '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' });

process.on('exit', () => chrome.kill());

let target = null;
for (let i = 0; i < 40; i++) {
  await sleep(300);
  try {
    const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
    target = list.find(t => t.type === 'page');
    if (target) break;
  } catch {}
}
if (!target) { console.error('Chrome 未能啟動'); process.exit(1); }

const ws = new WS(target.webSocketDebuggerUrl, { perMessageDeflate: false });
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise(resolve => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

ws.on('message', d => {
  const m = JSON.parse(d.toString());
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});

await new Promise(r => ws.on('open', r));
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
});

async function shot(name, expression) {
  if (expression) {
    await send('Runtime.evaluate', { expression, awaitPromise: false });
    await sleep(1400);
  }
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'));
  console.log(`✓ ${name}.png`);
}

await send('Page.navigate', { url: `${BASE}/index.html` });
await sleep(4500);

await shot('01-species');
await shot('02-matching', `document.querySelector('[data-tab="matching"]').click()`);
await shot('03-chatbot', `document.querySelector('[data-tab="chatbot"]').click()`);
await shot('04-quiz', `document.querySelector('[data-tab="quiz"]').click()`);
await shot('05-conservation', `document.querySelector('[data-tab="conservation"]').click()`);
await shot('06-resources', `document.querySelector('[data-tab="resources"]').click()`);
await shot('07-auth', `document.querySelector('[data-tab="species"]').click(); document.getElementById('loginBtn').click()`);
await shot('08-auth-teacher', `document.querySelector('[data-auth-tab="teacher"]').click()`);

// 教師儀表板
await send('Page.navigate', { url: `${BASE}/js/pages/teacher-dashboard.html` });
await sleep(3500);
await shot('09-teacher-dashboard');

ws.close();
chrome.kill();
process.exit(0);
