# Golf

Golf is a tiny incremental game about grinding through an 18-hole course, turning every yard into upgrades, and coming back stronger next round.

It is built with React and Vite, saved locally in the browser, and intentionally kept small enough to iterate on quickly.

## Screenshot

Runtime screenshots can live in `docs/images/`.

<!--
After adding a screenshot, uncomment this line:

![Golf runtime screenshot](docs/images/runtime.png)
-->

## Gameplay Loop

1. Swing through an 18-hole round with a limited number of balls.
2. Earn yardage from every swing.
3. Spend earned yards on permanent upgrades.
4. Complete a course, choose a temporary perk, and pick the next course to play.
5. Clear the tour, turn pro for Pro Points, and buy permanent Tier 2 upgrades.
6. Start the next cycle stronger and unlock harder courses with Course Pass.

## Current Features

- 18-hole run structure with increasing target distances.
- Animated fairway view with ball movement and camera follow.
- Original pixel-art sprites: a golfer with a swing and walk cycle (astronaut suit on Moon Links), ball, waving flag, and parallax scenery per course theme. The flat renderer remains as a fallback.
- Aseprite-editable sprite sheets for the golfer, astronaut, six ball designs and six pickups (see `art/README.md`).
- Ball Bag: six balls (Classic, Gold, Fire, Ice, Lunar, Prism), each with its own trade-off, unlocked by lifetime milestones and kept through prestige.
- Course pickups (Coin, Star, Clover, Tailwind, Extra Ball, Magnet) float over every hole; stop the ball inside the ring to collect one.
- Pixel-style UI in two places: the course (hole, HUD and one control deck) and the Clubhouse between rounds (Tee Off, Pro Shop, Locker, Trophies, Tour Office).
- Simplified play stats with expandable detailed stats.
- On-screen rules and a clear goal for new players.
- Approach Mode once the pin is in reach, where landing accuracy matters more than raw overflow.
- Real pars (3/4/5), automatic putting from approach proximity, and the Flat Stick upgrade.
- Fairway water and bunkers, plus a Lay Up swing mode to play around them.
- Named holes with light gameplay traits and changing course palettes.
- Moon Links second course with its own yardage curve, hole names, and lunar palettes.
- Course-completion perk choices that carry into the next course attempt.
- Round wind modifiers and per-swing distance variance.
- Rare shot events such as bounces, cart paths, crowd boosts, and rough lies.
- Four swing modes with distinct jobs: Aggressive for clearing a new course, Normal for scoring, Safe for farming yards on a mastered course, and Lay Up for avoiding hazards.
- Manual Focus meter that rewards active play with stronger shots.
- Approach upgrades for softer landings, wider finish windows, and better Auto Caddie accuracy.
- Achievements and lifetime stats with bonus yard rewards.
- Permanent upgrades for yards per swing, starting balls, and yard multipliers.
- Partial upgrade investments with next-level stat previews.
- Unlockable Auto Caddie for idle swings with upgradeable speed.
- Round recap table with per-hole score details.
- Course select tab with per-course records, cycle bests, and unlock requirements.
- Pro Tour prestige: a better score to par on cleared courses earns more Pro Points. Par is set from your power at tee off.
- Turning pro pays a signing bonus of last cycle's yards and lands in the Clubhouse, so new courses can be picked right away.
- Tier 2 Pro upgrades: Pro Clubs, Course Pass, Auto Driver, Yardage Book, Tour Bag, and Signing Bonus.
- Course Pass courses: Sahara Sands, Glacier Greens, and Caldera Classic.
- Local storage save/load support with versioned migrations.
- Round-end upgrade screen.

## Run Locally

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Public Build

GitHub Pages is deployed from `main` with the workflow in `.github/workflows/deploy-pages.yml`.

The Pages build uses `/golf/` as the asset base path. Local development continues to run from `/`.

## Project Shape

- `src/App.jsx` owns the main game state transitions.
- `src/logic/` contains save, swing, upgrade, and round helpers.
- `src/data/upgrades.js` defines upgrade costs and effects.
- `src/data/courses.js` defines course progression, hole themes, and yardage curves.
- `src/data/proUpgrades.js` defines Tier 2 upgrades bought with Pro Points.
- `src/logic/prestigeLogic.js` handles Pro Point scoring and the prestige reset.
- `src/data/coursePerks.js` defines temporary course-completion rewards.
- `src/data/swingModes.js` defines safe, normal, and aggressive shot behavior.
- `src/components/` contains the game and upgrade screens.

## Roadmap

The next wave is focused on making the game feel more like golf and more replayable:

- More Course Pass courses (see the course table in ROADMAP.md).
- Rarer and course-specific perks.
- Shot-mode upgrades.

See [ROADMAP.md](ROADMAP.md) for the living backlog.
