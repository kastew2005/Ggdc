# Mobile input, swimming and inventory stack architecture

## Engine
HTML5 + JavaScript modules + Three.js. The game runs directly in a mobile browser/PWA and keeps the voxel world independent from UI input.

## 1. InputTouchFilter
`js53/input/InputTouchFilter.js`

Responsibilities:
- namespaced pointer sessions for `camera`, `world`, `inventory`, and `container`;
- 14 px drag threshold on the game build;
- any movement above the threshold converts Tap -> Drag and blocks the interaction;
- 260 ms interaction cooldown after a drag/cancel;
- no synthetic click from a camera swipe can open a block UI.

World touch flow:
1. `pointerdown` starts a session and waits 120 ms before starting block mining.
2. `pointermove` above 14 px cancels mining and marks the gesture as camera drag.
3. `pointerup` performs a place/tap action only if the gesture stayed inside the deadzone and cooldown has expired.

This prevents a camera swipe from opening chests, furnaces or crafting tables.

## 2. WaterPhysicsController
`js53/world/WaterPhysicsController.js`

State is sampled at feet/chest/head:
- `inWater` — any water contact;
- `submerged` — head in water;
- `waterChest` — torso in water.

Movement:
- water drag damps vertical velocity;
- gravity is reduced in water;
- jump held in water adds buoyancy;
- near the surface, a spring-like buoyancy target prevents sinking;
- oxygen drains only while the head is submerged;
- oxygen damage is applied every second after the air meter reaches zero;
- water flow remains a bounded voxel simulation.

Sprint swimming:
- two forward presses within 320 ms activate `swimSprinting`;
- sprint swimming uses 4.8 blocks/s horizontal speed;
- collision height is reduced from 1.78 to 0.62 blocks while sprint swimming;
- camera height/bob changes while submerged;
- small bubble effects are emitted while sprint swimming.

## 3. PixelMaterialFactory64
`js53/rendering/PixelMaterialFactory64.js`

All procedural world materials are generated at **64x64** and use:
- `NearestFilter` for crisp pixels;
- no mipmaps;
- `SRGBColorSpace`;
- deterministic seed per texture name;
- hard pixel clusters instead of smooth gradients.

Special rules exist for grass top/side, wood grain/end grain, cobblestone seams, brick mortar, ore pixels, leaves and glass.

Reference PNGs are also included in `assets/textures64/blocks`.

## 4. MobTextureFactory
`js53/entities/MobTextureFactory.js`

Original 64x64 runtime textures are generated for:
- cow;
- sheep;
- chicken;
- pig;
- villager.

Each mob part receives a texture material and a BoxGeometry UV set. Side/top/front variants are generated separately so the model is not a single flat color.

Reference PNGs are included in `assets/textures64/mobs`.

## 5. InventoryStackHandler
`js53/inventory/InventoryStackHandler.js`

Core operations:
- whole stack pickup;
- half stack pickup;
- exact amount placement;
- swap;
- shift transfer between inventory/hotbar;
- transfer between container arrays;
- double-tap quick transfer on mobile.

Charge pickup formula:
```text
p = clamp((holdTime - 280ms) / 900ms, 0, 1)
amount = ceil(stackCount * p)
amount = clamp(amount, 1, stackCount)
```

Example for a stack of 64:
- 280 ms -> 1 item;
- ~730 ms -> about 33 items;
- 1180 ms -> 64 items.

The UI shows a progress strip inside the slot while the finger is held.

## Compatibility
`WaterPhysics.js` re-exports `WaterPhysicsController` as `WaterPhysics`, so older integrations continue to work.
