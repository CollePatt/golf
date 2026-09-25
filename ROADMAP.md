# Golf — Design Roadmap

This game is an incremental. The loop below is groundwork; more upgrades will be added over time.

## Core loop

1. Play through an 18-hole course with a limited number of balls.
2. Spend earned yards on permanent upgrades after the round ends.
3. Complete a course to choose a temporary perk for the next course attempt.
4. Push into additional courses with stronger upgrades and better scores.

Course yardage curves now live in `src/data/courses.js`, so each course can tune target growth separately.

## Tier 1 upgrades (pre-prestige, bought with yards earned during runs)

1. **+ yards per swing** — flat additive boost.
2. **+ total balls** — more swings allowed per hole.
3. **Small yards multiplier** — minor multiplier, not a major power spike.

These are intentionally modest so prestige is the real progression gate.

## Prestige

- Triggers after completing a full course chain.
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

1. **Course selection** - Let completed courses be replayed intentionally instead of only following the next-course path.
2. **Prestige scoring** - Convert completed course-chain score into prestige points, then reset Tier 1 upgrades for Tier 2 progress.
3. **Shot-mode upgrades** - Let upgrades or perks specialize safe, normal, and aggressive swings even further.
4. **Perk variety** - Add rarer or course-specific perks after the current three prove out.
5. **Auto upgrade routing** - Let players nominate a favorite upgrade for future automation systems.
