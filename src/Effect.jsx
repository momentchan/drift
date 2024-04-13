import { useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, N8AO, Noise, SMAA, TiltShift2, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction } from 'postprocessing'
import { folder, useControls } from 'leva'
import * as THREE from 'three'
import { useRef } from "react";

export default function Effect() {
    const gl = useThree((state) => state.gl)
    const scene = useThree((state) => state.scene)
    const camera = useThree((state) => state.camera)
    const size = useThree((state) => state.size)
    const composer = useRef()

    return <>
        <EffectComposer ref={composer} disableNormalPass multisampling={0}>
            <N8AO
                halfRes
                color='black'
                aoRadius={12}
                intensity={8}
                aoSamples={3}
                denoiseSamples={4} />
            {/* <Noise
                premultiply
                blendFunction={BlendFunction.SOFT_LIGHT} /> */}
            <Bloom
                luminanceThreshold={1}
                mipmapBlur
                intensity={0.2} />
            <ToneMapping />

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