/**
 * 蝶舞香港 — 配對遊戲邏輯
 * ButterflyHK — Matching game logic
 *
 * 互動方式：滑鼠拖曳 + 點擊配對（支援觸控裝置）。
 * Interaction: mouse drag-and-drop plus tap-to-match (touch friendly).
 */

import { buildMatchSet, shuffle } from '../data/matching.js';
import { getSupabase, getCurrentUser } from '../auth.js';

const state = {
  cards: [],
  matchedKeys: new Set(),
  wrongGuess: null,
  startTime: 0,
  attempts: 0,
  completed: false,
};

let els = {};

/** 初始化配對遊戲 / Initialise the matching game */
export function initMatchingGame() {
  els = {
    board: document.getElementById('matchBoard'),
    terms: document.getElementById('matchTerms'),
    score: document.getElementById('matchScore'),
    timer: document.getElementById('matchTimer'),
    attempts: document.getElementById('matchAttempts'),
    restart: document.getElementById('matchRestartBtn'),
    difficulty: document.getElementById('matchDifficulty'),
    result: document.getElementById('matchResultCard'),
    resultBody: document.getElementById('matchResultBody'),
  };
  if (!els.board) return;

  els.restart?.addEventListener('click', startNewGame);
  els.difficulty?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-size]');
    if (!btn) return;
    els.difficulty.querySelectorAll('[data-size]').forEach(b => {
      b.classList.toggle('active', b === btn);
    });
    startNewGame(parseInt(btn.dataset.size, 10));
  });

  startNewGame(6);
}

/** 開始新一局 / Start a new round */
export function startNewGame(size = 6) {
  state.cards = buildMatchSet(size);
  state.matchedKeys = new Set();
  state.wrongGuess = null;
  state.startTime = Date.now();
  state.attempts = 0;
  state.completed = false;

  els.result?.classList.add('hidden');
  renderBoard();
  renderTerms();
  updateHud();
}

/** 繪製圖畫區 / Render the picture drop zones */
function renderBoard() {
  const pictures = shuffle(state.cards);
  els.board.innerHTML = pictures
    .map(card => {
      // 圖畫區只顯示插圖，不顯示名稱，否則學生可以直接抄答案，
      // 遊戲便失去配對的學習意義。
      // The picture side shows only the illustration (no label) so students
      // must genuinely match the term to the image.
      const caption =
        card.kind === 'stage'
          ? `<span class="lang-zh block text-[10px] font-semibold text-slate-500">生命階段</span>
             <span class="lang-en block text-[10px] text-slate-400">Life stage</span>`
          : `<span class="lang-zh block text-[10px] font-semibold text-slate-500">生態特徵</span>
             <span class="lang-en block text-[10px] text-slate-400">Ecological feature</span>`;
      return `
        <div class="match-dropzone flex flex-col items-center justify-center gap-2 p-3 text-center"
             data-picture-id="${card.pictureId}">
          <img src="${card.icon}" alt="" class="match-icon" />
          ${caption}
          <div class="drop-target min-h-[2.25rem] w-full rounded-lg border border-dashed border-slate-300 flex items-center justify-center px-2"
               data-drop-for="${card.pictureId}">
            <span class="text-[10px] text-slate-400" data-placeholder>
              <span class="lang-zh">拖放詞語到這裡</span>
              <span class="lang-en">Drop a term here</span>
            </span>
          </div>
        </div>`;
    })
    .join('');

  attachDropzoneListeners();
}

/** 繪製詞語卡 / Render the draggable term cards */
function renderTerms() {
  const terms = shuffle(state.cards);
  els.terms.innerHTML = terms
    .map(card => `
      <div class="match-card rounded-xl border-2 border-emerald-200 bg-white px-3 py-2.5 shadow-sm"
           draggable="true" data-term-id="${card.termId}" data-match-key="${card.matchKey}">
        <div class="flex items-center gap-2">
          <div class="min-w-0">
            <p class="lang-zh text-sm font-bold text-emerald-900 leading-tight">${card.zh}</p>
            <p class="lang-en text-[11px] font-semibold text-slate-600 leading-tight mt-0.5">${card.en}</p>
          </div>
        </div>
        <p class="lang-zh text-[10px] text-slate-500 mt-1 leading-tight">${card.zhDesc}</p>
        <p class="lang-en text-[10px] text-slate-500 mt-1 leading-tight">${card.enDesc}</p>
      </div>`)
    .join('');

  attachTermListeners();
}

/** 綁定詞語卡拖曳事件 / Bind term card drag events */
function attachTermListeners() {
  els.terms.querySelectorAll('.match-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      if (state.matchedKeys.has(card.dataset.matchKey)) {
        e.preventDefault();
        return;
      }
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.dataset.termId);
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));

    // 觸控 / 點擊配對：先點詞語卡選取，再點圖畫
    card.addEventListener('click', () => {
      if (state.matchedKeys.has(card.dataset.matchKey)) return;

      // 若這張卡已被選取，則取消選取
      if (card.dataset.selected === '1') {
        selectTermCard(null);
        return;
      }
      selectTermCard(card);
    });
  });
}

/** 選取一張詞語卡（同時取消其他卡的選取） */
function selectTermCard(card) {
  els.terms.querySelectorAll('.match-card').forEach(c => {
    const isSelected = c === card;
    c.dataset.selected = isSelected ? '1' : '0';
    c.classList.toggle('ring-2', isSelected);
    c.classList.toggle('ring-emerald-500', isSelected);
  });
}

/** 綁定圖畫區拖放事件 / Bind drop zone events */
function attachDropzoneListeners() {
  els.board.querySelectorAll('.match-dropzone').forEach(zone => {
    const target = zone.querySelector('[data-drop-for]');

    zone.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('over');
      const termId = e.dataTransfer.getData('text/plain');
      const termEl = els.terms.querySelector(`[data-term-id="${termId}"]`);
      if (termEl) attemptMatch(termEl, zone, target);
    });

    // 觸控 / 點擊配對
    zone.addEventListener('click', () => {
      const selected = els.terms.querySelector('.match-card[data-selected="1"]');
      if (!selected) return;
      attemptMatch(selected, zone, target);
    });
  });
}

/** 嘗試配對 / Attempt a match */
function attemptMatch(termEl, zone, target) {
  const matchKey = termEl.dataset.matchKey;
  if (state.matchedKeys.has(matchKey)) return;

  const card = state.cards.find(c => c.matchKey === matchKey);
  const expectedPictureId = card.pictureId;
  const isCorrect = zone.dataset.pictureId === expectedPictureId;

  state.attempts += 1;
  updateHud();

  if (isCorrect) {
    state.matchedKeys.add(matchKey);
    // 更新 HUD：分數是根據 matchedKeys 計算的，
    // 必須在加入 matchKey 之後更新，否則最後一格的配對不會即時反映在分數上。
    updateHud();
    termEl.classList.add('matched');
    termEl.draggable = false;
    selectTermCard(null);

    zone.classList.add('filled');
    zone.classList.remove('over');
    target.innerHTML = `
      <div class="flex flex-col items-center gap-0.5">
        <span class="text-xs font-bold text-emerald-700">
          <span class="lang-zh">${card.zh}</span>
          <span class="lang-en">${card.en}</span>
        </span>
        <span class="text-[10px] text-emerald-600">✓ <span class="lang-zh">配對成功</span> <span class="lang-en">Matched</span></span>
      </div>`;

    // 顯示該階段的生態說明
    showStageInfo(card);

    if (state.matchedKeys.size === state.cards.length) finishGame();
  } else {
    zone.classList.add('error');
    setTimeout(() => zone.classList.remove('error'), 450);
    flashWrong(termEl);
    // 配錯時取消選取，避免玩家重複點擊同一張卡
    selectTermCard(null);
  }
}

/** 錯誤提示 / Flash a wrong answer */
function flashWrong(termEl) {
  termEl.classList.add('border-rose-400', 'bg-rose-50');
  setTimeout(() => termEl.classList.remove('border-rose-400', 'bg-rose-50'), 500);
}

/** 顯示階段生態說明 / Show ecological info for the matched card */
function showStageInfo(card) {
  const infoBox = document.getElementById('matchStageInfo');
  if (!infoBox) return;
  if (card.kind === 'stage') {
    infoBox.innerHTML = `
      <div class="flex items-start gap-3">
        <img src="${card.icon}" alt="" class="w-12 h-12 shrink-0" />
        <div class="min-w-0">
          <p class="font-bold text-emerald-900 text-sm">
            <span class="lang-zh">${card.zh}</span>
            <span class="lang-en">${card.en}</span>
          </p>
          <p class="lang-zh text-xs text-slate-700 mt-1 leading-relaxed">${card.zhDesc}</p>
          <p class="lang-en text-[11px] text-slate-600 mt-1 leading-relaxed">${card.enDesc}</p>
          <p class="text-[10px] font-bold text-amber-700 mt-1">
            <span class="lang-zh">⏱ 典型時長：</span><span class="lang-en">Duration: </span>${card.durationZh}
          </p>
        </div>
      </div>`;
  } else {
    infoBox.innerHTML = `
      <div class="flex items-start gap-3">
        <img src="${card.icon}" alt="" class="w-12 h-12 shrink-0" />
        <div class="min-w-0">
          <p class="font-bold text-emerald-900 text-sm">
            <span class="lang-zh">${card.zh}</span>
            <span class="lang-en">${card.en}</span>
          </p>
          <p class="lang-zh text-xs text-slate-700 mt-1 leading-relaxed">${card.zhDesc}</p>
          <p class="lang-en text-[11px] text-slate-600 mt-1 leading-relaxed">${card.enDesc}</p>
        </div>
      </div>`;
  }
  infoBox.classList.remove('hidden');
}

/** 更新分數／時間／次數 / Update HUD */
function updateHud() {
  if (els.score) {
    els.score.textContent = `${state.matchedKeys.size} / ${state.cards.length}`;
  }
  if (els.attempts) {
    els.attempts.textContent = state.attempts;
  }
  if (els.timer && !state.completed) {
    const secs = Math.floor((Date.now() - state.startTime) / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    els.timer.textContent = `${mm}:${ss}`;
    setTimeout(() => {
      if (!state.completed && els.timer) updateHud();
    }, 1000);
  }
}

/** 完成遊戲 / Finish the round */
async function finishGame() {
  state.completed = true;
  const seconds = Math.floor((Date.now() - state.startTime) / 1000);
  const score = state.matchedKeys.size;
  const total = state.cards.length;

  const stars = state.attempts <= total ? '⭐⭐⭐' : state.attempts <= total + 2 ? '⭐⭐' : '⭐';
  const message =
    state.attempts <= total
      ? '完美配對！你對蝴蝶的生命過程瞭如指掌，太厲害了！'
      : state.attempts <= total + 2
        ? '很棒！只錯了幾次，再試一次可以達到滿分！'
        : '完成了！看看上面每張卡片的花絮，學習更多蝴蝶生態知識吧！';

  if (els.result) {
    els.result.classList.remove('hidden');
    els.resultBody.innerHTML = `
      <div class="text-center space-y-2">
        <p class="text-4xl">${stars}</p>
        <p class="text-lg font-bold text-emerald-900">
          <span class="lang-zh">配對完成！</span><span class="lang-en">Matching Complete!</span>
        </p>
        <p class="text-sm text-slate-700">
          <span class="lang-zh">配對 ${score} / ${total} 項，用時 ${seconds} 秒，共嘗試 ${state.attempts} 次</span>
          <span class="lang-en">Matched ${score} / ${total} in ${seconds}s with ${state.attempts} attempts</span>
        </p>
        <p class="text-sm text-slate-600 lang-zh">${message}</p>
        <p class="text-sm text-slate-600 lang-en">${message === '完美配對！你對蝴蝶的生命過程瞭如指掌，太厲害了！' ? 'Perfect matching! You know the butterfly life cycle inside out!' : 'Well done! Read the facts above to learn more about butterfly ecology!'}</p>
      </div>`;
  }

  // 儲存成績（只有登入學生會儲存）
  try {
    const user = await getCurrentUser();
    const sb = await getSupabase();
    if (user && sb) {
      await sb.from('matching_scores').insert({
        user_id: user.id,
        score,
        total,
        seconds,
      });
    }
  } catch (e) {
    console.warn('無法儲存配對成績 / Could not save matching score:', e);
  }
}
