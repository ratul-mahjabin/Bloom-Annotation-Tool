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
    remember: '#FFB3BA',      // Bright coral red
    understand: '#FFDFBA',    // Bright peach orange
    apply: '#FFFFBA',         // Bright golden yellow
    analyze: '#BAFFC9',       // Bright mint green
    evaluate: '#BAE1FF',      // Bright sky blue
    create: '#D4A5E6',        // Deep lavender purple
    confused: '#FF6B6B'       // Bright red
  };

  const bloomDescriptions = {
    remember: 'Recall facts and basic concepts',
    understand: 'Explain ideas or concepts',
    apply: 'Use information in new situations',
    analyze: 'Draw connections among ideas',
    evaluate: 'Justify a stand or decision',
    create: 'Produce new or original work',
    confused: 'Ambiguous case - unable to classify clearly'
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
