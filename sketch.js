// 森林主题配置（对应你的参考图）
const THEMES = {
  open:   { bg: [11,46,38],   trees: ['#1b8a5a','#25b377','#0f6b43'], extra: 'rain',    label: 'Open palm' },
  sweep:  { bg: [60,30,20],   trees: ['#d35400','#e67e22','#a04000'], extra: 'volcano', label: 'Sweep' },
  pinch:  { bg: [20,50,30],   trees: ['#27ae60','#2ecc71','#16a085'], extra: 'firefly', label: 'Pinch' },
  fist:   { bg: [30,45,50],   trees: ['#34495e','#2c3e50','#7f8c8d'], extra: 'fog',     label: 'Closed fist' },
  together:{ bg: [25,35,60],  trees: ['#2980b9','#8e44ad','#2c3e50'], extra: 'lightning',label: 'Hands together' }
};

let currentTheme = 'open';
let targetBg = THEMES.open.bg;
let currentBg = [...THEMES.open.bg];

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('forest-bg');
  noStroke();
}

function draw() {
  // 背景色平滑过渡
  currentBg[0] = lerp(currentBg[0], targetBg[0], 0.02);
  currentBg[1] = lerp(currentBg[1], targetBg[1], 0.02);
  currentBg[2] = lerp(currentBg[2], targetBg[2], 0.02);
  background(currentBg[0], currentBg[1], currentBg[2]);

  drawForest(THEMES[currentTheme]);
}

// 绘制扁平森林（呼应图2/图3）
function drawForest(theme) {
  let t = frameCount * 0.005;
  // 水面
  fill(255, 30);
  rect(0, height*0.75, width, height*0.25);
  // 树冠（圆圈组合）
  for(let i=0; i<6; i++) {
    let x = width*(0.2 + i*0.12) + sin(t+i)*20;
    let y = height*0.55 + cos(t)*10;
    let r = 80 + (i%2)*30;
    fill(theme.trees[i%theme.trees.length]);
    circle(x, y, r*2);
    // 树干
    fill('#1b3a2d');
    rect(x-8, y+r*0.6, 16, 80);
  }
  // 特效（雨/闪电/萤火虫）
  if(theme.extra === 'rain') {
    stroke(255,100); strokeWeight(1);
    for(let i=0;i<20;i++) line(random(width), random(height), random(width), random(height)+20);
  }
  if(theme.extra === 'volcano') {
    fill('#c0392b'); triangle(width*0.7, height*0.6, width*0.8, height*0.4, width*0.9, height*0.6);
  }
  if(theme.extra === 'firefly') {
    noStroke(); fill('#f1c40f');
    for(let i=0;i<15;i++) circle(random(width), random(height*0.7), 3+sin(frameCount*0.1+i)*2);
  }
  if(theme.extra === 'lightning') {
    stroke('#ecf0f1'); strokeWeight(3);
    line(width*0.4, 0, width*0.3, height*0.5);
    line(width*0.3, height*0.5, width*0.35, height*0.4);
  }
}

// 暴露切换接口（main.js 调用）
window.switchGesture = function(name) {
  let key = name.toLowerCase().replace(/\s+/g,'');
  if(THEMES[key]) {
    currentTheme = key;
    targetBg = THEMES[key].bg;
    document.getElementById('gesture-name').innerText = THEMES[key].label;
  }
};

window.enterForest = function() {
  document.body.classList.add('in-forest');
  document.getElementById('welcome-page').classList.remove('active');
  document.getElementById('forest-page').classList.add('active');
};