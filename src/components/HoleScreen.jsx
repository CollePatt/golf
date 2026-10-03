import { useCallback, useEffect, useRef, useState } from 'react';
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
import { describeHoleResult, describeShot } from '../logic/shotFeedback.js';

// How long the finished hole stays up after the ball drops, so the birdie or
// bogey reads before the next tee. The game itself has already moved on.
const HOLE_OUT_SHOW_MS = 1400;
// Gives up waiting on the canvas (a hidden tab pauses its frames).
const HOLE_OUT_MAX_MS = 4000;

export default function HoleScreen({
  state,
  onSwing,
  onSelectSwingMode,
  onToggleAutoSwing,
  onToggleSaveFocus,
  onOpenOverlay,
  onOpenClubhouse,
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
  const focusFull = focusMeter >= focusReady;
  // A saved meter waits for the approach before it fires.
  const focusedReady = focusFull && (!state.saveFocusForApproach || approachActive);
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

  const scoreLabel = formatScoreToPar(scoreToPar);
  const par = parForHole(hole, state.courseId);

  // Space swings, unless focus is on another control (which Space already presses).
  useEffect(() => {
    function onKey(event) {
      if (event.code !== 'Space' || event.repeat) return;
      if (event.target.closest?.('button, input, select, textarea, summary, [role="dialog"]')) return;
      event.preventDefault();
      onSwing();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSwing]);

  // Only play shot feedback for swings taken while this screen is up.
  const swingCount = state.lifetimeStats.swings;
  const swingsAtMount = useRef(swingCount);
  const freshSwing = lastSwing && swingCount !== swingsAtMount.current;
  const shotFeel = freshSwing ? describeShot(lastSwing) : null;
  const shot = freshSwing && lastSwing.startAt != null
    ? {
        key: swingCount,
        startAt: lastSwing.startAt,
        landAt: lastSwing.landAt,
        look: lastSwing.hazard?.look,
        sub: `+${lastSwing.yards} yds${shotFeel.note ? `, ${shotFeel.note}` : ''}`,
        ...shotFeel,
      }
    : null;

  const liveView = {
    holeKey: `${state.courseId}-${hole}`,
    hole,
    yardsThisRun: yardsThisHole,
    targetDistance,
    approachDistance: approachRange,
    // A bunker shortens the next swing, which can drop the trap it sits in
    // below the activation line; keep drawing what the ball came to rest in.
    hazards: inSand ? getActiveHazards(state, yardsPerSwing / getSandMultiplier(state)) : activeHazards,
    pickups: state.holePickups,
    pickupRadius: getPickupRadius(state, yardsPerSwing),
    trait: holeDefinition.trait,
    theme,
    themeId: holeDefinition.theme,
    shot,
  };

  // When a swing finishes a hole, keep drawing that hole until the ball drops
  // and the score has had a moment on screen.
  // The detection only reads the previous committed view, so repeating it in
  // a second render pass records the same hold.
  const lastViewRef = useRef(liveView);
  const holdRef = useRef(null);
  const holeResult = freshSwing ? lastSwing.holeResult : null;
  const prevView = lastViewRef.current;
  if (holeResult && prevView.hole === holeResult.hole && hole !== holeResult.hole) {
    holdRef.current = {
      ...prevView,
      key: swingCount,
      yardsThisRun: prevView.targetDistance,
      shot,
      result: { ...holeResult, ...describeHoleResult(holeResult) },
    };
  }
  useEffect(() => {
    lastViewRef.current = liveView;
  });

  const [droppedKey, setDroppedKey] = useState(null);
  const [releasedKey, setReleasedKey] = useState(null);
  const held = holdRef.current && holdRef.current.key !== releasedKey ? holdRef.current : null;
  const heldKey = held?.key ?? null;
  const dropped = heldKey != null && droppedKey === heldKey;
  const onShotSettled = useCallback(key => setDroppedKey(key), []);
  useEffect(() => {
    if (heldKey == null) return undefined;
    const timer = setTimeout(() => setReleasedKey(heldKey), dropped ? HOLE_OUT_SHOW_MS : HOLE_OUT_MAX_MS);
    return () => clearTimeout(timer);
  }, [heldKey, dropped]);

  const view = held || liveView;

  return (
    <div className="course-view">
      <div className="course-bar">
        <div className="hole-title">
          <h2>Hole {hole}<small> / {HOLES_PER_ROUND}</small></h2>
          <p>{holeDefinition.name} · {course.name}</p>
        </div>
        <div className="toolbar">
          <button type="button" className="btn small" onClick={() => onOpenOverlay('bag')}>
            <SpriteIcon sheet="balls" tag={equippedBall.id} scale={2} />
            Bag
          </button>
          <button type="button" className="btn small" onClick={() => onOpenOverlay('guide')} aria-label="How to play">?</button>
          <button type="button" className="btn small" onClick={onOpenClubhouse}>Clubhouse</button>
        </div>
      </div>

      <div className="stage">
        <GolfHoleCanvas
          holeKey={view.holeKey}
          yardsThisRun={view.yardsThisRun}
          targetDistance={view.targetDistance}
          approachDistance={view.approachDistance}
          hazards={view.hazards}
          pickups={view.pickups}
          pickupRadius={view.pickupRadius}
          trait={view.trait}
          shot={view.shot}
          onShotSettled={onShotSettled}
          ballStyle={equippedBall.id}
          theme={view.theme}
          themeId={view.themeId}
        />
        <div className="hud">
          <div className="hud-group">
            <span className="tag">Par {par}</span>
            <span className="tag"><b>{remaining}</b> yds to pin</span>
          </div>
          <div className="hud-group">
            <span className="tag" title={`${ballsLeft} balls left`}>
              <SpriteIcon sheet="balls" tag={equippedBall.id} scale={2} />
              ×{ballsLeft}
            </span>
            <span className="tag" title={wind.description}>{wind.label}</span>
            <button type="button" className="score-chip" onClick={() => onOpenOverlay('scorecard')} aria-label={`Score ${scoreLabel}, open scorecard`}>
              {scoreLabel}
            </button>
          </div>
        </div>
        {dropped && (
          <div key={heldKey} className={`hole-out ${held.result.tone}`} role="status">
            <strong>{held.result.label}</strong>
            <span>
              Hole {held.result.hole} · {held.result.shots} stroke{held.result.shots === 1 ? '' : 's'} · Par {held.result.par}
            </span>
          </div>
        )}
      </div>

      {approachActive && (
        <p className="approach-strip">
          <b>Approach</b> {remaining} yds to the pin. Land within {approachWindow} yds to finish.
          {approachTightening > 0 && ` Misses ${approachTightening}% tighter.`}
        </p>
      )}

      <div className="panel deck">
        <div className="deck-controls">
          <div className="modes" role="group" aria-label="Swing mode">
            {SWING_MODES.map(mode => (
              <button
                key={mode.id}
                type="button"
                className={`btn small ${selectedSwingMode.id === mode.id ? 'on' : ''}`}
                onClick={() => onSelectSwingMode(mode.id)}
                aria-pressed={selectedSwingMode.id === mode.id}
                title={mode.description}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p className="mode-hint">{selectedSwingMode.description}</p>
          <div className="meter-row">
            <span className="label">Focus</span>
            <span className={`blocks ${focusFull ? 'ready' : ''}`} role="meter" aria-label="Focus" aria-valuemin={0} aria-valuemax={focusReady} aria-valuenow={focusMeter}>
              {Array.from({ length: 10 }, (_, index) => (
                <i key={index} className={focusMeter >= ((index + 1) * focusReady) / 10 ? 'full' : ''} />
              ))}
            </span>
            <button
              type="button"
              className={`btn small ${state.saveFocusForApproach ? 'on' : ''}`}
              onClick={onToggleSaveFocus}
              aria-pressed={state.saveFocusForApproach}
              title="Hold a full Focus meter until your next approach shot"
            >
              {state.saveFocusForApproach ? 'Saving for approach' : 'Save for approach'}
            </button>
            <span className="auto-caddie">
              <span className="label">Auto Caddie</span>
              <button
                type="button"
                className={`btn small ${autoSwingEnabled && autoSwingIntervalMs ? 'on' : ''}`}
                onClick={onToggleAutoSwing}
                disabled={!autoSwingIntervalMs}
                aria-pressed={autoSwingEnabled}
              >
                {!autoSwingIntervalMs
                  ? 'Locked'
                  : autoSwingEnabled
                  ? `On · ${formatAutoSwingInterval(autoSwingIntervalMs)}`
                  : 'Off'}
              </button>
            </span>
          </div>
        </div>
        <button type="button" className={`btn go swing ${focusedReady ? 'focused' : ''}`} onClick={onSwing}>
          {focusedReady ? 'Focused swing' : 'Swing'}
          <small>{displayedExpectedYards} yds · Space</small>
        </button>
      </div>

      {lastSwing && (
        <div className="last-shot" aria-live="polite">
          <span className="label">Last shot</span>
          <p>
            {lastSwing.yards} yds, {lastSwing.quality.toLowerCase()}
            {lastSwing.source === 'auto' ? ' (auto)' : ''}
            {lastSwingMode && lastSwingMode.id !== 'normal' ? `, ${lastSwingMode.label}` : ''}.
            {lastSwing.approach && <span className={`approach-result ${lastSwing.approach.grade}`}> {lastSwing.approach.label}: {lastSwing.approach.description}</span>}
            {lastSwing.putting && (
              <span> {lastSwing.putting.putts === 0
                ? 'Holed out!'
                : `${lastSwing.putting.putts} putt${lastSwing.putting.putts > 1 ? 's' : ''} from ${lastSwing.putting.proximity * 3} ft.`}</span>
            )}
            {lastSwing.hazard && <span className={`hazard-line ${lastSwing.hazard.type}`}> {lastSwing.hazard.description}</span>}
            {lastSwing.laidUp && <span> Laid up short of trouble.</span>}
            {lastSwing.event && <span> {lastSwing.event.label}: {lastSwing.event.description}</span>}
          </p>
          {lastSwing.pickups?.map((pickup, index) => (
            <p key={`${pickup.type}-${index}`} className="pickup-line">
              <SpriteIcon sheet="pickups" tag={pickup.type} scale={2} />
              {pickup.label}: {pickup.description}
            </p>
          ))}
        </div>
      )}

      <div className="chips" aria-label="Hole conditions">
        {inSand && (
          <span className="chip warn">
            <b>In the sand</b> next shot {Math.round((1 - getSandMultiplier(state)) * 100)}% shorter
          </span>
        )}
        {!inSand && nextHazard && (
          <span className={`chip warn ${nextHazard.type}`} title={nextHazard.type === 'water' ? 'Landing in it costs a stroke and a ball. Lay Up stops short.' : 'Landing in it shortens your next shot. Lay Up stops short.'}>
            <b>{nextHazard.type === 'water' ? 'Water' : 'Bunker'}</b>
            {Math.max(0, nextHazard.start - yardsThisHole)}–{nextHazard.end - yardsThisHole} yds out
          </span>
        )}
        <span className="chip" title={holeDefinition.trait.description}>
          <b>{holeDefinition.trait.label}</b> {holeDefinition.trait.description}
        </span>
        <span className="chip"><b>{wind.label}</b> {wind.description}</span>
        {pickupsLeft > 0 && (
          <span className="chip">
            <SpriteIcon sheet="pickups" tag="coin" scale={2} />
            {pickupsLeft} pickup{pickupsLeft > 1 ? 's' : ''} on this hole
          </span>
        )}
        {buffs.tailwindSwings > 0 && (
          <span className="chip buff">
            <SpriteIcon sheet="pickups" tag="tailwind" scale={2} />
            Tailwind ×{buffs.tailwindSwings}
          </span>
        )}
        {buffs.clover && (
          <span className="chip buff">
            <SpriteIcon sheet="pickups" tag="clover" scale={2} />
            Perfect next
          </span>
        )}
        {buffs.magnet && (
          <span className="chip buff">
            <SpriteIcon sheet="pickups" tag="magnet" scale={2} />
            Magnet
          </span>
        )}
        {activeCoursePerk && (
          <span className="chip buff" title={activeCoursePerk.description}><b>Perk</b> {activeCoursePerk.label}</span>
        )}
      </div>

      <details className="all-stats">
        <summary>All stats</summary>
        <div className="stats">
          <p className="stat">Course: <strong>{course.name}</strong></p>
          <p className="stat">Ball: <strong>{equippedBall.label}</strong></p>
          <p className="stat">Course perk: <strong>{activeCoursePerk?.label || 'None'}</strong></p>
          <p className="stat">Swing mode: <strong>{selectedSwingMode.label}</strong></p>
          <p className="stat">Shot phase: <strong>{approachActive ? 'Approach' : 'Fairway'}</strong></p>
          <p className="stat">Approach range: <strong>{approachRange} yds</strong></p>
          <p className="stat">Lie: <strong>{inSand ? 'Sand' : 'Fairway'}</strong></p>
          <p className="stat">Approach control: <strong>{approachTightening}% tighter</strong></p>
          <p className="stat">Auto approach: <strong>{autoApproachTightening}% tighter</strong></p>
          <p className="stat">Target: <strong>{targetDistance} yds</strong></p>
          <p className="stat">Par: <strong>{par}</strong></p>
          <p className="stat">Yards this hole: <strong>{yardsThisHole}</strong></p>
          <p className="stat">Shots this hole: <strong>{currentHoleShots}</strong></p>
          <p className="stat">Shots this round: <strong>{totalShots}</strong></p>
          <p className="stat">Holes cleared: <strong>{completedHoles.length}</strong></p>
          <p className="stat">Yards earned: <strong>{totalYardsThisRound}</strong></p>
          <p className="stat">Score to par: <strong>{scoreLabel}</strong></p>
        </div>
      </details>
    </div>
  );
}
