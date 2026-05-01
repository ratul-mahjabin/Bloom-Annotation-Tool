import React, { useState } from 'react';
import '../styles/LikertPanel.css';

function LikertPanel({
  bloomScores,
  comment,
  bloomLevels,
  bloomLabels,
  onScoreChange,
  onCommentChange,
  onSave,
  isSaving
}) {
  const [expandedRubric, setExpandedRubric] = useState(null);

  const bloomDescriptions = {
    remember: 'To what extent does the participant demonstrate this level - <strong>Remember</strong>?',
    understand: 'To what extent does the participant demonstrate this level - <strong>Understand</strong>?',
    apply: 'To what extent does the participant demonstrate this level - <strong>Apply</strong>?',
    analyze: 'To what extent does the participant demonstrate this level - <strong>Analyze</strong>?',
    evaluate: 'To what extent does the participant demonstrate this level - <strong>Evaluate</strong>?',
    create: 'To what extent does the participant demonstrate this level - <strong>Create</strong>?'
  };

  const levelRubrics = {
    remember: {
      definition: 'Recall or recognition of learned information.',
      uses: [
        'recalls a fact, definition, or idea',
        'identifies something previously learned',
        'repeats a concept with little elaboration',
        'lists known items or principles'
      ],
      minimum: 'Contains explicit recall or restatement, not just implicit familiarity'
    },
    understand: {
      definition: 'Demonstrates comprehension of ideas or concepts.',
      uses: [
        'explains why something matters',
        'describes relationships between ideas',
        'paraphrases in own words',
        'shows comprehension of a principle'
      ],
      minimum: 'Includes explanation or interpretation, not just restatement'
    },
    apply: {
      definition: 'Uses knowledge in a concrete or practical situation.',
      uses: [
        'describes how IH would be used in practice',
        'transfers ideas to real or hypothetical situations',
        'outlines steps or actions',
        'demonstrates operational use'
      ],
      minimum: 'Must include a specific scenario (real or hypothetical) AND an action or decision'
    },
    analyze: {
      definition: 'Breaks ideas into components and examines relationships.',
      uses: [
        'distinguishes between viewpoints',
        'identifies assumptions, biases, causes, or components',
        'compares and contrasts ideas',
        'shows part-to-whole reasoning'
      ],
      minimum: 'Must include at least two components, factors, or perspectives AND a relationship between them'
    },
    evaluate: {
      definition: 'Judges or critiques using criteria and reasoning.',
      uses: [
        'judges the strength/weakness of arguments or beliefs',
        'critiques a claim',
        'weighs evidence',
        'defends or revises a position',
        'prioritizes among options'
      ],
      minimum: 'Must include a clear judgment AND an explicit or implied justification (criterion, evidence, or reasoning)'
    },
    create: {
      definition: 'Produces novel ideas, strategies, or syntheses.',
      uses: [
        'proposes a new strategy',
        'constructs a plan for handling uncertainty or disagreement',
        'synthesizes ideas into a new approach',
        'designs a method, rule set, or guideline'
      ],
      minimum: 'Must include novel synthesis not directly restated or implied by the prompt'
    }
  };

  const scoreLabels = {
    1: 'Not present',
    2: 'Weak/unclear',
    3: 'Basic presence',
    4: 'Strong demonstration',
    5: 'Exceptional demonstration'
  };

  const bloomColors = {
    remember: '#FF6B6B',
    understand: '#4ECDC4',
    apply: '#45B7D1',
    analyze: '#FFA07A',
    evaluate: '#98D8C8',
    create: '#F7DC6F'
  };

  return (
    <div className="likert-panel">
      <div className="panel-header">
        <div className="header-title-section">
          <h3>📊 Cognitive Depth Assessment</h3>
        </div>
        <p className="panel-subtitle">Rate the evidence of each Bloom level (1-5) ⭐</p>
      </div>

      <div className="likert-scales">
        {bloomLevels.map((level) => (
          <div key={level} className="likert-item">
            <div className="likert-question">
              <span
                className="level-indicator"
                style={{ backgroundColor: bloomColors[level] }}
              >
                {bloomLabels[level]}
              </span>
              <div className="question-section">
                <label dangerouslySetInnerHTML={{ __html: bloomDescriptions[level] }} />
                <button 
                  className="level-info-button"
                  onClick={() => setExpandedRubric(expandedRubric === level ? null : level)}
                  title={`View ${bloomLabels[level]} rubric`}
                >
                  ℹ️
                </button>
              </div>
            </div>

            {expandedRubric === level && (
              <div className="level-rubric-expanded">
                <div className="expanded-definition">
                  <strong>Definition:</strong>
                  <p>{levelRubrics[level].definition}</p>
                </div>
                
                <div className="expanded-uses">
                  <strong>Use when the response:</strong>
                  <ul>
                    {levelRubrics[level].uses.map((use, idx) => (
                      <li key={idx}>{use}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="expanded-minimum">
                  <strong>Minimum criterion:</strong>
                  <p>{levelRubrics[level].minimum}</p>
                </div>
              </div>
            )}

            <div className="likert-options">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  className={`likert-button ${bloomScores[level] === score ? 'selected' : ''}`}
                  onClick={() => onScoreChange(level, score)}
                  title={scoreLabels[score]}
                >
                  <span className="score-number">{score}</span>
                  <span className="score-label">{scoreLabels[score]}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="comment-section">
        <h3>💬 Overall Comments</h3>
        <p className="comment-hint">
          Provide any additional observations about the participant's cognitive engagement
        </p>
        <textarea
          className="comment-box"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Enter your observations and comments here..."
          rows="6"
          style={{ marginTop: '12px' }}
        />
      </div>

      <div className="panel-footer">
        <button
          className="btn-save-final"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? '⏳ Saving...' : '💾 Save Annotation'}
        </button>
        <p className="save-hint">Annotations are auto-saved to your local folder</p>
      </div>
    </div>
  );
}

export default LikertPanel;
