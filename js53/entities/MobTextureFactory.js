import THREE from '../three.js';

// Original 64x64 pixel-art textures generated at runtime. No copyrighted skin is copied.
const cache=new Map();
const PALETTES={
 chicken:{base:[236,236,226],dark:[190,190,180],accent:[226,150,36],red:[185,48,48]},
 pig:{base:[242,151,164],dark:[190,102,118],accent:[238,118,134],red:[180,74,88]},
 sheep:{base:[238,237,225],dark:[190,189,175],accent:[120,108,95],red:[180,80,80]},
 cow:{base:[86,61,48],dark:[52,38,31],accent:[238,231,212],red:[220,145,130]},
 villager:{base:[180,124,92],dark:[91,66,55],accent:[72,111,98],red:[116,55,48]}
};
function tex(type,part){const key=type+':'+part;if(cache.has(key))return cache.get(key);const size=64,p=PALETTES[type]||PALETTES.cow,data=new Uint8Array(size*size*4);let seed=0;for(const c of key)seed=(seed*33+c.charCodeAt(0))|0;const rnd=()=>{seed=(seed*1664525+1013904223)|0;return(seed>>>0)/4294967296};for(let y=0;y<size;y++)for(let x=0;x<size;x++){let c=p.base.slice(),a=255;if(part==='side'){c=p.dark.slice();if((x>>3)%2===0)c=p.base.slice()}if(part==='top'){c=p.base.slice();if(((x>>2)+(y>>2))%7===0)c=p.dark.slice()}if(part==='head'){if(type==='cow'&&x>14&&x<50&&y>18&&y<48){c=p.accent.slice();if(x>25&&x<39&&y>28&&y<40)c=p.dark.slice()}if(type==='chicken'&&y>42){c=p.accent.slice()}if(type==='villager'){c=p.base.slice();if(y<16)c=p.dark.slice();if(y>28&&y<37&&(x<25||x>39))c=[35,30,28];if(x>28&&x<37&&y>35)c=[150,100,76]}if(type==='sheep'&&rnd()<.18)c=p.dark.slice()}if(part==='body'){if(type==='cow'&&((x>>3)+(y>>3))%5===0)c=p.accent.slice();if(type==='villager'&&y<20)c=p.accent.slice();if(type==='sheep'&&rnd()<.15)c=p.dark.slice()}if(part==='leg')c=p.dark.slice();if(part==='horn')c=[232,225,207];if(part==='beak')c=p.accent.slice();if(part==='comb')c=p.red.slice();const i=(y*size+x)*4;data[i]=c[0];data[i+1]=c[1];data[i+2]=c[2];data[i+3]=a}const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.wrapS=THREE.ClampToEdgeWrapping;t.wrapT=THREE.ClampToEdgeWrapping;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;cache.set(key,t);return t}
export function mobTexture(type,part='body'){return tex(type,part)}
export function mobMaterials(type,part='body'){const f=mobTexture(type,part),side=mobTexture(type,'side'),top=mobTexture(type,'top');return [new THREE.MeshLambertMaterial({map:side}),new THREE.MeshLambertMaterial({map:side}),new THREE.MeshLambertMaterial({map:top}),new THREE.MeshLambertMaterial({map:side}),new THREE.MeshLambertMaterial({map:f}),new THREE.MeshLambertMaterial({map:side})]}
