import api from '../../services/api';

// Predictions here are computed server-side by the TaskPulse AI service
// (FastAPI + XGBoost, trained on the Task Delay / Workload / Sprint Risk /
// Employee Recommendation tables in Postgres). This file only gathers the
// real feature values from the backend REST API and calls the Spring
// AI-integration proxy at /api/v1/* — it does not compute scores itself.

export const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export const daysBetween = (fromDate, toDate) => {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  return Math.round((to - from) / MS_PER_DAY);
};

// Positive = days remaining until the date, negative = days overdue.
export const daysUntil = (dateString) => {
  if (!dateString) return null;
  return daysBetween(new Date(), dateString);
};

// Maps the risk_level string the XGBoost delay/sprint-risk models return
// ("LOW" | "MEDIUM" | "HIGH") to display styling.
export const riskLevelStyle = (level) => {
  if (level === 'HIGH') return { label: 'High Risk', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  if (level === 'MEDIUM') return { label: 'Medium Risk', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' };
  return { label: 'Low Risk', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' };
};

// Maps the workload_level string the XGBoost workload model returns.
export const workloadLevelStyle = (level) => {
  if (level === 'Overloaded') return { label: 'Overloaded', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  if (level === 'Balanced') return { label: 'Balanced', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' };
  return { label: 'Underutilized', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' };
};

// Maps the recommendation_level string the XGBoost recommendation model returns.
export const recommendationLevelStyle = (level) => {
  if (level === 'HIGH') return { label: 'Strong Fit', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' };
  if (level === 'MEDIUM') return { label: 'Possible Fit', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' };
  return { label: 'Weak Fit', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' };
};

// Roles that are not hands-on task executors — excluded from workload/assignment logic.
const NON_ASSIGNABLE_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'CLIENT_VIEWER'];

export const isAssignableUser = (user) => {
  if (!user || !user.role) return true;
  const r = user.role.toUpperCase();
  return !NON_ASSIGNABLE_ROLES.includes(r) && !r.includes('ADMIN') && !r.includes('MANAGER') && !r.includes('CLIENT');
};

export const fetchAssignableUsers = async () => {
  const res = await api.get('/api/users').catch(() => ({ data: [] }));
  return (res.data || []).filter(isAssignableUser);
};

export const fetchAllProjects = async () => {
  const res = await api.get('/api/projects').catch(() => ({ data: [] }));
  return res.data || [];
};

// Fetches tasks for every project in one shot — used by pages that need a
// system-wide view (workload scoring, employee recommendation, delay-rate history).
export const fetchAllTasks = async (projects) => {
  if (!projects || projects.length === 0) return [];
  const responses = await Promise.all(
    projects.map(p => api.get(`/api/tasks/project/${p.id}`).catch(() => ({ data: [] })))
  );
  return responses.flatMap(res => res.data || []);
};

export const fetchEmployees = async () => {
  const res = await api.get('/api/employees').catch(() => ({ data: [] }));
  return res.data || [];
};

export const fetchActiveBlockers = async () => {
  const res = await api.get('/api/blockers/active').catch(() => ({ data: [] }));
  return res.data || [];
};

export const activeBlockerCountByTask = (blockers) => {
  const map = {};
  (blockers || []).forEach(b => {
    const taskId = b.task?.id;
    if (taskId == null) return;
    map[taskId] = (map[taskId] || 0) + 1;
  });
  return map;
};

// Historical delay signal for a user: share of their finished tasks that ran
// over the original estimate. Feeds the model's employee_past_delay_rate
// feature; defaults to a neutral 0.2 when there isn't enough history yet.
export const computeEmployeeDelayRate = (userId, allTasks) => {
  const finished = (allTasks || []).filter(t => t.assignee?.id === userId && t.status === 'DONE');
  if (finished.length === 0) return 0.2;
  const overran = finished.filter(t => (t.actualHours || 0) > (t.estimatedHours || 0)).length;
  return Math.round((overran / finished.length) * 100) / 100;
};

const PRIORITY_WEIGHT = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

// ---- XGBoost model calls (via the Spring /api/v1 AI-integration proxy) ----

export const predictTaskDelay = async (task, blockerCountByTask, allTasks) => {
  const today = new Date();
  const daysRemaining = task.deadline ? daysBetween(today, task.deadline) : 0;
  const totalDays = task.deadline && task.createdAt ? daysBetween(task.createdAt, task.deadline) : 0;
  const employeePastDelayRate = task.assignee?.id ? computeEmployeeDelayRate(task.assignee.id, allTasks) : 0.2;

  const payload = {
    task_id: String(task.id),
    estimated_hours: task.estimatedHours || 0,
    hours_logged: task.actualHours || 0,
    days_remaining: daysRemaining ?? 0,
    total_days: totalDays ?? 0,
    blocker_count: blockerCountByTask[task.id] || 0,
    employee_past_delay_rate: employeePastDelayRate,
  };

  const res = await api.post('/api/v1/predict-delay', payload);
  return { task, request: payload, ...res.data };
};

export const scoreEmployeeWorkload = async (user, allTasks, employeesByUserId) => {
  const openTasks = (allTasks || []).filter(t => t.assignee?.id === user.id && t.status !== 'DONE');
  const activeTaskHours = openTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const avgPriorityWeight = openTasks.length > 0
    ? openTasks.reduce((sum, t) => sum + (PRIORITY_WEIGHT[t.priority] || 2), 0) / openTasks.length
    : 1;
  const capacityHours = employeesByUserId[user.id]?.capacityHours ?? 80;
  const availableCapacityHours = Math.max(capacityHours - activeTaskHours, 0);

  const payload = {
    employee_id: String(user.id),
    active_task_hours: activeTaskHours,
    priority_weight: Math.round(avgPriorityWeight * 100) / 100,
    available_capacity_hours: availableCapacityHours,
  };

  const res = await api.post('/api/v1/workload-score', payload);
  return {
    user,
    request: payload,
    openTaskCount: openTasks.length,
    blockedCount: openTasks.filter(t => t.status === 'BLOCKED').length,
    ...res.data,
  };
};

export const predictSprintRisk = async (sprint, sprintTasks, blockerCountByTask, delayScoreByTaskId) => {
  const total = sprintTasks.length;
  const doneTasks = sprintTasks.filter(t => t.status === 'DONE');
  const plannedStoryPoints = sprintTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedStoryPoints = doneTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const activeBlockerCount = sprintTasks.reduce((sum, t) => sum + (blockerCountByTask[t.id] || 0), 0);
  const blockerDensity = total > 0 ? activeBlockerCount / total : 0;
  const delayScores = sprintTasks.map(t => delayScoreByTaskId[t.id]).filter(v => v !== undefined);
  const avgTaskDelayRisk = delayScores.length > 0 ? delayScores.reduce((a, b) => a + b, 0) / delayScores.length : 0;

  const payload = {
    sprint_id: String(sprint.id),
    avg_task_delay_risk: Math.round(avgTaskDelayRisk * 10000) / 10000,
    blocker_density: Math.round(blockerDensity * 10000) / 10000,
    planned_story_points: plannedStoryPoints,
    completed_story_points: completedStoryPoints,
  };

  const res = await api.post('/api/v1/sprint-risk', payload);
  return {
    sprint,
    request: payload,
    total,
    doneCount: doneTasks.length,
    blockedCount: sprintTasks.filter(t => t.status === 'BLOCKED').length,
    ...res.data,
  };
};

// Unique skill tags across the whole team, used to spot skill mentions in a
// task's title/description text.
export const buildSkillVocabulary = (employees) => {
  const set = new Set();
  (employees || []).forEach(e => {
    (e.skills || '').split(',').map(s => s.trim()).filter(Boolean).forEach(s => set.add(s));
  });
  return Array.from(set);
};

// Figures out what a task actually needs skill-wise: first by scanning its
// title/description for known skill tags, falling back to the current
// assignee's skills (if any) so an already-staffed task still gives the
// model something to match candidates against.
export const deriveRequiredSkills = (task, employeesByUserId, skillVocabulary) => {
  const text = `${task.taskName || ''} ${task.description || ''}`.toLowerCase();
  const mentioned = (skillVocabulary || []).filter(skill => text.includes(skill.toLowerCase()));
  if (mentioned.length > 0) return mentioned;

  const assigneeSkills = employeesByUserId[task.assignee?.id]?.skills;
  if (assigneeSkills) return assigneeSkills.split(',').map(s => s.trim()).filter(Boolean);

  return [];
};

export const recommendEmployeeForTask = async (task, requiredSkills, candidateUsers, allTasks, employeesByUserId) => {
  const candidates = candidateUsers.map(user => {
    const emp = employeesByUserId[user.id];
    const skills = (emp?.skills || '').split(',').map(s => s.trim()).filter(Boolean);
    const openTasks = (allTasks || []).filter(t => t.assignee?.id === user.id && t.status !== 'DONE');
    const activeTaskHours = openTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const capacityHours = emp?.capacityHours ?? 80;
    const availableCapacityHours = Math.max(capacityHours - activeTaskHours, 0);
    const finished = (allTasks || []).filter(t => t.assignee?.id === user.id && t.status === 'DONE');
    const completionRate = finished.length > 0
      ? finished.length / (allTasks || []).filter(t => t.assignee?.id === user.id).length
      : 0.6;

    return {
      employee_id: String(user.id),
      skills,
      active_task_hours: activeTaskHours,
      available_capacity_hours: availableCapacityHours,
      past_performance_score: Math.round(completionRate * 100) / 100,
      _user: user,
    };
  });

  const payload = {
    task_id: String(task.id),
    required_skills: requiredSkills || [],
    candidates: candidates.map(({ _user, ...c }) => c),
  };

  const res = await api.post('/api/v1/recommend-employee', payload);
  const userByEmployeeId = {};
  candidates.forEach(c => { userByEmployeeId[c.employee_id] = c._user; });

  return {
    task,
    request: payload,
    ...res.data,
    ranked: (res.data.ranked || []).map(r => ({ ...r, user: userByEmployeeId[r.employee_id] })),
  };
};
