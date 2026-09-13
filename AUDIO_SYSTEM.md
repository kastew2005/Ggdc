# Audio System

The project uses **HTML5 JavaScript + Web Audio API**. No external audio files are required for the default build; short procedural samples keep the ZIP self-contained and iPhone-friendly.

## Modules

- `js53/audio/AudioManager.js` — central mixer, 2D/3D playback, pitch/volume randomization, underwater low-pass, footsteps, block sounds, player states, mob sounds and ambient/music scheduler.
- `js53/audio/SoundPool.js` — reuses `GainNode` + `PannerNode` pairs. One-shot oscillators/buffers are intentionally short-lived, while the expensive spatial graph is pooled.
- `js53/audio/SurfaceAudioProfile.js` — maps voxel IDs to material families (`grass`, `stone`, `ore`, `sand`, `gravel`, `wood`, `snow`, `water`).

## Mixer

`Master -> destination`. Music, SFX, Ambient and Entities pass through an underwater low-pass filter. UI is routed directly to Master so menus remain readable underwater. Volumes are persisted in `localStorage` under `voxel-survival-audio-v1`.

## 3D audio

`play/tone/noise` accept `{position:{x,y,z}}`. The pool configures `PannerNode` with inverse distance attenuation, `refDistance=2`, `maxDistance=56`, `rolloffFactor=1.25`.

## Calling examples

```js
game.audio.uiClick();
game.audio.blockHit(blockId, new THREE.Vector3(x+.5,y+.5,z+.5));
game.audio.blockBreak(blockId, new THREE.Vector3(x+.5,y+.5,z+.5));
game.audio.blockPlace(blockId, new THREE.Vector3(x+.5,y+.5,z+.5));
game.audio.mobHurt('cow', mob.pos);
game.audio.mobDeath('cow', mob.pos);
```

`AudioManager.update(dt, game)` is called from the main frame loop. It updates the Web Audio listener from the camera, detects water submersion, schedules cave ambience and mob idle sounds, and emits a small procedural music layer.
