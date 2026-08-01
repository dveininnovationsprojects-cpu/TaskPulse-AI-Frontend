import React, { useState, useEffect } from 'react';
import api, { getCurrentUser, refreshCurrentUser } from '../../../services/api';
import { AlertCircle, CheckCircle2, Clock, ListTodo, Target, Calendar, TrendingUp, Award, ShieldCheck } from 'lucide-react';

// --- Employee Unique Productivity SVG Chart Components ---

// 1. Personal Effort Breakdown (Donut Chart)
const SVGEmployeeEffortDonut = () => {
  const data = [
    { label: 'Coding & Dev', value: 45, color: '#11b1c6' },
    { label: 'Code Reviews', value: 20, color: '#38bdf8' },
    { label: 'Testing & QA', value: 15, color: '#059669' },
    { label: 'Documentation', value: 10, color: '#f59e0b' },
    { label: 'Sync & Meetings', value: 10, color: '#8b5cf6' }
  ];

  const total = 100;
  const cx = 90;
  const cy = 90;
  const outerR = 75;
  const innerR = 48;
  let cumulativeAngle = 0;

  const slices = data.map(item => {
    const angle = (item.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1_out = cx + outerR * Math.cos(startRad);
    const y1_out = cy + outerR * Math.sin(startRad);
    const x2_out = cx + outerR * Math.cos(endRad);
    const y2_out = cy + outerR * Math.sin(endRad);

    const x1_in = cx + innerR * Math.cos(endRad);
    const y1_in = cy + innerR * Math.sin(endRad);
    const x2_in = cx + innerR * Math.cos(startRad);
    const y2_in = cy + innerR * Math.sin(startRad);

    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData = `M ${x1_out} ${y1_out} A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2_out} ${y2_out} L ${x1_in} ${y1_in} A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x2_in} ${y2_in} Z`;

    return { ...item, pathData };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '180px', height: '180px' }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          {slices.map((slice, i) => (
            <path key={i} d={slice.pathData} fill={slice.color} stroke="#ffffff" strokeWidth="2">
              <title>{`${slice.label}: ${slice.value}%`}</title>
            </path>
          ))}
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0c5965' }}>100%</div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Focus</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {slices.map((slice, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: slice.color }}></span>
              <span style={{ color: '#334155', fontWeight: 500 }}>{slice.label}</span>
            </div>
            <span style={{ fontWeight: 700, color: '#0c5965' }}>{slice.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. Daily Logged Work Hours vs Target (Weekly Bar Chart)
const SVGDailyWorklogBar = () => {
  const days = [
    { day: 'Mon', hours: 7.5 },
    { day: 'Tue', hours: 8.0 },
    { day: 'Wed', hours: 8.5 },
    { day: 'Thu', hours: 7.0 },
    { day: 'Fri', hours: 8.0 }
  ];

  const width = 450;
  const height = 180;
  const padding = 35;
  const maxVal = 10;
  const slotWidth = (width - padding * 2) / days.length;
  const barWidth = 32;
  const targetY = height - padding - (8.0 / maxVal) * (height - padding * 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      {[0, 0.5, 1].map((pct, i) => {
        const y = height - padding - pct * (height - padding * 2);
        return (
          <g key={i}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" />
            <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(maxVal * pct)}h</text>
          </g>
        );
      })}
      <line x1={padding} y1={targetY} x2={width - padding} y2={targetY} stroke="#ef4444" strokeDasharray="4 4" strokeWidth="1.5" />
      <text x={width - padding + 5} y={targetY + 3} fontSize="9" fontWeight="bold" fill="#ef4444">8h Target</text>

      {days.map((d, i) => {
        const barHeight = (d.hours / maxVal) * (height - padding * 2);
        const x = padding + i * slotWidth + (slotWidth - barWidth) / 2;
        const y = height - padding - barHeight;

        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="6" fill={d.hours >= 8 ? '#059669' : '#11b1c6'} />
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0c5965">{d.hours}h</text>
            <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">{d.day}</text>
          </g>
        );
      })}
    </svg>
  );
};

// 3. Weekly Task Velocity Sparkline Chart
const SVGEmployeeVelocitySparkline = () => {
  const trend = [
    { week: 'Week 1', completed: 4 },
    { week: 'Week 2', completed: 7 },
    { week: 'Week 3', completed: 9 },
    { week: 'Week 4', completed: 12 }
  ];

  const width = 450;
  const height = 180;
  const padding = 35;
  const maxVal = 15;

  const points = trend.map((d, i) => {
    const x = padding + (i / (trend.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.completed / maxVal) * (height - padding * 2);
    return { x, y, val: d.completed, week: d.week };
  });

  const lineD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  const areaD = `${lineD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="empVelGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((pct, i) => {
        const y = height - padding - pct * (height - padding * 2);
        return (
          <g key={i}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
            <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(maxVal * pct)}</text>
          </g>
        );
      })}
      <path d={areaD} fill="url(#empVelGrad)" />
      <path d={lineD} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="#0c5965" stroke="#ffffff" strokeWidth="2" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#059669">+{p.val} Tasks</text>
          <text x={p.x} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">{p.week}</text>
        </g>
      ))}
    </svg>
  );
};

// 4. Skill Proficiency & Quality Scorecard Chart
const SVGSkillProficiencyMeter = () => {
  const skills = [
    { name: 'Frontend React & UI', score: 92, color: '#11b1c6' },
    { name: 'Node.js REST APIs', score: 85, color: '#38bdf8' },
    { name: 'Unit Testing & QA', score: 88, color: '#059669' },
    { name: 'Blocker Resolution', score: 95, color: '#f59e0b' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingTop: '10px' }}>
      {skills.map((s, idx) => (
        <div key={idx} style={{
          padding: '14px',
          borderRadius: '16px',
          background: 'rgba(248, 250, 252, 0.9)',
          border: '1px solid rgba(17, 177, 198, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>{s.name}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '8px 0' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0c5965' }}>{s.score}%</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: s.color, background: `${s.color}18`, padding: '2px 8px', borderRadius: '10px' }}>Expert</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${s.score}%`, height: '100%', background: s.color, borderRadius: '3px' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 5. Overtime vs Standard Hours Trend Chart
const SVGOvertimeTrendChart = () => {
  const weeks = [
    { week: 'Week 1', standard: 40, overtime: 2 },
    { week: 'Week 2', standard: 40, overtime: 4.5 },
    { week: 'Week 3', standard: 40, overtime: 1 },
    { week: 'Week 4', standard: 40, overtime: 3 }
  ];

  const width = 450;
  const height = 180;
  const padding = 35;
  const maxVal = 50;

  const stdPoints = weeks.map((d, i) => {
    const x = padding + (i / (weeks.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.standard / maxVal) * (height - padding * 2);
    return { x, y, val: d.standard, week: d.week };
  });

  const otPoints = weeks.map((d, i) => {
    const x = padding + (i / (weeks.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.overtime / maxVal) * (height - padding * 2);
    return { x, y, val: d.overtime };
  });

  const stdLineD = stdPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  const otLineD = otPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      {[0, 0.5, 1].map((pct, i) => {
        const y = height - padding - pct * (height - padding * 2);
        return (
          <g key={i}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
            <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(maxVal * pct)}h</text>
          </g>
        );
      })}
      <path d={stdLineD} fill="none" stroke="#11b1c6" strokeWidth="2.5" />
      <path d={otLineD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 4" />
      {otPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#f59e0b">+{p.val}h OT</text>
          <text x={p.x} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">{stdPoints[i].week}</text>
        </g>
      ))}
    </svg>
  );
};

// 6. First-Time Quality Rate & Defect Meter Chart
const SVGQualityRateGauge = () => {
  const qualityRate = 96;
  const cx = 90;
  const cy = 90;
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (qualityRate / 100) * circumference;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '180px', height: '180px' }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#059669"
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'all 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#059669' }}>96%</div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Pass Rate</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ padding: '10px', background: 'rgba(5, 150, 105, 0.08)', borderRadius: '12px', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>PR Code Approval</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#059669', marginTop: '2px' }}>First-Time Approved</div>
        </div>
        <div style={{ padding: '10px', background: 'rgba(17, 177, 198, 0.08)', borderRadius: '12px', border: '1px solid rgba(17, 177, 198, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Critical Defects</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0c5965', marginTop: '2px' }}>0 Defects Reported</div>
        </div>
      </div>
    </div>
  );
};

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
        <h2 className="module-title">Employee Performance & Work Dashboard</h2>
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
          <>
            {/* Top Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '10px' }}>
              <div style={{ 
                padding: '24px', 
                background: 'rgba(255, 255, 255, 0.65)', 
                borderRadius: '20px', 
                border: '1px solid rgba(17, 177, 198, 0.15)',
                boxShadow: '0 8px 32px 0 rgba(17, 177, 198, 0.05)',
                backdropFilter: 'blur(10px)'
              }}>
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
                backdropFilter: 'blur(10px)'
              }}>
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
                backdropFilter: 'blur(10px)'
              }}>
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
                backdropFilter: 'blur(10px)'
              }}>
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

            {/* Individual Employee Performance Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginTop: '30px' }}>
              
              {/* Chart 1: Effort Breakdown Donut */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid rgba(17, 177, 198, 0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0c5965', fontWeight: 700 }}>Personal Productivity & Effort Focus</h3>
                <SVGEmployeeEffortDonut />
              </div>

              {/* Chart 2: Daily Logged Hours Bar */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid rgba(17, 177, 198, 0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0c5965', fontWeight: 700 }}>Daily Logged Hours vs 8h Target</h3>
                <SVGDailyWorklogBar />
              </div>

              {/* Chart 3: Weekly Task Velocity Sparkline */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid rgba(17, 177, 198, 0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0c5965', fontWeight: 700 }}>Weekly Task Velocity & Sprint Output</h3>
                <SVGEmployeeVelocitySparkline />
              </div>

              {/* Chart 4: Skill Proficiency & Quality Meters */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid rgba(17, 177, 198, 0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0c5965', fontWeight: 700 }}>Skill Proficiency & Quality Ratings</h3>
                <SVGSkillProficiencyMeter />
              </div>

              {/* Chart 5: Overtime vs Standard Work Trend */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid rgba(17, 177, 198, 0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0c5965', fontWeight: 700 }}>Overtime vs Standard Hours Trend</h3>
                <SVGOvertimeTrendChart />
              </div>

              {/* Chart 6: First-Time Code Quality Pass Gauge */}
              <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid rgba(17, 177, 198, 0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#0c5965', fontWeight: 700 }}>First-Time Code Approval & Defect-Free Rate</h3>
                <SVGQualityRateGauge />
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;

