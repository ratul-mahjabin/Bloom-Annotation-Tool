import React, { forwardRef, useEffect, useRef } from 'react';
import '../styles/ChatDisplay.css';
import '../styles/SocraticChatDisplay.css';

// Chat display for Socratic annotation: only AI turns at or after
// `minSelectableTurnIndex` can be highlighted/annotated. All turns are
// still rendered for context.
const SocraticChatDisplay = forwardRef(({
  conversation,
  annotations,
  onTextSelect,
  onRemoveAnnotation,
  minSelectableTurnIndex,
  onAnnotationClick,
  socraticColors,
  socraticLabels
}, ref) => {
  const activeSelectionRef = useRef(null);

  useEffect(() => {
    const handleDocumentMouseUp = () => {
      const activeSelection = activeSelectionRef.current;
      activeSelectionRef.current = null;

      if (activeSelection) {
        onTextSelect(activeSelection.turnIndex, activeSelection.element);
      }
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => document.removeEventListener('mouseup', handleDocumentMouseUp);
  }, [onTextSelect]);

  const renderTurnWithAnnotations = (turn, turnIdx) => {
    const turnLabelClass = turn.role === 'assistant' ? 'ai-role' : 'user-role';
    const roleLabel = turn.role === 'assistant' ? '🤖 AI' : '👤 User';
    const stageLabel = `Stage ${turn.stage}`;

    const isRoleEnabled = turn.role === 'assistant' && turn.turn_index >= minSelectableTurnIndex;
    const selectableClass = isRoleEnabled ? 'selectable-message' : 'non-selectable-message';

    return (
      <div key={turnIdx} className={`message-bubble ${turnLabelClass}`}>
        <div className="message-header">
          <span className="role-label non-selectable">{roleLabel}</span>
          <span className="stage-label non-selectable">{stageLabel}</span>
        </div>
        <div
          className={`message-text ${selectableClass}`}
          onMouseDown={isRoleEnabled ? (event) => {
            activeSelectionRef.current = {
              turnIndex: turn.turn_index,
              element: event.currentTarget
            };
          } : null}
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

    let relevantAnnotations = annotations.filter(ann => ann.turnIndex === turnIndex);

    if (relevantAnnotations.length === 0) {
      return text;
    }

    const segments = [];
    let currentPos = 0;

    const sortedAnnotations = [...relevantAnnotations].sort((a, b) => {
      const posA = a.offsetInTurn !== undefined && a.offsetInTurn !== null ? a.offsetInTurn : -1;
      const posB = b.offsetInTurn !== undefined && b.offsetInTurn !== null ? b.offsetInTurn : -1;

      if (posA === -1 && posB === -1) return 0;
      if (posA === -1) return 1;
      if (posB === -1) return -1;
      return posA - posB;
    });

    for (const annotation of sortedAnnotations) {
      const annotationText = annotation.extracted_text || annotation.text;

      let startPos = -1;

      if (annotation.offsetInTurn !== undefined && annotation.offsetInTurn !== null) {
        startPos = annotation.offsetInTurn;
      } else {
        startPos = text.indexOf(annotationText, currentPos);
        if (startPos === -1) {
          startPos = text.indexOf(annotationText);
        }
      }

      if (startPos === -1 || startPos < currentPos) {
        continue;
      }

      const endPos = startPos + annotationText.length;

      if (startPos > currentPos) {
        segments.push({
          type: 'text',
          content: text.substring(currentPos, startPos)
        });
      }

      segments.push({
        type: 'annotation',
        content: annotationText,
        annotation: annotation
      });

      currentPos = endPos;
    }

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
        const primaryLabel = segment.annotation.label;
        const backgroundColor = socraticColors[primaryLabel] || '#FFFF00';

        return (
          <span
            key={idx}
            className="annotated-text"
            style={{ backgroundColor }}
            title={socraticLabels[primaryLabel] || ''}
            data-annotation-id={segment.annotation.id}
            data-turn-index={segment.annotation.turnIndex}
            data-offset={segment.annotation.offsetInTurn}
            onClick={(e) => {
              e.stopPropagation();
              const selection = window.getSelection();
              if (selection && !selection.isCollapsed) return;

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

SocraticChatDisplay.displayName = 'SocraticChatDisplay';

export default SocraticChatDisplay;
