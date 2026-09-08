// ===== Static game data =====
// Club names are deliberately shortened/altered versions inspired by real club identities
// (colors kept close to reality) to avoid using full official trademarked names.

// Leagues are ordered by prestige — the ladder a career climbs. `minRep` gates
// which foreign leagues will even look at you when transfer offers are drawn.
const LEAGUES = [
  { id:"il", name:"ליגת העל",         country:"ישראל",  flag:"🇮🇱", minRep:0 },
  { id:"fr", name:"הליגה הצרפתית",    country:"צרפת",   flag:"🇫🇷", minRep:30 },
  { id:"it", name:"הליגה האיטלקית",   country:"איטליה", flag:"🇮🇹", minRep:40 },
  { id:"de", name:"הליגה הגרמנית",    country:"גרמניה", flag:"🇩🇪", minRep:45 },
  { id:"es", name:"הליגה הספרדית",    country:"ספרד",   flag:"🇪🇸", minRep:55 },
  { id:"en", name:"הליגה האנגלית",    country:"אנגליה", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", minRep:60 },
];

function getLeague(id){ return LEAGUES.find(l=>l.id===id) || LEAGUES[0]; }

const CLUBS = [
  // ---- ישראל ----
  { id:"mtlv", league:"il", name:"Macabi TA",   city:"Tel Aviv",   primary:"#ffd400", secondary:"#0033a0", rating:82, crest:{s:"shield",p:"solid",m:"star"} },
  { id:"btjr", league:"il", name:"Beitar Jer",  city:"Jerusalem",  primary:"#111111", secondary:"#ffd400", rating:74, crest:{s:"shield",p:"half",m:"tower"} },
  { id:"hptlv",league:"il", name:"Hapo'el TA",  city:"Tel Aviv",   primary:"#d21f3c", secondary:"#ffffff", rating:70, crest:{s:"round",p:"solid",m:"hammers"} },
  { id:"mhaifa",league:"il",name:"Macabi Haifa",city:"Haifa",      primary:"#009845", secondary:"#ffffff", rating:78, crest:{s:"shield",p:"solid",m:"anchor"} },
  { id:"hpbs", league:"il", name:"Hapo'el B.S", city:"Beer Sheva", primary:"#d21f3c", secondary:"#0033a0", rating:69, crest:{s:"shield",p:"sash",m:"bolt"} },
  { id:"bsak", league:"il", name:"Bnei Sakhnin",city:"Sakhnin",    primary:"#d21f3c", secondary:"#ffffff", rating:60, crest:{s:"round",p:"hoops",m:"ball"} },
  { id:"ashd", league:"il", name:"FC Ashdod",   city:"Ashdod",     primary:"#ffd400", secondary:"#d21f3c", rating:58, crest:{s:"shield",p:"stripes",m:"ship"} },
  { id:"hphaifa",league:"il",name:"Hapo'el Haifa",city:"Haifa",    primary:"#d21f3c", secondary:"#111111", rating:56, crest:{s:"shield",p:"half",m:"wolf"} },
  { id:"ntny", league:"il", name:"Netanya SC",  city:"Netanya",    primary:"#ffd400", secondary:"#0033a0", rating:54, crest:{s:"round",p:"solid",m:"rose"} },
  { id:"hpjr", league:"il", name:"Hapo'el Jer", city:"Jerusalem",  primary:"#d21f3c", secondary:"#111111", rating:52, crest:{s:"shield",p:"sash",m:"crown"} },

  // ---- צרפת ----
  { id:"parsg", league:"fr", name:"Paris SG",      city:"Paris",     primary:"#004170", secondary:"#da291c", rating:86, crest:{s:"shield",p:"sash",m:"tower"} },
  { id:"marsw", league:"fr", name:"Marseille W.",  city:"Marseille", primary:"#2faee0", secondary:"#ffffff", rating:76, crest:{s:"round",p:"solid",m:"ship"} },
  { id:"lyonl", league:"fr", name:"Lyon Lions",    city:"Lyon",      primary:"#ffffff", secondary:"#da291c", rating:75, crest:{s:"shield",p:"half",m:"lion"} },
  { id:"monrg", league:"fr", name:"Monaco Rouge",  city:"Monaco",    primary:"#e63946", secondary:"#ffffff", rating:78, crest:{s:"shield",p:"diag",m:"crown"} },
  { id:"lilld", league:"fr", name:"Lille Dogues",  city:"Lille",     primary:"#e01e13", secondary:"#ffffff", rating:74, crest:{s:"round",p:"solid",m:"fleur"} },
  { id:"niceg", league:"fr", name:"Nice Aiglons",  city:"Nice",      primary:"#d40000", secondary:"#111111", rating:72, crest:{s:"shield",p:"half",m:"cross"} },
  { id:"rennr", league:"fr", name:"Rennes Rouge",  city:"Rennes",    primary:"#e23028", secondary:"#111111", rating:71, crest:{s:"shield",p:"stripes",m:"star"} },
  { id:"lensg", league:"fr", name:"Lens Or-Sang",  city:"Lens",      primary:"#ffe500", secondary:"#e01e13", rating:70, crest:{s:"shield",p:"hoops",m:"bolt"} },
  { id:"nantc", league:"fr", name:"Nantes Canaris",city:"Nantes",    primary:"#fcd700", secondary:"#008d36", rating:66, crest:{s:"round",p:"solid",m:"bird"} },
  { id:"strsb", league:"fr", name:"Strasbourg B.", city:"Strasbourg",primary:"#0066b2", secondary:"#ffffff", rating:64, crest:{s:"shield",p:"half",m:"anchor"} },

  // ---- איטליה ----
  { id:"milrn", league:"it", name:"Milan Rosso",   city:"Milano",    primary:"#fb090b", secondary:"#111111", rating:85, crest:{s:"shield",p:"stripes",m:"cross"} },
  { id:"milnz", league:"it", name:"Milan Nero",    city:"Milano",    primary:"#010e80", secondary:"#111111", rating:87, crest:{s:"round",p:"hoops",m:"star"} },
  { id:"torbn", league:"it", name:"Torino Bianco", city:"Torino",    primary:"#111111", secondary:"#ffffff", rating:86, crest:{s:"shield",p:"stripes",m:"crown"} },
  { id:"napaz", league:"it", name:"Napoli Azzurri",city:"Napoli",    primary:"#12a0d7", secondary:"#ffffff", rating:84, crest:{s:"round",p:"solid",m:"horse"} },
  { id:"romgr", league:"it", name:"Roma Giallo",   city:"Roma",      primary:"#8e1f2f", secondary:"#f0bc42", rating:80, crest:{s:"shield",p:"half",m:"wolf"} },
  { id:"lazbc", league:"it", name:"Lazio Celeste", city:"Roma",      primary:"#87d8f7", secondary:"#ffffff", rating:78, crest:{s:"round",p:"solid",m:"bird"} },
  { id:"bergb", league:"it", name:"Bergamo Blues", city:"Bergamo",   primary:"#1d1d1b", secondary:"#0066b3", rating:79, crest:{s:"shield",p:"stripes",m:"lion"} },
  { id:"fiovl", league:"it", name:"Firenze Viola", city:"Firenze",   primary:"#592c82", secondary:"#ffffff", rating:75, crest:{s:"shield",p:"solid",m:"fleur"} },
  { id:"bolrb", league:"it", name:"Bologna R.B.",  city:"Bologna",   primary:"#1a2f48", secondary:"#d2122e", rating:72, crest:{s:"round",p:"hoops",m:"tower"} },
  { id:"torgr", league:"it", name:"Torino Granata",city:"Torino",    primary:"#881600", secondary:"#ffffff", rating:70, crest:{s:"shield",p:"solid",m:"bull"} },

  // ---- גרמניה ----
  { id:"bayrd", league:"de", name:"Bayern Reds",   city:"München",   primary:"#dc052d", secondary:"#0066b2", rating:89, crest:{s:"shield",p:"quarters",m:"star"} },
  { id:"dorty", league:"de", name:"Dortmund Y.",   city:"Dortmund",  primary:"#fde100", secondary:"#111111", rating:83, crest:{s:"round",p:"solid",m:"bolt"} },
  { id:"leipb", league:"de", name:"Leipzig Bulls", city:"Leipzig",   primary:"#dd0741", secondary:"#ffffff", rating:81, crest:{s:"shield",p:"half",m:"bull"} },
  { id:"leverk",league:"de", name:"Leverkusen W.", city:"Leverkusen",primary:"#e32221", secondary:"#111111", rating:82, crest:{s:"shield",p:"half",m:"lion"} },
  { id:"frnke", league:"de", name:"Frankfurt E.",  city:"Frankfurt", primary:"#e1000f", secondary:"#111111", rating:76, crest:{s:"shield",p:"solid",m:"bird"} },
  { id:"bremg", league:"de", name:"Bremen Greens", city:"Bremen",    primary:"#1d9053", secondary:"#ffffff", rating:71, crest:{s:"shield",p:"stripes",m:"anchor"} },
  { id:"gladf", league:"de", name:"Gladbach Foals",city:"M.Gladbach",primary:"#111111", secondary:"#00a94f", rating:72, crest:{s:"round",p:"solid",m:"ball"} },
  { id:"stutr", league:"de", name:"Stuttgart Reds",city:"Stuttgart", primary:"#ffffff", secondary:"#e32219", rating:75, crest:{s:"shield",p:"half",m:"horse"} },
  { id:"wolfw", league:"de", name:"Wolfsburg W.",  city:"Wolfsburg", primary:"#65b32e", secondary:"#ffffff", rating:70, crest:{s:"shield",p:"half",m:"wolf"} },
  { id:"freib", league:"de", name:"Freiburg Reds", city:"Freiburg",  primary:"#111111", secondary:"#e2001a", rating:68, crest:{s:"round",p:"solid",m:"cross"} },

  // ---- ספרד ----
  { id:"madbl", league:"es", name:"Madrid Blancos",city:"Madrid",    primary:"#ffffff", secondary:"#febe10", rating:92, crest:{s:"round",p:"solid",m:"crown"} },
  { id:"barbg", league:"es", name:"Barca Blaugrana",city:"Barcelona",primary:"#a50044", secondary:"#004d98", rating:90, crest:{s:"shield",p:"stripes",m:"cross"} },
  { id:"madrb", league:"es", name:"Madrid Rojiblanco",city:"Madrid", primary:"#cb3524", secondary:"#272e61", rating:85, crest:{s:"shield",p:"stripes",m:"tower"} },
  { id:"sevrj", league:"es", name:"Sevilla Rojo",  city:"Sevilla",   primary:"#d9042b", secondary:"#ffffff", rating:78, crest:{s:"round",p:"solid",m:"ball"} },
  { id:"bilbl", league:"es", name:"Bilbao Lions",  city:"Bilbao",    primary:"#ee2523", secondary:"#ffffff", rating:77, crest:{s:"shield",p:"stripes",m:"lion"} },
  { id:"valbt", league:"es", name:"Valencia Bats", city:"Valencia",  primary:"#ffffff", secondary:"#ee3524", rating:74, crest:{s:"shield",p:"solid",m:"bird"} },
  { id:"betvr", league:"es", name:"Betis Verde",   city:"Sevilla",   primary:"#00954c", secondary:"#ffffff", rating:76, crest:{s:"shield",p:"stripes",m:"star"} },
  { id:"socbl", league:"es", name:"Sociedad Txuri",city:"San Seb.",  primary:"#0067b1", secondary:"#ffffff", rating:75, crest:{s:"shield",p:"stripes",m:"anchor"} },
  { id:"vilay", league:"es", name:"Villarreal Y.", city:"Villarreal",primary:"#ffe667", secondary:"#005187", rating:73, crest:{s:"round",p:"solid",m:"ship"} },
  { id:"girrd", league:"es", name:"Girona Reds",   city:"Girona",    primary:"#d50032", secondary:"#ffffff", rating:71, crest:{s:"shield",p:"stripes",m:"fleur"} },

  // ---- אנגליה ----
  { id:"manrd", league:"en", name:"Man Reds",      city:"Manchester",primary:"#da291c", secondary:"#fbe122", rating:85, crest:{s:"shield",p:"solid",m:"ship"} },
  { id:"mansk", league:"en", name:"Man Sky",       city:"Manchester",primary:"#6cabdd", secondary:"#1c2c5b", rating:92, crest:{s:"round",p:"solid",m:"rose"} },
  { id:"lonbl", league:"en", name:"London Blues",  city:"London",    primary:"#034694", secondary:"#ffffff", rating:84, crest:{s:"round",p:"solid",m:"crown"} },
  { id:"nlong", league:"en", name:"North London",  city:"London",    primary:"#ef0107", secondary:"#ffffff", rating:88, crest:{s:"shield",p:"solid",m:"cannon"} },
  { id:"spurs", league:"en", name:"Spurs N17",     city:"London",    primary:"#ffffff", secondary:"#132257", rating:82, crest:{s:"shield",p:"solid",m:"ball"} },
  { id:"mersr", league:"en", name:"Mersey Reds",   city:"Liverpool", primary:"#c8102e", secondary:"#00b2a9", rating:90, crest:{s:"shield",p:"solid",m:"bird"} },
  { id:"toonm", league:"en", name:"Toon Army",     city:"Newcastle", primary:"#241f20", secondary:"#ffffff", rating:80, crest:{s:"shield",p:"stripes",m:"tower"} },
  { id:"villc", league:"en", name:"Villa Claret",  city:"Birmingham",primary:"#670e36", secondary:"#95bfe5", rating:81, crest:{s:"shield",p:"half",m:"lion"} },
  { id:"whirn", league:"en", name:"West Ham Irons",city:"London",    primary:"#7a263a", secondary:"#1bb1e7", rating:76, crest:{s:"shield",p:"half",m:"hammers"} },
  { id:"seagl", league:"en", name:"Seagulls FC",   city:"Brighton",  primary:"#0057b8", secondary:"#ffffff", rating:75, crest:{s:"round",p:"stripes",m:"anchor"} },
];

function clubsInLeague(leagueId){ return CLUBS.filter(c=>c.league===leagueId); }

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

const STAT_KEYS = ["pace","shooting","passing","dribbling","defending","physical"];
const STAT_LABELS = {pace:"מהירות",shooting:"בעיטה",passing:"מסירה",dribbling:"כדרור",defending:"הגנה",physical:"כוח"};

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
  {
    id:"injury_scare",
    icon:"🤕",
    title:"כאב קל בברך אחרי האימון",
    desc:"אתה מרגיש דקירה קלה בברך. המשחק הבא קריטי לטבלה, אבל להמשיך לשחק עם כאב זה מסוכן.",
    a:{ label:"לשחק על הכאב", hint:"אמון המאמן ⬆⬆ • מהירות ⬇ • אנרגיה ⬇⬇",
        effects:{energy:-25, coachTrust:10, pace:-2, morale:-3},
        news:"{name} התעקש לשחק חרף הכאב — המאמן העריך את הנחישות." },
    b:{ label:"לנוח ולהחלים כמו שצריך", hint:"אנרגיה ⬆ • אמון המאמן ⬇",
        effects:{energy:15, coachTrust:-5},
        news:"{name} העדיף להיזהר ולנוח עד שהברך תתאושש." },
  },
  {
    id:"crypto_bro",
    icon:"🪙",
    title:"חבר ילדות מציע 'הזדמנות השקעה בלתי מוחמצת'",
    desc:"חבר ותיק מתקשר נרגש: יש לו מטבע דיגיטלי חדש שהולך 'להתפוצץ'. הוא רק צריך שתשקיע עכשיו.",
    a:{ label:"להשקיע הכל בקוין המסתורי", hint:"כסף ⬇⬇⬇",
        effects:{money:-1800, morale:2},
        news:"{name} 'השקיע' בקוין חדש. אף אחד לא שמע עליו שוב." },
    b:{ label:"לסרב בנימוס", hint:"אין השפעה",
        effects:{},
        news:"{name} שמר על הכסף בכיס — הכי חכם שעשה השבוע." },
  },
  {
    id:"social_drama",
    icon:"📱",
    title:"רכילות מפוברקת עליך ברשתות",
    desc:"חשבון רכילות פרסם סטורי מפוברק עליך שמתפשט מהר. אוהדים כבר מגיבים בתגובות.",
    a:{ label:"לצאת נגד זה בפומבי", hint:"תדמית ⬇ • כימיה ⬇ • מורל ⬇",
        effects:{reputation:-3, morale:-4, chemistry:-3},
        news:"{name} נכנס לוויכוח פומבי ברשתות — זה רק הזין את השרפה." },
    b:{ label:"להתעלם ולהמשיך הלאה", hint:"תדמית ⬆ • אמון המאמן ⬆",
        effects:{reputation:1, coachTrust:3},
        news:"{name} התעלם לגמרי מהרכילות — הפרשה שככה מעצמה." },
  },
  {
    id:"reality_show",
    icon:"📺",
    title:"הזמנה מפתיעה לתוכנית ריאליטי",
    desc:"מפיק טלוויזיה מציע לך תפקיד בעונה הבאה של תוכנית ריאליטי מפורסמת. זה יעשה לך שם, אבל המאמן ישתגע.",
    a:{ label:"להצטרף לתוכנית!", hint:"כסף ⬆⬆ • תדמית ⬆⬆ • אנרגיה ⬇⬇ • אמון המאמן ⬇⬇",
        effects:{money:3000, reputation:5, energy:-15, coachTrust:-8},
        news:"{name} מצטרף לקאסט תוכנית ריאליטי — הכותרות מטורפות." },
    b:{ label:"לסרב, אתה כדורגלן לא סלב", hint:"אמון המאמן ⬆",
        effects:{coachTrust:4},
        news:"{name} דחה הצעת ריאליטי כדי להתמקד בכדורגל." },
  },
  {
    id:"stray_dog",
    icon:"🐶",
    title:"כלב רחוב מסתובב סביב האצטדיון",
    desc:"כלב חמוד ורזה מסתובב סביב האצטדיון כבר שבועיים ונדבק אליך בכל אימון.",
    a:{ label:"לאמץ אותו כקמע הקבוצה", hint:"מורל ⬆⬆ • כימיה ⬆ • כסף ⬇",
        effects:{morale:8, chemistry:4, money:-300},
        news:"{name} אימץ כלב רחוב שהפך לקמע הרשמי של הקבוצה!" },
    b:{ label:"להשאיר לצוות האצטדיון", hint:"אין השפעה",
        effects:{},
        news:"{name} השאיר את הכלב לטיפול צוות האצטדיון." },
  },
  {
    id:"extreme_diet",
    icon:"🥦",
    title:"תזונאי מפורסם מציע דיאטה קיצונית",
    desc:"תזונאי שעובד עם כוכבי הוליווד מציע לך תפריט קיצוני שמבטיח 'שינוי מהפכני' תוך שבוע.",
    a:{ label:"לנסות את הדיאטה הקיצונית", hint:"כוח גופני ⬆ • אנרגיה ⬇ • מורל ⬇",
        effects:{physical:2, energy:-10, morale:-4},
        news:"{name} מנסה דיאטה קיצונית חדשה. קשה, אבל מרגיש שינוי." },
    b:{ label:"להישאר עם התפריט הרגיל", hint:"אין השפעה",
        effects:{},
        news:"{name} העדיף לא לשבש שגרה שעובדת." },
  },
  {
    id:"ufo_rumor",
    icon:"🛸",
    title:"עיתונאי טוען שראה אותך ליד עצם מעופף",
    desc:"כתבה מוזרה עולה לאוויר: 'שחקן הכדורגל נראה משוחח עם אור מסתורי בשמיים אחרי האימון.'",
    a:{ label:"לשחק את זה ולתת ראיון מסתורי", hint:"תדמית ⬆⬆ • מורל ⬆ • אמון המאמן ⬇",
        effects:{reputation:6, morale:5, coachTrust:-3},
        news:"{name} סירב להכחיש את סיפור העצם המעופפת — הכותרות השתגעו." },
    b:{ label:"להכחיש הכל בתוקף", hint:"אמון המאמן ⬆",
        effects:{coachTrust:2},
        news:"{name} הכחיש בתוקף — 'לא היה שום עצם מעופף, פשוט הלכתי הביתה.'" },
  },
  {
    id:"karaoke_night",
    icon:"🎤",
    title:"ערב קריוקי של הקבוצה",
    desc:"הקבוצה מארגנת ערב קריוקי במלתחה אחרי אימון. הקול שלך... לא בדיוק של זמר.",
    a:{ label:"לעלות ולשיר בכל הלב", hint:"מורל ⬆ • כימיה ⬆⬆",
        effects:{morale:6, chemistry:6},
        news:"{name} שר קריוקי נורא, אבל כל הקבוצה מתה מצחוק ואהבה את זה." },
    b:{ label:"לסרב מנימוס", hint:"כימיה ⬇",
        effects:{chemistry:-2},
        news:"{name} ויתר על הקריוקי — חבל, זה היה יכול להיות כיף." },
  },
  {
    id:"teammate_loan",
    icon:"🤝",
    title:"חבר לקבוצה מבקש הלוואה דחופה",
    desc:"אחד השחקנים הצעירים ניגש אליך במבוכה ומבקש הלוואה קטנה למצב חירום משפחתי.",
    a:{ label:"להלוות לו את הכסף", hint:"כימיה ⬆⬆⬆ • כסף ⬇",
        effects:{chemistry:6, money:-1000},
        news:"{name} עזר לחבר לקבוצה בלי לחשוב פעמיים — המלתחה שמעה על זה." },
    b:{ label:"לסרב בנימוס", hint:"כימיה ⬇",
        effects:{chemistry:-4},
        news:"{name} סירב לבקשת ההלוואה — האווירה במלתחה קצת התקררה." },
  },
  {
    id:"weird_fashion",
    icon:"🧢",
    title:"מותג אופנה מוזר מציע דוגמנות",
    desc:"מותג אופנה אקספרימנטלי רוצה שתדגמן קולקציה חדשה — כובע ענק וגרביים זוהרות בחושך.",
    a:{ label:"להסכים לדוגמנות המוזרה", hint:"כסף ⬆⬆ • תדמית ⬆ • מורל ⬇",
        effects:{money:2000, reputation:3, morale:-2},
        news:"{name} דוגמן קולקציית אופנה מוזרה — התמונה עם הכובע הפכה לוויראלית." },
    b:{ label:"לסרב, זה מביך מדי", hint:"אין השפעה",
        effects:{},
        news:"{name} דחה הצעת דוגמנות מוזרה. אולי בחוכמה." },
  },
  {
    id:"fortune_teller",
    icon:"🔮",
    title:"קוראת בקלפים ברחוב עוצרת אותך",
    desc:"אישה מסתורית ברחוב מציעה לקרוא לך את העתיד. 'יש לי הודעה בשבילך,' היא אומרת בסודיות.",
    a:{ label:"לשלם ולשמוע את העתיד", hint:"כסף ⬇ • מורל ⬆",
        effects:{money:-100, morale:3},
        news:"'\"ניצחון גדול מחכה לך\", היא אמרה. {name} יצא עם חיוך גדול." },
    b:{ label:"להתעלם, שטויות", hint:"אין השפעה",
        effects:{},
        news:"{name} המשיך ללכת בלי להביט אחורה." },
  },
  {
    id:"podcast_invite",
    icon:"🎙️",
    title:"הזמנה לפודקאסט ספורט פופולרי",
    desc:"אחד הפודקאסטים הכי מאזינים בענף מזמין אותך לשיחה פתוחה על הקריירה שלך.",
    a:{ label:"להשתתף ולדבר בפתיחות", hint:"תדמית ⬆⬆ • אנרגיה ⬇",
        effects:{reputation:4, energy:-8},
        news:"{name} נשמע נהדר בפודקאסט — הפרק הפך לאחד הנצפים בעונה." },
    b:{ label:"לסרב, שומר על מסתורין", hint:"אין השפעה",
        effects:{},
        news:"{name} העדיף לשמור על פרופיל נמוך ומסתורי." },
  },
];

// ===== Lifestyle shop =====
// Each category is a one-item-owned-at-a-time upgrade ladder: buying a new
// tier replaces the old one (no refund). cost is one-time, upkeep is
// deducted from wages every week — the tension is real luxury vs. real bills.
const LIFESTYLE_CATEGORIES = [
  {
    id:"car", label:"רכב", icon:"🚗",
    items:[
      { id:"bike", name:"אופניים ישנות", cost:800, upkeep:0, morale:2, reputation:0,
        flavor:"זה משהו." },
      { id:"family_car", name:"רכב משפחתי סביר", cost:12000, upkeep:80, morale:5, reputation:1,
        flavor:"נוח, כלכלי, משעמם." },
      { id:"sports_car", name:"מכונית ספורט אדומה", cost:65000, upkeep:350, morale:10, reputation:3,
        flavor:"האוהדים מצלמים אותך בכניסה לאצטדיון." },
      { id:"monster_truck", name:"רכב שטח עם צמיגי מונסטר טראק", cost:150000, upkeep:500, morale:14, reputation:2,
        flavor:"לא ברור למה, אבל האוהדים אוהבים את זה." },
      { id:"supercar", name:"סופר-קאר מוזהב", cost:280000, upkeep:900, morale:18, reputation:6,
        flavor:"מנוע שנשמע עד הרובע הבא." },
    ],
  },
  {
    id:"phone", label:"טלפון", icon:"📱",
    items:[
      { id:"basic_phone", name:"טלפון עם מקשים", cost:150, upkeep:0, morale:1, reputation:0,
        flavor:"עושה שיחות. זהו." },
      { id:"smartphone", name:"סמארטפון חדיש", cost:3500, upkeep:20, morale:4, reputation:1,
        flavor:"סוף סוף אפשר לראות את הסטטיסטיקות שלך באיכות טובה." },
      { id:"diamond_phone", name:"טלפון מוזהב משובץ יהלומים", cost:45000, upkeep:100, morale:9, reputation:4,
        flavor:"שוקל טונה, נראה מגוחך, אתה אוהב אותו." },
      { id:"president_line", name:"קו ישיר לנשיא המדינה", cost:500000, upkeep:300, morale:20, reputation:10,
        flavor:"אין באמת שימוש לזה, אבל זה מרשים בדוכן העיתונות." },
    ],
  },
  {
    id:"home", label:"בית", icon:"🏠",
    items:[
      { id:"studio", name:"דירת סטודיו צנועה", cost:20000, upkeep:150, morale:5, reputation:0,
        flavor:"קטן, אבל שלך." },
      { id:"villa", name:"וילה עם בריכה", cost:400000, upkeep:2000, morale:15, reputation:5,
        flavor:"מסיבות בריכה בכל סוף שבוע." },
      { id:"penthouse", name:"פנטהאוז עם נוף לים", cost:900000, upkeep:4000, morale:22, reputation:8,
        flavor:"אתה רואה את האצטדיון מהמרפסת." },
      { id:"scottish_castle", name:"טירה סקוטית עתיקה", cost:3000000, upkeep:9000, morale:30, reputation:12,
        flavor:"אף אחד לא יודע למה קנית טירה בסקוטלנד." },
    ],
  },
  {
    id:"jet", label:"תעופה", icon:"✈️",
    items:[
      { id:"business_class", name:"מנוי מחלקת עסקים", cost:8000, upkeep:100, morale:6, reputation:1,
        flavor:"טיסות בנוחות, בלי לעמוד בתור." },
      { id:"private_jet", name:"מטוס פרטי קטן", cost:2000000, upkeep:8000, morale:20, reputation:10,
        flavor:"נוחת ממש ליד האצטדיון בכל משחק חוץ." },
      { id:"jumbo_karaoke", name:"מטוס ג'מבו פרטי עם חדר קריוקי", cost:12000000, upkeep:30000, morale:35, reputation:20,
        flavor:"למה בכלל צריך את זה? כי אפשר." },
    ],
  },
  {
    id:"partner", label:"זוגיות", icon:"❤️",
    items:[
      { id:"blind_date", name:"פגישה עיוורת מביכה", cost:300, upkeep:0, morale:-2, reputation:0,
        flavor:"זה לא הלך כמו שקיווית..." },
      { id:"steady_partner", name:"בן/בת זוג יציבים", cost:15000, upkeep:250, morale:12, reputation:0, chemistry:5,
        flavor:"מישהו לחזור אליו הביתה אחרי משחק קשה." },
      { id:"celeb_romance", name:"רומן עם זמר/ת מפורסם/ת", cost:60000, upkeep:600, morale:18, reputation:8,
        flavor:"הפפראצי לא מרפים, אבל זה שווה את זה." },
      { id:"royal_wedding", name:"חתונה מלכותית ענקית", cost:800000, upkeep:0, morale:40, reputation:15,
        flavor:"כל הארץ צפתה בטקס בשידור חי." },
    ],
  },
];

// ===== Relationships (Boss / Team / Fans / Partner / Sponsors) =====
// Each sits 0..100; their average drives the overall Star Rating.
const RELATIONSHIPS = [
  { id:"boss",     label:"מאמן",   icon:"👔" },
  { id:"team",     label:"קבוצה",  icon:"🤝" },
  { id:"fans",     label:"אוהדים", icon:"📣" },
  { id:"partner",  label:"זוגיות", icon:"❤️" },
  { id:"sponsors", label:"חסויות", icon:"💼" },
];

// ===== Work rate: more effort = more chances on the ball, but drains energy =====
const WORK_RATES = [
  { id:"low",  label:"חסכוני",  hearts:1, momentBonus:-1, energyCost:18, desc:"פחות מגע בכדור, שומר כוחות." },
  { id:"mid",  label:"מאוזן",   hearts:2, momentBonus:0,  energyCost:30, desc:"איזון בין הזדמנויות לכוחות." },
  { id:"high", label:"מלא גז",  hearts:3, momentBonus:2,  energyCost:46, desc:"הרבה יותר הזדמנויות — ותסיים מותש." },
];

// ===== Skill upgrades bought with Star Bucks =====
// Cost climbs with the stat's current value, so late upgrades really cost.
function skillUpgradeCost(currentValue){
  return Math.round(8 + Math.pow(Math.max(0, currentValue - 40), 1.55));
}

// ===== Boots: one pair equipped, permanently boosts stats while worn =====
const BOOTS = [
  { id:"street",   name:"נעליים משומשות",     cost:0,      boosts:{},                              desc:"מה שהיה בארון." },
  { id:"starter",  name:"סטארטר טורף",        cost:2500,   boosts:{pace:2},                        desc:"קלות, נוחות, כלום מיוחד." },
  { id:"striker",  name:"סטרייקר פרו",        cost:9000,   boosts:{shooting:4, pace:1},            desc:"בנויות לגמור מהלכים." },
  { id:"playmaker",name:"פלייmaker אליט",     cost:9000,   boosts:{passing:4, dribbling:1},        desc:"לשחקנים שרואים את המגרש." },
  { id:"anchor",   name:"אנקור דיפנס",        cost:9000,   boosts:{defending:4, physical:1},       desc:"אף אחד לא עובר." },
  { id:"speedster",name:"ספידסטר קרבון",      cost:26000,  boosts:{pace:6, dribbling:2},           desc:"כמו לרוץ על ענן." },
  { id:"phantom",  name:"פנטום פרו אליט",     cost:60000,  boosts:{shooting:5, passing:5, dribbling:5}, desc:"נעלי הדגל של הליגה." },
  { id:"golden",   name:"נעלי זהב מותאמות",   cost:180000, boosts:{pace:6, shooting:6, passing:6, dribbling:6, defending:4, physical:4}, desc:"תפורות בדיוק עלייך. בזהב." },
];

// ===== Consumables: one-shot boosts used before a match =====
const CONSUMABLES = [
  { id:"water",   name:"בקבוק מים",        icon:"💧", cost:50,    energy:15, desc:"פשוט, זול, עובד." },
  { id:"nrg",     name:"משקה אנרגיה",      icon:"⚡", cost:400,   energy:45, desc:"הקלאסיקה של יום משחק." },
  { id:"gel",     name:"ג'ל פחמימות",      icon:"🍯", cost:900,   energy:70, desc:"דלק טהור לתשעים דקות." },
  { id:"shake",   name:"שייק חלבון יוקרתי",icon:"🥤", cost:2200,  energy:100, morale:5, desc:"ממלא אותך לגמרי." },
  { id:"massage", name:"עיסוי ספורטאים",   icon:"💆", cost:3500,  energy:60, morale:12, desc:"הגוף והראש חוזרים לעצמם." },
];

// ===== Sponsorship deals: weekly income, but each demands a reputation level =====
const SPONSORS = [
  { id:"local_pizza", name:"פיצריית השכונה",     icon:"🍕", reqReputation:0,   weekly:120,   signBonus:500,    desc:"שלט קטן בכניסה. כולם מתחילים איפשהו." },
  { id:"gym",         name:"רשת חדרי כושר",       icon:"🏋️", reqReputation:15,  weekly:400,   signBonus:2000,   desc:"הפנים שלך על הקיר בכל סניף." },
  { id:"soda",        name:"משקה קל פופולרי",     icon:"🥤", reqReputation:30,  weekly:1100,  signBonus:8000,   desc:"פרסומת אחת בשנה, המון כסף." },
  { id:"sportswear",  name:"מותג ביגוד ספורט",    icon:"👕", reqReputation:50,  weekly:3000,  signBonus:25000,  desc:"קולקציה על שמך." },
  { id:"watch",       name:"בית שעונים שווייצרי", icon:"⌚", reqReputation:75,  weekly:6500,  signBonus:70000,  desc:"אתה עכשיו 'שגריר המותג'." },
  { id:"global_car",  name:"יצרנית רכב עולמית",   icon:"🚘", reqReputation:110, weekly:15000, signBonus:200000, desc:"קמפיין בינלאומי. אתה הפנים." },
];
