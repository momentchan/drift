import { OrbitControls } from "@react-three/drei";
import { Canvas } from '@react-three/fiber'
import Utilities from "./r3f-gist/utility/Utilities";
import Boids from "./Boids";
import { Leva } from 'leva'
import Stage from "./Stage";
import Effect from "./Effect";


export default function App() {
    const props = {
        radius: 12,
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
                position: [50, 2, 50]
            }}
            gl={{ preserveDrawingBuffer: true }}

        >
            <fogExp2 attach="fog" args={['#353535', 0.025]} />
            <color attach="background" args={['#353535']} />


            <OrbitControls makeDefault />

            <Boids {...props} />

            <Stage {...props} />

            <Utilities />

            <Effect />

        </Canvas>
    </>
}