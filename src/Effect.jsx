import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, GodRays, N8AO, Noise, SMAA, TiltShift2, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from 'postprocessing'
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
    const godray = useRef()

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

    useEffect(() => {
        godray.current = new GodraysPass(light.current.getDirectionalLight(), camera, config)
        composer.current.addPass(godray.current)
        return () => {
            composer.current.removePass(godray.current)
        }
    }, [])

    return <>
        <EffectComposer ref={composer} disableNormalPass multisampling={0}>
            <Bloom
                luminanceThreshold={0.3}
                luminanceSmoothing={0.5}
                mipmapBlur
                intensity={10} />
            <ToneMapping />
            <TiltShift2 blur={0.02} />
            <Noise
                opacity={0.1}
                premultiply
                blendFunction={BlendFunction.ALPHA} />
            <SMAA />
        </EffectComposer>
    </>
}