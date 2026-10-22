// =====================================================================
//  《情绪森林》— 手势识别引擎
//  PART A 手势识别引擎（不修改）
//  PART B 作品逻辑（已按 Inner Forest 需求改写）
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
let cameraOk = null;

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
          setStatus("模型已就绪 ✨ 把手伸到摄像头前，做出手势");
          return;
        } catch (e) {}
      }
    }
  }
  setStatus(
    "⚠️ 手势模型加载失败：请把 gesture_recognizer.task 放进项目文件夹（和 index.html 放在一起），然后刷新页面"
  );
}

function updateHands() {
  if (!recognizer || !video) return;

  const ok = video.elt.readyState >= 2;
  if (ok !== cameraOk) {
    cameraOk = ok;
    setStatus(
      ok
        ? "把手伸到摄像头前，做一个手势 ✋"
        : "正在等待摄像头…请点击「允许」，或点击地址栏里的摄像头图标，然后刷新页面"
    );
  }
  if (!ok) return;

  if (video.elt.currentTime === lastVideoTime) return;
  lastVideoTime = video.elt.currentTime;

  const result = recognizer.recognizeForVideo(video.elt, performance.now());
  const sides = result.handedness || result.handednesses || [];
  hands = result.landmarks.map((lm, i) => {
    const best =
      (result.gestures[i] && result.gestures[i][0]) || { categoryName: "None", score: 0 };
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
  tint(255, 70);
  image(video, 0, 0, width, height);
  pop();
}

function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}


// ---------------------------------------------------------------------
//  PART B — 作品：《情绪森林》
// ---------------------------------------------------------------------
let lastGesture = {};

function setup() {
  // p5 canvas 透明覆盖在最上层（仅用于画手势调试信息）
  const c = createCanvas(windowWidth, windowHeight);
  c.style("position", "fixed");
  c.style("inset", "0");
  c.style("z-index", "20");
  c.style("pointer-events", "none");
}

function startExperience() {
  userStartAudio();

  video = createCapture(VIDEO, () => {
    // 摄像头就绪后，把视频流挂到页面上的 <video> 做预览
    const feed = document.getElementById("camera-feed");
    if (feed && video.elt.srcObject) feed.srcObject = video.elt.srcObject;
  });
  video.size(640, 480);
  video.hide();

  loadGestureRecognizer();
}

function draw() {
  clear(); // 透明背景

  if (started) {
    updateHands();

    // 每只手：刚识别到的那一刻触发一次情绪切换
    for (const hand of hands) {
      const g = hand.score >= 0.6 ? hand.gesture : "None";
      if (g === "None") continue;
      if (g !== lastGesture[hand.side]) {
        // 通知 app.js 切换情绪
        if (typeof onEmotionGesture === "function") onEmotionGesture(g);
      }
      lastGesture[hand.side] = g;
    }
    if (hands.length === 0) lastGesture = {};

    // 调试：画食指指尖光点
    noStroke();
    fill(255, 200);
    for (const hand of hands) {
      if (hand.points[8]) circle(hand.points[8].x, hand.points[8].y, 10);
    }
    drawGestureInfo();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
