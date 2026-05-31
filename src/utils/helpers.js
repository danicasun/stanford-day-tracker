import { SLOT_DURATION, TIMELINE_START_HOUR, NUM_SLOTS } from './constants';

// Convert slot index (0 = 6:00 AM) to minutes from midnight
export function slotToMinutes(slot) {
  return (TIMELINE_START_HOUR * 60 + slot * SLOT_DURATION) % (24 * 60);
}

// Convert minutes from midnight to "HH:MM" string
export function minutesToTimeStr(minutesMidnight) {
  const h = Math.floor(minutesMidnight / 60) % 24;
  const m = minutesMidnight % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Convert slot index to display label like "6:00 AM", "12:00 PM", "12:00 AM"
export function slotToLabel(slot) {
  const totalMin = TIMELINE_START_HOUR * 60 + slot * SLOT_DURATION;
  const mins = totalMin % 60;
  let hours = Math.floor(totalMin / 60) % 24;
  const ampm = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${String(mins).padStart(2, '0')} ${ampm}`;
}

// Block start/end stored as slot indices
// Convert block slots to "HH:MM" export strings
export function blockToTimeStrings(startSlot, endSlot) {
  return {
    start: minutesToTimeStr(slotToMinutes(startSlot)),
    end: minutesToTimeStr(slotToMinutes(endSlot)),
  };
}

// Check if two blocks overlap (slots)
export function blocksOverlap(a, b) {
  return a.startSlot < b.endSlot && b.startSlot < a.endSlot;
}

// Find gap slots (slot indices) not covered by any block, grouped into runs
export function findGaps(blocks) {
  const covered = new Set();
  blocks.forEach(b => {
    for (let s = b.startSlot; s < b.endSlot; s++) covered.add(s);
  });
  const gaps = [];
  let run = null;
  for (let s = 0; s < NUM_SLOTS; s++) {
    if (!covered.has(s)) {
      if (!run) run = { startSlot: s, endSlot: s + 1 };
      else run.endSlot = s + 1;
    } else if (run) {
      gaps.push(run);
      run = null;
    }
  }
  if (run) gaps.push(run);
  // Only return gaps longer than 2 slots (>1 hour)
  return gaps.filter(g => g.endSlot - g.startSlot > 12); // > 1 hour
}

export function generateId() {
  return crypto.randomUUID();
}

export function totalLoggedMinutes(blocks) {
  return blocks.reduce((acc, b) => acc + (b.endSlot - b.startSlot) * SLOT_DURATION, 0);
}
