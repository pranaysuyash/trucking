export const reviewLabels=Object.freeze({pending:'Awaiting your review',approved:'Approved by you',revise:'Revision requested',deferred:'Deferred by you',stale:'Changed since review'});
export function validReviewContext(value,caseId){
  if(!value||value.version!==1||!['dimensions','volume','mass'].includes(value.mode)||!['phase','explode'].every(k=>Number.isFinite(value[k])&&value[k]>=0&&value[k]<=1))return false;
  if(!['CF-02','AS-05'].includes(caseId))return value.fixture===null;
  const keys=['lengthM','widthM','heightM','massLb','wheelbaseM'];
  return value.fixture&&Object.keys(value.fixture).length===keys.length&&keys.every(k=>Number.isFinite(value.fixture[k])&&value.fixture[k]>=0&&value.fixture[k]<=1e6&&(k==='massLb'||value.fixture[k]>0));
}
export function reviewContextKey(value){
  const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
  return JSON.stringify(sorted(value));
}
export function reviewSummary(context){
  if(!validReviewContext(context,context?.fixture?'CF-02':'other'))return 'Saved review context unavailable';
  const layer={dimensions:'Solid',volume:'X-ray',mass:'Structure'}[context.mode];
  return context.fixture?`${context.fixture.lengthM} × ${context.fixture.widthM} × ${context.fixture.heightM} m · ${context.fixture.massLb.toLocaleString('en-US')} lb · ${layer}`:`${layer} · sequence ${Math.round(context.phase*100)}% · separation ${Math.round(context.explode*100)}%`;
}
export function reviewState(entry,revision){
  if(!entry||!['approved','revise','deferred'].includes(entry.decision))return 'pending';
  return entry.revision===revision&&validReviewContext(entry.reviewContext,entry.caseId)?entry.decision:'stale';
}
export function acceptReviewResponse(decisions,submission,entry,currentCaseId){
  if(entry.caseId!==submission.caseId||entry.revision!==submission.revision)throw Error('Review response does not match the submitted case.');
  decisions[submission.caseId]=entry;return currentCaseId===submission.caseId;
}
export function reviewCounts(cases,decisions,revision){
  const counts={pending:0,approved:0,revise:0,deferred:0,stale:0};
  for(const c of cases)counts[reviewState(decisions[c.id],revision)]++;
  return counts;
}
