import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { RigidBody, BallCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useControls } from "leva";

const Player = () => {
  const body = useRef();   // 물리 엔진용 (실제 충돌 계산)
  const meshRef = useRef(); // 시각 효과용 (눈에 보이는 공)
  
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { camera } = useThree();

  // --- 상태 관리 변수 ---
  const currentSize = useRef(1); // 공의 현재 크기 (실시간으로 부드럽게 변함)
  const lastPosition = useRef(new THREE.Vector3(0, 5, 0)); // 이동 거리 계산용 과거 위치
  
  // [최적화] 물리 충돌체 크기는 State로 관리 (0.1 단위로 듬성듬성 업데이트)
  const [physicsScale, setPhysicsScale] = useState(1);

  // Leva 패널 (설정값 조절)
  const { followCamera, followSpeed, runSpeed } = useControls({
    followCamera: { value: true, label: "카메라 따라가기" },
    followSpeed: { value: 2.0, min: 0.1, max: 10, step: 0.1, label: "카메라 속도" },
    runSpeed: { value: 0.2, min: 0.05, max: 2, step: 0.05, label: "공 굴리기 힘" },
  });

  // 카메라 모드 초기화
  useEffect(() => {
    if (!followCamera) {
      camera.position.set(0, 30, 30);
      camera.lookAt(0, 0, 0);
    }
  }, [followCamera, camera]);

  // --- 매 프레임 실행 (Game Loop) ---
  useFrame((state, delta) => {
    if (!body.current) return;

    // A. 이동 처리
    const { forward, backward, left, right } = getKeys();
    // 공이 커지면 무거워지므로 힘을 더 줘야 굴러감 (* currentSize)
    const impulseStrength = runSpeed * 20 * delta * currentSize.current; 

    const impulse = { x: 0, y: 0, z: 0 };
    if (forward) impulse.z -= impulseStrength;
    if (backward) impulse.z += impulseStrength;
    if (left) impulse.x -= impulseStrength;
    if (right) impulse.x += impulseStrength;

    body.current.applyImpulse(impulse, true);

    // B. 눈 뭉치기 로직
    const bodyPosition = body.current.translation();
    const currentPosVector = new THREE.Vector3(bodyPosition.x, bodyPosition.y, bodyPosition.z);
    const distance = currentPosVector.distanceTo(lastPosition.current);

    // 조건: 조금이라도 움직였고(0.01) && 바닥에 있을 때(y < 5)
    if (distance > 0.01 && bodyPosition.y < 5) {
      // 1. 시각적 크기 증가 (부드럽게)
      currentSize.current += distance * 0.05;
      if (currentSize.current > 4.0) currentSize.current = 4.0; // 최대 크기 제한

      // 2. 물리적 크기 증가 (계단식)
      // 물리 엔진 크기를 매번 바꾸면 성능 저하 -> 0.1 차이 날 때만 업데이트
      if (currentSize.current - physicsScale > 0.1) {
         setPhysicsScale(currentSize.current);
         
         // [핵심] 땅 파고듦 방지 (Lift Logic)
         // 갑자기 물리 크기가 커지면 바닥을 뚫으려 하므로, 반지름 차이만큼 공을 위로 들어 올림
         const growthStep = currentSize.current - physicsScale;
         body.current.setTranslation({
             x: bodyPosition.x,
             y: bodyPosition.y + (growthStep * 0.5), 
             z: bodyPosition.z
         }, true);
      }
    }

    // C. 시각적 크기 반영 (매 프레임)
    if (meshRef.current) {
      const s = currentSize.current;
      meshRef.current.scale.set(s, s, s);
    }

    // D. 카메라 추적
    if (followCamera) {
      // 공이 커질수록 카메라도 뒤로 물러남
      const cameraOffset = 8 + (currentSize.current * 3); 
      const targetPos = new THREE.Vector3(
        currentPosVector.x, 
        currentPosVector.y + cameraOffset, 
        currentPosVector.z + cameraOffset 
      );
      state.camera.position.lerp(targetPos, followSpeed * delta);
      state.camera.lookAt(currentPosVector);
    }

    // E. 추락 시 리셋
    if (bodyPosition.y < -20) {
      body.current.setTranslation({ x: 0, y: 5, z: 0 }, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      currentSize.current = 1;
      setPhysicsScale(1);
    }

    lastPosition.current.copy(currentPosVector);
  });

  return (
    <RigidBody
      ref={body}
      position={[0, 2, 0]}
      colliders={false} // [중요] 자동 콜라이더 끄기 (수동 제어 위해)
      restitution={0.2} // 탄성 낮춤 (눈덩이 느낌)
      friction={1}      
      linearDamping={0.5}  
      angularDamping={0.5}
    >
      {/* 물리적인 충돌체 (코드에서 physicsScale로 크기 조절) */}
      <BallCollider args={[0.5 * physicsScale]} />

      {/* 눈에 보이는 공 */}
      <mesh ref={meshRef} castShadow name="PlayerBall">
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>
    </RigidBody>
  );
};

export default Player;