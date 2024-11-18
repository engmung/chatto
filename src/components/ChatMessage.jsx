import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, X, Percent } from 'lucide-react';

const ICONS = [Plus, Minus, X, Percent];

const getDistinctIconPair = () => {
  // 0부터 3까지의 숫자 중 랜덤하게 하나 선택 (AI용)
  const aiIconIndex = Math.floor(Math.random() * ICONS.length);
  
  // 남은 숫자들 중에서 랜덤하게 하나 선택 (사용자용)
  let userIconIndex;
  do {
    userIconIndex = Math.floor(Math.random() * ICONS.length);
  } while (userIconIndex === aiIconIndex);
  
  return {
    aiIcon: ICONS[aiIconIndex],
    userIcon: ICONS[userIconIndex]
  };
};

const ChatMessage = React.memo(({ message, isAI, isLoading, distance, themeColor, iconType, userColor }) => {
  const IconComponent = ICONS[iconType];
  const backgroundColor = isAI ? 
    `rgba(${themeColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.15)` : 
    white;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: Math.max(0.2, 1 - (distance * 0.08)), y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-6`}
    >
      <div className={`flex items-start gap-4 ${isAI ? 'ml-12 max-w-[70%]' : 'mr-12'}`}>
        {isAI && (
          <div 
            className="w-[50px] h-[50px] rounded-full shadow-md flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor }}
          >
            <IconComponent 
              size={28} 
              className="text-gray-800"
              strokeWidth={2.5}
            />
          </div>
        )}
        <div className={`rounded-2xl px-6 py-4 shadow-[0px_4px_8px_rgba(0,0,0,0.04)] ${
          isAI ? 'bg-white/80' : 'bg-[#d7d7d7]/70'  
        } text-base backdrop-blur-[4px]`}
          style={{ 
            minHeight: '50px',
            display: 'flex', 
            alignItems: 'center', 
            backdropFilter: 'blur(2px)',
            maxWidth: '100%',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
        >
          {isLoading ? <LoadingDots /> : message}
        </div>
        {!isAI && (
          <div 
            className="w-[50px] h-[50px] rounded-full shadow-md flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor }}
          >
            <IconComponent 
              size={28} 
              className="text-gray-800"
              strokeWidth={2.5}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default React.memo(ChatMessage);