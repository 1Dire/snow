import { Physics } from "@react-three/rapier"; // 물리 법칙이 적용되는 영역을 지정
import { OrbitControls, Sky } from "@react-three/drei"; // 카메라 조작 및 하늘 배경 도구
import { SnowPlane } from "./SnowPlane"; // 바닥 컴포넌트
import Player from "./Player";

export function Experience() {
  return (
    <>
      {/* OrbitControls: 마우스 드래그로 카메라를 돌려볼 수 있게 함 */}
      <OrbitControls makeDefault />

      {/* Sky: 간단하게 태양 위치에 따른 물리적 하늘 배경 생성 */}
      <Sky sunPosition={[100, 20, 100]} />

      {/* ambientLight: 모든 물체에 최소한의 빛을 골고루 비춤 (어두운 곳 방지) */}
      <ambientLight intensity={1.5} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={2.5} 
        castShadow 
      />
      {/* pointLight: 특정 지점에서 뿜어져 나오는 전구 같은 빛, 그림자 생성 가능 */}
      <pointLight position={[10, 10, 10]} castShadow />

      {/* Physics: 이 안에 들어있는 RigidBody 컴포넌트들끼리 서로 물리적 충돌 연산 수행 */}
      <Physics debug> {/* debug를 넣으면 물리 충돌체의 선이 보임 */}
        <Player />
        <SnowPlane />
      </Physics>
    </>
  );
}