"""
蝶舞香港 — 產生新的 index.html（由原單一 HTML 檔拆分而成）
Build the new multi-file index.html from the original single-file HTML.
"""
import re, io

body = open('/tmp/body.html', encoding='utf-8').read()

# ---------------------------------------------------------------------
# 1) 新增頁籤：配對遊戲 + AI 導師
# ---------------------------------------------------------------------
quiz_tab = '''          <button type="button" data-tab="quiz" class="tab-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition whitespace-nowrap text-left">
            <span class="lang-zh block">📝 10題互動小測驗</span>
            <span class="lang-en block text-[11px] opacity-90">10-Question Quiz</span>
          </button>'''
assert quiz_tab in body

new_tabs = quiz_tab + '''
          <button type="button" data-tab="matching" class="tab-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition whitespace-nowrap text-left">
            <span class="lang-zh block">🧩 蝴蝶生長過程配對</span>
            <span class="lang-en block text-[11px] opacity-90">Life Cycle Matching</span>
          </button>
          <button type="button" data-tab="chatbot" class="tab-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition whitespace-nowrap text-left">
            <span class="lang-zh block">🤖 AI 蝴蝶導師</span>
            <span class="lang-en block text-[11px] opacity-90">AI Butterfly Tutor</span>
          </button>'''
body = body.replace(quiz_tab, new_tabs, 1)

# ---------------------------------------------------------------------
# 2) 導覽列右側：登入按鈕 / 使用者選單 / 教師面板
# ---------------------------------------------------------------------
share_btn = '''          <button type="button" id="shareSiteBtn" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium transition">'''
assert share_btn in body

auth_widget = '''          <!-- 登入 / 使用者選單 -->
          <button type="button" id="loginBtn" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition">
            <span>🎒</span>
            <span class="hidden md:inline">
              <span class="lang-zh">登入</span>
              <span class="lang-en">Log In</span>
            </span>
          </button>

          <button type="button" id="userChip" class="user-chip hidden">
            <span class="user-avatar" data-user-initial">?</span>
            <span class="hidden lg:flex flex-col items-start leading-tight">
              <span data-user-name class="max-w-[8rem] truncate">使用者</span>
              <span data-role-badge class="text-[9px] font-bold text-emerald-600">🎒 Student</span>
            </span>
          </button>

          <button type="button" id="teacherPanelBtn" class="hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition">
            <span>👩‍🏫</span>
            <span class="hidden md:inline">
              <span class="lang-zh">教師儀表板</span>
              <span class="lang-en">Teacher Dashboard</span>
            </span>
          </button>

''' + share_btn
body = body.replace(share_btn, auth_widget, 1)

# ---------------------------------------------------------------------
# 3) Hero 按鈕：加入配對遊戲及 AI 導師入口
# ---------------------------------------------------------------------
conservation_btn = '''          <button type="button" id="heroGoConservationBtn" class="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold text-sm backdrop-blur transition">
            🌿 <span class="lang-zh">了解香港蝴蝶保育工作</span> <span class="lang-en">Explore Butterfly Conservation</span>
          </button>'''
assert conservation_btn in body

hero_extra = conservation_btn + '''
          <button type="button" id="heroGoMatchingBtn" class="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold text-sm backdrop-blur transition">
            🧩 <span class="lang-zh">玩配對遊戲</span> <span class="lang-en">Play Matching Game</span>
          </button>
          <button type="button" id="heroGoChatbotBtn" class="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold text-sm backdrop-blur transition">
            🤖 <span class="lang-zh">問問 AI 蝴蝶導師</span> <span class="lang-en">Ask the AI Tutor</span>
          </button>'''
body = body.replace(conservation_btn, hero_extra, 1)

# ---------------------------------------------------------------------
# 4) 測驗：加入「答錯題目清單」區塊
# ---------------------------------------------------------------------
q_container = '''      <!-- Questions List Container -->
      <div id="quizQuestionsContainer" class="space-y-5"></div>'''
assert q_container in body

wrong_section = q_container + '''

      <!-- 答錯題目清單 / Wrong Answers Breakdown (for student review & teacher coaching) -->
      <div id="quizWrongSection" class="hidden bg-white rounded-2xl border border-amber-200 p-5 sm:p-6 shadow-sm space-y-3">
        <div class="flex items-center gap-2 border-b border-amber-200 pb-3">
          <span class="text-xl">📋</span>
          <div>
            <h3 class="text-lg font-bold text-amber-900">
              <span class="lang-zh block">你的答錯題目與解析</span>
              <span class="lang-en block text-sm font-semibold text-slate-700">Your Wrong Answers & Explanations</span>
            </h3>
            <p class="text-xs text-slate-600 mt-0.5">
              <span class="lang-zh">老師會在儀表板看到這些記錄，針對答錯的題目為你輔導。</span>
              <span class="lang-en">Your teacher can see these records in the dashboard and coach you on the topics you missed.</span>
            </p>
          </div>
        </div>
        <div id="quizWrongList" class="space-y-3"></div>
      </div>'''
body = body.replace(q_container, wrong_section, 1)

# ---------------------------------------------------------------------
# 5) 新頁面：配對遊戲 + AI 導師（插入在 </main> 之前）
# ---------------------------------------------------------------------
main_close = '''  </main>'''
assert main_close in body

new_pages = '''
    <!-- ==================== PAGE 5: 蝴蝶生長過程配對遊戲 ==================== -->
    <section id="page-matching" class="space-y-6 hidden">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div class="space-y-1">
          <span class="text-xs font-bold uppercase tracking-wider text-violet-800 bg-violet-100 px-2.5 py-1 rounded-md">
            <span class="lang-zh">第 5 部分 · 互動配對遊戲</span>
            <span class="lang-en">Part 5 · Interactive Matching Game</span>
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            <span class="lang-zh block">蝴蝶生長過程配對：把詞語拖到正確的圖畫上！</span>
            <span class="lang-en block text-lg sm:text-xl text-violet-800 font-semibold">Butterfly Life Cycle Matching: Drag Each Term onto the Right Picture!</span>
          </h2>
          <p class="text-sm text-slate-600 lang-zh">
            拖曳（或點擊）左邊的詞語卡到右邊對應的圖畫上。配對成功會顯示該階段的生態小知識，完成全部配對即可得分！
          </p>
          <p class="text-xs sm:text-sm text-slate-500 lang-en">
            Drag (or tap) each term card on the left onto the matching picture on the right. Correct matches reveal ecological facts about that stage — finish all pairs to score!
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div id="matchDifficulty" class="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button type="button" data-size="4" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 transition">4</button>
            <button type="button" data-size="6" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-600 text-white rounded-lg transition">6</button>
            <button type="button" data-size="8" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 transition">8</button>
          </div>
          <button type="button" id="matchRestartBtn" class="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs sm:text-sm font-semibold transition">
            🔄 <span class="lang-zh">重新開始</span> <span class="lang-en">Restart</span>
          </button>
        </div>
      </div>

      <!-- 記分板 / Scoreboard -->
      <div class="grid grid-cols-3 gap-3">
        <div class="stat-card text-center py-3">
          <p class="text-[11px] text-slate-500"><span class="lang-zh">已配對</span><span class="lang-en">Matched</span></p>
          <p id="matchScore" class="text-xl font-extrabold text-violet-700">0 / 6</p>
        </div>
        <div class="stat-card text-center py-3">
          <p class="text-[11px] text-slate-500"><span class="lang-zh">用時</span><span class="lang-en">Time</span></p>
          <p id="matchTimer" class="text-xl font-extrabold text-emerald-700">00:00</p>
        </div>
        <div class="stat-card text-center py-3">
          <p class="text-[11px] text-slate-500"><span class="lang-zh">嘗試次數</span><span class="lang-en">Attempts</span></p>
          <p id="matchAttempts" class="text-xl font-extrabold text-amber-700">0</p>
        </div>
      </div>

      <!-- 遊戲主區 / Game board -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 詞語卡區 / Term cards -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 class="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span>🧷</span>
            <span class="lang-zh">詞語卡（拖曳或點擊選取）</span>
            <span class="lang-en text-sm font-semibold text-slate-600">Term Cards (drag or tap)</span>
          </h3>
          <div id="matchTerms" class="grid grid-cols-1 sm:grid-cols-2 gap-3"></div>
        </div>

        <!-- 圖畫區 / Picture drop zones -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 class="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span>🖼️</span>
            <span class="lang-zh">圖畫（放上正確的詞語）</span>
            <span class="lang-en text-sm font-semibold text-slate-600">Pictures (drop the right term here)</span>
          </h3>
          <div id="matchBoard" class="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>
        </div>
      </div>

      <!-- 生態小知識 / Stage fact panel -->
      <div id="matchStageInfo" class="hidden bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5"></div>

      <!-- 完成訊息 / Completion banner -->
      <div id="matchResultCard" class="hidden bg-gradient-to-r from-violet-700 to-fuchsia-700 text-white rounded-2xl p-6 shadow-lg">
        <div id="matchResultBody"></div>
      </div>
    </section>

    <!-- ==================== PAGE 6: AI 蝴蝶導師 ==================== -->
    <section id="page-chatbot" class="space-y-6 hidden">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div class="space-y-1">
          <span class="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2.5 py-1 rounded-md">
            <span class="lang-zh">第 6 部分 · AI 學習夥伴</span>
            <span class="lang-en">Part 6 · AI Learning Buddy</span>
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            <span class="lang-zh block">問問「小蝶」：你的 AI 蝴蝶生態導師</span>
            <span class="lang-en block text-lg sm:text-xl text-sky-800 font-semibold">Ask "Little Butterfly": Your AI Butterfly & Ecology Tutor</span>
          </h2>
          <p class="text-sm text-slate-600 lang-zh">
            小蝶只會回答與 <strong>蝴蝶和生態環境</strong> 有關的問題。關於其他範疇的問題，小蝶會禮貌地婉拒並引導你回到蝴蝶主題。
          </p>
          <p class="text-xs sm:text-sm text-slate-500 lang-en">
            Little Butterfly answers questions about <strong>butterflies and ecology</strong> only. Questions on other topics are politely declined, and the tutor steers you back to butterflies.
          </p>
        </div>
      </div>

      <div id="chatStatusBanner" class="hidden"></div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 對話區 / Chat area -->
        <div class="lg:col-span-2 space-y-4">
          <div class="chat-shell">
            <div class="px-4 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">🦋</span>
                <div>
                  <p class="font-bold text-sm leading-tight">小蝶 <span class="lang-en">· Little Butterfly</span></p>
                  <p class="text-[10px] text-sky-100 leading-tight">
                    <span class="lang-zh">只談蝴蝶與生態的 AI 導師</span>
                    <span class="lang-en">AI tutor for butterflies & ecology</span>
                  </p>
                </div>
              </div>
              <span class="text-[10px] bg-white/20 px-2 py-1 rounded-full font-semibold">AI</span>
            </div>

            <div id="chatLog" class="chat-log scroll-area"></div>

            <form id="chatForm" class="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                id="chatInput"
                placeholder="輸入你的問題… / Type your question…"
                autocomplete="off"
                maxlength="300"
                class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50"
              />
              <button type="submit" id="chatSendBtn" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition whitespace-nowrap">
                <span class="lang-zh">送出</span><span class="lang-en">Send</span> ➤
              </button>
            </form>
          </div>
        </div>

        <!-- 側欄 / Sidebar -->
        <div class="space-y-4">
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 class="text-base font-bold text-slate-900 mb-1">💡 <span class="lang-zh">快速提問</span><span class="lang-en">Quick Questions</span></h3>
            <p class="text-xs text-slate-500 mb-3">
              <span class="lang-zh">點一下就開始提問！</span>
              <span class="lang-en">Click to ask straight away!</span>
            </p>
            <div id="chatQuickQuestions" class="flex flex-wrap gap-2">
              <button type="button" data-q="蝴蝶有甚麼不同的生長階段？" class="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition">🦋 蝴蝶的生長階段</button>
              <button type="button" data-q="為甚麼要先種花才能見到蝴蝶？" class="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition">🌸 種花吸引蝴蝶</button>
              <button type="button" data-q="香港有哪些受保護的珍稀蝴蝶？" class="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition">⚖️ 受保護的蝴蝶</button>
              <button type="button" data-q="蝴蝶怎樣幫植物傳粉？" class="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition">🌿 蝴蝶傳粉</button>
              <button type="button" data-q="毛毛蟲只吃哪一種植物？" class="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition">🐛 寄主植物</button>
              <button type="button" data-q="我可以幫香港的蝴蝶做甚麼？" class="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition">🛡️ 我能做的保育</button>
            </div>
          </div>

          <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 class="text-base font-bold text-amber-900 mb-2">🚦 <span class="lang-zh">小蝶的守則</span><span class="lang-en">Little Butterfly's Rules</span></h3>
            <ul class="text-xs text-amber-950 space-y-2 leading-relaxed">
              <li>✅ <span class="lang-zh">可以問：蝴蝶種類、生長過程、寄主植物、棲地、授粉、保育法例、賞蝶方法</span><span class="lang-en">Can ask: species, life cycle, host plants, habitats, pollination, conservation laws, watching tips</span></li>
              <li>❌ <span class="lang-zh">不會回答：數學、作文、其他科目、娛樂等範疇</span><span class="lang-en">Won't answer: maths, essays, other subjects, entertainment</span></li>
              <li>🔒 <span class="lang-zh">所有問題都會經過範圍檢查</span><span class="lang-en">Every question is scope-checked on the server</span></li>
            </ul>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 class="text-base font-bold text-slate-900 mb-2">🌳 <span class="lang-zh">延伸閱讀</span><span class="lang-en">Further Reading</span></h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              <span class="lang-zh">想看更多？前往「參考資訊與額外知識」及「蝴蝶保育專頁」，有漁護署、綠色力量、康文署的權威資料。</span>
              <span class="lang-en">Want more? Visit the Resources and Conservation pages for authoritative material from AFCD, Green Power and LCSD.</span>
            </p>
          </div>
        </div>
      </div>
    </section>

''' + main_close
body = body.replace(main_close, new_pages, 1)

# ---------------------------------------------------------------------
# 6) 頁尾導覽：加入新頁面
# ---------------------------------------------------------------------
footer_quiz = '''        <button type="button" data-footer-tab="quiz" class="hover:text-emerald-700 underline">10題測驗 / Quiz</button>'''
assert footer_quiz in body
body = body.replace(footer_quiz, footer_quiz + '''
        <button type="button" data-footer-tab="matching" class="hover:text-emerald-700 underline">配對遊戲 / Matching</button>
        <button type="button" data-footer-tab="chatbot" class="hover:text-emerald-700 underline">AI 導師 / AI Tutor</button>''', 1)

# ---------------------------------------------------------------------
# 7) 登入視窗 / Auth overlay（插在 </body> 前）
# ---------------------------------------------------------------------
auth_overlay = '''
  <!-- ==================== 登入視窗 / Auth Overlay ==================== -->
  <div id="authOverlay" class="auth-overlay hidden">
    <div class="auth-card">
      <div class="relative bg-gradient-to-r from-emerald-700 to-teal-700 px-5 py-4 text-white">
        <button type="button" id="authCloseBtn" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center font-bold transition" aria-label="關閉 Close">✕</button>
        <div class="flex items-center gap-3">
          <span class="text-3xl">🦋</span>
          <div>
            <h2 class="font-extrabold text-lg leading-tight">
              <span class="lang-zh">蝶舞香港 · 登入</span>
              <span class="lang-en">Butterflies of HK · Log In</span>
            </h2>
            <p class="text-xs text-emerald-100">
              <span class="lang-zh">登入後你的測驗成績會被記錄，老師可以針對你答錯的題目輔導。</span>
              <span class="lang-en">Log in so your quiz scores are recorded and your teacher can coach you.</span>
            </p>
          </div>
        </div>
      </div>

      <div class="flex border-b border-slate-200">
        <button type="button" data-auth-tab="student" class="auth-tab active">🎒 <span class="lang-zh">學生</span><span class="lang-en">Student</span></button>
        <button type="button" data-auth-tab="teacher" class="auth-tab">👩‍🏫 <span class="lang-zh">教師</span><span class="lang-en">Teacher</span></button>
      </div>

      <!-- 學生註冊 / Student sign-up -->
      <form id="studentAuthForm" data-mode="student" class="p-5 space-y-3.5">
        <div data-auth-error class="auth-error hidden"></div>
        <div>
          <label for="studentUsername" class="block text-xs font-bold text-slate-700 mb-1.5">
            <span class="lang-zh">暱稱（登入帳號）</span><span class="lang-en">Nickname (your login name)</span>
          </label>
          <input type="text" id="studentUsername" name="username" required maxlength="24" autocomplete="username" class="auth-input" placeholder="例：陳大文" />
        </div>
        <div>
          <label for="studentDisplayName" class="block text-xs font-bold text-slate-700 mb-1.5">
            <span class="lang-zh">顯示名稱（選填）</span><span class="lang-en">Display name (optional)</span>
          </label>
          <input type="text" id="studentDisplayName" name="displayName" maxlength="24" class="auth-input" placeholder="例：陳大文（6A班）" />
        </div>
        <div>
          <label for="studentPassword" class="block text-xs font-bold text-slate-700 mb-1.5">
            <span class="lang-zh">密碼（最少 6 個字元）</span><span class="lang-en">Password (min. 6 characters)</span>
          </label>
          <input type="password" id="studentPassword" name="password" required minlength="6" autocomplete="new-password" class="auth-input" placeholder="••••••" />
        </div>
        <button type="submit" class="auth-btn">🎒 <span class="lang-zh">建立學生帳號並開始</span><span class="lang-en">Create Student Account & Start</span></button>
        <p class="text-[10px] text-slate-500 text-center leading-relaxed">
          <span class="lang-zh">首次使用會自動建立新帳號；之後用同一個暱稱和密碼登入即可。</span>
          <span class="lang-en">A new account is created on first use. Log in with the same nickname and password next time.</span>
        </p>
      </form>

      <!-- 教師登入 / Teacher sign-in -->
      <form id="teacherAuthForm" data-mode="teacher" class="p-5 space-y-3.5 hidden">
        <div data-auth-error class="auth-error hidden"></div>
        <div>
          <label for="teacherEmail" class="block text-xs font-bold text-slate-700 mb-1.5">
            <span class="lang-zh">教師電郵</span><span class="lang-en">Teacher email</span>
          </label>
          <input type="email" id="teacherEmail" name="teacherEmail" required class="auth-input" placeholder="teacher@example.com" />
        </div>
        <div>
          <label for="teacherPassword" class="block text-xs font-bold text-slate-700 mb-1.5">
            <span class="lang-zh">密碼</span><span class="lang-en">Password</span>
          </label>
          <input type="password" id="teacherPassword" name="teacherPassword" required class="auth-input" placeholder="••••••" />
        </div>
        <button type="submit" class="auth-btn">👩‍🏫 <span class="lang-zh">老師登入</span><span class="lang-en">Teacher Sign In</span></button>
        <p class="text-[10px] text-slate-500 text-center leading-relaxed">
          <span class="lang-zh">教師帳號由學校管理員在系統內預先建立，學生不能自行註冊為教師。</span>
          <span class="lang-en">Teacher accounts are pre-created by the administrator. Students cannot register as teachers.</span>
        </p>
      </form>
    </div>
  </div>
'''

body = body.rstrip() + '\n\n' + auth_overlay

# ---------------------------------------------------------------------
# 8) 產生完整 index.html
# ---------------------------------------------------------------------
head = '''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>蝶舞香港：香港常見蝴蝶探索與保育教育網 | Butterflies of Hong Kong: Exploration & Conservation</title>
  <meta name="description" content="香港常見蝴蝶探索與保育教育網：蝴蝶圖鑑、保育資訊、互動小測驗、配對遊戲及 AI 蝴蝶導師。Explore Hong Kong butterflies: species guide, conservation, quiz, matching game and AI tutor." />
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/styles.css" />
  <link rel="icon" type="image/svg+xml" href="assets/svg/favicon.svg" />
</head>
<body class="min-h-screen flex flex-col mode-bi">
'''

# body 目前以 </head> 結尾的空白開始 → 去掉前導換行
body = body.lstrip('\n')

out = head + body

# 模組載入 / Module loading — 必須放在 </body> 之前
module_tag = '''
  <!-- Supabase JS（本地載入，課室網絡較穩陣）/ Supabase JS (vendored locally for reliability) -->
  <script src="vendor/supabase/supabase.js"></script>

  <!-- ==================== 模組載入 / Module loading ==================== -->
  <script type="module" src="js/app.js"></script>
</body>
</html>
'''
out = out.rstrip() + '\n' + module_tag

open('index.html', 'w', encoding='utf-8').write(out)
print('index.html written:', len(out), 'bytes')
