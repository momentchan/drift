import React, { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

const rfs = THREE.MathUtils.randFloatSpread
const speedRange = [-0.2, -0.5]
const lengthRange = [5, 20]

function Ray({ index, pos, dir, normal, binormal, length, lengthRange, speedRange, range = 20, onUpdatePoints }) {
    var speed = THREE.MathUtils.randFloat(speedRange[0], speedRange[1])
    var offset = dir.clone().multiplyScalar(speed)

    const [points, setPoints] = useState([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)])

    function getRandomPos() {
        // length = THREE.MathUtils.randFloat(lengthRange[0], lengthRange[1])
        speed = THREE.MathUtils.randFloat(speedRange[0], speedRange[1])

        const offset1 = normal.clone().multiplyScalar(rfs(range))
        const offset2 = binormal.clone().multiplyScalar(rfs(range))

        const p = pos.clone().add(offset1).add(offset2)
        setPoints([p.clone(), p.clone().add(dir.clone().multiplyScalar(length))])

        offset = dir.clone().multiplyScalar(speed)
    }

    useEffect(() => {
        getRandomPos()
    }, [])

    useFrame(() => {
        setPoints([points[0].add(offset), points[1].add(offset)])
        onUpdatePoints(index, points[0], length)

        if (points[1].y < -20)
            getRandomPos()
    });

    return (
        <>
            <Line
                points={points}
                color="white"
                lineWidth={2}
            />
        </>
    );
}

export default function RayEmitter({ rayCount, lightPos, onUpdateTexture }) {
    const dir = new THREE.Vector3()
    const normal = new THREE.Vector3()
    const binormal = new THREE.Vector3()
    const [pos, setPos] = useState(new THREE.Vector3(lightPos[0], lightPos[1], lightPos[2]))

    useEffect(() => {
        dir.copy(pos).normalize()
        normal.crossVectors(dir, new THREE.Vector3(1, 0, 0));
        binormal.crossVectors(dir, normal)
    }, [pos])

    // const points = [];

    // points.push(new THREE.Vector3(- 10, 0, 0));
    // points.push(new THREE.Vector3(0, 10, 0));
    // points.push(new THREE.Vector3(10, 0, 0));

    return (
        <>
            {/* <Line
                points={points}
                color="white"
                lineWidth={1}
            /> */}
            {Array.from({ length: rayCount }, (_, i) => (
                <Ray
                    key={i}
                    index={i}
                    pos={pos}
                    dir={dir}
                    binormal={binormal}
                    normal={normal}
                    length={THREE.MathUtils.randFloat(lengthRange[0], lengthRange[1])}
                    lengthRange={lengthRange}
                    speedRange={speedRange}
                    onUpdatePoints={onUpdateTexture}
                />
            ))}
        </>
    );
};
