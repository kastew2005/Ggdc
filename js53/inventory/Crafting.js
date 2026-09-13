import {RECIPE_MANAGER,RECIPES_2X2,RECIPES_3X3} from "./RecipeManager.js";
import {CraftingManager} from "./CraftingManager.js";

// Backward-compatible facade for older code. New UI code uses CraftingManager.
export {RECIPE_MANAGER,RECIPES_2X2,RECIPES_3X3};
export function getCraftResult(grid,recipes){
  const size=Math.sqrt(grid.length), list=recipes||RECIPE_MANAGER.getForGrid(size);
  for(const r of list){
    if(r.gridSize>size||r.width>size||r.height>size)continue;
    const clean=grid.map(s=>({id:Number(s?.id)||0,count:Number(s?.count)||0}));
    if(r.type==="shapeless"){
      const need=new Map(r.ingredients.map(x=>[x.id,x.count])),actual=new Map();let total=0;
      for(const s of clean)if(s.id&&s.count){actual.set(s.id,(actual.get(s.id)||0)+s.count);total+=s.count}
      const needTotal=[...need.values()].reduce((a,b)=>a+b,0);if(total===needTotal&&need.size===actual.size&&[...need].every(([id,n])=>actual.get(id)===n))return {recipe:r,offset:{x:0,y:0}};
    }else{
      const p=r.pattern;for(let y=0;y<size;y++)for(let x=0;x<size;x++){let ok=x+p[0].length<=size&&y+p.length<=size;for(let gy=0;ok&&gy<size;gy++)for(let gx=0;gx<size;gx++){const exp=gx>=x&&gx<x+p[0].length&&gy>=y&&gy<y+p.length?(p[gy-y][gx-x]??0):0;if(exp!==(clean[gy*size+gx]?.id||0)){ok=false;break}}if(ok)return {recipe:r,offset:{x,y}}}
    }
  }
  return null;
}
export function craftGrid(grid,recipe,inv){
  const match=getCraftResult(grid,[recipe]);if(!match)return false;const p=recipe.type==="shaped"?recipe.pattern:null,size=Math.sqrt(grid.length);
  if(!inv.add)return false;
  const output=recipe.out; if(recipe.type==="shapeless"){for(const x of recipe.ingredients){let n=x.count;for(const s of grid)if(s.id===x.id&&n>0){const take=Math.min(n,s.count);s.count-=take;n-=take;if(!s.count)s.id=0}}}else{const ox=match.offset.x,oy=match.offset.y;for(let y=0;y<p.length;y++)for(let x=0;x<p[y].length;x++)if(p[y][x]!=null){const s=grid[(oy+y)*size+ox+x];s.count--;if(s.count<=0){s.id=0;s.count=0}}}
  if(!inv.add(output.id,output.count))return false;return true;
}
export {CraftingManager};
