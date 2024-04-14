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
        density: 0.01,
        maxDensity: 10,
        edgeStrength: 0,
        edgeRadius: 10,
        distanceAttenuation: 5,
        color: new THREE.Color(0xffffff),
        raymarchSteps: 60,
        blur: false,
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
            {/* <N8AO
                halfRes
                color='black'
                aoRadius={12}
                intensity={8}
                aoSamples={3}
                denoiseSamples={4} /> */}
            {/* <Noise
                opacity={0.5}
                premultiply
                blendFunction={BlendFunction.SOFT_LIGHT} /> */}
            <Bloom
                luminanceThreshold={0.1}
                mipmapBlur
                intensity={2} />
            <ToneMapping />
            {/* <Vignette eskil={false} offset={0.1} darkness={1.1} /> */}

            {/* <DepthOfField
                focusDistance={10}
                focalLength={20}
                bokehScale={6}  // blur radius
            /> */}
            <SMAA />
            {/* <TiltShift2 blur={0.1}/> */}
        </EffectComposer>
    </>
}