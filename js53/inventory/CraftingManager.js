import {createItemStack} from "./ItemData.js";

function cleanGrid(grid){return grid.map(s=>({id:Number(s?.id)||0,count:Math.max(0,Number(s?.count)||0)}))}
function trimPattern(pattern){
  let top=0,bottom=pattern.length-1,left=Infinity,right=-1;
  while(top<=bottom && pattern[top].every(v=>v==null)){top++}
  while(bottom>=top && pattern[bottom].every(v=>v==null)){bottom--}
  for(let y=top;y<=bottom;y++)for(let x=0;x<pattern[y].length;x++)if(pattern[y][x]!=null){left=Math.min(left,x);right=Math.max(right,x)}
  if(right<0)return [[null]];
  const out=[];for(let y=top;y<=bottom;y++)out.push(pattern[y].slice(left,right+1));return out;
}
function matrixMatch(grid,size,pattern,ox,oy){
  const p=trimPattern(pattern),ph=p.length,pw=p[0].length;
  if(ox+pw>size||oy+ph>size)return false;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const expected=(x>=ox&&x<ox+pw&&y>=oy&&y<oy+ph)?(p[y-oy][x-ox]??0):0;
    const actual=grid[y*size+x]?.id||0;
    if(expected!==actual)return false;
  }
  return true;
}

export class CraftingManager {
  constructor(game,recipeManager){this.game=game;this.recipeManager=recipeManager;this.revision=0}
  grid(){return this.game.craftMode==="table"?this.game.craftGrid3:this.game.craftGrid2}
  gridSize(){return Math.sqrt(this.grid().length)}
  recipes(){return this.recipeManager.getForGrid(this.gridSize())}
  inventoryCount(id){return this.game.inventory.slots.reduce((n,s)=>n+(s.id===id?s.count:0),0)}
  hasIngredients(recipe,mult=1){for(const x of this.ingredients(recipe))if(this.inventoryCount(x.id)<x.count*mult)return false;return true}
  ingredients(recipe){return recipe.type==="shapeless"?recipe.ingredients:this.patternIngredients(recipe.pattern)}
  patternIngredients(pattern){const m=new Map();for(const row of pattern)for(const id of row)if(id!=null)m.set(id,(m.get(id)||0)+1);return [...m].map(([id,count])=>({id,count}))}
  findMatch(grid=this.grid(),recipes=this.recipes()){
    const size=Math.sqrt(grid.length);if(!Number.isInteger(size))return null;const clean=cleanGrid(grid);
    for(const recipe of recipes){
      if(recipe.gridSize>size||recipe.width>size||recipe.height>size)continue;
      if(recipe.type==="shapeless"){
        const need=new Map(this.ingredients(recipe).map(x=>[x.id,x.count]));
        const actual=new Map();let filled=0;
        for(const s of clean)if(s.id&&s.count){actual.set(s.id,(actual.get(s.id)||0)+s.count);filled+=s.count}
        const neededTotal=[...need.values()].reduce((a,b)=>a+b,0);
        if(filled!==neededTotal||need.size!==actual.size)continue;
        let ok=true;for(const [id,n] of need)if(actual.get(id)!==n)ok=false;
        if(ok)return {recipe,offset:{x:0,y:0}};
      }else{
        for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(matrixMatch(clean,size,recipe.pattern,x,y))return {recipe,offset:{x,y}};
      }
    }
    return null;
  }
  canAdd(id,count){
    let capacity=0;const max=64;
    for(const s of this.game.inventory.slots){if(s.id===id)capacity+=Math.max(0,max-s.count);else if(!s.id)capacity+=max}
    return capacity>=count;
  }
  removeInventoryIngredients(recipe,mult=1){const need=this.ingredients(recipe).map(x=>({...x,count:x.count*mult}));for(const x of need)if(!this.game.inventory.has(x.id,x.count))return false;for(const x of need)this.game.inventory.remove(x.id,x.count);return true}
  addOutput(recipe,mult=1){return this.game.inventory.addDetailed(recipe.out.id,recipe.out.count*mult).remaining===0}
  craftFromGrid(recipeMatch=this.findMatch()){
    if(!recipeMatch)return false;const {recipe,offset}=recipeMatch,grid=this.grid();
    if(!this.canAdd(recipe.out.id,recipe.out.count))return false;
    const consume=()=>{
      if(recipe.type==="shapeless")return this.removeFromGridShapeless(grid,recipe);
      const p=trimPattern(recipe.pattern);for(let y=0;y<p.length;y++)for(let x=0;x<p[y].length;x++)if(p[y][x]!=null){const s=grid[(offset.y+y)*Math.sqrt(grid.length)+offset.x+x];s.count--;if(s.count<=0){s.id=0;s.count=0}}
      return true;
    };
    if(!consume())return false;
    if(!this.addOutput(recipe)){this.restoreRecipeToGrid(grid,recipe,offset);return false}
    this.revision++;return true;
  }
  removeFromGridShapeless(grid,recipe){let remaining=new Map(this.ingredients(recipe).map(x=>[x.id,x.count]));for(const s of grid)if(s.id&&remaining.has(s.id)){const n=Math.min(s.count,remaining.get(s.id));s.count-=n;remaining.set(s.id,remaining.get(s.id)-n);if(s.count<=0){s.id=0;s.count=0}}return [...remaining.values()].every(v=>v===0)}
  restoreRecipeToGrid(grid,recipe,offset){if(recipe.type==="shapeless"){for(const x of this.ingredients(recipe)){const slot=grid.find(s=>s.id===x.id)||grid.find(s=>!s.id);if(slot){slot.id=x.id;slot.count=(slot.count||0)+x.count}}return}const size=Math.sqrt(grid.length),p=trimPattern(recipe.pattern);for(let y=0;y<p.length;y++)for(let x=0;x<p[y].length;x++)if(p[y][x]!=null){const s=grid[(offset.y+y)*size+offset.x+x];s.id=p[y][x];s.count=(s.count||0)+1}}
  clearGridToInventory(){const grid=this.grid();for(const s of grid){if(!s.id||!s.count)continue;const r=this.game.inventory.addDetailed(s.id,s.count);if(r.remaining>0)this.game.mining?.spawnDrop?.(s.id,r.remaining,{x:Math.floor(this.game.player.pos.x),y:Math.floor(this.game.player.pos.y),z:Math.floor(this.game.player.pos.z)});s.id=0;s.count=0}this.revision++}
  returnGridToInventory(grid){for(const s of grid||[]){if(!s.id||!s.count)continue;const r=this.game.inventory.addDetailed(s.id,s.count);if(r.remaining>0)this.game.mining?.spawnDrop?.(s.id,r.remaining,{x:Math.floor(this.game.player.pos.x),y:Math.floor(this.game.player.pos.y),z:Math.floor(this.game.player.pos.z)});s.id=0;s.count=0}}
  autoFill(recipe){
    const grid=this.grid(),size=Math.sqrt(grid.length);if(recipe.gridSize>size)return false;
    // Existing ingredients are returned first so the operation is transactional.
    this.returnGridToInventory(grid);
    if(!this.hasIngredients(recipe))return false;
    const take=(id,n)=>{if(!this.game.inventory.remove(id,n))return false;return true};
    if(recipe.type==="shapeless"){
      const list=this.ingredients(recipe);for(let i=0;i<list.length;i++){const x=list[i],slot=grid[i];take(x.id,x.count);slot.id=x.id;slot.count=x.count}this.revision++;return true;
    }
    const p=trimPattern(recipe.pattern),ox=Math.floor((size-p[0].length)/2),oy=Math.floor((size-p.length)/2);
    for(let y=0;y<p.length;y++)for(let x=0;x<p[y].length;x++){const id=p[y][x];if(id==null)continue;take(id,1);const s=grid[(oy+y)*size+ox+x];s.id=id;s.count=1}
    this.revision++;return true;
  }
  maxCraftable(recipe){
    let n=Infinity;for(const x of this.ingredients(recipe))n=Math.min(n,Math.floor(this.inventoryCount(x.id)/x.count));
    if(!Number.isFinite(n))n=0;return Math.max(0,n);
  }
  craftAll(recipe){
    const maxByIngredients=this.maxCraftable(recipe);if(!maxByIngredients)return 0;
    const perOutput=recipe.out.count;let maxBySpace=Math.floor(this.outputCapacity(recipe.out.id)/perOutput);let amount=Math.min(maxByIngredients,maxBySpace);let made=0;
    for(let i=0;i<amount;i++){if(!this.removeInventoryIngredients(recipe,1))break;if(!this.addOutput(recipe,1)){for(const x of this.ingredients(recipe))this.game.inventory.add(x.id,x.count);break}made++}
    this.revision++;return made;
  }
  outputCapacity(id){let capacity=0;for(const s of this.game.inventory.slots){if(s.id===id)capacity+=64-s.count;else if(!s.id)capacity+=64}return capacity}
  signature(){const g=this.grid().map(s=>`${s.id}:${s.count}`).join(",");const inv=this.game.inventory.slots.map(s=>`${s.id}:${s.count}`).join(",");return `${this.game.craftMode}|${g}|${inv}|${this.revision}`}
}

export {createItemStack};
