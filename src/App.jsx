import { OrbitControls } from "@react-three/drei";
import { Canvas } from '@react-three/fiber'
import Utilities from "./r3f-gist/utility/Utilities";
import Boids from "./Boids";
import { Leva, folder, useControls } from 'leva'
import Stage from "./Stage";
import Effect from "./Effect";

export default function App() {
    const { bgColor } = useControls({
        'Global': folder({
            bgColor: '#353535'
        })
    })

    const props = {
        radius: 12,
        length: 64
    }

    return <>
        <Leva collapsed />
        <Canvas
            shadows
            camera={{
                fov: 45,
                near: 0.1,
                far: 200,
                position: [50, 2, 20]
            }}
            gl={{ preserveDrawingBuffer: true }}

        >
            <fogExp2 attach="fog" args={[bgColor, 0.03]} />
            <color attach="background" args={[bgColor]} />


            <OrbitControls makeDefault />

            <Boids {...props} />

            <Stage {...props} />

            <Utilities />

            <Effect />

        </Canvas>
    </>
}