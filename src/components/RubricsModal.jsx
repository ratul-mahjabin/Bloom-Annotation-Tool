import React, { useState } from 'react';
import '../styles/RubricsModal.css';

function RubricsModal({ isOpen, onClose }) {
  const [expandedLevel, setExpandedLevel] = useState(null);

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

  const bloomLabels = {
    remember: 'Remember',
    understand: 'Understand',
    apply: 'Apply',
    analyze: 'Analyze',
    evaluate: 'Evaluate',
    create: 'Create'
  };

  const bloomColors = {
    remember: '#FF6B6B',
    understand: '#4ECDC4',
    apply: '#45B7D1',
    analyze: '#FFA07A',
    evaluate: '#98D8C8',
    create: '#F7DC6F'
  };

  const bloomLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

  const scoreLabels = {
    1: 'Not present',
    2: 'Weak/unclear',
    3: 'Basic presence',
    4: 'Strong demonstration',
    5: 'Exceptional demonstration'
  };

  if (!isOpen) return null;

  return (
    <div className="rubrics-modal-overlay">
      <div className="rubrics-modal-content">
        <div className="rubrics-modal-header">
          <h2>📚 Bloom's Taxonomy Rubrics</h2>
          <button className="rubrics-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="rubrics-modal-body">
          {/* Score Guidelines Section */}
          <div className="rubrics-section">
            <h3>Score Guidelines</h3>
            <p className="rubrics-intro">
              For each Bloom level, rate: <strong>"To what extent does the participant demonstrate this level?"</strong>
            </p>
            
            {[1, 2, 3, 4, 5].map((score) => (
              <div key={score} className="score-rubric-item">
                <div className="score-level">
                  <span className="score-star">{'⭐'.repeat(score)}</span>
                  <span className="score-title">{score} — {scoreLabels[score]}</span>
                </div>
                <div className="score-description">
                  {score === 1 && (
                    <>
                      <p>No valid evidence meeting the minimum criteria</p>
                      <p>Content is absent, trivial, or irrelevant</p>
                    </>
                  )}
                  {score === 2 && (
                    <>
                      <p>Attempted, but does not fully meet the minimum criteria</p>
                      <p>Reasoning is vague, incomplete, or partially incorrect</p>
                    </>
                  )}
                  {score === 3 && (
                    <>
                      <p>At least one clear instance meeting the minimum criteria</p>
                      <p>Correct but limited depth or elaboration</p>
                    </>
                  )}
                  {score === 4 && (
                    <>
                      <p>Well-developed reasoning OR multiple valid instances</p>
                      <p>Clear structure, coherence, and logical development</p>
                    </>
                  )}
                  {score === 5 && (
                    <>
                      <p>At least one instance showing exceptional depth, clarity, or insight, OR sustained high-quality reasoning across turns</p>
                      <p>Demonstrates precise, nuanced, and well-integrated thinking</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bloom Levels Section */}
          <div className="rubrics-section">
            <h3>Bloom's Levels Rubrics</h3>
            <div className="bloom-rubrics-list">
              {bloomLevels.map((level) => (
                <div
                  key={level}
                  className={`bloom-rubric-card ${expandedLevel === level ? 'expanded' : ''}`}
                >
                  <button
                    className="bloom-rubric-header"
                    onClick={() => setExpandedLevel(expandedLevel === level ? null : level)}
                    style={{ borderLeftColor: bloomColors[level] }}
                  >
                    <span
                      className="bloom-level-badge"
                      style={{ backgroundColor: bloomColors[level] }}
                    >
                      {bloomLabels[level]}
                    </span>
                    <span className="bloom-toggle-icon">
                      {expandedLevel === level ? '▼' : '▶'}
                    </span>
                  </button>

                  {expandedLevel === level && (
                    <div className="bloom-rubric-body">
                      <div className="rubric-section">
                        <strong>Definition:</strong>
                        <p>{levelRubrics[level].definition}</p>
                      </div>

                      <div className="rubric-section">
                        <strong>Use when the response:</strong>
                        <ul>
                          {levelRubrics[level].uses.map((use, idx) => (
                            <li key={idx}>{use}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rubric-section">
                        <strong>Minimum criterion:</strong>
                        <p>{levelRubrics[level].minimum}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RubricsModal;
