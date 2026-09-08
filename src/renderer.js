// レンダリングエンジン・懐中電灯ライティング・パーティクルシステム
import { CONFIG } from "./config.js";

export class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.alive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.95;
    this.vy *= 0.95;
  }

  render(ctx) {
    if (!this.alive) return;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.camera = { x: 0, y: 0 };
    this.particles = [];

    // 暗闇キャンバス（オフスクリーンでライティングマスク作成）
    this.lightCanvas = document.createElement("canvas");
    this.lightCtx = this.lightCanvas.getContext("2d");
    this.resizeLightCanvas();

    // 蛍光灯フリッカー
    this.flickerTimer = 0;
    this.flickerIntensity = 1.0;
  }

  resizeLightCanvas() {
    this.lightCanvas.width = this.canvas.width;
    this.lightCanvas.height = this.canvas.height;
  }

  addBloodSpatter(x, y, count = 10, color = "#b71c1c") {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 40;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        Math.random() * 2.5 + 1.5,
        Math.random() * 0.4 + 0.3
      ));
    }
  }

  addSparks(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 60;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        "#ffe082",
        Math.random() * 1.5 + 1,
        Math.random() * 0.2 + 0.1
      ));
    }
  }

  update(dt, player, tileMap) {
    // カメラをプレイヤーにスムーズ追従
    const targetCamX = player.x - this.canvas.width / 2;
    const targetCamY = player.y - this.canvas.height / 2;

    const maxCamX = Math.max(0, tileMap.gridWidth * tileMap.tileSize - this.canvas.width);
    const maxCamY = Math.max(0, tileMap.gridHeight * tileMap.tileSize - this.canvas.height);

    const clampedX = Math.max(0, Math.min(maxCamX, targetCamX));
    const clampedY = Math.max(0, Math.min(maxCamY, targetCamY));

    this.camera.x += (clampedX - this.camera.x) * Math.min(1, dt * 8);
    this.camera.y += (clampedY - this.camera.y) * Math.min(1, dt * 8);

    // パーティクル更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (!p.alive) {
        this.particles.splice(i, 1);
      }
    }

    // ホラー的フリッカー（時折チカチカする暗闇）
    this.flickerTimer -= dt;
    if (this.flickerTimer <= 0) {
      if (Math.random() < 0.08) {
        this.flickerIntensity = 0.65 + Math.random() * 0.4;
        this.flickerTimer = 0.08;
      } else {
        this.flickerIntensity = 1.0;
        this.flickerTimer = Math.random() * 4 + 2;
      }
    }
  }

  render(tileMap, player, yume, enemies, items, bullets, slashes) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // ===== 1. ワールドオブジェクト描画（カメラ空間） =====
    ctx.save();
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    // マップタイル
    tileMap.render(ctx);

    // アイテム
    for (const item of items) {
      item.render(ctx);
    }

    // 同行者ユメ
    yume.render(ctx);

    // プレイヤーミダル
    player.render(ctx);

    // 敵怪異
    for (const enemy of enemies) {
      enemy.render(ctx);
    }

    // 弾丸
    for (const bullet of bullets) {
      bullet.render(ctx);
    }

    // 直刀斬撃
    for (const slash of slashes) {
      slash.render(ctx);
    }

    // パーティクル
    for (const p of this.particles) {
      p.render(ctx);
    }

    ctx.restore();

    // ===== 2. 動的ライティング・懐中電灯・暗闇レイヤー =====
    this.renderLighting(player, yume, items);

    // 画面に暗闇レイヤーを合成
    ctx.drawImage(this.lightCanvas, 0, 0);

    // ===== 3. 被弾時・危機時のビネット・画面エフェクト =====
    if (player.invincibleTimer > 0) {
      ctx.fillStyle = `rgba(220, 20, 20, ${player.invincibleTimer * 0.35})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // HP危機時の赤色心拍ビネット
    const hpRatio = player.hp / player.maxHp;
    if (hpRatio < 0.45) {
      const dangerAlpha = (0.45 - hpRatio) * 0.75 * (0.8 + Math.sin(Date.now() * 0.008) * 0.2);
      const vigGrad = ctx.createRadialGradient(
        this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.25,
        this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.65
      );
      vigGrad.addColorStop(0, "rgba(0,0,0,0)");
      vigGrad.addColorStop(1, `rgba(180, 0, 0, ${dangerAlpha})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // 懐中電灯＆アンビエントライティング
  renderLighting(player, yume, items) {
    const lctx = this.lightCtx;
    lctx.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    // 全体を深い暗闇で塗りつぶす
    lctx.fillStyle = "rgba(4, 7, 12, 0.94)";
    lctx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    // 光源を destination-out（暗闇をくり抜く）で描画
    lctx.globalCompositeOperation = "destination-out";

    const screenPx = player.x - this.camera.x;
    const screenPy = player.y - this.camera.y;

    // A. ミダルの懐中電灯（扇状ビーム）
    const flashDist = 320 * this.flickerIntensity;
    const flashSpread = 0.55; // 約63度

    const beamGrad = lctx.createRadialGradient(screenPx, screenPy, 10, screenPx, screenPy, flashDist);
    beamGrad.addColorStop(0, "rgba(0,0,0,1)");
    beamGrad.addColorStop(0.65, "rgba(0,0,0,0.85)");
    beamGrad.addColorStop(1, "rgba(0,0,0,0)");

    lctx.fillStyle = beamGrad;
    lctx.beginPath();
    lctx.moveTo(screenPx, screenPy);
    lctx.arc(screenPx, screenPy, flashDist, player.angle - flashSpread, player.angle + flashSpread);
    lctx.closePath();
    lctx.fill();

    // B. ミダルの周囲の微弱アンビエント光
    const playerAmbGrad = lctx.createRadialGradient(screenPx, screenPy, 5, screenPx, screenPy, 80);
    playerAmbGrad.addColorStop(0, "rgba(0,0,0,0.9)");
    playerAmbGrad.addColorStop(1, "rgba(0,0,0,0)");
    lctx.fillStyle = playerAmbGrad;
    lctx.beginPath();
    lctx.arc(screenPx, screenPy, 80, 0, Math.PI * 2);
    lctx.fill();

    // C. ユメの生体共鳴オーラ（足元の柔らかな光）
    const screenYx = yume.x - this.camera.x;
    const screenYy = yume.y - this.camera.y;
    const yumeGrad = lctx.createRadialGradient(screenYx, screenYy, 5, screenYx, screenYy, 100);
    yumeGrad.addColorStop(0, "rgba(0,0,0,0.75)");
    yumeGrad.addColorStop(1, "rgba(0,0,0,0)");
    lctx.fillStyle = yumeGrad;
    lctx.beginPath();
    lctx.arc(screenYx, screenYy, 100, 0, Math.PI * 2);
    lctx.fill();

    // D. 重要アイテム（資料など）の微かな光
    for (const item of items) {
      if (!item.alive) continue;
      const ix = item.x - this.camera.x;
      const iy = item.y - this.camera.y;
      const itemGrad = lctx.createRadialGradient(ix, iy, 2, ix, iy, 40);
      itemGrad.addColorStop(0, "rgba(0,0,0,0.6)");
      itemGrad.addColorStop(1, "rgba(0,0,0,0)");
      lctx.fillStyle = itemGrad;
      lctx.beginPath();
      lctx.arc(ix, iy, 40, 0, Math.PI * 2);
      lctx.fill();
    }

    // 元の描画モードに戻す
    lctx.globalCompositeOperation = "source-over";
  }
}
