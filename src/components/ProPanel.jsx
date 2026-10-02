import { useState } from 'react';
import { getCourseById } from '../data/courses.js';
import { PRO_UPGRADES, getProUpgradeCost } from '../data/proUpgrades.js';
import {
  canTurnPro,
  getMissingProChainCourses,
  getPendingPrestigePoints,
  getPrestigeBreakdown,
} from '../logic/prestigeLogic.js';

export default function ProPanel({ state, onTurnPro, onBuyProUpgrade }) {
  const [confirming, setConfirming] = useState(false);
  const { prestige } = state;
  const ready = canTurnPro(state);
  const pending = getPendingPrestigePoints(state);
  const breakdown = getPrestigeBreakdown(state);
  const missing = getMissingProChainCourses(state);

  function handleTurnProClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onTurnPro();
  }

  return (
    <div className="door-panel">
      <div className="screen-heading">
        <div>
          <h2>Pro Tour</h2>
          <p className="hint">
            Clear every tour course, then turn pro. Fewer shots mean more Pro Points.
            Turning pro resets yard upgrades and course progress; Pro upgrades stay forever.
          </p>
        </div>
        <div className="summary-pill pro-pill">
          <span>Pro Points</span>
          <strong>{prestige.points}</strong>
        </div>
      </div>

      {state.lastProResult && (
        <div className="achievement-callout pro-callout">
          <span>Turned Pro #{state.lastProResult.count}</span>
          <strong>Banked {state.lastProResult.earned} Pro Points. Spend them below, then tee off.</strong>
        </div>
      )}

      <div className="summary-grid">
        <div className="summary-tile">
          <span>Times Turned Pro</span>
          <strong>{prestige.count}</strong>
        </div>
        <div className="summary-tile">
          <span>Lifetime Pro Points</span>
          <strong>{prestige.totalEarned}</strong>
        </div>
        <div className="summary-tile">
          <span>Points If You Turn Pro</span>
          <strong>{ready ? `+${pending}` : '-'}</strong>
        </div>
      </div>

      <section className="pro-turn-panel" aria-labelledby="turn-pro-title">
        <h3 id="turn-pro-title">Turn Pro</h3>
        {breakdown.length > 0 ? (
          <div className="recap-table-wrap">
            <table className="recap-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Best Shots</th>
                  <th>Par</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map(entry => (
                  <tr key={entry.courseId}>
                    <td>{entry.name}</td>
                    <td>{entry.shots}</td>
                    <td>{entry.par}</td>
                    <td>{entry.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-recap">No courses cleared this cycle yet.</p>
        )}
        {!ready && (
          <p className="hint">
            Still to clear: {missing.map(courseId => getCourseById(courseId).name).join(', ')}.
          </p>
        )}
        <div className="round-start-actions">
          <button
            type="button"
            className={`next-btn pro-btn ${confirming ? 'confirming' : ''}`}
            onClick={handleTurnProClick}
            disabled={!ready}
          >
            {confirming ? `Confirm: reset for +${pending} Pro Points` : 'Turn Pro'}
          </button>
          {confirming && (
            <button type="button" className="secondary-btn" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          )}
        </div>
      </section>

      <h3>Pro Upgrades</h3>
      <p className="hint">Bought with Pro Points. These never reset.</p>
      <div className="pro-upgrade-grid">
        {PRO_UPGRADES.map(upgrade => {
          const level = prestige.upgrades[upgrade.id]?.level ?? 0;
          const maxed = level >= upgrade.maxLevel;
          const cost = getProUpgradeCost(upgrade, level);
          const affordable = !maxed && prestige.points >= cost;
          return (
            <div key={upgrade.id} className={`upgrade-card pro-upgrade ${maxed ? 'unlocked' : ''}`}>
              <div className="upgrade-header">
                <span className="upgrade-label">
                  {upgrade.label} <small>Lv {level} / {upgrade.maxLevel}</small>
                </span>
                <span className="upgrade-status">{maxed ? 'MAX' : `${cost} pts`}</span>
              </div>
              <p className="upgrade-desc">{upgrade.description}</p>
              <button
                type="button"
                className="allocate-btn primary"
                onClick={() => onBuyProUpgrade(upgrade.id)}
                disabled={!affordable}
              >
                {maxed ? 'Maxed' : 'Buy'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
