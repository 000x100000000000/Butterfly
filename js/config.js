/**
 * 蝶舞香港 — 網站設定檔
 * ButterflyHK — Site Configuration
 *
 * ⚠️ 這個檔案是公開的（前端可直接讀取）。Supabase 的 "anon key" 本身設計為
 *    可公開使用 — 真正的安全靠資料庫的 Row Level Security (RLS) 政策保護。
 *    Gemini API Key 絕對不能放在這裡，必須只存在 Supabase Edge Function 伺服器端。
 */

/** Supabase 專案網址 / Supabase project URL */
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';

/** Supabase 匿名金鑰 / Supabase anon key（公開安全，受 RLS 保護） */
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

/** 網站設定 / Site settings */
export const SITE_CONFIG = {
  nameZh: '蝶舞香港 · 生態教育網',
  nameEn: 'Butterflies of Hong Kong · Eco-Education Portal',
  /** AI 導師 Edge Function 路徑 / AI tutor Edge Function path */
  chatFunctionPath: 'chatbot',
  /** 教師儀表板路徑 / Teacher dashboard path */
  teacherDashboardPath: 'js/pages/teacher-dashboard.html',
};

/** 是否已正確填寫 Supabase 設定 / Whether Supabase is configured */
export const isSupabaseConfigured = () =>
  !SUPABASE_URL.includes('YOUR-PROJECT-REF') && !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
