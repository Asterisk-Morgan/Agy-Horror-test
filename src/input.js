// 入力マネージャ（キーボード、マウス、スマートフォンタッチ・バーチャルパッド）

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;

    // 移動入力ベクトル
    this.moveX = 0;
    this.moveY = 0;
    this.moveAngle = 0;
    this.moveLength = 0;
    this.isDashing = false;

    // 照準入力
    this.aimAngle = 0;
    this.aimActive = false;

    // アクションフラグ
    this.isAttacking = false;
    this.attackTriggered = false; // 単発トリガー
    this.slashTriggered = false;  // クイック直刀
    this.reloadTriggered = false;
    this.interactTriggered = false;
    this.switchWeaponIndex = -1;
    this.cycleWeaponTriggered = false;
    this.toggleArchiveTriggered = false;
    this.escapeTriggered = false;

    // キーボード状態
    this.keys = {};

    // タッチトラッキング
    this.touchJoystick = {
      active: false,
      touchId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      radius: 55
    };

    // マウス位置 (スクリーン座標)
    this.mouseX = canvas.width / 2;
    this.mouseY = canvas.height / 2;
    this.hasMouse = false;

    this.bindEvents();
  }

  bindEvents() {
    // ===== キーボードイベント =====
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      if (e.code === "Digit1") this.switchWeaponIndex = 0;
      if (e.code === "Digit2") this.switchWeaponIndex = 1;
      if (e.code === "Digit3") this.switchWeaponIndex = 2;
      if (e.code === "KeyQ") this.cycleWeaponTriggered = true;
      if (e.code === "KeyR") this.reloadTriggered = true;
      if (e.code === "KeyE" || e.code === "Enter") this.interactTriggered = true;
      if (e.code === "KeyJ" || e.code === "Tab") {
        e.preventDefault();
        this.toggleArchiveTriggered = true;
      }
      if (e.code === "Escape") {
        e.preventDefault();
        this.escapeTriggered = true;
      }
      if (e.code === "KeyF") this.slashTriggered = true;
      if (e.code === "Space") {
        e.preventDefault();
        this.attackTriggered = true;
        this.isAttacking = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
      if (e.code === "Space") {
        this.isAttacking = false;
      }
    });

    // ===== マウスイベント =====
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
      this.hasMouse = true;
      this.aimActive = true;
    });

    this.canvas.addEventListener("mousedown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
      this.hasMouse = true;
      this.aimActive = true;

      if (e.button === 0) { // 左クリック（主武器）
        this.attackTriggered = true;
        this.isAttacking = true;
      } else if (e.button === 2) { // 右クリック（直刀クイック）
        e.preventDefault();
        this.slashTriggered = true;
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this.isAttacking = false;
      }
    });

    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // ===== タッチ・バーチャルジョイスティック (画面左側) =====
    const joystickZone = document.getElementById("joystick-zone");
    const stickBase = document.getElementById("stick-base");
    const stickThumb = document.getElementById("stick-thumb");

    if (joystickZone && stickBase && stickThumb) {
      const handleTouchStart = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (!this.touchJoystick.active) {
            this.touchJoystick.active = true;
            this.touchJoystick.touchId = t.identifier;
            this.touchJoystick.startX = t.clientX;
            this.touchJoystick.startY = t.clientY;
            this.touchJoystick.currentX = t.clientX;
            this.touchJoystick.currentY = t.clientY;

            stickBase.style.display = "block";
            stickBase.style.left = `${t.clientX}px`;
            stickBase.style.top = `${t.clientY}px`;
            stickThumb.style.transform = "translate(-50%, -50%)";
            break;
          }
        }
      };

      const handleTouchMove = (e) => {
        if (!this.touchJoystick.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this.touchJoystick.touchId) {
            this.touchJoystick.currentX = t.clientX;
            this.touchJoystick.currentY = t.clientY;

            const dx = t.clientX - this.touchJoystick.startX;
            const dy = t.clientY - this.touchJoystick.startY;
            const dist = Math.hypot(dx, dy);
            const clampedDist = Math.min(this.touchJoystick.radius, dist);
            const angle = Math.atan2(dy, dx);

            const thumbX = Math.cos(angle) * clampedDist;
            const thumbY = Math.sin(angle) * clampedDist;
            stickThumb.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
            break;
          }
        }
      };

      const handleTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this.touchJoystick.touchId) {
            this.touchJoystick.active = false;
            this.touchJoystick.touchId = null;
            stickBase.style.display = "none";
            break;
          }
        }
      };

      joystickZone.addEventListener("touchstart", handleTouchStart, { passive: false });
      joystickZone.addEventListener("touchmove", handleTouchMove, { passive: false });
      joystickZone.addEventListener("touchend", handleTouchEnd, { passive: false });
      joystickZone.addEventListener("touchcancel", handleTouchEnd, { passive: false });
    }

    // ===== スマホ用バーチャルボタン群 (画面右側) =====
    this.bindTouchButton("btn-slash", () => {
      this.slashTriggered = true;
    });

    const fireBtn = document.getElementById("btn-fire");
    if (fireBtn) {
      const startFire = (e) => {
        e.preventDefault();
        this.attackTriggered = true;
        this.isAttacking = true;
      };
      const stopFire = (e) => {
        e.preventDefault();
        this.isAttacking = false;
      };

      fireBtn.addEventListener("touchstart", startFire, { passive: false });
      fireBtn.addEventListener("touchend", stopFire);
      fireBtn.addEventListener("touchcancel", stopFire);

      fireBtn.addEventListener("mousedown", startFire);
      window.addEventListener("mouseup", () => {
        if (this.isAttacking && !this.keys["Space"]) {
          this.isAttacking = false;
        }
      });
    }

    this.bindTouchButton("btn-weapon", () => {
      this.cycleWeaponTriggered = true;
    });

    this.bindTouchButton("btn-interact", () => {
      this.interactTriggered = true;
    });

    this.bindTouchButton("btn-reload", () => {
      this.reloadTriggered = true;
    });
  }

  bindTouchButton(id, onTrigger) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("touchstart", (e) => {
      e.preventDefault();
      onTrigger();
    }, { passive: false });
    el.addEventListener("click", (e) => {
      e.preventDefault();
      onTrigger();
    });
  }

  update(player, camera) {
    let kx = 0;
    let ky = 0;

    // キーボード入力
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) ky -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) ky += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) kx -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) kx += 1;
    this.isDashing = !!this.keys["ShiftLeft"] || !!this.keys["ShiftRight"];

    // タッチジョイスティック入力
    if (this.touchJoystick.active) {
      const dx = this.touchJoystick.currentX - this.touchJoystick.startX;
      const dy = this.touchJoystick.currentY - this.touchJoystick.startY;
      const dist = Math.hypot(dx, dy);

      if (dist > 6) {
        this.moveAngle = Math.atan2(dy, dx);
        this.moveLength = Math.min(1, dist / this.touchJoystick.radius);
        this.moveX = Math.cos(this.moveAngle) * this.moveLength;
        this.moveY = Math.sin(this.moveAngle) * this.moveLength;
        this.aimAngle = this.moveAngle; // タッチ移動時は進行方向を向く
        this.aimActive = true;
      } else {
        this.moveX = 0;
        this.moveY = 0;
        this.moveLength = 0;
      }
    } else {
      const keyLen = Math.hypot(kx, ky);
      if (keyLen > 0) {
        this.moveX = kx / keyLen;
        this.moveY = ky / keyLen;
        this.moveAngle = Math.atan2(this.moveY, this.moveX);
        this.moveLength = 1;
      } else {
        this.moveX = 0;
        this.moveY = 0;
        this.moveLength = 0;
      }

      // マウス操作時の正確な照準角度（プレイヤーの画面座標を基準に計算）
      if (this.hasMouse && camera) {
        const playerScreenX = player.x - camera.x;
        const playerScreenY = player.y - camera.y;
        this.aimAngle = Math.atan2(this.mouseY - playerScreenY, this.mouseX - playerScreenX);
        this.aimActive = true;
      }
    }
  }

  // 1フレームごとの単発トリガーリセット
  postUpdate() {
    this.attackTriggered = false;
    this.slashTriggered = false;
    this.reloadTriggered = false;
    this.interactTriggered = false;
    this.cycleWeaponTriggered = false;
    this.toggleArchiveTriggered = false;
    this.escapeTriggered = false;
    this.switchWeaponIndex = -1;
  }
}
