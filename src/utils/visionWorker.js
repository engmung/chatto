// visionWorker.js
let detectionActive = false;

self.onmessage = async (e) => {
  const { type, imageData } = e.data;
  
  if (type === 'start') {
    detectionActive = true;
    self.postMessage({ type: 'started' });
  }
  else if (type === 'stop') {
    detectionActive = false;
  }
  else if (type === 'process' && detectionActive) {
    // 간단한 움직임 감지 - 픽셀 변화 분석
    try {
      const data = imageData.data;
      let movement = 0;
      
      // 픽셀 변화량 체크 (단순화된 알고리즘)
      for (let i = 0; i < data.length; i += 40) {
        movement += Math.abs(data[i] - (data[i - 4] || 0));
      }
      
      // 임계값 이상의 움직임이 감지되면 presence = true
      const threshold = 1000;
      self.postMessage({ 
        type: 'result', 
        isPresent: movement > threshold 
      });
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message });
    }
  }
};