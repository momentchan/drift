import * as THREE from 'three'

export default class BoidsPointRenderShader extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader: /* glsl */`

            uniform sampler2D positionTex;
            varying float vDistance;

            attribute vec3 uvs;


            void main() {
                vec3 pos = texture2D(positionTex, uvs.xy).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1.0);

                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                vDistance = abs(mvPosition.z);

                gl_PointSize = 10.0 * mix(0.2, 1.0, pow(smoothstep(80.0, 0.0, vDistance), 2.0));
            }`,


            fragmentShader: /* glsl */ `
            varying float vDistance;

            void main() {
                vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                if(dot(cxy, cxy) > 1.0) discard;

                vec3 color = vec3(1.0);
                // vec3 color = vec3(smoothstep(50.0, 0.0, vDistance));

                gl_FragColor = vec4(color, mix(0.0, 1.0, pow(smoothstep(50.0, 0.0, vDistance), 2.0)));
            }`,

            uniforms: {
                positionTex: { value: null }
            },
            transparent: { value: true }
        })
    }
}