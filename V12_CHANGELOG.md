# V12 change log

- Added `InputTouchFilter` with 14 px deadzone and 260 ms cooldown.
- Camera touch look starts only after a real drag crosses the threshold.
- World block interaction is delayed by 120 ms and cancelled on camera drag.
- Inventory/container pointer gestures are deadzone protected.
- Added progressive stack pickup with a visible charge bar.
- Added mobile double-tap quick transfer.
- Added shift transfer between inventory and hotbar and container-to-inventory transfer.
- Added `WaterPhysicsController` with feet/chest/head immersion states, buoyancy, water drag, oxygen and sprint swimming.
- Added double-forward sprint swimming within 320 ms.
- Reduced collision height while sprint swimming.
- Added camera bob and bubble effects while swimming.
- Reworked procedural block materials to native 64x64 DataTextures.
- Added dedicated `PixelMaterialFactory64`.
- Added 64x64 original reference PNGs for blocks and mobs.
- Added `MobTextureFactory` and textured body/head/leg parts for passive mobs and villagers.
- Added syntax validation for every JavaScript file.
