let currentTheme = 'fist'; // 默认静谧森林
let lastSwitch = 0;

const THEMES = {
  'open':   {bg:[20,60,40], trees:['#27ae60','#2ecc71'], extra:'rain', label:'Open palm'},
  'sweep':  {bg:[30,70,50], trees:['#229954','#52c68f'], extra:'wind', label:'Sweep'},
  'pinch':  {bg:[25,65,45], trees:['#28b463','#58d68d'], extra:'firefly', label:'Pinch'},
  'fist':   {bg:[60,80,90], trees:['#5d6d7e','#85929e'], extra:'fog', label:'Closed fist (Quiet)'}, 
  'together':{bg:[40,50,70], trees:['#34495e','#5d6d7e'], extra:'lightning', label:'Hands together (Strike)'}
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop(); // 初始不自动动，靠交互
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function draw() {
  background(THEMES[currentTheme].bg);
  drawForest(THEMES[currentTheme]);
  
  // 底部文字更新
  document.getElementById('gesture-name').innerText = THEMES[currentTheme].label;
}

// 核心绘制：艺术感森林
function drawForest(theme) {
  let t = frameCount * 0.005;
  
  // 地面/水面
  noStroke();
  fill(red(theme.trees[0]), green(theme.trees[0]), blue(theme.trees[0]), 50);
  rect(0, height*0.75, width, height*0.25);

  // 绘制6棵树（呼应你图里的排列，但增加层次）
  for(let i=0; i<6; i++) {
    let x = width*(0.15 + i*0.14) + sin(t+i)*10;
    let y = height*0.55 + cos(t)*5;
    let r = 60 + (i%2)*20; // 大小错落
    
    // 后层树冠（大圆）
    fill(red(theme.trees[i%theme.trees.length]), green(theme.trees[i%theme.trees.length]), blue(theme.trees[i%theme.trees.length]), 180);
    circle(x-20, y+10, r*1.8);
    circle(x+20, y+10, r*1.8);
    // 主树冠（前圆）
    fill(theme.trees[i%theme.trees.length]);
    circle(x, y, r*1.5);
    // 树干
    fill('#1b3a2d');
    rect(x-8, y+r*0.6, 16, 80);
  }
  
  // 特效分支
  if(theme.extra === 'rain') {
    stroke(255, 150); strokeWeight(1);
    for(let i=0;i<40;i++) line(random(width), random(height*0.7), random(width)-5, random(height*0.7)+20);
  }
  if(theme.extra === 'firefly') {
    noStroke(); 
    for(let i=0;i<25;i++) {
      fill('#f1c40f');
      circle(random(width), random(height*0.7), 3+sin(frameCount*0.1+i)*2);
    }
  }
  if(theme.extra === 'wind') {
    stroke(255, 80); strokeWeight(2);
    for(let i=0;i<5;i++) line(width*0.1, height*0.4+i*20, width*0.9, height*0.4+i*20+sin(t)*30);
  }
  
  // 【重做】雷电特效（Hands together）
  if(theme.extra === 'lightning') {
    // 暗云压顶
    noStroke(); fill(20, 30, 50, 220);
    rect(0, 0, width, height*0.6);
    // 随机闪电折线
    stroke('#ecf0f1'); strokeWeight(4);
    let lx = width*0.4 + random(-50,50);
    line(lx, 0, lx-30, height*0.3);
    line(lx-30, height*0.3, lx+20, height*0.5);
    line(lx+20, height*0.5, lx-40, height*0.7);
    // 瞬间闪光
    if(frameCount % 60 < 5) fill(255, 255, 255, 60);
    else fill(255, 255, 255, 0);
    rect(0, 0, width, height);
  }
  
  // 静谧雾气（Closed fist，你当前的默认状态）
  if(theme.extra === 'fog') {
    noStroke(); fill(180, 200, 190, 100);
    rect(0, height*0.5, width, height*0.5);
    // 微光
    fill(255, 255, 255, 30);
    circle(width*0.5, height*0.4, 150);
  }
}

// 切换手势（手动控制，不再自动）
function setGesture(name) {
  if(THEMES[name]) {
    currentTheme = name;
    loop(); // 启动动画
    setTimeout(() => noLoop(), 3000); // 动3秒后静止，更有艺术感
  }
}

// 绑定按钮（如果HTML里有）
document.addEventListener('DOMContentLoaded', () => {
  let btn = document.getElementById('enter-btn');
  if(btn) {
    btn.onclick = () => {
      // 测试用：点击依次切换，方便你看效果
      let keys = Object.keys(THEMES);
      let idx = keys.indexOf(currentTheme);
      setGesture(keys[(idx+1)%keys.length]);
    };
  }
});