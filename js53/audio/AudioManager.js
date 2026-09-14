import {BLOCK,INFO} from '../world/Block.js?v=77.7';
import {SoundPool} from './SoundPool.js';
import {profileForBlock} from './SurfaceAudioProfile.js';

const KEY='voxel-survival-audio-v1';
const DEFAULTS={master:1,music:.42,sfx:.8,blocks:.8,ambient:.55,entities:.8};

/**
 * Web Audio based AudioManager.
 * No external sound files are required: short procedural samples are generated locally.
 * Replacing a procedural descriptor with an AudioBuffer later does not change callers.
 */
export class AudioManager{
  constructor(){
    this.ctx=null;this.enabled=true;this.started=false;this.lastStep=0;this.stepClock=0;this.ambientClock=0;this.musicClock=0;this.musicStep=0;this.entityClocks=new WeakMap();
    this.volumes=this.loadVolumes();this.pool=null;this.master=null;this.music=null;this.sfx=null;this.blocks=null;this.ambient=null;this.entities=null;this.ui=null;this.underwater=null;
    this.listenerReady=false;this.wasSubmerged=false;this.wasGrounded=false;this.lastSurface='stone';
  }
  loadVolumes(){try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...DEFAULTS}}}
  saveVolumes(){try{localStorage.setItem(KEY,JSON.stringify(this.volumes))}catch{}}
  start(){
    if(this.started){this.resume();return true}
    try{
      const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('Web Audio API unavailable');
      this.ctx=new C();
      this.master=this.ctx.createGain();this.music=this.ctx.createGain();this.sfx=this.ctx.createGain();this.blocks=this.ctx.createGain();this.ambient=this.ctx.createGain();this.entities=this.ctx.createGain();this.ui=this.ctx.createGain();
      this.underwater=this.ctx.createBiquadFilter();this.underwater.type='lowpass';this.underwater.frequency.value=18000;this.underwater.Q.value=.45;
      for(const [node,key] of [[this.music,'music'],[this.sfx,'sfx'],[this.blocks,'blocks'],[this.ambient,'ambient'],[this.entities,'entities']])node.connect(this.underwater);
      this.ui.connect(this.master);this.underwater.connect(this.master);this.master.connect(this.ctx.destination);
      this.pool=new SoundPool(this.ctx,Math.max(16,Math.min(36,Number(window.innerWidth)>900?32:20)));
      this.applyVolumes();this.started=true;this.enabled=true;this.resume();return true;
    }catch(e){this.enabled=false;console.warn('Audio disabled',e);return false}
  }
  resume(){if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});}
  ensure(){if(!this.started&&!this.start())return false;this.resume();return !!this.ctx&&this.enabled}
  setVolume(channel,value){if(!(channel in DEFAULTS))return;this.volumes[channel]=Math.max(0,Math.min(1,Number(value)||0));this.applyVolumes();this.saveVolumes()}
  getVolume(channel){return this.volumes[channel]??DEFAULTS[channel]}
  applyVolumes(){if(!this.master)return;this.master.gain.value=this.volumes.master;this.music.gain.value=this.volumes.music;this.sfx.gain.value=this.volumes.sfx;this.blocks.gain.value=this.volumes.blocks;this.ambient.gain.value=this.volumes.ambient;this.entities.gain.value=this.volumes.entities;this.ui.gain.value=this.volumes.sfx}
  categoryNode(category){return category==='music'?this.music:category==='blocks'?this.blocks:category==='ambient'?this.ambient:category==='entities'?this.entities:category==='ui'?this.ui:this.sfx}
  rand(a=.07){return 1+(Math.random()*2-1)*a}
  envelope(g,t,d,peak){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,peak),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d)}
  tone({freq=220,d=.08,type='triangle',gain=.08,slide=0,category='sfx',pitch=1,position=null}){
    if(!this.ensure())return;
    const t=this.ctx.currentTime,dest=this.categoryNode(category),g=this.ctx.createGain(),o=this.ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(Math.max(30,freq*pitch),t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,(freq+slide)*pitch),t+d);
    g.gain.value=1;this.envelope(g,t,d,gain*this.rand(.08));
    if(position){const item=this.pool.acquire();item.gain.gain.value=1;this.pool.connect(item,dest);this.pool.position(item,position.x,position.y,position.z);g.connect(item.gain);this.pool.reserve(item,d)}else g.connect(dest);
    o.start(t);o.stop(t+d+.015);
  }
  noise({d=.08,gain=.08,filter=1000,category='sfx',position=null}){
    if(!this.ensure())return;
    const t=this.ctx.currentTime,n=Math.max(1,Math.floor(this.ctx.sampleRate*d)),buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),a=buf.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,.7);
    const src=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=buf;f.type='lowpass';f.frequency.value=filter;this.envelope(g,t,d,gain*this.rand(.1));
    const dest=this.categoryNode(category);if(position){const item=this.pool.acquire();item.gain.gain.value=1;this.pool.connect(item,dest);this.pool.position(item,position.x,position.y,position.z);g.connect(item.gain)}else g.connect(dest);src.connect(f);f.connect(g);src.start(t);src.stop(t+d+.015);
  }
  play(name,{category='sfx',position=null,gain=1,pitch=.07}={}){
    const p=this.rand(pitch),pos=position;
    const n={click:[720,.045,'triangle',.055],inventory:[360,.08,'triangle',.065],chest:[150,.16,'triangle',.075],place:[180,.10,'square',.065],pickup:[520,.07,'triangle',.06],jump:[250,.13,'triangle',.06],land:[75,.12,'triangle',.075],hurt:[62,.15,'sawtooth',.07],eat:[280,.10,'triangle',.045],drown:[85,.26,'sine',.09],surface:[500,.11,'sine',.045],water:[220,.16,'sine',.05],cave:[72,.65,'sine',.025]}[name];
    if(!n)return;
    this.tone({freq:n[0],d:n[1],type:n[2],gain:n[3]*gain,category,pitch:p,position:pos,slide:name==='jump'?150:name==='pickup'?180:0});
  }
  uiClick(){this.play('click',{category:'ui',gain:.8})}
  inventory(){this.play('inventory',{category:'ui',gain:.8})}
  chest(open=true){this.play('chest',{category:'ui',gain:open?1:.75})}
  step(){
    if(!this.ensure())return;const p=this._game?.player;if(!p)return;
    const moving=Math.hypot(p.pos.x-(this._lastX??p.pos.x),p.pos.z-(this._lastZ??p.pos.z));this._lastX=p.pos.x;this._lastZ=p.pos.z;if(moving<.004)return;
    const sprint=!!p.sprint,interval=sprint?170:235;if(performance.now()-this.lastStep<interval)return;this.lastStep=performance.now();
    const x=Math.floor(p.pos.x),y=Math.floor(p.pos.y-.08),z=Math.floor(p.pos.z),id=this._game.world.getBlock(x,y,z),profile=profileForBlock(id);this.lastSurface=profile.steps;
    if(p.inWater||profile.steps==='water'){this.noise({d:.12,gain:.055,filter:750,category:'sfx',position:p.pos});this.tone({freq:120,d:.08,type:'sine',gain:.025,category:'sfx',position:p.pos})}
    else this.noise({d:.055,gain:sprint?.052:.035,filter:profile.steps==='snow'?500:900,category:'sfx',position:p.pos});
  }
  blockHit(id,pos){const profile=profileForBlock(id),hard=Math.max(.2,Number(INFO[id]?.hardness||profile.hardness||1));this.noise({d:.045+Math.min(.07,hard*.008),gain:.05,filter:profile.breaks==='wood'?750:profile.breaks==='sand'?550:1500,position:pos,category:'blocks'});this.tone({freq:profile.breaks==='wood'?95:profile.breaks==='sand'?70:130,d:.055,gain:.025,type:'triangle',position:pos,pitch:this.rand(.08),category:'blocks'})}
  blockBreak(id,pos){const profile=profileForBlock(id);this.noise({d:.12,gain:.10,filter:profile.breaks==='sand'?500:1200,position:pos,category:'blocks'});this.tone({freq:profile.breaks==='wood'?105:82,d:.10,gain:.04,type:'sine',position:pos,pitch:this.rand(.06),category:'blocks'})}
  blockPlace(id,pos){const profile=profileForBlock(id);this.noise({d:.07,gain:.065,filter:profile.breaks==='wood'?900:1300,position:pos,category:'blocks'});this.tone({freq:profile.breaks==='stone'?180:140,d:.08,gain:.025,type:'triangle',position:pos,pitch:this.rand(.06),category:'blocks'})}
  pickup(position){this.tone({freq:520,d:.07,type:'triangle',gain:.055,slide:180,position});this.tone({freq:740,d:.10,type:'triangle',gain:.03,slide:120,position,category:'sfx'})}
  block(){this.blockPlace(0,this._game?.player?.pos||null)}
  break(id=BLOCK.STONE,pos=null){this.blockBreak(id,pos||this._game?.player?.pos)}
  jump(){this.play('jump',{gain:.9})}
  land(speed=1){this.tone({freq:Math.max(45,90-speed*7),d:.08+Math.min(.1,speed*.01),type:'triangle',gain:Math.min(.12,.045+speed*.012),category:'sfx'});if(speed>7)this.noise({d:.12,gain:.08,filter:500,category:'sfx',position:this._game?.player?.pos})}
  hit(){this.noise({d:.065,gain:.075,filter:1500});this.tone({freq:125,d:.07,type:'square',gain:.03,slide:-45})}
  hurt(){this.play('hurt',{gain:1})}
  eat(){this.play('eat',{gain:.8});this.noise({d:.08,gain:.025,filter:500,category:'sfx'})}
  finishEat(){this.tone({freq:420,d:.14,type:'triangle',gain:.035,slide:140})}
  drown(){this.play('drown',{category:'ambient',gain:.7})}
  emerge(){this.play('surface',{category:'ambient',gain:.7})}
  waterSplash(pos){this.play('water',{category:'ambient',position:pos,gain:.7})}
  mobIdle(type,pos){const map={chicken:880,pig:115,cow:95,sheep:230,villager:180,fish:420,zombie:60};const f=map[type]??140;this.tone({freq:f,d:.14+Math.random()*.18,type:type==='zombie'?'sawtooth':'triangle',gain:.025,category:'entities',position:pos,pitch:this.rand(.1),slide:type==='chicken'?80:0})}
  mobHurt(type,pos){this.noise({d:.11,gain:.06,filter:700,category:'entities',position:pos});this.tone({freq:type==='chicken'?260:type==='cow'?85:145,d:.12,type:'sawtooth',gain:.035,category:'entities',position:pos,pitch:this.rand(.08)})}
  mobDeath(type,pos){this.noise({d:.18,gain:.075,filter:900,category:'entities',position:pos});this.tone({freq:type==='chicken'?210:type==='cow'?70:120,d:.2,type:'sawtooth',gain:.04,category:'entities',position:pos,slide:-35})}
  update(dt,game){
    if(!this.started||!this.ctx||!this.enabled)return;this._game=game;this.resume();
    const cam=game.camera,l=this.ctx.listener;
    if(cam&&l){const p=cam.getWorldPosition?.(game.THREE?new game.THREE.Vector3():undefined);if(p){if('positionX' in l){l.positionX.value=p.x;l.positionY.value=p.y;l.positionZ.value=p.z}else l.setPosition(p.x,p.y,p.z)}const q=cam.getWorldDirection?.(this._dir||(this._dir=new game.THREE.Vector3()));if(q&&'forwardX' in l){l.forwardX.value=q.x;l.forwardY.value=q.y;l.forwardZ.value=q.z;l.upX.value=0;l.upY.value=1;l.upZ.value=0}else if(q)l.setOrientation(q.x,q.y,q.z,0,1,0)}
    const submerged=!!game.player?.submerged;if(submerged!==this.wasSubmerged){this.wasSubmerged=submerged;this.setUnderwater(submerged);if(submerged)this.drown();else this.emerge()}
    if(game.player){const p=game.player,grounded=!!p.onGround; if(!this.wasGrounded&&grounded&&this._fallSpeed>2)this.land(this._fallSpeed);this.wasGrounded=grounded;this._fallSpeed=Math.max(0,-(p.vel?.y||0));}
    this.ambientClock-=dt;if(this.ambientClock<=0){this.ambientClock=8+Math.random()*12;const p=game.player;const y=p.pos.y;const underground=y<game.world.cfg.WORLD.SEA_LEVEL-5;const block=game.world.getBlock(Math.floor(p.pos.x),Math.floor(p.pos.y),Math.floor(p.pos.z));if(underground&&!p.submerged)this.play('cave',{category:'ambient',gain:.7,position:p.pos});else if(!p.submerged&&INFO[block]?.liquid)this.waterSplash(p.pos)}
    this.updateEntities(game,dt);
    this.updateMusic(game,dt);
  }
  updateMusic(game,dt){
    if(this.getVolume('music')<=0)return;this.musicClock-=dt;if(this.musicClock>0)return;this.musicClock=2.8;
    const phase=(game.time%720)/720;const night=phase<.25||phase>.75;
    const notes=night?[110,165,220,277]:[146.8,196,246.9,293.7];const f=notes[this.musicStep++%notes.length];
    this.tone({freq:f,d:1.9,type:'sine',gain:.018,category:'music',pitch:this.rand(.025)});
    if(!game.player?.submerged)this.tone({freq:f*1.5,d:1.2,type:'triangle',gain:.009,category:'music',pitch:this.rand(.02)});
  }
  updateEntities(game,dt){
    const list=game.mobs?.mobs||[];for(const mob of list){if(!mob.alive)continue;let left=this.entityClocks.get(mob);if(left==null)left=10+Math.random()*15;left-=dt;if(left<=0){const dist=mob.pos.distanceTo(game.player.pos);if(dist>=6&&dist<=40)this.mobIdle(mob.type,mob.pos);left=10+Math.random()*15}this.entityClocks.set(mob,left)}
  }
  setUnderwater(on){if(!this.underwater)return;const t=this.ctx.currentTime;this.underwater.frequency.cancelScheduledValues(t);this.underwater.frequency.linearRampToValueAtTime(on?850:18000,t+.28)}
  attachGame(game){this._game=game}
}
