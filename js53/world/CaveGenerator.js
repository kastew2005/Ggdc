import {BLOCK} from './Block.js?v=77.7';

/**
 * Deterministic 3D cave + ore pass. It only writes into the current chunk,
 * which keeps worker generation cheap and avoids cross-chunk mutation races.
 */
export class CaveGenerator {
  constructor(generator){this.gen=generator;}
  apply(chunk,cx,cz,size,height){
    const baseX=cx*size,baseZ=cz*size;
    // Carve broad tunnels/chambers below the surface. The generator's 3D
    // gradient noise is deliberately sampled at a coarse frequency.
    for(let x=0;x<size;x++)for(let z=0;z<size;z++){
      const wx=baseX+x,wz=baseZ+z,top=this.gen.height(wx,wz);
      const maxY=Math.min(top-2,height-4,72);
      for(let y=5;y<=maxY;y++){
        const id=chunk.get(x,y,z);
        if(id!==BLOCK.STONE&&id!==BLOCK.COAL&&id!==BLOCK.IRON&&id!==BLOCK.COPPER&&id!==BLOCK.GOLD_ORE&&id!==BLOCK.DIAMOND_ORE)continue;
        const n=this.gen.fbm3(wx*.055,y*.065,wz*.055,3,2,.5);
        const chamber=this.gen.noise3(wx*.026,y*.035,wz*.026);
        if((n>.735&&n<.815)||(chamber>.82&&n>.56)){chunk.set(x,y,z,y<=this.gen.seaLevel?BLOCK.WATER_L4:BLOCK.AIR);}
      }
    }
    // Deterministic clustered veins. Small bounded neighborhoods make this
    // substantially cheaper than a second full-world pass.
    const attempts=7;
    for(let a=0;a<attempts;a++){
      const rx=(this.gen.random(cx,cz,1400+a*17)*size)|0;
      const rz=(this.gen.random(cx,cz,1500+a*19)*size)|0;
      const y=(this.gen.random(cx,cz,1600+a*23)*Math.max(1,height-8)|0)+4;
      const roll=this.gen.random(cx,cz,1700+a*29);
      let ore=0,maxY=0,minY=0,sizeVein=0;
      if(y<=18&&roll<.08){ore=BLOCK.DIAMOND_ORE;minY=5;maxY=18;sizeVein=4+((roll*100)|0)%4}
      else if(y<=34&&roll<.25){ore=BLOCK.GOLD_ORE;minY=5;maxY=34;sizeVein=5+((roll*100)|0)%5}
      else if(y<=58&&roll<.55){ore=BLOCK.IRON;minY=5;maxY=58;sizeVein=6+((roll*100)|0)%5}
      else if(y<=70){ore=BLOCK.COAL;minY=5;maxY=70;sizeVein=7+((roll*100)|0)%6}
      if(!ore||y<minY||y>maxY)continue;
      for(let i=0;i<sizeVein;i++){
        const dx=((this.gen.random(cx*31+a,cz*17+i,1800+a)-.5)*4)|0;
        const dy=((this.gen.random(cx*13+i,cz*29+a,1900+i)-.5)*3)|0;
        const dz=((this.gen.random(cx*23+a,cz*11+i,2000+a)-.5)*4)|0;
        const x=rx+dx,z=rz+dz,yy=y+dy;
        if(x>=0&&x<size&&z>=0&&z<size&&yy>=1&&yy<height&&chunk.get(x,yy,z)===BLOCK.STONE)chunk.set(x,yy,z,ore);
      }
    }
  }
}
