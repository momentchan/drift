import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { randFloatSpread } from 'three/src/math/MathUtils.js';
import GlobalState from './GlobalState';

const rfs = THREE.MathUtils.randFloatSpread
const speedRange = [-0.3, -0.8]
const lengthRange = [5, 20]
const delayRange = [0, -10]

function Triangle({ pos, ratio }) {
    const [points, setPoints] = useState([]);
    const size = useMemo(() => THREE.MathUtils.randFloat(5, 15), [])
    const [fade, setFade] = useState(1)
    const dir = useMemo(() => new THREE.Vector3(randFloatSpread(1), randFloatSpread(1), randFloatSpread(1)).normalize(), [])

    const calculatePoints = () => {
        const angle = Math.PI * 2 / 3
        setFade(THREE.MathUtils.smoothstep(1 - ratio, 0, 0.3))

        const p1 = new THREE.Vector3();
        p1.crossVectors(dir, new THREE.Vector3(1, 0, 0)).multiplyScalar(size * Math.pow(ratio, 0.5));

        const p2 = p1.clone().applyAxisAngle(dir, angle);
        const p3 = p1.clone().applyAxisAngle(dir, -angle);

        const points = [p1.clone().add(pos), p3.clone().add(pos), p2.clone().add(pos), p1.clone().add(pos)];
        setPoints(points);
    };

    useFrame((state) => {
        calculatePoints()
    })

    const lineRef = useRef()
    useEffect(() => {
        if (lineRef.current) {
            lineRef.current.layers.toggle(2)
            // console.log(lineRef.current.layers);
        }
    }, [lineRef.current])

    return <>
        {points.length != 0 && ratio != 0 ?
            <Line
                ref={lineRef}
                points={points}
                color="white"
                transparent
                opacity={fade}
                lineWidth={1} /> :
            ""}
    </>
}

function Rectangle({ pos, ratio }) {
    const [points, setPoints] = useState([]);
    const size = useMemo(() => THREE.MathUtils.randFloat(5, 15), [])
    const [fade, setFade] = useState(1)
    const dir = useMemo(() => new THREE.Vector3(randFloatSpread(1), randFloatSpread(1), randFloatSpread(1)).normalize(), [])

    const calculatePoints = () => {
        const angle = Math.PI / 2
        setFade(THREE.MathUtils.smoothstep(1 - ratio, 0, 0.3))

        const p1 = new THREE.Vector3();
        p1.crossVectors(dir, new THREE.Vector3(1, 0, 0)).multiplyScalar(size * Math.pow(ratio, 0.5));

        const p2 = p1.clone().applyAxisAngle(dir, angle)
        const p3 = p1.clone().applyAxisAngle(dir, angle * 2)
        const p4 = p1.clone().applyAxisAngle(dir, angle * 3)

        const points = [p1.clone().add(pos), p2.clone().add(pos), p3.clone().add(pos), p4.clone().add(pos), p1.clone().add(pos)];
        setPoints(points);
    };

    useFrame((state) => {
        calculatePoints()
    })

    return <>
        {points.length != 0 && ratio != 0 ?
            <Line
                points={points}
                color="white"
                transparent
                opacity={fade}
                lineWidth={1} /> :
            ""}
    </>
}

function Ray({ index, pos, dir, normal, binormal, lengthRange, speedRange, range = 30, onUpdatePoints }) {

    const { started } = GlobalState();


    const [delay, setDelay] = useState(THREE.MathUtils.randFloat(delayRange[0], delayRange[1]))
    const [speed, setSpeed] = useState(THREE.MathUtils.randFloat(speedRange[0], speedRange[1]))
    const [length, setLength] = useState(THREE.MathUtils.randFloat(lengthRange[0], lengthRange[1]))
    const [fade, setFade] = useState(0)
    const [stopPos, setStopPos] = useState(0)
    const [stop, setStop] = useState(false)
    const [triPos, setTriPos] = useState([new THREE.Vector3(-100, -100, -100), new THREE.Vector3(-100, -100, -100)])
    const shape = useMemo(() => THREE.MathUtils.randFloat(0, 1) > 0.5, [])

    const velocity = useMemo(() => dir.clone().multiplyScalar(speed), [dir, speed]);

    const [points, setPoints] = useState([new THREE.Vector3(-100, -100, -100), new THREE.Vector3(-100, -100, -100)])

    const [time, setTime] = useState(0)
    const [duration, setDuration] = useState(THREE.MathUtils.randFloat(2, 5))

    const [sound, setSound] = useState(false)
    const { camera } = useThree()
    const soundRef = useRef();

    function getRandomPos() {
        setDuration(THREE.MathUtils.randFloat(2, 5))
        setTime(0)
        setStop(false)
        setSound(false)
        setTriPos([new THREE.Vector3(-100, -100, -100), new THREE.Vector3(-100, -100, -100)])

        setLength(THREE.MathUtils.randFloat(lengthRange[0], lengthRange[1]))
        setSpeed(THREE.MathUtils.randFloat(speedRange[0], speedRange[1]))
        setDelay(THREE.MathUtils.randFloat(delayRange[0], delayRange[1]))
        setStopPos(THREE.MathUtils.randFloat(-5, 5))

        const offset = new THREE.Vector3().addScaledVector(normal, rfs(2)).addScaledVector(binormal, rfs(2))
        offset.normalize()
        offset.multiplyScalar(THREE.MathUtils.randFloat(2, 8))

        const p = pos.clone().add(offset)
        setPoints([p.clone(), p.clone().add(dir.clone().multiplyScalar(length))])
    }

    useEffect(() => {
        getRandomPos()
    }, [])

    useEffect(() => {
        if (started) {
            const listener = camera.children.find(child => child instanceof THREE.AudioListener);

            const sound = new THREE.PositionalAudio(listener);
            // Load the audio file
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load('/wave01.mp3', (buffer) => {
                sound.setBuffer(buffer);
                sound.setLoop(false); // Play only once
                sound.setVolume(0.3); // Set volume
                sound.setRefDistance(10);
                soundRef.current = sound;
            });
        }
    }, [started])

    useFrame((state, delta) => {
        if (!started) return

        setDelay(delay + Math.min(delta, 1 / 30))
        if (delay > 0) {

            const dot = points[0].dot(dir.clone().normalize())

            setFade(THREE.MathUtils.clamp(delay / 10, 0, 1) * THREE.MathUtils.smootherstep(points[1].y, -50, -30))

            if (dot < stopPos) {
                setLength(Math.max(length - velocity.length(), 0))

                if (!stop) {
                    setTriPos(points[1])
                    setStop(true)
                }
            }

            const p1 = points[0].add(velocity)
            const p2 = p1.clone().add(velocity.clone().normalize().multiplyScalar(length))
            setPoints([p1, p2])

            onUpdatePoints(index, points[0], length)

            if (length == 0) {
                setTime(time + delta)

                if (!sound) {
                    soundRef.current.position.copy(p1);
                    soundRef.current.play();
                    setSound(true);
                }
            }

            if (points[1].y < -100) {
                getRandomPos()
            }
        }
    });

    return (
        <>
            {delay < 0 ? "" : <Line
                points={points}
                color="white"
                lineWidth={1}
                transparent
                opacity={fade}
            />}

            {shape ? <Rectangle pos={triPos} ratio={Math.min(time / duration, 1)} /> : <Triangle pos={triPos} ratio={Math.min(time / duration, 1)} />}
        </>
    );
}

export default function RayEmitter({ rayCount, lightPos, onUpdateTexture }) {
    const [dir, setDir] = useState(new THREE.Vector3());
    const [normal, setNormal] = useState(new THREE.Vector3());
    const [binormal, setBinormal] = useState(new THREE.Vector3());
    const pos = new THREE.Vector3(lightPos[0], lightPos[1], lightPos[2])


    useEffect(() => {
        const newDir = new THREE.Vector3().copy(pos).normalize();
        setDir(newDir);

        const newNormal = new THREE.Vector3();
        newNormal.crossVectors(newDir, new THREE.Vector3(1, 0, 0)).normalize();

        const newBinormal = new THREE.Vector3();
        newBinormal.crossVectors(newDir, newNormal).normalize();

        setNormal(newNormal);
        setBinormal(newBinormal);
    }, []);

    return (
        <>
            {normal.length() != 0 &&
                Array.from({ length: rayCount }, (_, i) => (
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
                ))
            }
        </>
    );
};
