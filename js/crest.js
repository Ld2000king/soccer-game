// ===== Procedural club crests =====
// Every badge is generated from a three-part spec — outline shape, field
// pattern, motif — plus the club's own two colours. The motifs are the stock
// vocabulary of football heraldry (lions, ships, towers, crowns), drawn here
// from scratch, so a club reads as recognisably "itself" without any real
// club's actual logo being reproduced.

// Each motif is a function of (ink, hole) so a shape can punch a hole back to
// the field colour — an eye, a wheel hub, the centre of a rose.
const CREST_MOTIFS = {
  star: ink => `<path fill="${ink}" d="M50 6 L62 38 L96 38 L69 58 L79 92 L50 72 L21 92 L31 58 L4 38 L38 38 Z"/>`,

  ball: (ink, hole) => `
    <circle cx="50" cy="50" r="46" fill="${ink}"/>
    <circle cx="50" cy="50" r="37" fill="${hole}"/>
    <path fill="${ink}" d="M50 22 L70 36 L62 60 L38 60 L30 36 Z"/>
    ${[[50,22,50,13],[70,36,79,29],[62,60,68,79],[38,60,32,79],[30,36,21,29]]
      .map(([x1,y1,x2,y2])=>`<path stroke="${ink}" stroke-width="6" d="M${x1} ${y1} L${x2} ${y2}"/>`).join("")}`,

  crown: ink => `
    <path fill="${ink}" d="M8 72 L18 24 L34 44 L50 16 L66 44 L82 24 L92 72 Z"/>
    <rect x="10" y="76" width="80" height="16" rx="4" fill="${ink}"/>`,

  bird: ink => `<path fill="${ink}" d="M50 14 C55 23 57 30 57 39 L94 21 C90 43 77 57 61 63 L53 96 L47 96 L39 63 C23 57 10 43 6 21 L43 39 C43 30 45 23 50 14 Z"/>`,

  // the horns are what make a bull read at badge size, so they are separate
  // sweeps rather than bumps on the outline of the head
  bull: (ink, hole) => `
    <path fill="${ink}" d="M4 26 C0 44 7 60 24 63 C18 51 21 43 29 40 Z"/>
    <path fill="${ink}" d="M96 26 C100 44 93 60 76 63 C82 51 79 43 71 40 Z"/>
    <path fill="${ink}" d="M26 38 C26 29 37 24 50 24 C63 24 74 29 74 38 C74 55 70 71 61 83 C57 89 54 92 50 92 C46 92 43 89 39 83 C30 71 26 55 26 38 Z"/>
    <circle cx="39" cy="47" r="4.5" fill="${hole}"/><circle cx="61" cy="47" r="4.5" fill="${hole}"/>`,

  wolf: (ink, hole) => `
    <path fill="${ink}" d="M14 16 L31 46 C37 38 43 34 50 34 C57 34 63 38 69 46 L86 16 L84 57 C84 79 69 93 50 93 C31 93 16 79 16 57 Z"/>
    <circle cx="38" cy="56" r="5" fill="${hole}"/><circle cx="62" cy="56" r="5" fill="${hole}"/>`,

  // a plain circle with two dots reads as a face, not a lion — the spiked
  // mane ring is what carries the identity
  lion: (ink, hole) => {
    const pts = [];
    for(let i=0;i<28;i++){
      const r = i%2 ? 47 : 33;
      const a = Math.PI*2*i/28 - Math.PI/2;
      pts.push(`${(50+r*Math.cos(a)).toFixed(1)},${(50+r*Math.sin(a)).toFixed(1)}`);
    }
    return `
    <polygon fill="${ink}" points="${pts.join(" ")}"/>
    <circle cx="50" cy="50" r="27" fill="${hole}"/>
    <circle cx="41" cy="44" r="4.5" fill="${ink}"/><circle cx="59" cy="44" r="4.5" fill="${ink}"/>
    <path fill="${ink}" d="M50 54 L41 66 h18 Z"/>`;
  },

  anchor: ink => `
    <path fill="${ink}" d="M45 10 h10 v14 h16 v10 h-16 v46 c14-3 24-14 27-28 l9 5 c-5 22-24 38-46 38 c-22 0-41-16-46-38 l9-5 c3 14 13 25 27 28 v-46 h-16 v-10 h16 z"/>
    <circle cx="50" cy="10" r="9" fill="none" stroke="${ink}" stroke-width="7"/>`,

  tower: (ink, hole) => `
    <path fill="${ink}" d="M14 94 V36 h11 V22 h12 v14 h13 V22 h12 v14 h11 v58 z"/>
    <path fill="${hole}" d="M41 64 h18 v30 h-18 z"/>`,

  // hull as a boat curve under two clean triangular sails — the previous
  // version's soft curves turned to mush below about 40px
  ship: ink => `
    <path fill="${ink}" d="M4 68 h92 c-7 15 -21 24 -46 24 S11 83 4 68 Z"/>
    <rect x="47" y="4" width="6" height="58" fill="${ink}"/>
    <path fill="${ink}" d="M57 12 L86 60 H57 Z"/>
    <path fill="${ink}" d="M43 26 L19 60 H43 Z"/>`,

  hammers: ink => `
    <g transform="rotate(22 50 52)">
      <rect x="46" y="24" width="9" height="66" rx="4" fill="${ink}"/>
      <rect x="32" y="10" width="37" height="19" rx="5" fill="${ink}"/>
    </g>
    <g transform="rotate(-22 50 52)">
      <rect x="45" y="24" width="9" height="66" rx="4" fill="${ink}"/>
      <rect x="31" y="10" width="37" height="19" rx="5" fill="${ink}"/>
    </g>`,

  fleur: ink => `<path fill="${ink}" d="M50 4 C56 18 58 29 56 39 C64 31 75 29 81 34 C88 40 85 52 75 56 C69 58 61 57 54 54 L54 63 h12 v8 h-12 v13 c0 6 4 10 11 12 v5 H35 v-5 c7-2 11-6 11-12 V71 H34 v-8 h12 V54 c-7 3-15 4-21 2 C15 52 12 40 19 34 C25 29 36 31 44 39 C42 29 44 18 50 4 Z"/>`,

  bolt: ink => `<path fill="${ink}" d="M60 4 L20 60 h22 l-8 36 L80 36 H56 Z"/>`,

  rose: (ink, hole) => `
    <circle cx="50" cy="22" r="19" fill="${ink}"/><circle cx="77" cy="42" r="19" fill="${ink}"/>
    <circle cx="67" cy="75" r="19" fill="${ink}"/><circle cx="33" cy="75" r="19" fill="${ink}"/>
    <circle cx="23" cy="42" r="19" fill="${ink}"/>
    <circle cx="50" cy="52" r="15" fill="${hole}"/>`,

  // knight-piece profile: pointed ears, a long jaw and a mane down the neck,
  // which is what makes a horse legible in a single flat colour
  // a knight-piece profile — jaw and muzzle to the left, two ear points on
  // top, mane down the back — reads as a horse where a soft outline does not
  horse: (ink, hole) => `
    <path fill="${ink}" d="M26 94 V72 C26 58 32 47 43 40 L27 40 C22 40 20 34 25 30 L45 22 C43 14 46 8 52 4 L55 18 L64 6 L69 22 C80 29 85 44 81 59 C77 74 68 82 64 94 Z"/>
    <circle cx="42" cy="31" r="3.8" fill="${hole}"/>
    <path fill="${hole}" d="M62 26 C70 34 73 46 70 58 C68 47 65 37 60 31 Z"/>`,

  cross: ink => `<path fill="${ink}" d="M39 5 h22 v34 h34 v22 h-34 v34 h-22 v-34 h-34 v-22 h34 z"/>`,

  cannon: (ink, hole) => `
    <g transform="rotate(-16 50 58)">
      <rect x="12" y="42" width="72" height="16" rx="7" fill="${ink}"/>
      <circle cx="30" cy="74" r="16" fill="${ink}"/>
      <circle cx="30" cy="74" r="5" fill="${hole}"/>
    </g>`,
};

// ---- colour helpers ----
function _crestRgb(hex){
  const h = String(hex||"#888888").replace("#","");
  const n = h.length===3 ? h.split("").map(c=>c+c).join("") : h;
  return [0,2,4].map(i=> parseInt(n.slice(i,i+2),16) || 0);
}
function _crestLum(hex){
  const [r,g,b] = _crestRgb(hex).map(v=>{
    const s = v/255;
    return s<=0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4);
  });
  return 0.2126*r + 0.7152*g + 0.0722*b;
}
function _crestContrast(a,b){
  const la = _crestLum(a), lb = _crestLum(b);
  return (Math.max(la,lb)+0.05) / (Math.min(la,lb)+0.05);
}
// Which colours the motif actually sits on. A solid field is one colour; every
// patterned field puts the motif across both, and ink that only contrasts with
// one of them disappears over the other half.
function _crestFields(pattern, primary, secondary){
  return pattern==="solid" ? [primary] : [primary, secondary];
}

// The motif has to stay legible on every field it crosses. Within that, the
// club's own second colour wins — a badge in the club's colours beats a
// safely generic black one, so Maccabi's star is blue rather than near-black
// just because near-black scores a higher contrast ratio on yellow.
function _crestInk(fields, secondary){
  const worst = c => Math.min(...fields.map(f=>_crestContrast(f,c)));
  if(worst(secondary) >= 4.5) return secondary;
  return ["#ffffff","#10161f",secondary].reduce((best,c)=> worst(c) > worst(best) ? c : best, "#ffffff");
}

let _crestSeq = 0;

// Field patterns, all drawn across the full box and clipped to the outline.
function _crestField(pattern, a, b){
  switch(pattern){
    case "stripes":
      return `<rect width="100" height="116" fill="${a}"/>` +
        [20,60].map(x=>`<rect x="${x}" width="20" height="116" fill="${b}"/>`).join("");
    case "hoops":
      return `<rect width="100" height="116" fill="${a}"/>` +
        [19,57,95].map(y=>`<rect y="${y}" width="100" height="19" fill="${b}"/>`).join("");
    case "half":
      return `<rect width="100" height="116" fill="${a}"/><rect x="50" width="50" height="116" fill="${b}"/>`;
    case "diag":
      return `<rect width="100" height="116" fill="${a}"/><path d="M0 116 L100 0 L100 116 Z" fill="${b}"/>`;
    case "sash":
      return `<rect width="100" height="116" fill="${a}"/><rect x="38" width="24" height="116" fill="${b}"/>`;
    case "quarters":
      return `<rect width="100" height="116" fill="${a}"/>` +
        `<rect x="50" width="50" height="58" fill="${b}"/><rect y="58" width="50" height="58" fill="${b}"/>`;
    default:
      return `<rect width="100" height="116" fill="${a}"/>`;
  }
}

// Returns standalone SVG markup for a club's badge. `size` is the rendered
// width in px; height follows the 100:116 badge box.
function clubCrestSVG(club, size=46){
  const spec = (club && club.crest) || {};
  const shape = spec.s || "shield";
  const pattern = spec.p || "solid";
  const motif = CREST_MOTIFS[spec.m] ? spec.m : "star";
  const primary = club.primary || "#0b4f90";
  const secondary = club.secondary || "#ffffff";
  const id = "crest" + (++_crestSeq);

  // the hole colour punches back to whatever covers the middle of the badge
  const centreField = (pattern==="stripes" || pattern==="sash") ? secondary : primary;
  // a club can name its motif colour outright when the automatic pick isn't
  // the one its identity calls for
  const ink = spec.ink || _crestInk(_crestFields(pattern, primary, secondary), secondary===centreField ? primary : secondary);
  const rim = _crestContrast(primary, "#ffffff") > 1.7 ? "rgba(255,255,255,.85)" : "rgba(16,22,31,.85)";

  const outline = shape==="round"
    ? `<circle cx="50" cy="58" r="49"/>`
    : `<path d="M50 3 L96 17 V56 C96 86 76 106 50 114 C24 106 4 86 4 56 V17 Z"/>`;

  const motifBox = shape==="round"
    ? `translate(25,33) scale(0.5)`
    : `translate(23,31) scale(0.54)`;

  return `<svg class="crest-svg" viewBox="0 0 100 116" width="${size}" height="${Math.round(size*1.16)}" role="img" aria-label="${club.name}">
  <defs><clipPath id="${id}">${outline}</clipPath></defs>
  <g clip-path="url(#${id})">
    ${_crestField(pattern, primary, secondary)}
    <g transform="${motifBox}">${CREST_MOTIFS[motif](ink, centreField)}</g>
  </g>
  <g fill="none" stroke="${rim}" stroke-width="5" clip-path="url(#${id})">${outline}</g>
</svg>`;
}

// ---- Match kits ----
// The two sides on the pitch have to be told apart at a glance on a small
// canvas, which is the same problem real football solves with a change strip:
// the visiting side switches when its shirt is too close to the home one.
// The player's own club never changes — seeing your own colours is the point.
function _kitClash(a, b){ return _crestContrast(a, b) < 1.7; }

function matchKits(myClub, oppClub){
  const mine = { shirt: myClub.primary, shorts: myClub.secondary };
  let theirs = { shirt: oppClub.primary, shorts: oppClub.secondary };

  if(_kitClash(mine.shirt, theirs.shirt)){
    theirs = { shirt: oppClub.secondary, shorts: oppClub.primary };
  }
  if(_kitClash(mine.shirt, theirs.shirt)){
    // both of the opponent's colours clash, so they take a neutral change
    // strip chosen against the shirt we are already showing
    theirs = _crestLum(mine.shirt) > 0.4
      ? { shirt:"#1b2740", shorts:"#e8eef7" }
      : { shirt:"#eef2f8", shorts:"#1b2740" };
  }
  // shorts that match the shirt erase the figure's waist, so nudge them apart
  if(_kitClash(mine.shirt, mine.shorts))   mine.shorts   = _crestLum(mine.shirt)   > 0.4 ? "#1b2740" : "#eef2f8";
  if(_kitClash(theirs.shirt, theirs.shorts)) theirs.shorts = _crestLum(theirs.shirt) > 0.4 ? "#1b2740" : "#eef2f8";

  return { mine, theirs };
}

// the "this one is you" ring has to stay visible over your own shirt colour
function heroRingColor(shirt){
  return _crestContrast(shirt, "#c2ff40") >= 1.9 ? "#c2ff40" : "#ffffff";
}
