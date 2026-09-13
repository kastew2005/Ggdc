import THREE from '../three.js';
import {Entity} from './Entity.js';
import {BLOCK,ITEM,INFO} from '../world/Block.js?v=76.6';
import {FishAI} from './FishAI.js';
const DATA={cod:{health:3,speed:1.5,body:0x718c8f,accent:0xd7e0dc,drop:ITEM.RAW_COD},salmon:{health:3,speed:1.7,body:0xd87562,accent:0xe8b0a0,drop:ITEM.RAW_SALMON}};
export class Fish extends Entity{
 constructor(scene,world,x,y,z,type='cod'){super(x,y,z);this.world=world;this.type=type;this.data=DATA[type]||DATA.cod;this.health=this.data.health;this.ai=new FishAI(this);this.group=new THREE.Group();const mat=new THREE.MeshLambertMaterial({color:this.data.body});const accent=new THREE.MeshLambertMaterial({color:this.data.accent});const body=new THREE.Mesh(new THREE.BoxGeometry(.75,.32,.34),mat);const head=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.34),accent);head.position.z=-.42;const tail=new THREE.Mesh(new THREE.BoxGeometry(.25,.4,.08),mat);tail.position.z=.42;tail.rotation.y=Math.PI/2;this.group.add(body,head,tail);this.group.position.copy(this.pos);scene.add(this.group)}
 inWater(x,y,z){const id=this.world.getBlock(Math.floor(x),Math.floor(y),Math.floor(z));return !!INFO[id]?.liquid}
 update(dt,player,manager){if(!this.alive)return false;this.ai.update(dt,manager);return false}
 hit(d){this.health-=d;if(this.health<=0)this.alive=false;return !this.alive}
 drops(){return [[this.data.drop,1+((Math.random()*2)|0)]]}
 dispose(){this.group.parent?.remove(this.group);this.group.traverse(o=>o.geometry?.dispose?.())}
}
