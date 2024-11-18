import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandMetal, ArrowLeftRight, Star } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const FIRST_GREETINGS = [
  "반가워요!",
  "안녕하세요!",
  "환영합니다!",
  "어서오세요!",
  "만나서 반가워요!",
  "좋은 하루예요!",
];

const SECOND_GREETINGS = [
  "이야기 나누러 오셨나요?",
  "오늘 하루는 어떠셨나요?",
  "잠시 쉬어가시겠어요?",
  "특별한 순간을 공유해주세요",
  "기억에 남는 순간이 있나요?",
  "함께 이야기를 나눠볼까요?",
  "편하게 이야기해주세요",
  "여기서 잠시 머물러보세요",
  "당신의 이야기가 궁금해요",
  "무슨 이야기를 들려주실 건가요?"
];

const StartGuide = ({ 
  isVisible, 
  duration = 50000,
  onKeyInteraction = false,
  currentState
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const [firstGreeting, setFirstGreeting] = useState(FIRST_GREETINGS[0]);
  const [secondGreeting, setSecondGreeting] = useState(SECOND_GREETINGS[0]);
  const [exitFast, setExitFast] = useState(false);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);

  const selectNewGreetings = () => {
    const newFirstGreeting = FIRST_GREETINGS[Math.floor(Math.random() * FIRST_GREETINGS.length)];
    const newSecondGreeting = SECOND_GREETINGS[Math.floor(Math.random() * SECOND_GREETINGS.length)];
    
    if (newFirstGreeting === firstGreeting && FIRST_GREETINGS.length > 1) {
      selectNewGreetings();
      return;
    }
    if (newSecondGreeting === secondGreeting && SECOND_GREETINGS.length > 1) {
      selectNewGreetings();
      return;
    }

    setFirstGreeting(newFirstGreeting);
    setSecondGreeting(newSecondGreeting);
  };

  useEffect(() => {
    if (isVisible) {
      setShowGuide(true);
      setExitFast(false);
      
      // 가이드가 처음 나타날 때만 효과음 재생
      if (!hasPlayedWelcome) {
        sounds.welcome();
        setHasPlayedWelcome(true);
      }

      if (!onKeyInteraction) {
        const timer = setTimeout(() => {
          setShowGuide(false);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      // 키 상호작용으로 인한 종료인 경우 빠른 종료 설정
      setExitFast(onKeyInteraction);
      setShowGuide(false);
      
      // 가이드가 사라질 때 hasPlayedWelcome 초기화
      if (!isVisible && hasPlayedWelcome) {
        setHasPlayedWelcome(false);
      }
    }
  }, [isVisible, duration, onKeyInteraction, currentState, hasPlayedWelcome]);

  const exitDuration = exitFast ? 0.25 : 0.5;  // 빠른 종료시 0.25초, 일반 종료시 0.5초

  return (
    <AnimatePresence 
      mode="wait"
      onExitComplete={selectNewGreetings}
    >
      {showGuide && (
        <motion.div 
          className="fixed inset-0 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: exitDuration, ease: "easeInOut" }}
        >
          <div className="fixed inset-0 flex flex-col justify-between py-32">
            <motion.div
              className="flex justify-center items-center w-full"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: exitDuration + 0.3 }}
            >
              <motion.div
                className="flex flex-col items-center gap-4"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center gap-4">
                  <HandMetal size={56} className="text-indigo-500" />
                  <span className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                    {firstGreeting}
                  </span>
                </div>
                <span className="text-6xl font-extrabold text-gray-800">
                  {secondGreeting}
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex justify-center items-center w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: exitDuration + 0.3, delay: 0.2 }}
            >
              <div className="flex justify-between w-[800px]">
                <motion.div
                  className="flex flex-col items-center gap-4 w-[200px]"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <span className="text-4xl font-black text-gray-800">시작</span>
                  <span className="text-2xl font-bold text-gray-600">Enter</span>
                </motion.div>

                <motion.div 
                  className="flex flex-col items-center gap-4 w-[200px]"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                >
                  <span className="text-4xl font-black text-gray-800">이동</span>
                  <div className="flex items-center gap-3">
                    <ArrowLeftRight size={32} className="text-gray-600" />
                    <span className="text-2xl font-bold text-gray-600">방향키</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex flex-col items-center gap-4 w-[200px]"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                >
                  <span className="text-4xl font-black text-gray-800">취소</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-600">ESC</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="fixed bottom-4 right-5 text-gray-600 flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              exit={{ opacity: 0 }}
              transition={{ duration: exitDuration + 0.7 }}
            >
              <span className="text-lg">F11 키를 눌러 전체화면으로 즐기세요.</span>
              
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartGuide;