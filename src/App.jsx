import { Loader, OrbitControls } from "@react-three/drei";
import { Canvas } from '@react-three/fiber'
import Utilities from "./r3f-gist/utility/Utilities";
import { Leva, folder, useControls } from 'leva'
import Stage from "./Stage";
import Effect from "./Effect";
import Light from "./Light";
import { Suspense, useRef } from "react";
import RayEmitter from "./RayEmitter";
import * as THREE from 'three';
import { Perf } from "r3f-perf";
import Boids from "./boids";
import Menu from "./Menu";
import Sound from "./Sound";
import GlobalState from "./GlobalState";

const debug = false

export default function App() {
    const { loaded } = GlobalState();

    const { bgColor } = useControls({
        'Global': folder({
            bgColor: '#000000'
        })
    })

    const props = {
        radius: 10,
        length: 64,
        lightPos: [100, 100, 0],
        rayCount: 5
    }

    const light = useRef()

    const textureData = new Float32Array(props.rayCount * 4);

    const texture = new THREE.DataTexture(
        textureData,
        props.rayCount,
        1,
        THREE.RGBAFormat,
        THREE.FloatType
    );

    const handleUpdatePoints = (index, point, length) => {
        textureData[(index * 4) + 0] = point.x;
        textureData[(index * 4) + 1] = point.y;
        textureData[(index * 4) + 2] = point.z;
        textureData[(index * 4) + 3] = length;
        texture.needsUpdate = true;
    };

    return <>
        <Leva collapsed hidden={!debug} />

        <Canvas
            shadows
            camera={{
                fov: 45,
                near: 0.1,
                far: 200,
                position: [20, 0, 30]
            }}
            gl={{ preserveDrawingBuffer: true }}
        >
            <Suspense fallback={null}>

                {debug && <Perf position='top-left' />}
                <fogExp2 attach="fog" args={[bgColor, 0.05]} />
                <color attach="background" args={[bgColor]} />

                {loaded &&
                    <RayEmitter {...props}
                        texture={texture} // Pass the texture to RayEmitter as a prop
                        onUpdateTexture={handleUpdatePoints}
                    />
                }
                
                <OrbitControls makeDefault />

                <Boids {...props} texture={texture} />

                <Stage {...props} />

                <Light {...props} ref={light} />

                <Utilities />

                <Effect light={light} />

                <Sound />

            </Suspense>
        </Canvas>
        <Loader />
        <Menu />
    </>
}