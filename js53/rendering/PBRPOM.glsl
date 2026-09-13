/*
 Voxel Survival PBR + POM reference shader (GLSL 1.00 style).
 Runtime materials are MeshStandardMaterial instances patched by
 PBRMaterialFactory.js so Three.js keeps its shadow/light implementation.
 This file documents the core POM/temporal-GI algorithm in standalone form.
*/

uniform sampler2D uAlbedo;
uniform sampler2D uNormal;
uniform sampler2D uRoughness;
uniform sampler2D uMetallic;
uniform sampler2D uHeight;
uniform sampler2D uEmission;
uniform sampler2D uGI;
uniform vec2 uViewport;
uniform float uPOMScale;
uniform float uPOMMinLayers;
uniform float uPOMMaxLayers;
uniform float uGIStrength;

varying vec2 vUv;
varying vec3 vViewPosition;
varying vec3 vNormal;

vec2 parallaxOcclusion(vec2 uv, vec3 viewTS){
    float vz=max(abs(viewTS.z),0.12);
    float layers=mix(uPOMMaxLayers,uPOMMinLayers,vz);
    float stepSize=1.0/layers;
    vec2 delta=viewTS.xy/viewTS.z*uPOMScale/layers;
    vec2 cur=uv;
    float layerDepth=0.0;
    float height=texture2D(uHeight,cur).r;

    // 32 is the hard upper bound; the runtime chooses 8..24 layers.
    for(int i=0;i<32;i++){
        if(float(i)>=layers || layerDepth>=height) break;
        cur-=delta;
        layerDepth+=stepSize;
        height=texture2D(uHeight,cur).r;
    }
    return clamp(cur,vec2(0.002),vec2(0.998));
}

void main(){
    vec2 uv=vUv;

    // Derivative-built tangent frame works for the axis-aligned voxel faces
    // without requiring a tangent attribute in every chunk vertex.
    vec3 dp1=dFdx(-vViewPosition), dp2=dFdy(-vViewPosition);
    vec2 duv1=dFdx(uv), duv2=dFdy(uv);
    vec3 T=normalize(dp1*duv2.y-dp2*duv1.y);
    vec3 B=normalize(-dp1*duv2.x+dp2*duv1.x);
    vec3 N=normalize(cross(T,B));
    vec3 V=normalize(-vViewPosition);
    vec3 viewTS=normalize(vec3(dot(T,V),dot(B,V),dot(N,V)));

    uv=parallaxOcclusion(uv,viewTS);

    vec4 albedo=texture2D(uAlbedo,uv);
    vec3 normalTS=texture2D(uNormal,uv).xyz*2.0-1.0;
    vec3 normalWS=normalize(T*normalTS.x+B*normalTS.y+N*normalTS.z);
    float roughness=texture2D(uRoughness,uv).r;
    float metallic=texture2D(uMetallic,uv).r;
    vec3 emission=texture2D(uEmission,uv).rgb;

    // Temporal screen-space bounce.  The GI controller feeds a previous-frame
    // low-frequency radiance buffer; this avoids read/write feedback.
    vec2 screenUv=gl_FragCoord.xy/max(uViewport,vec2(1.0));
    vec3 indirect=texture2D(uGI,screenUv).rgb*uGIStrength;

    gl_FragColor=vec4(albedo.rgb + indirect + emission,albedo.a);
}
