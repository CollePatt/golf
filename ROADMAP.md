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

## Prestige (Pro Tour) — implemented

- Unlocks once every tour course (Meadow Municipal, Moon Links) is cleared in the current pro cycle.
- Each course cleared this cycle pays Pro Points from its best round: `prestigeValue × (1 + 0.05 × strokes under par)`, clamped to 0.25×–3×, minimum 1.
- **Fewer shots → more Pro Points.** Even par pays the course's `prestigeValue`.
- Pro Points are spent on Tier 2 upgrades; lifetime earned and times turned pro are tracked as permanent stats.
- Turning pro resets Tier 1 upgrades, yards, perks, and cycle course progress. Tier 2 upgrades, achievements, lifetime stats, and all-time course records persist.
- Logic lives in `src/logic/prestigeLogic.js`.

## Par, putting, and hazards — implemented

- Par per hole = full swings to reach the green at the player's yards per swing when they tee off, plus two putts (minimum 3). Par follows power, so the score shows how well a round was played rather than how strong the player is. `npm run sim:par` checks how simulated rounds land against it.
- Approach range grows with swing power (at least 120 yds), so a strong hitter attacks par 3s from the tee. Long approaches carry extra error that shrinks as power grows.
- Approaches that finish are putted out from their proximity: closer means more one-putts, holing the approach needs none. Putts add strokes but never cost balls, so the ball pool limits finishing, not scoring.
- Fairway hazards follow a fixed per-hole rhythm: water (+1 stroke, lost ball, drop short) and bunkers (next shot 30% shorter). Hazards only activate once a swing can carry them.
- Lay Up swing mode plays Safe and stops short of the next hazard.
- Logic lives in `src/logic/holeLogic.js`; `src/logic/approachLogic.js` handles approach accuracy.

Simulated rounds (Meadow Municipal, par 76): Tier 1 max power without approach or putting upgrades averages about par; with Soft Landing, Caddie Read, and Flat Stick maxed, about 10 under; heavy Pro Clubs pushes toward 30 under, which caps Pro Points at 3× and nudges players to harder courses.

## Tier 2 upgrades (bought with Pro Points) — implemented

Defined in `src/data/proUpgrades.js` and applied alongside Tier 1 via `getEffectLevels(state)`.

1. **Pro Clubs** — ×1.3 yards per swing per level.
2. **Course Pass** — each level opens the next Course Pass course (`unlockCourse`).
3. **Auto Driver** — free Auto Caddie levels that survive turning pro (`autoSwing`).
4. **Yardage Book** — ×1.2 yards earned for upgrades per level (`yardsEarnedMult`).
5. **Tour Bag** — +5 starting balls per level.

## Courses

Course select lives on the Courses tab; any open course can be picked between rounds.

| Course | Unlock | Pro Points at par | Status |
| --- | --- | --- | --- |
| Meadow Municipal | Start | 4 | Live |
| Moon Links | Clear Meadow this cycle | 6 | Live |
| Sahara Sands | Course Pass 1 | 10 | Live |
| Glacier Greens | Course Pass 2 | 15 | Live |
| Caldera Classic | Course Pass 3 | 22 | Live |
| Cloud Nine | Course Pass 4 | 30 | Planned: floating islands, gaps that eat short shots |
| Abyssal Links | Course Pass 5 | 40 | Planned: underwater, heavy drag but huge current-assisted holes |
| Neon Night Nine | Course Pass 6 | 55 | Planned: city rooftops, ricochet events off billboards |
| Mars Dunes | Course Pass 7 | 75 | Planned: low gravity + dust storms that flip wind mid-round |

Planned course ideas beyond the table: course-specific shot events, a per-course signature perk, and weekly "featured course" bonuses.

## Notes

- This list is the starting skeleton. Expect more upgrades (Tier 1 and Tier 2) as the design evolves.
- The upgrade system in `src/data/upgrades.js` is data-driven (`addYards`, `multYards`, `addBalls` effect types). New effect types will be needed for Tier 2 (e.g., auto-swing, course unlocks).

## Easy Next Additions

1. **Shot-mode upgrades** - Let upgrades or perks specialize safe, normal, and aggressive swings even further.
2. **Perk variety** - Add rarer or course-specific perks after the current three prove out.
3. **Auto upgrade routing** - Let players nominate a favorite upgrade for future automation systems.
