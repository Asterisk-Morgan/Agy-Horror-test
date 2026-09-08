// 各フロアのマップグリッドと配置データ

export const LEVELS = [
  // ===== FLOOR 0: B3F 生体培養区画 =====
  {
    floorId: "B3F",
    name: "地下B3F - 生体培養区画",
    subName: "Bio-Cultivation Sector",
    bgmTone: "deep",
    ambientLight: "rgba(10, 20, 26, 0.94)",
    playerStart: { x: 3, y: 7 },
    yumeStart: { x: 2.2, y: 7 },
    exitDoor: { x: 21, y: 3, targetFloor: 1, requiresKey: false, label: "B2F連絡通路" },
    gridWidth: 24,
    gridHeight: 14,
    grid: [
      "111111111111111111111111",
      "100000010000000100000001",
      "103300010033000100330001",
      "103300000033000000330021",
      "100000010000000100000001",
      "111011111110111111101111",
      "100000000000000000000001",
      "100000000000000000000001",
      "111011111110111111101111",
      "100000010000000100000001",
      "103300010033000100330001",
      "103300000033000000330001",
      "100000010000000100000001",
      "111111111111111111111111"
    ],
    items: [
      { x: 4.5, y: 2.5, type: "document", payload: "doc_01" },
      { x: 12.5, y: 2.5, type: "document", payload: "doc_02" },
      { x: 12.5, y: 11.5, type: "document", payload: "doc_03" },
      { x: 5, y: 11, type: "ammo_xdm" },
      { x: 18, y: 11, type: "ammo_mp7" },
      { x: 18, y: 2, type: "medkit" }
    ],
    enemies: [
      { x: 10, y: 7, type: "CHIMERA" },
      { x: 15, y: 7, type: "HACHISHAKU" },
      { x: 19, y: 4, type: "CHIMERA" },
      { x: 19, y: 10, type: "HACHISHAKU" }
    ]
  },

  // ===== FLOOR 1: B2F 怪異隔離・民俗資料区画 =====
  {
    floorId: "B2F",
    name: "地下B2F - 怪異隔離・民俗資料区画",
    subName: "Cryptid Containment & Archive",
    bgmTone: "metal",
    ambientLight: "rgba(18, 14, 24, 0.95)",
    playerStart: { x: 2, y: 2 },
    yumeStart: { x: 1.5, y: 2 },
    exitDoor: { x: 22, y: 12, targetFloor: 2, requiresKey: true, keyId: "key_b2", label: "B1F中央エレベーター" },
    gridWidth: 25,
    gridHeight: 15,
    grid: [
      "1111111111111111111111111",
      "1000000100000001000000001",
      "1000000100000001000000001",
      "1000000000000000000000001",
      "1111011111011111110111111",
      "1000000100000001000000001",
      "1000000100000001000000001",
      "1000000000000000000000001",
      "1111011111011111110111111",
      "1000000100000001000000001",
      "1000000100000001000000001",
      "1000000000000000000000001",
      "1000000100000001000000021",
      "1000000100000001000000001",
      "1111111111111111111111111"
    ],
    items: [
      { x: 3, y: 6, type: "document", payload: "doc_04" },
      { x: 11, y: 2, type: "document", payload: "doc_05" },
      { x: 11, y: 10, type: "document", payload: "doc_06" },
      { x: 3, y: 13, type: "keycard", payload: "key_b2" }, // 隔離室奥にあるセキュリティキー
      { x: 19, y: 2, type: "ammo_mp7" },
      { x: 19, y: 6, type: "ammo_xdm" },
      { x: 3, y: 10, type: "medkit" },
      { x: 19, y: 10, type: "medkit" }
    ],
    enemies: [
      { x: 7, y: 3, type: "SLICER" },
      { x: 13, y: 7, type: "HACHISHAKU" },
      { x: 15, y: 3, type: "CHIMERA" },
      { x: 7, y: 11, type: "SLICER" },
      { x: 15, y: 11, type: "CHIMERA" },
      { x: 21, y: 7, type: "HACHISHAKU" }
    ]
  },

  // ===== FLOOR 2: B1F 中央管理・プロジェクト・イブ特設ラボ =====
  {
    floorId: "B1F",
    name: "地下B1F - 中央管理・人工生命開発室",
    subName: "Central Core & Project EVE",
    bgmTone: "pulse",
    ambientLight: "rgba(22, 10, 15, 0.94)",
    playerStart: { x: 2, y: 7 },
    yumeStart: { x: 1.5, y: 7 },
    exitDoor: { x: 22, y: 7, targetFloor: 3, requiresKey: false, label: "地上エントランス直通階段" },
    gridWidth: 25,
    gridHeight: 15,
    grid: [
      "1111111111111111111111111",
      "1000000000100010000000001",
      "1033333300100010033333301",
      "1033333300000000033333301",
      "1000000000100010000000001",
      "1111011111100011111011111",
      "1000000000000000000000001",
      "1000000000000000000000021",
      "1000000000000000000000001",
      "1111011111100011111011111",
      "1000000000100010000000001",
      "1033333300000000033333301",
      "1033333300100010033333301",
      "1000000000100010000000001",
      "1111111111111111111111111"
    ],
    items: [
      { x: 5, y: 3, type: "document", payload: "doc_07" },
      { x: 19, y: 3, type: "document", payload: "doc_08" },
      { x: 12, y: 7, type: "document", payload: "doc_09" },
      { x: 5, y: 12, type: "ammo_mp7" },
      { x: 19, y: 12, type: "ammo_xdm" },
      { x: 12, y: 2, type: "medkit" },
      { x: 12, y: 12, type: "medkit" }
    ],
    enemies: [
      { x: 8, y: 7, type: "SPORE" },
      { x: 16, y: 7, type: "SPORE" },
      { x: 6, y: 3, type: "SLICER" },
      { x: 18, y: 3, type: "CHIMERA" },
      { x: 6, y: 11, type: "SLICER" },
      { x: 18, y: 11, type: "HACHISHAKU" }
    ]
  },

  // ===== FLOOR 3: 1F 地上エントランス・脱出ゲート =====
  {
    floorId: "1F",
    name: "地上1F - 脱出エントランスゲート",
    subName: "Surface Exit Gate",
    bgmTone: "boss",
    ambientLight: "rgba(15, 20, 30, 0.92)",
    playerStart: { x: 3, y: 7 },
    yumeStart: { x: 2, y: 7 },
    exitDoor: { x: 22, y: 7, targetFloor: 999, requiresKey: true, keyId: "boss_defeat", label: "地上脱出シャッター" },
    gridWidth: 25,
    gridHeight: 15,
    grid: [
      "1111111111111111111111111",
      "1000000000000000000000001",
      "1000000000000000000000001",
      "1000000000000000000000001",
      "1001111000000000011110001",
      "1001001000000000010010001",
      "1000000000000000000000001",
      "1000000000000000000000021",
      "1000000000000000000000001",
      "1001001000000000010010001",
      "1001111000000000011110001",
      "1000000000000000000000001",
      "1000000000000000000000001",
      "1000000000000000000000001",
      "1111111111111111111111111"
    ],
    items: [
      { x: 5, y: 7, type: "document", payload: "doc_10" },
      { x: 4, y: 3, type: "ammo_mp7" },
      { x: 4, y: 11, type: "ammo_xdm" },
      { x: 6, y: 3, type: "medkit" },
      { x: 6, y: 11, type: "medkit" }
    ],
    enemies: [
      { x: 16, y: 7, type: "BOSS" }
    ]
  }
];
