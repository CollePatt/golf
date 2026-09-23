import { UPGRADES } from '../data/upgrades.js';
import { formatScoreToPar, getCompletedHoles, getScoreToPar } from '../logic/gameState.js';
import UpgradeBar from './UpgradeBar.jsx';

export default function UpgradeScreen({ state, onAllocate, onStartNextRound }) {
  const {
    roundResult,
    hole,
    totalShots,
    totalYardsThisRound,
    yardsToAllocate,
    upgrades,
    scorecard,
    bestCompletedRound,
  } = state;

  const heading = roundResult === 'complete' ? 'Round Complete!' : 'Out of Balls';
  const subheading = roundResult === 'complete'
    ? `All 18 holes in ${totalShots} shots.`
    : `Reached hole ${hole} in ${totalShots} shots.`;
  const completedHoles = getCompletedHoles(scorecard);
  const scoreToPar = getScoreToPar(scorecard);

  return (
    <div className="screen">
      <h2>{heading}</h2>
      <p className="hint">{subheading}</p>
      <div className="stats">
        <p className="stat">Holes scored: <strong>{completedHoles.length}</strong></p>
        <p className="stat">Score to par: <strong>{formatScoreToPar(scoreToPar)}</strong></p>
        <p className="stat">
          Best completed round:{' '}
          <strong>
            {bestCompletedRound
              ? `${formatScoreToPar(bestCompletedRound.scoreToPar)} (${bestCompletedRound.shots} shots)`
              : 'None yet'}
          </strong>
        </p>
        <p className="stat">Yards earned this round: <strong>{totalYardsThisRound}</strong></p>
        <p className="stat">Yards to spend: <strong>{yardsToAllocate}</strong></p>
      </div>

      <h3>Upgrades</h3>
      <p className="hint">Click an upgrade to invest your remaining yards into it.</p>

      {UPGRADES.map(upgrade => (
        <UpgradeBar
          key={upgrade.id}
          upgrade={upgrade}
          upgradeState={upgrades[upgrade.id]}
          upgrades={upgrades}
          yardsToAllocate={yardsToAllocate}
          onAllocate={onAllocate}
        />
      ))}

      <button className="next-btn" onClick={onStartNextRound}>
        Start New Round
      </button>
    </div>
  );
}
