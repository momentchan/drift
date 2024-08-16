import { useAnimations, useFBX, useTexture } from "@react-three/drei";
import * as THREE from 'three'
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshBVHHelper, computeBoundsTree, StaticGeometryGenerator } from "three-mesh-bvh";
import GlobalState from "./GlobalState";

function Model({ path, pos }) {
    const fbx = useFBX(path)
    const { ref, actions, names } = useAnimations(fbx.animations);
    const [index, setIndex] = useState(0)
    const [blendRate, setBlendRate] = useState(0)

    const { isMobile } = GlobalState()
    const { camera, size, scene } = useThree();
    const raycaster = useRef(new THREE.Raycaster());

    const astrounautRef = useRef()
    const bvhHelperRef = useRef()
    const meshHelperRef = useRef()
    const staticGeomGeneratorRef = useRef()
    const updateInterval = 2500; // Update interval in milliseconds
    const transT = 3

    function animationReady() { return blendRate === 0 || blendRate === 1; }

    // Textures
    {
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
        }, [fbx])
    }

    // Animation
    {

        function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }

        function applyEasedFade(action, duration, fadeIn = true) {
            action.setEffectiveWeight(fadeIn ? 0 : 1);

            let startTime = performance.now();

            const interval = setInterval(() => {
                const elapsed = performance.now() - startTime;
                const normalizedTime = Math.min(elapsed / (duration * 1000), 1); // Normalized time between 0 and 1

                const blendRate = index === 0 ? 1 - Math.min(elapsed / (transT * 1000), 1) : Math.min(elapsed / (transT * 1000), 1);
                setBlendRate(blendRate)

                const easedTime = easeInOutQuad(normalizedTime); // Apply easing
                const weight = fadeIn ? easedTime : 1 - easedTime;

                action.setEffectiveWeight(weight);

                if (normalizedTime === 1) {
                    if (!fadeIn) action.stop(); // Stop the action if it's fading out
                    clearInterval(interval);
                }
            }, 10);

            action.play();
        }

        useEffect(() => {
            const action = actions[names[index]];
            // Reset and fade in animation after an index has been changed
            applyEasedFade(action, transT, true); // Eased fade in

            // In the clean-up phase, fade it out
            return () => applyEasedFade(action, transT, false); // Eased fade out
        }, [index, actions, names])
    }

    // Bvh
    {
        function regenerateMesh() {

            if (meshHelperRef.current) {

                staticGeomGeneratorRef.current.generate(meshHelperRef.current.geometry);

                // time the bvh refitting
                if (!meshHelperRef.current.geometry.boundsTree) {
                    meshHelperRef.current.geometry.computeBoundsTree();
                } else {
                    meshHelperRef.current.geometry.boundsTree.refit();
                }

                bvhHelperRef.current.update();
            }
        }

        if (!isMobile) {
            useEffect(() => {
                if (!astrounautRef.current) return

                THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;

                staticGeomGeneratorRef.current = new StaticGeometryGenerator(astrounautRef.current);

                const wireframeMaterial = new THREE.MeshBasicMaterial({
                    wireframe: true,
                    transparent: true,
                    opacity: 0.05,
                    depthWrite: false,
                });

                meshHelperRef.current = new THREE.Mesh(new THREE.BufferGeometry(), wireframeMaterial);
                meshHelperRef.current.visible = false
                scene.add(meshHelperRef.current)

                bvhHelperRef.current = new MeshBVHHelper(meshHelperRef.current, 10);
                const edgeMaterial = new THREE.MeshBasicMaterial({
                    color: 'white',
                    opacity: 0.1,
                    transparent: true,
                })
                bvhHelperRef.current.edgeMaterial = edgeMaterial
                bvhHelperRef.current.visible = false

                scene.add(bvhHelperRef.current)

            }, [astrounautRef])

            useEffect(() => {
                const timerId = setInterval(() => {
                    regenerateMesh();
                }, updateInterval);

                return () => clearInterval(timerId);
            }, []);
        }
    }

    useFrame((state, delta) => {
        ref.current.rotation.x += delta * blendRate * 0.5

        if (meshHelperRef.current && !isMobile) {
            raycaster.current.setFromCamera(state.pointer, camera);
            raycaster.current.firstHitOnly = true;
            const intersects = raycaster.current.intersectObjects([meshHelperRef.current]);

            document.body.style.cursor = intersects.length > 0 && animationReady() ? "pointer" : "auto";
        }
    })

    return (
        <group
            ref={ref}
            position={pos}
            onClick={() => {
                if (animationReady())
                    setIndex((index + 1) % names.length);
            }}
        >
            <primitive ref={astrounautRef} scale={0.02} object={fbx} />
        </group>
    )
}

export default function Stage({ }) {
    return (
        <>
            <Model path={'Astronaut.fbx'} pos={[0, 0, 0]} />
        </>
    )
}