import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, Percent } from 'lucide-react';
import chatService from '../services/aiChatService';
import { chatStorageService } from '../services/chatStorageService';
import { sounds } from '../utils/soundEffects';

const LoadingDots = () => (
  <div className="flex space-x-2 items-center">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.2 }}
        className="w-2 h-2 bg-gray-400 rounded-full"
      />
    ))}
  </div>
);

const getSessionStyling = () => {
  const ICONS = [Plus, Minus, X, Percent];
  const aiIconIndex = Math.floor(Math.random() * ICONS.length);
  let userIconIndex;
  do {
    userIconIndex = Math.floor(Math.random() * ICONS.length);
  } while (userIconIndex === aiIconIndex);
  
  const hue = Math.floor(Math.random() * 360);
  const userColor = `hsla(${hue}, 85%, 85%, 0.7)`;
  
  return {
    aiIcon: ICONS[aiIconIndex],
    userIcon: ICONS[userIconIndex],
    userColor,
  };
};

const ChatMessage = React.memo(({ 
  message, 
  isAI, 
  isLoading, 
  distance, 
  themeColor,
  sessionStyling 
}) => {
  const IconComponent = isAI ? sessionStyling.aiIcon : sessionStyling.userIcon;
  const backgroundColor = isAI 
    ? `rgba(${themeColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.15)` 
    : sessionStyling.userColor;

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
        <div
          className={`rounded-2xl px-6 py-4 shadow-[0px_4px_8px_rgba(0,0,0,0.04)] ${
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

const ChatInterface = ({ 
  isOpen, 
  isClosing, 
  currentQuestion, 
  currentTheme, 
  onClose, 
  themeColor, 
  onInteraction 
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [conversationCount, setConversationCount] = useState(0);
  const [isExhibitionEnding, setIsExhibitionEnding] = useState(false);
  const [isFinalMessage, setIsFinalMessage] = useState(false);
  const [isClosingSequence, setIsClosingSequence] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [sessionStyling] = useState(getSessionStyling);

  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  
  const MESSAGE_DELAY = 2000;

  const resetChatState = () => {
    setMessages([]);
    setInputValue('');
    setShouldAutoScroll(true);
    setConversationCount(0);
    setIsExhibitionEnding(false);
    setIsFinalMessage(false);
    setIsClosingSequence(false);
    setConversationHistory([]);
    isProcessingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const createGradient = (color, type = 'vertical') => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    return type === 'vertical'
      ? `linear-gradient(180deg, 
          rgba(${r},${g},${b},0.25) 0%,
          rgba(${r},${g},${b},0.20) 10%,
          rgba(${r},${g},${b},0.16) 20%,
          rgba(${r},${g},${b},0.12) 30%,
          rgba(${r},${g},${b},0.08) 40%,
          rgba(${r},${g},${b},0.04) 50%,
          rgba(${r},${g},${b},0.02) 60%,
          rgba(${r},${g},${b},0) 100%)`
      : `linear-gradient(90deg,
          rgba(${r},${g},${b},0.25) 0%,
          rgba(${r},${g},${b},0.16) 20%,
          rgba(${r},${g},${b},0.08) 40%,
          rgba(${r},${g},${b},0.04) 50%,
          rgba(${r},${g},${b},0.08) 60%,
          rgba(${r},${g},${b},0.16) 80%,
          rgba(${r},${g},${b},0.25) 100%)`;
  };

  const scrollToBottom = () => {
    if (shouldAutoScroll && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setShouldAutoScroll(isAtBottom);
  };

  const addAIMessage = async (message, showLoading = true, delay = MESSAGE_DELAY) => {
    if (showLoading) {
      setMessages(prev => [...prev, { text: '', isAI: true, isLoading: true }]);
      await new Promise(resolve => setTimeout(resolve, delay));
      setMessages(prev => prev.filter(msg => !msg.isLoading));
    }
    sounds.aiMessage();
    setMessages(prev => [...prev, { text: message, isAI: true }]);
  };

  const playEndingSequence = async () => {
    setIsClosingSequence(true);
    
    await addAIMessage("소중한 기억을 나눠주셔서 감사합니다.", true, MESSAGE_DELAY);
    await addAIMessage("이 순간도 좋은 기억으로 남길 바랍니다.", true, MESSAGE_DELAY);
    await addAIMessage("안녕히 가세요!", true, MESSAGE_DELAY/2);
    
    sounds.special();
    
    await addAIMessage(
      <div className="flex flex-col items-center pt-8 relative">
        <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-purple-300 to-transparent mb-6"/>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-semibold mb-2"
        >
          <span className="bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 bg-clip-text text-transparent">
            Interactive Experience by
          </span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative p-3"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-radial from-rose-100 via-purple-50 to-blue-100 opacity-70" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-200/20 via-purple-200/20 to-blue-200/20" />
          <div className="relative">
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x font-bold text-2xl">
              이승훈
            </span>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base mt-2 mb-6 font-medium"
        >
          <span className="text-gray-800">
            자율전공 / 시각디자인 / 23학번
          </span>
        </motion.div>
        <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-purple-300 to-transparent mb-6"/>
      </div>, 
      false, 
      MESSAGE_DELAY
    );

    await new Promise(resolve => setTimeout(resolve, 7000));
    resetChatState();
    onClose();
    if (window.resetToIdle) {
      window.resetToIdle();
    }
  };

  // 채팅이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen && !isClosing) {
      resetChatState();
    }
  }, [isOpen, isClosing]);

  // 테마 변경 시 대화 상태 초기화
  useEffect(() => {
    if (isOpen) {
      resetChatState();
      const initChat = async () => {
        try {
          setMessages([{ text: "안녕하세요!", isAI: true }]);
          const firstQuestion = await chatService.getInitialQuestion(currentQuestion);
          await addAIMessage(firstQuestion, true, MESSAGE_DELAY);
          setConversationHistory([{ role: "assistant", content: firstQuestion }]);
        } catch (error) {
          console.error('Chat initialization error:', error);
          await addAIMessage(currentQuestion, true, MESSAGE_DELAY);
        }
      };
      initChat();
    }
  }, [currentTheme, isOpen]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onInteraction?.();
    
    if (e.target.value) {
      const hasTypingMessage = messages.some(msg => msg.isTypingMessage);
      if (!hasTypingMessage) {
        setMessages(prev => [...prev, { text: '', isAI: false, isLoading: true, isTypingMessage: true }]);
      }
    } else {
      setMessages(prev => prev.filter(msg => !msg.isTypingMessage));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessingRef.current || isClosingSequence) return;

    onInteraction?.();
    isProcessingRef.current = true;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const userMessage = inputValue;
    setInputValue('');
    
    sounds.userMessage();
    
    setMessages(prev => {
      const filteredMessages = prev.filter(msg => !msg.isTypingMessage);
      return [...filteredMessages, { text: userMessage, isAI: false }];
    });

    const newHistory = [...conversationHistory, { role: "user", content: userMessage }];
    setConversationHistory(newHistory);

    if (isFinalMessage) {
      await playEndingSequence();
    } else {
      const newCount = conversationCount + 1;
      setConversationCount(newCount);

      if (newCount >= 3) {
        setIsExhibitionEnding(true);
        setIsFinalMessage(true);
        await addAIMessage("좋아요~ 아쉽게도 이제 대화를 마무리할 시간이네요.", true, MESSAGE_DELAY);
        await addAIMessage("다른 작품들도 재미있으니 즐겁게 관람하시길 바랍니다!", true, MESSAGE_DELAY);
        await addAIMessage("관람 후기에 대한 한 줄 소감 부탁드려요~!", true, MESSAGE_DELAY);
      } else {
        const aiResponse = await chatService.sendMessage(
          userMessage,
          currentQuestion,
          newHistory
        );
        await addAIMessage(aiResponse, true, MESSAGE_DELAY);
        setConversationHistory(prev => [...prev, { role: "assistant", content: aiResponse }]);
      }
    }
    
    isProcessingRef.current = false;
  };

  const handleChatClose = () => {
    sounds.close();
    setIsChatClosing(true);
    setIsChatOpen(false);
    
    setTimeout(() => {
      setIsChatClosing(false);
      resetChatState();
    }, 500);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <AnimatePresence mode="wait">
      {(isOpen || isClosing) && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ 
                opacity: isClosing ? 0 : 1,
                y: isClosing ? 100 : 0
              }}
              transition={{ 
                duration: 0.5,
                ease: "easeInOut"
              }}
              className="bg-[#F5F5F5]/70 backdrop-blur-[4px] rounded-[30px] w-[1300px] h-[875px] mx-4 flex flex-col shadow-[0px_0px_20px_5px_rgba(0,0,0,0.07)] relative"
            >
              <div 
                className="absolute inset-0 rounded-[30px] pointer-events-none"
                style={{
                  background: createGradient(themeColor),
                  height: '400px'
                }}
              />

              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto scrollbar-hide flex flex-col"
                style={{ 
                  marginTop: '100px',
                  marginBottom: '80px',
                  maskImage: 'linear-gradient(to top, black 85%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to top, black 85%, transparent 100%)'
                }}
              >
                <div className="flex-grow" />
                {messages.map((msg, idx) => (
                  <ChatMessage 
                    key={idx}
                    message={msg.text}
                    isAI={msg.isAI}
                    isLoading={msg.isLoading}
                    distance={messages.length - idx - 1}
                    themeColor={themeColor}
                    sessionStyling={sessionStyling}
                  />
                ))}
                <div className="flex-grow" />
              </div>

              <div className="px-8 pb-8 flex justify-center">
                <div className="w-[1200px] bg-white/70 backdrop-blur-[4px] rounded-xl overflow-hidden shadow-[0px_2px_10px_rgba(0,0,0,0.06)]">
                  <form onSubmit={handleSubmit} className="h-[50px] p-0">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={handleInputChange}
                      onFocus={() => onInteraction?.()}
                      disabled={isClosingSequence}
                      className="w-full h-full px-6 text-base focus:outline-none border-none bg-transparent"
                      placeholder={isClosingSequence ? "" : "Type your message..."}
                    />
                  </form>
                  <div className="h-[50px] relative">
                    <div 
                      className="absolute inset-0"
                      style={{ background: createGradient(themeColor, 'horizontal') }}
                    />
                    <img 
                      src="/images/brandBar.png"
                      alt="Brand"
                      className="w-full h-full object-contain relative z-10 scale-95"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatInterface;