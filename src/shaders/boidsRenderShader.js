import * as THREE from 'three'

export default class BoidsRenderShader extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader: /* glsl */`

            uniform sampler2D positionTex;

            void main() {
                vec3 pos = texture2D(positionTex, position.xy).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1.0);
                gl_PointSize = 5.0;
            }`,


            fragmentShader: /* glsl */ `

            void main() {
                gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
            }`,

            uniforms: {
                positionTex: { value: null }
            }
        })
    }
}