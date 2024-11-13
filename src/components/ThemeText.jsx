import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TextContent = ({ text, className = "" }) => (
  <div className={`flex flex-col items-center space-y-4 absolute w-full ${className}`}>
    <div className="text-gray-800 text-4xl font-bold">
      {text}
    </div>
    <div className="text-gray-400 text-4xl font-bold opacity-30">
      {text}
    </div>
  </div>
);

const ThemeText = ({ 
  textState, 
  currentText, 
  previousText, 
  currentTheme,
  isTransitioning 
}) => {
  if (isTransitioning && textState !== 'transitioning') return null;

  return (
    <div className="absolute left-1 top-1/2 -mt-32 w-full text-center z-[1]">
      <AnimatePresence mode="sync">  {/* 여기만 "wait"에서 "sync"로 변경 */}
        {textState === 'entering' && (
          <motion.div
            key={`enter-${currentTheme}`}
            initial={{ opacity: 0, y: -90 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 1.1,
              ease: "easeOut",
              delay: 0.1
            }}
          >
            <TextContent text={currentText} />
          </motion.div>
        )}

        {textState === 'transitioning' && previousText && (
          <motion.div
            key={`prev-${currentTheme}-exit`}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -30 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ 
              duration: 0.5,
              ease: "easeInOut"
            }}
          >
            <TextContent text={previousText} />
          </motion.div>
        )}
        
        {textState === 'transitioning' && (
          <motion.div
            key={`current-${currentTheme}-enter`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5,
              ease: "easeInOut",
              delay: 0.05
            }}
          >
            <TextContent text={currentText} />
          </motion.div>
        )}

        {textState === 'active' && (
          <TextContent text={currentText} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeText;