import { formatScoreToPar, getCompletedHoles } from '../logic/gameState.js';

export default function RoundRecap({ scorecard }) {
  const completedHoles = getCompletedHoles(scorecard);

  return (
    <section className="round-recap" aria-labelledby="round-recap-title">
      <h3 id="round-recap-title">Round Recap</h3>
      {completedHoles.length === 0 ? (
        <p className="empty-recap">No holes cleared this round.</p>
      ) : (
        <div className="recap-table-wrap">
          <table className="recap-table">
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
              {completedHoles.map(entry => (
                <tr key={entry.hole}>
                  <td>{entry.hole}</td>
                  <td>{entry.targetDistance}</td>
                  <td>{entry.par}</td>
                  <td>{entry.shots}</td>
                  <td>{formatScoreToPar(entry.scoreToPar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
