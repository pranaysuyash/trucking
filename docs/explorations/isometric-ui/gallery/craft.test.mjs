import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../../../../products/product-04-asset-studio/node_modules/three/build/three.module.js';
import {mergeGeometries} from '../../../../products/product-04-asset-studio/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from '../../../../products/product-04-asset-studio/node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {buildStudy} from './scenes.mjs';
import {createSurfaceLibrary,batchSemanticParts} from './scene-craft.mjs';
const cases=JSON.parse(fs.readFileSync(new URL('../cases.json',import.meta.url),'utf8'));
const surface=createSurfaceLibrary(THREE);
const inspectables=root=>{const ids=new Set();root.traverse(o=>{if(o.userData.inspectable)ids.add(o.userData.entityId);});return [...ids].sort();};
const meshCount=root=>{let n=0;root.traverse(o=>{if(o.isMesh)n++;});return n;};
function dispose(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}

test('all 120 crafted studies retain physical bounds, semantic selection IDs and finite geometry',()=>{
  let removed=0;
  for(const c of cases){
    const study=buildStudy(THREE,c),before=new THREE.Box3().setFromObject(study.root,true),ids=inspectables(study.root);
    surface.apply(study.root,RoundedBoxGeometry);const result=batchSemanticParts(THREE,study.root,mergeGeometries);removed+=result.removedParts;
    const after=new THREE.Box3().setFromObject(study.root,true);
    // Rounding removes corners inside the original envelope. Batching must not move it.
    assert.ok(before.clone().expandByScalar(.0001).containsBox(after),c.id+' stays inside authored envelope');
    assert.ok(before.min.distanceTo(after.min)<.044&&before.max.distanceTo(after.max)<.044,c.id+' chamfer is bounded by 25 mm');
    assert.deepEqual(inspectables(study.root),ids,c.id+' selection identity');
    study.root.traverse(o=>{if(o.geometry)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value),c.id+' finite vertex');});
    dispose(study.root);
  }
  assert.ok(removed>1000,'Dense decorative parts should actually batch');
});
test('batched cargo remains ray-selectable through its retained handling-unit owner',()=>{
  const study=buildStudy(THREE,cases.find(c=>c.id==='CF-02'));
  surface.apply(study.root,RoundedBoxGeometry);batchSemanticParts(THREE,study.root,mergeGeometries);
  const ray=new THREE.Raycaster(new THREE.Vector3(0,.65,5),new THREE.Vector3(0,0,-1));
  const hit=ray.intersectObject(study.root,true).find(h=>h.object.isMesh&&!h.object.userData.editHandle);
  assert.ok(hit);let owner=hit.object;while(owner&&!owner.userData.inspectable)owner=owner.parent;
  assert.equal(owner.userData.entityId,'CF-02:HU-01');
  const handles=[];study.root.traverse(o=>{if(o.userData.editHandle)handles.push(o.userData.editHandle.field);});assert.equal(handles.length,3);
  dispose(study.root);
});
test('warehouse batching reduces opaque meshes without removing rack or unit identities',()=>{
  const study=buildStudy(THREE,cases.find(c=>c.id==='WH-04')),before=meshCount(study.root);
  surface.apply(study.root,RoundedBoxGeometry);batchSemanticParts(THREE,study.root,mergeGeometries);
  const after=meshCount(study.root);assert.ok(after<before*.55,`${before} to ${after}`);
  assert.ok(inspectables(study.root).includes('WH-04:preferred-R01-B02-L02-A'));dispose(study.root);
});

test('portrait and wide camera fits keep every asymmetric envelope corner visible with reserved label rails',async()=>{
  const {fitOrthographic}=await import('./camera-fit.mjs');
  const box=new THREE.Box3(new THREE.Vector3(-7,0,-1.3),new THREE.Vector3(11,4.7,2.1));
  for(const aspect of [.65,1.4,2.4])for(const inset of [0,.21]){
    const camera=new THREE.OrthographicCamera(),target=new THREE.Vector3();
    fitOrthographic(THREE,camera,target,box,{aspect,direction:new THREE.Vector3(1,1,1).normalize(),horizontalInset:inset});
    camera.updateMatrixWorld();
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
      const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1-inset*2&&Math.abs(p.y)<1,'Physical envelope clears the requested rails');
    }
  }
});
test('independent repeated subjects resolve uniquely and evidence/thermal studies expose their declared unknowns',async()=>{
  const {collectSubjects}=await import('./selection.mjs');
  const c=cases.find(c=>c.id==='CC-10'),study=buildStudy(THREE,c),subjects=collectSubjects(study.root);
  const vehicleSubjects=subjects.filter(o=>o.name==='node-vehicle');assert.equal(vehicleSubjects.length,6);assert.equal(new Set(vehicleSubjects.map(o=>o.userData.entityId)).size,6);dispose(study.root);
  const thermal=buildStudy(THREE,cases.find(c=>c.id==='TM-03'));assert.ok(thermal.anchors.some(a=>a.text.includes('setpoint 34')));assert.ok(thermal.anchors.some(a=>a.text.includes('Mode not supplied')));dispose(thermal.root);
  const evidence=buildStudy(THREE,cases.find(c=>c.id==='TR-12'));assert.ok(evidence.anchors.some(a=>a.text.includes('Expires 01 Nov 2026')));assert.ok(evidence.anchors.some(a=>a.text.includes('Insurer verification missing')));dispose(evidence.root);
});
