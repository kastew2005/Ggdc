import THREE from "../three.js";

/*
 * WebGL hybrid GI pipeline.
 *
 * Important platform note:
 * Three.js r159 + WebGLRenderer cannot expose DXR hardware ray tracing.
 * Therefore "RT" mode uses the same voxel-friendly temporal GI interface but
 * falls back to screen-space/temporal bounce on browsers (including iOS).
 * A native/WebGPU/DXR backend can replace this class later without changing
 * materials: the public API is intentionally backend-neutral.
 */
export class GIRendererController {
  constructor(renderer, scene, camera, world, quality) {
    this.renderer=renderer;this.scene=scene;this.camera=camera;this.world=world;this.quality=quality;
    this.enabled=false;this.mode="mobile";this.strength=0;this.frame=0;this.read=null;this.write=null;this.giRead=null;this.giWrite=null;this.quadScene=null;this.quadCamera=null;this.quad=null;this.giMaterial=null;
    this.resize();
    this.setPreset(quality?.tier||"medium");
  }
  _target(w,h){
    const depth=new THREE.DepthTexture(w,h,THREE.UnsignedIntType);depth.minFilter=THREE.NearestFilter;depth.magFilter=THREE.NearestFilter;
    const t=new THREE.WebGLRenderTarget(w,h,{depthTexture:depth,depthBuffer:true,stencilBuffer:false,format:THREE.RGBAFormat,type:THREE.UnsignedByteType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
    t.texture.generateMipmaps=false;return t;
  }
  resize(){
    const s=this.renderer?.getSize(new THREE.Vector2())||new THREE.Vector2(1,1);const d=Math.min(1,this.renderer?.getPixelRatio?.()||1);const w=Math.max(1,Math.floor(s.x*d)),h=Math.max(1,Math.floor(s.y*d));
    if(this.width===w&&this.height===h&&this.read)return;this.width=w;this.height=h;
    for(const t of [this.read,this.write,this.giRead,this.giWrite])t?.dispose();
    this.read=this._target(w,h);this.write=this._target(w,h);this.giRead=this._target(Math.max(1,w>>1),Math.max(1,h>>1));this.giWrite=this._target(Math.max(1,w>>1),Math.max(1,h>>1));
    if(!this.quadScene){this.quadScene=new THREE.Scene();this.quadCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));this.quadScene.add(this.quad);}
    this.giMaterial=new THREE.ShaderMaterial({depthWrite:false,depthTest:false,uniforms:{uColor:{value:null},uTexel:{value:new THREE.Vector2(1/w,1/h)},uIntensity:{value:this.strength}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,fragmentShader:`varying vec2 vUv;uniform sampler2D uColor;uniform vec2 uTexel;uniform float uIntensity;void main(){vec3 c=texture2D(uColor,vUv).rgb*0.04; c+=texture2D(uColor,vUv+vec2(uTexel.x*3.0,0.0)).rgb*0.12; c+=texture2D(uColor,vUv-vec2(uTexel.x*3.0,0.0)).rgb*0.12; c+=texture2D(uColor,vUv+vec2(0.0,uTexel.y*3.0)).rgb*0.12; c+=texture2D(uColor,vUv-vec2(0.0,uTexel.y*3.0)).rgb*0.12; c+=texture2D(uColor,vUv+uTexel*vec2(2.0,2.0)).rgb*0.10; c+=texture2D(uColor,vUv-uTexel*vec2(2.0,2.0)).rgb*0.10; gl_FragColor=vec4(c*uIntensity,1.0);}`});this.quad.material=this.giMaterial;
  }
  setPreset(tier){
    this.quality.tier=tier;
    if(tier==='ultra'){this.mode='rt-fallback';this.enabled=true;this.strength=.22}
    else if(tier==='high'){this.mode='ssgi';this.enabled=true;this.strength=.16}
    else if(tier==='medium'){this.mode='probes';this.enabled=true;this.strength=.07}
    else {this.mode='mobile';this.enabled=false;this.strength=0}
    this.giMaterial&&(this.giMaterial.uniforms.uIntensity.value=this.strength);
  }
  setRayTracingPreferred(v){ if(v && this.quality.tier==='high'){this.mode='rt-fallback';this.enabled=true;this.strength=.22} else this.setPreset(this.quality.tier); }
  render(){
    if(!this.enabled){this.renderer.render(this.scene,this.camera);return;}
    try{
      this.frame++;
      // Three.js setViewport() uses CSS/logical pixels and multiplies them by
      // the renderer pixel ratio internally. The GI targets are already sized
      // in physical pixels, so passing target.width directly here double-scales
      // the viewport on mobile (for example .68 x .68), leaving the rest of the
      // canvas black. Always convert target pixels back to logical pixels.
      const pr=Math.max(.0001,this.renderer.getPixelRatio?.()||1);
      const fullW=this.width/pr,fullH=this.height/pr;
      const giW=this.giWrite.width/pr,giH=this.giWrite.height/pr;

      // Materials sample the previous temporal bounce. This avoids read/write feedback.
      this.world?.pbr?.setGITexture(this.giRead.texture);

      this.renderer.setScissorTest(false);
      this.renderer.setRenderTarget(this.write);
      this.renderer.setViewport(0,0,fullW,fullH);
      this.renderer.clear();
      this.renderer.render(this.scene,this.camera);

      // Build a cheap low-frequency indirect buffer from the current frame.
      this.giMaterial.uniforms.uColor.value=this.write.texture;
      this.giMaterial.uniforms.uTexel.value.set(1/this.width,1/this.height);
      this.renderer.setRenderTarget(this.giWrite);
      this.renderer.setViewport(0,0,giW,giH);
      this.renderer.clear();
      this.renderer.render(this.quadScene,this.quadCamera);

      // Composite the rendered scene back to the complete canvas.
      this.renderer.setRenderTarget(null);
      this.renderer.setViewport(0,0,fullW,fullH);
      this.renderer.render(this.sceneToScreen(this.write.texture),this.quadCamera);

      const t=this.read;this.read=this.write;this.write=t;
      const g=this.giRead;this.giRead=this.giWrite;this.giWrite=g;
    }catch(err){
      // Never let the optional GI pipeline blank the game on a mobile GPU.
      console.warn("GI fallback:",err);
      this.enabled=false;this.strength=0;
      this.world?.pbr?.setGI(0,false);
      this.renderer.setRenderTarget(null);
      this.renderer.setScissorTest(false);
      const s=this.renderer.getSize(new THREE.Vector2());
      this.renderer.setViewport(0,0,s.x,s.y);
      this.renderer.render(this.scene,this.camera);
    }
  }
  sceneToScreen(texture){
    if(!this.screenMaterial)this.screenMaterial=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
    this.screenMaterial.map=texture;this.screenMaterial.needsUpdate=false;this.quad.material=this.screenMaterial;return this.quadScene;
  }
  dispose(){for(const t of [this.read,this.write,this.giRead,this.giWrite])t?.dispose();this.quad?.geometry?.dispose();this.giMaterial?.dispose();this.screenMaterial?.dispose();}
}
