# Golf

A small incremental golf game built with React and Vite.

The current loop is intentionally simple:

1. Swing through an 18-hole round.
2. Earn yardage from every swing.
3. Spend earned yards on permanent upgrades.
4. Start the next round stronger.

## Run Locally

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Current Gameplay

- Each hole has a yardage target.
- Every swing advances the ball by your current yards-per-swing stat.
- Balls are limited each round.
- Between rounds, earned yards can be invested into upgrades.
- Progress is saved in local storage.

## Project Shape

- `src/App.jsx` owns the main game state transitions.
- `src/logic/` contains save, swing, upgrade, and round helpers.
- `src/data/upgrades.js` defines upgrade costs and effects.
- `src/components/` contains the game and upgrade screens.
