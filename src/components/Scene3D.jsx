import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import ThemeSphere from './ThemeSphere';
import CameraController from './CameraController';
import { initialThemeData } from '../themes';

// 그림자 텍스처 생성
const createShadowTexture = () => {
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size/2, size/2, 0,
    size/2, size/2, size/2
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15;
    data[i + 3] = Math.max(0, Math.min(255, data[i + 3] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
};

// 애니메이션이 있는 그림자 스프라이트 컴포넌트
const AnimatedShadow = React.memo(({ position, isActive, state }) => {
  const sprite = useRef();
  const scaleRef = useRef(0.8);
  const targetScale = isActive ? (state === 'active' ? 1.8 : 1) : 0.6;
  const positionY = useRef(-0.7);

  const texture = useMemo(() => {
    const canvas = createShadowTexture();
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (!sprite.current) return;
    
    const lerpSpeed = 5;
    
    // 크기 애니메이션
    const scaleDelta = (targetScale - scaleRef.current) * lerpSpeed * delta;
    scaleRef.current += scaleDelta;
    sprite.current.scale.setScalar(scaleRef.current);

    // y 위치 애니메이션
    let targetY = -0.3;
    if (state !== 'active') {
      const time = _.clock.getElapsedTime();
      const baseFreq = 0.6;
      const waveSpeed = 2;
      const amplitude = 0.1;
      const wave = Math.sin(time * waveSpeed + position[0] * baseFreq) * amplitude;
      targetY += wave * 0.9;
    }
    
    const yDelta = (targetY - positionY.current) * lerpSpeed * delta;
    positionY.current += yDelta;
    
    sprite.current.position.set(
      position[0],
      positionY.current,
      position[2] - 0.01
    );
  });

  return (
    <sprite ref={sprite} position={[position[0], positionY.current, position[2] - 0.01]}>
      <spriteMaterial
        transparent
        opacity={isActive ? 0.3 : 0.2}
        map={texture}
        depthWrite={false}
      />
    </sprite>
  );
});

const Scene3D = ({ currentState, currentTheme, isChatOpen, themes, onSceneClick }) => {
  const spacing = 1.5;
  const decorationCount = 3;
  const centerOffset = ((themes.length - 1) * spacing) / 2;
  
  const getThemePosition = (index) => [
    index * spacing - centerOffset,
    0,
    -1
  ];

  const createDecorationPositions = () => {
    const positions = [];
    for (let i = 1; i <= decorationCount; i++) {
      positions.push([-centerOffset - (i * spacing), 0, -1]);
    }
    for (let i = 1; i <= decorationCount; i++) {
      positions.push([centerOffset + (i * spacing), 0, -1]);
    }
    return positions;
  };

  const decorationPositions = createDecorationPositions();

  return (
    <div 
      className="w-full h-full absolute top-0 left-0"
      onClick={() => onSceneClick()}
    >
      <Canvas 
        dpr={[1, 1.5]}
        performance={{ 
          min: 0.5,
          max: 1,
          debounce: 200,
          regress: true
        }}
        gl={{
          powerPreference: "high-performance",
          antialias: false,
          stencil: false,
          depth: true,
          alpha: false,
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          contain: 'paint size layout',
          touchAction: 'none',
        }}
      >
        <color attach="background" args={['#cccccc']} />

        <OrthographicCamera 
          makeDefault 
          position={[0, 0, 5]} 
          zoom={150}
          rotation={[0, 0, 0]}
        />
        
        <CameraController
          currentState={currentState}
          currentTheme={currentTheme}
          spacing={spacing}
          centerOffset={centerOffset}
        />
        
        <ambientLight intensity={1.5} />
        <directionalLight position={[0, 4, 10]} intensity={3} />
        <directionalLight position={[-3, 3, 5]} intensity={0.4} />

        {/* 배경 평면 */}
        <mesh position={[0, -0.7, -2]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial 
            color="#eeeeee"
            roughness={1}
            metalness={0}
          />
        </mesh>
        
        {/* 장식용 그림자 */}
        {React.useMemo(() => 
          decorationPositions.map((position, i) => (
            <AnimatedShadow
              key={`decoration-shadow-${i}`}
              position={position}
              isActive={false}
              state={currentState}
            />
          ))
        , [currentState, decorationPositions])}
        
        {/* 테마 그림자 */}
        {React.useMemo(() => 
          themes.map((theme, i) => (
            <AnimatedShadow
              key={`theme-shadow-${i}`}
              position={getThemePosition(i)}
              isActive={Math.round(currentTheme) === i}
              state={currentState}
            />
          ))
        , [currentTheme, currentState, themes])}
        
        {/* 장식용 구들 */}
        {React.useMemo(() => 
          decorationPositions.map((position, i) => (
            <ThemeSphere
              key={`decoration-${i}`}
              position={position}
              isActive={false}
              state={currentState}
              isDecoration={true}
              color={'#cccccc'}
            />
          ))
        , [currentState, decorationPositions])}
        
        {/* 테마 구들 */}
        {React.useMemo(() => 
          themes.map((theme, i) => (
            <ThemeSphere
              key={theme.id}
              position={getThemePosition(i)}
              color={theme.color}
              isActive={Math.round(currentTheme) === i}
              state={currentState}
              isChatOpen={isChatOpen}
              onClick={(e) => {
                e.stopPropagation();
                onSceneClick(i);
              }}
            />
          ))
        , [currentTheme, currentState, isChatOpen, themes, onSceneClick])}
      </Canvas>
    </div>
  );
};

export default React.memo(Scene3D);