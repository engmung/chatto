import React, { useState, useEffect, useRef } from 'react';
import Scene3D from './components/Scene3D';
import ThemeText from './components/ThemeText';
import themeData from './themes';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const App = () => {
  const [currentState, setCurrentState] = useState('idle');
  const [currentTheme, setCurrentTheme] = useState(0);
  const [direction, setDirection] = useState(1);
  const [textState, setTextState] = useState('none');
  const [previousText, setPreviousText] = useState(null);
  const [currentText, setCurrentText] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const autoChangeInterval = useRef(null);
  const bounceAnimationRef = useRef(null);
  const previousState = useRef('idle');
  const directionRef = useRef(1);

  const startAutoChange = () => {
    if (autoChangeInterval.current) return;
    
    if (previousState.current === 'active') {
      setDirection(1);
      directionRef.current = 1;
    }
    
    autoChangeInterval.current = setInterval(() => {
      if (currentState === 'idle') {
        setCurrentTheme(prev => {
          if (prev === themeData.length - 1) {
            setDirection(-1);
            directionRef.current = -1;
          }
          else if (prev === 0) {
            setDirection(1);
            directionRef.current = 1;
          }

          const nextTheme = prev + directionRef.current;
          
          if (nextTheme >= themeData.length) {
            return themeData.length - 1;
          }
          if (nextTheme < 0) {
            return 0;
          }
          
          return nextTheme;
        });
      }
    }, 7000); // 10초로 변경
  };

  const handleThemeChange = (changeDirection) => {
    if (currentState === 'active' && !bounceAnimationRef.current && !isTransitioning) {
      const nextTheme = currentTheme + changeDirection;
      
      if (nextTheme < 0 || nextTheme >= themeData.length) {
        return;
      }
      
      setIsTransitioning(true);
      setPreviousText(currentText);
      setCurrentText(themeData[nextTheme].question);
      setTextState('transitioning');
      setCurrentTheme(nextTheme);

      setTimeout(() => {
        setTextState('active');
        setIsTransitioning(false);
      }, 900);
    }
  };

  const handleStateChange = () => {
    previousState.current = currentState;
    setCurrentState('active');
    setCurrentText(themeData[Math.round(currentTheme)].question);
    setTextState('entering');
    
    setTimeout(() => {
      setTextState('active');
    }, 1150);

    if (autoChangeInterval.current) {
      clearInterval(autoChangeInterval.current);
      autoChangeInterval.current = null;
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (currentState === 'idle' && (e.key === ' ' || e.key === 'Enter')) {
        handleStateChange();
      } else if (currentState === 'active') {
        if (e.key === 'Escape') {
          setTextState('none');
          previousState.current = currentState;
          setCurrentState('idle');
          startAutoChange();
        } else if ((e.key === 'ArrowLeft' || e.key === 'a') && !isTransitioning) {
          handleThemeChange(-1);
        } else if ((e.key === 'ArrowRight' || e.key === 'd') && !isTransitioning) {
          handleThemeChange(1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentState, currentTheme, isTransitioning]);

  useEffect(() => {
    if (currentState === 'idle') {
      startAutoChange();
    }
    return () => {
      if (autoChangeInterval.current) {
        clearInterval(autoChangeInterval.current);
        autoChangeInterval.current = null;
      }
    };
  }, [currentState]);

  // 방향 화살표 렌더링
  const renderDirectionArrows = () => {
  if (currentState !== 'active') return null;

  return (
    <div className="fixed top-1/2 transform -translate-y-1/2 w-full px-8 flex justify-between pointer-events-none">
      {currentTheme > 0 && (
        <div className="text-gray-600 animate-pulse">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </div>
      )}
      <div className="flex-grow" /> {/* 중앙 공간 */}
      {currentTheme < themeData.length - 1 && (
        <div className="text-gray-600 animate-pulse">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      )}
    </div>
  );
};

  return (
    <div className="h-screen w-screen relative bg-white">
      <Scene3D 
        currentState={currentState}
        currentTheme={Math.round(currentTheme)}
      />
      <ThemeText
        textState={textState}
        currentText={currentText}
        previousText={previousText}
        currentTheme={currentTheme}
        isTransitioning={isTransitioning}
      />
      {renderDirectionArrows()}
    </div>
  );
};

export default App;