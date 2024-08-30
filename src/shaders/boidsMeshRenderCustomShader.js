import * as THREE from 'three'
import utility from '../r3f-gist/shader/cginc/utility'
import snoise from '../r3f-gist/shader/cginc/noise/simplexNoise'

export default class BoidsMeshRenderCustomShader extends THREE.ShaderMaterial {
    constructor() {
        super({
            vertexShader: /* glsl */`
            uniform sampler2D positionTex;
            uniform sampler2D velocityTex;

            uniform float time;

            varying float debug;
            varying vec3 vColor;

            attribute vec3 uvs;

            ${utility}
            ${snoise}

            void main() {
                vec3 wpos = texture2D(positionTex, uvs.xy).xyz;
                vec3 vel = texture2D(velocityTex, uvs.xy).xyz;

                float n = simplexNoise2d(wpos.yz * 0.2);
                n += 1.0;
                n *= 0.5;

                debug = texture2D(velocityTex, uvs.xy).w;
                vec3 scale = vec3(1.0, 1.0, mix(1.0, 0.5, n)) * mix(1.0, 10.0, n) * 0.2 * mix(1.0, 3.0, debug);
                vec3 lpos = position * vec3(mix(1.0, 10.0, n), 0.5, mix(10.0, 1.0, n)) * 0.05 * mix(1.0, 3.0, debug);
                lpos = position * scale;
                // lpos.x += sin(lpos.z * 5.0 + time*2.0 + n) * mix(0.0, 0.2, mod((n * 0.23), 1.0));
                // lpos.z += sin(uv.x * 5.0 + time*2.0 + n) * mix(0.0, 0.05, mod((n * 0.23), 1.0));

                float rotX = -atan(vel.y / (length(vel)+1e-8));
                float rotY = atan(vel.x / vel.z);

                mat4 rotMat = eulerAnglesToRotationMatrix(vec3(rotX, rotY, 0));
                // mat4 rotMat = eulerAnglesToRotationMatrix(vec3(0.0, PI/2.0, -PI/4.0));

                vec3 newPos = (rotMat * vec4(lpos, 1.0)).xyz + wpos;

                float c = step(newPos.y, 0.0);
                // c = mix(0.0, 0.5, smoothstep(1.0, 5.0, length(vel)));
                c = 1.0;

                vColor = vec3(c);  
                // vColor = vec3(uv, 0.0);

                csm_PositionRaw =  projectionMatrix * modelViewMatrix * instanceMatrix * vec4(newPos, 1.0 );
            }`,


            fragmentShader: /* glsl */ `

            varying float debug;
            varying vec3 vColor;

            void main() {

                vec3 color = vColor;

                // csm_DiffuseColor = vec4(color, 1.0);
                // csm_DiffuseColor = vec4(0.2);
                csm_DiffuseColor = vec4(debug);
                // csm_Emissive = vec3(pow(debug, 3.0)*0.05);
            }`,

            uniforms: {
                positionTex: { value: null },
                velocityTex: { value: null },
                time: { value: 0 }
            },
            transparent: { value: true }
        })
    }
}