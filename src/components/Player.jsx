import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useControls } from "leva";

const Player = () => {
  // --- [1. 준비물 챙기기] ---
  // 물리 엔진(RigidBody)을 코드로 잡기 위한 손잡이
  const body = useRef(); 
  // 눈에 보이는 공(Mesh)을 코드로 잡기 위한 손잡이 (크기 키울 때 씀)
  const meshRef = useRef(); 
  
  // 키보드 입력을 감시하는 훅
  const [subscribeKeys, getKeys] = useKeyboardControls();
  
  // 게임이 실행되는 동안 계속 기억해야 할 값들 (Ref 사용 = 리렌더링 방지)
  const currentSize = useRef(1); // 공의 현재 크기 (기본값 1)
  const lastPosition = useRef(new THREE.Vector3(0, 5, 0)); // 방금 전 공의 위치 (이동 거리 계산용)

  // 카메라를 직접 조종하기 위해 가져옴
  const { camera } = useThree();

  // --- [2. 조작 패널 만들기 (Leva)] ---
  // 화면 구석에 값을 조절할 수 있는 패널을 만듭니다.
  const { followCamera, followSpeed, runSpeed } = useControls({
    followCamera: { value: false, label: "카메라 따라가기" }, // 켜고 끄는 스위치
    followSpeed: { value: 1, min: 0.1, max: 10, step: 0.1, label: "카메라 속도" }, // 따라가는 반응 속도
    runSpeed: { value: 0.05, min: 0.05, max: 2, step: 0.05, label: "공 굴리기 힘" } // 공을 미는 힘
  });

  // --- [3. 카메라 모드 변경 감지] ---
  // '카메라 따라가기' 스위치를 껐을 때(false), 딱 한 번만 실행되는 코드
  useEffect(() => {
    if (!followCamera) {
      // 카메라를 하늘 높이(0, 50, 50)로 보내서 전체 맵을 내려다보게 함
      camera.position.set(0, 50, 50);
      camera.lookAt(0, 0, 0); // 맵의 중앙을 바라봄
    }
  }, [followCamera, camera]); // followCamera 값이 바뀔 때마다 작동

  // --- [4. 매 프레임 실행되는 게임 루프 (초당 60번)] ---
  useFrame((state, delta) => {
    // A. 현재 눌린 키 확인
    const { forward, backward, left, right } = getKeys();
    
    // B. 공을 미는 힘 계산 (Leva에서 설정한 runSpeed 사용)
    // 공이 눈을 뭉쳐서 커지면(currentSize) 더 무거워지니까, 힘도 그만큼 더 세게 줘야 굴러감
    const impulseStrength = runSpeed * currentSize.current;
    
    // C. 방향키에 따라 힘의 방향 결정 (X, Z축)
    const impulse = { x: 0, y: 0, z: 0 };
    if (forward) impulse.z -= impulseStrength;   // 앞
    if (backward) impulse.z += impulseStrength;  // 뒤
    if (left) impulse.x -= impulseStrength;      // 왼쪽
    if (right) impulse.x += impulseStrength;     // 오른쪽

    // D. 물리 엔진이 준비되었는지 확인 (안전장치)
    if (body.current) {
      // 현재 공의 위치를 가져옴
      const bodyPosition = body.current.translation();
      const currentPosVector = new THREE.Vector3(bodyPosition.x, bodyPosition.y, bodyPosition.z);
      
      // --- [눈 뭉치기 로직] ---
      // "지금 위치"와 "아까 위치" 사이의 거리를 잼 (얼마나 굴러갔나?)
      const distance = currentPosVector.distanceTo(lastPosition.current);
      
      // 조건: 조금이라도 움직였고(distance > 0.01) && 바닥에 닿아있다면(y < 1)
      if (distance > 0.01 && bodyPosition.y < 1) {
        // 이동 거리의 5%만큼 공 크기를 키움
        currentSize.current += distance * 0.05;
        // 너무 무한히 커지면 곤란하니 최대 3배까지만
        if (currentSize.current > 3) currentSize.current = 3; 
      }

      // --- [시각적 크기 반영] ---
      // 물리적인 충돌체 크기는 그대로 두고, 눈에 보이는 껍데기(Mesh)만 키움
      if (meshRef.current) {
        const s = currentSize.current;
        meshRef.current.scale.set(s, s, s);
      }

      // --- [카메라 추적 로직] ---
      // 스위치가 켜져 있을 때만 작동
      if (followCamera) {
        // 1. 카메라가 갈 목표 위치 계산 (공 위치 기준)
        const cameraPosition = new THREE.Vector3();
        cameraPosition.copy(currentPosVector);
        
        // 공이 커질수록 카메라가 더 멀리 떨어져야 화면에 꽉 차지 않음
        const cameraOffset = 5 + (currentSize.current * 1.5);
        cameraPosition.y += cameraOffset; // 위로
        cameraPosition.z += cameraOffset; // 뒤로

        // 2. 부드럽게 이동 (Lerp: 현재 위치 -> 목표 위치로 서서히 이동)
        state.camera.position.lerp(cameraPosition, followSpeed * delta);
        // 3. 카메라는 항상 공을 바라봄
        state.camera.lookAt(currentPosVector);
      }

      // E. 다음 프레임 계산을 위해 현재 위치를 '과거 위치'로 저장
      lastPosition.current.copy(currentPosVector);
      
      // F. 최종적으로 계산된 힘을 물리 엔진에 적용 (공 굴리기)
      body.current.applyImpulse(impulse, true);
    }
  });

  return (
    <RigidBody
      ref={body}
      position={[0, 5, 0]}
      colliders="ball"
      // 눈밭에서 구르는 느낌을 내기 위해 마찰력(Damping)을 높임
      // 수치가 높을수록 저항이 심해서 미끄러지지 않고 묵직하게 굴러감
      linearDamping={0.8} 
      angularDamping={0.8}
    >
      {/* 눈에 보이는 공 (Mesh) */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.8}
          // 그늘진 곳에서도 하얗게 보이도록 자체 발광 설정
          emissive="#ffffff"
          emissiveIntensity={0.2} 
        />
      </mesh>
    </RigidBody>
  );
};

export default Player;