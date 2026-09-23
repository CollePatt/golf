import GolfHoleCanvas from './GolfHoleCanvas.jsx'
import {
  HOLES_PER_ROUND,
  formatScoreToPar,
  getCompletedHoles,
  getScoreToPar,
  parForHole,
} from '../logic/gameState.js';

export default function HoleScreen({ state, onSwing, yardsPerSwing }) {
  const {
    hole,
    targetDistance,
    yardsThisHole,
    currentHoleShots,
    ballsLeft,
    totalShots,
    totalYardsThisRound,
    scorecard,
  } = state;
  const remaining = Math.max(0, targetDistance - yardsThisHole);
  const completedHoles = getCompletedHoles(scorecard);
  const scoreToPar = getScoreToPar(scorecard);

  return (
    <div className="screen">
      <h2>Hole {hole} / {HOLES_PER_ROUND}</h2>
      <GolfHoleCanvas yardsThisRun={yardsThisHole} targetDistance={targetDistance} />
      <div className="stats">
        <p className="stat">Target: <strong>{targetDistance} yds</strong></p>
        <p className="stat">Par: <strong>{parForHole(hole)}</strong></p>
        <p className="stat">Yards this hole: <strong>{yardsThisHole}</strong></p>
        <p className="stat">Remaining: <strong>{remaining} yds</strong></p>
        <p className="stat">Balls left: <strong>{ballsLeft}</strong></p>
        <p className="stat">Shots this hole: <strong>{currentHoleShots}</strong></p>
        <p className="stat">Shots this round: <strong>{totalShots}</strong></p>
        <p className="stat">Score: <strong>{formatScoreToPar(scoreToPar)}</strong></p>
        <p className="stat">Yards earned: <strong>{totalYardsThisRound}</strong></p>
      </div>
      <div className="scorecard-grid" aria-label="Round scorecard">
        {scorecard.map(entry => {
          const isCurrent = entry.hole === hole;
          const isComplete = Number.isFinite(entry.shots);
          return (
            <div
              key={entry.hole}
              className={`scorecard-cell ${isCurrent ? 'current' : ''} ${isComplete ? 'complete' : ''}`}
            >
              <span>{entry.hole}</span>
              <strong>{isComplete ? formatScoreToPar(entry.scoreToPar) : '-'}</strong>
            </div>
          );
        })}
      </div>
      <p className="hint">{completedHoles.length} holes scored this round.</p>
      <p className="hint">Each swing: +{yardsPerSwing} yards</p>
      <button className="swing-btn" onClick={onSwing}>
        Swing
      </button>
    </div>
  );
}
