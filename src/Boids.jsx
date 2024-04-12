import * as THREE from 'three'
import { useMemo, useRef } from "react";
import "./shaders/boidsPointRenderShader";
import PosSimulateShaderMaterial from "./shaders/posSimulateShader";
import { useFrame, useThree } from "@react-three/fiber";
import VelSimulateShaderMaterial from "./shaders/velSimulateShader";
import GPGPU from "./r3f-gist/gpgpu/GPGPU";
import { folder, useControls } from 'leva'
import ThreeCustomShaderMaterial from 'three-custom-shader-material'
import { patchShaders } from 'gl-noise'
import BoidsMeshRenderCustomShader from "./shaders/boidsMeshRenderCustomShader";
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { getRandomVectorInsideSphere } from "./r3f-gist/utility/Utilities";


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

export default function Boids({ radius, size }) {

    const props = useControls({
        'boids': folder({
            separationDistance: { value: 1, min: 0, max: 5 },
            alignmentDistance: { value: 2, min: 0, max: 5 },
            cohesionDistance: { value: 2, min: 0, max: 5 },

            separationWeight: { value: 1, min: 0, max: 10 },
            alignmentWeight: { value: 0.5, min: 0, max: 10 },
            cohesionWeight: { value: 0.5, min: 0, max: 10 },
            avoidWallWeight: { value: 10, min: 0, max: 10 },
            noiseWeight: { value: 1.2, min: 0, max: 5 },
            noiseFrequency: { value: 0.05, min: 0, max: 0.1 },
            noiseSpeed: { value: 0.1, min: 0, max: 0.5 },

            maxSpeed: { value: 2, min: 0, max: 20 },
            maxForce: { value: 10, min: 0, max: 20 },
        }),
    })

    const count = size * size

    const { gl } = useThree()
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
            uvs[i3 + 0] = (i % size) / size
            uvs[i3 + 1] = i / size / size
        }
        return uvs
    }, [count])


    const gpgpu = useMemo(() => {
        const gpgpu = new GPGPU(gl, size, size)

        gpgpu.addVariable('positionTex', initData(size * size, radius), new PosSimulateShaderMaterial())
        gpgpu.addVariable('velocityTex', initData(size * size, 10), new VelSimulateShaderMaterial())

        gpgpu.setVariableDependencies('positionTex', ['positionTex', 'velocityTex'])
        gpgpu.setVariableDependencies('velocityTex', ['positionTex', 'velocityTex'])
        gpgpu.init()
        return gpgpu
    }, [size])

    useFrame((state, delta) => {

        gpgpu.setUniform('positionTex', 'delta', delta)
        gpgpu.setUniform('positionTex', 'time', state.clock.elapsedTime)

        gpgpu.setUniform('velocityTex', 'radius', radius)
        gpgpu.setUniform('velocityTex', 'delta', delta)
        gpgpu.setUniform('velocityTex', 'time', state.clock.elapsedTime)
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
        gpgpu.setUniform('velocityTex', 'maxSpeed', props.maxSpeed);
        gpgpu.setUniform('velocityTex', 'maxForce', props.maxForce);

        gpgpu.compute()

        mat.current.uniforms.positionTex.value = gpgpu.getCurrentRenderTarget('positionTex')
        mat.current.uniforms.velocityTex.value = gpgpu.getCurrentRenderTarget('velocityTex')

        // depthMat.uniforms.positionTex.value = gpgpu.getCurrentRenderTarget('positionTex')
        // depthMat.uniforms.velocityTex.value = gpgpu.getCurrentRenderTarget('velocityTex')
    })

    return (
        <>
            <instancedMesh
                ref={mesh}
                args={[null, null, count]}
                castShadow
                receiveShadow
                frustumCulled={false}
                customDepthMaterial={depthMat}
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
                    envMapIntensity={0.2}
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