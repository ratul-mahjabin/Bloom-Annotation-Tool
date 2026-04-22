import React, { useState, useEffect } from 'react';
import AnnotationInterface from './components/AnnotationInterface';
import ConversationSelector from './components/ConversationSelector';
import './App.css';

function App() {
  const [annotatorName, setAnnotatorName] = useState(() => {
    return localStorage.getItem('annotatorName') || '';
  });
  const [tempName, setTempName] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedCID, setSelectedCID] = useState(null);
  const [showSelector, setShowSelector] = useState(true);

  useEffect(() => {
    if (annotatorName) {
      localStorage.setItem('annotatorName', annotatorName);
    }
  }, [annotatorName]);

  const handleConversationSelect = (prolificId, cidNumber) => {
    setSelectedConversation(prolificId);
    setSelectedCID(cidNumber);
    setShowSelector(false);
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

  return (
    <div className="app-container">
      {showSelector ? (
        <ConversationSelector
          annotatorName={annotatorName}
          onSelectConversation={handleConversationSelect}
          onChangeName={() => setAnnotatorName('')}
        />
      ) : (
        <AnnotationInterface
          annotatorName={annotatorName}
          prolificId={selectedConversation}
          cidNumber={selectedCID}
          onBack={handleBackToSelector}
        />
      )}
    </div>
  );
}

export default App;
