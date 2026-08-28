// ===== Interactive match orchestration =====

function samplePoisson(lambda){
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

function ratingGoalExpectation(a, b){
  return Math.max(0.25, Math.min(3.2, 1.0 + (a-b)/25));
}

const MatchController = {
  renderer:null,

  buildFormation(homeClub, awayClub, myIsHome, playerPos){
    const W=900,H=560;
    const home = [
      {slot:"GK", x:450, y:55},
      {slot:"DEF", x:300, y:160}, {slot:"DEF", x:600, y:160},
      {slot:"MID", x:300, y:270}, {slot:"MID", x:600, y:270},
      {slot:"FWD", x:450, y:400},
    ];
    const away = [
      {slot:"GK", x:450, y:505},
      {slot:"DEF", x:300, y:400}, {slot:"DEF", x:600, y:400},
      {slot:"MID", x:300, y:300}, {slot:"MID", x:600, y:300},
      {slot:"FWD", x:450, y:160},
    ];
    const heroTeamArr = myIsHome ? home : away;
    const heroSlotIdx = heroTeamArr.findIndex(s=>s.slot===playerPos);
    const players = [];
    home.forEach((s,i)=>{
      players.push({x:s.x,y:s.y,tx:s.x,ty:s.y,color:homeClub.primary,secondary:homeClub.secondary,
        hero: myIsHome && i===heroSlotIdx, number:i+2, team:"home"});
    });
    away.forEach((s,i)=>{
      players.push({x:s.x,y:s.y,tx:s.x,ty:s.y,color:awayClub.primary,secondary:awayClub.secondary,
        hero: !myIsHome && i===heroSlotIdx, number:i+2, team:"away"});
    });
    return players;
  },

  weightsForPosition(pos){
    switch(pos){
      case "FWD": return {shoot:.55, pass:.25, defend:.20, save:0};
      case "MID": return {shoot:.30, pass:.40, defend:.30, save:0};
      case "DEF": return {shoot:.10, pass:.25, defend:.65, save:0};
      case "GK":  return {shoot:0, pass:.20, defend:0, save:.80};
    }
  },

  pickKeyType(pos){
    const w = this.weightsForPosition(pos);
    const r = Math.random();
    let acc=0;
    for(const k of Object.keys(w)){
      acc += w[k];
      if(r<=acc) return k;
    }
    return "shoot";
  },

  startMatch(){
    const s = Career.state, p = s.player;
    const fixture = Career.myFixtureThisWeek();
    if(!fixture) return;
    const homeClub = Career.getClub(fixture.home);
    const awayClub = Career.getClub(fixture.away);
    const myIsHome = fixture.home===p.clubId;

    this.ctx = {
      homeClub, awayClub, myIsHome, p,
      score:{home:0, away:0},
      minute:0,
    };

    $("#match-home-name").textContent = homeClub.name;
    $("#match-away-name").textContent = awayClub.name;
    $("#match-score").textContent = "0 - 0";
    $("#match-score").classList.remove("bump");
    $("#match-minute").textContent = "0";
    $("#match-commentary").textContent = `הקהל מתמלא באצטדיון... עומדים להתחיל!`;
    $("#match-commentary").classList.remove("pulse");
    $("#match-end-overlay").classList.add("hidden");
    $("#minigame-overlay").classList.add("hidden");
    $("#goal-burst").classList.add("hidden");
    $("#goal-burst").classList.remove("show");

    const canvas = $("#pitch-canvas");
    this.renderer = new PitchRenderer(canvas);
    this.renderer.setPlayers(this.buildFormation(homeClub, awayClub, myIsHome, p.position));
    this.renderer.start();

    showScreen("screen-match");

    // ---- build event timeline ----
    const heroRating = Career.overall() + p.reputation/4;
    const heroBoost = Math.max(0, (heroRating-60)/40); // 0..~1
    const homeBase = ratingGoalExpectation(homeClub.rating + (myIsHome?heroBoost*6:0), awayClub.rating + (!myIsHome?heroBoost*6:0));
    const awayBase = ratingGoalExpectation(awayClub.rating + (!myIsHome?heroBoost*6:0), homeClub.rating + (myIsHome?heroBoost*6:0));

    const bgHomeGoals = samplePoisson(homeBase);
    const bgAwayGoals = samplePoisson(awayBase);

    const usedMinutes = new Set();
    const randMinute = ()=>{
      let m;
      do { m = 3 + Math.floor(Math.random()*86); } while(usedMinutes.has(m));
      usedMinutes.add(m);
      return m;
    };

    const events = [];
    for(let i=0;i<bgHomeGoals;i++) events.push({minute:randMinute(), kind:"bg", side:"home"});
    for(let i=0;i<bgAwayGoals;i++) events.push({minute:randMinute(), kind:"bg", side:"away"});

    const coachTrust = p.coachTrust!=null ? p.coachTrust : 50;
    const numKeyMoments = Math.max(2, Math.min(5, Math.round(2 + coachTrust/33)));
    for(let i=0;i<numKeyMoments;i++){
      const type = this.pickKeyType(p.position);
      events.push({minute:randMinute(), kind:"key", type});
    }

    events.sort((a,b)=>a.minute-b.minute);
    this.events = events;
    this.eventIdx = 0;

    this._runNext();
  },

  _runNext(){
    if(this.eventIdx >= this.events.length){
      this._advanceMinuteTo(90, ()=> this._endMatch());
      return;
    }
    const ev = this.events[this.eventIdx++];
    this._advanceMinuteTo(ev.minute, ()=>{
      if(ev.kind==="bg") this._resolveBackground(ev);
      else this._resolveKeyMoment(ev);
    });
  },

  _advanceMinuteTo(target, cb){
    const ctx = this.ctx;
    const start = ctx.minute;
    const steps = Math.max(1, target-start);
    let i=0;
    const iv = setInterval(()=>{
      i++;
      ctx.minute = start+i;
      $("#match-minute").textContent = ctx.minute;
      if(ctx.minute>=target){
        clearInterval(iv);
        cb();
      }
    }, Math.max(12, 260/steps));
  },

  _commentate(text){
    const el = $("#match-commentary");
    el.textContent = text;
    el.classList.remove("pulse");
    void el.offsetWidth; // restart the animation even if the class was still present
    el.classList.add("pulse");
  },

  _goalScored(side){
    const ctx = this.ctx;
    ctx.score[side]++;
    const scoreEl = $("#match-score");
    scoreEl.textContent = `${ctx.score.home} - ${ctx.score.away}`;
    scoreEl.classList.remove("bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("bump");

    const burst = $("#goal-burst");
    burst.classList.remove("hidden", "show");
    void burst.offsetWidth;
    burst.classList.add("show");
    setTimeout(()=> burst.classList.add("hidden"), 1300);

    const goalX = 450, goalY = side==="home" ? 540 : 30; // scored at opponent's goal
    this.renderer.moveBall(goalX, goalY, 0, 0.5);
    setTimeout(()=> this.renderer.celebrate(goalX, goalY), 500);
  },

  _resolveBackground(ev){
    const ctx = this.ctx;
    const scoringClub = ev.side==="home" ? ctx.homeClub : ctx.awayClub;
    const isMyTeamScoring = (ev.side==="home")===ctx.myIsHome;
    this._commentate(`⚽ ${ctx.minute}' — גול ל${scoringClub.name}! ${isMyTeamScoring ? "הקבוצה שלך מתקדמת!" : "מכה קשה מהיריבה."}`);
    this._goalScored(ev.side);
    setTimeout(()=> this._runNext(), 1300);
  },

  _resolveKeyMoment(ev){
    const ctx = this.ctx, p = ctx.p;
    const titles = {
      shoot:"הזדמנות סיום! בחר לאן לבעוט",
      pass:"מסירה חדה לרשת! תזמן את המסירה",
      defend:"התקפה מסוכנת עלייך להתערב!",
      save:"בעיטה לעברך! בחר לאן לצלול",
    };
    $("#minigame-title").textContent = `${ctx.minute}' — ${titles[ev.type]}`;
    $("#minigame-overlay").classList.remove("hidden");

    if(ev.type==="shoot" || ev.type==="save"){
      $("#timing-mode").classList.add("hidden");
      $("#aim-mode").classList.remove("hidden");

      const heroSkill = Career.overall() + p.reputation/4;
      const oppClub = ctx.myIsHome ? ctx.awayClub : ctx.homeClub;
      const mode = ev.type==="shoot" ? "shoot" : "save";
      const attackerSkill = mode==="shoot" ? heroSkill : oppClub.rating;
      const keeperSkill = mode==="shoot" ? oppClub.rating : heroSkill;

      const aim = new AimShootout($("#aim-canvas"), $("#aim-hint"), mode, {attackerSkill, keeperSkill});
      aim.start((score)=>{
        aim.stop();
        $("#minigame-overlay").classList.add("hidden");
        this._applyKeyResult(ev.type, score);
      });
    } else {
      $("#aim-mode").classList.add("hidden");
      $("#timing-mode").classList.remove("hidden");

      const bar = new TimingBar($("#match-timing-track"), $("#match-timing-zone"), $("#match-timing-marker"));
      const chemistry = p.chemistry!=null ? p.chemistry : 50;
      const zoneWidth = ev.type==="defend" ? 30 : Math.max(10, Math.min(34, 20 + (chemistry-50)/5));
      bar.setZone(zoneWidth, 30+Math.random()*40);
      bar.speed = 1.6 + Career.overall()/100;
      bar.start();

      const btn = $("#btn-match-timing-hit");
      const handler = ()=>{
        btn.removeEventListener("click", handler);
        const score = bar.hit();
        $("#minigame-overlay").classList.add("hidden");
        this._applyKeyResult(ev.type, score);
      };
      btn.addEventListener("click", handler);
    }
  },

  _applyKeyResult(type, score){
    const ctx = this.ctx, p = ctx.p;
    const success = score > 0.5;
    const heroSide = ctx.myIsHome ? "home" : "away";
    const oppSide = ctx.myIsHome ? "away" : "home";

    if(type==="shoot"){
      if(success){
        p.goals++;
        this._commentate(`🌟 ${ctx.minute}' — ${p.name} כובש בעצמו! שער מדהים!`);
        this._goalScored(heroSide);
        p.reputation += 1;
      } else {
        this._commentate(`${ctx.minute}' — ${p.name} בעט אך ההזדמנות התבזבזה.`);
      }
    } else if(type==="pass"){
      if(success){
        p.assists++;
        this._commentate(`🎯 ${ctx.minute}' — בישול נהדר של ${p.name}! השער מתקבל!`);
        this._goalScored(heroSide);
        p.reputation += 1;
      } else {
        this._commentate(`${ctx.minute}' — המסירה של ${p.name} לא הגיעה ליעדה.`);
      }
    } else if(type==="defend"){
      if(success){
        this._commentate(`🛡️ ${ctx.minute}' — התערבות מצוינת של ${p.name} עוצרת התקפה מסוכנת!`);
      } else {
        this._commentate(`${ctx.minute}' — ${p.name} איחר להתערב, וזה עולה ביוקר.`);
        this._goalScored(oppSide);
      }
    } else if(type==="save"){
      if(success){
        this._commentate(`🧤 ${ctx.minute}' — הצלה מדהימה של ${p.name}!`);
      } else {
        this._commentate(`${ctx.minute}' — ${p.name} לא הצליח להדוף, גול ליריבה.`);
        this._goalScored(oppSide);
      }
    }
    setTimeout(()=> this._runNext(), 1300);
  },

  _endMatch(){
    const ctx = this.ctx, p = ctx.p;
    this.renderer.stop();

    Career.recordMyResult(ctx.homeClub.id, ctx.awayClub.id, ctx.score.home, ctx.score.away);
    Career.simulateBackgroundRound(ctx.homeClub.id+"-"+ctx.awayClub.id);

    const myGoals = ctx.myIsHome ? ctx.score.home : ctx.score.away;
    const oppGoals = ctx.myIsHome ? ctx.score.away : ctx.score.home;
    const resultKind = myGoals>oppGoals ? "win" : myGoals<oppGoals ? "loss" : "draw";

    p.appearances++;
    p.energy = Math.max(0, p.energy - 30);
    if(resultKind==="win"){ p.morale = Math.min(100,p.morale+10); p.money += p.wage + 300; p.reputation += 2; }
    else if(resultKind==="draw"){ p.morale = Math.min(100,p.morale+2); p.money += p.wage + 100; p.reputation += 1; }
    else { p.morale = Math.max(0,p.morale-8); p.money += p.wage; }

    const myClub = ctx.myIsHome ? ctx.homeClub : ctx.awayClub;
    const template = randPick(NEWS_TEMPLATES[resultKind]);
    Career.addNews(template.replace("{club}", myClub.name).replace("{name}", p.name));

    const resultLabel = resultKind==="win" ? "ניצחון!" : resultKind==="draw" ? "תיקו" : "הפסד";
    $("#match-end-summary").innerHTML =
      `${resultLabel} ${ctx.score.home} - ${ctx.score.away}<br>` +
      `${p.name}: ${p.goals} שערים בקריירה, ${p.assists} בישולים בקריירה<br>` +
      `אנרגיה: ${p.energy}% • שכר שהתקבל: ${resultKind==="win"?p.wage+300:resultKind==="draw"?p.wage+100:p.wage}₪`;

    $("#match-end-overlay").classList.remove("hidden");
    Career.save();
  },
};
