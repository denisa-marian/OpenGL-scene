#version 410 core

in vec2 TexCoords;
in vec3 FragPos;
in vec3 Normal;

out vec4 FragColor;

uniform sampler2D diffuseTexture;
uniform vec3 viewPos;
uniform vec3 lightDir;
uniform float time;

uniform vec2 waveDir;
uniform float waveSpeed;
uniform float tile;

uniform vec3 spotLightPos;
uniform vec3 spotLightDir;
uniform vec3 spotLightColor;
uniform float spotInnerCut;
uniform float spotOuterCut;
uniform float spotIntensity;
uniform int enableFog;
uniform float fogDensity;
uniform vec3 fogColor;

uniform int enableIslandFog;
uniform float islandFogDensity;
uniform float islandFogHeight;
uniform float islandFogFalloff;
uniform vec2 islandCenterXZ;
uniform float islandFogRadius;
uniform vec3 islandFogColor;

float hash12(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise2d(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p)
{
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise2d(p);
        p *= 2.02;
        a *= 0.5;
    }
    return v;
}

void main()
{
    float t = time;

    vec2 dir = normalize(waveDir);
    vec2 uv = FragPos.xz * tile;

    vec2 flow1 = dir * (waveSpeed * t);
    vec2 flow2 = -dir * (waveSpeed * 0.75 * t);

    vec2 distort = 0.015 * vec2(
        sin(FragPos.x * 0.030 + t * 1.2) + sin(FragPos.z * 0.050 - t * 0.9),
        cos(FragPos.z * 0.040 + t * 1.0) + cos(FragPos.x * 0.060 + t * 0.7)
    );

    vec3 texA = texture(diffuseTexture, uv + flow1 + distort).rgb;
    vec3 texB = texture(diffuseTexture, uv + flow2 - distort).rgb;
    vec3 waterTex = mix(texA, texB, 0.5);

    waterTex = mix(waterTex, vec3(0.12, 0.22, 0.30), 0.12);

    float f1 = 0.055, f2 = 0.080, f3 = 0.030;
    float s1 = 1.30,  s2 = 1.10,  s3 = 0.90;

    float hx = FragPos.x;
    float hz = FragPos.z;

    float h =
        0.60 * sin(hx * f1 + t * s1) +
        0.55 * sin(hz * f2 - t * s2) +
        0.35 * sin((hx + hz) * f3 + t * s3);

    float dhdx =
        0.60 * f1 * cos(hx * f1 + t * s1) +
        0.35 * f3 * cos((hx + hz) * f3 + t * s3);

    float dhdz =
        0.55 * f2 * cos(hz * f2 - t * s2) +
        0.35 * f3 * cos((hx + hz) * f3 + t * s3);

    vec3 waveN = normalize(vec3(-dhdx * 2.2, 1.0, -dhdz * 2.2));
    vec3 N = normalize(mix(normalize(Normal), waveN, 0.75));

    vec3 V = normalize(viewPos - FragPos);
    vec3 L = normalize(-lightDir);

    float NdotL = max(dot(N, L), 0.0);

    vec3 ambient = 0.37 * waterTex;
    vec3 diffuse = 0.55 * NdotL * waterTex;
    vec3 color = ambient + diffuse;

    vec3 Ls = normalize(spotLightPos - FragPos);
    vec3 D  = normalize(spotLightDir);

    float theta = dot(normalize(FragPos - spotLightPos), D);
    float eps = max(spotInnerCut - spotOuterCut, 0.0001);
    float spotPower = clamp((theta - spotOuterCut) / eps, 0.0, 1.0);

    float distS = length(spotLightPos - FragPos);
    float atten = 1.0 / (1.0 + 0.006 * distS + 0.00015 * distS * distS);

    float diffS = max(dot(N, Ls), 0.0);
    vec3 spot = diffS * spotLightColor * spotPower * atten * spotIntensity;
    color += spot;

    float fogG = 0.0;
    if (enableFog == 1) {
        float dist = length(viewPos - FragPos);
        fogG = 1.0 - exp(-dist * fogDensity);
        fogG = clamp(fogG, 0.0, 1.0);
    }

    float fogI = 0.0;
    if (enableIslandFog == 1) {
        float dist = length(viewPos - FragPos);
        float fogDist = 1.0 - exp(-dist * islandFogDensity);

        float hAbove = max(FragPos.y - islandFogHeight, 0.0);
        float fogH = exp(-hAbove * islandFogFalloff);

        float r = length(FragPos.xz - islandCenterXZ);
        float fogR = 1.0 - smoothstep(islandFogRadius * 0.55, islandFogRadius, r);

        float n = fbm(FragPos.xz * 0.010 + vec2(t * 0.02, -t * 0.015));
        n = mix(0.65, 1.25, n);

        fogI = clamp(fogDist * fogH * fogR * n, 0.0, 1.0);
    }

    float fogF = 1.0 - (1.0 - fogG) * (1.0 - fogI);
    fogF = clamp(fogF, 0.0, 1.0);

    vec3 fogMix = fogColor;
    if (enableIslandFog == 1 && fogI > fogG) fogMix = islandFogColor;

    color = mix(color, fogMix, fogF);
    float alpha = mix(0.97, 1.0, fogF);

    FragColor = vec4(color, alpha);
}
