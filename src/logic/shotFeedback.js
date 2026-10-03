// How a resolved swing reads on the hole canvas: a stamped word over the
// landing spot, a tone that picks its color, and the landing effect.
//
//   tone   : great | good | plain | weak | bad
//   effect : dust | sand | splash | skip | holed
//   note   : optional extra word for the line under the stamp

const BUNKER_WORDS = {
  sand: 'SAND',
  dune: 'DUNE TRAP',
  crater: 'CRATER',
  snow: 'SNOWBANK',
  ash: 'ASH PIT',
};

const WATER_WORDS = {
  lava: 'SIZZLE',
};

const QUALITY_STAMPS = {
  Focused: { label: 'FOCUSED', tone: 'great' },
  Perfect: { label: 'PERFECT', tone: 'great' },
  Clean: { label: 'CLEAN', tone: 'good' },
  Steady: { label: '', tone: 'plain' },
  Soft: { label: 'SOFT', tone: 'weak' },
};

export function describeShot(swing) {
  const quality = QUALITY_STAMPS[swing.quality] || QUALITY_STAMPS.Steady;
  const base = {
    label: quality.label,
    tone: quality.tone,
    effect: 'dust',
    // Pure strikes leave a trail whatever happens after they land.
    trail: quality.tone === 'great',
  };

  if (swing.hazard?.type === 'water') {
    return { ...base, label: WATER_WORDS[swing.hazard.look] || 'SPLASH', tone: 'bad', effect: 'splash' };
  }
  if (swing.hazard?.type === 'skip') {
    return { ...base, label: 'SKIPPED IT', tone: 'great', effect: 'skip' };
  }
  if (swing.hazard?.type === 'bunker') {
    return { ...base, label: BUNKER_WORDS[swing.hazard.look] || 'BUNKER', tone: 'bad', effect: 'sand' };
  }

  const approach = swing.approach;
  if (approach && approach.grade !== 'setup') {
    if (approach.cleared) {
      const holedOut = swing.putting?.putts === 0;
      return {
        ...base,
        label: holedOut ? 'IN THE CUP' : approach.grade === 'great' ? 'STUFFED IT' : 'ON THE GREEN',
        tone: holedOut || approach.grade === 'great' ? 'great' : 'good',
        effect: 'holed',
      };
    }
    return {
      ...base,
      label: approach.label.toUpperCase(),
      tone: approach.grade === 'bad' ? 'bad' : 'weak',
    };
  }

  if (swing.laidUp) return { ...base, label: 'LAID UP', tone: 'plain' };
  // A pure strike keeps the stamp; a bounce or rough rides along as a note.
  if (swing.event && swing.event.multiplier !== 1 && quality.tone === 'great') {
    return { ...base, note: swing.event.label.toLowerCase() };
  }
  // Otherwise distance events are rarer than a clean strike, so they win.
  if (swing.event && swing.event.multiplier !== 1) {
    return {
      ...base,
      label: swing.event.label.toUpperCase(),
      tone: swing.event.multiplier > 1 ? 'good' : 'weak',
    };
  }
  return base;
}

export function describeHoleResult({ shots, scoreToPar }) {
  if (shots === 1) return { label: 'HOLE IN ONE', tone: 'great' };
  if (scoreToPar <= -3) return { label: 'ALBATROSS', tone: 'great' };
  if (scoreToPar === -2) return { label: 'EAGLE', tone: 'great' };
  if (scoreToPar === -1) return { label: 'BIRDIE', tone: 'good' };
  if (scoreToPar === 0) return { label: 'PAR', tone: 'plain' };
  if (scoreToPar === 1) return { label: 'BOGEY', tone: 'weak' };
  if (scoreToPar === 2) return { label: 'DOUBLE BOGEY', tone: 'bad' };
  if (scoreToPar === 3) return { label: 'TRIPLE BOGEY', tone: 'bad' };
  return { label: `${scoreToPar} OVER`, tone: 'bad' };
}
