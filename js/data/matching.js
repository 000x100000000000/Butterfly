/**
 * 蝶舞香港 — 配對遊戲資料
 * ButterflyHK — Matching game data
 *
 * 遊戲概念：學生把「詞語卡」拖到「圖畫卡」上，配對蝴蝶的生命過程。
 * Game concept: students drag term cards onto picture cards to match the
 * butterfly life cycle (卵 → 幼蟲 → 蛹 → 成蟲).
 */

/** 四個生命階段 / The four life stages */
export const LIFE_STAGES = [
  {
    id: 'egg',
    zh: '卵',
    en: 'Egg',
    zhDesc: '蝴蝶的卵通常產在寄主植物的葉片上，細小呈圓形或樽形，孵化前會變色。',
    enDesc:
      'Butterfly eggs are usually laid on the leaves of host plants. They are tiny, round or barrel-shaped, and change colour before hatching.',
    icon: 'assets/svg/stage-egg.svg',
    durationZh: '約 3 – 5 日',
    durationEn: 'About 3 – 5 days',
  },
  {
    id: 'larva',
    zh: '幼蟲（毛毛蟲）',
    en: 'Larva (Caterpillar)',
    zhDesc: '毛毛蟲專吃寄主植物的葉子，體色多與植物相近以躲避天敵，長大後會蛻皮多次。',
    enDesc:
      'Caterpillars feed on the leaves of their specific host plants. Their colouring often camouflages them against foliage, and they shed their skin several times as they grow.',
    icon: 'assets/svg/stage-larva.svg',
    durationZh: '約 2 – 3 星期',
    durationEn: 'About 2 – 3 weeks',
  },
  {
    id: 'pupa',
    zh: '蛹（吊蛹）',
    en: 'Pupa (Chrysalis)',
    zhDesc: '幼蟲結蛹後體形大變，體內進行大規模重組，翅膀和生殖器官逐漸成形。',
    enDesc:
      'Inside the chrysalis the body is dramatically reorganised. Wings and reproductive organs gradually take shape while the pupa remains still and attached.',
    icon: 'assets/svg/stage-pupa.svg',
    durationZh: '約 1 – 2 星期',
    durationEn: 'About 1 – 2 weeks',
  },
  {
    id: 'adult',
    zh: '成蟲（蝴蝶）',
    en: 'Adult (Imago)',
    zhDesc: '成蟲破蛹而出，展開翅膀晾乾後即可飛行、吸食花蜜，並交配產卵延續下一代。',
    enDesc:
      'The adult emerges from the chrysalis, hangs still to dry and expand its wings, then flies, feeds on nectar, mates and lays eggs to begin the next generation.',
    icon: 'assets/svg/stage-adult.svg',
    durationZh: '可存活數星期至數月',
    durationEn: 'Lives weeks to months',
  },
];

/**
 * 詞語卡：每張詞語卡對應一個階段的圖片。
 * 額外加入生態詞彙卡，令遊戲更有挑戰性及教育意義。
 * Term cards: each one matches a stage picture. Additional ecological
 * term cards add challenge and learning value.
 */
export const MATCH_TERMS = [
  {
    id: 'egg',
    termZh: '卵',
    termEn: 'Egg',
    stageId: 'egg',
    hintZh: '蝴蝶生命的第一階段',
    hintEn: 'The first stage of a butterfly’s life',
  },
  {
    id: 'larva',
    termZh: '幼蟲 / 毛毛蟲',
    termEn: 'Larva / Caterpillar',
    stageId: 'larva',
    hintZh: '會大量進食寄主植物葉子',
    hintEn: 'Eats host plant leaves voraciously',
  },
  {
    id: 'pupa',
    termZh: '蛹 / 吊蛹',
    termEn: 'Pupa / Chrysalis',
    stageId: 'pupa',
    hintZh: '身體正在大幅重組的階段',
    hintEn: 'The stage of dramatic body transformation',
  },
  {
    id: 'adult',
    termZh: '成蟲 / 蝴蝶',
    termEn: 'Adult / Imago',
    stageId: 'adult',
    hintZh: '可以飛翔、吸食花蜜、產卵',
    hintEn: 'Flies, sips nectar and lays eggs',
  },
];

/**
 * 生態詞彙卡 — 與 4 個階段圖片配對
 * （設計為與「卵/幼蟲/蛹/成蟲」概念相連的關鍵生態特徵）
 * 每張卡都會顯示其對應階段的 SVG 圖示，讓玩家知道該詞語與哪個階段相關。
 */
export const ECOLOGY_TERMS = [
  {
    id: 'host',
    termZh: '寄主植物',
    termEn: 'Host Plant',
    stageId: 'larva',
    icon: 'assets/svg/eco-host-plant.svg',
    hintZh: '幼蟲專門取食的植物',
    hintEn: 'The specific plant a larva eats',
  },
  {
    id: 'metamorphosis',
    termZh: '完全變態',
    termEn: 'Complete Metamorphosis',
    stageId: 'pupa',
    icon: 'assets/svg/eco-metamorphosis.svg',
    hintZh: '卵→幼蟲→蛹→成蟲的蛻變過程',
    hintEn: 'The egg–larva–pupa–adult transformation',
  },
  {
    id: 'pollination',
    termZh: '授粉',
    termEn: 'Pollination',
    stageId: 'adult',
    icon: 'assets/svg/eco-pollination.svg',
    hintZh: '成蟲吸食花蜜時傳遞花粉',
    hintEn: 'Adults carry pollen while sipping nectar',
  },
  {
    id: 'sunbathing',
    termZh: '日光浴',
    termEn: 'Sunbathing',
    stageId: 'adult',
    icon: 'assets/svg/eco-sunbathing.svg',
    hintZh: '張開翅膀曬太陽以提升體溫',
    hintEn: 'Spreading wings in the sun to warm up',
  },
  {
    id: 'egg-laying',
    termZh: '產卵',
    termEn: 'Egg-laying',
    stageId: 'egg',
    icon: 'assets/svg/eco-egg-laying.svg',
    hintZh: '成蟲在寄主植物上產下卵',
    hintEn: 'The adult lays eggs on host plants',
  },
  {
    id: 'pupa-hang',
    termZh: '倒吊',
    termEn: 'Hanging (J-curve)',
    stageId: 'pupa',
    icon: 'assets/svg/eco-pupa-hang.svg',
    hintZh: '化蛹前呈「J」字形吊掛',
    hintEn: 'Hanging in a “J” shape before pupating',
  },
];

/** 取得指定難度的完整配對組 / Build a matching set of a given size */
export function buildMatchSet(size = 6) {
  // 階段卡與生態卡的欄位名稱不同，先統一成 zh/en/desc 格式，
  // 讓遊戲的渲染邏輯可以用同一套欄位處理兩種卡片。
  const stages = LIFE_STAGES.map(s => ({
    kind: 'stage',
    id: s.id,
    zh: s.zh,
    en: s.en,
    zhDesc: s.zhDesc,
    enDesc: s.enDesc,
    durationZh: s.durationZh,
    durationEn: s.durationEn,
    icon: s.icon,
  }));

  const eco = ECOLOGY_TERMS.map(t => ({
    kind: 'eco',
    id: t.id,
    zh: t.termZh,
    en: t.termEn,
    zhDesc: t.hintZh,
    enDesc: t.hintEn,
    durationZh: '',
    durationEn: '',
    icon: t.icon,
  }));

  // 必定包含 4 個階段，再隨機加入生態詞彙卡
  const pool = [...eco].sort(() => Math.random() - 0.5).slice(0, Math.max(0, size - 4));
  const cards = [...stages, ...pool];

  // 每張卡片在遊戲中有唯一 id：圖畫端用 pictureId，詞語端用 termId
  return cards.map((card, i) => ({
    ...card,
    pictureId: `pic-${card.kind}-${card.id}-${i}`,
    termId: `term-${card.kind}-${card.id}-${i}`,
    // 正確配對的 key：同一張卡片的 kind + id
    matchKey: `${card.kind}:${card.id}`,
  }));
}

/** 打亂陣列 / Shuffle an array */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
