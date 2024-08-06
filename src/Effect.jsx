import { useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, HueSaturation, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from 'postprocessing'
import { folder, useControls } from 'leva'
import * as THREE from 'three'
import { useEffect, useRef } from "react";
import { GodraysPass } from 'three-good-godrays';

export default function Effect({ light }) {
    const gl = useThree((state) => state.gl)
    const scene = useThree((state) => state.scene)
    const camera = useThree((state) => state.camera)
    const size = useThree((state) => state.size)
    const composer = useRef()

    const config = {
        density: 0.001,
        maxDensity: 0.5,
        edgeStrength: 2,
        edgeRadius: 2,
        distanceAttenuation: 2,
        color: new THREE.Color(0xffffff),
        raymarchSteps: 30,
        blur: true,
        gammaCorrection: true,
    }

    const props = useControls({
        'PostEffect': folder({
            bloomThreshold: { value: 0.3, min: 0, max: 5 },
            bloomSmoothing: { value: 0.15, min: 0, max: 1 },
            bloomIntensity: { value: 1, min: 0, max: 20 },

            focusDistance: { value: 0, min: 0, max: 50 },
            focusLength: { value: 0, min: 0, max: 50 },
        }),
    })

    useEffect(() => {
        const godray = new GodraysPass(light.current.getDirectionalLight(), camera, config)
        composer.current.addPass(godray)
        return () => {
            composer.current.removePass(godray)
        }
    }, [])

    return <>
        <EffectComposer ref={composer}>
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            <HueSaturation saturation={0.4} />
            <Bloom
                luminanceThreshold={props.bloomThreshold}
                luminanceSmoothing={props.bloomSmoothing}
                mipmapBlur
                intensity={props.bloomIntensity} />
            {/* <DepthOfField focusDistance={props.focusDistance} focalLength={props.focusLength} /> */}
        </EffectComposer>
    </>
}