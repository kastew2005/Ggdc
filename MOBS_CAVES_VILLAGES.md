# Mobs, caves, oceans and villages

## New modules
- `js53/entities/MobSpawner.js` — chunk-driven passive/fish/villager spawning. Passive mobs use a 24–128 block player distance window, grass surface and calculated light >= 9. A 128-block mob cap is enforced separately for passive and fish groups.
- `js53/entities/FishAI.js` — lightweight wandering + local flock steering for cod/salmon.
- `js53/entities/Fish.js` — low-poly fish model, swimming and raw-fish drops.
- `js53/entities/Villager.js` — low-poly villager and village-area wander AI.
- `js53/world/CaveGenerator.js` — 3D gradient-noise cave carving plus deterministic clustered ore veins.
- `js53/world/StructureGenerator.js` — pure data-driven village placement. It returns `[localX,y,localZ,blockId]` records so chunks can generate structures without creating Three.js objects.

## Terrain pipeline
1. `Generator.getWithHeight()` creates the base terrain, ocean/beach/water bodies and basic ore distribution.
2. `Generator.decorateColumn()` adds vegetation, trees and underwater flora. Tree candidates use a deterministic neighborhood suppression pass so trunks stay at least two blocks apart.
3. `CaveGenerator.apply()` carves 3D tunnels/chambers and adds clustered coal/iron/gold/diamond veins.
4. `StructureGenerator.placementsForChunk()` overlays deterministic village houses, paths and farms only on flat plains/desert areas.
5. The worker performs the same pure generation pipeline off the main thread whenever possible.

## Village data
A village is represented as deterministic voxel placement data rather than a persistent Three.js object. This makes the same village regenerate after a chunk unload/reload. Houses include a chest and crafting table. Existing `SurvivalSystems.seedChest()` supplies deterministic randomized loot containing food, tools, armor, coal/iron and other useful items.

## Performance
Generation remains chunk-local. Cave noise is sampled only below the surface and below Y 74. Ore veins use a small fixed number of attempts per chunk. Structures scan only a 5×5 neighborhood of possible village anchors. Mesh creation remains on the existing frame-budgeted chunk queue.
