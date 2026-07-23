import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api, { getCurrentUser, refreshCurrentUser } from '../../../services/api';
import { Plus, CheckCircle2, Calendar, User, MessageSquare, X, AlertTriangle } from 'lucide-react';

const BlockersModule = () => {
  const [blockers, setBlockers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    taskId: '',
    reason: '',
    expectedResolutionDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError('');
    try {
      let user = getCurrentUser();
      if (!user || !user.id) {
        user = await refreshCurrentUser().catch(() => null);
      }
      setCurrentUser(user);

      if (user && user.id) {
        const [blockersRes, tasksRes] = await Promise.all([
          api.get('/api/blockers/active').catch(() => ({ data: [] })),
          api.get(`/api/tasks/assignee/${user.id}`).catch(() => ({ data: [] }))
        ]);

        setBlockers(blockersRes.data || []);
        setTasks((tasksRes.data || []).filter(t => t.status !== 'DONE'));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch blockers data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setModalError('');
    setFormData({
      taskId: tasks.length > 0 ? tasks[0].id : '',
      reason: '',
      expectedResolutionDate: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!formData.taskId) {
      setModalError('Please select a task to report a blocker on.');
      return;
    }
    if (!formData.reason.trim()) {
      setModalError('Please enter a valid reason for the blocker.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        taskId: parseInt(formData.taskId, 10),
        reportedById: currentUser?.id,
        reason: formData.reason,
        expectedResolutionDate: formData.expectedResolutionDate || null
      };

      await api.post('/api/blockers', payload);
      await api.patch(`/api/tasks/${payload.taskId}/status?status=BLOCKED`).catch(() => {});
      setShowModal(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to report blocker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveBlocker = async (blockerId, taskId) => {
    if (window.confirm('Are you sure you want to resolve this blocker? The associated task status will revert to In Progress.')) {
      try {
        await api.put(`/api/blockers/${blockerId}/resolve`);
        if (taskId) {
          await api.patch(`/api/tasks/${taskId}/status?status=IN_PROGRESS`).catch(() => {});
        }
        fetchInitialData();
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
        <button className="btn-pill" onClick={handleOpenModal}>
          <Plus size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
          Report Blocker
        </button>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading active blockers...</div>
        ) : blockers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'rgba(255,255,255,0.6)', borderRadius: '20px', color: '#0c5965', border: '1px solid rgba(17,177,198,0.1)' }}>
            <AlertTriangle size={32} color="#11b1c6" style={{ marginBottom: '10px' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>No active blockers reported across projects. The team is running smoothly!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {blockers.map(b => (
              <div key={b.id} style={{ 
                background: 'white', 
                padding: '24px', 
                borderRadius: '20px', 
                border: '1px solid rgba(239, 68, 68, 0.25)', 
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <span className="status-badge status-BLOCKED" style={{ marginBottom: '8px' }}>BLOCKED</span>
                      <h4 style={{ margin: '6px 0 2px 0', color: '#dc2626', fontSize: '1.05rem', fontWeight: 600 }}>{b.task?.taskName || `Task #${b.taskId}`}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Project: {b.task?.project?.projectName || 'N/A'}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#89c4d1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {b.createdAt ? b.createdAt.substring(0, 10) : ''}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: '#334155', margin: '14px 0', display: 'flex', gap: '8px', alignItems: 'start', background: 'rgba(254, 242, 242, 0.6)', padding: '12px 14px', borderRadius: '14px' }}>
                    <MessageSquare size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0, lineHeight: 1.4 }}><strong>Reason:</strong> {b.reason}</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(17,177,198,0.08)', paddingTop: '14px', marginTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0c5965', fontWeight: 500 }}>
                      <User size={12} /> Reported by: {b.reportedBy?.name || 'Team Member'}
                    </span>
                    {b.expectedResolutionDate && (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>
                        Exp. Res: {b.expectedResolutionDate}
                      </span>
                    )}
                  </div>

                  <button 
                    className="btn-pill" 
                    style={{ 
                      width: '100%', 
                      margin: 0, 
                      padding: '10px 16px', 
                      background: '#059669', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px', 
                      boxShadow: '0 4px 15px rgba(5, 150, 105, 0.2)' 
                    }}
                    onClick={() => handleResolveBlocker(b.id, b.task?.id || b.taskId)}
                  >
                    <CheckCircle2 size={16} /> Mark Blocker Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Blocker Modal (Sprint UI Styled) */}
      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-bg-glass"></div>
            <div className="modal-header">
              <h3>Report New Blocker</h3>
              <button className="modal-close" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="modal-form">
              {modalError && <div className="error-message">{modalError}</div>}
              
              <div className="form-group">
                <label>Select Task *</label>
                <select
                  name="taskId"
                  className="form-control"
                  value={formData.taskId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>Choose assigned task...</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.taskName} ({t.project?.projectName || 'No Project'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Reason for Blocker *</label>
                <textarea
                  name="reason"
                  className="form-control"
                  rows="3"
                  placeholder="e.g. Waiting for API key approval or database connection issue"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  style={{ resize: 'vertical', borderRadius: '20px' }}
                />
              </div>

              <div className="form-group">
                <label>Expected Resolution Date</label>
                <input
                  type="date"
                  name="expectedResolutionDate"
                  className="form-control"
                  value={formData.expectedResolutionDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary-pill" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-pill" disabled={isSubmitting}>
                  {isSubmitting ? 'Reporting...' : 'Save & Report Blocker'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BlockersModule;
