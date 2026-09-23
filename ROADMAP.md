# Golf — Design Roadmap

This game is an incremental. The loop below is groundwork; more upgrades will be added over time.

## Core loop

1. Play through 18 holes (each hole = one "run" with a yardage target).
2. After hole 18, **prestige**: reset progress and earn prestige points.
3. Spend prestige points on Tier 2 upgrades.
4. Replay the 18 holes, faster/stronger, and prestige again.

Hole-yardage growth across the 18 holes is TBD — we'll design that after the upgrade interactions are settled.

## Tier 1 upgrades (pre-prestige, bought with yards earned during runs)

1. **+ yards per swing** — flat additive boost.
2. **+ total balls** — more swings allowed per hole.
3. **Small yards multiplier** — minor multiplier, not a major power spike.

These are intentionally modest so prestige is the real progression gate.

## Prestige

- Triggers after completing all 18 holes.
- Prestige points are awarded based on **total shots taken** across the 18 holes.
- **Fewer shots → more prestige points** (mirrors real golf scoring — under par is good).
- Resets Tier 1 progress; Tier 2 upgrades persist.

Open questions: exact scoring curve (par per hole? a global shot budget?), whether prestige points are spent or accumulated as a permanent stat.

## Tier 2 upgrades (post-prestige, bought with prestige points)

1. **Club upgrade** — meaningful yards multiplier (bigger than the Tier 1 small multiplier).
2. **Course pass** — unlocks additional courses / multi-course play.
3. **Auto driver** — automation upgrade; enables auto-swinging (idle reach).

## Notes

- This list is the starting skeleton. Expect more upgrades (Tier 1 and Tier 2) as the design evolves.
- The upgrade system in `src/data/upgrades.js` is data-driven (`addYards`, `multYards`, `addBalls` effect types). New effect types will be needed for Tier 2 (e.g., auto-swing, course unlocks).

## Easy Next Additions

1. **Scorecard and best round** - Track per-hole shots, total score, and best completed round in local storage.
2. **Par targets** - Give each hole a par value so round results feel more like golf than pure distance clearing.
3. **Achievements** - Award small one-time yard bonuses for milestones like first birdie, first 1,000-yard round, or finishing 18 holes.
4. **Prestige scoring** - Convert completed-round score into prestige points, then reset Tier 1 upgrades for Tier 2 progress.
5. **Auto swing unlock** - Add an early idle mechanic that swings once every few seconds after the player buys it.
