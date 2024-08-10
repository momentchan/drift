import { Caustics, Edges, MeshTransmissionMaterial, useFBX, useTexture } from "@react-three/drei";
import * as THREE from 'three'

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import GlobalState from "./GlobalState";

function Model({ path, pos }) {
    const fbx = useFBX(path)

    const body = useRef()
    const bodyTex = useTexture({
        map: 'Textures/Body/Astronaut_Suit_Body_Albedo.png',
        metalnessMap: 'Textures/Body/Astronaut_Suit_Body_Metallic.png',
        aoMap: 'Textures/Body/Astronaut_Suit_Body_Ao.png',
        normalMap: 'Textures/Body/Astronaut_Suit_Body_Normals.png'
    })

    const detailTex = useTexture({
        map: 'Textures/Details/Astronaut_Suit_Details_Albedo.png',
        metalnessMap: 'Textures/Details/Astronaut_Suit_Details_Metallic.png',
        aoMap: 'Textures/Details/Astronaut_Suit_Details_Ao.png',
        normalMap: 'Textures/Details/Astronaut_Suit_Details_Normals.png'
    })

    useEffect(() => {
        const bodyMat = new THREE.MeshStandardMaterial({ map: bodyTex.map, aoMap: bodyTex.aoMap, normalMap: bodyTex.normalMap, metalnessMap: bodyTex.metalnessMap });
        const detailMat = new THREE.MeshStandardMaterial({ map: detailTex.map, aoMap: detailTex.aoMap, normalMap: detailTex.normalMap, metalnessMap: detailTex.metalnessMap });

        const bodyMeshes = [
            'Astronaut_Suit_Body_Detail_01_Mesh',
            'Astronaut_Suit_Body_Mesh',
            'Astronaut_Suit_Shoes_Mesh',
        ]

        fbx.traverse(child => {
            if (child.isMesh) {
                if (bodyMeshes.includes(child.name)) {
                    child.material = bodyMat
                } else if (!child.name.includes('Person')) {
                    child.material = detailMat
                }
            }
        })
    }, [])

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime * 0.8
        fbx.rotation.set(t, 0, 0)
    })

    return (
        <primitive position={pos} scale={0.02} object={fbx} ref={body} />
    )
}


export default function Stage({ }) {
    return (
        <>
            <Model path={'Astronaut.fbx'} pos={[0, 0, 0]} />
        </>
    )
}