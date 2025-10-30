import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import GlobalState from '../GlobalState';
import gsap from 'gsap';

const durationRange = [3, 6] as const;
// delay range is now controlled by AutoSpawner

interface WaveProps {
  rate: number;
  radius: number;
}

function Wave({ rate, radius }: WaveProps) {
  const circleRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (circleRef.current) {
      circleRef.current.lookAt(camera.position);
    }
  });

  useEffect(() => {
    const listener = camera.children.find(child => child instanceof THREE.AudioListener) as THREE.AudioListener | undefined;

    if (listener) {
      const sound = new THREE.PositionalAudio(listener);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load('wave02.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.05);
        sound.setRefDistance(10);
        sound.play();
      });
    }
  }, [camera]);

  return (
    <mesh ref={circleRef}>
      <ringGeometry args={[rate * radius * 0.99, rate * radius, 128]} />
      <meshStandardMaterial
        emissive='white'
        emissiveIntensity={1000}
        transparent
        opacity={THREE.MathUtils.smoothstep(1 - rate, 0, 1)}
      />
    </mesh>
  );
}

// Wave component moved to its own file

interface WavesProps {
  waveRates: number[];
  setWaveRates: React.Dispatch<React.SetStateAction<number[]>>;
  currentId: number;
  setCurrentId: React.Dispatch<React.SetStateAction<number>>;
  radius: number;
}

export default function Waves({ waveRates, setWaveRates, currentId, setCurrentId, radius }: WavesProps) {
  const { started } = GlobalState();
  const tweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  const currentIdRef = useRef(currentId);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(!document.hidden);
  const hasStartedRef = useRef(false);
  const spawnOneRef = useRef<() => void>(() => {});

  // keep a cosmetic state in sync without re-triggering the effect
  useEffect(() => {
    currentIdRef.current = currentId;
  }, [currentId]);

  const getNextAvailableId = useMemo(() => {
    return (startIndex: number) => {
      const len = waveRates.length;
      for (let i = 0; i < len; i++) {
        const idx = (startIndex + i) % len;
        const rate = waveRates[idx];
        if (!(rate > 0 && rate < 1)) return idx;
      }
      return startIndex % len;
    };
  }, [waveRates]);

  const spawnOne = () => {
    const idCandidate = currentIdRef.current;
    const id = getNextAvailableId(idCandidate);
    currentIdRef.current = (id + 1) % waveRates.length;
    setCurrentId(currentIdRef.current);

    const animationObject = { value: 0 };
    setWaveRates(prev => {
      const next = [...prev];
      next[id] = 0;
      return next;
    });

    // kill any existing tween for this id
    const existing = tweenRefs.current[id];
    if (existing) existing.kill();

    tweenRefs.current[id] = gsap.to(animationObject, {
      value: 1,
      duration: THREE.MathUtils.randFloat(durationRange[0], durationRange[1]),
      ease: "Power2.easeOut",
      onUpdate: () => {
        setWaveRates(prev => {
          const next = [...prev];
          next[id] = animationObject.value;
          return next;
        });
      },
      onComplete: () => {
        tweenRefs.current[id] = null;
      }
    });
  };
  // set the current spawn function immediately after definition
  spawnOneRef.current = spawnOne;

  useEffect(() => {
    return () => {
      // cleanup all running tweens
      tweenRefs.current.forEach(t => t && t.kill());
      tweenRefs.current = [];
    };
  }, []);

  // keep latest spawnOne reference
  useEffect(() => {
    spawnOneRef.current = spawnOne;
  });

  // quick manual spawn: press 'W'
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') {
        e.preventDefault();
        spawnOneRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
  // simple non-burst spawner inlined here
  useEffect(() => {
    const minInterval = 10000;
    const maxInterval = 20000;
    const initialDelay = 0;

    const scheduleNextSpawn = () => {
      if (!started || !isVisibleRef.current) return;
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      const randomDelay = Math.random() * (maxInterval - minInterval) + minInterval;
      timeoutIdRef.current = setTimeout(() => {
        if (isVisibleRef.current && started) {
          spawnOne();
        }
        scheduleNextSpawn();
      }, randomDelay);
    };

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current && started) {
        scheduleNextSpawn();
      } else {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      }
    };

    if (!started) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      return;
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      if (initialDelay > 0) {
        setTimeout(() => {
          scheduleNextSpawn();
        }, initialDelay);
      } else {
        scheduleNextSpawn();
      }
    } else {
      // restarted
      scheduleNextSpawn();
    }

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [started]);

  return (
    <>
      {waveRates.map((rate, i) => rate > 0 && rate < 1 ? (
        <Wave key={i} rate={rate} radius={radius} />
      ) : null)}
    </>
  );
}