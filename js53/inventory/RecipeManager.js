import {BLOCK, ITEM, INFO, ICON} from "../world/Block.js";

/**
 * Minecraft-like recipe registry. `gridSize` is the minimum crafting grid
 * required by the recipe. `shaped` recipes use a matrix; `shapeless` recipes
 * use an ingredient list and ignore slot positions.
 */
export class RecipeManager {
  constructor(){
    this.recipes = Object.freeze([
      this.shaped("planks", "Доски ×4", 2, [[BLOCK.LOG]], {id:BLOCK.PLANKS,count:4}),
      this.shaped("sticks", "Палки ×4", 2, [[BLOCK.PLANKS],[BLOCK.PLANKS]], {id:ITEM.STICK,count:4}),
      this.shaped("crafting_table", "Верстак", 2, [[BLOCK.PLANKS,BLOCK.PLANKS],[BLOCK.PLANKS,BLOCK.PLANKS]], {id:ITEM.CRAFTING_TABLE,count:1}),
      this.shaped("torch", "Факел ×4", 2, [[BLOCK.COAL],[ITEM.STICK]], {id:ITEM.TORCH,count:4}),
      this.shaped("wood_pickaxe", "Деревянная кирка", 3, [[BLOCK.PLANKS,BLOCK.PLANKS,BLOCK.PLANKS],[null,ITEM.STICK,null],[null,ITEM.STICK,null]], {id:ITEM.WOOD_PICK,count:1}),
      this.shaped("stone_pickaxe", "Каменная кирка", 3, [[BLOCK.COBBLE,BLOCK.COBBLE,BLOCK.COBBLE],[null,ITEM.STICK,null],[null,ITEM.STICK,null]], {id:ITEM.STONE_PICK,count:1}),
      this.shaped("iron_pickaxe", "Железная кирка", 3, [[ITEM.IRON_INGOT,ITEM.IRON_INGOT,ITEM.IRON_INGOT],[null,ITEM.STICK,null],[null,ITEM.STICK,null]], {id:ITEM.IRON_PICK,count:1}),
      this.shaped("diamond_pickaxe", "Алмазная кирка", 3, [[ITEM.DIAMOND,ITEM.DIAMOND,ITEM.DIAMOND],[null,ITEM.STICK,null],[null,ITEM.STICK,null]], {id:ITEM.DIAMOND_PICK,count:1}),
      this.shaped("wood_axe", "Деревянный топор", 3, [[BLOCK.PLANKS,BLOCK.PLANKS,null],[BLOCK.PLANKS,ITEM.STICK,null],[null,ITEM.STICK,null]], {id:ITEM.WOOD_AXE,count:1}),
      this.shaped("stone_axe", "Каменный топор", 3, [[BLOCK.COBBLE,BLOCK.COBBLE,null],[BLOCK.COBBLE,ITEM.STICK,null],[null,ITEM.STICK,null]], {id:ITEM.STONE_AXE,count:1}),
      this.shaped("sword", "Каменный меч", 3, [[BLOCK.COBBLE],[BLOCK.COBBLE],[ITEM.STICK]], {id:ITEM.SWORD,count:1}),
      this.shaped("shovel", "Деревянная лопата", 3, [[BLOCK.PLANKS],[ITEM.STICK],[ITEM.STICK]], {id:ITEM.WOOD_SHOVEL,count:1}),
      this.shaped("hoe", "Мотыга", 3, [[BLOCK.PLANKS,BLOCK.PLANKS],[null,ITEM.STICK],[null,ITEM.STICK]], {id:ITEM.HOE,count:1}),
      this.shaped("lantern", "Фонарь", 2, [[ITEM.IRON_INGOT],[ITEM.TORCH]], {id:ITEM.LANTERN,count:1}),
      this.shaped("furnace", "Печь", 3, [[BLOCK.COBBLE,BLOCK.COBBLE,BLOCK.COBBLE],[BLOCK.COBBLE,null,BLOCK.COBBLE],[BLOCK.COBBLE,BLOCK.COBBLE,BLOCK.COBBLE]], {id:BLOCK.FURNACE,count:1}),
      this.shaped("chest", "Сундук", 3, [[BLOCK.PLANKS,BLOCK.PLANKS,BLOCK.PLANKS],[BLOCK.PLANKS,null,BLOCK.PLANKS],[BLOCK.PLANKS,BLOCK.PLANKS,BLOCK.PLANKS]], {id:ITEM.CHEST,count:1}),
      this.shaped("bread", "Хлеб", 3, [[ITEM.WHEAT,ITEM.WHEAT,ITEM.WHEAT]], {id:ITEM.BREAD,count:1}),
      this.shaped("bed", "Кровать", 3, [[ITEM.WOOL,ITEM.WOOL,ITEM.WOOL],[BLOCK.PLANKS,BLOCK.PLANKS,BLOCK.PLANKS]], {id:ITEM.BED,count:1}),
      this.shaped("campfire", "Костёр", 3, [[null,ITEM.STICK,null],[ITEM.STICK,BLOCK.COAL,ITEM.STICK],[BLOCK.LOG,BLOCK.LOG,BLOCK.LOG]], {id:ITEM.CAMPFIRE,count:1}),
      this.shapeless("cobble", "Булыжник ×2", 2, [{id:BLOCK.STONE,count:2}], {id:BLOCK.COBBLE,count:2}),
      this.shapeless("moss", "Мох ×2", 2, [{id:BLOCK.DIRT,count:1},{id:BLOCK.GRASS,count:1}], {id:BLOCK.MOSS,count:2}),
      this.shapeless("leather", "Кожа ×2", 2, [{id:ITEM.RAW_MEAT,count:1}], {id:ITEM.LEATHER,count:2}),
      this.shapeless("bread_simple", "Хлеб ×2", 2, [{id:ITEM.WHEAT,count:3}], {id:ITEM.BREAD,count:2}),
      this.shaped("leather_helmet", "Кожаный шлем", 3, [[ITEM.LEATHER,ITEM.LEATHER,ITEM.LEATHER],[ITEM.LEATHER,null,ITEM.LEATHER]], {id:ITEM.LEATHER_HELM,count:1}),
      this.shaped("leather_chest", "Кожаная куртка", 3, [[ITEM.LEATHER,null,ITEM.LEATHER],[ITEM.LEATHER,ITEM.LEATHER,ITEM.LEATHER],[ITEM.LEATHER,ITEM.LEATHER,ITEM.LEATHER]], {id:ITEM.LEATHER_CHEST,count:1}),
      this.shaped("leather_legs", "Кожаные поножи", 3, [[ITEM.LEATHER,ITEM.LEATHER,ITEM.LEATHER],[ITEM.LEATHER,null,ITEM.LEATHER],[ITEM.LEATHER,null,ITEM.LEATHER]], {id:ITEM.LEATHER_LEGS,count:1}),
      this.shaped("leather_boots", "Кожаные ботинки", 3, [[ITEM.LEATHER,null,ITEM.LEATHER],[ITEM.LEATHER,null,ITEM.LEATHER]], {id:ITEM.LEATHER_BOOTS,count:1}),
      this.shaped("shield", "Щит", 3, [[BLOCK.PLANKS,ITEM.IRON_INGOT,BLOCK.PLANKS],[BLOCK.PLANKS,BLOCK.PLANKS,BLOCK.PLANKS],[null,BLOCK.PLANKS,null]], {id:ITEM.SHIELD,count:1})
    ]);
    this.byId=new Map(this.recipes.map(r=>[r.id,r]));
  }
  shaped(id,name,gridSize,pattern,out){return Object.freeze({id,name,type:"shaped",gridSize,pattern,out:Object.freeze(out),width:pattern[0].length,height:pattern.length})}
  shapeless(id,name,gridSize,ingredients,out){return Object.freeze({id,name,type:"shapeless",gridSize,ingredients:Object.freeze(ingredients.map(x=>Object.freeze({...x}))),out:Object.freeze(out),width:1,height:1})}
  getAll(){return this.recipes}
  getForGrid(size){return this.recipes.filter(r=>r.gridSize<=size && r.width<=size && r.height<=size)}
  getById(id){return this.byId.get(id)||null}
  icon(id){return ICON[id]||"·"}
  name(id){return INFO[id]?.name||`Предмет ${id}`}
}

export const RECIPE_MANAGER = new RecipeManager();
export const RECIPES_2X2 = RECIPE_MANAGER.getForGrid(2);
export const RECIPES_3X3 = RECIPE_MANAGER.getForGrid(3);
