// Presentation resources are bounded and shared by this renderer, never domain data.
export function createSurfaceLibrary(THREE){
  const textures=new Map();
  function texture(kind){
    if(textures.has(kind))return textures.get(kind);
    const size=128,data=new Uint8Array(size*size*4);let seed=2166136261;
    for(const ch of kind)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const n=random(),grain=kind==='wood'?Math.sin(y*.55+Math.sin(x*.07)*1.7)*7:kind==='metal'?Math.sin(y*2.8)*2:0;
      const value=Math.round(244+(n-.5)*(kind==='concrete'?18:kind==='wood'?12:6)+grain),i=(y*size+x)*4;
      data[i]=data[i+1]=data[i+2]=Math.max(0,Math.min(255,value));data[i+3]=255;
    }
    const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;
    t.userData.sharedPresentation=true;textures.set(kind,t);return t;
  }
  function apply(root,RoundedBoxGeometry){
    const made=new Map();
    root.traverse(o=>{
      if(!o.isMesh||!o.material?.isMeshStandardMaterial||o.userData.editHandle)return;
      if(RoundedBoxGeometry&&o.geometry.type==='BoxGeometry'){const p=o.geometry.parameters,min=Math.min(p.width,p.height,p.depth);if(min>.035){const old=o.geometry;o.geometry=new RoundedBoxGeometry(p.width,p.height,p.depth,1,Math.min(.025,min*.12));old.dispose();}}
      const name=o.name,kind=/runner|deck[0-9]|crate.*body/.test(name)?'wood':/study-plinth|floor|road|paving/.test(name)?'concrete':/paper|evidence.*paper/.test(name)?'paper':/beam|upright|chassis|silver|leveler|mast|wheel.*hub|container.*frame/.test(name)?'metal':'paint';
      const key=o.material.uuid+':'+kind;
      if(!made.has(key)){
        const m=o.material.clone();m.map=texture(kind);m.bumpMap=m.map;m.bumpScale=kind==='wood'?.009:kind==='concrete'?.006:.002;
        m.roughness=kind==='metal'?.36:kind==='wood'?.78:kind==='paper'?.9:.58;
        m.metalness=kind==='metal'?.48:.025;made.set(key,m);
      }
      o.material=made.get(key);
      const geo=o.geometry;if(!geo.attributes.normal||!geo.attributes.position)return;
      const uv=new Float32Array(geo.attributes.position.count*2),p=geo.attributes.position,n=geo.attributes.normal;
      for(let i=0;i<p.count;i++){
        const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));
        const a=ay>=ax&&ay>=az?p.getX(i):ax>=az?p.getZ(i):p.getX(i),b=ay>=ax&&ay>=az?p.getZ(i):p.getY(i);
        uv[i*2]=a*(kind==='wood'?1.5:2);uv[i*2+1]=b*(kind==='wood'?1.5:2);
      }
      geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    });
    return made.size;
  }
  return {apply,dispose(){textures.forEach(t=>t.dispose());textures.clear();}};
}

export function batchSemanticParts(THREE,root,mergeGeometries){
  let removed=0,batches=0;const groups=[];root.traverse(o=>{if(o.isGroup)groups.push(o);});
  for(const parent of groups){
    const buckets=new Map();
    for(const mesh of [...parent.children]){
      if(!mesh.isMesh||Array.isArray(mesh.material)||(mesh.material?.transparent&&!/:wrap-/.test(mesh.name))||mesh.userData.inspectable||mesh.userData.editHandle||mesh.children.length)continue;
      const key=[mesh.material.uuid,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder].join(':');
      if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(mesh);
    }
    for(const parts of buckets.values()){
      if(parts.length<3)continue;
      const geometries=parts.map(p=>{p.updateMatrix();const g=p.geometry.index?p.geometry.toNonIndexed():p.geometry.clone();g.applyMatrix4(p.matrix);return g;});
      let merged;try{merged=mergeGeometries(geometries,false);}finally{geometries.forEach(g=>g.dispose());}
      if(!merged)continue;
      const first=parts[0],batch=new THREE.Mesh(merged,first.material);
      batch.name='batch:'+parent.name+':'+batches++;batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.renderOrder=first.renderOrder;
      batch.userData={...first.userData,entityId:parent.userData.entityId,inspectable:false,batchedPartNames:parts.map(p=>p.name)};
      parent.add(batch);for(const p of parts){parent.remove(p);p.geometry.dispose();removed++;}
    }
  }
  root.updateMatrixWorld(true);return {batches,removedParts:removed};
}
