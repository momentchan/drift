import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from "react";
import GPGPU from "@packages/r3f-gist/gpgpu/GPGPU";
import PosSimulateShaderMaterial from "../../shaders/posSimulateShader";
import VelSimulateShaderMaterial from "../../shaders/velSimulateShader";
import BoidsMeshRenderCustomShader from "../../shaders/boidsMeshRenderCustomShader";
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import ThreeCustomShaderMaterial from 'three-custom-shader-material';
import { patchShaders } from 'gl-noise';
import { useFrame, useThree } from "@react-three/fiber";
import { folder, useControls } from 'leva';
import { getRandomVectorInsideSphere } from "@packages/r3f-gist/utils/math";
import { Vector2 } from 'three/src/Three.js';
import gsap from 'gsap';
import { useFBX } from '@react-three/drei';
import GlobalState from '../GlobalState';
import Waves from './Waves';

// Initialize data for GPGPU
function initData(count: number, radius: number): Float32Array {
  const data = new Float32Array(count * 4);
  for (let i = 0; i < data.length; i += 4) {
    const vec = getRandomVectorInsideSphere(radius);
    data[i] = vec.x;
    data[i + 1] = vec.y;
    data[i + 2] = vec.z;
    data[i + 3] = 1;
  }
  return data;
}

interface BoidsProps {
  radius: number;
  length: number;
  lightPos: [number, number, number];
  texture: THREE.DataTexture;
  rayCount: number;
}

export default function Boids({ radius, length, lightPos, texture, rayCount }: BoidsProps) {
  const fbx = useFBX('models/pyramid.fbx');
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const { isTriangle, started } = GlobalState();
  const [ready, setReady] = useState(false);

  const props = useControls({
    'Boids': folder({
      separationDistance: { value: 1, min: 0, max: 5 },
      alignmentDistance: { value: 1, min: 0, max: 5 },
      cohesionDistance: { value: 2, min: 0, max: 5 },

      separationWeight: { value: 1, min: 0, max: 10 },
      alignmentWeight: { value: 2, min: 0, max: 10 },
      cohesionWeight: { value: 0.5, min: 0, max: 10 },
      avoidWallWeight: { value: 5, min: 0, max: 10 },
      noiseWeight: { value: 1.2, min: 0, max: 5 },
      touchWeight: { value: 50, min: 0, max: 50 },

      noiseFrequency: { value: 0.05, min: 0, max: 0.1 },
      noiseSpeed: { value: 0.1, min: 0, max: 0.5 },
      touchRange: { value: 0.6, min: 0, max: 5 },

      maxSpeed: { value: 2, min: 0, max: 20 },
      maxForce: { value: 10, min: 0, max: 20 },
    }),
  });

  const count = length * length;
  const { gl, camera, size } = useThree();

  const [waveRates, setWaveRates] = useState(Array(5).fill(0));
  const [currentId, setCurrentId] = useState(0);

  const renderMat = new BoidsMeshRenderCustomShader();
  const depthMat = new CustomShaderMaterial({
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: patchShaders(renderMat.vertexShader) as string,
    uniforms: renderMat.uniforms,
    silent: true,
    depthPacking: THREE.RGBADepthPacking
  });

  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<any>(null);

  // UVs calculation
  const uvs = useMemo(() => {
    const uvs = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      uvs[i3 + 0] = (i % length) / length;
      uvs[i3 + 1] = i / length / length;
    }
    const geometry = (fbx.children[0] as THREE.Mesh).geometry;
    geometry.setAttribute('uvs', new THREE.InstancedBufferAttribute(new Float32Array(uvs), 3));
    setGeometry(geometry);
    return uvs;
  }, [count, length, fbx]);

  // GPGPU setup
  const gpgpu = useMemo(() => {
    const gpgpu = new GPGPU(gl, length, length);
    gpgpu.addVariable('positionTex', initData(length * length, radius), new PosSimulateShaderMaterial());
    gpgpu.addVariable('velocityTex', initData(length * length, 10), new VelSimulateShaderMaterial());
    gpgpu.setVariableDependencies('positionTex', ['positionTex', 'velocityTex']);
    gpgpu.setVariableDependencies('velocityTex', ['positionTex', 'velocityTex']);
    gpgpu.init();
    return gpgpu;
  }, [gl, length, radius]);

  useEffect(() => {
    if (started) {
      setTimeout(() => setReady(true), 5000);
    }
  }, [started]);

  useFrame((state, delta) => {
    if (!mesh.current) return;

    const modelMatrix = mesh.current.matrixWorld;
    const viewMatrix = camera.matrixWorldInverse;
    const projectionMatrix = camera.projectionMatrix;
    const modelViewProjectionMatrix = new THREE.Matrix4().multiplyMatrices(projectionMatrix, new THREE.Matrix4().multiplyMatrices(viewMatrix, modelMatrix));
    const inverseModelViewProjectionMatrix = modelViewProjectionMatrix.clone().invert();

    gpgpu.setUniform('positionTex', 'delta', Math.min(delta, 1 / 30));
    gpgpu.setUniform('positionTex', 'time', state.clock.elapsedTime);

    gpgpu.setUniform('velocityTex', 'delta', Math.min(delta, 1 / 30));
    gpgpu.setUniform('velocityTex', 'time', state.clock.elapsedTime);
    gpgpu.setUniform('velocityTex', 'radius', radius);
    gpgpu.setUniform('velocityTex', 'aspect', size.width / size.height);
    gpgpu.setUniform('velocityTex', 'modelViewProjectionMatrix', modelViewProjectionMatrix);
    gpgpu.setUniform('velocityTex', 'inverseModelViewProjectionMatrix', inverseModelViewProjectionMatrix);

    gpgpu.setUniform('velocityTex', 'alignmentDistance', props.alignmentDistance);
    gpgpu.setUniform('velocityTex', 'separationDistance', props.separationDistance);
    gpgpu.setUniform('velocityTex', 'cohesionDistance', props.cohesionDistance);
    gpgpu.setUniform('velocityTex', 'separationWeight', props.separationWeight);
    gpgpu.setUniform('velocityTex', 'alignmentWeight', props.alignmentWeight);
    gpgpu.setUniform('velocityTex', 'cohesionWeight', props.cohesionWeight);
    gpgpu.setUniform('velocityTex', 'avoidWallWeight', props.avoidWallWeight);

    gpgpu.setUniform('velocityTex', 'noiseWeight', props.noiseWeight);
    gpgpu.setUniform('velocityTex', 'noiseFrequency', props.noiseFrequency);
    gpgpu.setUniform('velocityTex', 'noiseSpeed', props.noiseSpeed);

    gpgpu.setUniform('velocityTex', 'touchRange', props.touchRange * THREE.MathUtils.mapLinear(camera.position.length(), 36, 20, 0.6, 1));
    gpgpu.setUniform('velocityTex', 'touchWeight', props.touchWeight);
    gpgpu.setUniform('velocityTex', 'touchPos', ready ? state.pointer : new Vector2(-1, 1));

    gpgpu.setUniform('velocityTex', 'maxSpeed', props.maxSpeed);
    gpgpu.setUniform('velocityTex', 'maxForce', props.maxForce);

    gpgpu.setUniform('velocityTex', 'lightPos', lightPos);
    gpgpu.setUniform('velocityTex', 'rayCount', rayCount);
    gpgpu.setUniform('velocityTex', 'rayTex', texture);
    gpgpu.setUniform('velocityTex', 'waveRates', waveRates);

    gpgpu.compute();

    if (mat.current) {
      mat.current.uniforms.positionTex.value = gpgpu.getCurrentRenderTarget('positionTex');
      mat.current.uniforms.velocityTex.value = gpgpu.getCurrentRenderTarget('velocityTex');
      mat.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <>
      {geometry != null &&
        <instancedMesh
          ref={mesh}
          args={[undefined, undefined, count]}
          castShadow
          receiveShadow
          frustumCulled={false}
          customDepthMaterial={depthMat}
        >
          {isTriangle ?
            <primitive attach="geometry" object={geometry} /> :
            <boxGeometry args={[0.02, 0.2, 0.2]} >
              <instancedBufferAttribute attach="attributes-uvs" args={[uvs, 3]} />
            </boxGeometry>
          }

          <ThreeCustomShaderMaterial
            ref={mat}
            baseMaterial={THREE.MeshStandardMaterial}
            silent
            fragmentShader={patchShaders(renderMat.fragmentShader) as string}
            vertexShader={patchShaders(renderMat.vertexShader) as string}
            uniforms={renderMat.uniforms}
            envMapIntensity={0.5}
          />
        </instancedMesh>
      }

      <Waves radius={radius} waveRates={waveRates} setWaveRates={setWaveRates} currentId={currentId} setCurrentId={setCurrentId} />
    </>
  );
}


