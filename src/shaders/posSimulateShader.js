import * as THREE from 'three'


export default class PosSimulateShaderMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            fragmentShader: /* glsl */ `
            uniform float delta;

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;

                vec3 pos = texture2D(positionTex, uv).xyz;
                vec3 vel = texture2D(velocityTex, uv).xyz;
                vec3 newPos = pos + vel * delta * 0.05;

                gl_FragColor = vec4(newPos.xyz, 1.0);
            }`,

            uniforms: {
                time: { value: 0 },
                delta: { value: 0 }
            }
        })
    }
}