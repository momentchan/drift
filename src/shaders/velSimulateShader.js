import * as THREE from 'three'
import snoise from '../r3f-gist/shader/cginc/noise/simplexNoise'

export default class VelSimulateShaderMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            fragmentShader: /* glsl */ `

            ${snoise}

            uniform mat4 modelViewProjectionMatrix;
            uniform mat4 inverseModelViewProjectionMatrix;
            uniform float time;
            uniform float aspect;
            
            uniform float separationDistance;
            uniform float alignmentDistance;
            uniform float cohesionDistance;

            uniform float separationWeight;
            uniform float alignmentWeight;
            uniform float cohesionWeight;
            uniform float noiseWeight;
            uniform float touchWeight;

            uniform float noiseFrequency;
            uniform float noiseSpeed;

            uniform float touchRange;
            uniform vec2 touchPos;

            uniform float avoidWallWeight;

            uniform float freedomFactor;
            uniform float delta;
            uniform float radius;

			uniform float maxSpeed;
            uniform float maxForce;

            const float width = resolution.x;
            const float height = resolution.y;

            uniform vec3 lightPos;

            uniform float rayCount;
            uniform sampler2D rayTex;

            vec3 avoidWall(vec3 pos) {
                return length(pos) > radius ? -normalize(pos) : vec3(0.0);
            }

            // vec3 avoidWall(vec3 pos) {
            //     vec3 acc = vec3(0.0);

            //     // x 
            //     acc.x = (pos.x < -radius) ? acc.x + 1.0 : acc.x;
            //     acc.x = (pos.x >  radius) ? acc.x - 1.0 : acc.x;

            //     // y 
            //     acc.y = (pos.y < -radius) ? acc.y + 1.0 : acc.y;
            //     acc.y = (pos.y >  radius) ? acc.y - 1.0 : acc.y;

            //     // z 
            //     acc.z = (pos.z < -radius) ? acc.z + 1.0 : acc.z;
            //     acc.z = (pos.z >  radius) ? acc.z - 1.0 : acc.z;

            //     return acc;
            // }

            vec3 limit(vec3 vec, float value){
                float l = length(vec);
                return (l > value && l > 0.0) ? vec.xyz * (value / l) : vec;
            }

            vec3 pointToLineDistance(vec3 point, vec3 linePoint, vec3 lineDirection) {
                vec3 w = point - linePoint;
                vec3 v = normalize(lineDirection);
                float projectedLength = dot(w, v);
                vec3 projectedVector = v * projectedLength;
                vec3 distanceVector = w - projectedVector;
                return distanceVector;
            }

            
            void main() {

                vec2 uv = gl_FragCoord.xy / resolution.xy;

                vec3 pp = texture2D(positionTex, uv).xyz;
                vec3 pv = texture2D(velocityTex, uv).xyz;
                float debug = texture2D(velocityTex, uv).w;


                // force
                vec3 force = vec3(0.0);

                vec3 sepPosSum = vec3(0.0);
                float sepCount = 0.0;

                vec3 aliVelSum = vec3(0.0);
                float aliCount = 0.0;

                vec3 cohPosSum = vec3(0.0);
                float cohCount = 0.0;


                for(float y = 0.0; y < height; y++) {
                    for(float x = 0.0; x < width; x++) {
                        vec2 id = vec2(x + 0.5, y + 0.5) / resolution.xy;

                        vec3 np = texture2D(positionTex, id).xyz;
                        vec3 nv = texture2D(velocityTex, id).xyz;

                        vec3 diff = pp - np;
                        float dist = length(diff);

                        // separaion
                        if(dist > 0.0 && dist <= separationDistance)
                        {
                            vec3 repulse = normalize(pp - np);
                            repulse /= dist;
                            sepPosSum += repulse;
                            sepCount++;
                        }

                        // alignment
                        if(dist > 0.0 && dist <= alignmentDistance)
                        {
                            aliVelSum += nv;
                            aliCount++;
                        }

                        // cohesion
                        if(dist > 0.0 && dist <= cohesionDistance)
                        {
                            cohPosSum += np;
                            cohCount++;
                        }
                    }
                }


                vec3 sepSteer = vec3(0.0);
                if(sepCount > 0.0) {
                    sepSteer = sepPosSum / sepCount;
                    sepSteer = normalize(sepSteer) * maxSpeed;
                    sepSteer = sepSteer - pv;
                    sepSteer = limit(sepSteer, maxForce);
                }

                vec3 aliSteer = vec3(0.0);
                if(aliCount > 0.0) {
                    aliSteer = aliVelSum / aliCount;
                    aliSteer = normalize(aliSteer) * maxSpeed;
                    aliSteer = aliSteer - pv;
                    aliSteer = limit(aliSteer, maxForce);
                }

                vec3 cohSteer = vec3(0.0);
                if(cohCount > 0.0) {
                    cohPosSum = cohPosSum / cohCount;
                    cohSteer = cohPosSum - pp;
                    cohSteer = normalize(cohSteer) * maxSpeed;
                    cohSteer = cohSteer - pv;
                    cohSteer = limit(cohSteer, maxForce);
                }

                

                // interaction
                vec4 pp_clip = modelViewProjectionMatrix * vec4(pp.xyz, 1.0);
                vec2 pp_ndc = pp_clip.xy / pp_clip.w;
                float dist = length((pp_ndc - touchPos) * vec2(aspect, 1.0));
                float decay = smoothstep(touchRange, 0.0, dist);
                vec3 touchSteer = (inverseModelViewProjectionMatrix * vec4(pp_ndc * vec2(aspect, 1.0), 0.0, 0.0)).xyz;
                touchSteer *= smoothstep(touchRange, 0.0, dist);

                // center avoid
                vec3 orth = normalize(cross(pp, vec3(0.0,1.0,0.0)));
                orth *= dot(pv, orth) * 0.2;
                vec3 forward = normalize(pp);
                vec3 centerSter = smoothstep(3.0, 0.0, length(pp)) * (forward + orth);

                // ray avoid
                vec3 raySteer;
                for(float c = 0.0; c < rayCount; c++) {
                    vec4 ray = texture2D(rayTex, vec2((c+0.5)/rayCount, 0.5));

                    // distance to ray point
                    float d = length(ray.rgb - pp);

                    vec3 vec2Line = pointToLineDistance(pp, ray.rgb, lightPos);
                    vec3 vecOnLine = pp - ray.rgb - vec2Line;
                    float v = length(vecOnLine) * sign(dot(vecOnLine , lightPos));

                    // distance to ray light
                    float d2 = length(vec2Line);
                    float mask = step(0.0, v) * step(v, ray.w);

                    // curl
                    vec3 curl = normalize(cross(vec2Line, lightPos));
                    curl *= step(length(vec2Line), dist);

                    raySteer += - smoothstep(5.0, 0.0, d) * normalize(ray.rgb - pp);
                    raySteer += curl * 2.0* pow(smoothstep(5.0, 0.0, d2), 3.0)  * mask;
                    debug += 1.0 * pow(smoothstep(5.0, 0.0, d2), 2.0)  * mask;
                }

                force += sepSteer * separationWeight;
                force += aliSteer * alignmentWeight;
                force += cohSteer * cohesionWeight;
                force += avoidWall(pp) * avoidWallWeight;
                force += curlNoise(pp * noiseFrequency + noiseSpeed * time) * noiseWeight;
                force += (touchSteer + centerSter) * touchWeight;
                force += raySteer * 1000.0;

                vec3 vel = pv + force * delta;
                vel = limit(vel, maxSpeed * mix(1.0, 30.0, decay));
                vel = mix(pv, vel, 0.5); // smooth

                // debug = 1.0 - decay;
                // debug += 5.0 * smoothstep(0.2, 0.0, abs(length(pp)/radius - pow(mod(time * 0.4, 2.5), 0.5)));
                // debug = 1.0;

                debug -= delta * 1.0;
                // debug = mix(5.0, 0.5, smoothstep(0.0, 0.5, length(vec2Line) / radius)) * smoothstep(-2.0, 1.0, dist2Plane);
                debug = min(max(debug, 0.3), 3.0);


                gl_FragColor = vec4(vel, debug);
            }`,

            uniforms: {
                modelViewProjectionMatrix: { value: 0 },
                inverseModelViewProjectionMatrix: { value: 0 },

                rayTex: { value: 0 },
                rayCount: { value: 0 },

                time: { value: 0 },
                delta: { value: 0 },

                aspect: { value: 0 },

                separationDistance: { value: 1 },
                alignmentDistance: { value: 2 },
                cohesionDistance: { value: 2 },

                separationWeight: { value: 3 },
                alignmentWeight: { value: 1 },
                cohesionWeight: { value: 1 },
                avoidWallWeight: { value: 10 },
                touchWeight: { value: 10 },

                noiseWeight: { value: 0.2 },
                noiseFrequency: { value: 0.1 },
                noiseSpeed: { value: 0.1 },
                touchRange: { value: 0.1 },
                touchPos: { value: 0 },

                maxSpeed: { value: 5.0 },
                maxForce: { value: 0.5 },

                radius: { value: 0 },

                lightPos: { value: 0 }
            }
        })
    }
}