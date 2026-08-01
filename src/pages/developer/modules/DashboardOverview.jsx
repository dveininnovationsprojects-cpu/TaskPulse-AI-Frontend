import React, { useState, useEffect } from 'react';
import api, { getCurrentUser, refreshCurrentUser } from '../../../services/api';
import { AlertCircle, CheckCircle2, Clock, ListTodo } from 'lucide-react';

const DashboardOverview = ({ isAnalystView = false }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    pendingTasks: 0,
    completedTasks: 0,
    hoursLogged: 0,
    activeBlockers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeUserAndFetchStats = async () => {
      setIsLoading(true);
      setError('');
      try {
        let user = getCurrentUser();
        if (!user || !user.id) {
          user = await refreshCurrentUser();
        }
        setCurrentUser(user);

        if (isAnalystView) {
          // Analyst View: Fetch aggregate metrics across all employees
          const [projectsRes, blockersRes, usersRes] = await Promise.all([
            api.get('/api/projects').catch(() => ({ data: [] })),
            api.get('/api/blockers/active').catch(() => ({ data: [] })),
            api.get('/api/users').catch(() => ({ data: [] }))
          ]);

          const projects = projectsRes.data || [];
          const usersList = usersRes.data || [];
          let allTasks = [];
          let totalHours = 0;

          if (projects.length > 0) {
            const tasksPromises = projects.map(p => 
              api.get(`/api/tasks/project/${p.id}`).catch(() => ({ data: [] }))
            );
            const tasksResponses = await Promise.all(tasksPromises);
            tasksResponses.forEach(res => {
              allTasks = [...allTasks, ...(res.data || [])];
            });
          }

          if (usersList.length > 0) {
            const logsPromises = usersList.map(u => 
              api.get(`/api/worklogs/user/${u.id}`).catch(() => ({ data: [] }))
            );
            const logsResponses = await Promise.all(logsPromises);
            logsResponses.forEach(res => {
              const userLogs = res.data || [];
              totalHours += userLogs.reduce((sum, log) => sum + (log.loggedHours || 0), 0);
            });
          }

          setStats({
            pendingTasks: allTasks.filter(t => t.status !== 'DONE').length,
            completedTasks: allTasks.filter(t => t.status === 'DONE').length,
            hoursLogged: totalHours,
            activeBlockers: (blockersRes.data || []).length
          });
        } else if (user && user.id) {
          // Developer View: Fetch developer specific metrics
          const [tasksRes, workLogsRes, blockersRes] = await Promise.all([
            api.get(`/api/tasks/assignee/${user.id}`).catch(() => ({ data: [] })),
            api.get(`/api/worklogs/user/${user.id}`).catch(() => ({ data: [] })),
            api.get('/api/blockers/active').catch(() => ({ data: [] }))
          ]);

          const myTasks = tasksRes.data || [];
          const pending = myTasks.filter(t => t.status !== 'DONE').length;
          const completed = myTasks.filter(t => t.status === 'DONE').length;
          
          const myLogs = workLogsRes.data || [];
          const totalHours = myLogs.reduce((sum, log) => sum + (log.loggedHours || 0), 0);
          
          const allActiveBlockers = blockersRes.data || [];
          const myBlockedTasksCount = myTasks.filter(t => t.status === 'BLOCKED').length;

          setStats({
            pendingTasks: pending,
            completedTasks: completed,
            hoursLogged: totalHours,
            activeBlockers: myBlockedTasksCount || allActiveBlockers.filter(b => b.task?.assignee?.id === user.id).length
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard overview data:', err);
        setError('Could not load some dashboard metrics.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUserAndFetchStats();
  }, [isAnalystView]);

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Developer Dashboard</h2>
        {currentUser && (
          <div className="user-welcome" style={{ color: '#0c5965', fontWeight: 500 }}>
            Welcome back, <span style={{ color: '#11b1c6', fontWeight: 600 }}>{currentUser.name}</span>
          </div>
        )}
      </div>
      
      <div className="module-content">
        {error && <div className="error-message" style={{ margin: '0 0 20px 0' }}>{error}</div>}
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading metrics...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '10px' }}>
            <div style={{ 
              padding: '24px', 
              background: 'rgba(255, 255, 255, 0.65)', 
              borderRadius: '20px', 
              border: '1px solid rgba(17, 177, 198, 0.15)',
              boxShadow: '0 8px 32px 0 rgba(17, 177, 198, 0.05)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '14px', color: '#0284c7' }}>
                <ListTodo size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#0c5965', fontWeight: 500 }}>Pending Tasks</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>{stats.pendingTasks}</p>
              </div>
            </div>

            <div style={{ 
              padding: '24px', 
              background: 'rgba(255, 255, 255, 0.65)', 
              borderRadius: '20px', 
              border: '1px solid rgba(17, 177, 198, 0.15)',
              boxShadow: '0 8px 32px 0 rgba(17, 177, 198, 0.05)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.15)', borderRadius: '14px', color: '#059669' }}>
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#0c5965', fontWeight: 500 }}>Tasks Completed</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>{stats.completedTasks}</p>
              </div>
            </div>

            <div style={{ 
              padding: '24px', 
              background: 'rgba(255, 255, 255, 0.65)', 
              borderRadius: '20px', 
              border: '1px solid rgba(17, 177, 198, 0.15)',
              boxShadow: '0 8px 32px 0 rgba(17, 177, 198, 0.05)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{ padding: '12px', background: 'rgba(52, 195, 211, 0.15)', borderRadius: '14px', color: '#11b1c6' }}>
                <Clock size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#0c5965', fontWeight: 500 }}>Hours Logged</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>{stats.hoursLogged.toFixed(1)}h</p>
              </div>
            </div>

            <div style={{ 
              padding: '24px', 
              background: 'rgba(255, 255, 255, 0.65)', 
              borderRadius: '20px', 
              border: '1px solid rgba(17, 177, 198, 0.15)',
              boxShadow: '0 8px 32px 0 rgba(17, 177, 198, 0.05)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{ 
                padding: '12px', 
                background: stats.activeBlockers > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(241, 245, 249, 1)', 
                borderRadius: '14px', 
                color: stats.activeBlockers > 0 ? '#ef4444' : '#64748b' 
              }}>
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#0c5965', fontWeight: 500 }}>My Blockers</h3>
                <p style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  margin: '5px 0 0 0', 
                  color: stats.activeBlockers > 0 ? '#ef4444' : '#0c5965' 
                }}>{stats.activeBlockers}</p>
              </div>
            </div>
          </div>
        )}

        <div style={{ 
          marginTop: '30px', 
          padding: '24px', 
          background: 'rgba(255, 255, 255, 0.5)', 
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.8)'
        }}>
          <h3 style={{ color: '#0c5965', margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 600 }}>Get Started</h3>
          <p style={{ color: '#0c5965', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
            Use the tabs above to manage your work:
          </p>
          <ul style={{ color: '#0c5965', fontSize: '0.95rem', paddingLeft: '20px', margin: '10px 0 0 0', lineHeight: 1.8 }}>
            <li><strong>My Tasks</strong>: View tasks, update statuses, log hours, or report blockers.</li>
            <li><strong>Work Logs</strong>: View your daily logging history.</li>
            <li><strong>Blockers</strong>: Check blockers you reported and resolve them when cleared.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
