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

    const params = useControls({
        'Godray': folder({
            density: { value: 0.01, min: 0, max: 10 },
            maxDensity: { value: 10, min: 0, max: 100 },
            edgeStrength: { value: 0, min: 0, max: 10 },
            edgeRadius: { value: 10, min: 0, max: 20 },
            distanceAttenuation: { value: 5, min: 0, max: 10 },
            color: new THREE.Color(0xffffff),
            raymarchSteps: { value: 60, min: 0, max: 100 },
            blur: false,
            gammaCorrection: false,
        }),
    })

    useEffect(() => {
        const godray =  new GodraysPass(light.current.getDirectionalLight(), camera, params)
        composer.current.addPass(godray)
    }, [light])

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