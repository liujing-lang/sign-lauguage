document.getElementById('enter-btn').addEventListener('click', () => {
  // 请求摄像头（真实环境）
  // navigator.mediaDevices.getUserMedia({video:true}).then(...)
  window.enterForest();
  
  // 【模拟测试】每3秒切换手势，看视觉变化（后续接 MediaPipe 删掉这段）
  const seq = ['open','pinch','sweep','fist','together'];
  let i=0;
  setInterval(()=>{
    window.switchGesture(seq[i]);
    i=(i+1)%seq.length;
  }, 3000);
});

// 真实手势映射（预留）
const GESTURE_MAP = {
  'Open_Palm': 'open',
  'Pointing_Up': 'sweep',
  'Pinch': 'pinch',
  'Closed_Fist': 'fist',
  'Victory': 'together'
};
// 识别到后调用: window.switchGesture(GESTURE_MAP[result])