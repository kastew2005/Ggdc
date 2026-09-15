/** Tap/drag gate for mobile and mouse interactions. Sessions are namespaced by subsystem. */
export class InputTouchFilter {
  constructor({dragThreshold=12,cooldownMs=250}={}){this.dragThreshold=dragThreshold;this.cooldownMs=cooldownMs;this.sessions=new Map();this.blockedUntil=0}
  key(e,kind='world'){return `${kind}:${e.pointerId??'mouse'}`}
  now(){return performance.now()}
  begin(e,kind='world'){const p={id:e.pointerId??'mouse',x:e.clientX||0,y:e.clientY||0,moved:false,kind,type:e.pointerType||'mouse'};this.sessions.set(this.key(e,kind),p);return p}
  move(e,kind='world'){const p=this.sessions.get(this.key(e,kind));if(!p)return false;const dx=(e.clientX||0)-p.x,dy=(e.clientY||0)-p.y;if(!p.moved&&Math.hypot(dx,dy)>this.dragThreshold){p.moved=true;this.armCooldown()}return p.moved}
  end(e,kind='world'){const key=this.key(e,kind),p=this.sessions.get(key);if(!p)return{tap:false,drag:false};this.sessions.delete(key);return{tap:!p.moved,drag:p.moved,kind:p.kind,type:p.type}}
  cancel(e,kind='world'){this.sessions.delete(this.key(e,kind));this.armCooldown()}
  armCooldown(ms=this.cooldownMs){this.blockedUntil=Math.max(this.blockedUntil,this.now()+ms)}
  canInteract(){return this.now()>=this.blockedUntil}
  cancelAll(){this.sessions.clear();this.armCooldown()}
}
