import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Briefcase, ListTodo, AlertOctagon, UserCheck, Calendar, Activity } from 'lucide-react';

const DashboardOverview = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectSummary, setProjectSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectSummary(selectedProjectId);
    } else {
      setProjectSummary(null);
    }
  }, [selectedProjectId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [projectsRes, activitiesRes] = await Promise.all([
        api.get('/api/projects').catch(() => ({ data: [] })),
        api.get('/api/activities').catch(() => ({ data: [] }))
      ]);

      const projs = projectsRes.data || [];
      setProjects(projs);
      setActivities((activitiesRes.data || []).slice(0, 10));

      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load admin statistics.');
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
      const foundProject = projects.find(p => p.id === parseInt(projectId, 10));
      setProjectSummary({
        projectName: foundProject?.projectName || 'Project Dashboard',
        totalHours: 0,
        activeBlockersCount: 0,
        tasksByStatus: {
          TODO: 0,
          IN_PROGRESS: 0,
          BLOCKED: 0,
          DONE: 0
        }
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Admin Dashboard Overview</h2>
        
        {/* Project Selector for Summary */}
        {projects.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#0c5965', fontWeight: 500 }}>Select Project Summary:</span>
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(17,177,198,0.2)',
                background: 'white',
                color: '#0c5965',
                fontWeight: 500,
                fontSize: '0.85rem'
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading overview data...</div>
        ) : (
          <>
            {/* Project Summary Cards */}
            {selectedProjectId && projectSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '12px', color: '#0284c7' }}>
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Project Hours</h3>
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
                    <AlertOctagon size={24} />
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
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>In Progress Tasks</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>
                      {isSummaryLoading ? '...' : `${projectSummary.tasksByStatus?.IN_PROGRESS || 0}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Activities Log */}
            <div style={{ background: 'rgba(255, 255, 255, 0.5)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.8)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#0c5965', fontSize: '1.1rem', fontWeight: 600 }}>Recent Activities Log</h3>
              
              {activities.length === 0 ? (
                <p style={{ color: '#0c5965', fontStyle: 'italic', fontSize: '0.95rem' }}>No recent activities found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {activities.map(act => (
                    <div key={act.id} style={{ 
                      background: 'white', 
                      padding: '12px 16px', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(17,177,198,0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#0c5965' }}>{act.performedBy}</span>
                        <span style={{ color: '#64748b' }}> performed </span>
                        <span style={{ fontWeight: 600, color: '#11b1c6' }}>{act.action}</span>
                        <span style={{ color: '#64748b' }}> on {act.entityType} #{act.entityId}</span>
                        {act.newValue && (
                          <div style={{ color: '#059669', marginTop: '4px', fontSize: '0.8rem' }}>
                            <strong>New Value:</strong> {act.newValue}
                          </div>
                        )}
                      </div>
                      <div style={{ color: '#89c4d1', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                        <Calendar size={12} /> {act.timestamp ? act.timestamp.replace('T', ' ').substring(0, 16) : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
