// Scene subjects are view identities. Product adapters must supply canonical IDs separately.
export function collectSubjects(root){
  const ids=new Set(),subjects=[];
  root.traverse(o=>{if(o.userData?.inspectable&&o.userData.entityId&&!ids.has(o.userData.entityId)){ids.add(o.userData.entityId);subjects.push(o);}});
  return subjects.sort((a,b)=>Number(b.isGroup)-Number(a.isGroup));
}
export function subjectFromHit(object,scene){
  let current=object;while(current&&!current.userData?.inspectable)current=current.parent;
  return current&&current!==scene?current:null;
}
