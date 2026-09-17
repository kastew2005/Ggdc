import THREE from '../three.js';

/**
 * Central registry for authored pixel-art textures.
 *
 * Textures are deliberately loaded only from the local `assets/` tree.  The
 * returned Texture instance is cached immediately, so materials may be built
 * before image decoding completes without replacing their map or creating
 * extra draw-state.  This also makes a missing optional texture visible in the
 * browser network panel instead of silently falling back to a random colour.
 */
export class TextureRegistry {
  constructor(){
    this.loader=new THREE.TextureLoader();
    this.cache=new Map();
  }

  pixel(path,{transparent=false}={}){
    const key=`${transparent?'alpha:':'solid:'}${path}`;
    if(this.cache.has(key)) return this.cache.get(key);
    const texture=this.loader.load(path,undefined,undefined,error=>console.warn(`Texture failed to load: ${path}`,error));
    texture.magFilter=THREE.NearestFilter;
    texture.minFilter=THREE.NearestFilter;
    texture.generateMipmaps=false;
    texture.wrapS=THREE.RepeatWrapping;
    texture.wrapT=THREE.RepeatWrapping;
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.userData.assetPath=path;
    texture.userData.transparent=transparent;
    this.cache.set(key,texture);
    return texture;
  }
}

export const TEXTURE_REGISTRY=new TextureRegistry();

export const BLOCK_TEXTURES=Object.freeze({
  grass_top:'assets/textures64/blocks/grass_top.png',
  grass_side:'assets/textures64/blocks/grass_side.png',
  grass_bottom:'assets/textures64/blocks/dirt.png',
  dirt:'assets/textures64/blocks/dirt.png', stone:'assets/textures64/blocks/stone.png',
  sand:'assets/textures64/blocks/sand.png', cobble:'assets/textures64/blocks/cobblestone.png',
  wood_side:'assets/textures64/blocks/wood.png', wood_top:'assets/textures64/blocks/wood_top.png',
  leaves:'assets/textures64/blocks/leaves.png', planks:'assets/textures64/blocks/planks.png',
  glass:'assets/textures64/blocks/glass.png', water:'assets/textures64/blocks/water.png',
  coal:'assets/textures64/blocks/coal_ore.png', iron:'assets/textures64/blocks/iron_ore.png',
  gold_ore:'assets/textures64/blocks/gold_ore.png', diamond_ore:'assets/textures64/blocks/diamond_ore.png',
  furnace:'assets/textures64/blocks/furnace.png', crafting_table:'assets/textures64/blocks/crafting_table.png',
  bed:'assets/textures64/blocks/bed.png', brick:'assets/textures64/blocks/brick.png', snow:'assets/textures64/blocks/snow.png'
});

export const MOB_TEXTURES=Object.freeze({
  chicken:'assets/textures64/mobs/chicken.png', pig:'assets/textures64/mobs/pig.png',
  sheep:'assets/textures64/mobs/sheep.png', cow:'assets/textures64/mobs/cow.png',
  villager:'assets/textures64/mobs/villager.png'
});
