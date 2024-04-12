import { OrbitControls } from "@react-three/drei";
import { Canvas } from '@react-three/fiber'
import Utilities from "./r3f-gist/utility/Utilities";
import Boids from "./Boids";
import { Leva } from 'leva'
import Stage from "./Stage";
import Effect from "./Effect";


export default function App() {
    const props = {
        bounds: 24,
        size: 32
    }

    return <>
        <Leva collapsed />
        <Canvas
            shadows
            camera={{
                fov: 45,
                near: 0.1,
                far: 200,
                position: [50, 2, 100]
            }}
            gl={{ preserveDrawingBuffer: true }}
        >
            <color attach="background" args={['#cccccc']} />

            <OrbitControls makeDefault />

            <Boids {...props} />

            <Stage {...props} />

            <Utilities />

            <Effect/>

        </Canvas>
    </>
}