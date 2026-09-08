// タイルマップ・衝突判定・描画
import { CONFIG } from "../config.js";

export class TileMap {
  constructor(levelData) {
    this.levelData = levelData;
    this.tileSize = CONFIG.TILE_SIZE;
    this.gridWidth = levelData.gridWidth;
    this.gridHeight = levelData.gridHeight;
    this.grid = levelData.grid;
    this.exitDoor = levelData.exitDoor;

    // ドア状態
    this.doorUnlocked = !this.exitDoor.requiresKey;
    this.doorOpen = false;

    // 床のランダムテクスチャ装飾用シード
    this.floorDetails = [];
    for (let r = 0; r < this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const hash = (r * 31 + c * 17) % 100;
        this.floorDetails.push(hash);
      }
    }
  }

  getTile(gx, gy) {
    if (gx < 0 || gx >= this.gridWidth || gy < 0 || gy >= this.gridHeight) {
      return "1"; // 外側は壁
    }
    return this.grid[gy][gx];
  }

  isSolid(x, y, radius = 0) {
    const minGx = Math.floor((x - radius) / this.tileSize);
    const maxGx = Math.floor((x + radius) / this.tileSize);
    const minGy = Math.floor((y - radius) / this.tileSize);
    const maxGy = Math.floor((y + radius) / this.tileSize);

    for (let gy = minGy; gy <= maxGy; gy++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        const tile = this.getTile(gx, gy);
        // 1: 壁, 3: 培養ポッド (障害物)
        if (tile === "1" || tile === "3") {
          return true;
        }
        // 2: ドア (ロックされている時は通行不可)
        if (tile === "2" && !this.doorOpen) {
          return true;
        }
      }
    }
    return false;
  }

  // 2点間の直線上に壁があるか（視線遮蔽判定）
  hasLineOfSightWall(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist / (this.tileSize * 0.4));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = x1 + (x2 - x1) * t;
      const checkY = y1 + (y2 - y1) * t;
      const gx = Math.floor(checkX / this.tileSize);
      const gy = Math.floor(checkY / this.tileSize);
      const tile = this.getTile(gx, gy);
      if (tile === "1" || tile === "3") return true;
      if (tile === "2" && !this.doorOpen) return true;
    }
    return false;
  }

  // タイルの描画
  render(ctx) {
    for (let gy = 0; gy < this.gridHeight; gy++) {
      for (let gx = 0; gx < this.gridWidth; gx++) {
        const tile = this.grid[gy][gx];
        const px = gx * this.tileSize;
        const py = gy * this.tileSize;
        const detailIndex = gy * this.gridWidth + gx;
        const detail = this.floorDetails[detailIndex];

        if (tile === "1") {
          // 金属強化壁
          this.renderWall(ctx, px, py, gx, gy);
        } else if (tile === "3") {
          // 生体培養ポッド（障害物）
          this.renderPod(ctx, px, py);
        } else if (tile === "2") {
          // セキュリティ隔壁ドア
          this.renderDoor(ctx, px, py);
        } else {
          // 床（研究施設金属パネル）
          this.renderFloor(ctx, px, py, detail);
        }
      }
    }
  }

  renderFloor(ctx, px, py, detail) {
    // パネル地色
    ctx.fillStyle = "#182029";
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    // グリッド線
    ctx.strokeStyle = "rgba(45, 60, 80, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, this.tileSize - 1, this.tileSize - 1);

    // リベットや汚し
    if (detail > 80) {
      // 血痕/変異体液の染み
      ctx.fillStyle = "rgba(90, 10, 15, 0.35)";
      ctx.beginPath();
      ctx.arc(px + 20, py + 22, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (detail < 15) {
      // 換気スリット
      ctx.fillStyle = "#10161c";
      ctx.fillRect(px + 8, py + 12, this.tileSize - 16, 4);
      ctx.fillRect(px + 8, py + 22, this.tileSize - 16, 4);
      ctx.fillRect(px + 8, py + 32, this.tileSize - 16, 4);
    }
  }

  renderWall(ctx, px, py, gx, gy) {
    // 重厚な鋼鉄防壁
    ctx.fillStyle = "#0d131a";
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    // 上部リムハイライト
    ctx.fillStyle = "#223040";
    ctx.fillRect(px, py, this.tileSize, 4);

    // 装甲プレートスリット
    ctx.strokeStyle = "#172330";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 3, py + 5, this.tileSize - 6, this.tileSize - 8);

    // ボルト
    ctx.fillStyle = "#33475b";
    ctx.fillRect(px + 5, py + 7, 3, 3);
    ctx.fillRect(px + this.tileSize - 8, py + 7, 3, 3);
    ctx.fillRect(px + 5, py + this.tileSize - 6, 3, 3);
    ctx.fillRect(px + this.tileSize - 8, py + this.tileSize - 6, 3, 3);
  }

  renderPod(ctx, px, py) {
    // 床ベース
    ctx.fillStyle = "#121a22";
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    // 培養カプセル本体
    ctx.fillStyle = "rgba(0, 200, 180, 0.25)";
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + this.tileSize / 2, py + this.tileSize / 2, this.tileSize * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 内部の生体コア
    ctx.fillStyle = "rgba(255, 60, 90, 0.6)";
    ctx.beginPath();
    ctx.arc(px + this.tileSize / 2, py + this.tileSize / 2, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  renderDoor(ctx, px, py) {
    ctx.fillStyle = "#111720";
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    const isUnlocked = this.doorUnlocked;
    const indicatorColor = isUnlocked ? "#00e676" : "#ff1744";

    // ドアパネル
    ctx.fillStyle = "#263238";
    ctx.fillRect(px + 4, py + 2, this.tileSize - 8, this.tileSize - 4);

    // 中央スリット
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + this.tileSize / 2, py + 2);
    ctx.lineTo(px + this.tileSize / 2, py + this.tileSize - 2);
    ctx.stroke();

    // セキュリティランプ
    ctx.fillStyle = indicatorColor;
    ctx.beginPath();
    ctx.arc(px + this.tileSize / 2, py + 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // 警告ストライプ
    ctx.fillStyle = isUnlocked ? "#00c853" : "#d50000";
    ctx.fillRect(px + 8, py + this.tileSize - 10, this.tileSize - 16, 4);
  }
}
