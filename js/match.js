// ===== Interactive match orchestration =====
// The match plays as a live text log. The pitch is never shown in full —
// only when a moment involves the player's own player does the game cut to
// that situation on the pitch (js/situation.js), hand control to the user
// through a minigame panel, and play the result out before the log resumes.

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
      // penalties and free kicks are yours to take up front and in midfield, and to face in goal;
      // a corner is taken by attackers and midfielders and defended by defenders and the keeper
      case "FWD": return {shoot:.30, pass:.15, dribble:.20, defend:.07, save:0, corner:.06, freekick:.10, penalty:.12};
      case "MID": return {shoot:.15, pass:.25, dribble:.15, defend:.20, save:0, corner:.10, freekick:.10, penalty:.05};
      case "DEF": return {shoot:.05, pass:.18, dribble:.12, defend:.48, save:0, corner:.17, freekick:0, penalty:0};
      case "GK":  return {shoot:0, pass:.15, dribble:0, defend:0, save:.50, corner:.13, freekick:.10, penalty:.12};
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
      perf:{ goals:0, assists:0, won:0, total:0 },
    };

    $("#match-home-name").textContent = homeClub.name;
    $("#match-away-name").textContent = awayClub.name;
    $("#match-home-crest").innerHTML = clubCrestSVG(homeClub, 30);
    $("#match-away-crest").innerHTML = clubCrestSVG(awayClub, 30);
    $("#match-score").textContent = "0 - 0";
    $("#match-score").classList.remove("bump");
    $("#match-minute").textContent = "0";
    $("#match-end-overlay").classList.add("hidden");
    $("#minigame-overlay").classList.add("hidden");
    SituationView.hide();
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

    const coachTrust = Career.rel("boss");
    const workRate = Career.currentWorkRate();
    const numKeyMoments = Math.max(1, Math.min(7,
      Math.round(2 + coachTrust/33) + workRate.momentBonus));
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

  // toast:false when the goal was already shown on the pitch
  _goalScored(side, toast=true){
    const ctx = this.ctx;
    ctx.score[side]++;
    const scoreEl = $("#match-score");
    scoreEl.textContent = `${ctx.score.home} - ${ctx.score.away}`;
    scoreEl.classList.remove("bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("bump");
    if(!toast) return;

    const toastEl = $("#goal-toast");
    toastEl.classList.remove("hidden", "show");
    void toastEl.offsetWidth;
    toastEl.classList.add("show");
    setTimeout(()=> toastEl.classList.add("hidden"), 1300);
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
    const keeper = p.position==="GK", taker = p.position==="FWD" || p.position==="MID";
    const titles = {
      shoot:"הזדמנות סיום! בחר לאן לבעוט",
      pass:"מסירה חדה לרשת! תזמן את המסירה",
      dribble:"מגן מולך! החלק כדי לעבור אותו",
      defend:"התקפה מסוכנת עלייך להתערב!",
      save:"בעיטה לעברך! בחר לאן לצלול",
      penalty: keeper ? "פנדל נגדך! בחר לאן לצלול" : "פנדל! בחר לאן לבעוט",
      freekick: keeper ? "בעיטה חופשית נגדך! בחר לאן לצלול" : "בעיטה חופשית! בחר לאן לבעוט",
      corner: taker ? "קרן! בחר לאן לשלוח את הכדור" : "קרן נגדך! תזמן את הניקוי",
    };
    this._logEvent(`🔥 ${ctx.minute}' — הכדור אצלך! ${titles[ev.type]}`, {key:true});
    $("#minigame-title").textContent = `${ctx.minute}' — ${titles[ev.type]}`;
    $("#timing-mode").classList.add("hidden");
    $("#aim-mode").classList.add("hidden");
    $("#dribble-mode").classList.add("hidden");
    $("#corner-mode").classList.add("hidden");

    // both sides wear their own club's colours, with the opponent changing
    // strip if the two shirts are too close to tell apart
    const myClub = Career.myClub();
    const kits = matchKits(myClub, ctx.myIsHome ? ctx.awayClub : ctx.homeClub);

    // cut to the situation on the pitch first; the minigame slides up once
    // the player has had a moment to read it
    SituationView.show(buildSituation(ev.type, ctx, kits));
    setTimeout(()=> this._openMinigame(ev, kits), 1400);
  },

  _openMinigame(ev, kits){
    const ctx = this.ctx, p = ctx.p;
    SituationView.caption(null);
    $("#minigame-overlay").classList.remove("hidden");

    // shots at goal: a plain shot, a penalty or a free kick — you shoot, or you are the keeper
    const inGoal = p.position==="GK";
    const aimMode = { shoot:"shoot", save:"save", penalty:inGoal?"save":"shoot", freekick:inGoal?"save":"shoot" }[ev.type];
    if(aimMode){
      $("#aim-mode").classList.remove("hidden");

      const heroSkill = Career.overall() + p.reputation/4;
      const oppClub = ctx.myIsHome ? ctx.awayClub : ctx.homeClub;
      const mode = aimMode;
      const attackerSkill = mode==="shoot" ? heroSkill : oppClub.rating;
      const keeperSkill = mode==="shoot" ? oppClub.rating : heroSkill;
      // shooting means you face their keeper; saving means the keeper is you.
      // Same keeper strip as on the pitch behind the panel.
      const keeperKit = mode==="shoot" ? keeperKitFor(kits.theirs, kits.mine) : keeperKitFor(kits.mine, kits.theirs);

      // the free kick's wall is the defending side's: theirs when you shoot, yours when you keep
      const wall = ev.type==="freekick", wallKit = mode==="shoot" ? kits.theirs : kits.mine;
      const aim = new AimShootout($("#aim-canvas"), $("#aim-hint"), mode, {attackerSkill, keeperSkill, keeperKit, keeperLook: mode==="save" ? Career.playerLook() : null, wall, wallKit});
      aim.start((score, detail)=>{
        aim.stop();
        this._finishKeyMoment(ev.type, score, detail);
      });
    } else if(ev.type==="corner" && SituationView.sit && SituationView.sit.cornerAttack){
      $("#corner-mode").classList.remove("hidden");

      const heroSkill = Career.overall() + p.reputation/4;
      const oppClub = ctx.myIsHome ? ctx.awayClub : ctx.homeClub;
      const corner = new CornerPick($("#corner-canvas"), $("#corner-hint"), {atkSkill:heroSkill, defSkill:oppClub.rating, sit:SituationView.sit});
      corner.start((score, detail)=>{
        corner.stop();
        this._finishKeyMoment(ev.type, score, detail);
      });
    } else if(ev.type==="dribble"){
      $("#dribble-mode").classList.remove("hidden");

      const heroSkill = Career.overall() + p.reputation/4;
      const oppClub = ctx.myIsHome ? ctx.awayClub : ctx.homeClub;

      const dribble = new DribbleChallenge($("#dribble-canvas"), $("#dribble-hint"), {attackerSkill:heroSkill, defenderSkill:oppClub.rating, kits, heroLook:Career.playerLook()});
      dribble.start((score, detail)=>{
        dribble.stop();
        this._finishKeyMoment(ev.type, score, detail);
      });
    } else {
      $("#timing-mode").classList.remove("hidden");

      const bar = new TimingBar($("#match-timing-track"), $("#match-timing-zone"), $("#match-timing-marker"));
      const chemistry = Career.rel("team");
      const zoneWidth = (ev.type==="defend" || ev.type==="corner") ? 30 : Math.max(10, Math.min(34, 20 + (chemistry-50)/5));
      bar.setZone(zoneWidth, 30+Math.random()*40);
      bar.speed = 1.6 + Career.overall()/100;
      bar.start();

      const btn = $("#btn-match-timing-hit");
      const handler = ()=>{
        btn.removeEventListener("click", handler);
        const score = bar.hit();
        this._finishKeyMoment(ev.type, score);
      };
      btn.addEventListener("click", handler);
    }
    // the panel's height depends on which minigame is in it; offsetTop is the
    // laid-out position, unaffected by the slide-up animation
    SituationView.liftForPanel($("#minigame-overlay .minigame-box").offsetTop);
  },

  async _finishKeyMoment(type, score, detail){
    $("#minigame-overlay").classList.add("hidden");
    SituationView.liftForPanel(null);
    await SituationView.playOutcome(type, score > 0.5, detail);
    SituationView.hide();
    this._applyKeyResult(type, score, detail);
  },

  _applyKeyResult(type, score, detail){
    const ctx = this.ctx, p = ctx.p;
    const success = score > 0.5;
    ctx.perf.total++;
    if(success) ctx.perf.won++;
    const heroSide = ctx.myIsHome ? "home" : "away";
    const oppSide = ctx.myIsHome ? "away" : "home";

    if(type==="shoot"){
      if(success){
        p.goals++; ctx.perf.goals++;
        this._logEvent(`🌟 ${ctx.minute}' — ${p.name} כובש בעצמו! שער מדהים!`, {goal:true});
        this._goalScored(heroSide, false);
        p.reputation += 1;
      } else {
        this._logEvent(`${ctx.minute}' — ${p.name} בעט אך ההזדמנות התבזבזה.`);
      }
    } else if(type==="penalty" || type==="freekick"){
      const label = type==="penalty" ? "פנדל" : "בעיטה חופשית";
      if(p.position==="GK"){
        if(success){
          this._logEvent(type==="freekick" && detail && detail.blocked
            ? `🧱 ${ctx.minute}' — החומה חוסמת את הבעיטה החופשית, ${p.name} נשאר עם שער נקי.`
            : `🧤 ${ctx.minute}' — ${p.name} מציל ${type==="penalty" ? "פנדל" : "בעיטה חופשית"}! מדהים!`);
        } else {
          this._logEvent(`${ctx.minute}' — ${type==="penalty" ? "הפנדל" : "הבעיטה החופשית"} נכנס, ${p.name} לא יכול היה לעשות כלום.`, {goal:true});
          this._goalScored(oppSide, false);
        }
      } else if(success){
        p.goals++; ctx.perf.goals++;
        this._logEvent(`🌟 ${ctx.minute}' — ${p.name} כובש מ${label}! ${type==="penalty" ? "קר רוח מהנקודה!" : "מהלך מרהיב מעל החומה!"}`, {goal:true});
        this._goalScored(heroSide, false);
        p.reputation += 1;
      } else {
        this._logEvent(type==="freekick" && detail && detail.blocked
          ? `${ctx.minute}' — ${label} של ${p.name} נבלמת בחומה.`
          : `${ctx.minute}' — ${label} של ${p.name} נעצרת בידי השוער.`);
      }
    } else if(type==="corner"){
      const takes = p.position==="FWD" || p.position==="MID";
      if(takes){
        if(success){
          p.assists++; ctx.perf.assists++;
          this._logEvent(`🎯 ${ctx.minute}' — קרן מושלמת של ${p.name}, נגיחה ושער!`, {goal:true});
          this._goalScored(heroSide, false);
          p.reputation += 1;
        } else {
          const why = { cleared:"ההגנה מנקה", saved:"השוער עוצר את הנגיחה", wide:"הנגיחה יוצאת החוצה" }[detail && detail.result] || "ההגנה מנקה";
          this._logEvent(`${ctx.minute}' — הקרן של ${p.name} לא מסתיימת בשער: ${why}.`);
        }
      } else if(success){
        this._logEvent(p.position==="GK"
          ? `🧤 ${ctx.minute}' — ${p.name} יוצא ותופס את הקרן בביטחון.`
          : `🛡️ ${ctx.minute}' — ${p.name} מנקה את הקרן מהרחבה.`);
      } else {
        this._logEvent(`${ctx.minute}' — גול מקרן, ${p.name} לא הצליח למנוע את הנגיחה.`, {goal:true});
        this._goalScored(oppSide, false);
      }
    } else if(type==="pass"){
      if(success){
        p.assists++; ctx.perf.assists++;
        this._logEvent(`🎯 ${ctx.minute}' — בישול נהדר של ${p.name}! השער מתקבל!`, {goal:true});
        this._goalScored(heroSide, p.position==="GK");
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
        this._goalScored(oppSide, false);
      }
    } else if(type==="save"){
      if(success){
        this._logEvent(`🧤 ${ctx.minute}' — הצלה מדהימה של ${p.name}!`);
      } else {
        this._logEvent(`${ctx.minute}' — ${p.name} לא הצליח להדוף, גול ליריבה.`, {goal:true});
        this._goalScored(oppSide, false);
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
    p.energy = Math.max(0, p.energy - Career.currentWorkRate().energyCost);

    const perf = ctx.perf;
    const { rating, starMan, earned } = Career.applyMatchRating({
      goals: perf.goals, assists: perf.assists,
      keyMomentsWon: perf.won, keyMomentsTotal: perf.total,
      teamWon: resultKind==="win", teamDrew: resultKind==="draw",
    });
    if(resultKind==="win"){ p.morale = Math.min(100,p.morale+10); p.money += p.wage + 300; p.reputation += 2; }
    else if(resultKind==="draw"){ p.morale = Math.min(100,p.morale+2); p.money += p.wage + 100; p.reputation += 1; }
    else { p.morale = Math.max(0,p.morale-8); p.money += p.wage; }

    const myClub = ctx.myIsHome ? ctx.homeClub : ctx.awayClub;
    const template = randPick(NEWS_TEMPLATES[resultKind]);
    Career.addNews(template.replace("{club}", myClub.name).replace("{name}", p.name));

    const resultLabel = resultKind==="win" ? "ניצחון!" : resultKind==="draw" ? "תיקו" : "הפסד";
    $("#match-end-summary").innerHTML =
      `<div class="end-result">${resultLabel} ${ctx.score.home} - ${ctx.score.away}</div>` +
      `<div class="end-rating ${starMan?'star-man':''}">ציון המשחק שלך: <b>${rating}</b>${starMan?' ⭐ שחקן המשחק!':''}</div>` +
      `<div class="end-line">במשחק: ${perf.goals} שערים, ${perf.assists} בישולים • רגעים שניצחת: ${perf.won}/${perf.total}</div>` +
      `<div class="end-line">💫 הרווחת <b>${earned}</b> סטארבקס</div>` +
      `<div class="end-line">אנרגיה: ${p.energy}% • שכר: ${(resultKind==="win"?p.wage+300:resultKind==="draw"?p.wage+100:p.wage).toLocaleString()}₪</div>`;

    $("#match-end-overlay").classList.remove("hidden");
    Career.save();
  },
};
