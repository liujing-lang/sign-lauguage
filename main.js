/* ============================================================
   app.js — 情绪森林：状态切换 & 天气特效生成
   ============================================================ */

// 情绪 -> MediaPipe 手势 的映射
// MediaPipe 只能识别这 8 种：None / Closed_Fist / Open_Palm /
// Pointing_Up / Thumb_Down / Thumb_Up / Victory / ILoveYou
const EMOTION_MAP = {
  Open_Palm:   "sad",     // 难过 → 下雨
  Victory:     "happy",   // 高兴 → 森林变金黄 + 太阳
  ILoveYou:    "happy-butterfly", // 幸福 → 蝴蝶飞舞（萤火虫层）
  Thumb_Up:    "happy-butterfly", // 幸福 备选手势
  Closed_Fist: "angry",  // 生气 → 火山苏醒
  Pointing_Up: "scared", // 害怕 → 雷电交加
};

const EMOTION_LABEL = {
  "sad":            "state · sad — rain falls",
  "happy":          "state · happy — the forest turns gold",
  "happy-butterfly": "state · joyful — fireflies wake",
  "angry":          "state · angry — the volcano wakes",
  "scared":         "state · scared — the sky keeps striking",
};

// 当前状态
let currentEmotion = "calm";

/* ---------- 页面切换 ---------- */
function enterForest() {
  const welcome = document.getElementById("welcome-page");
  const forest = document.getElementById("forest-page");
  welcome.classList.remove("active");
  forest.classList.add("active");
  document.getElementById("status").textContent =
    "把手伸到摄像头前，做出手势 ✋  ·  Waiting for your hand…";
}

/* ---------- 状态切换 ---------- */
function setState(emotion) {
  if (emotion === currentEmotion) return;
  currentEmotion = emotion;

  // 切换 body 类（CSS 变量 + 特效由此驱动）
  document.body.className = "state-" + emotion;

  // 标签
  document.getElementById("emotion-label").textContent =
    EMOTION_LABEL[emotion] || "state · calm";

  // 按需生成特效
  if (emotion === "sad")           createRain();
  if (emotion === "scared")        createLightning();
  if (emotion === "happy-butterfly") createFireflies();
  if (emotion === "happy")         createSun();
  // 火山靠 CSS，无需 JS 生成
}

/* ---------- 特效生成 ---------- */
function clearWeather() {
  document.getElementById("rain-layer").innerHTML = "";
  document.getElementById("lightning-layer").querySelector(".cloud-group").innerHTML = "";
  document.getElementById("firefly-layer").innerHTML = "";
  document.getElementById("cloud-group").innerHTML = "";
}

function createRain() {
  clearWeather();
  const layer = document.getElementById("rain-layer");
  for (let i = 0; i < 90; i++) {
    const d = document.createElement("div");
    d.className = "raindrop";
    d.style.left = Math.random() * 100 + "%";
    d.style.animationDuration = 0.5 + Math.random() * 0.6 + "s";
    d.style.animationDelay = Math.random() * 2 + "s";
    layer.appendChild(d);
  }
}

function createLightning() {
  clearWeather();
  const layer = document.getElementById("lightning-layer");
  // 3 道闪电
  for (let i = 0; i < 3; i++) {
    const b = document.createElement("div");
    b.className = "bolt";
    b.style.left = 15 + i * 28 + Math.random() * 10 + "%";
    layer.appendChild(b);
  }
  // 乌云
  const cg = layer.querySelector(".cloud-group");
  const c1 = document.createElement("div");
  c1.className = "cloud c1";
  const c2 = document.createElement("div");
  c2.className = "cloud c2";
  cg.appendChild(c1);
  cg.appendChild(c2);
}

function createFireflies() {
  clearWeather();
  const layer = document.getElementById("firefly-layer");
  // 萤火虫
  for (let i = 0; i < 18; i++) {
    const f = document.createElement("div");
    f.className = "firefly";
    f.style.left = 10 + Math.random() * 80 + "%";
    f.style.top  = 30 + Math.random() * 55 + "%";
    f.style.animationDelay = Math.random() * 6 + "s";
    f.style.animationDuration = 6 + Math.random() * 6 + "s, 1.2 + Math.random()*1s";
    layer.appendChild(f);
  }
  // 蝴蝶（幸福重点：翅膀会动）
  const colors = ["#f4a0c0", "#a0c8f4", "#c0a0f4", "#f4d0a0", "#a0f4c8"];
  for (let i = 0; i < 8; i++) {
    const b = document.createElement("div");
    b.className = "butterfly";
    b.style.left = 8 + Math.random() * 84 + "%";
    b.style.top  = 25 + Math.random() * 55 + "%";
    b.style.animation = `firefly-float ${8 + Math.random() * 6}s ease-in-out infinite`;
    b.style.animationDelay = Math.random() * 5 + "s";
    const w1 = document.createElement("span");
    w1.className = "wing left";
    const w2 = document.createElement("span");
    w2.className = "wing right";
    w1.style.background = colors[i % colors.length];
    w2.style.background = colors[i % colors.length];
    w2.style.transformOrigin = "left center";
    w2.style.animation = "flap 0.18s ease-in-out infinite alternate";
    w2.style.animationDelay = "0.09s";
    b.appendChild(w1);
    b.appendChild(w2);
    layer.appendChild(b);
  }
}

function createSun() {
  // 太阳靠 CSS var(--sun-opacity)，这里仅确保晴天特效提示
  // 不需额外 DOM
}

/* ---------- 初始化 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("enter-btn").addEventListener("click", () => {
    // 启动音频上下文（浏览器要求用户手势后才能播放声音）
    if (typeof userStartAudio === "function") userStartAudio();
    enterForest();
    // 启动摄像头 + 手势识别
    if (typeof startExperience === "function") startExperience();
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    setState("calm");
    document.getElementById("gesture-label").textContent = "gesture · reset";
  });
});

// 供 sketch.js 调用的钩子：识别到手势时触发情绪切换
function onEmotionGesture(gestureName) {
  const emotion = EMOTION_MAP[gestureName];
  if (emotion) {
    setState(emotion);
    document.getElementById("gesture-label").textContent =
      "gesture · " + gestureName;
  }
}