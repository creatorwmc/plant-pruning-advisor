import { useState } from 'react';
import './ApiKeyModal.css';

export default function ApiKeyModal({ onSave, onCancel }) {
  const [key, setKey] = useState('');
  const [visible, setVisible] = useState(false);

  const handleSave = () => {
    const trimmed = key.trim();
    if (trimmed) onSave(trimmed);
  };

  return (
    <div className="apikey-overlay">
      <div className="apikey-card">
        <h2>API Key Required</h2>
        <p className="apikey-desc">
          This app uses Claude AI to analyze your plants. Enter your Anthropic API key to get started.
        </p>

        <div className="apikey-input-wrapper">
          <input
            className="apikey-input"
            type={visible ? 'text' : 'password'}
            placeholder="sk-ant-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <button
            className="apikey-toggle"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? 'Hide key' : 'Show key'}
            type="button"
          >
            {visible ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <p className="apikey-note">
          Your key is stored locally and never sent to any server except Anthropic's API.
        </p>

        <div className="apikey-actions">
          {onCancel && (
            <button className="apikey-cancel-btn" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            className="apikey-save-btn"
            onClick={handleSave}
            disabled={!key.trim()}
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
