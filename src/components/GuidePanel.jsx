export default function GuidePanel() {
  return (
    <div className="screen guide-screen">
      <div className="screen-heading">
        <div>
          <h2>Goal</h2>
          <p className="hint">Finish all 18 holes, then keep pushing for a lower score and stronger upgrades.</p>
        </div>
      </div>

      <div className="guide-grid">
        <section className="guide-card">
          <h3>Round Rules</h3>
          <ul>
            <li>Each swing spends one ball.</li>
            <li>Clear the target distance to advance to the next hole.</li>
            <li>Inside 120 yards, the hole shifts into Approach Mode.</li>
            <li>Manual swings build Focus; a full meter powers up your next manual shot.</li>
            <li>Swing modes trade consistency, Focus gain, and distance.</li>
            <li>The round ends after hole 18 or when you run out of balls.</li>
            <li>Every yard hit becomes upgrade currency after the round.</li>
            <li>Achievements pay bonus yards when you hit lifetime milestones.</li>
            <li>Completing a course lets you choose a temporary perk for the next course attempt.</li>
          </ul>
        </section>

        <section className="guide-card">
          <h3>Scoring</h3>
          <ul>
            <li>Each hole has a par based on its target distance.</li>
            <li>Fewer shots improves your score to par.</li>
            <li>Approach shots must land close enough to finish; misses leave a follow-up distance.</li>
            <li>Your best completed round is saved automatically.</li>
            <li>Wind and swing quality can change each shot's distance.</li>
            <li>Safe shots are steadier, while aggressive shots can carry farther or miss harder.</li>
            <li>Rare shot events can add bounces, focus boosts, or rough lies.</li>
          </ul>
        </section>

        <section className="guide-card">
          <h3>Progression</h3>
          <ul>
            <li>Spend yards on clubs, extra balls, and multipliers.</li>
            <li>Soft Landing improves approach control and reduces punishing long misses.</li>
            <li>Caddie Read improves approach finish windows and makes Auto Caddie better near the green.</li>
            <li>Unlock Auto Caddie to keep swinging while you look away.</li>
            <li>Use the upgrade tab after each run to invest your earnings.</li>
            <li>Clear Meadow Municipal to unlock Moon Links.</li>
            <li>Use the Courses tab between rounds to replay any open course.</li>
          </ul>
        </section>

        <section className="guide-card">
          <h3>Pro Tour</h3>
          <ul>
            <li>Clear Meadow Municipal and Moon Links in one cycle to unlock Turn Pro.</li>
            <li>Each cleared course pays Pro Points from its best round this cycle.</li>
            <li>Even par pays the course value; fewer shots pay more, extra shots pay less.</li>
            <li>Turning pro resets yard upgrades, perks, and course progress.</li>
            <li>Pro upgrades, achievements, lifetime stats, and course records are kept.</li>
            <li>Course Pass opens Sahara Sands, Glacier Greens, and Caldera Classic.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
