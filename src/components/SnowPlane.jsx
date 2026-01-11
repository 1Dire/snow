import React from "react";
import { RigidBody } from "@react-three/rapier";

export function SnowPlane() {
  return (
    // 1. type="fixed": 바닥이므로 중력에 떨어지지 않게 고정합니다.
    // 2. colliders="cuboid": 'box'라고 쓰면 에러가 납니다. 'cuboid'를 쓰거나 생략(자동)하세요.
    <RigidBody type="fixed" colliders="cuboid" restitution={0.2} friction={1}>
      {/* 시각적인 바닥 (두께가 있는 BoxGeometry 사용 권장) */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <boxGeometry args={[50, 2, 50]} /> 
        <meshStandardMaterial color="#f0f8ff" roughness={0.5} />
      </mesh>
    </RigidBody>
  );
}