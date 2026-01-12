import { Physics } from "@react-three/rapier";
import { OrbitControls, Sky } from "@react-three/drei";
// Canvas는 App.js에서 관리하므로 제거됨
import Player from "./Player";
import SnowFloor from "./SnowFloor";
// import { Level } from "./Level"; 

export function Experience() {
  return (
    <>
      {/* 1. 카메라 조작 (개발용/기본 조작) */}
      <OrbitControls makeDefault />
      
      {/* 2. 배경 환경 설정 (하늘 & 안개) */}
      <Sky sunPosition={[100, 50, 100]} turbidity={0.5} rayleigh={0.5} />
      <fog attach="fog" args={["#ffffff", 15, 60]} /> {/* 멀리 있는 물체 하얗게 흐리기 */}
      
      {/* 3. 조명 설정 (가장 중요!) */}
      <ambientLight intensity={1.5} /> {/* 전체적으로 부드러운 빛 */}
      
      <directionalLight 
        position={[30, 50, 30]} 
        intensity={2.0} 
        castShadow 
        // [핵심] 그림자 설정
        // VSMShadowMap을 쓰기 때문에 아래 설정들이 매우 중요합니다.
        shadow-mapSize={[2048, 2048]} // 그림자 해상도 (높을수록 선명)
        shadow-bias={-0.0005}         // 그림자 틈새 노이즈 제거
        shadow-normalBias={0.04}      // 물체 표면의 그림자 깨짐 방지
        shadow-radius={5}             // 그림자 테두리 부드럽게 (VSM 전용)
      >
        <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 0.1, 100]} />
      </directionalLight>

      {/* 4. 물리 엔진 세계 (Physics World) */}
      {/* debug={true}로 하면 초록색 충돌 박스가 보입니다. */}
      <Physics debug={false}>
        <SnowFloor /> {/* 눈 바닥 */}
        {/* <Level /> */} {/* 장애물 등 (필요시 주석 해제) */}
        <Player />    {/* 플레이어 눈덩이 */}
      </Physics>
    </>
  );
}