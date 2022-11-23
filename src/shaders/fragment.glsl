precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform float uDistortMap;
uniform float uDistortUV;
uniform vec2 uMouse;

uniform sampler2D uImageData;
uniform sampler2D uDepthMap;
 
vec4 gaussianBlur(sampler2D image, vec2 uv ){
    vec2 dir = vec2(1., 0.);
    float level = 0.25;

    //one-pass-blur
    vec4 result = vec4(0.0);
    result += texture2D(image, uv + vec2(-0.028, -0.028) * dir * level) * 0.0044299121055113265;
    result += texture2D(image, uv + vec2(-0.024, -0.024) * dir * level) * 0.00895781211794;
    result += texture2D(image, uv + vec2(-0.020, -0.020) * dir * level) * 0.0215963866053;
    result += texture2D(image, uv + vec2(-0.016, -0.016) * dir * level) * 0.0443683338718;
    result += texture2D(image, uv + vec2(-0.012, -0.012) * dir * level) * 0.0776744219933;
    result += texture2D(image, uv + vec2(-0.008, -0.008) * dir * level) * 0.115876621105;
    result += texture2D(image, uv + vec2(-0.004, -0.004) * dir * level) * 0.147308056121;
    result += texture2D(image, uv )*0.159576912161;
    result += texture2D(image, uv + vec2( 0.004,  0.004) * dir * level) * 0.147308056121;
    result += texture2D(image, uv + vec2( 0.008,  0.008) * dir * level) * 0.115876621105;
    result += texture2D(image, uv + vec2( 0.012,  0.012) * dir * level) * 0.0776744219933;
    result += texture2D(image, uv + vec2( 0.016,  0.016) * dir * level) * 0.0443683338718;
    result += texture2D(image, uv + vec2( 0.020,  0.020) * dir * level) * 0.0215963866053;
    result += texture2D(image, uv + vec2( 0.024,  0.024) * dir * level) * 0.00895781211794;
    result += texture2D(image, uv + vec2( 0.028,  0.028) * dir * level) * 0.0044299121055113265;

    return result;
}

void main() {
   vec4 depthMap = texture2D(uDepthMap, vUv);
   float blurEffect = depthMap.b * 0.32;
   float parallax = 0.5 - (depthMap.r + depthMap.g + depthMap.b) / 3.;

   vec2 distortion = vec2(sin(uTime + vUv.y * uDistortUV), 0) * uDistortMap  * blurEffect;
   vec2 parallaxUV = uMouse * parallax;
      
   vec2 newUV = vUv + distortion + parallaxUV;
   vec4 original = texture2D(uImageData, newUV);
   vec4 blurred = gaussianBlur(uImageData, newUV);
   gl_FragColor = mix(original, blurred, length(distortion) / uDistortMap);
}
