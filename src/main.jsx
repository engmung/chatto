import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 브라우저 확대 설정 (중앙 기준)
// window.onload = function() {
//   const root = document.getElementById('root');
//   root.style.transform = "scale(1.125)";
//   root.style.transformOrigin = "center"; // 중앙 기준
//   root.style.position = "fixed";
//   root.style.width = "100%";
//   root.style.height = "100%";
//   root.style.top = "0";
//   root.style.left = "0";
  
//   // 스크롤바 방지
//   document.body.style.overflow = "hidden";
// }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
