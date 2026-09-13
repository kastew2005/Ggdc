export class PixelButton{
  constructor(el,{audio=null,haptic=10}={}){this.el=el;this.audio=audio;this.haptic=haptic;this.bind()}
  bind(){if(!this.el||this.el.__pixelButton)return;this.el.__pixelButton=true;this.el.classList.add('pixelButton');this.el.addEventListener('pointerenter',()=>this.el.classList.add('is-hover'));this.el.addEventListener('pointerleave',()=>{this.el.classList.remove('is-hover');this.release()});this.el.addEventListener('pointerdown',e=>{if(this.el.disabled)return;this.el.classList.add('is-pressed');this.el.setPointerCapture?.(e.pointerId);this.audio?.ensure?.();this.audio?.uiClick?.();navigator.vibrate?.(this.haptic);this.ripple(e)}, {passive:true});['pointerup','pointercancel','lostpointercapture'].forEach(t=>this.el.addEventListener(t,()=>this.release()));}
  release(){this.el.classList.remove('is-pressed')}
  ripple(e){const r=this.el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,s=document.createElement('i');s.className='pixelRipple';s.style.left=x+'px';s.style.top=y+'px';this.el.appendChild(s);setTimeout(()=>s.remove(),420)}
}
