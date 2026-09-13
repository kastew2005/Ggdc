import THREE from "../three.js";

// 64x64 PBR stack factory for voxel blocks.  Albedo comes from the existing
// local voxel texture generator; the remaining maps are generated deterministically
// so the project stays self-contained on GitHub Pages/iOS.
export class PBRMaterialFactory {
  constructor(cfg, world) {
    this.cfg = cfg;
    this.world = world;
    this.cache = new Map();
    this.quality = cfg.QUALITY?.tier || "medium";
  }

  _tex(data, channels=1, color=false) {
    const format = channels === 4 ? THREE.RGBAFormat : channels === 3 ? THREE.RGBFormat : THREE.RedFormat;
    const t = new THREE.DataTexture(data, 64, 64, format, THREE.UnsignedByteType);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.generateMipmaps = true; t.anisotropy = 1; t.flipY = false;
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }

  _deriveMaps(albedo, profile) {
    const src = albedo?.image?.data || new Uint8Array(64*64*4);
    const normal = new Uint8Array(64*64*4);
    const rough = new Uint8Array(64*64*4);
    const metal = new Uint8Array(64*64*4);
    const height = new Uint8Array(64*64*4);
    const emission = new Uint8Array(64*64*4);
    const h = new Float32Array(64*64);
    for (let i=0;i<h.length;i++) {
      const j=i*4; h[i]=(0.2126*src[j]+0.7152*src[j+1]+0.0722*src[j+2])/255;
    }
    const at=(x,y)=>h[((y+64)&63)*64+((x+64)&63)];
    for(let y=0;y<64;y++) for(let x=0;x<64;x++) {
      const i=y*64+x,j=i*4;
      const dx=at(x+1,y)-at(x-1,y), dy=at(x,y+1)-at(x,y-1);
      const nx=Math.max(-1,Math.min(1,-dx*2.0)), ny=Math.max(-1,Math.min(1,-dy*2.0)), nz=1;
      const l=Math.hypot(nx,ny,nz)||1;
      normal[j]=Math.round((nx/l*.5+.5)*255); normal[j+1]=Math.round((ny/l*.5+.5)*255); normal[j+2]=Math.round((nz/l*.5+.5)*255); normal[j+3]=255;
      height[j]=height[j+1]=height[j+2]=Math.round(h[i]*255);height[j+3]=255;
      const r=profile.roughness; rough[j]=rough[j+1]=rough[j+2]=Math.round(r*255);rough[j+3]=255;
      const m=profile.metalness; metal[j]=metal[j+1]=metal[j+2]=Math.round(m*255);metal[j+3]=255;
      const e=profile.emission || [0,0,0]; const strength=profile.emissionStrength||0;
      emission[j]=Math.min(255,Math.round(e[0]*strength)); emission[j+1]=Math.min(255,Math.round(e[1]*strength)); emission[j+2]=Math.min(255,Math.round(e[2]*strength)); emission[j+3]=255;
    }
    return {
      normal:this._tex(normal,4), roughness:this._tex(rough,4), metalness:this._tex(metal,4),
      height:this._tex(height,4), emission:this._tex(emission,4)
    };
  }

  _profile(file,id) {
    const f=String(file).toLowerCase();
    const metallic=/gold|iron|copper|diamond|ore/.test(f) ? .72 : /obsidian/.test(f) ? .25 : 0;
    let roughness=/water|glass/.test(f)?.18:/gold|diamond/.test(f)?.24:/iron|copper|ore/.test(f)?.34:/planks|wood|log/.test(f)?.72:/sand|dirt|stone|cobble|gravel|snow/.test(f)?.92:.78;
    let emission=[0,0,0], emissionStrength=0;
    if(/glowstone|lantern|campfire|water/.test(f) || this.world?.cfg && id!=null && this.world?.cfg) {
      const light=this.world?.cfg && this.world?.constructor ? null : null;
      if(/glowstone|lantern|campfire/.test(f)){ emission=[1,.48,.12]; emissionStrength=.9; }
    }
    if(id!=null && this.world?.cfg) {
      // Block.light is the authoritative emissive flag; avoid importing Block here.
      // The named profiles above cover the existing light-emitting blocks.
    }
    return {roughness,metalness:metallic,emission,emissionStrength,heightScale:this.quality==='high'?.045:this.quality==='medium'?.018:0};
  }

  create({id,file,color,map,opts={}}) {
    const key=`${id}|${file}|${this.quality}`;
    if(this.cache.has(key)) return this.cache.get(key);
    const p=this._profile(file,id), maps=this._deriveMaps(map,p);
    const material=new THREE.MeshStandardMaterial({
      color:0xffffff,map,
      normalMap:maps.normal,normalScale:new THREE.Vector2(.65,.65),
      roughness:p.roughness,roughnessMap:maps.roughness,
      metalness:p.metalness,metalnessMap:maps.metalness,
      emissive:new THREE.Color(p.emission[0],p.emission[1],p.emission[2]),
      emissiveMap:maps.emission,emissiveIntensity:p.emissionStrength,
      side:opts.side??THREE.DoubleSide,
      transparent:!!opts.transparent,opacity:opts.opacity??1,alphaTest:opts.alphaTest??0,
      depthWrite:opts.depthWrite!==false
    });
    material.userData.pbr64={maps,profile:p,blockId:id};
    material.userData.gi={enabled:this.quality!=='low',strength:this.quality==='high'?.32:this.quality==='medium'?.18:.0};
    material.onBeforeCompile=(shader)=>{
      shader.uniforms.uPOMEnabled={value:p.heightScale>0?1:0};
      shader.uniforms.uPOMScale={value:p.heightScale};
      shader.uniforms.uPOMMinLayers={value:this.quality==='high'?8:5};
      shader.uniforms.uPOMMaxLayers={value:this.quality==='high'?24:12};
      shader.uniforms.heightMap={value:maps.height};
      shader.uniforms.uGITexture={value:null};
      shader.uniforms.uViewport={value:new THREE.Vector2(1,1)};
      shader.uniforms.uGIStrength={value:material.userData.gi.strength};
      material.userData.shader=shader;
      shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvarying vec2 vPOMUv;\nvPOMUv = vMapUv;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <uv_pars_fragment>', '#include <uv_pars_fragment>\nvarying vec2 vPOMUv;\nuniform float uPOMEnabled; uniform float uPOMScale; uniform float uPOMMinLayers; uniform float uPOMMaxLayers; uniform sampler2D uGITexture; uniform vec2 uViewport; uniform float uGIStrength;\nvec2 pomTrace(vec2 uv, vec3 viewTS){ float nd=max(abs(viewTS.z),.12); float layers=mix(uPOMMaxLayers,uPOMMinLayers,nd); float stepSize=1.0/layers; vec2 delta=viewTS.xy/viewTS.z*uPOMScale/layers; vec2 cur=uv; float curLayer=0.0; float h=texture2D(heightMap,cur).r; for(int k=0;k<32;k++){ if(float(k)>=layers || curLayer>=h) break; cur-=delta; curLayer+=stepSize; h=texture2D(heightMap,cur).r; } return clamp(cur,.002,.998); }');
      shader.fragmentShader=shader.fragmentShader.replace('void main() {', 'void main() {\n  vec2 pomUv=vPOMUv;\n  if(uPOMEnabled>.5){ vec3 dp1=dFdx(-vViewPosition); vec3 dp2=dFdy(-vViewPosition); vec2 duv1=dFdx(pomUv); vec2 duv2=dFdy(pomUv); vec3 t=normalize(dp1*duv2.y-dp2*duv1.y); vec3 b=normalize(-dp1*duv2.x+dp2*duv1.x); vec3 vts=normalize(vec3(dot(t,-vViewPosition),dot(b,-vViewPosition),dot(normalize(cross(t,b)),-vViewPosition))); pomUv=pomTrace(pomUv,vts); }');
      shader.fragmentShader=shader.fragmentShader.replace(/vMapUv(?!\s*;)/g,'pomUv');
      // Replace the roughness/metalness/emission maps with the POM-shifted UV too.
      // The GI texture is intentionally a temporal screen-space bounce input, not a fake DXR claim.
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  if(uGIStrength>0.0){ vec2 guv=gl_FragCoord.xy/max(uViewport,vec2(1.0)); vec3 gi=texture2D(uGITexture,guv).rgb; totalEmissiveRadiance += gi*uGIStrength; }');
    };
    this.cache.set(key,material);return material;
  }

  setGITexture(tex) {
    for(const m of this.cache.values()) if(m.userData.shader) m.userData.shader.uniforms.uGITexture.value=tex;
  }
  setViewport(w,h){for(const m of this.cache.values())if(m.userData.shader)m.userData.shader.uniforms.uViewport.value.set(w,h);}
  setGI(strength,enabled=true){ for(const m of this.cache.values()){m.userData.gi.strength=enabled?strength:0;if(m.userData.shader)m.userData.shader.uniforms.uGIStrength.value=m.userData.gi.strength;} }
}
