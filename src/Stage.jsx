import { Environment, useFaceControls, useHelper } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from 'three'

import { folder, useControls } from 'leva'

export default function Stage({ bounds }) {
    const diretionalLight = useRef()
    useHelper(diretionalLight, THREE.DirectionalLightHelper, 1)

    console.log(diretionalLight.current);

    return (
        <>
            <Environment preset="city" />

            <directionalLight
                ref={diretionalLight}
                intensity={10} position={[0, 1, 0]}
                castShadow 
                shadow-mapSize={[512, 512]}
                shadow-camera-top={bounds * 0.5}
                shadow-camera-right={bounds * 0.5}
                shadow-camera-bottom={- bounds * 0.5}
                shadow-camera-left={- bounds * 0.5}
            />

            <mesh
                position={[0, -bounds * 0.5, 0]}
                rotation={[-Math.PI * 0.5, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[bounds, bounds, 1, 1]} />
                <meshStandardMaterial />
            </mesh>

            <mesh
                position={[0,  -bounds * 0.5 + 5, 0]}
                castShadow
            >
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial />
            </mesh>
        </>
    )
}