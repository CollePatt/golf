import { SAVE_VERSION } from './gameState.js';

const SAVE_KEY = 'golf_save';

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save game:', e);
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== SAVE_VERSION) {
      // Schema changed — drop the stale save rather than try to migrate.
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return parsed;
  } catch (e) {
    console.warn('Could not load game:', e);
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
