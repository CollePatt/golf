// Plays simulated Auto Caddie rounds against the game's own logic and prints
// how scores land against par at different power levels.
//   node scripts/simulate-par.mjs [rounds per row]
import { COURSES } from '../src/data/courses.js';
import {
  createInitialState,
  createScorecard,
  getParYardsPerSwing,
  HOLES_PER_ROUND,
  yardsForHole,
} from '../src/logic/gameState.js';
import { playShot } from '../src/logic/holeLogic.js';
import { getCoursePrestigePoints } from '../src/logic/prestigeLogic.js';
import { rollWind } from '../src/logic/runModifiers.js';

const ROUNDS = Number(process.argv[2]) || 200;

// Tier 1 and Pro levels along a typical climb, from a fresh save to the late game.
const PROFILES = [
  { name: 'fresh', t1: {}, pro: {} },
  { name: 'first clear', t1: { betterClub: 8, luckySwing: 2, softLanding: 1, flatStick: 1 }, pro: {} },
  { name: 'late cycle 1', t1: { betterClub: 15, luckySwing: 6, softLanding: 3, caddieRead: 2, flatStick: 3 }, pro: {} },
  { name: 'pro 2', t1: { betterClub: 15, luckySwing: 6, softLanding: 3, caddieRead: 2, flatStick: 3 }, pro: { proClubs: 3 } },
  { name: 'pro 4, no approach upgrades', t1: { betterClub: 15, luckySwing: 10 }, pro: { proClubs: 5 } },
  { name: 'pro 4', t1: { betterClub: 15, luckySwing: 10, softLanding: 8, caddieRead: 8, flatStick: 8 }, pro: { proClubs: 5 } },
];

function withLevels(state, profile) {
  const upgrades = { ...state.upgrades };
  for (const [id, level] of Object.entries(profile.t1)) upgrades[id] = { level, progress: 0 };
  const proUpgrades = { ...state.prestige.upgrades };
  for (const [id, level] of Object.entries(profile.pro)) proUpgrades[id] = { level };
  return { ...state, upgrades, prestige: { ...state.prestige, upgrades: proUpgrades } };
}

function playRound(base, courseId) {
  let s = {
    ...base,
    courseId,
    phase: 'run',
    wind: rollWind(),
    scorecard: createScorecard(courseId, getParYardsPerSwing(base)),
  };
  let shots = 0;
  for (let hole = 1; hole <= HOLES_PER_ROUND; hole += 1) {
    s = { ...s, hole, targetDistance: yardsForHole(hole, courseId), yardsThisHole: 0, lie: 'fairway' };
    for (let guard = 0; guard < 400; guard += 1) {
      const shot = playShot(s, { source: 'auto' });
      shots += shot.strokes;
      if (shot.holeCleared) break;
      s = { ...s, yardsThisHole: shot.yardsThisHole, lie: shot.lie };
    }
  }
  const par = s.scorecard.reduce((total, entry) => total + entry.par, 0);
  return { shots, par };
}

for (const profile of PROFILES) {
  const state = withLevels(createInitialState(), profile);
  console.log(`\n${profile.name}: ${getParYardsPerSwing(state)} yds/swing`);
  for (const course of COURSES) {
    const scores = [];
    let par = 0;
    for (let i = 0; i < ROUNDS; i += 1) {
      const round = playRound(state, course.id);
      par = round.par;
      scores.push(round.shots - round.par);
    }
    scores.sort((a, b) => a - b);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const best = scores[0];
    const pct = p => scores[Math.floor(p * (scores.length - 1))];
    console.log(
      `  ${course.name.padEnd(17)} par ${String(par).padStart(3)}`
        + `  avg ${mean >= 0 ? '+' : ''}${mean.toFixed(1).padStart(5)}`
        + `  p10 ${pct(0.1)}  p90 ${pct(0.9)}  best ${best}`
        + `  PP avg ${getCoursePrestigePoints(course.id, Math.round(mean))} best ${getCoursePrestigePoints(course.id, best)} / ${course.prestigeValue}`
    );
  }
}
