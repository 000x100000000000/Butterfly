/**
 * 蝶舞香港 — 教師儀表板邏輯
 * ButterflyHK — Teacher dashboard logic
 *
 * 顯示所有學生的測驗記錄、分數及答錯題目，讓老師針對性輔導。
 * Shows all students' quiz attempts, scores and wrong answers so the
 * teacher can run targeted coaching.
 */

import { getSupabase, getCurrentUser, signOut } from '../auth.js';
import { isSupabaseConfigured } from '../config.js';

const state = {
  teacher: null,
  profiles: [],
  attempts: [],
  chatMessages: [],
  matching: [],
  search: '',
};

let els = {};

/** 初始化 / Initialise */
document.addEventListener('DOMContentLoaded', async () => {
  els = {
    authRequired: document.getElementById('authRequired'),
    content: document.getElementById('dashboardContent'),
    greeting: document.getElementById('teacherGreeting'),
    greetingEn: document.getElementById('teacherGreetingEn'),
    statStudents: document.getElementById('statStudents'),
    statAttempts: document.getElementById('statAttempts'),
    statAvg: document.getElementById('statAvg'),
    missed: document.getElementById('missedQuestions'),
    tableBody: document.getElementById('studentTableBody'),
    empty: document.getElementById('emptyStudents'),
    search: document.getElementById('studentSearch'),
    modal: document.getElementById('studentModal'),
    modalTitle: document.getElementById('studentModalTitle'),
    modalSubtitle: document.getElementById('studentModalSubtitle'),
    modalStats: document.getElementById('studentModalStats'),
    modalWrong: document.getElementById('studentModalWrong'),
    modalChat: document.getElementById('studentModalChat'),
    closeModal: document.getElementById('closeStudentModalBtn'),
  };

  // 語言切換
  document.querySelectorAll('.lang-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.langMode;
      document.body.classList.remove('mode-bi', 'mode-zh', 'mode-en');
      document.body.classList.add('mode-' + mode);
      document.querySelectorAll('.lang-pill').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  document.getElementById('printBtn')?.addEventListener('click', () => window.print());
  document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    await signOut();
    window.location.href = '../../index.html';
  });
  els.closeModal?.addEventListener('click', closeStudentModal);
  els.modal?.addEventListener('click', e => {
    if (e.target.id === 'studentModal') closeStudentModal();
  });
  els.search?.addEventListener('input', e => {
    state.search = e.target.value.trim().toLowerCase();
    renderStudentTable();
  });

  if (!isSupabaseConfigured()) {
    els.authRequired.classList.remove('hidden');
    els.authRequired.querySelector('h2').innerHTML =
      '<span class="lang-zh">系統尚未設定</span><span class="lang-en">System not configured</span>';
    els.authRequired.querySelector('p').innerHTML =
      '<span class="lang-zh">請先在 js/config.js 填寫 Supabase 設定，並執行 supabase/schema.sql 建立資料表。</span>' +
      '<span class="lang-en">Please fill in the Supabase settings in js/config.js and run supabase/schema.sql first.</span>';
    return;
  }

  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    els.authRequired.classList.remove('hidden');
    return;
  }

  state.teacher = user;
  els.content.classList.remove('hidden');
  els.authRequired.classList.add('hidden');

  const hour = new Date().getHours();
  const partZh = hour < 12 ? '早晨好' : hour < 18 ? '午安' : '晚上好';
  const partEn = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  els.greeting.textContent = `${partZh}，${user.displayName}老師！`;
  els.greetingEn.textContent = `${partEn}, ${user.displayName}!`;

  await loadAllData();
});

/** 載入所有資料 / Load all data */
async function loadAllData() {
  const sb = await getSupabase();
  if (!sb) return;

  const [profilesRes, attemptsRes, chatRes, matchRes] = await Promise.all([
    sb.from('profiles').select('*').order('created_at', { ascending: true }),
    sb
      .from('quiz_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500),
    sb.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(500),
    sb.from('matching_scores').select('*').order('created_at', { ascending: false }).limit(500),
  ]);

  state.profiles = profilesRes.data || [];
  state.attempts = attemptsRes.data || [];
  state.chatMessages = chatRes.data || [];
  state.matching = matchRes.data || [];

  renderStats();
  renderMissedQuestions();
  renderStudentTable();
}

/** 統計數字 / Render stat tiles */
function renderStats() {
  const students = state.profiles.filter(p => p.role === 'student');
  els.statStudents.textContent = students.length;
  els.statAttempts.textContent = state.attempts.length;

  if (state.attempts.length > 0) {
    const avg = state.attempts.reduce((s, a) => s + a.score, 0) / state.attempts.length;
    els.statAvg.textContent = avg.toFixed(1);
  } else {
    els.statAvg.textContent = '0';
  }
}

/** 最常答錯的題目 / Most-missed questions */
function renderMissedQuestions() {
  const tally = new Map();

  state.attempts.forEach(attempt => {
    const answers = Array.isArray(attempt.answers) ? attempt.answers : [];
    answers.forEach(a => {
      if (a.isCorrect) return;
      const key = a.qNum;
      if (!tally.has(key)) {
        tally.set(key, {
          qNum: a.qNum,
          question: a.question,
          enQuestion: a.enQuestion,
          correctText: a.correctText,
          explanation: a.explanation,
          enExplanation: a.enExplanation,
          wrongCount: 0,
          students: new Set(),
          chosenSet: new Set(),
        });
      }
      const entry = tally.get(key);
      entry.wrongCount += 1;
      entry.students.add(attempt.user_id);
      if (a.chosenText) entry.chosenSet.add(a.chosenText);
    });
  });

  const list = [...tally.values()].sort((a, b) => b.wrongCount - a.wrongCount);

  if (list.length === 0) {
    els.missed.innerHTML = `
      <p class="text-sm text-slate-600 text-center py-6">
        <span class="lang-zh">🎉 暫時沒有答錯紀錄，或尚未有學生完成測驗。</span>
        <span class="lang-en">🎉 No wrong answers recorded yet, or no student has taken the quiz.</span>
      </p>`;
    return;
  }

  const totalAttempts = state.attempts.length;
  els.missed.innerHTML = list
    .map((q, i) => {
      const pct = Math.round((q.wrongCount / totalAttempts) * 100);
      const barColor = pct >= 50 ? 'bg-rose-500' : pct >= 25 ? 'bg-amber-500' : 'bg-sky-500';
      const commonWrong = [...q.chosenSet].slice(0, 3).join('、');
      return `
        <div class="border border-slate-200 rounded-xl p-4">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="inline-block px-2 py-0.5 rounded-md ${
                  i === 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                } text-xs font-extrabold">Q${q.qNum}</span>
                ${
                  i === 0
                    ? '<span class="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">🔥 <span class="lang-zh">首要輔導</span><span class="lang-en">Top priority</span></span>'
                    : ''
                }
              </div>
              <p class="lang-zh text-sm font-bold text-slate-900 leading-snug">${q.question}</p>
              <p class="lang-en text-xs text-slate-600 leading-snug mt-0.5">${q.enQuestion}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-lg font-extrabold text-slate-900">${q.wrongCount}</p>
              <p class="text-[10px] text-slate-500"><span class="lang-zh">人次答錯</span><span class="lang-en">wrong</span></p>
            </div>
          </div>
          <div class="qbar-track mb-2">
            <div class="qbar-fill ${barColor}" style="width: ${Math.min(100, pct)}%"></div>
          </div>
          <p class="text-[11px] text-slate-500 mb-2">
            <span class="lang-zh">答錯率 ${pct}%　${commonWrong ? `最常見的錯誤答案：${commonWrong}` : ''}</span>
            <span class="lang-en">${pct}% wrong${commonWrong ? ` · Most common wrong answer: ${commonWrong}` : ''}</span>
          </p>
          <div class="bg-emerald-50/70 border border-emerald-100 rounded-lg p-2.5 text-[11px] leading-relaxed">
            <p class="font-bold text-emerald-800 mb-0.5">✓ <span class="lang-zh">正確答案：</span><span class="lang-en">Correct answer: </span>${q.correctText}</p>
            <p class="lang-zh text-slate-700">${q.explanation}</p>
            <p class="lang-en text-slate-600">${q.enExplanation}</p>
          </div>
        </div>`;
    })
    .join('');
}

/** 學生列表 / Student table */
function renderStudentTable() {
  const students = state.profiles.filter(p => p.role === 'student');

  if (students.length === 0) {
    els.tableBody.innerHTML = '';
    els.empty.classList.remove('hidden');
    return;
  }
  els.empty.classList.add('hidden');

  const filtered = students.filter(p => {
    if (!state.search) return true;
    return (
      (p.display_name || '').toLowerCase().includes(state.search) ||
      (p.username || '').toLowerCase().includes(state.search)
    );
  });

  if (filtered.length === 0) {
    els.tableBody.innerHTML = `
      <tr><td colspan="8" class="py-8 text-center text-sm text-slate-500">
        <span class="lang-zh">找不到符合「${escapeHtml(state.search)}」的學生</span>
        <span class="lang-en">No student matching "${escapeHtml(state.search)}"</span>
      </td></tr>`;
    return;
  }

  els.tableBody.innerHTML = filtered
    .map(p => {
      const attempts = state.attempts.filter(a => a.user_id === p.id);
      const best = attempts.length ? Math.max(...attempts.map(a => a.score)) : null;
      const avg = attempts.length
        ? (attempts.reduce((s, a) => s + a.score, 0) / attempts.length).toFixed(1)
        : '—';
      const wrongTotal = attempts.reduce((s, a) => {
        const answers = Array.isArray(a.answers) ? a.answers : [];
        return s + answers.filter(x => !x.isCorrect).length;
      }, 0);
      const last = attempts.length ? attempts[0].created_at : null;
      const matchScores = state.matching.filter(m => m.user_id === p.id);
      const bestMatch = matchScores.length ? Math.max(...matchScores.map(m => m.score)) : null;

      return `
        <tr class="student-row hover:bg-slate-50" data-user-id="${p.id}">
          <td class="py-3 px-4">
            <div class="flex items-center gap-2.5">
              <span class="user-avatar">${escapeHtml(
                (p.display_name || p.username || '?').charAt(0).toUpperCase()
              )}</span>
              <div class="min-w-0">
                <p class="font-bold text-slate-900 text-sm truncate">${escapeHtml(
                  p.display_name || p.username
                )}</p>
                <p class="text-[11px] text-slate-500 truncate">@${escapeHtml(p.username)}</p>
              </div>
            </div>
          </td>
          <td class="py-3 px-4"><span class="text-[11px] font-bold px-2 py-1 rounded-full bg-sky-100 text-sky-800">🎒 Student</span></td>
          <td class="py-3 px-4 font-semibold text-slate-700">${attempts.length}</td>
          <td class="py-3 px-4">
            ${
              best !== null
                ? `<span class="font-extrabold ${best >= 8 ? 'text-emerald-600' : best >= 6 ? 'text-amber-600' : 'text-rose-600'}">${best} / 10</span>`
                : '<span class="text-slate-400 text-xs">—</span>'
            }
          </td>
          <td class="py-3 px-4 font-semibold text-slate-700">${avg}</td>
          <td class="py-3 px-4">
            ${
              wrongTotal > 0
                ? `<span class="wrong-q-badge">${wrongTotal}</span>`
                : '<span class="text-xs text-slate-400">—</span>'
            }
          </td>
          <td class="py-3 px-4 text-xs text-slate-500">${last ? formatDate(last) : '—'}</td>
          <td class="py-3 px-4 text-xs text-slate-600">
            ${bestMatch !== null ? `<span class="font-bold text-violet-700">${bestMatch}</span> / <span class="lang-zh">最高</span><span class="lang-en">best</span>` : '<span class="text-slate-400">—</span>'}
          </td>
        </tr>`;
    })
    .join('');

  els.tableBody.querySelectorAll('.student-row').forEach(row => {
    row.addEventListener('click', () => openStudentModal(row.dataset.userId));
  });
}

/** 開啟學生詳情 / Open the student detail modal */
function openStudentModal(userId) {
  const profile = state.profiles.find(p => p.id === userId);
  if (!profile) return;

  const attempts = state.attempts.filter(a => a.user_id === userId);
  const chats = state.chatMessages.filter(c => c.user_id === userId);

  els.modalTitle.textContent = profile.display_name || profile.username;
  els.modalSubtitle.textContent = `@${profile.username} · ${attempts.length} 次測驗 · ${chats.length} 則 AI 提問`;

  const best = attempts.length ? Math.max(...attempts.map(a => a.score)) : 0;
  const avg = attempts.length
    ? (attempts.reduce((s, a) => s + a.score, 0) / attempts.length).toFixed(1)
    : '0';
  const wrongTotal = attempts.reduce((s, a) => {
    const answers = Array.isArray(a.answers) ? a.answers : [];
    return s + answers.filter(x => !x.isCorrect).length;
  }, 0);

  els.modalStats.innerHTML = `
    <div class="stat-card py-3 text-center">
      <p class="text-[11px] text-slate-500"><span class="lang-zh">最佳成績</span><span class="lang-en">Best</span></p>
      <p class="text-xl font-extrabold text-emerald-700">${best} / 10</p>
    </div>
    <div class="stat-card py-3 text-center">
      <p class="text-[11px] text-slate-500"><span class="lang-zh">平均分</span><span class="lang-en">Average</span></p>
      <p class="text-xl font-extrabold text-amber-700">${avg}</p>
    </div>
    <div class="stat-card py-3 text-center">
      <p class="text-[11px] text-slate-500"><span class="lang-zh">答錯題數</span><span class="lang-en">Wrong Qs</span></p>
      <p class="text-xl font-extrabold text-rose-600">${wrongTotal}</p>
    </div>
    <div class="stat-card py-3 text-center">
      <p class="text-[11px] text-slate-500"><span class="lang-zh">測驗次數</span><span class="lang-en">Attempts</span></p>
      <p class="text-xl font-extrabold text-sky-700">${attempts.length}</p>
    </div>`;

  // 答錯題目（合併所有測驗次數中同一題的錯誤）
  const wrongMap = new Map();
  attempts.forEach(a => {
    const answers = Array.isArray(a.answers) ? a.answers : [];
    answers.forEach(x => {
      if (x.isCorrect) return;
      const key = x.qNum;
      if (!wrongMap.has(key)) {
        wrongMap.set(key, { ...x, times: 0, chosen: new Set() });
      }
      const e = wrongMap.get(key);
      e.times += 1;
      if (x.chosenText) e.chosen.add(x.chosenText);
    });
  });

  const wrongList = [...wrongMap.values()].sort((a, b) => b.times - a.times);
  if (wrongList.length === 0) {
    els.modalWrong.innerHTML = `
      <p class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        🎊 <span class="lang-zh">這位學生目前沒有答錯的題目！</span>
        <span class="lang-en">This student has no wrong answers so far!</span>
      </p>`;
  } else {
    els.modalWrong.innerHTML = wrongList
      .map(
        w => `
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-amber-900">Q${w.qNum} · <span class="lang-zh">錯 ${w.times} 次</span><span class="lang-en">wrong ${w.times}×</span></span>
            <span class="wrong-q-badge">${w.times}</span>
          </div>
          <p class="lang-zh text-slate-700 font-semibold">${w.question}</p>
          <p class="lang-en text-slate-600">${w.enQuestion}</p>
          <p class="text-rose-700">
            ✗ <span class="lang-zh">學生選了：</span><span class="lang-en">Chosen: </span>${escapeHtml(
              [...w.chosen].join('、') || '—'
            )}
          </p>
          <p class="text-emerald-700 font-semibold">
            ✓ <span class="lang-zh">正確答案：</span><span class="lang-en">Correct: </span>${w.correctText}
          </p>
          <p class="lang-zh text-slate-600 leading-relaxed">${w.explanation}</p>
          <p class="lang-en text-slate-500 leading-relaxed">${w.enExplanation}</p>
        </div>`
      )
      .join('');
  }

  // AI 對話記錄
  if (chats.length === 0) {
    els.modalChat.innerHTML = `
      <p class="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
        <span class="lang-zh">這位學生還未向 AI 導師提問。</span>
        <span class="lang-en">This student has not asked the AI tutor anything yet.</span>
      </p>`;
  } else {
    els.modalChat.innerHTML = chats
      .map(
        c => `
        <div class="flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
            c.role === 'user'
              ? 'bg-emerald-600 text-white'
              : c.in_scope
                ? 'bg-slate-100 text-slate-700'
                : 'bg-orange-50 text-orange-800 border border-orange-200'
          }">
            ${escapeHtml(c.content)}
            <span class="block text-[9px] opacity-70 mt-1">${formatDate(c.created_at)}</span>
          </div>
        </div>`
      )
      .join('');
  }

  els.modal.classList.remove('hidden');
}

function closeStudentModal() {
  els.modal.classList.add('hidden');
}

/** 格式化日期 / Format a date */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** HTML 轉義 / Escape HTML */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
