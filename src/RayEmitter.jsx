import React, { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

const rfs = THREE.MathUtils.randFloatSpread
const speedRange = [-0.2, -0.5]
const lengthRange = [5, 20]

function Ray({ index, pos, dir, normal, binormal, lengthRange, speedRange, range = 30, onUpdatePoints }) {
    const [speed, setSpeed] = useState(THREE.MathUtils.randFloat(speedRange[0], speedRange[1]))
    const [length, setLength] = useState(THREE.MathUtils.randFloat(lengthRange[0], lengthRange[1]))
    const [delay, setDelay] = useState(THREE.MathUtils.randFloat(0, -3))
    const [fade, setFade] = useState(0)

    var offset = dir.clone().multiplyScalar(speed)

    const [points, setPoints] = useState([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)])

    function getRandomPos() {
        setLength(THREE.MathUtils.randFloat(lengthRange[0], lengthRange[1]))
        setSpeed(THREE.MathUtils.randFloat(speedRange[0], speedRange[1]))
        setDelay(THREE.MathUtils.randFloat(0, 3))

        const offset1 = normal.clone().multiplyScalar(rfs(range))
        const offset2 = binormal.clone().multiplyScalar(rfs(range))

        const p = pos.clone().add(offset1).add(offset2)
        setPoints([p.clone(), p.clone().add(dir.clone().multiplyScalar(length))])

        offset = dir.clone().multiplyScalar(speed)
    }

    useEffect(() => {
        getRandomPos()
    }, [])

    useFrame((state, delta) => {
        setDelay(delay + delta)

        setFade(THREE.MathUtils.clamp(delay/10, 0, 1) * THREE.MathUtils.smootherstep(points[1].y, -50, -30))

        setPoints([points[0].add(offset), points[1].add(offset)])
        onUpdatePoints(index, points[0], length)

        if (points[1].y < -50)
            getRandomPos()
    });

    return (
        <>
            {delay < 0 ? "" : <Line
                points={points}
                color="white"
                lineWidth={2}
                transparent
                opacity={fade}
            />}

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
                    lengthRange={lengthRange}
                    speedRange={speedRange}
                    onUpdatePoints={onUpdateTexture}
                />
            ))}
        </>
    );
};
