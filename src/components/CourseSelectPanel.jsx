import {
  COURSES,
  PRO_CHAIN_COURSE_IDS,
  describeCourseUnlock,
  getCourseTheme,
  isCourseUnlocked,
} from '../data/courses.js';
import {
  HOLES_PER_ROUND,
  formatScoreToPar,
  getCourseParTotal,
  yardsForHole,
} from '../logic/gameState.js';
import { getCoursePassLevel, getEffectLevels } from '../logic/swingLogic.js';
import { getCoursePrestigePoints } from '../logic/prestigeLogic.js';

function formatRound(round) {
  if (!round) return 'None';
  return `${formatScoreToPar(round.scoreToPar)} (${round.shots})`;
}

export default function CourseSelectPanel({ state, onSelectCourse, onStartNextRound }) {
  const unlockContext = {
    completedCourseIds: state.completedCourseIds,
    coursePassLevel: getCoursePassLevel(getEffectLevels(state)),
  };
  const canChoose = state.phase === 'upgrade';
  const needsCoursePerk = canChoose && state.roundResult === 'complete' && !state.nextCoursePerk;
  const selectedCourse = COURSES.find(course => course.id === state.selectedCourseId);

  return (
    <div className="screen">
      <div className="screen-heading">
        <div>
          <h2>Courses</h2>
          <p className="hint">
            {canChoose
              ? 'Pick where your next round tees off. Replays still count toward your best Pro Tour score.'
              : 'Finish or run out the current round to pick a different course.'}
          </p>
        </div>
        <div className="summary-pill">
          <span>Next Round</span>
          <strong>{selectedCourse?.name}</strong>
        </div>
      </div>

      <div className="course-grid">
        {COURSES.map(course => {
          const unlocked = isCourseUnlocked(course.id, unlockContext);
          const selected = state.selectedCourseId === course.id;
          const playing = state.phase === 'run' && state.courseId === course.id;
          const completed = state.completedCourseIds.includes(course.id);
          const cycleBest = state.cycleBestRounds[course.id];
          const record = state.courseRecords[course.id];
          const firstTheme = getCourseTheme(course.holes[0].theme);
          const lastTheme = getCourseTheme(course.holes[course.holes.length - 1].theme);
          const onProChain = PRO_CHAIN_COURSE_IDS.includes(course.id);
          const status = playing
            ? 'Playing'
            : !unlocked
            ? 'Locked'
            : completed
            ? 'Cleared'
            : 'Open';

          return (
            <section
              key={course.id}
              className={`course-card ${unlocked ? '' : 'locked'} ${selected ? 'selected' : ''}`}
              aria-label={course.name}
            >
              <div
                className="course-banner"
                style={{
                  background: `linear-gradient(90deg, ${firstTheme.skyTop}, ${firstTheme.fairway} 45%, ${lastTheme.fairway} 55%, ${lastTheme.skyTop})`,
                }}
              >
                <span className={`course-status ${status.toLowerCase()}`}>{status}</span>
                {onProChain && <span className="course-tag">Tour</span>}
                {!onProChain && <span className="course-tag pass">Course Pass</span>}
              </div>
              <div className="course-body">
                <h3>{course.name}</h3>
                <p className="hint">{course.description}</p>
                <dl className="course-facts">
                  <div>
                    <dt>Holes</dt>
                    <dd>{yardsForHole(1, course.id)} → {yardsForHole(HOLES_PER_ROUND, course.id)} yds</dd>
                  </div>
                  <div>
                    <dt>Par</dt>
                    <dd>{getCourseParTotal(course.id)}</dd>
                  </div>
                  <div>
                    <dt>Pro Points</dt>
                    <dd>{course.prestigeValue} at even par</dd>
                  </div>
                  <div>
                    <dt>This Cycle</dt>
                    <dd>
                      {cycleBest
                        ? `${formatRound(cycleBest)} · ${getCoursePrestigePoints(course.id, cycleBest.shots)} pts`
                        : 'Not cleared'}
                    </dd>
                  </div>
                  <div>
                    <dt>Record</dt>
                    <dd>{formatRound(record)}</dd>
                  </div>
                </dl>
                {!unlocked && <p className="course-lock">{describeCourseUnlock(course.id)}</p>}
                {unlocked && canChoose && (
                  <button
                    type="button"
                    className={`course-select-btn ${selected ? 'active' : ''}`}
                    onClick={() => onSelectCourse(course.id)}
                    aria-pressed={selected}
                  >
                    {selected ? 'Selected' : 'Play This Course'}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {canChoose && (
        <div className="round-start-actions">
          <button className="next-btn" onClick={onStartNextRound} disabled={needsCoursePerk}>
            Start {selectedCourse?.name}
          </button>
          {needsCoursePerk && <p className="hint">Choose a course perk on the Upgrades tab first.</p>}
        </div>
      )}
    </div>
  );
}
