import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Calendar, CheckCircle2, ListTodo, AlertOctagon, TrendingUp } from 'lucide-react';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    activeSprints: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    blockedTasks: 0,
    doneTasks: 0,
    blockers: 0
  });
  const [activeSprintName, setActiveSprintName] = useState('No Active Sprint');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeadStats();
  }, []);

  const fetchLeadStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [sprintsRes, blockersRes] = await Promise.all([
        api.get('/api/sprints').catch(() => ({ data: [] })),
        api.get('/api/blockers/active').catch(() => ({ data: [] }))
      ]);

      const sprints = sprintsRes.data || [];
      const activeSprints = sprints.filter(s => s.status === 'ACTIVE' || s.status === 'CURRENT' || !s.completed);
      
      let tasksList = [];
      if (activeSprints.length > 0) {
        setActiveSprintName(activeSprints[0].sprintName);
        try {
          const tasksRes = await api.get(`/api/tasks/sprint/${activeSprints[0].id}`);
          tasksList = tasksRes.data || [];
        } catch (e) {
          console.error(e);
        }
      }

      setStats({
        activeSprints: activeSprints.length,
        todoTasks: tasksList.filter(t => t.status === 'TODO').length,
        inProgressTasks: tasksList.filter(t => t.status === 'IN_PROGRESS').length,
        blockedTasks: tasksList.filter(t => t.status === 'BLOCKED').length,
        doneTasks: tasksList.filter(t => t.status === 'DONE').length,
        blockers: blockersRes.data?.length || 0
      });
    } catch (err) {
      console.error(err);
      setError('Could not load Team Lead dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalSprintTasks = stats.todoTasks + stats.inProgressTasks + stats.blockedTasks + stats.doneTasks;
  const progressPercent = totalSprintTasks > 0 ? Math.round((stats.doneTasks / totalSprintTasks) * 100) : 0;

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Team Lead Dashboard</h2>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading metrics...</div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#0c5965', fontWeight: 500 }}>Active Sprints</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>{stats.activeSprints}</p>
              </div>
              <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#0c5965', fontWeight: 500 }}>Current Sprint Progress</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#11b1c6' }}>{progressPercent}%</p>
              </div>
              <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#0c5965', fontWeight: 500 }}>Active Blockers</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: stats.blockers > 0 ? '#ef4444' : '#0c5965' }}>{stats.blockers}</p>
              </div>
            </div>

            {/* Sprint Health Board */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.5)', 
              padding: '24px', 
              borderRadius: '20px', 
              border: '1px solid rgba(255, 255, 255, 0.8)',
              marginBottom: '30px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#0c5965', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} /> Active Sprint: {activeSprintName}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>TO DO</span>
                  <p style={{ fontSize: '22px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#475569' }}>{stats.todoTasks}</p>
                </div>

                <div style={{ padding: '16px', background: '#e0f2fe', borderRadius: '12px', textAlign: 'center', border: '1px solid #bae6fd' }}>
                  <span style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 500 }}>IN PROGRESS</span>
                  <p style={{ fontSize: '22px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#0284c7' }}>{stats.inProgressTasks}</p>
                </div>

                <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '12px', textAlign: 'center', border: '1px solid #fecaca' }}>
                  <span style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 500 }}>BLOCKED</span>
                  <p style={{ fontSize: '22px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#ef4444' }}>{stats.blockedTasks}</p>
                </div>

                <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '12px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 500 }}>DONE</span>
                  <p style={{ fontSize: '22px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#059669' }}>{stats.doneTasks}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
