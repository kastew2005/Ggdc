import {BLOCK} from './Block.js?v=76.6';

/** Pure data-driven village generator. It returns voxel placements only. */
export class StructureGenerator {
  constructor(generator){this.gen=generator;}
  hash(x,z,s=0){return this.gen.random(x,z,3100+s)}
  flat(cx,cz){
    const gx=cx*16+8,gz=cz*16+8,h=this.gen.height(gx,gz),b=this.gen.biome(gx,gz,h);
    if(b!=='plains'&&b!=='desert')return false;
    let min=999,max=-999;for(let dx=-5;dx<=5;dx++)for(let dz=-5;dz<=5;dz++){const hh=this.gen.height(gx+dx,gz+dz);min=Math.min(min,hh);max=Math.max(max,hh)}
    return max-min<=3;
  }
  villageAt(cx,cz){
    if(!this.flat(cx,cz)||this.hash(cx,cz,0)>.075)return null;
    const gx=cx*16+8,gz=cz*16+8;
    const desert=this.gen.biome(gx,gz)==='desert';
    const seed=this.hash(cx,cz,2);
    const houses=3+(seed*3|0);
    const out=[];
    const add=(x,y,z,id)=>out.push([x,y,z,id]);
    const ground=(x,z)=>this.gen.height(x,z)+1;
    const cube=(x0,y0,z0,w,h,d,id)=>{for(let x=x0;x<x0+w;x++)for(let y=y0;y<y0+h;y++)for(let z=z0;z<z0+d;z++)add(x,y,z,id)};
    const floor=(x0,y,z0,w,d,id)=>{for(let x=x0;x<x0+w;x++)for(let z=z0;z<z0+d;z++)add(x,y,z,id)};
    const house=(x,z,w=5,d=5,kind='home')=>{const y=ground(x,z);const wall=desert?BLOCK.SAND:kind==='forge'?BLOCK.COBBLE:BLOCK.PLANKS;floor(x,y-1,z,w,d,desert?BLOCK.SAND:BLOCK.COBBLE);cube(x,y,z,w,1,d,wall);for(let xx=x;xx<x+w;xx++){add(xx,y+1,z,wall);add(xx,y+1,z+d-1,wall)}for(let zz=z;zz<z+d;zz++){add(x,y+1,zz,wall);add(x+w-1,y+1,zz,wall)}cube(x,y+2,z,w,1,d,wall);add((x+w/2)|0,y,z,BLOCK.GLASS);add((x+w/2)|0,y,z+d-1,BLOCK.GLASS);add(x,y,z+(d/2|0),BLOCK.GLASS);add(x+w-1,y,z+(d/2|0),BLOCK.GLASS);add((x+w/2)|0,y+1,z+d-1,wall);add(x+1,y,z+1,BLOCK.CHEST);add(x+2,y,z+2,BLOCK.CRAFTING_TABLE);if(kind==='forge'){add(x+w-2,y,z+1,BLOCK.FURNACE);add(x+w-2,y,z+2,BLOCK.CHEST)}};
    const positions=[[gx-6,gz-6],[gx+1,gz-6],[gx-6,gz+1],[gx+2,gz+2],[gx-1,gz+5]];
    for(let i=0;i<houses;i++)house(positions[i][0],positions[i][1],i===houses-1?6:5,i===houses-1?6:5,i===houses-1?'forge':i===1?'medium':'home');
    // Central gravel/dirt paths.
    const pathY=ground(gx,gz)-1;for(let x=gx-8;x<=gx+8;x++)for(let z=gz-1;z<=gz+1;z++)add(x,pathY,z,desert?BLOCK.SAND:BLOCK.GRAVEL);for(let z=gz-8;z<=gz+8;z++)for(let x=gx-1;x<=gx+1;x++)add(x,pathY,z,desert?BLOCK.SAND:BLOCK.GRAVEL);
    // Farm: logs around farmland, water channel, wheat.
    const fx=gx+4,fz=gz+4,fy=ground(fx,fz)-1;for(let x=fx-2;x<=fx+2;x++)for(let z=fz-2;z<=fz+2;z++){add(x,fy,z,Math.abs(x-fx)===2||Math.abs(z-fz)===2?BLOCK.LOG:BLOCK.FARMLAND);if(x===fx&&z>=fz-1&&z<=fz+1)add(x,fy,z,BLOCK.WATER_L4);else if(Math.abs(x-fx)<2&&Math.abs(z-fz)<2)add(x,fy+1,z,BLOCK.WHEAT)}
    return out;
  }
  placementsForChunk(cx,cz,size,height){
    const out=[];for(let vx=cx-2;vx<=cx+2;vx++)for(let vz=cz-2;vz<=cz+2;vz++){const village=this.villageAt(vx,vz);if(!village)continue;for(const [x,y,z,id] of village){const lx=x-cx*size,lz=z-cz*size;if(lx>=0&&lx<size&&lz>=0&&lz<size&&y>=0&&y<height)out.push([lx,y,lz,id])}}return out;
  }
}
