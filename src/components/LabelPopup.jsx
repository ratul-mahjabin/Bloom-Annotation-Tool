import React from 'react';
import '../styles/LabelPopup.css';

function LabelPopup({
  position,
  bloomLevels,
  bloomLabels,
  selectedLabels,
  onLabelToggle,
  onConfirm,
  onCancel,
  isEditing
}) {
  const bloomColors = {
    remember: '#FF6B6B',
    understand: '#4ECDC4',
    apply: '#45B7D1',
    analyze: '#FFA07A',
    evaluate: '#98D8C8',
    create: '#F7DC6F'
  };

  const bloomDescriptions = {
    remember: 'Recall facts and basic concepts',
    understand: 'Explain ideas or concepts',
    apply: 'Use information in new situations',
    analyze: 'Draw connections among ideas',
    evaluate: 'Justify a stand or decision',
    create: 'Produce new or original work'
  };

  return (
    <div
      className="label-popup"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        position: position.isFixed ? 'fixed' : 'absolute'
      }}
    >
      <div className="popup-header">
        <h3>{isEditing ? '✎ Edit Labels' : '🏷️ Select Labels'}</h3>
      </div>

      <div className="bloom-selector-popup">
        {bloomLevels.map((level) => (
          <label
            key={level}
            className={`bloom-option-popup ${selectedLabels.includes(level) ? 'selected' : ''}`}
            style={{
              backgroundColor: selectedLabels.includes(level)
                ? bloomColors[level] + '20'
                : 'transparent',
              borderColor: selectedLabels.includes(level)
                ? bloomColors[level]
                : '#ddd'
            }}
          >
            <input
              type="checkbox"
              checked={selectedLabels.includes(level)}
              onChange={() => onLabelToggle(level)}
            />
            <span className="level-name">{bloomLabels[level]}</span>
            <span className="level-desc">{bloomDescriptions[level]}</span>
          </label>
        ))}
      </div>

      <div className="popup-actions">
        <button
          className="btn-confirm"
          onClick={onConfirm}
          disabled={selectedLabels.length === 0}
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

export default LabelPopup;
