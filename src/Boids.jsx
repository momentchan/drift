import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from "react";
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

export default function Boids({ radius, length }) {

    const props = useControls({
        'Boids': folder({
            separationDistance: { value: 1, min: 0, max: 5 },
            alignmentDistance: { value: 2, min: 0, max: 5 },
            cohesionDistance: { value: 2, min: 0, max: 5 },

            separationWeight: { value: 1, min: 0, max: 10 },
            alignmentWeight: { value: 0.5, min: 0, max: 10 },
            cohesionWeight: { value: 0.5, min: 0, max: 10 },
            avoidWallWeight: { value: 10, min: 0, max: 10 },
            noiseWeight: { value: 1.2, min: 0, max: 5 },
            touchWeight: { value: 30, min: 0, max: 50 },

            noiseFrequency: { value: 0.05, min: 0, max: 0.1 },
            noiseSpeed: { value: 0.1, min: 0, max: 0.5 },
            touchRange: { value: 0.6, min: 0, max: 0.5 },

            maxSpeed: { value: 2, min: 0, max: 20 },
            maxForce: { value: 10, min: 0, max: 20 },
        }),
    })

    const count = length * length

    const { gl, camera, size } = useThree()

    const [touchDir, setTouchDir] = useState(0);

    const handleCanvasClick = event => {
        if (event.button === 0) {
            setTouchDir(1);
        } else if (event.button === 2) {
            setTouchDir(-1);
        }
    };

    const handleCanvasMouseUp = () => {
        setTouchDir(0);
    };

    useEffect(() => {
        gl.domElement.addEventListener('mousedown', handleCanvasClick);
        gl.domElement.addEventListener('mouseup', handleCanvasMouseUp);
        return () => {
            gl.domElement.removeEventListener('mousedown', handleCanvasClick);
            gl.domElement.removeEventListener('mouseup', handleCanvasMouseUp);
        }
    }, [gl])


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

        gpgpu.setUniform('positionTex', 'delta', delta)
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
        gpgpu.setUniform('velocityTex', 'touchPos', state.pointer);

        gpgpu.setUniform('velocityTex', 'noiseFrequency', props.noiseFrequency);
        gpgpu.setUniform('velocityTex', 'noiseSpeed', props.noiseSpeed);
        gpgpu.setUniform('velocityTex', 'touchRange', props.touchRange);

        gpgpu.setUniform('velocityTex', 'maxSpeed', props.maxSpeed);
        gpgpu.setUniform('velocityTex', 'maxForce', props.maxForce);
        gpgpu.setUniform('velocityTex', 'aspect', size.width / size.height);
        gpgpu.setUniform('velocityTex', 'modelViewProjectionMatrix', modelViewProjectionMatrix)
        gpgpu.setUniform('velocityTex', 'inverseModelViewProjectionMatrix', inverseModelViewProjectionMatrix)

        gpgpu.compute()

        mat.current.uniforms.positionTex.value = gpgpu.getCurrentRenderTarget('positionTex')
        mat.current.uniforms.velocityTex.value = gpgpu.getCurrentRenderTarget('velocityTex')
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
                onClick={() => console.log(123)}
            >
                <boxGeometry args={[0.1, 0.2, 0.6]}>
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
                    // emissive="white" 
                    // emissiveIntensity={ 1 }
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