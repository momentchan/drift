import * as THREE from 'three'


export default class VelSimulateShaderMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            fragmentShader: /* glsl */ `

            uniform float separationDistance;
            uniform float alignmentDistance;
            uniform float cohesionDistance;

            uniform float separationWeight;
            uniform float alignmentWeight;
            uniform float cohesionWeight;

            uniform float avoidWallWeight;

            uniform float freedomFactor;
            uniform float delta;
            uniform float bounds;

			uniform float maxSpeed;
            uniform float maxForce;

            const float width = resolution.x;
            const float height = resolution.y;

            vec3 avoidWall(vec3 pos) {
                vec3 acc = vec3(0.0);

                // x 
                acc.x = (pos.x < -bounds * 0.5) ? acc.x + 1.0 : acc.x;
                acc.x = (pos.x >  bounds * 0.5) ? acc.x - 1.0 : acc.x;

                // y 
                acc.y = (pos.y < -bounds * 0.5) ? acc.y + 1.0 : acc.y;
                acc.y = (pos.y >  bounds * 0.5) ? acc.y - 1.0 : acc.y;

                // z 
                acc.z = (pos.z < -bounds * 0.5) ? acc.z + 1.0 : acc.z;
                acc.z = (pos.z >  bounds * 0.5) ? acc.z - 1.0 : acc.z;

                return acc;
            }

            vec3 limit(vec3 vec, float value){
                float l = length(vec);
                return (l > value && l > 0.0) ? vec.xyz * (value / l) : vec;
            }

            
            void main() {

                vec2 uv = gl_FragCoord.xy / resolution.xy;

                vec3 pp = texture2D(positionTex, uv).xyz;
                vec3 pv = texture2D(velocityTex, uv).xyz;


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

                force += sepSteer * separationWeight;
                force += aliSteer * alignmentWeight;
                force += cohSteer * cohesionWeight;
                force += avoidWall(pp) * avoidWallWeight;

                vec3 vel = pv + force * delta;
                vel = limit(vel, maxSpeed);

                gl_FragColor = vec4(vel, 1.0);
            }`,

            uniforms: {
                time: { value: 0 },
                delta: { value: 0 },

                separationDistance: { value: 1 },
                alignmentDistance: { value: 2 },
                cohesionDistance: { value: 2 },

                separationWeight: { value: 3 },
                alignmentWeight: { value: 1 },
                cohesionWeight: { value: 1 },
                avoidWallWeight: { value: 10 },

                maxSpeed: { value: 5.0 },
                maxForce: { value: 0.5 },

                bounds: { value: 0 },
            }
        })
    }
}