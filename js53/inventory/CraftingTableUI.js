/** Small controller for the 3×3 crafting-table context. The actual slots are
 * rendered by InventoryUI so both contexts share the same touch interaction. */
export class CraftingTableUI {
  constructor(game,inventoryUI){this.game=game;this.inventoryUI=inventoryUI;this.opened=false}
  open(){this.opened=true;this.game.craftMode="table";this.game.craftingManager?.clearGridToInventory?.();this.inventoryUI?.open();this.inventoryUI?.render();}
  close(){if(!this.opened)return;this.opened=false;this.game.craftingManager?.returnGridToInventory?.(this.game.craftGrid3);this.game.craftMode="player";this.inventoryUI?.render();}
}
