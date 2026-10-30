// Real-time rhythm: one story day per real calendar day. Leaving is never punished.

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(a, b) {
  if (!a || !b) return 0;
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

export function scenesOfDay(chapter, day) {
  return chapter.scenes.filter(s => s.day === day);
}

export function dayComplete(chapter, state, day) {
  const list = scenesOfDay(chapter, day);
  return list.length > 0 && list.every(s => state.done[s.id]);
}

// What can be played right now.
//   { status: 'play', day, scene }      next scene to play
//   { status: 'wait', day }             day `day` is unlocked tomorrow
//   { status: 'end' }                   chapter finished
export function nextUp(chapter, state, today) {
  for (let day = 0; day <= chapter.lastDay; day++) {
    const list = scenesOfDay(chapter, day);
    const pending = list.find(s => !state.done[s.id]);
    if (!pending) continue;
    if (day > 0 && state.settings.pace === 'real') {
      const prevDone = state.dayDoneOn[day - 1];
      if (prevDone && daysBetween(prevDone, today) < 1) return { status: 'wait', day };
    }
    return { status: 'play', day, scene: pending };
  }
  return { status: 'end' };
}

export function markDayIfComplete(chapter, state, day, today) {
  if (dayComplete(chapter, state, day) && !state.dayDoneOn[day]) {
    state.dayDoneOn[day] = today;
    return true;
  }
  return false;
}

// How long the player was away since the last visit (0 = same day).
export function absence(state, today) {
  return state.lastVisit ? Math.max(0, daysBetween(state.lastVisit, today)) : 0;
}

export function partOfDay(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 9) return 'dawn';
  if (h >= 9 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}
