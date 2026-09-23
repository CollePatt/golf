import { UPGRADES } from '../data/upgrades.js';
import UpgradeBar from './UpgradeBar.jsx';

export default function UpgradeScreen({ state, onAllocate, onStartNextRound }) {
  const { roundResult, hole, totalShots, totalYardsThisRound, yardsToAllocate, upgrades } = state;

  const heading = roundResult === 'complete' ? 'Round Complete!' : 'Out of Balls';
  const subheading = roundResult === 'complete'
    ? `All 18 holes in ${totalShots} shots.`
    : `Reached hole ${hole} in ${totalShots} shots.`;

  return (
    <div className="screen">
      <h2>{heading}</h2>
      <p className="hint">{subheading}</p>
      <div className="stats">
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
