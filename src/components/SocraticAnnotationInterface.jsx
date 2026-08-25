import React, { useState, useEffect, useRef } from 'react';
import SocraticChatDisplay from './SocraticChatDisplay';
import SocraticAnnotationPanel from './SocraticAnnotationPanel';
import SocraticLabelPopup from './SocraticLabelPopup';
import '../styles/AnnotationInterface.css';

const MIN_SELECTABLE_TURN_INDEX = 3;

const SOCRATIC_LEVELS = [
  'clarification',
  'purpose',
  'assumptions',
  'evidence',
  'viewpoints',
  'implications',
  'question_itself',
  'concepts',
  'inferences',
  'non_socratic'
];

const SOCRATIC_LABELS = {
  clarification: 'Questions of Clarification',
  purpose: 'Questions That Probe Purpose',
  assumptions: 'Questions That Probe Assumptions',
  evidence: 'Questions That Probe Information, Reasons, Evidence, and Causes',
  viewpoints: 'Questions about Viewpoints or Perspectives',
  implications: 'Questions That Probe Implications and Consequences',
  question_itself: 'Questions about the Question',
  concepts: 'Questions That Probe Concepts',
  inferences: 'Questions That Probe Inferences and Interpretations',
  non_socratic: 'NON_SOCRATIC'
};

const SOCRATIC_NUMBERS = {
  clarification: 1,
  purpose: 2,
  assumptions: 3,
  evidence: 4,
  viewpoints: 5,
  implications: 6,
  question_itself: 7,
  concepts: 8,
  inferences: 9,
  non_socratic: 10
};

const SOCRATIC_COLORS = {
  clarification: '#FFB3BA',
  purpose: '#FFDFBA',
  assumptions: '#FFFFBA',
  evidence: '#BAFFC9',
  viewpoints: '#BAE1FF',
  implications: '#D4A5E6',
  question_itself: '#FFB3E6',
  concepts: '#C9FFF3',
  inferences: '#E0C9A6',
  non_socratic: '#D3D3D3'
};

const getLabelPopupPosition = (rect) => {
  const margin = 12;
  const gap = 12;
  const popupWidth = Math.min(640, window.innerWidth - (margin * 2));
  const popupHeight = Math.min(520, window.innerHeight - (margin * 2));

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

function SocraticAnnotationInterface({ annotatorName, prolificId, cidNumber, onBack, onNavigate, canGoPrev, canGoNext }) {
  const [conversation, setConversation] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedText, setSelectedText] = useState(null);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState(null);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [showLabelPopup, setShowLabelPopup] = useState(false);
  const [labelPopupPosition, setLabelPopupPosition] = useState(null);
  const [selectedLabelForPopup, setSelectedLabelForPopup] = useState(null);
  const chatDisplayRef = useRef();

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setConversation(null);
    setAnnotations([]);
    setSaveMessage('');
    setSelectedText(null);
    setSelectedTurnIndex(null);
    setEditingAnnotation(null);
    setShowLabelPopup(false);
    setLabelPopupPosition(null);
    setSelectedLabelForPopup(null);

    const loadConversation = async () => {
      try {
        const encodedProlificId = encodeURIComponent(prolificId);
        const [conversationResponse, annotationResponse] = await Promise.all([
          fetch(`/api/conversation/${encodedProlificId}`, { signal: controller.signal }),
          fetch(
            `/api/load-socratic-annotation/${encodeURIComponent(annotatorName)}/${encodedProlificId}/${cidNumber}`,
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
          const normalizedAnnotations = (annotationData.spanAnnotations || [])
            .map(ann => ({
              id: ann.id,
              text: ann.extracted_text ?? ann.text,
              extracted_text: ann.extracted_text,
              label: ann.label,
              turnIndex: ann.turn_index ?? ann.turnIndex,
              offsetInTurn: ann.start_char_in_turn ?? ann.offsetInTurn,
              timestamp: ann.timestamp
            }))
            .filter(ann => typeof ann.text === 'string' && ann.label);

          setAnnotations(normalizedAnnotations);
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

    if (targetTurn.role !== 'assistant' || targetTurn.turn_index < MIN_SELECTABLE_TURN_INDEX) {
      setSelectedText(null);
      setShowLabelPopup(false);
      return;
    }

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

    setSelectedTurnIndex(selectedTurnIndex);

    setLabelPopupPosition(getLabelPopupPosition(rect));
    setShowLabelPopup(true);
    setSelectedLabelForPopup(null);
    setEditingAnnotation(null);
  };

  const handleAddAnnotation = (label) => {
    if (!label) return;

    if (editingAnnotation) {
      const updatedAnnotations = annotations.map(a =>
        a.id === editingAnnotation.id
          ? {
              ...a,
              label,
              timestamp: new Date().toISOString()
            }
          : a
      );
      setAnnotations(updatedAnnotations);
      setEditingAnnotation(null);
      setShowLabelPopup(false);
      setSelectedLabelForPopup(null);
    } else if (selectedText) {
      const text = selectedText.text;

      const newAnnotation = {
        id: Date.now(),
        text: text,
        label,
        turnIndex: selectedTurnIndex,
        offsetInTurn: selectedText.offsetInTurn,
        timestamp: new Date().toISOString()
      };

      setAnnotations([...annotations, newAnnotation]);
      setSelectedText(null);
      setShowLabelPopup(false);
      setSelectedLabelForPopup(null);
      window.getSelection().removeAllRanges();
    }
  };

  const handleRemoveAnnotation = (annotationId) => {
    setAnnotations(annotations.filter(a => a.id !== annotationId));
    setEditingAnnotation(null);
  };

  const handleAnnotationClick = (annotation) => {
    setEditingAnnotation(annotation);
    setSelectedLabelForPopup(annotation.label);

    const chatElement = chatDisplayRef.current;
    if (chatElement) {
      const annotatedElements = chatElement.querySelectorAll('.annotated-text');
      for (let elem of annotatedElements) {
        const elemAnnotationId = elem.getAttribute('data-annotation-id');

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

  const buildPayload = () => ({
    annotatorName,
    prolificId,
    cidNumber,
    annotations
  });

  const handleSave = async () => {
    if (!annotatorName || !prolificId) {
      alert('Missing annotator name or conversation ID');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/save-socratic-annotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload())
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
    if (annotatorName && prolificId) {
      setSaving(true);
      try {
        await fetch('/api/save-socratic-annotation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload())
        });
      } catch (err) {
        console.error('Error auto-saving before navigation:', err);
      } finally {
        setSaving(false);
      }
    }
    onNavigate(direction);
  };

  const handleBackWithSave = async () => {
    if (annotatorName && prolificId) {
      try {
        await fetch('/api/save-socratic-annotation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload())
        });
      } catch (err) {
        console.error('Error auto-saving before returning home:', err);
      }
    }
    onBack();
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
          <button className="btn-home" onClick={handleBackWithSave} title="Back to home (auto-saves)">
            🏠 Home
          </button>
          <div className="header-info">
            <h1>Socratic Annotating: CID{cidNumber} - {prolificId}</h1>
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
          <SocraticChatDisplay
            ref={chatDisplayRef}
            conversation={conversation}
            annotations={annotations}
            onTextSelect={handleTextSelection}
            onRemoveAnnotation={handleRemoveAnnotation}
            minSelectableTurnIndex={MIN_SELECTABLE_TURN_INDEX}
            onAnnotationClick={handleAnnotationClick}
            socraticColors={SOCRATIC_COLORS}
            socraticLabels={SOCRATIC_LABELS}
          />
        </div>

        <div className="control-section">
          <SocraticAnnotationPanel
            annotations={annotations}
            socraticLabels={SOCRATIC_LABELS}
            socraticColors={SOCRATIC_COLORS}
            socraticNumbers={SOCRATIC_NUMBERS}
            onRemoveAnnotation={handleRemoveAnnotation}
            onEditAnnotation={handleAnnotationClick}
            editingAnnotation={editingAnnotation}
            minSelectableTurnIndex={MIN_SELECTABLE_TURN_INDEX}
          />
        </div>
      </div>

      {showLabelPopup && (selectedText || editingAnnotation) && (
        <SocraticLabelPopup
          position={labelPopupPosition}
          socraticLevels={SOCRATIC_LEVELS}
          socraticLabels={SOCRATIC_LABELS}
          socraticNumbers={SOCRATIC_NUMBERS}
          selectedLabel={selectedLabelForPopup}
          onLabelSelect={setSelectedLabelForPopup}
          onConfirm={() => handleAddAnnotation(selectedLabelForPopup)}
          onCancel={() => {
            setShowLabelPopup(false);
            setSelectedText(null);
            setEditingAnnotation(null);
          }}
          isEditing={!!editingAnnotation}
        />
      )}
    </div>
  );
}

export default SocraticAnnotationInterface;
