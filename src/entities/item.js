// 施設内アイテム（弾薬、回復、資料、キーカード）

export class Item {
  constructor(x, y, type, payload = null) {
    this.x = x;
    this.y = y;
    this.type = type; // "ammo_xdm", "ammo_mp7", "medkit", "document", "keycard"
    this.payload = payload; // documentId, keycardId など
    this.radius = 16;
    this.alive = true;
    this.hoverTime = Math.random() * Math.PI * 2;
    this.pulseColor = this.getPulseColor();
  }

  getPulseColor() {
    switch (this.type) {
      case "document": return "#00e5ff"; // 青緑発光（重要資料）
      case "ammo_xdm": return "#ffb300"; // 弾薬（黄色）
      case "ammo_mp7": return "#ff9100"; // 弾薬（オレンジ）
      case "medkit":   return "#00e676"; // 医療品（緑）
      case "keycard":  return "#ff3d00"; // キーカード（赤）
      default:         return "#ffffff";
    }
  }

  getLabel() {
    switch (this.type) {
      case "document": return "【研究資料】";
      case "ammo_xdm": return "XDM弾薬箱";
      case "ammo_mp7": return "MP7弾薬箱";
      case "medkit":   return "生体修復スプレー";
      case "keycard":  return "セキュリティキー";
      default:         return "アイテム";
    }
  }

  update(dt) {
    this.hoverTime += dt * 3;
  }

  render(ctx) {
    if (!this.alive) return;

    const bob = Math.sin(this.hoverTime) * 3;
    const pulseAlpha = 0.4 + Math.sin(this.hoverTime * 1.5) * 0.25;

    ctx.save();
    ctx.translate(this.x, this.y + bob);

    // 床の淡い発光オーラ
    const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
    auraGrad.addColorStop(0, this.pulseColor);
    auraGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // アイテムごとのアイコン描画
    if (this.type === "document") {
      // 端末・研究ファイル
      ctx.fillStyle = "#1c2a38";
      ctx.strokeStyle = this.pulseColor;
      ctx.lineWidth = 1.5;
      ctx.fillRect(-9, -12, 18, 24);
      ctx.strokeRect(-9, -12, 18, 24);

      // モニターライン
      ctx.fillStyle = this.pulseColor;
      ctx.fillRect(-6, -8, 12, 3);
      ctx.fillRect(-6, -2, 8, 2);
      ctx.fillRect(-6, 3, 10, 2);
      ctx.fillRect(-6, 7, 6, 2);
    } else if (this.type === "medkit") {
      // 救急スプレー/ケース
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#00c853";
      ctx.lineWidth = 2;
      ctx.fillRect(-10, -8, 20, 16);
      ctx.strokeRect(-10, -8, 20, 16);

      // 緑十字
      ctx.fillStyle = "#00c853";
      ctx.fillRect(-3, -6, 6, 12);
      ctx.fillRect(-6, -3, 12, 6);
    } else if (this.type.startsWith("ammo")) {
      // アーモボックス
      ctx.fillStyle = "#37474f";
      ctx.strokeStyle = this.pulseColor;
      ctx.lineWidth = 2;
      ctx.fillRect(-10, -7, 20, 14);
      ctx.strokeRect(-10, -7, 20, 14);

      // 弾丸マーク
      ctx.fillStyle = this.pulseColor;
      ctx.fillRect(-5, -4, 4, 8);
      ctx.fillRect(1, -4, 4, 8);
    } else if (this.type === "keycard") {
      // カードキー
      ctx.fillStyle = "#d50000";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.fillRect(-11, -7, 22, 14);
      ctx.strokeRect(-11, -7, 22, 14);

      // チップ
      ctx.fillStyle = "#ffd600";
      ctx.fillRect(-7, -4, 5, 8);
    }

    ctx.restore();
  }
}
