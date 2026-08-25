import React, { useState, useEffect } from 'react';
import '../styles/ConversationSelector.css';

function ConversationSelector({ annotatorName, annotationMode = 'bloom', onSelectConversation, onChangeName, onChangeMode }) {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [completeCount, setCompleteCount] = useState(0);
  const [confusedCases, setConfusedCases] = useState([]);
  const [confusedPanelOpen, setConfusedPanelOpen] = useState(false);
  const isSocratic = annotationMode === 'socratic';

  useEffect(() => {
    fetchConversations();
    if (!isSocratic) {
      fetchConfusedCases();
    }
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
      countComplete(data.prolificIds);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      alert('Error loading conversations. Check browser console.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfusedCases = async () => {
    try {
      const response = await fetch(`/api/confused-cases/${encodeURIComponent(annotatorName)}`);
      const data = await response.json();
      setConfusedCases(data.cases || []);
    } catch (err) {
      // No confused cases or endpoint not available yet
    }
  };

  const countComplete = async (prolificIds) => {
    const statusEndpoint = isSocratic ? 'socratic-annotation-status' : 'annotation-status';
    let count = 0;
    for (let index = 0; index < prolificIds.length; index++) {
      const id = prolificIds[index];
      const cidNumber = index + 1;
      try {
        const response = await fetch(
          `/api/${statusEndpoint}/${encodeURIComponent(annotatorName)}/${id}/${cidNumber}`
        );
        const data = await response.json();
        if (data.complete) count++;
      } catch (err) {
        // Ignore errors
      }
    }
    setCompleteCount(count);
  };

  const filterConversations = (term) => {
    if (!term.trim()) {
      setFilteredConversations(conversations);
    } else {
      const lowerTerm = term.toLowerCase();
      setFilteredConversations(
        conversations.filter((conv, index) => {
          const cidNumber = index + 1;
          const prolificMatch = conv.toLowerCase().includes(lowerTerm);
          const cidMatch = `cid${cidNumber}`.includes(lowerTerm);
          return prolificMatch || cidMatch;
        })
      );
    }
  };

  const totalConfusedSpans = confusedCases.reduce((sum, c) => sum + c.confusedSpans.length, 0);

  return (
    <div className="selector-container">
      <header className="selector-header">
        <div className="header-content">
          <h1>{isSocratic ? '💬 Socratic Annotation Tool' : '🌱 Bloom Annotation Tool'}</h1>
          <div className="header-info">
            <span className="annotator-name">Annotator: <strong>{annotatorName}</strong></span>
            <span className="mode-badge">{isSocratic ? '💬 Socratic mode' : '🌱 Bloom mode'}</span>
            <span className="progress-badge">
              {completeCount} / {conversations.length} complete
            </span>
            {onChangeMode && (
              <button className="btn-change-name" onClick={onChangeMode}>
                Change Mode
              </button>
            )}
            <button className="btn-change-name" onClick={onChangeName}>
              Change Name
            </button>
          </div>
        </div>
      </header>

      {/* Collapsible Confused Cases Panel (Bloom mode only) */}
      {!isSocratic && (
      <div className={`confused-panel ${confusedPanelOpen ? 'open' : ''}`}>
        <button
          className="confused-panel-bar"
          onClick={() => setConfusedPanelOpen(o => !o)}
        >
          <span className="confused-panel-title">
            ⚠️ {totalConfusedSpans} confused span{totalConfusedSpans !== 1 ? 's' : ''} across {confusedCases.length} CID{confusedCases.length !== 1 ? 's' : ''}
          </span>
          <span className="confused-panel-chevron">{confusedPanelOpen ? '▲' : '▼'}</span>
        </button>

        {confusedPanelOpen && (
          <div className="confused-panel-body">
            {confusedCases.length === 0 ? (
              <p className="confused-none">No confused spans found yet.</p>
            ) : (
              confusedCases.map(caseItem => (
                <div key={caseItem.cidNumber} className="confused-cid-group">
                  <div className="confused-cid-header">
                    <button
                      className="confused-cid-badge confused-cid-link"
                      onClick={() => onSelectConversation(
                        caseItem.prolificId,
                        caseItem.cidNumber,
                        conversations,
                        caseItem.cidNumber - 1
                      )}
                      title={`Go to CID${caseItem.cidNumber}`}
                    >
                      CID{caseItem.cidNumber} ↗
                    </button>
                    <span className="confused-cid-count">{caseItem.confusedSpans.length} span{caseItem.confusedSpans.length !== 1 ? 's' : ''}</span>
                  </div>
                  <ul className="confused-spans-list">
                    {caseItem.confusedSpans.map((span, i) => (
                      <li key={i} className="confused-span-item">
                        <span className="confused-span-role">{span.role === 'ai' ? '🤖' : '👤'}</span>
                        <span className="confused-span-text">"{span.text}"</span>
                        <span className="confused-span-labels">
                          {span.allLabels.map(l => (
                            <span key={l} className={`span-label-tag ${l}`}>{l}</span>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      )}

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
              filteredConversations.map((prolificId) => {
                const actualIndex = conversations.indexOf(prolificId) + 1;
                return (
                  <ConversationCard
                    key={prolificId}
                    prolificId={prolificId}
                    cidNumber={actualIndex}
                    annotatorName={annotatorName}
                    isSocratic={isSocratic}
                    onSelect={() => onSelectConversation(prolificId, actualIndex, conversations, actualIndex - 1)}
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

function ConversationCard({ prolificId, cidNumber, annotatorName, isSocratic, onSelect }) {
  // status: 'not_started' | 'in_progress' | 'complete'
  const [status, setStatus] = useState('not_started');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const statusEndpoint = isSocratic ? 'socratic-annotation-status' : 'annotation-status';
      const response = await fetch(
        `/api/${statusEndpoint}/${encodeURIComponent(annotatorName)}/${encodeURIComponent(prolificId)}/${cidNumber}`
      );
      const data = await response.json();
      if (!data.exists) {
        setStatus('not_started');
      } else if (data.complete) {
        setStatus('complete');
      } else {
        setStatus('in_progress');
      }
    } catch (err) {
      console.error('Error checking annotation status:', err);
    }
  };

  const statusConfig = {
    not_started: { label: '○ Not started', className: '' },
    in_progress:  { label: '◑ Not finished', className: 'in-progress' },
    complete:     { label: '✓ Annotated', className: 'annotated' },
  };

  const { label, className } = statusConfig[status];

  return (
    <div
      className={`conversation-card ${className}`}
      onClick={onSelect}
    >
      <div className="card-content">
        <h3>CID{cidNumber}</h3>
        <p className="card-prolific-id">{prolificId.substring(0, 12)}...</p>
        <p className={`card-status card-status--${status}`}>
          {label}
        </p>
      </div>
      <div className="card-arrow">→</div>
    </div>
  );
}

export default ConversationSelector;
