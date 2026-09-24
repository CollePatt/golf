import { UPGRADES } from '../data/upgrades.js';
import { formatScoreToPar, getCompletedHoles, getScoreToPar } from '../logic/gameState.js';
import RoundRecap from './RoundRecap.jsx';
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

  const heading = state.phase === 'run'
    ? 'Upgrades'
    : roundResult === 'complete'
    ? 'Round Complete!'
    : 'Out of Balls';
  const subheading = state.phase === 'run'
    ? 'Finish the current round to spend earned yards.'
    : roundResult === 'complete'
    ? `All 18 holes in ${totalShots} shots.`
    : `Reached hole ${hole} in ${totalShots} shots.`;
  const completedHoles = getCompletedHoles(scorecard);
  const scoreToPar = getScoreToPar(scorecard);

  return (
    <div className="screen">
      <h2>{heading}</h2>
      <p className="hint">{subheading}</p>
      {state.recentAchievements.length > 0 && (
        <div className="achievement-callout">
          <span>New Milestones</span>
          <strong>{state.recentAchievements.length} achievement reward{state.recentAchievements.length > 1 ? 's' : ''} added.</strong>
        </div>
      )}
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

      {state.phase === 'upgrade' && <RoundRecap scorecard={scorecard} />}

      <h3>Upgrades</h3>
      <p className="hint">
        {state.phase === 'upgrade'
          ? 'Choose how much of your remaining yards to invest.'
          : 'Upgrade spending unlocks after the current round ends.'}
      </p>

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

      {state.phase === 'upgrade' && (
        <button className="next-btn" onClick={onStartNextRound}>
          Start New Round
        </button>
      )}
    </div>
  );
}
