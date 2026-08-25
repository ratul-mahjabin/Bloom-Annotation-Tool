import React, { useState, useEffect } from 'react';
import AnnotationInterface from './components/AnnotationInterface';
import SocraticAnnotationInterface from './components/SocraticAnnotationInterface';
import ConversationSelector from './components/ConversationSelector';
import './App.css';

function App() {
  const [annotatorName, setAnnotatorName] = useState(() => {
    return localStorage.getItem('annotatorName') || '';
  });
  const [tempName, setTempName] = useState('');
  const [annotationMode, setAnnotationMode] = useState(null); // 'bloom' | 'socratic'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedCID, setSelectedCID] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showSelector, setShowSelector] = useState(true);

  useEffect(() => {
    if (annotatorName) {
      localStorage.setItem('annotatorName', annotatorName);
    }
  }, [annotatorName]);

  const handleConversationSelect = (prolificId, cidNumber, allConversations, index) => {
    setSelectedConversation(prolificId);
    setSelectedCID(cidNumber);
    if (allConversations) {
      setConversations(allConversations);
      setSelectedIndex(index);
    }
    setShowSelector(false);
  };

  const handleNavigate = (direction) => {
    const nextIndex = selectedIndex + direction;
    if (nextIndex < 0 || nextIndex >= conversations.length) return;
    const nextProlificId = conversations[nextIndex];
    const nextCID = nextIndex + 1;
    setSelectedConversation(nextProlificId);
    setSelectedCID(nextCID);
    setSelectedIndex(nextIndex);
  };

  const handleBackToSelector = () => {
    setSelectedConversation(null);
    setShowSelector(true);
  };

  const handleStartAnnotating = () => {
    if (tempName.trim()) {
      setAnnotatorName(tempName);
    }
  };

  const handleBackToModeSelect = () => {
    setSelectedConversation(null);
    setShowSelector(true);
    setAnnotationMode(null);
  };

  if (!annotatorName) {
    return (
      <div className="app-container">
        <div className="setup-screen">
          <h1>🌱 Bloom Annotation Tool</h1>
          <div className="setup-box">
            <h2>Welcome!</h2>
            <p>Please enter your name to begin annotating conversations.</p>
            <input
              type="text"
              placeholder="Your name (max 30 characters)"
              value={tempName}
              maxLength={30}
              onChange={(e) => setTempName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && tempName.trim()) {
                  handleStartAnnotating();
                }
              }}
              autoFocus
            />
            <button
              onClick={handleStartAnnotating}
              disabled={!tempName.trim()}
            >
              Start Annotating
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!annotationMode) {
    return (
      <div className="app-container">
        <div className="setup-screen">
          <h1>🌱 Bloom Annotation Tool</h1>
          <div className="setup-box mode-select-box">
            <h2>Welcome, {annotatorName}!</h2>
            <p className="mode-select-subtitle">Choose which type of annotation you'd like to perform.</p>
            <div className="mode-select-options">
              <button
                className="mode-select-button"
                onClick={() => setAnnotationMode('bloom')}
              >
                <span className="mode-select-title">🌱 Bloom Annotation</span>
                <span className="mode-select-desc">
                  Highlight AI or User turns, apply Bloom's Taxonomy labels, and rate cognitive depth.
                </span>
              </button>
              <button
                className="mode-select-button"
                onClick={() => setAnnotationMode('socratic')}
              >
                <span className="mode-select-title">💬 Socratic Annotation</span>
                <span className="mode-select-desc">
                  Highlight AI turns (from turn 3 onward) and classify each span with a single Socratic question type.
                </span>
              </button>
            </div>
            <button
              className="btn-change-name mode-select-change-name"
              onClick={() => setAnnotatorName('')}
            >
              Change Name
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {showSelector ? (
        <ConversationSelector
          annotatorName={annotatorName}
          annotationMode={annotationMode}
          onSelectConversation={handleConversationSelect}
          onChangeName={() => setAnnotatorName('')}
          onChangeMode={handleBackToModeSelect}
        />
      ) : annotationMode === 'socratic' ? (
        <SocraticAnnotationInterface
          key={`${selectedCID}:${selectedConversation}`}
          annotatorName={annotatorName}
          prolificId={selectedConversation}
          cidNumber={selectedCID}
          onBack={handleBackToSelector}
          onNavigate={handleNavigate}
          canGoPrev={selectedIndex > 0}
          canGoNext={selectedIndex < conversations.length - 1}
        />
      ) : (
        <AnnotationInterface
          key={`${selectedCID}:${selectedConversation}`}
          annotatorName={annotatorName}
          prolificId={selectedConversation}
          cidNumber={selectedCID}
          onBack={handleBackToSelector}
          onNavigate={handleNavigate}
          canGoPrev={selectedIndex > 0}
          canGoNext={selectedIndex < conversations.length - 1}
        />
      )}
    </div>
  );
}

export default App;
