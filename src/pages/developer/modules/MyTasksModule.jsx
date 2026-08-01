import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api, { getCurrentUser, refreshCurrentUser } from '../../../services/api';
import { Eye, Clock, AlertTriangle, Check, Plus, X } from 'lucide-react';

const MyTasksModule = () => {
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected task detail modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskBlockers, setTaskBlockers] = useState([]);
  const [taskWorkLogs, setTaskWorkLogs] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Forms
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [workLogForm, setWorkLogForm] = useState({
    loggedHours: '',
    logDate: new Date().toISOString().split('T')[0],
    notes: '',
    progressPercent: ''
  });

  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [blockerForm, setBlockerForm] = useState({
    reason: '',
    expectedResolutionDate: ''
  });

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError('');
    try {
      let user = getCurrentUser();
      if (!user || !user.id) {
        user = await refreshCurrentUser();
      }
      setCurrentUser(user);

      if (user && user.id) {
        const response = await api.get(`/api/tasks/assignee/${user.id}`);
        setTasks(response.data || []);
      } else {
        setError('No logged-in user details found.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTaskDetails = async (task) => {
    setSelectedTask(task);
    setIsDetailLoading(true);
    try {
      const [blockersRes, logsRes] = await Promise.all([
        api.get(`/api/blockers/task/${task.id}`).catch(() => ({ data: [] })),
        api.get(`/api/worklogs/task/${task.id}`).catch(() => ({ data: [] }))
      ]);
      setTaskBlockers(blockersRes.data || []);
      setTaskWorkLogs(logsRes.data || []);
    } catch (err) {
      console.error('Error fetching task details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/api/tasks/${taskId}/status?status=${newStatus}`);
      await fetchTasks();
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status. Make sure you are authorized.');
    }
  };

  const handleLogWorkSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const payload = {
        taskId: selectedTask.id,
        userId: currentUser.id,
        loggedHours: parseFloat(workLogForm.loggedHours),
        logDate: workLogForm.logDate,
        notes: workLogForm.notes,
        description: workLogForm.notes,
        progressPercent: workLogForm.progressPercent ? parseFloat(workLogForm.progressPercent) : 0
      };
      
      await api.post('/api/worklogs', payload);
      setShowWorkLogModal(false);
      setWorkLogForm({
        loggedHours: '',
        logDate: new Date().toISOString().split('T')[0],
        notes: '',
        progressPercent: ''
      });
      // Refresh
      await fetchTasks();
      if (selectedTask) {
        const updatedTask = await api.get(`/api/tasks/${selectedTask.id}`);
        fetchTaskDetails(updatedTask.data);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit work log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockerSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const payload = {
        taskId: selectedTask.id,
        reportedById: currentUser.id,
        reason: blockerForm.reason,
        expectedResolutionDate: blockerForm.expectedResolutionDate || null
      };

      await api.post('/api/blockers', payload);
      await api.patch(`/api/tasks/${selectedTask.id}/status?status=BLOCKED`).catch(() => {});
      setShowBlockerModal(false);
      setBlockerForm({ reason: '', expectedResolutionDate: '' });
      // Refresh
      await fetchTasks();
      if (selectedTask) {
        const updatedTask = await api.get(`/api/tasks/${selectedTask.id}`);
        fetchTaskDetails(updatedTask.data);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to report blocker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'CRITICAL': return { color: '#b91c1c', backgroundColor: '#fef2f2', fontWeight: 'bold' };
      case 'HIGH': return { color: '#c2410c', backgroundColor: '#fff7ed', fontWeight: 600 };
      case 'MEDIUM': return { color: '#0369a1', backgroundColor: '#f0f9ff', fontWeight: 500 };
      default: return { color: '#475569', backgroundColor: '#f8fafc' };
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">My Tasks</h2>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading your tasks...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Complexity</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                      No tasks assigned to you.
                    </td>
                  </tr>
                ) : (
                  tasks.map(task => (
                    <tr key={task.id}>
                      <td style={{ fontWeight: 600, color: '#0c5965' }}>{task.taskName}</td>
                      <td>{task.project?.projectName || 'No Project'}</td>
                      <td>
                        <span className={`priority-badge priority-${task.priority}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>{task.complexity || '-'}</td>
                      <td>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: '1px solid rgba(17, 177, 198, 0.3)',
                            background: 'white',
                            color: '#0c5965',
                            fontWeight: '600',
                            fontSize: '0.85rem'
                          }}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="BLOCKED">Blocked</option>
                          <option value="DONE">Done</option>
                        </select>
                      </td>
                      <td>{task.deadline || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="action-btn edit-btn" 
                          style={{ color: '#11b1c6' }}
                          title="View Details"
                          onClick={() => fetchTaskDetails(task)}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Task Details Popup Modal */}
      {selectedTask && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-bg-glass"></div>
            <div className="modal-header">
              <h3>Task Detail: {selectedTask.taskName}</h3>
              <button className="modal-close" onClick={() => setSelectedTask(null)}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <p><strong>Project:</strong> {selectedTask.project?.projectName || 'N/A'}</p>
                <p><strong>Sprint:</strong> {selectedTask.sprint?.sprintName || 'N/A'}</p>
                <p><strong>Complexity:</strong> {selectedTask.complexity || 'Unassigned'}</p>
                <p><strong>Deadline:</strong> {selectedTask.deadline || 'No Deadline'}</p>
              </div>
              <div>
                <p><strong>Priority:</strong> {selectedTask.priority}</p>
                <p><strong>Status:</strong> {selectedTask.status}</p>
                <p><strong>Est. Hours:</strong> {selectedTask.estimatedHours || 0} hrs</p>
                <p><strong>Actual Hours:</strong> {selectedTask.actualHours || 0} hrs</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong>Description:</strong>
              <p style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', color: '#334155', fontSize: '0.9rem', marginTop: '6px' }}>
                {selectedTask.description || 'No description provided.'}
              </p>
            </div>

            {/* Quick Actions Row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button className="btn-pill" style={{ margin: 0, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowWorkLogModal(true)}>
                <Clock size={16} /> Log Work
              </button>
              {selectedTask.status !== 'BLOCKED' && (
                <button className="btn-pill" style={{ margin: 0, padding: '8px 18px', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: 'none' }} onClick={() => setShowBlockerModal(true)}>
                  <AlertTriangle size={16} /> Report Blocker
                </button>
              )}
            </div>

            {/* History Tabs / Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#0c5965' }}>Recent Work Logs</h4>
                {isDetailLoading ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading logs...</p>
                ) : taskWorkLogs.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No hours logged yet.</p>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {taskWorkLogs.map(log => (
                      <div key={log.id} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0c5965', fontWeight: 500 }}>
                          <span>{log.loggedHours} hrs</span>
                          <span>{log.logDate}</span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>{log.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#0c5965' }}>Blockers</h4>
                {isDetailLoading ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading blockers...</p>
                ) : taskBlockers.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No blockers reported.</p>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {taskBlockers.map(blocker => (
                      <div key={blocker.id} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                          <span style={{ color: blocker.status === 'ACTIVE' ? '#ef4444' : '#059669' }}>
                            {blocker.status}
                          </span>
                          <span style={{ color: '#64748b' }}>{blocker.createdAt ? blocker.createdAt.substring(0,10) : ''}</span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', color: '#475569' }}><strong>Reason:</strong> {blocker.reason}</p>
                        {blocker.status === 'ACTIVE' && (
                          <button 
                            className="btn-pill" 
                            style={{ margin: '6px 0 0 0', padding: '4px 10px', fontSize: '0.75rem', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', gap: '3px', boxShadow: 'none' }}
                            onClick={async () => {
                              try {
                                await api.put(`/api/blockers/${blocker.id}/resolve`);
                                await fetchTasks();
                                const updatedTask = await api.get(`/api/tasks/${selectedTask.id}`);
                                fetchTaskDetails(updatedTask.data);
                              } catch (err) {
                                alert('Failed to resolve blocker.');
                              }
                            }}
                          >
                            <Check size={12} /> Resolve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Log Work Modal Overlay */}
      {showWorkLogModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-bg-glass"></div>
            <div className="modal-header">
              <h3>Log Work</h3>
              <button className="modal-close" onClick={() => setShowWorkLogModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleLogWorkSubmit}>
              {submitError && <div className="error-message">{submitError}</div>}
              
              <div className="form-group">
                <label>Logged Hours *</label>
                <input
                  type="number"
                  step="0.25"
                  className="form-control"
                  required
                  value={workLogForm.loggedHours}
                  onChange={(e) => setWorkLogForm(prev => ({ ...prev, loggedHours: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Log Date *</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={workLogForm.logDate}
                  onChange={(e) => setWorkLogForm(prev => ({ ...prev, logDate: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Task Progress %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 50"
                  className="form-control"
                  value={workLogForm.progressPercent}
                  onChange={(e) => setWorkLogForm(prev => ({ ...prev, progressPercent: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Notes / Work Completed *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  required
                  placeholder="Describe your progress..."
                  value={workLogForm.notes}
                  onChange={(e) => setWorkLogForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ borderRadius: '20px', resize: 'vertical' }}
                />
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary-pill" onClick={() => setShowWorkLogModal(false)}>Cancel</button>
                <button type="submit" className="btn-pill" disabled={isSubmitting}>
                  {isSubmitting ? 'Logging...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Blocker Report Modal Overlay */}
      {showBlockerModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-bg-glass"></div>
            <div className="modal-header">
              <h3>Report Blocker</h3>
              <button className="modal-close" onClick={() => setShowBlockerModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleBlockerSubmit}>
              {submitError && <div className="error-message">{submitError}</div>}
              
              <div className="form-group">
                <label>Reason for Blockage *</label>
                <textarea
                  className="form-control"
                  rows="4"
                  required
                  placeholder="Detail the blocker (e.g. pending DB schema changes, API integration blocked, design review pending)..."
                  value={blockerForm.reason}
                  onChange={(e) => setBlockerForm(prev => ({ ...prev, reason: e.target.value }))}
                  style={{ borderRadius: '20px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label>Expected Resolution Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={blockerForm.expectedResolutionDate}
                  onChange={(e) => setBlockerForm(prev => ({ ...prev, expectedResolutionDate: e.target.value }))}
                />
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary-pill" onClick={() => setShowBlockerModal(false)}>Cancel</button>
                <button type="submit" className="btn-pill" style={{ background: '#ef4444', color: 'white', boxShadow: 'none' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Reporting...' : 'Report Blocker'}
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

export default MyTasksModule;
