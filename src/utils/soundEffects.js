// utils/soundEffects.js
const playSound = (soundName, volume = 1.0) => {
  try {
    const audio = new Audio(`/audio/${soundName}.wav`);
    audio.volume = volume;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Error playing sound:', error);
      });
    }

    audio.onended = () => {
      audio.remove();
    };
  } catch (error) {
    console.error('Error creating audio:', error);
  }
};

export const sounds = {
  // 기본 인터페이스 효과음
  move: () => playSound('move', 0.5),        // 테마 이동 시
  select: () => playSound('select', 0.6),    // 테마 선택 시
  reset: () => playSound('reset', 0.4),      // 초기화/리셋 시
  close: () => playSound('close', 0.5),      // 채팅창 닫기 시
  welcome: () => playSound('welcome', 0.6),  // 시작 가이드 표시 시
  
  // 채팅 메시지 효과음
  userMessage: () => playSound('user', 0.45),  // 사용자 메시지 전송 시
  aiMessage: () => playSound('ai', 0.45),      // AI 응답 시
  
  // 특별 효과음
  special: () => playSound('special', 0.8)     // 엔딩 시퀀스용
};

export const playSequence = async (soundNames, interval = 200) => {
  for (let i = 0; i < soundNames.length; i++) {
    const soundName = soundNames[i];
    if (sounds[soundName]) {
      sounds[soundName]();
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
};

export default sounds;