import { Environment } from "@react-three/drei";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import GlobalState from "../GlobalState";

interface LightProps {
  radius: number;
  lightPos: [number, number, number];
}

export interface LightRef {
  getDirectionalLight: () => THREE.DirectionalLight | null;
}

const Light = forwardRef<LightRef, LightProps>(function Light(props, ref) {
  const directionalLight = useRef<THREE.DirectionalLight>(null);
  const { isMobile } = GlobalState();

  useImperativeHandle(ref, () => ({
    getDirectionalLight() {
      return directionalLight.current;
    }
  }));

  useEffect(() => {
    // console.log(directionalLight.current);
  }, []);

  return (
    <>
      <ambientLight intensity={0.05} />

      <directionalLight
        ref={directionalLight}
        intensity={2}
        position={props.lightPos}
        castShadow
        shadow-mapSize={isMobile ? [4096, 4096] : [8192, 8192]}
        shadow-camera-top={props.radius * 1.2}
        shadow-camera-right={props.radius * 1.2}
        shadow-camera-bottom={-props.radius * 1.2}
        shadow-camera-left={-props.radius * 1.2}
        shadow-bias={-0.001}
      />

      <Environment preset="city" />
    </>
  );
});

export default Light;


