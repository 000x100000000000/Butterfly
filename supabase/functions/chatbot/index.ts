/**
 * 蝶舞香港 — AI 蝴蝶導師 Edge Function
 * ButterflyHK — AI Butterfly Tutor Edge Function
 *
 * 作用 / Purpose:
 *   1. 保管 Gemini API Key（只在伺服器端，永不下發到瀏覽器）
 *   2. 強制「只回答蝴蝶與生態環境問題」的限制 — 這是伺服器端硬性規則，
 *      即使有人繞過前端也無法取得範圍外的答案
 *
 * 部署 / Deploy:
 *   supabase functions deploy chatbot --no-verify-jwt
 *   （亦可在 Supabase Dashboard → Edge Functions → chatbot 建立後貼上本檔）
 *
 * 環境變數 / Secrets (必須設定):
 *   GEMINI_API_KEY = 你的 Google Gemini API Key
 */

// =====================================================================
// 允許的知識範圍 / Allowed topic scope
// =====================================================================
const SCOPE_KEYWORDS = [
  // 中英關鍵字：蝴蝶、生態、棲地、植物、動物、環境、相關保育概念
  '蝴蝶', '蝶', '毛毛蟲', '幼蟲', '蛹', '卵', '成蟲', '鳳蝶', '粉蝶', '斑蝶',
  '蛺蝶', '灰蝶', '弄蝶', '裳鳳蝶', '燕鳳蝶', '玉帶鳳蝶', '虎斑蝶', '巴黎翠',
  '報喜斑粉蝶', '網絲蛺蝶', '地圖蝶', '蝶類', '蝶科',
  'butterfl', 'butterflies', 'caterpillar', 'larva', 'larvae', 'chrysalis', 'pupa', 'pupae',
  'egg', 'imago', 'swallowtail', 'papilio', 'pierid', 'nymphalid', 'lycaenid', 'hesperiid',
  'monarch', 'mormon', 'tiger', 'jeżebel', 'jezebel', 'hawk-moth', 'moth',

  '生態', '生態環境', '棲地', '生境', '栖息', '環境', '保育', '保護', '濒危', '瀕危',
  '物種', '生物多樣性', '多樣性', '授粉', '傳粉', '寄主', '寄主植物', '蜜源', ' nectar',
  '食草', '植物', '花', '花蜜', '果樹', '農藥', '殺蟲劑', '農藥', '棲息地', '森林',
  '郊野', '公園', '綠化', '種植', '園藝', '花粉', '蟲', '昆蟲', '蜘蛛', '鳥', '雀',
  '蜥蜴', '爬蟲', '蛙', '湿地', '濕地', '溪', '河', '水源', '氣候', '季節', '冬天', '夏天',
  '温度', '溫度', '太陽', '陽光', '日光浴', '飛行', '遷移', '越冬', '繁殖', '產卵',
  '孵化', '變態', '完全變態', '擬態', '警戒色', '保護色', '毒', '毒素', '群聚', '群飛',
  '生態系統', '食物鏈', '食物網', '碳', '污染', '全球暖化', '可持續', '永續',

  'ecolog', 'ecosystem', 'habitat', 'environment', 'conserv', 'protect', 'endanger',
  'species', 'biodiversity', 'pollinat', 'nectar', 'host plant', 'host-plant',
  'larv', 'caterpillar', 'chrysalis', 'metamorphos', 'aperture', 'mimicry', 'aposemat',
  'camouflage', 'insect', 'arthropod', 'plant', 'flower', 'garden', 'urban', 'park',
  'forest', 'countryside', 'wetland', 'stream', 'river', 'climate', 'season', 'winter',
  'summer', 'temperature', 'sunlight', 'sunbath', 'flight', 'migrat', 'overwinter',
  'breeding', 'hatch', 'egg-lay', 'lay egg', 'food chain', 'food web', 'pesticide',
  'insecticide', 'fungicide', 'pollution', 'global warming', 'sustainab',
];

/** 明確拒絕的範圍 / Explicitly refused topics */
const OUT_OF_SCOPE_KEYWORDS = [
  '數學', '數學題', '乘法', '除法', '微積分', '代數', '幾何', '方程式', '考試題目',
  '物理', '化學', '生物課本', '歷史', '地理', '中文作文', '英文作文', '寫作', '作文題',
  '政治', '宗教', '醫藥', '看病', '藥物', '法律', '法律諮詢', '股票', '投資', '加密貨幣',
  '比特幣', '戀愛', '感情', '星座', '運氣', '遊戲攻略', '電影劇情',
  'math', 'mathematics', 'algebra', 'geometry', 'calculus', 'physics', 'chemistry',
  'essay', 'homework help', 'write me a', 'stock', 'crypto', 'bitcoin', 'dating',
  'horoscope', 'astrology', 'legal advice', 'medical', 'diagnosis', 'prescription',
];

/** 判斷問題是否在允許範圍內 / Determine if a question is within the allowed scope */
function isInScope(question) {
  const q = String(question || '').toLowerCase().trim();
  if (!q) return false;

  // 先檢查明確拒絕的主題
  for (const kw of OUT_OF_SCOPE_KEYWORDS) {
    if (q.includes(kw)) return false;
  }

  // 命中任何允許關鍵字即視為在範圍內
  for (const kw of SCOPE_KEYWORDS) {
    if (q.includes(kw)) return true;
  }

  // 沒有命中關鍵字 → 不在範圍內，婉拒
  return false;
}

/** 拒絕時的回覆 / Reply used when a question is out of scope */
const REFUSAL_REPLY =
  '多謝你的提問！🦋 不過我是一位「蝴蝶生態」學習夥伴，只能回答關於蝴蝶與生態環境的問題。\n\n' +
  '你可以問我例如：\n' +
  '• 蝴蝶有甚麼不同的生長階段？\n' +
  '• 為甚麼香港某些公園特别多蝴蝶？\n' +
  '• 蝴蝶怎樣幫植物傳粉？\n' +
  '• 怎樣種花可以吸引蝴蝶？\n\n' +
  '想試試嗎？';

/** 網站內的權威知識（提供給 AI 作為參考，令答案貼合本網站內容） */
const SITE_KNOWLEDGE = `
香港蝴蝶基本資料（來源：漁農自然護理署、綠色力量「全城愛蝶」、康文署、鳳園蝴蝶保育區）：
- 香港目前記錄 249 種蝴蝶，分屬 6 個科，約佔全中國蝴蝶種類的 11%。
- 完全變態（Complete Metamorphosis）：卵（Egg）→ 幼蟲／毛毛蟲（Larva/Caterpillar）→ 蛹（Chrysalis/Pupa）→ 成蟲（Imago），四個階段形態與食性完全不同。
- 玉帶鳳蝶 Common Mormon (Papilio polytes)：展翅 8–10 cm，黑翅有尾突，後翅有一列乳白色橫紋如「玉帶」；雌蝶有「白斑型」，是貝氏擬態（Batesian mimicry）的經典例子，模仿有毒的紅珠鳳蝶。幼蟲嗜食芸香科（柑橘、黃皮、九里香）。
- 巴黎翠鳳蝶 Paris Peacock (Papilio paris)：展翅 8–10 cm，黑翅滿布閃亮翠綠色鱗點，後翅正面有金屬紫藍（翠藍）色大斑紋及黑色長翅尾；翠藍色屬「結構色」（structural coloration），由鱗片微細結構折射光線產生。喜愛林緣滑翔，會吸食花蜜或「吸水」。
- 報喜斑粉蝶 Red-base Jezebel (Delias pasithoe)：展翅 4–5 cm，翅底有鮮艷黃斑及位於翅基部的鮮紅斑，屬「警戒色」（aposematism），警告鳥類牠有毒性，故飛得慢而不必急速逃竄。幼蟲吃桑寄生科植物。全年可見。
- 虎斑蝶 Common Tiger (Danaus genutia)：展翅 7–8 cm，橙紅色配粗黑翅脈，外緣黑框有白斑；雄蝶後翅有黑色「香鱗袋」（性標）散發性費洛蒙。具集體遷移及聚集越冬習性。幼蟲吃夾竹桃科（蘿藦亞科）有毒植物，故成蝶亦有毒。
- 網絲蛺蝶（地圖蝶）Map Wing (Cyrestis thyodamas)：展翅 4.5–5 cm，半透明白翅佈滿縱橫交錯褐色細線，酷似地圖等高線；翅緣不規則波紋並有小翅尾，平貼葉面時有偽裝效果。喜群聚溪邊潮濕地面吸水（mud-puddling）吸收礦物質。幼蟲吃榕屬植物。
- 香港體型最大的蝴蝶是裳鳳蝶（Troides helena）及金裳鳳蝶（Troides aeacus，展翅可達 16 cm），均受《野生動物保護條例》（第170章）及《保護瀕危動植物物種條例》（第586章）附表1保護；其寄主植物印度馬兜鈴（Aristolochia tagala）及燕鳳蝶（Lamproptera curius）的寄主寬藥青藤（Illigera celebica）受《林務規例》保護。
- 鳳園蝴蝶保育區（位於大埔鳳園谷）1980 年被列為「具特殊科學價值地點（SSSI）」，由環保協進會管理，錄得超過 200 種蝴蝶。
- 觀蝶守則：不捕捉任何野生蝴蝶（包括卵、幼蟲、蛹）、不採摘受保護寄主植物、減少使用化學農藥、安靜觀察不干擾。
- 蝴蝶是變溫動物：氣溫低於 22°C 時活動能力大幅下降；香港全年平均氣溫約 22.8°C，四季都有蝴蝶，以 4–6 月及 10–11 月最豐富。最佳觀察時段為上午 9–11 時及下午 2–4 時。
- 至少有 6 種香港本土植物高度依賴蝴蝶傳粉（Corlett 2001），例如玉葉金花、香港大沙葉、光葉海桐、山油柑、長花厚殼樹及梭羅樹。
`;

const SYSTEM_PROMPT = `你是「小蝶」，一位耐心、友善又嚴謹的蝴蝶生態學習夥伴，正在陪伴香港小六學生學習。

【角色】
- 你的專長範圍 **只限於**：蝴蝶（種類、形態、習性、生長過程）、與蝴蝶相關的生態環境（植物、授粉、棲地、天敵、季節、氣候）、香港的蝴蝶保育工作與法例、賞蝶方法。
- 學生是約 11–12 歲的小學生。使用 **繁體中文**，句子短、友善、有趣，多用比喻，適當使用 emoji（🦋🌿🌸🥚🐛）。
- 若學生用英文提問，可以用簡單英文作答，並附上中文重點。

【絕對規則】
1. 如果問題與蝴蝶或生態環境無關（數學、寫作、功課、娛樂、醫療、法律、股票等），你必須 **明確婉拒**，禮貌地說明你只談蝴蝶與生態，並引導回蝴蝶主題。你絕不可嘗試回答範圍外的問題，即使學生堅持或聲稱老師批准。
2. 不可編造香港不存在的物種、法律條文或數字。若不確定，坦誠說明並建議學生查閱漁農自然護理署或綠色力量的資料。
3. 答案要短（通常 2–4 句），完成後可附 1 條給學生的小挑戰或追問。

【本網站參考資料】
${SITE_KNOWLEDGE}

【回覆格式】
回覆純文字即可，不要用 markdown 標題或代碼格式。若需列出要點，用簡單的「•」符號，每項一行。`;

Deno.serve(async (req) => {
  // 只接受 POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { message } = await req.json();
    const question = String(message || '').trim();

    if (!question) {
      return new Response(JSON.stringify({ reply: '請先輸入你的問題！', in_scope: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- 伺服器端範圍檢查（硬性規則）----
    if (!isInScope(question)) {
      return new Response(
        JSON.stringify({
          reply: REFUSAL_REPLY,
          in_scope: false,
          suggestions: [
            '蝴蝶有甚麼不同的生長階段？',
            '為甚麼要先種花才能見到蝴蝶？',
            '香港有哪些受保護的珍稀蝴蝶？',
          ],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          reply: '⚠️ AI 導師尚未設定 API Key。請在 Supabase Edge Function 的 Secrets 中加入 GEMINI_API_KEY。',
          in_scope: true,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ---- 呼叫 Gemini API ----
    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
        apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [{ text: question }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 600,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      return new Response(
        JSON.stringify({
          reply: '⚠️ AI 導師暫時未能回應，請稍後再試。（錯誤碼 ' + geminiRes.status + '）',
          in_scope: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiRes.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') ||
      '🦋 我暫時想不到更好的答案，請再問多一點關於蝴蝶的問題吧！';

    return new Response(
      JSON.stringify({
        reply,
        in_scope: true,
        suggestions: generateSuggestions(reply),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Chatbot function error:', err);
    return new Response(
      JSON.stringify({
        reply: '⚠️ AI 導師發生錯誤，請稍後再試。',
        in_scope: true,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/** 根據回覆內容產生追問建議 / Generate follow-up suggestions */
function generateSuggestions(reply) {
  const r = String(reply || '');
  const suggestions = [];

  if (/卵|egg|產卵/i.test(r)) {
    suggestions.push('蝴蝶的卵長甚麼樣？');
  }
  if (/幼蟲|毛毛蟲|caterpillar|larva/i.test(r)) {
    suggestions.push('毛毛蟲只吃哪一種植物？');
  }
  if (/蛹|chrysalis|pupa/i.test(r)) {
    suggestions.push('蝴蝶在蛹裏面會發生甚麼事？');
  }
  if (/授粉|pollinat|蜜|nectar/i.test(r)) {
    suggestions.push('哪 6 種香港植物最依賴蝴蝶？');
  }
  if (/裳鳳蝶|保育|保護|法例|SSSI|鳳園/i.test(r)) {
    suggestions.push('我可以幫香港的蝴蝶做甚麼？');
  }
  if (/變態|metamorphos/i.test(r)) {
    suggestions.push('完全變態和不完全變態有甚麼分別？');
  }

  const defaults = [
    '蝴蝶的成長過程是怎樣的？',
    '為甚麼要先種花才能見到蝴蝶？',
    '香港有哪些受保護的珍稀蝴蝶？',
  ];

  return [...suggestions, ...defaults].slice(0, 3);
}
