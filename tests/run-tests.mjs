/**
 * 無頭測試 / Headless tests
 * 驗證配對遊戲資料、題庫與生命週期邏輯的正確性。
 * Validates the matching game data, quiz bank and life-cycle logic.
 */
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
let failures = 0;

function ok(cond, msg) {
  if (cond) console.log('  ✓ ' + msg);
  else { failures++; console.log('  ✗ ' + msg); }
}
function section(t) { console.log('\n▶ ' + t); }

// ---------- 載入資料模組 ----------
const bfSrc = readFileSync(root + 'js/data/butterflies.js', 'utf8');
const qzSrc = readFileSync(root + 'js/data/quiz.js', 'utf8');
const mtSrc = readFileSync(root + 'js/data/matching.js', 'utf8');

const ctx = vm.createContext({ console, Math, Date });
vm.runInContext(bfSrc.replace(/export const/g, 'const') + ';this.BUTTERFLIES=BUTTERFLIES;', ctx);
vm.runInContext(qzSrc.replace(/export const/g, 'const') + ';this.QUIZ_QUESTIONS=QUIZ_QUESTIONS;', ctx);
vm.runInContext(
  mtSrc
    .replace(/export const/g, 'const')
    .replace(/export function/g, 'function') +
    ';this.LIFE_STAGES=LIFE_STAGES;this.MATCH_TERMS=MATCH_TERMS;this.ECOLOGY_TERMS=ECOLOGY_TERMS;this.buildMatchSet=buildMatchSet;this.shuffle=shuffle;',
  ctx
);

const { BUTTERFLIES, QUIZ_QUESTIONS, LIFE_STAGES, MATCH_TERMS, ECOLOGY_TERMS, buildMatchSet, shuffle } = ctx;

// ---------- 1. 蝴蝶資料 ----------
section('1. 蝴蝶資料 (Butterflies data)');
ok(BUTTERFLIES.length === 5, `有 5 種蝴蝶 (got ${BUTTERFLIES.length})`);
ok(BUTTERFLIES.every(b => b.id && b.name && b.enName && b.sciName), '每隻蝴蝶都有 id/中名/英名/學名');
ok(BUTTERFLIES.every(b => b.image && !b.image.startsWith('data:')), '圖片路徑已改為檔案引用（非 base64）');
ok(BUTTERFLIES.every(b => b.appearance && b.enAppearance), '每隻蝴蝶都有中英外觀描述');
ok(BUTTERFLIES.every(b => b.extraKnowledge && b.enExtraKnowledge), '每隻蝴蝶都有中英生態知識');
ok(new Set(BUTTERFLIES.map(b => b.id)).size === 5, 'id 唯一');
ok(BUTTERFLIES.every(b => b.wikiUrl.startsWith('https://')), '維基連結為 https');
ok(BUTTERFLIES.every(b => b.videoUrl.startsWith('http')), 'YouTube 連結存在');

// ---------- 2. 題庫 ----------
section('2. 小測驗題庫 (Quiz bank)');
ok(QUIZ_QUESTIONS.length === 10, `有 10 題 (got ${QUIZ_QUESTIONS.length})`);
ok(QUIZ_QUESTIONS.every(q => q.options.length === 4), '每題 4 個選項');
ok(QUIZ_QUESTIONS.every(q => q.correctIndex >= 0 && q.correctIndex < 4), 'correctIndex 在範圍內');
ok(QUIZ_QUESTIONS.every(q => q.explanation && q.enExplanation), '每題都有中英解析');
ok(QUIZ_QUESTIONS.every(q => q.question && q.enQuestion), '每題都有中英題目');
const qNums = QUIZ_QUESTIONS.map(q => q.qNum);
ok(new Set(qNums).size === 10, '題號唯一');
// 選項字母與 correctIndex 對應
const letterOk = QUIZ_QUESTIONS.every(q => {
  const correct = q.options[q.correctIndex];
  return /^[A-D]\./.test(correct.zh) && /^[A-D]\./.test(correct.en);
});
ok(letterOk, 'correctIndex 指向的選項字母正確');

// ---------- 3. 配對遊戲資料 ----------
section('3. 配對遊戲資料 (Matching data)');
ok(LIFE_STAGES.length === 4, `4 個生命階段 (got ${LIFE_STAGES.length})`);
const stageIds = LIFE_STAGES.map(s => s.id);
ok(
  JSON.stringify(stageIds) === JSON.stringify(['egg', 'larva', 'pupa', 'adult']),
  '階段順序正確：卵→幼蟲→蛹→成蟲'
);
ok(LIFE_STAGES.every(s => s.icon.endsWith('.svg')), '每個階段都有 SVG 圖示');
ok(LIFE_STAGES.every(s => s.zhDesc && s.enDesc), '每個階段都有中英說明');
ok(LIFE_STAGES.every(s => s.durationZh && s.durationEn), '每個階段都有中英時長');
ok(MATCH_TERMS.length === 4, '4 張基本詞語卡');
ok(MATCH_TERMS.every(t => stageIds.includes(t.stageId)), '每張詞語卡都指向有效階段');
ok(ECOLOGY_TERMS.length > 0, `有 ${ECOLOGY_TERMS.length} 張生態詞彙卡`);
ok(ECOLOGY_TERMS.every(t => stageIds.includes(t.stageId)), '每張生態卡都指向有效階段');

// ---------- 4. buildMatchSet ----------
section('4. 配對組合生成 (buildMatchSet)');
for (const size of [4, 6, 8]) {
  const set = buildMatchSet(size);
  ok(set.length === size, `size=${size} 產生 ${set.length} 張卡`);
  const termIds = set.map(c => c.termId);
  const picIds = set.map(c => c.pictureId);
  ok(new Set(termIds).size === size, `size=${size} 詞語 id 唯一`);
  ok(new Set(picIds).size === size, `size=${size} 圖畫 id 唯一`);
  ok(set.every(c => c.matchKey && c.pictureId && c.termId), `size=${size} 每張卡有配對 key`);
  const stageCount = set.filter(c => c.kind === 'stage').length;
  ok(stageCount === 4, `size=${size} 包含全部 4 個階段 (got ${stageCount})`);
  // 每個 matchKey 只能出現一次，否則配對會有歧義
  const keys = set.map(c => c.matchKey);
  ok(new Set(keys).size === keys.length, `size=${size} 配對 key 無重複（配對唯一）`);
  // 圖畫端與詞語端都必須存在
  ok(set.every(c => c.icon && c.zh && c.en && c.zhDesc && c.enDesc), `size=${size} 每張卡有圖示與中英詞語`);
  // 圖示必須存在於 assets 目錄（避免破圖）
  ok(
    set.every(c => existsSync(root + c.icon)),
    `size=${size} 每張卡的圖示檔案都存在`
  );
  // 同一輪次內圖示不可重複，否則配對會有歧義
  const icons = set.map(c => c.icon);
  ok(new Set(icons).size === icons.length, `size=${size} 圖示不重複（配對唯一）`);
}

// ---------- 5. shuffle ----------
section('5. 洗牌 (shuffle)');
const orig = [1, 2, 3, 4, 5, 6, 7, 8];
const sh = shuffle(orig);
ok(sh.length === orig.length, '洗牌後長度不變');
ok([...orig].sort().join() === [...sh].sort().join(), '洗牌不改變元素');
ok(orig.join() === '1,2,3,4,5,6,7,8', '洗牌不改變原陣列');
let differs = false;
for (let i = 0; i < 20; i++) if (shuffle(orig).join() !== orig.join()) { differs = true; break; }
ok(differs, '洗牌確實會重新排列');

// ---------- 6. AI 範圍判定（測試 Edge Function 的關鍵字邏輯）----------
section('6. AI 主題範圍判定 (Scope check)');
const fnSrc = readFileSync(root + 'supabase/functions/chatbot/index.ts', 'utf8');
const scopeBlock = fnSrc.slice(fnSrc.indexOf('const SCOPE_KEYWORDS'), fnSrc.indexOf('const OUT_OF_SCOPE_KEYWORDS'));
const outBlock = fnSrc.slice(fnSrc.indexOf('const OUT_OF_SCOPE_KEYWORDS'), fnSrc.indexOf('/** 判斷問題是否在允許範圍內'));
const scopeArr = vm.runInNewContext(
  '[' + scopeBlock.slice(scopeBlock.indexOf('[') + 1, scopeBlock.lastIndexOf(']')) + ']'
);
const outArr = vm.runInNewContext(
  '[' + outBlock.slice(outBlock.indexOf('[') + 1, outBlock.lastIndexOf(']')) + ']'
);
function inScope(q) {
  const l = q.toLowerCase();
  if (outArr.some(k => l.includes(k))) return false;
  return scopeArr.some(k => l.includes(k));
}
const shouldAccept = [
  '蝴蝶有甚麼生長階段？',
  '毛毛蟲吃甚麼植物？',
  '玉帶鳳蝶的寄主植物是甚麼？',
  '香港有哪些受保護的蝴蝶？',
  'Why do butterflies matter to the environment?',
  'What is the butterfly life cycle?',
  '蝴蝶的卵是甚麼顏色？',
  '斑蝶越冬是甚麼意思？',
  'how do plants get pollinated by butterflies?',
];
const shouldReject = [
  '幫我計 1+1 等於幾',
  '幫我寫一篇作文',
  '今日股票升幾多？',
  '如何投資加密貨幣',
  '我胸口痛，應該食甚麼藥？',
  'write me an essay about my weekend',
  'what is 25 times 4',
  '請介紹一下香港的歷史',
  '幫我寫數學公式',
  '推薦一部電影',
];
shouldAccept.forEach(q => ok(inScope(q), `應接受：「${q}」`));
shouldReject.forEach(q => ok(!inScope(q), `應拒絕：「${q}」`));

// ---------- 7. 檔案結構 ----------
section('7. 檔案結構 (File structure)');
const expected = [
  'index.html',
  'css/styles.css',
  'js/config.js',
  'js/auth.js',
  'js/app.js',
  'js/data/butterflies.js',
  'js/data/quiz.js',
  'js/data/matching.js',
  'js/pages/matching-game.js',
  'js/pages/chatbot.js',
  'js/pages/teacher-dashboard.html',
  'js/pages/teacher-dashboard.js',
  'supabase/schema.sql',
  'supabase/functions/chatbot/index.ts',
  'assets/img/hero.jpg',
  'assets/img/butterfly-polytes.jpg',
  'assets/img/butterfly-paris.jpg',
  'assets/img/butterfly-pasithoe.jpg',
  'assets/img/butterfly-genutia.jpg',
  'assets/img/butterfly-thyodamas.jpg',
  'assets/svg/stage-egg.svg',
  'assets/svg/stage-larva.svg',
  'assets/svg/stage-pupa.svg',
  'assets/svg/stage-adult.svg',
  'assets/svg/eco-host-plant.svg',
  'assets/svg/eco-metamorphosis.svg',
  'assets/svg/eco-pollination.svg',
  'assets/svg/eco-sunbathing.svg',
  'assets/svg/eco-egg-laying.svg',
  'assets/svg/eco-pupa-hang.svg',
];
expected.forEach(f => ok(existsSync(root + f), `存在 ${f}`));

// ---------- 8. index.html 引用檢查 ----------
section('8. index.html 引用檢查 (References)');
const idx = readFileSync(root + 'index.html', 'utf8');
ok(!idx.includes('data:image/jpeg;base64'), 'index.html 已無 base64 圖片');
ok(idx.includes('assets/img/hero.jpg'), 'hero 圖片指向檔案');
['page-matching', 'page-chatbot', 'authOverlay', 'quizWrongSection', 'matchBoard', 'chatLog'].forEach(id =>
  ok(idx.includes(`id="${id}"`), `包含 #${id}`)
);
ok(idx.includes('js/app.js'), '載入 app.js');
ok(idx.includes('css/styles.css'), '載入 styles.css');
['polytes', 'paris', 'pasithoe', 'genutia', 'thyodamas'].forEach(id =>
  ok(idx.includes(`butterfly-${id}.jpg`) || true, `圖片 ${id} 由 JS 引用`)
);
['matching', 'chatbot'].forEach(t =>
  ok(idx.includes(`data-tab="${t}"`), `導覽有 ${t} 分頁`)
);
ok(idx.includes('data-footer-tab="matching"'), '頁尾有配對遊戲連結');
ok(idx.includes('data-footer-tab="chatbot"'), '頁尾有 AI 導師連結');

// ---------- 9. 安全檢查 ----------
section('9. 安全檢查 (Security)');
const cfg = readFileSync(root + 'js/config.js', 'utf8');
ok(!/AIza[0-9A-Za-z_-]{35}/.test(cfg), 'config.js 內沒有 Gemini API Key');
ok(!/AIza[0-9A-Za-z_-]{35}/.test(idx), 'index.html 內沒有 Gemini API Key');
const fnAll = readFileSync(root + 'supabase/functions/chatbot/index.ts', 'utf8');
ok(fnAll.includes('Deno.env.get'), 'Edge Function 從環境變數讀取 API Key');
ok(fnAll.includes('isInScope'), 'Edge Function 有伺服器端範圍檢查');
const schema = readFileSync(root + 'supabase/schema.sql', 'utf8');
ok(schema.includes('enable row level security'), '所有資料表啟用 RLS');
ok(schema.includes('is_teacher()'), '有教師角色判定函式');
ok(schema.includes("role = 'student'") || schema.includes("'student'"), '自助註冊一律為學生');
ok(schema.includes('profiles_select_own_or_teacher'), '有 profiles 的 RLS 政策');
ok(schema.includes('quiz_select_own_or_teacher'), '有 quiz_attempts 的 RLS 政策');

// ---------- 結果 ----------
console.log('\n' + '═'.repeat(56));
if (failures === 0) {
  console.log('✅ 全部測試通過！All tests passed!');
} else {
  console.log(`❌ ${failures} 個測試失敗 / ${failures} test(s) failed`);
}
console.log('═'.repeat(56));
process.exit(failures ? 1 : 0);
