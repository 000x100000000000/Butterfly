/**
 * 蝶舞香港 — AI 蝴蝶導師
 * ButterflyHK — AI Butterfly Tutor
 *
 * 學生用文字提問，AI 導師只回答與「蝴蝶、生態環境」有關的問題；
 * 其他範疇一律婉拒。範圍判定在伺服器端 (Edge Function) 強制執行，
 * 前端只負責顯示。
 */

import { getSupabase } from '../auth.js';
import { SUPABASE_URL, SITE_CONFIG, isSupabaseConfigured } from '../config.js';

let els = {};

/** 初始化 AI 導師 / Initialise the AI tutor */
export function initChatbot() {
  els = {
    log: document.getElementById('chatLog'),
    form: document.getElementById('chatForm'),
    input: document.getElementById('chatInput'),
    send: document.getElementById('chatSendBtn'),
    quick: document.getElementById('chatQuickQuestions'),
    status: document.getElementById('chatStatusBanner'),
  };
  if (!els.log) return;

  els.form?.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
  });

  els.input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 快捷問題
  els.quick?.addEventListener('click', e => {
    const btn = e.target.closest('[data-q]');
    if (!btn) return;
    els.input.value = btn.dataset.q;
    sendMessage();
  });

  addWelcomeMessage();
}

/** 加入歡迎訊息 / Add the welcome message */
function addWelcomeMessage() {
  appendMessage(
    'bot',
    '你好！我是「小蝶」🦋 你的蝴蝶生態學習夥伴。\n\n我可以幫你解答關於蝴蝶與生態環境的問題，例如：\n• 蝴蝶有甚麼種類？\n• 蝴蝶的成長過程是怎樣的？\n• 為甚麼要先種花才能見到蝴蝶？\n• 香港有哪些受保護的珍稀蝴蝶？\n\n問我任何關於蝴蝶和生態的問題吧！',
    true
  );
}

/** 附加訊息到對話紀錄 / Append a message to the log */
function appendMessage(role, text, isSystem = false, outOfScope = false) {
  if (!els.log) return null;
  const div = document.createElement('div');
  if (isSystem) {
    div.className = 'chat-msg system';
  } else {
    div.className = `chat-msg ${role}${outOfScope ? ' out-of-scope' : ''}`;
  }
  div.textContent = text;
  els.log.appendChild(div);
  els.log.scrollTop = els.log.scrollHeight;
  return div;
}

/** 顯示「正在輸入」動畫 / Show typing indicator */
function showTyping() {
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.id = 'chatTyping';
  div.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  els.log.appendChild(div);
  els.log.scrollTop = els.log.scrollHeight;
  return div;
}

/** 送出訊息 / Send a message */
async function sendMessage() {
  const text = (els.input?.value || '').trim();
  if (!text) return;

  if (!isSupabaseConfigured()) {
    appendMessage(
      'bot',
      '⚠️ AI 導師尚未啟用：Supabase 設定尚未完成。\n\n請先在 js/config.js 填寫 SUPABASE_URL 及 SUPABASE_ANON_KEY，並部署 supabase/functions/chatbot 這個 Edge Function。\n\n在完成設定之前，你仍然可以閱讀網站所有內容、玩配對遊戲及完成小測驗！',
      true
    );
    return;
  }

  appendMessage('user', text);
  els.input.value = '';
  els.input.disabled = true;
  els.send.disabled = true;

  const typing = showTyping();

  try {
    const sb = await getSupabase();
    const headers = { 'Content-Type': 'application/json' };
    if (sb) {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`${SUPABASE_FUNCTIONS_URL()}/${SITE_CONFIG.chatFunctionPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('AI 導師錯誤 / Chatbot error:', errText);
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    typing?.remove();

    appendMessage('bot', data.reply, false, data.in_scope === false);
    if (data.suggestions?.length) renderSuggestions(data.suggestions);
  } catch (err) {
    typing?.remove();
    appendMessage(
      'bot',
      '⚠️ 連接 AI 導師時出現問題，請稍後再試。（錯誤：' +
        (err?.message || 'unknown') +
        '）\n\nMeanwhile, you can still explore the Species Guide, play the Matching Game and take the Quiz!',
      true
    );
  } finally {
    els.input.disabled = false;
    els.send.disabled = false;
    els.input.focus();
  }
}

/** 產生 Edge Function 網址 / Build the Edge Function URL */
function SUPABASE_FUNCTIONS_URL() {
  return `${SUPABASE_URL}/functions/v1`;
}

/** 顯示追問建議 / Render follow-up suggestions */
function renderSuggestions(suggestions) {
  if (!els.quick) return;
  els.quick.innerHTML = suggestions
    .map(
      s =>
        `<button type="button" data-q="${escapeAttr(s)}" class="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition">
           ${escapeHtml(s)}
         </button>`
    )
    .join('');
}

/** HTML 轉義 / Escape HTML */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}
