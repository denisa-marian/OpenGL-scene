#version 410 core

in vec3 TexCoords;
out vec4 FragColor;

uniform samplerCube skybox;

float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main()
{
    vec3 dir = normalize(TexCoords);
    vec3 sky = texture(skybox, dir).rgb;
    vec3 fogCol = vec3(0.85, 0.80, 0.70);

    float horizon = 1.0 - clamp(abs(dir.y), 0.0, 1.0);
    float haze = 1.0 - exp(-horizon * 4.0);

    float hazeAmount = 0.75; // 0.4..0.9
    vec3 color = mix(sky, fogCol, haze * hazeAmount);

    float exposure = 1.15;
    color = vec3(1.0) - exp(-color * exposure);

    float lum = luminance(color);
    color *= 1.0 / (1.0 + 1.2 * max(lum - 0.75, 0.0));

    FragColor = vec4(color, 1.0);
}
