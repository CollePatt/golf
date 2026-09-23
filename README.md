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
4. Start the next round with better stats.

## Current Features

- 18-hole run structure with increasing target distances.
- Animated fairway view with ball movement and camera follow.
- Wider tabbed layout for play, upgrades, scorecard, and guide screens.
- On-screen rules and a clear goal for new players.
- Named holes with light gameplay traits and changing course palettes.
- Round wind modifiers and per-swing distance variance.
- Manual Focus meter that rewards active play with stronger shots.
- Permanent upgrades for yards per swing, starting balls, and yard multipliers.
- Partial upgrade investments with next-level stat previews.
- Unlockable Auto Caddie for idle swings with upgradeable speed.
- Round recap table with per-hole score details.
- Local storage save/load support.
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
- `src/components/` contains the game and upgrade screens.

## Roadmap

The next wave is focused on making the game feel more like golf and more replayable:

- Scorecards, par, and best-round tracking.
- Achievements and one-time milestone rewards.
- Prestige scoring and Tier 2 progression.

See [ROADMAP.md](ROADMAP.md) for the living backlog.
