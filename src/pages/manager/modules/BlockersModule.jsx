import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api, { getCurrentUser, refreshCurrentUser } from '../../../services/api';
import { Plus, CheckCircle2, Calendar, User, X, AlertTriangle, ChevronDown } from 'lucide-react';

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

  // Confirm Resolve State
  const [confirmResolveBlocker, setConfirmResolveBlocker] = useState(null);

  // Custom Dropdown State & Ref
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const taskRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (taskRef.current && !taskRef.current.contains(e.target)) {
        setIsTaskOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      const blockersRes = await api.get('/api/blockers/active').catch(() => ({ data: [] }));
      setBlockers(blockersRes.data || []);

      const isDeveloper = user && user.role && user.role.includes('DEVELOPER');
      if (isDeveloper && user.id) {
        const tasksRes = await api.get(`/api/tasks/assignee/${user.id}`).catch(() => ({ data: [] }));
        setTasks((tasksRes.data || []).filter(t => t.status !== 'DONE'));
      } else {
        const projectsRes = await api.get('/api/projects').catch(() => ({ data: [] }));
        const projects = projectsRes.data || [];

        if (projects.length > 0) {
          const taskPromises = projects.map(p => 
            api.get(`/api/tasks/project/${p.id}`).catch(() => ({ data: [] }))
          );
          const taskResponses = await Promise.all(taskPromises);
          const allTasks = taskResponses.flatMap(res => res.data || []);
          const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values());
          setTasks(uniqueTasks.filter(t => t.status !== 'DONE'));
        } else {
          setTasks([]);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch blockers data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({ taskId: '', reason: '', expectedResolutionDate: '' });
    setModalError('');
    setIsTaskOpen(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsTaskOpen(false);
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!formData.taskId) {
      setModalError('Please select a task.');
      return;
    }
    if (!formData.reason.trim()) {
      setModalError('Please provide a reason for the blocker.');
      return;
    }

    setIsSubmitting(true);
    try {
      let user = currentUser || getCurrentUser();
      const payload = {
        taskId: parseInt(formData.taskId, 10),
        reportedById: user && user.id ? parseInt(user.id, 10) : null,
        reason: formData.reason,
        expectedResolutionDate: formData.expectedResolutionDate || null
      };

      await api.post('/api/blockers', payload);
      await api.patch(`/api/tasks/${formData.taskId}/status?status=BLOCKED`).catch(() => {});
      handleCloseModal();
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to report blocker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeResolveBlocker = async () => {
    if (!confirmResolveBlocker) return;
    try {
      await api.put(`/api/blockers/${confirmResolveBlocker.id}/resolve`);
      const taskId = confirmResolveBlocker.taskId || confirmResolveBlocker.task?.id;
      if (taskId) {
        await api.patch(`/api/tasks/${taskId}/status?status=IN_PROGRESS`).catch(() => {});
      }
      setConfirmResolveBlocker(null);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError('Failed to resolve blocker.');
      setConfirmResolveBlocker(null);
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Blockers & Risks Management</h2>
        <button 
          className="btn-pill"
          style={{ marginTop: 0, padding: '10px 24px' }}
          onClick={handleOpenModal}
        >
          <Plus size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
          Report Blocker
        </button>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {/* Symbol-Free Stat Cards */}
        <div className="worklogs-stats-grid" style={{ marginBottom: '24px' }}>
          <div className="worklog-stat-card">
            <div className="stat-card-top">
              <span className="stat-category-tag tag-cyan">
                <span className="stat-pulse-dot"></span> ACTIVE BLOCKERS
              </span>
              <span className="stat-trend-badge trend-cyan">Live Risk</span>
            </div>
            <div className="stat-main">
              <div className="stat-value">{blockers.filter(b => b.status === 'ACTIVE').length}</div>
              <h4 className="stat-label">Critical Blockers</h4>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill bar-cyan" style={{ width: `${Math.min((blockers.filter(b => b.status === 'ACTIVE').length / (blockers.length || 1)) * 100, 100) || 10}%` }}></div>
            </div>
          </div>

          <div className="worklog-stat-card">
            <div className="stat-card-top">
              <span className="stat-category-tag tag-teal">
                AFFECTED TASKS
              </span>
              <span className="stat-trend-badge trend-teal">Impact</span>
            </div>
            <div className="stat-main">
              <div className="stat-value">{new Set(blockers.map(b => b.taskId)).size}</div>
              <h4 className="stat-label">Tasks Impacted</h4>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill bar-teal" style={{ width: `${Math.min((new Set(blockers.map(b => b.taskId)).size / 10) * 100, 100) || 5}%` }}></div>
            </div>
          </div>

          <div className="worklog-stat-card">
            <div className="stat-card-top">
              <span className="stat-category-tag tag-sky">
                AVAILABLE TASKS
              </span>
              <span className="stat-trend-badge trend-sky">{tasks.length} Ready</span>
            </div>
            <div className="stat-main">
              <div className="stat-value">{tasks.length}</div>
              <h4 className="stat-label">Selectable Tasks</h4>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill bar-sky" style={{ width: `${Math.min((tasks.length / 15) * 100, 100) || 5}%` }}></div>
            </div>
          </div>

          <div className="worklog-stat-card">
            <div className="stat-card-top">
              <span className="stat-category-tag tag-deep">
                RESOLUTION STATUS
              </span>
              <span className="stat-trend-badge trend-deep">Tracking</span>
            </div>
            <div className="stat-main">
              <div className="stat-value">{blockers.length === 0 ? '100%' : 'Active'}</div>
              <h4 className="stat-label">Project Health</h4>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar-fill bar-deep" style={{ width: blockers.length === 0 ? '100%' : '50%' }}></div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading blockers data...</div>
        ) : blockers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '20px', border: '1px border-dashed rgba(17, 177, 198, 0.3)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#11b1c6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>[ HEALTHY STATUS ]</div>
            <h3 style={{ color: '#0c5965', margin: '0 0 6px 0' }}>No Active Blockers</h3>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>Great job! All team tasks are currently progressing without blockages.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {blockers.map(b => (
              <div 
                key={b.id} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.85)', 
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px', 
                  border: '1px solid rgba(17, 177, 198, 0.25)', 
                  padding: '20px',
                  boxShadow: '0 8px 24px rgba(17, 177, 198, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ 
                      background: b.status === 'ACTIVE' ? 'rgba(17, 177, 198, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
                      color: b.status === 'ACTIVE' ? '#0c5965' : '#10b981', 
                      padding: '4px 12px', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      letterSpacing: '0.5px' 
                    }}>
                      {b.status || 'ACTIVE'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {b.createdAt ? b.createdAt.substring(0,10) : ''}
                    </span>
                  </div>

                  <h4 style={{ color: '#0c5965', margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 600 }}>
                    {b.task?.taskName || `Task #${b.taskId}`}
                  </h4>

                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} color="#11b1c6" />
                    Reported by: <strong style={{ color: '#334155' }}>{b.reportedBy?.name || 'User'}</strong>
                  </p>

                  <div style={{ background: 'rgba(17, 177, 198, 0.06)', padding: '12px', borderRadius: '12px', marginBottom: '16px', borderLeft: '3px solid #11b1c6' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0c5965', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Reason for Blockage:
                    </span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.4 }}>
                      {b.reason}
                    </p>
                  </div>

                  {b.expectedResolutionDate && (
                    <p style={{ fontSize: '0.85rem', color: '#0c5965', margin: '0 0 16px 0' }}>
                      <strong>Est. Resolution:</strong> {b.expectedResolutionDate}
                    </p>
                  )}
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}>
                  <button 
                    className="btn-pill" 
                    style={{ 
                      width: '100%', 
                      margin: 0, 
                      padding: '10px 18px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px' 
                    }}
                    onClick={() => setConfirmResolveBlocker(b)}
                  >
                    <CheckCircle2 size={16} /> Mark Blocker Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal for Resolving Blocker */}
      {confirmResolveBlocker && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '32px 24px' }}>
            <div className="modal-bg-glass"></div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(17, 177, 198, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={28} color="#11b1c6" />
              </div>
            </div>
            <h3 style={{ color: '#0c5965', margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 600 }}>Resolve Blocker?</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to mark this blocker as resolved? The task status will be updated to <strong>In Progress</strong>.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-secondary-pill" onClick={() => setConfirmResolveBlocker(null)}>
                Cancel
              </button>
              <button className="btn-pill" style={{ marginTop: 0 }} onClick={executeResolveBlocker}>
                Yes, Resolve
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={taskRef}>
                  <label>Select Task *</label>
                  <div 
                    className="form-control" 
                    onClick={() => setIsTaskOpen(!isTaskOpen)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ color: formData.taskId ? '#0c5965' : '#89c4d1' }}>
                      {formData.taskId 
                        ? (tasks.find(t => t.id.toString() === formData.taskId.toString())
                            ? `${tasks.find(t => t.id.toString() === formData.taskId.toString()).taskName} (${tasks.find(t => t.id.toString() === formData.taskId.toString()).project?.projectName || 'No Project'})`
                            : 'Choose blocked task...')
                        : 'Choose blocked task...'}
                    </span>
                    <ChevronDown size={18} color="#11b1c6" style={{ transform: isTaskOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </div>
                  {isTaskOpen && (
                    <div className="custom-select-options" style={{ position: 'absolute', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)', border: '1px solid rgba(17, 177, 198, 0.25)', borderRadius: '14px', boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)', zIndex: 1000, maxHeight: '160px', overflowY: 'auto', marginTop: '4px', padding: '4px 0' }}>
                      {tasks.length === 0 ? (
                        <div style={{ padding: '8px 14px', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>No active tasks available</div>
                      ) : (
                        tasks.map(t => (
                          <div
                            key={t.id}
                            className="custom-select-option"
                            onClick={() => { setFormData(prev => ({ ...prev, taskId: t.id.toString() })); setIsTaskOpen(false); }}
                            style={{ padding: '8px 14px', cursor: 'pointer', color: formData.taskId.toString() === t.id.toString() ? '#11b1c6' : '#0c5965', fontWeight: formData.taskId.toString() === t.id.toString() ? '600' : '500', backgroundColor: formData.taskId.toString() === t.id.toString() ? 'rgba(17, 177, 198, 0.08)' : 'transparent', fontSize: '0.9rem' }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(17, 177, 198, 0.08)'; e.target.style.color = '#11b1c6'; }}
                            onMouseLeave={(e) => { if (formData.taskId.toString() !== t.id.toString()) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#0c5965'; } }}
                          >
                            {t.taskName} ({t.project?.projectName || 'No Project'})
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Expected Resolution Date</label>
                  <input
                    type="date"
                    name="expectedResolutionDate"
                    className="form-control"
                    value={formData.expectedResolutionDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason for Blocker *</label>
                <textarea
                  name="reason"
                  className="form-control"
                  rows="2"
                  placeholder="e.g. Waiting for API key approval or database connection issue"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  style={{ resize: 'vertical', borderRadius: '20px' }}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
