/* Sport Comic / design 02. Resolution-independent 2D characters.
 * Uses the existing look, kit, pose and feet-anchor contracts. All shapes are
 * drawn directly, so colors/accessories stay editable and joints never expose
 * cut-image seams. No external artwork, textures or asynchronous asset loads.
 */
(function (global) {
  'use strict';
  const INK = '#172c2c';
  const colorCache = new Map();
  function shade(color, amount) {
    const key = color + ':' + amount;
    if (colorCache.has(key)) return colorCache.get(key);
    const value = global.SoccerKit.shade(color, amount);
    if (colorCache.size > 256) colorCache.clear();
    colorCache.set(key, value);
    return value;
  }
  function polygon(ctx, points, fill, stroke = true) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) ctx.stroke();
  }
  function line(ctx, points, color, width) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke(); ctx.restore();
  }
  function ellipse(ctx, x, y, rx, ry, color, stroke = false) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill(); if (stroke) ctx.stroke();
  }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function between(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; }
  function plus(a, x, y) { return [a[0] + x, a[1] + y]; }
  function normal(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  }
  // One continuous silhouette through an elbow/knee, with flat shaded planes.
  function limb(ctx, a, b, c, wa, wb, wc, color) {
    const n = normal(a, b), m = normal(b, c);
    const q = [(n[0] + m[0]) / 2, (n[1] + m[1]) / 2];
    const v = (p, d, w) => [p[0] + d[0] * w, p[1] + d[1] * w];
    const points = [v(a,n,wa),v(b,q,wb),v(c,m,wc),v(c,m,-wc),v(b,q,-wb),v(a,n,-wa)];
    polygon(ctx, points, color);
    polygon(ctx, [v(a,n,-wa*.25),v(b,q,-wb*.18),v(c,m,-wc*.18),...points.slice(3)], shade(color,-.23), false);
  }
  function segment(ctx, a, b, wa, wb, color, trim) {
    const mid = between(a, b, .5);
    limb(ctx, a, mid, b, wa, (wa+wb)*.5, wb, color);
    if (trim) {
      const n=normal(a,b),p=between(a,b,.84),q=between(a,b,.96);
      polygon(ctx, [plus(p,n[0]*wb,n[1]*wb),plus(q,n[0]*wb,n[1]*wb),plus(q,-n[0]*wb,-n[1]*wb),plus(p,-n[0]*wb,-n[1]*wb)], trim, false);
    }
  }
  function band(ctx, a, b, k, width, depth, color) {
    const p = between(a,b,k), n=normal(a,b), u=[n[1],-n[0]];
    polygon(ctx, [plus(p,n[0]*width+u[0]*depth,n[1]*width+u[1]*depth),plus(p,-n[0]*width+u[0]*depth,-n[1]*width+u[1]*depth),plus(p,-n[0]*width-u[0]*depth,-n[1]*width-u[1]*depth),plus(p,n[0]*width-u[0]*depth,n[1]*width-u[1]*depth)], color);
  }
  function hand(ctx, elbow, wrist, skin, glove, detail) {
    const angle=Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0])-Math.PI/2;
    ctx.save();ctx.translate(...wrist);ctx.rotate(angle);
    const color=glove||skin;
    polygon(ctx,[[-21,-7],[18,-9],[29,8],[27,37],[9,51],[-21,41],[-28,18]],color);
    polygon(ctx,[[12,0],[24,8],[21,34],[7,43],[-17,35],[-17,27],[6,30]],shade(color,-.22),false);
    if(detail){line(ctx,[[-19,12],[-6,8],[4,17],[-1,26]],shade(color,-.42),5);line(ctx,[[11,25],[20,27]],shade(color,-.42),4);}
    if(glove)line(ctx,[[-19,0],[18,-1]],'#387c7c',9);
    ctx.restore();
  }
  function boot(ctx, ankle, color, angle, detail) {
    ctx.save();ctx.translate(...ankle);ctx.rotate(angle);
    polygon(ctx,[[-28,-13],[26,-12],[34,14],[64,29],[68,48],[54,58],[-34,57],[-41,42]],shade(color,-.1));
    polygon(ctx,[[-40,39],[19,39],[62,31],[68,48],[54,58],[-34,57]],shade(color,-.42),false);
    polygon(ctx,[[-20,-8],[12,-7],[19,15],[46,29],[19,29],[-27,23]],shade(color,.19),false);
    if(detail){line(ctx,[[-17,5],[10,2]],shade(color,.45),4);line(ctx,[[-13,14],[16,12]],shade(color,.45),4);line(ctx,[[25,27],[38,23]],'#e7eade',8);}
    ctx.restore();
  }
  function hair(ctx, style, col, skin, t, backLayer, rear) {
    if(backLayer){
      if(style==='long')polygon(ctx,[[-.89,-.68],[-1.17,-.18],[-1.14,1.26],[-.71,1.39],[.97,1.28],[1.02,-.67]],col);
      if(style==='ponytail'){
        ctx.save();ctx.translate(-.84,-.25);ctx.rotate(Math.sin(t*3)*.08);
        polygon(ctx,[[0,-.12],[-.48,.08],[-.68,.54],[-.51,1.18],[-.16,.78],[.17,.09]],col);ctx.restore();
      }
      if(style==='dreads')for(let i=0;i<7;i++){
        const x=(i-3)*.30,w=Math.sin(t*2.5+i)*.035;
        line(ctx,[[x,-.65],[x*1.1+w,.53],[x*1.17+w,1.20]],shade(col,i%2?.08:-.1),.19);
      }
      return;
    }
    if(style==='bald') { polygon(ctx,[[-.45,-.84],[-.09,-.96],[.18,-.81],[-.27,-.65]],shade(skin,.17),false);return; }
    if(style==='buzz'||style==='mohawk') {
      const shaved=global.SoccerKit.shade(col,.12);
      polygon(ctx,[[-.96,-.3],[-.92,-.83],[-.54,-1.09],[.4,-1.12],[.85,-.82],[.96,-.36],[.76,-.39],[.53,-.7],[-.37,-.63],[-.77,-.16]],shaved);
      if(style==='mohawk')polygon(ctx,[[-.26,-.67],[-.28,-1.45],[.06,-1.69],[.34,-1.4],[.23,-.65]],col);
    } else if(style==='curly'||style==='afro'){
      const radius=style==='afro'?1.12:.83;
      for(let i=0;i<9;i++){
        const a=Math.PI+(i/8)*Math.PI;
        ellipse(ctx,Math.cos(a)*radius,-.37+Math.sin(a)*radius*.77,style==='afro'?.42:.29,style==='afro'?.4:.27,col,true);
      }
      polygon(ctx,[[-.92,-.33],[-.73,-.8],[.66,-.87],[.91,-.32],[.65,-.42],[.12,-.52],[-.52,-.31],[-.68,.13],[-.9,.04]],col,false);
      ellipse(ctx,-.40,-1.09,.28,.13,shade(col,.15));
    } else {
      const short=style==='short';
      polygon(ctx,short?[[-.94,.13],[-1.02,-.43],[-1.15,-.79],[-.99,-.91],[-1.3,-1.01],[-.73,-1.15],[-.9,-1.35],[-.23,-1.25],[-.43,-1.48],[.34,-1.30],[.72,-1.12],[.97,-1.34],[.93,-.89],[1.12,-.9],[.92,-.55],[.32,-.46],[.58,-.78],[-.17,-.53],[-.48,-.61],[-.70,-.31],[-.72,.14]]:[[-.96,.08],[-1.01,-.67],[-.68,-1.15],[.36,-1.21],[.86,-.91],[.98,-.35],[.60,-.61],[-.17,-.51],[-.66,-.30],[-.73,.15]],col);
      polygon(ctx,[[-.94,-.95],[-.27,-1.19],[.36,-1.09],[.57,-.9],[-.26,-.84],[-.7,-.69]],shade(col,.22),false);
      polygon(ctx,[[-.6,-.74],[.2,-.84],[.79,-.75],[.54,-.64],[.04,-.59]],shade(col,.10),false);
      if(style==='bun')ellipse(ctx,-.05,-1.27,.34,.29,col,true);
    }
    if(rear)polygon(ctx,[[-.92,-.43],[.85,-.47],[.87,.38],[.6,.80],[.08,.91],[-.49,.72],[-.82,.33]],col);
  }
  function drawHead(ctx, x, y, radius, look, facing, t, view='front') {
    look=look||{};
    const skin=look.skin||'#e3a97f',col=look.hair||'#4a3021',style=look.style||'short',acc=look.acc||{},rear=view==='back';
    ctx.save();ctx.translate(x,y);ctx.scale(radius*(facing<0?-1:1),radius);
    ctx.strokeStyle=INK;ctx.lineWidth=Math.max(.065,.6/radius);ctx.lineJoin='round';ctx.lineCap='round';
    hair(ctx,style,col,skin,t,true,rear);
    polygon(ctx,[[-.81,-.73],[-.48,-1.03],[.48,-1.01],[.85,-.67],[.91,-.02],[.79,.58],[.32,.99],[-.28,.94],[-.77,.52],[-.91,-.08]],skin);
    polygon(ctx,[[.67,-.64],[.89,-.02],[.79,.58],[.32,.99],[-.28,.94],[-.53,.58],[.03,.76],[.51,.48]],shade(skin,-.22),false);
    polygon(ctx,[[-.85,.02],[-1.05,-.09],[-1.14,.10],[-1.02,.35],[-.82,.40],[-.68,.19]],skin);
    if(radius>=9&&!rear){
      line(ctx,[[-1.01,.1],[-.89,.13],[-.88,.26]],shade(skin,-.28),.055);
      if(view!=='side'){
        polygon(ctx,[[-.49,-.04],[-.20,-.02],[-.06,.10],[-.25,.20],[-.45,.13]],'#fff8e8',false);
        ellipse(ctx,-.23,.084,.074,.108,'#173134');
        polygon(ctx,[[-.54,-.21],[-.11,-.12],[-.07,-.02],[-.50,-.08]],col,false);
      }
      polygon(ctx,[[.36,-.02],[.61,-.09],[.68,.00],[.6,.12],[.38,.14]],'#fff8e8',false);
      ellipse(ctx,.58,.035,.06,.093,'#173134');
      polygon(ctx,[[.32,-.15],[.72,-.26],[.73,-.11],[.37,-.02]],col,false);
      line(ctx,[[.44,.17],[.58,.38],[.35,.43]],shade(skin,-.42),.055);
      line(ctx,[[.02,.66],[.41,.64]],shade(skin,-.55),.055);
    }
    hair(ctx,style,col,skin,t,false,rear);
    if(acc.headband){
      polygon(ctx,[[-.95,-.45],[.88,-.59],[.91,-.37],[-.93,-.23]],acc.headband);
    }
    if(acc.sunglasses&&!rear){
      polygon(ctx,[[-.57,-.08],[-.04,-.03],[-.13,.26],[-.47,.22]],'#182327');
      polygon(ctx,[[.29,-.02],[.76,-.13],[.72,.20],[.36,.24]],'#182327');
      line(ctx,[[-.07,.04],[.32,.03]],'#182327',.085);
      line(ctx,[[-.47,.01],[-.26,.03]],'#819d9e',.04);
    }
    if(acc.earring||acc.diamond){
      ellipse(ctx,-1,.34,.095,.095,acc.diamond?'#d5f5ff':'#d8dedd',true);
      if(acc.diamond&&radius>=9){const k=.11+Math.sin(t*4)*.04;line(ctx,[[-1-k,.34],[-1+k,.34]],'#fff',.035);line(ctx,[[-1,.34-k],[-1,.34+k]],'#fff',.035);}
    }
    ctx.restore();
  }
  function torso(ctx,kit,skin,acc,back,detail){
    polygon(ctx,[[-49,-842],[47,-842],[52,-791],[82,-768],[0,-718],[-75,-773],[-48,-790]],skin);
    polygon(ctx,[[2,-828],[45,-837],[47,-792],[23,-769],[-30,-793]],shade(skin,-.26),false);
    const outline=[[-55,-789],[-130,-785],[-166,-759],[-145,-668],[-120,-621],[-117,-519],[-129,-477],[-67,-462],[112,-470],[118,-553],[126,-632],[157,-722],[135,-774],[56,-789],[8,-760]];
    polygon(ctx,outline,kit.shirt);
    ctx.save();polygon(ctx,outline,null,false);ctx.clip();
    if(kit.pattern==='stripes'){
      for(let i=-2;i<=2;i+=2){ctx.fillStyle=kit.trim;ctx.fillRect(i*45-19,-795,34,335);}
    }
    polygon(ctx,[[100,-780],[75,-704],[79,-573],[111,-534],[83,-503],[-115,-487],[-128,-463],[130,-462],[146,-682]],shade(kit.shirt,-.25),false);
    polygon(ctx,[[-122,-767],[-59,-780],[-16,-746],[-113,-706],[-137,-716]],shade(kit.shirt,.13),false);
    if(detail){
      polygon(ctx,[[-71,-647],[58,-623],[-3,-600]],shade(kit.shirt,-.15),false);
      polygon(ctx,[[-70,-549],[33,-565],[76,-535],[-13,-547]],shade(kit.shirt,-.18),false);
      polygon(ctx,[[68,-688],[40,-658],[105,-664]],shade(kit.shirt,.08),false);
    }
    ctx.restore();
    polygon(ctx,outline,null,true);
    if(back)line(ctx,[[-53,-784],[-28,-775],[7,-771],[54,-784]],kit.trim,14);
    else{
      line(ctx,[[-55,-785],[6,-752],[56,-785]],kit.trim,16);
      line(ctx,[[-53,-784],[6,-752],[54,-784]],shade(kit.trim,-.16),5);
      if(detail)polygon(ctx,[[64,-720],[91,-720],[89,-690],[76,-679],[63,-691]],kit.trim,false);
    }
    if(acc.chain&&!back){
      line(ctx,[[-47,-781],[-37,-739],[4,-713],[38,-742],[48,-781]],'#e9c968',7);
      polygon(ctx,[[2,-715],[13,-702],[2,-687],[-8,-701]],'#f6d77a');
    }
  }
  function solveKnee(hip,foot,bend){
    const a=205,b=204,dx=foot[0]-hip[0],dy=foot[1]-hip[1],d=Math.max(1,Math.min(a+b-.01,Math.hypot(dx,dy)));
    const theta=Math.atan2(dy,dx)+bend*Math.acos(Math.max(-1,Math.min(1,(a*a+d*d-b*b)/(2*a*d))));
    return plus(hip,Math.cos(theta)*a,Math.sin(theta)*a);
  }
  function drawFigure(ctx,x,y,height,kit,look,options,t){
    kit=global.SoccerKit.normKit(kit);look=look||{};options=options||{};t=Number.isFinite(t)?t:0;
    const skin=look.skin||'#e3a97f',acc=look.acc||{},detail=height>=110,view=options.view||'front',rear=view==='back';
    const seed=options.seed!=null?options.seed:(options.x||0)*3.1+(options.y||0)*1.7;
    let pose=options.pose||'idle';
    const kickAge=options.kickStarted!=null?t-options.kickStarted:null;
    if(pose==='kick'&&kickAge!=null&&kickAge>.7)pose='idle';
    const run=pose==='run'?1:pose==='jog'?.55:0,keeper=pose==='keeper',celebrate=pose==='celebrate';
    const ph=t*(pose==='jog'?7:9)+seed,swing=Math.sin(ph),lean=options.lean||0;
    const kp=options.kickProgress!=null?options.kickProgress:kickAge!=null?Math.max(0,kickAge/.7):(t%1.4)/1.4;
    const ease=k=>{k=Math.max(0,Math.min(1,k));return k*k*(3-2*k);};
    const strike=pose==='kick'?(kp<.30?-.45*ease(kp/.3):kp<.46?-.45+1.45*ease((kp-.3)/.16):1-ease((kp-.46)/.54)):0;
    const bob=run?-Math.abs(Math.cos(ph))*13:celebrate?-Math.max(0,Math.sin(t*6))*22:Math.sin(t*2+seed)*3;
    const dip=keeper?55:0,bodyX=run?swing*7:Math.sin(t*1.7+seed)*3;
    const face=options.facing==='left'?-1:1,scale=height/1050;
    ctx.save();ctx.fillStyle='rgba(0,28,8,.22)';ctx.beginPath();ctx.ellipse(x+height*.075+lean*height*.18,y+height*.022,height*(.22+Math.abs(lean)*.09),height*.072,.2,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(x,y-Math.abs(lean)*height*.1);
    if(lean){ctx.translate(0,-height*.47);ctx.rotate(lean*1.14);ctx.translate(0,height*.47);}
    ctx.scale(scale*face,scale);ctx.lineWidth=Math.max(8,.62/scale);ctx.strokeStyle=INK;ctx.lineJoin='round';ctx.lineCap='round';
    const legs=[],arms=[];
    for(const side of [-1,1]){
      const phase=ph+(side>0?Math.PI:0),s=Math.sin(phase),lift=Math.max(0,Math.cos(phase));
      const hip=[side*65+bodyX,-450+bob+dip];
      let foot=[side*(keeper?149:91)+run*s*(view==='side'?108:35),-55-run*lift*112];
      if(celebrate)foot[1]+=bob;
      if(pose==='kick'&&side===1)foot=[100+strike*191,-55-Math.max(0,strike)*170-Math.max(0,-strike)*50];
      let knee=run&&view!=='side'?[side*78+bodyX+s*21,-250+bob-lift*run*62]:solveKnee(hip,foot,-1);
      if(!run&&!keeper&&!celebrate&&pose!=='kick')knee=[side*81+bodyX*.5,-252+bob*.3];
      legs.push({side,hip,knee,foot,phase});
      const shoulder=[side*139+bodyX,-752+bob+dip];
      let elbow=plus(shoulder,side*47,143),wrist=plus(elbow,side*15,132);
      if(run){elbow=plus(shoulder,side*(48-run*6)+s*18*run,144-s*17*run);wrist=plus(elbow,lerp(side*15,-side*64+s*28,run),lerp(132,-61+s*19,run));}
      if(celebrate){elbow=plus(shoulder,side*75,-110);wrist=plus(elbow,side*25+Math.sin(t*3)*8,-150);}
      if(keeper){elbow=plus(shoulder,side*100,75);wrist=plus(elbow,side*52,-112);}
      if(pose==='kick'){elbow=plus(shoulder,side*(55+Math.abs(strike)*51),130-Math.abs(strike)*35);wrist=plus(elbow,side*(20+Math.abs(strike)*63),118-Math.abs(strike)*43);}
      arms.push({side,shoulder,elbow,wrist});
    }
    const arm=(a)=>{
      const {side,shoulder,elbow,wrist}=a;
      limb(ctx,shoulder,elbow,wrist,43,33,22,acc.thermal||skin);
      const cuff=between(shoulder,elbow,.48);
      segment(ctx,shoulder,cuff,53,47,kit.shirt,kit.trim);
      if(acc.captain&&side===1)band(ctx,shoulder,elbow,.38,51,14,acc.captain);
      if(acc.wristbands)band(ctx,elbow,wrist,.86,25,12,acc.wristbands);
      hand(ctx,elbow,wrist,skin,keeper?'#eff4df':acc.gloves,detail);
      if(detail)line(ctx,[plus(elbow,-7,-8),plus(elbow,7,2)],shade(acc.thermal||skin,-.28),4);
    };
    arm(arms[0]);
    const order=swing>0?[0,1]:[1,0];
    for(const index of order){
      const {side,hip,knee,foot,phase}=legs[index];
      limb(ctx,hip,knee,foot,45,33,24,skin);
      const sockTop=between(knee,foot,.18);
      segment(ctx,sockTop,foot,35,25,kit.socks);
      band(ctx,knee,foot,.25,35,7,kit.trim);
      const hem=between(hip,knee,.48);
      segment(ctx,plus(hip,0,-29),hem,64,59,kit.shorts);
      if(detail){
        const n=normal(hip,hem);line(ctx,[plus(hip,n[0]*side*50,n[1]*side*50),plus(hem,n[0]*side*48,n[1]*side*48)],kit.trim,7);
        polygon(ctx,[plus(knee,-19,-18),plus(knee,15,-9),plus(knee,6,12)],shade(skin,-.18),false);
      }
      boot(ctx,foot,look.boot||'#16161a',run?Math.sin(phase)*.14:pose==='kick'&&side===1?-strike*.36:0,detail);
    }
    ctx.save();ctx.translate(bodyX,bob+dip);
    polygon(ctx,[[-115,-479],[113,-479],[119,-438],[59,-419],[0,-440],[-54,-421],[-117,-438]],kit.shorts);
    torso(ctx,kit,skin,acc,rear,detail);
    ctx.restore();
    // Forward forearms cross the shirt; both remain visible in a frontal run.
    if(run)arm(arms[0]);
    arm(arms[1]);
    const headX=bodyX*.7+5,headY=-891+bob+dip;
    // Pass screen-size detail eligibility separately from our 1050-unit rig.
    drawHeadScaled(ctx,headX,headY,84,look,1,t,view,84*scale);
    ctx.restore();
    if(options.marker){
      const my=y-height*1.10+Math.sin(t*5)*2;ctx.save();ctx.fillStyle=options.marker===true?'#ffe13a':options.marker;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1.2;
      polygon(ctx,[[x-6,my-8],[x+6,my-8],[x,my]],ctx.fillStyle);ctx.restore();
    }
    if(options.call)global.SoccerKit.drawCallBubble(ctx,x+height*.22,y-height*1.13,height*.34,t);
  }
  // drawHead's radius is in its parent's units. suppress tiny facial details
  // for on-pitch sprites without changing the close-up head's geometry.
  function drawHeadScaled(ctx,x,y,r,look,face,t,view,screenRadius){
    const targetRadius=screenRadius>=9?r:8;
    if(targetRadius===r)return drawHead(ctx,x,y,r,look,face,t,view);
    ctx.save();ctx.translate(x,y);ctx.scale(r/8,r/8);drawHead(ctx,0,0,8,look,face,t,view);ctx.restore();
  }
  function drawBust(ctx,x,bottom,size,kit,look,t){
    kit=global.SoccerKit.normKit(kit);look=look||{};
    ctx.save();ctx.translate(x,bottom);ctx.scale(size/350,size/350);ctx.translate(0,713);
    ctx.lineWidth=8;ctx.lineJoin='round';ctx.strokeStyle=INK;
    torso(ctx,kit,look.skin||'#e3a97f',look.acc||{},false,true);
    drawHead(ctx,5,-891,84,look,1,t||0);ctx.restore();
  }
  global.ComicPlayers={version:'sport-comic-02',drawFigure,drawHead,drawBust};
})(typeof window!=='undefined'?window:globalThis);
