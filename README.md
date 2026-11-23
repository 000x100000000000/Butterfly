# 蝶舞香港 · 部署說明 / Deployment Guide

香港小六蝴蝶保育教育網站，含登入系統、配對遊戲、AI 生態導師。

---

## 一、專案結構 / Project Structure

```
ButterflyHK/
├── index.html                     # 主頁（單頁應用，6 個分頁）
├── css/
│   └── styles.css                 # 全站樣式
├── js/
│   ├── app.js                     # 分頁切換、語言切換、圖鑑、測驗
│   ├── auth.js                    # 登入／註冊／session 管理
│   ├── config.js                  # ⚠️ 需要你填寫 Supabase 設定
│   ├── data/
│   │   ├── butterflies.js         # 5 種常見蝴蝶資料
│   │   ├── quiz.js                # 10 題中英雙語測驗
│   │   └── matching.js            # 配對遊戲卡片資料
│   └── pages/
│       ├── matching-game.js       # 配對遊戲引擎
│       ├── chatbot.js             # AI 導師前端
│       ├── teacher-dashboard.html # 教師儀表板頁面
│       └── teacher-dashboard.js   # 教師儀表板邏輯
├── assets/
│   ├── img/                       # 5 種蝴蝶相片（已壓縮，約 150KB/張）
│   └── svg/                       # 生長階段／生態特徵插圖
├── supabase/
│   ├── schema.sql                 # ⭐ 資料表 + RLS 安全政策
│   └── functions/chatbot/index.ts # AI 導師 Edge Function
└── vendor/supabase/supabase.js    # 本地化的 Supabase JS（避免 CDN 被封）
```

---

## 二、Supabase 設定步驟 / Supabase Setup

### 步驟 1：建立專案
1. 到 [supabase.com](https://supabase.com) 建立帳號及新專案
2. 記下 **Project URL** 及 **anon public key**

### 步驟 2：建立資料表
在 Supabase 後台 → **SQL Editor** → 新增查詢 → 貼上 `supabase/schema.sql` 全文 → 執行。

這會建立：
| 資料表 | 用途 |
|---|---|
| `profiles` | 用戶暱稱、角色（student / teacher） |
| `quiz_attempts` | 每次測驗的分數**及答錯題目明細** |
| `matching_scores` | 配對遊戲成績 |
| `chat_messages` | 向 AI 導師提問的記錄 |

以及 `is_teacher()` 函數與所有 RLS 政策：
- 學生只能讀寫**自己的**記錄
- 教師（`profiles.role = 'teacher'`）可讀取**全班**記錄

### 步驟 3：填寫前端設定
打開 `js/config.js`，填入：

```js
export const SUPABASE_URL = 'https://你的專案.ref.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJ...你的anon key...';
```

### 步驟 4：部署 AI 導師 Edge Function

```bash
npm install -g supabase
supabase login
supabase link --project-ref 你的專案ref
supabase functions deploy chatbot --no-verify-jwt
```

然後在 Supabase 後台 → **Edge Functions → chatbot → Secrets** 加入：

| 名稱 | 值 |
|---|---|
| `GEMINI_API_KEY` | 你的 [Google AI Studio](https://aistudio.google.com/app/apikey) API key |
| `GEMINI_MODEL` | `gemini-2.0-flash`（免費額度） |

> **為什麼要用 Edge Function？**
> 1. API key 不會暴露在公開的靜態網站原始碼中
> 2. 主題範圍限制（只答蝴蝶／生態）在**伺服器端**執行，學生繞過不了
> 3. 學生的 session token 可以驗證後才呼叫 AI

### 步驟 5：建立教師帳號（白名單）
教師註冊並不是開放的，老師帳號需要手動加入白名單：

```sql
-- 1. 先在 Auth 後台用 Teacher Sign In 註冊老師，得到 email
-- 2. 執行以下 SQL 把他升級成教師角色
UPDATE public.profiles
SET role = 'teacher'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'teacher@example.com'
);
```

---

## 三、本地測試 / Local Testing

```bash
# 需要在專案根目錄
python3 -m http.server 8899 --bind 0.0.0.0
# 開啟 http://127.0.0.1:8899/index.html
```

⚠️ 必須用 `http://` 開啟，不能用 `file://`（ES module 需經 HTTP 伺服器）。

---

## 四、測試 / Tests

```bash
node tests/run-tests.mjs          # 資料完整性檢查
node tests/interaction-tests.mjs   # 互動測試（需 Chrome）
```

---

## 五、已完成的三大功能 / Feature Summary

### 1️⃣ 登入系統 + 教師分析
- **學生**：暱稱 + 密碼註冊（自動映射至 `@students.butterflyhk.local` 內部 email）
- **教師**：email + 密碼登入，白名單驗證
- **測驗記錄**：每次測驗自動儲存分數 + 每道答錯題目的題目、學生答案、正確答案、解析
- **教師儀表板** (`js/pages/teacher-dashboard.html`)：
  - 學生人數 / 測驗次數 / 平均分
  - **全班輔導重點**：最常答錯的題目排行，直接用於課堂講解
  - 學生記錄列表，點擊可看個別學生的完整答錯詳情
  - AI 導師提問記錄

### 2️⃣ 生長過程配對遊戲
- 4 個生命階段（卵 → 幼蟲 → 蛹 → 成蟲）+ 2 張生態特徵卡
- 支援**拖放**（桌面）及**點擊選取**（觸控板）
- 圖畫區只顯示插圖（不顯示答案），詞語卡不顯示插圖 —— 真正的配對題
- 即時回饋、配對後顯示該階段的生態小知識
- 計時、嘗試次數、星星評級；登入學生自動儲存成績

### 3️⃣ AI 生態導師「小蝶」
- 主題嚴格限定於**蝴蝶與生態環境**
- 範圍外的問題（數學、歷史、遊戲等）一律禮貌婉拒
- 範圍檢查在 Edge Function **伺服器端**執行
- 支援中英雙語，追問建議 chips，未設定時優雅降級並提示

---

## 六、常見問題 / Troubleshooting

| 症狀 | 原因 | 解決 |
|---|---|---|
| AI 導師回覆「系統尚未設定」 | `js/config.js` 未填 | 填入 URL 與 anon key |
| 教師登入後看不到資料 | 老師未加白名單 | 執行步驟 5 的 SQL |
| 學生成績沒有被儲存 | 學生未登入 | 遊戲／測驗仍可玩，只是不會記錄 |
| 圖片顯示不出 | 直接用 `file://` 開啟 | 改用本地 HTTP 伺服器 |
