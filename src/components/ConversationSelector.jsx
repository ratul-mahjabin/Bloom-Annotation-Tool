import React, { useState, useEffect } from 'react';
import '../styles/ConversationSelector.css';

function ConversationSelector({ annotatorName, onSelectConversation, onChangeName }) {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [annotatedCount, setAnnotatedCount] = useState(0);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    filterConversations(searchTerm);
  }, [conversations, searchTerm]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(data.prolificIds);
      countAnnotated(data.prolificIds);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      alert('Error loading conversations. Check browser console.');
    } finally {
      setLoading(false);
    }
  };

  const countAnnotated = async (prolificIds) => {
    let count = 0;
    for (let index = 0; index < prolificIds.length; index++) {
      const id = prolificIds[index];
      const cidNumber = index + 1; // CID1, CID2, etc.
      try {
        const response = await fetch(`/api/annotation-exists/${encodeURIComponent(annotatorName)}/${id}/${cidNumber}`);
        const data = await response.json();
        if (data.exists) count++;
      } catch (err) {
        // Ignore errors
      }
    }
    setAnnotatedCount(count);
  };

  const filterConversations = (term) => {
    if (!term.trim()) {
      setFilteredConversations(conversations);
    } else {
      const lowerTerm = term.toLowerCase();
      setFilteredConversations(
        conversations.filter((conv, index) => {
          // Search by prolificId OR by CID number
          const cidNumber = index + 1; // CID1, CID2, etc.
          const prolificMatch = conv.toLowerCase().includes(lowerTerm);
          const cidMatch = `cid${cidNumber}`.includes(lowerTerm);
          return prolificMatch || cidMatch;
        })
      );
    }
  };

  return (
    <div className="selector-container">
      <header className="selector-header">
        <div className="header-content">
          <h1>🌱 Bloom Annotation Tool</h1>
          <div className="header-info">
            <span className="annotator-name">Annotator: <strong>{annotatorName}</strong></span>
            <span className="progress-badge">
              {annotatedCount} / {conversations.length} annotated
            </span>
            <button className="btn-change-name" onClick={onChangeName}>
              Change Name
            </button>
          </div>
        </div>
      </header>

      <div className="selector-content">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by CID (e.g., CID1) or Prolific ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-count">{filteredConversations.length} results</span>
        </div>

        {loading ? (
          <div className="loading">Loading conversations...</div>
        ) : (
          <div className="conversations-grid">
            {filteredConversations.length === 0 ? (
              <div className="no-results">
                {searchTerm ? 'No conversations found.' : 'No conversations available.'}
              </div>
            ) : (
              filteredConversations.map((prolificId, index) => {
                // Find the actual index in the original conversations array to maintain consistent CID numbering
                const actualIndex = conversations.indexOf(prolificId) + 1;
                return (
                  <ConversationCard
                    key={prolificId}
                    prolificId={prolificId}
                    cidNumber={actualIndex}
                    annotatorName={annotatorName}
                    onSelect={() => onSelectConversation(prolificId, actualIndex)}
                  />
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationCard({ prolificId, cidNumber, annotatorName, onSelect }) {
  const [isAnnotated, setIsAnnotated] = useState(false);

  useEffect(() => {
    checkIfAnnotated();
  }, []);

  const checkIfAnnotated = async () => {
    try {
      const response = await fetch(
        `/api/annotation-exists/${encodeURIComponent(annotatorName)}/${prolificId}/${cidNumber}`
      );
      const data = await response.json();
      setIsAnnotated(data.exists);
    } catch (err) {
      console.error('Error checking annotation:', err);
    }
  };

  return (
    <div
      className={`conversation-card ${isAnnotated ? 'annotated' : ''}`}
      onClick={onSelect}
    >
      <div className="card-content">
        <h3>CID{cidNumber}</h3>
        <p className="card-prolific-id">{prolificId.substring(0, 12)}...</p>
        <p className="card-status">
          {isAnnotated ? '✓ Annotated' : '○ Not started'}
        </p>
      </div>
      <div className="card-arrow">→</div>
    </div>
  );
}

export default ConversationSelector;
