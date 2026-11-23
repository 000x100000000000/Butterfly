/**
 * 蝶舞香港 — 主程式
 * ButterflyHK — Main application
 *
 * 包含：導覽切換、語言切換、蝴蝶圖鑑、測驗（含成績記錄）、登入系統。
 * Navigation, language switching, species guide, quiz (with score
 * recording) and the authentication system.
 */

import { BUTTERFLIES } from './data/butterflies.js';
import { QUIZ_QUESTIONS } from './data/quiz.js';
import {
  getSupabase,
  getCurrentUser,
  signUpStudent,
  signIn as teacherSignIn,
  signOut,
  bindAuthStateChange,
} from './auth.js';
import { isSupabaseConfigured } from './config.js';
import { initMatchingGame } from './pages/matching-game.js';
import { initChatbot } from './pages/chatbot.js';

// ==================== 應用程式狀態 / Application state ====================
let activeTab = 'species';
let selectedFamily = 'all';
let langMode = 'bi'; // 'bi' (Bilingual), 'zh' (Chinese), 'en' (English)
let userAnswers = {}; // { questionIndex: selectedOptionIndex }
let currentUser = null;

// ==================== 語言模式切換 / Language mode switcher ====================
function setLanguageMode(mode) {
  langMode = mode;
  document.body.classList.remove('mode-bi', 'mode-zh', 'mode-en');
  document.body.classList.add('mode-' + mode);
  document.querySelectorAll('.lang-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang-mode') === mode);
  });
  // 切換語言後，聊天記錄需要重新套用顯示規則
  document.querySelectorAll('.chat-msg .lang-zh, .chat-msg .lang-en').forEach(el => {
    el.style.display = '';
  });
}

// ==================== 頁面切換 / Tab switching ====================
function switchTab(tabId) {
  activeTab = tabId;
  const pages = ['species', 'resources', 'conservation', 'quiz', 'matching', 'chatbot'];
  pages.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.classList.toggle('hidden', p !== tabId);
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== 蝴蝶圖鑑 / Species cards ====================
function renderSpeciesCards() {
  const grid = document.getElementById('speciesGrid');
  if (!grid) return;
  const filtered =
    selectedFamily === 'all'
      ? BUTTERFLIES
      : BUTTERFLIES.filter(b => b.filterCategory === selectedFamily);

  grid.innerHTML = filtered
    .map(
      (b, idx) => `
        <article class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between card-hover">
          <div>
            <div class="relative h-52 bg-slate-900 overflow-hidden">
              <img src="${b.image}" alt="${b.name} ${b.enName}" class="w-full h-full object-cover max-w-full" loading="lazy" />
              <div class="absolute top-3 left-3 flex gap-1.5">
                <span class="px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-xs font-semibold">
                  #${idx + 1} <span class="lang-zh">${b.family}</span> <span class="lang-en">${b.enFamily}</span>
                </span>
              </div>
              <div class="absolute bottom-2 right-2">
                <span class="px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-medium">
                  <span class="lang-zh">展翅：</span><span class="lang-en">Wingspan: </span>${b.wingspan}
                </span>
              </div>
            </div>
            <div class="p-5 space-y-3">
              <div>
                <div class="flex items-baseline justify-between gap-2 flex-wrap">
                  <h3 class="text-xl font-bold text-slate-900">
                    <span class="lang-zh">${b.name}</span>
                    <span class="lang-en text-base font-bold text-emerald-900">${b.enName}</span>
                  </h3>
                </div>
                <p class="text-xs italic text-emerald-700 font-medium">${b.sciName}</p>
              </div>

              <div class="space-y-1.5">
                <p class="text-sm text-slate-700 leading-relaxed lang-zh">${b.appearance}</p>
                <p class="text-xs text-slate-600 leading-relaxed lang-en">${b.enAppearance}</p>
              </div>

              <div class="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-950 space-y-1.5">
                <p class="font-bold text-emerald-800">
                  💡 <span class="lang-zh">額外知識點：</span><span class="lang-en">Extra Ecological Fact:</span>
                </p>
                <p class="leading-relaxed lang-zh">${b.extraKnowledge}</p>
                <p class="leading-relaxed text-emerald-900/90 lang-en">${b.enExtraKnowledge}</p>
              </div>
            </div>
          </div>

          <div class="px-5 pb-5 pt-2 space-y-2 border-t border-slate-100">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <a href="${b.wikiUrl}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">
                📖 <span class="lang-zh">維基百科</span> <span class="lang-en">Wikipedia</span> ↗
              </a>
              <a href="${b.videoUrl}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition">
                ▶️ <span class="lang-en">YouTube Video</span> ↗
              </a>
            </div>
            <button type="button" data-open-modal="${b.id}" class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition">
              🔍 <span class="lang-zh">查看完整檔案與寄主植物</span> <span class="lang-en">Full Profile & Host Plants</span>
            </button>
          </div>
        </article>`
    )
    .join('');

  grid.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => openSpeciesModal(btn.getAttribute('data-open-modal')));
  });
}

// ==================== 物種詳情視窗 / Species modal ====================
function openSpeciesModal(speciesId) {
  const b = BUTTERFLIES.find(item => item.id === speciesId);
  if (!b) return;
  document.getElementById('modalImg').src = b.image;
  document.getElementById('modalImg').alt = `${b.name} ${b.enName}`;
  document.getElementById('modalFamily').textContent = `${b.family} · ${b.enFamily}`;
  document.getElementById('modalTitle').textContent = `${b.name} (${b.enName})`;
  document.getElementById('modalSciName').textContent = `學名 Scientific Name: ${b.sciName}`;
  document.getElementById('modalWingspan').textContent = b.wingspan;
  document.getElementById('modalHost').innerHTML = `
    <span class="lang-zh block">${b.habit}</span>
    <span class="lang-en block text-xs text-slate-600 font-normal mt-1">${b.enHabit}</span>
  `;
  document.getElementById('modalAppearance').innerHTML = `
    <p class="lang-zh">${b.appearance}</p>
    <p class="lang-en text-xs sm:text-sm text-slate-600">${b.enAppearance}</p>
  `;
  document.getElementById('modalExtra').innerHTML = `
    <p class="lang-zh">${b.extraKnowledge}</p>
    <p class="lang-en text-xs sm:text-sm text-emerald-900">${b.enExtraKnowledge}</p>
  `;
  document.getElementById('modalLinks').innerHTML = `
    <a href="${b.wikiUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition">
      📚 維基百科 / Wikipedia ↗
    </a>
    <a href="${b.gpUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs transition">
      🦋 綠色力量 / Green Power ↗
    </a>
    <a href="${b.videoUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition">
      🎬 ${b.videoTitle} ↗
    </a>
  `;
  document.getElementById('speciesModal').classList.remove('hidden');
}

function closeSpeciesModal() {
  document.getElementById('speciesModal').classList.add('hidden');
}

// ==================== 小測驗 / Quiz ====================
function renderQuiz() {
  const container = document.getElementById('quizQuestionsContainer');
  if (!container) return;

  container.innerHTML = QUIZ_QUESTIONS.map((q, qIdx) => {
    const answeredChoice = userAnswers[qIdx];
    const hasAnswered = answeredChoice !== undefined;

    const optionsHtml = q.options
      .map((optObj, optIdx) => {
        let btnStyle = 'border-slate-200 bg-slate-50/70 text-slate-800';
        let badgeIcon = '';

        if (hasAnswered) {
          if (optIdx === q.correctIndex) {
            btnStyle =
              'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-500/20';
            badgeIcon =
              '<span class="text-emerald-600 font-bold text-xs whitespace-nowrap">✓ 最佳答案 Best</span>';
          } else if (optIdx === answeredChoice && answeredChoice !== q.correctIndex) {
            btnStyle = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
            badgeIcon =
              '<span class="text-rose-600 font-bold text-xs whitespace-nowrap">✗ 你的選擇 Yours</span>';
          } else {
            btnStyle = 'border-slate-200 bg-white text-slate-400 opacity-75';
          }
        }

        return `
          <button
            type="button"
            data-qidx="${qIdx}"
            data-optidx="${optIdx}"
            ${hasAnswered ? 'disabled' : ''}
            class="option-btn w-full text-left p-3.5 rounded-xl border ${btnStyle} flex items-center justify-between gap-3 text-sm"
          >
            <div>
              <span class="lang-zh block">${optObj.zh}</span>
              <span class="lang-en block text-xs opacity-90 mt-0.5">${optObj.en}</span>
            </div>
            ${badgeIcon}
          </button>`;
      })
      .join('');

    const feedbackHtml = hasAnswered
      ? `
        <div class="mt-3 p-3.5 rounded-xl text-xs sm:text-sm space-y-1 ${
          answeredChoice === q.correctIndex
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border border-amber-200 text-amber-950'
        }">
          <p class="font-bold">
            ${
              answeredChoice === q.correctIndex
                ? '🎉 <span class="lang-zh">答對了！</span> <span class="lang-en">Correct!</span>'
                : '💡 <span class="lang-zh">答錯了，來看看解析：</span> <span class="lang-en">Incorrect — Explanation:</span>'
            }
          </p>
          <p class="leading-relaxed lang-zh">${q.explanation}</p>
          <p class="leading-relaxed text-xs opacity-90 lang-en">${q.enExplanation}</p>
        </div>`
      : '';

    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div class="mb-4 space-y-1">
          <div class="flex items-center gap-2">
            <span class="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-extrabold">
              Q${q.qNum} · 第 ${q.qNum} 題
            </span>
          </div>
          <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-snug lang-zh">
            ${q.question}
          </h3>
          <p class="text-sm sm:text-base font-semibold text-emerald-950 leading-snug lang-en">
            ${q.enQuestion}
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          ${optionsHtml}
        </div>
        ${feedbackHtml}
      </div>`;
  }).join('');

  container.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qIdx = parseInt(btn.getAttribute('data-qidx'), 10);
      const optIdx = parseInt(btn.getAttribute('data-optidx'), 10);
      if (userAnswers[qIdx] !== undefined) return;
      userAnswers[qIdx] = optIdx;
      updateQuizStats();
      renderQuiz();
    });
  });

  updateQuizStats();
}

function updateQuizStats() {
  const answeredCount = Object.keys(userAnswers).length;
  const countEl = document.getElementById('quizAnsweredCount');
  if (countEl) countEl.textContent = answeredCount;

  if (answeredCount === QUIZ_QUESTIONS.length) {
    showQuizSummary();
  }
}

/** 顯示總成績單 / Show the final score summary */
function showQuizSummary() {
  let score = 0;
  const wrongQuestions = [];
  QUIZ_QUESTIONS.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctIndex) {
      score += 1;
    } else {
      wrongQuestions.push({
        qNum: q.qNum,
        question: q.question,
        enQuestion: q.enQuestion,
        correct: q.options[q.correctIndex].zh,
        correctEn: q.options[q.correctIndex].en,
        chosen: q.options[userAnswers[idx]]?.zh || '—',
        chosenEn: q.options[userAnswers[idx]]?.en || '—',
        explanation: q.explanation,
        enExplanation: q.enExplanation,
      });
    }
  });

  const answeredCount = Object.keys(userAnswers).length;
  const summaryCard = document.getElementById('quizSummaryCard');
  const scoreTitle = document.getElementById('quizScoreTitle');
  const feedbackText = document.getElementById('quizFeedbackText');
  const badge = document.getElementById('quizGradeBadge');

  summaryCard.classList.remove('hidden');
  scoreTitle.textContent = `你的得分：${score} / 10 分 · Score: ${score} / 10 (Answered: ${answeredCount})`;

  if (score >= 9) {
    badge.textContent = '🏆 蝴蝶生態專家 · Butterfly Expert';
    feedbackText.textContent =
      '太厲害了！你對香港 5 種常見蝴蝶的特徵、習性與保育法例瞭如指掌！ / Excellent! You have mastered the identification, habits, and conservation laws of Hong Kong butterflies!';
  } else if (score >= 6) {
    badge.textContent = '🦋 合格賞蝶達人 · Skilled Butterfly Watcher';
    feedbackText.textContent =
      '表現很好！你已掌握大部分香港蝴蝶的重點知識，可重溫答錯的題目解析再挑戰滿分。 / Great job! Review the explanations for any missed questions and try again for a perfect score.';
  } else {
    badge.textContent = '🌱 蝴蝶探索新手 · Butterfly Explorer';
    feedbackText.textContent =
      '別氣餒！建議先到「5種常見蝴蝶圖鑑」及「蝴蝶保育專頁」閱讀中英資料和觀看 YouTube 短片，再試一次！ / Keep exploring! Check the Species Guide and Conservation pages first, then try again!';
  }

  // 答錯題目清單（教師輔導用，學生自己也可看）
  const wrongBox = document.getElementById('quizWrongList');
  if (wrongBox) {
    if (wrongQuestions.length === 0) {
      wrongBox.innerHTML = `
        <p class="text-sm text-emerald-700 font-semibold">
          🎊 <span class="lang-zh">全對！沒有答錯的題目。</span>
          <span class="lang-en">Perfect! No wrong answers.</span>
        </p>`;
    } else {
      wrongBox.innerHTML = wrongQuestions
        .map(
          w => `
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1.5">
            <p class="font-bold text-amber-900">
              Q${w.qNum} · <span class="lang-zh">你的答案：${w.chosen}</span>
              <span class="lang-en">Your answer: ${w.chosenEn}</span>
            </p>
            <p class="lang-zh text-slate-700">${w.question}</p>
            <p class="lang-en text-slate-600">${w.enQuestion}</p>
            <p class="text-emerald-700 font-semibold">
              ✓ <span class="lang-zh">正確答案：${w.correct}</span>
              <span class="lang-en">Correct: ${w.correctEn}</span>
            </p>
            <p class="lang-zh text-slate-600 leading-relaxed">${w.explanation}</p>
            <p class="lang-en text-slate-500 leading-relaxed">${w.enExplanation}</p>
          </div>`
        )
        .join('');
    }
    wrongBox.parentElement.classList.remove('hidden');
  }

  summaryCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 儲存記錄
  saveQuizAttempt(score, wrongQuestions);
}

/** 儲存測驗記錄到資料庫 / Save the quiz attempt to the database */
async function saveQuizAttempt(score, wrongQuestions) {
  if (!isSupabaseConfigured()) return;
  if (!currentUser) {
    console.info('未登入，測驗成績不會被記錄。（請登入以讓老師看到你的成績）');
    return;
  }

  const sb = await getSupabase();
  if (!sb) return;

  const answers = QUIZ_QUESTIONS.map((q, idx) => ({
    qNum: q.qNum,
    question: q.question,
    enQuestion: q.enQuestion,
    chosenIndex: userAnswers[idx] ?? null,
    correctIndex: q.correctIndex,
    isCorrect: userAnswers[idx] === q.correctIndex,
    chosenText: userAnswers[idx] !== undefined ? q.options[userAnswers[idx]].zh : null,
    correctText: q.options[q.correctIndex].zh,
    explanation: q.explanation,
    enExplanation: q.enExplanation,
  }));

  try {
    const { error } = await sb.from('quiz_attempts').insert({
      user_id: currentUser.id,
      score,
      total: QUIZ_QUESTIONS.length,
      answers,
    });
    if (error) throw error;
    showToast(
      '✅ <span class="lang-zh">成績已記錄，老師可以看到你的作答！</span><span class="lang-en">Score recorded — your teacher can now view it!</span>'
    );
  } catch (err) {
    console.error('無法儲存測驗記錄 / Could not save quiz attempt:', err);
    showToast(
      '⚠️ <span class="lang-zh">成績未能儲存，請稍後再試。</span><span class="lang-en">Could not save your score. Please try again later.</span>'
    );
  }
}

function resetQuiz() {
  userAnswers = {};
  document.getElementById('quizSummaryCard').classList.add('hidden');
  const wrongSection = document.getElementById('quizWrongSection');
  if (wrongSection) wrongSection.classList.add('hidden');
  renderQuiz();
}

// ==================== 保育承諾 / Conservation pledge ====================
function updatePledgeStatus() {
  const checks = document.querySelectorAll('.pledge-check');
  let checked = 0;
  checks.forEach(c => {
    if (c.checked) checked += 1;
  });
  const textEl = document.getElementById('pledgeCountText');
  const badgeEl = document.getElementById('pledgeBadge');
  if (textEl) textEl.textContent = `已完成 ${checked} / 5 項護蝶承諾 · Completed ${checked} / 5 Pledges`;
  if (badgeEl) {
    if (checked === 5) {
      badgeEl.textContent = '🏅 恭喜成為「香港護蝶保育大使」！ · Certified HK Butterfly Ambassador!';
      badgeEl.className = 'px-3.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow';
    } else {
      badgeEl.textContent = `尚差 ${5 - checked} 項完成承諾 · ${5 - checked} more to complete`;
      badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white';
    }
  }
}

// ==================== 分享連結 / Share link ====================
function shareWebsiteInfo() {
  const shareSummary =
    '【蝶舞香港：香港常見蝴蝶探索與保育教育網 | Butterflies of Hong Kong Eco-Education Portal】認識玉帶鳳蝶 (Common Mormon)、巴黎翠鳳蝶 (Paris Peacock)、報喜斑粉蝶 (Red-base Jezebel)、虎斑蝶 (Common Tiger)、網絲蛺蝶 (Map Wing)，挑戰 10 題中英雙語多項選擇題、玩配對遊戲、向 AI 蝴蝶導師提問！Sources: AFCD & Green Power';
  try {
    const ta = document.createElement('textarea');
    ta.value = shareSummary;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (e) {
    // 忽略剪貼簿錯誤
  }
  showToast(
    '✅ <span class="lang-zh">已複製中英雙語網站資訊與連結！</span><span class="lang-en">Copied bilingual website info & link!</span>'
  );
}

// ==================== 提示訊息 / Toast ====================
function showToast(html) {
  const toast = document.getElementById('toastNotice');
  if (!toast) return;
  toast.querySelector('span:last-child').innerHTML = html;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), 3600);
}

// ==================== 登入系統 / Authentication ====================
/** 顯示登入視窗 / Show the auth overlay */
function showAuthOverlay() {
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.classList.remove('hidden');
}

/** 隱藏登入視窗 / Hide the auth overlay */
function hideAuthOverlay() {
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.classList.add('hidden');
}

/** 更新導覽列的登入狀態 / Update the header auth state */
function updateUserChip() {
  const chip = document.getElementById('userChip');
  const loginBtn = document.getElementById('loginBtn');
  const teacherBtn = document.getElementById('teacherPanelBtn');

  if (chip) chip.classList.toggle('hidden', !currentUser);
  if (loginBtn) loginBtn.classList.toggle('hidden', !!currentUser);

  if (currentUser && chip) {
    const initial = (currentUser.displayName || currentUser.username || '?').trim().charAt(0);
    chip.querySelector('[data-user-initial]').textContent = initial.toUpperCase();
    chip.querySelector('[data-user-name]').textContent =
      currentUser.role === 'teacher'
        ? currentUser.displayName + '（老師）'
        : currentUser.displayName;
    chip.querySelector('[data-role-badge]').textContent =
      currentUser.role === 'teacher' ? '👩‍🏫 Teacher' : '🎒 Student';
  }

  if (teacherBtn) {
    teacherBtn.classList.toggle('hidden', currentUser?.role !== 'teacher');
  }
}

/** 處理登入表單 / Handle the auth form submission */
async function handleAuthSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const mode = form.dataset.mode; // 'student' | 'teacher'
  const errorBox = form.querySelector('[data-auth-error]');
  const submitBtn = form.querySelector('button[type="submit"]');

  errorBox.classList.add('hidden');
  errorBox.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = mode === 'student' ? '處理中…' : 'Signing in…';

  try {
    const data = new FormData(form);
    if (mode === 'student') {
      const username = data.get('username');
      const password = data.get('password');
      const displayName = data.get('displayName');
      currentUser = await signUpStudent(username, password, displayName);
      showToast(
        '🎉 <span class="lang-zh">歡迎加入！你的測驗成績會自動記錄，老師可以看到了。</span><span class="lang-en">Welcome! Your quiz scores are now recorded for your teacher.</span>'
      );
    } else {
      const email = data.get('teacherEmail');
      const password = data.get('teacherPassword');
      currentUser = await teacherSignIn(email, password);
      if (currentUser.role !== 'teacher') {
        await signOut();
        throw new Error('這個帳號不是教師帳號。請使用老師帳號登入。');
      }
      showToast(
        '👩‍🏫 <span class="lang-zh">歡迎回來，老師！</span><span class="lang-en">Welcome back, teacher!</span>'
      );
    }
    hideAuthOverlay();
    updateUserChip();
    form.reset();
  } catch (err) {
    errorBox.textContent = err.message || '登入失敗，請再試一次。';
    errorBox.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent =
      mode === 'student'
        ? '🎒 建立學生帳號並開始'
        : '👩‍🏫 老師登入';
  }
}

/** 登出 / Sign out */
async function handleSignOut() {
  await signOut();
  currentUser = null;
  updateUserChip();
  showToast(
    '👋 <span class="lang-zh">已登出。</span><span class="lang-en">Signed out.</span>'
  );
}

// ==================== 初始化 / Initialisation ====================
document.addEventListener('DOMContentLoaded', () => {
  renderSpeciesCards();
  renderQuiz();
  initMatchingGame();
  initChatbot();

  // 主要導覽頁籤
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  // 語言切換
  document.querySelectorAll('.lang-pill').forEach(btn => {
    btn.addEventListener('click', () => setLanguageMode(btn.getAttribute('data-lang-mode')));
  });

  // 頁尾導覽
  document.querySelectorAll('[data-footer-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  // 品牌首頁
  document.getElementById('brandHomeBtn')?.addEventListener('click', () => switchTab('species'));

  // 主視覺按鈕
  document.getElementById('heroGoQuizBtn')?.addEventListener('click', () => switchTab('quiz'));
  document.getElementById('heroGoConservationBtn')?.addEventListener('click', () =>
    switchTab('conservation')
  );
  document.getElementById('tableGoQuizBtn')?.addEventListener('click', () => switchTab('quiz'));
  document.getElementById('heroGoMatchingBtn')?.addEventListener('click', () => switchTab('matching'));
  document.getElementById('heroGoChatbotBtn')?.addEventListener('click', () => switchTab('chatbot'));

  // 篩選
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      selectedFamily = pill.getAttribute('data-family');
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderSpeciesCards();
    });
  });

  // 視窗關閉
  document.getElementById('closeModalBtn')?.addEventListener('click', closeSpeciesModal);
  document.getElementById('modalCloseBottomBtn')?.addEventListener('click', closeSpeciesModal);
  document.getElementById('speciesModal')?.addEventListener('click', e => {
    if (e.target.id === 'speciesModal') closeSpeciesModal();
  });

  // 測驗控制
  document.getElementById('resetQuizBtn')?.addEventListener('click', resetQuiz);
  document.getElementById('retryQuizFromBannerBtn')?.addEventListener('click', resetQuiz);
  document.getElementById('reviewSpeciesBtn')?.addEventListener('click', () => switchTab('species'));
  document.getElementById('showFinalScoreBtn')?.addEventListener('click', showQuizSummary);

  // 保育承諾
  document.querySelectorAll('.pledge-check').forEach(chk => {
    chk.addEventListener('change', updatePledgeStatus);
  });

  // 分享
  document.getElementById('shareSiteBtn')?.addEventListener('click', shareWebsiteInfo);

  // 登入系統
  document.getElementById('loginBtn')?.addEventListener('click', showAuthOverlay);
  document.getElementById('authCloseBtn')?.addEventListener('click', hideAuthOverlay);
  document.getElementById('authOverlay')?.addEventListener('click', e => {
    if (e.target.id === 'authOverlay') hideAuthOverlay();
  });
  document.getElementById('studentAuthForm')?.addEventListener('submit', handleAuthSubmit);
  document.getElementById('teacherAuthForm')?.addEventListener('submit', handleAuthSubmit);
  document.getElementById('signOutBtn')?.addEventListener('click', handleSignOut);
  document.getElementById('userChip')?.addEventListener('click', e => {
    if (e.target.closest('[data-signout]')) {
      handleSignOut();
    }
  });
  document.querySelectorAll('[data-auth-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.authTab;
      document.querySelectorAll('[data-auth-tab]').forEach(t => {
        t.classList.toggle('active', t === tab);
      });
      document.getElementById('studentAuthForm')?.classList.toggle('hidden', target !== 'student');
      document.getElementById('teacherAuthForm')?.classList.toggle('hidden', target !== 'teacher');
    });
  });

  // 教師儀表板
  document.getElementById('teacherPanelBtn')?.addEventListener('click', () => {
    window.location.href = 'js/pages/teacher-dashboard.html';
  });

  // 檢查既有登入狀態
  if (isSupabaseConfigured()) {
    getCurrentUser().then(user => {
      currentUser = user;
      updateUserChip();
    });
    bindAuthStateChange(async (_event, session) => {
      currentUser = session ? await getCurrentUser() : null;
      updateUserChip();
    });
  } else {
    console.warn(
      'Supabase 尚未設定：請在 js/config.js 填寫 SUPABASE_URL 與 SUPABASE_ANON_KEY，並執行 supabase/schema.sql。'
    );
  }
});

// 供教師儀表板使用的匯出
export { BUTTERFLIES, QUIZ_QUESTIONS, switchTab, setLanguageMode, showToast };
