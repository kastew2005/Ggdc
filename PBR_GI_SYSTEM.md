# Voxel Survival — 64x64 PBR + POM + Hybrid GI

## Backend
The game is HTML5/JavaScript + Three.js r159 + WebGL. The implementation uses `MeshStandardMaterial` and `onBeforeCompile`, so Three's directional lights, point lights, fog, transparency and shadows remain intact.

### Five-map stack per block
`PBRMaterialFactory.js` builds a 64x64 stack at runtime:

- Albedo — existing voxel color texture, nearest/mipmap filtering.
- Normal — derived from luminance gradients of the albedo.
- Roughness — material profile, 0..1.
- Metallic — material profile, 0..1.
- Height — luminance converted to 0..1 for POM.
- Emission — black for ordinary blocks; warm emission for glowstone/lantern/campfire.

This is deliberately self-contained: no external texture downloads are required on GitHub Pages/iOS.

## POM
`PBRMaterialFactory` injects a derivative-built tangent frame into the Three.js fragment shader. The height map is ray-marched for 5..24 layers depending on quality. UVs are clamped to 0.002..0.998 to reduce atlas edge bleeding.

- Mobile/low: POM off.
- Medium: small POM budget.
- High: 8..24 layers.
- Ultra: high POM + hybrid GI.

## GI modes
`GIRendererController.js` is the backend abstraction:

- Mobile: base PBR only.
- Medium: low-frequency probe-like temporal bounce.
- High: temporal SSGI approximation + POM.
- Ultra: RT-preferred mode with a WebGL temporal fallback.

### Hardware RT limitation
The project currently uses WebGLRenderer. WebGL on iOS/normal browsers cannot expose DXR hardware ray tracing. Therefore Ultra does **not** falsely claim DXR: it selects `rt-fallback`, which uses the same material GI interface and a temporal screen-space bounce. A future WebGPU/native RT backend can replace `GIRendererController` without changing block materials.

## Color bleeding
The GI buffer is generated from the previous/current scene color at low frequency. This creates soft color transfer instead of a sharp fake direct light. Existing emissive blocks also remain real Three.js point-light sources through `Lighting.js`.

## Volumetric lighting
`VolumetricLightingManager.js` adjusts fog density, exposure and GI strength based on quality and day/cave state. It is intentionally lightweight for mobile browsers.

## Inspector-equivalent checklist
1. Use sRGB only for Albedo/Emission color textures.
2. Keep Normal/Roughness/Metallic/Height linear.
3. Use nearest filtering for the base voxel texture and mipmaps for PBR derivatives.
4. Keep alphaTest >= 0.5 on leaves/plants.
5. Keep emissive blocks paired with a point light from `Lighting.scan()`.
6. High/Ultra: use the largest shadow map the device can sustain.
7. Do not enable POM on transparent water/glass if it produces edge artifacts.
8. For a native RT/WebGPU port, implement the backend behind `GIRendererController.setRayTracingPreferred(true)`.

## Main integration
`Game` owns `gi` and `volumetric`. Each frame:

1. update player/world/lights;
2. `volumetric.update(...)`;
3. `gi.render()` renders into an offscreen target and exposes the previous GI texture to block materials;
4. the final target is presented to the screen.

The render targets are swapped every frame, preventing a texture from being sampled while it is being written.
