/**
 * Lightweight Web Audio node pool.
 * PannerNode/GainNode are reusable; BufferSource/OscillatorNode are one-shot by design.
 * This keeps the number of long-lived audio graph nodes small on mobile Safari.
 */
export class SoundPool {
  constructor(ctx, size=24){
    this.ctx=ctx; this.size=Math.max(4,size|0); this.items=[]; this.cursor=0;
    for(let i=0;i<this.size;i++)this.items.push(this.make());
  }
  make(){
    const gain=this.ctx.createGain();
    const panner=this.ctx.createPanner();
    panner.panningModel='HRTF'; panner.distanceModel='inverse';
    panner.refDistance=2; panner.maxDistance=56; panner.rolloffFactor=1.25;
    gain.connect(panner);
    return {gain,panner,busyUntil:0};
  }
  acquire(){
    const now=this.ctx.currentTime;
    let best=null;
    for(let i=0;i<this.items.length;i++){
      const idx=(this.cursor+i)%this.items.length, item=this.items[idx];
      if(item.busyUntil<=now){best=item;this.cursor=(idx+1)%this.items.length;break}
      if(!best||item.busyUntil<best.busyUntil)best=item;
    }
    return best;
  }
  connect(item,destination){item.panner.disconnect();item.panner.connect(destination);return item}
  position(item,x,y,z){
    const p=item.panner;
    if('positionX' in p){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z}
    else p.setPosition(x,y,z);
  }
  reserve(item,duration){item.busyUntil=this.ctx.currentTime+Math.max(.03,duration)+.025}
}
