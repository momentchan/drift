import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, HueSaturation, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from 'postprocessing';
import { folder, useControls } from 'leva';
import * as THREE from 'three';
import { useEffect, useRef } from "react";
// @ts-ignore
import { GodraysPass } from 'three-good-godrays';

interface LightRef {
  current: {
    getDirectionalLight: () => THREE.DirectionalLight | null;
  } | null;
}

interface GodraysEffectProps {
  light: LightRef;
  config: {
    density: number;
    maxDensity: number;
    edgeStrength: number;
    edgeRadius: number;
    distanceAttenuation: number;
    color: THREE.Color;
    raymarchSteps: number;
    blur: boolean;
    gammaCorrection: boolean;
  };
  composer: React.MutableRefObject<typeof EffectComposer | null>;
}

const GodraysEffect = ({ light, config, composer }: GodraysEffectProps) => {
  const { camera: _camera } = useThree();

  useEffect(() => {
    const lightDirectional = light.current?.getDirectionalLight();
    if (!lightDirectional) return;

    const godray = new GodraysPass(lightDirectional, _camera, config);
    // @ts-ignore
    composer.current?.addPass(godray);

    return () => {
      // @ts-ignore
      composer.current?.removePass(godray);
    };
  }, [_camera, light, config, composer]);

  return null;
};

interface EffectProps {
  light: LightRef;
}

export default function Effect({ light }: EffectProps) {
  const composer = useRef<typeof EffectComposer | null>(null);

  const config = {
    density: 0.001,
    maxDensity: 0.5,
    edgeStrength: 2,
    edgeRadius: 2,
    distanceAttenuation: 2,
    color: new THREE.Color(0xffffff),
    raymarchSteps: 20,
    blur: false,
    gammaCorrection: true,
  };

  const props = useControls({
    'PostEffect': folder({
      bloomThreshold: { value: 0.3, min: 0, max: 5 },
      bloomSmoothing: { value: 0.15, min: 0, max: 1 },
      bloomIntensity: { value: 1.5, min: 0, max: 20 },

      focusDistance: { value: 0, min: 0, max: 50 },
      focusLength: { value: 0, min: 0, max: 50 },
    }),
  });

  return (
    <>
      <EffectComposer
        ref={composer}
        multisampling={0}
        resolutionScale={1}
        frameBufferType={THREE.HalfFloatType}
        enableNormalPass={false}
      >
        <GodraysEffect light={light} config={config} composer={composer} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Bloom
          luminanceThreshold={props.bloomThreshold}
          luminanceSmoothing={props.bloomSmoothing}
          mipmapBlur
          intensity={props.bloomIntensity} />
        <SMAA />
      </EffectComposer>
    </>
  );
}


