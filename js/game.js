const c=document.getElementById('game'),ctx=c.getContext('2d'),mini=document.getElementById('mini'),mctx=mini.getContext('2d');let DPR=Math.min(devicePixelRatio||1,2),W,H;
function resize(){W=innerWidth;H=innerHeight;c.width=W*DPR;c.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}addEventListener('resize',resize);resize();
const world={w:2300,h:1700,lake:{x:535,y:310,w:1130,h:850},pier:{x:1030,y:1080,w:155,h:240},shop:{x:1900,y:350,w:195,h:160},market:{x:1880,y:1020,w:225,h:175},board:{x:170,y:400,w:145,h:110},altar:{x:1110,y:1220,w:90,h:60}};
let scene='lake',marketReturn={x:1990,y:1230};
const player={x:1110,y:1370,r:17,speed:220,dir:0};let cam={x:0,y:0},last=performance.now(),near=null,coins=1635,bait=7,inventory=[];
const fish=[['Carpa Lunar','Comum',1,4,45],['Tilápia Sombria','Comum',.5,2.8,35],['Dourado de Azarath','Raro',3,11,160],['Bagre Fantasma','Épico',5,18,320],['Leviatã Jovem','Lendário',12,28,900],['Corvo Abissal','Lendário',18,35,1500]];
const keys={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='e')interact()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function rr(x,y,w,h,r=10){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function glow(x,y,r,col){let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function lantern(x,y){x-=cam.x;y-=cam.y;glow(x,y,48,'#ffb24a55');ctx.fillStyle='#24170e';ctx.fillRect(x-2,y-20,4,22);ctx.fillStyle='#ffd27a';ctx.fillRect(x-5,y-17,10,12);ctx.strokeStyle='#8d5b2e';ctx.strokeRect(x-5,y-17,10,12)}
function flower(x,y,i){x-=cam.x;y-=cam.y;ctx.fillStyle=i%3?'#b7438b':'#e45475';for(let a=0;a<5;a++){let q=a*Math.PI*2/5;ctx.beginPath();ctx.arc(x+Math.cos(q)*4,y+Math.sin(q)*4,3,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#f5d8a1';ctx.fillRect(x-1,y-1,2,2)}
function npc(x,y,name){x-=cam.x;y-=cam.y;ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(x,y+12,14,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3a2b23';ctx.beginPath();ctx.arc(x,y-5,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6f3e4f';ctx.fillRect(x-9,y+2,18,18);ctx.fillStyle='#eee2cf';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText(name,x,y-20)}
// V5.3 — partículas determinísticas, sem gerar objetos a cada quadro.
const ambience=Array.from({length:65},(_,i)=>({x:(i*503+97)%2300,y:(i*337+31)%1700,phase:i*1.73,r:1.2+i%3}));
const waterSparkles=Array.from({length:50},(_,i)=>({angle:i*2.399,rad:.13+(i%12)/15,phase:i*1.51}));
let avatarFacing=1,avatarWalk=0,avatarMoving=false;
function drawAmbience(t){
 ctx.save();ctx.globalCompositeOperation='screen';
 for(let i=0;i<ambience.length;i++){
  const p=ambience[i],x=p.x-cam.x+Math.sin(t*.00055+p.phase)*17,y=p.y-cam.y+Math.cos(t*.00037+p.phase)*10;
  if(x<-20||y<-20||x>W+20||y>H+20)continue;
  const alpha=.18+.36*(.5+.5*Math.sin(t*.002+p.phase));
  ctx.fillStyle=i%4===0?`rgba(255,145,175,${alpha})`:`rgba(188,139,255,${alpha})`;
  ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function drawLakeReflections(t,L,cx,cy){
 ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,L.w/2-12,L.h/2-12,0,0,Math.PI*2);ctx.clip();
 const g=ctx.createLinearGradient(cx-180,cy-450,cx+180,cy+470);
 g.addColorStop(0,'#25466a44');g.addColorStop(.45,'#74508c22');g.addColorStop(1,'#3b8a9a11');
 ctx.fillStyle=g;ctx.fillRect(cx-L.w/2,cy-L.h/2,L.w,L.h);
 for(const p of waterSparkles){
  const x=cx+Math.cos(p.angle)*L.w*.44*p.rad,y=cy+Math.sin(p.angle)*L.h*.42*p.rad;
  const wave=Math.sin(t*.0017+p.phase),width=13+wave*7;
  ctx.strokeStyle=`rgba(172,184,240,${.09+.13*(wave+1)/2})`;
  ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-width/2,y);ctx.lineTo(x+width/2,y);ctx.stroke();
 }
 // Moving moonlight, confined to the lake.
 for(let i=0;i<13;i++){
  const x=cx+L.w*.21+Math.sin(t*.0007+i)*16+i%3*16;
  const y=cy-145+i*29;
  ctx.fillStyle=`rgba(198,184,241,${.045+.03*Math.sin(t*.002+i)})`;
  ctx.fillRect(x,y,65+(i%4)*22,2);
 }
 ctx.restore();
}
function drawForeground(t){
 // Soft screen-space vignette gives the village a moonlit frame.
 const radius=Math.max(W,H)*.78,g=ctx.createRadialGradient(W*.5,H*.46,radius*.22,W*.5,H*.46,radius);
 g.addColorStop(0,'#00000000');g.addColorStop(1,'#050410aa');
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(scene==='lake')drawAmbience(t);
}
function drawMini(){if(scene==='market'){mctx.clearRect(0,0,150,150);mctx.fillStyle='#21152b';mctx.fillRect(0,0,150,150);mctx.fillStyle='#f3cae8';mctx.font='bold 15px system-ui';mctx.textAlign='center';mctx.fillText('MERCADO',75,65);mctx.fillText('NOTURNO',75,85);return;}let w=mini.width,h=mini.height;mctx.clearRect(0,0,w,h);mctx.fillStyle='#111a22';mctx.fillRect(0,0,w,h);let sx=w/world.w,sy=h/world.h,L=world.lake;mctx.fillStyle='#0b3447';mctx.beginPath();mctx.ellipse((L.x+L.w/2)*sx,(L.y+L.h/2)*sy,L.w/2*sx,L.h/2*sy,0,0,Math.PI*2);mctx.fill();mctx.fillStyle='#b15a7d';for(const b of [world.shop,world.market,world.board])mctx.fillRect(b.x*sx,b.y*sy,Math.max(4,b.w*sx),Math.max(4,b.h*sy));mctx.fillStyle='#e8c263';mctx.fillRect(world.pier.x*sx,world.pier.y*sy,world.pier.w*sx,world.pier.h*sy);mctx.fillStyle='#df67ff';mctx.beginPath();mctx.arc(player.x*sx,player.y*sy,4,0,Math.PI*2);mctx.fill()}
function drawStatue(t){
 const L=world.lake,x=L.x+L.w/2-cam.x,y=L.y+L.h/2-cam.y;
 // island, glowing rune and lake reflections
 glow(x,y+36,220,'#9c48e033');ctx.fillStyle='#0b2430';ctx.beginPath();ctx.ellipse(x,y+64,155,55,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#74559b';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(x,y+62,143,45,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#312d43';ctx.beginPath();ctx.ellipse(x,y+38,90,35,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#444057';ctx.fillRect(x-65,y-2,130,53);ctx.fillStyle='#756c89';ctx.fillRect(x-74,y+35,148,17);
 // cloak and flowing hair silhouette
 ctx.fillStyle='#1b172e';ctx.beginPath();ctx.moveTo(x-33,y-110);ctx.lineTo(x-84,y+24);ctx.quadraticCurveTo(x,y+55,x+85,y+24);ctx.lineTo(x+31,y-110);ctx.closePath();ctx.fill();
 ctx.fillStyle='#625b7c';ctx.beginPath();ctx.moveTo(x-29,y-100);ctx.lineTo(x-42,y+17);ctx.lineTo(x+40,y+17);ctx.lineTo(x+30,y-100);ctx.closePath();ctx.fill();
 ctx.fillStyle='#201a32';ctx.beginPath();ctx.ellipse(x,y-137,37,49,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#9288a4';ctx.beginPath();ctx.ellipse(x,y-139,23,33,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#181427';ctx.beginPath();ctx.moveTo(x-39,y-174);ctx.quadraticCurveTo(x-3,y-220,x+38,y-171);ctx.lineTo(x+24,y-151);ctx.lineTo(x+12,y-183);ctx.lineTo(x-24,y-156);ctx.closePath();ctx.fill();
 // wings and staff
 ctx.fillStyle='#272139';for(let sign of [-1,1]){ctx.beginPath();ctx.moveTo(x+sign*24,y-94);ctx.quadraticCurveTo(x+sign*145,y-194,x+sign*143,y-32);ctx.quadraticCurveTo(x+sign*82,y-84,x+sign*39,y-10);ctx.closePath();ctx.fill()}
 for(let sign of [-1,1])for(let feather=0;feather<7;feather++){
   ctx.strokeStyle=feather%2?'#534663':'#75618b';ctx.lineWidth=2;
   ctx.beginPath();ctx.moveTo(x+sign*(40+feather*10),y-103-feather*3);
   ctx.lineTo(x+sign*(57+feather*12),y-33+feather*5);ctx.stroke();
 }
 ctx.strokeStyle='#a98ac9';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x+51,y-121);ctx.lineTo(x+82,y+36);ctx.stroke();
 glow(x,y-139,70,'#ae4fff77');ctx.fillStyle='#d3a2ff';ctx.fillRect(x-13,y-143,8,4);ctx.fillRect(x+6,y-143,8,4);
 glow(x+81,y-122,26,'#f077b077');ctx.fillStyle='#d4548d';ctx.font='30px serif';ctx.textAlign='center';ctx.fillText('✦',x+81,y-115);
 ctx.fillStyle='#e7d5ff';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.shadowColor='#a44dff';ctx.shadowBlur=12;ctx.fillText('R A V E N A',x,y+102);ctx.shadowBlur=0;
 for(let i=0;i<18;i++){let a=i*2.399+t*.00025,rad=70+i*6;ctx.fillStyle=i%2?'#da6aaf':'#a85bd2';ctx.beginPath();ctx.ellipse(x+Math.cos(a)*rad,y+Math.sin(a)*rad*.35+58+Math.sin(t*.001+i)*7,4,2,a,0,Math.PI*2);ctx.fill()}
}
function drawMarketInterior(){
 const t=performance.now(),left=430-cam.x,top=180-cam.y,w=1430,h=1240;
 ctx.fillStyle='#0d0a16';ctx.fillRect(0,0,W,H);ctx.fillStyle='#281b30';ctx.fillRect(left,top,w,h);
 for(let x=430;x<1860;x+=70)for(let y=180;y<1420;y+=70){ctx.fillStyle=(Math.floor(x/70)+Math.floor(y/70))%2?'#302338':'#37293c';ctx.fillRect(x-cam.x+2,y-cam.y+2,66,66)}
 ctx.strokeStyle='#b17885';ctx.lineWidth=28;ctx.strokeRect(left,top,w,h);
 for(let x=510;x<1830;x+=220){glow(x-cam.x,230-cam.y,75,'#f5a35a55');ctx.fillStyle='#9a6544';ctx.fillRect(x-7-cam.x,190-cam.y,14,80);ctx.fillStyle='#ffd185';ctx.fillRect(x-10-cam.x,247-cam.y,20,22)}
 for(const [x,y,title,emoji] of [[690,460,'COMPRAR','🪙'],[1140,460,'VENDER','🐟'],[1590,460,'TROCAR','🤝']]){ctx.fillStyle='#5c3548';rr(x-150-cam.x,y-45-cam.y,300,145,14);ctx.fillStyle='#8c5667';rr(x-150-cam.x,y+42-cam.y,300,50,8);ctx.fillStyle='#f9d5df';ctx.font='bold 23px system-ui';ctx.textAlign='center';ctx.fillText(emoji+' '+title,x-cam.x,y-cam.y);glow(x-cam.x,y-cam.y,95,'#a84b8533')}
 for(const [x,y] of [[560,760],[1770,760],[560,1110],[1770,1110]]){ctx.fillStyle='#50352e';ctx.fillRect(x-40-cam.x,y-22-cam.y,80,44);ctx.fillStyle='#9c7452';ctx.fillRect(x-40-cam.x,y-22-cam.y,80,8)}
 const stairX=1120-cam.x,stairY=1310-cam.y;ctx.fillStyle='#19141e';ctx.fillRect(stairX-125,stairY-25,250,115);for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#86667b':'#b58c9b';ctx.fillRect(stairX-125,stairY+i*18,250,12)}
 ctx.fillStyle='#f4cfe7';ctx.font='bold 21px system-ui';ctx.textAlign='center';ctx.fillText('⬇ ESCADAS • SAÍDA',stairX,stairY-47);
 ctx.fillStyle='#f4cde9';ctx.font='bold 29px Georgia';ctx.fillText('🌹 MERCADO NOTURNO DA RAVENA',1150-cam.x,125-cam.y);drawMini();
}
function ground(){if(scene==='market'){drawMarketInterior();return;}const t=performance.now();ctx.fillStyle='#0c1720';ctx.fillRect(0,0,W,H);
 let sx=Math.floor(cam.x/42)*42,sy=Math.floor(cam.y/42)*42;for(let x=sx;x<cam.x+W+42;x+=42)for(let y=sy;y<cam.y+H+42;y+=42){let n=Math.abs((x*13+y*7)%101);ctx.fillStyle=n<30?'#17252b':'#14232a';ctx.fillRect(x-cam.x,y-cam.y,41,41)}
 // walking trail around the lake
 const L=world.lake,cx=L.x+L.w/2-cam.x,cy=L.y+L.h/2-cam.y;
 ctx.strokeStyle='#3d3434';ctx.lineWidth=74;ctx.beginPath();ctx.ellipse(cx,cy,L.w/2+80,L.h/2+74,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='#625047';ctx.lineWidth=3;ctx.setLineDash([10,25]);ctx.beginPath();ctx.ellipse(cx,cy,L.w/2+80,L.h/2+74,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#091c2b';ctx.beginPath();ctx.ellipse(cx,cy,L.w/2,L.h/2,0,0,Math.PI*2);ctx.fill();drawLakeReflections(t,L,cx,cy);
 ctx.strokeStyle='#557e86';ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle='#2b5567';ctx.lineWidth=2;
 for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(cx,cy,L.w/2-i*27,L.h/2-i*23,0,0,Math.PI*2);ctx.stroke()}
 for(let i=0;i<40;i++){let x=L.x+120+(i*191)%1070,y=L.y+80+(i*103)%800;if(!inLake(x,y))continue;let drift=Math.sin(t*.0007+i)*12;ctx.fillStyle=i%3?'#40637b66':'#a47edb55';ctx.fillRect(x-cam.x+drift,y-cam.y,24+(i%4)*13,2)}
 // animated cascades, stone embankments and red arched footbridges
 for(const [wx,wy] of [[L.x+L.w*.16,L.y+L.h*.10],[L.x+L.w*.83,L.y+L.h*.12]]){
   const px=wx-cam.x,py=wy-cam.y;
   glow(px,py,85,'#397dbd33');
   for(let j=0;j<11;j++){ctx.strokeStyle=j%2?'#75a5d08a':'#d1c5f0a0';ctx.lineWidth=2+(j%3);ctx.beginPath();ctx.moveTo(px+j*6-31,py-55);ctx.quadraticCurveTo(px+j*6-37+Math.sin(t*.002+j)*4,py,px+j*6-31,py+48);ctx.stroke()}
   ctx.fillStyle='#a4c3ed88';ctx.beginPath();ctx.ellipse(px,py+49,47,8,0,0,Math.PI*2);ctx.fill();
 }
 for(const [bx,by] of [[L.x+L.w*.1,L.y+L.h*.5],[L.x+L.w*.9,L.y+L.h*.53]]){
   let x=bx-cam.x,y=by-cam.y;
   ctx.strokeStyle='#662c45';ctx.lineWidth=17;ctx.beginPath();ctx.moveTo(x-52,y+8);ctx.quadraticCurveTo(x,y-44,x+52,y+8);ctx.stroke();
   ctx.strokeStyle='#e38b8e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-52,y-9);ctx.quadraticCurveTo(x,y-62,x+52,y-9);ctx.stroke();
   for(let j=-2;j<=2;j++){ctx.strokeStyle='#c36d79';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+j*20,y+3);ctx.lineTo(x+j*20,y-28-Math.cos(j*.6)*14);ctx.stroke()}
 }
 // island statue is the focal point
 drawStatue(t);
 // dock, wood grain and posts
 const P=world.pier;ctx.fillStyle='#372b26';ctx.fillRect(P.x-12-cam.x,P.y-10-cam.y,P.w+24,P.h+20);ctx.fillStyle='#7b5943';ctx.fillRect(P.x-cam.x,P.y-cam.y,P.w,P.h);
 for(let y=P.y;y<P.y+P.h;y+=23){ctx.strokeStyle='#b48a65';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(P.x-cam.x,y-cam.y);ctx.lineTo(P.x+P.w-cam.x,y-cam.y);ctx.stroke()}
 for(let y of [P.y+14,P.y+P.h-18])for(let x of [P.x+10,P.x+P.w-10]){ctx.fillStyle='#34251e';ctx.fillRect(x-6-cam.x,y-6-cam.y,12,16)}
 // redesigned trading buildings
 building(world.shop,'LOJA DO PESCADOR','🎣','#55446d');building(world.market,'MERCADO NOTURNO','🌹','#6e334f');drawTombstone();drawAltar();
 // woodland and cherry blossom groves
 for(let i=0;i<140;i++){let x=(i*311)%2240+30,y=(i*479)%1640+30;if(inLake(x,y)||lakeEdgeFactor(x,y)<1.16||inside(x,y,world.pier,90)||inside(x,y,world.shop,80)||inside(x,y,world.market,85)||inside(x,y,world.board,65))continue;let X=x-cam.x,Y=y-cam.y;if(X<-50||X>W+50||Y<-50||Y>H+50)continue;ctx.fillStyle='#0b141b';ctx.beginPath();ctx.ellipse(X,Y+15,31,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=i%5===0?'#75365f':i%4===0?'#3f365d':'#234138';ctx.beginPath();ctx.arc(X,Y-11,24+(i%3)*5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff0c';ctx.beginPath();ctx.arc(X-7,Y-19,13,0,Math.PI*2);ctx.fill()}
 for(let i=0;i<65;i++){let a=i*2.399,rx=L.w/2+125,ry=L.h/2+118,x=L.x+L.w/2+Math.cos(a)*rx,y=L.y+L.h/2+Math.sin(a)*ry;if(i%4===0)lantern(x,y);else flower(x,y,i)}
 npc(980,1400,'Pescador');npc(1810,990,'Nyx');npc(1840,530,'Mercadora');
 // distant skyline and moon
 ctx.fillStyle='#d9d1ff';ctx.beginPath();ctx.arc(2160-cam.x,95-cam.y,39,0,Math.PI*2);ctx.fill();glow(2160-cam.x,95-cam.y,110,'#a785ff33');
 drawMini()}
function drawTombstone(){
 const b=world.board,x=b.x-cam.x,y=b.y-cam.y;
 glow(x+70,y+72,105,'#9d53c033');
 ctx.fillStyle='#100e1a';ctx.beginPath();ctx.ellipse(x+72,y+120,95,29,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#332c40';ctx.fillRect(x+12,y+65,122,64);
 ctx.beginPath();ctx.arc(x+73,y+65,61,Math.PI,0);ctx.fill();
 ctx.strokeStyle='#ad79b8';ctx.lineWidth=4;ctx.strokeRect(x+17,y+67,112,57);
 ctx.fillStyle='#dfc3e8';ctx.textAlign='center';ctx.font='bold 16px Georgia';ctx.fillText('✦ RAVENA ✦',x+73,y+67);
 ctx.font='bold 12px Georgia';ctx.fillText('CAMPEÕES',x+73,y+91);
 ctx.fillStyle='#e36b94';for(let i=0;i<5;i++)flower(b.x+10+i*28,b.y+126,i);
}
function drawAltar(){
 const b=world.altar,x=b.x-cam.x,y=b.y-cam.y;
 glow(x+45,y+25,95,'#b354ed55');
 ctx.fillStyle='#38283e';ctx.beginPath();ctx.ellipse(x+45,y+43,68,29,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#68546f';ctx.fillRect(x+11,y+10,70,40);
 ctx.fillStyle='#c7a0dc';ctx.font='bold 14px Georgia';ctx.textAlign='center';ctx.fillText('✦ ALTAR ✦',x+45,y+32);
}
function building(b,label,icon,col){let x=b.x-cam.x,y=b.y-cam.y,w=b.w,h=b.h;if(x>W+80||x+w<-80||y>H+80||y+h<-80)return;
 ctx.fillStyle='#0007';rr(x-18,y+16,w+36,h+17,12);ctx.fillStyle='#352b36';rr(x,y,w,h,7);
 // textured wooden facade
 for(let i=0;i<Math.floor(w/19);i++){ctx.fillStyle=i%2?'#61465b':'#4b3848';ctx.fillRect(x+i*19,y+22,18,h-24)}
 ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-24,y+28);ctx.lineTo(x+w/2,y-68);ctx.lineTo(x+w+24,y+28);ctx.closePath();ctx.fill();ctx.strokeStyle='#a980a4';ctx.lineWidth=5;ctx.stroke();
 // shingled roof, wooden posts and market awnings
 for(let row=0;row<4;row++)for(let col=0;col<9;col++){
   let xx=x+w/2+(col-4)*w/10,yy=y-53+row*16+Math.abs(col-4)*8;
   ctx.strokeStyle=(row+col)%2?'#c080a0aa':'#241528bb';ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(xx-9,yy);ctx.lineTo(xx+9,yy);ctx.stroke();
 }
 ctx.fillStyle='#281e28';ctx.fillRect(x+9,y+26,10,h-24);ctx.fillRect(x+w-19,y+26,10,h-24);
 ctx.fillStyle='#1c1625';ctx.fillRect(x+w/2-27,y+h-68,54,68);ctx.fillStyle='#f5c784';ctx.fillRect(x+20,y+55,27,32);ctx.fillRect(x+w-47,y+55,27,32);glow(x+34,y+68,58,'#ffc06644');glow(x+w-34,y+68,58,'#ffc06644');
 ctx.fillStyle='#201a2b';rr(x+12,y-5,w-24,36,7);ctx.strokeStyle='#b07b9e';ctx.lineWidth=2;ctx.strokeRect(x+12,y-5,w-24,36);ctx.fillStyle='#f9e3d7';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(icon+' '+label,x+w/2,y+17);
 for(let i=0;i<3;i++){ctx.fillStyle='#6b4c36';ctx.fillRect(x-26+i*18,y+h-22,15,22)}
 for(let i=0;i<4;i++){let px=x+20+i*43;ctx.fillStyle='#bf618a';ctx.beginPath();ctx.arc(px,y+43,4,0,Math.PI*2);ctx.fill()}
}
function inLake(x,y){let L=world.lake,dx=(x-(L.x+L.w/2))/(L.w/2),dy=(y-(L.y+L.h/2))/(L.h/2);return dx*dx+dy*dy<1}
function inside(x,y,b,p=0){return x>b.x-p&&x<b.x+b.w+p&&y>b.y-p&&y<b.y+b.h+p}
function collides(x,y){if(scene==='market')return x<470||x>1810||y<245||y>1380;if(x<25||y<25||x>world.w-25||y>world.h-25)return true;if(inLake(x,y)&&!inside(x,y,world.pier,4))return true;for(const b of [world.shop,world.market,world.board,world.altar])if(inside(x,y,b,8))return true;return false}
function playerDraw(){
 const x=player.x-cam.x,y=player.y-cam.y,bob=avatarMoving?Math.sin(avatarWalk)*2.2:Math.sin(performance.now()*.002)*.5;
 ctx.save();ctx.translate(x,y+bob);
 ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(0,18,19,7,0,0,Math.PI*2);ctx.fill();
 // Boots, layered coat, embroidered red mantle.
 const stride=avatarMoving?Math.sin(avatarWalk)*4:0;
 ctx.fillStyle='#191723';ctx.fillRect(-9,11+stride,7,13);ctx.fillRect(3,11-stride,7,13);
 ctx.fillStyle='#211b35';ctx.beginPath();ctx.moveTo(-10,-1);ctx.lineTo(11,-1);ctx.lineTo(17,18);ctx.lineTo(-17,18);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#b75581';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,1);ctx.lineTo(-11,17);ctx.moveTo(7,1);ctx.lineTo(11,17);ctx.stroke();
 ctx.fillStyle='#3d2b4d';ctx.fillRect(-11,-5,22,15);
 ctx.fillStyle='#d6a47d';ctx.fillRect(-6,-17,12,12);
 ctx.fillStyle='#14121f';ctx.beginPath();ctx.moveTo(-13,-11);ctx.quadraticCurveTo(-14,-30,0,-30);ctx.quadraticCurveTo(14,-30,13,-11);ctx.lineTo(8,-16);ctx.lineTo(0,-20);ctx.lineTo(-8,-15);ctx.closePath();ctx.fill();
 ctx.fillStyle='#e6b7ff';ctx.fillRect(avatarFacing>0?2:-5,-14,3,2);
 ctx.strokeStyle='#b48b69';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(avatarFacing*9,3);ctx.lineTo(avatarFacing*22,-14);ctx.stroke();
 ctx.fillStyle='#dcd4e7';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.shadowColor='#13071c';ctx.shadowBlur=7;
 ctx.fillText(demo.active==='Marley'?'cape_lossi':demo.active,0,-35);ctx.restore();
}
function update(dt){if(window.RavenaFishing?.active){detectNear();return;}let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joyX,dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+joyY;avatarMoving=!!(dx||dy);if(avatarMoving){avatarWalk+=dt*13;if(Math.abs(dx)>.1)avatarFacing=dx>0?1:-1;}if(dx||dy){let m=Math.hypot(dx,dy)||1,step=player.speed*dt;dx/=m;dy/=m;let nx=player.x+dx*step,ny=player.y+dy*step;if(!collides(nx,player.y))player.x=nx;if(!collides(player.x,ny))player.y=ny}cam.x=Math.max(0,Math.min(world.w-W,player.x-W/2));cam.y=Math.max(0,Math.min(world.h-H,player.y-H/2));detectNear()}
function lakeEdgeFactor(x,y){let L=world.lake,dx=(x-(L.x+L.w/2))/(L.w/2),dy=(y-(L.y+L.h/2))/(L.h/2);return Math.sqrt(dx*dx+dy*dy)}
function detectNear(){if(scene==='market'){
 near=null;const targets=[['marketCounter',{x:1140,y:650},370,'🌹','Balcão do Mercado','Negociar'],['marketExit',{x:1120,y:1290},165,'🚪','Escadas','Sair']];
 for(const item of targets){if(Math.hypot(player.x-item[1].x,player.y-item[1].y)<item[2]){near=item;break}}
 const h=document.getElementById('hint');if(near){h.classList.remove('hidden');h.innerHTML=`${near[3]} <b>${near[4]}</b><span>Pressione E ou toque para ${near[5].toLowerCase()}</span>`}else h.classList.add('hidden');return;
 }let opts=[['shop',{x:world.shop.x+world.shop.w/2,y:world.shop.y+world.shop.h+30},130,'🏮','Loja','Entrar'],['market',{x:world.market.x+world.market.w/2,y:world.market.y+world.market.h+30},140,'🌹','Mercado','Entrar'],['ranking',{x:world.board.x+world.board.w/2,y:world.board.y+world.board.h+30},120,'🪦','Lápide dos Campeões','Consultar'],['statue',{x:world.altar.x+45,y:world.altar.y+100},120,'🪽','Altar da Ravena','Oferecer']];near=null;for(const o of opts)if(Math.hypot(player.x-o[1].x,player.y-o[1].y)<o[2]){near=o;break}
// A pesca funciona em toda a margem do lago, não apenas no píer. Isso deixa vários jogadores pescarem ao mesmo tempo no futuro.
if(!near){let edge=lakeEdgeFactor(player.x,player.y),onPier=inside(player.x,player.y,world.pier,18);if((edge>=.94&&edge<=1.18)||onPier)near=['fishing',{x:player.x,y:player.y},0,'🎣',onPier?'Píer':'Margem do Lago','Pescar']}
let h=document.getElementById('hint');if(near){h.classList.remove('hidden');h.innerHTML=`${near[3]} <b>${near[4]}</b><span>Pressione E ou toque para ${near[5].toLowerCase()}</span>`}else h.classList.add('hidden')}
function enterMarket(){marketReturn={x:player.x,y:player.y};scene='market';player.x=1120;player.y=1170;cam.x=cam.y=0;toast('🌹 Desça ao salão e caminhe até o balcão para negociar.')}
function leaveMarket(){scene='lake';player.x=marketReturn.x;player.y=marketReturn.y;document.getElementById('panel').classList.remove('show');toast('🌙 Você voltou à vila.')}
function interact(){if(!near)return;if(near[0]==='fishing')goFish();else if(near[0]==='market')transition('Mercado Noturno',enterMarket);else if(near[0]==='marketExit')transition('Vila da Ravena',leaveMarket);else if(near[0]==='marketCounter')openPanel('market');else transition(near[4],()=>openPanel(near[0]))}
// V5: a captura agora depende de habilidade, não de sorte instantânea.
function goFish(){
 if(window.RavenaFishing?.active)return;
 if(bait<=0)return toast('Você ficou sem iscas. Visite a Loja.');
 if(scene!=='lake')return;
 bait--;updateHud();save();
 window.RavenaFishing.start({
  onCatch:(skill)=>{
   let roll=Math.random()+Math.min(.13,skill*.11)+(Date.now()<ravenaBlessingUntil?.035:0);
   let idx=roll>.997?5:roll>.985?4:roll>.91?3:roll>.68?2:roll>.32?1:0;
   let f=fish[idx],weight=+(f[2]+Math.random()*(f[3]-f[2])).toFixed(2);
   inventory.push({id:++demo.nextId,name:f[0],rarity:f[1],weight,value:Math.round(f[4]*weight/f[2])});recordCatch(f[0],f[1],weight);
   updateHud();save();
   toast(`🎣 Você pescou <b>${f[0]}</b> • ${weight} kg • ${f[1]}!`);
  },
  onMiss:()=>toast('💦 O peixe escapou! Tente novamente.')
 });
}
// Economia demonstrativa: dois perfis locais, sem rede e sem dinheiro real.
const demoKey='ravenaTradeV4';
const progressionKey='ravenaProgressV5_2';
let progress={players:{},blessingUntil:{}};
try{const data=JSON.parse(localStorage.getItem(progressionKey));if(data&&typeof data==='object'){progress.players=data.players||{};progress.blessingUntil=data.blessingUntil||{}}}catch{}
let ravenaBlessingUntil=0;
function saveProgress(){localStorage.setItem(progressionKey,JSON.stringify(progress))}
function recordCatch(name,rarity,weight){
 let entry=progress.players[demo.active]||{catches:0,best:0,legendary:0};
 entry.catches++;entry.best=Math.max(entry.best,weight);
 if(rarity==='Lendário'){entry.legendary++;toast('✨ Uma criatura lendária respondeu ao chamado da Ravena!')}
 progress.players[demo.active]=entry;saveProgress();
}
function offerToRavena(id){
 const i=inventory.findIndex(f=>f.id===id);if(i<0)return;
 const fish=inventory[i];inventory.splice(i,1);
 ravenaBlessingUntil=Date.now()+10*60*1000;
 progress.blessingUntil[demo.active]=ravenaBlessingUntil;
 save();saveProgress();openPanel('statue');
 toast('🪽 Ravena aceitou '+fish.name+'. Bênção ativa por 10 minutos!');
}
function renderStatue(b){
 const remaining=Math.max(0,Math.ceil((ravenaBlessingUntil-Date.now())/60000));
 b.innerHTML=`<div class="eyebrow">Santuário • margem sul</div><h2>🪽 Altar da Ravena</h2><p>Ofereça um peixe para receber a bênção da Ravena por 10 minutos. A bênção aumenta um pouco as chances de capturas raras.</p><div class="card"><h3>${remaining?'✨ Bênção ativa • '+remaining+' min restantes':'🌙 A Ravena aguarda sua oferenda'}</h3><small>A oferenda consome permanentemente o peixe escolhido.</small></div><div class="cards">${inventory.map(f=>`<div class="card"><h3>🐟 ${f.name}</h3><small>${f.rarity} • ${f.weight} kg</small><button class="btn" onclick="offerToRavena(${f.id})">Oferecer à Ravena</button></div>`).join('')||'<div class="card">Você não possui peixes para oferecer.</div>'}</div>`;
}
function renderRanking(b){
 const players=Object.entries(progress.players).sort((a,c)=>c[1].legendary-a[1].legendary||c[1].best-a[1].best||c[1].catches-a[1].catches);
 b.innerHTML=`<div class="eyebrow">Lápide dos Campeões • registros locais</div><h2>🪦 Ranking da Ravena</h2><p>Classificação deste navegador por lendários, maior peso e total de capturas. Ainda não é um ranking online.</p><div class="cards">${players.map(([name,v],i)=>`<div class="card"><h3>${['🥇','🥈','🥉'][i]||'🪦'} ${name==='Marley'?'cape_lossi':name}</h3><small>✨ ${v.legendary} lendários • ⚖️ ${v.best.toFixed(2)} kg • 🎣 ${v.catches} capturas</small></div>`).join('')||'<div class="card">A lápide está vazia. Pesque para gravar seu primeiro registro!</div>'}</div>`;
}

let demo={active:'Marley',users:{Marley:{coins:1635,bait:7,inventory:[]},Nyx:{coins:2400,bait:9,inventory:[{id:101,name:'Bagre Fantasma',rarity:'Épico',weight:13.2,value:620},{id:102,name:'Carpa Lunar',rarity:'Comum',weight:2.4,value:90}]}},listings:[],offers:[],nextId:1000};
try{let saved=JSON.parse(localStorage.getItem(demoKey));if(saved&&saved.users&&saved.listings&&saved.offers)demo=saved}catch{}
function me(){return demo.users[demo.active]}
function syncFromAccount(){ravenaBlessingUntil=progress.blessingUntil[demo.active]||0;coins=me().coins;bait=me().bait;inventory=me().inventory;updateHud();document.getElementById('playerName').textContent=demo.active==='Marley'?'cape_lossi':demo.active}
function syncToAccount(){me().coins=coins;me().bait=bait;me().inventory=inventory}
function save(){syncToAccount();localStorage.setItem(demoKey,JSON.stringify(demo))}
function switchPlayer(){if(scene!=='market')return toast('Entre no Mercado Noturno.');save();demo.active=demo.active==='Marley'?'Nyx':'Marley';syncFromAccount();save();openPanel('market');toast('🎭 Agora você está testando como '+demo.active)}
function safeNum(v){return Math.max(1,Math.min(999999,Math.floor(Number(v)||0)))}
function openPanel(type){if(type==='market'&&scene!=='market'){toast('🌹 Entre no Mercado Noturno para negociar.');return;}let b=document.getElementById('panelBody');
 if(type==='shop')b.innerHTML=`<div class="eyebrow">Mercadora da Lua</div><h2>🏮 Loja de Pesca</h2><p>Loja do sistema: compre iscas para pescar.</p><div class="cards"><div class="card"><h3>🪱 Pacote de Iscas</h3><small>+5 iscas</small><div class="row"><b class="price">🪙 120</b><button class="btn" onclick="buyBait()">Comprar</button></div></div></div>`;
 else if(type==='market')renderMarket(b);
 else if(type==='ranking')renderRanking(b);
 else if(type==='statue')renderStatue(b);
 else renderInventory(b);
 document.getElementById('panel').classList.add('show')}
function renderInventory(b=document.getElementById('panelBody')){b.innerHTML=`<div class="eyebrow">Mochila de ${demo.active==='Marley'?'cape_lossi':demo.active}</div><h2>🎒 Inventário</h2><p>Venda ao sistema aqui. Para anunciar ou trocar com jogadores, entre no Mercado Noturno.</p><div class="cards">${inventory.map(f=>`<div class="card"><h3>🐟 ${f.name}</h3><small>${f.rarity} • ${f.weight} kg</small><div class="row"><span class="price">🪙 ${f.value}</span><button class="btn" onclick="sellFish(${f.id})">Venda rápida</button></div><div class="row"><button class="btn" onclick="createListing(${f.id})" ${scene==='market'?'':'disabled'}>🌹 Anunciar no Mercado</button><button class="btn" onclick="createOffer(${f.id})" ${scene==='market'?'':'disabled'}>🔄 Oferecer trade</button></div></div>`).join('')||'<div class="card">Pesque na margem ou troque para Nyx no Mercado.</div>'}</div>`}
function marketTabs(){return `<div class="market-tools"><span>🎭 Jogador de teste: <b>${demo.active==='Marley'?'cape_lossi':demo.active}</b></span><button class="btn" onclick="switchPlayer()">Alternar cape_lossi / Nyx</button></div><div class="market-tools"><button class="btn" onclick="openPanel('inventory')">🎒 Meu inventário / Anunciar</button><button class="btn" onclick="renderMarket()">🌹 Atualizar Mercado</button></div>`}
function renderMarket(b=document.getElementById('panelBody')){if(scene!=='market')return toast('Entre no Mercado Noturno para negociar.');
 let listings=demo.listings.map(l=>{let mine=l.seller===demo.active;return `<div class="card"><h3>🐟 ${l.fish.name}</h3><small>${l.fish.rarity} • ${l.fish.weight} kg • vendedor: ${l.seller==='Marley'?'cape_lossi':l.seller}</small><div class="row"><b class="price">🪙 ${l.price}</b><button class="btn" onclick="${mine?'cancelListing':'buyListing'}(${l.id})">${mine?'Cancelar anúncio':'Comprar'}</button></div></div>`}).join('');
 let offers=demo.offers.map(o=>{let mine=o.from===demo.active,other=demo.users[demo.active].inventory;return `<div class="card"><h3>🔄 ${o.fish.name}</h3><small>${o.fish.weight} kg • oferecido por ${o.from==='Marley'?'cape_lossi':o.from}</small><p>${mine?'Aguardando outro jogador aceitar.':'Selecione um peixe seu para dar em troca.'}</p><div class="row">${mine?`<button class="btn" onclick="cancelOffer(${o.id})">Cancelar oferta</button>`:`<select id="trade-${o.id}" aria-label="Peixe para trocar">${other.map(f=>`<option value="${f.id}">${f.name} (${f.weight} kg)</option>`).join('')}</select><button class="btn" onclick="acceptOffer(${o.id})" ${other.length?'':'disabled'}>Aceitar troca</button>`}</div></div>`}).join('');
 b.innerHTML=`<div class="eyebrow">Negociações entre jogadores • demonstração local</div><h2>🌹 Mercado Noturno</h2><p>Os anúncios e trocas ficam reservados até serem comprados, cancelados ou aceitos.</p>${marketTabs()}<h3>🪙 Compra e venda</h3><div class="cards">${listings||'<div class="card">Nenhum peixe anunciado. Abra o inventário e anuncie um.</div>'}</div><h3>🤝 Trocas diretas</h3><div class="cards">${offers||'<div class="card">Nenhuma oferta de troca. Abra o inventário para oferecer um peixe.</div>'}</div><p class="disclaimer">Teste no mesmo navegador: alternar perfil não representa multiplayer online.</p>`}
function buyBait(){if(coins<120)return toast('Saldo insuficiente.');coins-=120;bait+=5;updateHud();save();toast('🪱 +5 iscas adicionadas.')}
function sellFish(id){let i=inventory.findIndex(x=>x.id===id);if(i<0)return;let f=inventory[i];coins+=f.value;inventory.splice(i,1);updateHud();save();renderInventory();toast(`🪙 ${f.value} moedas pela venda ao sistema.`)}
function createListing(id){if(scene!=='market')return toast('🌹 Negociações só são permitidas no Mercado Noturno.');let f=inventory.find(x=>x.id===id);if(!f)return;let price=prompt(`Preço em moedas para ${f.name}:`,String(f.value));if(price===null)return;price=safeNum(price);if(!price)return toast('Preço inválido.');inventory=inventory.filter(x=>x.id!==id);demo.listings.push({id:++demo.nextId,seller:demo.active,fish:f,price});save();updateHud();renderMarket();toast('🌹 Peixe anunciado! Troque para Nyx para testar a compra.')}
function buyListing(id){if(scene!=='market')return toast('🌹 Negociações só são permitidas no Mercado Noturno.');let l=demo.listings.find(x=>x.id===id);if(!l||l.seller===demo.active)return toast('Você não pode comprar seu anúncio.');if(coins<l.price)return toast('Saldo insuficiente.');let seller=demo.users[l.seller];if(!seller)return toast('Vendedor indisponível.');coins-=l.price;seller.coins+=l.price;inventory.push(l.fish);demo.listings=demo.listings.filter(x=>x.id!==id);save();updateHud();renderMarket();toast(`🐟 Compra concluída! ${l.seller} recebeu 🪙 ${l.price}.`)}
function cancelListing(id){if(scene!=='market')return toast('🌹 Negociações só são permitidas no Mercado Noturno.');let l=demo.listings.find(x=>x.id===id);if(!l||l.seller!==demo.active)return;inventory.push(l.fish);demo.listings=demo.listings.filter(x=>x.id!==id);save();updateHud();renderMarket();toast('Anúncio cancelado; peixe devolvido.')}
function createOffer(id){if(scene!=='market')return toast('🌹 Negociações só são permitidas no Mercado Noturno.');let f=inventory.find(x=>x.id===id);if(!f)return;inventory=inventory.filter(x=>x.id!==id);demo.offers.push({id:++demo.nextId,from:demo.active,fish:f});save();updateHud();renderMarket();toast('🤝 Oferta criada. Troque de jogador para aceitar.')}
function cancelOffer(id){if(scene!=='market')return toast('🌹 Negociações só são permitidas no Mercado Noturno.');let o=demo.offers.find(x=>x.id===id);if(!o||o.from!==demo.active)return;inventory.push(o.fish);demo.offers=demo.offers.filter(x=>x.id!==id);save();updateHud();renderMarket();toast('Oferta cancelada.')}
function acceptOffer(id){if(scene!=='market')return toast('🌹 Negociações só são permitidas no Mercado Noturno.');let o=demo.offers.find(x=>x.id===id);if(!o||o.from===demo.active)return;let selector=document.getElementById('trade-'+id),fishId=Number(selector?.value),idx=inventory.findIndex(f=>f.id===fishId);if(idx<0)return toast('Você precisa ter um peixe para trocar.');let given=inventory.splice(idx,1)[0];demo.users[o.from].inventory.push(given);inventory.push(o.fish);demo.offers=demo.offers.filter(x=>x.id!==id);save();updateHud();renderMarket();toast('🤝 Troca concluída! Cada jogador recebeu o peixe do outro.')}
function transition(name,cb){let el=document.getElementById('roseTransition');document.getElementById('roseText').textContent='Entrando em '+name+'...';el.classList.add('show');setTimeout(()=>{cb();setTimeout(()=>el.classList.remove('show'),180)},520)}
function toast(s){let t=document.getElementById('toast');t.innerHTML=s;t.classList.add('show');clearTimeout(t._to);t._to=setTimeout(()=>t.classList.remove('show'),2400)}
function updateHud(){document.getElementById('coins').textContent=coins;document.getElementById('bait').textContent=bait;document.getElementById('bag').textContent=inventory.reduce((a,b)=>a+b.weight,0).toFixed(1)}
syncFromAccount();
function bindTap(el,fn){let fired=0;el.addEventListener('pointerup',e=>{e.preventDefault();e.stopPropagation();fired=Date.now();fn(e)});el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(Date.now()-fired>450)fn(e)})}
bindTap(document.getElementById('closePanel'),()=>document.getElementById('panel').classList.remove('show'));document.getElementById('panel').addEventListener('pointerup',e=>{if(e.target.id==='panel')e.currentTarget.classList.remove('show')});bindTap(document.getElementById('bagBtn'),()=>openPanel('inventory'));bindTap(document.getElementById('action'),interact);
// Botões criados dentro dos painéis usam delegação para responder melhor a toque no celular.
// Botões internos usam click nativo, evitando disparos duplicados no toque.
let joyX=0,joyY=0,joy=document.getElementById('joy'),stick=document.getElementById('stick'),jid=null;function joyMove(e){let t=[...e.changedTouches].find(x=>x.identifier===jid);if(!t)return;let r=joy.getBoundingClientRect(),dx=t.clientX-(r.left+r.width/2),dy=t.clientY-(r.top+r.height/2),m=Math.hypot(dx,dy),max=35;if(m>max){dx=dx/m*max;dy=dy/m*max}joyX=dx/max;joyY=dy/max;stick.style.transform=`translate(${dx}px,${dy}px)`}joy.addEventListener('touchstart',e=>{jid=e.changedTouches[0].identifier;joyMove(e)},{passive:false});joy.addEventListener('touchmove',e=>{e.preventDefault();joyMove(e)},{passive:false});joy.addEventListener('touchend',e=>{if([...e.changedTouches].some(x=>x.identifier===jid)){jid=null;joyX=joyY=0;stick.style.transform=''}},{passive:false});
function drawRemotePlayers(){
  if(!window.RavenaOnline)return;
  for(const p of RavenaOnline.getPeers()){
    const x=p.x-cam.x,y=p.y-cam.y;
    if(x < -30 || y < -40 || x > W+30 || y > H+30)continue;
    ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x,y+15,16,6,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#9e62ba';ctx.beginPath();ctx.arc(x,y-7,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#553a75';ctx.fillRect(x-10,y+3,20,17);
    ctx.fillStyle='#fff';ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(p.name,x,y-24);
  }
}
if(window.RavenaOnline){
  RavenaOnline.subscribe((status,count)=>{
    const el=document.getElementById('onlineStatus');if(!el)return;
    el.textContent=status==='online'?`● Online • ${count+1} jogadores`:status==='connecting'?'◌ Conectando...':status==='error'?'● Sem conexão':'◌ Modo solo';
    el.dataset.status=status;
  });
}
function loop(now){let dt=Math.min((now-last)/1000,.033);last=now;update(dt);ground();drawRemotePlayers();playerDraw();drawForeground(now);if(window.RavenaOnline)RavenaOnline.move(player.x,player.y);requestAnimationFrame(loop)}requestAnimationFrame(loop);
