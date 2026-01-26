#version 410 core
in vec3 WorldPos;
out vec4 FragColor;

uniform vec3 viewPos;

uniform vec3 beamPos;
uniform vec3 beamDir;
uniform vec3 beamColor;

uniform float beamLength;
uniform float beamR0;
uniform float beamR1;
uniform float beamStrength;

float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

void main()
{
    vec3 d = normalize(beamDir);

    float t = dot(WorldPos - beamPos, d);
    if (t < 0.0 || t > beamLength) discard;

    vec3 closest = beamPos + d * t;
    float r = length(WorldPos - closest);

    float k = clamp(t / beamLength, 0.0, 1.0);
    float radius = mix(beamR0, beamR1, k);

    float edge = 1.0 - smoothstep(radius * 0.70, radius, r);
    float fadeLen = exp(-k * 1.6);

    vec3 V = normalize(viewPos - WorldPos);
    float forward = max(dot(V, -d), 0.0);
    float scatter = 0.25 + 0.75 * pow(forward, 1.6);

    float n = hash13(WorldPos * 0.08);
    float noise = mix(0.85, 1.0, n);

    float alpha = edge * fadeLen * scatter * noise * beamStrength;
    float distCam = length(viewPos - WorldPos);
    float fog = exp(-distCam * 0.0025);   
    fog = clamp(fog, 0.0, 1.0);
    alpha *= fog;
   

    if (alpha < 0.01) discard;

    FragColor = vec4(beamColor, alpha);
}
