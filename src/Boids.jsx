import { useMemo, useRef } from "react";
import "./shaders/boidsPointRenderShader";
import PosSimulateShaderMaterial from "./shaders/posSimulateShader";
import { useFrame, useThree } from "@react-three/fiber";
import VelSimulateShaderMaterial from "./shaders/velSimulateShader";
import GPGPU from "./r3f-gist/gpgpu/GPGPU";
import { Edges } from "@react-three/drei";
import { folder, useControls } from 'leva'
import ThreeCustomShaderMaterial from 'three-custom-shader-material'
import * as THREE from 'three'
import { patchShaders } from 'gl-noise'
import BoidsMeshRenderCustomShader from "./shaders/boidsMeshRenderCustomShader";


function initPosData(count, bounds) {
    const data = new Float32Array(count * 4)
    for (let i = 0; i < data.length; i += 4) {
        const x = Math.random() * bounds - bounds * 0.5;
        const y = Math.random() * bounds - bounds * 0.5;
        const z = Math.random() * bounds - bounds * 0.5;
        data[i] = x
        data[i + 1] = y
        data[i + 2] = z
        data[i + 3] = 1
    }
    return data
}

function initVelData(count) {
    const data = new Float32Array(count * 4)
    for (let i = 0; i < data.length; i += 4) {
        const x = Math.random() - 0.5;
        const y = Math.random() - 0.5;
        const z = Math.random() - 0.5;

        data[i + 0] = x * 10
        data[i + 1] = y * 10
        data[i + 2] = z * 10
        data[i + 3] = 1
    }
    return data
}

const bounds = 32
const size = 64

export default function Boids() {

    const props = useControls({
        'boids': folder({
            separationDistance: { value: 1, min: 0, max: 5 },
            alignmentDistance: { value: 2, min: 0, max: 5 },
            cohesionDistance: { value: 3, min: 0, max: 5 },

            separationWeight: { value: 2, min: 0, max: 10 },
            alignmentWeight: { value: 0.5, min: 0, max: 10 },
            cohesionWeight: { value: 0.5, min: 0, max: 10 },
            avoidWallWeight: { value: 3, min: 0, max: 10 },

            maxSpeed: { value: 2, min: 0, max: 20 },
            maxForce: { value: 1, min: 0, max: 20 },
        }),
    })

    const count = size * size

    const { gl } = useThree()
    const renderMat = new BoidsMeshRenderCustomShader()

    const mesh = useRef()
    const mat = useRef()

    const uvs = useMemo(() => {
        const uvs = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            const i3 = i * 3
            uvs[i3 + 0] = (i % size) / size
            uvs[i3 + 1] = i / size / size
        }
        return uvs
    }, [count])


    const gpgpu = useMemo(() => {
        const gpgpu = new GPGPU(gl, size, size)

        gpgpu.addVariable('positionTex', initPosData(size * size, bounds), new PosSimulateShaderMaterial())
        gpgpu.addVariable('velocityTex', initVelData(size * size), new VelSimulateShaderMaterial())

        gpgpu.setVariableDependencies('positionTex', ['positionTex', 'velocityTex'])
        gpgpu.setVariableDependencies('velocityTex', ['positionTex', 'velocityTex'])
        gpgpu.init()
        return gpgpu
    }, [size])

    useFrame((state, delta) => {

        gpgpu.setUniform('positionTex', 'delta', delta)
        gpgpu.setUniform('positionTex', 'time', state.clock.elapsedTime)

        gpgpu.setUniform('velocityTex', 'bounds', bounds)
        gpgpu.setUniform('velocityTex', 'delta', delta)
        gpgpu.setUniform('velocityTex', 'time', state.clock.elapsedTime)

        gpgpu.setUniform('velocityTex', 'alignmentDistance', props.alignmentDistance);
        gpgpu.setUniform('velocityTex', 'separationDistance', props.separationDistance);
        gpgpu.setUniform('velocityTex', 'cohesionDistance', props.cohesionDistance);
        gpgpu.setUniform('velocityTex', 'separationWeight', props.separationWeight);
        gpgpu.setUniform('velocityTex', 'alignmentWeight', props.alignmentWeight);
        gpgpu.setUniform('velocityTex', 'cohesionWeight', props.cohesionWeight);
        gpgpu.setUniform('velocityTex', 'avoidWallWeight', props.avoidWallWeight);
        gpgpu.setUniform('velocityTex', 'maxSpeed', props.maxSpeed);
        gpgpu.setUniform('velocityTex', 'maxForce', props.maxForce);

        gpgpu.compute()

        mat.current.uniforms.positionTex.value = gpgpu.getCurrentRenderTarget('positionTex')
        mat.current.uniforms.velocityTex.value = gpgpu.getCurrentRenderTarget('velocityTex')
    })

    return (
        <>
            <mesh>
                <boxGeometry args={[bounds, bounds, bounds]} />
                <meshBasicMaterial color="#ff0000" opacity={0} transparent />
                <Edges color="white" />
            </mesh>

            <instancedMesh
                ref={mesh}
                args={[null, null, count]}
            >
                <boxGeometry args={[0.2, 0.2, 0.6]}>
                    <instancedBufferAttribute attach="attributes-uvs" args={[uvs, 3]} />
                </boxGeometry>

                <ThreeCustomShaderMaterial
                    ref={mat}
                    baseMaterial={THREE.MeshStandardMaterial}
                    silent
                    color='white'
                    fragmentShader={patchShaders(renderMat.fragmentShader)}
                    vertexShader={patchShaders(renderMat.vertexShader)}
                    uniforms={renderMat.uniforms}
                />
            </instancedMesh>

            {/* <points material={renderMat}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={uvs.length / 3} array={uvs} itemSize={3} />
                </bufferGeometry>
            </points> */}
        </>
    )
}