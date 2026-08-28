// ===== Static game data =====
// Club names are deliberately shortened/altered versions inspired by real club identities
// (colors kept close to reality) to avoid using full official trademarked names.

const CLUBS = [
  { id:"mtlv", name:"Macabi TA",   city:"Tel Aviv",   primary:"#ffd400", secondary:"#0033a0", rating:82 },
  { id:"btjr", name:"Beitar Jer",  city:"Jerusalem",  primary:"#111111", secondary:"#ffd400", rating:74 },
  { id:"hptlv",name:"Hapo'el TA",  city:"Tel Aviv",   primary:"#d21f3c", secondary:"#ffffff", rating:70 },
  { id:"mhaifa",name:"Macabi Haifa",city:"Haifa",     primary:"#009845", secondary:"#ffffff", rating:78 },
  { id:"hpbs", name:"Hapo'el B.S", city:"Beer Sheva", primary:"#d21f3c", secondary:"#0033a0", rating:69 },
  { id:"bsak", name:"Bnei Sakhnin",city:"Sakhnin",    primary:"#0033a0", secondary:"#ffffff", rating:60 },
  { id:"ashd", name:"FC Ashdod",   city:"Ashdod",     primary:"#0033a0", secondary:"#ffd400", rating:58 },
  { id:"hphaifa",name:"Hapo'el Haifa",city:"Haifa",   primary:"#d21f3c", secondary:"#111111", rating:56 },
  { id:"ntny", name:"Netanya SC",  city:"Netanya",    primary:"#ffd400", secondary:"#0033a0", rating:54 },
  { id:"hpjr", name:"Hapo'el Jer", city:"Jerusalem",  primary:"#d21f3c", secondary:"#111111", rating:52 },
];

const POSITIONS = {
  FWD:{ label:"חלוץ", key:["shooting","pace","dribbling"] },
  MID:{ label:"קשר",  key:["passing","dribbling","physical"] },
  DEF:{ label:"מגן",  key:["defending","physical","pace"] },
  GK: { label:"שוער", key:["defending","physical","passing"] },
};

const TRAININGS = [
  { id:"pace", label:"אימון מהירות", stat:"pace", desc:"רוץ ספרינטים ותפוס את המחוג באזור הירוק כדי לשפר מהירות." },
  { id:"shooting", label:"אימון בעיטות", stat:"shooting", desc:"תזמן את הבעיטה בול באזור הירוק כדי לשפר עוצמת סיום." },
  { id:"passing", label:"אימון מסירות", stat:"passing", desc:"תזמן את המסירה בדיוק כדי לשפר את חדות המשחק שלך." },
  { id:"dribbling", label:"אימון כדרור", stat:"dribbling", desc:"עבור בין הקונוסים בתזמון מושלם לשיפור כדרור." },
  { id:"defending", label:"אימון הגנה", stat:"defending", desc:"תזמן את ההתערבות בדיוק כדי לשפר הגנה." },
  { id:"physical", label:"אימון כוח", stat:"physical", desc:"תזמן את ההרמה בדיוק כדי לשפר כושר גופני." },
];

const NEWS_TEMPLATES = {
  win:   ["ניצחון מרשים! {club} ממשיכה לטפס בטבלה.", "{name} זרח והוביל את {club} לניצחון חשוב."],
  draw:  ["תיקו מאכזב ל{club} מול יריבה קשוחה.", "{club} נאבקה לשוויון בדקות הסיום."],
  loss:  ["הפסד כואב ל{club} במשחק דרמטי.", "{club} יצאה וידיים ריקות הפעם."],
  goal:  ["{name} כובש! הקהל משתולל ב{club}!"],
  assist:["בישול מדויק של {name} מוביל לשער!"],
  transfer:["{name} עובר ל{club} בעסקה שמככבת בכותרות!"],
  contract:["{name} חתם על חוזה חדש עם {club}."],
};

function randPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
