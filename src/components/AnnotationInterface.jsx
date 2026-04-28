import React, { useState, useEffect, useRef } from 'react';
import ChatDisplay from './ChatDisplay';
import AnnotationPanel from './AnnotationPanel';
import LabelPopup from './LabelPopup';
import LikertPanel from './LikertPanel';
import '../styles/AnnotationInterface.css';

function AnnotationInterface({ annotatorName, prolificId, cidNumber, onBack }) {
  const [conversation, setConversation] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [bloomScores, setBloomScores] = useState({
    remember: null,
    understand: null,
    apply: null,
    analyze: null,
    evaluate: null,
    create: null
  });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedText, setSelectedText] = useState(null);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState(null);
  const [existingAnnotation, setExistingAnnotation] = useState(null);
  const [roleFilter, setRoleFilter] = useState({ ai: true, user: true });
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [showLabelPopup, setShowLabelPopup] = useState(false);
  const [labelPopupPosition, setLabelPopupPosition] = useState(null);
  const [selectedLabelsForPopup, setSelectedLabelsForPopup] = useState([]);
  const chatDisplayRef = useRef();

  const bloomLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
  const bloomLabels = {
    remember: 'Remember',
    understand: 'Understand',
    apply: 'Apply',
    analyze: 'Analyze',
    evaluate: 'Evaluate',
    create: 'Create'
  };

  useEffect(() => {
    fetchConversation();
    loadExistingAnnotation();
  }, [prolificId]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversation/${prolificId}`);
      const data = await response.json();
      setConversation(data);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      alert('Error loading conversation');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAnnotation = async () => {
    try {
      const response = await fetch(
        `/api/load-annotation/${encodeURIComponent(annotatorName)}/${prolificId}/${cidNumber}`
      );
      if (response.ok) {
        const data = await response.json();
        setExistingAnnotation(data);
        
        // Normalize annotations: convert snake_case from server to camelCase for frontend
        const normalizedAnnotations = (data.spanAnnotations || []).map(ann => ({
          id: ann.id,
          text: ann.extracted_text || ann.text,  // Fallback to old format if needed
          extracted_text: ann.extracted_text,
          labels: ann.labels,
          turnIndex: ann.turn_index,
          offsetInTurn: ann.start_char_in_turn,
          timestamp: ann.timestamp
        }));
        
        setAnnotations(normalizedAnnotations);
        setBloomScores(data.bloomScores || bloomScores);
        setComment(data.overallComment || '');
      }
    } catch (err) {
      // No existing annotation, that's fine
    }
  };

  const handleTextSelection = (selectedTurnIndex) => {
    const selection = window.getSelection();
    if (selection.toString().length === 0) {
      setSelectedText(null);
      setShowLabelPopup(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText({
      text: selection.toString(),
      range,
      position: { top: rect.top, left: rect.left }
    });
    
    // Store which turn was selected so we can use it later
    setSelectedTurnIndex(selectedTurnIndex);

    // Show popup on the right side of the selection, at the vertical center
    const popupTop = window.scrollY + rect.top + (rect.height / 2) - 150; // Center popup vertically around selection
    const popupLeft = window.scrollX + rect.right + 15; // 15px to the right of selection

    setLabelPopupPosition({
      top: popupTop,
      left: popupLeft,
      isFixed: false
    });
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

      // Find the specific turn that was selected
      const targetTurn = conversation.turns.find(turn => turn.turn_index === selectedTurnIndex);
      
      if (!targetTurn) {
        console.error('Target turn not found');
        return;
      }

      const turnText = targetTurn.text;
      
      // Try to find the text in this specific turn
      let offsetInTurn = turnText.indexOf(text);
      
      // If not found exactly, try without extra whitespace
      if (offsetInTurn === -1) {
        const compactText = text.replace(/\s+/g, ' ').trim();
        const compactTurnText = turnText.replace(/\s+/g, ' ').trim();
        
        if (compactTurnText.includes(compactText)) {
          const words = compactText.split(' ');
          const firstWord = words[0];
          offsetInTurn = turnText.indexOf(firstWord);
        }
      }
      
      if (offsetInTurn === -1) {
        console.error('Could not find selected text in target turn');
        return;
      }

      const newAnnotation = {
        id: Date.now(),
        text: text,
        labels: labels,
        turnIndex: selectedTurnIndex,  // Use the selected turn index
        offsetInTurn,
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

          // Show label popup on the right side of the annotation text
          const rect = elem.getBoundingClientRect();
          const popupTop = window.scrollY + rect.top + (rect.height / 2) - 150;
          const popupLeft = window.scrollX + rect.right + 15;

          setLabelPopupPosition({
            top: popupTop,
            left: popupLeft,
            isFixed: false
          });
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
          <button className="btn-back" onClick={onBack}>
            ← Back
          </button>
          <div className="header-info">
            <h1>Annotating: CID{cidNumber} - {prolificId}</h1>
            <p className="header-meta">Total turns: {conversation?.turns?.length || 0}</p>
          </div>
          <span className="annotator-badge">{annotatorName}</span>
        </div>
        <div className="header-right">
          {saveMessage && <span className="save-message">{saveMessage}</span>}
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
            bloomLevels={bloomLevels}
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
    </div>
  );
}

export default AnnotationInterface;
