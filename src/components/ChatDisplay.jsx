import React, { forwardRef } from 'react';
import '../styles/ChatDisplay.css';

const ChatDisplay = forwardRef(({
  conversation,
  annotations,
  onTextSelect,
  selectedText,
  onRemoveAnnotation,
  roleFilter,
  onAnnotationClick
}, ref) => {

  const renderTurnWithAnnotations = (turn, turnIdx) => {
    const turnLabelClass = turn.role === 'assistant' ? 'ai-role' : 'user-role';
    const roleLabel = turn.role === 'assistant' ? '🤖 AI' : '👤 User';
    const stageLabel = `Stage ${turn.stage}`;

    // Check if this role should be selectable
    const isRoleEnabled = turn.role === 'assistant' ? roleFilter?.ai : roleFilter?.user;
    const selectableClass = isRoleEnabled ? 'selectable-message' : 'non-selectable-message';

    return (
      <div key={turnIdx} className={`message-bubble ${turnLabelClass}`}>
        <div className="message-header">
          <span className="role-label non-selectable">{roleLabel}</span>
          <span className="stage-label non-selectable">{stageLabel}</span>
        </div>
        <div
          className={`message-text ${selectableClass}`}
          onMouseUp={isRoleEnabled ? () => onTextSelect(turn.turn_index) : null}
        >
          {renderHighlightedText(turn.text, turn.turn_index)}
        </div>
      </div>
    );
  };

  const renderHighlightedText = (text, turnIndex) => {
    if (!text || annotations.length === 0) {
      return text;
    }

    // Find all annotations for this specific turn
    // ONLY match by turnIndex - this is the primary and most reliable method
    let relevantAnnotations = annotations.filter(ann => {
      return ann.turnIndex === turnIndex;
    });

    if (relevantAnnotations.length === 0) {
      return text;
    }

    // Build segments of text with/without highlights
    const segments = [];
    let currentPos = 0;

    // Sort annotations by position - use offsetInTurn if available (which should always be the case now)
    const sortedAnnotations = [...relevantAnnotations].sort((a, b) => {
      // Both should have offsetInTurn, but handle fallback just in case
      const posA = a.offsetInTurn !== undefined && a.offsetInTurn !== null ? a.offsetInTurn : -1;
      const posB = b.offsetInTurn !== undefined && b.offsetInTurn !== null ? b.offsetInTurn : -1;
      
      if (posA === -1 && posB === -1) return 0;
      if (posA === -1) return 1;
      if (posB === -1) return -1;
      return posA - posB;
    });

    for (const annotation of sortedAnnotations) {
      // Support both old format (text) and new format (extracted_text)
      const annotationText = annotation.extracted_text || annotation.text;
      
      // Find position of this annotation in the text
      let startPos = -1;
      
      if (annotation.offsetInTurn !== undefined && annotation.offsetInTurn !== null) {
        // Use stored offset if available
        startPos = annotation.offsetInTurn;
      } else {
        // Search for the text starting from currentPos
        startPos = text.indexOf(annotationText, currentPos);
        if (startPos === -1) {
          // Try searching from the beginning as fallback
          startPos = text.indexOf(annotationText);
        }
      }
      
      if (startPos === -1 || startPos < currentPos) {
        // Skip this annotation if we can't find it or it's in the wrong position
        continue;
      }
      
      const endPos = startPos + annotationText.length;

      // Add text before the annotation
      if (startPos > currentPos) {
        segments.push({
          type: 'text',
          content: text.substring(currentPos, startPos)
        });
      }

      // Add the annotated text
      segments.push({
        type: 'annotation',
        content: annotationText,
        annotation: annotation
      });

      currentPos = endPos;
    }

    // Add remaining text
    if (currentPos < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(currentPos)
      });
    }

    return segments.map((segment, idx) => {
      if (segment.type === 'text') {
        return <span key={idx}>{segment.content}</span>;
      } else {
        return (
          <span
            key={idx}
            className="annotated-text"
            style={{ backgroundColor: '#FFFF00' }}
            title={`${segment.annotation.labels.join(', ')}`}
            data-annotation-id={segment.annotation.id}
            data-turn-index={segment.annotation.turnIndex}
            data-offset={segment.annotation.offsetInTurn}
            onClick={(e) => {
              e.stopPropagation();
              if (onAnnotationClick) {
                onAnnotationClick(segment.annotation);
              }
            }}
          >
            {segment.content}
          </span>
        );
      }
    });
  };

  return (
    <div className="chat-display" ref={ref}>
      <div className="chat-messages">
        {conversation.turns.map((turn, idx) => renderTurnWithAnnotations(turn, idx))}
      </div>
    </div>
  );
});

ChatDisplay.displayName = 'ChatDisplay';

export default ChatDisplay;
