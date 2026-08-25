import React, { useState, useEffect, useRef } from 'react';
import SocraticChatDisplay from './SocraticChatDisplay';
import SocraticAnnotationPanel from './SocraticAnnotationPanel';
import SocraticLabelPopup from './SocraticLabelPopup';
import { getLastParagraphRange } from '../utils/lastParagraph';
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
  const popupHeight = Math.min(600, window.innerHeight - (margin * 2));

  let left = rect.right + gap;
  if (left + popupWidth > window.innerWidth - margin) {
    left = rect.left - popupWidth - gap;
  }
  // Clamp left within the viewport in case both preferred placements overflow
  // (e.g. a very wide popup on a narrow window).
  left = Math.min(Math.max(margin, left), window.innerWidth - popupWidth - margin);

  const top = Math.min(
    Math.max(margin, rect.top + (rect.height / 2) - (popupHeight / 2)),
    window.innerHeight - popupHeight - margin
  );

  return {
    top: Math.max(margin, top),
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
  const [activeTurn, setActiveTurn] = useState(null);
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
    setActiveTurn(null);
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
              label: ann.label,
              turnIndex: ann.turn_index ?? ann.turnIndex,
              timestamp: ann.timestamp
            }))
            .filter(ann => typeof ann.turnIndex === 'number' && ann.label);

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

  const handleAnnotateTurn = (turn, buttonElement) => {
    if (turn.role !== 'assistant' || turn.turn_index < MIN_SELECTABLE_TURN_INDEX) {
      return;
    }

    const existingAnnotation = annotations.find(a => a.turnIndex === turn.turn_index) || null;

    setActiveTurn(turn);
    setEditingAnnotation(existingAnnotation);
    setSelectedLabelForPopup(existingAnnotation ? existingAnnotation.label : null);

    const rect = buttonElement.getBoundingClientRect();
    setLabelPopupPosition(getLabelPopupPosition(rect));
    setShowLabelPopup(true);
  };

  const handleAddAnnotation = (label) => {
    if (!label || !activeTurn) return;

    if (editingAnnotation) {
      setAnnotations(annotations.map(a =>
        a.id === editingAnnotation.id
          ? { ...a, label, timestamp: new Date().toISOString() }
          : a
      ));
    } else {
      const newAnnotation = {
        id: Date.now(),
        label,
        turnIndex: activeTurn.turn_index,
        timestamp: new Date().toISOString()
      };
      setAnnotations([...annotations, newAnnotation]);
    }

    setActiveTurn(null);
    setEditingAnnotation(null);
    setShowLabelPopup(false);
    setSelectedLabelForPopup(null);
  };

  const handleRemoveAnnotation = (annotationId) => {
    setAnnotations(annotations.filter(a => a.id !== annotationId));
    setEditingAnnotation(null);
  };

  const handleEditFromPanel = (annotation) => {
    const turn = conversation.turns.find(t => t.turn_index === annotation.turnIndex);
    if (!turn) return;

    const chatElement = chatDisplayRef.current;
    const targetButton = chatElement?.querySelector(`.socratic-annotate-btn[data-turn-index="${turn.turn_index}"]`);

    if (targetButton) {
      targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      handleAnnotateTurn(turn, targetButton);
    }
  };

  const buildPayload = () => {
    const enrichedAnnotations = annotations.map(ann => {
      const turn = conversation.turns.find(t => t.turn_index === ann.turnIndex);
      const { start, end } = getLastParagraphRange(turn?.text || '');

      return {
        ...ann,
        text: turn ? turn.text.substring(start, end) : '',
        offsetInTurn: start,
        endOffsetInTurn: end
      };
    });

    return {
      annotatorName,
      prolificId,
      cidNumber,
      annotations: enrichedAnnotations
    };
  };

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
            onAnnotateTurn={handleAnnotateTurn}
            minSelectableTurnIndex={MIN_SELECTABLE_TURN_INDEX}
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
            onEditAnnotation={handleEditFromPanel}
            editingAnnotation={editingAnnotation}
            minSelectableTurnIndex={MIN_SELECTABLE_TURN_INDEX}
          />
        </div>
      </div>

      {showLabelPopup && activeTurn && (
        <SocraticLabelPopup
          position={labelPopupPosition}
          socraticLevels={SOCRATIC_LEVELS}
          socraticLabels={SOCRATIC_LABELS}
          socraticNumbers={SOCRATIC_NUMBERS}
          selectedLabel={selectedLabelForPopup}
          onLabelSelect={(level) => {
            setSelectedLabelForPopup(level);
            handleAddAnnotation(level);
          }}
          onCancel={() => {
            setShowLabelPopup(false);
            setActiveTurn(null);
            setEditingAnnotation(null);
          }}
          isEditing={!!editingAnnotation}
        />
      )}
    </div>
  );
}

export default SocraticAnnotationInterface;
