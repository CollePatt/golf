import GolfHoleCanvas from './GolfHoleCanvas.jsx'
import { getCourseById, getCourseTheme, getHoleDefinition } from '../data/courses.js';
import {
  HOLES_PER_ROUND,
  formatScoreToPar,
  getCompletedHoles,
  getScoreToPar,
  parForHole,
} from '../logic/gameState.js';
import { formatAutoSwingInterval } from '../logic/swingLogic.js';
import {
  getApproachFinishWindow,
  getApproachRange,
  isApproachDistance,
} from '../logic/approachLogic.js';
import {
  getActiveHazards,
  getNextHazard,
  getSandMultiplier,
  getShotApproachStats,
} from '../logic/holeLogic.js';
import { getPickupRadius } from '../logic/pickupLogic.js';
import { getBallById } from '../data/balls.js';
import SpriteIcon from './SpriteIcon.jsx';
import { getCoursePerkById } from '../data/coursePerks.js';
import { SWING_MODES, getSwingMode } from '../data/swingModes.js';

export default function HoleScreen({
  state,
  onSwing,
  onSelectSwingMode,
  onToggleAutoSwing,
  yardsPerSwing,
  autoSwingIntervalMs,
  focusReady,
}) {
  const {
    hole,
    targetDistance,
    yardsThisHole,
    currentHoleShots,
    ballsLeft,
    totalShots,
    totalYardsThisRound,
    scorecard,
    wind,
    lastSwing,
    autoSwingEnabled,
    focusMeter,
  } = state;
  const course = getCourseById(state.courseId);
  const holeDefinition = getHoleDefinition(state.courseId, hole);
  const activeCoursePerk = getCoursePerkById(state.activeCoursePerk);
  const selectedSwingMode = getSwingMode(state.selectedSwingMode);
  const lastSwingMode = lastSwing ? getSwingMode(lastSwing.swingMode) : null;
  const theme = getCourseTheme(holeDefinition.theme);
  const remaining = Math.max(0, targetDistance - yardsThisHole);
  const completedHoles = getCompletedHoles(scorecard);
  const scoreToPar = getScoreToPar(scorecard);
  const approachRange = getApproachRange(yardsPerSwing);
  const approachActive = isApproachDistance(remaining, approachRange);
  const activeHazards = getActiveHazards(state, yardsPerSwing);
  const nextHazard = approachActive ? null : getNextHazard(activeHazards, yardsThisHole);
  const inSand = state.lie === 'sand';
  const focusedReady = focusMeter >= focusReady;
  const manualApproachStats = getShotApproachStats(state, 'manual');
  const autoApproachStats = getShotApproachStats(state, 'auto');
  const equippedBall = getBallById(state.equippedBall);
  const holePickups = state.holePickups?.items || [];
  const pickupsLeft = holePickups.filter(item => !item.collected).length;
  const buffs = state.buffs || {};
  const approachWindow = getApproachFinishWindow(selectedSwingMode.id, focusedReady, manualApproachStats);
  const displayedExpectedYards = approachActive ? Math.min(yardsPerSwing, remaining) : yardsPerSwing;
  const approachTightening = Math.round((1 - manualApproachStats.errorMultiplier) * 100);
  const autoApproachTightening = Math.round((1 - autoApproachStats.errorMultiplier) * 100);

  return (
    <div className="screen">
      <div className="screen-heading">
        <div>
          <h2>Hole {hole} / {HOLES_PER_ROUND}</h2>
          <p className="hole-name">{holeDefinition.name}</p>
          <p className="hint">
            {course.name} | {approachActive
              ? `Land close from ${remaining} yds to finish the hole.`
              : `Clear ${remaining - approachRange} more yards to reach approach range.`}
          </p>
        </div>
        <div className="score-popover-anchor" tabIndex={0}>
          <div className="summary-pill">
            <span>Score</span>
            <strong>{formatScoreToPar(scoreToPar)}</strong>
          </div>
          <div className="scorecard-popover" aria-hidden="true">
            <div className="scorecard-grid compact" aria-label="Round scorecard preview">
              {scorecard.map(entry => {
                const isCurrent = entry.hole === hole;
                const isComplete = Number.isFinite(entry.shots);
                return (
                  <div
                    key={entry.hole}
                    className={`scorecard-cell ${isCurrent ? 'current' : ''} ${isComplete ? 'complete' : ''}`}
                  >
                    <span>{entry.hole}</span>
                    <strong>{isComplete ? formatScoreToPar(entry.scoreToPar) : '-'}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="hole-layout">
        <div className="hole-main">
          <GolfHoleCanvas
            yardsThisRun={yardsThisHole}
            targetDistance={targetDistance}
            approachDistance={approachRange}
            hazards={activeHazards}
            pickups={state.holePickups}
            pickupRadius={getPickupRadius(state, yardsPerSwing)}
            ballStyle={equippedBall.id}
            theme={theme}
            themeId={holeDefinition.theme}
          />
          {approachActive && (
            <div className="approach-panel">
            <div>
              <span>Approach Mode</span>
              <strong>{remaining} yds to the pin</strong>
            </div>
              <p>
                Land within {approachWindow} yds to finish.
                {approachTightening > 0 ? ` Misses are ${approachTightening}% tighter.` : ' Focus widens the finish window.'}
              </p>
            </div>
          )}
          <div className="swing-mode-panel">
            <div className="swing-mode-heading">
              <span>Swing Mode</span>
              <strong>{selectedSwingMode.label}</strong>
            </div>
            <div className="swing-mode-selector" aria-label="Swing mode">
              {SWING_MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  className={`mode-btn ${selectedSwingMode.id === mode.id ? 'active' : ''}`}
                  onClick={() => onSelectSwingMode(mode.id)}
                  aria-pressed={selectedSwingMode.id === mode.id}
                >
                  <span>{mode.label}</span>
                  <small>{mode.description}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="swing-panel">
            <div>
              <span>{approachActive ? 'Expected Carry' : 'Expected Swing'}</span>
              <strong>{displayedExpectedYards} yds</strong>
              {lastSwing && (
                <p>
                  Last: {lastSwing.yards} yds ({lastSwing.quality}, {lastSwingMode.label}
                  {lastSwing.source === 'auto' ? ', auto' : ''})
                </p>
              )}
              {lastSwing?.approach && (
                <p className={`approach-result ${lastSwing.approach.grade}`}>
                  {lastSwing.approach.label}: {lastSwing.approach.description}
                </p>
              )}
              {lastSwing?.putting && (
                <p className="putting-line">
                  {lastSwing.putting.putts === 0
                    ? 'Holed out, no putt needed!'
                    : `${lastSwing.putting.putts} putt${lastSwing.putting.putts > 1 ? 's' : ''} from ${lastSwing.putting.proximity * 3} ft.`}
                </p>
              )}
              {lastSwing?.hazard && (
                <p className={`hazard-line ${lastSwing.hazard.type}`}>{lastSwing.hazard.description}</p>
              )}
              {lastSwing?.laidUp && <p className="hazard-line layup">Laid up short of trouble.</p>}
              {lastSwing?.pickups?.map((pickup, index) => (
                <p key={`${pickup.type}-${index}`} className="pickup-line">
                  <SpriteIcon sheet="pickups" tag={pickup.type} scale={2} />
                  {pickup.label}: {pickup.description}
                </p>
              ))}
              {lastSwing?.event && (
                <p className="shot-event-line">
                  {lastSwing.event.label}: {lastSwing.event.description}
                </p>
              )}
            </div>
            <button className="swing-btn" onClick={onSwing}>
              {focusMeter >= focusReady ? 'Focused Swing' : 'Swing'}
            </button>
          </div>
          <div className="focus-panel">
            <div className="focus-header">
              <span>Focus</span>
              <strong>{focusMeter} / {focusReady}</strong>
            </div>
            <div className="focus-bar" aria-label="Manual focus meter">
              <div className="focus-fill" style={{ width: `${Math.min(100, focusMeter)}%` }} />
            </div>
            <p>Manual swings build Focus. A full meter powers up your next manual shot.</p>
          </div>
          <div className={`auto-swing-panel ${autoSwingIntervalMs ? 'unlocked' : ''}`}>
            <div>
              <span>Auto Caddie</span>
              <strong>{autoSwingIntervalMs ? `${formatAutoSwingInterval(autoSwingIntervalMs)} / swing` : 'Locked'}</strong>
            </div>
            <button
              className="toggle-btn"
              onClick={onToggleAutoSwing}
              disabled={!autoSwingIntervalMs}
              aria-pressed={autoSwingEnabled}
            >
              {autoSwingEnabled && autoSwingIntervalMs ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <aside className="hole-sidebar" aria-label="Round status">
          <div className="quick-stats" aria-label="Key round stats">
            <div className="quick-stat">
              <span>Need</span>
              <strong>{remaining} yds</strong>
            </div>
            <div className="quick-stat">
              <span>Balls</span>
              <strong>{ballsLeft}</strong>
            </div>
            <div className="quick-stat">
              <span>Hole Shots</span>
              <strong>{currentHoleShots}</strong>
            </div>
            <div className="quick-stat">
              <span>Earned</span>
              <strong>{totalYardsThisRound}</strong>
            </div>
          </div>
          <div className="equipped-ball-card">
            <SpriteIcon sheet="balls" tag={equippedBall.id} scale={4} />
            <div>
              <span>Ball: {equippedBall.label}</span>
              <p>{equippedBall.description}</p>
            </div>
          </div>
          {(pickupsLeft > 0 || buffs.tailwindSwings > 0 || buffs.clover || buffs.magnet) && (
            <div className="buff-row" aria-label="Pickups and active boosts">
              {pickupsLeft > 0 && (
                <span className="buff-chip">{pickupsLeft} pickup{pickupsLeft > 1 ? 's' : ''} on this hole</span>
              )}
              {buffs.tailwindSwings > 0 && (
                <span className="buff-chip">
                  <SpriteIcon sheet="pickups" tag="tailwind" scale={2} />
                  Tailwind ×{buffs.tailwindSwings}
                </span>
              )}
              {buffs.clover && (
                <span className="buff-chip">
                  <SpriteIcon sheet="pickups" tag="clover" scale={2} />
                  Perfect next
                </span>
              )}
              {buffs.magnet && (
                <span className="buff-chip">
                  <SpriteIcon sheet="pickups" tag="magnet" scale={2} />
                  Magnet
                </span>
              )}
            </div>
          )}
          <div className="round-modifier">
            <div>
              <span>Wind</span>
              <strong>{wind.label}</strong>
            </div>
            <p>{wind.description}</p>
          </div>
          {(nextHazard || inSand) && (
            <div className={`hazard-panel ${inSand ? 'sand' : nextHazard.type}`}>
              <span>{inSand ? 'In The Sand' : nextHazard.type === 'water' ? 'Water Ahead' : 'Bunker Ahead'}</span>
              <strong>
                {inSand
                  ? `Next shot ${Math.round((1 - getSandMultiplier(state)) * 100)}% shorter`
                  : `${nextHazard.name}: ${Math.max(0, nextHazard.start - yardsThisHole)}–${nextHazard.end - yardsThisHole} yds out`}
              </strong>
              {!inSand && (
                <p>
                  {nextHazard.type === 'water'
                    ? 'Landing in it costs a stroke and a ball.'
                    : 'Landing in it shortens your next shot.'}
                  {' '}Lay Up stops short of it.
                </p>
              )}
            </div>
          )}
          <div className="hole-trait-panel">
            <span>Hole Trait</span>
            <strong>{holeDefinition.trait.label}</strong>
            <p>{holeDefinition.trait.description}</p>
          </div>
          {activeCoursePerk && (
            <div className="course-perk-card active">
              <span>Course Perk</span>
              <strong>{activeCoursePerk.label}</strong>
              <p>{activeCoursePerk.description}</p>
            </div>
          )}
          <details className="all-stats">
            <summary>All Stats</summary>
            <div className="stats">
              <p className="stat">Course: <strong>{course.name}</strong></p>
              <p className="stat">Course perk: <strong>{activeCoursePerk?.label || 'None'}</strong></p>
              <p className="stat">Swing mode: <strong>{selectedSwingMode.label}</strong></p>
              <p className="stat">Shot phase: <strong>{approachActive ? 'Approach' : 'Fairway'}</strong></p>
              <p className="stat">Approach range: <strong>{approachRange} yds</strong></p>
              <p className="stat">Lie: <strong>{inSand ? 'Sand' : 'Fairway'}</strong></p>
              <p className="stat">Approach control: <strong>{approachTightening}% tighter</strong></p>
              <p className="stat">Auto approach: <strong>{autoApproachTightening}% tighter</strong></p>
              <p className="stat">Target: <strong>{targetDistance} yds</strong></p>
              <p className="stat">Par: <strong>{parForHole(hole, state.courseId)}</strong></p>
              <p className="stat">Yards this hole: <strong>{yardsThisHole}</strong></p>
              <p className="stat">Remaining: <strong>{remaining} yds</strong></p>
              <p className="stat">Balls left: <strong>{ballsLeft}</strong></p>
              <p className="stat">Shots this hole: <strong>{currentHoleShots}</strong></p>
              <p className="stat">Shots this round: <strong>{totalShots}</strong></p>
              <p className="stat">Holes cleared: <strong>{completedHoles.length}</strong></p>
              <p className="stat">Yards earned: <strong>{totalYardsThisRound}</strong></p>
              <p className="stat">Score to par: <strong>{formatScoreToPar(scoreToPar)}</strong></p>
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}
