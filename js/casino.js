// ===== Casino: slots, roulette and blackjack, all played with match money =====
// Every game settles through Career.gamble(stake, payout) so the wallet and
// the save file stay the single source of truth.

const SLOT_SYMBOLS = ["⚽","🥅","🏆","👟","💰","⭐"];
const SLOT_PAYOUTS = { "⚽":6, "🥅":8, "🏆":20, "👟":10, "💰":15, "⭐":40 };

const Casino = {
  stake: 100,

  stakes(){ return [100, 500, 2500, 10000]; },

  setStake(v){ this.stake = v; },

  canBet(){ return Career.state.player.money >= this.stake; },

  // ---- Slots: three reels, all-three-match pays big, any pair pays small ----
  spinSlots(){
    const reels = [0,1,2].map(()=> randPick(SLOT_SYMBOLS));
    let payout = 0, label;
    if(reels[0]===reels[1] && reels[1]===reels[2]){
      payout = this.stake * SLOT_PAYOUTS[reels[0]];
      label = `שלושה ${reels[0]}! זכית ב-${payout.toLocaleString()}₪`;
    } else if(reels[0]===reels[1] || reels[1]===reels[2] || reels[0]===reels[2]){
      payout = Math.round(this.stake * 1.5);
      label = `זוג! חזר לך ${payout.toLocaleString()}₪`;
    } else {
      label = `לא הפעם. הפסדת ${this.stake.toLocaleString()}₪`;
    }
    Career.gamble(this.stake, payout);
    return { reels, payout, label, won: payout > this.stake };
  },

  // ---- Roulette: red / black / green-zero, or a straight-up number ----
  spinRoulette(betType, betNumber){
    const n = Math.floor(Math.random()*37); // 0..36
    const color = n===0 ? "green" : (n%2===0 ? "black" : "red");
    let payout = 0;
    if(betType==="number"){
      if(n===betNumber) payout = this.stake*36;
    } else if(betType===color){
      payout = betType==="green" ? this.stake*36 : this.stake*2;
    }
    const colorHe = color==="green" ? "ירוק" : color==="red" ? "אדום" : "שחור";
    const label = payout>0
      ? `יצא ${n} (${colorHe}) — זכית ב-${payout.toLocaleString()}₪!`
      : `יצא ${n} (${colorHe}) — הפסדת ${this.stake.toLocaleString()}₪`;
    Career.gamble(this.stake, payout);
    return { number:n, color, payout, label, won: payout > this.stake };
  },

  // ---- Blackjack: a single hand against the dealer ----
  newBlackjackHand(){
    this.bj = {
      deck: this._freshDeck(),
      player: [], dealer: [],
      done: false, result: null,
    };
    this.bj.player.push(this._draw(), this._draw());
    this.bj.dealer.push(this._draw(), this._draw());
    return this.bjState();
  },

  _freshDeck(){
    const deck = [];
    for(let s=0;s<4;s++){
      for(let v=1;v<=13;v++) deck.push(v);
    }
    for(let i=deck.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [deck[i],deck[j]] = [deck[j],deck[i]];
    }
    return deck;
  },
  _draw(){ return this.bj.deck.pop(); },

  handValue(cards){
    let total = 0, aces = 0;
    cards.forEach(c=>{
      if(c===1){ aces++; total += 11; }
      else total += Math.min(10, c);
    });
    while(total>21 && aces>0){ total -= 10; aces--; }
    return total;
  },

  cardLabel(c){
    if(c===1) return "A";
    if(c===11) return "J";
    if(c===12) return "Q";
    if(c===13) return "K";
    return String(c);
  },

  bjState(){
    const b = this.bj;
    return {
      player: b.player.slice(), dealer: b.dealer.slice(),
      playerValue: this.handValue(b.player),
      dealerValue: this.handValue(b.dealer),
      done: b.done, result: b.result,
    };
  },

  bjHit(){
    const b = this.bj;
    if(b.done) return this.bjState();
    b.player.push(this._draw());
    if(this.handValue(b.player) > 21) this._bjSettle();
    return this.bjState();
  },

  bjStand(){
    const b = this.bj;
    if(b.done) return this.bjState();
    while(this.handValue(b.dealer) < 17) b.dealer.push(this._draw());
    this._bjSettle();
    return this.bjState();
  },

  _bjSettle(){
    const b = this.bj;
    const pv = this.handValue(b.player), dv = this.handValue(b.dealer);
    let payout = 0, result;
    if(pv > 21){ result = `נשרפת על ${pv}. הפסדת ${this.stake.toLocaleString()}₪`; }
    else if(dv > 21){ payout = this.stake*2; result = `הדילר נשרף על ${dv}! זכית ב-${payout.toLocaleString()}₪`; }
    else if(pv > dv){ payout = this.stake*2; result = `${pv} מול ${dv} — ניצחת ${payout.toLocaleString()}₪!`; }
    else if(pv === dv){ payout = this.stake; result = `תיקו על ${pv}. ההימור חוזר אליך.`; }
    else { result = `${pv} מול ${dv} — הדילר לקח את זה.`; }
    b.done = true;
    b.result = result;
    Career.gamble(this.stake, payout);
  },
};
