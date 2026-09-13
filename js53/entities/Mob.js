import {Zombie} from './Zombie.js';
import {INFO,ITEM,BLOCK} from '../world/Block.js';
import {FriendlyMob} from './FriendlyMob.js';
import {Fish} from './Fish.js';
import {Villager} from './Villager.js';
export class MobManager{
 constructor(scene,world,quality={}){this.scene=scene;this.world=world;this.mobs=[];this.max=quality.maxMobs||32}
 spawn(x,y,z){if(this.mobs.length>=this.max)return null;const m=new Zombie(this.scene,this.world,x,y,z);this.mobs.push(m);return m}
 spawnFriendly(x,y,z,type){if(this.mobs.length>=this.max)return null;const m=new FriendlyMob(this.scene,this.world,x,y,z,type);this.mobs.push(m);return m}
 spawnFish(x,y,z,type='cod'){if(this.mobs.length>=this.max)return null;const m=new Fish(this.scene,this.world,x,y,z,type);this.mobs.push(m);return m}
 spawnVillager(x,y,z){if(this.mobs.length>=this.max)return null;const m=new Villager(this.scene,this.world,x,y,z);this.mobs.push(m);return m}
 spawnForBiome(x,y,z,biome){const map={plains:['chicken','pig','sheep','cow'],birch_grove:['chicken','sheep','cow'],mixed_forest:['chicken','pig','sheep','cow'],jungle:['chicken','pig'],beach:['chicken']};const p=map[biome];return p?.length?this.spawnFriendly(x,y,z,p[(Math.random()*p.length)|0]):null}
 update(dt,player){let hurt=false;for(const m of this.mobs)if(m.alive)hurt=!!m.update(dt,player,this)||hurt;for(let i=this.mobs.length-1;i>=0;i--)if(!this.mobs[i].alive){this.mobs[i].dispose?.();this.mobs.splice(i,1)}return hurt}
 attack(player){const weapon=player.inventory?.selectedItem?.(),item=weapon?.id?weapon:null;let best=null,bd=3.5;for(const m of this.mobs)if(m.alive){const d=m.pos.distanceTo(player.pos);if(d<bd){bd=d;best=m}}if(!best)return{hit:false,dead:false};let damage=5;if(item?.id)damage=INFO[item.id]?.damage||damage;const dead=best.hit(damage,player);return{hit:true,dead,mob:best,drops:dead&&best.drops?best.drops():null}}
 shear(player){for(const m of this.mobs)if(m.alive&&m.type==='sheep'&&m.pos.distanceTo(player.pos)<3.5&&m.shear?.(player.inventory))return true;return false}
}
