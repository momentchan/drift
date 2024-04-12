import * as THREE from 'three'

export default class BoidsMeshRenderShader extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader: /* glsl */`

            uniform sampler2D positionTex;
            varying float vDistance;

            attribute vec3 uvs;


            void main() {
                vec3 pos = texture2D(positionTex, uvs.xy).xyz;

                // vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                // gl_Position = projectionMatrix * mvPosition;
                // vDistance = abs(mvPosition.z);

                // gl_PointSize = 10.0 * mix(0.2, 1.0, pow(smoothstep(80.0, 0.0, vDistance), 2.0));

                gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4( position + pos.xyz, 1.0 );
            }
            
            `,


            fragmentShader: /* glsl */ `
            varying float vDistance;

            void main() {
                // vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                // if(dot(cxy, cxy) > 1.0) discard;

                // vec3 color = vec3(1.0);

                // gl_FragColor = vec4(color, mix(0.0, 1.0, pow(smoothstep(50.0, 0.0, vDistance), 2.0)));


                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            }`,

            uniforms: {
                positionTex: { value: null }
            },
            transparent: { value: true }
        })
    }
}