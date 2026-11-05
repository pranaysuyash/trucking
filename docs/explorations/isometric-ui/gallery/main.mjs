import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {positionAnnotations} from './annotations.mjs';
import {collectSubjects,subjectFromHit} from './selection.mjs';
import {fitOrthographic} from './camera-fit.mjs';
import {createPresentation} from './presentation.mjs';
import {createSurfaceLibrary,batchSemanticParts} from './scene-craft.mjs';
import { buildStudy } from './scenes.mjs';
import { loadResponsiveTextures, buildResponsiveStudy } from './responsive.mjs';
import { defaultFixture, fixtureFields, fixtureHistory, dimensionFromPointer } from './fixture-editing.mjs';
import {validReviewContext,reviewContextKey,reviewSummary,acceptReviewResponse} from './review-state.mjs';

const $ = id => document.getElementById(id);
const cases = await fetch('cases.json').then(r => r.json());
let decisions = await fetch('/api/decisions').then(r => r.json()).catch(() => ({}));
const visualRevision = await fetch('/api/revision').then(r=>r.json()).then(r=>r.revision);
const products = {cargo:'Cargo Fit',assets:'Asset Studio',warehouse:'Warehouse',yard:'Yard & Dock',telematics:'Fleet Telematics',pricing:'Freight Pricing',hos:'Hours of Service',trust:'Carrier Trust',command:'Command Center',platform:'Shared Platform'};
const state = { mode:'dimensions', phase:1, explode:0, selected:null, decision:null, view:'iso', fixture:{},activeAxis:'length',quality:matchMedia('(max-width:760px)').matches?'simple':'studio',annotations:true };
let current, study, labels = [], sceneRoot, frameRequested = false, selectionHelper;
let editHistory,dragSession=null,dimensionHandles=[];
const stage = $('stage');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#edf2f8');
const camera = new THREE.OrthographicCamera(-12,12,9,-9,.05,2000);
camera.position.set(22,19,25);
const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
stage.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Spatial model: drag to orbit, scroll to zoom');
const presentation=createPresentation(renderer,scene,camera);
const surfaces=createSurfaceLibrary(THREE);
let entities=[],contextLost=false;
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping=false;controls.minPolarAngle=.08;controls.maxPolarAngle=Math.PI/2-.025;
controls.addEventListener('change',invalidate);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function escapeText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function format(value){return typeof value==='number'?new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value):value;}
function invalidate(){delete stage.dataset.painted;if(!frameRequested){frameRequested=true;requestAnimationFrame(draw);}}
function draw(){
  frameRequested=false;
  const started=performance.now();if(contextLost)return;presentation.render();positionLabels();positionHandles();
  if(current){stage.dataset.painted=current.id;stage.dataset.renderMs=(performance.now()-started).toFixed(2);stage.dataset.drawCalls=String(renderer.info.render.calls);stage.dataset.geometry=String(renderer.info.memory.geometries);stage.dataset.camera=JSON.stringify({position:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom});}
  updateReviewBadge();
}
function reviewContext(){return {version:2,mode:state.mode,phase:state.phase,explode:state.explode,presentation:{quality:state.quality,annotations:state.annotations},fixture:['CF-02','AS-05'].includes(current.id)?{...state.fixture}:null};}
function updateReviewBadge(){
  if(!current)return;
  const saved=decisions[current.id],fresh=saved?.revision===visualRevision;
  const same=fresh&&validReviewContext(saved.reviewContext,current.id)&&reviewContextKey(saved.reviewContext)===reviewContextKey(reviewContext());
  $('decision-state').textContent=same?`${saved.decision.toUpperCase()} BY YOU`:fresh?'DIFFERENT VIEW · SAVED REVIEW RETAINED':saved?'UPDATED VISUAL · REVIEW AGAIN':'AWAITING YOUR REVIEW';
  $('review-context').textContent=fresh?`Your saved ${saved.decision} decision refers to: ${reviewSummary(saved.reviewContext)}.${same?'':' This fixture or scene state differs. Save a new decision to review this state.'}`:'A saved decision records fixture values and the layer/sequence state. Camera orbit is an inspection control.';
}
function disposeTree(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}

function rebuild({fit=false}={}){
  delete stage.dataset.painted;
  if(sceneRoot){scene.remove(sceneRoot);disposeTree(sceneRoot);}
  if(selectionHelper){scene.remove(selectionHelper);selectionHelper.dispose();selectionHelper=null;}
  study = current.id==='PF-10'?buildResponsiveStudy(THREE):buildStudy(THREE,current,{mode:state.mode,phase:state.phase,explode:state.explode,fixture:state.fixture});
  if(current.id==='PF-02')study.cameraBounds=study.bounds;
  sceneRoot = study.root;scene.add(sceneRoot);
  sceneRoot.updateMatrixWorld(true);
  sceneRoot.traverse(o=>{
    if(o.userData.editHandle)o.visible=false;
    if(current.id==='CF-01'&&o.isLineSegments&&/HU-01:selection/.test(o.name)){o.material.color.set('#ed7c36');o.material.opacity=1;}
    if(current.id==='WH-04'&&/preferred-cell/.test(o.name)&&o.material){o.material=o.material.clone();o.material.depthTest=false;o.renderOrder=100;}
    if(current.id==='CF-02'&&o.isMesh&&o.name.startsWith(state.activeAxis+':')){o.material=o.material.clone();o.material.color.set('#2364d9');}
  });
  const obsolete=new Set();sceneRoot.traverse(o=>{if(o.isMesh&&o.material)obsolete.add(o.material);});
  surfaces.apply(sceneRoot,RoundedBoxGeometry);
  const retained=new Set();sceneRoot.traverse(o=>{if(o.isMesh&&o.material)retained.add(o.material);});obsolete.forEach(m=>{if(!retained.has(m))m.dispose();});
  const batchResult=batchSemanticParts(THREE,sceneRoot,mergeGeometries);stage.dataset.batchedParts=String(batchResult.removedParts);
  const physical=['cargo','vehicle','facility'].includes(current.family);
  if(state.mode!=='dimensions'){
    const seen=new Set();sceneRoot.traverse(o=>{if(o.isMesh&&o.material&&!/study-plinth|grid:/.test(o.name))for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(!seen.has(m)){seen.add(m);if(state.mode==='volume'){m.transparent=true;m.opacity=Math.min(m.opacity,.32);m.depthWrite=false;}else m.wireframe=true;}});
  }
  const bounds = new THREE.Box3().setFromObject(sceneRoot);
  if(bounds.isEmpty())throw new Error(`Empty study ${current.id}`);
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  presentation.fitLight(bounds);
  document.querySelector('.workbench').dataset.annotationLayout=stage.clientWidth<760?'linear':'overlay';
  if(fit)fitCamera(study.cameraBounds||bounds);
  const allAnchors=study.anchors||[];
  const callouts=allAnchors.filter(a=>String(a.text).includes('\n')).sort((a,b)=>Number(/TOTAL RATE/.test(b.text))-Number(/TOTAL RATE/.test(a.text))).slice(0,8);
  const compact=allAnchors.filter(a=>!String(a.text).includes('\n')).slice(0,10);
  labels=[...callouts,...compact].map((a,i)=>{
    const isCompact=compact.includes(a);
    const element=document.createElement('div');element.className=`scene-label ${a.kind||state.mode} ${isCompact?'compact':''}`;
    const lines=String(a.text).split('\n');
    element.innerHTML=isCompact?`<b>${escapeText(a.text)}</b>`:`<span class="label-index">${String(i+1).padStart(2,'0')} / ${escapeText(lines.shift())}</span><b>${escapeText(lines.join('\n'))}</b>`;
    return {...a,element,isCompact};
  });
  const leaderLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');
  leaderLayer.classList.add('leader-layer');leaderLayer.setAttribute('aria-hidden','true');
  $('labels').replaceChildren(leaderLayer,...labels.map(a=>a.element));
  const sceneValues=Boolean(study.summary?.fixtureMetrics?.length);
  const metrics=sceneValues?study.summary.fixtureMetrics:current.metrics;
  $('metrics').innerHTML=metrics.slice(0,5).map(m=>`<div class="metric"><label>${sceneValues?'FIXTURE':'EXAMPLE'} / ${escapeText(m.label)}</label><strong>${escapeText(format(m.value))}</strong><small>${escapeText(m.unit||'')}</small></div>`).join('');
  $('fixture-note').textContent=sceneValues?'All objects and values are synthetic. These values describe the authored scene fixture; entered mass and other assumptions are declared inputs. No operational validation is implied.':'These quantities are example scenario inputs. This study does not derive or validate them from the drawn geometry. All objects are synthetic visual fixtures.';
  $('selected-title').textContent='A clearer view of the decision';
  $('selected-description').textContent=study.summary?.description||current.intent;
  entities=[];
  if(!sceneRoot.children.some(o=>o.userData.inspectable)&&current.family==='finance')sceneRoot.children.filter(o=>o.isMesh&&/^(money-(?!note)|total-rate-|remaining-clock-|remaining-duty|fuel-price)/.test(o.name)).forEach(o=>{o.userData.inspectable=true;o.userData.label=o.name.replaceAll('-',' ');o.userData.description=`${o.userData.label}. Selected synthetic financial quantity; values are listed in the study annotations.`;});
  entities=collectSubjects(sceneRoot);
  $('object-list').replaceChildren(...entities.slice(0,12).map(o=>{const b=document.createElement('button');b.textContent=o.userData.label||o.userData.name||String(o.userData.entityId).replaceAll('_',' ');b.dataset.entityId=o.userData.entityId;b.setAttribute('aria-pressed',String(state.selected===o.userData.entityId));b.addEventListener('click',()=>selectEntity(o));return b;}));
  $('object-picker').replaceChildren(new Option('Choose a scene object…',''),...entities.map(o=>new Option(o.userData.label||o.name,o.userData.entityId)));
  $('object-picker').value=state.selected||'';
  $('linear-details').innerHTML=`<p>${escapeText(study.summary?.coordinateFrame||'Declared scene scale')}. ${sceneValues?'Measures describe the authored fixture.':'Values are independent scenario inputs.'}</p><dl>${metrics.map(m=>`<div><dt>${escapeText(m.label)}</dt><dd>${escapeText(format(m.value))} ${escapeText(m.unit||'')}</dd></div>`).join('')}</dl><ol>${allAnchors.map(a=>`<li>${escapeText(a.text).replaceAll('\n',' · ')}</li>`).join('')}</ol>`;
  $('mobile-annotation-count').textContent=`${allAnchors.length} scene annotations`;
  $('mobile-annotation-list').innerHTML=allAnchors.map(a=>`<li>${escapeText(a.text).replaceAll('\n',' · ')}</li>`).join('');
  $('mobile-annotations').hidden=!state.annotations;
  $('scene-scale').textContent=study.summary?.coordinateFrame||'Declared semantic scale';
  $('measure-origin').textContent=sceneValues?'Authored fixture':'Scenario inputs';
  $('scene-count').textContent=`${entities.length} selectable subjects`;
  presentation.setQuality(state.quality);$('render-quality').value=state.quality;stage.dataset.quality=state.quality;
  $('labels').hidden=!state.annotations;$('mobile-annotations').hidden=!state.annotations;$('toggle-annotations').setAttribute('aria-pressed',String(state.annotations));
  const selected=entities.find(o=>o.userData.entityId===state.selected);if(selected)selectEntity(selected);else{state.selected=null;syncSelectionActions();}
  const modeText=document.querySelector(`[data-mode="${state.mode}"]`).textContent;
  $('view-status').textContent=`${modeText.toUpperCase()} · ${entities.length} SUBJECTS`;
  $('stage-loading').hidden=true;
  $('stage-loading').style.display='none';
  stage.dataset.ready=current.id;
  stage.dataset.entities=String(entities.length);
  stage.dataset.anchors=String(labels.length);
  stage.dataset.geometry=String(renderer.info.memory.geometries);
  stage.dataset.fixtureMetrics=JSON.stringify(metrics);
  stage.dataset.valuesOrigin=sceneValues?'authored scene fixture':'example scenario inputs';
  stage.dataset.revision=visualRevision;
  document.title=`${current.id} · ${current.title} / Trucking studies`;
  syncHandles();updateEditActions();
  invalidate();
}

function updateEditActions(){
  $('undo-fixture').disabled=!editHistory?.canUndo;
  $('redo-fixture').disabled=!editHistory?.canRedo;
  const initial=defaultFixture(current.id);
  $('reset-fixture').disabled=Object.keys(initial).every(key=>initial[key]===state.fixture[key]);
}
function writeFixture(value,{fit=false}={}){
  state.fixture={...value};
  for(const [field,key]of Object.entries({length:'lengthM',width:'widthM',height:'heightM',mass:'massLb',wheelbase:'wheelbaseM'})){$('fixture-'+field).value=String(state.fixture[key]);$('fixture-'+field).setAttribute('aria-invalid','false');}
  rebuild({fit});
}
function setEditing(enabled){
  if(dragSession)finishDrag(true);
  state.editing=enabled;$('edit-dimensions').setAttribute('aria-pressed',String(enabled));
  $('dimension-handles').hidden=!enabled;
  $('edit-status').textContent=enabled?`Drag L / W / H${current.id==='AS-05'?' / WB':''} handles. Arrow keys adjust 0.01 m; Shift adjusts 0.10 m. Escape cancels.`:'Numeric inputs edit this temporary fixture.';
  syncHandles();invalidate();
}
function axisOnScreen(object,axis){
  const start=object.getWorldPosition(new THREE.Vector3()),end=start.clone().add(new THREE.Vector3(...axis));
  start.project(camera);end.project(camera);
  return [(end.x-start.x)*stage.clientWidth/2,-(end.y-start.y)*stage.clientHeight/2];
}
function syncHandles(){
  const focusField=document.activeElement?.dataset?.handle;
  dimensionHandles=[];sceneRoot.traverse(object=>{if(object.userData.editHandle)dimensionHandles.push({object,...object.userData.editHandle});});
  $('dimension-handles').hidden=!state.editing;
  $('dimension-handles').replaceChildren(...dimensionHandles.map(handle=>{
    const rule=fixtureFields[handle.field],button=document.createElement('button');
    button.type='button';button.className='dimension-handle';button.dataset.handle=handle.field;
    button.textContent=rule.short;
    button.setAttribute('aria-label',`${rule.label} handle, ${state.fixture[rule.key]} metres. Drag or use arrow keys.`);
    button.addEventListener('pointerdown',event=>startDrag(event,handle));
    button.addEventListener('keydown',event=>{
      const sign=['ArrowRight','ArrowUp'].includes(event.key)?1:['ArrowLeft','ArrowDown'].includes(event.key)?-1:0;
      if(!sign)return;event.preventDefault();
      editHistory.commit(state.fixture);
      const value=Math.min(rule.max,Math.max(rule.min,state.fixture[rule.key]+sign*rule.step*(event.shiftKey?10:1)));
      writeFixture({...state.fixture,[rule.key]:Number(value.toFixed(4))});editHistory.commit(state.fixture);updateEditActions();
      $('edit-status').textContent=`${rule.label}: ${value.toFixed(4)} m. Temporary fixture only.`;
    });
    handle.button=button;return button;
  }));
  if(focusField&&state.editing)$('dimension-handles').querySelector(`[data-handle="${focusField}"]`)?.focus({preventScroll:true});
}
function positionHandles(){
  if(!state.editing)return;
  for(const handle of dimensionHandles){
    const p=handle.object.getWorldPosition(new THREE.Vector3()).project(camera),x=(p.x/2+.5)*stage.clientWidth,y=(-p.y/2+.5)*stage.clientHeight;
    handle.button.style.left=`${Math.max(22,Math.min(stage.clientWidth-22,x))}px`;
    handle.button.style.top=`${Math.max(43,Math.min(stage.clientHeight-43,y))}px`;
  }
}
function startDrag(event,handle){
  if(event.button!==0||!state.editing)return;
  const axisPixels=axisOnScreen(handle.object,handle.axis);
  if(axisPixels[0]**2+axisPixels[1]**2<4){$('edit-status').textContent='This axis faces the camera. Choose Isometric or use its numeric input.';return;}
  event.preventDefault();event.stopPropagation();editHistory.commit(state.fixture);
  dragSession={...handle,pointerId:event.pointerId,start:[event.clientX,event.clientY],axisPixels,initial:{...state.fixture}};
  state.activeAxis=handle.field;controls.enabled=false;stage.setPointerCapture(event.pointerId);
  stage.dataset.dragging=handle.field;$('edit-status').textContent=`Adjusting ${fixtureFields[handle.field].label.toLowerCase()}. Escape restores the starting value.`;
}
function finishDrag(cancel=false){
  if(!dragSession)return;
  const session=dragSession;dragSession=null;delete stage.dataset.dragging;controls.enabled=true;
  if(stage.hasPointerCapture(session.pointerId))stage.releasePointerCapture(session.pointerId);
  if(cancel)writeFixture(session.initial);else{editHistory.commit(state.fixture);updateEditActions();}
  const rule=fixtureFields[session.field];$('edit-status').textContent=cancel?'Drag cancelled; starting fixture restored.':`${rule.label}: ${state.fixture[rule.key].toFixed(4)} m. One drag saved as one undo step.`;
  $('dimension-handles').querySelector(`[data-handle="${session.field}"]`)?.focus({preventScroll:true});
}
stage.addEventListener('pointermove',event=>{
  if(!dragSession||event.pointerId!==dragSession.pointerId)return;
  const s=dragSession,rule=fixtureFields[s.field];
  const value=dimensionFromPointer({initial:s.initial[rule.key],start:s.start,end:[event.clientX,event.clientY],axisPixels:s.axisPixels,multiplier:s.multiplier,field:s.field});
  if(value!==null&&value!==state.fixture[rule.key])writeFixture({...state.fixture,[rule.key]:value});
});
stage.addEventListener('pointerup',event=>{if(event.pointerId===dragSession?.pointerId)finishDrag();});
stage.addEventListener('pointercancel',event=>{if(event.pointerId===dragSession?.pointerId)finishDrag(true);});
stage.addEventListener('lostpointercapture',event=>{if(event.pointerId===dragSession?.pointerId)finishDrag(true);});
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&dragSession){event.preventDefault();finishDrag(true);}});
$('edit-dimensions').addEventListener('click',()=>setEditing(!state.editing));
$('undo-fixture').addEventListener('click',()=>{editHistory.commit(state.fixture);const value=editHistory.undo();if(value){writeFixture(value);$('edit-status').textContent='Previous fixture restored.';}});
$('redo-fixture').addEventListener('click',()=>{const value=editHistory.redo();if(value){writeFixture(value);$('edit-status').textContent='Fixture edit reapplied.';}});
$('reset-fixture').addEventListener('click',()=>{editHistory.commit(state.fixture);writeFixture(defaultFixture(current.id),{fit:true});editHistory.commit(state.fixture);updateEditActions();$('edit-status').textContent='Default fixture restored. Undo can recover your edit.';});

function fitCamera(box=study.cameraBounds||new THREE.Box3().setFromObject(sceneRoot)){
  const direction=state.view==='top'?new THREE.Vector3(.001,1,.001):current.id==='PF-10'?new THREE.Vector3(0,.15,1.5).normalize():current.family==='finance'?new THREE.Vector3(.18,.7,1.8).normalize():new THREE.Vector3(1,1,1).normalize();
  fitOrthographic(THREE,camera,controls.target,box,{aspect:stage.clientWidth/stage.clientHeight,direction,padding:stage.clientWidth<500?1.2:1.26,horizontalInset:current.family==='finance'&&stage.clientWidth>=760&&state.annotations ? .21 : 0});
  controls.update();invalidate();
}

function positionLabels(){positionAnnotations(THREE,{labels,camera,stage,layer:$('labels')});}

function selectEntity(object){
  if(selectionHelper){scene.remove(selectionHelper);selectionHelper.dispose();}
  state.selected=object.userData.entityId;
  selectionHelper=new THREE.Box3Helper(new THREE.Box3().setFromObject(object),0x2364d9);scene.add(selectionHelper);
  $('selected-title').textContent=object.userData.label||object.userData.name||String(object.userData.entityId).replaceAll('_',' ');
  $('selected-description').textContent=object.userData.description||`Selected fixture ${object.userData.entityId}. ${current.intent}`;
  $('object-picker').value=state.selected;syncSelectionActions();
  document.querySelectorAll('#object-list button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.entityId===state.selected)));
  invalidate();
}
function syncSelectionActions(){for(const id of ['focus-object','clear-selection'])$(id).disabled=!state.selected;}
function clearSelection(){state.selected=null;if(selectionHelper){scene.remove(selectionHelper);selectionHelper.dispose();selectionHelper=null;}$('object-picker').value='';document.querySelectorAll('#object-list button').forEach(b=>b.setAttribute('aria-pressed','false'));$('selected-title').textContent='Inspect a scene object';$('selected-description').textContent=current.intent;syncSelectionActions();invalidate();}
$('object-picker').addEventListener('change',event=>{const object=entities.find(o=>o.userData.entityId===event.target.value);if(object)selectEntity(object);else clearSelection();});
$('focus-object').addEventListener('click',()=>{const object=entities.find(o=>o.userData.entityId===state.selected);if(object)fitCamera(new THREE.Box3().setFromObject(object));});
$('clear-selection').addEventListener('click',clearSelection);
$('toggle-annotations').addEventListener('click',()=>{state.annotations=!state.annotations;$('labels').hidden=!state.annotations;$('mobile-annotations').hidden=!state.annotations;$('toggle-annotations').setAttribute('aria-pressed',String(state.annotations));invalidate();});
$('render-quality').addEventListener('change',event=>{state.quality=event.target.value;presentation.setQuality(state.quality);stage.dataset.quality=state.quality;invalidate();});
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;delete stage.dataset.painted;$('renderer-recovery').hidden=false;stage.dataset.context='lost';});
renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;$('renderer-recovery').hidden=true;stage.dataset.context='restored';presentation.setSize(stage.clientWidth,stage.clientHeight);presentation.fitLight(new THREE.Box3().setFromObject(sceneRoot));invalidate();});

let pointerDown;
renderer.domElement.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY};});
renderer.domElement.addEventListener('pointerup',event=>{
  if(!pointerDown||Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>5)return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  for(const hit of raycaster.intersectObject(sceneRoot,true)){
    const object=subjectFromHit(hit.object,scene);
    if(object){selectEntity(object);break;}
  }
});

function renderIndex(){
  const query=$('search').value.trim().toLowerCase();
  document.querySelector('.rail').classList.toggle('searching',Boolean(query));
  const groups=Object.keys(products).map(product=>({product,items:cases.filter(c=>c.product===product&&(!query||`${c.id} ${c.title} ${c.intent}`.toLowerCase().includes(query)))})).filter(g=>g.items.length);
  $('case-list').innerHTML=groups.map(g=>`<section class="case-group"><h3>${escapeText(products[g.product].toUpperCase())}<span>${g.items.length}</span></h3>${g.items.map(c=>`<a class="case-link ${c.id===current?.id?'active':''}" data-case="${c.id}" data-decision="${decisions[c.id]?.revision===visualRevision?decisions[c.id].decision:'pending'}" href="?case=${c.id}" ${c.id===current?.id?'aria-current="page"':''}><span class="code">${c.id}</span><span>${escapeText(c.title)}</span></a>`).join('')}</section>`).join('');
  $('case-list').querySelectorAll('a').forEach(a=>a.addEventListener('click',event=>{if(!event.metaKey&&!event.ctrlKey){event.preventDefault();loadCase(a.dataset.case);}}));
  const n=Object.values(decisions).filter(d=>d.revision===visualRevision).length;$('review-count').textContent=n?`${n} of 120 reviewed by you`:'All awaiting your review';
}

async function loadCase(id,{history=true}={}){
  if(dragSession)finishDrag(true);
  current=cases.find(c=>c.id===id)||cases[0];
  const saved=decisions[current.id],fresh=saved?.revision===visualRevision;
  if(history)window.history.pushState({},'',`?case=${current.id}`);
  state.mode='dimensions';state.phase=1;state.explode=0;state.view='iso';state.selected=null;state.activeAxis='length';state.annotations=true;
  state.fixture=defaultFixture(current.id);editHistory=fixtureHistory(state.fixture);state.editing=false;
  if(fresh&&validReviewContext(saved.reviewContext,current.id)){
    state.mode=saved.reviewContext.mode;state.phase=saved.reviewContext.phase;state.explode=saved.reviewContext.explode;state.quality=saved.reviewContext.presentation.quality;state.annotations=saved.reviewContext.presentation.annotations;
    if(saved.reviewContext.fixture)state.fixture={...saved.reviewContext.fixture};
    editHistory=fixtureHistory(state.fixture);
  }
  $('edit-dimensions').setAttribute('aria-pressed','false');$('edit-status').textContent='Numeric inputs edit this temporary fixture.';
  const index=cases.indexOf(current);
  $('case-id').textContent=current.id;$('product-name').textContent=products[current.product].toUpperCase();$('case-title').textContent=current.title;$('case-intent').textContent=current.intent;$('case-number').textContent=`${String(index+1).padStart(2,'0')} / 120`;
  $('previous').disabled=index===0;$('next').disabled=index===cases.length-1;
  for(const key of ['phase','explode']){$(key).value=String(state[key]);$(key+'-value').value=`${Math.round(state[key]*100)}%`;}
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
  const physical=['cargo','vehicle','facility'].includes(current.family);
  const modeNames=['Solid','X-ray','Structure'];
  document.querySelectorAll('[data-mode]').forEach((b,i)=>b.textContent=modeNames[i]);
  const axes=physical?['X length','Y up','Z width']:current.family==='finance'?['X category','Y value / labeled scale','Z depth']:current.family==='route'?['X schematic','Y study up','Z schematic']:['X records','Y layers','Z sequence'];
  document.querySelectorAll('.axis-key span').forEach((e,i)=>e.textContent=axes[i]);
  const sequence=/door_passage|manual_repack|spatial_command|stop_sequence|multi_stop|payload_fuel|fuel_mass|door_open|rack_cell|gate_check|hostler_move|putaway|receiving_sequence|revision_replay|geofence|fleet_on_corridor|semantic_corridor|reachability|departure_speed|driver_safety|temperature|telemetry_to_yard/.test(current.focus);
  const separate=/stacking|nested|fault_localization|engine_and_fuel|sleeper|cross_product_model|interior_cutaway|dimension_tuner|rack_cell|putaway|policy_expiry|dispatch_packet|provenance|evidence_revision|three_dimensional_eld|audit_evidence/.test(current.focus);
  $('phase').closest('label').hidden=!sequence;$('explode').closest('label').hidden=!separate;
  $('fixture-editor').hidden=!['CF-02','AS-05'].includes(current.id);
  $('fixture-actions').hidden=$('fixture-editor').hidden;
  $('edit-dimensions').hidden=$('fixture-editor').hidden;
  $('fixture-wheelbase-field').hidden=current.id!=='AS-05';
  $('fixture-length-label').textContent=current.id==='AS-05'?'Deck length':'Length';
  $('fixture-height-label').textContent=current.id==='AS-05'?'Body height':'Height';
  $('fixture-mass-label').textContent=current.id==='AS-05'?'Tare mass':'Mass';
  for(const [field,key] of Object.entries({length:'lengthM',width:'widthM',height:'heightM',mass:'massLb',wheelbase:'wheelbaseM'}))$('fixture-'+field).value=String(state.fixture[key]);
  $('source-path').textContent=current.source;$('prerequisite').textContent=`Prerequisite: ${current.prerequisite}`;
  $('scenario-inputs').textContent=`Example scenario inputs, independent of the drawn fixture: ${current.metrics.map(m=>`${m.label}: ${format(m.value)} ${m.unit}`).join(' · ')}`;
  $('modules').textContent=`Reusable modules: ${current.modules.join(', ')}. See the module contract document for ownership, units and validation boundaries.`;
  $('proposed-interaction').textContent=`Proposed product interaction: ${current.interaction}`;
  state.decision=fresh?saved.decision:null;$('review-note').value=saved?.note||'';$('save-status').textContent='';
  $('decision-state').textContent=fresh?`${saved.decision.toUpperCase()} BY YOU`:saved?'UPDATED VISUAL · REVIEW AGAIN':'AWAITING YOUR REVIEW';
  document.querySelectorAll('[data-decision]').forEach(b=>{if(b.tagName==='BUTTON')b.dataset.active=String(b.dataset.decision===state.decision);});
  renderIndex();
  if(current.id==='PF-10'){
    const requested=current.id;delete stage.dataset.painted;
    $('stage-loading').textContent='Loading captured viewport studies…';$('stage-loading').hidden=false;$('stage-loading').style.display='grid';
    try{await loadResponsiveTextures(THREE);}catch(error){stage.dataset.error=error.message;$('stage-loading').textContent=`Viewport studies could not load: ${error.message}`;return;}
    if(current.id!==requested)return;
  }
  rebuild({fit:true});
  window.scrollTo({top:0,left:0,behavior:'instant'});
}

document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
  state.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(e=>e.setAttribute('aria-pressed',String(e===b)));rebuild();
}));
for(const field of ['phase','explode'])$(field).addEventListener('input',event=>{state[field]=Number(event.target.value);$(field+'-value').value=`${Math.round(state[field]*100)}%`;rebuild();});
for(const [field,key] of Object.entries({length:'lengthM',width:'widthM',height:'heightM',mass:'massLb',wheelbase:'wheelbaseM'})){
  $('fixture-'+field).addEventListener('focus',()=>{state.activeAxis=field;rebuild();});
  $('fixture-'+field).addEventListener('input',event=>{
    const input=event.target;input.setAttribute('aria-invalid',String(!input.checkValidity()));
    if(!input.checkValidity()){$('edit-status').textContent=`Enter a valid ${field} between ${input.min} and ${input.max}; the drawn fixture has not changed.`;return;}
    state.fixture[key]=Number(input.value);rebuild();$('edit-status').textContent='Exact input applied. Use Fit if you want to reframe the fixture.';
  });
  const finishInput=event=>{
    if(!event.target.checkValidity()){event.target.value=String(state.fixture[key]);event.target.setAttribute('aria-invalid','false');$('edit-status').textContent='Invalid input discarded; the last valid fixture value is restored.';return;}
    editHistory.commit(state.fixture);updateEditActions();
  };
  $('fixture-'+field).addEventListener('change',finishInput);
  $('fixture-'+field).addEventListener('blur',finishInput);
}
$('iso').addEventListener('click',()=>{state.view='iso';fitCamera();});$('top').addEventListener('click',()=>{state.view='top';fitCamera();});$('fit').addEventListener('click',()=>fitCamera());
$('previous').addEventListener('click',()=>loadCase(cases[cases.indexOf(current)-1].id));$('next').addEventListener('click',()=>loadCase(cases[cases.indexOf(current)+1].id));
$('search').addEventListener('input',renderIndex);
$('back-to-top').addEventListener('click',()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
window.addEventListener('popstate',()=>loadCase(new URLSearchParams(location.search).get('case'),{history:false}));
document.querySelectorAll('button[data-decision]').forEach(b=>b.addEventListener('click',()=>{state.decision=b.dataset.decision;document.querySelectorAll('button[data-decision]').forEach(e=>e.dataset.active=String(e===b));}));
$('save-decision').addEventListener('click',async()=>{
  if(!state.decision){$('save-status').textContent='Choose a visual decision first.';return;}
  const submission={caseId:current.id,decision:state.decision,note:$('review-note').value,revision:visualRevision,reviewContext:reviewContext()};
  $('save-decision').disabled=true;$('save-status').textContent='Saving your reviewed state…';
  try{
    const response=await fetch('/api/decisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(submission)});
    const entry=await response.json();if(!response.ok)throw Error(entry.error||'Review could not be saved.');
    if(acceptReviewResponse(decisions,submission,entry,current.id)){$('save-status').textContent='Saved locally with fixture and scene state';updateReviewBadge();}
    renderIndex();
  }catch(error){if(current.id===submission.caseId)$('save-status').textContent=error.message;}
  finally{$('save-decision').disabled=false;}
});
$('export-decisions').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({scope:'Visual studies only. No product implementation approval.',decisions},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='trucking-visual-decisions.json';a.click();URL.revokeObjectURL(url);
});
new ResizeObserver(()=>{if(dragSession)finishDrag(true);renderer.setSize(stage.clientWidth,stage.clientHeight);presentation.setSize(stage.clientWidth,stage.clientHeight);if(sceneRoot){document.querySelector('.workbench').dataset.annotationLayout=stage.clientWidth<760?'linear':'overlay';fitCamera();}}).observe(stage);
window.addEventListener('error',event=>{stage.dataset.error=event.message;$('stage-loading').textContent=`Study could not load: ${event.message}`;$('stage-loading').style.display='grid';});
loadCase(new URLSearchParams(location.search).get('case')||cases[0].id,{history:false});
