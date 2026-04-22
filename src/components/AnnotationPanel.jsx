import React from 'react';
import '../styles/AnnotationPanel.css';

function AnnotationPanel({
  annotations,
  bloomLevels,
  bloomLabels,
  onRemoveAnnotation,
  onEditAnnotation,
  editingAnnotation,
  roleFilter,
  onRoleFilterChange
}) {
  const bloomColors = {
    remember: '#FF6B6B',
    understand: '#4ECDC4',
    apply: '#45B7D1',
    analyze: '#FFA07A',
    evaluate: '#98D8C8',
    create: '#F7DC6F'
  };

  return (
    <div className="annotation-panel">
      <div className="panel-section">
        <h3>🎯 Select Roles to Annotate</h3>
        <div className="role-filter">
          <label className="role-checkbox">
            <input
              type="checkbox"
              checked={roleFilter.ai}
              onChange={() => onRoleFilterChange({ ...roleFilter, ai: !roleFilter.ai })}
            />
            <span>🤖 AI Messages</span>
          </label>
          <label className="role-checkbox">
            <input
              type="checkbox"
              checked={roleFilter.user}
              onChange={() => onRoleFilterChange({ ...roleFilter, user: !roleFilter.user })}
            />
            <span>👤 User Messages</span>
          </label>
        </div>
      </div>

      <div className="panel-section">
        <h3>📊 Annotations ({annotations.length})</h3>
        <div className="annotations-list">
          {annotations.length === 0 ? (
            <p className="empty-list">
              👆 Highlight text in the conversation to annotate
            </p>
          ) : (
            annotations.map((ann) => (
              <div key={ann.id} className={`annotation-item ${editingAnnotation?.id === ann.id ? 'editing' : ''}`}>
                <div className="annotation-text">
                  <p className="annotation-quoted">
                    "{(ann.extracted_text || ann.text).substring(0, 60)}
                    {(ann.extracted_text || ann.text).length > 60 ? '...' : ''}"
                  </p>
                  <div className="annotation-labels">
                    {ann.labels.map((label) => (
                      <span
                        key={label}
                        className="level-badge"
                        style={{ backgroundColor: bloomColors[label] }}
                      >
                        {bloomLabels[label].substring(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="annotation-actions">
                  <button
                    className="btn-edit"
                    onClick={() => onEditAnnotation(ann)}
                    title="Click to edit labels or scroll to location"
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

export default AnnotationPanel;
