import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Briefcase, ListTodo, AlertOctagon, Activity, Layers, CheckCircle2 } from 'lucide-react';

const DashboardOverview = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectSummary, setProjectSummary] = useState(null);
  const [systemOverview, setSystemOverview] = useState({
    totalProjects: 0,
    totalTasks: 0,
    totalDone: 0,
    totalInProgress: 0,
    totalBlockers: 0,
    totalHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectSummary(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [projectsRes, blockersRes, dashboardRes, statusRes, trendRes] = await Promise.all([
        api.get('/api/projects').catch(() => ({ data: [] })),
        api.get('/api/blockers/active').catch(() => ({ data: [] })),
        api.get('/api/dashboard').catch(() => ({ data: null })),
        api.get('/api/analytics/project-status').catch(() => ({ data: null })),
        api.get('/api/analytics/task-completion-trend?startDate=2020-01-01&endDate=2030-01-01').catch(() => ({ data: null }))
      ]);

      let projs = projectsRes.data || [];
      const activeBlockers = blockersRes.data || [];
      setProjects(projs);

      let allTasks = [];
      let totalLoggedHours = 0;

      if (projs.length > 0) {
        const tasksPromises = projs.map(p => 
          api.get(`/api/tasks/project/${p.id}`).catch(() => ({ data: [] }))
        );
        const tasksResponses = await Promise.all(tasksPromises);
        tasksResponses.forEach(res => {
          const projectTasks = res.data || [];
          allTasks = [...allTasks, ...projectTasks];
          totalLoggedHours += projectTasks.reduce((sum, t) => sum + (t.actualHours || t.estimatedHours || 0), 0);
        });
      }

      let totalProjCount = projs.length;
      let totalDoneCount = allTasks.filter(t => t.status === 'DONE').length;
      let totalInProgressCount = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
      let totalTaskCount = allTasks.length;

      // Fallback if GET /api/projects returned 403 or empty for Data Analyst
      if (totalProjCount === 0 && dashboardRes && dashboardRes.data && Array.isArray(dashboardRes.data.kpiCards)) {
        const projCard = dashboardRes.data.kpiCards.find(c => c.title && c.title.toLowerCase().includes('project'));
        if (projCard && !isNaN(parseInt(projCard.value, 10))) {
          totalProjCount = parseInt(projCard.value, 10);
        }
      }

      if (totalTaskCount === 0 && statusRes && statusRes.data && Array.isArray(statusRes.data.results)) {
        const results = statusRes.data.results;
        results.forEach(item => {
          const count = item.count || 0;
          totalTaskCount += count;
          const statusStr = (item.status || '').toLowerCase();
          if (statusStr.includes('complete') || statusStr.includes('done')) {
            totalDoneCount += count;
          } else if (statusStr.includes('progress')) {
            totalInProgressCount += count;
          }
        });
      }

      if (totalTaskCount === 0 && trendRes && trendRes.data && Array.isArray(trendRes.data.results)) {
        const results = trendRes.data.results;
        if (results.length > 0) {
          const lastPoint = results[results.length - 1];
          totalDoneCount = lastPoint.completed || totalDoneCount;
          totalTaskCount = lastPoint.total || totalTaskCount;
        }
      }

      setSystemOverview({
        totalProjects: totalProjCount,
        totalTasks: totalTaskCount,
        totalDone: totalDoneCount,
        totalInProgress: totalInProgressCount,
        totalBlockers: activeBlockers.length || allTasks.filter(t => t.status === 'BLOCKED').length,
        totalHours: totalLoggedHours
      });

      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching admin initial data:', err);
      setError('Could not load admin statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectSummary = async (projectId) => {
    setIsSummaryLoading(true);
    try {
      const pid = parseInt(projectId, 10);
      const foundProject = projects.find(p => p.id === pid);

      const [tasksRes, blockersRes] = await Promise.all([
        api.get(`/api/tasks/project/${pid}`).catch(() => ({ data: [] })),
        api.get('/api/blockers/active').catch(() => ({ data: [] }))
      ]);

      const projectTasks = tasksRes.data || [];
      const activeBlockers = (blockersRes.data || []).filter(b => b.task?.project?.id === pid);

      const totalHours = projectTasks.reduce((sum, t) => sum + (t.actualHours || t.estimatedHours || 0), 0);
      const doneCount = projectTasks.filter(t => t.status === 'DONE').length;
      const inProgressCount = projectTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const blockedCount = projectTasks.filter(t => t.status === 'BLOCKED').length;

      setProjectSummary({
        projectName: foundProject?.projectName || 'Project Summary',
        totalHours,
        activeBlockersCount: activeBlockers.length || blockedCount,
        tasksByStatus: {
          TODO: projectTasks.filter(t => t.status === 'TODO').length,
          IN_PROGRESS: inProgressCount,
          BLOCKED: blockedCount,
          DONE: doneCount
        }
      });
    } catch (err) {
      console.error('Error fetching project summary:', err);
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
            {/* Selected Project Summary Cards */}
            {projectSummary ? (
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
            ) : (
              /* System Total Summary Cards if no project selected */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '12px', color: '#0284c7' }}>
                    <Layers size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Total Projects</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>{systemOverview.totalProjects}</p>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.15)', borderRadius: '12px', color: '#059669' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Total Completed Tasks</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#059669' }}>{systemOverview.totalDone}</p>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '12px', color: '#ef4444' }}>
                    <AlertOctagon size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>System Active Blockers</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#ef4444' }}>{systemOverview.totalBlockers}</p>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid rgba(17,177,198,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ padding: '10px', background: 'rgba(52, 195, 211, 0.15)', borderRadius: '12px', color: '#11b1c6' }}>
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>System Logged Hours</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#0c5965' }}>{systemOverview.totalHours.toFixed(1)}h</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;

