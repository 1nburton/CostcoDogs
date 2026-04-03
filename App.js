import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { Svg, G, Rect, Circle, Path, Ellipse, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GW = 480;
const GH = 580;
const BUN_W = 80;
const BUN_Y = GH - 78;
const DOG_W = 48;
const DOG_H = 14;
const BASE_SPEED = 3.5;
const POINTS_PER_CATCH = 10;
const CONDIMENT_SPEED = 7;
const CONDIMENT_W = 18;
const CONDIMENT_H = 18;
const CONDIMENT_PTS = 25;
const WATER_SPEED = 13;
const WATER_W = 16;
const WATER_H = 20;
const WATER_DURATION = 6000;
const JALAP_SPEED = 9;
const JALAP_W = 20;
const JALAP_H = 26;
const STEAM_DURATION = 3000;
const LIVES = 3;

const ACHIEVEMENTS = [
  { id: 'first_catch', name: 'Welcome to Costco', desc: 'Catch your very first hot dog', check: s => s.caught >= 1 },
  { id: 'combo_5', name: 'Five Alarm Fire', desc: 'Build a 5x combo streak', check: s => s.maxCombo >= 5 },
  { id: 'combo_10', name: 'Unstoppable', desc: 'Build a 10x combo streak', check: s => s.maxCombo >= 10 },
  { id: 'score_100', name: 'Century Dog', desc: 'Score 100 points in one game', check: s => s.score >= 100 },
  { id: 'score_500', name: 'Rolled in Mustard', desc: 'Score 500 points in one game', check: s => s.score >= 500 },
  { id: 'score_1000', name: 'Hot Dog Hero', desc: 'Score 1000 points in one game', check: s => s.score >= 1000 },
  { id: 'catch_50', name: 'Hot Dog Hoarder', desc: 'Catch 50 hot dogs in one game', check: s => s.caught >= 50 },
  { id: 'condiment_5', name: 'Condiment Connoisseur', desc: 'Catch 5 condiment drops in one game', check: s => s.condis >= 5 },
  { id: 'dodge_chili', name: 'Too Cool for Chili', desc: 'Dodge 5 chili peppers in one game', check: s => s.chiliDodged >= 5 },
  { id: 'soaked_3', name: 'Soggy Legend', desc: 'Get soaked by 3 water drops in one game', check: s => s.waterHits >= 3 },
  { id: 'speed_max', name: 'Speed Demon', desc: 'Survive until the speed maxes out', check: s => s.speedMaxed },
  { id: 'perfect_200', name: 'Pristine Buns', desc: 'Score 200+ without missing a single dog', check: s => s.score >= 200 && s.missed === 0 },
];

// eslint-disable-next-line react/prop-types
function HotDog(props) {
  const { x, y } = props;
  const W = DOG_W; const H = DOG_H; const cy = H / 2; const r = H / 2 - 1;
  return (
    <G x={x} y={y}>
      <Rect x="5" y="1" width={W - 10} height={H - 2} rx={r} fill="#9a2818" />
      <Rect x="8" y="2" width={W / 2 - 6} height={H - 6} rx={r - 1} fill="#c8482e" opacity="0.55" />
      <Ellipse cx="5" cy={cy} rx="4" ry={r} fill="#7a1e10" />
      <Ellipse cx={W - 5} cy={cy} rx="4" ry={r} fill="#7a1e10" />
      <Path d={`M10 ${cy - 1} Q${W / 2} ${cy - 4} ${W - 10} ${cy - 1}`} stroke="#f0cc10" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </G>
  );
}

// eslint-disable-next-line react/prop-types
function Bun(props) {
  const { x, shrunk } = props;
  const W = shrunk ? BUN_W / 2 : BUN_W; const seeds = shrunk ? [8, 18, 28] : [12, 24, 40, 56, 68];
  return (
    <G x={x} y={BUN_Y}>
      <Rect x="0" y="16" width={W} height="20" rx="10" fill="#bf7520" />
      <Rect x="3" y="18" width={W - 6} height="10" rx="5" fill="#d49035" />
      <Ellipse cx={W / 2} cy="13" rx={W / 2} ry="18" fill="#bf7520" />
      <Ellipse cx={W / 2} cy="10" rx={W / 2 - 5} ry="13" fill="#e6a040" />
      {seeds.map((sx, i) => <Ellipse key={i} cx={sx} cy="9" rx="3.5" ry="1.4" fill="#f5e8c0" opacity="0.8" />)}
      <Rect x="10" y="12" width={W - 20} height="7" rx="3.5" fill="#7a3810" opacity="0.45" />
    </G>
  );
}

// eslint-disable-next-line react/prop-types
function Splat(props) {
  const { x, y } = props;
  return (
    <G x={x} y={y} opacity="0.55">
      <Ellipse cx="0" cy="0" rx="22" ry="6" fill="#a83020" />
      <Circle cx="-12" cy="4" r="5" fill="#a83020" />
      <Circle cx="12" cy="3" r="4" fill="#a83020" />
      <Circle cx="2" cy="-8" r="3" fill="#a83020" />
      <Path d="M-5 -5 Q0 -12 5 -5" stroke="#f0cc10" strokeWidth="2" fill="none" strokeLinecap="round" />
    </G>
  );
}

// eslint-disable-next-line react/prop-types, no-unused-vars
function CondimentDrop(props) {
  const { x, y, kind } = props;
  const c = kind === 'ketchup';
  const color = c ? '#cc1a1a' : '#f5c800';
  const dark = c ? '#8b0000' : '#b8860b';
  const label = c ? '#f7b1b1' : '#fff1a8';
  return (
    <G x={x} y={y}>
      <Rect x="6" y="1" width="6" height="3" rx="1" fill={dark} />
      <Rect x="3" y="4" width="12" height="13" rx="3" fill={color} />
      <Rect x="5" y="8" width="8" height="5" rx="2" fill={label} opacity="0.9" />
      <Path d="M4,16 Q9,19 14,16" stroke={dark} strokeWidth="1" fill="none" opacity="0.6" />
    </G>
  );
}

// eslint-disable-next-line react/prop-types
function WaterDrop(props) {
  const { x, y } = props;
  return (
    <G x={x} y={y}>
      <Path d={`M${WATER_W / 2},1 Q${WATER_W - 1},${WATER_H * 0.42} ${WATER_W / 2},${WATER_H - 1} Q1,${WATER_H * 0.42} ${WATER_W / 2},1 Z`} fill="#1ea8e0" stroke="#60c8f0" strokeWidth="0.8" opacity="0.95" />
    </G>
  );
}

// eslint-disable-next-line react/prop-types
function ChiliDrop(props) {
  const { x, y } = props;
  return (
    <G x={x} y={y}>
      <Path d="M7,7 Q9,4 12,4 Q15,4 13,7 Z" fill="#2d6a10" />
      <Path d="M8,7 Q3,10 3,18 Q3,25 8,28 Q11,30 13,28 Q16,25 17,20 Q19,13 15,8 Z" fill="#2da818" />
      <Path d="M8,27 Q10,32 13,28" fill="#1a8010" stroke="#166010" strokeWidth="0.5" />
    </G>
  );
}

async function storageGet(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

async function storageSet(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    // Handle error silently
  }
}

async function storageLargeGet(key) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

async function storageLargeSet(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Handle error silently
  }
}

export default function CostcoDogs() {
  const [screen, setScreen] = useState('auth');
  const [username, setUsername] = useState('');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [bunX, setBunX] = useState(GW / 2 - BUN_W / 2);
  const [renderDogs, setRenderDogs] = useState([]);
  const [splats, setSplats] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(false);
  const [popups, setPopups] = useState([]);
  const [personalBest, setPersonalBest] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [renderCondiments, setRenderCondiments] = useState([]);
  const [renderWater, setRenderWater] = useState([]);
  const [bunShrunk, setBunShrunk] = useState(false);
  const [renderJala, setRenderJala] = useState([]);
  const [unlockedAchs, setUnlockedAchs] = useState(new Set());
  const [arenaWidth, setArenaWidth] = useState(0);
  const [screamText, setScreamText] = useState('');
  const [steamActive, setSteamActive] = useState(false);

  const dogsRef = useRef([]); const condimentsRef = useRef([]); const waterRef = useRef([]); const bunShrunkRef = useRef(false);
  const shrinkTimerRef = useRef(null); const jalaRef = useRef([]); const steamTimerRef = useRef(null);
  const screamTimerRef = useRef(null); const popupTimersRef = useRef([]);
  const unlockedAchsRef = useRef(new Set()); const sessionStatsRef = useRef({ caught: 0, maxCombo: 0, condis: 0, chiliDodged: 0, waterHits: 0, missed: 0, speedMaxed: false, score: 0 });
  const bunXRef = useRef(GW / 2 - BUN_W / 2); const scoreRef = useRef(0); const livesRef = useRef(LIVES); const comboRef = useRef(0);
  const dogSpawnTick = useRef(0); const waterSpawnTick = useRef(0); const condSpawnTick = useRef(0); const jalaSpawnTick = useRef(0);
  const elapsedRef = useRef(0); const lastTimeRef = useRef(null); const usernameRef = useRef(''); const screenRef = useRef('auth');

  screenRef.current = screen;
  usernameRef.current = username;
  useEffect(() => { bunXRef.current = bunX; }, [bunX]);

  useEffect(() => {
    (async () => {
      const pb = await storageGet('costco:pb');
      const savedCurrentEmail = await storageGet('costco:currentUserEmail');
      if (savedCurrentEmail) {
        const users = await storageLargeGet('costco:users');
        const found = Array.isArray(users) ? users.find(u => u.email === savedCurrentEmail) : null;
        if (found) {
          setUsername(found.displayName || found.email.split('@')[0]);
          setAccountEmail(found.email);
          setScreen('idle');
        }
      }
      if (pb) setPersonalBest(parseInt(pb, 10));
      const unlockedAchList = await storageLargeGet('costco:achievements');
      if (unlockedAchList && Array.isArray(unlockedAchList)) {
        const s = new Set(unlockedAchList);
        unlockedAchsRef.current = s;
        setUnlockedAchs(s);
      }
    })();
  }, []);

  useEffect(() => () => {
    if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
    if (steamTimerRef.current) clearTimeout(steamTimerRef.current);
    if (screamTimerRef.current) clearTimeout(screamTimerRef.current);
    popupTimersRef.current.forEach(clearTimeout);
  }, []);

  const handleAuth = async () => {
    const email = authEmail.trim().toLowerCase();
    const identifier = authIdentifier.trim().toLowerCase();
    const rawSignupUsername = signupUsername.trim();
    const cleanedSignupUsername = rawSignupUsername.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16);
    const password = authPassword;
    if (password.length < 6) { setAuthError('Password must be at least 6 characters'); return; }

    const users = (await storageLargeGet('costco:users')) || [];
    const existingByEmail = users.find(u => u.email === email);

    if (authMode === 'signup') {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!validEmail) { setAuthError('Enter a valid email address'); return; }
      if (cleanedSignupUsername.length < 2) { setAuthError('Username must be at least 2 characters'); return; }
      const takenUsername = users.find(u => u.usernameLower === cleanedSignupUsername.toLowerCase());
      if (existingByEmail) { setAuthError('Account already exists. Log in instead.'); return; }
      if (takenUsername) { setAuthError('Username is already taken'); return; }
      const nextUsers = [...users, {
        email,
        password,
        username: cleanedSignupUsername,
        usernameLower: cleanedSignupUsername.toLowerCase(),
        displayName: cleanedSignupUsername,
      }];
      await storageLargeSet('costco:users', nextUsers);
      await storageSet('costco:currentUserEmail', email);
      setUsername(cleanedSignupUsername);
      setAccountEmail(email);
      usernameRef.current = cleanedSignupUsername;
      setAuthIdentifier('');
      setSignupUsername('');
      setAuthPassword('');
      setAuthError('');
      setScreen('idle');
      return;
    }

    if (!identifier) { setAuthError('Enter username or email'); return; }
    const existing = users.find(u => u.email === identifier || u.usernameLower === identifier);

    if (!existing || existing.password !== password) {
      setAuthError('Incorrect username/email or password');
      return;
    }

    await storageSet('costco:currentUserEmail', existing.email);
    setUsername(existing.displayName || existing.username || existing.email.split('@')[0]);
    setAccountEmail(existing.email);
    usernameRef.current = existing.displayName || existing.username || existing.email.split('@')[0];
    setAuthIdentifier('');
    setSignupUsername('');
    setAuthPassword('');
    setAuthError('');
    setScreen('idle');
  };

  const handleLogout = async () => {
    await storageSet('costco:currentUserEmail', '');
    setAccountEmail('');
    setUsername('');
    usernameRef.current = '';
    setAuthIdentifier('');
    setSignupUsername('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthError('');
    setAuthMode('login');
    setScreen('auth');
  };

  const loadLeaderboard = useCallback(async () => {
    setBoardLoading(true);
    const lb = await storageLargeGet('costco:leaderboard');
    setLeaderboard(lb && Array.isArray(lb) ? lb.sort((a, b) => b.score - a.score).slice(0, 15) : []);
    setBoardLoading(false);
  }, []);

  const saveScore = useCallback(async (s) => {
    const name = usernameRef.current;
    if (!name || s <= 0) return;
    const lb = await storageLargeGet('costco:leaderboard') || [];
    const idx = lb.findIndex(e => e.name === name);
    if (idx >= 0) { if (lb[idx].score < s) lb[idx].score = s; } else { lb.push({ name, score: s }); }
    await storageLargeSet('costco:leaderboard', lb);
    const pb = parseInt(await storageGet('costco:pb') || '0', 10);
    if (s > pb) { await storageSet('costco:pb', String(s)); setPersonalBest(s); }
  }, []);

  const startGame = () => {
    dogsRef.current = []; condimentsRef.current = []; waterRef.current = []; jalaRef.current = [];
    setRenderCondiments([]); setRenderWater([]); setRenderJala([]);
    setBunShrunk(false); bunShrunkRef.current = false;
    if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
    if (steamTimerRef.current) clearTimeout(steamTimerRef.current);
    scoreRef.current = 0; comboRef.current = 0; livesRef.current = LIVES;
    dogSpawnTick.current = 0; waterSpawnTick.current = 0; condSpawnTick.current = 0; jalaSpawnTick.current = 0;
    elapsedRef.current = 0; lastTimeRef.current = null;
    setRenderDogs([]); setSplats([]); setScore(0); setLives(LIVES); setCombo(0); setPopups([]); setScreamText('');
    setSteamActive(false);
    setBunX(GW / 2 - BUN_W / 2); bunXRef.current = GW / 2 - BUN_W / 2;
    sessionStatsRef.current = { caught: 0, maxCombo: 0, condis: 0, chiliDodged: 0, waterHits: 0, missed: 0, speedMaxed: false, score: 0 };
    setScreen('playing');
  };

  const moveBunToArenaX = useCallback((arenaX) => {
    if (screenRef.current !== 'playing') return;
    if (!arenaWidth) return;
    const ratio = GW / arenaWidth;
    const targetCenterX = arenaX * ratio;
    const effBunW = bunShrunkRef.current ? BUN_W / 2 : BUN_W;
    const nextX = Math.max(0, Math.min(GW - effBunW, targetCenterX - effBunW / 2));
    bunXRef.current = nextX;
    setBunX(nextX);
  }, [arenaWidth]);

  const addPopup = useCallback((text, x, y, ttl = 900) => {
    const id = `${Date.now()}-${Math.random()}`;
    setPopups(p => [...p.slice(-6), { id, x, y, text }]);
    const timer = setTimeout(() => {
      setPopups(p => p.filter(item => item.id !== id));
      popupTimersRef.current = popupTimersRef.current.filter(t => t !== timer);
    }, ttl);
    popupTimersRef.current.push(timer);
  }, []);

  const scream = useCallback((text) => {
    setScreamText(text);
    if (screamTimerRef.current) clearTimeout(screamTimerRef.current);
    screamTimerRef.current = setTimeout(() => setScreamText(''), 1100);
  }, []);

  const renderFramed = useCallback((content) => (
    <SafeAreaView style={styles.appOuter}>
      <View style={styles.appShell}>{content}</View>
    </SafeAreaView>
  ), []);

  useEffect(() => {
    if (screen !== 'playing') return;
    let animFrameId;
    const gameLoop = () => {
      const now = performance.now();
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = (now - lastTimeRef.current) / 1000; const t = (elapsedRef.current += dt);
      lastTimeRef.current = now;

      const speed = Math.min(BASE_SPEED + t * 0.025, 9.5);
      if (speed >= 9.5) sessionStatsRef.current.speedMaxed = true;

      const spawnRate = Math.max(32, 105 - Math.floor(t / 7) * 3);
      dogSpawnTick.current += 1;
      waterSpawnTick.current += 1;
      condSpawnTick.current += 1;
      jalaSpawnTick.current += 1;
      if (dogSpawnTick.current >= spawnRate) {
        dogSpawnTick.current = 0;
        const burstCount = Math.random() < 0.08 ? 3 : Math.random() < 0.25 ? 2 : 1;
        const newDogs = [];
        const zoneW = (GW - DOG_W - 16) / burstCount;
        for (let b = 0; b < burstCount; b += 1) {
          const x = Math.floor(b * zoneW + Math.random() * (zoneW - 8)) + 8;
          newDogs.push({ id: Math.random(), x, y: -DOG_H - 5 - b * 120 });
        }
        dogsRef.current = [...dogsRef.current, ...newDogs];
      }

      const bx = bunXRef.current; const effBunW = bunShrunkRef.current ? BUN_W / 2 : BUN_W;

      // Water
      const waterRate = Math.max(350, 600 - Math.floor(t / 15) * 20);
      if (waterSpawnTick.current >= waterRate) {
        waterSpawnTick.current = 0;
        const wx = Math.floor(Math.random() * (GW - WATER_W - 16)) + 8;
        waterRef.current = [...waterRef.current, { id: Math.random(), x: wx, y: -WATER_H - 5 }];
      }
      const survW = [];
      for (const w of waterRef.current) {
        const ny = w.y + WATER_SPEED;
        if (ny + WATER_H >= BUN_Y + 4 && ny <= BUN_Y + 32 && w.x + WATER_W > bx + 6 && w.x < bx + effBunW - 6) {
          sessionStatsRef.current.waterHits += 1;
          bunShrunkRef.current = true;
          setBunShrunk(true);
          if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
          shrinkTimerRef.current = setTimeout(() => { bunShrunkRef.current = false; setBunShrunk(false); }, WATER_DURATION);
          addPopup('💧', w.x + WATER_W / 2, BUN_Y - 30);
          scream('SOAKED!');
          continue;
        }
        if (ny <= GH) survW.push({ ...w, y: ny });
      }
      waterRef.current = survW;
      setRenderWater([...survW]);

      // Condiments
      const condRate = Math.max(180, 420 - Math.floor(t / 10) * 15);
      if (condSpawnTick.current >= condRate) {
        condSpawnTick.current = 0;
        const kind = Math.random() < 0.5 ? 'ketchup' : 'mustard';
        const cx = Math.floor(Math.random() * (GW - CONDIMENT_W - 16)) + 8;
        condimentsRef.current = [...condimentsRef.current, { id: Math.random(), x: cx, y: -CONDIMENT_H - 5, kind }];
      }
      let condBonus = 0;
      const survC = [];
      for (const c of condimentsRef.current) {
        const ny = c.y + CONDIMENT_SPEED;
        if (ny + CONDIMENT_H >= BUN_Y + 4 && ny <= BUN_Y + 32 && c.x + CONDIMENT_W > bx + 6 && c.x < bx + effBunW - 6) {
          condBonus += CONDIMENT_PTS;
          sessionStatsRef.current.condis += 1;
          addPopup(c.kind === 'ketchup' ? 'K +25' : 'M +25', c.x + CONDIMENT_W / 2, BUN_Y - 30);
          scream('BONUS POINTS!');
          continue;
        }
        if (ny <= GH) survC.push({ ...c, y: ny });
      }
      condimentsRef.current = survC;
      if (condBonus > 0) { scoreRef.current += condBonus; setScore(scoreRef.current); }
      setRenderCondiments([...survC]);

      // Chili
      const jalaRate = Math.max(400, 700 - Math.floor(t / 15) * 20);
      if (jalaSpawnTick.current >= jalaRate) {
        jalaSpawnTick.current = 0;
        const jx = Math.floor(Math.random() * (GW - JALAP_W - 16)) + 8;
        jalaRef.current = [...jalaRef.current, { id: Math.random(), x: jx, y: -JALAP_H - 5 }];
      }
      const survJ = [];
      for (const j of jalaRef.current) {
        const ny = j.y + JALAP_SPEED;
        if (ny + JALAP_H >= BUN_Y + 4 && ny <= BUN_Y + 32 && j.x + JALAP_W > bx + 6 && j.x < bx + effBunW - 6) {
          if (steamTimerRef.current) clearTimeout(steamTimerRef.current);
          setSteamActive(true);
          steamTimerRef.current = setTimeout(() => {
            setSteamActive(false);
          }, STEAM_DURATION);
          addPopup('🌶️', j.x + JALAP_W / 2, BUN_Y - 30);
          setShake(true);
          setTimeout(() => setShake(false), 500);
          continue;
        }
        if (ny > GH) { sessionStatsRef.current.chiliDodged += 1; continue; }
        survJ.push({ ...j, y: ny });
      }
      jalaRef.current = survJ;
      setRenderJala([...survJ]);

      // Dogs
      const splatsList = [];
      const survD = [];
      let caught = 0; let missed = 0;
      for (const d of dogsRef.current) {
        const ny = d.y + speed;
        if (ny + DOG_H >= BUN_Y + 4 && ny <= BUN_Y + 32 && d.x + DOG_W > bx + 6 && d.x < bx + effBunW - 6) caught += 1;
        else if (ny > GH) { splatsList.push({ id: d.id + 's', x: d.x + DOG_W / 2, y: GH - 16 }); missed += 1; }
        else survD.push({ ...d, y: ny });
      }
      dogsRef.current = survD;
      if (caught > 0) {
        sessionStatsRef.current.caught += caught;
        comboRef.current += caught;
        if (comboRef.current > sessionStatsRef.current.maxCombo) sessionStatsRef.current.maxCombo = comboRef.current;
        const mult = comboRef.current >= 5 ? 3 : comboRef.current >= 3 ? 2 : 1;
        scoreRef.current += caught * POINTS_PER_CATCH * mult;
        setScore(scoreRef.current);
        setCombo(comboRef.current);
      }
      if (missed > 0) {
        sessionStatsRef.current.missed += missed;
        comboRef.current = 0;
        setCombo(0);
        livesRef.current = Math.max(0, livesRef.current - missed);
        setLives(livesRef.current);
        if (splatsList.length) setSplats(prev => [...prev.slice(-7), ...splatsList]);
        setShake(true);
        setTimeout(() => setShake(false), 380);
        if (livesRef.current <= 0) {
          setScreen('dead');
          saveScore(scoreRef.current);
          const stats = { ...sessionStatsRef.current, score: scoreRef.current };
          const newAch = [];
          for (const a of ACHIEVEMENTS) {
            if (!unlockedAchsRef.current.has(a.id) && a.check(stats)) {
              unlockedAchsRef.current.add(a.id);
              newAch.push(a);
            }
          }
          if (newAch.length) {
            setUnlockedAchs(new Set(unlockedAchsRef.current));
            storageLargeSet('costco:achievements', Array.from(unlockedAchsRef.current));
          }
          return;
        }
      }
      setRenderDogs([...survD]);
      animFrameId = requestAnimationFrame(gameLoop);
    };
    animFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [screen, saveScore, addPopup, scream]);

  const showBoard = async () => { await loadLeaderboard(); setScreen('board'); };
  const isNewPB = score > 0 && score >= personalBest;

  if (screen === 'auth') {
    return renderFramed((
      <View style={styles.screenContainer}>
        <Text style={styles.titleIcon}>🌭</Text>
        <Text style={styles.title}>🌭 COSTCO DOGS</Text>
        <View style={styles.nameBox}>
          <Text style={styles.namePrompt}>{authMode === 'login' ? 'Log In' : 'Create Account'}</Text>
          {authMode === 'login' ? (
            <TextInput style={styles.nameInput} placeholder="Username or Email" value={authIdentifier} onChangeText={(t) => { setAuthIdentifier(t); setAuthError(''); }} autoCapitalize="none" autoCorrect={false} autoFocus />
          ) : (
            <>
              <TextInput style={styles.nameInput} placeholder="Username" value={signupUsername} onChangeText={(t) => { setSignupUsername(t); setAuthError(''); }} autoCapitalize="none" autoCorrect={false} autoFocus />
              <TextInput style={styles.nameInput} placeholder="Email" value={authEmail} onChangeText={(t) => { setAuthEmail(t); setAuthError(''); }} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
            </>
          )}
          <TextInput style={styles.nameInput} placeholder="Password" value={authPassword} onChangeText={(t) => { setAuthPassword(t); setAuthError(''); }} secureTextEntry />
          {authError && <Text style={styles.errorText}>{authError}</Text>}
          <Pressable style={styles.button} onPress={handleAuth}><Text style={styles.buttonText}>{authMode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}</Text></Pressable>
          <Pressable style={[styles.button, styles.buttonSecondary]} onPress={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>{authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}</Text>
          </Pressable>
        </View>
      </View>
    ));
  }

  if (screen === 'idle') {
    return renderFramed((
      <View style={styles.screenContainer}>
        <Text style={[styles.titleIcon, { fontSize: 72 }]}>🌭</Text>
        <Text style={styles.title}>COSTCO DOGS</Text>
        <View style={styles.infoBox}>
          <Text style={styles.greeting}>Hey {username}!</Text>
          <Text style={styles.subGreeting}>{accountEmail}</Text>
          <View style={styles.buttonColumn}>
            <Pressable style={[styles.button, styles.buttonFull]} onPress={() => setScreen('rules')}><Text style={styles.buttonText}>🌭 PLAY</Text></Pressable>
            <Pressable style={[styles.button, styles.buttonSecondary, styles.buttonFull]} onPress={showBoard}><Text style={[styles.buttonText, styles.buttonTextSecondary]}>🏆 BOARD</Text></Pressable>
            <Pressable style={[styles.button, styles.buttonSecondary, styles.buttonFull]} onPress={() => setScreen('awards')}><Text style={[styles.buttonText, styles.buttonTextSecondary]}>🏅 AWARDS</Text></Pressable>
            <Pressable style={[styles.button, styles.buttonSecondary, styles.buttonFull]} onPress={handleLogout}><Text style={[styles.buttonText, styles.buttonTextSecondary]}>🚪 LOG OUT</Text></Pressable>
          </View>
        </View>
      </View>
    ));
  }

  if (screen === 'rules') {
    return renderFramed((
      <View style={[styles.screenContainer, { justifyContent: 'flex-start', paddingTop: 32 }]}>
        <Text style={styles.title}>📜 HOW TO PLAY</Text>
        <View style={styles.rulesBox}>
          <View style={styles.ruleRow}><Text style={styles.ruleIcon}>👆</Text><Text style={styles.ruleText}>Drag your finger to move the bun.</Text></View>
          <View style={styles.ruleRow}><Text style={styles.ruleText}>Catch hot dogs for points and combos. Missing one costs 10 points!</Text></View>
          <View style={styles.ruleRow}><Text style={styles.ruleIcon}>🎯</Text><Text style={styles.ruleText}>You get 3 hot dog lives 🌭🌭🌭 — miss a dog, lose a life. Speed increases over time!</Text></View>
          <View style={styles.ruleRow}><Svg width="24" height="32" viewBox="0 0 24 32"><Rect x="4" y="2" width="16" height="24" rx="3" fill="#cc1a1a" /><Rect x="6" y="6" width="12" height="8" rx="1" fill="#f7b1b1" opacity="0.9" /><Ellipse cx="12" cy="28" rx="8" ry="3" fill="#a82020" /><Path d="M 10 1 L 14 1 L 14 2 L 10 2 Z" fill="#3b2200" /></Svg><Text style={styles.ruleText}>Ketchup bottle gives +25 bonus points.</Text></View>
          <View style={styles.ruleRow}><Svg width="24" height="32" viewBox="0 0 24 32"><Rect x="4" y="2" width="16" height="24" rx="3" fill="#f5c800" /><Rect x="6" y="6" width="12" height="8" rx="1" fill="#fff1a8" opacity="0.9" /><Ellipse cx="12" cy="28" rx="8" ry="3" fill="#b8860b" /><Path d="M 10 1 L 14 1 L 14 2 L 10 2 Z" fill="#3b2200" /></Svg><Text style={styles.ruleText}>Mustard bottle gives +25 bonus points.</Text></View>
          <View style={styles.ruleRow}><Text style={styles.ruleIcon}>💧</Text><Text style={styles.ruleText}>Water shrinks your bun for a few seconds.</Text></View>
          <View style={styles.ruleRow}><Text style={styles.ruleIcon}>🌶️</Text><Text style={styles.ruleText}>Chili peppers make your bun steam — no lives lost!</Text></View>
        </View>
        <View style={styles.buttonColumn}>
          <Pressable style={[styles.button, styles.buttonFull]} onPress={startGame}><Text style={styles.buttonText}>START GAME</Text></Pressable>
          <Pressable style={[styles.button, styles.buttonSecondary, styles.buttonFull]} onPress={() => setScreen('idle')}><Text style={[styles.buttonText, styles.buttonTextSecondary]}>← BACK</Text></Pressable>
        </View>
      </View>
    ));
  }

  if (screen === 'playing' || screen === 'dead') {
    return renderFramed((
      <View style={styles.gameContainer}>
        <View style={styles.statsBar}>
          <Text style={styles.stat}>⬆️ {score}</Text>
          <Text style={styles.stat}>{'🌭'.repeat(lives)}</Text>
          <Text style={styles.stat}>PB: {personalBest}</Text>
        </View>
        <View
          style={[styles.arena, shake && styles.arenaShake]}
          onLayout={(e) => setArenaWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => moveBunToArenaX(e.nativeEvent.locationX)}
          onResponderMove={(e) => moveBunToArenaX(e.nativeEvent.locationX)}
        >
          <Svg width="100%" height="100%" viewBox={`0 0 ${GW} ${GH}`}>
            {splats.map(s => <Splat key={s.id} x={s.x} y={s.y} />)}
            {renderDogs.map(d => <HotDog key={d.id} x={d.x} y={d.y} />)}
            {renderJala.map(j => <ChiliDrop key={j.id} x={j.x} y={j.y} />)}
            {screen === 'playing' && <Bun x={bunX} shrunk={bunShrunk} />}
            {renderWater.map(w => <WaterDrop key={w.id} x={w.x} y={w.y} />)}
            {popups.map(p => <SvgText key={p.id} x={p.x} y={p.y} textAnchor="middle" fontSize="20" fill="#f5d020">{p.text}</SvgText>)}
            {combo >= 3 && screen === 'playing' && <SvgText x={GW - 40} y={20} fontSize="16" fill="#f5d020">🔥x{combo}</SvgText>}
          </Svg>
          {steamActive && (
            <View pointerEvents="none" style={styles.fogOverlay}>
              <View style={[styles.steamPuff, { left: '8%', top: '10%' }]} />
              <View style={[styles.steamPuff, styles.steamPuffLarge, { left: '32%', top: '18%' }]} />
              <View style={[styles.steamPuff, { left: '62%', top: '12%' }]} />
              <View style={[styles.steamPuff, styles.steamPuffLarge, { left: '16%', top: '44%' }]} />
              <View style={[styles.steamPuff, { left: '48%', top: '40%' }]} />
              <View style={[styles.steamPuff, styles.steamPuffLarge, { left: '70%', top: '56%' }]} />
              <View style={[styles.steamPuff, { left: '24%', top: '70%' }]} />
              <View style={[styles.steamPuff, { left: '58%', top: '74%' }]} />
            </View>
          )}
        </View>
        {screen === 'playing' && !!screamText && (
          <View pointerEvents="none" style={styles.screamWrap}>
            <Text style={styles.screamText}>{screamText}</Text>
          </View>
        )}
        {screen === 'dead' && (
          <View style={styles.overlay}>
            <Text style={styles.gameOverText}>GAME OVER</Text>
            <Text style={styles.scoreText}>Score: {score}</Text>
            {isNewPB && <Text style={styles.newPBText}>🏆 NEW PB!</Text>}
            <View style={styles.buttonColumn}>
              <Pressable style={[styles.button, styles.buttonFull]} onPress={startGame}><Text style={styles.buttonText}>PLAY AGAIN</Text></Pressable>
              <Pressable style={[styles.button, styles.buttonSecondary, styles.buttonFull]} onPress={() => setScreen('idle')}><Text style={[styles.buttonText, styles.buttonTextSecondary]}>← BACK</Text></Pressable>
              <Pressable style={[styles.button, styles.buttonSecondary, styles.buttonFull]} onPress={showBoard}><Text style={[styles.buttonText, styles.buttonTextSecondary]}>🏅 AWARDS</Text></Pressable>
            </View>
          </View>
        )}
      </View>
    ));
  }

  if (screen === 'board') {
    return renderFramed((
      <View style={styles.screenContainer}>
        <Text style={styles.titleIcon}>🌭</Text>
        <Text style={styles.title}>🏆 LEADERBOARD</Text>
        <ScrollView style={styles.leaderboard}>{boardLoading ? <Text style={styles.loadingText}>Loading...</Text> : leaderboard.length === 0 ? <Text style={styles.loadingText}>No scores yet!</Text> : leaderboard.map((e, i) => <View key={e.name} style={styles.leaderboardRow}><Text style={styles.leaderboardRank}>{i + 1}</Text><Text style={[styles.leaderboardName, e.name === username && styles.leaderboardMe]}>{e.name}</Text><Text style={styles.leaderboardScore}>{e.score}</Text></View>)}</ScrollView>
        <Pressable style={styles.button} onPress={() => setScreen('idle')}><Text style={styles.buttonText}>← BACK</Text></Pressable>
      </View>
    ));
  }

  if (screen === 'awards') {
    return renderFramed((
      <View style={styles.screenContainer}>
        <Text style={styles.titleIcon}>🌭</Text>
        <Text style={styles.title}>🏅 AWARDS</Text>
        <Text style={styles.achCount}>{unlockedAchs.size}/{ACHIEVEMENTS.length} unlocked</Text>
        <ScrollView style={styles.achievementsList}>{ACHIEVEMENTS.map(a => <View key={a.id} style={[styles.achievementItem, unlockedAchs.has(a.id) && styles.achievementEarned]}><Text style={styles.achName}>{a.name}</Text><Text style={styles.achDesc}>{unlockedAchs.has(a.id) ? a.desc : '???'}</Text>{unlockedAchs.has(a.id) && <Text style={styles.achBadge}>✓</Text>}</View>)}</ScrollView>
        <Pressable style={styles.button} onPress={() => setScreen('idle')}><Text style={styles.buttonText}>← BACK</Text></Pressable>
      </View>
    ));
  }

  return null;
}

const styles = StyleSheet.create({
  appOuter: { flex: 1, backgroundColor: '#120800' },
  appShell: { flex: 1, margin: 6, borderColor: '#7a3800', borderWidth: 3, borderRadius: 14, overflow: 'hidden', backgroundColor: '#120800' },
  screenContainer: { flex: 1, backgroundColor: '#120800', alignItems: 'center', justifyContent: 'center', padding: 16 },
  titleIcon: { fontSize: 58, marginBottom: 4 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#f5d020', marginBottom: 20 },
  nameBox: { width: '90%', backgroundColor: '#1e0c00', borderColor: '#7a3800', borderWidth: 2, borderRadius: 18, padding: 28 },
  namePrompt: { fontSize: 24, color: '#f5d020', marginBottom: 12, textAlign: 'center' },
  nameInput: { borderColor: '#7a3800', borderWidth: 2, borderRadius: 10, padding: 12, fontSize: 18, color: '#f5d020', backgroundColor: '#0d0500', marginBottom: 12, textAlign: 'center' },
  errorText: { color: '#ff6644', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  infoBox: { width: '90%', backgroundColor: '#1e0c00', borderColor: '#7a3800', borderWidth: 2, borderRadius: 18, padding: 20 },
  rulesBox: { width: '92%', backgroundColor: '#1e0c00', borderColor: '#7a3800', borderWidth: 2, borderRadius: 18, padding: 18, marginBottom: 12 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  ruleIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  ruleBottle: { width: 18, height: 24, borderRadius: 5, marginTop: 1, marginLeft: 5, position: 'relative' },
  ruleBottleCap: { position: 'absolute', top: -5, left: 5, width: 8, height: 6, borderRadius: 2, backgroundColor: '#3b2200' },
  ruleBottleKetchup: { backgroundColor: '#cc1a1a', borderColor: '#8b0000', borderWidth: 1 },
  ruleBottleMustard: { backgroundColor: '#f5c800', borderColor: '#b8860b', borderWidth: 1 },
  ruleText: { flex: 1, fontSize: 17, color: '#f5d020', lineHeight: 24 },
  greeting: { fontSize: 22, color: '#f5d020', marginBottom: 12, textAlign: 'center' },
  subGreeting: { fontSize: 13, color: '#c99252', marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: '#f5d020', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 50, alignItems: 'center', marginVertical: 8 },
  buttonSecondary: { backgroundColor: '#2a1000', borderColor: '#5a2800', borderWidth: 2 },
  buttonText: { color: '#1a0a00', fontSize: 16, fontWeight: 'bold' },
  buttonTextSecondary: { color: '#ffffff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  buttonColumn: { flexDirection: 'column', alignItems: 'stretch', width: '100%', gap: 4 },
  buttonFull: { width: '100%' },
  gameContainer: { flex: 1, backgroundColor: '#120800', alignItems: 'center', justifyContent: 'flex-start', padding: 6 },
  statsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '95%', backgroundColor: '#1e0c00', borderColor: '#5a2800', borderWidth: 2, borderRadius: 12, padding: 8, marginBottom: 8 },
  stat: { color: '#f5d020', fontSize: 16, fontWeight: 'bold' },
  livesContainer: { flexDirection: 'row', gap: 4 },
  arena: { flex: 1, width: '100%', backgroundColor: '#0a0300', borderColor: '#5a2800', borderWidth: 3, borderRadius: 16, overflow: 'hidden' },
  arenaShake: { transform: [{ translateX: 7 }] },
  fogOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(226,226,226,0.56)' },
  steamPuff: { position: 'absolute', width: 110, height: 80, borderRadius: 55, backgroundColor: 'rgba(235,235,235,0.34)' },
  steamPuffLarge: { width: 150, height: 100, borderRadius: 75, backgroundColor: 'rgba(240,240,240,0.40)' },
  screamWrap: { position: 'absolute', top: 72, left: 0, right: 0, alignItems: 'center' },
  screamText: { fontSize: 30, fontWeight: 'bold', color: '#f5d020', backgroundColor: 'rgba(10,3,0,0.85)', borderColor: '#f5d020', borderWidth: 2, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center' },
  gameOverText: { fontSize: 30, color: '#ff4444', marginBottom: 12, fontWeight: 'bold' },
  scoreText: { fontSize: 24, color: '#f5d020', marginBottom: 12, fontWeight: 'bold' },
  newPBText: { fontSize: 16, color: '#f5d020', marginBottom: 12, backgroundColor: '#3d1a00', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderColor: '#f5d020', borderWidth: 1 },
  leaderboard: { width: '90%', backgroundColor: '#1e0c00', borderColor: '#7a3800', borderWidth: 2, borderRadius: 12, maxHeight: 400 },
  leaderboardRow: { flexDirection: 'row', padding: 10, borderBottomColor: '#2e1200', borderBottomWidth: 1, alignItems: 'center' },
  leaderboardRank: { fontSize: 16, color: '#f5d020', minWidth: 30, marginRight: 10 },
  leaderboardName: { flex: 1, fontSize: 16, color: '#ddb070' },
  leaderboardMe: { color: '#f5d020', fontWeight: 'bold' },
  leaderboardScore: { fontSize: 16, color: '#f5d020', fontWeight: 'bold', minWidth: 60, textAlign: 'right' },
  loadingText: { color: '#a06030', textAlign: 'center', padding: 20, fontSize: 16 },
  achCount: { fontSize: 13, color: '#a06030', marginBottom: 8 },
  achievementsList: { width: '90%', maxHeight: 400 },
  achievementItem: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: '#2a1200', borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  achievementEarned: { backgroundColor: 'rgba(245,208,32,0.06)', borderColor: '#5a3800' },
  achName: { fontSize: 13, color: '#4a2810', fontWeight: 'bold' },
  achDesc: { fontSize: 11, color: '#3a1808', marginTop: 3 },
  achBadge: { fontSize: 14, color: '#5a8020', marginTop: 3 },
});
