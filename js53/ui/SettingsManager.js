const KEY='voxel-survival-ui-settings-v1';
const DEFAULTS={
  renderDistance:12, graphics:'detailed', smoothLighting:true, guiScale:'auto', fullscreen:false, maxFPS:0,
  master:1, music:.42, sfx:.80, blocks:.80, entities:.80, ambient:.55,
  mouseSensitivity:8, invertMouse:false
};
export class SettingsManager{
  constructor(game=null){this.game=game;this.data={...DEFAULTS,...this.load()};this.listeners=new Set()}
  load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
  get(key){return this.data[key]}
  set(key,value,{apply=true,save=true,notify=true}={}){if(!(key in DEFAULTS))return;this.data[key]=value;if(apply)this.apply(key);if(save)this.save();if(notify)this.emit(key);}
  update(values,{apply=true,save=true}={}){Object.assign(this.data,values);if(apply)this.applyAll();if(save)this.save();this.emit('*')}
  save(){try{localStorage.setItem(KEY,JSON.stringify(this.data))}catch{}}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
  emit(key){for(const fn of this.listeners)try{fn(this.data,key)}catch(e){console.warn('Settings listener',e)}}
  apply(key){const g=this.game;if(!g)return;const v=this.data;
    if(key==='renderDistance'){if(g.world){g.world.cfg.WORLD.RENDER_DISTANCE=Math.max(4,Math.min(32,Number(v.renderDistance)||12));g.world.lastCenter=''}}
    if(key==='graphics'){const tier=v.graphics==='fast'?'mobile':'high';g.setQuality?.(tier,false)}
    if(key==='master'||key==='music'||key==='sfx'||key==='blocks'||key==='ambient'||key==='entities')g.audio?.setVolume(key,v[key]);
    if(key==='mouseSensitivity'){const n=Math.max(.004,Math.min(.018,Number(v.mouseSensitivity)/1000));if(g.controls){g.controls.touchSensitivity=n;g.controls.touchPitchSensitivity=n;g.controls.sensitivity=Number(v.mouseSensitivity)*.0003125}try{localStorage.setItem('vs_camera_sensitivity_v73',String(n))}catch{}}
    if(key==='invertMouse'&&g.controls)g.controls.invertY=!!v.invertMouse;
    if(key==='fullscreen'&&v.fullscreen)this.fullscreen();
    this.applyGUI();
  }
  applyAll(){for(const k of Object.keys(DEFAULTS))this.apply(k);this.applyAudioChannels()}
  applyAudioChannels(){const a=this.game?.audio;if(!a)return;a.setVolume('master',this.data.master);a.setVolume('music',this.data.music);a.setVolume('sfx',this.data.sfx);a.setVolume('blocks',this.data.blocks);a.setVolume('ambient',this.data.ambient);a.setVolume('entities',this.data.entities)}
  applyGUI(){const raw=this.data.guiScale;let scale=1;if(raw==='auto')scale=Math.max(1,Math.min(3,Math.round(Math.min(innerWidth,innerHeight)/520)));else scale=Number(raw)||1;document.documentElement.style.setProperty('--gui-scale',String(scale));document.documentElement.dataset.guiScale=raw}
  async fullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();}catch{}}
  async toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen?.();else await document.documentElement.requestFullscreen?.();this.data.fullscreen=!!document.fullscreenElement;this.save();this.emit('fullscreen')}catch{}}
}
export const SETTINGS_DEFAULTS=DEFAULTS;
