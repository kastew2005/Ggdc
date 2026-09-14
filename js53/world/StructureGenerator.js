import {BLOCK} from './Block.js?v=77.4';

export class StructureGenerator {
  constructor(generator){this.gen=generator;}
  hash(x,z,s=0){return this.gen.random(x,z,3100+s);}
  flat(cx,cz){
    const gx=cx*16+8,gz=cz*16+8,h=this.gen.height(gx,gz),b=this.gen.biome(gx,gz,h);
    if(b!=='plains'&&b!=='desert')return false;
    let min=999,max=-999;for(let dx=-7;dx<=7;dx++)for(let dz=-7;dz<=7;dz++){const hh=this.gen.height(gx+dx,gz+dz);min=Math.min(min,hh);max=Math.max(max,hh)}
    return max-min<=4;
  }
  villageAt(cx,cz){
    if(!this.flat(cx,cz)||this.hash(cx,cz,0)>.16)return null;
    const gx=cx*16+8,gz=cz*16+8,desert=this.gen.biome(gx,gz)==='desert';
    const seed=this.hash(cx,cz,2),houses=4+(seed*3|0),out=[];
    const add=(x,y,z,id)=>out.push([x,y,z,id]);
    const ground=(x,z)=>this.gen.height(x,z)+1;
    const cube=(x0,y0,z0,w,h,d,id)=>{for(let x=x0;x<x0+w;x++)for(let y=y0;y<y0+h;y++)for(let z=z0;z<z0+d;z++)add(x,y,z,id)};
    const house=(x,z,w=6,d=6,kind='home')=>{
      const y=ground(x,z),wall=desert?BLOCK.SAND:kind==='forge'?BLOCK.COBBLE:BLOCK.PLANKS,roof=desert?BLOCK.SAND:BLOCK.PLANKS;
      // foundation
      cube(x,y-1,z,w,1,d,desert?BLOCK.SAND:BLOCK.COBBLE);
      // 3-block walls with a real 1x2 doorway and windows
      for(let xx=x;xx<x+w;xx++)for(let yy=y;yy<y+3;yy++){
        if(xx===x+(w>>1)&&yy<=y+1)continue;
        add(xx,yy,z,wall);add(xx,yy,z+d-1,wall);
      }
      for(let zz=z+1;zz<z+d-1;zz++)for(let yy=y;yy<y+3;yy++){add(x,yy,zz,wall);add(x+w-1,yy,zz,wall)}
      // windows
      add(x+1,y+1,z,desert?BLOCK.GLASS:BLOCK.GLASS);add(x+w-2,y+1,z,desert?BLOCK.GLASS:BLOCK.GLASS);
      add(x,y+1,z+1,BLOCK.GLASS);add(x+w-1,y+1,z+d-2,BLOCK.GLASS);
      // pitched roof with eaves and ridge, not a flat cap
      const half=Math.floor(w/2);
      for(let z0=z-1;z0<=z+d;z0++){
        for(let layer=0;layer<=half;layer++){
          const xl=x-1+layer,xr=x+w-layer;
          const yy=y+3+layer;
          if(layer===half){add(x+(w>>1),yy,z0,roof);}
          else {add(xl,yy,z0,roof);add(xr,yy,z0,roof);for(let xx=xl+1;xx<xr;xx++)add(xx,yy,z0,roof)}
        }
      }
      // interior furniture / profession marker
      add(x+1,y,z+1,BLOCK.CHEST);add(x+2,y,z+2,BLOCK.CRAFTING_TABLE);
      if(kind==='forge'){add(x+w-2,y,z+1,BLOCK.FURNACE);add(x+w-2,y,z+2,BLOCK.CHEST);add(x+w-2,y+3,z+2,BLOCK.COBBLE);}
      else add(x+w-2,y,z+1,BLOCK.BED);
    };
    const positions=[[gx-7,gz-7],[gx+2,gz-7],[gx-7,gz+2],[gx+2,gz+2],[gx-2,gz+7],[gx+7,gz-2]];
    for(let i=0;i<houses&&i<positions.length;i++)house(positions[i][0],positions[i][1],i===houses-1?7:6,i===houses-1?7:6,i===houses-1?'forge':i===2?'home':'home');
    const pathY=ground(gx,gz)-1;
    for(let x=gx-10;x<=gx+10;x++)for(let z=gz-1;z<=gz+1;z++)add(x,pathY,z,desert?BLOCK.SAND:BLOCK.GRAVEL);
    for(let z=gz-10;z<=gz+10;z++)for(let x=gx-1;x<=gx+1;x++)add(x,pathY,z,desert?BLOCK.SAND:BLOCK.GRAVEL);
    // central well / plaza
    cube(gx-1,pathY+1,gz-1,3,1,3,BLOCK.COBBLE);add(gx,pathY+1,gz,BLOCK.WATER_L4);
    // four lantern posts around the plaza
    for(const [px,pz] of [[gx-5,gz-5],[gx+5,gz-5],[gx-5,gz+5],[gx+5,gz+5]]){add(px,pathY,pz,BLOCK.LOG);add(px,pathY+1,pz,BLOCK.LOG);add(px,pathY+2,pz,BLOCK.LANTERN);}
    // farm
    const fx=gx+5,fz=gz+5,fy=ground(fx,fz)-1;for(let x=fx-2;x<=fx+2;x++)for(let z=fz-2;z<=fz+2;z++){add(x,fy,z,Math.abs(x-fx)===2||Math.abs(z-fz)===2?BLOCK.LOG:BLOCK.FARMLAND);if(x===fx&&z>=fz-1&&z<=fz+1)add(x,fy,z,BLOCK.WATER_L4);else if(Math.abs(x-fx)<2&&Math.abs(z-fz)<2)add(x,fy+1,z,BLOCK.WHEAT)}
    return out;
  }
  placementsForChunk(cx,cz,size,height){const out=[];for(let vx=cx-2;vx<=cx+2;vx++)for(let vz=cz-2;vz<=cz+2;vz++){const village=this.villageAt(vx,vz);if(!village)continue;for(const [x,y,z,id] of village){const lx=x-cx*size,lz=z-cz*size;if(lx>=0&&lx<size&&lz>=0&&lz<size&&y>=0&&y<height)out.push([lx,y,lz,id])}}return out;}
}
