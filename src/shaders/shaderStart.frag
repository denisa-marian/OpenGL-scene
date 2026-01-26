#version 410 core

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;

out vec4 FragColor;

uniform sampler2D diffuseTexture;
uniform bool hasTexture;
uniform vec3 matDiffuse;

uniform vec3 dirLightDir;
uniform vec3 dirLightColor;
uniform vec3 viewPos;

uniform int enableFog;
uniform float fogDensity;
uniform vec3 fogColor;

uniform vec3 spotLightPos;
uniform vec3 spotLightDir;
uniform vec3 spotLightColor;
uniform float spotInnerCut;
uniform float spotOuterCut;
uniform float spotIntensity;

uniform int enableIslandFog;
uniform float islandFogDensity;
uniform float islandFogHeight;
uniform float islandFogFalloff;
uniform vec2 islandCenterXZ;
uniform float islandFogRadius;
uniform vec3 islandFogColor;

uniform float time;

float hash12(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p)
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
    float f = 0.0;
    float a = 0.55;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

    for(int i=0;i<4;i++){
        f += a * vnoise(p);
        p = m * p;
        a *= 0.5;
    }
    return f; 
}

float expFog(float dist, float density)
{
    return clamp(1.0 - exp(-dist * density), 0.0, 1.0);
}

void main()
{
    vec3 texColor = hasTexture ? texture(diffuseTexture, TexCoords).rgb : vec3(1.0);
    vec3 kdSafe   = max(matDiffuse, vec3(0.15));
    vec3 baseColor = hasTexture ? (texColor * kdSafe) : matDiffuse;

    vec3 N = normalize(Normal);
    vec3 V = normalize(viewPos - FragPos);
    vec3 L = normalize(-dirLightDir);

    vec3 ambient = 0.30 * baseColor;
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = diff * dirLightColor * baseColor;

    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(V, R), 0.0), 32.0);
    vec3 specular = spec * dirLightColor * 0.20;

    vec3 color = ambient + diffuse + specular;

    vec3 Ls = normalize(spotLightPos - FragPos);
    vec3 D  = normalize(spotLightDir);

    float theta = dot(normalize(FragPos - spotLightPos), D);
    float eps = max(spotInnerCut - spotOuterCut, 0.0001);
    float spotPower = clamp((theta - spotOuterCut) / eps, 0.0, 1.0);

    float distS = length(spotLightPos - FragPos);
    float attenuation = 1.0 / (1.0 + 0.006 * distS + 0.00015 * distS * distS);

    float diffS = max(dot(N, Ls), 0.0);
    vec3 Hs = normalize(Ls + V);
    float specS = pow(max(dot(N, Hs), 0.0), 96.0);

    vec3 spotTerm = (diffS * baseColor * 0.85 + specS * 1.4) * spotLightColor
                  * spotPower * attenuation * spotIntensity;
    color += spotTerm;

    float dist = length(viewPos - FragPos);

    float fogGlobal = 0.0;
    if (enableFog == 1)
        fogGlobal = expFog(dist, fogDensity);

    float fogIsland = 0.0;
    if (enableIslandFog == 1)
    {
        float fogDist = expFog(dist, islandFogDensity);

       
        float h = max(FragPos.y - islandFogHeight, 0.0);
        float fogH = exp(-h * islandFogFalloff);

      
        float r = length(FragPos.xz - islandCenterXZ);
        float fogR = 1.0 - smoothstep(islandFogRadius * 0.55, islandFogRadius, r);

     
        vec2 p = FragPos.xz * 0.012;
        p += vec2(time * 0.06, -time * 0.04);
        float n = fbm(p);                 
        n = smoothstep(0.30, 0.95, n);     
        n = mix(0.55, 1.25, n);

  
        float nH = fbm(FragPos.xz * 0.006 + vec2(0.0, time * 0.03));
        float verticalWisp = mix(0.85, 1.15, nH);

        fogIsland = clamp(fogDist * fogH * fogR * n * verticalWisp, 0.0, 1.0);
    }

    float fogF = 1.0 - (1.0 - fogGlobal) * (1.0 - fogIsland);
    fogF = clamp(fogF, 0.0, 1.0);


    vec3 mixFogColor = fogColor;
    if (enableIslandFog == 1 && fogIsland > fogGlobal)
        mixFogColor = islandFogColor;

    color = mix(color, mixFogColor, fogF);

    FragColor = vec4(color, 1.0);
}
