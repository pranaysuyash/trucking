import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

export function createPresentation(renderer,scene,camera){
  scene.background=new THREE.Color('#e8edf1');
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);
  scene.environment=environment.texture;scene.environmentIntensity=.34;room.dispose();pmrem.dispose();
  const hemi=new THREE.HemisphereLight('#e5edfa','#697886',.36);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff0d9',2.65);sun.position.set(-16,32,18);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;sun.shadow.radius=3;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#b2cfff',.36);fill.position.set(18,12,-22);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),new THREE.ShadowMaterial({color:'#44596d',opacity:.19}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const ao=new GTAOPass(scene,camera,1,1);ao.updateGtaoMaterial({radius:.32,distanceExponent:1.3,thickness:.6,scale:1,samples:8});
  ao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:4,rings:2,samples:8});ao.blendIntensity=1.05;composer.addPass(ao);
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.055,.35,1.1);composer.addPass(bloom);
  const finish=new ShaderPass({uniforms:{tDiffuse:{value:null},resolution:{value:new THREE.Vector2(1,1)},blur:{value:.32}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 resolution;uniform float blur;varying vec2 vUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      void main(){vec4 col=texture2D(tDiffuse,vUv);float r=smoothstep(.36,.49,abs(vUv.y-.5))*blur;
      col=(col*4.+texture2D(tDiffuse,vUv+vec2(r,0.)/resolution)+texture2D(tDiffuse,vUv-vec2(r,0.)/resolution)+texture2D(tDiffuse,vUv+vec2(0.,r)/resolution)+texture2D(tDiffuse,vUv-vec2(0.,r)/resolution))/8.;
      col.rgb*=1.-.055*dot(vUv-.5,vUv-.5);col.rgb+=(hash(vUv*resolution)-.5)*.0015;gl_FragColor=col;}`});
  composer.addPass(finish);composer.addPass(new SMAAPass());composer.addPass(new OutputPass());
  let quality='studio';
  return {
    setQuality(value){quality=value==='simple'?'simple':'studio';},
    fitLight(bounds){const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),span=Math.max(size.x,size.y,size.z,4);
      ground.position.y=bounds.min.y-.025;sun.position.copy(center).add(new THREE.Vector3(-.8*span,1.65*span,1.05*span));sun.target.position.copy(center);
      Object.assign(sun.shadow.camera,{left:-span,right:span,top:span,bottom:-span,near:.1,far:span*6});sun.shadow.camera.updateProjectionMatrix();
      ao.updateGtaoMaterial({radius:Math.min(.65,Math.max(.08,span*.025))});renderer.shadowMap.needsUpdate=true;
    },
    setSize(w,h){composer.setSize(w,h);finish.uniforms.resolution.value.set(w*renderer.getPixelRatio(),h*renderer.getPixelRatio());},
    render(){renderer.info.autoReset=false;renderer.info.reset();if(quality==='studio')composer.render();else renderer.render(scene,camera);},
    dispose(){composer.dispose();environment.dispose();scene.remove(ground,sun,sun.target,fill,hemi);ground.geometry.dispose();ground.material.dispose();}
  };
}
