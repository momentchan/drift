import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, BrightnessContrast, DepthOfField, EffectComposer, GodRays, N8AO, Noise, SMAA, TiltShift2, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from 'postprocessing'
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
        density: 0.02,
        maxDensity: 5,
        edgeStrength: 0,
        edgeRadius: 2,
        distanceAttenuation: 5,
        color: new THREE.Color(0xffffff),
        raymarchSteps: 30,
        blur: true,
        gammaCorrection: false,
    }

    const props = useControls({
        'PostEffect': folder({
            bloomThreshold: { value: 0.3, min: 0, max: 5 },
            bloomSmoothing: { value: 0.15, min: 0, max: 1 },
            bloomIntensity: { value: 5, min: 0, max: 20 },

            brightness: { value: 0, min: 0, max: 5 },
            contrast: { value: 0, min: 0, max: 1 },
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
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC}/>
            <Bloom
                luminanceThreshold={props.bloomThreshold}
                luminanceSmoothing={props.bloomSmoothing}
                mipmapBlur
                intensity={props.bloomIntensity} />
            <BrightnessContrast brightness={props.brightness} contrast={props.contrast}/>

            <TiltShift2 blur={0.02} />
            <Noise
                opacity={0}
                premultiply
                blendFunction={BlendFunction.ALPHA} />
            <SMAA />
        </EffectComposer>
    </>
}