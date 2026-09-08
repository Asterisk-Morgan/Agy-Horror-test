// 主人公：黒いコートを着た青年「ミダル」
import { CONFIG } from "../config.js";
import { audio } from "../audio.js";
import { Bullet, SlashArc } from "./bullet.js";

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0; // 向いている角度（ラジアン）
    this.radius = CONFIG.PLAYER.RADIUS;

    this.maxHp = CONFIG.PLAYER.MAX_HP;
    this.hp = this.maxHp;
    this.maxStamina = CONFIG.PLAYER.MAX_STAMINA;
    this.stamina = this.maxStamina;

    // 武器管理
    this.weapons = [
      CONFIG.WEAPONS.KATANA,
      CONFIG.WEAPONS.XDM_40,
      CONFIG.WEAPONS.MP7A1
    ];
    this.currentWeaponIndex = 0; // 0: KATANA, 1: XDM-40, 2: MP7A1

    // 弾薬管理
    this.ammo = {
      XDM: { ...CONFIG.PLAYER.INITIAL_AMMO.XDM },
      MP7: { ...CONFIG.PLAYER.INITIAL_AMMO.MP7 }
    };

    // クールダウン・リロード管理
    this.attackCooldown = 0;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.muzzleFlashTimer = 0;
    this.slashAnimTimer = 0;

    // 被弾・無敵・死亡状態
    this.invincibleTimer = 0;
    this.isDead = false;
    this.deathTimer = 0; // 倒れ込み演出用

    // キーカード所持
    this.hasKeycard = false;
    this.collectedDocuments = new Set();
  }

  get currentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }

  switchWeapon(index) {
    if (this.isDead) return;
    if (index >= 0 && index < this.weapons.length && index !== this.currentWeaponIndex) {
      this.isReloading = false;
      this.reloadTimer = 0;
      this.currentWeaponIndex = index;
      audio.playClickSound(audio.ctx ? audio.ctx.currentTime : 0, 700, 0.05);
    }
  }

  cycleWeapon() {
    if (this.isDead) return;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    audio.playClickSound(audio.ctx ? audio.ctx.currentTime : 0, 700, 0.05);
  }

  startReload() {
    if (this.isDead || this.isReloading) return;
    const w = this.currentWeapon;
    if (w.type === "melee") return;

    const ammoData = w.id === "XDM_40" ? this.ammo.XDM : this.ammo.MP7;
    if (ammoData.clip < ammoData.maxClip && ammoData.reserve > 0) {
      this.isReloading = true;
      this.reloadTimer = w.reloadTime;
      audio.playReload();
    }
  }

  takeDamage(amount) {
    if (this.isDead || this.invincibleTimer > 0) return;
    this.hp -= amount;
    this.invincibleTimer = 0.55;
    audio.playPlayerHurt();
    audio.setPlayerHpRatio(this.hp / this.maxHp);

    if (navigator.vibrate) {
      try { navigator.vibrate(100); } catch (_) {}
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.deathTimer = 0;
      audio.playPlayerDeath();
    }
  }

  heal(amount) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    audio.setPlayerHpRatio(this.hp / this.maxHp);
    audio.playItemPickup();
  }

  addAmmo(type, amount) {
    if (type === "ammo_xdm") {
      this.ammo.XDM.reserve += amount;
      audio.playItemPickup();
    } else if (type === "ammo_mp7") {
      this.ammo.MP7.reserve += amount;
      audio.playItemPickup();
    }
  }

  resetState(x, y) {
    this.x = x;
    this.y = y;
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.isDead = false;
    this.deathTimer = 0;
    this.invincibleTimer = 0;
    this.attackCooldown = 0;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.slashAnimTimer = 0;
    this.muzzleFlashTimer = 0;
  }

  // 直刀斬撃の実行（直刀攻撃・クイック直刀共通）
  executeKatanaSlash(slashOut, enemies) {
    const w = CONFIG.WEAPONS.KATANA;
    if (this.stamina < w.staminaCost) return false;
    this.stamina -= w.staminaCost;
    this.attackCooldown = w.cooldown;
    this.slashAnimTimer = 0.22;
    audio.playKatanaSwing();

    slashOut.push(new SlashArc(this.x, this.y, this.angle, w.arc, w.range));

    // 扇状範囲内の敵への判定
    let hitAny = false;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= w.range + enemy.radius) {
        const enemyAngle = Math.atan2(dy, dx);
        let diffAngle = enemyAngle - this.angle;
        while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
        while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;

        if (Math.abs(diffAngle) <= w.arc / 2) {
          const kx = Math.cos(this.angle);
          const ky = Math.sin(this.angle);
          enemy.takeDamage(w.damage, kx, ky, w.knockback);
          hitAny = true;
        }
      }
    }
    if (hitAny) {
      audio.playKatanaHit();
    }
    return true;
  }

  // クイック直刀（右クリック / Fキー / 【刀】ボタン）
  // 銃装備中やリロード中であっても緊急直刀攻撃が可能
  quickSlash(slashOut, enemies) {
    if (this.isDead || this.attackCooldown > 0) return false;
    // リロード中に刀を振る場合はリロードを中断
    if (this.isReloading) {
      this.isReloading = false;
      this.reloadTimer = 0;
    }
    return this.executeKatanaSlash(slashOut, enemies);
  }

  attack(bulletsOut, slashOut, enemies) {
    if (this.isDead || this.attackCooldown > 0 || this.isReloading) return false;
    const w = this.currentWeapon;

    if (w.type === "melee") {
      return this.executeKatanaSlash(slashOut, enemies);
    } else {
      // 遠距離武器（XDM-40 / MP7A1）
      const ammoData = w.id === "XDM_40" ? this.ammo.XDM : this.ammo.MP7;

      if (ammoData.clip <= 0) {
        audio.playDryFire();
        this.startReload();
        return false;
      }

      ammoData.clip--;
      this.attackCooldown = w.cooldown;
      this.muzzleFlashTimer = 0.06;

      // 弾丸の散布角
      const spreadAngle = (Math.random() - 0.5) * w.spread;
      const bulletAngle = this.angle + spreadAngle;

      // 銃口位置のオフセット
      const muzzleX = this.x + Math.cos(this.angle) * 22 + Math.cos(this.angle + Math.PI / 2) * 6;
      const muzzleY = this.y + Math.sin(this.angle) * 22 + Math.sin(this.angle + Math.PI / 2) * 6;

      bulletsOut.push(new Bullet(muzzleX, muzzleY, bulletAngle, w.speed, w.damage, w.knockback, w.range, true));

      if (w.id === "XDM_40") {
        audio.playPistolShot();
      } else {
        audio.playSmgShot();
      }

      if (navigator.vibrate) {
        try { navigator.vibrate(w.id === "XDM_40" ? 40 : 20); } catch (_) {}
      }

      return true;
    }
  }

  update(dt, input, tileMap, yume) {
    if (this.isDead) {
      this.deathTimer += dt;
      return;
    }

    // クールダウンとタイマー更新
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.muzzleFlashTimer > 0) this.muzzleFlashTimer -= dt;
    if (this.slashAnimTimer > 0) this.slashAnimTimer -= dt;

    // リロード処理
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        const w = this.currentWeapon;
        const ammoData = w.id === "XDM_40" ? this.ammo.XDM : this.ammo.MP7;
        const needed = ammoData.maxClip - ammoData.clip;
        const loaded = Math.min(needed, ammoData.reserve);
        ammoData.clip += loaded;
        ammoData.reserve -= loaded;
      }
    }

    // スタミナ回復（ユメの近くにいると強化）
    const distToYume = Math.hypot(yume.x - this.x, yume.y - this.y);
    const nearYume = distToYume <= CONFIG.YUME.AURA_RADIUS;
    const recoveryRate = nearYume ? CONFIG.PLAYER.STAMINA_RECOVERY_NEAR_YUME : CONFIG.PLAYER.STAMINA_RECOVERY;
    this.stamina = Math.min(this.maxStamina, this.stamina + recoveryRate * dt);

    // 向きの更新（マウスポインタまたはタッチ照準）
    if (input.aimActive) {
      this.angle = input.aimAngle;
    } else if (input.moveLength > 0.1) {
      this.angle = input.moveAngle;
    }

    // 移動処理
    if (input.moveLength > 0.05) {
      const isDashing = input.isDashing && this.stamina > 5;
      if (isDashing) {
        this.stamina = Math.max(0, this.stamina - 20 * dt);
      }
      const speed = isDashing ? CONFIG.PLAYER.SPEED_DASH : CONFIG.PLAYER.SPEED_WALK;
      const moveDist = speed * input.moveLength * dt;

      const nx = this.x + Math.cos(input.moveAngle) * moveDist;
      const ny = this.y + Math.sin(input.moveAngle) * moveDist;

      // 壁との衝突スライディング
      if (!tileMap.isSolid(nx, this.y, this.radius)) this.x = nx;
      if (!tileMap.isSolid(this.x, ny, this.radius)) this.y = ny;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 死亡時：倒れ込み演出（血溜まりと倒れた体）
    if (this.isDead) {
      const bloodRadius = Math.min(30, this.deathTimer * 20);
      ctx.fillStyle = "rgba(160, 0, 0, 0.75)";
      ctx.beginPath();
      ctx.arc(0, 0, bloodRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(this.angle + Math.PI / 2);
      // 倒れた黒いコート
      ctx.fillStyle = "#111417";
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 影
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 9, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 被弾時明滅
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.rotate(this.angle);

    // ===== 黒いコートを着たミダルの描画 =====
    // コートの裾（後方）
    ctx.fillStyle = "#121519";
    ctx.beginPath();
    ctx.moveTo(-10, -11);
    ctx.lineTo(-20, -8);
    ctx.lineTo(-20, 8);
    ctx.lineTo(-10, 11);
    ctx.closePath();
    ctx.fill();

    // 胴体（黒コート・防刃ベスト）
    ctx.fillStyle = "#1c2024";
    ctx.beginPath();
    ctx.ellipse(-2, 0, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2e3440";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ベルト・ハーネス
    ctx.strokeStyle = "#434c5e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(-5, 10);
    ctx.stroke();

    // 頭部・黒髪
    ctx.fillStyle = "#0f1115";
    ctx.beginPath();
    ctx.arc(2, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // 武器ごとの腕と武器グラフィック
    const w = this.currentWeapon;
    if (this.slashAnimTimer > 0 || w.id === "KATANA") {
      // 直刀：右手に刀を構える / 斬撃モーション
      ctx.fillStyle = "#1c2024";
      ctx.beginPath();
      ctx.arc(8, 8, 4, 0, Math.PI * 2); // 右腕
      ctx.fill();

      // 刀身（高周波の青白い直刀）
      const slashAngleOffset = this.slashAnimTimer > 0 ? (0.22 - this.slashAnimTimer) * 4 : 0;
      ctx.save();
      ctx.translate(10, 8);
      ctx.rotate(-0.3 + slashAngleOffset);

      // 鍔と柄
      ctx.fillStyle = "#2e3440";
      ctx.fillRect(-2, -2, 6, 4);
      // 刃
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(28, 0);
      ctx.stroke();
      // 刃の白ハイライト
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(4, -0.5);
      ctx.lineTo(28, -0.5);
      ctx.stroke();

      ctx.restore();
    } else if (w.id === "XDM_40") {
      // XDM-40：両手で構えるハンドガン
      ctx.fillStyle = "#1c2024";
      ctx.beginPath();
      ctx.arc(10, -4, 3.5, 0, Math.PI * 2);
      ctx.arc(10, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // ガン本体
      ctx.fillStyle = "#3b4252";
      ctx.fillRect(10, -2.5, 12, 5);
      ctx.fillStyle = "#2e3440";
      ctx.fillRect(8, -1.5, 5, 3);

      // マズルフラッシュ
      if (this.muzzleFlashTimer > 0) {
        ctx.fillStyle = "#ffe066";
        ctx.beginPath();
        ctx.arc(24, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(24, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (w.id === "MP7A1") {
      // MP7A1：フォアグリップとストックを構えるPDW
      ctx.fillStyle = "#1c2024";
      ctx.beginPath();
      ctx.arc(8, -5, 3.5, 0, Math.PI * 2); // 左手
      ctx.arc(13, 3, 3.5, 0, Math.PI * 2);  // 右手
      ctx.fill();

      // サブマシンガン本体
      ctx.fillStyle = "#434c5e";
      ctx.fillRect(6, -3, 16, 6);
      ctx.fillStyle = "#2e3440";
      ctx.fillRect(10, 3, 4, 7); // マガジン

      // マズルフラッシュ
      if (this.muzzleFlashTimer > 0) {
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.arc(24, -0.5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(24, -0.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
