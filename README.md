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
- Round wind modifiers and per-swing distance variance.
- Permanent upgrades for yards per swing, starting balls, and yard multipliers.
- Partial upgrade investments with next-level stat previews.
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

## Project Shape

- `src/App.jsx` owns the main game state transitions.
- `src/logic/` contains save, swing, upgrade, and round helpers.
- `src/data/upgrades.js` defines upgrade costs and effects.
- `src/components/` contains the game and upgrade screens.

## Roadmap

The next wave is focused on making the game feel more like golf and more replayable:

- Scorecards, par, and best-round tracking.
- Prestige scoring and Tier 2 progression.

See [ROADMAP.md](ROADMAP.md) for the living backlog.
