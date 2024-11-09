import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, SoftShadows } from '@react-three/drei';
import ThemeSphere from './ThemeSphere';
import CameraController from './CameraController';
import themeData from '../themes';

const Scene3D = ({ currentState, currentTheme }) => {
  const spacing = 1.5;
  const decorationCount = 5;
  const centerOffset = ((themeData.length - 1) * spacing) / 2;
  
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
    <Canvas 
      shadows="soft"
      dpr={[1, 2]} // 성능과 품질의 균형
      performance={{ min: 0.5 }} // 성능 최적화
    >
      <color attach="background" args={['#FFFFFF']} />
      
      {/* 최적화된 소프트 쉐도우 설정 */}
      <SoftShadows 
        size={20} 
        samples={16}
        focus={1.6} 
        blur={1}
      />

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
      
      {/* 최적화된 조명 설정 */}
      <ambientLight intensity={1.5} />
      
      {/* 단일 주 디렉셔널 라이트로 단순화 */}
      <directionalLight
        position={[0, 4, 10]}
        intensity={3}
        castShadow
        shadow-mapSize-width={1024} // 해상도 낮춤
        shadow-mapSize-height={1024}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-radius={4}
        shadow-bias={-0.0001}
      />
      
      {/* 성능을 위해 포인트 라이트 제거하고 보조 디렉셔널 라이트만 사용 */}
      <directionalLight 
        position={[-3, 3, 5]} 
        intensity={0.4} 
      />
      
      {/* 최적화된 바닥 평면 */}
      <mesh position={[0, -0.7, -2]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color="#FFFFFF"
          roughness={1}
          metalness={0}
        />
      </mesh>
      
      {/* 장식용 구들 - React.memo로 최적화 */}
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
      , [currentState])}
      
      {/* 테마 구들 - React.memo로 최적화 */}
      {React.useMemo(() => 
        themeData.map((theme, i) => (
          <ThemeSphere
            key={theme.id}
            position={getThemePosition(i)}
            color={theme.color}
            isActive={Math.round(currentTheme) === i}
            state={currentState}
          />
        ))
      , [currentTheme, currentState])}
    </Canvas>
  );
};

// 컴포넌트 메모이제이션
export default React.memo(Scene3D);