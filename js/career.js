// ===== Career / season / league state management =====

const SAVE_KEY = "starStrikerSave_v1";

const Career = {
  state: null,

  newGame(name, position, clubId){
    const club = CLUBS.find(c=>c.id===clubId);
    const base = { pace:45, shooting:45, passing:45, dribbling:45, defending:45, physical:45 };
    // boost key stats for chosen position
    POSITIONS[position].key.forEach(k=> base[k]+=10);

    this.state = {
      player:{
        name, position, age:18,
        ...base,
        potential: 70 + Math.floor(Math.random()*25),
        energy:100, morale:75, reputation:5,
        relationships:{ boss:50, team:50, fans:35, partner:50, sponsors:30 },
        money:5000, wage:400, starBucks:60,
        clubId, contractWeeks: 52,
        goals:0, assists:0, appearances:0, form:0,
        lifestyle:{},        // categoryId -> itemId owned
        boots:"street",      // equipped boots id
        inventory:{},        // consumableId -> count owned
        activeBoost:null,    // {energy, morale} consumed at next match
        sponsors:[],         // signed sponsor ids
        workRate:"mid",
        lastRating:null, starMan:0, ratingsSum:0, ratingsCount:0,
      },
      season:1, week:1,
      clubs: JSON.parse(JSON.stringify(CLUBS)),
      table: {}, // clubId -> {p,w,d,l,gf,ga,pts}
      fixtures: [], // list of {round, home, away}
      news: [],
      pendingTransfer: null,
      pendingEvent: null,
    };
    CLUBS.forEach(c=> this.state.table[c.id] = {p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
    this._genFixtures();
    this.addNews(`ברוך הבא ל${club.name}! תתחיל להוכיח את עצמך.`);
    this.save();
  },

  _genFixtures(){
    // double round-robin across all clubs (includes player's club acting as itself)
    const ids = this.state.clubs.map(c=>c.id);
    const n = ids.length;
    const rounds = [];
    const arr = ids.slice();
    for(let r=0; r<n-1; r++){
      const roundPairs = [];
      for(let i=0;i<n/2;i++){
        const home = arr[i], away = arr[n-1-i];
        roundPairs.push([home,away]);
      }
      rounds.push(roundPairs);
      arr.splice(1,0, arr.pop());
    }
    const fixtures = [];
    let roundNum=1;
    rounds.forEach(rp=>{ fixtures.push({round:roundNum++, pairs:rp.map(p=>({home:p[0],away:p[1]}))}); });
    rounds.forEach(rp=>{ fixtures.push({round:roundNum++, pairs:rp.map(p=>({home:p[1],away:p[0]}))}); });
    this.state.fixtures = fixtures;
  },

  getClub(id){ return this.state.clubs.find(c=>c.id===id); },
  myClub(){ return this.getClub(this.state.player.clubId); },

  currentRoundFixtures(){
    const w = this.state.week;
    return this.state.fixtures.find(f=>f.round===w);
  },

  myFixtureThisWeek(){
    const rf = this.currentRoundFixtures();
    if(!rf) return null;
    const myId = this.state.player.clubId;
    return rf.pairs.find(p=>p.home===myId || p.away===myId) || null;
  },

  addNews(text){
    this.state.news.unshift(text);
    this.state.news = this.state.news.slice(0,25);
  },

  overall(){
    const p = this.state.player;
    const s = STAT_KEYS.map(k=>this.effectiveStat(k));
    return Math.round(s.reduce((a,b)=>a+b,0)/s.length);
  },

  // ---- Relationships & star rating ----
  rel(id){
    const r = this.state.player.relationships;
    return r && r[id]!=null ? r[id] : 50;
  },
  adjustRel(id, delta){
    const r = this.state.player.relationships;
    if(!r || r[id]==null) return;
    r[id] = Math.max(0, Math.min(100, r[id]+delta));
  },
  // 0..5 stars, the headline "how big a star are you" number
  starRating(){
    const avg = RELATIONSHIPS.reduce((sum,r)=>sum+this.rel(r.id),0)/RELATIONSHIPS.length;
    return Math.round((avg/20)*10)/10;
  },

  // ---- Effective stats: base + equipped boots ----
  bootsBonus(statId){
    const boots = BOOTS.find(b=>b.id===this.state.player.boots);
    return (boots && boots.boosts[statId]) || 0;
  },
  effectiveStat(statId){
    const p = this.state.player;
    return Math.min(99, (p[statId]||0) + this.bootsBonus(statId));
  },

  // ---- Star Bucks skill upgrades ----
  upgradeCost(statId){
    return skillUpgradeCost(this.state.player[statId]);
  },
  canUpgrade(statId){
    const p = this.state.player;
    return p[statId] < p.potential && p.starBucks >= this.upgradeCost(statId);
  },
  upgradeSkill(statId){
    const p = this.state.player;
    if(!this.canUpgrade(statId)) return false;
    p.starBucks -= this.upgradeCost(statId);
    p[statId] = Math.min(p.potential, p[statId]+1);
    this.save();
    return true;
  },

  // ---- Boots ----
  buyBoots(id){
    const p = this.state.player;
    const boots = BOOTS.find(b=>b.id===id);
    if(!boots || p.money < boots.cost || p.boots===id) return false;
    p.money -= boots.cost;
    p.boots = id;
    this.addNews(`${p.name} נועל ${boots.name}.`);
    this.save();
    return true;
  },

  // ---- Consumables ----
  buyConsumable(id){
    const p = this.state.player;
    const item = CONSUMABLES.find(c=>c.id===id);
    if(!item || p.money < item.cost) return false;
    p.money -= item.cost;
    p.inventory[id] = (p.inventory[id]||0)+1;
    this.save();
    return true;
  },
  useConsumable(id){
    const p = this.state.player;
    const item = CONSUMABLES.find(c=>c.id===id);
    if(!item || !p.inventory[id]) return false;
    p.inventory[id]--;
    if(p.inventory[id]<=0) delete p.inventory[id];
    p.energy = Math.min(100, p.energy + item.energy);
    if(item.morale) p.morale = Math.min(100, p.morale + item.morale);
    this.save();
    return true;
  },

  // ---- Sponsors ----
  sponsorIncome(){
    const p = this.state.player;
    return (p.sponsors||[]).reduce((sum,id)=>{
      const s = SPONSORS.find(x=>x.id===id);
      return sum + (s ? s.weekly : 0);
    },0);
  },
  canSignSponsor(id){
    const p = this.state.player;
    const s = SPONSORS.find(x=>x.id===id);
    return !!s && !p.sponsors.includes(id) && p.reputation >= s.reqReputation;
  },
  signSponsor(id){
    const p = this.state.player;
    if(!this.canSignSponsor(id)) return false;
    const s = SPONSORS.find(x=>x.id===id);
    p.sponsors.push(id);
    p.money += s.signBonus;
    this.adjustRel("sponsors", 12);
    this.addNews(`${p.name} חתם על חוזה חסות עם ${s.name}! מענק חתימה: ${s.signBonus.toLocaleString()}₪`);
    this.save();
    return true;
  },

  // ---- Work rate ----
  setWorkRate(id){
    if(WORK_RATES.some(w=>w.id===id)){
      this.state.player.workRate = id;
      this.save();
    }
  },
  currentWorkRate(){
    return WORK_RATES.find(w=>w.id===this.state.player.workRate) || WORK_RATES[1];
  },

  // ---- Gambling (casino games settle through here) ----
  gamble(stake, payout){
    const p = this.state.player;
    p.money = Math.max(0, p.money - stake + payout);
    if(payout > stake) p.morale = Math.min(100, p.morale+2);
    else if(payout === 0) p.morale = Math.max(0, p.morale-1);
    this.save();
  },

  // ---- Training ----
  applyTraining(statId, score){ // score 0..1
    const p = this.state.player;
    const gain = Math.round(score*3); // 0..3 points
    const cap = p.potential;
    p[statId] = Math.min(cap, p[statId]+gain);
    p.energy = Math.max(0, p.energy - 18);
    return gain;
  },

  rest(){
    this.state.player.energy = Math.min(100, this.state.player.energy + 35);
    this.state.player.morale = Math.min(100, this.state.player.morale + 5);
  },

  // ---- Simulate all other matches in this round (non-interactive) ----
  simulateBackgroundRound(excludePairKey){
    const rf = this.currentRoundFixtures();
    if(!rf) return;
    rf.pairs.forEach(pair=>{
      const key = pair.home+"-"+pair.away;
      if(key===excludePairKey) return;
      const home = this.getClub(pair.home), away = this.getClub(pair.away);
      const hs = home.rating + 4 + Math.random()*14;
      const as = away.rating + Math.random()*14;
      const hg = Math.max(0, Math.round((hs-as)/12 + (Math.random()*3-1)));
      const ag = Math.max(0, Math.round((as-hs)/14 + (Math.random()*3-1)));
      this._recordResult(pair.home, pair.away, hg, ag);
    });
  },

  _recordResult(homeId, awayId, hg, ag){
    const t = this.state.table;
    t[homeId].p++; t[awayId].p++;
    t[homeId].gf+=hg; t[homeId].ga+=ag;
    t[awayId].gf+=ag; t[awayId].ga+=hg;
    if(hg>ag){ t[homeId].w++; t[homeId].pts+=3; t[awayId].l++; }
    else if(hg<ag){ t[awayId].w++; t[awayId].pts+=3; t[homeId].l++; }
    else { t[homeId].d++; t[awayId].d++; t[homeId].pts++; t[awayId].pts++; }
  },

  recordMyResult(homeId, awayId, hg, ag){
    this._recordResult(homeId, awayId, hg, ag);
  },

  sortedTable(){
    return this.state.clubs.map(c=>({club:c, ...this.state.table[c.id]}))
      .sort((a,b)=> b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf);
  },

  // ---- Advance week after match / rest handled by caller ----
  advanceWeek(){
    this.state.week++;
    const totalRounds = this.state.fixtures.length;
    if(this.state.week > totalRounds){
      this._endOfSeason();
    }
    this._chargeLifestyleUpkeep();
    this._weeklyRelationshipDrift();
    this.state.player.money += this.sponsorIncome();
    if(!this.state.pendingTransfer){
      this._maybeTriggerMidSeasonOffer();
    }
    if(!this.state.pendingTransfer && !this.state.pendingEvent && Math.random()<0.4){
      this._maybeTriggerEvent();
    }
    this.save();
  },

  // ---- Lifestyle shop: one item owned per category, cost once + upkeep weekly ----
  lifestyleUpkeep(){
    const p = this.state.player;
    let total = 0;
    LIFESTYLE_CATEGORIES.forEach(cat=>{
      const ownedId = p.lifestyle && p.lifestyle[cat.id];
      if(!ownedId) return;
      const item = cat.items.find(i=>i.id===ownedId);
      if(item) total += item.upkeep;
    });
    return total;
  },

  buyLifestyleItem(categoryId, itemId){
    const p = this.state.player;
    const cat = LIFESTYLE_CATEGORIES.find(c=>c.id===categoryId);
    const item = cat && cat.items.find(i=>i.id===itemId);
    if(!item || p.money < item.cost) return false;
    p.money -= item.cost;
    p.lifestyle[categoryId] = itemId;
    if(item.morale) p.morale = Math.max(0, Math.min(100, p.morale+item.morale));
    if(item.reputation) p.reputation = Math.max(0, p.reputation+item.reputation);
    if(item.chemistry) this.adjustRel("team", item.chemistry);
    this.addNews(`${p.name} רכש/ה ${item.name}! ${item.flavor || ""}`.trim());
    this.save();
    return true;
  },

  // Relationships aren't static: a neglected partner drifts down, fans track
  // your reputation, and sponsors care that you keep your profile up.
  _weeklyRelationshipDrift(){
    const p = this.state.player;
    const hasPartner = !!(p.lifestyle && p.lifestyle.partner);
    this.adjustRel("partner", hasPartner ? 1 : -2);
    const fansTarget = Math.min(100, 25 + p.reputation*1.4);
    this.adjustRel("fans", this.rel("fans") < fansTarget ? 2 : -1);
    this.adjustRel("sponsors", (p.sponsors||[]).length>0 ? 1 : -1);
  },

  // ---- Match rating: the NSS-style 0-10 performance score ----
  // Drives Star Bucks earned, relationships, and whether the coach keeps
  // picking you. Star Man is awarded for a standout display.
  applyMatchRating({goals, assists, keyMomentsWon, keyMomentsTotal, teamWon, teamDrew}){
    const p = this.state.player;
    let rating = 5.5;
    if(keyMomentsTotal>0) rating += (keyMomentsWon/keyMomentsTotal - 0.5) * 4;
    rating += goals*1.1 + assists*0.7;
    if(teamWon) rating += 0.6; else if(!teamDrew) rating -= 0.4;
    rating = Math.max(1, Math.min(10, Math.round(rating*10)/10));

    const starMan = rating >= 8.5;
    p.lastRating = rating;
    p.ratingsSum = (p.ratingsSum||0) + rating;
    p.ratingsCount = (p.ratingsCount||0) + 1;
    if(starMan) p.starMan = (p.starMan||0) + 1;

    // Star Bucks: the currency you spend on skill upgrades
    const earned = Math.max(2, Math.round(rating*4 + goals*20 + assists*12 + (starMan?30:0)));
    p.starBucks += earned;

    // relationships react to the performance
    const swing = (rating - 6) * 2;
    this.adjustRel("boss", swing);
    this.adjustRel("team", swing*0.7);
    this.adjustRel("fans", swing + goals*3);
    this.adjustRel("sponsors", swing*0.5);
    if(starMan){
      p.reputation += 2;
      this.addNews(`⭐ ${p.name} נבחר לשחקן המשחק! (ציון ${rating})`);
    }
    return { rating, starMan, earned };
  },

  averageRating(){
    const p = this.state.player;
    if(!p.ratingsCount) return null;
    return Math.round((p.ratingsSum/p.ratingsCount)*10)/10;
  },

  _chargeLifestyleUpkeep(){
    const p = this.state.player;
    const upkeep = this.lifestyleUpkeep();
    if(upkeep<=0) return;
    if(p.money>=upkeep){
      p.money -= upkeep;
    } else {
      p.money = 0;
      p.morale = Math.max(0, p.morale-5);
      this.addNews(`התחזוקה של אורח החיים שלך יקרה מדי — לא הצלחת לשלם החודש!`);
    }
  },

  _absWeek(){
    return (this.state.season-1)*this.state.fixtures.length + this.state.week;
  },

  // ---- Mid-season transfer interest (separate from the guaranteed end-of-season window) ----
  _maybeTriggerMidSeasonOffer(){
    const p = this.state.player;
    if(p.reputation < 10) return;
    const abs = this._absWeek();
    const last = this.state.lastOfferAbsWeek!=null ? this.state.lastOfferAbsWeek : -999;
    if(abs - last < 5) return; // cooldown so offers don't spam every week
    if(Math.random() < 0.18){
      this._generateTransferOffers(1);
      this.state.lastOfferAbsWeek = abs;
    }
  },

  // ---- Random life decisions between matches ----
  _maybeTriggerEvent(){
    this.state.pendingEvent = { eventId: randPick(LIFE_EVENTS).id };
  },

  currentEvent(){
    if(!this.state.pendingEvent) return null;
    return LIFE_EVENTS.find(e=>e.id===this.state.pendingEvent.eventId);
  },

  resolveEvent(choiceKey){ // "a" or "b"
    const event = this.currentEvent();
    if(!event) return;
    const choice = event[choiceKey];
    const p = this.state.player;
    const eff = choice.effects || {};
    if(eff.energy!=null) p.energy = Math.max(0, Math.min(100, p.energy+eff.energy));
    if(eff.morale!=null) p.morale = Math.max(0, Math.min(100, p.morale+eff.morale));
    if(eff.reputation!=null) p.reputation = Math.max(0, p.reputation+eff.reputation);
    if(eff.money!=null) p.money = Math.max(0, p.money+eff.money);
    if(eff.starBucks!=null) p.starBucks = Math.max(0, p.starBucks+eff.starBucks);
    // legacy effect names map onto the relationship model
    if(eff.chemistry!=null) this.adjustRel("team", eff.chemistry);
    if(eff.coachTrust!=null) this.adjustRel("boss", eff.coachTrust);
    RELATIONSHIPS.forEach(r=>{ if(eff[r.id]!=null) this.adjustRel(r.id, eff[r.id]); });
    STAT_KEYS.forEach(k=>{
      if(eff[k]!=null) p[k] = Math.max(20, Math.min(p.potential, p[k]+eff[k]));
    });
    if(choice.extraTraining){
      const statKeys = ["pace","shooting","passing","dribbling","defending","physical"];
      const stat = randPick(statKeys);
      const gain = 1+Math.floor(Math.random()*2);
      p[stat] = Math.min(p.potential, p[stat]+gain);
    }
    if(choice.news) this.addNews(choice.news.replace("{name}", p.name));
    this.state.pendingEvent = null;
    this.save();
  },

  _endOfSeason(){
    const p = this.state.player;
    p.age++;
    this.addNews(`עונה ${this.state.season} הסתיימה! ${p.name} מתבגר לגיל ${p.age}.`);
    // age decline after 30
    if(p.age>30){
      ["pace","physical"].forEach(k=> p[k]=Math.max(30,p[k]-3));
    }
    this.state.season++;
    this.state.week=1;
    Object.keys(this.state.table).forEach(id=> this.state.table[id]={p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
    this._genFixtures();

    // wage/money payout roughly weekly during season, small bonus here
    p.money += p.wage*4;

    // maybe transfer offers based on reputation & performance
    if(p.reputation>=15 && Math.random()<0.6){
      this._generateTransferOffers(3);
      this.state.lastOfferAbsWeek = this._absWeek();
    }
  },

  _generateTransferOffers(count){
    const p = this.state.player;
    const myRating = this.myClub().rating;
    const candidates = this.state.clubs
      .filter(c=>c.id!==p.clubId && c.rating >= myRating-6)
      .sort((a,b)=> Math.abs(a.rating-(myRating+p.reputation/3)) - Math.abs(b.rating-(myRating+p.reputation/3)))
      .slice(0,count);
    if(candidates.length===0) return;
    const offers = candidates.map(c=>({
      clubId:c.id,
      wage: Math.round(p.wage * (1 + (c.rating-myRating)/60 + Math.random()*0.3)),
      attempts:0,
    }));
    if(this.state.pendingTransfer){
      const existingIds = new Set(this.state.pendingTransfer.offers.map(o=>o.clubId));
      offers.forEach(o=>{ if(!existingIds.has(o.clubId)) this.state.pendingTransfer.offers.push(o); });
    } else {
      this.state.pendingTransfer = { offers };
    }
  },

  // ---- Contract negotiation on a pending transfer offer ----
  // Returns {result:"raised"|"hold"|"withdrawn", wage?}
  negotiate(clubId){
    const p = this.state.player;
    const offer = this.state.pendingTransfer.offers.find(o=>o.clubId===clubId);
    if(!offer) return { result:"withdrawn" };
    offer.attempts = (offer.attempts||0)+1;
    const club = this.getClub(clubId);
    const leverage = (p.reputation/40) + (this.overall()-club.rating)/60;
    const successChance = Math.max(0.15, Math.min(0.75, 0.45 + leverage - offer.attempts*0.1));
    const withdrawChance = Math.min(0.35, 0.05*offer.attempts*offer.attempts);
    const roll = Math.random();
    let result;
    if(roll < withdrawChance){
      this.state.pendingTransfer.offers = this.state.pendingTransfer.offers.filter(o=>o.clubId!==clubId);
      if(this.state.pendingTransfer.offers.length===0) this.state.pendingTransfer = null;
      result = { result:"withdrawn" };
    } else if(roll < withdrawChance+successChance){
      offer.wage = Math.round(offer.wage * (1 + 0.08 + Math.random()*0.12));
      result = { result:"raised", wage:offer.wage };
    } else {
      result = { result:"hold", wage:offer.wage };
    }
    this.save();
    return result;
  },

  acceptTransfer(clubId){
    const p = this.state.player;
    const offer = this.state.pendingTransfer.offers.find(o=>o.clubId===clubId);
    p.clubId = clubId;
    p.wage = offer.wage;
    p.contractWeeks = 52;
    this.addNews(`${p.name} עובר ל${this.getClub(clubId).name}!`);
    this.state.pendingTransfer = null;
    this.save();
  },

  declineOffer(clubId){
    if(!this.state.pendingTransfer) return;
    this.state.pendingTransfer.offers = this.state.pendingTransfer.offers.filter(o=>o.clubId!==clubId);
    if(this.state.pendingTransfer.offers.length===0) this.state.pendingTransfer = null;
    this.save();
  },

  skipTransfer(){
    this.state.pendingTransfer = null;
    this.save();
  },

  // ---- persistence ----
  save(){
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); }catch(e){}
  },
  load(){
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      if(!raw) return false;
      this.state = JSON.parse(raw);
      this._migrate();
      return true;
    }catch(e){ return false; }
  },

  // fill in fields added after a save was created, so old saves keep working
  _migrate(){
    const p = this.state.player;
    if(p.lifestyle==null) p.lifestyle = {};
    if(this.state.pendingEvent===undefined) this.state.pendingEvent = null;
    // older saves carried flat chemistry/coachTrust — fold them into the
    // five-relationship model and seed the three new ones.
    if(p.relationships==null){
      p.relationships = {
        boss: p.coachTrust!=null ? p.coachTrust : 50,
        team: p.chemistry!=null ? p.chemistry : 50,
        fans: Math.min(100, 25 + (p.reputation||0)*1.4),
        partner: p.lifestyle && p.lifestyle.partner ? 60 : 50,
        sponsors: 30,
      };
    }
    delete p.chemistry; delete p.coachTrust;
    if(p.starBucks==null) p.starBucks = 60;
    if(p.boots==null) p.boots = "street";
    if(p.inventory==null) p.inventory = {};
    if(p.sponsors==null) p.sponsors = [];
    if(p.workRate==null) p.workRate = "mid";
    if(p.starMan==null) p.starMan = 0;
    if(p.ratingsSum==null){ p.ratingsSum = 0; p.ratingsCount = 0; }
    if(p.lastRating===undefined) p.lastRating = null;
  },
  hasSave(){
    return !!localStorage.getItem(SAVE_KEY);
  },
};
