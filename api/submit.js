const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Responses';

const VALID_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad', 'Other'];
const VALID_ATHLETE = ['Yes', 'No'];
const VALID_ACTIVITIES = [
  'Sleep', 'Class', 'Studying / Schoolwork', 'Eating', 'Social Event',
  'Exercise', 'Stanford Athletics / Practice', 'Work / Research',
  'Clubs / Professional Events', 'Transit / Commute', 'Personal Care / Chores',
  'Leisure / Entertainment', 'Religion', 'Other',
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function validate(body) {
  const { submitted_at, demographics, blocks } = body ?? {};

  if (!demographics || typeof demographics !== 'object') return 'Missing demographics';
  if (!VALID_YEARS.includes(demographics.year)) return 'Invalid year';
  if (!VALID_ATHLETE.includes(demographics.athlete)) return 'Invalid athlete value';
  if (typeof demographics.major !== 'string' || demographics.major.trim().length === 0 || demographics.major.length > 200) return 'Invalid major';
  if (typeof demographics.date_logged !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(demographics.date_logged)) return 'Invalid date_logged';

  if (!Array.isArray(blocks) || blocks.length === 0 || blocks.length > 150) return 'Invalid blocks';

  for (const b of blocks) {
    if (!TIME_RE.test(b.start)) return `Invalid start time: ${b.start}`;
    if (!TIME_RE.test(b.end)) return `Invalid end time: ${b.end}`;
    if (!VALID_ACTIVITIES.includes(b.activity)) return `Invalid activity: ${b.activity}`;
    if (typeof b.note !== 'string' || b.note.length > 500) return 'Note too long';
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validationError = validate(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { submitted_at, demographics, blocks } = req.body;

  const records = blocks.map(block => ({
    fields: {
      submitted_at: submitted_at ?? new Date().toISOString(),
      year: demographics.year,
      major: demographics.major.trim(),
      date_logged: demographics.date_logged,
      athlete: demographics.athlete,
      start_time: block.start,
      end_time: block.end,
      activity: block.activity,
      note: block.note || '',
    },
  }));

  const BATCH_SIZE = 10;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: batch }),
      }
    );

    if (!airtableRes.ok) {
      const err = await airtableRes.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || 'Airtable submission failed' });
    }
  }

  return res.status(200).json({ ok: true });
}
