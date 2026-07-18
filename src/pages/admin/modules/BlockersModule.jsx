import React from 'react';

const BlockersModule = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Blockers & Escalations</h2>
      </div>
      <div className="module-content">
        <p>Track reported blockers, categorize severity, and manage escalation workflows.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ color: '#0c5965', fontStyle: 'italic' }}>Blockers list table will be rendered here...</p>
        </div>
      </div>
    </div>
  );
};

export default BlockersModule;
