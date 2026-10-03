import {
  COURSES,
  describeCourseUnlock,
  getCourseById,
  getCourseTheme,
  isCourseUnlocked,
} from '../data/courses.js';
import { getCoursePerkById } from '../data/coursePerks.js';
import {
  formatScoreToPar,
  getCompletedHoles,
  getCourseParTotal,
  getScoreToPar,
  HOLES_PER_ROUND,
} from '../logic/gameState.js';
import { getCoursePassLevel, getEffectLevels } from '../logic/swingLogic.js';

function formatRound(round) {
  if (!round) return 'No record';
  return `Best ${formatScoreToPar(round.scoreToPar)} (${round.shots})`;
}

// The Clubhouse's main card: how the last round went, where to play next,
// and one big button to get back on the course.
export default function TeeOffPanel({
  state,
  onSelectCourse,
  onChooseCoursePerk,
  onStartNextRound,
  onBackToCourse,
}) {
  const between = state.phase === 'upgrade';
  const roundComplete = between && state.roundResult === 'complete';
  const needsCoursePerk = roundComplete && !state.nextCoursePerk;
  const unlockContext = {
    completedCourseIds: state.completedCourseIds,
    coursePassLevel: getCoursePassLevel(getEffectLevels(state)),
  };
  const selectedCourse = getCourseById(state.selectedCourseId);
  const currentCourse = getCourseById(state.courseId);
  const completedHoles = getCompletedHoles(state.scorecard);
  const roundStarted = state.hole > 1 || state.currentHoleShots > 0;
  const newCycle = between && !state.roundResult;

  if (!between) {
    return (
      <section className="panel tee-off" aria-labelledby="tee-off-title">
        <div className="tee-off-head">
          <div>
            <span className="label">{roundStarted ? 'Round in progress' : 'Ready to play'}</span>
            <h2 id="tee-off-title">{currentCourse.name}</h2>
            <p className="hint">
              {roundStarted
                ? `Hole ${state.hole} of ${HOLES_PER_ROUND} · ${state.ballsLeft} balls left · ${formatScoreToPar(getScoreToPar(state.scorecard))}`
                : `Hole 1 · ${state.ballsLeft} balls · Par ${getCourseParTotal(currentCourse.id)}`}
            </p>
          </div>
          <button type="button" className="btn go big" onClick={onBackToCourse}>
            {roundStarted ? 'Back to the course' : 'Tee off'}
          </button>
        </div>
        <p className="hint">Upgrades and course choice open when this round ends.</p>
      </section>
    );
  }

  return (
    <section className="panel tee-off" aria-labelledby="tee-off-title">
      {newCycle ? (
        <div className="round-summary paper">
          <span className="label">Turned pro</span>
          <h2 id="tee-off-title">Pro cycle {state.prestige.count + 1}</h2>
          <dl>
            <div><dt>Pro Points</dt><dd>{state.prestige.points}</dd></div>
            <div><dt>Yards to spend</dt><dd className="big-number">{state.yardsToAllocate.toLocaleString()}</dd></div>
          </dl>
        </div>
      ) : (
        <div className="round-summary paper">
          <span className="label">{roundComplete ? 'Round complete' : 'Out of balls'}</span>
          <h2 id="tee-off-title">{currentCourse.name}</h2>
          <dl>
            <div><dt>Holes</dt><dd>{completedHoles.length} / {HOLES_PER_ROUND}</dd></div>
            <div><dt>Score</dt><dd>{formatScoreToPar(getScoreToPar(state.scorecard))}</dd></div>
            <div><dt>Shots</dt><dd>{state.totalShots}</dd></div>
            <div><dt>Yards to spend</dt><dd className="big-number">{state.yardsToAllocate.toLocaleString()}</dd></div>
          </dl>
        </div>
      )}

      <div className="next-round">
        <span className="label">Next round</span>
        <div className="course-picker" role="radiogroup" aria-label="Pick a course">
          {COURSES.map(course => {
            const unlocked = isCourseUnlocked(course.id, unlockContext);
            const selected = course.id === state.selectedCourseId;
            const theme = getCourseTheme(course.holes[0].theme);
            return (
              <button
                key={course.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!unlocked}
                className={`course-pick ${selected ? 'selected' : ''}`}
                onClick={() => onSelectCourse(course.id)}
              >
                <span
                  className="course-swatch"
                  style={{ '--sky': theme.skyTop, '--grass': theme.fairway }}
                  aria-hidden="true"
                />
                <strong>{course.name}</strong>
                <small>
                  {unlocked
                    ? `Par ${getCourseParTotal(course.id)} · ${formatRound(state.courseRecords[course.id])}`
                    : describeCourseUnlock(course.id)}
                </small>
              </button>
            );
          })}
        </div>

        {roundComplete && (
          <div className="perk-pick">
            <span className="label">Pick a perk for this attempt</span>
            <div className="perk-row">
              {state.pendingCoursePerkChoices.map(perkId => {
                const perk = getCoursePerkById(perkId);
                if (!perk) return null;
                const chosen = state.nextCoursePerk === perk.id;
                return (
                  <button
                    key={perk.id}
                    type="button"
                    className={`perk-choice ${chosen ? 'selected' : ''}`}
                    aria-pressed={chosen}
                    onClick={() => onChooseCoursePerk(perk.id)}
                  >
                    <strong>{perk.label}</strong>
                    <small>{perk.description}</small>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="tee-off-actions">
          <button
            type="button"
            className="btn go big"
            onClick={onStartNextRound}
            disabled={needsCoursePerk}
          >
            Tee off at {selectedCourse.name}
          </button>
          {needsCoursePerk && <p className="hint">Pick a perk first.</p>}
        </div>
      </div>
    </section>
  );
}
