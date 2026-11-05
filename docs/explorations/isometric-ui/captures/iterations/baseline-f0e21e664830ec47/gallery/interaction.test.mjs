import test from 'node:test';
import assert from 'node:assert/strict';
import {dimensionFromPointer,fixtureHistory,defaultFixture} from './fixture-editing.mjs';
import {reviewState,reviewCounts,validReviewContext,reviewContextKey,acceptReviewResponse} from './review-state.mjs';
import * as THREE from '../../../../products/product-04-asset-studio/node_modules/three/build/three.module.js';
import {buildStudy} from './scenes.mjs';
import fs from 'node:fs';

test('centred cargo dimension changes twice its face displacement at any projected angle',()=>{
  assert.equal(dimensionFromPointer({initial:1.2,start:[300,200],end:[340,180],axisPixels:[80,-40],multiplier:2,field:'length'}),2.2);
  assert.equal(dimensionFromPointer({initial:1.2,start:[300,200],end:[280,160],axisPixels:[80,-40],multiplier:2,field:'length'}),1.2);
});
test('height and wheelbase use full displacement and respect exact-input limits',()=>{
  assert.equal(dimensionFromPointer({initial:2.7,start:[0,0],end:[0,-100],axisPixels:[0,-100],field:'height'}),3.7);
  assert.equal(dimensionFromPointer({initial:6.1,start:[0,0],end:[200,0],axisPixels:[100,0],field:'wheelbase'}),8.1);
  assert.equal(dimensionFromPointer({initial:2,start:[0,0],end:[1000,0],axisPixels:[100,0],field:'width'}),4);
  assert.equal(dimensionFromPointer({initial:2,start:[0,0],end:[-1000,0],axisPixels:[100,0],field:'width'}),.2);
  assert.equal(dimensionFromPointer({initial:2,start:[0,0],end:[100,0],axisPixels:[0,0],field:'height'}),null);
});
test('one committed gesture is one undo step; new edit replaces the redo branch',()=>{
  const initial=defaultFixture('CF-02'),h=fixtureHistory(initial),edited={...initial,lengthM:2};
  assert.equal(h.canUndo,false);h.commit(edited);h.commit(edited);
  assert.deepEqual(h.undo(),initial);assert.deepEqual(h.redo(),edited);
  h.undo();h.commit({...initial,widthM:2});assert.equal(h.canRedo,false);
  assert.deepEqual(h.undo(),initial);
});
test('missing, fresh and changed reviews remain different without writing human records',()=>{
  const reviewContext={version:1,mode:'dimensions',phase:1,explode:0,fixture:null};
  assert.equal(reviewState(null,'r2'),'pending');
  assert.equal(reviewState({decision:'approved',revision:'r2',reviewContext},'r2'),'approved');
  assert.equal(reviewState({decision:'approved',revision:'r1',reviewContext},'r2'),'stale');
  assert.equal(reviewState({decision:'approved',revision:'r2'},'r2'),'stale');
  assert.equal(reviewState({decision:'unknown',revision:'r2'},'r2'),'pending');
  assert.deepEqual(reviewCounts([{id:'A'},{id:'B'},{id:'C'}],{A:{decision:'revise',revision:'r2',reviewContext},B:{decision:'approved',revision:'r1',reviewContext}},'r2'),{pending:1,approved:0,revise:1,deferred:0,stale:1});
});
test('review context distinguishes edited fixtures and delayed responses stay with submitted case',()=>{
  const context={version:1,mode:'dimensions',phase:1,explode:0,fixture:defaultFixture('CF-02')};
  assert.equal(validReviewContext(context,'CF-02'),true);
  const changed={...context,fixture:{...context.fixture,lengthM:2}};
  assert.notEqual(reviewContextKey(context),reviewContextKey(changed));
  assert.equal(validReviewContext({...changed,fixture:{...changed.fixture,lengthM:0}},'CF-02'),false);
  const decisions={},submission={caseId:'CF-02',revision:'r2'},entry={...submission,decision:'revise',reviewContext:changed};
  assert.equal(acceptReviewResponse(decisions,submission,entry,'AS-05'),false);
  assert.equal(decisions['CF-02'],entry);assert.equal(decisions['AS-05'],undefined);
  assert.throws(()=>acceptReviewResponse(decisions,submission,{...entry,caseId:'AS-05'},'AS-05'));
});
test('rendered handles use the edited fixture axes, dimensions and centered multipliers',()=>{
  const cases=JSON.parse(fs.readFileSync(new URL('../cases.json',import.meta.url),'utf8'));
  const fixture={lengthM:14,widthM:2.3,heightM:2.5,wheelbaseM:5.8,massLb:17000};
  for(const id of ['CF-02','AS-05']){
    const study=buildStudy(THREE,cases.find(c=>c.id===id),{fixture}),handles={};
    study.root.traverse(o=>{if(o.userData.editHandle)handles[o.userData.editHandle.field]=o;});
    assert.deepEqual(Object.keys(handles).sort(),id==='AS-05'?['height','length','wheelbase','width']:['height','length','width']);
    assert.equal(handles.length.position.x,fixture.lengthM/2);
    assert.equal(handles.width.position.z,fixture.widthM/2);
    assert.equal(handles.height.position.y,fixture.heightM+(id==='AS-05'?1.2:0));
    assert.equal(handles.length.userData.editHandle.multiplier,2);
    assert.equal(handles.width.userData.editHandle.multiplier,2);
    assert.equal(handles.height.userData.editHandle.multiplier,1);
    if(id==='AS-05')assert.equal(handles.wheelbase.position.x,-fixture.lengthM/2-3.7+fixture.wheelbaseM);
    study.root.traverse(o=>{o.geometry?.dispose();});
  }
});
