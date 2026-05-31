import { useState, useEffect, useCallback } from 'react';
import { SLOT_DURATION } from '../utils/constants';
import './ActivityModal.css';

const CATEGORIES = [
  { name: 'Sleep', color: '#4338ca', text: '#fff' },
  { name: 'Class', color: '#2563eb', text: '#fff' },
  { name: 'Studying / Schoolwork', color: '#0d9488', text: '#fff' },
  { name: 'Eating', color: '#ea580c', text: '#fff' },
  { name: 'Social Event', color: '#db2777', text: '#fff' },
  { name: 'Exercise', color: '#16a34a', text: '#fff' },
  { name: 'Stanford Athletics / Practice', color: '#8C1515', text: '#fff' },
  { name: 'Work / Research', color: '#7c3aed', text: '#fff' },
  { name: 'Clubs / Professional Events', color: '#ca8a04', text: '#fff' },
  { name: 'Transit / Commute', color: '#6b7280', text: '#fff' },
  { name: 'Personal / Chores', color: '#92400e', text: '#fff' },
  { name: 'Leisure / Entertainment', color: '#dc2626', text: '#fff' },
  { name: 'Other', color: '#d1d5db', text: '#374151' },
];

function slotToDisplay(slot) {
  const TIMELINE_START = 6 * 60;
  const totalMin = TIMELINE_START + slot * SLOT_DURATION;
  const mins = totalMin % 60;
  let hours = Math.floor(totalMin / 60) % 24;
  const ampm = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${String(mins).padStart(2, '0')} ${ampm}`;
}

export function ActivityModal({ block, onSave, onDelete, onClose }) {
  const [selectedActivity, setSelectedActivity] = useState(block.activity || '');
  const [note, setNote] = useState(block.note || '');

  const isEditing = Boolean(block.activity);

  const handleSave = () => {
    if (!selectedActivity) return;
    onSave({ ...block, activity: selectedActivity, note });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const timeRange = `${slotToDisplay(block.startSlot)} – ${slotToDisplay(block.endSlot)}`;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Activity editor">
        <div className="modal-header">{timeRange}</div>

        <div className="modal-label">Select an activity:</div>
        <div className="modal-categories">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedActivity === cat.name;
            return (
              <button
                key={cat.name}
                className={`modal-category-pill${isSelected ? ' selected' : ''}`}
                style={{
                  backgroundColor: cat.color,
                  color: cat.text,
                }}
                onClick={() => setSelectedActivity(cat.name)}
                type="button"
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        <input
          className="modal-note-input"
          type="text"
          placeholder="Add a note... (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="modal-actions">
          {isEditing && (
            <button
              className="modal-btn-delete"
              type="button"
              onClick={onDelete}
            >
              Delete
            </button>
          )}
          <button
            className="modal-btn-cancel"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="modal-btn-save"
            type="button"
            onClick={handleSave}
            disabled={!selectedActivity}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
