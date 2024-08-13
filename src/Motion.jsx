import { useEffect, useRef, useState } from "react"
import GlobalState from "./GlobalState";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from 'three'
import { OrbitControls } from "@react-three/drei";

export default function Motion() {

    const [finished, setFinished] = useState(false)

    const { loaded, resetPos } = GlobalState();
    const { camera } = useThree();
    const controlsRef = useRef();

    function moveToClose(distance, duration) {
        setFinished(false)

        const initialPosition = camera.position;
        const targetPosition = new THREE.Vector3(0, 0, 0);

        const direction = new THREE.Vector3().subVectors(targetPosition, initialPosition).normalize();

        const newPosition = new THREE.Vector3().addVectors(targetPosition, direction.multiplyScalar(-distance));

        const initialQuaternion = camera.quaternion.clone();
        const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().lookAt(newPosition, targetPosition, new THREE.Vector3(0, 1, 0))
        );

        
        const tl = gsap.timeline({
            onUpdate: () => {
                // Calculate the progress of the timeline
                const progress = tl.progress();
                const easedProgress = gsap.parseEase("power2.inOut")(progress);
                // Interpolate rotation
                const interpolatedRotation = new THREE.Quaternion().slerpQuaternions(initialQuaternion, targetQuaternion, easedProgress);
                camera.quaternion.copy(interpolatedRotation);
            },
            onComplete: () => {
                setFinished(true);
            }
        });

        // Animate position
        tl.to(camera.position, {
            x: newPosition.x,
            y: newPosition.y,
            z: newPosition.z,
            duration: duration,
            ease: "power2.inOut"
        });
    }

    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.minDistance = 5;  // Minimum zoom distance
            controlsRef.current.maxDistance = 35; // Maximum zoom distance
            //controlsRef.current.enablePan = false
        }
    }, [controlsRef.current]);

    useEffect(() => {
        if (loaded) {
            moveToClose(20, 5)
        }
    }, [loaded])


    useEffect(() => {
        if (loaded) {
            moveToClose(10, 2)
        }
    }, [resetPos])

    return (<>{finished && <OrbitControls ref={controlsRef} makeDefault />}</>)

}