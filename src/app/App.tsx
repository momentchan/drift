import { Loader, Preload } from "@react-three/drei";
import { folder, useControls } from "leva";
import Stage from "../components/3d/Stage";
import Effect from "../components/effects/Effect";
import Light, { LightRef } from "../components/3d/Light";
import { Suspense, useRef } from "react";
import RayEmitter from "../components/3d/RayEmitter";
import * as THREE from "three";
import { Perf } from "r3f-perf";
import Boids from "../components/3d/Boids";
import Menu from "../components/ui/Menu";
import Bgm from "../components/audio/Bgm";
import GlobalState from "../components/GlobalState";
import Motion from "../components/3d/Motion";
import AI from "../components/ai/AI";
import CanvasCapture from "@packages/r3f-gist/components/utility/CanvasCapture";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDPRMonitor } from "@packages/r3f-gist/components/webgl/AdaptiveDPRMonitor";
import LevaWrapper from "@packages/r3f-gist/components/ui/LevaWrapper";

const debug = false;


interface ComponentProps {
  radius: number;
  length: number;
  lightPos: [number, number, number];
  rayCount: number;
  texture?: THREE.DataTexture;
}

export default function App() {
  const { started } = GlobalState();

  const { bgColor } = useControls({
    Global: folder({
      bgColor: "#000000",
    }),
  });

  const props: ComponentProps = {
    radius: 10,
    length: 64,
    lightPos: [100, 100, 0],
    rayCount: 6,
  };

  const light = useRef<LightRef | null>(null);

  const textureData = new Float32Array(props.rayCount * 4);

  const texture = new THREE.DataTexture(
    textureData,
    props.rayCount,
    1,
    THREE.RGBAFormat,
    THREE.FloatType
  );

  const handleUpdatePoints = (index: number, point: THREE.Vector3, length: number): void => {
    textureData[index * 4 + 0] = point.x;
    textureData[index * 4 + 1] = point.y;
    textureData[index * 4 + 2] = point.z;
    textureData[index * 4 + 3] = length;
    texture.needsUpdate = true;
  };

  return (
    <>
      <LevaWrapper initialHidden={true} />

      <Canvas
        shadows
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position: [-30, 5, 20],
        }}
        gl={{
          preserveDrawingBuffer: true,
          shadowMapType: THREE.PCFSoftShadowMap,
        }}
      >
        <Suspense fallback={null}>
          <AdaptiveDPRMonitor initialDPR={1} />

          {debug && <Perf position="top-left" />}
          <fogExp2 attach="fog" args={[bgColor, 0.05]} />
          <color attach="background" args={[bgColor]} />

          {/* <Perf position="top-left" /> */}

          <RayEmitter
            {...props}
            texture={texture}
            onUpdateTexture={handleUpdatePoints}
          />

          <Boids {...props} texture={texture} />

          <Stage />

          <Light {...props} ref={light} />

          <CanvasCapture />

          <Effect light={light} />

          <Bgm />

          <Motion />
          <Preload all />
        </Suspense>
      </Canvas>

      <Menu />

      {!started && <Loader />}

      <AI />
    </>
  );
}

