import THREE from '../three.js';
import {Entity} from './Entity.js';
import {INFO,BLOCK} from '../world/Block.js?v=77.7';
export class Villager extends Entity{
 constructor(scene,world,x,y,z){super(x,y,z);this.world=world;this.type='villager';this.health=20;this.timer=0;this.dir=new THREE.Vector3();this.group=new THREE.Group();const skin=new THREE.MeshLambertMaterial({color:0xb98262}),robe=new THREE.MeshLambertMaterial({color:0x4d7567}),shoe=new THREE.MeshLambertMaterial({color:0x3b342e});const head=new THREE.Mesh(new THREE.BoxGeometry(.55,.65,.55),skin);head.position.y=1.55;const body=new THREE.Mesh(new THREE.BoxGeometry(.62,.85,.4),robe);body.position.y=.85;const nose=new THREE.Mesh(new THREE.BoxGeometry(.12,.22,.18),skin);nose.position.set(0,1.48,-.34);for(const sx of [-.18,.18]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.18,.55,.18),shoe);leg.position.set(sx,.2,0);this.group.add(leg)}this.group.add(head,body,nose);this.group.position.copy(this.pos);scene.add(this.group)}
 solid(x,y,z){return !!INFO[this.world.getBlock(Math.floor(x),Math.floor(y),Math.floor(z))]?.solid}
 update(dt,player,manager){if(!this.alive)return false;this.timer-=dt;if(this.timer<=0){this.timer=1.2+Math.random()*2.8;const a=Math.random()*Math.PI*2;this.dir.set(Math.sin(a),0,Math.cos(a));if(Math.random()<.25)this.dir.set(0,0,0)}const speed=.45;const nx=this.pos.x+this.dir.x*speed*dt,nz=this.pos.z+this.dir.z*speed*dt;if(!this.solid(nx,this.pos.y+.5,nz))this.pos.set(nx,this.pos.y,nz);else this.timer=0;this.group.position.copy(this.pos);if(this.dir.lengthSq()>0)this.group.rotation.y=Math.atan2(this.dir.x,this.dir.z);return false}
 hit(d){this.health-=d;if(this.health<=0)this.alive=false;return !this.alive}
 drops(){return []}
 dispose(){this.group.parent?.remove(this.group);this.group.traverse(o=>o.geometry?.dispose?.())}
}
