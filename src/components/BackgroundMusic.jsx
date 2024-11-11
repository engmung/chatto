import React, { useEffect, useRef, useState } from 'react';

const BackgroundMusic = ({ 
  currentState, 
  isChatOpen,
  volume = 0.5,
  fadeTime = 1000,
  hasInteraction = false 
}) => {
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // AudioContext 초기화 및 오디오 재생 설정
  const initializeAudio = async () => {
    if (isInitialized || !hasInteraction) return;

    try {
      // AudioContext 생성
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // GainNode 설정
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = 0; // 초기 볼륨 0

      // 오디오 파일 로드
      const response = await fetch('/audio/background.wav');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      // 소스 노드 생성 및 재생
      sourceNodeRef.current = audioContextRef.current.createBufferSource();
      sourceNodeRef.current.buffer = audioBuffer;
      sourceNodeRef.current.loop = true;
      sourceNodeRef.current.connect(gainNodeRef.current);
      sourceNodeRef.current.start(0);

      // 볼륨 페이드 인
      const now = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.setValueAtTime(0, now);
      gainNodeRef.current.gain.linearRampToValueAtTime(volume * 0.6, now + 2);

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  };

  // 사용자 상호작용 감지 시 초기화
  useEffect(() => {
    if (hasInteraction && !isInitialized) {
      initializeAudio();
    }
  }, [hasInteraction]);

  // 상태에 따른 볼륨 조절
  useEffect(() => {
    if (!gainNodeRef.current || !isInitialized) return;

    let targetVolume = 0;

    if (currentState === 'idle') {
      targetVolume = volume * 0.6;
    } else if (currentState === 'active') {
      targetVolume = isChatOpen ? volume * 0.3 : volume;
    }

    const now = audioContextRef.current.currentTime;
    gainNodeRef.current.gain.linearRampToValueAtTime(
      targetVolume,
      now + (fadeTime / 1000)
    );
  }, [currentState, isChatOpen, volume, fadeTime, isInitialized]);

  // 클린업
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return null;
};

export default BackgroundMusic;