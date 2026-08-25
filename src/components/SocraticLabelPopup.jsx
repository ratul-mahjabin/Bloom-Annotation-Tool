import React from 'react';
import '../styles/LabelPopup.css';
import '../styles/SocraticLabelPopup.css';

function SocraticLabelPopup({
  position,
  socraticLevels,
  socraticLabels,
  socraticNumbers,
  selectedLabel,
  onLabelSelect,
  onConfirm,
  onCancel,
  isEditing
}) {
  return (
    <div
      className="label-popup socratic-label-popup"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        position: position.isFixed ? 'fixed' : 'absolute'
      }}
    >
      <div className="popup-header">
        <h3>{isEditing ? '✎ Edit Label' : '🏷️ Select a Socratic Label'}</h3>
      </div>

      <div className="bloom-selector-popup socratic-selector-popup">
        {socraticLevels.map((level) => (
          <label
            key={level}
            className={`bloom-option-popup socratic-option-popup ${selectedLabel === level ? 'selected' : ''}`}
            style={{
              backgroundColor: selectedLabel === level ? '#667eea20' : 'transparent',
              borderColor: selectedLabel === level ? '#667eea' : '#ddd'
            }}
          >
            <input
              type="radio"
              name="socratic-label"
              checked={selectedLabel === level}
              onChange={() => onLabelSelect(level)}
            />
            <span className="level-name socratic-level-name">
              {socraticNumbers[level]}. {socraticLabels[level]}
            </span>
          </label>
        ))}
      </div>

      <div className="popup-actions">
        <button
          className="btn-confirm"
          onClick={onConfirm}
          disabled={!selectedLabel}
        >
          {isEditing ? '✓ Update' : '✓ Add'}
        </button>
        <button className="btn-cancel" onClick={onCancel}>
          ✕ Cancel
        </button>
      </div>
    </div>
  );
}

export default SocraticLabelPopup;
