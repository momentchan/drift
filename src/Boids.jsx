import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from "react";
import GPGPU from "./r3f-gist/gpgpu/GPGPU";
import "./shaders/boidsPointRenderShader";
import PosSimulateShaderMaterial from "./shaders/posSimulateShader";
import { useFrame, useThree } from "@react-three/fiber";
import VelSimulateShaderMaterial from "./shaders/velSimulateShader";
import { folder, useControls } from 'leva'
import ThreeCustomShaderMaterial from 'three-custom-shader-material'
import { patchShaders } from 'gl-noise'
import BoidsMeshRenderCustomShader from "./shaders/boidsMeshRenderCustomShader";
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { getRandomVectorInsideSphere } from "./r3f-gist/utility/Utilities";
import { useFBX } from '@react-three/drei';
import GlobalState from './GlobalState';
import { Vector2 } from 'three/src/Three.js';
import gsap from 'gsap';


const durationRange = [3, 6]
const delayRange = [10000, 20000]

function initData(count, radius) {
    const data = new Float32Array(count * 4)
    for (let i = 0; i < data.length; i += 4) {
        const vec = getRandomVectorInsideSphere(radius);
        data[i] = vec.x
        data[i + 1] = vec.y
        data[i + 2] = vec.z
        data[i + 3] = 1
    }
    return data
}

function Circles({ waveRates, setWaveRates, currentId, setCurrentId, radius }) {
    const { started } = GlobalState();

    useEffect(() => {
        const animateWaveRate = () => {
            const animationObject = { value: 0 }; 

            gsap.to(animationObject, {
                value: 1,
                duration: THREE.MathUtils.randFloat(durationRange[0], durationRange[1]),
                ease: "Power2.easeInOut",
                onStart: () => {
                    setWaveRates(prevWaveRates => {
                        const newWaveRates = [...prevWaveRates];
                        newWaveRates[currentId] = 0;
                        return newWaveRates;
                    });
                },
                onUpdate: () => {
                    setWaveRates(prevWaveRates => {
                        const newWaveRates = [...prevWaveRates];
                        newWaveRates[currentId] = animationObject.value; // Update only the current ID's element
                        return newWaveRates;
                    });
                },
                onComplete: () => {
                    // After animation completes, set a new random interval and call animateWaveRate again
                    const randomDelay = THREE.MathUtils.randFloat(delayRange[0], delayRange[1]); // Random delay between 3-10 seconds
                    setTimeout(() => {
                        setCurrentId(prev => (prev + 1) % waveRates.length); // Move to the next ID
                        animateWaveRate(); // Start the animation again
                    }, randomDelay);
                }
            });
        };
        if (started) {
            const initialDelay = THREE.MathUtils.randFloat(delayRange[0], delayRange[1]); // Random delay between 3-10 seconds for the first animation
            setTimeout(() => {
                animateWaveRate(); // Start the first animation after the initial random delay
            }, initialDelay);
        }

    }, [started]);


    return (
        <>
            {
                waveRates.map((rate, i) => (
                    <Circle key={i} rate={rate} radius={radius} />
                ))
            }
        </>
    )
}

function Circle({ rate, radius }) {
    const circleRef = useRef()
    const { camera } = useThree()
    useFrame(() => {
        if (circleRef.current) {
            circleRef.current.lookAt(camera.position)
        }
    })


    return <>
        {
            rate != 0 && rate != 1 &&
            <mesh ref={circleRef}>
                <ringGeometry args={[rate * radius * 0.99, rate * radius, 64]} />
                <meshStandardMaterial emissive='white' emissiveIntensity={1000} transparent opacity={THREE.MathUtils.smoothstep(1 - rate, 0, 1)} />
            </mesh>
        }
    </>
}

export default function Boids({ radius, length, lightPos, texture, rayCount }) {
    const fbx = useFBX('pyramid.fbx')
    const [geometry, setGeometry] = useState(null);
    const { isTriangle, started } = GlobalState();

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
    })

    const count = length * length

    const { gl, camera, size } = useThree()

    const [waveRates, setWaveRates] = useState(Array(5).fill(0));
    const [currentId, setCurrentId] = useState(0)

    const renderMat = new BoidsMeshRenderCustomShader()

    const depthMat = new CustomShaderMaterial({
        // CSM
        baseMaterial: THREE.MeshDepthMaterial,
        vertexShader: renderMat.vertexShader,
        uniforms: renderMat.uniforms,
        silent: true,

        // MeshDepthMaterial
        depthPacking: THREE.RGBADepthPacking
    })

    const mesh = useRef()
    const mat = useRef()

    const uvs = useMemo(() => {
        const uvs = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
            const i3 = i * 3
            uvs[i3 + 0] = (i % length) / length
            uvs[i3 + 1] = i / length / length
        }
        const geometry = fbx.children[0].geometry
        geometry.setAttribute('uvs', new THREE.InstancedBufferAttribute(new Float32Array(uvs), 3));
        setGeometry(geometry)
        return uvs
    }, [count])

    const gpgpu = useMemo(() => {
        const gpgpu = new GPGPU(gl, length, length)


        gpgpu.addVariable('positionTex', initData(length * length, radius), new PosSimulateShaderMaterial())
        gpgpu.addVariable('velocityTex', initData(length * length, 10), new VelSimulateShaderMaterial())

        gpgpu.setVariableDependencies('positionTex', ['positionTex', 'velocityTex'])
        gpgpu.setVariableDependencies('velocityTex', ['positionTex', 'velocityTex'])
        gpgpu.init()

        return gpgpu
    }, [length])


    useFrame((state, delta) => {
        const modelMatrix = mesh.current.matrixWorld;
        const viewMatrix = camera.matrixWorldInverse;
        const projectionMatrix = camera.projectionMatrix;
        const modelViewProjectionMatrix = new THREE.Matrix4().multiplyMatrices(projectionMatrix,
            new THREE.Matrix4().multiplyMatrices(viewMatrix, modelMatrix))
        const inverseModelViewProjectionMatrix = modelViewProjectionMatrix.clone().invert();

        gpgpu.setUniform('positionTex', 'delta', Math.min(delta, 1 / 30))
        gpgpu.setUniform('positionTex', 'time', state.clock.elapsedTime)

        gpgpu.setUniform('velocityTex', 'radius', radius)
        gpgpu.setUniform('velocityTex', 'delta', Math.min(delta, 1 / 30))
        gpgpu.setUniform('velocityTex', 'time', state.clock.elapsedTime)
        gpgpu.setUniform('velocityTex', 'alignmentDistance', props.alignmentDistance);
        gpgpu.setUniform('velocityTex', 'separationDistance', props.separationDistance);
        gpgpu.setUniform('velocityTex', 'cohesionDistance', props.cohesionDistance);
        gpgpu.setUniform('velocityTex', 'separationWeight', props.separationWeight);
        gpgpu.setUniform('velocityTex', 'alignmentWeight', props.alignmentWeight);
        gpgpu.setUniform('velocityTex', 'cohesionWeight', props.cohesionWeight);
        gpgpu.setUniform('velocityTex', 'avoidWallWeight', props.avoidWallWeight);
        gpgpu.setUniform('velocityTex', 'noiseWeight', props.noiseWeight);
        gpgpu.setUniform('velocityTex', 'touchWeight', props.touchWeight);
        gpgpu.setUniform('velocityTex', 'touchPos', started ? state.pointer : new Vector2(-1, 1));
        gpgpu.setUniform('velocityTex', 'waveRates', waveRates);

        gpgpu.setUniform('velocityTex', 'noiseFrequency', props.noiseFrequency);
        gpgpu.setUniform('velocityTex', 'noiseSpeed', props.noiseSpeed);
        gpgpu.setUniform('velocityTex', 'touchRange', props.touchRange * THREE.MathUtils.mapLinear(camera.position.length(), 36, 20, 0.6, 1));

        gpgpu.setUniform('velocityTex', 'maxSpeed', props.maxSpeed);
        gpgpu.setUniform('velocityTex', 'maxForce', props.maxForce);
        gpgpu.setUniform('velocityTex', 'aspect', size.width / size.height);
        gpgpu.setUniform('velocityTex', 'modelViewProjectionMatrix', modelViewProjectionMatrix)
        gpgpu.setUniform('velocityTex', 'inverseModelViewProjectionMatrix', inverseModelViewProjectionMatrix)
        gpgpu.setUniform('velocityTex', 'lightPos', lightPos)
        gpgpu.setUniform('velocityTex', 'rayCount', rayCount)
        gpgpu.setUniform('velocityTex', 'rayTex', texture)

        gpgpu.compute()

        mat.current.uniforms.positionTex.value = gpgpu.getCurrentRenderTarget('positionTex')
        mat.current.uniforms.velocityTex.value = gpgpu.getCurrentRenderTarget('velocityTex')
        mat.current.uniforms.time.value = state.clock.elapsedTime

    })

    return (
        <>
            {geometry != null &&
                <instancedMesh
                    ref={mesh}
                    args={[null, null, count]}
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
                        fragmentShader={patchShaders(renderMat.fragmentShader)}
                        vertexShader={patchShaders(renderMat.vertexShader)}
                        uniforms={renderMat.uniforms}
                        envMapIntensity={0.5}
                    />
                </instancedMesh>
            }

            <Circles radius={radius} waveRates={waveRates} setWaveRates={setWaveRates} currentId={currentId} setCurrentId={setCurrentId} />
        </>
    )
}