import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Scene3D from './components/Scene3D';
import ThemeText from './components/ThemeText';
import ChatInterface from './components/ChatInterface';
import StartGuide from './components/StartGuide';
import BackgroundMusic from './components/BackgroundMusic';
import { initialThemeData, generateThemeData } from './themes';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { sounds } from './utils/soundEffects';

const CONFIG = {
  GUIDE_SHOW_INTERVAL: 20000,    
  GUIDE_DURATION: 10000,         
  THEME_INACTIVE_TIMEOUT: 20000, 
  CHAT_INACTIVE_TIMEOUT: 40000   
};

const App = () => {
  const [currentState, setCurrentState] = useState('idle');
  const [currentTheme, setCurrentTheme] = useState(0);
  const [direction, setDirection] = useState(1);
  const [textState, setTextState] = useState('none');
  const [previousText, setPreviousText] = useState(null);
  const [currentText, setCurrentText] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatClosing, setIsChatClosing] = useState(false);
  const [themes, setThemes] = useState(initialThemeData);
  const [hasKeyInteraction, setHasKeyInteraction] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [isActive, setIsActive] = useState(false);
  const [hasUserInteraction, setHasUserInteraction] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  const autoChangeInterval = useRef(null);
  const bounceAnimationRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const guideTimerRef = useRef(null);
  const directionRef = useRef(1);
  const lastInactiveTime = useRef(null);

  const clearAllTimers = () => {
  if (autoChangeInterval.current) {
    clearInterval(autoChangeInterval.current);
    autoChangeInterval.current = null;
  }
  if (inactivityTimerRef.current) {
    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = null;
  }
  if (guideTimerRef.current) {
    clearTimeout(guideTimerRef.current);
    guideTimerRef.current = null;
  }
  lastInactiveTime.current = null;
};

  const startGuideTimer = () => {
    if (guideTimerRef.current) {
      clearTimeout(guideTimerRef.current);
    }
    
    if (currentState === 'idle' && !hasKeyInteraction) {
      guideTimerRef.current = setTimeout(() => {
        setHasKeyInteraction(true);
        setTimeout(() => {
          setHasKeyInteraction(false);
        }, CONFIG.GUIDE_DURATION);
      }, CONFIG.GUIDE_SHOW_INTERVAL);
    }
  };

  const checkAndResetInactivity = () => {
  if (!hasKeyInteraction && lastInactiveTime.current) {
    const currentTime = Date.now();
    const inactiveTime = currentTime - lastInactiveTime.current;
    const timeout = isChatOpen ? CONFIG.CHAT_INACTIVE_TIMEOUT : CONFIG.THEME_INACTIVE_TIMEOUT;

    if (inactiveTime >= timeout) {
      handleReset();
      lastInactiveTime.current = null;
    }
  }
};

  const startInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    const timeout = isChatOpen ? CONFIG.CHAT_INACTIVE_TIMEOUT : CONFIG.THEME_INACTIVE_TIMEOUT;
    inactivityTimerRef.current = setTimeout(() => {
      handleReset();
    }, timeout);
  };

  const startAutoChange = () => {
    if (autoChangeInterval.current) {
      clearInterval(autoChangeInterval.current);
    }

    if (currentState === 'idle') {
      setDirection(1);
      directionRef.current = 1;
      
      autoChangeInterval.current = setInterval(() => {
        setCurrentTheme(prev => {
          if (prev === themes.length - 1) {
            setDirection(-1);
            directionRef.current = -1;
            return prev - 1;
          }
          else if (prev === 0) {
            setDirection(1);
            directionRef.current = 1;
            return prev + 1;
          }
          return prev + directionRef.current;
        });
      }, 7000);
    }
  };

  const startIdleMode = () => {
  clearAllTimers();
  setCurrentState('idle');
  setTextState('none');
  setThemes(generateThemeData());
  setCurrentTheme(0);
  setHasKeyInteraction(false);
  setIsActive(false);
  startAutoChange();
};

  window.resetToIdle = startIdleMode;

  const handleReset = () => {
  sounds.reset();
  setIsChatOpen(false);
  setIsChatClosing(true);

  // 채팅 인터페이스 애니메이션 완료 후 상태 리셋
  setTimeout(() => {
    setIsChatClosing(false);
    startIdleMode();
  }, 500);  // 채팅창 닫힘 애니메이션과 동일한 시간
};

  const handleInteraction = () => {
    setLastActivityTime(Date.now());
    
    if (currentState === 'idle') {
      setHasKeyInteraction(true);
      if (guideTimerRef.current) {
        clearTimeout(guideTimerRef.current);
      }
    }
  };

  // 테마 변경 시
const handleThemeChange = (changeDirection) => {
  handleInteraction();
  if ((currentState === 'active' || currentState === 'idle') && 
      !bounceAnimationRef.current && !isTransitioning) {
    const nextTheme = currentTheme + changeDirection;
    
    if (nextTheme < 0 || nextTheme >= themes.length) {
      return;
    }
    
    sounds.move();

    
    
    // 비전 처리 일시 중지 (매우 짧은 시간만)
    setTimeout(() => {
      // visionService.suspend();
    }, 100);
    
    if (currentState === 'active') {
      setIsTransitioning(true);
      setPreviousText(currentText);
      setCurrentText(themes[nextTheme].question);
      setTextState('transitioning');
    }
    
    setCurrentTheme(nextTheme);

    const textUpdateTimeout = setTimeout(() => {
      if (currentState === 'active') {
        setTextState('active');
        setIsTransitioning(false);
      }
    }, 900);

    if (currentState === 'idle') {
      startAutoChange();
      clearTimeout(textUpdateTimeout);
    }
  }
};


  const handleStateChange = () => {
    handleInteraction();
    sounds.select();
    lastInactiveTime.current = Date.now();
    
    if (currentState === 'active') {
      setIsChatOpen(true);
    } else {
      setTimeout(() => {
        setIsActive(true);
        setCurrentState('active');
        setCurrentText(themes[Math.round(currentTheme)].question);
        setTextState('entering');
        
        setTimeout(() => {
          setTextState('active');
        }, 1150);

        if (autoChangeInterval.current) {
          clearInterval(autoChangeInterval.current);
          autoChangeInterval.current = null;
        }
      }, );
    }
    
    handleInteraction();
  };

  const handleChatClose = () => {
    handleInteraction();
    sounds.close();
    setIsChatClosing(true);
    setIsChatOpen(false);
    setTimeout(() => {
      setIsChatClosing(false);
    }, 500);
  };

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (!hasKeyInteraction && (currentState === 'active' || isChatOpen)) {
        checkAndResetInactivity();
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [hasKeyInteraction, currentState, isChatOpen]);

  useEffect(() => {
  if (!hasKeyInteraction && (currentState === 'active' || isChatOpen)) {
    startInactivityTimer();
  }
}, [hasKeyInteraction, currentState, isChatOpen]);

  useEffect(() => {
    if (currentState === 'idle') {
      startAutoChange();
    }
    return () => clearAllTimers();
  }, [currentState]);

  useEffect(() => {
  const handleKeyPress = (e) => {
    handleInteraction();
    setHasUserInteraction(true);

    if (e.key === 'Escape') {
      if (isChatOpen || currentState === 'active') {
        handleReset();
      }
    }
    
    if (isChatOpen) return;

    if (currentState === 'idle' && (e.key === ' ' || e.key === 'Enter')) {
      handleStateChange();
    } else if (currentState === 'active') {
      if ((e.key === 'ArrowLeft' || e.key === 'a') && !isTransitioning) {
        handleThemeChange(-1);
      } else if ((e.key === 'ArrowRight' || e.key === 'd') && !isTransitioning) {
        handleThemeChange(1);
      } else if (e.key === ' ' || e.key === 'Enter') {
        handleStateChange();
      }
    } else if (currentState === 'idle') {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        handleThemeChange(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        handleThemeChange(1);
      }
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentState, currentTheme, isTransitioning, isChatOpen]);

  useEffect(() => {
    if (currentState === 'idle') {
      startGuideTimer();
    }
    return () => {
      if (guideTimerRef.current) {
        clearTimeout(guideTimerRef.current);
      }
    };
  }, [currentState, hasKeyInteraction]);

  useEffect(() => {
    // idle 상태일 때는 타이머를 실행하지 않음
    if (currentState === 'idle') return;

    const inactivityCheck = setInterval(() => {
      const currentTime = Date.now();
      const inactiveTime = currentTime - lastActivityTime;
      const timeout = isChatOpen ? CONFIG.CHAT_INACTIVE_TIMEOUT : CONFIG.THEME_INACTIVE_TIMEOUT;

      if (inactiveTime >= timeout) {
        handleReset();
      }
    }, 1000);

    return () => clearInterval(inactivityCheck);
  }, [currentState, isChatOpen, lastActivityTime]);

  const renderDirectionArrows = () => {
  if (currentState !== 'active') return null;

  return (
    <AnimatePresence mode="sync"> {/* "wait"에서 "sync"로 변경 */}
      {!isChatOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed top-1/2 transform -translate-y-1/2 w-full px-8 flex justify-between pointer-events-none"
        >
          <AnimatePresence mode="sync"> {/* 여기도 "sync"로 설정 */}
            {currentTheme > 0 && (
              <motion.div 
                key="left-arrow"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="text-gray-600 animate-pulse"
              >
                <ArrowLeft size={64} strokeWidth={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex-grow" />
          
          <AnimatePresence mode="sync"> {/* 여기도 "sync"로 설정 */}
            {currentTheme < themes.length - 1 && (
              <motion.div 
                key="right-arrow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="text-gray-600 animate-pulse"
              >
                <ArrowRight size={64} strokeWidth={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
  };
  
  
  return (
    <div className="h-screen w-screen relative bg-white">
      <BackgroundMusic 
        currentState={currentState}
        isChatOpen={isChatOpen}
        volume={0.5}
        fadeTime={1000}
        hasInteraction={hasUserInteraction}
      />
      <Scene3D 
        currentState={currentState}
        currentTheme={Math.round(currentTheme)}
        isChatOpen={isChatOpen}
        themes={themes}
      />
      <StartGuide 
        isVisible={currentState === 'idle' && !hasKeyInteraction}
        currentState={currentState}
        onKeyInteraction={hasKeyInteraction}
      />
      <ThemeText
        textState={textState}
        currentText={currentText}
        previousText={previousText}
        currentTheme={currentTheme}
        isTransitioning={isTransitioning}
        themes={themes}
        isChatOpen={isChatOpen}
      />
      {renderDirectionArrows()}
      <ChatInterface 
        isOpen={isChatOpen}
        isClosing={isChatClosing}
        currentQuestion={themes[Math.round(currentTheme)].question}
        currentTheme={currentTheme}
        onClose={handleChatClose}
        themeColor={themes[Math.round(currentTheme)].color}
        onInteraction={handleInteraction}
      />
    </div>
  );
};

export default App;