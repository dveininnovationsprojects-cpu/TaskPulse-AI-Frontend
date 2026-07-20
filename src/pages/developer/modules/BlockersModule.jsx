import React, { useState, useEffect } from 'react';
import api, { getCurrentUser, refreshCurrentUser } from '../../../services/api';
import { AlertCircle, CheckCircle2, Calendar, User, MessageSquare } from 'lucide-react';

const BlockersModule = () => {
  const [blockers, setBlockers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    taskId: '',
    reason: '',
    expectedResolutionDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    fetchBlockersAndTasks();
  }, []);

  const fetchBlockersAndTasks = async () => {
    setIsLoading(true);
    setError('');
    try {
      let user = getCurrentUser();
      if (!user || !user.id) {
        user = await refreshCurrentUser();
      }
      setCurrentUser(user);

      if (user && user.id) {
        const [blockersRes, tasksRes] = await Promise.all([
          api.get('/api/blockers/active').catch(() => ({ data: [] })),
          api.get(`/api/tasks/assignee/${user.id}`).catch(() => ({ data: [] }))
        ]);

        const allActive = blockersRes.data || [];
        // Filter blockers relevant to me (reported by me or task assigned to me)
        const myActiveBlockers = allActive.filter(b => b.reportedBy?.id === user.id || b.task?.assignee?.id === user.id);
        setBlockers(myActiveBlockers);

        // Keep active tasks (not Done) to report blockers on
        setTasks((tasksRes.data || []).filter(t => t.status !== 'DONE' && t.status !== 'BLOCKED'));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch blockers info.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        taskId: parseInt(formData.taskId, 10),
        reportedById: currentUser.id,
        reason: formData.reason,
        expectedResolutionDate: formData.expectedResolutionDate || null
      };

      await api.post('/api/blockers', payload);
      setSubmitSuccess('Blocker reported successfully! Task status set to Blocked.');
      setFormData({
        taskId: '',
        reason: '',
        expectedResolutionDate: ''
      });
      // Refresh list
      await fetchBlockersAndTasks();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to report blocker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveBlocker = async (blockerId) => {
    try {
      await api.put(`/api/blockers/${blockerId}/resolve`);
      await fetchBlockersAndTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to resolve blocker. Make sure you are authorized.');
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Blockers & Risks</h2>
      </div>

      <div className="module-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Report Blocker Form */}
        <div style={{ background: 'rgba(255, 255, 255, 0.5)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(17,177,198,0.15)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#0c5965', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: '#ef4444' }} /> Report New Blocker
          </h3>

          <form onSubmit={handleSubmit}>
            {submitError && <div className="error-message" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>{submitError}</div>}
            {submitSuccess && (
              <div className="error-message" style={{ 
                padding: '8px 12px', 
                fontSize: '0.8rem', 
                backgroundColor: 'rgba(220, 252, 231, 0.8)', 
                color: '#166534', 
                borderColor: '#bbf7d0' 
              }}>
                {submitSuccess}
              </div>
            )}

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#0c5965', fontWeight: 500, fontSize: '0.9rem' }}>Select Task *</label>
              <select
                name="taskId"
                className="form-control"
                value={formData.taskId}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>Choose blocked task...</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.taskName} ({t.project?.projectName || 'No Project'})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#0c5965', fontWeight: 500, fontSize: '0.9rem' }}>Blocker Reason / Details *</label>
              <textarea
                name="reason"
                className="form-control"
                rows="4"
                placeholder="Why is this task blocked?"
                value={formData.reason}
                onChange={handleInputChange}
                required
                style={{ resize: 'vertical', borderRadius: '12px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#0c5965', fontWeight: 500, fontSize: '0.9rem' }}>Expected Resolution Date</label>
              <input
                type="date"
                name="expectedResolutionDate"
                className="form-control"
                value={formData.expectedResolutionDate}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="btn-pill" style={{ width: '100%', margin: '10px 0 0 0', background: '#ef4444', color: 'white', boxShadow: 'none' }} disabled={isSubmitting}>
              {isSubmitting ? 'Reporting...' : 'Report Blocker'}
            </button>
          </form>
        </div>

        {/* Active Blockers List */}
        <div>
          <h3 style={{ margin: '0 0 20px 0', color: '#0c5965', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> Active Blockers ({blockers.length})
          </h3>

          {error && <div className="error-message">{error}</div>}

          {isLoading ? (
            <p style={{ color: '#11b1c6' }}>Loading blockers...</p>
          ) : blockers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.3)', borderRadius: '16px', color: '#0c5965', fontStyle: 'italic' }}>
              No active blockers reported on your tasks. Good job!
            </div>
          ) : (
            <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {blockers.map(b => (
                <div key={b.id} style={{ 
                  background: 'white', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(239, 68, 68, 0.2)', 
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, color: '#ef4444', fontSize: '0.95rem' }}>{b.task?.taskName}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {b.createdAt ? b.createdAt.substring(0, 10) : ''}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#334155', margin: '0 0 12px 0', display: 'flex', gap: '6px', alignItems: 'start' }}>
                    <MessageSquare size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0 }}>{b.reason}</p>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    fontSize: '0.75rem', 
                    color: '#64748b', 
                    borderTop: '1px solid #f1f5f9', 
                    paddingTop: '8px' 
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> Reported by: {b.reportedBy?.name || 'Me'}
                    </span>
                    {b.expectedResolutionDate && (
                      <span style={{ color: '#ef4444', fontWeight: 500 }}>
                        Exp. Resolution: {b.expectedResolutionDate}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button 
                      className="btn-pill" 
                      style={{ 
                        margin: 0, 
                        padding: '6px 12px', 
                        fontSize: '0.8rem', 
                        background: '#059669', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        boxShadow: 'none' 
                      }}
                      onClick={() => handleResolveBlocker(b.id)}
                    >
                      <CheckCircle2 size={14} /> Resolve Blocker
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockersModule;
