/* ================================================================
   FIVE NIGHTS AT MEESTER GIJS  –  v6.2
   game.js — alle spellogica en UI-beheer
   ================================================================ */

const FILES = {
  ambience:     'Audio/Ambience.mp3',
  doorClose:    'Audio/DoorClose.mp3',
  jumpscare:    'Audio/Jumpscare.mp3',
  lure:         'Audio/Lure.mp3',
  oxygenOut:    'Audio/OxygenOutage.mp3',
  win:          'Audio/Win.mp3',
  laugh:        'Audio/Laugh.mp3',
  jeffreyLaugh: 'Audio/JeffreyLaugh.mp3',
  cameraSwitch: 'Audio/CameraSwitch.mp3',
  footsteps:    'Audio/Footsteps.mp3',
  muziek:       'Audio/Muziek.mp3',
  windUp:       'Audio/WindUp.mp3',
  alarm:        'Audio/Alarm.mp3',
  vent:         'Audio/Vent.mp3',
  markAudio:    'Audio/Mark.mp3',
  shock:        'Audio/Shock.mp3',
  cameraAlarm:  'Audio/CameraAlarm.mp3',
  menuMusic:    'Audio/Menu.mp3',
  fiveAM:       'Audio/5AM.mp3',
  gijsCam:      'Images/GijsCamera.png',
  gijsJS:       'Images/GijsJumpscare.png',
  patrickJS:    'Images/PatrickJumpscare.png',
  hoboGijsCam:  'Images/HoboGijsCamera.png',
  hoboGijsJS:   'Images/HoboGijsJumpscare.png',
  tomCam:       'Images/TomCamera.png',
  tomJS:        'Images/TomJumpscare.png',
  jeffreyCam:   'Images/JeffreyCamera.png',
  jeffreyJS:    'Images/JeffreyJumpscare.png',
  chapoCam:     'Images/ChapoCamera.png',
  chapoJS:      'Images/ChapoJumpscare.png',
  markVent:     'Images/MarkVent.png',
  markJS:       'Images/MarkJumpscare.png',
  maduroCam:    'Images/MaduroCamera.png',
  maduroJS:     'Images/MaduroJumpscare.png',
  diddyCam:     'Images/DiddyCamera.png',
  diddyJS:      'Images/DiddyJumpscare.png',
  shadowGijsOffice: 'Images/ShadowGijsOffice.png',
  shadowGijsJS:     'Images/ShadowGijsJumpscare.png',
  shadowGijsAudio:  'Audio/ShadowGijs.mp3',
  camBg0:       'Images/StookKamer.png',
  camBg1:       'Images/VoorraadKamer.png',
  camBg2:       'Images/KlasLokaal.png',
  camBg3:       'Images/LinkerGang.png',
  camBg4:       'Images/RechterGang.png',
  camBg5:       'Images/MuziekKamer.png',
};

/* ══════════════════════════════════════════
   BALANS-CONSTANTEN
══════════════════════════════════════════ */
const NIGHT_MS           = 6 * 60 * 1000;
const TICK_MS            = 400;
const O2_DRAIN_BASE      = 0.015;
const O2_DOOR_PER_TICK   = 0.10;
const O2_CAM_PER_TICK    = 0.04;
const O2_VENT_PER_TICK   = 0.08;
const LURE_CD_S          = 30;
const GRACE_MS           = 4200;
const DOOR_RETREAT_MIN   = 14000;
const DOOR_RETREAT_MAX   = 25000;
const MOVE_IVAL_BASE     = [32000,24000,16000,11000,7500,5000];
const HOBO_MIN_BASE      = 5000;
const HOBO_MAX_BASE      = 20000;
const MB_DRAIN_BASE      = 0.8;
const MB_DRAIN_SCALE     = 0.3;
const MB_WIND_RATE       = 8;
const MUSIC_CAM_ID       = 5;
const CHAPO_KILL_DELAY_MS= 6000;
const ALARM_CD_S         = 20;
const MADURO_APPEAR_INTERVAL = 2000;
const MADURO_WATCH_LIMIT_MS  = 500;
const MADURO_DISABLE_MS      = 8000;
const JEFFREY_START_POS  = 0;
const JEFFREY_PATH       = [0,1,2,3,4];
const JEFFREY_SWITCH_S   = 55;
const CHAPO_CAM_ID       = 3;
const CHAPO_ATTACK_S     = 60;
const DIDDY_MOVE_IVAL_BASE=[26000,20000,14000,10000,7000,4500];

/* ══════════════════════════════════════════
   MOEILIJKHEIDSGRAAD HELPERS
══════════════════════════════════════════ */
function diffToMoveIval(basePer10, level){
  if(level===0) return Infinity;
  const mult = 3.0 - (level-1)*(2.75/19);
  return Math.max(800, Math.round(basePer10 * mult));
}
function diffToMoveIvals(basePer10arr, level){
  if(level===0) return basePer10arr.map(()=>Infinity);
  return basePer10arr.map(b=>diffToMoveIval(b,level));
}
function diffToJeffreySwitch(level){
  if(level===0) return Infinity;
  return Math.max(8, Math.round(50 * (3.0 - (level-1)*(2.75/19))));
}
function diffToChapoAttack(level){
  if(level===0) return Infinity;
  return Math.max(8, Math.round(60 * (3.0 - (level-1)*(2.75/19))));
}
function diffToHoboMs(level){
  if(level===0) return {min:Infinity,max:Infinity};
  const mult = 3.0 - (level-1)*(2.75/19);
  return {
    min: Math.max(1000, Math.round(HOBO_MIN_BASE * mult)),
    max: Math.max(3000, Math.round(HOBO_MAX_BASE * mult))
  };
}
function diffToMaduroChance(level){
  if(level===0) return 0;
  return 0.005 + (level/20)*0.10;
}
function diffToShadowChance(level){
  if(level===0) return 0;
  return 0.001 + (level/20)*0.015;
}
function diffToMarkInterval(level){
  if(level===0) return Infinity;
  const base = 10000;
  const mult = 3.0 - (level-1)*(2.75/19);
  return Math.max(1500, Math.round(base*mult));
}

/* ══════════════════════════════════════════
   CAMERA-CONFIGURATIE
══════════════════════════════════════════ */
const CAMS = [
  {id:0,name:'CAM 1',room:'STOOKKAMER'},
  {id:1,name:'CAM 2',room:'OPSLAGRUIMTE'},
  {id:2,name:'CAM 3',room:'KLASLOKAAL'},
  {id:3,name:'CAM 4',room:'LINKER GANG'},
  {id:4,name:'CAM 5',room:'RECHTER GANG'},
  {id:5,name:'CAM 6',room:'MUZIEKKAMER'},
];

const POS = {C0:0,C1:1,C2:2,C3:3,C4:4,LD:5,RD:6};
const GIJS_ALLOWED_CAMS  = [POS.C0,POS.C1,POS.C2,POS.C3,POS.C4];
const HOBO_ALLOWED_CAMS  = [POS.C0,POS.C1,POS.C2,POS.C3,POS.C4];
const MADURO_ALLOWED_CAMS= [0,1,2,3,4,5];

/* ══════════════════════════════════════════
   MENU MUZIEK
══════════════════════════════════════════ */
const menuAudio = new Audio(FILES.menuMusic);
menuAudio.loop = true;
menuAudio.volume = 0.5;

function proceedToMenu(){
  document.getElementById('warnScreen').style.display='none';
  document.getElementById('startScreen').style.display='flex';
  menuAudio.play().catch(()=>{});
  animateStartBg();
}

function stopMenuMusic(){
  menuAudio.pause();
  menuAudio.currentTime=0;
}

/* ══════════════════════════════════════════
   CUSTOM NACHT — STANDAARDWAARDEN & UI
══════════════════════════════════════════ */
const CUSTOM_DEFAULTS = {
  gijs:0, hobo:0, tom:0, mark:0, maduro:0, jeffrey:0, chapo:0, diddy:0, shadow:0
};
let customLevels = {...CUSTOM_DEFAULTS};

function buildCustomNightConfig(){
  const lvls = customLevels;
  const total = Object.values(lvls).reduce((a,b)=>a+b,0);
  const maxTotal = Object.keys(lvls).length * 20;
  const pct = Math.round((total/maxTotal)*100);
  return {
    label:`Custom Nacht · ${pct}% Gevaar`,
    lore:`Je hebt de AI zelf ingesteld. Elke vijand op een eigen niveau. <strong>Veel succes.</strong>`,
    quote:`"You asked for this."`,
    warn:`⚠ Custom moeilijkheidsgraad. Niveaus: Gijs ${lvls.gijs} · Hobo ${lvls.hobo} · Tom ${lvls.tom} · Mark ${lvls.mark} · Maduro ${lvls.maduro} · Jeffrey ${lvls.jeffrey} · Chapo ${lvls.chapo} · Diddy ${lvls.diddy} · Shadow ${lvls.shadow}`,
    gijsActive:  lvls.gijs > 0,
    hoboActive:  lvls.hobo > 0,
    tomActive:   lvls.tom > 0,
    markRutteActive: lvls.mark > 0,
    jeffreyActive:   lvls.jeffrey > 0,
    chapoActive:     lvls.chapo > 0,
    diddyActive:     lvls.diddy > 0,
    maduroChance:    diffToMaduroChance(lvls.maduro),
    shadowChance:    diffToShadowChance(lvls.shadow),
    moveIval:    diffToMoveIvals(MOVE_IVAL_BASE, lvls.gijs),
    hoboMinMs:   diffToHoboMs(lvls.hobo).min,
    hoboMaxMs:   diffToHoboMs(lvls.hobo).max,
    jeffreySwitch: diffToJeffreySwitch(lvls.jeffrey),
    chapoAttack:   diffToChapoAttack(lvls.chapo),
    diddyMoveIval: diffToMoveIvals(DIDDY_MOVE_IVAL_BASE, lvls.diddy),
    markInterval:  diffToMarkInterval(lvls.mark),
    isCustom: true,
    customLevels: {...lvls},
  };
}

const NIGHT_CONFIGS = {
  1: {
    label:'Nacht 1 · De Kelder',
    lore:'Je haalde een <strong>1</strong> voor het Engels proefwerk. Meester Gijs sloot je op in zijn <strong>kelder</strong>. Overleef tot <strong>6:00 AM</strong>.',
    quote:'"You will stay here until sunrise."',
    warn:'⚠ Sluit deuren als Gijs nadert. ⚠ Zuurstof schaars bij gesloten deuren.',
    gijsActive:true, hoboActive:true, tomActive:false, markRutteActive:false,
    jeffreyActive:false, chapoActive:false, diddyActive:false,
    maduroChance:0.02, shadowChance:0.003,
    moveIval:[38000,28000,20000,14000,9000,6000],
    hoboMinMs:7000, hoboMaxMs:25000,
  },
  2: {
    label:'Nacht 2 · De Muziekkamer',
    lore:'De muziek is begonnen. Iets in de muziekkamer <strong>wacht</strong> tot het stopt. En Mark Rutte kruipt door de <strong>ventilatieschacht</strong>.',
    quote:'"Keep the music playing. No matter what."',
    warn:'⚠ Wind de muziekdoos op via CAM 6. ⚠ Sluit de ventilatieschacht voor Mark Rutte.',
    gijsActive:true, hoboActive:true, tomActive:true, markRutteActive:true,
    jeffreyActive:false, chapoActive:false, diddyActive:false,
    maduroChance:0.03, shadowChance:0.004,
    moveIval:[30000,22000,15000,10000,7000,4500],
    hoboMinMs:6000, hoboMaxMs:20000,
  },
  3: {
    label:'Nacht 3 · De Gang',
    lore:'Jeffrey slaapt niet. Hij loopt. En hij stopt nooit. Chapo wacht in de linker gang op zijn kans.',
    quote:'"The doors will not save you from everything."',
    warn:'⚠ Jeffrey negeert deuren — gebruik lure. ⚠ Chapo: sluit beide deuren bij alarm. ⚠ ALARM knop beschikbaar.',
    gijsActive:true, hoboActive:true, tomActive:true, markRutteActive:true,
    jeffreyActive:true, chapoActive:true, diddyActive:false,
    maduroChance:0.04, shadowChance:0.005,
    moveIval:[24000,17000,12000,8500,5500,3500],
    hoboMinMs:4500, hoboMaxMs:16000,
  },
  4: {
    label:'Nacht 4 · De Kelder Diept',
    lore:'Diddy is er nu ook. Hij negeert deuren volledig. Gebruik het alarm en de lure slim.',
    quote:'"There is no hiding anymore."',
    warn:'⚠ Diddy negeert deuren — ALARM of lure. ⚠ Chapo is immuun voor deuren. ⚠ Alarm CD: 20s.',
    gijsActive:true, hoboActive:true, tomActive:true, markRutteActive:true,
    jeffreyActive:true, chapoActive:true, diddyActive:true,
    maduroChance:0.05, shadowChance:0.006,
    moveIval:[20000,14000,9500,6500,4500,3000],
    hoboMinMs:3500, hoboMaxMs:13000,
  },
  5: {
    label:'Nacht 5 · Het Eindoordeel',
    lore:'Alle vijanden. Maximale AI. Er sluipt nog meer in het donker dan je denkt. <strong>Veel succes.</strong>',
    quote:'"I told you to study. You didn\'t listen."',
    warn:'⚠ ALLE vijanden actief. ⚠ MAX moeilijkheidsgraad. ⚠ Niet alles is wat het lijkt.',
    gijsActive:true, hoboActive:true, tomActive:true, markRutteActive:true,
    jeffreyActive:true, chapoActive:true, diddyActive:true,
    maduroChance:0.09, shadowChance:0.012,
    moveIval:[16000,11000,7500,5000,3200,2000],
    hoboMinMs:2500, hoboMaxMs:9000,
  },
};

/* ══════════════════════════════════════════
   NACHT SELECTIE UI
══════════════════════════════════════════ */
let selectedNight = 0;

function selectNight(n){
  selectedNight = n;
  document.getElementById('customNightPanel').style.display='none';
  const cfg = NIGHT_CONFIGS[n];
  document.getElementById('loreText').innerHTML = cfg.lore;
  document.getElementById('loreQuote').textContent = cfg.quote;
  document.getElementById('loreWarn').innerHTML = cfg.warn;
  document.getElementById('loreCard').style.borderTopColor = n===5?'#ff6600':'#550000';
  document.getElementById('loreCard').style.display='block';
  for(let i=1;i<=5;i++){
    const btn=document.getElementById('nb'+i);
    btn.className='night-btn'+(i===n?(n===5?' night5-sel':' selected'):'');
  }
  document.getElementById('nbCustom').className='night-btn';
  const sb=document.getElementById('startBtn');
  sb.disabled=false;
  sb.className='start-btn'+(n===5?' night5-btn':'');
  sb.textContent=`▶  NACHT ${n} STARTEN`;
}

function selectCustomNight(){
  selectedNight = 6;
  document.getElementById('customNightPanel').style.display='block';
  document.getElementById('loreCard').style.display='none';
  for(let i=1;i<=5;i++) document.getElementById('nb'+i).className='night-btn';
  document.getElementById('nbCustom').className='night-btn night-custom-sel';
  updateCustomStartBtn();
}

function updateCustomStartBtn(){
  const sb=document.getElementById('startBtn');
  sb.disabled=false;
  sb.className='start-btn night-custom-btn';
  sb.textContent='▶  CUSTOM NACHT STARTEN';
}

/* ── Custom niveau sliders ── */
function setCustomLevel(char, val){
  val = Math.max(0, Math.min(20, parseInt(val)||0));
  customLevels[char] = val;
  const input   = document.getElementById('ci_'+char);
  const display = document.getElementById('cv_'+char);
  const bar     = document.getElementById('cb_'+char);
  if(input)   input.value = val;
  if(display) display.textContent = val;
  if(bar){
    bar.style.width = (val/20*100)+'%';
    if(val===0)       bar.style.background='#1a1a1a';
    else if(val<=5)   bar.style.background='linear-gradient(90deg,#1a3a0a,#3a8a0a)';
    else if(val<=10)  bar.style.background='linear-gradient(90deg,#5a5a00,#aaaa00)';
    else if(val<=15)  bar.style.background='linear-gradient(90deg,#883300,#ff6600)';
    else              bar.style.background='linear-gradient(90deg,#880000,#ff0000)';
  }
  const lbl = document.getElementById('cdl_'+char);
  if(lbl){
    const labels=['INACTIEF','SLUIMERT','RUSTIG','TRAAG','LAAG','GEMIDDELD','ACTIEF','ACTIEF','HOOG','HOOG','GEVAARLIJK','GEVAARLIJK','AGRESSIEF','AGRESSIEF','ZEER AGRESSIEF','ZEER AGRESSIEF','KRITIEK','KRITIEK','LETHAL','LETHAL','MAX'];
    lbl.textContent = labels[val]||'MAX';
    lbl.style.color = val===0?'#333':val<=5?'#3a8a0a':val<=10?'#aaaa00':val<=15?'#ff6600':'#ff0000';
  }
  const row = document.getElementById('ci_'+char)?.closest('.cn-row');
  if(row){
    row.classList.remove('lvl-active','lvl-danger','lvl-max');
    if(val>=16)      row.classList.add('lvl-max');
    else if(val>=11) row.classList.add('lvl-danger');
    else if(val>=1)  row.classList.add('lvl-active');
  }
}

/* Pas alle karakters tegelijk aan met een delta of stel ze in op een vaste waarde */
function adjustAllLevels(delta, mode='add'){
  Object.keys(customLevels).forEach(char=>{
    const cur = customLevels[char];
    const next = mode==='set' ? delta : cur + delta;
    setCustomLevel(char, next);
  });
}

/* ══════════════════════════════════════════
   SPELSTATUS
══════════════════════════════════════════ */
let G={};
const SFX={};
let glitchActive=false,glitchTimer=null;
let fiveAMPlayed=false;

function mkState(){
  const n = selectedNight;
  let cfg;
  if(n===6){
    cfg = buildCustomNightConfig();
  } else {
    cfg = {...NIGHT_CONFIGS[n||1]};
  }
  if(!cfg.jeffreySwitch) cfg.jeffreySwitch = JEFFREY_SWITCH_S;
  if(!cfg.chapoAttack)   cfg.chapoAttack   = CHAPO_ATTACK_S;
  if(!cfg.diddyMoveIval) cfg.diddyMoveIval = DIDDY_MOVE_IVAL_BASE;
  if(!cfg.markInterval)  cfg.markInterval  = 10000;
  return{
    running:false,nightStart:0,hour:0,night:n,cfg:cfg,
    o2:100,o2Dead:false,
    lfClosed:false,rtClosed:false,
    ventClosed:false,
    mPos:POS.C0,mPath:null,mDoorTimer:null,mMoveTimer:null,mRetreatTimer:null,
    hoboPos:0,hoboMoveTimer:null,
    musicBox:100,isWindingUp:false,
    maduroPos:-1,maduroWatchMs:0,maduroDisabledCams:{},maduroSpawnTimer:null,maduroReconnectTimers:{},
    jeffreyStep:0,jeffreyPos:JEFFREY_START_POS,jeffreyTimer:cfg.jeffreySwitch,
    jeffreyActive:cfg.jeffreyActive,
    chapoTimer:cfg.chapoAttack,chapoSprite:0,chapoAlarm:false,
    chapoActive:cfg.chapoActive,chapoKillTimer:null,
    diddyPos:POS.C0,diddyMoveTimer:null,diddyActive:cfg.diddyActive,diddyPath:null,
    alarmReady:false,alarmCD:ALARM_CD_S,alarmCDTimer:null,
    camOpen:false,curCam:0,
    lureReady:false,lureCD:LURE_CD_S,lureCDTimer:null,
    dead:false,won:false,
    markInVent:false,markAppearTimer:null,markKillTimer:null,markLeaveTimer:null,markCheckInterval:null,
    firePtcls:[],fireOn:false,fireAnim:null,
    tickTimer:null,timeTimer:null,fireTimer:null,glitchLoopTimer:null,attackFlashTimer:null,
    shadowActive:false,shadowKillTimer:null,shadowCheckTimer:null,
    fiveAMDone:false,
  };
}

/* ══════════════════════════════════════════
   AUDIO
══════════════════════════════════════════ */
function initAudio(){
  Object.entries({
    ambience:     [FILES.ambience,     true,  .28],
    doorClose:    [FILES.doorClose,    false, .8 ],
    jumpscare:    [FILES.jumpscare,    false, 1  ],
    lure:         [FILES.lure,         false, .75],
    oxygenOut:    [FILES.oxygenOut,    false, .85],
    win:          [FILES.win,          false, .8 ],
    laugh:        [FILES.laugh,        false, .7 ],
    cameraSwitch: [FILES.cameraSwitch, false, .5 ],
    footsteps:    [FILES.footsteps,    false, .7 ],
    muziek:       [FILES.muziek,       true,  .45],
    windUp:       [FILES.windUp,       true,  .7 ],
    alarm:        [FILES.alarm,        true,  .9 ],
    jeffreyLaugh: [FILES.jeffreyLaugh, false, .8 ],
    vent:         [FILES.vent,         false, .85],
    markAudio:    [FILES.markAudio,    false, .75],
    shock:        [FILES.shock,        false, .95],
    cameraAlarm:  [FILES.cameraAlarm,  false, .9 ],
    shadowGijsAudio: [FILES.shadowGijsAudio, false, .9],
    fiveAM:       [FILES.fiveAM,       false, 1.0],
  }).forEach(([k,[src,loop,vol]])=>{
    SFX[k]=new Audio(src);SFX[k].loop=loop;SFX[k].volume=vol;
  });
}
function play(k){ try{SFX[k]&&(SFX[k].currentTime=0,SFX[k].play().catch(()=>{}))}catch(e){} }
function stop(k){ try{SFX[k]&&(SFX[k].pause(),SFX[k].currentTime=0)}catch(e){} }
function stopAll(){ Object.keys(SFX).forEach(stop); }

/* ══════════════════════════════════════════
   AANVAL-FLASH OVERLAY
══════════════════════════════════════════ */
function showAttackFlash(imgSrc, onDone){
  const overlay = document.getElementById('attackFlashOverlay');
  const img     = document.getElementById('attackFlashImg');
  img.src = imgSrc;
  overlay.classList.add('active');
  play('shock');
  if(G.attackFlashTimer) clearTimeout(G.attackFlashTimer);
  G.attackFlashTimer = setTimeout(()=>{
    overlay.classList.remove('active');
    img.src = '';
    onDone();
  }, 2000);
}
function hideAttackFlash(){
  const overlay = document.getElementById('attackFlashOverlay');
  overlay.classList.remove('active');
  document.getElementById('attackFlashImg').src = '';
  if(G.attackFlashTimer){ clearTimeout(G.attackFlashTimer); G.attackFlashTimer=null; }
}

/* ══════════════════════════════════════════
   KANTOOR TEKENEN
══════════════════════════════════════════ */
function drawOffice(){
  const cv=document.getElementById('officeCanvas');
  const W=cv.width=window.innerWidth;
  const H=cv.height=window.innerHeight;
  const ctx=cv.getContext('2d');
  ctx.clearRect(0,0,W,H);

  // Plafond
  const ceilH=H*.065;
  const ceilGrad=ctx.createLinearGradient(0,0,0,ceilH*2);
  ceilGrad.addColorStop(0,'#0a0a0d');ceilGrad.addColorStop(1,'#141418');
  ctx.fillStyle=ceilGrad;ctx.fillRect(0,0,W,ceilH);

  // Muur
  const wallTop=ceilH,wallBot=H*.62;
  const wallGrad=ctx.createLinearGradient(0,wallTop,0,wallBot);
  wallGrad.addColorStop(0,'#12121a');wallGrad.addColorStop(1,'#0d0d15');
  ctx.fillStyle=wallGrad;ctx.fillRect(0,wallTop,W,wallBot-wallTop);
  ctx.strokeStyle='rgba(255,255,255,0.012)';ctx.lineWidth=.8;
  for(let x=0;x<W;x+=Math.floor(W/18)){ctx.beginPath();ctx.moveTo(x,wallTop);ctx.lineTo(x,wallBot);ctx.stroke();}
  for(let y=wallTop;y<wallBot;y+=Math.floor((wallBot-wallTop)/10)){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // Scheuren
  function crack(x1,y1,segs,len,spread){
    ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y1);
    let cx=x1,cy=y1;
    for(let i=0;i<segs;i++){cx+=(-spread+Math.random()*spread*2);cy+=len/segs;ctx.lineTo(cx,cy);}
    ctx.stroke();
  }
  crack(W*.18,wallTop+20,8,90,12);crack(W*.22,wallTop+55,5,50,8);
  crack(W*.7,wallTop+15,7,80,14);crack(W*.74,wallTop+40,4,45,9);

  // Leidingen
  function drawPipe(x,w){
    const pg=ctx.createLinearGradient(0,0,0,ceilH);
    pg.addColorStop(0,'#252530');pg.addColorStop(.5,'#1c1c26');pg.addColorStop(1,'#111118');
    ctx.fillStyle=pg;ctx.fillRect(x,0,w,ceilH);
    for(let bx=x+10;bx<x+w-5;bx+=30){ctx.fillStyle='#1e1e28';ctx.beginPath();ctx.arc(bx,ceilH,4,0,Math.PI*2);ctx.fill();}
    const sh=ctx.createLinearGradient(0,ceilH,0,ceilH+20);
    sh.addColorStop(0,'rgba(0,0,0,.45)');sh.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=sh;ctx.fillRect(x,ceilH,w,20);
  }
  drawPipe(W*.04,W*.28);drawPipe(W*.6,W*.18);drawPipe(W*.84,W*.12);

  // Lamp
  const lx=W/2,wireTop=ceilH,wireH=H*.1;
  ctx.strokeStyle='#1e1e1e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(lx,wireTop);ctx.lineTo(lx,wireTop+wireH);ctx.stroke();
  ctx.save();
  const shadeGrad=ctx.createLinearGradient(0,wireTop+wireH,0,wireTop+wireH+H*.07);
  shadeGrad.addColorStop(0,'#1a1a20');shadeGrad.addColorStop(1,'#111116');
  ctx.fillStyle=shadeGrad;
  ctx.beginPath();ctx.moveTo(lx-H*.04,wireTop+wireH);ctx.lineTo(lx+H*.04,wireTop+wireH);
  ctx.lineTo(lx+H*.065,wireTop+wireH+H*.07);ctx.lineTo(lx-H*.065,wireTop+wireH+H*.07);
  ctx.closePath();ctx.fill();ctx.strokeStyle='#252528';ctx.lineWidth=1;ctx.stroke();ctx.restore();

  // Schoolbord
  const wbW=W*.18,wbH=H*.14,wbX=W*.15,wbY=wallTop+H*.04;
  ctx.fillStyle='#5c4a30';ctx.fillRect(wbX-5,wbY-5,wbW+10,wbH+10);
  ctx.fillStyle='#ece8e0';ctx.fillRect(wbX,wbY,wbW,wbH);
  ctx.fillStyle='#8b0000';ctx.font=`bold ${Math.floor(wbH*.13)}px 'Share Tech Mono',monospace`;
  ctx.textAlign='center';ctx.fillText('ENGLISH GRAMMAR',wbX+wbW/2,wbY+wbH*.22);
  ctx.fillStyle='#444';ctx.font=`${Math.floor(wbH*.09)}px 'Share Tech Mono',monospace`;
  ctx.fillText('Past Simple · Conditional',wbX+wbW/2,wbY+wbH*.42);
  ctx.fillText('Irregular Verbs',wbX+wbW/2,wbY+wbH*.57);
  ctx.strokeStyle='#cc0000';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(wbX+10,wbY+wbH*.67);ctx.lineTo(wbX+wbW-10,wbY+wbH*.67);ctx.stroke();
  ctx.fillStyle='#cc0000';ctx.font=`bold ${Math.floor(wbH*.12)}px 'Share Tech Mono',monospace`;
  ctx.fillText('★ 1/10 ★',wbX+wbW/2,wbY+wbH*.84);
  ctx.fillStyle='#cc2222';ctx.beginPath();ctx.arc(wbX+wbW/2,wbY-2,5,0,Math.PI*2);ctx.fill();
  ctx.textAlign='left';

  // Posters
  const posters=[
    {x:W*.04,y:wallTop+H*.05,w:W*.09,h:H*.13,rot:-.02,title:'Irregular Verbs',lines:['go → went','see → saw','eat → ate']},
    {x:W*.72,y:wallTop+H*.04,w:W*.1,h:H*.14,rot:.02,title:'Rules',lines:['1. English only','2. No Dutch','3. No failing']},
    {x:W*.86,y:wallTop+H*.05,w:W*.09,h:H*.13,rot:-.015,title:'Word of Day',lines:['SURVIVE','(verb)','stay alive']},
  ];
  posters.forEach(p=>{
    ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);ctx.rotate(p.rot);
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(-p.w/2+4,-p.h/2+4,p.w,p.h);
    ctx.fillStyle='#7a6040';ctx.fillRect(-p.w/2-3,-p.h/2-3,p.w+6,p.h+6);
    ctx.fillStyle='#ede8dc';ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
    ctx.fillStyle='#8b0000';ctx.font=`bold ${Math.max(7,Math.floor(p.h*.11))}px 'Share Tech Mono',monospace`;
    ctx.textAlign='center';ctx.fillText(p.title,0,-p.h/2+p.h*.16);
    ctx.strokeStyle='#cc4444';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-p.w/2+5,-p.h/2+p.h*.23);ctx.lineTo(p.w/2-5,-p.h/2+p.h*.23);ctx.stroke();
    ctx.fillStyle='#333';ctx.font=`${Math.max(6,Math.floor(p.h*.08))}px 'Share Tech Mono',monospace`;
    p.lines.forEach((l,i)=>ctx.fillText(l,0,-p.h/2+p.h*(.32+i*.18)));
    ctx.fillStyle='#cc1111';ctx.beginPath();ctx.arc(0,-p.h/2+4,4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });

  // Ventilatie schaduw
  const ventW=Math.min(180,window.innerWidth*.18)+20;
  const ventH=Math.min(130,window.innerWidth*.13)+20;
  const ventX=W/2-ventW/2;
  const ventY=H*.07-5;
  ctx.fillStyle='#0a0806';ctx.fillRect(ventX-8,ventY-8,ventW+16,ventH+16);
  ctx.strokeStyle='#3a2a10';ctx.lineWidth=2;ctx.strokeRect(ventX-8,ventY-8,ventW+16,ventH+16);

  // Vloer
  const floorY=H*.62;
  const floorGrad=ctx.createLinearGradient(0,floorY,0,H);
  floorGrad.addColorStop(0,'#101018');floorGrad.addColorStop(1,'#0c0c14');
  ctx.fillStyle=floorGrad;ctx.fillRect(0,floorY,W,H-floorY);
  ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=1;
  const tileW=Math.floor(W/14);
  for(let x=0;x<W;x+=tileW){ctx.beginPath();ctx.moveTo(x,floorY);ctx.lineTo(x,H);ctx.stroke();}
  const tileH=Math.floor((H-floorY)/5);
  for(let y=floorY;y<H;y+=tileH){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // Bureau
  const deskW=W*.32,deskH=H*.08,deskX=W/2-W*.32/2,deskY=H-H*.08;
  const dGrad=ctx.createLinearGradient(deskX,deskY,deskX,H);
  dGrad.addColorStop(0,'#2a1a08');dGrad.addColorStop(1,'#1a0f05');
  ctx.fillStyle=dGrad;ctx.fillRect(deskX,deskY,deskW,deskH);
  ctx.strokeStyle='#3e2810';ctx.lineWidth=2;ctx.strokeRect(deskX,deskY,deskW,deskH);

  // Monitor
  const mW=W*.1,mH=H*.09,mX=W/2-W*.1/2,mY=deskY-H*.09;
  ctx.fillStyle='#0c0c14';ctx.strokeStyle='#2a2a38';ctx.lineWidth=2;
  ctx.fillRect(mX,mY,mW,mH);ctx.strokeRect(mX,mY,mW,mH);
  ctx.fillStyle='#00ff66';ctx.font=`${Math.floor(mH*.16)}px 'Share Tech Mono',monospace`;
  ctx.textAlign='center';
  ctx.fillText('SECURITY',W/2,mY+mH*.35);ctx.fillText('SYS ONLINE',W/2,mY+mH*.55);
  ctx.fillStyle='rgba(0,255,100,.4)';ctx.fillText('>>> ACTIVE',W/2,mY+mH*.78);
  ctx.textAlign='left';
}

/* ══════════════════════════════════════════
   CAMERA KAMER TEKENEN
══════════════════════════════════════════ */
const CAM_BG_IMGS={};
const CAM_BG_KEYS=['camBg0','camBg1','camBg2','camBg3','camBg4','camBg5'];

function getCamBgImg(roomId,cb){
  const key=CAM_BG_KEYS[roomId];
  if(!key) return cb(null);
  if(CAM_BG_IMGS[roomId]) return cb(CAM_BG_IMGS[roomId]);
  const img=new Image();
  img.onload=()=>{CAM_BG_IMGS[roomId]=img;cb(img);};
  img.onerror=()=>cb(null);
  img.src=FILES[key];
}

function drawCamRoom(canvas,roomId,small=false){
  const W=canvas.width=canvas.offsetWidth||(small?120:800);
  const H=canvas.height=canvas.offsetHeight||(small?80:500);
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,W,H);

  function nvTint(){
    ctx.fillStyle='rgba(0,18,4,0.35)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(0,0,0,0.08)';
    for(let y=0;y<H;y+=3) ctx.fillRect(0,y,W,1);
  }
  function finishDraw(img){
    if(img){
      const iR=img.naturalWidth/img.naturalHeight,cR=W/H;
      let sw,sh,sx=0,sy=0;
      if(iR>cR){sh=img.naturalHeight;sw=sh*cR;sx=(img.naturalWidth-sw)/2;}
      else{sw=img.naturalWidth;sh=sw/cR;sy=(img.naturalHeight-sh)/2;}
      ctx.drawImage(img,sx,sy,sw,sh,0,0,W,H);
    } else {
      ctx.fillStyle='#080a06';ctx.fillRect(0,0,W,H);
    }
    nvTint();
    if(!small){
      const id=ctx.createImageData(W,H);
      for(let i=0;i<id.data.length;i+=4){
        const v=(Math.random()>0.97)?Math.random()*60:0;
        id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255*0.04;
      }
      ctx.putImageData(id,0,0);
    }
  }
  const cached=CAM_BG_IMGS[roomId];
  if(cached){finishDraw(cached);}
  else{ctx.fillStyle='#060806';ctx.fillRect(0,0,W,H);nvTint();getCamBgImg(roomId,(img)=>finishDraw(img||null));}
}

/* ══════════════════════════════════════════
   CAMERA UI
══════════════════════════════════════════ */
function buildCamStrip(){
  const strip=document.getElementById('camStrip');
  strip.innerHTML='';
  CAMS.forEach(c=>{
    const el=document.createElement('div');
    el.className='cam-thumb'+(c.id===0?' ct-on':'');
    el.id='ct'+c.id;
    el.innerHTML=`<canvas class="ct-canvas" id="ctc${c.id}"></canvas>
      <div class="ct-label">${c.name} · ${c.room}</div>
      <div class="ct-mdot" id="md${c.id}"></div>
      <div class="ct-hobodot" id="hd${c.id}"></div>
      <div class="ct-jeffreydot" id="jd${c.id}"></div>
      <div class="ct-chapodot" id="cpd${c.id}"></div>
      <div class="ct-tomdot${c.id===MUSIC_CAM_ID?' on':''}" id="td${c.id}"></div>
      <div class="ct-madurodot" id="cpmd${c.id}"></div>
      <div class="ct-diddydot" id="dd${c.id}"></div>
      <div class="ct-disabled-overlay" id="ctdis${c.id}"><span>OFFLINE</span><span style="font-size:.5em;color:#330000;letter-spacing:2px">MADURO</span></div>`;
    el.onclick=()=>switchCam(c.id);
    strip.appendChild(el);
    const cv=document.getElementById('ctc'+c.id);
    cv.width=120;cv.height=80;
    drawCamRoom(cv,c.id,true);
  });
}

function isCamDisabled(camId){return !!(G.maduroDisabledCams&&G.maduroDisabledCams[camId]>0);}

function switchCam(id){
  if(isCamDisabled(id)){
    const el=document.getElementById('ct'+id);
    if(el){el.style.animation='none';setTimeout(()=>el.style.animation='',50);}
    return;
  }
  if(id!==G.curCam) play('cameraSwitch');
  if(G.maduroPos===G.curCam && id!==G.curCam) maduroDespawn();
  if(G.curCam===MUSIC_CAM_ID&&id!==MUSIC_CAM_ID){if(SFX.muziek) SFX.muziek.volume=0.15;}
  G.curCam=id;
  G.maduroWatchMs=0;
  document.querySelectorAll('.cam-thumb').forEach(t=>t.classList.remove('ct-on'));
  document.getElementById('ct'+id)?.classList.add('ct-on');
  document.getElementById('camNameLbl').textContent=CAMS[id].name;
  document.getElementById('camRoomLbl').textContent=CAMS[id].room;
  const mbp=document.getElementById('musicBoxPanel');
  mbp.style.display=(id===MUSIC_CAM_ID&&G.cfg.tomActive)?'flex':'none';
  if(SFX.muziek) SFX.muziek.volume=id===MUSIC_CAM_ID?0.55:0.15;
  renderCamFeed();
  updateLureUI();
  updateAlarmUI();
}

function renderCamFeed(){
  const id=G.curCam;
  const disabled=isCamDisabled(id);
  const disOv=document.getElementById('maduroDisabledOverlay');
  disOv.classList.toggle('active',disabled);
  if(disabled){
    ['monsterCamImg','hoboCamImg','jeffreyCamImg','chapoCamImg','tomCamImg','maduroCamImg','diddyCamImg'].forEach(i=>
      document.getElementById(i).style.display='none');
    return;
  }
  const gijsHere   = G.mPos===id&&id!==MUSIC_CAM_ID;
  const hoboHere   = G.hoboPos===id&&id!==MUSIC_CAM_ID;
  const jeffreyHere= G.jeffreyActive&&G.jeffreyPos===id&&id!==MUSIC_CAM_ID;
  const chapoHere  = G.chapoActive&&id===CHAPO_CAM_ID&&!G.chapoAlarm;
  const tomHere    = G.cfg.tomActive&&id===MUSIC_CAM_ID;
  const maduroHere = G.maduroPos===id;
  const diddyHere  = G.diddyActive&&G.diddyPos===id&&id!==MUSIC_CAM_ID;
  const cv=document.getElementById('camCanvas');
  cv.width=cv.offsetWidth||800;cv.height=cv.offsetHeight||400;
  drawCamRoom(cv,id,false);
  document.getElementById('monsterCamImg').style.display=gijsHere?'block':'none';
  if(gijsHere) document.getElementById('monsterCamImg').src=FILES.gijsCam;
  document.getElementById('hoboCamImg').style.display=hoboHere?'block':'none';
  if(hoboHere) document.getElementById('hoboCamImg').src=FILES.hoboGijsCam;
  document.getElementById('jeffreyCamImg').style.display=jeffreyHere?'block':'none';
  if(jeffreyHere) document.getElementById('jeffreyCamImg').src=FILES.jeffreyCam;
  const chapoImg=document.getElementById('chapoCamImg');
  chapoImg.style.display=chapoHere?'block':'none';
  if(chapoHere){chapoImg.src=FILES.chapoCam;applyChapoStyle(chapoImg,G.chapoSprite,G.chapoTimer);}
  const tomImg=document.getElementById('tomCamImg');
  tomImg.style.display=tomHere?'block':'none';
  if(tomHere){tomImg.src=FILES.tomCam;applyTomStyle(tomImg,G.musicBox);}
  const diddyImg=document.getElementById('diddyCamImg');
  diddyImg.style.display=diddyHere?'block':'none';
  if(diddyHere) diddyImg.src=FILES.diddyCam;
  const maduroImg=document.getElementById('maduroCamImg');
  maduroImg.style.display=maduroHere?'block':'none';
  const overlay=document.getElementById('tomDangerOverlay');
  if(tomHere){const danger=Math.max(0,(100-G.musicBox)/100);overlay.style.opacity=String(Math.pow(danger,1.4)*0.9);}
  else overlay.style.opacity='0';
  document.getElementById('camMain').classList.toggle('cam-active-static',gijsHere||hoboHere||jeffreyHere||diddyHere);
  document.getElementById('camTs').textContent=new Date().toLocaleTimeString('nl-NL');
}

function applyChapoStyle(img,sprite,timer){
  let brightness,scale,hue;
  if(sprite===0){brightness=0.25;scale=0.7;hue=0;}
  else if(sprite===1){brightness=0.55;scale=0.88;hue=10;}
  else{brightness=0.85;scale=1.05;hue=20;}
  img.style.filter=`brightness(${brightness}) contrast(1.6) saturate(1.8) hue-rotate(${hue}deg)`;
  img.style.transform=`scale(${scale})`;
  img.style.transformOrigin='bottom left';
  img.style.transition='filter 1s, transform 1.5s';
  img.style.opacity='1';
}

function applyTomStyle(img,level){
  let filter,transform,opacity;
  if(level>75){filter='brightness(0.04) contrast(4) saturate(0)';transform='translateX(-50%) scale(0.65) translateY(8%)';opacity='0.5';img.style.animation='none';}
  else if(level>55){filter='brightness(0.15) contrast(2.5) saturate(0.2)';transform='translateX(-50%) scale(0.75) translateY(4%)';opacity='0.65';img.style.animation='none';}
  else if(level>35){filter='brightness(0.35) contrast(1.8) saturate(0.6)';transform='translateX(-50%) scale(0.88)';opacity='0.8';img.style.animation='mBreath 3s ease-in-out infinite';}
  else if(level>15){filter='brightness(0.65) contrast(1.4) saturate(1.2) hue-rotate(330deg)';transform='translateX(-50%) scale(0.97)';opacity='0.92';img.style.animation='mBreath 2s ease-in-out infinite';}
  else if(level>5){filter='brightness(0.9) contrast(1.2) saturate(2.5) hue-rotate(330deg)';transform='translateX(-50%) scale(1.05)';opacity='1';img.style.animation='tomCrit 0.5s infinite';}
  else{filter='brightness(1.1) contrast(1.1) saturate(4) hue-rotate(340deg)';transform='translateX(-50%) scale(1.12)';opacity='1';img.style.animation='tomCrit 0.25s infinite';}
  img.style.filter=filter;img.style.transform=transform;img.style.opacity=opacity;
  img.style.transition='filter 1s, transform 1s, opacity 1s';
}

function refreshMonsterDots(){
  CAMS.forEach(c=>{
    document.getElementById('md'+c.id)?.classList.toggle('on',G.mPos===c.id&&c.id!==MUSIC_CAM_ID);
    document.getElementById('hd'+c.id)?.classList.toggle('on',G.hoboPos===c.id&&c.id!==MUSIC_CAM_ID);
    const jd=document.getElementById('jd'+c.id);
    if(jd) jd.classList.toggle('on',G.jeffreyActive&&G.jeffreyPos===c.id&&c.id!==MUSIC_CAM_ID);
    const cpd=document.getElementById('cpd'+c.id);
    if(cpd) cpd.classList.toggle('on',G.chapoActive&&c.id===CHAPO_CAM_ID&&!G.chapoAlarm);
    const td=document.getElementById('td'+c.id);
    if(td&&c.id===MUSIC_CAM_ID){
      td.className='ct-tomdot on';
      if(G.musicBox<25) td.style.animationDuration='0.3s';
      else if(G.musicBox<50) td.style.animationDuration='0.6s';
      else td.style.animationDuration='1s';
    }
    const cpmd=document.getElementById('cpmd'+c.id);
    if(cpmd) cpmd.classList.toggle('on',G.maduroPos===c.id);
    const dd=document.getElementById('dd'+c.id);
    if(dd) dd.classList.toggle('on',G.diddyActive&&G.diddyPos===c.id&&c.id!==MUSIC_CAM_ID);
    const ctdis=document.getElementById('ctdis'+c.id);
    if(ctdis) ctdis.classList.toggle('active',isCamDisabled(c.id));
    const thumb=document.getElementById('ct'+c.id);
    if(thumb){
      if(isCamDisabled(c.id)) thumb.classList.add('cam-maduro-warn');
      else thumb.classList.remove('cam-maduro-warn');
    }
  });
  document.getElementById('dotMon').classList.toggle('on',G.mPos>=POS.LD);
  document.getElementById('dotHobo').classList.toggle('on',true);
  const dotTom=document.getElementById('dotTom');
  if(dotTom){
    dotTom.className='hud-status-dot';
    if(G.musicBox>50)      dotTom.classList.add('on');
    else if(G.musicBox>20) dotTom.classList.add('warn');
    else                   dotTom.classList.add('crit');
  }
  const dotM=document.getElementById('dotMaduro');
  if(dotM){
    dotM.className='hud-status-dot';
    const hasDis=Object.values(G.maduroDisabledCams||{}).some(v=>v>0);
    if(hasDis)          dotM.classList.add('crit');
    else if(G.maduroPos>=0) dotM.classList.add('warn');
    else                dotM.classList.add('on');
  }
  const dotJ=document.getElementById('dotJeffrey');
  if(dotJ&&G.jeffreyActive) dotJ.className='hud-status-dot warn';
  const dotC=document.getElementById('dotChapo');
  if(dotC&&G.chapoActive) dotC.className='hud-status-dot'+(G.chapoAlarm?' crit':G.chapoTimer<30?' warn':' on');
  const dotD=document.getElementById('dotDiddy');
  if(dotD&&G.diddyActive){
    dotD.className='hud-status-dot';
    if(G.diddyPos>=POS.LD) dotD.classList.add('crit');
    else                   dotD.classList.add('warn');
  }
}

/* ══════════════════════════════════════════
   CAMERA ALARM
══════════════════════════════════════════ */
function alarmTargetOnCam(){
  if(!G.camOpen||G.dead||G.won) return false;
  const id=G.curCam;
  if(G.chapoActive&&id===CHAPO_CAM_ID) return true;
  if(G.diddyActive&&G.diddyPos===id&&id!==MUSIC_CAM_ID) return true;
  return false;
}

function updateAlarmUI(){
  if(!G.camOpen) return;
  const btn=document.getElementById('alarmCamBtn');
  const lbl=document.getElementById('alarmCdLbl');
  if(!btn||!lbl) return;
  const hasTarget=alarmTargetOnCam();
  if(G.alarmReady){
    btn.disabled=false;
    btn.className='alarm-cam-btn'+(hasTarget?' target':' ready');
    btn.textContent=hasTarget?'🚨 ALARM — VUUR!':'🚨 ALARM';
    lbl.textContent='KLAAR';
    lbl.className='alarm-cd-lbl hot';
  } else {
    btn.disabled=true;
    btn.className='alarm-cam-btn';
    const s=Math.ceil(G.alarmCD);
    lbl.textContent=s>0?`CD: ${s}s`:'--';
    lbl.className='alarm-cd-lbl';
  }
}

function useCameraAlarm(){
  if(!G.alarmReady||G.dead||G.won) return;
  play('cameraAlarm');
  if(G.chapoActive&&G.curCam===CHAPO_CAM_ID&&!G.chapoAlarm) resetChapo();
  if(G.chapoActive&&G.chapoAlarm) resetChapo();
  if(G.diddyActive&&G.diddyPos===G.curCam&&G.curCam!==MUSIC_CAM_ID) resetDiddy();
  G.alarmReady=false;G.alarmCD=ALARM_CD_S;
  clearInterval(G.alarmCDTimer);
  G.alarmCDTimer=setInterval(()=>{
    G.alarmCD--;
    if(G.alarmCD<=0){G.alarmReady=true;G.alarmCD=0;clearInterval(G.alarmCDTimer);}
    updateAlarmUI();
  },1000);
  updateAlarmUI();refreshMonsterDots();
}

function resetChapo(){
  if(G.chapoKillTimer){clearTimeout(G.chapoKillTimer);G.chapoKillTimer=null;}
  hideAttackFlash();
  if(G.chapoAlarm){stop('alarm');document.getElementById('alarmOverlay').style.display='none';G.chapoAlarm=false;}
  G.chapoTimer=G.cfg.chapoAttack||CHAPO_ATTACK_S;G.chapoSprite=0;
  refreshMonsterDots();if(G.camOpen) renderCamFeed();
}

function resetDiddy(){
  if(G.diddyMoveTimer){clearTimeout(G.diddyMoveTimer);}
  G.diddyPos=POS.C0;G.diddyPath=null;
  refreshMonsterDots();if(G.camOpen) renderCamFeed();
  scheduleDiddyMove();
}

/* ══════════════════════════════════════════
   MADURO AI
══════════════════════════════════════════ */
function scheduleMaduroSpawn(){
  if(G.maduroSpawnTimer) clearInterval(G.maduroSpawnTimer);
  G.maduroSpawnTimer=setInterval(()=>{
    if(G.dead||G.won) return;
    if(G.maduroPos>=0) return;
    if(Math.random()<G.cfg.maduroChance){
      const available=MADURO_ALLOWED_CAMS.filter(id=>!isCamDisabled(id));
      if(available.length===0) return;
      const camId=available[Math.floor(Math.random()*available.length)];
      maduroSpawn(camId);
    }
  },MADURO_APPEAR_INTERVAL);
}

function maduroSpawn(camId){
  G.maduroPos=camId;G.maduroWatchMs=0;
  refreshMonsterDots();
  if(G.camOpen&&G.curCam===camId) renderCamFeed();
}

function maduroDespawn(){
  if(G.maduroPos<0) return;
  G.maduroPos=-1;G.maduroWatchMs=0;
  refreshMonsterDots();if(G.camOpen) renderCamFeed();
}

function tickMaduro(){
  if(G.dead||G.won) return;
  let anyChange=false;
  Object.keys(G.maduroDisabledCams).forEach(camId=>{
    if(G.maduroDisabledCams[camId]>0){
      G.maduroDisabledCams[camId]-=TICK_MS;
      if(G.maduroDisabledCams[camId]<=0){
        G.maduroDisabledCams[camId]=0;anyChange=true;
        updateMaduroReconnectDisplay(parseInt(camId),0);
      } else {
        updateMaduroReconnectDisplay(parseInt(camId), Math.ceil(G.maduroDisabledCams[camId]/1000));
      }
    }
  });
  if(anyChange) refreshMonsterDots();
  if(G.maduroPos>=0&&G.camOpen&&G.curCam===G.maduroPos&&!isCamDisabled(G.curCam)){
    G.maduroWatchMs+=TICK_MS;
    if(G.maduroWatchMs>=MADURO_WATCH_LIMIT_MS) triggerMaduroCamDisable(G.maduroPos);
  } else if(G.maduroPos>=0&&(!G.camOpen||G.curCam!==G.maduroPos)){
    G.maduroWatchMs=0;
  }
}

function triggerMaduroCamDisable(camId){
  play('shock');
  G.maduroPos=-1;G.maduroWatchMs=0;
  G.maduroDisabledCams[camId]=MADURO_DISABLE_MS;
  refreshMonsterDots();
  if(G.camOpen&&G.curCam===camId){
    renderCamFeed();startMaduroReconnectBar();
    setTimeout(()=>{
      if(!G.dead&&!G.won&&G.camOpen&&G.curCam===camId){
        const other=CAMS.find(c=>c.id!==camId&&!isCamDisabled(c.id));
        if(other) switchCam(other.id);
      }
    },2200);
  }
}

function startMaduroReconnectBar(){
  const fill=document.getElementById('maduroErrFill');
  if(fill){fill.style.transition='none';fill.style.width='0%';
    setTimeout(()=>{fill.style.transition=`width ${MADURO_DISABLE_MS/1000}s linear`;fill.style.width='100%';},50);}
}

function updateMaduroReconnectDisplay(camId,secsLeft){
  if(G.camOpen&&G.curCam===camId){const el=document.getElementById('maduroReconnectSec');if(el) el.textContent=secsLeft;}
}

/* ══════════════════════════════════════════
   MUZIEKDOOS
══════════════════════════════════════════ */
function updateMusicBoxUI(){
  const p=Math.max(0,Math.round(G.musicBox));
  document.getElementById('mbPct').textContent=p+'%';
  const fill=document.getElementById('mbFill');
  fill.style.width=p+'%';fill.className='mb-fill';
  let status='SPEELT AF — TUMOR TOM SLUIMERT';
  if(p<=10){fill.classList.add('crit');status='⚠ KRITIEK — TOM ONTWAAKT';}
  else if(p<=30){fill.classList.add('warn');status='LAAG — WIND OP!';}
  else if(p<=55){status='MATIG — IN DE GATEN HOUDEN';}
  document.getElementById('mbStatus').textContent=status;
  const ct=document.getElementById('ct'+MUSIC_CAM_ID);
  if(ct){if(p<=25) ct.classList.add('ct-music-warn');else ct.classList.remove('ct-music-warn');}
  if(SFX.muziek){
    if(p>50)       SFX.muziek.playbackRate=1;
    else if(p>25)  SFX.muziek.playbackRate=0.82;
    else if(p>10)  SFX.muziek.playbackRate=0.62;
    else           SFX.muziek.playbackRate=0.4;
  }
  if(G.curCam===MUSIC_CAM_ID){
    const overlay=document.getElementById('tomDangerOverlay');
    const danger=Math.max(0,(100-p)/100);
    overlay.style.opacity=String(Math.pow(danger,1.4)*0.9);
    if(G.camOpen) applyTomStyle(document.getElementById('tomCamImg'),p);
  }
  refreshMonsterDots();
}

function startWindUp(e){
  if(e) e.preventDefault();
  if(G.dead||G.won) return;
  if(G.curCam!==MUSIC_CAM_ID) return;
  G.isWindingUp=true;
  document.getElementById('windupBtn').classList.add('winding');
  if(SFX.windUp){SFX.windUp.currentTime=0;SFX.windUp.play().catch(()=>{});}
}
function stopWindUp(){
  G.isWindingUp=false;
  document.getElementById('windupBtn')?.classList.remove('winding');
  if(SFX.windUp){SFX.windUp.pause();SFX.windUp.currentTime=0;}
}

/* ══════════════════════════════════════════
   JEFFREY AI
══════════════════════════════════════════ */
function tickJeffrey(){
  if(!G.jeffreyActive||G.dead||G.won) return;
  const tickSec=TICK_MS/1000;
  const watchingJeffrey=G.camOpen&&G.curCam===G.jeffreyPos&&!isCamDisabled(G.curCam);
  if(watchingJeffrey) return;
  G.jeffreyTimer-=tickSec;
  if(G.jeffreyTimer<=0){
    G.jeffreyStep++;
    if(G.jeffreyStep>=JEFFREY_PATH.length){triggerJeffreyJS();return;}
    G.jeffreyPos=JEFFREY_PATH[G.jeffreyStep];
    G.jeffreyTimer=G.cfg.jeffreySwitch||JEFFREY_SWITCH_S;
    play('jeffreyLaugh');
    refreshMonsterDots();if(G.camOpen) renderCamFeed();
  }
}

/* ══════════════════════════════════════════
   CHAPO AI
══════════════════════════════════════════ */
function tickChapo(){
  if(!G.chapoActive||G.dead||G.won) return;
  if(G.chapoAlarm) return;
  const tickSec=TICK_MS/1000;
  const watching=G.camOpen&&G.curCam===CHAPO_CAM_ID&&!isCamDisabled(CHAPO_CAM_ID);
  if(!watching) G.chapoTimer-=tickSec;
  const chapoMax = G.cfg.chapoAttack||CHAPO_ATTACK_S;
  const ratio=G.chapoTimer/chapoMax;
  let newSprite=ratio>0.6?0:ratio>0.25?1:2;
  if(newSprite!==G.chapoSprite){G.chapoSprite=newSprite;if(G.camOpen&&G.curCam===CHAPO_CAM_ID) renderCamFeed();}
  if(G.chapoTimer<=0&&!G.chapoAlarm) triggerChapoAlarm();
}

function triggerChapoAlarm(){
  G.chapoAlarm=true;play('alarm');
  document.getElementById('alarmOverlay').style.display='block';
  refreshMonsterDots();if(G.camOpen) renderCamFeed();
  G.chapoKillTimer=setTimeout(()=>{
    if(!G.dead&&!G.won&&G.chapoAlarm) triggerChapoJS();
  }, CHAPO_KILL_DELAY_MS);
}

/* ══════════════════════════════════════════
   DIDDY AI
══════════════════════════════════════════ */
function scheduleDiddyMove(){
  if(G.diddyMoveTimer) clearTimeout(G.diddyMoveTimer);
  if(G.dead||G.won||!G.diddyActive) return;
  const intervals = G.cfg.diddyMoveIval || DIDDY_MOVE_IVAL_BASE;
  const base=intervals[Math.min(G.hour,5)];
  if(base===Infinity) return;
  const delay=base+Math.random()*3000-1000;
  G.diddyMoveTimer=setTimeout(()=>{advanceDiddy();scheduleDiddyMove();},delay);
}

function advanceDiddy(){
  if(G.dead||G.won||!G.diddyActive) return;
  if(G.diddyPos===POS.LD||G.diddyPos===POS.RD){triggerDiddyJS();return;}
  let np=G.diddyPos;
  if(G.diddyPos===POS.C0) np=POS.C1;
  else if(G.diddyPos===POS.C1) np=POS.C2;
  else if(G.diddyPos===POS.C2){
    if(!G.diddyPath) G.diddyPath=Math.random()<.5?'left':'right';
    np=G.diddyPath==='left'?POS.C3:POS.C4;G.diddyPath=null;
  }
  else if(G.diddyPos===POS.C3) np=POS.LD;
  else if(G.diddyPos===POS.C4) np=POS.RD;
  G.diddyPos=np;
  refreshMonsterDots();if(G.camOpen) renderCamFeed();
  updateAlarmUI();
  if(np===POS.LD||np===POS.RD){
    G.diddyMoveTimer=setTimeout(()=>{if(!G.dead&&!G.won) triggerDiddyJS();}, 2500);
  }
}

/* ══════════════════════════════════════════
   MARK VENT AI
══════════════════════════════════════════ */
function scheduleMarkCheck(){
  if(G.markCheckInterval) clearInterval(G.markCheckInterval);
  const interval = G.cfg.markInterval || 10000;
  if(interval===Infinity) return;
  G.markCheckInterval=setInterval(()=>{
    if(G.dead||G.won||G.markInVent) return;
    if(Math.random()<0.10) markAppear();
  }, interval);
}

function markAppear(){
  if(G.dead||G.won||G.markInVent) return;
  G.markInVent=true;play('vent');
  if(Math.random()<0.20) setTimeout(()=>play('markAudio'),400);
  updateVentUI();
  if(G.ventClosed){markLeaveAfterDelay(1000+Math.random()*2000);return;}
  const img=document.getElementById('markVentImg');
  img.classList.add('mark-visible');
  G.markAppearTimer=setTimeout(()=>{if(!G.dead&&!G.won&&G.markInVent&&!G.ventClosed) img.classList.add('mark-urgent');},5000);
  G.markKillTimer=setTimeout(()=>{if(!G.dead&&!G.won&&G.markInVent&&!G.ventClosed) triggerMarkJS();},8000);
}

function markLeave(){
  if(!G.markInVent) return;
  G.markInVent=false;
  if(G.markAppearTimer){clearTimeout(G.markAppearTimer);G.markAppearTimer=null;}
  if(G.markKillTimer){clearTimeout(G.markKillTimer);G.markKillTimer=null;}
  if(G.markLeaveTimer){clearTimeout(G.markLeaveTimer);G.markLeaveTimer=null;}
  stop('vent');hideAttackFlash();
  const img=document.getElementById('markVentImg');
  img.classList.remove('mark-visible','mark-urgent');
  updateVentUI();
}

function markLeaveAfterDelay(ms){
  if(G.markLeaveTimer) clearTimeout(G.markLeaveTimer);
  G.markLeaveTimer=setTimeout(()=>markLeave(),ms);
}

function toggleVent(){
  if(G.dead||G.won) return;
  G.ventClosed=!G.ventClosed;
  if(G.ventClosed) play('doorClose');
  updateVentUI();
  if(G.ventClosed&&G.markInVent){
    if(G.markAppearTimer){clearTimeout(G.markAppearTimer);G.markAppearTimer=null;}
    if(G.markKillTimer){clearTimeout(G.markKillTimer);G.markKillTimer=null;}
    hideAttackFlash();markLeaveAfterDelay(1000+Math.random()*2000);
  } else if(!G.ventClosed&&G.markInVent){
    if(G.markKillTimer) clearTimeout(G.markKillTimer);
    G.markKillTimer=setTimeout(()=>{if(!G.dead&&!G.won&&G.markInVent&&!G.ventClosed) triggerMarkJS();},1000);
  }
}

function updateVentUI(){
  const grate=document.getElementById('ventGrate');
  const btn=document.getElementById('ventBtn');
  const light=document.getElementById('ventLight');
  const img=document.getElementById('markVentImg');
  const warn=document.getElementById('ventOxygenWarning');
  grate.classList.toggle('shut',G.ventClosed);
  btn.classList.toggle('shut',G.ventClosed);
  btn.querySelector('.vent-label').textContent=G.ventClosed?'OPEN VENT':'SLUIT VENT';
  light.classList.toggle('active',G.markInVent&&!G.ventClosed);
  if(warn) warn.classList.toggle('active',G.ventClosed);
  if(G.markInVent&&!G.ventClosed) img.classList.add('mark-visible');
  else if(G.ventClosed||!G.markInVent) img.classList.remove('mark-visible','mark-urgent');
}

/* ══════════════════════════════════════════
   CAMERA TOGGLE
══════════════════════════════════════════ */
function toggleCam(){
  if(G.dead||G.won) return;
  G.camOpen=!G.camOpen;
  document.getElementById('camOverlay').style.display=G.camOpen?'flex':'none';
  document.getElementById('camToggleBtn').classList.toggle('active',G.camOpen);
  if(!G.camOpen){
    stopWindUp();
    document.getElementById('musicBoxPanel').style.display='none';
    if(SFX.muziek) SFX.muziek.volume=0.15;
    if(G.maduroPos>=0) maduroDespawn();
    G.maduroWatchMs=0;
  }
  if(G.camOpen) switchCam(G.curCam);
  if(G.camOpen) shadowGijsDismiss();
  updateLureUI();updateAlarmUI();
}

/* ══════════════════════════════════════════
   DEUR LOGICA
══════════════════════════════════════════ */
function toggleDoor(side){
  if(G.dead||G.won) return;
  if(side==='left'){
    G.lfClosed=!G.lfClosed;
    if(G.lfClosed) play('doorClose');
    document.getElementById('dpL').classList.toggle('shut',G.lfClosed);
    const b=document.getElementById('dbL');b.textContent=G.lfClosed?'OPEN':'DEUR';b.classList.toggle('on',G.lfClosed);
    if(G.lfClosed){if(G.mPos===POS.LD&&G.mDoorTimer){clearTimeout(G.mDoorTimer);G.mDoorTimer=null;}}
    else{if(G.mPos===POS.LD) armDoorTimer();}
  } else {
    G.rtClosed=!G.rtClosed;
    if(G.rtClosed) play('doorClose');
    document.getElementById('dpR').classList.toggle('shut',G.rtClosed);
    const b=document.getElementById('dbR');b.textContent=G.rtClosed?'OPEN':'DEUR';b.classList.toggle('on',G.rtClosed);
    if(G.rtClosed){if(G.mPos===POS.RD&&G.mDoorTimer){clearTimeout(G.mDoorTimer);G.mDoorTimer=null;}}
    else{if(G.mPos===POS.RD) armDoorTimer();}
  }
  refreshDoorLights();
}

function refreshDoorLights(){
  document.getElementById('dlL').className='d-light'+(G.lfClosed?' dl-safe':'');
  document.getElementById('dlR').className='d-light'+(G.rtClosed?' dl-safe':'');
}

/* ══════════════════════════════════════════
   GIJS AI
══════════════════════════════════════════ */
function scheduleMoveTimer(){
  if(G.mMoveTimer) clearTimeout(G.mMoveTimer);
  if(G.dead||G.won) return;
  const intervals=G.cfg.moveIval;
  const base=intervals[Math.min(G.hour,5)];
  if(base===Infinity) return;
  const delay=base+Math.random()*4000-1500;
  G.mMoveTimer=setTimeout(()=>{advanceMonster();scheduleMoveTimer();},delay);
}

function advanceMonster(){
  if(G.dead||G.won) return;
  if(G.mPos===POS.LD||G.mPos===POS.RD) return;
  if(Math.random()<0.2) play('laugh');
  let np=G.mPos;
  if(G.mPos===POS.C0) np=POS.C1;
  else if(G.mPos===POS.C1) np=POS.C2;
  else if(G.mPos===POS.C2){if(!G.mPath) G.mPath=Math.random()<.5?'left':'right';np=G.mPath==='left'?POS.C3:POS.C4;G.mPath=null;}
  else if(G.mPos===POS.C3) np=POS.LD;
  else if(G.mPos===POS.C4) np=POS.RD;
  G.mPos=np;
  refreshMonsterDots();refreshDoorLights();
  if(G.camOpen) renderCamFeed();
  if(np===POS.LD||np===POS.RD) handleAtDoor(np);
}

function handleAtDoor(pos){
  refreshDoorLights();
  const closed=pos===POS.LD?G.lfClosed:G.rtClosed;
  if(!closed) armDoorTimer();
  if(G.mRetreatTimer) clearTimeout(G.mRetreatTimer);
  const rd=DOOR_RETREAT_MIN+Math.random()*(DOOR_RETREAT_MAX-DOOR_RETREAT_MIN);
  G.mRetreatTimer=setTimeout(()=>retreatGijs(),rd);
}

function retreatGijs(){
  if(G.dead||G.won) return;
  if(G.mPos!==POS.LD&&G.mPos!==POS.RD) return;
  if(G.mDoorTimer){clearTimeout(G.mDoorTimer);G.mDoorTimer=null;}
  const backs=[POS.C0,POS.C1,POS.C2];
  G.mPos=backs[Math.floor(Math.random()*backs.length)];
  play('footsteps');refreshMonsterDots();refreshDoorLights();
  if(G.camOpen) renderCamFeed();
  updateLureUI();
}

function armDoorTimer(){
  if(G.mDoorTimer) clearTimeout(G.mDoorTimer);
  if(G.dead||G.won) return;
  G.mDoorTimer=setTimeout(()=>{
    if(G.dead||G.won) return;
    if(G.mPos===POS.LD&&!G.lfClosed) triggerGijsJS();
    if(G.mPos===POS.RD&&!G.rtClosed) triggerGijsJS();
  },GRACE_MS);
}

/* ══════════════════════════════════════════
   HOBO GIJS AI
══════════════════════════════════════════ */
function scheduleHoboMove(){
  if(G.hoboMoveTimer) clearTimeout(G.hoboMoveTimer);
  if(G.dead||G.won) return;
  if(!G.cfg.hoboActive) return;
  const delay=G.cfg.hoboMinMs+Math.random()*(G.cfg.hoboMaxMs-G.cfg.hoboMinMs);
  if(!isFinite(delay)) return;
  G.hoboMoveTimer=setTimeout(()=>{moveHobo();scheduleHoboMove();},delay);
}

function moveHobo(){
  if(G.dead||G.won) return;
  let np,attempts=0;
  do{np=HOBO_ALLOWED_CAMS[Math.floor(Math.random()*HOBO_ALLOWED_CAMS.length)];attempts++;}
  while(np===G.hoboPos&&attempts<20);
  G.hoboPos=np;refreshMonsterDots();
  if(G.camOpen) renderCamFeed();
  updateLureUI();
}

/* ══════════════════════════════════════════
   LOKKEN
══════════════════════════════════════════ */
function inLureRange(){
  if(!G.camOpen) return false;
  const adj={
    [POS.C0]:[POS.C1],[POS.C1]:[POS.C0,POS.C2],
    [POS.C2]:[POS.C1,POS.C3,POS.C4],[POS.C3]:[POS.C2,POS.LD],
    [POS.C4]:[POS.C2,POS.RD],[POS.LD]:[POS.C3],[POS.RD]:[POS.C4]
  };
  const gijsInRange=G.curCam!==MUSIC_CAM_ID&&(G.mPos===G.curCam||(adj[G.mPos]||[]).includes(G.curCam));
  const hoboInRange=G.curCam!==MUSIC_CAM_ID&&G.hoboPos===G.curCam;
  const diddyInRange=G.diddyActive&&G.curCam!==MUSIC_CAM_ID&&G.diddyPos===G.curCam;
  return gijsInRange||hoboInRange||diddyInRange;
}
function hoboOnCurrentCam(){return G.camOpen&&G.hoboPos===G.curCam&&G.curCam!==MUSIC_CAM_ID;}

function updateLureUI(){
  const ready=G.lureReady,range=inLureRange();
  const hudBtn=document.getElementById('lureBtnHud');
  const camBtn=document.getElementById('lureBtnCam');
  const cd=document.getElementById('lureCd');
  if(ready){
    hudBtn.disabled=!range;hudBtn.className='lure-btn'+(range?' ready':'');
    camBtn.disabled=!range;camBtn.className='lure-btn'+(range?' ready':'');
    hudBtn.textContent=range?'🔊 LOKKEN — KLAAR!':'🔊 LOKKEN';
    camBtn.textContent=range?'🔊 LOKKEN — KLAAR!':'🔊 LOKKEN (buiten bereik)';
    cd.textContent=range?'⚠ Monster in bereik!':'Monster niet in bereik';
    cd.className='lure-cd'+(range?' hot':'');
  } else {
    const s=Math.ceil(G.lureCD);
    hudBtn.disabled=true;hudBtn.className='lure-btn';hudBtn.textContent=`🔊 LOKKEN — ${s}s`;
    camBtn.disabled=true;camBtn.className='lure-btn';camBtn.textContent=`🔊 LOKKEN — ${s}s`;
    cd.textContent=`Cooldown: ${s}s`;cd.className='lure-cd';
  }
}

function useLure(){
  if(!G.lureReady||!inLureRange()||G.dead||G.won) return;
  if(hoboOnCurrentCam()){triggerHoboJS();return;}
  play('lure');
  if(G.diddyActive&&G.diddyPos===G.curCam&&G.curCam!==MUSIC_CAM_ID){
    const pb={[POS.LD]:POS.C3,[POS.RD]:POS.C4,[POS.C3]:POS.C2,[POS.C4]:POS.C2,[POS.C2]:POS.C1,[POS.C1]:POS.C0,[POS.C0]:POS.C0};
    const np=pb[G.diddyPos];
    if(np!==undefined){
      if(G.diddyMoveTimer){clearTimeout(G.diddyMoveTimer);G.diddyMoveTimer=null;}
      G.diddyPos=np;G.diddyPath=null;
      refreshMonsterDots();if(G.camOpen) renderCamFeed();
      scheduleDiddyMove();
    }
  }
  const pb={[POS.LD]:POS.C3,[POS.RD]:POS.C4,[POS.C3]:POS.C2,[POS.C4]:POS.C2,[POS.C2]:POS.C1,[POS.C1]:POS.C0,[POS.C0]:POS.C0};
  const np=pb[G.mPos];
  if(np!==undefined){
    G.mPos=np;
    if(G.mDoorTimer){clearTimeout(G.mDoorTimer);G.mDoorTimer=null;}
    if(G.mRetreatTimer){clearTimeout(G.mRetreatTimer);G.mRetreatTimer=null;}
    refreshMonsterDots();refreshDoorLights();if(G.camOpen) renderCamFeed();
  }
  G.lureReady=false;G.lureCD=LURE_CD_S;
  clearInterval(G.lureCDTimer);
  G.lureCDTimer=setInterval(()=>{G.lureCD--;if(G.lureCD<=0){G.lureReady=true;G.lureCD=0;clearInterval(G.lureCDTimer);}updateLureUI();},1000);
  updateLureUI();
}

/* ══════════════════════════════════════════
   SHADOW GIJS AI
══════════════════════════════════════════ */
function tickShadowGijs(){
  if(G.dead||G.won||G.camOpen||G.shadowActive) return;
  if(G.cfg.shadowChance>0&&Math.random()<G.cfg.shadowChance) shadowGijsAppear();
}

function shadowGijsAppear(){
  if(G.shadowActive||G.dead||G.won) return;
  G.shadowActive=true;
  const img=document.getElementById('shadowGijsOfficeImg');
  img.style.display='block';img.style.animation='shadowGijsFade 0.4s ease-out forwards';
  setTimeout(()=>{img.style.animation='shadowGijsPulse 1s ease-in-out infinite';},400);
  play('shadowGijsAudio');
  if(G.shadowKillTimer) clearTimeout(G.shadowKillTimer);
  G.shadowKillTimer=setTimeout(()=>{if(G.shadowActive&&!G.dead&&!G.won) triggerShadowGijsJS();},3000);
}

function shadowGijsDismiss(){
  if(!G.shadowActive) return;
  G.shadowActive=false;
  if(G.shadowKillTimer){clearTimeout(G.shadowKillTimer);G.shadowKillTimer=null;}
  stop('shadowGijsAudio');
  const img=document.getElementById('shadowGijsOfficeImg');
  img.style.animation='none';img.style.opacity='0';img.style.transition='opacity 0.3s';
  setTimeout(()=>{img.style.display='none';img.style.opacity='';img.style.transition='';},320);
}

function triggerShadowGijsJS(){
  if(G.dead) return;
  stop('shadowGijsAudio');
  const img=document.getElementById('shadowGijsOfficeImg');
  img.style.display='none';G.shadowActive=false;
  doJumpscare(FILES.shadowGijsJS,'Shadow Gijs heeft je gevangen.<br><em>"Je had weg moeten kijken..."</em>','shadowGijsAudio');
}

/* ══════════════════════════════════════════
   SPEL TICK
══════════════════════════════════════════ */
function gameTick(){
  if(G.dead||G.won) return;
  let drain=O2_DRAIN_BASE;
  if(G.lfClosed)   drain+=O2_DOOR_PER_TICK;
  if(G.rtClosed)   drain+=O2_DOOR_PER_TICK;
  if(G.camOpen)    drain+=O2_CAM_PER_TICK;
  if(G.ventClosed) drain+=O2_VENT_PER_TICK;
  G.o2=Math.max(0,G.o2-drain);
  updateO2UI();
  if(G.o2<=0&&!G.o2Dead) oxygenDepleted();
  tickMusicBox();tickJeffrey();tickChapo();tickMaduro();tickShadowGijs();
  maybeGlitch();updateAlarmUI();
}

function updateO2UI(){
  const p=Math.max(0,Math.round(G.o2));
  document.getElementById('o2Pct').textContent=p+'%';
  const fill=document.getElementById('o2Fill');
  fill.style.width=p+'%';fill.className='o2-fill';
  let status='NOMINAAL';
  if(p<=10){fill.classList.add('crit');status='KRITIEK ⚠';}
  else if(p<=30){fill.classList.add('warn');status='LAAG';}
  document.getElementById('o2Status').textContent=status;
}

function oxygenDepleted(){
  G.o2Dead=true;stop('ambience');play('oxygenOut');
  startFire();G.fireTimer=setTimeout(triggerPatrickJS,8000);
}

/* ══════════════════════════════════════════
   MUZIEKDOOS TICK
══════════════════════════════════════════ */
function tickMusicBox(){
  if(G.dead||G.won||!G.cfg.tomActive) return;
  if(G.isWindingUp&&G.camOpen&&G.curCam===MUSIC_CAM_ID){
    G.musicBox=Math.min(100,G.musicBox+MB_WIND_RATE);
  } else {
    const drain=MB_DRAIN_BASE+MB_DRAIN_SCALE*Math.min(G.hour,5);
    G.musicBox=Math.max(0,G.musicBox-drain);
    if(G.musicBox<=0) triggerTomJS();
  }
  updateMusicBoxUI();
  if(G.camOpen&&G.curCam===MUSIC_CAM_ID) renderCamFeed();
}

/* ══════════════════════════════════════════
   GLITCH
══════════════════════════════════════════ */
function maybeGlitch(){
  if(G.dead||G.won||!G.camOpen||glitchActive) return;
  const gijsOnCam=G.mPos===G.curCam&&G.curCam!==MUSIC_CAM_ID;
  const gijsNear=[POS.LD,POS.RD].includes(G.mPos);
  const hoboOnCam=G.hoboPos===G.curCam&&G.curCam!==MUSIC_CAM_ID;
  const jeffOnCam=G.jeffreyActive&&G.jeffreyPos===G.curCam&&G.curCam!==MUSIC_CAM_ID;
  const diddyOnCam=G.diddyActive&&G.diddyPos===G.curCam&&G.curCam!==MUSIC_CAM_ID;
  const musicLow=G.curCam===MUSIC_CAM_ID&&G.musicBox<40;
  let chance=0.006;
  if(gijsOnCam) chance+=0.035;if(gijsNear) chance+=0.02;if(hoboOnCam) chance+=0.025;
  if(jeffOnCam) chance+=0.03;if(diddyOnCam) chance+=0.03;if(musicLow) chance+=0.04*(1-G.musicBox/40);
  if(Math.random()<chance) fireGlitch();
  if(gijsNear&&Math.random()<0.008) fireFullScreenGlitch();
}

function fireGlitch(){
  glitchActive=true;
  const camCanvas=document.getElementById('camCanvas');
  const camMain=document.getElementById('camMain');
  const types=['glitch-tear','glitch-rgb','glitch-shake'];
  const type=types[Math.floor(Math.random()*types.length)];
  camCanvas.classList.add(type);camMain.classList.add('has-glitch');
  if(type==='glitch-tear'&&Math.random()<0.5){
    const band=document.getElementById('glitchTearBand');
    band.style.top=Math.floor(Math.random()*100)+'%';band.style.display='block';
    band.style.transform=`translateX(${-15+Math.random()*30}px)`;
  }
  const duration=100+Math.random()*200;
  glitchTimer=setTimeout(()=>{
    camCanvas.classList.remove('glitch-tear','glitch-rgb','glitch-shake');
    camMain.classList.remove('has-glitch');
    document.getElementById('glitchTearBand').style.display='none';
    glitchActive=false;
    if(Math.random()<0.3) setTimeout(fireGlitch,80+Math.random()*150);
  },duration);
}

function fireFullScreenGlitch(){
  const flash=document.getElementById('flashEl');
  flash.style.background='rgba(0,255,80,0.04)';flash.style.opacity='1';
  setTimeout(()=>{flash.style.opacity='0';flash.style.background='#fff';},60);
}

/* ══════════════════════════════════════════
   VUUR
══════════════════════════════════════════ */
let fireCtx,fireW,fireH;
const FIRE_COLORS=['255,60,0','255,120,0','255,180,0','200,40,0','255,80,10'];

function startFire(){
  const cv=document.getElementById('fireCanvas');cv.style.display='block';
  fireW=cv.width=window.innerWidth;fireH=cv.height=window.innerHeight;
  fireCtx=cv.getContext('2d');G.firePtcls=[];G.fireOn=true;
  for(let i=0;i<60;i++) G.firePtcls.push(newFlame(true));
  animFire();
}
function newFlame(init=false){
  return{x:Math.random()*window.innerWidth,y:init?window.innerHeight*(0.3+Math.random()*.7):window.innerHeight,
    vx:(Math.random()-.5)*1.5,vy:-(2+Math.random()*3),size:30+Math.random()*80,
    life:1,decay:.008+Math.random()*.006,col:FIRE_COLORS[Math.floor(Math.random()*FIRE_COLORS.length)]};
}
function animFire(){
  if(!G.fireOn) return;
  G.fireAnim=requestAnimationFrame(animFire);
  fireCtx.clearRect(0,0,fireW,fireH);
  for(let i=0;i<3;i++) G.firePtcls.push(newFlame());
  G.firePtcls=G.firePtcls.filter(f=>f.life>0);
  G.firePtcls.forEach(f=>{
    f.x+=f.vx;f.y+=f.vy;f.life-=f.decay;f.size*=.997;
    const a=f.life*.7;
    const g=fireCtx.createRadialGradient(f.x,f.y,0,f.x,f.y,f.size);
    g.addColorStop(0,`rgba(${f.col},${a})`);g.addColorStop(.5,`rgba(${f.col},${a*.4})`);g.addColorStop(1,`rgba(${f.col},0)`);
    fireCtx.fillStyle=g;fireCtx.beginPath();fireCtx.arc(f.x,f.y,f.size,0,Math.PI*2);fireCtx.fill();
  });
}

/* ══════════════════════════════════════════
   TIJD
══════════════════════════════════════════ */
function tickTime(){
  if(G.dead||G.won) return;
  const progress=Math.min(1,(Date.now()-G.nightStart)/NIGHT_MS);
  if(progress>=1){triggerWin();return;}
  const totalMins=progress*360;
  G.hour=Math.floor(totalMins/60);
  const h=G.hour===0?12:G.hour,m=String(Math.floor(totalMins%60)).padStart(2,'0');
  document.getElementById('hudTime').textContent=`${h}:${m} AM`;
  if(G.hour>=5&&!G.fiveAMDone){
    G.fiveAMDone=true;
    stop('ambience');
    play('fiveAM');
  }
}

/* ══════════════════════════════════════════
   JUMPSCARES & DOOD
══════════════════════════════════════════ */
function doJumpscare(src,cause,audioKey='jumpscare'){
  if(G.dead) return;G.dead=true;killTimers();stopAll();
  doFlash(()=>{
    document.getElementById('jsImg').src=src;
    document.getElementById('jsScreen').style.display='flex';
    play(audioKey);
    setTimeout(()=>{
      document.getElementById('jsScreen').style.display='none';
      document.getElementById('gameScreen').style.display='none';
      document.getElementById('deathMsg').innerHTML=cause;
      document.getElementById('deathScreen').style.display='flex';
    },3300);
  });
}

function triggerGijsJS()  {doJumpscare(FILES.gijsJS,'Meester Gijs heeft je gevonden.<br><em>"That\'s a 1 out of 10. For you."</em>');}
function triggerPatrickJS(){doJumpscare(FILES.patrickJS,'De zuurstof raakte op.<br><em>"You should have studied harder."</em>');}
function triggerHoboJS()  {doJumpscare(FILES.hoboGijsJS,'Je lokte het verkeerde monster.<br><em>"...You shouldn\'t have done that."</em>');}
function triggerTomJS()   {stopWindUp();doJumpscare(FILES.tomJS,'De muziek stopte.<br><em>"...I\'ve been waiting so long to come out."</em>');}
function triggerJeffreyJS(){doJumpscare(FILES.jeffreyJS,'Jeffrey heeft je gevonden.<br><em>"De deuren houden mij niet tegen."</em>');}
function triggerMarkJS()  {if(G.dead) return;markLeave();doJumpscare(FILES.markJS,'Mark kwam uit de ventilatie.<br><em>"Je had de schacht moeten sluiten."</em>');}
function triggerChapoJS() {if(G.dead) return;stop('alarm');doJumpscare(FILES.chapoJS,'Chapo heeft aangevallen.<br><em>"Deuren? Dat is niets voor mij."</em>');}
function triggerDiddyJS() {if(G.dead) return;doJumpscare(FILES.diddyJS,'Diddy heeft je gevonden.<br><em>"Je had het alarm moeten gebruiken."</em>');}

function doFlash(cb){
  const el=document.getElementById('flashEl');
  el.style.opacity='1';
  setTimeout(()=>{el.style.opacity='0';setTimeout(cb,60);},80);
}

function triggerWin(){
  if(G.won||G.dead) return;G.won=true;killTimers();stopAll();
  play('win');
  document.getElementById('gameScreen').style.display='none';
  document.getElementById('winScreen').style.display='flex';
}

/* ══════════════════════════════════════════
   TIMERS OPRUIMEN
══════════════════════════════════════════ */
function killTimers(){
  [G.tickTimer,G.timeTimer,G.mMoveTimer,G.mDoorTimer,G.mRetreatTimer,
   G.fireTimer,G.lureCDTimer,G.hoboMoveTimer,G.chapoKillTimer,
   G.markAppearTimer,G.markKillTimer,G.markLeaveTimer,G.markCheckInterval,
   G.maduroSpawnTimer,G.attackFlashTimer,G.diddyMoveTimer,G.alarmCDTimer,
   G.shadowKillTimer,G.shadowCheckTimer
  ].forEach(t=>{if(t)try{clearInterval(t);clearTimeout(t);}catch(e){}});
  if(glitchTimer){clearTimeout(glitchTimer);glitchTimer=null;}
  glitchActive=false;G.fireOn=false;
  if(G.fireAnim) cancelAnimationFrame(G.fireAnim);
  hideAttackFlash();
}

/* ══════════════════════════════════════════
   SPEL STARTEN / HERSTARTEN
══════════════════════════════════════════ */
function startGame(){
  if(!selectedNight) return;
  stopMenuMusic();
  G=mkState();G.nightStart=Date.now();G.running=true;
  glitchActive=false;

  ['startScreen','deathScreen','winScreen'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('jsScreen').style.display='none';
  document.getElementById('gameScreen').style.display='block';
  document.getElementById('camOverlay').style.display='none';
  document.getElementById('camToggleBtn').classList.remove('active');
  document.getElementById('flashEl').style.opacity='0';
  document.getElementById('flashEl').style.background='#fff';
  document.getElementById('fireCanvas').style.display='none';
  document.getElementById('glitchTearBand').style.display='none';
  document.getElementById('musicBoxPanel').style.display='none';
  document.getElementById('tomDangerOverlay').style.opacity='0';
  document.getElementById('alarmOverlay').style.display='none';
  document.getElementById('maduroDisabledOverlay').classList.remove('active');
  document.getElementById('maduroCamImg').style.display='none';
  document.getElementById('attackFlashOverlay').classList.remove('active');
  document.getElementById('attackFlashImg').src='';
  const sgImg=document.getElementById('shadowGijsOfficeImg');
  sgImg.style.display='none';sgImg.style.opacity='';sgImg.style.transition='';sgImg.style.animation='';

  // Ventilatie reset
  G.ventClosed=false;
  document.getElementById('ventGrate').classList.remove('shut');
  document.getElementById('ventBtn').classList.remove('shut');
  document.getElementById('ventBtn').querySelector('.vent-label').textContent='SLUIT VENT';
  document.getElementById('ventLight').classList.remove('active');
  document.getElementById('markVentImg').classList.remove('mark-visible','mark-urgent');
  document.getElementById('ventOxygenWarning').classList.remove('active');

  // Deuren reset
  ['dpL','dpR'].forEach(id=>document.getElementById(id).classList.remove('shut'));
  ['dbL','dbR'].forEach(id=>{const b=document.getElementById(id);b.textContent='DEUR';b.classList.remove('on');});
  ['dlL','dlR'].forEach(id=>document.getElementById(id).className='d-light');

  // HUD vijanden tonen/verbergen
  const cfg=G.cfg;
  document.getElementById('dotJeffrey').style.display=cfg.jeffreyActive?'':'none';
  document.getElementById('jeffreyLabel').style.display=cfg.jeffreyActive?'':'none';
  document.getElementById('dotChapo').style.display=cfg.chapoActive?'':'none';
  document.getElementById('chapoLabel').style.display=cfg.chapoActive?'':'none';
  document.getElementById('dotDiddy').style.display=cfg.diddyActive?'':'none';
  document.getElementById('diddyLabel').style.display=cfg.diddyActive?'':'none';
  document.getElementById('nightModeLbl').textContent=cfg.label;

  initAudio();play('ambience');
  if(cfg.tomActive){
    if(SFX.muziek){SFX.muziek.volume=0.15;SFX.muziek.playbackRate=1;SFX.muziek.play().catch(()=>{});}
  }

  drawOffice();buildCamStrip();refreshMonsterDots();updateO2UI();updateMusicBoxUI();updateLureUI();updateVentUI();

  // Lure cooldown starten
  G.lureCD=LURE_CD_S;
  G.lureCDTimer=setInterval(()=>{G.lureCD--;if(G.lureCD<=0){G.lureReady=true;G.lureCD=0;clearInterval(G.lureCDTimer);}updateLureUI();},1000);
  G.alarmReady=true;G.alarmCD=0;updateAlarmUI();

  // Timers starten
  G.tickTimer=setInterval(gameTick,TICK_MS);
  G.timeTimer=setInterval(tickTime,250);
  setTimeout(scheduleMoveTimer,5000);
  G.hoboPos=HOBO_ALLOWED_CAMS[Math.floor(Math.random()*HOBO_ALLOWED_CAMS.length)];
  scheduleHoboMove();
  G.fireOn=false;
  if(cfg.markRutteActive) scheduleMarkCheck();
  scheduleMaduroSpawn();
  if(cfg.jeffreyActive){G.jeffreyStep=0;G.jeffreyPos=JEFFREY_PATH[0];G.jeffreyTimer=cfg.jeffreySwitch||JEFFREY_SWITCH_S;}
  if(cfg.diddyActive) setTimeout(scheduleDiddyMove, 8000);
  refreshMonsterDots();
}

function restartGame(){
  ['deathScreen','winScreen'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('startScreen').style.display='flex';
  menuAudio.play().catch(()=>{});
  selectedNight=0;
  for(let i=1;i<=5;i++) document.getElementById('nb'+i).className='night-btn';
  document.getElementById('nbCustom').className='night-btn';
  document.getElementById('customNightPanel').style.display='none';
  document.getElementById('loreCard').style.display='block';
  const sb=document.getElementById('startBtn');
  sb.disabled=true;sb.className='start-btn';sb.textContent='SELECTEER EEN NACHT';
}

/* ══════════════════════════════════════════
   STARTSCHERM ACHTERGROND ANIMATIE
══════════════════════════════════════════ */
function animateStartBg(){
  const cv=document.getElementById('dripsCanvas');
  if(!cv) return;
  cv.width=window.innerWidth;cv.height=window.innerHeight;
  const ctx=cv.getContext('2d');
  const drips=[];
  for(let i=0;i<Math.floor(window.innerWidth/22);i++){
    drips.push({x:Math.random()*window.innerWidth,y:-Math.random()*200,
      speed:0.3+Math.random()*0.8,length:30+Math.random()*100,alpha:0.15+Math.random()*0.4});
  }
  function frame(){
    ctx.clearRect(0,0,cv.width,cv.height);
    drips.forEach(d=>{
      ctx.strokeStyle=`rgba(${100+Math.floor(Math.random()*20)},0,0,${d.alpha})`;
      ctx.lineWidth=1+Math.random();
      ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x,d.y+d.length);ctx.stroke();
      d.y+=d.speed;
      if(d.y>cv.height+d.length) d.y=-d.length-Math.random()*100;
    });
    requestAnimationFrame(frame);
  }
  frame();
}

/* ══════════════════════════════════════════
   TOETSENBORD & RESIZE
══════════════════════════════════════════ */
window.addEventListener('keydown',e=>{
  if((e.key==='c'||e.key==='C')&&G&&G.running) toggleCam();
  if((e.key==='a'||e.key==='A')&&G&&G.running&&G.camOpen) useCameraAlarm();
});

window.addEventListener('resize',()=>{
  if(G&&G.running&&!G.dead&&!G.won){
    drawOffice();
    if(G.camOpen){const cv=document.getElementById('camCanvas');cv.width=cv.offsetWidth;cv.height=cv.offsetHeight;drawCamRoom(cv,G.curCam,false);}
    if(G.fireOn){const fv=document.getElementById('fireCanvas');fireW=fv.width=window.innerWidth;fireH=fv.height=window.innerHeight;}
  }
});

/* ══════════════════════════════════════════
   INITIALISATIE (DOMContentLoaded)
══════════════════════════════════════════ */
window.addEventListener('load',()=>{
  // Startknop koppelen
  document.getElementById('startBtn').addEventListener('click', startGame);

  // Custom sliders initialiseren met standaardwaarden
  Object.entries(CUSTOM_DEFAULTS).forEach(([char,val])=>setCustomLevel(char,val));

  // Startscherm animatie starten
  animateStartBg();

  // Afbeeldingen en achtergronden pre-loaden
  Object.values(FILES).forEach(src=>{const i=new Image();i.src=src;});
  CAM_BG_KEYS.forEach((key,id)=>getCamBgImg(id,()=>{}));
});
