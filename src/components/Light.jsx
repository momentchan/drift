import { Environment, useHelper } from "@react-three/drei"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import GlobalState from "./GlobalState"

export default forwardRef(function Light(props, ref) {

    const diretionalLight = useRef()
    const { isMobile } = GlobalState()
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
                shadow-mapSize={isMobile ? [4096, 4096] : [8192, 8192]}
                shadow-camera-top={props.radius * 1.2}
                shadow-camera-right={props.radius * 1.2}
                shadow-camera-bottom={- props.radius * 1.2}
                shadow-camera-left={- props.radius * 1.2}
                shadow-bias={-0.001}
            />

            <Environment preset="city" />
        </>
    )
})