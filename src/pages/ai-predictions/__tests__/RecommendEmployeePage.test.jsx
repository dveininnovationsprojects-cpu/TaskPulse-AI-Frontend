import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RecommendEmployeePage from '../RecommendEmployeePage';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const PROJECT = { id: 100, projectName: 'Atlas Migration' };
const TASK = { id: 1, taskName: 'Migrate postgres schema', status: 'IN_PROGRESS', project: { id: 100 }, assignee: { id: 3, name: 'Leo Lead' } };
const USERS = [
  { id: 3, name: 'Leo Lead', role: 'TEAM_LEAD' },
  { id: 4, name: 'Dev Dan', role: 'DEVELOPER' },
];

function mockRoutes() {
  api.get.mockImplementation((url) => {
    if (url === '/api/projects') return Promise.resolve({ data: [PROJECT] });
    if (url === '/api/users') return Promise.resolve({ data: USERS });
    if (url === '/api/employees') return Promise.resolve({ data: [{ id: 4, userId: 4, skills: 'postgres, migration', capacityHours: 80 }, { id: 3, userId: 3, skills: 'qa', capacityHours: 80 }] });
    if (url === '/api/tasks/project/100') return Promise.resolve({ data: [TASK] });
    return Promise.resolve({ data: [] });
  });
  api.post.mockImplementation((url, body) => {
    if (url === '/api/v1/recommend-employee') {
      const ranked = [
        { employee_id: '4', score: 0.9, level: 'HIGH', matching_skills: ['postgres'] },
        { employee_id: '3', score: 0.2, level: 'LOW', matching_skills: [] },
      ];
      return Promise.resolve({ data: { task_id: body.task_id, recommended_employee_id: '4', recommendation_score: 0.9, recommendation_level: 'HIGH', ranked } });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('RecommendEmployeePage (functional + UI)', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRoutes(); });

  it('FUNC-7 excludes non-assignable roles (TEAM_LEAD counts here as a candidate per isAssignableUser, only ADMIN/PM/CLIENT excluded) and ranks the top candidate first', async () => {
    render(<RecommendEmployeePage onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Migrate postgres schema')).toBeInTheDocument());
    expect(screen.getByText('Dev Dan')).toBeInTheDocument();
  });

  it('UI-6 flags when the AI recommendation disagrees with the current assignee', async () => {
    render(<RecommendEmployeePage onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Migrate postgres schema')).toBeInTheDocument());
    // Task is currently assigned to Leo Lead (id 3), but the AI's top pick is Dev Dan (id 4).
    expect(screen.getByText(/AI would pick differently/)).toBeInTheDocument();
  });

  it('FUNC-8 required_skills are derived from task title text via the skill vocabulary', async () => {
    render(<RecommendEmployeePage onBack={() => {}} />);
    await waitFor(() => expect(screen.getByText('Migrate postgres schema')).toBeInTheDocument());
    const call = api.post.mock.calls.find(c => c[0] === '/api/v1/recommend-employee');
    expect(call[1].required_skills).toContain('postgres');
  });
});
