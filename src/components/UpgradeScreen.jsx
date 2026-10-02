import { UPGRADES } from '../data/upgrades.js';
import { getCourseById } from '../data/courses.js';
import { getCoursePerkById } from '../data/coursePerks.js';
import { formatScoreToPar, getCompletedHoles, getScoreToPar } from '../logic/gameState.js';
import { getEffectLevels, getYardsEarnedMultiplier } from '../logic/swingLogic.js';
import { canTurnPro } from '../logic/prestigeLogic.js';
import RoundRecap from './RoundRecap.jsx';
import UpgradeBar from './UpgradeBar.jsx';

export default function UpgradeScreen({
  state,
  onAllocate,
  onChooseCoursePerk,
  onStartNextRound,
  onViewCourses,
}) {
  const {
    roundResult,
    hole,
    totalShots,
    totalYardsThisRound,
    yardsToAllocate,
    upgrades,
    scorecard,
    bestCompletedRound,
    pendingCoursePerkChoices,
    nextCoursePerk,
  } = state;

  const heading = state.phase === 'run'
    ? 'Upgrades'
    : roundResult === 'complete'
    ? 'Round Complete!'
    : 'Out of Balls';
  const subheading = state.phase === 'run'
    ? 'Finish the current round to spend earned yards.'
    : roundResult === 'complete'
    ? `All 18 holes in ${totalShots} shots.`
    : `Reached hole ${hole} in ${totalShots} shots.`;
  const completedHoles = getCompletedHoles(scorecard);
  const scoreToPar = getScoreToPar(scorecard);
  const nextCourse = getCourseById(state.selectedCourseId);
  const effectLevels = getEffectLevels(state);
  const yardsEarnedMultiplier = getYardsEarnedMultiplier(effectLevels);
  const selectedCoursePerk = getCoursePerkById(nextCoursePerk);
  const needsCoursePerk = state.phase === 'upgrade' && roundResult === 'complete' && !nextCoursePerk;

  return (
    <div className="screen">
      <h2>{heading}</h2>
      <p className="hint">{subheading}</p>
      {state.recentAchievements.length > 0 && (
        <div className="achievement-callout">
          <span>New Milestones</span>
          <strong>{state.recentAchievements.length} achievement reward{state.recentAchievements.length > 1 ? 's' : ''} added.</strong>
        </div>
      )}
      <div className="stats">
        <p className="stat">Holes scored: <strong>{completedHoles.length}</strong></p>
        <p className="stat">Score to par: <strong>{formatScoreToPar(scoreToPar)}</strong></p>
        <p className="stat">
          Best completed round:{' '}
          <strong>
            {bestCompletedRound
              ? `${formatScoreToPar(bestCompletedRound.scoreToPar)} (${bestCompletedRound.shots} shots)`
              : 'None yet'}
          </strong>
        </p>
        <p className="stat">
          Yards earned this round: <strong>{totalYardsThisRound}</strong>
          {yardsEarnedMultiplier > 1 && (
            <small className="stat-note"> (Yardage Book ×{yardsEarnedMultiplier.toFixed(2)})</small>
          )}
        </p>
        <p className="stat">Yards to spend: <strong>{yardsToAllocate}</strong></p>
      </div>

      {canTurnPro(state) && (
        <div className="achievement-callout pro-callout">
          <span>Pro Tour</span>
          <strong>You have finished the tour. Turn pro from the Pro Tour tab whenever you are ready.</strong>
        </div>
      )}

      {state.phase === 'upgrade' && <RoundRecap scorecard={scorecard} />}

      {state.phase === 'upgrade' && roundResult === 'complete' && (
        <section className="course-perk-panel" aria-labelledby="course-perk-title">
          <div className="course-perk-heading">
            <div>
              <span>Course Complete</span>
              <h3 id="course-perk-title">Choose a perk for {nextCourse.name}</h3>
            </div>
            {selectedCoursePerk && <strong>{selectedCoursePerk.label} selected</strong>}
          </div>
          <p className="hint">
            Perks are temporary boosts for your next course attempt. Pick one before you tee off.
          </p>
          <div className="perk-choice-grid">
            {pendingCoursePerkChoices.map(perkId => {
              const perk = getCoursePerkById(perkId);
              if (!perk) return null;
              return (
                <button
                  key={perk.id}
                  type="button"
                  className={`perk-choice ${nextCoursePerk === perk.id ? 'selected' : ''}`}
                  onClick={() => onChooseCoursePerk(perk.id)}
                >
                  <span>{perk.label}</span>
                  <strong>{perk.description}</strong>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <h3>Upgrades</h3>
      <p className="hint">
        {state.phase === 'upgrade'
          ? 'Choose how much of your remaining yards to invest.'
          : 'Upgrade spending unlocks after the current round ends.'}
      </p>

      {UPGRADES.map(upgrade => (
        <UpgradeBar
          key={upgrade.id}
          upgrade={upgrade}
          upgradeState={upgrades[upgrade.id]}
          upgrades={effectLevels}
          yardsToAllocate={yardsToAllocate}
          onAllocate={onAllocate}
        />
      ))}

      {state.phase === 'upgrade' && (
        <div className="round-start-actions">
          <button className="next-btn" onClick={onStartNextRound} disabled={needsCoursePerk}>
            Start {nextCourse.name}
          </button>
          <button type="button" className="secondary-btn" onClick={onViewCourses}>
            Change Course
          </button>
        </div>
      )}
    </div>
  );
}
