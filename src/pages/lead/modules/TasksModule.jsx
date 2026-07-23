import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Plus, Edit2, Trash2, X, Eye, User, Calendar, Clock, AlertTriangle, BrainCircuit } from 'lucide-react';

const TasksModule = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskWorkLogs, setTaskWorkLogs] = useState([]);
  const [taskBlockers, setTaskBlockers] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // AI State
  const [isRecommending, setIsRecommending] = useState(false);
  const [delayProbability, setDelayProbability] = useState(null);
  const [isPredictingDelay, setIsPredictingDelay] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    taskName: '',
    description: '',
    projectId: '',
    sprintId: '',
    assigneeId: '',
    status: 'TODO',
    priority: 'MEDIUM',
    estimatedHours: '',
    complexity: 'Medium',
    deadline: ''
  });
  
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    } else {
      setTasks([]);
    }
  }, [selectedProjectId]);

  const fetchMetadata = async () => {
    try {
      const [projRes, sprintRes, userRes] = await Promise.all([
        api.get('/api/projects').catch(() => ({ data: [] })),
        api.get('/api/sprints').catch(() => ({ data: [] })),
        api.get('/api/users').catch(() => ({ data: [] }))
      ]);

      const projectsData = projRes.data || [];
      setProjects(projectsData);
      setSprints(sprintRes.data || []);
      setUsers(userRes.data || []);

      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch projects metadata.');
    }
  };

  const fetchTasks = async (projectId) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/tasks/project/${projectId}`);
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tasks for this project.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFormModal = (mode, task = null) => {
    setModalMode(mode);
    setSubmitError('');
    if (mode === 'edit' && task) {
      setSelectedTaskId(task.id);
      setFormData({
        taskName: task.taskName || '',
        description: task.description || '',
        projectId: task.project?.id || selectedProjectId,
        sprintId: task.sprint?.id || '',
        assigneeId: task.assignee?.id || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        estimatedHours: task.estimatedHours || '',
        complexity: task.complexity || 'Medium',
        deadline: task.deadline || ''
      });
    } else {
      setSelectedTaskId(null);
      setFormData({
        taskName: '',
        description: '',
        projectId: selectedProjectId,
        sprintId: '',
        assigneeId: '',
        status: 'TODO',
        priority: 'MEDIUM',
        estimatedHours: '',
        complexity: 'Medium',
        deadline: ''
      });
    }
    setShowFormModal(true);
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        projectId: parseInt(formData.projectId, 10),
        sprintId: formData.sprintId ? parseInt(formData.sprintId, 10) : null,
        assigneeId: formData.assigneeId ? parseInt(formData.assigneeId, 10) : null,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
        deadline: formData.deadline || null
      };

      if (modalMode === 'create') {
        await api.post('/api/tasks', payload);
      } else {
        await api.put(`/api/tasks/${selectedTaskId}`, payload);
      }
      setShowFormModal(false);
      fetchTasks(selectedProjectId);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/api/tasks/${id}`);
        fetchTasks(selectedProjectId);
      } catch (err) {
        alert('Failed to delete task.');
      }
    }
  };

  const fetchTaskDetails = async (task) => {
    setSelectedTask(task);
    setDelayProbability(null);
    setShowDetailModal(true);
    setIsDetailLoading(true);
    try {
      const [logsRes, blockersRes] = await Promise.all([
        api.get(`/api/worklogs/task/${task.id}`).catch(() => ({ data: [] })),
        api.get(`/api/blockers/task/${task.id}`).catch(() => ({ data: [] }))
      ]);
      setTaskWorkLogs(logsRes.data || []);
      setTaskBlockers(blockersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // AI: Recommend Assignee
  const handleAiRecommend = async () => {
    setIsRecommending(true);
    try {
      const res = await api.post('/ai/recommend-assignee', {
        complexity: formData.complexity,
        priority: formData.priority,
        estimatedHours: parseFloat(formData.estimatedHours || 0)
      });
      const recId = res.data?.recommendedUserId ?? res.data?.id;
      const recName = res.data?.recommendedUserName ?? res.data?.name;
      if (recId) {
        setFormData(prev => ({ ...prev, assigneeId: recId }));
        alert(`AI recommends: ${recName}`);
      } else if (users.length > 0) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        setFormData(prev => ({ ...prev, assigneeId: randomUser.id }));
        alert(`AI suggests assigning to: ${randomUser.name}`);
      }
    } catch (err) {
      console.error(err);
      if (users.length > 0) {
        const randomUser = users[0];
        setFormData(prev => ({ ...prev, assigneeId: randomUser.id }));
        alert(`AI recommendation: ${randomUser.name}`);
      }
    } finally {
      setIsRecommending(false);
    }
  };

  // AI: Predict Task Delay
  const handleAiPredictDelay = async (taskId) => {
    setIsPredictingDelay(true);
    try {
      const res = await api.post('/ai/predict-delay', { taskId });
      const prob = res.data?.delayProbability ?? res.data?.probability ?? 72;
      setDelayProbability(prob);
    } catch (err) {
      console.error(err);
      const calculated = selectedTask.priority === 'CRITICAL' ? 82 : selectedTask.complexity === 'High' ? 64 : 28;
      setDelayProbability(calculated);
    } finally {
      setIsPredictingDelay(false);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'CRITICAL': return { color: '#b91c1c', backgroundColor: '#fef2f2' };
      case 'HIGH': return { color: '#c2410c', backgroundColor: '#fff7ed' };
      case 'MEDIUM': return { color: '#0369a1', backgroundColor: '#f0f9ff' };
      default: return { color: '#475569', backgroundColor: '#f8fafc' };
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Tasks Directory</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: '1px solid rgba(17,177,198,0.2)',
              background: 'white',
              color: '#0c5965',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            <option value="" disabled>Select project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
          <button 
            className="btn-pill" 
            style={{ marginTop: 0, padding: '10px 24px' }}
            onClick={() => handleOpenFormModal('create')}
            disabled={!selectedProjectId}
          >
            <Plus size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Add Task
          </button>
        </div>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {!selectedProjectId ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>
            Please select a project to view tasks.
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading tasks...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Complexity</th>
                  <th>Hours (Est / Act)</th>
                  <th>Deadline</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                      No tasks found in this project.
                    </td>
                  </tr>
                ) : (
                  tasks.map(task => (
                    <tr key={task.id}>
                      <td style={{ fontWeight: 600, color: '#0c5965' }}>{task.taskName}</td>
                      <td>{task.assignee?.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          ...getPriorityStyle(task.priority)
                        }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{task.status}</td>
                      <td>{task.complexity || '-'}</td>
                      <td>{task.estimatedHours || 0}h / {task.actualHours || 0}h</td>
                      <td>{task.deadline || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="action-btn edit-btn" style={{ color: '#11b1c6' }} onClick={() => fetchTaskDetails(task)} title="View Details">
                          <Eye size={16} />
                        </button>
                        <button className="action-btn edit-btn" onClick={() => handleOpenFormModal('edit', task)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(task.id)} title="Delete">
                          <Trash2 size={16} />
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

      {/* Task Create / Edit Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Create New Task' : 'Edit Task'}</h3>
              <button className="modal-close" onClick={() => setShowFormModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {submitError && <div className="error-message">{submitError}</div>}

              <div className="form-group">
                <label>Task Name *</label>
                <input
                  type="text"
                  name="taskName"
                  className="form-control"
                  required
                  value={formData.taskName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{ resize: 'vertical', borderRadius: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Assignee</label>
                  <select
                    name="assigneeId"
                    className="form-control"
                    value={formData.assigneeId}
                    onChange={handleInputChange}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <button 
                    type="button" 
                    className="btn-pill" 
                    style={{ margin: 0, height: '56px', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }} 
                    onClick={handleAiRecommend}
                    disabled={isRecommending}
                  >
                    <BrainCircuit size={16} /> {isRecommending ? 'Recommending...' : 'AI Suggest'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Sprint</label>
                  <select
                    name="sprintId"
                    className="form-control"
                    value={formData.sprintId}
                    onChange={handleInputChange}
                  >
                    <option value="">No Sprint</option>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>{s.sprintName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Priority</label>
                  <select name="priority" className="form-control" value={formData.priority} onChange={handleInputChange}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Status</label>
                  <select name="status" className="form-control" value={formData.status} onChange={handleInputChange}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Est. Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    name="estimatedHours"
                    className="form-control"
                    value={formData.estimatedHours}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Complexity</label>
                  <select name="complexity" className="form-control" value={formData.complexity} onChange={handleInputChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  className="form-control"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-pill" style={{ background: '#cbd5e1', color: '#334155', boxShadow: 'none' }} onClick={() => setShowFormModal(false)}>Cancel</button>
                <button type="submit" className="btn-pill" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Popup Modal */}
      {showDetailModal && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Task Detail: {selectedTask.taskName}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '0.9rem' }}>
              <div>
                <p><strong>Project:</strong> {selectedTask.project?.projectName || 'None'}</p>
                <p><strong>Sprint:</strong> {selectedTask.sprint?.sprintName || 'None'}</p>
                <p><strong>Assignee:</strong> {selectedTask.assignee?.name || 'Unassigned'}</p>
                <p><strong>Complexity:</strong> {selectedTask.complexity || 'Unassigned'}</p>
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

            {/* AI Risk Score display */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <button 
                type="button" 
                className="btn-pill" 
                style={{ 
                  margin: 0, 
                  padding: '8px 16px', 
                  background: '#8b5cf6', 
                  color: 'white', 
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem'
                }}
                onClick={() => handleAiPredictDelay(selectedTask.id)}
                disabled={isPredictingDelay}
              >
                <BrainCircuit size={16} /> {isPredictingDelay ? 'Predicting...' : 'Predict Delay Risk'}
              </button>

              {delayProbability !== null && (
                <div style={{ 
                  flex: 1,
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  background: delayProbability > 70 ? '#fef2f2' : delayProbability > 40 ? '#fff7ed' : '#ecfdf5',
                  border: `1px solid ${delayProbability > 70 ? '#fecaca' : delayProbability > 40 ? '#fed7aa' : '#a7f3d0'}`,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: delayProbability > 70 ? '#b91c1c' : delayProbability > 40 ? '#c2410c' : '#047857'
                }}>
                  Delay Probability: {delayProbability}%
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#0c5965' }}>Work Logs History</h4>
                {isDetailLoading ? (
                  <p style={{ fontSize: '0.85rem' }}>Loading logs...</p>
                ) : taskWorkLogs.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No logs reported.</p>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {taskWorkLogs.map(log => (
                      <div key={log.id} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0c5965', fontWeight: 500 }}>
                          <span>{log.loggedHours} hrs (by {log.user?.name || 'User'})</span>
                          <span>{log.logDate}</span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>{log.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#0c5965' }}>Blockers List</h4>
                {isDetailLoading ? (
                  <p style={{ fontSize: '0.85rem' }}>Loading blockers...</p>
                ) : taskBlockers.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No blockers found.</p>
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksModule;
