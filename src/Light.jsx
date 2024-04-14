import { Environment, useHelper } from "@react-three/drei"
import { forwardRef, useImperativeHandle, useRef } from "react"
import * as THREE from 'three'

const lightPos = [25, 100, 0]

export default forwardRef(function Light(props, ref) {

    const diretionalLight = useRef()
    useHelper(diretionalLight, THREE.DirectionalLightHelper, 1)

    useImperativeHandle(ref, () => ({
        getDirectionalLight() {
            return diretionalLight.current
        }
    }))

    return (
        <>
            <ambientLight intensity={0.05} />

            <directionalLight
                ref={diretionalLight}
                intensity={2} position={lightPos}
                castShadow
                shadow-mapSize={[512, 512]}
                shadow-camera-top={props.radius * 1.5}
                shadow-camera-right={props.radius * 1.5}
                shadow-camera-bottom={- props.radius * 1.5}
                shadow-camera-left={- props.radius * 1.5}
            />

            <Environment preset="city" />

            {/* <Environment resolution={256}>
                <group rotation={[-Math.PI / 2, 0, 0]}>
                    <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                    {[2, 0, 2, 0, 2, 0, 2, 0].map((x, i) => (
                        <Lightformer key={i} form="circle" intensity={4} rotation={[Math.PI / 2, 0, 0]} position={[x, 4, i * 4]} scale={[4, 1, 1]} />
                    ))}
                    <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
                    <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[50, 2, 1]} />
                    <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[50, 2, 1]} />
                </group>
            </Environment> */}
        </>
    )
})