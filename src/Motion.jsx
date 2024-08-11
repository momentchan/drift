import { useEffect, useRef, useState } from "react"
import GlobalState from "./GlobalState";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from 'three'
import { OrbitControls } from "@react-three/drei";

export default function Motion() {

    const [finished, setFinished] = useState(false)

    const { loaded } = GlobalState();
    const { camera } = useThree()

    useEffect(() => {
        if (loaded) {
            const initialPosition = camera.position;
            const targetPosition = new THREE.Vector3(0, 0, 0);

            const direction = new THREE.Vector3().subVectors(targetPosition, initialPosition).normalize();

            const newPosition = new THREE.Vector3().addVectors(initialPosition, direction.multiplyScalar(15));

            gsap.to(camera.position, {
                x: newPosition.x,
                y: newPosition.y,
                z: newPosition.z,
                duration: 5, // Duration of the animation in seconds
                ease: "power2.inOut", // Easing function for a smooth transition
                onComplete: () => {
                    setFinished(true)
                }
            });
        }
    }, [loaded])

    return (<>{finished && <OrbitControls makeDefault />}</>)

}