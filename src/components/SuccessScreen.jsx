import { CATEGORIES, CATEGORY_MAP } from '../utils/constants';


function slotToDisplay(slot) {
  const totalMin = 6 * 60 + slot * 5;
  const mins = totalMin % 60;
  let hours = Math.floor(totalMin / 60) % 24;
  const ampm = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${String(mins).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  // dateStr expected as YYYY-MM-DD or similar parseable format
  const d = new Date(dateStr + 'T12:00:00'); // noon to avoid timezone shift
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function SuccessScreen({ demographics, blocks, onReset }) {
  const totalMinutes = blocks.reduce(
    (acc, b) => acc + (b.endSlot - b.startSlot) * 5,
    0
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  const sortedBlocks = [...blocks].sort((a, b) => a.startSlot - b.startSlot);

  const dateLabel = demographics?.date_logged
    ? formatDate(demographics.date_logged)
    : 'your day';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Checkmark */}
        <div style={styles.checkCircle}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="24" cy="24" r="24" fill="#8C1515" />
            <path
              d="M14 24.5l7 7 13-14"
              stroke="#fff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 style={styles.heading}>Thanks! Your day has been logged.</h1>

        <p style={styles.summary}>
          You logged <strong>{totalHours} hours</strong> of your day on{' '}
          <strong>{dateLabel}</strong>.
        </p>

        {/* Block list */}
        <div style={styles.blockList}>
          {sortedBlocks.map((block, i) => {
            const cat = CATEGORY_MAP[block.activity] ?? {
              color: '#d1d5db',
              text: '#374151',
            };
            const timeRange = `${slotToDisplay(block.startSlot)} – ${slotToDisplay(block.endSlot)}`;
            return (
              <div key={block.id ?? i} style={styles.blockRow}>
                <span
                  style={{
                    ...styles.colorDot,
                    backgroundColor: cat.color,
                  }}
                  aria-hidden="true"
                />
                <span style={styles.activityName}>{block.activity}</span>
                <span style={styles.timeRange}>{timeRange}</span>
                {block.note ? (
                  <span style={styles.noteText}>{block.note}</span>
                ) : null}
              </div>
            );
          })}
        </div>

        <button style={styles.resetBtn} type="button" onClick={onReset}>
          Log another day
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '24px',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px 32px',
    maxWidth: '520px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  checkCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#8C1515',
    margin: 0,
    textAlign: 'center',
  },
  summary: {
    fontSize: '16px',
    color: '#374151',
    margin: 0,
    textAlign: 'center',
  },
  blockList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '340px',
    overflowY: 'auto',
  },
  blockRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '8px 12px',
    flexWrap: 'wrap',
  },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  activityName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111',
    flexShrink: 0,
  },
  timeRange: {
    fontSize: '13px',
    color: '#6b7280',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  noteText: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
    width: '100%',
    paddingLeft: '22px',
  },
  resetBtn: {
    marginTop: '8px',
    backgroundColor: '#8C1515',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
};
