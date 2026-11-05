// View-only fixture rules. These do not edit Trucking's canonical domain data.
export const fixtureFields = Object.freeze({
  length: {key:'lengthM',label:'Length',short:'L',min:.2,max:30,step:.01},
  width: {key:'widthM',label:'Width',short:'W',min:.2,max:4,step:.01},
  height: {key:'heightM',label:'Height',short:'H',min:.2,max:5,step:.01},
  wheelbase: {key:'wheelbaseM',label:'Wheelbase',short:'WB',min:1,max:14,step:.01},
});

export function defaultFixture(caseId){
  return caseId==='AS-05'
    ? {lengthM:16,widthM:2.45,heightM:2.7,massLb:18000,wheelbaseM:6.1}
    : {lengthM:1.2192,widthM:1.016,heightM:1.3,massLb:1200,wheelbaseM:6.1};
}

export function dimensionFromPointer({initial,start,end,axisPixels,multiplier=1,field}){
  const lengthSquared=axisPixels[0]**2+axisPixels[1]**2;
  if(lengthSquared<4)return null; // An axis facing the camera has no usable screen direction.
  const metres=((end[0]-start[0])*axisPixels[0]+(end[1]-start[1])*axisPixels[1])/lengthSquared;
  const rule=fixtureFields[field],value=initial+metres*multiplier;
  return Number(Math.min(rule.max,Math.max(rule.min,value)).toFixed(4));
}

export function fixtureHistory(initial){
  const copy=value=>({...value});let entries=[copy(initial)],cursor=0;
  const equal=(a,b)=>Object.keys(a).every(key=>a[key]===b[key]);
  return {
    commit(value){if(equal(entries[cursor],value))return false;entries=entries.slice(0,cursor+1);entries.push(copy(value));cursor++;return true;},
    undo(){if(!cursor)return null;return copy(entries[--cursor]);},
    redo(){if(cursor===entries.length-1)return null;return copy(entries[++cursor]);},
    get canUndo(){return cursor>0;},get canRedo(){return cursor<entries.length-1;},
    matches(value){return equal(entries[cursor],value);},
  };
}
