import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

const useSphereAnimation = (group, scaleRef, position, targetScale, state, isActive = false, isChatOpen = false) => {
  const positionY = useRef(position[1]);

  useFrame((_, delta) => {
    if (!group.current) return;
    
    const lerpSpeed = 5;
    
    const scaleDelta = (targetScale - scaleRef.current) * lerpSpeed * delta;
    scaleRef.current += scaleDelta;
    group.current.scale.setScalar(scaleRef.current);
    
    let targetY = position[1];
    
    if (state === 'active' && isActive) {
      targetY += isChatOpen ? 1.5 : 0.3;
    } 
    else if (state !== 'active') {
      const time = _.clock.getElapsedTime();
      const baseFreq = 0.6;
      const waveSpeed = 2;
      const amplitude = 0.1;
      const wave = Math.sin(time * waveSpeed + position[0] * baseFreq) * amplitude;
      targetY += wave;
    }
    
    const yDelta = (targetY - positionY.current) * (lerpSpeed) * delta;
    positionY.current += yDelta;
    
    group.current.position.set(
      position[0],
      positionY.current,
      position[2]
    );
  });
};

const DecorationSphere = ({ position, state }) => {
  const group = useRef();
  const scaleRef = useRef(1);
  
  useSphereAnimation(group, scaleRef, position, 0.8, state);

  return (
    <group ref={group} position={position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.4, 64, 64]} />
        <MeshTransmissionMaterial
          resolution={512}
          thickness={0.06}
          roughness={0.7}
          clearcoat={0.4}
          clearcoatRoughness={0.6}
          transmission={1}
          ior={2.2}
          chromaticAberration={0.2}
          anisotropy={0.7}
          distortion={0}
          distortionScale={0}
          temporalDistortion={0}
          color="#ffffff"
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.32 * 0.8, 32, 32]} />
        <meshStandardMaterial
          color="#555555"
          roughness={0.7}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
};

const ThemeSphereOuter = ({ position, isActive, state, children, isChatOpen }) => {
  const group = useRef();
  const scaleRef = useRef(1);
  const targetScale = isActive ? (state === 'active' ? 1.8 : 1.2) : 0.8;

  useSphereAnimation(group, scaleRef, position, targetScale, state, isActive, isChatOpen);

  return (
    <group ref={group} position={position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.4, 64, 64]} />
        <MeshTransmissionMaterial
          samples={16}
          resolution={512}
          thickness={0.07}
          roughness={0.7}
          clearcoat={0.4}
          clearcoatRoughness={0.6}
          transmission={1}
          ior={2.2}
          chromaticAberration={0.6}
          anisotropy={0.7}
          distortion={8}
          distortionScale={0.8}
          temporalDistortion={0.2}
          color="#ffffff"
        />
      </mesh>
      {children}
    </group>
  );
};

const ThemeSphereInner = ({ color }) => {
  return (
    <mesh>
      <sphereGeometry args={[0.32 * 0.8, 32, 32]} />
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
};

const ThemeSphere = ({ position, color, isActive, state, isDecoration = false, isChatOpen = false }) => {
  if (isDecoration) {
    return <DecorationSphere position={position} state={state} />;
  }

  return (
    <ThemeSphereOuter position={position} isActive={isActive} state={state} isChatOpen={isChatOpen}>
      <ThemeSphereInner color={color} />
    </ThemeSphereOuter>
  );
};

export default ThemeSphere;
export { ThemeSphereOuter, ThemeSphereInner };