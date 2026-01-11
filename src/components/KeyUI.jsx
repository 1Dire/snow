import React from "react";
import { useKeyboardControls } from "@react-three/drei";

export const KeyUI = () => {
  // 브레이크 구독 코드 삭제
  const forward = useKeyboardControls((state) => state.forward);
  const backward = useKeyboardControls((state) => state.backward);
  const left = useKeyboardControls((state) => state.left);
  const right = useKeyboardControls((state) => state.right);

  return (
    <div className="key-ui">
      <div className="controls-info">
        <p>WASD to drive</p>
        {/* Space 안내 문구 삭제 */}
      </div>

      <div className="keys-container">
        {/* W 키 */}
        <div className="row">
          <KeyButton active={forward} label="W" />
        </div>
        
        {/* ASD 키 */}
        <div className="row">
          <KeyButton active={left} label="A" />
          <KeyButton active={backward} label="S" />
          <KeyButton active={right} label="D" />
        </div>
        
        {/* Space바 버튼(special-keys row) 전체 삭제 */}
      </div>
    </div>
  );
};

const KeyButton = ({ active, label, wide }) => {
  return (
    <div className={`key ${active ? "active" : ""} ${wide ? "wide" : ""}`}>
      {label}
    </div>
  );
};