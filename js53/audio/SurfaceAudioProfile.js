import {BLOCK} from '../world/Block.js?v=78.0';

/** Data-driven mapping from voxel blocks to surface sound families. */
export class SurfaceAudioProfile{
  constructor(name,{steps='stone',breaks='stone',hardness=1}={}){this.name=name;this.steps=steps;this.breaks=breaks;this.hardness=hardness}
}

export const SURFACE_AUDIO_PROFILES={
  grass:new SurfaceAudioProfile('grass',{steps:'grass',breaks:'grass',hardness:.7}),
  dirt:new SurfaceAudioProfile('dirt',{steps:'dirt',breaks:'dirt',hardness:.5}),
  stone:new SurfaceAudioProfile('stone',{steps:'stone',breaks:'stone',hardness:2}),
  ore:new SurfaceAudioProfile('ore',{steps:'stone',breaks:'ore',hardness:3}),
  sand:new SurfaceAudioProfile('sand',{steps:'sand',breaks:'sand',hardness:.45}),
  gravel:new SurfaceAudioProfile('gravel',{steps:'gravel',breaks:'gravel',hardness:.6}),
  wood:new SurfaceAudioProfile('wood',{steps:'wood',breaks:'wood',hardness:2}),
  snow:new SurfaceAudioProfile('snow',{steps:'snow',breaks:'snow',hardness:.2}),
  water:new SurfaceAudioProfile('water',{steps:'water',breaks:'water',hardness:.1}),
  default:new SurfaceAudioProfile('default',{steps:'stone',breaks:'stone',hardness:1})
};

export function profileForBlock(id){
  if(id===BLOCK.GRASS)return SURFACE_AUDIO_PROFILES.grass;
  if(id===BLOCK.DIRT||id===BLOCK.FARMLAND||id===BLOCK.CLAY)return SURFACE_AUDIO_PROFILES.dirt;
  if([BLOCK.SAND].includes(id))return SURFACE_AUDIO_PROFILES.sand;
  if([BLOCK.GRAVEL].includes(id))return SURFACE_AUDIO_PROFILES.gravel;
  if([BLOCK.LOG,BLOCK.BIRCH_LOG,BLOCK.SPRUCE_LOG,BLOCK.JUNGLE_LOG,BLOCK.PLANKS].includes(id))return SURFACE_AUDIO_PROFILES.wood;
  if([BLOCK.SNOW].includes(id))return SURFACE_AUDIO_PROFILES.snow;
  if([BLOCK.COAL,BLOCK.IRON,BLOCK.COPPER,BLOCK.GOLD_ORE,BLOCK.DIAMOND_ORE].includes(id))return SURFACE_AUDIO_PROFILES.ore;
  if(id===BLOCK.WATER||[BLOCK.WATER_L1,BLOCK.WATER_L2,BLOCK.WATER_L3,BLOCK.WATER_L4].includes(id))return SURFACE_AUDIO_PROFILES.water;
  return SURFACE_AUDIO_PROFILES.stone;
}
