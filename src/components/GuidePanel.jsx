export default function GuidePanel() {
  return (
    <div className="door-panel guide-screen">
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
            <li>Once a full swing can reach the pin, the hole shifts into Approach Mode (at least 120 yards out).</li>
            <li>Approaches that find the green are putted out automatically; closer approaches mean fewer putts.</li>
            <li>Putts add strokes but never cost a ball.</li>
            <li>Water costs a stroke and a ball. Bunkers shorten your next shot. Lay Up stops short of both.</li>
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
            <li>Par is full swings to reach the green at the course's design power, plus two putts.</li>
            <li>Fewer shots improves your score to par.</li>
            <li>Approach shots must land close enough to finish; misses leave a follow-up distance.</li>
            <li>Your best completed round is saved automatically.</li>
            <li>Wind and swing quality can change each shot's distance.</li>
            <li>Aggressive carries farther for clearing a new course. Normal scores best. Safe is shorter but pays 30% more yards, so it suits a course you have mastered.</li>
            <li>Rare shot events can add bounces, focus boosts, or rough lies.</li>
          </ul>
        </section>

        <section className="guide-card">
          <h3>Progression</h3>
          <ul>
            <li>Spend yards on clubs, extra balls, and multipliers.</li>
            <li>Soft Landing improves approach control and reduces punishing long misses.</li>
            <li>Flat Stick raises one-putt odds and cuts three-putts.</li>
            <li>Caddie Read improves approach finish windows and makes Auto Caddie better near the green.</li>
            <li>Unlock Auto Caddie to keep swinging while you look away.</li>
            <li>Spend your yards in the Pro Shop after each round.</li>
            <li>Clear Meadow Municipal to unlock Moon Links.</li>
            <li>Pick any open course from the Clubhouse between rounds.</li>
          </ul>
        </section>

        <section className="guide-card">
          <h3>Balls and Pickups</h3>
          <ul>
            <li>Equip one ball at a time in the Ball Bag. Each trades one strength for another.</li>
            <li>New balls unlock from lifetime milestones and stay unlocked after turning pro.</li>
            <li>Pickups float over every hole. Stop the ball inside the ring under one to collect it.</li>
            <li>Coins pay upgrade yards, Stars fill Focus, Clovers make the next swing Perfect.</li>
            <li>Tailwind adds distance for three swings, Extra Ball adds a ball, Magnet widens the ring.</li>
          </ul>
        </section>

        <section className="guide-card">
          <h3>Pro Tour</h3>
          <ul>
            <li>Clear Meadow Municipal and Moon Links in one cycle to unlock Turn Pro.</li>
            <li>Each cleared course pays Pro Points from its best round this cycle.</li>
            <li>Even par pays the course value, and each stroke under par adds 5% (each stroke over takes 5%).</li>
            <li>Turning pro resets yard upgrades, perks, and course progress.</li>
            <li>Pro upgrades, achievements, lifetime stats, and course records are kept.</li>
            <li>Course Pass opens Sahara Sands, Glacier Greens, and Caldera Classic.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
