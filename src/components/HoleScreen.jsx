import GolfHoleCanvas from './GolfHoleCanvas.jsx'
import {
  HOLES_PER_ROUND,
  formatScoreToPar,
  getCompletedHoles,
  getScoreToPar,
  parForHole,
} from '../logic/gameState.js';
import { formatAutoSwingInterval } from '../logic/swingLogic.js';

export default function HoleScreen({
  state,
  onSwing,
  onToggleAutoSwing,
  yardsPerSwing,
  autoSwingIntervalMs,
}) {
  const {
    hole,
    targetDistance,
    yardsThisHole,
    currentHoleShots,
    ballsLeft,
    totalShots,
    totalYardsThisRound,
    scorecard,
    wind,
    lastSwing,
    autoSwingEnabled,
  } = state;
  const remaining = Math.max(0, targetDistance - yardsThisHole);
  const completedHoles = getCompletedHoles(scorecard);
  const scoreToPar = getScoreToPar(scorecard);

  return (
    <div className="screen">
      <div className="screen-heading">
        <div>
          <h2>Hole {hole} / {HOLES_PER_ROUND}</h2>
          <p className="hint">Clear {remaining} more yards to reach the next tee.</p>
        </div>
        <div className="score-popover-anchor" tabIndex={0}>
          <div className="summary-pill">
            <span>Score</span>
            <strong>{formatScoreToPar(scoreToPar)}</strong>
          </div>
          <div className="scorecard-popover" aria-hidden="true">
            <div className="scorecard-grid compact" aria-label="Round scorecard preview">
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
          </div>
        </div>
      </div>

      <div className="hole-layout">
        <div className="hole-main">
          <GolfHoleCanvas yardsThisRun={yardsThisHole} targetDistance={targetDistance} />
          <div className="swing-panel">
            <div>
              <span>Expected Swing</span>
              <strong>{yardsPerSwing} yds</strong>
              {lastSwing && <p>Last: {lastSwing.yards} yds ({lastSwing.quality})</p>}
            </div>
            <button className="swing-btn" onClick={onSwing}>
              Swing
            </button>
          </div>
          <div className={`auto-swing-panel ${autoSwingIntervalMs ? 'unlocked' : ''}`}>
            <div>
              <span>Auto Caddie</span>
              <strong>{autoSwingIntervalMs ? `${formatAutoSwingInterval(autoSwingIntervalMs)} / swing` : 'Locked'}</strong>
            </div>
            <button
              className="toggle-btn"
              onClick={onToggleAutoSwing}
              disabled={!autoSwingIntervalMs}
              aria-pressed={autoSwingEnabled}
            >
              {autoSwingEnabled && autoSwingIntervalMs ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <aside className="hole-sidebar" aria-label="Round status">
          <div className="stats">
            <p className="stat">Target: <strong>{targetDistance} yds</strong></p>
            <p className="stat">Par: <strong>{parForHole(hole)}</strong></p>
            <p className="stat">Yards this hole: <strong>{yardsThisHole}</strong></p>
            <p className="stat">Remaining: <strong>{remaining} yds</strong></p>
            <p className="stat">Balls left: <strong>{ballsLeft}</strong></p>
            <p className="stat">Shots this hole: <strong>{currentHoleShots}</strong></p>
            <p className="stat">Shots this round: <strong>{totalShots}</strong></p>
            <p className="stat">Holes scored: <strong>{completedHoles.length}</strong></p>
            <p className="stat">Yards earned: <strong>{totalYardsThisRound}</strong></p>
          </div>
          <div className="round-modifier">
            <div>
              <span>Wind</span>
              <strong>{wind.label}</strong>
            </div>
            <p>{wind.description}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
