import { useState, useRef, useEffect } from 'react';
import { STANFORD_MAJORS } from '../utils/constants';
import './DemographicIntake.css';

const YEAR_OPTIONS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad', 'Other'];
const ATHLETE_OPTIONS = ['Yes', 'No'];

// Compute yesterday's date as the default
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const DEFAULT_DATE = yesterday.toISOString().split('T')[0];

// Today's date string — used to cap the date picker
const today = new Date().toISOString().split('T')[0];

export function DemographicIntake({ onComplete }) {
  const [year, setYear] = useState('');
  const [major, setMajor] = useState('');
  const [majorQuery, setMajorQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [date_logged, setDateLogged] = useState(DEFAULT_DATE);
  const [unusualDay, setUnusualDay] = useState('');
  const [athlete, setAthlete] = useState('');

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const trimmedQuery = majorQuery.trim();

  const filteredMajors = trimmedQuery === ''
    ? STANFORD_MAJORS
    : STANFORD_MAJORS.filter(m =>
        m.toLowerCase().includes(trimmedQuery.toLowerCase())
      );

  // Show a "use custom" option when query is non-empty and isn't an exact predefined match
  const showCustomOption =
    trimmedQuery.length > 0 &&
    !STANFORD_MAJORS.some(m => m.toLowerCase() === trimmedQuery.toLowerCase());

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleMajorInputChange(e) {
    const val = e.target.value;
    setMajorQuery(val);
    setMajor(''); // clear confirmed selection while typing
    setDropdownOpen(true);
  }

  function handleMajorSelect(option) {
    setMajor(option);
    setMajorQuery(option);
    setDropdownOpen(false);
  }

  function handleMajorInputFocus() {
    setDropdownOpen(true);
  }

  // All required fields filled?
  const isValid = year !== '' && major !== '' && date_logged !== '' && athlete !== '';

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    onComplete({ year, major, date_logged, athlete });
  }

  return (
    <div className="intake-card">
      <h1 className="intake-title">Stanford Day in the Life</h1>
      <p className="intake-subtitle">
        This takes under 3 minutes. Tell us a little about yourself first.
      </p>

      <h2 className="intake-section-header">About You</h2>
      <hr className="intake-divider" />

      <form onSubmit={handleSubmit} noValidate>

        {/* Year */}
        <div className="intake-field">
          <label className="intake-label">What year are you?</label>
          <div className="pill-group" role="group" aria-label="Year">
            {YEAR_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                className={`pill${year === option ? ' selected' : ''}`}
                onClick={() => setYear(option)}
                aria-pressed={year === option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Major — searchable dropdown */}
        <div className="intake-field">
          <label className="intake-label" htmlFor="major-input">What's your major?</label>
          <div className="intake-dropdown-wrapper" ref={dropdownRef}>
            <input
              id="major-input"
              ref={inputRef}
              type="text"
              className="intake-input"
              placeholder="Search or select a major…"
              value={majorQuery}
              onChange={handleMajorInputChange}
              onFocus={handleMajorInputFocus}
              autoComplete="off"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            />
            {dropdownOpen && (
              <div className="intake-dropdown-list" role="listbox" aria-label="Majors">
                {filteredMajors.map(option => (
                  <div
                    key={option}
                    className={`intake-dropdown-item${major === option ? ' focused' : ''}`}
                    role="option"
                    aria-selected={major === option}
                    onMouseDown={() => handleMajorSelect(option)}
                  >
                    {option}
                  </div>
                ))}
                {showCustomOption && (
                  <div
                    className="intake-dropdown-item intake-dropdown-custom"
                    role="option"
                    onMouseDown={() => handleMajorSelect(trimmedQuery)}
                  >
                    + Use &ldquo;{trimmedQuery}&rdquo;
                  </div>
                )}
                {filteredMajors.length === 0 && !showCustomOption && (
                  <div className="intake-dropdown-empty">No majors found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date logged */}
        <div className="intake-field">
          <label className="intake-label" htmlFor="date-input">What day are you logging?</label>
          <input
            id="date-input"
            type="date"
            className="intake-input"
            value={date_logged}
            max={today}
            onChange={e => setDateLogged(e.target.value)}
          />
        </div>

        {/* Anything unusual (optional) */}
        <div className="intake-field">
          <label className="intake-label" htmlFor="unusual-input">
            Anything unusual about your day?{' '}
            <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
          </label>
          <input
            id="unusual-input"
            type="text"
            className="intake-input"
            placeholder="e.g. finals week, sick day, holiday…"
            value={unusualDay}
            onChange={e => setUnusualDay(e.target.value)}
          />
        </div>

        {/* Athlete */}
        <div className="intake-field">
          <label className="intake-label">Are you a student athlete?</label>
          <div className="pill-group" role="group" aria-label="Student athlete">
            {ATHLETE_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                className={`pill${athlete === option ? ' selected' : ''}`}
                onClick={() => setAthlete(option)}
                aria-pressed={athlete === option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="intake-submit"
          disabled={!isValid}
        >
          Start Logging My Day →
        </button>
      </form>
    </div>
  );
}
