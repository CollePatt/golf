import { ACHIEVEMENTS, getUnlockedAchievementCount } from '../data/achievements.js';

export default function AchievementsPanel({ state }) {
  const unlockedCount = getUnlockedAchievementCount(state.achievements);
  const { lifetimeStats } = state;

  return (
    <div className="screen">
      <div className="screen-heading">
        <div>
          <h2>Achievements</h2>
          <p className="hint">Milestones add bonus yards and give the long game some shape.</p>
        </div>
        <div className="summary-pill">
          <span>Unlocked</span>
          <strong>{unlockedCount} / {ACHIEVEMENTS.length}</strong>
        </div>
      </div>

      <div className="summary-grid lifetime-grid">
        <div className="summary-tile">
          <span>Lifetime Yards</span>
          <strong>{lifetimeStats.yards}</strong>
        </div>
        <div className="summary-tile">
          <span>Lifetime Swings</span>
          <strong>{lifetimeStats.swings}</strong>
        </div>
        <div className="summary-tile">
          <span>Achievement Yards</span>
          <strong>{lifetimeStats.achievementYards}</strong>
        </div>
      </div>

      <div className="achievement-grid">
        {ACHIEVEMENTS.map(achievement => {
          const unlocked = Boolean(state.achievements[achievement.id]);
          return (
            <article
              key={achievement.id}
              className={`achievement-card ${unlocked ? 'unlocked' : ''}`}
            >
              <div>
                <span>{unlocked ? 'Unlocked' : achievement.progress(state)}</span>
                <h3>{achievement.title}</h3>
              </div>
              <p>{achievement.description}</p>
              <strong>+{achievement.rewardYards} yds</strong>
            </article>
          );
        })}
      </div>
    </div>
  );
}
