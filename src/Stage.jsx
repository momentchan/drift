import { AccumulativeShadows, Caustics, Edges, Environment, Lightformer, MeshTransmissionMaterial, RandomizedLight, SoftShadows, useFaceControls, useGLTF, useHelper } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from 'three'

import { folder, useControls } from 'leva'

const light = [2.5, 10, -2.5]
const sphereScaler = 1.1

export default function Stage({ radius }) {
    const diretionalLight = useRef()
    useHelper(diretionalLight, THREE.DirectionalLightHelper, 1)

    const config = useControls({
        'Transmission': folder({
            samples: { value: 16, min: 1, max: 32, step: 1 },

            resolution: { value: 1024, min: 64, max: 2048, step: 64 },

            transmission: { value: 1, min: 0, max: 1 },
            thickness: { value: 0.02, min: 0, max: 1, step: 0.01 },
            roughness: { value: 0, min: 0, max: 1, step: 0.01 },

            chromaticAberration: { value: 0.01, min: 0, max: 1 },
            anisotropy: { value: 0.1, min: 0, max: 10, step: 0.01 },
            anisotropicBlur: { value: 0.1, min: 0, max: 10, step: 0.01 },

            clearcoat: { value: 1, min: 0, max: 1, step: 0.01 },
            clearcoatRoughness: { value: 1, min: 0, max: 1, step: 0.01 },

            backside: false,
            backsideThickness: { value: 200, min: 0, max: 200, step: 0.01 },
            backsideEnvMapIntensity: { value: 1, min: 0, max: 1, step: 0.01 },
            backsideResolution: { value: 1024, min: 64, max: 2048, step: 64 },

            ior: { value: 1.5, min: 1, max: 5, step: 0.01 },

            distortion: { value: 0.0, min: 0, max: 1, step: 0.01 },
            distortionScale: { value: 0.2, min: 0.01, max: 1, step: 0.01 },
            temporalDistortion: { value: 0, min: 0, max: 1, step: 0.01 },

            attenuationDistance: { value: 0.5, min: 0, max: 10, step: 0.01 },
            attenuationColor: '#ffffff',
            color: '#ffffff',
        })
    })


    const caustics = useControls({
        'Caustics': folder({
            color: 'white',
            worldRadius: { value: 0.3125, min: 0.0001, max: 10, step: 0.0001 },
            ior: { value: 1.1, min: 0, max: 2, step: 0.01 },
            intensity: { value: 0.0, min: 0, max: 10, step: 0.01 },
        })
    })

    return (
        <>
            <Environment preset="city" />

            <ambientLight intensity={0.05} />

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

            <directionalLight
                ref={diretionalLight}
                intensity={2} position={light}
                castShadow
                shadow-mapSize={[512, 512]}
                shadow-camera-top={radius * 2}
                shadow-camera-right={radius * 2}
                shadow-camera-bottom={- radius * 2}
                shadow-camera-left={- radius * 2}
            />

            <mesh
                position={[0, -radius * sphereScaler, 0]}
                rotation={[-Math.PI * 0.5, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[radius * 5, radius * 5, 1, 1]} />
                <shadowMaterial transparent opacity={0.5} />
                {/* <meshStandardMaterial metalness={1} roughness={0}/> */}
            </mesh>

            <mesh
                position={[0, 0, 0]}
                castShadow>
                <boxGeometry args={[2, 2, 2]} />
                {/* <meshStandardMaterial metalness={1} roughness={0}/> */}
                <meshBasicMaterial />
            </mesh>

            <group
                visible={false}
            >
                <Caustics
                    frames='Infinity'
                    backside
                    height={-5}
                    // debug
                    lightSource={light}
                    {...caustics}>
                    <mesh castShadow>
                        <sphereGeometry args={[radius * sphereScaler, 32, 32]} />

                        <MeshTransmissionMaterial
                            toneMapped={false}
                            envMapIntensity={1}
                            {...config}
                        />
                    </mesh>
                </Caustics>
            </group>
        </>
    )
}