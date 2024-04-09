import { OrbitControls } from "@react-three/drei";
import { Canvas } from '@react-three/fiber'
import Utilities from "./r3f-gist/utility/Utilities";

export default function App() {
    return <>
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

            <OrbitControls makeDefault />

            <mesh>
                <torusGeometry />
                <meshStandardMaterial />
            </mesh>

            <Utilities />

        </Canvas>
    </>
}