import { OrbitControls } from "@react-three/drei";
import { Canvas } from '@react-three/fiber'
import Utilities from "./r3f-gist/utility/Utilities";
import Boids from "./Boids";
import { Leva } from 'leva'
import Stage from "./Stage";


export default function App() {
    const props = {
        bounds: 32,
        size: 64
    }

    return <>
        <Leva collapsed />
        <Canvas
            shadows
            camera={{
                fov: 45,
                near: 0.1,
                far: 200,
                position: [4, 2, 6]
            }}
            gl={{ preserveDrawingBuffer: true }}
        >
            <color attach="background" args={["#000000"]} />

            <OrbitControls makeDefault />

            <Boids {...props} />

            <Stage {...props} />

            <Utilities />

        </Canvas>
    </>
}