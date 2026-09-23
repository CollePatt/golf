import {
  HOLES_PER_ROUND,
  formatScoreToPar,
  getCompletedHoles,
  getScoreToPar,
} from '../logic/gameState.js';

export default function ScorecardPanel({ state }) {
  const { scorecard, hole, bestCompletedRound, totalShots } = state;
  const completedHoles = getCompletedHoles(scorecard);
  const scoreToPar = getScoreToPar(scorecard);

  return (
    <div className="screen">
      <div className="screen-heading">
        <div>
          <h2>Scorecard</h2>
          <p className="hint">Track the current round without crowding the swing view.</p>
        </div>
        <div className="summary-pill">
          <span>Current</span>
          <strong>{formatScoreToPar(scoreToPar)}</strong>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-tile">
          <span>Holes Cleared</span>
          <strong>{completedHoles.length} / {HOLES_PER_ROUND}</strong>
        </div>
        <div className="summary-tile">
          <span>Shots</span>
          <strong>{totalShots}</strong>
        </div>
        <div className="summary-tile">
          <span>Best Round</span>
          <strong>
            {bestCompletedRound
              ? `${formatScoreToPar(bestCompletedRound.scoreToPar)} (${bestCompletedRound.shots})`
              : 'None'}
          </strong>
        </div>
      </div>

      <div className="scorecard-table-wrap">
        <table className="scorecard-table">
          <thead>
            <tr>
              <th>Hole</th>
              <th>Target</th>
              <th>Par</th>
              <th>Shots</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {scorecard.map(entry => {
              const isCurrent = entry.hole === hole;
              const isComplete = Number.isFinite(entry.shots);
              return (
                <tr key={entry.hole} className={isCurrent ? 'current-row' : ''}>
                  <td>{entry.hole}</td>
                  <td>{entry.targetDistance}</td>
                  <td>{entry.par}</td>
                  <td>{isComplete ? entry.shots : '-'}</td>
                  <td>{isComplete ? formatScoreToPar(entry.scoreToPar) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
