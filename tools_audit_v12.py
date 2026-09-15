from pathlib import Path
import re
root=Path('.')
js=list(root.glob('js53/**/*.js'))
assert (root/'js53/input/InputTouchFilter.js').exists()
assert (root/'js53/world/WaterPhysicsController.js').exists()
assert (root/'js53/inventory/InventoryStackHandler.js').exists()
assert (root/'js53/rendering/PixelMaterialFactory64.js').exists()
assert (root/'js53/entities/MobTextureFactory.js').exists()
assert '78.0' in (root/'index.html').read_text()
print('modules:',len(js),'OK')
print('texture PNGs:',sum(1 for p in (root/'assets/textures64').rglob('*.png')),'OK')
