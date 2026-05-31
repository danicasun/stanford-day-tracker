import { blockToTimeStrings } from './helpers';

export async function submitToAirtable(payload) {
  const res = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Submission failed (${res.status})`);
  }
}

export function buildPayload(studentId, demographics, blocks) {
  return {
    student_id: studentId,
    submitted_at: new Date().toISOString(),
    demographics: {
      year: demographics.year,
      major: demographics.major,
      date_logged: demographics.date_logged,
      athlete: demographics.athlete,
    },
    blocks: blocks.map(b => {
      const { start, end } = blockToTimeStrings(b.startSlot, b.endSlot);
      return { start, end, activity: b.activity, note: b.note || '' };
    }),
  };
}
