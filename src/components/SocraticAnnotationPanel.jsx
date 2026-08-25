import React from 'react';
import '../styles/AnnotationPanel.css';
import '../styles/SocraticAnnotationPanel.css';

function SocraticAnnotationPanel({
  annotations,
  socraticLabels,
  socraticColors,
  socraticNumbers,
  onRemoveAnnotation,
  onEditAnnotation,
  editingAnnotation,
  minSelectableTurnIndex
}) {
  const sortedAnnotations = [...annotations].sort((a, b) => a.turnIndex - b.turnIndex);

  return (
    <div className="annotation-panel">
      <div className="panel-section">
        <h3>💬 Annotating AI Turns</h3>
        <p className="empty-list" style={{ marginBottom: 0 }}>
          Click the ✎ icon on an AI turn (from turn {minSelectableTurnIndex} onward) to label it.
        </p>
      </div>

      <div className="panel-section">
        <h3>📊 Annotations ({annotations.length})</h3>
        <div className="annotations-list">
          {annotations.length === 0 ? (
            <p className="empty-list">
              👆 Click the ✎ icon on an AI turn to annotate it
            </p>
          ) : (
            sortedAnnotations.map((ann) => (
              <div key={ann.id} className={`annotation-item ${editingAnnotation?.id === ann.id ? 'editing' : ''}`}>
                <div className="annotation-text">
                  <p className="annotation-quoted">Turn {ann.turnIndex}</p>
                  <div className="annotation-labels">
                    <span
                      className="level-badge socratic-level-badge"
                      style={{ backgroundColor: socraticColors[ann.label] }}
                    >
                      {socraticNumbers[ann.label]}. {socraticLabels[ann.label]}
                    </span>
                  </div>
                </div>
                <div className="annotation-actions">
                  <button
                    className="btn-edit"
                    onClick={() => onEditAnnotation(ann)}
                    title="Click to change label or scroll to location"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-remove"
                    onClick={() => onRemoveAnnotation(ann.id)}
                    title="Remove annotation"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default SocraticAnnotationPanel;
