import React, { useState, useEffect, useRef } from 'react';
import ChatDisplay from './ChatDisplay';
import AnnotationPanel from './AnnotationPanel';
import LabelPopup from './LabelPopup';
import LikertPanel from './LikertPanel';
import RubricsModal from './RubricsModal';
import '../styles/AnnotationInterface.css';

const createEmptyBloomScores = () => ({
  remember: null,
  understand: null,
  apply: null,
  analyze: null,
  evaluate: null,
  create: null
});

const getLabelPopupPosition = (rect) => {
  const margin = 12;
  const gap = 12;
  const popupWidth = Math.min(350, window.innerWidth - (margin * 2));
  const popupHeight = Math.min(480, window.innerHeight - (margin * 2));

  let left = rect.right + gap;
  if (left + popupWidth > window.innerWidth - margin) {
    left = rect.left - popupWidth - gap;
  }

  return {
    top: Math.min(
      Math.max(margin, rect.top + (rect.height / 2) - (popupHeight / 2)),
      window.innerHeight - popupHeight - margin
    ),
    left: Math.max(margin, left),
    isFixed: true
  };
};

function AnnotationInterface({ annotatorName, prolificId, cidNumber, onBack, onNavigate, canGoPrev, canGoNext }) {
  const [conversation, setConversation] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [bloomScores, setBloomScores] = useState(createEmptyBloomScores);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedText, setSelectedText] = useState(null);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState(null);
  const [roleFilter, setRoleFilter] = useState({ ai: true, user: true });
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [showLabelPopup, setShowLabelPopup] = useState(false);
  const [labelPopupPosition, setLabelPopupPosition] = useState(null);
  const [selectedLabelsForPopup, setSelectedLabelsForPopup] = useState([]);
  const [showRubricsModal, setShowRubricsModal] = useState(false);
  const chatDisplayRef = useRef();

  const bloomLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create', 'confused'];
  const bloomLabels = {
    remember: 'Remember',
    understand: 'Understand',
    apply: 'Apply',
    analyze: 'Analyze',
    evaluate: 'Evaluate',
    create: 'Create',
    confused: 'Confused'
  };

  useEffect(() => {
    const controller = new AbortController();

    // Clear all CID-specific state before loading the next conversation.
    setLoading(true);
    setConversation(null);
    setAnnotations([]);
    setBloomScores(createEmptyBloomScores());
    setComment('');
    setSaveMessage('');
    setSelectedText(null);
    setSelectedTurnIndex(null);
    setEditingAnnotation(null);
    setShowLabelPopup(false);
    setLabelPopupPosition(null);
    setSelectedLabelsForPopup([]);

    const loadConversation = async () => {
      try {
        const encodedProlificId = encodeURIComponent(prolificId);
        const [conversationResponse, annotationResponse] = await Promise.all([
          fetch(`/api/conversation/${encodedProlificId}`, { signal: controller.signal }),
          fetch(
            `/api/load-annotation/${encodeURIComponent(annotatorName)}/${encodedProlificId}/${cidNumber}`,
            { signal: controller.signal }
          )
        ]);

        if (!conversationResponse.ok) {
          throw new Error(`Conversation request failed with status ${conversationResponse.status}`);
        }

        const conversationData = await conversationResponse.json();
        let annotationData = null;

        if (annotationResponse.ok) {
          annotationData = await annotationResponse.json();
        } else if (annotationResponse.status !== 404) {
          throw new Error(`Annotation request failed with status ${annotationResponse.status}`);
        }

        if (controller.signal.aborted) return;

        setConversation(conversationData);

        if (annotationData) {
          // Normalize both current and legacy annotation formats for the frontend.
          const normalizedAnnotations = (annotationData.spanAnnotations || [])
            .map(ann => ({
              id: ann.id,
              text: ann.extracted_text ?? ann.text,
              extracted_text: ann.extracted_text,
              labels: Array.isArray(ann.labels) ? ann.labels : [],
              turnIndex: ann.turn_index ?? ann.turnIndex,
              offsetInTurn: ann.start_char_in_turn ?? ann.offsetInTurn,
              timestamp: ann.timestamp
            }))
            .filter(ann => typeof ann.text === 'string');

          setAnnotations(normalizedAnnotations);
          setBloomScores({
            ...createEmptyBloomScores(),
            ...(annotationData.bloomScores || {})
          });
          setComment(annotationData.overallComment || '');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error loading conversation:', err);
        alert('Error loading conversation');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadConversation();

    return () => controller.abort();
  }, [annotatorName, prolificId, cidNumber]);

  const handleTextSelection = (selectedTurnIndex, turnElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setSelectedText(null);
      setShowLabelPopup(false);
      return;
    }

    const range = selection.getRangeAt(0);
    if (
      !turnElement.contains(range.startContainer) ||
      !turnElement.contains(range.endContainer)
    ) {
      setSelectedText(null);
      setShowLabelPopup(false);
      return;
    }

    const targetTurn = conversation.turns.find(turn => turn.turn_index === selectedTurnIndex);
    if (!targetTurn) {
      console.error('Target turn not found');
      return;
    }

    // Convert the DOM range into offsets relative to this message. Unlike
    // searching by text, this is accurate when words repeat or whitespace varies.
    const rangeToStart = range.cloneRange();
    rangeToStart.selectNodeContents(turnElement);
    rangeToStart.setEnd(range.startContainer, range.startOffset);

    const rangeToEnd = range.cloneRange();
    rangeToEnd.selectNodeContents(turnElement);
    rangeToEnd.setEnd(range.endContainer, range.endOffset);

    const offsetInTurn = rangeToStart.toString().length;
    const endOffsetInTurn = rangeToEnd.toString().length;

    if (
      offsetInTurn < 0 ||
      endOffsetInTurn <= offsetInTurn ||
      endOffsetInTurn > targetTurn.text.length
    ) {
      console.error('Selected text falls outside the target turn');
      return;
    }

    const rect = range.getBoundingClientRect();

    setSelectedText({
      text: targetTurn.text.substring(offsetInTurn, endOffsetInTurn),
      offsetInTurn
    });
    
    // Store which turn was selected so we can use it later
    setSelectedTurnIndex(selectedTurnIndex);

    setLabelPopupPosition(getLabelPopupPosition(rect));
    setShowLabelPopup(true);
    setSelectedLabelsForPopup([]);
    setEditingAnnotation(null);
  };

  const handleAddAnnotation = (labels) => {
    if (labels.length === 0) return;

    if (editingAnnotation) {
      // Update existing annotation
      const updatedAnnotations = annotations.map(a =>
        a.id === editingAnnotation.id
          ? {
              ...a,
              labels,
              timestamp: new Date().toISOString()
            }
          : a
      );
      setAnnotations(updatedAnnotations);
      setEditingAnnotation(null);
      setShowLabelPopup(false);
      setSelectedLabelsForPopup([]);
    } else if (selectedText) {
      // Add new annotation
      const text = selectedText.text;

      const newAnnotation = {
        id: Date.now(),
        text: text,
        labels: labels,
        turnIndex: selectedTurnIndex,  // Use the selected turn index
        offsetInTurn: selectedText.offsetInTurn,
        timestamp: new Date().toISOString()
      };

      setAnnotations([...annotations, newAnnotation]);
      setSelectedText(null);
      setShowLabelPopup(false);
      setSelectedLabelsForPopup([]);
      window.getSelection().removeAllRanges();
    }
  };

  const handleRemoveAnnotation = (annotationId) => {
    setAnnotations(annotations.filter(a => a.id !== annotationId));
    setEditingAnnotation(null);
  };

  const handleAnnotationClick = (annotation) => {
    setEditingAnnotation(annotation);
    setSelectedLabelsForPopup([...annotation.labels]);
    
    // Scroll to the annotation in the chat using turn index and offset to find EXACT annotation
    const chatElement = chatDisplayRef.current;
    if (chatElement) {
      const annotatedElements = chatElement.querySelectorAll('.annotated-text');
      for (let elem of annotatedElements) {
        // Match by annotation ID, turn index, and offset to find the EXACT element
        const elemAnnotationId = elem.getAttribute('data-annotation-id');
        const elemTurnIndex = elem.getAttribute('data-turn-index');
        const elemOffset = elem.getAttribute('data-offset');
        
        // First try to match by annotation ID (most reliable)
        if (elemAnnotationId && annotation.id && parseInt(elemAnnotationId) === annotation.id) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          elem.style.outline = '3px solid #FFD700';
          setTimeout(() => {
            elem.style.outline = 'none';
          }, 2000);

          const rect = elem.getBoundingClientRect();
          setLabelPopupPosition(getLabelPopupPosition(rect));
          break;
        }
      }
    }

    setShowLabelPopup(true);
  };

  const handleSave = async () => {
    if (!annotatorName || !prolificId) {
      alert('Missing annotator name or conversation ID');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/save-annotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotatorName,
          prolificId,
          cidNumber,
          annotations,
          bloomScores,
          comment
        })
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage('✓ Annotation saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error saving annotation');
    } finally {
      setSaving(false);
    }
  };
  const handleNavigateWithSave = async (direction) => {
    // Auto-save before navigating
    if (annotatorName && prolificId) {
      setSaving(true);
      try {
        await fetch('/api/save-annotation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            annotatorName,
            prolificId,
            cidNumber,
            annotations,
            bloomScores,
            comment
          })
        });
      } catch (err) {
        console.error('Error auto-saving before navigation:', err);
      } finally {
        setSaving(false);
      }
    }
    onNavigate(direction);
  };


  if (loading) {
    return <div className="loading-screen">Loading conversation...</div>;
  }

  if (!conversation) {
    return <div className="error-screen">Error loading conversation</div>;
  }

  return (
    <div className="annotation-interface">
      <header className="annotation-header">
        <div className="header-left">
          <button className="btn-home" onClick={onBack} title="Back to home">
            🏠 Home
          </button>
          <div className="header-info">
            <h1>Annotating: CID{cidNumber} - {prolificId}</h1>
            <p className="header-meta">Total turns: {conversation?.turns?.length || 0}</p>
          </div>
          <span className="annotator-badge">{annotatorName}</span>
        </div>
        <div className="header-right">
          {saveMessage && <span className="save-message">{saveMessage}</span>}
          <div className="nav-group">
            <button
              className="btn-nav btn-prev"
              onClick={() => handleNavigateWithSave(-1)}
              disabled={!canGoPrev || saving}
              title="Previous user"
            >
              ◀ Prev
            </button>
            <button
              className="btn-nav btn-next"
              onClick={() => handleNavigateWithSave(1)}
              disabled={!canGoNext || saving}
              title="Next user"
            >
              Next ▶
            </button>
          </div>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save'}
          </button>
        </div>
      </header>

      <div className="annotation-body">
        <div className="chat-section">
          <ChatDisplay
            ref={chatDisplayRef}
            conversation={conversation}
            annotations={annotations}
            onTextSelect={handleTextSelection}
            selectedText={selectedText}
            onRemoveAnnotation={handleRemoveAnnotation}
            roleFilter={roleFilter}
            onAnnotationClick={handleAnnotationClick}
          />
        </div>

        <div className="control-section">
          <AnnotationPanel
            annotations={annotations}
            bloomLevels={bloomLevels}
            bloomLabels={bloomLabels}
            onRemoveAnnotation={handleRemoveAnnotation}
            onEditAnnotation={handleAnnotationClick}
            editingAnnotation={editingAnnotation}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
          />

          <LikertPanel
            bloomScores={bloomScores}
            comment={comment}
            bloomLevels={bloomLevels.filter(level => level !== 'confused')}
            bloomLabels={bloomLabels}
            onScoreChange={(level, score) => {
              setBloomScores({ ...bloomScores, [level]: score });
            }}
            onCommentChange={setComment}
            onSave={handleSave}
            isSaving={saving}
          />
        </div>
      </div>

      {showLabelPopup && (selectedText || editingAnnotation) && (
        <LabelPopup
          position={labelPopupPosition}
          bloomLevels={bloomLevels}
          bloomLabels={bloomLabels}
          selectedLabels={selectedLabelsForPopup}
          onLabelToggle={(label) => {
            if (selectedLabelsForPopup.includes(label)) {
              setSelectedLabelsForPopup(selectedLabelsForPopup.filter(l => l !== label));
            } else {
              setSelectedLabelsForPopup([...selectedLabelsForPopup, label]);
            }
          }}
          onConfirm={() => handleAddAnnotation(selectedLabelsForPopup)}
          onCancel={() => {
            setShowLabelPopup(false);
            setSelectedText(null);
            setEditingAnnotation(null);
          }}
          isEditing={!!editingAnnotation}
        />
      )}

      <button
        className="floating-rubrics-button"
        onClick={() => setShowRubricsModal(!showRubricsModal)}
        title="View rubrics"
      >
        📚
      </button>

      <RubricsModal
        isOpen={showRubricsModal}
        onClose={() => setShowRubricsModal(false)}
      />
    </div>
  );
}

export default AnnotationInterface;
