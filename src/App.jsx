import { useState, useEffect, useCallback } from 'react';
import { DemographicIntake } from './components/DemographicIntake';
import { Timeline } from './components/Timeline';
import { ActivityModal } from './components/ActivityModal';
import { InstructionsModal } from './components/InstructionsModal';
import { SuccessScreen } from './components/SuccessScreen';
import { generateId, totalLoggedMinutes } from './utils/helpers';
import { submitToAirtable, buildPayload } from './utils/airtable';
import './index.css';

const STORAGE_KEY = 'stanford-day-v1';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function App() {
  const [screen, setScreen] = useState('intake');
  const [demographics, setDemographics] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [studentId] = useState(() => generateId());
  const [modalBlock, setModalBlock] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorPayload, setErrorPayload] = useState(null);
  const [submitWarning, setSubmitWarning] = useState(null);

  useEffect(() => {
    const saved = loadFromStorage();
    if (saved?.demographics) {
      setDemographics(saved.demographics);
      setBlocks(saved.blocks || []);
      setScreen('timeline');
    }
  }, []);

  useEffect(() => {
    if (screen === 'timeline') {
      saveToStorage({ demographics, blocks });
    }
  }, [screen, demographics, blocks]);

  const handleIntakeComplete = useCallback((demo) => {
    setDemographics(demo);
    setScreen('timeline');
    setShowInstructions(true);
  }, []);

  const handleBlockClick = useCallback((block) => {
    setModalBlock(block);
  }, []);

  const handleModalSave = useCallback((updatedBlock) => {
    setBlocks(prev => {
      const exists = prev.find(b => b.id === updatedBlock.id);
      if (exists) return prev.map(b => b.id === updatedBlock.id ? updatedBlock : b);
      return [...prev, updatedBlock];
    });
    setModalBlock(null);
  }, []);

  const handleModalDelete = useCallback(() => {
    if (modalBlock) setBlocks(prev => prev.filter(b => b.id !== modalBlock.id));
    setModalBlock(null);
  }, [modalBlock]);

  const handleModalClose = useCallback(() => setModalBlock(null), []);

  async function handleSubmit(force = false) {
    const loggedMins = totalLoggedMinutes(blocks);
    if (!force && loggedMins < 24 * 60) {
      setSubmitWarning('warn');
      return;
    }

    setSubmitWarning(null);
    setIsSubmitting(true);

    const payload = buildPayload(studentId, demographics, blocks);

    try {
      await submitToAirtable(payload);
      localStorage.removeItem(STORAGE_KEY);
      setScreen('success');
    } catch (err) {
      console.error(err);
      setErrorPayload(payload);
      setScreen('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setBlocks([]);
    setDemographics(null);
    setModalBlock(null);
    setSubmitWarning(null);
    setErrorPayload(null);
    setScreen('intake');
    localStorage.removeItem(STORAGE_KEY);
  }

  const loggedHours = Math.round(totalLoggedMinutes(blocks) / 60 * 10) / 10;

  if (screen === 'success') {
    return <SuccessScreen demographics={demographics} blocks={blocks} onReset={handleReset} />;
  }

  if (screen === 'error') {
    return (
      <div className="app-error">
        <div className="error-card">
          <h2>Submission failed</h2>
          <p>Something went wrong. Your responses are saved — use the button below so nothing is lost.</p>
          <div className="error-actions">
            <button className="btn-primary" onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(errorPayload, null, 2))
                .catch(() => alert('Could not copy automatically. Please copy manually from the console.'));
            }}>Copy my data</button>
            <button className="btn-secondary" onClick={() => setScreen('timeline')}>Go back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="app-title">Stanford Day in the Life</h1>
          {screen === 'timeline' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn-ghost" onClick={() => setShowInstructions(true)}>How to log</button>
              <button className="btn-ghost" onClick={handleReset}>Start over</button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {screen === 'intake' && (
          <DemographicIntake onComplete={handleIntakeComplete} />
        )}

        {screen === 'timeline' && (
          <div className="timeline-page">
            <p className="timeline-instructions">
              Drag to create blocks &mdash; click a block to edit it.
            </p>

            <div className="timeline-scroll-container">
              <Timeline
                blocks={blocks}
                onBlocksChange={setBlocks}
                onBlockClick={handleBlockClick}
              />
            </div>

            <div className="submit-section">
              <span className="logged-summary">
                {loggedHours > 0 ? `${loggedHours} hrs logged` : 'No time logged yet'}
              </span>

              <button
                className="btn-submit"
                onClick={handleSubmit}
                disabled={isSubmitting || blocks.length === 0}
              >
                {isSubmitting ? 'Submitting…' : 'Submit my day →'}
              </button>
            </div>
          </div>
        )}
      </main>

      {modalBlock && (
        <ActivityModal
          block={modalBlock}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          onClose={handleModalClose}
        />
      )}

      {showInstructions && (
        <InstructionsModal onClose={() => setShowInstructions(false)} />
      )}

      {submitWarning === 'warn' && (
        <div className="warning-overlay">
          <div className="warning-card">
            <p className="warning-message">Only {loggedHours} hours logged — submit anyway?</p>
            <div className="warning-actions">
              <button className="btn-secondary" onClick={() => setSubmitWarning(null)}>Keep logging</button>
              <button className="btn-primary" onClick={() => handleSubmit(true)}>Submit anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
