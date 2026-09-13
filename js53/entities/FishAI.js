import THREE from '../three.js';
export class FishAI{
 constructor(fish){this.fish=fish;this.timer=0;this.dir=new THREE.Vector3();this.phase=Math.random()*Math.PI*2}
 update(dt,manager){this.timer-=dt;this.phase+=dt*4;if(this.timer<=0){this.timer=.8+Math.random()*2;const a=Math.random()*Math.PI*2;this.dir.set(Math.cos(a),(.5-Math.random())*.5,Math.sin(a)).normalize()}
  const nearby=manager?.mobs?.filter(m=>m!==this.fish&&m.alive&&m.type===this.fish.type&&m.pos.distanceToSquared(this.fish.pos)<16)||[];
  if(nearby.length){const steer=new THREE.Vector3();for(const f of nearby)steer.add(this.fish.pos).sub(f.pos);if(steer.lengthSq()>0)this.dir.lerp(steer.normalize(),dt*1.2)}
  const next=this.fish.pos.clone().addScaledVector(this.dir,this.fish.data.speed*dt);if(this.fish.inWater(next.x,next.y,next.z))this.fish.pos.copy(next);else{this.dir.y=Math.abs(this.dir.y)+.2;this.timer=0}
  this.fish.group.position.copy(this.fish.pos);this.fish.group.rotation.y=Math.atan2(this.dir.x,this.dir.z);this.fish.group.rotation.x=Math.sin(this.phase)*.08;
 }
}
