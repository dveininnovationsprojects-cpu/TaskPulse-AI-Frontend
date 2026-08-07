import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SprintRiskPage from '../SprintRiskPage';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const PROJECT = { id: 100, projectName: 'Atlas Migration' };
const SPRINT = { id: 9, projectId: 100, sprintName: 'Sprint 7', status: 'ACTIVE', startDate: '2026-07-01', endDate: '2026-07-14' };
const TASK = { id: 1, taskName: 'X', status: 'BLOCKED', project: { id: 100 }, sprint: { id: 9 }, estimatedHours: 5, actualHours: 1, deadline: '2020-01-01', createdAt: '2019-01-01' };

function mockRoutes() {
  api.get.mockImplementation((url) => {
    if (url === '/api/projects') return Promise.resolve({ data: [PROJECT] });
    if (url === '/api/sprints') return Promise.resolve({ data: [SPRINT] });
    if (url === '/api/tasks/project/100') return Promise.resolve({ data: [TASK] });
    if (url === '/api/blockers/active') return Promise.resolve({ data: [{ id: 1, task: { id: 1 } }] });
    return Promise.resolve({ data: [] });
  });
  api.post.mockImplementation((url, body) => {
    if (url === '/api/v1/predict-delay') return Promise.resolve({ data: { task_id: body.task_id, delay_risk_score: 0.9, risk_level: 'HIGH' } });
    if (url === '/api/v1/sprint-risk') return Promise.resolve({ data: { sprint_id: body.sprint_id, sprint_risk_score: 0.75, risk_level: 'HIGH' } });
    return Promise.resolve({ data: {} });
  });
}

describe('SprintRiskPage (functional + UI)', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRoutes(); });

  it('FUNC-5 filters sprints by the selected project and renders a risk card', async () => {
    render(<SprintRiskPage onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Sprint 7')).toBeInTheDocument());
    expect(screen.getByText(/High Risk/)).toBeInTheDocument();
    expect(screen.getByText(/75\/100/)).toBeInTheDocument();
  });

  it('FUNC-6 sprint-risk payload correctly aggregates blocker density and per-task delay scores', async () => {
    render(<SprintRiskPage onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Sprint 7')).toBeInTheDocument());
    const sprintRiskCall = api.post.mock.calls.find(c => c[0] === '/api/v1/sprint-risk');
    expect(sprintRiskCall).toBeTruthy();
    const payload = sprintRiskCall[1];
    expect(payload.blocker_density).toBe(1); // 1 blocked task / 1 total task in sprint
    expect(payload.avg_task_delay_risk).toBeCloseTo(0.9, 4);
  });
});
