import GolfHoleCanvas from './GolfHoleCanvas.jsx'
import { HOLES_PER_ROUND } from '../logic/gameState.js';

export default function HoleScreen({ state, onSwing, yardsPerSwing }) {
  const { hole, targetDistance, yardsThisHole, ballsLeft, totalShots, totalYardsThisRound } = state;
  const remaining = Math.max(0, targetDistance - yardsThisHole);

  return (
    <div className="screen">
      <h2>Hole {hole} / {HOLES_PER_ROUND}</h2>
      <GolfHoleCanvas yardsThisRun={yardsThisHole} targetDistance={targetDistance} />
      <div className="stats">
        <p className="stat">Target: <strong>{targetDistance} yds</strong></p>
        <p className="stat">Yards this hole: <strong>{yardsThisHole}</strong></p>
        <p className="stat">Remaining: <strong>{remaining} yds</strong></p>
        <p className="stat">Balls left: <strong>{ballsLeft}</strong></p>
        <p className="stat">Shots this round: <strong>{totalShots}</strong></p>
        <p className="stat">Yards earned: <strong>{totalYardsThisRound}</strong></p>
      </div>
      <p className="hint">Each swing: +{yardsPerSwing} yards</p>
      <button className="swing-btn" onClick={onSwing}>
        Swing
      </button>
    </div>
  );
}
