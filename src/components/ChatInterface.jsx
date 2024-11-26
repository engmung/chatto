import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, Percent } from 'lucide-react';
import chatService from '../services/aiChatService';
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
          rgba(${r},${g},${b},0.45) 0%,
          rgba(${r},${g},${b},0.45) 10%,
          rgba(${r},${g},${b},0.36) 20%,
          rgba(${r},${g},${b},0.32) 30%,
          rgba(${r},${g},${b},0.02) 60%,
          rgba(${r},${g},${b},0) 100%)`
      : `linear-gradient(90deg,
          rgba(${r},${g},${b},0.45) 0%,
          rgba(${r},${g},${b},0.36) 20%,
          rgba(${r},${g},${b},0.28) 40%,
          rgba(${r},${g},${b},0.24) 50%,
          rgba(${r},${g},${b},0.28) 60%,
          rgba(${r},${g},${b},0.36) 80%,
          rgba(${r},${g},${b},0.45) 100%)`;
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
    
    await addAIMessage("네, 그럼 소중한 이야기를 나눠주셔서 감사합니다.", true, MESSAGE_DELAY);
    await addAIMessage("이 순간도 좋은 기억으로 남길 바랍니다.", true, MESSAGE_DELAY);
    await addAIMessage("안녕히 가세요!", true, MESSAGE_DELAY/2);
    
    sounds.special();
    

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
        await addAIMessage("짧지만, 이야기를 해보니 어떤 느낌이 드셨나요?", true, MESSAGE_DELAY);
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
              className="bg-[#F5F5F5]/70 backdrop-blur-[4px] rounded-[30px] w-[1300px] h-[90vh] mx-4 flex flex-col shadow-[0px_0px_20px_5px_rgba(0,0,0,0.07)] relative"
            >
              <div 
                className="absolute inset-0 rounded-[30px] pointer-events-none"
                style={{
                  background: createGradient(themeColor),
                  height: '45%'
                }}
              />

              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto scrollbar-hide flex flex-col"
                style={{ 
                  marginTop: '11vh',
                  marginBottom: '9vh',
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

              <div className="px-8 pb-[2vh] flex justify-center">
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
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[1170px] relative flex items-center justify-center">
                        <div className="w-[1000px] h-[3px] bg-white" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex gap-2">
                          <Plus size={27} className="text-white" strokeWidth={3} />
                          <Minus size={27} className="text-white" strokeWidth={3} />
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
                          <X size={27} className="text-white" strokeWidth={3} />
                          <Percent size={27} className="text-white" strokeWidth={3} />
                        </div>
                      </div>
                    </div>
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