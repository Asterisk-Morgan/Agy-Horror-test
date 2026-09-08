// Web Audio API によるプロシージャル・ホラー音響システム

class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.isMuted = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;

    // BGM ノード
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.heartbeatTimer = null;
    this.isBgmPlaying = false;
    this.playerHpRatio = 1.0;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.initialized = true;
      this.startAmbientDrone();
      this.startHeartbeatLoop();
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (!this.initialized) {
      this.init();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // ===== アンビエント・ホラードローン =====
  startAmbientDrone() {
    if (!this.ctx || this.isBgmPlaying) return;
    try {
      // 陰鬱な低周波ドローン音
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc2 = this.ctx.createOscillator();

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.droneOsc1.type = "sawtooth";
      this.droneOsc1.frequency.setValueAtTime(46.25, this.ctx.currentTime); // F#1

      this.droneOsc2.type = "triangle";
      this.droneOsc2.frequency.setValueAtTime(48.99, this.ctx.currentTime); // G1 (不協和音)

      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.droneOsc1.connect(filter);
      this.droneOsc2.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(this.bgmGain);

      this.droneOsc1.start();
      this.droneOsc2.start();
      this.isBgmPlaying = true;
    } catch (e) {
      console.warn("Drone error:", e);
    }
  }

  // ===== 動的心拍音（HPに応じて変化） =====
  setPlayerHpRatio(ratio) {
    this.playerHpRatio = Math.max(0, Math.min(1, ratio));
  }

  startHeartbeatLoop() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    const tick = () => {
      if (this.ctx && this.playerHpRatio < 0.65 && !this.isMuted) {
        this.playHeartbeatSound();
      }
      // HPが減るほど拍動が速くなる
      const interval = 600 + this.playerHpRatio * 800; // 600ms〜1400ms
      this.heartbeatTimer = setTimeout(tick, interval);
    };
    this.heartbeatTimer = setTimeout(tick, 1000);
  }

  playHeartbeatSound() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.12);

    const volume = (1.0 - this.playerHpRatio) * 0.45;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(t);
    osc.stop(t + 0.16);

    // 2拍目 (ド・クン)
    setTimeout(() => {
      if (!this.ctx) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(55, t2);
      osc2.frequency.exponentialRampToValueAtTime(28, t2 + 0.14);

      gain2.gain.setValueAtTime(volume * 0.75, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.17);

      osc2.connect(gain2);
      gain2.connect(this.bgmGain);

      osc2.start(t2);
      osc2.stop(t2 + 0.18);
    }, 180);
  }

  // ===== 効果音 (SFX) =====

  // 直刀 振りの鋭い風切り音
  playKatanaSwing() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // ノイズバースト
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.05);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.12);
    filter.Q.setValueAtTime(4, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // 直刀 命中・肉体両断音
  playKatanaHit() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // 鋭い衝撃音
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.19);

    // スプラッター音
    const bSize = this.ctx.sampleRate * 0.15;
    const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bSize * 0.15));
    }
    const n = this.ctx.createBufferSource();
    n.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t);
    f.frequency.linearRampToValueAtTime(250, t + 0.15);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.5, t);
    nGain.gain.linearRampToValueAtTime(0.01, t + 0.15);
    n.connect(f);
    f.connect(nGain);
    nGain.connect(this.sfxGain);
    n.start(t);
  }

  // XDM-40 銃声 (大口径ハンドガン)
  playPistolShot() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // クラック音
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);

    // 爆発パルスノイズ
    const bSize = this.ctx.sampleRate * 0.22;
    const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bSize * 0.18));
    }
    const n = this.ctx.createBufferSource();
    n.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(1400, t);
    f.frequency.linearRampToValueAtTime(400, t + 0.22);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.7, t);
    nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    n.connect(f);
    f.connect(nGain);
    nGain.connect(this.sfxGain);
    n.start(t);
  }

  // MP7A1 銃声 (高速PDWサブマシンガン)
  playSmgShot() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // 短く乾いた破裂音
    const bSize = this.ctx.sampleRate * 0.08;
    const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bSize * 0.2));
    }
    const n = this.ctx.createBufferSource();
    n.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.setValueAtTime(1200, t);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.55, t);
    nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    n.connect(f);
    f.connect(nGain);
    nGain.connect(this.sfxGain);
    n.start(t);

    // 軽い低音キック
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.06);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.065);
  }

  // リロード音 (ガチャガチャ)
  playReload() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // マガジン抜き
    this.playClickSound(t, 600, 0.04);
    // マガジン装填 (0.3s後)
    setTimeout(() => this.playClickSound(this.ctx.currentTime, 850, 0.05), 320);
    // スライド操作 (0.6s後)
    setTimeout(() => this.playSlideSound(this.ctx.currentTime), 650);
  }

  playClickSound(time, freq, dur) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + dur);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + dur);
  }

  playSlideSound(time) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(450, time);
    osc.frequency.exponentialRampToValueAtTime(1100, time + 0.08);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.095);
  }

  // 空撃ち音 (弾切れ)
  playDryFire() {
    if (!this.ctx || this.isMuted) return;
    this.playClickSound(this.ctx.currentTime, 1200, 0.03);
  }

  // 怪異の被弾音
  playEnemyHit() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  // 怪異のうめき声・咆哮
  playEnemyGroan(enemyType) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (enemyType === "HACHISHAKU") {
      // ポポポ…という低周波の連打音
      osc.type = "sine";
      osc.frequency.setValueAtTime(160, t);
      gain.gain.setValueAtTime(0.35, t);
      for (let i = 0; i < 4; i++) {
        gain.gain.setValueAtTime(0.35, t + i * 0.1);
        gain.gain.setValueAtTime(0.01, t + i * 0.1 + 0.08);
      }
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.45);
    } else if (enemyType === "CHIMERA") {
      // 獣の唸り・咆哮
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.linearRampToValueAtTime(140, t + 0.25);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.32);
    } else if (enemyType === "SLICER") {
      // 金属擦過音（テケテケ…）
      osc.type = "square";
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(350, t + 0.18);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.22);
    } else {
      // ボス・結晶等
      osc.type = "triangle";
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.48);
    }
  }

  // プレイヤー被弾音
  playPlayerHurt() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.2);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  // ミダル死亡音（深い闇への沈下音）
  playPlayerDeath() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(24, t + 1.2);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.6);
  }

  // アイテム取得音
  playItemPickup() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.setValueAtTime(880, t + 0.08); // A5
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  // 資料閲覧音（電子端末ビープ）
  playDocOpen() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1046.5, t); // C6
    osc.frequency.setValueAtTime(1318.5, t + 0.05); // E6
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // ドア開閉音
  playDoorOpen() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.35);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.42);
  }
}

export const audio = new AudioManager();
