import React, { forwardRef } from 'react';
import '../styles/ChatDisplay.css';
import '../styles/SocraticChatDisplay.css';

// Chat display for Socratic annotation: each eligible AI turn (at or
// after `minSelectableTurnIndex`) gets a pen icon instead of requiring
// the annotator to drag-select text. Clicking it opens the label picker
// for that whole turn. All turns are still rendered for context.
const SocraticChatDisplay = forwardRef(({
  conversation,
  annotations,
  onAnnotateTurn,
  minSelectableTurnIndex,
  socraticColors,
  socraticLabels
}, ref) => {
  const renderTurn = (turn, turnIdx) => {
    const turnLabelClass = turn.role === 'assistant' ? 'ai-role' : 'user-role';
    const roleLabel = turn.role === 'assistant' ? '🤖 AI' : '👤 User';
    const stageLabel = `Stage ${turn.stage}`;

    const isEligible = turn.role === 'assistant' && turn.turn_index >= minSelectableTurnIndex;
    const annotation = isEligible
      ? annotations.find(ann => ann.turnIndex === turn.turn_index)
      : null;

    return (
      <div key={turnIdx} className={`message-bubble ${turnLabelClass}`}>
        <div className="message-header">
          <span className="role-label non-selectable">{roleLabel}</span>
          <span className="stage-label non-selectable">{stageLabel}</span>
          {isEligible && (
            <button
              className={`socratic-annotate-btn ${annotation ? 'has-annotation' : ''}`}
              data-turn-index={turn.turn_index}
              onClick={(e) => onAnnotateTurn(turn, e.currentTarget)}
              title={annotation ? 'Change label' : 'Annotate this turn'}
            >
              ✎
            </button>
          )}
        </div>
        <div className="message-text non-selectable-message">
          {turn.text}
        </div>
        {annotation && (
          <div
            className="socratic-turn-label"
            style={{ backgroundColor: socraticColors[annotation.label] || '#FFFF00' }}
          >
            {socraticLabels[annotation.label]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-display" ref={ref}>
      <div className="chat-messages">
        {conversation.turns.map((turn, idx) => renderTurn(turn, idx))}
      </div>
    </div>
  );
});

SocraticChatDisplay.displayName = 'SocraticChatDisplay';

export default SocraticChatDisplay;
