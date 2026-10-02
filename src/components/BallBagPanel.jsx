import { BALLS, getBallById, getBallUnlockProgress } from '../data/balls.js';
import { PICKUPS } from '../data/pickups.js';
import SpriteIcon from './SpriteIcon.jsx';

export default function BallBagPanel({ state, onEquipBall }) {
  const equipped = getBallById(state.equippedBall);
  const pickupsByType = state.lifetimeStats.pickupsByType || {};

  return (
    <div className="door-panel">
      <div className="screen-heading">
        <div>
          <h2>Ball Bag</h2>
          <p className="hint">Play one ball at a time. Each trades one strength for another, so match it to the course and your goal.</p>
        </div>
        <div className="summary-pill">
          <span>In Play</span>
          <strong>{equipped.label}</strong>
        </div>
      </div>

      <div className="ball-grid">
        {BALLS.map(ball => {
          const progress = getBallUnlockProgress(ball, state);
          const isEquipped = ball.id === equipped.id;
          return (
            <article
              key={ball.id}
              className={`ball-card ${isEquipped ? 'equipped' : ''} ${progress.unlocked ? '' : 'locked'}`}
            >
              <div className="ball-card-heading">
                <SpriteIcon sheet="balls" tag={ball.id} scale={4} />
                <div>
                  <span>{isEquipped ? 'In Play' : progress.unlocked ? 'Unlocked' : 'Locked'}</span>
                  <h3>{ball.label}</h3>
                </div>
              </div>
              <p>{ball.description}</p>
              {progress.unlocked ? (
                <button
                  type="button"
                  className="equip-btn"
                  onClick={() => onEquipBall(ball.id)}
                  disabled={isEquipped}
                  aria-pressed={isEquipped}
                >
                  {isEquipped ? 'Equipped' : 'Equip'}
                </button>
              ) : (
                <div className="ball-unlock">
                  <small>{ball.unlock.label}: {progress.current} / {progress.goal}</small>
                  <div className="ball-unlock-bar">
                    <div style={{ width: `${(progress.current / progress.goal) * 100}%` }} />
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="screen-heading pickup-heading">
        <div>
          <h2>Course Pickups</h2>
          <p className="hint">
            Pickups float over every hole. Stop the ball inside the ring under one to collect it.
            Longer swings get a wider ring.
          </p>
        </div>
        <div className="summary-pill">
          <span>Collected</span>
          <strong>{state.lifetimeStats.pickups ?? 0}</strong>
        </div>
      </div>

      <div className="pickup-grid">
        {PICKUPS.map(pickup => (
          <article key={pickup.id} className="pickup-card">
            <SpriteIcon sheet="pickups" tag={pickup.id} scale={3} />
            <div>
              <h3>{pickup.label}</h3>
              <p>{pickup.description}</p>
              <small>Found {pickupsByType[pickup.id] ?? 0}</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
