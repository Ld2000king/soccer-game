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

// ===== Between-match life decisions =====
// Each choice nudges energy/morale plus two hidden relationship stats:
// chemistry (how much your teammates look for you / set you up) and
// coachTrust (how much the coach trusts you with minutes).
const LIFE_EVENTS = [
  {
    id:"party",
    icon:"🎉",
    title:"מסיבה עם החברים מהקבוצה",
    desc:"כמה שחקנים מהקבוצה מתארגנים למסיבה הערב ומזמינים אותך. המשחק הבא כבר מחר בערב...",
    a:{ label:"מצטרף למסיבה!", hint:"אנרגיה ⬇ • כימיה עם הקבוצה ⬆ • אמון המאמן ⬇",
        effects:{energy:-20, morale:8, chemistry:8, coachTrust:-6},
        news:"{name} נראה חוגג עם חברי הקבוצה — האווירה במלתחה השתפרה." },
    b:{ label:"נשאר להתמקד במשחק", hint:"אנרגיה ⬆ • כימיה ⬇ • אמון המאמן ⬆",
        effects:{energy:5, morale:-3, chemistry:-5, coachTrust:8},
        news:"{name} ויתר על הבילוי כדי להתמקד — המאמן שם לב לרצינות." },
  },
  {
    id:"interview",
    icon:"🎤",
    title:"בקשת ראיון מהתקשורת",
    desc:"כתב ספורטיבי מבקש ראיון בלעדי איתך על הקריירה שלך. זה יעלה את הפרופיל שלך, אבל יגזול זמן מנוחה.",
    a:{ label:"לתת את הראיון", hint:"תדמית ⬆ • כסף קטן ⬆ • אנרגיה ⬇",
        effects:{energy:-8, reputation:2, money:400},
        news:"הראיון של {name} התפרסם וזכה לתשומת לב רבה." },
    b:{ label:"לסרב בנימוס", hint:"אנרגיה ⬆",
        effects:{energy:6},
        news:"{name} העדיף לשמור על פרופיל נמוך השבוע." },
  },
  {
    id:"extra_training",
    icon:"🏃",
    title:"אימון בוקר וולונטרי",
    desc:"המאמן הציע אימון בוקר נוסף למי שרוצה להתפתח מהר יותר. זה כואב, אבל משתלם.",
    a:{ label:"להגיע לאימון הנוסף", hint:"יכולת אקראית ⬆ • אנרגיה ⬇⬇",
        effects:{energy:-15, coachTrust:4},
        extraTraining:true,
        news:"{name} השקיע אימון בוקר נוסף מיוזמתו." },
    b:{ label:"לנוח כרגיל", hint:"אנרגיה ⬆",
        effects:{energy:8},
        news:"{name} בחר לשמור על כוחות למשחק." },
  },
  {
    id:"charity",
    icon:"❤️",
    title:"ביקור עמותת ילדים",
    desc:"המועדון מארגן ביקור בבית חולים לילדים ומחפש שחקנים שיגיעו לחזק.",
    a:{ label:"להגיע ולחזק", hint:"תדמית ⬆ • מורל ⬆ • כימיה ⬆ • אנרגיה ⬇",
        effects:{energy:-6, morale:6, reputation:2, chemistry:4},
        news:"{name} ביקר בבית החולים וקיבל אהבה מהאוהדים." },
    b:{ label:"להעדיף מנוחה", hint:"אנרגיה ⬆",
        effects:{energy:6},
        news:"{name} העדיף לנוח השבוע." },
  },
  {
    id:"sponsor_vip",
    icon:"🥂",
    title:"ערב VIP עם ספונסר פוטנציאלי",
    desc:"הסוכן שלך מתקשר: יש הזדמנות לערב VIP עם נותן חסות שמתעניין בך. זה יעלה כסף, אבל המאמן מצפה למחויבות מלאה השבוע.",
    a:{ label:"להשתתף בערב", hint:"כסף ⬆ • תדמית ⬆ • אנרגיה ⬇ • אמון המאמן ⬇",
        effects:{energy:-12, money:800, reputation:2, coachTrust:-4},
        news:"{name} נראה בערב VIP יוקרתי עם נותן חסות פוטנציאלי." },
    b:{ label:"להישאר מקצועי", hint:"אמון המאמן ⬆",
        effects:{coachTrust:6},
        news:"{name} דחה אירועים חיצוניים כדי להתמקד בקבוצה." },
  },
];
