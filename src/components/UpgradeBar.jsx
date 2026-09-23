import { getUpgradeCost } from '../data/upgrades.js';
import { getStartingBalls, getYardsPerSwing } from '../logic/swingLogic.js';

function buildPreview(upgrade, upgradeState, upgrades) {
  if (upgradeState.level >= upgrade.maxLevel) return 'Max level reached';

  const nextUpgrades = {
    ...upgrades,
    [upgrade.id]: {
      ...upgradeState,
      level: upgradeState.level + 1,
      progress: 0,
    },
  };

  const currentYards = getYardsPerSwing(upgrades);
  const nextYards = getYardsPerSwing(nextUpgrades);
  const currentBalls = getStartingBalls(upgrades);
  const nextBalls = getStartingBalls(nextUpgrades);
  const changes = [];

  if (nextYards !== currentYards) {
    changes.push(`${currentYards} -> ${nextYards} yds/swing`);
  }
  if (nextBalls !== currentBalls) {
    changes.push(`${currentBalls} -> ${nextBalls} balls`);
  }

  return changes.length ? `Next: ${changes.join(', ')}` : 'Next level improves this upgrade';
}

export default function UpgradeBar({ upgrade, upgradeState, upgrades, yardsToAllocate, onAllocate }) {
  const { level, progress } = upgradeState;
  const maxed = level >= upgrade.maxLevel;
  const nextCost = getUpgradeCost(upgrade, level);
  const pct = maxed ? 100 : Math.min(100, (progress / nextCost) * 100);
  const canInvest = !maxed && yardsToAllocate > 0;
  const tenPercent = Math.max(1, Math.floor(yardsToAllocate * 0.1));
  const half = Math.max(1, Math.floor(yardsToAllocate * 0.5));
  const preview = buildPreview(upgrade, upgradeState, upgrades);

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
      <p className="upgrade-preview">{preview}</p>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="allocate-actions">
        <button
          className="allocate-btn"
          onClick={() => onAllocate(upgrade.id, tenPercent)}
          disabled={!canInvest}
        >
          10%
        </button>
        <button
          className="allocate-btn"
          onClick={() => onAllocate(upgrade.id, half)}
          disabled={!canInvest}
        >
          50%
        </button>
        <button
          className="allocate-btn primary"
          onClick={() => onAllocate(upgrade.id, yardsToAllocate)}
          disabled={!canInvest}
        >
          {maxed ? 'Maxed' : 'All'}
        </button>
      </div>
    </div>
  );
}
