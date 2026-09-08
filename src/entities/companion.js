// 同行者：少女「ユメ」
import { CONFIG } from "../config.js";

export class Companion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.YUME.RADIUS;
    this.speed = CONFIG.YUME.SPEED;
    this.angle = 0;
    this.isHiding = false; // 戦闘時に身をすくめる
    this.animTime = 0;
    this.auraPulse = 0;

    // メッセージ吹き出し
    this.dialogueText = "";
    this.dialogueTimer = 0;
    this.shoutCooldown = 0;
  }

  say(text, duration = 3.5) {
    this.dialogueText = text;
    this.dialogueTimer = duration;
  }

  update(dt, player, enemies, items, tileMap) {
    this.animTime += dt;
    this.auraPulse += dt * 2.5;

    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= dt;
      if (this.dialogueTimer <= 0) {
        this.dialogueText = "";
      }
    }

    if (this.shoutCooldown > 0) {
      this.shoutCooldown -= dt;
    }

    // 近くの敵の存在チェック
    let nearestEnemyDist = 9999;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (d < nearestEnemyDist) nearestEnemyDist = d;
    }

    // 敵が近い場合（180px以内）は身をすくめる
    const wasHiding = this.isHiding;
    this.isHiding = nearestEnemyDist < 180;

    if (this.isHiding && !wasHiding && this.shoutCooldown <= 0) {
      const screamList = [
        "きゃっ……！ 怪異が……！",
        "ミダルさん、気をつけて……！",
        "あそこから気配が来ます……！"
      ];
      this.say(screamList[Math.floor(Math.random() * screamList.length)], 2.5);
      this.shoutCooldown = 6.0;
    }

    // プレイヤー死亡時の挙動（ユメへの危害は描写せず、駆け寄って案じる）
    if (player.isDead) {
      this.angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.isHiding = true;
      if (this.dialogueTimer <= 0 && this.dialogueText === "") {
        this.say("ミダルさん……！？ そんな、目を開けてください……！", 5.0);
      }
      return;
    }

    // プレイヤーへの追従ロジック
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
    this.angle = angleToPlayer;

    // 長距離スタック救済：壁の角などで450px以上離れてしまった場合、プレイヤーの周囲にワープ
    if (distToPlayer > 450) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const testX = player.x + Math.cos(angle) * 40;
        const testY = player.y + Math.sin(angle) * 40;
        if (!tileMap.isSolid(testX, testY, this.radius)) {
          this.x = testX;
          this.y = testY;
          break;
        }
      }
      return;
    }

    // ミダルの背後（ミダルの向きの逆側）を目標位置にする
    let targetOffsetX = -Math.cos(player.angle) * CONFIG.YUME.FOLLOW_DIST_MIN;
    let targetOffsetY = -Math.sin(player.angle) * CONFIG.YUME.FOLLOW_DIST_MIN;
    let targetX = player.x + targetOffsetX;
    let targetY = player.y + targetOffsetY;

    // もし背後が壁の中にめり込んでいる場合は、プレイヤー本体の位置を目標にする
    if (tileMap.isSolid(targetX, targetY, this.radius)) {
      targetX = player.x;
      targetY = player.y;
    }

    const distToTarget = Math.hypot(targetX - this.x, targetY - this.y);

    if (distToTarget > 18) {
      const moveAngle = Math.atan2(targetY - this.y, targetX - this.x);
      const moveSpeed = distToPlayer > CONFIG.YUME.FOLLOW_DIST_MAX ? this.speed * 1.4 : this.speed;
      const nx = this.x + Math.cos(moveAngle) * moveSpeed * dt;
      const ny = this.y + Math.sin(moveAngle) * moveSpeed * dt;

      if (!tileMap.isSolid(nx, this.y, this.radius)) this.x = nx;
      if (!tileMap.isSolid(this.x, ny, this.radius)) this.y = ny;
    }

    // 近くに未読の資料やアイテムがある場合、時々教えてくれる
    if (this.dialogueTimer <= 0 && Math.random() < 0.005) {
      for (const item of items) {
        if (!item.alive) continue;
        const d = Math.hypot(item.x - this.x, item.y - this.y);
        if (d < 120) {
          if (item.type === "document") {
            this.say("ミダルさん、研究の資料が落ちています……！");
          } else if (item.type === "medkit") {
            this.say("ミダルさん、治療用のスプレーがあります！");
          } else if (item.type.startsWith("ammo")) {
            this.say("銃の弾薬箱を見つけました。");
          } else if (item.type === "keycard") {
            this.say("あそこに赤いキーカードがあります！");
          }
          break;
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 共鳴オーラ（足元の神秘的な青白い光輪）
    const auraAlpha = 0.12 + Math.sin(this.auraPulse) * 0.05;
    ctx.fillStyle = `rgba(160, 230, 255, ${auraAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.YUME.AURA_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // 影
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(this.angle);

    // 少女ユメの描画（白と淡い水色の研究服、髪）
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-2, 0, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b0bec5";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 髪（銀髪・淡いペールブルーの長髪）
    ctx.fillStyle = "#cfd8dc";
    ctx.beginPath();
    ctx.arc(-4, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // 頭部
    ctx.fillStyle = "#ffe0b2";
    ctx.beginPath();
    ctx.arc(4, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // 瞳（澄んだ青い目）
    ctx.fillStyle = "#0288d1";
    ctx.fillRect(7, -3, 2, 2);
    ctx.fillRect(7, 1, 2, 2);

    // 怯えポーズ時の腕
    if (this.isHiding) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(6, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // メッセージ吹き出しの描画
    if (this.dialogueText) {
      this.renderDialogueBubble(ctx);
    }
  }

  renderDialogueBubble(ctx) {
    ctx.save();
    ctx.font = "12px 'Segoe UI', 'Hiragino Sans', sans-serif";
    const textWidth = ctx.measureText(this.dialogueText).width;
    const pad = 8;
    const bubbleW = textWidth + pad * 2;
    const bubbleH = 24;
    const bx = this.x - bubbleW / 2;
    const by = this.y - this.radius - 36;

    // 吹き出し背景
    ctx.fillStyle = "rgba(10, 20, 30, 0.9)";
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 1.5;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(bx, by, bubbleW, bubbleH, 6);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(bx, by, bubbleW, bubbleH);
      ctx.strokeRect(bx, by, bubbleW, bubbleH);
    }

    // 吹き出しの三角
    ctx.fillStyle = "rgba(10, 20, 30, 0.9)";
    ctx.beginPath();
    ctx.moveTo(this.x - 5, by + bubbleH);
    ctx.lineTo(this.x + 5, by + bubbleH);
    ctx.lineTo(this.x, by + bubbleH + 6);
    ctx.closePath();
    ctx.fill();

    // テキスト
    ctx.fillStyle = "#e1f5fe";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.dialogueText, this.x, by + bubbleH / 2);
    ctx.restore();
  }
}
