import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildStudy } from './scenes.mjs';
import { loadResponsiveTextures, buildResponsiveStudy } from './responsive.mjs';

const $ = id => document.getElementById(id);
const cases = await fetch('cases.json').then(r => r.json());
let decisions = await fetch('/api/decisions').then(r => r.json()).catch(() => ({}));
const visualRevision = await fetch('/api/revision').then(r=>r.json()).then(r=>r.revision);
const products = {cargo:'Cargo Fit',assets:'Asset Studio',warehouse:'Warehouse',yard:'Yard & Dock',telematics:'Fleet Telematics',pricing:'Freight Pricing',hos:'Hours of Service',trust:'Carrier Trust',command:'Command Center',platform:'Shared Platform'};
const state = { mode:'dimensions', phase:1, explode:0, selected:null, decision:null, view:'iso', fixture:{},activeAxis:'length' };
let current, study, labels = [], sceneRoot, frameRequested = false, selectionHelper;
const stage = $('stage');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#edf2f8');
const camera = new THREE.OrthographicCamera(-12,12,9,-9,.05,2000);
camera.position.set(22,19,25);
const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .92;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Spatial model: drag to orbit, scroll to zoom');
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const environment = pmrem.fromScene(room,.04);
scene.environment = environment.texture;
scene.environmentIntensity = .38;
room.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xe9f1ff,0x8e9bb1,.75));
const sun = new THREE.DirectionalLight(0xfff4e6,2.6);
sun.position.set(-16,32,18);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0002;sun.shadow.normalBias=.025;
scene.add(sun);scene.add(sun.target);
const fill = new THREE.DirectionalLight(0xb6d5ff,.75);fill.position.set(18,12,-22);scene.add(fill);
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping=false;controls.minPolarAngle=.08;controls.maxPolarAngle=Math.PI/2-.025;
controls.addEventListener('change',invalidate);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),new THREE.ShadowMaterial({color:0x6680a3,opacity:.16}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function escapeText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function format(value){return typeof value==='number'?new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value):value;}
function invalidate(){if(!frameRequested){frameRequested=true;requestAnimationFrame(draw);}}
function draw(){
  frameRequested=false;
  const started=performance.now();renderer.render(scene,camera);positionLabels();
  if(current){stage.dataset.painted=current.id;stage.dataset.renderMs=(performance.now()-started).toFixed(2);stage.dataset.drawCalls=String(renderer.info.render.calls);stage.dataset.geometry=String(renderer.info.memory.geometries);}
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
    if(current.id==='CF-01'&&o.isLineSegments&&/HU-01:selection/.test(o.name)){o.material.color.set('#ed7c36');o.material.opacity=1;}
    if(current.id==='WH-04'&&/preferred-cell/.test(o.name)&&o.material){o.material=o.material.clone();o.material.depthTest=false;o.renderOrder=100;}
    if(current.id==='CF-02'&&o.isMesh&&o.name.startsWith(state.activeAxis+':')){o.material=o.material.clone();o.material.color.set('#2364d9');}
  });
  const physical=['cargo','vehicle','facility'].includes(current.family);
  if(state.mode!=='dimensions'){
    const seen=new Set();sceneRoot.traverse(o=>{if(o.isMesh&&o.material&&!/study-plinth|grid:/.test(o.name))for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(!seen.has(m)){seen.add(m);if(state.mode==='volume'){m.transparent=true;m.opacity=Math.min(m.opacity,.32);m.depthWrite=false;}else m.wireframe=true;}});
  }
  const bounds = new THREE.Box3().setFromObject(sceneRoot);
  if(bounds.isEmpty())throw new Error(`Empty study ${current.id}`);
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  ground.position.y=bounds.min.y-.035;
  const span=Math.max(size.x,size.y,size.z,4);
  sun.position.copy(center).add(new THREE.Vector3(-.8*span,1.7*span,1.1*span));
  sun.target.position.copy(center);
  Object.assign(sun.shadow.camera,{left:-span,right:span,top:span,bottom:-span,near:.1,far:span*6});
  sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;
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
  const entities=[];const ids=new Set();
  if(!sceneRoot.children.some(o=>o.userData.inspectable)&&current.family==='finance')sceneRoot.children.filter(o=>o.isMesh&&/^(money-(?!note)|total-rate-|remaining-clock-|remaining-duty|fuel-price)/.test(o.name)).forEach(o=>{o.userData.inspectable=true;o.userData.label=o.name.replaceAll('-',' ');o.userData.description=`${o.userData.label}. Selected synthetic financial quantity; values are listed in the study annotations.`;});
  sceneRoot.traverse(o=>{const id=o.userData?.entityId;if(id&&o.userData.inspectable&&!ids.has(id)){ids.add(id);entities.push(o);}});
  entities.sort((a,b)=>Number(b.isGroup)-Number(a.isGroup));
  $('object-list').replaceChildren(...entities.slice(0,5).map(o=>{const b=document.createElement('button');b.textContent=o.userData.label||o.userData.name||String(o.userData.entityId).replaceAll('_',' ');b.addEventListener('click',()=>selectEntity(o));return b;}));
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
  invalidate();
}

function fitCamera(box=study.cameraBounds||new THREE.Box3().setFromObject(sceneRoot)){
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const span=Math.max(size.x,size.y,size.z,4);
  const direction=state.view==='top'?new THREE.Vector3(.001,1,.001):current.id==='PF-10'?new THREE.Vector3(0,.15,1.5).normalize():current.family==='finance'?new THREE.Vector3(.12,.48,1.5).normalize():new THREE.Vector3(1.15,.92,1.25).normalize();
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(direction,span*3+20);
  camera.near=.05;camera.far=span*12+200;camera.lookAt(center);camera.updateMatrixWorld();
  const inverse=camera.matrixWorldInverse;
  let x=0,y=0;
  for(const xx of [box.min.x,box.max.x])for(const yy of [box.min.y,box.max.y])for(const zz of [box.min.z,box.max.z]){
    const corner=new THREE.Vector3(xx,yy,zz).applyMatrix4(inverse);x=Math.max(x,Math.abs(corner.x));y=Math.max(y,Math.abs(corner.y));
  }
  const aspect=stage.clientWidth/stage.clientHeight;
  const halfHeight=Math.max(y*1.32,x/aspect*1.23,.55);
  camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.zoom=1;
  camera.updateProjectionMatrix();controls.update();invalidate();
}

function positionLabels(){
  const w=stage.clientWidth,h=stage.clientHeight;
  const leaderLayer=$('labels').querySelector('svg');
  leaderLayer.replaceChildren();leaderLayer.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const positions=labels.map((a,i)=>{
    const p=new THREE.Vector3(...a.position).project(camera);
    const ew=a.element.offsetWidth,eh=a.element.offsetHeight;
    return {a,i,px:(p.x*.5+.5)*w,py:(-p.y*.5+.5)*h,x:Math.max(ew/2+12,Math.min(w-ew/2-12,(p.x*.5+.5)*w)),y:Math.max(eh/2+42,Math.min(h-eh/2-45,(-p.y*.5+.5)*h-45)),ew,eh};
  });
  const ranked=positions.filter(p=>!p.a.isCompact).sort((a,b)=>a.px-b.px),split=Math.ceil(ranked.length/2);
  for(const [side,items] of [[-1,ranked.slice(0,split)],[1,ranked.slice(split)]]){
    items.sort((a,b)=>a.py-b.py).forEach((p,i)=>{p.x=side<0?p.ew/2+22:w-p.ew/2-22;p.y=68+(h-135)*(i+.5)/items.length;});
  }
  for(const p of positions.filter(p=>p.a.isCompact)){p.x=Math.max(p.ew/2+8,Math.min(w-p.ew/2-8,p.px));p.y=Math.max(p.eh/2+35,Math.min(h-p.eh/2-35,p.py-11));}
  for(let pass=0;pass<7;pass++)for(let i=0;i<ranked.length;i++)for(let j=i+1;j<ranked.length;j++){
    const a=ranked[i],b=ranked[j];
    if(Math.abs(a.x-b.x)<(a.ew+b.ew)/2+8&&Math.abs(a.y-b.y)<(a.eh+b.eh)/2+8){
      const direction=a.y<=b.y?1:-1;const gap=((a.eh+b.eh)/2+10-Math.abs(a.y-b.y))/2;
      a.y-=direction*gap;b.y+=direction*gap;
      a.y=Math.max(a.eh/2+44,Math.min(h-a.eh/2-47,a.y));b.y=Math.max(b.eh/2+44,Math.min(h-b.eh/2-47,b.y));
    }
  }
  positions.forEach(({a,x,y,px,py,ew})=>{
    a.element.style.left=`${x}px`;a.element.style.top=`${y}px`;
    if(a.isCompact)return;
    const endX=x<w/2?x+ew/2:x-ew/2;
    const line=document.createElementNS('http://www.w3.org/2000/svg','path');
    line.setAttribute('d',`M ${px} ${py} L ${endX+(x<w/2?15:-15)} ${y} L ${endX} ${y}`);leaderLayer.append(line);
    const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('cx',px);dot.setAttribute('cy',py);dot.setAttribute('r','2.7');leaderLayer.append(dot);
  });
}

function selectEntity(object){
  if(selectionHelper){scene.remove(selectionHelper);selectionHelper.dispose();}
  selectionHelper=new THREE.Box3Helper(new THREE.Box3().setFromObject(object),0x2364d9);scene.add(selectionHelper);
  $('selected-title').textContent=object.userData.label||object.userData.name||String(object.userData.entityId).replaceAll('_',' ');
  $('selected-description').textContent=object.userData.description||`Selected fixture ${object.userData.entityId}. ${current.intent}`;
  invalidate();
}

let pointerDown;
renderer.domElement.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY};});
renderer.domElement.addEventListener('pointerup',event=>{
  if(!pointerDown||Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>5)return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  for(const hit of raycaster.intersectObject(sceneRoot,true)){
    let object=hit.object;while(object&&!object.userData?.inspectable)object=object.parent;
    if(object&&object!==scene){selectEntity(object);break;}
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
  current=cases.find(c=>c.id===id)||cases[0];
  if(history)window.history.pushState({},'',`?case=${current.id}`);
  state.mode='dimensions';state.phase=1;state.explode=0;state.view='iso';state.selected=null;state.activeAxis='length';
  state.fixture=current.id==='AS-05'?{lengthM:16,widthM:2.45,heightM:2.7,massLb:18000,wheelbaseM:6.1}:{lengthM:1.2192,widthM:1.016,heightM:1.3,massLb:1200,wheelbaseM:6.1};
  const index=cases.indexOf(current);
  $('case-id').textContent=current.id;$('product-name').textContent=products[current.product].toUpperCase();$('case-title').textContent=current.title;$('case-intent').textContent=current.intent;$('case-number').textContent=`${String(index+1).padStart(2,'0')} / 120`;
  $('previous').disabled=index===0;$('next').disabled=index===cases.length-1;
  $('phase').value='1';$('phase-value').value='100%';$('explode').value='0';$('explode-value').value='0%';
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
  $('fixture-wheelbase-field').hidden=current.id!=='AS-05';
  $('fixture-length-label').textContent=current.id==='AS-05'?'Deck length':'Length';
  $('fixture-height-label').textContent=current.id==='AS-05'?'Body height':'Height';
  $('fixture-mass-label').textContent=current.id==='AS-05'?'Tare mass':'Mass';
  for(const [field,key] of Object.entries({length:'lengthM',width:'widthM',height:'heightM',mass:'massLb',wheelbase:'wheelbaseM'}))$('fixture-'+field).value=String(state.fixture[key]);
  $('source-path').textContent=current.source;$('prerequisite').textContent=`Prerequisite: ${current.prerequisite}`;
  $('scenario-inputs').textContent=`Example scenario inputs, independent of the drawn fixture: ${current.metrics.map(m=>`${m.label}: ${format(m.value)} ${m.unit}`).join(' · ')}`;
  $('modules').textContent=`Reusable modules: ${current.modules.join(', ')}. See the module contract document for ownership, units and validation boundaries.`;
  $('proposed-interaction').textContent=`Proposed product interaction: ${current.interaction}`;
  const saved=decisions[current.id],fresh=saved?.revision===visualRevision;state.decision=fresh?saved.decision:null;$('review-note').value=saved?.note||'';$('save-status').textContent='';
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
  $('fixture-'+field).addEventListener('input',event=>{if(!event.target.checkValidity())return;state.fixture[key]=Number(event.target.value);rebuild({fit:true});});
}
$('iso').addEventListener('click',()=>{state.view='iso';fitCamera();});$('top').addEventListener('click',()=>{state.view='top';fitCamera();});$('fit').addEventListener('click',()=>fitCamera());
$('previous').addEventListener('click',()=>loadCase(cases[cases.indexOf(current)-1].id));$('next').addEventListener('click',()=>loadCase(cases[cases.indexOf(current)+1].id));
$('search').addEventListener('input',renderIndex);
window.addEventListener('popstate',()=>loadCase(new URLSearchParams(location.search).get('case'),{history:false}));
document.querySelectorAll('button[data-decision]').forEach(b=>b.addEventListener('click',()=>{state.decision=b.dataset.decision;document.querySelectorAll('button[data-decision]').forEach(e=>e.dataset.active=String(e===b));}));
$('save-decision').addEventListener('click',async()=>{
  if(!state.decision){$('save-status').textContent='Choose a visual decision first.';return;}
  const response=await fetch('/api/decisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId:current.id,decision:state.decision,note:$('review-note').value,revision:visualRevision})});
  const entry=await response.json();if(!response.ok){$('save-status').textContent=entry.error;return;}
  decisions[current.id]=entry;$('decision-state').textContent=`${entry.decision.toUpperCase()} BY YOU`;$('save-status').textContent='Saved locally';renderIndex();
});
$('export-decisions').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({scope:'Visual studies only. No product implementation approval.',decisions},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='trucking-visual-decisions.json';a.click();URL.revokeObjectURL(url);
});
new ResizeObserver(()=>{renderer.setSize(stage.clientWidth,stage.clientHeight);if(sceneRoot)fitCamera();}).observe(stage);
window.addEventListener('error',event=>{stage.dataset.error=event.message;$('stage-loading').textContent=`Study could not load: ${event.message}`;$('stage-loading').style.display='grid';});
loadCase(new URLSearchParams(location.search).get('case')||cases[0].id,{history:false});
