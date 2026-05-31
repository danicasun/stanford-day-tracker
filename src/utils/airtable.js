import { blockToTimeStrings } from './helpers';

const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const TABLE_NAME = import.meta.env.VITE_AIRTABLE_TABLE_NAME;

export async function submitToAirtable(payload) {
  const { submitted_at, demographics, blocks } = payload;

  const records = blocks.map(block => {
    return {
      fields: {
        submitted_at,
        year: demographics.year,
        major: demographics.major,
        date_logged: demographics.date_logged,
        athlete: demographics.athlete,
        start_time: block.start,
        end_time: block.end,
        activity: block.activity,
        note: block.note || '',
      },
    };
  });

  // Airtable accepts max 10 records per request — batch if needed
  const BATCH_SIZE = 10;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: batch }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Airtable error ${res.status}`);
    }
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
