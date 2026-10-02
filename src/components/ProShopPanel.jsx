import { UPGRADES } from '../data/upgrades.js';
import { getEffectLevels, getYardsEarnedMultiplier } from '../logic/swingLogic.js';
import UpgradeBar from './UpgradeBar.jsx';

export default function ProShopPanel({ state, onAllocate }) {
  const effectLevels = getEffectLevels(state);
  const yardsEarnedMultiplier = getYardsEarnedMultiplier(effectLevels);
  const canSpend = state.phase === 'upgrade';

  return (
    <div className="door-panel">
      <div className="door-panel-head">
        <h2>Pro Shop</h2>
        <div className="yard-purse">
          <span className="label">Yards</span>
          <strong>{state.yardsToAllocate.toLocaleString()}</strong>
        </div>
      </div>
      <p className="hint">
        {canSpend
          ? 'Put your yards into upgrades. Part-paid upgrades keep their progress.'
          : 'Yards from this round can be spent when it ends.'}
        {yardsEarnedMultiplier > 1 && ` Yardage Book pays ×${yardsEarnedMultiplier.toFixed(2)}.`}
      </p>
      {state.recentAchievements.length > 0 && canSpend && (
        <p className="callout">
          {state.recentAchievements.length} new trophy reward{state.recentAchievements.length > 1 ? 's' : ''} added to your yards.
        </p>
      )}
      <div className="upgrade-list">
        {UPGRADES.map(upgrade => (
          <UpgradeBar
            key={upgrade.id}
            upgrade={upgrade}
            upgradeState={state.upgrades[upgrade.id]}
            upgrades={effectLevels}
            yardsToAllocate={state.yardsToAllocate}
            onAllocate={onAllocate}
          />
        ))}
      </div>
    </div>
  );
}
