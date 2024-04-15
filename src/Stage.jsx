import { Caustics, Edges, MeshTransmissionMaterial, useFBX } from "@react-three/drei";
import * as THREE from 'three'

import { folder, useControls } from 'leva'
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const sphereScaler = 1.1

export default function Stage({ radius }) {

    const fbx = useFBX('Female Dynamic Pose.fbx')
    const body = useRef()
    const mixer = new THREE.AnimationMixer(fbx)
    console.log(mixer);


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


    useEffect(() => {
        fbx.traverse(child => {
            if(child.isMesh){
                const mat = new THREE.MeshStandardMaterial()
                child.material = mat
            }
        })
        fbx.animations.forEach(clip=>{
            const action = mixer.clipAction(clip)
            action.play()
        })
    }, [])

    useFrame((_,delta)=>{
        mixer.update(delta)
        body.current.rotation.y += delta * 1.0

        console.log();
    })

    return (
        <>
            {/* <mesh
                position={[0, 0, 0]}
                castShadow>
                <sphereGeometry args={[1, 36, 36]} />
                <meshStandardMaterial
                    emissive='white'
                    emissiveIntensity={5.0}
                />
            </mesh> */}
            <primitive scale={2} object={fbx} ref={body} />

            <group
                visible={false}
            >
                <Caustics
                    frames='Infinity'
                    backside
                    height={-5}
                    // debug
                    // lightSource={light}
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