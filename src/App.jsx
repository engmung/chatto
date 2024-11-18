import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  THEME_INACTIVE_TIMEOUT: 20000, 
  CHAT_INACTIVE_TIMEOUT: 40000,
  SCROLL_SENSITIVITY: 50,
  SCROLL_COOLDOWN: 250,
  TOUCH_SENSITIVITY: 50
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
  const [isScrolling, setIsScrolling] = useState(false);

  const autoChangeInterval = useRef(null);
  const bounceAnimationRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const directionRef = useRef(1);
  const lastInactiveTime = useRef(null);
  const scrollTimeout = useRef(null);
  const lastWheelEvent = useRef(null);
  const touchStart = useRef(null);

  const clearAllTimers = () => {
    if (autoChangeInterval.current) {
      clearInterval(autoChangeInterval.current);
      autoChangeInterval.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = null;
    }
    lastInactiveTime.current = null;
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
    
    if (window.history.state?.page !== 'idle') {
      window.history.go(-window.history.length + 1);
    }

    setTimeout(() => {
      setIsChatClosing(false);
      startIdleMode();
    }, 500);
  };

  const handleInteraction = () => {
    setLastActivityTime(Date.now());
    
    if (currentState === 'idle') {
      setHasKeyInteraction(true);
    }
  };

  const handleThemeChange = (changeDirection) => {
    handleInteraction();
    if ((currentState === 'active' || currentState === 'idle') && 
        !bounceAnimationRef.current && !isTransitioning) {
      const nextTheme = currentTheme + changeDirection;
      
      if (nextTheme < 0 || nextTheme >= themes.length) {
        return;
      }
      
      sounds.move();
      
      if (currentState === 'active') {
        setIsTransitioning(true);
        setPreviousText(currentText);
        setCurrentText(themes[nextTheme].question);
        setTextState('transitioning');
        
        const textUpdateTimeout = setTimeout(() => {
          if (currentState === 'active') {
            setTextState('active');
            setIsTransitioning(false);
          }
        }, 900);
      } else if (currentState === 'idle') {
        setIsTransitioning(false);
        setTextState('none');
        setPreviousText(null);
        setCurrentText(null);
        startAutoChange();
      }
      
      setCurrentTheme(nextTheme);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();

    if (isChatOpen || isTransitioning) return;

    const currentTime = Date.now();
    
    if (lastWheelEvent.current && currentTime - lastWheelEvent.current < CONFIG.SCROLL_COOLDOWN) {
      return;
    }

    const scrollDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    
    if (Math.abs(scrollDelta) > CONFIG.SCROLL_SENSITIVITY) {
      const direction = scrollDelta > 0 ? 1 : -1;
      handleThemeChange(direction);
      lastWheelEvent.current = currentTime;
      
      setIsScrolling(true);
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, CONFIG.SCROLL_COOLDOWN);
    }
  };

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!touchStart.current) return;
    
    const touchEnd = e.touches[0].clientX;
    const delta = touchStart.current - touchEnd;

    if (Math.abs(delta) > CONFIG.TOUCH_SENSITIVITY) {
      const direction = delta > 0 ? 1 : -1;
      handleThemeChange(direction);
      touchStart.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStart.current = null;
  };

  const handleStateChange = () => {
    handleInteraction();
    sounds.select();
    lastInactiveTime.current = Date.now();
    
    if (currentState === 'active') {
      setIsChatOpen(true);
      window.history.pushState({ page: 'chat' }, '');
    } else {
      setTimeout(() => {
        setIsActive(true);
        setCurrentState('active');
        setCurrentText(themes[Math.round(currentTheme)].question);
        setTextState('entering');
        
        window.history.pushState({ page: 'active' }, '');
        
        setTimeout(() => {
          setTextState('active');
        }, 1150);

        if (autoChangeInterval.current) {
          clearInterval(autoChangeInterval.current);
          autoChangeInterval.current = null;
        }
      });
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

  const handlePopState = useCallback((event) => {
    if (isChatOpen) {
      handleChatClose();
    } else if (currentState === 'active') {
      setCurrentState('idle');
      setTextState('none');
      setIsActive(false);
      
      if (autoChangeInterval.current) {
        clearInterval(autoChangeInterval.current);
      }
      
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
  }, [isChatOpen, currentState, themes.length]);

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    const element = document.body;
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [currentTheme, isTransitioning, isChatOpen]);

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
          handleEscapeBack();
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

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    window.history.pushState({ page: 'idle' }, '');

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState]);

  const renderDirectionArrows = () => {
    if (currentState !== 'active') return null;

    return (
      <AnimatePresence mode="sync">
        {!isChatOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed top-1/2 transform -translate-y-1/2 w-full px-8 flex justify-between"
          >
            <AnimatePresence mode="sync">
              {currentTheme > 0 && (
                <motion.div 
                  key="left-arrow"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: isScrolling ? 0.4 : 1,
                    x: 0,
                    scale: isScrolling ? 0.95 : 1
                  }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="text-gray-600 animate-pulse cursor-pointer"
                  onClick={() => !isTransitioning && handleThemeChange(-1)}
                >
                  <ArrowLeft size={64} strokeWidth={2.5} />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex-grow" />
            
            <AnimatePresence mode="sync">
              {currentTheme < themes.length - 1 && (
                <motion.div 
                  key="right-arrow"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ 
                    opacity: isScrolling ? 0.4 : 1,
                    x: 0,
                    scale: isScrolling ? 0.95 : 1
                  }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="text-gray-600 animate-pulse cursor-pointer"
                  onClick={() => !isTransitioning && handleThemeChange(1)}
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

  const handleEscapeBack = () => {
    sounds.reset();
    
    if (isChatOpen) {
      setIsChatOpen(false);
      setIsChatClosing(true);
      window.history.back();
      setTimeout(() => {
        setIsChatClosing(false);
      }, 500);
    } else if (currentState === 'active') {
      setIsTransitioning(false);
      setTextState('none');
      setPreviousText(null);
      setCurrentText(null);
      
      setCurrentState('idle');
      setIsActive(false);
      window.history.back();
      
      if (autoChangeInterval.current) {
        clearInterval(autoChangeInterval.current);
      }
      
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

  const handleSceneClick = (clickedTheme = null) => {
    handleInteraction();
    
    if (currentState === 'idle' && clickedTheme !== null) {
      const targetTheme = clickedTheme;
      if (targetTheme !== currentTheme) {
        sounds.move();
        setCurrentTheme(targetTheme);
        startAutoChange();
      }
    } else if (currentState === 'idle') {
      handleStateChange();
    } else if (currentState === 'active' && !isChatOpen) {
      handleStateChange();
    }
  };

  return (
    <div 
      className="h-screen w-screen relative style={{ backgroundColor: '#eeeeee' }}"
      style={{ touchAction: 'none' }}
    >
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
        onSceneClick={handleSceneClick}
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