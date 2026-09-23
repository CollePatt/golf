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
            <li>Manual swings build Focus; a full meter powers up your next manual shot.</li>
            <li>The round ends after hole 18 or when you run out of balls.</li>
            <li>Every yard hit becomes upgrade currency after the round.</li>
          </ul>
        </section>

        <section className="guide-card">
          <h3>Scoring</h3>
          <ul>
            <li>Each hole has a par based on its target distance.</li>
            <li>Fewer shots improves your score to par.</li>
            <li>Your best completed round is saved automatically.</li>
            <li>Wind and swing quality can change each shot's distance.</li>
          </ul>
        </section>

        <section className="guide-card">
          <h3>Progression</h3>
          <ul>
            <li>Spend yards on clubs, extra balls, and multipliers.</li>
            <li>Unlock Auto Caddie to keep swinging while you look away.</li>
            <li>Use the upgrade tab after each run to invest your earnings.</li>
            <li>The long-term target is a prestige layer after completed rounds.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
