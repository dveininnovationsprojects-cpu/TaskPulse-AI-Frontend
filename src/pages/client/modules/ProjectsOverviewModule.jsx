import React from 'react';

const ProjectsOverviewModule = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Projects Overview</h2>
      </div>
      <div className="module-content">
        <p>View high-level project milestones, progress summaries, and risk flags.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
          <p style={{ color: '#0c5965', fontStyle: 'italic' }}>High-level projects summary will be rendered here...</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectsOverviewModule;
