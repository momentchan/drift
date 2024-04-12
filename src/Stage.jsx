import { Edges, Environment, Lightformer, MeshTransmissionMaterial, SoftShadows, useFaceControls, useGLTF, useHelper } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from 'three'

import { folder, useControls } from 'leva'
export default function Stage({ bounds }) {
    const diretionalLight = useRef()
    useHelper(diretionalLight, THREE.DirectionalLightHelper, 1)
    const { nodes } = useGLTF('/rounded-box.glb')

    const config = useControls({
        'transmission': folder({
            backside: false,
            samples: { value: 16, min: 1, max: 32, step: 1 },
            resolution: { value: 1024, min: 64, max: 2048, step: 64 },
            transmission: { value: 1, min: 0, max: 1 },
            roughness: { value: 0, min: 0, max: 1, step: 0.01 },
            clearcoat: { value: 1, min: 0, max: 1, step: 0.01 },
            clearcoatRoughness: { value: 1, min: 0, max: 1, step: 0.01 },
            thickness: { value: 0.02, min: 0, max: 1, step: 0.01 },
            backsideThickness: { value: 200, min: 0, max: 200, step: 0.01 },
            ior: { value: 1.5, min: 1, max: 5, step: 0.01 },
            chromaticAberration: { value: 0.01, min: 0, max: 1 },
            anisotropicBlur: { value: 0.1, min: 0, max: 10, step: 0.01 },
            distortion: { value: 0.0, min: 0, max: 1, step: 0.01 },
            distortionScale: { value: 0.2, min: 0.01, max: 1, step: 0.01 },
            temporalDistortion: { value: 0, min: 0, max: 1, step: 0.01 },
            attenuationDistance: { value: 0.5, min: 0, max: 10, step: 0.01 },
            attenuationColor: '#ffffff',
            color: '#ffffff',
        })
    })

    return (
        <>
            <Environment preset="city" />
            {/* <Environment resolution={256}>
                <group rotation={[-Math.PI / 2, 0, 0]}>
                    <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                    {[2, 0, 2, 0, 2, 0, 2, 0].map((x, i) => (
                        <Lightformer key={i} form="circle" intensity={4} rotation={[Math.PI / 2, 0, 0]} position={[x, 4, i * 4]} scale={[4, 1, 1]} />
                    ))}
                    <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
                    <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[50, 2, 1]} />
                    <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[50, 2, 1]} />
                </group>
            </Environment> */}
            {/* <SoftShadows size={ 25 } samples={ 10 } focus={ 5 } /> */}

            <directionalLight
                ref={diretionalLight}
                intensity={10} position={[0, 1, 0]}
                castShadow
                shadow-mapSize={[512, 512]}
                shadow-camera-top={bounds}
                shadow-camera-right={bounds}
                shadow-camera-bottom={- bounds}
                shadow-camera-left={- bounds}
            />

            <mesh
                position={[0, -bounds * 0.5, 0]}
                rotation={[-Math.PI * 0.5, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[bounds * 1.5, bounds * 1.5, 1, 1]} />
                <shadowMaterial transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>

            <mesh
                position={[0, -bounds * 0.5 + 5, 0]}
                castShadow
            >
                <boxGeometry args={[2, 2, 2]} />
                <meshBasicMaterial />
            </mesh>
            <ambientLight intensity={0.2} />


            <mesh
                scale={[bounds * 0.55, bounds * 0.55, bounds * 0.55]}
                geometry={nodes.Cube.geometry}
                receiveShadow
                castShadow
            >
                {/* <boxGeometry args={[bounds, bounds, bounds]} /> */}
                {/* <meshBasicMaterial color="#ff0000" opacity={0.5} transparent /> */}
                <MeshTransmissionMaterial
                    {...config} toneMapped={false}
                />
                <Edges color="white" />
            </mesh>
        </>
    )
}