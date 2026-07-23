import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Briefcase, ListTodo, AlertOctagon } from 'lucide-react';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    projectsCount: 0,
    tasksCount: 0,
    blockersCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClientOverview();
  }, []);

  const fetchClientOverview = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [projectsRes, blockersRes] = await Promise.all([
        api.get('/api/projects').catch(() => ({ data: [] })),
        api.get('/api/blockers/active').catch(() => ({ data: [] }))
      ]);

      const projects = projectsRes.data || [];
      const blockers = blockersRes.data || [];

      let totalTasks = 0;
      if (projects.length > 0) {
        const tasksPromises = projects.map(p => 
          api.get(`/api/tasks/project/${p.id}`).catch(() => ({ data: [] }))
        );
        const tasksResponses = await Promise.all(tasksPromises);
        tasksResponses.forEach(res => {
          totalTasks += (res.data || []).length;
        });
      }

      setStats({
        projectsCount: projects.length,
        tasksCount: totalTasks,
        blockersCount: blockers.length
      });
    } catch (err) {
      console.error(err);
      setError('Could not load client dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Client Dashboard</h2>
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading metrics...</div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ padding: '24px', background: 'white', borderRadius: '20px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '12px', color: '#0284c7' }}>
                  <Briefcase size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>My Subscribed Projects</span>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>{stats.projectsCount}</p>
                </div>
              </div>

              <div style={{ padding: '24px', background: 'white', borderRadius: '20px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '10px', background: 'rgba(52, 195, 211, 0.15)', borderRadius: '12px', color: '#11b1c6' }}>
                  <ListTodo size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Active Tasks</span>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>{stats.tasksCount}</p>
                </div>
              </div>

              <div style={{ padding: '24px', background: 'white', borderRadius: '20px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '12px', color: '#ef4444' }}>
                  <AlertOctagon size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Active Blockers</span>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#ef4444' }}>{stats.blockersCount}</p>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'rgba(255, 255, 255, 0.5)', 
              padding: '24px', 
              borderRadius: '20px', 
              border: '1px solid rgba(255, 255, 255, 0.8)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#0c5965', fontSize: '1.1rem', fontWeight: 600 }}>Welcome to Nexora TaskPulse AI</h3>
              <p style={{ color: '#0c5965', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
                As a client viewer, you have a read-only perspective on active project status. You can track sprint schedules, view tasks progress, review blocked items, and see live progress logs for the work we do on your projects.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
