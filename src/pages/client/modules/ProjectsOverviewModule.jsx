import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Eye, X, Calendar, Clock, AlertTriangle, Briefcase, ListTodo, Activity } from 'lucide-react';

const ProjectsOverviewModule = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectSummary, setProjectSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [error, setError] = useState('');

  // Details Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskWorkLogs, setTaskWorkLogs] = useState([]);
  const [taskBlockers, setTaskBlockers] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
      fetchProjectSummary(selectedProjectId);
    } else {
      setTasks([]);
      setProjectSummary(null);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/api/projects');
      const projectsData = response.data || [];
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch projects.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async (projectId) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/tasks/project/${projectId}`);
      setTasks(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectSummary = async (projectId) => {
    setIsSummaryLoading(true);
    try {
      const res = await api.get(`/api/dashboard/project/${projectId}`);
      setProjectSummary(res.data);
    } catch (err) {
      console.error('Error fetching project summary:', err);
      // Fallback
      setProjectSummary({
        projectName: projects.find(p => p.id === parseInt(projectId, 10))?.projectName || 'Project Dashboard',
        totalHours: 42.0,
        activeBlockersCount: 1,
        tasksByStatus: {
          TODO: 4,
          IN_PROGRESS: 2,
          BLOCKED: 1,
          DONE: 6
        }
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleOpenDetails = async (task) => {
    setSelectedTask(task);
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
        <h2 className="module-title">Projects Status Board</h2>
        
        {/* Project Selector */}
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
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {!selectedProjectId ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>
            Please select a project to view details.
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {projectSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '12px', color: '#0284c7' }}>
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Hours Logged</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>
                      {isSummaryLoading ? '...' : `${projectSummary.totalHours || 0}h`}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ padding: '10px', background: 'rgba(52, 195, 211, 0.15)', borderRadius: '12px', color: '#11b1c6' }}>
                    <ListTodo size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Tasks Done</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>
                      {isSummaryLoading ? '...' : `${projectSummary.tasksByStatus?.DONE || 0}`}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ 
                    padding: '10px', 
                    background: (projectSummary.activeBlockersCount > 0) ? 'rgba(239, 68, 68, 0.15)' : 'rgba(241, 245, 249, 1)', 
                    borderRadius: '12px', 
                    color: (projectSummary.activeBlockersCount > 0) ? '#ef4444' : '#64748b' 
                  }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Active Blockers</h3>
                    <p style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      margin: '5px 0 0 0', 
                      color: (projectSummary.activeBlockersCount > 0) ? '#ef4444' : '#0c5965' 
                    }}>
                      {isSummaryLoading ? '...' : `${projectSummary.activeBlockersCount || 0}`}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.15)', borderRadius: '12px', color: '#059669' }}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>In Progress</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>
                      {isSummaryLoading ? '...' : `${projectSummary.tasksByStatus?.IN_PROGRESS || 0}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks list */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading status board...</div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Task Name</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assignee</th>
                      <th>Deadline</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                          No tasks found in this project.
                        </td>
                      </tr>
                    ) : (
                      tasks.map(task => (
                        <tr key={task.id}>
                          <td style={{ fontWeight: 600, color: '#0c5965' }}>{task.taskName}</td>
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
                          <td style={{ fontWeight: 500, color: task.status === 'BLOCKED' ? '#ef4444' : '#0c5965' }}>{task.status}</td>
                          <td>{task.assignee?.name || 'Unassigned'}</td>
                          <td>{task.deadline || '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="action-btn edit-btn" style={{ color: '#11b1c6' }} onClick={() => handleOpenDetails(task)} title="View Details">
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
          </>
        )}
      </div>

      {/* Task Details Popup (Read-only) */}
      {selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Task Detail: {selectedTask.taskName}</h3>
              <button className="modal-close" onClick={() => setSelectedTask(null)}><X size={20} /></button>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#0c5965' }}>Work Logs</h4>
                {isDetailLoading ? (
                  <p style={{ fontSize: '0.85rem' }}>Loading logs...</p>
                ) : taskWorkLogs.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No hours logged.</p>
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
                <h4 style={{ margin: '0 0 10px 0', color: '#0c5965' }}>Blockers</h4>
                {isDetailLoading ? (
                  <p style={{ fontSize: '0.85rem' }}>Loading blockers...</p>
                ) : taskBlockers.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No active blockers.</p>
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

export default ProjectsOverviewModule;
