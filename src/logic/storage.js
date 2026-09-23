import { SAVE_VERSION, normalizeState } from './gameState.js';

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
    if (!parsed?.version || parsed.version > SAVE_VERSION) {
      // Unknown future saves are safer to drop than to interpret.
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return normalizeState(parsed);
  } catch (e) {
    console.warn('Could not load game:', e);
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
