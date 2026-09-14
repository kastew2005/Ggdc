import {BLOCK} from './Block.js?v=77.4';
import {CaveGenerator} from './CaveGenerator.js?v=77.4';
import {StructureGenerator} from './StructureGenerator.js?v=77.4';
const INFO_WATER=id=>id===BLOCK.WATER||id===BLOCK.WATER_L1||id===BLOCK.WATER_L2||id===BLOCK.WATER_L3||id===BLOCK.WATER_L4;

/** Seeded terrain/biome generator shared by the main thread and worker. */
export class BiomeGenerator {
  constructor(seed=1){this.seed=seed|0;this.seaLevel=45;this.perm=this._permutation(this.seed);this.caves=new CaveGenerator(this);this.structures=new StructureGenerator(this);}
  _permutation(seed){const a=Array.from({length:256},(_,i)=>i);let s=(seed|0)>>>0;const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296};for(let i=255;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.concat(a)}
  _fade(t){return t*t*t*(t*(t*6-15)+10)} _lerp(a,b,t){return a+(b-a)*t}
  _grad3(h,x,y,z){switch(h&15){case 0:return x+y;case 1:return -x+y;case 2:return x-y;case 3:return -x-y;case 4:return x+z;case 5:return -x+z;case 6:return x-z;case 7:return -x-z;case 8:return y+z;case 9:return -y+z;case 10:return y-z;case 11:return -y-z;case 12:return x+y;case 13:return -x+y;case 14:return -y+z;default:return -y-z}}
  noise3(x,y,z){const X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255,xf=x-Math.floor(x),yf=y-Math.floor(y),zf=z-Math.floor(z),u=this._fade(xf),v=this._fade(yf),w=this._fade(zf),p=this.perm;const A=p[X]+Y,AA=p[A]+Z,AB=p[A+1]+Z,B=p[X+1]+Y,BA=p[B]+Z,BB=p[B+1]+Z;const x00=this._lerp(this._grad3(p[AA],xf,yf,zf),this._grad3(p[BA],xf-1,yf,zf),u),x10=this._lerp(this._grad3(p[AB],xf,yf-1,zf),this._grad3(p[BB],xf-1,yf-1,zf),u),x01=this._lerp(this._grad3(p[AA+1],xf,yf,zf-1),this._grad3(p[BA+1],xf-1,yf,zf-1),u),x11=this._lerp(this._grad3(p[AB+1],xf,yf-1,zf-1),this._grad3(p[BB+1],xf-1,yf-1,zf-1),u);return(this._lerp(this._lerp(x00,x10,v),this._lerp(x01,x11,v),w)+1)/2}
  noise2(x,y){return this.noise3(x,0,y)}
  fbm(x,y,oct=4,lac=2,gain=.5){let amp=1,f=1,sum=0,n=0;for(let i=0;i<oct;i++){sum+=this.noise2(x*f,y*f)*amp;n+=amp;f*=lac;amp*=gain}return sum/n}
  fbm3(x,y,z,oct=3,lac=2,gain=.5){let amp=1,f=1,sum=0,n=0;for(let i=0;i<oct;i++){sum+=this.noise3(x*f,y*f,z*f)*amp;n+=amp;f*=lac;amp*=gain}return sum/n}
  height(x,z){const continental=this.fbm(x*.012,z*.012,4,2,.5),detail=this.fbm(x*.055,z*.055,3,2,.5),ridge=1-Math.abs(this.fbm(x*.022,z*.022,3,2,.55)*2-1);return Math.max(5,Math.min(92,Math.floor(20+(continental-.5)*50+(detail-.5)*12+ridge*38)))}
  biome(x,z,h=this.height(x,z)){const temp=this.fbm(x*.004+41,z*.004-17,4,2,.5),moisture=this.fbm(x*.004-73,z*.004+29,4,2,.5);if(h<=44)return'ocean';if(h<=48)return'beach';if(h>=64)return'mountains';if(temp<.28&&moisture>.48)return'birch_grove';if(temp>.72&&moisture<.38)return'desert';if(temp>.63&&moisture>.67)return'jungle';if(moisture>.57)return'mixed_forest';return'plains'}
  random(x,z,salt=0){let n=(Math.imul(x|0,374761393)+Math.imul(z|0,668265263)+Math.imul((this.seed+salt)|0,1442695041))|0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296}
  treeAllowed(x,z,b){if(!['plains','birch_grove','mixed_forest','jungle'].includes(b))return false;const r=this.random(x,z,900),candidate=b==='jungle'?.12:b==='birch_grove'?.16:b==='mixed_forest'?.11:.035;if(r>=candidate)return false;for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){if(!dx&&!dz)continue;const nb=this.biome(x+dx,z+dz);const nr=this.random(x+dx,z+dz,900),nc=nb==='jungle'?.085:nb==='birch_grove'?.12:nb==='mixed_forest'?.08:.018;if(nr<nc&&nr<r)return false}return true}
  get(x,y,z,seaLevel=this.seaLevel){return this.getWithHeight(x,y,z,this.height(x,z),seaLevel)}
  getWithHeight(x,y,z,h,seaLevel=this.seaLevel){const b=this.biome(x,z,h);if(y===0)return BLOCK.BEDROCK;const river=Math.abs(this.fbm(x*.018+91,z*.018-37,3,2,.5)-.5)<.055;const lake=this.fbm(x*.009-121,z*.009+73,3,2,.5)>.77&&h<52;const waterBody=b==='ocean'||(river&&h<=seaLevel+2)||(lake&&h<=seaLevel+1);if(y>h){return y<=seaLevel&&waterBody?BLOCK.WATER_L4:BLOCK.AIR}if(b==='mountains'&&y>=h-2&&h>70)return BLOCK.SNOW;if((b==='desert'||b==='beach'||b==='ocean')&&y>=h-3)return BLOCK.SAND;if(y===h)return BLOCK.GRASS;if(y>h-4)return BLOCK.DIRT;
    // 3D cave field. Below sea level a carved chamber is water-filled; above it is air.
    const bonus=b==='mountains'?1.5:1;if(y<18&&this.random(x*11+y*3,z*13-y*5,501)<.008*bonus)return BLOCK.DIAMOND_ORE;if(y<34&&this.random(x*3+y,z*5-y,99)<.028*bonus)return BLOCK.GOLD_ORE;if(y<58&&this.random(x*7+y,z*3-y,77)<.055*bonus)return BLOCK.IRON;if(y<70&&this.random(x+y*2,z-y*3,51)<.08)return BLOCK.COAL;if(y<18&&this.random(x*17+y,z*19-y*2,601)<.003)return BLOCK.OBSIDIAN;return BLOCK.STONE}
  decorateColumn(x,z,y,api){if(y<1||y>=94)return;const b=this.biome(x,z,y),r=this.random(x,z,900);const place=(dx,dy,dz,id)=>{const cur=api.getBlock?.(x+dx,y+dy,z+dz);if(cur===BLOCK.AIR||(b==='ocean'&&INFO_WATER(cur)))api.setBlock(x+dx,y+dy,z+dz,id)};
    if(b==='ocean'){if(r<.18){place(0,1,0,BLOCK.SEAGRASS)}else if(r<.23){for(let i=1;i<=2+(r*100|0)%3;i++)place(0,i,0,BLOCK.KELP)}return}
    if(b==='beach'){if(r<.025)place(0,0,0,BLOCK.DEAD_BUSH);return}
    if(b==='desert'){if(r<.045)for(let i=0;i<2+(r*80|0)%3;i++)place(0,i,0,BLOCK.CACTUS);else if(r<.085)place(0,0,0,BLOCK.DEAD_BUSH);return}
    if(this.treeAllowed(x,z,b)){this.tree(x,y+1,z,api,b==='birch_grove'?'birch':b==='mixed_forest'?['oak','birch','spruce'][(this.random(x,z,901)*3)|0]:b==='jungle'?'jungle':'oak');return}
    if(b==='jungle'&&r<.18){place(0,0,0,BLOCK.WATERMELON);return}if(b==='jungle'&&r<.52){place(0,0,0,BLOCK.VINE);return}if(b==='plains'&&r<.42){place(0,0,0,r<.10?BLOCK.FLOWER_POPPY:r<.20?BLOCK.FLOWER_DANDELION:BLOCK.GRASS_LOW);return}if((b==='plains'||b==='birch_grove')&&r<.58){place(0,0,0,BLOCK.GRASS_HIGH_BOTTOM);place(0,1,0,BLOCK.GRASS_HIGH_TOP);return}if(b==='mixed_forest'&&r<.45)place(0,0,0,BLOCK.GRASS_LOW)
  }
  tree(x,y,z,api,type='oak'){
    const spec={oak:[BLOCK.LOG,BLOCK.LEAVES,6],birch:[BLOCK.BIRCH_LOG,BLOCK.BIRCH_LEAVES,6],spruce:[BLOCK.SPRUCE_LOG,BLOCK.SPRUCE_LEAVES,8],jungle:[BLOCK.JUNGLE_LOG,BLOCK.JUNGLE_LEAVES,9]}[type]||[BLOCK.LOG,BLOCK.LEAVES,6];
    const[log,leaf,h]=spec;
    for(let i=0;i<h;i++)api.setBlock(x,y+i,z,log);
    const radius=type==='spruce'?2:3;
    // Full layered canopy: a broad lower crown, smaller upper crown and a visible cap.
    for(let dy=1;dy<=4;dy++){
      const layer=dy===1?radius:dy===2?radius:dy===3?Math.max(1,radius-1):1;
      for(let dx=-layer;dx<=layer;dx++)for(let dz=-layer;dz<=layer;dz++){
        const dist=Math.abs(dx)+Math.abs(dz);
        if(dist<=layer+1 && api.getBlock?.(x+dx,y+h-4+dy,z+dz)===BLOCK.AIR)api.setBlock(x+dx,y+h-4+dy,z+dz,leaf);
      }
    }
    // Always put a leaf cap above the trunk so trees never end as bare poles.
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(api.getBlock?.(x+dx,y+h,z+dz)===BLOCK.AIR)api.setBlock(x+dx,y+h,z+dz,leaf);
    if(type==='jungle')for(let i=1;i<h-1;i++)if(this.random(x+i,z-i,970)<.45)api.setBlock(x+1,y+i,z,BLOCK.VINE);
  }
  decorateUnderground(chunk,cx,cz,size,height){this.caves.apply(chunk,cx,cz,size,height)}
  structurePlacements(cx,cz,size,height){return this.structures.placementsForChunk(cx,cz,size,height)}
}
export class Generator extends BiomeGenerator{}
