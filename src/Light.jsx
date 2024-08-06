import { Environment, useHelper } from "@react-three/drei"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

export default forwardRef(function Light(props, ref) {

    const diretionalLight = useRef()
    // useHelper(diretionalLight, THREE.DirectionalLightHelper, 1)

    useImperativeHandle(ref, () => ({
        getDirectionalLight() {
            return diretionalLight.current
        }
    }))

    useEffect(() => {
        // console.log(diretionalLight.current);
    }, [])

    return (
        <>
            <ambientLight intensity={0.05} />

            <directionalLight
                ref={diretionalLight}
                intensity={2}
                position={props.lightPos}
                castShadow
                shadow-mapSize={[4096, 4096]}
                shadow-camera-top={props.radius * 1.5}
                shadow-camera-right={props.radius * 1.5}
                shadow-camera-bottom={- props.radius * 1.5}
                shadow-camera-left={- props.radius * 1.5}
            />

            <Environment preset="city" />
        </>
    )
})