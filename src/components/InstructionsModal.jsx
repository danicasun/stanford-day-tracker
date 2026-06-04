import './InstructionsModal.css';

const CATEGORY_GUIDE = [
  { name: 'Sleep', desc: 'Nighttime sleep and naps.' },
  { name: 'Class', desc: 'Any scheduled lecture, section, office hours, or lab.' },
  { name: 'Studying / Schoolwork', desc: 'Homework, reading, problem sets, preparing for exams.' },
  { name: 'Eating', desc: 'All meals and snacks, including meals eaten with friends. If you\'re grabbing dinner with friends, log it as Eating, not Socializing.' },
  { name: 'Social Event', desc: 'Time spent with others where the primary purpose is hanging out (more explicit social events, not eating or studying with friends).' },
  { name: 'Exercise', desc: 'Gym, sports, walks, runs, club sports, etc.' },
  { name: 'Stanford Athletics / Practice', desc: 'For officially rostered Stanford team athletes only. Includes team practice, games, meets, matches, and required team activities (film sessions, team meals, etc.). If you work out on your own or are on a club team, use Exercise instead.' },
  { name: 'Work / Research', desc: 'Paid part-time/full-time jobs, RA/on-campus work, lab research.' },
  { name: 'Clubs / Professional Events', desc: 'Club meetings, performances, campus events.' },
  { name: 'Transit / Commute', desc: 'Commuting, walking between classes, driving.' },
  { name: 'Personal / Chores', desc: 'Hygiene, laundry, errands, appointments.' },
  { name: 'Leisure / Entertainment', desc: 'TV, gaming, scrolling, reading for fun.' },
  { name: 'Other', desc: 'Anything that doesn\'t fit above.' },
];

const TIPS = [
  'Log yesterday or the day before, not a "typical day" off the top of your head.',
  'Do your best guess on start and end times, it doesn\'t need to be exact.',
  'Every unique activity counts, even a 30-minute shower or commute.',
];

export function InstructionsModal({ onClose }) {
  return (
    <div className="instructions-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="instructions-card" role="dialog" aria-modal="true" aria-label="How to log your day">
        <button className="instructions-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="instructions-heading">How to log your day</h2>
        <p className="instructions-intro">
          Click and drag on the timeline to create a block. Select the activity category, add an optional note, and repeat until your day is filled in.
        </p>
        <p className="instructions-anonymous">All data collected is anonymous.</p>

        <h3 className="instructions-section-heading">Category guide</h3>
        <ul className="instructions-category-list">
          {CATEGORY_GUIDE.map(({ name, desc }) => (
            <li key={name}>
              <span className="instructions-category-name">{name}</span>
              {' — '}
              {desc}
            </li>
          ))}
        </ul>

        <h3 className="instructions-section-heading">A few tips</h3>
        <ul className="instructions-tips-list">
          {TIPS.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>

        <a
          href="/dayatstanford"
          className="instructions-data-link"
        >
          What will my data be used for?
        </a>

        <button className="instructions-got-it" onClick={onClose}>Got it →</button>
      </div>
    </div>
  );
}
