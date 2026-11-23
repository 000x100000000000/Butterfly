/**
 * 蝶舞香港 — 認證模組
 * ButterflyHK — Authentication module
 *
 * 提供學生自助註冊 / 登入 / 登出，以及教師白名單登入。
 * Students sign up with a nickname + password; teachers sign in with
 * accounts you pre-create in Supabase (no public teacher registration).
 *
 * 註 / Note: supabase-js 以 UMD 形式在本機載入（vendor/supabase/supabase.js），
 * 令網站在沒有外部 CDN 的情況下也能運作（課室網絡較穩陣）。
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './config.js';

/** 等待 Supabase UMD 全域載入完成 / Wait for the Supabase UMD global */
function waitForSupabaseGlobal(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (window.supabase?.createClient) return resolve(window.supabase);
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.supabase?.createClient) {
        clearInterval(timer);
        resolve(window.supabase);
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error('SUPABASE_LIB_LOAD_FAILED'));
      }
    }, 50);
  });
}

/** Supabase 客戶端 / The Supabase client (null when not configured) */
let supabase = null;
/** 初始化狀態 / Initialisation state */
let initPromise = null;

/** 初始化 Supabase 連線 / Initialise the Supabase connection */
export function initSupabase() {
  if (!isSupabaseConfigured()) return Promise.resolve(null);
  if (supabase) return Promise.resolve(supabase);
  if (!initPromise) {
    initPromise = waitForSupabaseGlobal()
      .then(lib => {
        supabase = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        });
        return supabase;
      })
      .catch(err => {
        console.warn('Supabase 未能載入 / Supabase failed to load:', err);
        return null;
      });
  }
  return initPromise;
}

/** 取得 Supabase 客戶端（若未初始化則嘗試初始化） */
export async function getSupabase() {
  if (supabase) return supabase;
  return initSupabase();
}

/** 登入錯誤訊息中文化 / Localised auth error messages */
const AUTH_ERROR_MESSAGES = {
  'Invalid login credentials': '密碼或帳號不正確，請再試一次。',
  'User already registered': '這個暱稱已被使用，請換一個。',
  'Email not confirmed': '帳號尚未確認，請先完成驗證。',
  'Password should be at least 6 characters': '密碼最少需要 6 個字元。',
  'Unable to validate email address': '電郵格式不正確。',
  'A user with this email address has already been registered':
    '這個帳號已存在，請直接登入。',
  'User already exists': '這個暱稱已被使用，請換一個。',
};

function translateError(err) {
  if (!err) return '發生未知錯誤，請稍後再試。';
  const zh = AUTH_ERROR_MESSAGES[err.message];
  if (zh) return zh;
  if (/fetch|network|Failed to fetch/i.test(err.message || '')) {
    return '無法連接伺服器，請檢查網絡後再試。';
  }
  return err.message || '發生未知錯誤，請稍後再試。';
}

/**
 * 註冊新學生帳號
 * @param {string} username 暱稱（唯一，作為登入帳號）
 * @param {string} password 密碼（最少 6 個字元）
 * @param {string} displayName 顯示名稱
 */
export async function signUpStudent(username, password, displayName) {
  const sb = await getSupabase();
  if (!sb) throw new Error('SUPABASE_NOT_CONFIGURED');
  const clean = String(username || '').trim();

  if (!clean) throw new Error('請輸入暱稱。');
  if (clean.length > 24) throw new Error('暱稱請控制在 24 個字元以內。');
  if (!/^[\w一-鿿.\- ]+$/u.test(clean)) {
    throw new Error('暱稱只可使用中英文、數字、句號、連字號或空格。');
  }
  if (!password || password.length < 6) throw new Error('密碼最少需要 6 個字元。');

  // 檢查暱稱是否已被使用
  const { data: existing, error: checkErr } = await sb
    .from('profiles')
    .select('id')
    .eq('username', clean)
    .maybeSingle();

  if (checkErr) throw new Error(translateError(checkErr));
  if (existing) throw new Error('這個暱稱已被使用，請換一個。');

  // 用假電郵作為 auth 識別碼，登入時同樣使用假電郵格式
  const fakeEmail = `${clean.toLowerCase().replace(/[^a-z0-9]/g, '')}@students.butterflyhk.local`;

  const { data, error } = await sb.auth.signUp({
    email: fakeEmail,
    password,
    options: {
      data: {
        username: clean,
        display_name: displayName?.trim() || clean,
        role: 'student',
      },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw new Error(translateError(error));

  // 若因 session 未自動建立（例如已關閉電郵確認），嘗試直接登入
  if (!data.session) {
    const { error: signInErr } = await sb.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });
    if (signInErr) throw new Error(translateError(signInErr));
  }

  return getCurrentUser();
}

/**
 * 老師登入（使用由你在 Supabase 手動建立的帳號）
 * Teacher sign-in using an account you pre-created in Supabase.
 */
export async function signIn(email, password) {
  const sb = await getSupabase();
  if (!sb) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateError(error));
  return getCurrentUser();
}

/** 取得目前登入者及其角色 / Get current user with role */
export async function getCurrentUser() {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb
    .from('profiles')
    .select('id, username, display_name, role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    username: profile?.username || user.email,
    displayName: profile?.display_name || '使用者',
    role: profile?.role || 'student',
  };
}

/** 登出 / Sign out */
export async function signOut() {
  const sb = await getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

/** 綁定登入狀態監聽（在 Supabase 已就緒後呼叫） */
export async function bindAuthStateChange(callback) {
  const sb = await getSupabase();
  if (!sb) return;
  sb.auth.onAuthStateChange((_event, session) => {
    callback(session ? session.user : null);
  });
}
