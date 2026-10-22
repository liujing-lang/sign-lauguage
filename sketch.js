// =====================================================================
//  《情绪森林》— INNER FOREST · GESTURE STUDY
//  PART A（下面）是手势识别引擎，不要修改。
//  PART B 是情绪森林场景渲染。
// =====================================================================


// ---------------------------------------------------------------------
//  PART A — 手势识别引擎
// ---------------------------------------------------------------------
const MP_VERSION = "0.10.21";
const MP_URLS = [
  `https://registry.npmmirror.com/@mediapipe/tasks-vision/${MP_VERSION}/files`,
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`,
];
const MODEL_URLS = [
  "gesture_recognizer.task",
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
];

const GESTURE_NAMES = {
  None: "无",
  Closed_Fist: "握拳 ✊",
  Open_Palm: "张开手掌 🖐",
  Pointing_Up: "食指向上 ☝️",
  Thumb_Down: "拇指向下 👎",
  Thumb_Up: "拇指向上 👍",
  Victory: "剪刀手 ✌️",
  ILoveYou: "我爱你 🤟",
};

let video;
let recognizer = null;
let hands = [];
let lastVideoTime = -1;
let started = false;
let showCamera = false;

async function loadGestureRecognizer() {
  setStatus("正在加载手势模型…");
  for (const base of MP_URLS) {
    let vision, fileset;
    try {
      vision = await import(`${base}/vision_bundle.mjs`);
      fileset = await vision.FilesetResolver.forVisionTasks(`${base}/wasm`);
    } catch (e) {
      continue;
    }
    for (const model of MODEL_URLS) {
      for (const delegate of ["GPU", "CPU"]) {
        try {
          recognizer = await vision.GestureRecognizer.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: model, delegate },
            runningMode: "VIDEO",
            numHands: 2,
          });
          return;
        } catch (e) {}
      }
    }
  }
  setStatus("⚠️ 手势模型加载失败：请把 gesture_recognizer.task 放进项目文件夹，然后刷新页面");
}

let cameraOk = null;
function updateHands() {
  if (!recognizer || !video) return;

  const ok = video.elt.readyState >= 2;
  if (ok !== cameraOk) {
    cameraOk = ok;
    setStatus(ok ? "把手伸到摄像头前，做一个手势 ✋"
                 : "正在等待摄像头…请点击「允许」，然后刷新页面");
  }
  if (!ok) return;

  if (video.elt.currentTime === lastVideoTime) return;
  lastVideoTime = video.elt.currentTime;

  const result = recognizer.recognizeForVideo(video.elt, performance.now());
  const sides = result.handedness || result.handednesses || [];
  hands = result.landmarks.map((lm, i) => {
    const best = (result.gestures[i] && result.gestures[i][0]) || { categoryName: "None", score: 0 };
    return {
      gesture: best.categoryName || "None",
      score: best.score,
      side: sides[i] && sides[i][0] ? sides[i][0].categoryName : "",
      points: lm.map((p) => ({ x: (1 - p.x) * width, y: p.y * height, z: p.z })),
    };
  });
}

function drawGestureInfo() {
  push();
  textSize(16);
  textAlign(CENTER, TOP);
  for (const hand of hands) {
    const w = hand.points[0];
    const y = min(w.y + 14, height - 70);
    const label = `${GESTURE_NAMES[hand.gesture] || hand.gesture}  ${round(hand.score * 100)}%`;
    noStroke();
    fill(0, 120);
    rect(w.x - textWidth(label) / 2 - 8, y, textWidth(label) + 16, 26, 6);
    fill(255);
    text(label, w.x, y + 4);
  }
  pop();
}

function drawCamera() {
  push();
  translate(width, 0);
  scale(-1, 1);
  tint(255, 60);
  image(video, 0, 0, width, height);
  pop();
}

function setStatus(msg) {
  const el = select("#status");
  if (el) el.html(msg);
}


// ---------------------------------------------------------------------
//  PART B — 情绪森林场景
// ---------------------------------------------------------------------

/*  五种情绪 → 五种森林场景
    生气  Closed_Fist  → 雷雨森林（深蓝、闪电、雨线）
    高兴  Pointing_Up  → 春日暖阳（青绿、暖黄阳光）
    害怕  Open_Palm    → 幽暗夜林（墨绿、乌云、雾气）
    难过  Victory      → 秋日落叶（橙棕、枯叶飘落）
    幸福  ILoveYou     → 萤火花海（墨蓝、点点萤光）
*/

const MOODS = [
  {
    name: "平静", emoji: "🌿", tip: "— 浅浅的呼吸 —",
    sky1: "#cfe3c2", sky2: "#a9c98f",
    ground: "#7aa86b", fog: "rgba(255,255,255,0.10)",
    tree1: "#5c8a4a", tree2: "#3f6b34", trunk: "#5a4632",
    accent: "rgba(255,255,255,0.5)", particles: [], pType: "none",
    chord: [60, 64, 67, 71],
  },
  {
    name: "生气", emoji: "😠", tip: "— 雷雨将至 —",
    sky1: "#3a4a6b", sky2: "#1f2940",
    ground: "#2c3a52", fog: "rgba(20,25,40,0.35)",
    tree1: "#22304a", tree2: "#16233a", trunk: "#1a1a22",
    accent: "rgba(255,250,200,0.9)", particles: [], pType: "rain",
    chord: [55, 58, 62, 65],
  },
  {
    name: "高兴", emoji: "😄", tip: "— 春日暖阳 —",
    sky1: "#bfe3a0", sky2: "#ffe39a",
    ground: "#8fc06a", fog: "rgba(255,240,180,0.25)",
    tree1: "#7cc45a", tree2: "#4fa64a", trunk: "#6b4a2a",
    accent: "rgba(255,230,140,0.95)", particles: [], pType: "pollen",
    chord: [64, 67, 71, 74],
  },
  {
    name: "害怕", emoji: "😨", tip: "— 幽暗夜林 —",
    sky1: "#1c2a3a", sky2: "#0d1520",
    ground: "#1a2a24", fog: "rgba(10,15,25,0.40)",
    tree1: "#1e3328", tree2: "#132218", trunk: "#0e120e",
    accent: "rgba(180,200,255,0.5)", particles: [], pType: "fog",
    chord: [57, 60, 63, 66],
  },
  {
    name: "难过", emoji: "😢", tip: "— 秋日落叶 —",
    sky1: "#e7b98a", sky2: "#c97a5a",
    ground: "#9c5a3c", fog: "rgba(180,120,80,0.20)",
    tree1: "#c98a3c", tree2: "#a85f30", trunk: "#6b3a22",
    accent: "rgba(230,180,120,0.9)", particles: [], pType: "leaves",
    chord: [58, 61, 64, 67],
  },
  {
    name: "幸福", emoji: "😊", tip: "— 萤火花海 —",
    sky1: "#1a2a4a", sky2: "#0a1428",
    ground: "#1d3a3a", fog: "rgba(40,60,90,0.30)",
    tree1: "#22403a", tree2: "#152a28", trunk: "#2a2a30",
    accent: "rgba(255,255,200,1)", particles: [], pType: "fireflies",
    chord: [65, 69, 72, 76],
  },
];

// 手势 → 情绪下标（0=平静, 1=生气, 2=高兴, 3=害怕, 4=难过, 5=幸福）
const GESTURE_TO_MOOD = {
  Closed_Fist: 1,   // 生气
  Pointing_Up: 2,   // 高兴
  Open_Palm: 3,     // 害怕
  Victory: 4,       // 难过
  ILoveYou: 5,      // 幸福
};

let moodIndex = 0;          // 当前情绪
let targetMood = 0;         // 目标情绪（用于过渡）
let blend = 1;              // 过渡混合系数 0→1
let trees = [];             // 树木：{x, r, col, col2}
let particles = [];         // 粒子（雨/萤火/花粉/落叶）
let lastGesture = {};
let showInfo = true;
let fadeAlpha = 0;

// 声音
let drone = [];             // 氛围底噪：几个正弦振荡器
let chordVoices = [];
let chime, chimeEnv;        // 切换情绪的叮声

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // 预生成森林树木
  for (let i = 0; i < 26; i++) {
    trees.push({
      x: random(width),
      r: random(28, 70) * (width / 900),
      col: random() > 0.5 ? 0 : 1,
      sway: random(TWO_PI),
    });
  }
  trees.sort((a, b) => a.r - b.r); // 远小近大

  select("#enter").mouseClicked(enterForest);
}

function enterForest() {
  if (typeof userStartAudio === 'function') {
  userStartAudio();
}

  select("#intro").addClass("hidden");
  select("#forest").removeClass("hidden");

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // 氛围底噪
  for (let i = 0; i < 3; i++) {
    const o = new p5.Oscillator("sine");
    o.amp(0);
    o.start();
    drone.push(o);
  }

  // 和弦
  for (let i = 0; i < 4; i++) {
    const o = new p5.Oscillator("sine");
    o.amp(0);
    o.start();
    const e = new p5.Envelope();
    e.setADSR(0.6, 1.0, 0.3, 1.5);
    e.setRange(0.07, 0);
    chordVoices.push({ osc: o, env: e });
  }

  // 叮声
  chime = new p5.Oscillator("triangle");
  chime.amp(0);
  chime.start();
  chimeEnv = new p5.Envelope();
  chimeEnv.setADSR(0.005, 0.6, 0, 0.3);
  chimeEnv.setRange(0.22, 0);

  started = true;
  loadGestureRecognizer();
}

function draw() {
  // 1. 手势识别
  if (started) {
    updateHands();
    for (const hand of hands) {
      const g = hand.score >= 0.6 ? hand.gesture : "None";
      if (g === "None") continue;
      if (g !== lastGesture[hand.side]) onGesture(g, hand);
      lastGesture[hand.side] = g;
    }
    if (hands.length === 0) lastGesture = {};
  }

  // 2. 过渡混合
  const cur = MOODS[moodIndex];
  const tgt = MOODS[targetMood];
  if (blend < 1) blend = min(blend + 0.012, 1);
  if (blend >= 1 && moodIndex !== targetMood) moodIndex = targetMood;

  // 3. 画天空渐变
  drawSky(cur, tgt);

  // 4. 画远处雾气
  drawFog(cur, tgt);

  // 5. 画森林（远→近）
  for (const t of trees) drawTree(t, cur, tgt);

  // 6. 画水面倒影
  drawWater(cur, tgt);

  // 7. 粒子系统
  updateAndDrawParticles(cur, tgt);

  // 8. 镜头画面
  if (started && showCamera) drawCamera();

  // 9. 手势指尖提示
  if (started) {
    for (const hand of hands) {
      noStroke();
      fill(255, 220);
      circle(hand.points[8].x, hand.points[8].y, 12);
    }
    if (showInfo) drawGestureInfo();
  }

  // 10. 更新 HUD
  updateHUD();

  // 11. 切换时的白色淡入淡出
  if (fadeAlpha > 0) {
    noStroke();
    fill(255, fadeAlpha);
    rect(0, 0, width, height);
    fadeAlpha = max(0, fadeAlpha - 6);
  }
}

/* ---------------- 绘制函数 ---------------- */

function drawSky(cur, tgt) {
  noStroke();
  for (let y = 0; y < height * 0.72; y += 4) {
    const k = y / (height * 0.72);
    const c = lerpColor(color(cur.sky1), color(cur.sky2), k);
    const c2 = lerpColor(color(tgt.sky1), color(tgt.sky2), k);
    fill(lerpColor(c, c2, blend));
    rect(0, y, width, 4);
  }
}

function drawFog(cur, tgt) {
  const fogC = lerpColor(color(cur.fog), color(tgt.fog), blend);
  noStroke();
  for (let i = 0; i < 3; i++) {
    fill(fogC);
    ellipse(width * (0.2 + i * 0.3) + sin(frameCount * 0.005 + i) * 40,
            height * (0.45 + i * 0.06),
            width * 0.7, height * 0.2);
  }
}

function drawTree(t, cur, tgt) {
  push();
  const sway = sin(frameCount * 0.01 + t.sway) * 3;
  const x = t.x + sway;
  const baseY = height * 0.86;

  // 树干
  const trunkC = lerpColor(color(cur.trunk), color(tgt.trunk), blend);
  noStroke();
  fill(trunkC);
  rect(x - t.r * 0.12, baseY - t.r * 0.4, t.r * 0.24, t.r * 0.6, 3);

  // 树冠（两层错落的圆）
  const c1 = lerpColor(color(cur.tree1), color(tgt.tree1), blend);
  const c2 = lerpColor(color(cur.tree2), color(tgt.tree2), blend);
  const useC1 = t.col === 0 ? c1 : c2;
  const useC2 = t.col === 0 ? c2 : c1;

  fill(useC1);
  ellipse(x, baseY - t.r * 0.7, t.r * 2, t.r * 1.9);
  fill(useC2);
  ellipse(x - t.r * 0.35, baseY - t.r * 0.85, t.r * 1.4, t.r * 1.3);
  ellipse(x + t.r * 0.3, baseY - t.r * 0.6, t.r * 1.2, t.r * 1.2);
  pop();
}

function drawWater(cur, tgt) {
  const g1 = lerpColor(color(cur.ground), color(tgt.ground), blend);
  const g2 = lerpColor(color(cur.sky2), color(tgt.sky2), blend);
  noStroke();
  for (let y = height * 0.86; y < height; y += 3) {
    const k = (y - height * 0.86) / (height * 0.14);
    fill(lerpColor(g1, g2, k * 0.5));
    rect(0, y, width, 3);
  }
  // 水波纹
  stroke(255, 40);
  strokeWeight(1);
  for (let i = 0; i < 6; i++) {
    const wy = height * 0.9 + i * 14 + (frameCount * 0.3) % 14;
    const off = sin(frameCount * 0.03 + i) * 20;
    line(0, wy, width, wy);
    line(off, wy + 6, width * 0.6 + off, wy + 6);
  }
}

function updateAndDrawParticles(cur, tgt) {
  const accent = lerpColor(color(cur.accent), color(tgt.accent), blend);
  const type = cur.pType;

  // 维持粒子数量
  const targetCount = type === "none" ? 0 : 60;
  while (particles.length < targetCount) {
    particles.push(spawnParticle(type));
  }
  if (particles.length > targetCount) particles.length = targetCount;

  noStroke();
  for (const p of particles) {
    p.life--;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g;

    if (p.life <= 0 || p.y > height || p.x < -20 || x > width + 20) {
      Object.assign(p, spawnParticle(type));
      continue;
    }

    if (type === "rain") {
      stroke(accent); strokeWeight(1.5);
      line(p.x, p.y, p.x - p.vx * 1.5, p.y - p.vy * 1.5);
    } else if (type === "fireflies") {
      const a = map(p.life, 0, p.maxLife, 0, 255) * p.bright;
      fill(red(accent), green(accent), blue(accent), a);
      circle(p.x, p.y, p.r);
      fill(255, a * 0.6);
      circle(p.x, p.y, p.r * 0.4);
    } else if (type === "pollen") {
      const a = map(p.life, 0, p.maxLife, 0, 255);
      fill(red(accent), green(accent), blue(accent), a * 0.8);
      circle(p.x, p.y, p.r);
    } else if (type === "leaves") {
      push();
      translate(p.x, p.y);
      rotate(p.rot);
      fill(p.cr, p.cg, p.cb, map(p.life, 0, p.maxLife, 0, 255));
      ellipse(0, 0, p.r * 1.6, p.r * 0.9);
      pop();
    } else if (type === "fog") {
      fill(180, 200, 255, 12);
      ellipse(p.x, p.y, p.r * 4, p.r * 2);
    }
  }
}

function spawnParticle(type) {
  const p = { x: random(width), y: random(height), life: 0, maxLife: 200, vx: 0, vy: 0, g: 0 };
  if (type === "rain") {
    p.x = random(width); p.y = random(-height, 0);
    p.vx = -1.2; p.vy = random(6, 10); p.g = 0.15; p.life = 999;
  } else if (type === "fireflies") {
    p.x = random(width); p.y = random(height * 0.4, height);
    p.vx = random(-0.4, 0.4); p.vy = random(-0.5, 0.3); p.g = 0;
    p.r = random(3, 6); p.life = random(100, 260); p.maxLife = p.life;
    p.bright = random(0.5, 1);
  } else if (type === "pollen") {
    p.x = random(width); p.y = random(height);
    p.vx = random(-0.3, 0.3); p.vy = random(-0.6, -0.1); p.g = 0.002;
    p.r = random(2, 5); p.life = random(150, 300); p.maxLife = p.life;
  } else if (type === "leaves") {
    p.x = random(width); p.y = random(-50, height * 0.5);
    p.vx = random(-1, 1); p.vy = random(0.6, 1.6); p.g = 0.01;
    p.r = random(5, 11); p.life = random(180, 320); p.maxLife = p.life;
    p.rot = random(TWO_PI); p.cr = random(150, 220); p.cg = random(80, 140); p.cb = random(30, 70);
  } else if (type === "fog") {
    p.x = random(width); p.y = random(height * 0.4, height * 0.9);
    p.vx = random(-0.2, 0.2); p.vy = 0; p.g = 0;
    p.r = random(40, 90); p.life = 999;
  }
  return p;
}

/* ---------------- 手势响应 ---------------- */

function onGesture(g, hand) {
  const newMood = GESTURE_TO_MOOD[g];
  if (newMood === undefined) return;

  if (newMood !== targetMood) {
    targetMood = newMood;
    blend = 0;
    fadeAlpha = 120;
    playMoodChord(newMood);
    playChime();
  }

  // 食指向上（高兴）额外在指尖位置冒出花粉粒子
  if (g === "Pointing_Up") {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: hand.points[8].x + random(-10, 10),
        y: hand.points[8].y + random(-10, 10),
        vx: random(-0.5, 0.5), vy: random(-2, -0.5), g: 0.03,
        r: random(2, 5), life: 120, maxLife: 120,
      });
    }
  }
}

/* ---------------- 声音 ---------------- */

function playMoodChord(i) {
  if (chordVoices.length === 0) return;
  MOODS[i].chord.forEach((m, k) => {
    if (chordVoices[k]) {
      chordVoices[k].osc.freq(midiToFreq(m));
      chordVoices[k].env.play(chordVoices[k].osc);
    }
  });
}

function playChime() {
  if (!chime) return;
  chime.freq(midiToFreq(random([72, 76, 79, 83, 84])));
  chimeEnv.play(chime);
}

/* ---------------- HUD ---------------- */

function updateHUD() {
  const m = MOODS[moodIndex];
  const el1 = select("#emotion-label");
  const el2 = select("#mood-label");
  if (el1 && el1.html() !== `${m.emoji} ${m.name}`) {
    el1.html(`${m.emoji} ${m.name}`);
  }
  if (el2 && el2.html() !== m.tip) el2.html(m.tip);
}

/* ---------------- 键盘 ---------------- */

function keyPressed() {
  if (key === "v" || key === "V") showCamera = !showCamera;
  if (key === "i" || key === "I") showInfo = !showInfo;
  if (key === "c" || key === "C") { particles = []; }
  if (key === "s" || key === "S") saveCanvas("my-forest", "png");
  if (keyCode === ESCAPE) {
    select("#forest").addClass("hidden");
    select("#intro").removeClass("hidden");
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}