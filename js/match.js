// ===== Interactive match orchestration =====
// The match plays as a live text log. The pitch is never shown in full —
// only when a moment involves the player's own player does the view zoom
// in close (aim/dribble/timing overlays) and hand control to the user.

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
  weightsForPosition(pos){
    switch(pos){
      case "FWD": return {shoot:.40, pass:.20, dribble:.25, defend:.15, save:0};
      case "MID": return {shoot:.20, pass:.30, dribble:.20, defend:.30, save:0};
      case "DEF": return {shoot:.05, pass:.20, dribble:.10, defend:.65, save:0};
      case "GK":  return {shoot:0, pass:.20, dribble:0, defend:0, save:.80};
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
    $("#match-end-overlay").classList.add("hidden");
    $("#minigame-overlay").classList.add("hidden");
    $("#goal-toast").classList.add("hidden");
    $("#goal-toast").classList.remove("show");

    const log = $("#match-log");
    log.innerHTML = "";
    this._logEvent("הקהל מתמלא באצטדיון... עומדים להתחיל!");

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

  _logEvent(text, opts={}){
    const log = $("#match-log");
    const entry = document.createElement("div");
    entry.className = "log-entry";
    if(opts.goal) entry.classList.add("goal");
    if(opts.key) entry.classList.add("key");
    entry.textContent = text;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  },

  _goalScored(side){
    const ctx = this.ctx;
    ctx.score[side]++;
    const scoreEl = $("#match-score");
    scoreEl.textContent = `${ctx.score.home} - ${ctx.score.away}`;
    scoreEl.classList.remove("bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("bump");

    const toast = $("#goal-toast");
    toast.classList.remove("hidden", "show");
    void toast.offsetWidth;
    toast.classList.add("show");
    setTimeout(()=> toast.classList.add("hidden"), 1300);
  },

  _resolveBackground(ev){
    const ctx = this.ctx;
    const scoringClub = ev.side==="home" ? ctx.homeClub : ctx.awayClub;
    const isMyTeamScoring = (ev.side==="home")===ctx.myIsHome;
    this._logEvent(`⚽ ${ctx.minute}' — גול ל${scoringClub.name}! ${isMyTeamScoring ? "הקבוצה שלך מתקדמת!" : "מכה קשה מהיריבה."}`, {goal:true});
    this._goalScored(ev.side);
    setTimeout(()=> this._runNext(), 1100);
  },

  _resolveKeyMoment(ev){
    const ctx = this.ctx, p = ctx.p;
    const titles = {
      shoot:"הזדמנות סיום! בחר לאן לבעוט",
      pass:"מסירה חדה לרשת! תזמן את המסירה",
      dribble:"מגן מולך! החלק כדי לעבור אותו",
      defend:"התקפה מסוכנת עלייך להתערב!",
      save:"בעיטה לעברך! בחר לאן לצלול",
    };
    this._logEvent(`🔥 ${ctx.minute}' — הכדור אצלך! ${titles[ev.type]}`, {key:true});
    $("#minigame-title").textContent = `${ctx.minute}' — ${titles[ev.type]}`;
    $("#minigame-overlay").classList.remove("hidden");
    $("#timing-mode").classList.add("hidden");
    $("#aim-mode").classList.add("hidden");
    $("#dribble-mode").classList.add("hidden");

    if(ev.type==="shoot" || ev.type==="save"){
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
    } else if(ev.type==="dribble"){
      $("#dribble-mode").classList.remove("hidden");

      const heroSkill = Career.overall() + p.reputation/4;
      const oppClub = ctx.myIsHome ? ctx.awayClub : ctx.homeClub;

      const dribble = new DribbleChallenge($("#dribble-canvas"), $("#dribble-hint"), {attackerSkill:heroSkill, defenderSkill:oppClub.rating});
      dribble.start((score)=>{
        dribble.stop();
        $("#minigame-overlay").classList.add("hidden");
        this._applyKeyResult(ev.type, score);
      });
    } else {
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
        this._logEvent(`🌟 ${ctx.minute}' — ${p.name} כובש בעצמו! שער מדהים!`, {goal:true});
        this._goalScored(heroSide);
        p.reputation += 1;
      } else {
        this._logEvent(`${ctx.minute}' — ${p.name} בעט אך ההזדמנות התבזבזה.`);
      }
    } else if(type==="pass"){
      if(success){
        p.assists++;
        this._logEvent(`🎯 ${ctx.minute}' — בישול נהדר של ${p.name}! השער מתקבל!`, {goal:true});
        this._goalScored(heroSide);
        p.reputation += 1;
      } else {
        this._logEvent(`${ctx.minute}' — המסירה של ${p.name} לא הגיעה ליעדה.`);
      }
    } else if(type==="dribble"){
      if(success){
        this._logEvent(`💨 ${ctx.minute}' — ${p.name} עבר את המגן בדריבל מדהים!`);
      } else {
        this._logEvent(`${ctx.minute}' — ${p.name} איבד את הכדור בניסיון הדריבל.`);
        if(Math.random() < 0.3){
          this._logEvent(`⚽ ${ctx.minute}' — היריבה מנצלת את האיבוד וכובשת בניגוד!`, {goal:true});
          this._goalScored(oppSide);
        }
      }
    } else if(type==="defend"){
      if(success){
        this._logEvent(`🛡️ ${ctx.minute}' — התערבות מצוינת של ${p.name} עוצרת התקפה מסוכנת!`);
      } else {
        this._logEvent(`${ctx.minute}' — ${p.name} איחר להתערב, וזה עולה ביוקר.`, {goal:true});
        this._goalScored(oppSide);
      }
    } else if(type==="save"){
      if(success){
        this._logEvent(`🧤 ${ctx.minute}' — הצלה מדהימה של ${p.name}!`);
      } else {
        this._logEvent(`${ctx.minute}' — ${p.name} לא הצליח להדוף, גול ליריבה.`, {goal:true});
        this._goalScored(oppSide);
      }
    }
    setTimeout(()=> this._runNext(), 1100);
  },

  _endMatch(){
    const ctx = this.ctx, p = ctx.p;

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
