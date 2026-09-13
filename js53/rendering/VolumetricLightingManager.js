import THREE from "../three.js";

// Controls atmospheric shafts, exposure and the public graphics/GI preset.
// It deliberately stays independent from the GI backend so it also works on mobile.
export class VolumetricLightingManager {
  constructor(game){this.game=game;this.scene=game.scene;this.camera=game.camera;this.enabled=true;this.fogBoost=1;this.bounce=.1;this.exposure=1.05;this.time=0;}
  applyPreset(tier){
    const p={ultra:{bounce:.28,fogBoost:.68,exposure:1.08},high:{bounce:.18,fogBoost:.78,exposure:1.06},medium:{bounce:.08,fogBoost:.9,exposure:1.03},low:{bounce:0,fogBoost:1,exposure:1},mobile:{bounce:0,fogBoost:1,exposure:1}}[tier]||{bounce:.09,fogBoost:1,exposure:1.03};
    Object.assign(this,p);if(this.game.renderer)this.game.renderer.toneMappingExposure=this.exposure;this.game.gi?.setPreset(tier);this.game.world?.pbr?.setGI(this.bounce,this.bounce>0);
  }
  update(dt,dayPhase,player){this.time+=dt;if(!this.enabled)return;const day=Math.max(0,Math.sin(dayPhase));const cave=Math.max(0,1-Math.min(1,(player?.pos?.y||50)/45));if(this.game.light?.fog){this.game.light.fog.density=(.0035+(1-day)*.008)*this.fogBoost*(1+cave*.65);}}
}
