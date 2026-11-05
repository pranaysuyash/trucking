// Snapshot synthetic/reference inputs for the read-only density study.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..');
const ts=require(path.join(root,'products/product-01-cargo-fit/node_modules/typescript'));
const cache=new Map(),sources={};
function read(relative){const p=path.join(root,relative);const text=fs.readFileSync(p,'utf8');sources[relative]=crypto.createHash('sha256').update(text).digest('hex');return text;}
function load(relative){
 const file=relative.endsWith('.ts')?relative:relative+'.ts';if(cache.has(file))return cache.get(file);
 const output=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};cache.set(file,module.exports);
 const context=vm.createContext({module,exports:module.exports,Date,Math,console,performance,require:p=>{
  if(!p.startsWith('.'))throw Error('Only project-relative pure fixture modules are allowed');
  return load(path.relative(root,path.resolve(root,path.dirname(file),p)));
 }});vm.runInContext(output,context,{filename:file});return module.exports;
}
const referencePath='docs/audits/visual-evidence/2026-10-22-shipment-flow/invoice-evidence-export.json';
const reference=JSON.parse(read(referencePath));
const vehicles=load('products/product-04-asset-studio/src/engine/catalog.ts').STANDARD_VEHICLES.filter(v=>['dry-van-53','reefer-53','flatbed-48','box-truck-26'].includes(v.id));
const carrier=load('products/product-08-carrier-trust/src/engine/carriers.ts').INITIAL_CARRIERS.find(c=>c.dotNumber==='389211');
const spatial=load('products/product-06-warehouse-space-flow/src/engine/spatialModel.ts');const facility=spatial.createCanonicalFacility();
const slots=spatial.getAllSlots(facility);const yard=load('products/product-07-yard-dock/src/engine/yardEngine.ts');
const quoteEngine=load('products/product-02-freight-pricing/src/engine/quote.ts');
const quote=quoteEngine.generateRateQuote({originCity:'Chicago',originState:'IL',destCity:'Milwaukee',destState:'WI',loadedMiles:95,deadheadMiles:12,equipmentCategory:'dry_van'},reference.results.quote.details.profile,{detentionHours:0,layoverDays:0,lumperFee:0,extraStopsCount:0,isHazmat:false,requiresTarp:false,reeferContinuousTempControl:false});
const fixture={asOf:'2026-10-22',mode:'read_only_visual_fixture',reference,vehicles,carrier,facility:{...facility,zones:facility.zones.map(({slots,...zone})=>zone)},slots,yard:{doors:yard.INITIAL_DOCK_DOORS,spots:yard.INITIAL_YARD_SPOTS,trailers:yard.INITIAL_TRAILERS,appointments:yard.INITIAL_APPOINTMENTS,tasks:yard.INITIAL_JOCKEY_TASKS},quote,provenance:{referencePath,sources,notice:'Saved scenario and seeded templates. These are not live records; current visual study state is independent of the completed reference shipment.'}};
fs.writeFileSync(path.join(__dirname,'fixture.js'),'// Generated read-only scenario snapshot. Regenerate with build-fixture.cjs.\nwindow.DENSITY_FIXTURE = '+JSON.stringify(fixture,null,2)+';\n');
console.log(JSON.stringify({vehicles:vehicles.length,slots:slots.length,referenceEvents:reference.events.length,sourceFiles:Object.keys(sources).length,quoteCents:Math.round(quote.recommendedTotalRate*100)}));
