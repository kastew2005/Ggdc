import {getItemData,createItemStack,cloneItemStack} from './ItemData.js';

/** Centralized Minecraft-like stack operations and touch charge pickup. */
export class InventoryStackHandler {
  constructor(ui,{holdDelay=280,chargeDuration=900}={}){this.ui=ui;this.holdDelay=holdDelay;this.chargeDuration=chargeDuration;this.active=null}
  max(id){return getItemData(id).max_stack||64}
  clear(){if(this.active?.timer)clearTimeout(this.active.timer);if(this.active?.raf)cancelAnimationFrame(this.active.raf);this.active=null;this.ui.clearCharge?.()}
  takeWhole(index){const s=this.ui.inv.slots[index];if(!s?.id)return false;this.ui.cursor=createItemStack(s.id,s.count);s.id=0;s.count=0;this.ui.inv.durability[index]=0;return true}
  takeAmount(index,n){const s=this.ui.inv.slots[index];if(!s?.id)return false;const amount=Math.max(1,Math.min(s.count|0,n|0));this.ui.cursor=createItemStack(s.id,amount);s.count-=amount;if(!s.count){s.id=0;this.ui.inv.durability[index]=0}return true}
  put(index,amount=this.ui.cursor.count){const c=this.ui.cursor;if(!c?.id||amount<=0)return false;const s=this.ui.inv.slots[index];if(s.id&&s.id!==c.id)return false;const max=this.max(c.id),space=max-(s.count||0),n=Math.min(space,amount);if(n<=0)return false;s.id=c.id;s.count=(s.count||0)+n;c.count-=n;if(!c.count)this.ui.cursor=createItemStack();return true}
  swap(index){const old=cloneItemStack(this.ui.inv.slots[index]);this.ui.inv.slots[index]=createItemStack(this.ui.cursor.id,this.ui.cursor.count);this.ui.cursor=old;return true}
  shift(index){const fromHot=index>=27,range=fromHot?[0,27]:[27,36];let moved=false;for(let i=range[0];i<range[1];i++){if(i===index)continue;const a=this.ui.inv.slots[index],b=this.ui.inv.slots[i];if(!a?.id)break;if(b.id&&b.id!==a.id)continue;const n=Math.min(this.max(a.id)-(b.count||0),a.count);if(n<=0)continue;if(!b.id)b.id=a.id;b.count=(b.count||0)+n;a.count-=n;moved=true;if(!a.count){a.id=0;this.ui.inv.durability[index]=0;break}}return moved}
  takeFromArray(arr,index){const s=arr[index];if(!s?.id)return false;this.ui.cursor=createItemStack(s.id,s.count);s.id=0;s.count=0;return true}
  takeHalfFromArray(arr,index){const s=arr[index];if(!s?.id)return false;const n=Math.ceil(s.count/2);this.ui.cursor=createItemStack(s.id,n);s.count-=n;if(!s.count)s.id=0;return true}
  putToArray(arr,index,amount=this.ui.cursor.count){const c=this.ui.cursor;if(!c?.id||amount<=0)return false;const s=arr[index];if(s.id&&s.id!==c.id)return false;const max=this.max(c.id),space=max-(s.count||0),n=Math.min(space,amount);if(n<=0)return false;s.id=c.id;s.count=(s.count||0)+n;c.count-=n;if(!c.count)this.ui.cursor=createItemStack();return true}
  swapArraySlot(arr,index){const old=cloneItemStack(arr[index]);arr[index]=createItemStack(this.ui.cursor.id,this.ui.cursor.count);this.ui.cursor=old;return true}
  shiftBetweenArrays(fromArr,fromIndex,toArr){const a=fromArr[fromIndex];if(!a?.id)return false;let moved=false;for(let i=0;i<toArr.length;i++){const b=toArr[i];if(b.id&&b.id!==a.id)continue;const n=Math.min(this.max(a.id)-(b.count||0),a.count);if(n<=0)continue;if(!b.id)b.id=a.id;b.count=(b.count||0)+n;a.count-=n;moved=true;if(!a.count)break}if(!a.count)a.id=0;return moved}
  amountAt(index,elapsed,mode='take'){
    const s=this.ui.inv.slots[index];
    const source=mode==='take'?(s?.count||0):(this.ui.cursor?.count||0);
    if(!source)return 0;
    const p=Math.max(0,Math.min(1,(elapsed-this.holdDelay)/this.chargeDuration));
    return Math.max(1,Math.min(source,Math.ceil(source*p)));
  }
  startCharge(index,e){this.clear();const touch=e.pointerType==='touch'||e.pointerType==='pen';if(!touch)return false;const slot=e.currentTarget,start=performance.now(),mode=this.ui.cursor?.id?'place':'take';this.active={index,start,slot,timer:null,raf:0,mode};const tick=()=>{if(!this.active)return;const elapsed=performance.now()-start;const p=Math.max(0,Math.min(1,(elapsed-this.holdDelay)/this.chargeDuration));this.ui.showCharge?.(slot,p,this.amountAt(index,elapsed,mode));if(elapsed<this.holdDelay+this.chargeDuration)this.active.raf=requestAnimationFrame(tick)};this.active.raf=requestAnimationFrame(tick);return true}
  finishCharge(){const a=this.active;if(!a)return null;const elapsed=performance.now()-a.start,index=a.index,mode=a.mode;this.clear();if(elapsed<this.holdDelay)return null;const n=this.amountAt(index,elapsed,mode);if(mode==='take')return this.takeAmount(index,n)?n:null;const before=this.ui.cursor?.count||0;if(!before)return null;return this.put(index,n)?(before-(this.ui.cursor?.count||0)):null}
}
