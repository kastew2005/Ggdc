import THREE from '../three.js';

/** Native 64x64 pixel-art material factory. Textures are generated locally, deterministically and filtered with NearestFilter. */
export class PixelMaterialFactory64 {
  constructor(){this.cache=new Map()}
  texture(name,base='#777777',accent=null,kind='noise'){
    if(this.cache.has(name))return this.cache.get(name);
    const size=64,data=new Uint8Array(size*size*4);let seed=0;for(const c of name)seed=(seed*31+c.charCodeAt(0))|0;
    const rnd=()=>{seed=(seed*1664525+1013904223)|0;return(seed>>>0)/4294967296};
    const hex=v=>{v=v.replace('#','');return[parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)]};
    const b=hex(base),a=accent?hex(accent):null;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      let v=Math.round((rnd()-.5)*18),r=b[0]+v,g=b[1]+v,bl=b[2]+v;
      const cell=((x>>3)+(y>>3)*17)%11;
      if(kind==='grass_top'){g+=20;if(cell===0){r-=14;g-=5;bl-=7}}
      if(kind==='grass_side'){if(y<10){g+=20;r-=6}else if(cell===0){g-=14;r-=7;bl-=3}}
      if(kind==='dirt'&&cell===0){r-=18;g-=12;bl-=7}
      if(kind==='stone'&&cell===0){r+=18;g+=17;bl+=15}
      if(kind==='cobble'){const seam=x%16<2||y%16<2;if(seam){r-=30;g-=29;bl-=27}}
      if(kind==='wood'){const grain=Math.sin(x*.22+y*.04)*8;r+=grain;g+=grain*.7;bl+=grain*.4;if(x%17===0){r-=20;g-=14;bl-=9}}
      if(kind==='log_top'){const d=Math.hypot(x-32,y-32),ring=Math.sin(d*.72)*9;r+=ring;g+=ring*.65;bl+=ring*.4;if(d<4){r-=28;g-=20;bl-=12}}
      if(kind==='leaves'){if(rnd()<.14){r-=18;g-=15;bl-=9}}
      if(kind==='brick'&&(x%16<2||y%8<2)){r-=30;g-=28;bl-=25}
      if(kind==='ore'&&a&&rnd()<.055){r=a[0];g=a[1];bl=a[2]}
      if(kind==='glass'){r=Math.max(145,r);g=Math.max(185,g);bl=Math.max(200,bl)}
      const i=(y*size+x)*4;data[i]=Math.max(0,Math.min(255,r));data[i+1]=Math.max(0,Math.min(255,g));data[i+2]=Math.max(0,Math.min(255,bl));data[i+3]=(kind==='leaves'&&rnd()<.12)?0:255;
    }
    const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;this.cache.set(name,t);return t;
  }
  material(name,base,accent,kind,opts={}){return new THREE.MeshLambertMaterial({color:0xffffff,map:this.texture(name,base,accent,kind),side:THREE.DoubleSide,...opts})}
}
