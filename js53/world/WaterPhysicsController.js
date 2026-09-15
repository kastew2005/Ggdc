import THREE from '../three.js';
import {BLOCK,INFO} from './Block.js';

/** Minecraft-like water state, buoyancy, drag and double-tap sprint swimming. */
export class WaterPhysicsController {
  constructor(game){
    this.game=game; this.breathTick=0; this.flowTimer=0; this.bubbleTimer=0;
    this.lastForward=false; this.lastForwardTap=0; this.sprintWindow=320; this.maxFlowSteps=24;
  }
  isWater(id){return id===BLOCK.WATER||!!INFO[id]?.liquid}
  state(){
    const p=this.game.player,w=this.game.world,x=Math.floor(p.pos.x),z=Math.floor(p.pos.z);
    const feetY=Math.floor(p.pos.y+.05), chestY=Math.floor(p.pos.y+.9), headY=Math.floor(p.pos.y+1.55);
    const feet=this.isWater(w.getBlock(x,feetY,z)), chest=this.isWater(w.getBlock(x,chestY,z)), head=this.isWater(w.getBlock(x,headY,z));
    return {feet,chest,head,submerged:head,water:feet||chest||head};
  }
  forwardPressed(){const k=this.game.controls.keys;return !!(k.KeyW||k.ArrowUp)}
  updateSprintToggle(now){
    const pressed=this.forwardPressed();
    if(pressed&&!this.lastForward){if(now-this.lastForwardTap<=this.sprintWindow)this.game.player.swimSprinting=true;this.lastForwardTap=now;}
    if(!pressed&&this.game.player.swimSprinting){
      if(!(this.game.player.inWater&&this.game.player.submerged))this.game.player.swimSprinting=false;
    }
    this.lastForward=pressed;
  }
  tick(dt){
    const g=this.game,p=g.player,s=this.state();p.inWater=s.water;p.submerged=s.submerged;p.waterChest=s.chest;
    this.updateSprintToggle(performance.now());
    if(!s.water){p.swimSprinting=false;p.air=Math.min(20,(p.air??20)+dt*7);this.breathTick=0;return;}
    if(!s.head){p.air=Math.min(20,(p.air??20)+dt*8);this.breathTick=0;}else{
      p.air=Math.max(0,(p.air??20)-dt);
      this.breathTick-=dt;
      if(p.air<=0&&this.breathTick<=0){this.breathTick=1;p.damage(2);g.audio?.drown?.()}
    }
    // Surface buoyancy target: keep the camera/body from sinking through a full water block.
    const x=Math.floor(p.pos.x),z=Math.floor(p.pos.z),wy=Math.floor(p.pos.y);
    const id=g.world.getBlock(x,wy,z),info=INFO[id];
    const surfaceY=info?.liquid?(wy+1):p.pos.y;
    if(!s.submerged && p.pos.y<surfaceY-.9)p.vel.y+=(surfaceY-.9-p.pos.y)*8*dt;
    if(s.submerged){
      const targetY=surfaceY-.55;
      p.vel.y+=(targetY-p.pos.y)*2.6*dt;
    }
    // Drag and buoyancy are applied here; Player.move handles horizontal movement and collision.
    const verticalDamp=Math.max(0,1-dt*(s.submerged?2.8:2.0));
    p.vel.y*=verticalDamp;
    if(!s.submerged)p.vel.y-=g.cfg.PLAYER.GRAVITY*.16*dt;
    if(g.controls.keys.Space)p.vel.y=Math.min(4.8,p.vel.y+7.5*dt);
    const speed=p.swimSprinting&&s.submerged?4.8:1.75;
    p.waterMoveSpeed=s.submerged?speed:1.15;
    p.swimBob=(p.swimBob||0)+dt*(p.swimSprinting?7:3.5);
    this.bubbleTimer+=dt;
    if(s.submerged&&this.bubbleTimer>.16){this.bubbleTimer=0;g.particles?.burst?.(p.pos.clone().add(new THREE.Vector3(0,.7,0)),0xbfeeff,2)}
    this.flowTimer+=dt;
    if(this.flowTimer>.65){this.flowTimer=0;this.flow()}
  }
  flow(){
    const w=this.game.world,p=this.game.player,px=Math.floor(p.pos.x),py=Math.floor(p.pos.y),pz=Math.floor(p.pos.z);let done=0;
    for(let x=px-8;x<=px+8&&done<this.maxFlowSteps;x++)for(let z=pz-8;z<=pz+8&&done<this.maxFlowSteps;z++)for(let y=Math.max(1,py-4);y<=Math.min(w.cfg.WORLD.HEIGHT-2,py+6)&&done<this.maxFlowSteps;y++){
      const id=w.getBlock(x,y,z);if(!this.isWater(id))continue;const below=w.getBlock(x,y-1,z);if(below===BLOCK.AIR){this.setWater(w,x,y-1,z,Math.min(4,INFO[id]?.waterLevel||4));done++;continue}
      const level=INFO[id]?.waterLevel||4;if(level<=1)continue;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])if(w.getBlock(x+dx,y,z+dz)===BLOCK.AIR){this.setWater(w,x+dx,y,z+dz,level-1);done++;break}
    }
  }
  setWater(w,x,y,z,level){const id=[BLOCK.WATER_L1,BLOCK.WATER_L2,BLOCK.WATER_L3,BLOCK.WATER_L4][Math.max(1,Math.min(4,level))-1];w.setBlock(x,y,z,id)}
}
