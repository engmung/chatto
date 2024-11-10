import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandMetal, ArrowLeftRight, Star } from 'lucide-react';

const StartGuide = ({ 
  isVisible, 
  duration = 8000,
  onKeyInteraction = false,
  currentState
}) => {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowGuide(true);
      if (!onKeyInteraction) {
        const timer = setTimeout(() => {
          setShowGuide(false);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setShowGuide(false);
    }
  }, [isVisible, duration, onKeyInteraction, currentState]);

  return (
    <AnimatePresence mode="wait">
      {showGuide && (
        <motion.div 
          className="fixed inset-0 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Main Guide Content */}
          <div className="fixed inset-0 flex flex-col justify-between py-32">
            {/* Welcome Message */}
            <motion.div
              className="flex justify-center items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="flex flex-col items-center gap-4"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center gap-4">
                  <HandMetal size={56} className="text-indigo-500" />
                  <span className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                    반가워요!
                  </span>
                </div>
                <span className="text-6xl font-extrabold text-gray-800">
                  이야기 나누러 오셨나요?
                </span>
              </motion.div>
            </motion.div>

            {/* Controls Guide */}
            <motion.div
              className="flex justify-center gap-32"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Start Control */}
              <motion.div
                className="flex flex-col items-center gap-4"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <span className="text-4xl font-black text-gray-800">시작</span>
                <span className="text-2xl font-bold text-gray-600">스페이스 or 엔터</span>
              </motion.div>

              {/* Navigation Control */}
              <motion.div 
                className="flex flex-col items-center gap-4"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
              >
                <span className="text-4xl font-black text-gray-800">이동</span>
                <div className="flex items-center gap-3">
                  <ArrowLeftRight size={32} className="text-indigo-500" />
                  <span className="text-2xl font-bold text-gray-600">방향키 or 손 스와이프</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Credits */}
          <motion.div
            className="fixed bottom-8 right-10 text-gray-600 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <Star size={24} className="text-yellow-500" />
            <span className="text-2xl">Powered by</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              이승훈
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartGuide;