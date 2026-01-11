import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei"; // OrbitControls 제거됨
// import { useControls } from "leva"; // ❌ Leva 제거 (카메라는 이제 Player가 조종함)
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
        shadows
        // 초기 카메라는 대충 잡아둬도, 
        // 게임 시작 0.1초 뒤에 Player.js가 알아서 플레이어 뒤로 옮겨줍니다.
        camera={{ position: [0, 10, 10], fov: 45 }}
        style={{ height: "100vh", width: "100vw" }}
      >
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>
      
      {/* 오타 수정: KeyUIw -> KeyUI */}
      <KeyUI />
      
    </KeyboardControls>
  );
};

export default App;