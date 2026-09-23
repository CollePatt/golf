import { getUpgradeCost } from '../data/upgrades.js';

export default function UpgradeBar({ upgrade, upgradeState, yardsToAllocate, onAllocate }) {
  const { level, progress } = upgradeState;
  const maxed = level >= upgrade.maxLevel;
  const nextCost = getUpgradeCost(upgrade, level);
  const pct = maxed ? 100 : Math.min(100, (progress / nextCost) * 100);
  const canInvest = !maxed && yardsToAllocate > 0;

  return (
    <div className={`upgrade-card ${maxed ? 'unlocked' : ''}`}>
      <div className="upgrade-header">
        <span className="upgrade-label">
          {upgrade.label} <small>Lv {level}{upgrade.maxLevel > 1 ? ` / ${upgrade.maxLevel}` : ''}</small>
        </span>
        <span className="upgrade-status">
          {maxed ? 'MAX' : `${progress} / ${nextCost} yds`}
        </span>
      </div>
      <p className="upgrade-desc">{upgrade.description}</p>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <button
        className="allocate-btn"
        onClick={() => onAllocate(upgrade.id)}
        disabled={!canInvest}
      >
        {maxed ? 'Maxed' : 'Invest Yards'}
      </button>
    </div>
  );
}
