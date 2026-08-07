import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DelayPredictionPage from '../DelayPredictionPage';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const PROJECT = { id: 100, projectName: 'Atlas Migration' };
const TASK_LOW = { id: 1, taskName: 'Write README', status: 'IN_PROGRESS', project: { id: 100 }, assignee: { id: 4, name: 'Dev Dan' }, estimatedHours: 4, actualHours: 1, deadline: '2099-01-01', createdAt: '2026-01-01' };
const TASK_HIGH = { id: 2, taskName: 'Fix prod outage', status: 'IN_PROGRESS', project: { id: 100 }, assignee: { id: 4, name: 'Dev Dan' }, estimatedHours: 10, actualHours: 12, deadline: '2020-01-01', createdAt: '2019-01-01' };

function mockRoutes({ delayImpl } = {}) {
  api.get.mockImplementation((url) => {
    if (url === '/api/projects') return Promise.resolve({ data: [PROJECT] });
    if (url === '/api/tasks/project/100') return Promise.resolve({ data: [TASK_LOW, TASK_HIGH] });
    if (url === '/api/blockers/active') return Promise.resolve({ data: [{ id: 1, task: { id: 2 } }] });
    return Promise.resolve({ data: [] });
  });
  api.post.mockImplementation(delayImpl || ((url, body) => {
    const overdue = body.days_remaining < 0;
    const score = overdue ? 0.9 : 0.1;
    return Promise.resolve({ data: { task_id: body.task_id, delay_risk_score: score, risk_level: overdue ? 'HIGH' : 'LOW' } });
  }));
}

describe('DelayPredictionPage (functional + UI)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('FUNC-1 loads projects, auto-selects the first one, and renders a risk-sorted table', async () => {
    mockRoutes();
    render(<DelayPredictionPage onBack={() => {}} />);

    await waitFor(() => expect(screen.getByText('Fix prod outage')).toBeInTheDocument());
    expect(screen.getByText('Write README')).toBeInTheDocument();

    // FUNC-1a: overdue/high-risk task must be sorted above the low-risk one.
    const rows = screen.getAllByRole('row').slice(1); // skip header row
    expect(rows[0]).toHaveTextContent('Fix prod outage');
    expect(rows[1]).toHaveTextContent('Write README');
  });

  it('FUNC-2 overdue task shows "Xd overdue" and blocker count in the days/blocker columns', async () => {
    mockRoutes();
    render(<DelayPredictionPage onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Fix prod outage')).toBeInTheDocument());
    expect(screen.getByText(/d overdue/)).toBeInTheDocument();
  });

  it('FUNC-3 DONE tasks are excluded from the prediction table', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/projects') return Promise.resolve({ data: [PROJECT] });
      if (url === '/api/tasks/project/100') return Promise.resolve({ data: [{ ...TASK_LOW, status: 'DONE' }, TASK_HIGH] });
      if (url === '/api/blockers/active') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    api.post.mockResolvedValue({ data: { task_id: '2', delay_risk_score: 0.9, risk_level: 'HIGH' } });
    render(<DelayPredictionPage onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Fix prod outage')).toBeInTheDocument());
    expect(screen.queryByText('Write README')).not.toBeInTheDocument();
  });

  it('UI-4 shows an error banner when the AI prediction endpoint fails (503)', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/projects') return Promise.resolve({ data: [PROJECT] });
      if (url === '/api/tasks/project/100') return Promise.resolve({ data: [TASK_HIGH] });
      if (url === '/api/blockers/active') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    api.post.mockRejectedValue({ response: { data: { message: 'The AI prediction service is unavailable. Make sure the XGBoost service (ai-service) is running on http://localhost:8000/ai.' } } });

    render(<DelayPredictionPage onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/AI prediction service is unavailable/)).toBeInTheDocument());
    // Table must not render stale/partial data alongside the error.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('UI-5 shows an empty state (not a blank screen) when a project has no open tasks', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/projects') return Promise.resolve({ data: [PROJECT] });
      if (url === '/api/tasks/project/100') return Promise.resolve({ data: [] });
      if (url === '/api/blockers/active') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    render(<DelayPredictionPage onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText(/nothing to predict/i)).toBeInTheDocument());
  });
});
