// 弾丸・投射物・近接攻撃判定

export class Bullet {
  constructor(x, y, angle, speed, damage, knockback, range, isPlayer = true, color = "#ffea88") {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.knockback = knockback;
    this.range = range;
    this.isPlayer = isPlayer;
    this.color = color;
    this.alive = true;
    this.radius = isPlayer ? 3 : 5;
    this.distanceTraveled = 0;
  }

  update(dt, tileMap) {
    if (!this.alive) return;

    const dx = this.vx * dt;
    const dy = this.vy * dt;
    const nextX = this.x + dx;
    const nextY = this.y + dy;

    // 壁との衝突判定
    if (tileMap && tileMap.isSolid(nextX, nextY)) {
      this.alive = false;
      return;
    }

    this.x = nextX;
    this.y = nextY;
    this.distanceTraveled += Math.hypot(dx, dy);

    if (this.distanceTraveled >= this.range) {
      this.alive = false;
    }
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // 発光する弾丸トレイル
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.radius * 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(4, 0);
    ctx.stroke();

    // コアの光
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(2, 0, this.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// 直刀の斬撃エフェクト
export class SlashArc {
  constructor(x, y, angle, arc, radius, duration = 0.2) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.arc = arc;
    this.radius = radius;
    this.maxDuration = duration;
    this.duration = duration;
    this.alive = true;
  }

  update(dt) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
    }
  }

  render(ctx) {
    if (!this.alive) return;
    const progress = 1 - (this.duration / this.maxDuration);
    const alpha = Math.max(0, 1 - progress);

    ctx.save();
    ctx.translate(this.x, this.y);

    const startAngle = this.angle - this.arc / 2;
    const endAngle = this.angle + this.arc / 2;

    // 刀の青白い高周波衝撃波
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, startAngle, endAngle);
    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.9})`;
    ctx.lineWidth = 14 * (1 - progress * 0.5);
    ctx.stroke();

    // 内側の鋭い光
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.95, startAngle, endAngle);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
  }
}
