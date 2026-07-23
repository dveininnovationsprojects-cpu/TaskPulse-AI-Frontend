import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Filter, Users, TrendingUp, AlertTriangle } from 'lucide-react';

const ReportsModule = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [userHours, setUserHours] = useState([]);
  const [blockers, setBlockers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'team', 'blockers'

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchReportData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchMetadata = async () => {
    try {
      const projRes = await api.get('/api/projects').catch(() => ({ data: [] }));
      const projectsData = projRes.data || [];
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch projects.');
    }
  };

  const fetchReportData = async (projectId) => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Fetch tasks for selected project
      const tasksRes = await api.get(`/api/tasks/project/${projectId}`);
      const projectTasks = tasksRes.data || [];
      setTasks(projectTasks);

      // 2. Fetch all active blockers
      const blockersRes = await api.get('/api/blockers/active').catch(() => ({ data: [] }));
      const activeBlockers = blockersRes.data || [];
      setBlockers(activeBlockers.filter(b => b.task?.project?.id === parseInt(projectId, 10)));

      // 3. Fetch users and calculate hours logged per user for this project's tasks
      const usersRes = await api.get('/api/users').catch(() => ({ data: [] }));
      const usersList = usersRes.data || [];

      // Fetch work logs for each user
      const logsPromises = usersList.map(u => 
        api.get(`/api/worklogs/user/${u.id}`).catch(() => ({ data: [] }))
      );
      const logsResponses = await Promise.all(logsPromises);
      
      const hoursMap = {};
      usersList.forEach((user, index) => {
        const userLogs = logsResponses[index].data || [];
        const projectLogs = userLogs.filter(log => log.task?.project?.id === parseInt(projectId, 10));
        const totalHours = projectLogs.reduce((sum, log) => sum + (log.loggedHours || 0), 0);
        
        if (totalHours > 0) {
          hoursMap[user.id] = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hours: totalHours
          };
        }
      });

      setUserHours(Object.values(hoursMap).sort((a, b) => b.hours - a.hours));
    } catch (err) {
      console.error(err);
      setError('Failed to load project report data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Analytics Reports</h2>
        
        {/* Project Filter */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Filter size={18} style={{ color: '#0c5965' }} />
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
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {/* Inner Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(17,177,198,0.1)', paddingBottom: '10px' }}>
          <button 
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'tasks' ? 'rgba(52, 195, 211, 0.15)' : 'none',
              border: 'none',
              borderRadius: '12px',
              color: '#0c5965',
              fontWeight: activeTab === 'tasks' ? '600' : '500',
              cursor: 'pointer'
            }}
          >
            Task Statistics
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'team' ? 'rgba(52, 195, 211, 0.15)' : 'none',
              border: 'none',
              borderRadius: '12px',
              color: '#0c5965',
              fontWeight: activeTab === 'team' ? '600' : '500',
              cursor: 'pointer'
            }}
          >
            Team Logging Efficiency
          </button>
          <button 
            onClick={() => setActiveTab('blockers')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'blockers' ? 'rgba(52, 195, 211, 0.15)' : 'none',
              border: 'none',
              borderRadius: '12px',
              color: '#0c5965',
              fontWeight: activeTab === 'blockers' ? '600' : '500',
              cursor: 'pointer'
            }}
          >
            Risk & Blocker Log
          </button>
        </div>

        {!selectedProjectId ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0c5965', fontStyle: 'italic' }}>
            Please select a project to load reports.
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Generating report data...</div>
        ) : (
          <>
            {activeTab === 'tasks' && (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Task Name</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Complexity</th>
                      <th>Est. Hours</th>
                      <th>Actual Hours</th>
                      <th>Variance</th>
                      <th>Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>No tasks found in project.</td>
                      </tr>
                    ) : (
                      tasks.map(task => {
                        const variance = (task.actualHours || 0) - (task.estimatedHours || 0);
                        const isOver = variance > 0;
                        return (
                          <tr key={task.id}>
                            <td style={{ fontWeight: 600, color: '#0c5965' }}>{task.taskName}</td>
                            <td>{task.priority}</td>
                            <td>{task.status}</td>
                            <td>{task.complexity || '-'}</td>
                            <td>{task.estimatedHours || 0}h</td>
                            <td>{task.actualHours || 0}h</td>
                            <td style={{ color: isOver ? '#ef4444' : '#059669', fontWeight: 500 }}>
                              {variance === 0 ? '0' : `${isOver ? '+' : ''}${variance.toFixed(1)}h`}
                            </td>
                            <td>{task.assignee?.name || 'Unassigned'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="table-responsive" style={{ maxWidth: '600px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Team Member</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'right' }}>Hours Logged (This Project)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userHours.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>No hours logged yet by the team.</td>
                      </tr>
                    ) : (
                      userHours.map(uh => (
                        <tr key={uh.id}>
                          <td style={{ fontWeight: 600, color: '#0c5965' }}>{uh.name}</td>
                          <td>{uh.role}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#11b1c6' }}>{uh.hours.toFixed(1)}h</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'blockers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {blockers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.3)', borderRadius: '16px', color: '#0c5965', fontStyle: 'italic' }}>
                    No active blockers on this project.
                  </div>
                ) : (
                  blockers.map(b => (
                    <div key={b.id} style={{ 
                      background: 'white', 
                      padding: '16px', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: '#ef4444' }}>{b.task?.taskName}</h4>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#334155' }}>
                          <strong>Reason:</strong> {b.reason}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Reported by: {b.reportedBy?.name || 'Developer'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                        <div>Created: {b.createdAt ? b.createdAt.substring(0, 10) : ''}</div>
                        {b.expectedResolutionDate && (
                          <div style={{ color: '#ef4444', fontWeight: 500, marginTop: '4px' }}>
                            Target: {b.expectedResolutionDate}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsModule;
