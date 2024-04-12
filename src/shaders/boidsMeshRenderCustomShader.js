import * as THREE from 'three'
import utility from '../r3f-gist/shader/cginc/utility'

export default class BoidsMeshRenderCustomShader extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader: /* glsl */`

            uniform sampler2D positionTex;
            uniform sampler2D velocityTex;
            varying float vDistance;

            attribute vec3 uvs;

            ${utility}

            void main() {
                vec3 pos = texture2D(positionTex, uvs.xy).xyz;
                vec3 vel = texture2D(velocityTex, uvs.xy).xyz;

                float rotY = atan(vel.x / vel.z);
                float rotX = -atan(vel.y / (length(vel)+1e-8));

                mat4 rotMat = eulerAnglesToRotationMatrix(vec3(rotX, rotY, 0));

                vec4 newPos = rotMat * vec4(position, 1.0);

                csm_PositionRaw =  projectionMatrix * modelViewMatrix * instanceMatrix * vec4( newPos.xyz + pos.xyz, 1.0 );
                // gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4( newPos.xyz + pos.xyz, 1.0 );
            }`,


            fragmentShader: /* glsl */ `
            varying float vDistance;

            void main() {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            }`,

            uniforms: {
                positionTex: { value: null },
                velocityTex: { value: null }
            },
            transparent: { value: true }
        })
    }
}