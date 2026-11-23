// 10 題小測驗題目 / 10 quiz questions
export const QUIZ_QUESTIONS = [
      {
        qNum: 1,
        question: '根據漁農自然護理署《香港物種：蝴蝶》的最新名錄資料，香港目前共記錄了多少種蝴蝶？',
        enQuestion: 'According to the latest checklist from the Agriculture, Fisheries and Conservation Department (AFCD), how many butterfly species are currently recorded in Hong Kong?',
        options: [
          { zh: 'A. 約 85 種', en: 'A. Around 85 species' },
          { zh: 'B. 249 種', en: 'B. 249 species' },
          { zh: 'C. 590 種', en: 'C. 590 species' },
          { zh: 'D. 1,129 種', en: 'D. 1,129 species' }
        ],
        correctIndex: 1,
        explanation: '正確答案是 B（249 種）。根據漁護署及香港生物多樣性資訊站資料，扣除偶見迷蝶及存疑紀錄後，香港蝴蝶名錄共有 249 種，分屬 6 個科，約佔全中國蝴蝶種類的 11%。',
        enExplanation: 'Correct Answer: B (249 species). According to AFCD and HKBIH, after removing occasional vagrants and doubtful records, Hong Kong\'s butterfly checklist stands at 249 species across 6 families (about 11% of China\'s total).'
      },
      {
        qNum: 2,
        question: '哪一種香港常見鳳蝶的黑色後翅上有一列明顯的乳白色橫紋（驟看像一條白色玉帶），且雌蝶另有「白斑型」？',
        enQuestion: 'Which common Swallowtail in Hong Kong has black hindwings crossed by a prominent band of creamy-white spots (resembling a jade belt) and polymorphic white-spotted females?',
        options: [
          { zh: 'A. 玉帶鳳蝶 (Papilio polytes)', en: 'A. Common Mormon (Papilio polytes)' },
          { zh: 'B. 巴黎翠鳳蝶 (Papilio paris)', en: 'B. Paris Peacock (Papilio paris)' },
          { zh: 'C. 報喜斑粉蝶 (Delias pasithoe)', en: 'C. Red-base Jezebel (Delias pasithoe)' },
          { zh: 'D. 虎斑蝶 (Danaus genutia)', en: 'D. Common Tiger (Danaus genutia)' }
        ],
        correctIndex: 0,
        explanation: '正確答案是 A（玉帶鳳蝶）。玉帶鳳蝶展翅 8–10 厘米，黑色後翅有一列乳白色橫紋，雌蝶另有模擬紅珠鳳蝶的白斑型。',
        enExplanation: 'Correct Answer: A (Common Mormon, Papilio polytes). It has an 8–10 cm wingspan with a creamy-white band on the hindwings, and females also have a white-spotted form that mimics the toxic Common Rose.'
      },
      {
        qNum: 3,
        question: '「巴黎翠鳳蝶 (Papilio paris)」的黑色翅膀滿布閃亮綠色小點，牠的後翅正面有甚麼極為奪目的特徵？',
        enQuestion: 'The Paris Peacock (Papilio paris) has black wings dusted with glittering green scales. What striking feature is found on the upperside of its hindwings?',
        options: [
          { zh: 'A. 橙紅色的老虎條紋', en: 'A. Orange-red tiger stripes' },
          { zh: 'B. 像珍珠項鍊的白色圓點', en: 'B. A string of pearl-like white dots' },
          { zh: 'C. 紫藍色（翠藍色）的大斑紋和黑色長翅尾', en: 'C. A dazzling metallic turquoise-blue patch and long black tails' },
          { zh: 'D. 酷似地圖經緯線的褐色細紋', en: 'D. Fine brown lines resembling map contours' }
        ],
        correctIndex: 2,
        explanation: '正確答案是 C。根據綠色力量常見蝴蝶資料，巴黎翠鳳蝶黑翅滿布閃亮綠色小點，後翅附有紫藍色的大斑紋和黑色長翅尾。',
        enExplanation: 'Correct Answer: C. According to Green Power\'s guide, the Paris Peacock features black wings dusted with shiny green spots, large metallic blue/turquoise patches, and long black tails on its hindwings.'
      },
      {
        qNum: 4,
        question: '「報喜斑粉蝶 (Delias pasithoe)」喜歡寫意地低飛，牠的後翅底部有甚麼鮮艷的警戒色斑塊？',
        enQuestion: 'The Red-base Jezebel (Delias pasithoe) flies leisurely at low heights. What vivid warning colors appear on the underside of its hindwings?',
        options: [
          { zh: 'A. 全片純白色沒有任何斑點', en: 'A. Pure white with no markings at all' },
          { zh: 'B. 鮮艷的黃斑和位於翅膀基部的紅斑', en: 'B. Bright yellow patches and vivid red spots at the wing base' },
          { zh: 'C. 金屬紫藍色與銀色條紋', en: 'C. Metallic purple-blue and silver stripes' },
          { zh: 'D. 枯葉般的深褐色偽裝紋', en: 'D. Dead-leaf dark brown camouflage patterns' }
        ],
        correctIndex: 1,
        explanation: '正確答案是 B。報喜斑粉蝶（英文名 Red-base Jezebel）後翅底部有鮮艷的黃色斑塊，以及位於基部的鮮紅色斑塊。',
        enExplanation: 'Correct Answer: B. As its English name "Red-base Jezebel" suggests, its hindwing underside has bright yellow patches and vivid crimson-red spots at the base.'
      },
      {
        qNum: 5,
        question: '「虎斑蝶 (Danaus genutia)」翅膀呈橙紅色配黑色翅脈，我們可以怎樣從外觀分辨雄性與雌性的虎斑蝶？',
        enQuestion: 'The Common Tiger (Danaus genutia) has orange-red wings with bold black veins. How can we visually distinguish a male Common Tiger from a female?',
        options: [
          { zh: 'A. 雄蝶翅膀是全白色的，雌蝶是橙紅色的', en: 'A. Males have all-white wings while females are orange-red' },
          { zh: 'B. 雄蝶展翅寬達 20 厘米，比雌蝶大兩倍', en: 'B. Males have a 20 cm wingspan, twice as large as females' },
          { zh: 'C. 雄蝶後翅有一黑色的「香鱗袋（性標）」', en: 'C. Males have a black "scent pouch" on the hindwing' },
          { zh: 'D. 雄蝶長有長長的翅尾，雌蝶沒有翅尾', en: 'D. Males have long swallowtails while females do not' }
        ],
        correctIndex: 2,
        explanation: '正確答案是 C。虎斑蝶雌雄外型相若，唯獨雄蝶後翅有一個黑色的「香鱗袋」，用來散發性費洛蒙吸引雌蝶，且虎斑蝶具有集體遷移和越冬的習性。',
        enExplanation: 'Correct Answer: C. Male and female Common Tigers look very similar, except the male has a prominent black scent pouch on its hindwing used to release courtship pheromones.'
      },
      {
        qNum: 6,
        question: '哪一種蝴蝶因為半透明白色翅膀上佈滿縱橫交錯的褐色細紋，外型酷似地圖而俗稱「地圖蝶」？',
        enQuestion: 'Which butterfly is commonly nicknamed the "Map Butterfly" (Map Wing) because its translucent white wings are etched with fine brown map-like lines?',
        options: [
          { zh: 'A. 寬邊黃粉蝶 (Eurema hecabe)', en: 'A. Common Grass Yellow (Eurema hecabe)' },
          { zh: 'B. 藍點紫斑蝶 (Euploea midamus)', en: 'B. Blue-spotted Crow (Euploea midamus)' },
          { zh: 'C. 網絲蛺蝶 (Cyrestis thyodamas)', en: 'C. Map Wing (Cyrestis thyodamas)' },
          { zh: 'D. 酢醬灰蝶 (Zizeeria maha)', en: 'D. Pale Grass Blue (Zizeeria maha)' }
        ],
        correctIndex: 2,
        explanation: '正確答案是 C（網絲蛺蝶）。網絲蛺蝶展翅 4.5–5 厘米，翅面和翅底都有類似地圖的花紋，因此又名「地圖蝶」。',
        enExplanation: 'Correct Answer: C (Map Wing, Cyrestis thyodamas). With a wingspan of 4.5–5 cm, both surfaces of its wings feature map-like markings.'
      },
      {
        qNum: 7,
        question: '根據漁護署的觀蝶科學知識，蝴蝶屬於變溫動物（外溫動物），當環境氣溫低於多少度時，蝴蝶會變得不活躍？',
        enQuestion: 'According to AFCD butterfly observation tips, butterflies are poikilotherms (ectotherms). Below what ambient temperature do they become inactive?',
        options: [
          { zh: 'A. 低於 32°C', en: 'A. Below 32°C' },
          { zh: 'B. 低於 28°C', en: 'B. Below 28°C' },
          { zh: 'C. 低於 22°C', en: 'C. Below 22°C' },
          { zh: 'D. 低於 10°C', en: 'D. Below 10°C' }
        ],
        correctIndex: 2,
        explanation: '正確答案是 C（低於 22°C）。當氣溫跌至 22°C 以下時，蝴蝶活動能力會明顯減低；香港全年平均氣溫約 22.8°C，因此一年四季都能看到蝴蝶。',
        enExplanation: 'Correct Answer: C (Below 22°C). Butterflies become inactive when temperatures fall below 22°C. Because Hong Kong has an average temperature of 22.8°C, butterflies can be seen year-round.'
      },
      {
        qNum: 8,
        question: '在香港法例中，哪一種本港最大型的蝴蝶類別同時受《野生動物保護條例》（第170章）及《保護瀕危動植物物種條例》（第586章）保護？',
        enQuestion: 'Under Hong Kong law, which group of Hong Kong\'s largest butterflies is protected under both the Wild Animals Protection Ordinance (Cap. 170) and the Protection of Endangered Species Ordinance (Cap. 586)?',
        options: [
          { zh: 'A. 東方菜粉蝶（幼蟲吃十字花科蔬菜）', en: 'A. Indian Cabbage White (Pieris canidia)' },
          { zh: 'B. 裳鳳蝶（Troides helena）及裳鳳蝶屬物種', en: 'B. Common Birdwing (Troides helena) and all Birdwings (Troides spp.)' },
          { zh: 'C. 寬邊黃粉蝶（Eurema hecabe）', en: 'C. Common Grass Yellow (Eurema hecabe)' },
          { zh: 'D. 曲紋袖弄蝶（Notocrypta curvifascia）', en: 'D. Restricted Demon (Notocrypta curvifascia)' }
        ],
        correctIndex: 1,
        explanation: '正確答案是 B。裳鳳蝶受《野生動物保護條例》（第170章）保護，而所有裳鳳蝶屬（Troides spp.，包括裳鳳蝶及金裳鳳蝶）均列於《保護瀕危動植物物種條例》（第586章）附表1受嚴格規管。',
        enExplanation: 'Correct Answer: B. The Common Birdwing is protected under Cap. 170, and all Birdwing species (Troides spp., including Common and Golden Birdwings) are listed under Schedule 1 of Cap. 586.'
      },
      {
        qNum: 9,
        question: '位於大埔、於 1980 年被列為「具特殊科學價值地點（SSSI）」，並由環保協進會管理、錄得超過 200 種蝴蝶的著名保育熱點是哪裡？',
        enQuestion: 'Which famous butterfly conservation hotspot in Tai Po was designated as a Site of Special Scientific Interest (SSSI) in 1980, is managed by the Environmental Association, and has recorded over 200 butterfly species?',
        options: [
          { zh: 'A. 鳳園蝴蝶保育區（鳳園谷）', en: 'A. Fung Yuen Butterfly Reserve (Fung Yuen Valley)' },
          { zh: 'B. 旺角花墟公園', en: 'B. Mong Kok Flower Market Park' },
          { zh: 'C. 維多利亞公園', en: 'C. Victoria Park' },
          { zh: 'D. 尖沙咀九龍公園', en: 'D. Kowloon Park in Tsim Sha Tsui' }
        ],
        correctIndex: 0,
        explanation: '正確答案是 A（鳳園蝴蝶保育區）。大埔鳳園谷於 1980 年被列為「具特殊科學價值地點」，錄得超過 200 種蝴蝶，是裳鳳蝶及燕鳳蝶的重要繁殖地。',
        enExplanation: 'Correct Answer: A (Fung Yuen Butterfly Reserve). Designated as an SSSI in 1980, Fung Yuen Valley in Tai Po holds over 200 butterfly species and is a key breeding site for Common Birdwing and White Dragontail.'
      },
      {
        qNum: 10,
        question: '學生在郊野或蝴蝶保育區進行生態考察時，下列哪一項是正確的「蝴蝶保育及觀蝶守則」？',
        enQuestion: 'When students visit the countryside or a butterfly reserve for field study, which of the following is the proper Butterfly Conservation & Watching Code?',
        options: [
          { zh: 'A. 用捕蟲網捕捉蝴蝶帶回家飼養觀察', en: 'A. Catch butterflies with nets to take home' },
          { zh: 'B. 採摘印度馬兜鈴和寬藥青藤的葉片作紀念', en: 'B. Pick protected Indian Birthwort and Illigera leaves as souvenirs' },
          { zh: 'C. 趁蝴蝶在陽光下進行「日光浴」停棲時，保持安靜用相機或望遠鏡觀察，絕不干擾或捕捉蝴蝶', en: 'C. Observe quietly with cameras or binoculars while butterflies sunbathe, without disturbing or capturing them' },
          { zh: 'D. 在校園花圃噴灑強力化學殺蟲劑以消滅所有毛蟲', en: 'D. Spray strong chemical insecticides across school gardens to kill all caterpillars' }
        ],
        correctIndex: 2,
        explanation: '正確答案是 C。尊重生命、不捕捉任何野生蝴蝶（包括卵、幼蟲和蛹）、不採摘受保護寄主植物及減少使用化學農藥，才是最正確的蝴蝶保育行動。',
        enExplanation: 'Correct Answer: C. Respecting wildlife by observing quietly without catching butterflies (or their eggs, larvae, and pupae), protecting host plants, and avoiding chemical pesticides is the core of butterfly conservation.'
      }
    ];
