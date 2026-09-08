// ゲームメインループ・状態遷移・UI制御
import { CONFIG } from "./config.js";
import { audio } from "./audio.js";
import { TileMap } from "./map/tileMap.js";
import { LEVELS } from "./map/levelData.js";
import { Player } from "./entities/player.js";
import { Companion } from "./entities/companion.js";
import { Enemy } from "./entities/enemy.js";
import { Item } from "./entities/item.js";
import { SlashArc } from "./entities/bullet.js";
import { Renderer } from "./renderer.js";
import { InputManager } from "./input.js";
import { DOCUMENTS, getDocumentById } from "./story/documents.js";

class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;

    this.renderer = new Renderer(this.canvas);
    this.input = new InputManager(this.canvas);

    // ゲーム状態
    this.state = "title"; // "title", "playing", "document_modal", "archive_modal", "game_over", "game_clear"
    this.currentFloorIndex = 0;

    // ゲーム内実体
    this.tileMap = null;
    this.player = null;
    this.yume = null;
    this.enemies = [];
    this.items = [];
    this.bullets = [];
    this.slashes = [];

    // 時間計測
    this.lastTime = performance.now();

    // 通知トースト
    this.toastTimer = 0;

    this.initUI();
  }

  initUI() {
    // スタートボタン
    document.getElementById("btn-start")?.addEventListener("click", () => {
      audio.resume();
      this.startGame();
    });

    // リトライボタン
    document.getElementById("btn-retry")?.addEventListener("click", () => {
      audio.resume();
      this.restartFloor();
    });

    // クリア後リスタート
    document.getElementById("btn-restart")?.addEventListener("click", () => {
      audio.resume();
      this.startGame();
    });

    // 資料アーカイブ開閉ボタン
    document.getElementById("btn-open-archive")?.addEventListener("click", () => {
      this.openArchiveModal();
    });

    document.getElementById("btn-close-archive")?.addEventListener("click", () => {
      this.closeArchiveModal();
    });

    // 単独資料モーダル閉じる
    document.getElementById("btn-close-doc")?.addEventListener("click", () => {
      this.closeDocModal();
    });

    // ミュート切り替えボタン
    document.getElementById("btn-mute")?.addEventListener("click", (e) => {
      const isMuted = audio.toggleMute();
      e.target.textContent = isMuted ? "🔇" : "🔊";
    });

    // 全画面表示ボタン
    document.getElementById("btn-fullscreen")?.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    // ウィンドウリサイズ対応
    window.addEventListener("resize", () => {
      this.fitCanvas();
    });
    this.fitCanvas();
  }

  fitCanvas() {
    const container = document.getElementById("game-container");
    if (!container) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const targetAspect = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;
    const windowAspect = w / h;

    let finalW, finalH;
    if (windowAspect > targetAspect) {
      finalH = h;
      finalW = h * targetAspect;
    } else {
      finalW = w;
      finalH = w / targetAspect;
    }
    container.style.width = `${finalW}px`;
    container.style.height = `${finalH}px`;
  }

  startGame() {
    this.currentFloorIndex = 0;
    this.player = null; // 新規プレイヤーステート
    this.loadFloor(this.currentFloorIndex);
    this.state = "playing";

    document.getElementById("screen-title").classList.add("hidden");
    document.getElementById("screen-game-over").classList.add("hidden");
    document.getElementById("screen-game-clear").classList.add("hidden");
    document.getElementById("hud").classList.remove("hidden");

    this.showToast("M.M.I.C. 地下B3F 生体培養区画に進入……少女ユメを護衛せよ");
  }

  restartFloor() {
    this.loadFloor(this.currentFloorIndex);
    this.state = "playing";
    document.getElementById("screen-game-over").classList.add("hidden");
    document.getElementById("hud").classList.remove("hidden");
    this.showToast("ミダルは立ち上がった……作戦を再開する");
  }

  loadFloor(index) {
    const levelData = LEVELS[index];
    this.currentFloorIndex = index;
    this.tileMap = new TileMap(levelData);

    const ts = CONFIG.TILE_SIZE;
    const px = levelData.playerStart.x * ts;
    const py = levelData.playerStart.y * ts;

    // プレイヤー初期化（収集資料・弾薬は保持）
    if (!this.player) {
      this.player = new Player(px, py);
    } else {
      this.player.x = px;
      this.player.y = py;
      this.player.hp = this.player.maxHp;
      this.player.stamina = this.player.maxStamina;
      this.player.isDead = false;
      this.player.deathTimer = 0;
      this.player.invincibleTimer = 0;
    }

    // ユメ初期化
    const yx = levelData.yumeStart.x * ts;
    const yy = levelData.yumeStart.y * ts;
    this.yume = new Companion(yx, yy);

    // 敵配置
    this.enemies = levelData.enemies.map(e => new Enemy(e.x * ts, e.y * ts, e.type));

    // アイテム配置
    this.items = levelData.items.map(it => new Item(it.x * ts, it.y * ts, it.type, it.payload));

    this.bullets = [];
    this.slashes = [];

    // HUDのフロア名更新
    const floorLabel = document.getElementById("hud-floor");
    if (floorLabel) floorLabel.textContent = levelData.name;

    // ユメの初期セリフ
    if (index === 0) {
      setTimeout(() => this.yume.say("ミダルさん……私、歩けます。一緒に行きます。"), 800);
    } else if (index === 1) {
      setTimeout(() => this.yume.say("ここは隔離区画……何か異様な気配がします。"), 800);
    } else if (index === 2) {
      setTimeout(() => this.yume.say("非常警戒ランプが作動しています……急ぎましょう。"), 800);
    } else if (index === 3) {
      setTimeout(() => this.yume.say("あの先が地上への出口です……でも、何か巨大なものが……！"), 800);
    }
  }

  // ===== メインループ =====
  startLoop() {
    const loop = (currentTime) => {
      const dt = Math.min(0.08, (currentTime - this.lastTime) / 1000);
      this.lastTime = currentTime;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    if (this.state === "title") return;

    if (this.state === "playing") {
      this.updatePlaying(dt);
    } else if (this.state === "game_over") {
      // ゲームオーバー中のミダル倒れアニメーション継続
      this.player.update(dt, this.input, this.tileMap, this.yume);
      this.renderer.update(dt, this.player, this.tileMap);
    }

    // トーストタイマー
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        document.getElementById("toast")?.classList.add("hidden");
      }
    }
  }

  updatePlaying(dt) {
    const input = this.input;
    input.update(this.player, this.renderer.camera);

    // 武器切り替え入力
    if (input.switchWeaponIndex >= 0) {
      this.player.switchWeapon(input.switchWeaponIndex);
      this.showToast(`装備切替: ${this.player.currentWeapon.name}`);
    }
    if (input.cycleWeaponTriggered) {
      this.player.cycleWeapon();
      this.showToast(`装備切替: ${this.player.currentWeapon.name}`);
    }
    if (input.reloadTriggered) {
      this.player.startReload();
    }
    if (input.toggleArchiveTriggered) {
      this.openArchiveModal();
    }

    // 攻撃処理（クリック、スペース、タッチ射撃）
    if (input.slashTriggered) {
      const prevWIndex = this.player.currentWeaponIndex;
      this.player.currentWeaponIndex = 0; // 直刀
      this.player.attack(this.bullets, this.slashes, this.enemies);
      this.player.currentWeaponIndex = prevWIndex;
    } else if (input.attackTriggered || (input.isAttacking && this.player.currentWeapon.type === "smg")) {
      this.player.attack(this.bullets, this.slashes, this.enemies);
    }

    // プレイヤー更新
    this.player.update(dt, input, this.tileMap, this.yume);

    // ゲームオーバー判定（ミダルが倒れた場合）
    // 要件：ゲームオーバーはミダルが倒されることにより発生し、ユメへの被害は描写しない
    if (this.player.isDead) {
      if (this.player.deathTimer > 1.4) {
        this.triggerGameOver();
        return;
      }
    }

    // 同行者ユメ更新
    this.yume.update(dt, this.player, this.enemies, this.items, this.tileMap);

    // 敵怪異更新
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player, this.tileMap, this.bullets);

      if (!enemy.alive) {
        this.renderer.addBloodSpatter(enemy.x, enemy.y, 18, enemy.color);
        // ボス撃破時の処理
        if (enemy.typeKey === "BOSS") {
          this.tileMap.doorUnlocked = true;
          this.showToast("警告：被験体零号の沈黙を確認。地上脱出シャッターが解錠されました！");
          audio.playDoorOpen();
        }
        this.enemies.splice(i, 1);
      }
    }

    // 弾丸更新
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt, this.tileMap);

      if (!b.alive) {
        this.renderer.addSparks(b.x, b.y, 4);
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.isPlayer) {
        // プレイヤー弾 -> 敵判定
        for (const enemy of this.enemies) {
          if (!enemy.alive) continue;
          const dist = Math.hypot(enemy.x - b.x, enemy.y - b.y);
          if (dist <= enemy.radius + b.radius) {
            enemy.takeDamage(b.damage, Math.cos(b.angle), Math.sin(b.angle), b.knockback);
            this.renderer.addBloodSpatter(b.x, b.y, 6, enemy.color);
            b.alive = false;
            break;
          }
        }
      } else {
        // 敵の弾丸/毒針 -> プレイヤー判定
        const dist = Math.hypot(this.player.x - b.x, this.player.y - b.y);
        if (dist <= this.player.radius + b.radius) {
          this.player.takeDamage(b.damage);
          b.alive = false;
        }
      }

      if (!b.alive) {
        this.bullets.splice(i, 1);
      }
    }

    // 斬撃エフェクト更新
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.update(dt);
      if (!s.alive) {
        this.slashes.splice(i, 1);
      }
    }

    // アイテム更新 & 接触判定
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update(dt);

      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      if (dist <= this.player.radius + item.radius) {
        // アイテム取得
        if (item.type === "document") {
          this.collectDocument(item.payload);
          item.alive = false;
          this.items.splice(i, 1);
        } else if (item.type === "medkit") {
          if (this.player.hp < this.player.maxHp) {
            this.player.heal(45);
            this.showToast("生体修復スプレーを使用 (+45 HP)");
            item.alive = false;
            this.items.splice(i, 1);
          }
        } else if (item.type === "ammo_xdm") {
          this.player.addAmmo("ammo_xdm", 16);
          this.showToast("XDM-40 弾薬箱を入手 (+16発)");
          item.alive = false;
          this.items.splice(i, 1);
        } else if (item.type === "ammo_mp7") {
          this.player.addAmmo("ammo_mp7", 40);
          this.showToast("MP7A1 弾薬箱を入手 (+40発)");
          item.alive = false;
          this.items.splice(i, 1);
        } else if (item.type === "keycard") {
          this.player.hasKeycard = true;
          this.tileMap.doorUnlocked = true;
          this.showToast("セキュリティ認証キーカードを入手！ 隔壁ロックが解除されました");
          audio.playDoorOpen();
          item.alive = false;
          this.items.splice(i, 1);
        }
      }
    }

    // 出口ドア・次フロア遷移判定
    const exitDoor = this.tileMap.exitDoor;
    const ts = CONFIG.TILE_SIZE;
    const doorX = exitDoor.x * ts + ts / 2;
    const doorY = exitDoor.y * ts + ts / 2;
    const distToDoor = Math.hypot(this.player.x - doorX, this.player.y - doorY);

    if (distToDoor < ts * 0.95) {
      if (!this.tileMap.doorUnlocked) {
        if (input.interactTriggered) {
          this.showToast("【施錠中】セキュリティキーまたは封鎖解除が必要です");
          audio.playClickSound(audio.ctx?.currentTime || 0, 300, 0.1);
        }
      } else {
        if (exitDoor.targetFloor === 999) {
          this.triggerGameClear();
        } else {
          audio.playDoorOpen();
          this.loadFloor(exitDoor.targetFloor);
          this.showToast(`階層移動：${LEVELS[this.currentFloorIndex].name} へ到達`);
        }
      }
    }

    // レンダラーの更新
    this.renderer.update(dt, this.player, this.tileMap);

    // HUD更新
    this.updateHUD();

    // 入力トリガーリセット
    input.postUpdate();
  }

  // ===== 資料収集・モーダル表示 =====
  collectDocument(docId) {
    const doc = getDocumentById(docId);
    if (!doc) return;
    this.player.collectedDocuments.add(docId);
    audio.playDocOpen();
    this.openDocModal(doc);
  }

  openDocModal(doc) {
    this.state = "document_modal";
    const modal = document.getElementById("modal-doc");
    document.getElementById("doc-title").textContent = doc.title;
    document.getElementById("doc-meta").textContent = `分類: ${doc.category} | 記録階層: ${doc.floor} (${doc.location}) | 記録日: ${doc.date} | 執筆: ${doc.author}`;
    document.getElementById("doc-body").textContent = doc.content;
    modal.classList.remove("hidden");
  }

  closeDocModal() {
    document.getElementById("modal-doc").classList.add("hidden");
    this.state = "playing";
    this.showToast("資料を手帳アーカイブに保存しました (画面上のFILESで再読可能)");
  }

  // ===== アーカイブ手帳モーダル =====
  openArchiveModal() {
    this.state = "archive_modal";
    const modal = document.getElementById("modal-archive");
    const listEl = document.getElementById("archive-list");
    listEl.innerHTML = "";

    DOCUMENTS.forEach((doc, idx) => {
      const isCollected = this.player?.collectedDocuments.has(doc.id);
      const itemEl = document.createElement("div");
      itemEl.className = `archive-item ${isCollected ? "collected" : "locked"}`;
      itemEl.innerHTML = `
        <div class="archive-item-title">${isCollected ? doc.title : `【未解読機密ファイル #${idx + 1}】`}</div>
        <div class="archive-item-sub">${isCollected ? `${doc.floor} / ${doc.category} (タップして閲覧)` : "施設内を探索して回収せよ"}</div>
      `;
      if (isCollected) {
        itemEl.addEventListener("click", () => {
          modal.classList.add("hidden");
          this.openDocModal(doc);
        });
      }
      listEl.appendChild(itemEl);
    });

    modal.classList.remove("hidden");
  }

  closeArchiveModal() {
    document.getElementById("modal-archive").classList.add("hidden");
    this.state = "playing";
  }

  // ===== ゲームオーバー演出 =====
  // 要件：ゲームオーバーはミダルが倒されることにより発生し、ユメへの被害は描写しない
  triggerGameOver() {
    this.state = "game_over";
    document.getElementById("hud").classList.add("hidden");
    const screenGameOver = document.getElementById("screen-game-over");
    screenGameOver.classList.remove("hidden");
  }

  // ===== ゲームクリア演出 =====
  triggerGameClear() {
    this.state = "game_clear";
    document.getElementById("hud").classList.add("hidden");
    const screenClear = document.getElementById("screen-game-clear");
    screenClear.classList.remove("hidden");
  }

  // ===== HUD更新 =====
  updateHUD() {
    if (!this.player) return;

    // HPバー
    const hpRatio = Math.max(0, this.player.hp / this.player.maxHp);
    const hpBar = document.getElementById("hud-hp-bar");
    const hpText = document.getElementById("hud-hp-val");
    if (hpBar) hpBar.style.width = `${hpRatio * 100}%`;
    if (hpText) hpText.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;

    // スタミナバー
    const stRatio = Math.max(0, this.player.stamina / this.player.maxStamina);
    const stBar = document.getElementById("hud-stamina-bar");
    if (stBar) stBar.style.width = `${stRatio * 100}%`;

    // 武器情報
    const w = this.player.currentWeapon;
    const wName = document.getElementById("hud-weapon-name");
    const wAmmo = document.getElementById("hud-weapon-ammo");
    if (wName) wName.textContent = w.name;

    if (wAmmo) {
      if (w.type === "melee") {
        wAmmo.textContent = "装填: ∞ (直刀)";
      } else {
        const a = w.id === "XDM_40" ? this.player.ammo.XDM : this.player.ammo.MP7;
        const status = this.player.isReloading ? " [装填中...]" : "";
        wAmmo.textContent = `${a.clip} / ${a.reserve}${status}`;
      }
    }

    // 資料数カウント
    const docCount = document.getElementById("hud-doc-count");
    if (docCount) {
      docCount.textContent = `${this.player.collectedDocuments.size} / ${DOCUMENTS.length}`;
    }
  }

  showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    this.toastTimer = 3.5;
  }

  render() {
    if (this.state === "title") return;
    this.renderer.render(
      this.tileMap,
      this.player,
      this.yume,
      this.enemies,
      this.items,
      this.bullets,
      this.slashes
    );
  }
}

// ゲーム起動
window.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  game.startLoop();
});
