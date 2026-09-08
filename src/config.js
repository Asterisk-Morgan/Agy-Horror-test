// ゲーム全体設定・定数・パラメータ

export const CONFIG = {
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 540,
  TILE_SIZE: 48,

  // プレイヤー（ミダル）設定
  PLAYER: {
    MAX_HP: 100,
    MAX_STAMINA: 100,
    STAMINA_RECOVERY: 25, // per second
    STAMINA_RECOVERY_NEAR_YUME: 40,
    SPEED_WALK: 155,
    SPEED_DASH: 235,
    RADIUS: 18,
    INITIAL_AMMO: {
      XDM: { clip: 16, reserve: 48, maxClip: 16 },
      MP7: { clip: 40, reserve: 120, maxClip: 40 }
    }
  },

  // 同行者（ユメ）設定
  YUME: {
    RADIUS: 14,
    SPEED: 170,
    FOLLOW_DIST_MIN: 45,
    FOLLOW_DIST_MAX: 95,
    AURA_RADIUS: 130
  },

  // 武器設定
  WEAPONS: {
    KATANA: {
      id: "KATANA",
      name: "対怪異高周波直刀",
      shortName: "直刀",
      type: "melee",
      damage: 48,
      range: 70,
      arc: Math.PI * 0.75, // 約135度の扇状範囲
      cooldown: 0.36,
      staminaCost: 14,
      knockback: 180,
      description: "怪異の肉質筋繊維を切断するために打たれた刃。弾薬不要。"
    },
    XDM_40: {
      id: "XDM_40",
      name: "XDM-40 (.40 S&W)",
      shortName: "XDM-40",
      type: "pistol",
      damage: 38,
      cooldown: 0.28,
      reloadTime: 1.4,
      speed: 750,
      range: 480,
      spread: 0.03,
      knockback: 140,
      staminaCost: 0,
      description: "高威力の.40 S&W弾を使用するハンドガン。強い阻止力を持つ。"
    },
    MP7A1: {
      id: "MP7A1",
      name: "MP7A1 (4.6×30mm)",
      shortName: "MP7A1",
      type: "smg",
      damage: 17,
      cooldown: 0.082, // 約730rpm
      reloadTime: 2.0,
      speed: 820,
      range: 520,
      spread: 0.085,
      knockback: 45,
      staminaCost: 0,
      description: "高貫通PDW。圧倒的な連射性能で群がる怪異を制圧する。"
    }
  },

  // 敵（怪異）設定
  ENEMIES: {
    HACHISHAKU: {
      id: "HACHISHAKU",
      name: "八尺の腕",
      hp: 110,
      speed: 85,
      radius: 20,
      damage: 26,
      attackCooldown: 1.6,
      attackRange: 135,
      detectRadius: 360,
      color: "#e8eaed",
      lore: "伸縮する腕を持つ長身の怪異。白い巨躯で接近し遠間から突く。"
    },
    CHIMERA: {
      id: "CHIMERA",
      name: "人面獣キメラ",
      hp: 65,
      speed: 205,
      radius: 17,
      damage: 16,
      attackCooldown: 0.9,
      attackRange: 32,
      detectRadius: 400,
      color: "#a94442",
      lore: "人間の顔と野獣の肢体を併せ持つ高速怪異。ジグザグに飛びかかる。"
    },
    SLICER: {
      id: "SLICER",
      name: "這行の刃 (テケテケ)",
      hp: 95,
      speed: 230,
      radius: 19,
      damage: 32,
      attackCooldown: 1.8,
      attackRange: 42,
      detectRadius: 340,
      color: "#8a6d3b",
      lore: "チタン製ブレード義肢を移植された上半身怪異。超速の突進を仕掛ける。"
    },
    SPORE: {
      id: "SPORE",
      name: "生体結晶塊 (コトリバコ)",
      hp: 160,
      speed: 55,
      radius: 23,
      damage: 14,
      attackCooldown: 2.2,
      attackRange: 280,
      detectRadius: 380,
      color: "#6f42c1",
      lore: "呪物結晶を核にした歩行肉塊。有毒の生体針を周囲に散弾発射する。"
    },
    BOSS: {
      id: "BOSS",
      name: "被験体零号・ウロボロス",
      hp: 650,
      speed: 95,
      radius: 36,
      damage: 35,
      attackCooldown: 1.2,
      attackRange: 120,
      detectRadius: 600,
      color: "#b30000",
      lore: "古来の伝承八岐細胞とホムンクルス器官が結合した最凶の巨大異形。"
    }
  },

  // アイテム設定
  ITEMS: {
    AMMO_XDM: { name: "XDM-40 弾薬箱 (+16)", type: "ammo_xdm", amount: 16 },
    AMMO_MP7: { name: "MP7A1 弾薬箱 (+40)", type: "ammo_mp7", amount: 40 },
    MEDKIT: { name: "生体修復スプレー (+45 HP)", type: "medkit", heal: 45 },
    KEYCARD: { name: "セキュリティ認証キー", type: "keycard" }
  },

  // 色彩・テーマ
  THEME: {
    DARKNESS: "rgba(3, 7, 12, 0.94)",
    FLASHLIGHT_INNER: "rgba(230, 245, 255, 0.88)",
    FLASHLIGHT_OUTER: "rgba(100, 160, 220, 0.0)",
    AMB_LIGHT: "rgba(18, 28, 42, 0.4)",
    LASER_SIGHT: "rgba(0, 255, 200, 0.5)",
    BLOOD: "#990000",
    CYBER_BLUE: "#00f0ff",
    ACCENT_WARN: "#ff3344"
  }
};
