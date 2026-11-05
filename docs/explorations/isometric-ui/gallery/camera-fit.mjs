export function fitOrthographic(THREE,camera,target,box,{aspect,direction,padding=1.26,horizontalInset=0}={}){
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),span=Math.max(size.x,size.y,size.z,4);
  target.copy(center);camera.position.copy(center).addScaledVector(direction,span*3+20);
  camera.near=.05;camera.far=span*12+200;camera.lookAt(center);camera.updateMatrixWorld();
  let x=0,y=0;
  for(const xx of [box.min.x,box.max.x])for(const yy of [box.min.y,box.max.y])for(const zz of [box.min.z,box.max.z]){
    const p=new THREE.Vector3(xx,yy,zz).applyMatrix4(camera.matrixWorldInverse);x=Math.max(x,Math.abs(p.x));y=Math.max(y,Math.abs(p.y));
  }
  const h=Math.max(y*padding,x/(aspect*Math.max(.3,1-horizontalInset*2))*1.14,.55);
  camera.left=-h*aspect;camera.right=h*aspect;camera.top=h;camera.bottom=-h;camera.zoom=1;camera.updateProjectionMatrix();
  return {center,span};
}
