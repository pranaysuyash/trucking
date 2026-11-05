// Captured layouts share one selected fixture. These are inspectable review
// surfaces, not embedded product workflows or physical-device evidence.
const viewports=[
  {id:'desktop',name:'Desktop',width:1440,height:1024,x:-5.8},
  {id:'tablet',name:'Tablet',width:834,height:1112,x:.4},
  {id:'mobile',name:'Phone',width:390,height:844,x:4.4}
];
let textures;
export async function loadResponsiveTextures(THREE){
  if(textures)return textures;
  const loader=new THREE.TextureLoader();
  const loaded=await Promise.all(viewports.map(v=>loader.loadAsync(`references/responsive/${v.id}.png`)));
  loaded.forEach(texture=>{texture.colorSpace=THREE.SRGBColorSpace;});
  textures=loaded;return textures;
}
export function buildResponsiveStudy(THREE){
  if(!textures)throw new Error('Responsive captures are not loaded');
  const root=new THREE.Group(),anchors=[];
  viewports.forEach((v,i)=>{
    const height=5.5,width=height*v.width/v.height;
    const group=new THREE.Group();group.position.set(v.x,.4+height/2,0);
    group.userData={inspectable:true,entityId:`PF-10:viewport-${v.width}`,label:`${v.name} / ${v.width} px`,description:`Captured CF-02 at ${v.width} × ${v.height} CSS pixels. HU 01 is selected in every view. The captured browser layout is shown at its actual aspect ratio; this is browser emulation, not a physical-device test.`};
    const frame=new THREE.Mesh(new THREE.BoxGeometry(width+.16,height+.16,.12),new THREE.MeshStandardMaterial({color:'#23354d',roughness:.65}));
    frame.castShadow=true;group.add(frame);
    const image=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:textures[i],toneMapped:false}));
    image.position.z=.071;group.add(image);root.add(group);
    anchors.push({text:`${v.name} · ${v.width} × ${v.height} px · HU 01`,position:[v.x,.05,0]});
  });
  const bounds=new THREE.Box3().setFromObject(root);
  return {root,anchors,bounds,cameraBounds:bounds,summary:{description:'Three captured browser compositions preserve the same selected HU 01. Compare the persistent desktop rail, tighter tablet composition and stacked phone flow. Open the actual gallery at each width to inspect controls; these panels are captured review surfaces.',fixtureMetrics:viewports.map(v=>({label:v.name+' CSS width',value:v.width,unit:'px'}))}};
}
