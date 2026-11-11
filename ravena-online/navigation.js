// Navegação de grid provisória com fila de prioridade.
// Não depende de Babylon.js e pode ser trocada por NavMesh no futuro.
(() => {
  class MinHeap {
    constructor(){this.items=[];}
    get length(){return this.items.length;}
    push(node){
      const a=this.items; a.push(node);
      let i=a.length-1;
      while(i>0){
        const p=(i-1)>>1;
        if(a[p].f<=a[i].f)break;
        [a[i],a[p]]=[a[p],a[i]];i=p;
      }
    }
    pop(){
      const a=this.items;
      if(!a.length)return null;
      const best=a[0],last=a.pop();
      if(a.length){
        a[0]=last;
        let i=0;
        while(true){
          let c=i*2+1;
          if(c>=a.length)break;
          if(c+1<a.length&&a[c+1].f<a[c].f)c++;
          if(a[i].f<=a[c].f)break;
          [a[i],a[c]]=[a[c],a[i]];i=c;
        }
      }
      return best;
    }
  }
  const offsets=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  const point=(x,z)=>({x,z});
  const key=(x,z)=>x+","+z;
  function findPath(start,end,blocked,{cell=2,maxCell=43,maxIterations=7000}={}){
    if(!start||!end||typeof blocked!=="function"||cell<=0)return [];
    const coord=v=>Math.round(v/cell);
    const sx=coord(start.x),sz=coord(start.z);
    let tx=coord(end.x),tz=coord(end.z);
    let goal=point(end.x,end.z);
    if(blocked(tx*cell,tz*cell,.4)){
      let nearest=null;
      for(let r=1;r<=7&&!nearest;r++){
        for(let dx=-r;dx<=r&&!nearest;dx++)for(let dz=-r;dz<=r&&!nearest;dz++){
          if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;
          const nx=tx+dx,nz=tz+dz;
          if(Math.abs(nx)>maxCell||Math.abs(nz)>maxCell)continue;
          if(!blocked(nx*cell,nz*cell,.4))nearest=point(nx,nz);
        }
      }
      if(!nearest)return [];
      tx=nearest.x;tz=nearest.z;goal=point(tx*cell,tz*cell);
    }
    const open=new MinHeap(),parent=new Map(),cost=new Map(),closed=new Set();
    const startKey=key(sx,sz);
    open.push({x:sx,z:sz,g:0,f:Math.hypot(tx-sx,tz-sz)});
    cost.set(startKey,0);
    let reached=false;
    for(let iter=0;open.length&&iter<maxIterations;iter++){
      const node=open.pop(),here=key(node.x,node.z);
      if(closed.has(here))continue;
      if(node.g>(cost.get(here)??Infinity)+.00001)continue;
      closed.add(here);
      if(node.x===tx&&node.z===tz){reached=true;break;}
      for(const [dx,dz] of offsets){
        const nx=node.x+dx,nz=node.z+dz,nk=key(nx,nz);
        if(Math.abs(nx)>maxCell||Math.abs(nz)>maxCell||closed.has(nk))continue;
        if(blocked(nx*cell,nz*cell,.25))continue;
        if(dx&&dz&&(blocked((node.x+dx)*cell,node.z*cell,.25)||
                     blocked(node.x*cell,(node.z+dz)*cell,.25)))continue;
        const ng=node.g+(dx&&dz?Math.SQRT2:1);
        if(ng>= (cost.get(nk)??Infinity))continue;
        parent.set(nk,here);
        cost.set(nk,ng);
        open.push({x:nx,z:nz,g:ng,f:ng+Math.hypot(tx-nx,tz-nz)});
      }
    }
    if(!reached)return [];
    const raw=[];
    for(let k=key(tx,tz);k;k=parent.get(k)){
      const [x,z]=k.split(",").map(Number);raw.push(point(x*cell,z*cell));
    }
    raw.reverse();
    if(raw.length>1)raw.shift();
    const clear=(from,to)=>{
      const distance=Math.hypot(to.x-from.x,to.z-from.z);
      const steps=Math.ceil(distance/.5);
      for(let i=1;i<steps;i++){
        const t=i/steps;
        if(blocked(from.x+(to.x-from.x)*t,from.z+(to.z-from.z)*t,.25))return false;
      }
      return true;
    };
    const smooth=[];let anchor=point(start.x,start.z);
    for(let i=0;i<raw.length;){
      let far=i;
      for(let j=i+1;j<Math.min(raw.length,i+10);j++)
        if(clear(anchor,raw[j]))far=j;
      const next=raw[far];smooth.push(next);anchor=next;i=far+1;
    }
    if(!blocked(goal.x,goal.z,.4)&&clear(anchor,goal)){
      const last=smooth.at(-1);
      if(!last||Math.hypot(last.x-goal.x,last.z-goal.z)>.08)smooth.push(goal);
    }
    return smooth;
  }
  globalThis.RavenaNavigation=Object.freeze({findPath});
})();
