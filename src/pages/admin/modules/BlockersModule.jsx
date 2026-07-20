import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { AlertCircle, CheckCircle2, Calendar, User, MessageSquare } from 'lucide-react';

const BlockersModule = () => {
  const [blockers, setBlockers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActiveBlockers();
  }, []);

  const fetchActiveBlockers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/blockers/active');
      setBlockers(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch active blockers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveBlocker = async (blockerId) => {
    if (window.confirm('Are you sure you want to resolve this blocker? The associated task status will revert to In Progress.')) {
      try {
        await api.put(`/api/blockers/${blockerId}/resolve`);
        fetchActiveBlockers();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Failed to resolve blocker.');
      }
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Blockers & Risks Management</h2>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading active blockers...</div>
        ) : blockers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.3)', borderRadius: '16px', color: '#0c5965', fontStyle: 'italic' }}>
            No active blockers reported across projects. The team is running smoothly!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {blockers.map(b => (
              <div key={b.id} style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '16px', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#ef4444', fontSize: '1rem' }}>{b.task?.taskName}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Project: {b.task?.project?.projectName || 'N/A'}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#89c4d1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {b.createdAt ? b.createdAt.substring(0, 10) : ''}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: '#334155', margin: '12px 0', display: 'flex', gap: '6px', alignItems: 'start' }}>
                    <MessageSquare size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0 }}><strong>Reason:</strong> {b.reason}</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> Reported by: {b.reportedBy?.name || 'Unknown'}
                    </span>
                    {b.expectedResolutionDate && (
                      <span style={{ color: '#ef4444', fontWeight: 500 }}>
                        Exp. Resolution: {b.expectedResolutionDate}
                      </span>
                    )}
                  </div>

                  <button 
                    className="btn-pill" 
                    style={{ 
                      width: '100%', 
                      margin: 0, 
                      padding: '8px 16px', 
                      background: '#059669', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px', 
                      boxShadow: 'none' 
                    }}
                    onClick={() => handleResolveBlocker(b.id)}
                  >
                    <CheckCircle2 size={16} /> Mark Blocker Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockersModule;
