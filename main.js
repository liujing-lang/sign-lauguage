// =====================================================================
//  main.js — 页面跳转 & 辅助逻辑
//  ====================================================================

// 等待 DOM 就绪
window.addEventListener("DOMContentLoaded", () => {
  const enterBtn = document.getElementById("enter");
  const intro = document.getElementById("intro");
  const forest = document.getElementById("forest");

  // 「Enter quietly」→ 进入森林页（实际摄像头启动在 sketch.js 的 enterForest 里）
  enterBtn.addEventListener("click", () => {
    intro.classList.add("hidden");
    forest.classList.remove("hidden");
  });
});
