/**
 * 互動測試 / Interaction tests
 * 驗證配對遊戲、測驗、登入介面等互動功能是否正常運作。
 * Verifies the matching game, quiz, auth overlay and chat interactions.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import WS from 'ws';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9444;
const BASE = process.argv[2] || 'http://127.0.0.1:8765';

let failures = 0;
function ok(cond, msg) {
  if (cond) console.log('  ✓ ' + msg);
  else { failures++; console.log('  ✗ ' + msg); }
}
function section(t) { console.log('\n▶ ' + t); }

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=/tmp/chrome-it-${Date.now()}`,
  '--window-size=1440,1000', 'about:blank',
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
const errors = [];
const send = (method, params = {}) =>
  new Promise(resolve => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

ws.on('message', d => {
  const m = JSON.parse(d.toString());
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') {
    const e = m.params.exceptionDetails;
    errors.push(`${e.text} ${e.exception?.description || ''} @ ${e.url}:${e.lineNumber}`);
  }
});

await new Promise(r => ws.on('open', r));
await send('Runtime.enable');
await send('Page.enable');

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (res.exceptionDetails) {
    return { error: res.exceptionDetails.exception?.description || res.exceptionDetails.text };
  }
  return res.result?.value;
}

await send('Page.navigate', { url: `${BASE}/index.html` });
await sleep(4500);

// ---------- 1. 初始渲染 ----------
section('1. 初始渲染 (Initial render)');
let s = await evaluate(`({
  articles: document.querySelectorAll('#speciesGrid article').length,
  tabs: document.querySelectorAll('.tab-btn').length,
  matchCards: document.querySelectorAll('#matchTerms .match-card').length,
  dropzones: document.querySelectorAll('#matchBoard .match-dropzone').length,
  quizOpts: document.querySelectorAll('[data-qidx]').length,
  chatMsgs: document.querySelectorAll('.chat-msg').length,
  heroImgLoaded: (() => { const i = document.querySelector('img[src="assets/img/hero.jpg"]'); return i ? i.complete && i.naturalWidth > 0 : false; })(),
  svgIconsLoaded: [...document.querySelectorAll('#matchBoard img, #matchTerms img')].every(i => i.complete && i.naturalWidth > 0),
})`);
ok(s.articles === 5, `5 張蝴蝶卡片 (got ${s.articles})`);
ok(s.tabs === 6, `6 個分頁 (got ${s.tabs})`);
ok(s.matchCards === 6, `6 張詞語卡 (got ${s.matchCards})`);
ok(s.dropzones === 6, `6 個圖畫區 (got ${s.dropzones})`);
ok(s.quizOpts === 40, `40 個測驗選項 (got ${s.quizOpts})`);
ok(s.chatMsgs >= 1, `AI 導師歡迎訊息 (got ${s.chatMsgs})`);
ok(s.heroImgLoaded, '主視覺圖片載入成功');
ok(s.svgIconsLoaded, '所有 SVG 圖示載入成功');

// 滾動到底部，觸發 lazy loading，確認全部蝴蝶圖片正常
await evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
await sleep(2200);
const imgs = await evaluate(`[...document.querySelectorAll('#speciesGrid img')].map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }))`);
ok(imgs.length === 5 && imgs.every(i => i.ok), `滾動後 5 張蝴蝶圖片全部載入成功 (${imgs.filter(i => !i.ok).length} 張失敗)`);
await evaluate(`window.scrollTo(0, 0)`);
await sleep(400);

// ---------- 2. 頁籤切換 ----------
section('2. 頁籤切換 (Tab switching)');
for (const tab of ['matching', 'chatbot', 'quiz', 'conservation', 'resources', 'species']) {
  const vis = await evaluate(`(() => {
    document.querySelector('[data-tab="${tab}"]').click();
    const el = document.getElementById('page-${tab}');
    return { hidden: el.classList.contains('hidden'), others: [...document.querySelectorAll('[id^="page-"]')].filter(x => !x.classList.contains('hidden')).length };
  })()`);
  ok(!vis.hidden && vis.others === 1, `${tab} 分頁可見且其他分頁已隱藏 (others=${vis.others})`);
}

// ---------- 3. 配對遊戲 ----------
section('3. 配對遊戲 (Matching game)');
let m = await evaluate(`(() => {
  document.querySelector('[data-tab="matching"]').click();
  const cards = [...document.querySelectorAll('#matchTerms .match-card')];
  const zones = [...document.querySelectorAll('#matchBoard .match-dropzone')];

  // 找出每張詞語卡對應的正確圖畫區（pictureId 格式：pic-<kind>-<id>-<index>）
  const zoneFor = key => zones.find(z =>
    z.dataset.pictureId.replace(/^pic-/, '').replace(/-\\d+$/, '') === key.replace(':', '-')
  );

  // 圖畫區不應直接顯示答案名稱
  const zonesLeakAnswer = zones.some(z => {
    const label = z.textContent.replace(/\\s+/g, ' ').trim();
    return cards.some(c => label.includes(c.querySelector('p').textContent.trim()));
  });

  // 故意先配錯一次
  const c0 = cards[0];
  const wrongZone = zones.find(z => z !== zoneFor(c0.dataset.matchKey));
  c0.click(); wrongZone.click();

  const afterWrong = {
    matched: document.querySelectorAll('#matchTerms .match-card.matched').length,
    attempts: document.getElementById('matchAttempts').textContent,
    selected: document.querySelectorAll('#matchTerms .match-card[data-selected="1"]').length,
  };

  // 現在正確配對全部
  for (const card of cards) {
    const target = zoneFor(card.dataset.matchKey);
    card.click();
    target.click();
  }

  return {
    zonesLeakAnswer,
    afterWrong,
    finalMatched: document.querySelectorAll('#matchTerms .match-card.matched').length,
    finalScore: document.getElementById('matchScore').textContent,
    resultVisible: !document.getElementById('matchResultCard').classList.contains('hidden'),
    stageInfoVisible: !document.getElementById('matchStageInfo').classList.contains('hidden'),
    filledZones: document.querySelectorAll('#matchBoard .match-dropzone.filled').length,
  };
})()`);
ok(!m.zonesLeakAnswer, '圖畫區不顯示答案名稱（配對題目有效）');
ok(m.afterWrong.matched === 0, '配錯時不會被標記為已配對');
ok(parseInt(m.afterWrong.attempts, 10) >= 1, '錯誤配對會增加嘗試次數');
ok(m.afterWrong.selected === 0, '配錯後取消詞語卡選取狀態');
ok(m.finalMatched === 6, `全部 6 張卡成功配對 (got ${m.finalMatched})`);
ok(m.filledZones === 6, `6 個圖畫區都顯示了詞語 (got ${m.filledZones})`);
ok(m.resultVisible, '完成後顯示結果訊息');
ok(m.stageInfoVisible, '配對後顯示生態小知識');

// ---------- 4. 重新開始 ----------
section('4. 重新開始 (Restart)');
let r = await evaluate(`(() => {
  document.getElementById('matchRestartBtn').click();
  return {
    matched: document.querySelectorAll('#matchTerms .match-card.matched').length,
    score: document.getElementById('matchScore').textContent,
    attempts: document.getElementById('matchAttempts').textContent,
    resultHidden: document.getElementById('matchResultCard').classList.contains('hidden'),
  };
})()`);
ok(r.matched === 0, '重新開始後已配對卡清空');
ok(r.score.startsWith('0'), `重新開始後分數歸零 (${r.score})`);
ok(r.attempts === '0', `重新開始後嘗試次數歸零 (${r.attempts})`);
ok(r.resultHidden, '重新開始後隱藏結果訊息');

// ---------- 5. 難度切換 ----------
section('5. 難度切換 (Difficulty)');
for (const size of [4, 8, 6]) {
  const d = await evaluate(`(() => {
    document.querySelector('[data-size="${size}"]').click();
    return {
      cards: document.querySelectorAll('#matchTerms .match-card').length,
      zones: document.querySelectorAll('#matchBoard .match-dropzone').length,
    };
  })()`);
  ok(d.cards === size && d.zones === size, `難度 ${size} 產生 ${d.cards} 張卡 / ${d.zones} 個圖畫區`);
}

// ---------- 6. 測驗功能 ----------
section('6. 小測驗 (Quiz)');
let q = await evaluate(`(() => {
  document.querySelector('[data-tab="quiz"]').click();
  // 全部答錯
  const opts = [...document.querySelectorAll('[data-qidx]')];
  const byQ = {};
  opts.forEach(o => {
    const qi = o.getAttribute('data-qidx');
    (byQ[qi] = byQ[qi] || []).push(o);
  });
  Object.values(byQ).forEach(list => {
    // 選一個非正確答案：先讀 data 屬性
    list.forEach(o => {
      if (o.getAttribute('data-optidx') !== '0' && !o.dataset.picked) {
        o.dataset.picked = '1';
      }
    });
  });
  const counts = document.getElementById('quizAnsweredCount').textContent;
  // 點擊每題第一個選項
  Object.values(byQ).forEach(list => list[0].click());
  return { before: counts, after: document.getElementById('quizAnsweredCount').textContent };
})()`);
ok(q.after === '10', `10 題全部可作答 (count=${q.after})`);

let summary = await evaluate(`(() => {
  document.getElementById('showFinalScoreBtn').click();
  return {
    visible: !document.getElementById('quizSummaryCard').classList.contains('hidden'),
    title: document.getElementById('quizScoreTitle').textContent,
    badge: document.getElementById('quizGradeBadge').textContent,
    wrongVisible: !document.getElementById('quizWrongSection').classList.contains('hidden'),
    wrongItems: document.querySelectorAll('#quizWrongList > div').length,
  };
})()`);
ok(summary.visible, '顯示總成績單');
ok(/你的得分：\d+ \/ 10/.test(summary.title), `分數格式正確 (${summary.title})`);
ok(summary.badge.length > 0, `顯示等級徽章 (${summary.badge})`);
ok(summary.wrongVisible, '顯示答錯題目清單');
ok(summary.wrongItems === 10, `答錯題目清單有 10 項 (got ${summary.wrongItems})`);

let reset = await evaluate(`(() => {
  document.getElementById('resetQuizBtn').click();
  return {
    count: document.getElementById('quizAnsweredCount').textContent,
    summaryHidden: document.getElementById('quizSummaryCard').classList.contains('hidden'),
    wrongHidden: document.getElementById('quizWrongSection').classList.contains('hidden'),
  };
})()`);
ok(reset.count === '0', '重新作答後清空作答');
ok(reset.summaryHidden, '重新作答後隱藏成績單');
ok(reset.wrongHidden, '重新作答後隱藏答錯清單');

// ---------- 7. 登入介面 ----------
section('7. 登入介面 (Auth overlay)');
let a = await evaluate(`(() => {
  document.getElementById('loginBtn').click();
  const o = document.getElementById('authOverlay');
  const studentVisible = !document.getElementById('studentAuthForm').classList.contains('hidden');
  const teacherHidden = document.getElementById('teacherAuthForm').classList.contains('hidden');
  document.querySelector('[data-auth-tab="teacher"]').click();
  const teacherVisible = !document.getElementById('teacherAuthForm').classList.contains('hidden');
  const studentHidden = document.getElementById('studentAuthForm').classList.contains('hidden');
  document.querySelector('[data-auth-tab="student"]').click();
  document.getElementById('authCloseBtn').click();
  return {
    overlayShown: !o.classList.contains('hidden'),
    studentVisible, teacherHidden, teacherVisible, studentHidden,
    closed: o.classList.contains('hidden'),
  };
})()`);
ok(a.overlayShown, '登入視窗可開啟');
ok(a.studentVisible, '預設顯示學生註冊表單');
ok(a.teacherHidden, '教師表單預設隱藏');
ok(a.teacherVisible, '可切換至教師表單');
ok(a.studentHidden, '切換後學生表單隱藏');
ok(a.closed, '可關閉登入視窗');

// ---------- 8. 表單驗證 ----------
section('8. 註冊表單驗證 (Form validation)');
let v = await evaluate(`(async () => {
  document.getElementById('loginBtn').click();
  const form = document.getElementById('studentAuthForm');
  form.querySelector('#studentUsername').value = '';
  form.querySelector('#studentPassword').value = '';
  form.requestSubmit();
  await new Promise(r => setTimeout(r, 500));
  const err = form.querySelector('[data-auth-error]');
  return { visible: !err.classList.contains('hidden'), text: err.textContent };
})()`);
ok(v.visible, '空白表單會顯示錯誤訊息');
ok(v.text.length > 0, `錯誤訊息內容: "${v.text}"`);

// ---------- 9. 語言切換 ----------
section('9. 語言切換 (Language switching)');
for (const mode of ['zh', 'en', 'bi']) {
  const l = await evaluate(`(() => {
    document.querySelector('[data-lang-mode="${mode}"]').click();
    const body = document.body;
    const zhVisible = getComputedStyle(document.querySelector('.lang-zh')).display !== 'none';
    const enVisible = getComputedStyle(document.querySelector('.lang-en')).display !== 'none';
    return { mode: body.className, zhVisible, enVisible };
  })()`);
  if (mode === 'zh') ok(l.zhVisible && !l.enVisible, '中文模式：只顯示中文');
  if (mode === 'en') ok(!l.zhVisible && l.enVisible, '英文模式：只顯示英文');
  if (mode === 'bi') ok(l.zhVisible && l.enVisible, '雙語模式：中英同時顯示');
}

// ---------- 10. AI 導師未設定時的提示 ----------
section('10. AI 導師（未設定 Supabase 情境）');
let c = await evaluate(`(async () => {
  document.querySelector('[data-tab="chatbot"]').click();
  document.getElementById('chatInput').value = '蝴蝶的生長過程是甚麼？';
  document.getElementById('chatForm').requestSubmit();
  await new Promise(r => setTimeout(r, 800));
  const msgs = [...document.querySelectorAll('.chat-msg')];
  return { count: msgs.length, last: msgs[msgs.length-1]?.textContent?.slice(0,80) };
})()`);
ok(c.count >= 3, `送出問題後有回覆 (got ${c.count} msgs)`);
ok(/尚未啟用|尚未設定|Supabase/.test(c.last || ''), `顯示「尚未設定」提示 (${c.last})`);

// ---------- 11. 教師儀表板 ----------
section('11. 教師儀表板 (Teacher dashboard)');
await send('Page.navigate', { url: `${BASE}/js/pages/teacher-dashboard.html` });
await sleep(3000);
let td = await evaluate(`({
  authRequiredShown: !document.getElementById('authRequired').classList.contains('hidden'),
  contentHidden: document.getElementById('dashboardContent').classList.contains('hidden'),
  greeting: document.getElementById('teacherGreeting').textContent,
  hasSearch: !!document.getElementById('studentSearch'),
  hasMissed: !!document.getElementById('missedQuestions'),
})`);
ok(td.authRequiredShown, '未登入時顯示「請先登入」');
ok(td.contentHidden, '未登入時隱藏儀表板內容');
ok(td.hasSearch && td.hasMissed, '儀表板有搜尋與輔導重點區塊');

// ---------- 12. 無 JS 錯誤 ----------
section('12. 執行期錯誤檢查 (Runtime errors)');
const realErrors = errors.filter(e => !/favicon/i.test(e));
ok(realErrors.length === 0, realErrors.length === 0 ? '沒有 JS 執行期錯誤' : '有錯誤:\n' + realErrors.join('\n'));

console.log('\n' + '═'.repeat(56));
console.log(failures === 0 ? '✅ 全部互動測試通過！' : `❌ ${failures} 個測試失敗`);
console.log('═'.repeat(56));

ws.close();
chrome.kill();
process.exit(failures ? 1 : 0);
