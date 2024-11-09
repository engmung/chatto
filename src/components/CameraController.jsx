import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const CameraController = ({ currentState, currentTheme, spacing, centerOffset }) => {
  const { camera } = useThree();
  const lerpSpeed = 3; // 초당 보간 속도
  
  useFrame((state, delta) => {
    const targetX = (currentTheme * spacing) - centerOffset;
    const targetY = currentState === 'active' ? 1.42 : 0;
    const targetZoom = currentState === 'active' ? 500 : 150;
    
    // deltaTime을 이용한 보간
    const xDelta = (targetX - camera.position.x) * (currentState === 'active' ? 1.5 : 1.0) * lerpSpeed * delta;
    const yDelta = (targetY - camera.position.y) * 1.4 * lerpSpeed * delta;
    const zoomDelta = (targetZoom - camera.zoom) * lerpSpeed * delta;
    
    camera.position.x += xDelta;
    camera.position.y += yDelta;
    camera.zoom += zoomDelta;
    
    camera.rotation.set(0, 0, 0);
    camera.updateProjectionMatrix();
  });

  return null;
};

export default CameraController;