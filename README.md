# Voxel Survival — Universe 73

Cross-platform performance/control fix. Touch camera uses pointer capture on the Three.js canvas, joystick and camera are independent, mobile rendering is lighter, and old launch keys remain compatible.


## Universe 74 performance/HUD fix
- Restored the gameplay HUD markup (health, hunger, clock, stamina, XP, hotbar, target, pause, mode badge).
- Mobile chunk meshing is throttled and moved after the gameplay render so input/movement gets priority.
- Mobile world generation/rendering is capped to reduce frame spikes.
- Chunk meshes use frustum culling and disabled shadow casting/receiving.
- Hardened saved quality-tier parsing.


## Книга рецептов

Добавлена Minecraft-подобная книга рецептов с двумя контекстами: личный крафт 2×2 и верстак 3×3.
- `js53/inventory/RecipeManager.js` — единый реестр shaped/shapeless рецептов.
- `js53/inventory/CraftingManager.js` — сопоставление матриц, автозаполнение, обычный и быстрый крафт.
- `js53/inventory/RecipeBookUI.js` — выдвижная книга, фильтры и touch/мышь.
- `js53/inventory/CraftingTableUI.js` — контекст верстака и возврат незабранных ингредиентов.

В инвентаре книга показывает только рецепты, помещающиеся в 2×2. У верстака доступны и 2×2, и 3×3 рецепты.

## v76.6 — Mobs / caves / oceans / villages
- Chunk-based passive mob spawning with distance/light/grass checks and mob caps.
- Cod and salmon with simple flocking swim AI and raw-fish drops.
- 3D noise caves and clustered coal/iron/gold/diamond veins.
- Ocean + beach biomes, rivers/lakes and underwater seagrass/kelp.
- Deterministic procedural villages on flat plains/desert with houses, paths, farms, chests and villagers.


## Audio
The game now includes a mobile-safe Web Audio AudioManager with Master/Music/SFX/Ambient/Entities channels, pooled 3D PannerNodes, material-based footsteps/block sounds, player state sounds, mob idle/hurt/death sounds, underwater low-pass filtering and persistent audio sliders. See `AUDIO_SYSTEM.md`.

## 64x64 PBR / POM / Hybrid GI

The graphics pipeline now uses `PBRMaterialFactory` for block materials, a 64x64 PBR texture stack, derivative-based Parallax Occlusion Mapping, and `GIRendererController` for temporal screen-space indirect light. `VolumetricLightingManager` controls exposure/fog/GI presets.

Quality presets: **Mobile**, **Medium**, **High**, **Ultra**. Ultra is RT-preferred but uses a WebGL temporal fallback because the project renderer is Three.js WebGL; it does not pretend that iOS WebGL provides DXR hardware ray tracing.
