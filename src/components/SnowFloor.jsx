import React, { useRef, useLayoutEffect, useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { extend, useThree, useFrame } from "@react-three/fiber";

// --- 커스텀 쉐이더 정의 ---
const SnowMaterial = shaderMaterial(
  {
    uColor: new THREE.Color("white"),         // 눈 색깔
    uGroundColor: new THREE.Color("#b0a090"), // 흙 색깔
    uMask: null,                              // 붓 자국 텍스처 (FBO에서 옴)
  },
  // 1. Vertex Shader (형태 담당)
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      // 바닥을 물리적으로 변형하지 않고 평평하게 유지 (지글거림 방지 최선책)
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // 2. Fragment Shader (색상 담당)
  `
    uniform vec3 uColor;
    uniform vec3 uGroundColor;
    uniform sampler2D uMask;
    varying vec2 vUv;

    void main() {
      // 마스크 텍스처에서 값 읽기 (0: 눈, 1: 흙)
      float maskValue = texture2D(uMask, vUv).r;
      // 값에 따라 흰색과 흙색 섞기
      vec3 finalColor = mix(uColor, uGroundColor, maskValue);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ SnowMaterial });

const SnowFloor = () => {
  const mesh = useRef();
  const materialRef = useRef();
  const { gl, scene } = useThree();

  const lastPos = useRef(new THREE.Vector3(0, 0, 0));

  // 1. 가상 캔버스(FBO) 생성
  // 여기에 공이 지나간 자국을 그립니다.
  const maskTexture = useMemo(() => {
    const t = new THREE.WebGLRenderTarget(2048, 2048, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      stencilBuffer: false,
      depthBuffer: false,
    });
    // 6시 방향 지글거림 방지를 위한 필터링 최대화
    t.texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    return t;
  }, [gl]);

  // 2. 붓(Brush) 설정
  const brushScene = useMemo(() => new THREE.Scene(), []);
  const fboCamera = useMemo(() => {
    // 붓을 찍을 위에서 아래로 보는 카메라
    const cam = new THREE.OrthographicCamera(-25, 25, 25, -25, 0, 100);
    cam.position.set(0, 10, 0);
    cam.lookAt(0, 0, 0);
    return cam;
  }, []);

  const brushTexture = useMemo(() => {
    // 붓 모양 그리기 (Canvas API 사용)
    const canvas = document.createElement("canvas");
    canvas.width = 128; canvas.height = 128;
    const context = canvas.getContext("2d");
    
    // 선명하고 꽉 찬 원형 붓 (사이즈 정확도를 위해)
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    gradient.addColorStop(0.9, "rgba(255, 255, 255, 1.0)"); // 90%까지 진하게
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);

  const brushMesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({
      map: brushTexture,
      transparent: true,
      opacity: 1.0, // 한 번만 스쳐도 확실하게 칠해지도록
      depthTest: false,
      depthWrite: false,
    });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    return m;
  }, [brushTexture]);

  const tempVec = useMemo(() => new THREE.Vector3(), []);

  // 초기화: 붓을 씬에 추가하고 캔버스 한 번 닦기
  useLayoutEffect(() => {
    brushScene.add(brushMesh);
    const currentRenderTarget = gl.getRenderTarget();
    gl.setRenderTarget(maskTexture);
    gl.setClearColor(0x000000, 1);
    gl.clear();
    gl.setRenderTarget(currentRenderTarget);
  }, []);

  // --- 매 프레임 실행 (붓 그리기) ---
  useFrame(() => {
    const player = scene.getObjectByName("PlayerBall");
    
    if (player) {
      player.getWorldPosition(tempVec);
      const distance = tempVec.distanceTo(lastPos.current);

      // [최적화 핵심] 공이 0.01 이상 움직였을 때만 그리기 (정지 시 지글거림 방지)
      if (distance > 0.01) {
        brushMesh.position.x = tempVec.x;
        brushMesh.position.z = tempVec.z;
        brushMesh.position.y = 0;
        brushMesh.rotation.z = Math.random(); // 자연스럽게 회전
        
        // 공 크기에 맞춰 붓 크기도 조절 (거의 1:1 비율)
        const scale = player.scale.x * 1.05;
        brushMesh.scale.set(scale, scale, 1);

        // 가상 캔버스(maskTexture)에 붓 도장 쾅!
        gl.setRenderTarget(maskTexture);
        gl.autoClear = false;
        gl.render(brushScene, fboCamera);
        gl.setRenderTarget(null); // 다시 메인 화면으로 복귀
        gl.autoClear = true;

        lastPos.current.copy(tempVec);
      }
    }

    // 쉐이더에 그려진 그림(Texture) 전달
    if (materialRef.current) {
      materialRef.current.uMask = maskTexture.texture;
    }
  });

  return (
    <RigidBody type="fixed" friction={1}>
      <mesh 
        ref={mesh} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow // 평평한 바닥이라 그림자 받아도 깨짐 없음
      >
        <planeGeometry args={[50, 50, 50, 50]} />
        <snowMaterial ref={materialRef} />
      </mesh>
    </RigidBody>
  );
};

export default SnowFloor;