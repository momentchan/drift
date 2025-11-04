import { useAnimations, useFBX, useTexture } from "@react-three/drei";
import * as THREE from 'three';
import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { TGALoader } from 'three-stdlib';

// Register TGA loader globally
THREE.DefaultLoadingManager.addHandler(/\.tga$/i, new TGALoader());

// Suppress FBX loader warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && (
    message.includes('ReflectionFactor map is not supported') ||
    message.includes('Vertex has more than 4 skinning weights') ||
    message.includes('TGA loader not found')
  )) {
    return; // Suppress these specific warnings
  }
  originalWarn.apply(console, args);
};

interface ModelProps {
  path: string;
  pos: [number, number, number];
}

function Model({ path, pos }: ModelProps) {
  const fbx = useFBX(path);
  const { ref, actions, names } = useAnimations(fbx.animations) as {
    ref: React.RefObject<THREE.Group>;
    actions: { [key: string]: THREE.AnimationAction | null };
    names: string[];
  };

  const [index, setIndex] = useState(1);
  const [blendRate, setBlendRate] = useState(0);

  const transT = 3;

  function easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function applyEasedFade(action: THREE.AnimationAction, duration: number, fadeIn: boolean = true): void {
    action.setEffectiveWeight(fadeIn ? 0 : 1);

    let startTime = performance.now();

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const normalizedTime = Math.min(elapsed / (duration * 1000), 1); // Normalized time between 0 and 1

      const blendRate = index === 1 ? 1 - Math.min(elapsed / (transT * 1000), 1) : Math.min(elapsed / (transT * 1000), 1);
      setBlendRate(blendRate);

      const easedTime = easeInOutQuad(normalizedTime); // Apply easing
      const weight = fadeIn ? easedTime : 1 - easedTime;

      action.setEffectiveWeight(weight);

      if (normalizedTime === 1) {
        if (!fadeIn) action.stop(); // Stop the action if it's fading out
        clearInterval(interval);
      }
    }, 10);

    action.play();
  }

  useEffect(() => {
    const action = actions[names[index]];
    // Reset and fade in animation after an index has been changed
    applyEasedFade(action as THREE.AnimationAction, transT, true); // Eased fade in

    // In the clean-up phase, fade it out
    return () => applyEasedFade(action as THREE.AnimationAction, transT, false); // Eased fade out
  }, [index, actions, names]);

  const bodyTex = useTexture({
    map: 'textures/Body/Astronaut_Suit_Body_Albedo.png',
    metalnessMap: 'textures/Body/Astronaut_Suit_Body_Metallic.png',
    aoMap: 'textures/Body/Astronaut_Suit_Body_Ao.png',
    normalMap: 'textures/Body/Astronaut_Suit_Body_Normals.png'
  });
  bodyTex.map.colorSpace = THREE.SRGBColorSpace;

  const detailTex = useTexture({
    map: 'textures/Details/Astronaut_Suit_Details_Albedo.png',
    metalnessMap: 'textures/Details/Astronaut_Suit_Details_Metallic.png',
    aoMap: 'textures/Details/Astronaut_Suit_Details_Ao.png',
    normalMap: 'textures/Details/Astronaut_Suit_Details_Normals.png'
  });
  detailTex.map.colorSpace = THREE.SRGBColorSpace;
  
  useEffect(() => {
    const bodyMat = new THREE.MeshStandardMaterial({ map: bodyTex.map, aoMap: bodyTex.aoMap, normalMap: bodyTex.normalMap, metalnessMap: bodyTex.metalnessMap });
    const detailMat = new THREE.MeshStandardMaterial({ map: detailTex.map, aoMap: detailTex.aoMap, normalMap: detailTex.normalMap, metalnessMap: detailTex.metalnessMap });

    const bodyMeshes = [
      'Astronaut_Suit_Body_Detail_01_Mesh',
      'Astronaut_Suit_Body_Mesh',
      'Astronaut_Suit_Shoes_Mesh',
    ];

    fbx.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (bodyMeshes.includes(child.name)) {
          child.material = bodyMat;
        } else if (!child.name.includes('Person')) {
          child.material = detailMat;
        }
      }
    });
  }, []);

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * blendRate * 0.5;
    }
  });

  return (
    <group ref={ref} position={pos} onClick={() => { if (blendRate === 0 || blendRate === 1) setIndex((index + 1) % names.length) }}>
      <primitive scale={0.02} object={fbx} />
    </group>
  );
}

export default function Stage() {
  return (
    <>
      <Model path={'models/Astronaut.fbx'} pos={[0, 0, 0]} />
    </>
  );
}


