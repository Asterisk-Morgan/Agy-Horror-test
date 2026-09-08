// 敵「怪異」クラス群（生体兵器・都市伝説・未確認生命体）
import { CONFIG } from "../config.js";
import { audio } from "../audio.js";
import { Bullet } from "./bullet.js";

export class Enemy {
  constructor(x, y, typeKey) {
    this.x = x;
    this.y = y;
    this.typeKey = typeKey;
    const def = CONFIG.ENEMIES[typeKey] || CONFIG.ENEMIES.CHIMERA;

    this.name = def.name;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.speed = def.speed;
    this.baseSpeed = def.speed;
    this.radius = def.radius;
    this.damage = def.damage;
    this.attackCooldown = def.attackCooldown;
    this.attackCooldownTimer = Math.random() * 0.5;
    this.attackRange = def.attackRange;
    this.detectRadius = def.detectRadius;
    this.color = def.color;

    this.angle = Math.random() * Math.PI * 2;
    this.alive = true;
    this.isHitStunned = 0; // 被弾スタン時間
    this.knockbackVx = 0;
    this.knockbackVy = 0;

    // 行動状態
    this.state = "idle"; // "idle", "chase", "attack", "prep_attack"
    this.stateTimer = 0;
    this.animTime = Math.random() * 10;
    this.soundTimer = Math.random() * 3 + 2;

    // 特殊動作パラメータ
    this.extendedArmLength = 0; // 八尺の腕用
    this.chargeVx = 0;          // テケテケ突進用
    this.chargeVy = 0;
    this.isCharging = false;
    this.zigZagTimer = 0;       // 人面獣用
    this.zigZagDir = 1;
  }

  takeDamage(amount, kx = 0, ky = 0, kPower = 0) {
    if (!this.alive) return;
    this.hp -= amount;
    this.isHitStunned = 0.15; // 一瞬怯む
    audio.playEnemyHit();

    if (kPower > 0) {
      this.knockbackVx = kx * kPower;
      this.knockbackVy = ky * kPower;
    }

    if (this.hp <= 0) {
      this.alive = false;
      this.hp = 0;
    }
  }

  update(dt, player, tileMap, bulletsOut) {
    if (!this.alive) return;

    this.animTime += dt;
    this.soundTimer -= dt;
    if (this.soundTimer <= 0) {
      const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
      if (distToPlayer < 400) {
        audio.playEnemyGroan(this.typeKey);
      }
      this.soundTimer = Math.random() * 5 + 4;
    }

    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt;
    }

    // ノックバック減衰
    if (Math.hypot(this.knockbackVx, this.knockbackVy) > 1) {
      const nextX = this.x + this.knockbackVx * dt;
      const nextY = this.y + this.knockbackVy * dt;
      if (!tileMap.isSolid(nextX, this.y, this.radius)) this.x = nextX;
      if (!tileMap.isSolid(this.x, nextY, this.radius)) this.y = nextY;
      this.knockbackVx *= Math.max(0, 1 - dt * 8);
      this.knockbackVy *= Math.max(0, 1 - dt * 8);
    }

    // スタン中は移動停止
    if (this.isHitStunned > 0) {
      this.isHitStunned -= dt;
      return;
    }

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);

    // 視線・索敵判定 (壁遮蔽チェック簡易)
    const canSee = distToPlayer <= this.detectRadius && !tileMap.hasLineOfSightWall(this.x, this.y, player.x, player.y);

    switch (this.typeKey) {
      case "HACHISHAKU":
        this.updateHachishaku(dt, player, distToPlayer, angleToPlayer, canSee, tileMap);
        break;
      case "CHIMERA":
        this.updateChimera(dt, player, distToPlayer, angleToPlayer, canSee, tileMap);
        break;
      case "SLICER":
        this.updateSlicer(dt, player, distToPlayer, angleToPlayer, canSee, tileMap);
        break;
      case "SPORE":
        this.updateSpore(dt, player, distToPlayer, angleToPlayer, canSee, tileMap, bulletsOut);
        break;
      case "BOSS":
        this.updateBoss(dt, player, distToPlayer, angleToPlayer, canSee, tileMap, bulletsOut);
        break;
      default:
        this.updateChimera(dt, player, distToPlayer, angleToPlayer, canSee, tileMap);
    }
  }

  // 八尺の腕：伸縮アタック
  updateHachishaku(dt, player, dist, angle, canSee, tileMap) {
    this.angle = angle;
    if (canSee) {
      if (dist > this.attackRange * 0.8) {
        // 近づく
        this.moveTowards(Math.cos(angle), Math.sin(angle), this.speed * dt, tileMap);
      }

      if (dist <= this.attackRange && this.attackCooldownTimer <= 0) {
        // 腕を突き出して攻撃
        this.state = "attack";
        this.stateTimer = 0.4;
        this.extendedArmLength = this.attackRange;
        this.attackCooldownTimer = this.attackCooldown;
        // プレイヤーへのヒット
        if (dist <= this.attackRange) {
          player.takeDamage(this.damage);
        }
      }
    }

    if (this.state === "attack") {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = "idle";
        this.extendedArmLength = 0;
      }
    }
  }

  // 人面獣キメラ：高速ジグザグ走りと飛びつき
  updateChimera(dt, player, dist, angle, canSee, tileMap) {
    if (canSee) {
      this.zigZagTimer += dt * 8;
      if (this.zigZagTimer > Math.PI * 2) this.zigZagTimer -= Math.PI * 2;
      const perpAngle = angle + (Math.sin(this.zigZagTimer) * 0.65);
      this.angle = perpAngle;

      this.moveTowards(Math.cos(perpAngle), Math.sin(perpAngle), this.speed * dt, tileMap);

      if (dist <= this.attackRange && this.attackCooldownTimer <= 0) {
        player.takeDamage(this.damage);
        this.attackCooldownTimer = this.attackCooldown;
      }
    }
  }

  // 這行の刃（テケテケ）：直線超速突進
  updateSlicer(dt, player, dist, angle, canSee, tileMap) {
    if (this.isCharging) {
      // 突進中
      const moveDist = this.speed * 1.5 * dt;
      const nextX = this.x + this.chargeVx * moveDist;
      const nextY = this.y + this.chargeVy * moveDist;
      if (tileMap.isSolid(nextX, nextY, this.radius)) {
        // 壁に激突して停止
        this.isCharging = false;
        this.stateTimer = 0.8; // 壁激突スタン
      } else {
        this.x = nextX;
        this.y = nextY;
        const currentDist = Math.hypot(player.x - this.x, player.y - this.y);
        if (currentDist <= this.attackRange + player.radius && this.attackCooldownTimer <= 0) {
          player.takeDamage(this.damage);
          this.attackCooldownTimer = this.attackCooldown;
          this.isCharging = false;
        }
      }
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.isCharging = false;
    } else {
      // 突進準備・旋回
      if (this.stateTimer > 0) {
        this.stateTimer -= dt;
      } else if (canSee) {
        this.angle = angle;
        if (dist > 180) {
          this.moveTowards(Math.cos(angle), Math.sin(angle), this.speed * 0.6 * dt, tileMap);
        } else if (this.attackCooldownTimer <= 0) {
          // ロックオンして突進発動
          this.isCharging = true;
          this.stateTimer = 0.9;
          this.chargeVx = Math.cos(angle);
          this.chargeVy = Math.sin(angle);
          audio.playEnemyGroan("SLICER");
        }
      }
    }
  }

  // 生体結晶塊：胞子・棘散弾発射
  updateSpore(dt, player, dist, angle, canSee, tileMap, bulletsOut) {
    this.angle = angle;
    if (canSee) {
      if (dist > 160) {
        this.moveTowards(Math.cos(angle), Math.sin(angle), this.speed * dt, tileMap);
      }

      if (dist <= this.attackRange && this.attackCooldownTimer <= 0) {
        // 8方向に生体毒針を発射
        for (let i = 0; i < 8; i++) {
          const shootAngle = angle + (i * (Math.PI * 2 / 8)) - Math.PI / 8;
          bulletsOut.push(new Bullet(this.x, this.y, shootAngle, 260, this.damage, 60, 260, false, "#d05ce3"));
        }
        this.attackCooldownTimer = this.attackCooldown;
      }
    }
  }

  // ボス：被験体零号・ウロボロス
  updateBoss(dt, player, dist, angle, canSee, tileMap, bulletsOut) {
    this.angle = angle;
    this.stateTimer -= dt;

    if (dist > 100) {
      this.moveTowards(Math.cos(angle), Math.sin(angle), this.speed * dt, tileMap);
    }

    if (this.attackCooldownTimer <= 0) {
      const currentDist = Math.hypot(player.x - this.x, player.y - this.y);
      if (currentDist <= this.attackRange * 1.5) {
        // 至近距離：薙ぎ払い攻撃
        player.takeDamage(this.damage);
      } else {
        // 中・長距離：扇状酸性弾乱射
        for (let i = -2; i <= 2; i++) {
          const shootAngle = angle + i * 0.18;
          bulletsOut.push(new Bullet(this.x, this.y, shootAngle, 340, this.damage * 0.8, 80, 420, false, "#ff1744"));
        }
      }
      this.attackCooldownTimer = this.attackCooldown;
    }
  }

  moveTowards(dx, dy, distance, tileMap) {
    const nx = this.x + dx * distance;
    const ny = this.y + dy * distance;
    if (!tileMap.isSolid(nx, this.y, this.radius)) this.x = nx;
    if (!tileMap.isSolid(this.x, ny, this.radius)) this.y = ny;
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // 被弾フラッシュ
    const isFlashing = this.isHitStunned > 0;

    switch (this.typeKey) {
      case "HACHISHAKU":
        this.renderHachishaku(ctx, isFlashing);
        break;
      case "CHIMERA":
        this.renderChimera(ctx, isFlashing);
        break;
      case "SLICER":
        this.renderSlicer(ctx, isFlashing);
        break;
      case "SPORE":
        this.renderSpore(ctx, isFlashing);
        break;
      case "BOSS":
        this.renderBoss(ctx, isFlashing);
        break;
    }

    ctx.restore();

    // HPバー描画（ダメージを受けた敵のみ）
    if (this.hp < this.maxHp) {
      this.renderHpBar(ctx);
    }
  }

  renderHpBar(ctx) {
    const width = this.typeKey === "BOSS" ? 70 : 36;
    const height = 4;
    const x = this.x - width / 2;
    const y = this.y - this.radius - 12;
    const ratio = Math.max(0, this.hp / this.maxHp);

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(x - 1, y - 1, width + 2, height + 2);
    ctx.fillStyle = this.typeKey === "BOSS" ? "#ff1744" : "#ff5252";
    ctx.fillRect(x, y, width * ratio, height);
  }

  // 八尺の腕の描画
  renderHachishaku(ctx, isFlashing) {
    // 伸びる腕の描画
    if (this.extendedArmLength > 0) {
      ctx.strokeStyle = isFlashing ? "#ffffff" : "#cfd8dc";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(this.extendedArmLength, 0);
      ctx.stroke();

      // 鋭い爪
      ctx.fillStyle = "#ff1744";
      ctx.beginPath();
      ctx.arc(this.extendedArmLength, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 白装束の胴体
    ctx.fillStyle = isFlashing ? "#ffffff" : "#eceff1";
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#90a4ae";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 黒い長い髪
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(-4, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // 赤く光る双眸
    ctx.fillStyle = "#ff1744";
    ctx.fillRect(4, -4, 3, 2);
    ctx.fillRect(4, 3, 3, 2);
  }

  // 人面獣キメラの描画
  renderChimera(ctx, isFlashing) {
    // 四足の獣胴体
    ctx.fillStyle = isFlashing ? "#ffffff" : "#5d4037";
    ctx.beginPath();
    ctx.ellipse(-2, 0, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 不気味な人間の顔
    ctx.fillStyle = isFlashing ? "#ffffff" : "#ffccbc";
    ctx.beginPath();
    ctx.arc(10, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // 裂けた口
    ctx.strokeStyle = "#b71c1c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(11, -4);
    ctx.lineTo(15, 0);
    ctx.lineTo(11, 4);
    ctx.stroke();

    // 黒い濁った目
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.arc(12, -3, 1.5, 0, Math.PI * 2);
    ctx.arc(12, 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 這行の刃（テケテケ）の描画
  renderSlicer(ctx, isFlashing) {
    // 上半身装甲
    ctx.fillStyle = isFlashing ? "#ffffff" : "#455a64";
    ctx.beginPath();
    ctx.arc(-2, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // 背部の生体チューブ（脈動）
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-10, 5);
    ctx.stroke();

    // 両腕のチタンブレード
    ctx.strokeStyle = "#cfd8dc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(4, -12);
    ctx.lineTo(18, -16);
    ctx.moveTo(4, 12);
    ctx.lineTo(18, 16);
    ctx.stroke();

    // 刃の先端光
    ctx.fillStyle = "#00f0ff";
    ctx.beginPath();
    ctx.arc(18, -16, 2.5, 0, Math.PI * 2);
    ctx.arc(18, 16, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 生体結晶塊の描画
  renderSpore(ctx, isFlashing) {
    const pulse = 1 + Math.sin(this.animTime * 4) * 0.08;

    // 脈動する肉塊
    ctx.fillStyle = isFlashing ? "#ffffff" : "#4a148c";
    ctx.beginPath();
    ctx.arc(0, 0, 18 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 結晶スパイク
    ctx.fillStyle = "#ba68c8";
    for (let i = 0; i < 6; i++) {
      const spAngle = i * (Math.PI / 3);
      ctx.save();
      ctx.rotate(spAngle);
      ctx.beginPath();
      ctx.moveTo(14, -3);
      ctx.lineTo(24 * pulse, 0);
      ctx.lineTo(14, 3);
      ctx.fill();
      ctx.restore();
    }

    // 中心の核
    ctx.fillStyle = "#ff4081";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // ボス：被験体零号・ウロボロスの描画
  renderBoss(ctx, isFlashing) {
    const wiggle = Math.sin(this.animTime * 3) * 0.15;

    // 巨大な大蛇・キメラ体
    ctx.fillStyle = isFlashing ? "#ffffff" : "#263238";
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d50000";
    ctx.lineWidth = 3;
    ctx.stroke();

    // 発光する生体コア（弱点）
    ctx.fillStyle = "#ff1744";
    ctx.beginPath();
    ctx.arc(2, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // 複数の触手・首
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate(i * 0.35 + wiggle);
      ctx.strokeStyle = "#37474f";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(44, 0);
      ctx.stroke();

      ctx.fillStyle = "#ff5252";
      ctx.beginPath();
      ctx.arc(44, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
