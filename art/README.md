# Sprite sheets

The `.aseprite` files in `art/sprites/` are the editable sources for the game's sprites. The game loads the exported PNG and JSON pairs in `src/assets/sprites/`.

| File | Cell | Tags |
| --- | --- | --- |
| `golfer.aseprite` | 36×30 | `idle`, `swing`, `follow`, `walk` |
| `astronaut.aseprite` | 36×30 | Same as the golfer; used on Moon Links |
| `balls.aseprite` | 12×8 | `classic`, `gold`, `fire`, `ice`, `lunar`, `prism` |
| `pickups.aseprite` | 12×12 | `coin`, `star`, `clover`, `tailwind`, `extraBall`, `magnet` |

## Editing workflow

1. Open a file in `art/sprites/` with Aseprite and edit it. You can add frames, change frame durations or recolor.
2. Run `npm run sprites:export` to write the PNG and JSON into `src/assets/sprites/`. This needs the Aseprite CLI. If `aseprite` isn't on your PATH, set `ASEPRITE` to the binary, for example `ASEPRITE=/Applications/Aseprite.app/Contents/MacOS/aseprite npm run sprites:export`.
3. Run `npm run dev`. The game picks up the new sheet.

## What the game reads from the sheet

**Tags** pick the animation, and frame durations set its timing.
- The `swing` tag's total duration is the moment of impact. The ball launches when the swing tag ends, so making the backswing slower delays the shot.
- `follow` plays once and holds its last frame while the ball is in the air.
- `idle` and `walk` loop.

**Slices** mark anchor points. Keep their names, and move them in Aseprite if the art shifts.
- `ball`, on the golfer sheets, is where the ball sits. Its y position is ground level.
- `center`, on `balls`, is the middle of the ball. The space left of it in each cell is for trails, like the fire and prism streaks.

On screen, golfers are drawn at 3× and balls at 2×. Pickups aren't placed on the course yet; their sheet is ready for a power-up or collectible feature.

## Regenerating from code

`npm run sprites:generate` builds the starter sheets from the code-drawn sprites in `src/sprites/`. It skips any `.aseprite` file that already exists. Use `-- --force` only if you want to throw away your edits and start over.
