import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import * as THREE from "three"; // [중요] VSM 그림자를 위해 추가
import { Experience } from "./components/Experience";
import { KeyUI } from "./components/KeyUi";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
];

const App = () => {
  return (
    <KeyboardControls map={keyboardMap}>
      <Canvas
        // [핵심 1] 지글거림 방지용 고급 그림자 모드 켜기
        shadows={{ type: THREE.VSMShadowMap }}
        // [핵심 2] 카메라 위치를 눈길이 잘 보이게 살짝 위로 조정
        camera={{ position: [0, 15, 25], fov: 50 }}
        style={{ height: "100vh", width: "100vw" }}
      >
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>
      
      <KeyUI />
    </KeyboardControls>
  );
};

export default App;