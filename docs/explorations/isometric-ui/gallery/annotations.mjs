// DOM annotation placement is independent of scene generation and domain state.
export function positionAnnotations(THREE,{labels,camera,stage,layer}){
  const w=stage.clientWidth,h=stage.clientHeight;
  const leaderLayer=layer.querySelector('svg');
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

