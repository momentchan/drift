import { useEffect, useMemo, useRef } from "react";
import "./shaders/boidsRenderShader";
import BoidsRenderShader from "./shaders/boidsRenderShader";
import PosSimulateShaderMaterial from "./shaders/posSimulateShader";
import { useFrame, useThree } from "@react-three/fiber";
import VelSimulateShaderMaterial from "./shaders/velSimulateShader";
import GPGPU from "./r3f-gist/gpgpu/GPGPU";
import { Edges } from "@react-three/drei";
import { useControls } from 'leva'

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

    const { separationDistance, alignmentDistance, cohesionDistance,
        separationWeight, alignmentWeight, cohesionWeight, avoidWallWeight,
        maxSpeed, maxForce } =
        useControls('boids', {
            separationDistance: { value: 1, min: 0, max: 5 },
            alignmentDistance: { value: 2, min: 0, max: 5 },
            cohesionDistance: { value: 2, min: 0, max: 5 },

            separationWeight: { value: 2, min: 0, max: 10 },
            alignmentWeight: { value: 1, min: 0, max: 10 },
            cohesionWeight: { value: 1, min: 0, max: 10 },
            avoidWallWeight: { value: 10, min: 0, max: 10 },

            maxSpeed: { value: 10, min: 0, max: 200 },
            maxForce: { value: 3, min: 0, max: 20 },
        })


    const count = size * size

    const { gl } = useThree()
    const renderMat = new BoidsRenderShader()

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

        gpgpu.setUniform('velocityTex', 'alignmentDistance', alignmentDistance);
        gpgpu.setUniform('velocityTex', 'separationDistance', separationDistance);
        gpgpu.setUniform('velocityTex', 'cohesionDistance', cohesionDistance);
        gpgpu.setUniform('velocityTex', 'separationWeight', separationWeight);
        gpgpu.setUniform('velocityTex', 'alignmentWeight', alignmentWeight);
        gpgpu.setUniform('velocityTex', 'cohesionWeight', cohesionWeight);
        gpgpu.setUniform('velocityTex', 'avoidWallWeight', avoidWallWeight);
        gpgpu.setUniform('velocityTex', 'maxSpeed', maxSpeed);
        gpgpu.setUniform('velocityTex', 'maxForce', maxForce);

        gpgpu.compute()

        renderMat.uniforms.positionTex.value = gpgpu.getCurrentRenderTarget('positionTex')
    })

    return (
        <>
            <mesh>
                <boxGeometry args={[bounds, bounds, bounds]} />
                <meshBasicMaterial color="#ff0000" opacity={0} transparent />
                <Edges color="white" />
            </mesh>
            <points material={renderMat}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={uvs.length / 3} array={uvs} itemSize={3} />
                </bufferGeometry>
            </points>
        </>
    )
}